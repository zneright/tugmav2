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

            $model = new EmployerJobModel();
            $jobs = $model->where('status', 'Active')->findAll();

            if (empty($jobs)) return $this->respond([]);

            $simplifiedJobs = [];
            foreach ($jobs as $j) {
                $skillsRaw = json_decode($j['skills'], true);
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

            $safeJobsJson = json_encode($simplifiedJobs);
            $apiKey = 'AIzaSyDjP6U_u0oQuloFKanIQjdjcIkXjw0V-s0'; 
            // 🔥 Using 1.5-flash as it's the stable public model
            $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;

            $prompt = "Evaluate these jobs for a student. User seeks: $searchQuery in $locationQuery (Category: $category). Student skills: " . json_encode($studentSkills) . ". Available Jobs: $safeJobsJson. Output ONLY a RAW JSON array of objects with 'id' (int), 'score' (0-100), and 'reason' (string). No markdown.";

            $payload = [
                "contents" => [["parts" => [["text" => $prompt]]]],
                "generationConfig" => ["responseMimeType" => "application/json", "temperature" => 0.7]
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
            curl_close($ch);

            if ($httpCode !== 200) {
                return $this->fail("AI Engine Offline ($httpCode)");
            }

            $result = json_decode($response, true);
            $aiText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // 🔥 CLEAN MARKDOWN WRAPPERS IF PRESENT
            $aiText = str_replace(['```json', '```'], '', $aiText);
            $aiMatches = json_decode(trim($aiText), true);

            if (!is_array($aiMatches)) return $this->respond([]);

            $finalResults = [];
            foreach ($aiMatches as $match) {
                foreach ($jobs as $job) {
                    if ($job['id'] == $match['id']) {
                        $job['skills'] = json_decode($job['skills'], true) ?: [];
                        $job['matchScore'] = $match['score'] ?? 0;
                        $job['aiReason'] = $match['reason'] ?? '';
                        $finalResults[] = $job;
                        break;
                    }
                }
            }

            return $this->respond($finalResults);

        } catch (\Throwable $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}