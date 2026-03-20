<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser; // 👈 WE NEED THIS TO READ THE ACTUAL FILE

class Applications extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    public function getEmployerApplicants($employer_uid = null)
    {
        if (!$employer_uid) return $this->fail('No employer UID provided');

        $db = \Config\Database::connect();
        
        $builder = $db->table('job_interactions ji');
        $builder->select('ji.id as application_id, ji.created_at as applied_at, ji.status, ji.ai_match_score, ji.ai_assessment,
                          u.first_name, u.last_name, u.email, u.firebase_uid as student_uid,
                          sp.course, sp.skills as student_skills, sp.resume_name,
                          ej.id as job_id, ej.title as job_title, ej.skills as job_skills');
        $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
        $builder->join('users u', 'u.firebase_uid = ji.student_uid');
        $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
        $builder->where('ej.firebase_uid', $employer_uid);
        $builder->where('ji.interaction_type', 'applied');
        $builder->orderBy('ji.created_at', 'DESC');
        
        $applicants = $builder->get()->getResultArray();

        return $this->respond($applicants);
    }

    public function updateStatus($application_id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$application_id || !isset($json['status'])) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $db->table('job_interactions')->where('id', $application_id)->update(['status' => $json['status']]);

        return $this->respond(['message' => 'Status updated']);
    }

    // Helper for DOCX files
    private function readDocx($filePath) {
        $zip = new \ZipArchive;
        $text = '';
        if ($zip->open($filePath) === true) {
            if (($index = $zip->locateName('word/document.xml')) !== false) {
                $data = $zip->getFromIndex($index);
                $data = str_replace('</w:t>', ' </w:t>', $data);
                $text = strip_tags($data);
            }
            $zip->close();
        }
        return $text;
    }

    // 👇 THE SUPERCHARGED DIGITAL + PHYSICAL RESUME SCANNER 👇
    public function analyzeApplicant($application_id = null)
    {
        if (!$application_id) return $this->fail('No application ID provided');

        $db = \Config\Database::connect();
        
        // 1. Fetch Student Profile + Job Info
        $builder = $db->table('job_interactions ji');
        $builder->select('
            sp.skills as student_skills, 
            sp.course, 
            sp.about, 
            sp.education, 
            sp.resume_name,
            ej.title as job_title, 
            ej.description as job_desc, 
            ej.skills as job_skills
        ');
        $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
        $builder->join('users u', 'u.firebase_uid = ji.student_uid');
        $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
        $builder->where('ji.id', $application_id);
        
        $appData = $builder->get()->getRowArray();
        if (!$appData) return $this->failNotFound('Application record not found');

        // 🔥 2. EXTRACT TEXT FROM THE ACTUAL PHYSICAL FILE 🔥
        $physicalResumeText = "";
        if (!empty($appData['resume_name'])) {
            // Pointing to the public folder
            $filePath = FCPATH . 'uploads/resumes/' . $appData['resume_name'];
            
            if (file_exists($filePath)) {
                $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                try {
                    if ($ext === 'pdf') {
                        $parser = new Parser();
                        $pdf = $parser->parseFile($filePath);
                        $physicalResumeText = $pdf->getText();
                    } else if ($ext === 'docx') {
                        $physicalResumeText = $this->readDocx($filePath);
                    }
                } catch (\Exception $e) {
                    $physicalResumeText = "Error reading physical file.";
                }
            }
        }

        try {
            $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;

            // Clean strings for JSON safety
            $safeJobDesc = str_replace(["\r", "\n", "\t", "\""], " ", mb_substr(strip_tags($appData['job_desc']), 0, 800));
            $safeProfile = str_replace(["\r", "\n", "\t", "\""], " ", mb_substr(strip_tags($appData['about']), 0, 500));
            $safeResumeText = str_replace(["\r", "\n", "\t", "\""], " ", mb_substr(strip_tags($physicalResumeText), 0, 5000));

            // 3. The Prompt (Comparing Profile vs Resume vs Job)
            $prompt = "YOU ARE A SENIOR TECHNICAL RECRUITER. Compare the candidate's Digital Profile AND their Actual Resume Text against the Job Role.
            
            JOB: " . $appData['job_title'] . "
            REQUIREMENTS: " . $appData['job_skills'] . "
            
            DIGITAL PROFILE: " . $safeProfile . "
            ACTUAL RESUME CONTENT: " . $safeResumeText . "

            RULES:
            1. If the Resume text and Profile skills match the Job, score 85-100.
            2. If there is a misalignment or missing keywords, score lower.
            3. OUTPUT ONLY RAW VALID JSON.

            FORMAT:
            {
                \"match_score\": number,
                \"overall_assessment\": \"string (2 sentences)\"
            }";

            $data = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => ["responseMimeType" => "application/json"]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);
            $aiText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            $aiAnalysis = json_decode($aiText, true);

            // 4. Save the new AI Score to the database
            $db->table('job_interactions')->where('id', $application_id)->update([
                'ai_match_score' => (int)($aiAnalysis['match_score'] ?? 0),
                'ai_assessment'  => $aiAnalysis['overall_assessment'] ?? 'Analysis failed.'
            ]);

            return $this->respond($aiAnalysis);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
    public function downloadResume($filename)
    {
        // Path to the file
        $path = FCPATH . 'uploads/resumes/' . $filename;

        if (file_exists($path)) {
            return $this->response->download($path, null);
        }

        return $this->failNotFound('File not found.');
    }
}