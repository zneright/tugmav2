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
        
        try {
            $builder = $db->table('job_interactions ji');
            
            // 🔥 FIX: We now ask for "resumeData" (capital D) and "resumeName" (capital N)
            $builder->select('ji.id as application_id, ji.created_at as applied_at, ji.status, ji.ai_match_score, ji.ai_assessment,
                              u.first_name, u.last_name, u.email, u.firebase_uid as student_uid,
                              sp.course, sp.skills as student_skills, 
                              sp.resumeName as resume_name, 
                              sp.resumeData as resume_data, 
                              ej.id as job_id, ej.title as job_title, ej.skills as job_skills');
                              
            $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
            $builder->join('users u', 'u.firebase_uid = ji.student_uid');
            $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
            
            $builder->where('ej.firebase_uid', $employer_uid);
            $builder->where('ji.interaction_type', 'applied');
            $builder->orderBy('ji.created_at', 'DESC');
            
            $applicants = $builder->get()->getResultArray();

            return $this->respond($applicants);
            
        } catch (\Throwable $e) { 
            // 🔥 This will send the EXACT crash reason back to your React Network tab
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Database crash',
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);
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

    // 🔥 BULLETPROOF AI SCANNER (NOW WITH RESUME PARSING) 🔥
    public function analyzeApplicant($applicationId = null)
    {
        $db = \Config\Database::connect();

        try {
            $builder = $db->table('job_interactions'); 
            
            // 👇 1. ADDED resume_data AND user names 👇
            $builder->select('
                job_interactions.id as app_id,
                employer_jobs.title as job_title,
                employer_jobs.description as job_desc,
                employer_jobs.skills as job_skills,
                student_profiles.course,
                student_profiles.skills as student_skills,
                student_profiles.about,
                student_profiles.education,
                student_profiles.resume_data,
                users.first_name,
                users.last_name
            ');
            
            // 👇 2. ADDED JOIN FOR USERS TABLE 👇
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            $builder->join('student_profiles', 'student_profiles.firebase_uid = job_interactions.student_uid', 'left');
            $builder->join('users', 'users.firebase_uid = job_interactions.student_uid', 'left');
            
            $builder->where('job_interactions.id', $applicationId);
            $data = $builder->get()->getRowArray();

            if (!$data) {
                return $this->failNotFound('Application not found in database.');
            }

            // Safely decode JSON
            $jobSkills = !empty($data['job_skills']) ? json_decode($data['job_skills'], true) : [];
            if (!is_array($jobSkills)) $jobSkills = [];

            $studentSkills = !empty($data['student_skills']) ? json_decode($data['student_skills'], true) : [];
            if (!is_array($studentSkills)) $studentSkills = [];

            $education = !empty($data['education']) ? json_decode($data['education'], true) : [];
            if (!is_array($education)) $education = [];

            // Base Info
            $collegeName = $education['college']['school'] ?? 'Not Provided';
            $aboutText = !empty($data['about']) ? $data['about'] : 'No about section provided.';
            $courseText = !empty($data['course']) ? $data['course'] : 'Undeclared';
            $firstName = !empty($data['first_name']) ? $data['first_name'] : 'Unknown';
            $lastName = !empty($data['last_name']) ? $data['last_name'] : 'Candidate';

            // 🔥 3. EXTRACT RESUME TEXT 🔥
            $resumeText = '';
            $resumeUrl = $data['resume_data'] ?? '';

            if (!empty($resumeUrl)) {
                try {
                    // Download file temporarily
                    $fileContent = @file_get_contents($resumeUrl);
                    if ($fileContent) {
                        $tempFile = tempnam(sys_get_temp_dir(), 'res_');
                        file_put_contents($tempFile, $fileContent);

                        // If PDF, use your Smalot Parser
                        if (stripos($resumeUrl, '.pdf') !== false || mime_content_type($tempFile) === 'application/pdf') {
                            $parser = new \Smalot\PdfParser\Parser();
                            $pdf = $parser->parseFile($tempFile);
                            $resumeText = $pdf->getText();
                        } 
                        // If DOCX, use your helper method
                        elseif (stripos($resumeUrl, '.docx') !== false) {
                            $resumeText = $this->readDocx($tempFile);
                        }
                        
                        unlink($tempFile); // Clean up temp file
                    }
                } catch (\Exception $e) {
                    $resumeText = ''; // Failsafe: if we can't read it, it just falls back to profile data
                }
            }

            // Clean up text and limit to ~4000 characters to save token space
            $resumeText = preg_replace('/\s+/', ' ', $resumeText);
            $resumeText = substr($resumeText, 0, 4000);

            // 👇 4. UPGRADED PROMPT WITH NAME, COURSE, AND RESUME 👇
            $apiKey = 'AIzaSyAcyJCT9cWBwmKaYyKP9Fnyi76L2RvJfhI'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' . $apiKey; 
            
            $prompt = "YOU ARE AN EXPERT HR RECRUITER AI. Evaluate this candidate for the specific job. OUTPUT ONLY RAW VALID JSON. DO NOT INCLUDE MARKDOWN.

            JOB REQUIREMENTS:
            - Title: " . $data['job_title'] . "
            - Description: " . substr(strip_tags($data['job_desc']), 0, 300) . "
            - Required Skills: " . implode(", ", $jobSkills) . "

            CANDIDATE PROFILE:
            - Name: " . $firstName . " " . $lastName . "
            - Course/Program: " . $courseText . "
            - About: " . $aboutText . "
            - Candidate Skills: " . implode(", ", $studentSkills) . "
            - Education Level: " . $collegeName . "

            RESUME TEXT (If available):
            " . (!empty($resumeText) ? $resumeText : "No readable resume attached. Please rely entirely on the candidate profile details above.") . "

            INSTRUCTIONS:
            1. Calculate a 'match_score' from 0 to 100 based on how well the candidate's skills, course, and resume text match the job requirements.
            2. Write a 2-3 sentence 'overall_assessment'. You MUST use the candidate's name in the assessment.

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"[Candidate Name] shows strong potential due to...\"
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
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if (curl_errno($ch)) {
                throw new \Exception('cURL Error: ' . curl_error($ch));
            }
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) {
                throw new \Exception('Gemini API Error: ' . ($result['error']['message'] ?? 'Unknown API Error'));
            }

            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('AI Failed to generate an assessment.');
            }

            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
            
            // Clean up the text
            $firstBracket = strpos($aiText, '{');
            $lastBracket = strrpos($aiText, '}');
            if ($firstBracket !== false && $lastBracket !== false) {
                $aiText = substr($aiText, $firstBracket, $lastBracket - $firstBracket + 1);
            }
            
            $analysis = json_decode($aiText, true);

            if (!$analysis || !isset($analysis['match_score'])) {
                 throw new \Exception('AI returned invalid format: ' . $aiText);
            }

            $updateData = [
                'ai_match_score' => $analysis['match_score'],
                'ai_assessment' => $analysis['overall_assessment']
            ];

            $db->table('job_interactions')->where('id', $applicationId)->update($updateData);

            return $this->respond($analysis);

        } catch (\Throwable $e) { // 👈 CHANGE \Exception to \Throwable
            // Now React will ACTUALLY receive the error message instead of a blank 500
            return $this->failServerError('Backend Crash: ' . $e->getMessage() . ' on line ' . $e->getLine());
        }
    }
    // 🔥 NEW: Handles the student clicking "Apply" 🔥
    public function apply()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();

        if (!isset($data['job_id']) || !isset($data['student_uid'])) {
            return $this->fail('Missing required application data.');
        }

        // 1. Check if they already applied to prevent spam/duplicates
        $existing = $db->table('applications')
            ->where('job_id', $data['job_id'])
            ->where('student_uid', $data['student_uid'])
            ->countAllResults();

        if ($existing > 0) {
            return $this->failResourceExists('You have already applied to this job.');
        }

        // 2. Insert the new application
        $insertData = [
            'job_id' => $data['job_id'],
            'student_uid' => $data['student_uid'],
            'status' => 'New Applicant',
            // ai_match_score and ai_assessment stay NULL until the employer scans them
        ];

        $db->table('applications')->insert($insertData);

        return $this->respondCreated(['message' => 'Application successfully submitted!']);
    }
