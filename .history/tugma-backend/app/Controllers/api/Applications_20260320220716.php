<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Applications extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // 1. GET ALL APPLICANTS
    public function getEmployerApplicants($employer_uid = null)
    {
        if (!$employer_uid) return $this->fail('No employer UID provided');

        $db = \Config\Database::connect();
        
        $builder = $db->table('job_interactions ji');
        // 👇 Notice we are now fetching the saved AI scores 👇
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

    // 2. UPDATE STATUS (Shortlist, Reject, etc)
    public function updateStatus($application_id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$application_id || !isset($json['status'])) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $db->table('job_interactions')->where('id', $application_id)->update(['status' => $json['status']]);

        return $this->respond(['message' => 'Status updated']);
    }

    // 3. THE REAL AI SCANNER
    public function analyzeApplicant($application_id = null)
    {
        if (!$application_id) return $this->fail('No application ID provided');

        $db = \Config\Database::connect();
        
        // Fetch the specific application, job, and student details
        $builder = $db->table('job_interactions ji');
        $builder->select('sp.skills as student_skills, sp.course, sp.about, ej.title as job_title, ej.description as job_desc, ej.skills as job_skills');
        $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
        $builder->join('users u', 'u.firebase_uid = ji.student_uid');
        $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
        $builder->where('ji.id', $application_id);
        
        $appData = $builder->get()->getRowArray();
        
        if (!$appData) return $this->failNotFound('Application not found');

        try {
            $apiKey = 'AIzaSyBtSIQNpd2DtA1oCJyyeAaPzWywQ4xhkHQ'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;

            $prompt = "YOU ARE AN EXPERT HR RECRUITER AND ATS SYSTEM. Analyze the candidate against the job description. OUTPUT ONLY A RAW VALID JSON OBJECT.

            JOB POSTING:
            - Title: " . $appData['job_title'] . "
            - Description: " . mb_substr(strip_tags($appData['job_desc']), 0, 1000) . "
            - Required Skills: " . $appData['job_skills'] . "

            CANDIDATE PROFILE:
            - Course: " . $appData['course'] . "
            - About Me: " . mb_substr(strip_tags($appData['about']), 0, 1000) . "
            - Candidate Skills: " . $appData['student_skills'] . "

            SCORING RULES:
            1. Calculate a highly realistic 'match_score' (0-100) based on how well their skills, course, and about me align with the job.
            2. Write a 2-3 sentence 'overall_assessment' explaining exactly WHY they received this score (mention missing skills or great alignments).

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"The candidate has strong React skills which fit perfectly, but lacks backend Node.js experience.\"
            }";

            $data = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => ["responseMimeType" => "application/json", "temperature" => 0.7]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
            
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

            if (!isset($aiAnalysis['match_score'])) throw new \Exception('AI format failed.');

            // 👇 SAVE TO DATABASE FOR FUTURE USE 👇
            $db->table('job_interactions')->where('id', $application_id)->update([
                'ai_match_score' => (int)$aiAnalysis['match_score'],
                'ai_assessment'  => $aiAnalysis['overall_assessment']
            ]);

            return $this->respond($aiAnalysis);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}