<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\EmployerJobModel;

class AiSearch extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    public function searchMatches()
    {
        try {
            $json = $this->request->getJSON(true);
            $searchQuery = trim($json['searchQuery'] ?? '');
            $locationQuery = trim($json['locationQuery'] ?? '');
            $category = trim($json['category'] ?? '');
            $studentSkills = $json['studentSkills'] ?? [];

            // Fetch all active jobs
            $model = new EmployerJobModel();
            $jobs = $model->where('status', 'Active')->findAll();

            if (empty($jobs)) return $this->respond([]);

            // Simplify for AI token limits 
            $simplifiedJobs = array_map(function($j) {
                $skillsRaw = json_decode($j['skills'], true);
                return [
                    'id' => $j['id'],
                    'title' => $j['title'],
                    'location' => $j['location'],
                    'skills' => is_array($skillsRaw) ? $skillsRaw : [],
                    'description' => mb_substr($j['description'], 0, 250, 'UTF-8') 
                ];
            }, $jobs);

            $safeJobsJson = json_encode($simplifiedJobs);
            if (!$safeJobsJson) {
                return $this->failServerError('Failed to encode jobs for AI.');
            }

            $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
            
            // 🔥 CRITICAL FIX: Using the correct, actively supported model name 🔥
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $apiKey;

            $prompt = "YOU ARE AN ADVANCED AI JOB MATCHMAKER. Analyze the available jobs against the user's input using deep SEMANTIC understanding. OUTPUT ONLY RAW VALID JSON.

            USER INPUT:
            - Search Keyword: " . json_encode($searchQuery) . "
            - Location: " . json_encode($locationQuery) . "
            - Category: " . json_encode($category) . "
            - Student's Skills: " . json_encode($studentSkills) . "

            AVAILABLE JOBS:
            " . $safeJobsJson . "

            SCORING RULES (0-100):
            1. If ALL user inputs are EMPTY, score purely based on how well the job matches the 'Student's Skills'.
            2. Location matches get a major boost.
            3. Output a JSON array. DO NOT include jobs with a score below 30.

            REQUIRED EXACT JSON FORMAT:
            [
                { \"id\": 1, \"score\": 95, \"reason\": \"Matches perfectly because...\" }
            ]";

            $data = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => ["responseMimeType" => "application/json"],
                "safetySettings" => [
                    ["category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE"]
                ]
            ];

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            
            // Bypass local SSL issues
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
            
            if (curl_errno($ch)) {
                throw new \Exception('cURL Connection Error: ' . curl_error($ch));
            }
            curl_close($ch);

            $result = json_decode($response, true);

            if ($httpCode !== 200) {
                throw new \Exception('Gemini Error ' . $httpCode . ': ' . ($result['error']['message'] ?? 'Unknown Error'));
            }
            if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                throw new \Exception('AI Refused to answer.');
            }

            $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
            $aiText = str_replace(['```json', '```'], '', trim($aiText)); 
            
            $aiMatches = json_decode($aiText, true);

            if (!is_array($aiMatches)) {
                throw new \Exception('AI Engine failed to format the response correctly. Raw output: ' . $aiText);
            }

            // Merge AI Results with Full Job Data
            $finalResults = [];
            foreach ($aiMatches as $match) {
                foreach ($jobs as $job) {
                    if ($job['id'] == $match['id']) {
                        $skillsRaw = json_decode($job['skills'], true);
                        $job['skills'] = is_array($skillsRaw) ? $skillsRaw : [];
                        $job['matchScore'] = $match['score'] ?? 0;
                        $job['aiReason'] = $match['reason'] ?? '';
                        $finalResults[] = $job;
                        break;
                    }
                }
            }

            return $this->respond($finalResults);

        } catch (\Exception $e) {
            // This safely returns the exact error string so React can pop an alert box!
            return $this->failServerError('Processing Error: ' . $e->getMessage());
        }
    }
}