// 🔥 BULLETPROOF & FIXED: Fetch all applications for a specific STUDENT 🔥
    public function getStudentApplications($studentUid = null)
    {
        $db = \Config\Database::connect();

        try {
            $builder = $db->table('job_interactions');
            
            // Fixed: Removed employer_profiles.industry to prevent DB crash
            $builder->select('
                job_interactions.*,
                employer_jobs.title as job_title,
                employer_jobs.location,
                employer_jobs.firebase_uid as employer_uid,
                employer_profiles.company_name as profile_company_name,
                users.company_name as user_company_name
            ');
            
            // Join the jobs table to know what job they applied for
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            
            // Join the profiles and users table to get the Company details
            $builder->join('employer_profiles', 'employer_profiles.firebase_uid = employer_jobs.firebase_uid', 'left');
            $builder->join('users', 'users.firebase_uid = employer_jobs.firebase_uid', 'left');
            
            $builder->where('job_interactions.student_uid', $studentUid);
            $builder->where('job_interactions.interaction_type', 'applied'); // Only show actual applications!
            $builder->orderBy('job_interactions.id', 'DESC');
            
            $data = $builder->get()->getResultArray();

            $formatted = [];
            $colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600'];
            $i = 0;

            foreach ($data as $row) {
                // Check employer_profiles first, fallback to users table, fallback to 'Unknown'
                $compName = !empty($row['profile_company_name']) ? $row['profile_company_name'] : (!empty($row['user_company_name']) ? $row['user_company_name'] : 'Unknown Company');
                
                $formatted[] = [
                    'id' => $row['id'],
                    'employer_uid' => $row['employer_uid'] ?? '',
                    'company_name' => $compName,
                    'industry' => 'Technology', // Set a safe static string since the column doesn't exist
                    'location' => $row['location'] ?? 'Remote',
                    'status' => $row['status'] ?? 'Applied',
                    'role' => $row['job_title'] ?? 'Open Position',
                    'avatar' => strtoupper(substr($compName, 0, 1)),
                    'color' => $colors[$i++ % count($colors)],
                    'rating' => '4.' . rand(0, 9)
                ];
            }

            return $this->respond($formatted);

        } catch (\Throwable $e) {
            return $this->failServerError('DB CRASH: ' . $e->getMessage());
        }
    }

  public function getDashboardStats($studentUid = null)
    {
        $db = \Config\Database::connect();

        $statsRaw = $db->table('job_interactions')
            ->select('status, interaction_type, COUNT(*) as total')
            ->where('student_uid', $studentUid)
            ->groupBy('status, interaction_type')
            ->get()
            ->getResultArray();

        $stats = [
            'applied' => 0, 'viewed' => 0, 'shortlisted' => 0,
            'hired' => 0, 'declined' => 0, 'pending' => 0, 'reviewed' => 0
        ];

        foreach ($statsRaw as $row) {
            if ($row['interaction_type'] === 'viewed') {
                $stats['viewed'] += (int)$row['total'];
            } else {
                // It's an application
                $stats['applied'] += (int)$row['total'];
                
                if ($row['status'] === 'Shortlisted') $stats['shortlisted'] += (int)$row['total'];
                if ($row['status'] === 'Hired') $stats['hired'] += (int)$row['total'];
                if ($row['status'] === 'Rejected') $stats['declined'] += (int)$row['total'];
                if ($row['status'] === 'Reviewed') $stats['reviewed'] += (int)$row['total'];
                if ($row['status'] === 'New Applicant') $stats['pending'] += (int)$row['total'];
            }
        }

        return $this->respond($stats);
    }
}