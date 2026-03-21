<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser;

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
        
        try {
            $builder = $db->table('job_interactions'); 
            
            $builder->select('
                job_interactions.id as application_id, 
                job_interactions.created_at as applied_at, 
                job_interactions.status, 
                job_interactions.ai_match_score, 
                job_interactions.ai_assessment,
                users.first_name, 
                users.last_name, 
                users.email, 
                users.firebase_uid as student_uid,
                student_profiles.course, 
                student_profiles.skills as student_skills, 
                student_profiles.resume_name, 
                student_profiles.resume_data, 
                student_profiles.profilePhoto as profile_photo,
                employer_jobs.id as job_id, 
                employer_jobs.title as job_title, 
                employer_jobs.skills as job_skills
            ');
            
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            $builder->join('users', 'users.firebase_uid = job_interactions.student_uid', 'left');
            $builder->join('student_profiles', 'student_profiles.firebase_uid = job_interactions.student_uid', 'left');
            
            $builder->where('employer_jobs.firebase_uid', $employer_uid);
            $builder->where('job_interactions.interaction_type', 'applied');
            $builder->orderBy('job_interactions.id', 'DESC');
            
            $applicants = $builder->get()->getResultArray();

            return $this->respond($applicants);
        } catch (\Exception $e) {
            return $this->failServerError('DB ERROR: ' . $e->getMessage());
        }
    }

    public function updateStatus($application_id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$application_id || !isset($json['status'])) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $db->table('job_interactions')->where('id', $application_id)->update(['status' => $json['status']]);

        return $this->respond(['message' => 'Status updated']);
    }

    private function extractPdfText($pdfUrl) {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $pdfUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $pdfContent = curl_exec($ch);
            curl_close($ch);

            if (!$pdfContent) return "Extraction failed: Could not download file.";
            
            $tempFile = tempnam(sys_get_temp_dir(), 'resume_');
            file_put_contents($tempFile, $pdfContent);
            
            $parser = new Parser();
            $pdf = $parser->parseFile($tempFile);
            $text = $pdf->getText();
            
            unlink($tempFile); 
            return substr(trim($text), 0, 3000);
        } catch (\Exception $e) {
            return "Extraction failed: " . $e->getMessage();
        }
    }

    public function analyzeApplicant($applicationId = null)
    {
        $db = \Config\Database::connect();

        try {
            // 🔥 FIXED: Defined 'job_interactions' clearly without aliasing errors 🔥
            $builder = $db->table('job_interactions'); 
            
            $builder->select('
                job_interactions.id as application_id,
                employer_jobs.title as job_title,
                employer_jobs.description as job_desc,
                employer_jobs.skills as job_skills,
                student_profiles.course,
                student_profiles.skills as student_skills,
                student_profiles.about,
                student_profiles.education,
                student_profiles.resume_data
            ');
            
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            $builder->join('student_profiles', 'student_profiles.firebase_uid = job_interactions.student_uid', 'left');
            $builder->where('job_interactions.id', $applicationId);
            
            $data = $builder->get()->getRowArray();

            if (!$data) return $this->failNotFound('Application not found.');

            $jobSkills = !empty($data['job_skills']) ? json_decode($data['job_skills'], true) : [];
            $studentSkills = !empty($data['student_skills']) ? json_decode($data['student_skills'], true) : [];
            $education = !empty($data['education']) ? json_decode($data['education'], true) : [];

            $collegeName = $education['college']['school'] ?? 'Not Provided';
            $aboutText = !empty($data['about']) ? $data['about'] : 'No about section provided.';
            $courseText = !empty($data['course']) ? $data['course'] : 'Undeclared';

            $resumeText = "No resume attached.";
            if (!empty($data['resume_data'])) {
                $resumeText = $this->extractPdfText($data['resume_data']);
            }

            $apiKey = 'AIzaSyAcyJCT9cWBwmKaYyKP9Fnyi76L2RvJfhI'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' . $apiKey; 
            
            $prompt = "YOU ARE AN EXPERT HR RECRUITER AI. Evaluate this candidate. OUTPUT ONLY RAW VALID JSON. DO NOT INCLUDE MARKDOWN.

            JOB REQUIREMENTS:
            - Title: " . $data['job_title'] . "
            - Description: " . substr(strip_tags($data['job_desc']), 0, 300) . "
            - Required Skills: " . implode(", ", (array)$jobSkills) . "

            CANDIDATE WEB PROFILE:
            - Course: " . $courseText . "
            - About: " . $aboutText . "
            - Profile Skills: " . implode(", ", (array)$studentSkills) . "
            - Education Level: " . $collegeName . "

            EXTRACTED RESUME TEXT (PDF):
            \"" . $resumeText . "\"

            INSTRUCTIONS:
            1. Cross-check the 'Candidate Web Profile' against the 'Extracted Resume Text'. State if the information is consistent or if there are red flags/lies.
            2. Calculate a 'match_score' (0-100).
            3. Write a 3-4 sentence 'overall_assessment'.

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"The resume aligns well with the profile...\"
            }";

            $payload = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => [
                    "responseMimeType" => "application/json",
                    "temperature" => 0.4
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $result = json_decode($response, true);
            if ($httpCode !== 200) throw new \Exception('Gemini API Error.');

            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
            $analysis = json_decode($aiText, true);

            $updateData = [
                'ai_match_score' => (int) $analysis['match_score'],
                'ai_assessment' => (string) $analysis['overall_assessment']
            ];

            $db->table('job_interactions')->where('id', $applicationId)->update($updateData);

            return $this->respond($analysis);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }

    // Standard Apply function
    public function apply()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        if (!isset($data['job_id']) || !isset($data['student_uid'])) return $this->fail('Missing data');

        $db->table('job_interactions')->insert([
            'job_id' => $data['job_id'],
            'student_uid' => $data['student_uid'],
            'interaction_type' => 'applied',
            'status' => 'New Applicant'
        ]);
        return $this->respondCreated(['message' => 'Applied!']);
    }

    public function getStudentApplications($studentUid = null)
    {
        $db = \Config\Database::connect();
        try {
            $builder = $db->table('job_interactions');
            $builder->select('job_interactions.*, employer_jobs.title as job_title, employer_jobs.location, users.company_name');
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            $builder->join('users', 'users.firebase_uid = employer_jobs.firebase_uid', 'left');
            $builder->where('job_interactions.student_uid', $studentUid);
            $builder->where('job_interactions.interaction_type', 'applied'); 
            return $this->respond($builder->get()->getResultArray());
        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}