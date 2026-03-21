<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser; // 👈 WE ARE NOW USING THIS TO READ THE PDF!

class Applications extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // 🔥 FIXED: Bulletproof Query (Brings your applicants back!)
    public function getEmployerApplicants($employer_uid = null)
    {
        if (!$employer_uid) return $this->fail('No employer UID provided');

        $db = \Config\Database::connect();
        
        try {
            $builder = $db->table('job_interactions'); 
            
            // Note: I removed profilePhoto to prevent the database from crashing!
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
            // This ensures React gets a real error instead of failing silently
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
        // Use cURL instead of file_get_contents for better compatibility
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $pdfUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $pdfContent = curl_exec($ch);
        curl_close($ch);

        if (!$pdfContent) return "Could not download resume.";
        
        $tempFile = tempnam(sys_get_temp_dir(), 'resume_');
        file_put_contents($tempFile, $pdfContent);
        
        $parser = new Parser();
        $pdf = $parser->parseFile($tempFile);
        $text = $pdf->getText();
        
        unlink($tempFile); 
        return substr(trim($text), 0, 3000);
    } catch (\Exception $e) {
        return "Resume extraction failed: " . $e->getMessage();
    }
}

    // 🔥 THE ULTIMATE AI SCANNER (Now reads PDFs!) 🔥
    public function analyzeApplicant($applicationId = null)
    {
        $db = \Config\Database::connect();

        try {
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

            // Safely decode JSON Arrays
            $jobSkills = !empty($data['job_skills']) ? json_decode($data['job_skills'], true) : [];
            if (!is_array($jobSkills)) $jobSkills = [];

            $studentSkills = !empty($data['student_skills']) ? json_decode($data['student_skills'], true) : [];
            if (!is_array($studentSkills)) $studentSkills = [];

            $education = !empty($data['education']) ? json_decode($data['education'], true) : [];
            if (!is_array($education)) $education = [];

            $collegeName = $education['college']['school'] ?? 'Not Provided';
            $aboutText = !empty($data['about']) ? $data['about'] : 'No about section provided.';
            $courseText = !empty($data['course']) ? $data['course'] : 'Undeclared';

            // 🔥 READ THE PDF 🔥
            $resumeText = "No resume attached.";
            if (!empty($data['resume_data'])) {
                $resumeText = $this->extractPdfText($data['resume_data']);
            }

            $apiKey = 'AIzaSyAcyJCT9cWBwmKaYyKP9Fnyi76L2RvJfhI'; 
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' . $apiKey; 
            
            // 👇 PROMPT INSTRUCTS AI TO CROSS-CHECK THE RESUME 👇
            $prompt = "YOU ARE AN EXPERT HR RECRUITER AI. Evaluate this candidate. OUTPUT ONLY RAW VALID JSON. DO NOT INCLUDE MARKDOWN.

            JOB REQUIREMENTS:
            - Title: " . $data['job_title'] . "
            - Description: " . substr(strip_tags($data['job_desc']), 0, 300) . "
            - Required Skills: " . implode(", ", $jobSkills) . "

            CANDIDATE WEB PROFILE:
            - Course: " . $courseText . "
            - About: " . $aboutText . "
            - Profile Skills: " . implode(", ", $studentSkills) . "
            - Education Level: " . $collegeName . "

            EXTRACTED RESUME TEXT (PDF):
            \"" . $resumeText . "\"

            INSTRUCTIONS:
            1. Cross-check the 'Candidate Web Profile' against the 'Extracted Resume Text'. Identify any misalignments, lies, missing skills, or red flags. If the resume text says 'extraction failed', ignore the cross-check.
            2. Calculate a 'match_score' (0-100) based on how well their combined profile and resume match the Job Requirements.
            3. Write a 3-4 sentence 'overall_assessment'. Briefly state if their resume matches their web profile, then evaluate their fit for the role.

            REQUIRED EXACT JSON FORMAT:
            {
                \"match_score\": 85,
                \"overall_assessment\": \"The candidate's resume aligns well with their web profile. They show strong potential due to...\"
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
            
            if (curl_errno($ch)) throw new \Exception('cURL Error: ' . curl_error($ch));
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) {
                throw new \Exception('Gemini API Error: ' . ($result['error']['message'] ?? 'Unknown API Error'));
            }

            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('AI Failed to generate an assessment.');
            }

            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
            
            $firstBracket = strpos($aiText, '{');
            $lastBracket = strrpos($aiText, '}');
            if ($firstBracket !== false && $lastBracket !== false) {
                $aiText = substr($aiText, $firstBracket, $lastBracket - $firstBracket + 1);
            }
            
            $analysis = json_decode($aiText, true);

            if (!$analysis || !isset($analysis['match_score'])) {
                 throw new \Exception('AI returned invalid format.');
            }

            $updateData = [
                'ai_match_score' => (int) $analysis['match_score'],
                'ai_assessment' => (string) $analysis['overall_assessment']
            ];

            // Save to the correct table!
            $db->table('job_interactions')->where('id', $applicationId)->update($updateData);

            return $this->respond($analysis);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }

    public function apply()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();

        if (!isset($data['job_id']) || !isset($data['student_uid'])) {
            return $this->fail('Missing required application data.');
        }

        $existing = $db->table('applications')
            ->where('job_id', $data['job_id'])
            ->where('student_uid', $data['student_uid'])
            ->countAllResults();

        if ($existing > 0) return $this->failResourceExists('You have already applied to this job.');

        $insertData = [
            'job_id' => $data['job_id'],
            'student_uid' => $data['student_uid'],
            'status' => 'New Applicant'
        ];

        $db->table('applications')->insert($insertData);
        return $this->respondCreated(['message' => 'Application successfully submitted!']);
    }

    public function getStudentApplications($studentUid = null)
    {
        $db = \Config\Database::connect();

        try {
            $builder = $db->table('job_interactions');
            
            $builder->select('
                job_interactions.*,
                employer_jobs.title as job_title,
                employer_jobs.location,
                employer_jobs.firebase_uid as employer_uid,
                employer_profiles.company_name as profile_company_name,
                users.company_name as user_company_name
            ');
            
            $builder->join('employer_jobs', 'employer_jobs.id = job_interactions.job_id', 'left');
            $builder->join('employer_profiles', 'employer_profiles.firebase_uid = employer_jobs.firebase_uid', 'left');
            $builder->join('users', 'users.firebase_uid = employer_jobs.firebase_uid', 'left');
            
            $builder->where('job_interactions.student_uid', $studentUid);
            $builder->where('job_interactions.interaction_type', 'applied'); 
            $builder->orderBy('job_interactions.id', 'DESC');
            
            $data = $builder->get()->getResultArray();

            $formatted = [];
            $colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600'];
            $i = 0;

            foreach ($data as $row) {
                $compName = !empty($row['profile_company_name']) ? $row['profile_company_name'] : (!empty($row['user_company_name']) ? $row['user_company_name'] : 'Unknown Company');
                
                $formatted[] = [
                    'id' => $row['id'],
                    'employer_uid' => $row['employer_uid'] ?? '',
                    'company_name' => $compName,
                    'industry' => 'Technology', 
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
}