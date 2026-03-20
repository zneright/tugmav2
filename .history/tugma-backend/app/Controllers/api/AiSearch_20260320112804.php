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
        $json = $this->request->getJSON(true);
        $searchQuery = $json['searchQuery'] ?? '';
        $locationQuery = $json['locationQuery'] ?? '';
        $category = $json['category'] ?? 'All Categories';
        $studentSkills = $json['studentSkills'] ?? [];

        // Fetch all active jobs
        $model = new EmployerJobModel();
        $jobs = $model->where('status', 'Active')->findAll();

        if (empty($jobs)) return $this->respond([]);

        // Simplify for AI token limits
        $simplifiedJobs = array_map(function($j) {
            return [
                'id' => $j['id'],
                'title' => $j['title'],
                'location' => $j['location'],
                'skills' => json_decode($j['skills'], true) ?? [],
                'description' => substr($j['description'], 0, 200) // Just a snippet
            ];
        }, $jobs);

        // Call Gemini AI
        $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

        // 👇 THE ENHANCED SEMANTIC PROMPT 👇
        $prompt = "YOU ARE AN ADVANCED AI JOB MATCHMAKER. Analyze the available jobs against the user's input using SEMANTIC understanding, not just exact word matching.

        USER INPUT:
        - Search Keyword: " . json_encode($searchQuery) . " (Understand abstractions. E.g., 'speaker' = good communication, 'photoshop' = graphic design).
        - Location: " . json_encode($locationQuery) . " (Understand geography. E.g., 'Metro Manila' includes Makati, BGC, Pasay, etc. 'Region 3' includes Bulacan, Pampanga, etc.).
        - Category: " . json_encode($category) . " (Classify based on the Job TITLE. E.g., 'Frontend Intern' belongs to 'Web Development').
        - Student's Skills: " . json_encode($studentSkills) . "

        AVAILABLE JOBS:
        " . json_encode($simplifiedJobs) . "

        INSTRUCTIONS:
        1. Score each job from 0 to 100 based on how well it fits the User Input. 
        2. If the job fits the Category conceptually, boost the score.
        3. If the keyword implies a skill the job needs, boost the score.
        4. If the job is entirely unrelated or the location is strictly wrong, score it 0.
        5. Return a JSON array. DO NOT include jobs with a score of 0.
        6. Sort the array with the highest scores at the top.

        REQUIRED JSON FORMAT:
        [
            { \"id\": 1, \"score\": 95, \"reason\": \"Matches perfectly because 'speaker' implies the communication skills needed for this role.\" }
        ]";

        $data = [
            "contents" => [["parts" => [["text" => $prompt]]]],
            "generationConfig" => ["responseMimeType" => "application/json"],
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        
        // 👇 ROBUST JSON CLEANUP 👇
        $aiText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
        $aiText = str_replace(['```json', '```'], '', trim($aiText)); 
        
        $aiMatches = json_decode($aiText, true) ?? [];

        // Merge AI Results with Full Job Data
        $finalResults = [];
        foreach ($aiMatches as $match) {
            foreach ($jobs as $job) {
                if ($job['id'] == $match['id']) {
                    $job['skills'] = json_decode($job['skills'], true) ?? [];
                    $job['matchScore'] = $match['score'];
                    $job['aiReason'] = $match['reason'];
                    $finalResults[] = $job;
                    break;
                }
            }
        }

        return $this->respond($finalResults);
    }
}