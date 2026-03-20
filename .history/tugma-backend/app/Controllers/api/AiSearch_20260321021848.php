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
            $studentSkills = $json['studentSkills'] ?? [];

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

            $apiKey = 'AIzaSyCke-i5eBILEIsjGtei4M8PyO7RrMhZ1Mk'; 
            
$url = '$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' . $apiKey;' . $apiKey;
            $prompt = "YOU ARE AN ADVANCED AI JOB MATCHMAKER. The user has requested a NEW search. You MUST provide a fresh, accurate evaluation based on these exact new inputs. OUTPUT ONLY RAW VALID JSON ARRAY.

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
                    "temperature" => 0.8 // 🔥 THIS IS WHAT STOPS THE AI FROM REPEATING THE SAME ANSWER!
                ],
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
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            
            // 🔥 THIS FIXES YOUR "COULD NOT RESOLVE HOST" INTERNET ERROR ON XAMPP 🔥
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
            
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
            
            // 🔥 THE BRACKET CATCHER: Stops JSON parsing crashes if the AI gets chatty!
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
            // This safely returns the exact error string so React can pop an alert box!
            return $this->failServerError($e->getMessage());
        }
    }
}