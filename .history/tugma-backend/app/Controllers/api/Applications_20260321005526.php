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

    public function analyzeApplicant($applicationId = null)
    {
        $db = \Config\Database::connect();

        try {
            // 1. Get the Application, Job, and Student Profile in one query
            $builder = $db->table('applications');
            $builder->select('
                applications.id as app_id,
                jobs.title as job_title,
                jobs.description as job_desc,
                jobs.skills as job_skills,
                student_profiles.course,
                student_profiles.skills as student_skills,
                student_profiles.about,
                student_profiles.education
            ');
            $builder->join('jobs', 'jobs.id = applications.job_id', 'left');
            $builder->join('student_profiles', 'student_profiles.firebase_uid = applications.student_uid', 'left');
            $builder->where('applications.id', $applicationId);
            
            $data = $builder->get()->getRowArray();

            if (!$data) {
                return $this->failNotFound('Application not found.');
            }

            // 2. Format Data for Gemini safely
            $jobSkills = json_decode($data['job_skills'], true) ?? [];
            $studentSkills = json_decode($data['student_skills'], true) ?? [];
            $education = json_decode($data['education'], true) ?? [];

            $apiKey = 'AIzaSyCke-i5eBILEIsjGtei4M8PyO7RrMhZ1Mk'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;
            
            // 3. The Prompt for the Employer Applicant Scanner
            $prompt = "YOU ARE AN EXPERT HR RECRUITER AI. Evaluate this candidate for the specific job. OUTPUT ONLY RAW JSON. DO NOT INCLUDE MARKDOWN OR BACKTICKS.

            JOB REQUIREMENTS:
            - Title: " . $data['job_title'] . "
            - Description: " . strip_tags($data['job_desc']) . "
            - Required Skills: " . implode(", ", $jobSkills) . "

            CANDIDATE PROFILE:
            - Course: " . $data['course'] . "
            - About: " . $data['about'] . "
            - Candidate Skills: " . implode(", ", $studentSkills) . "
            - Education Level: " . (isset($education['college']['school']) ? $education['college']['school'] : 'Not Provided') . "

            INSTRUCTIONS:
            1. Calculate a 'match_score' from 0 to 100 based on how well the candidate's skills and course align with the job description and required skills.
            2. Write a 2-3 sentence 'overall_assessment' explaining exactly why they are a good or bad fit. Be professional but honest.

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"The candidate shows strong potential due to...\"
            }";

            $payload = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => [
                    "responseMimeType" => "application/json",
                    "temperature" => 0.4
                ]
            ];

            // 4. Send to Gemini
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
            
            $response = curl_exec($ch);
            if (curl_errno($ch)) throw new \Exception('cURL Error: ' . curl_error($ch));
            curl_close($ch);

            $result = json_decode($response, true);

            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('AI Failed to generate an assessment.');
            }

            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];

            // Clean up the text in case Gemini wraps it in ```json
            $aiText = trim(str_replace(['```json', '```'], '', $aiText));
            
            $analysis = json_decode($aiText, true);

            if (!$analysis || !isset($analysis['match_score'])) {
                 throw new \Exception('AI returned invalid format: ' . $aiText);
            }

            // 5. Save the AI Score to your Database so you don't have to re-scan every time!
            $updateData = [
                'ai_match_score' => $analysis['match_score'],
                'ai_assessment' => $analysis['overall_assessment']
            ];
            $db->table('applications')->where('id', $applicationId)->update($updateData);

            // 6. Return the data to React
            return $this->respond($analysis);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}