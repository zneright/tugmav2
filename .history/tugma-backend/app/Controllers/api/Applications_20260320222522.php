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
        
        // 1. Fetch the student's digital profile data
        $builder = $db->table('job_interactions ji');
        $builder->select('
            sp.skills as student_skills, 
            sp.course, 
            sp.about, 
            sp.education, 
            sp.languages, 
            sp.ojt_data, 
            sp.resume_name,
            ej.title as job_title, 
            ej.description as job_desc, 
            ej.skills as job_skills,
            ej.work_setup
        ');
        $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
        $builder->join('users u', 'u.firebase_uid = ji.student_uid');
        $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
        $builder->where('ji.id', $application_id);
        
        $appData = $builder->get()->getRowArray();
        if (!$appData) return $this->failNotFound('Application not found');

        // 🔥 2. FETCH AND PARSE THE ACTUAL PHYSICAL RESUME FILE 🔥
        $physicalResumeText = "No physical resume attached.";
        if (!empty($appData['resume_name'])) {
            // Assuming resumes are saved in public/uploads/resumes/
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
                    $physicalResumeText = "Error reading physical file: " . $e->getMessage();
                }
            } else {
                $physicalResumeText = "File not found on server.";
            }
        }

        try {
            $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

            // 3. Safely clean ALL the data so JSON formatting doesn't break
            $safeJobDesc = str_replace(["\r", "\n", "\t", "\""], " ", mb_substr(strip_tags($appData['job_desc']), 0, 800));
            $safeAbout = str_replace(["\r", "\n", "\t", "\""], " ", mb_substr(strip_tags($appData['about']), 0, 800));
            
            // Clean the physical resume text
            $safePhysicalResume = json_encode(mb_substr(strip_tags($physicalResumeText), 0, 6000));

            // 4. The Ultimate Recruiter Prompt (Now includes the real resume!)
            $prompt = "YOU ARE AN EXPERT SENIOR IT RECRUITER AND ATS SYSTEM. Your job is to analyze BOTH the candidate's Digital Profile AND their Actual Uploaded Resume against the Employer's Job Posting. OUTPUT ONLY A RAW VALID JSON OBJECT.

            EMPLOYER JOB POSTING:
            - Role: " . $appData['job_title'] . " (" . $appData['work_setup'] . ")
            - Description: " . $safeJobDesc . "
            - Required Skills: " . $appData['job_skills'] . "

            CANDIDATE'S DIGITAL PROFILE:
            - Course/Degree: " . $appData['course'] . "
            - Executive Summary: " . $safeAbout . "
            - Education History: " . $appData['education'] . "
            - Technical Skills: " . $appData['student_skills'] . "

            CANDIDATE'S ACTUAL UPLOADED RESUME (RAW TEXT):
            " . $safePhysicalResume . "

            SCORING RULES (0-100):
            1. Analyze overlapping skills between the job requirements and BOTH their digital profile & physical resume (Heavy Weight).
            2. Analyze if their Course/Education aligns with the role (Medium Weight).
            3. Write a highly professional, 2-3 sentence 'overall_assessment' explaining exactly WHY they received this score. Be specific. Mention missing skills, or great cultural fits found in their actual resume. DO NOT use markdown formatting in your response.

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"The candidate's BS IT coursework and strong React skills align perfectly. Furthermore, their attached resume highlights successful past projects in Node.js, making them a highly recommended fit.\"
            }";

            $data = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => ["responseMimeType" => "application/json", "temperature" => 0.6]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) throw new \Exception('Gemini Error: ' . ($result['error']['message'] ?? 'Unknown'));
            
            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
            
            // Bracket Catcher for Object {}
            $firstBracket = strpos($aiText, '{');
            $lastBracket = strrpos($aiText, '}');
            if ($firstBracket !== false && $lastBracket !== false) {
                $aiText = substr($aiText, $firstBracket, $lastBracket - $firstBracket + 1);
            }
            
            $aiAnalysis = json_decode($aiText, true);

            if (!isset($aiAnalysis['match_score'])) throw new \Exception('AI format failed. Raw output: ' . $aiText);

            // 5. Save to Database for future use
            $db->table('job_interactions')->where('id', $application_id)->update([
                'ai_match_score' => (int)$aiAnalysis['match_score'],
                'ai_assessment'  => $aiAnalysis['overall_assessment']
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