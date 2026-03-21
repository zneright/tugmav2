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
            if (!$json) $json = [];

            $searchQuery = trim($json['searchQuery'] ?? '');
            $locationQuery = trim($json['locationQuery'] ?? '');
            $category = trim($json['category'] ?? '');
            
            // Ensure student skills is always an array
            $studentSkills = $json['studentSkills'] ?? [];
            if (!is_array($studentSkills)) {
                $studentSkills = [$studentSkills]; 
            }

            // Fetch all active jobs
            $model = new EmployerJobModel();
            $jobs = $model->where('status', 'Active')->findAll();

            if (empty($jobs)) return $this->respond([]);

            // Simplify for AI token limits & clean strings safely
            $simplifiedJobs = [];
            foreach ($jobs as $j) {
                $skillsRaw = json_decode($j['skills'], true);
                
                // Safely clean the description to prevent JSON payload crashes
                $cleanDesc = strip_tags($j['description']);
                $cleanDesc = substr($cleanDesc, 0, 300);
                $cleanDesc = str_replace(["\r", "\n", "\t", "\""], " ", $cleanDesc);

                $simplifiedJobs[] = [
                    'id' => $j['id'],
                    'title' => $j['title'],
                    'location' => $j['location'],
                    'skills' => is_array($skillsRaw) ? $skillsRaw : [],
                    'description' => trim($cleanDesc)
                ];
            }

            $safeJobsJson = json_encode($simplifiedJobs, JSON_PARTIAL_OUTPUT_ON_ERROR);

            // API Key
            $apiKey = 'AIzaSyDjP6U_u0oQuloFKanIQjdjcIkXjw0V-s0'; 
            
            // 🔥 FIXED: Swapped to the correct public Google API model 🔥
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;
            
            $prompt = "YOU ARE AN ADVANCED AI JOB MATCHMAKER. The user has requested a NEW search. You MUST provide a fresh, accurate evaluation based on these exact new inputs. OUTPUT ONLY RAW VALID JSON ARRAY. DO NOT USE MARKDOWN FORMATTING.

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
            3. If the user typed a Search Keyword, heavily penalize jobs that do not match it conceptually.
            4. Output a JSON array. DO NOT include jobs with a score below 30.

            REQUIRED EXACT JSON FORMAT:
            [
                { \"id\": 1, \"score\": 95, \"reason\": \"Matches perfectly because...\" }
            ]";

            $data = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => [
                    "responseMimeType" => "application/json",
                    "temperature" => 0.8
                ],
                "safetySettings" => [
                    ["category" => "HARM_CATEGORY_HARASSMENT", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_HATE_SPEECH", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold" => "BLOCK_NONE"],
                    ["category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_NONE"]
                ]
            ];

            // BULLETPROOF CURL CONFIGURATION
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            
            // Explicitly set content length and type
            $jsonData = json_encode($data);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($jsonData)
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
            
            // Force TLS and ignore peer verification
            curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            
            // Force IPv4 resolution to prevent DNS timeouts
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);
            
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
            
            // 🔥 STRONGER BRACKET CATCHER: Strips markdown safely
            $aiText = str_replace(['```json', '```'], '', $aiText);
            $firstBracket = strpos($aiText, '[');
            $lastBracket = strrpos($aiText, ']');
            if ($firstBracket !== false && $lastBracket !== false) {
                $aiText = substr($aiText, $firstBracket, $lastBracket - $firstBracket + 1);
            }
            
            $aiMatches = json_decode($aiText, true);

            if (!is_array($aiMatches)) {
                throw new \Exception('AI Engine failed to format the response correctly. Output was: ' . $aiText);
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
            // Safely return the error so React catches it
            return $this->response->setStatusCode(500)->setJSON([
                'error' => true,
                'message' => $e->getMessage()
            ]);
        }
    }
}