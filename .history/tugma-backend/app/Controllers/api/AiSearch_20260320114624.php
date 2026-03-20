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
            return [
                'id' => $j['id'],
                'title' => $j['title'],
                'location' => $j['location'],
                'skills' => json_decode($j['skills'], true) ?? [],
                'description' => substr($j['description'], 0, 250) // Just a snippet
            ];
        }, $jobs);

        // Call Gemini AI
        $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

        // 👇 THE ENHANCED SEMANTIC PROMPT 👇
        $prompt = "YOU ARE AN ADVANCED AI JOB MATCHMAKER. Your goal is to analyze the available jobs against the user's input using deep SEMANTIC understanding.

        USER INPUT:
        - Search Keyword: " . json_encode($searchQuery) . " (Look for conceptual matches. Example: 'speaker' implies communication skills; 'photoshop' implies graphic design).
        - Location: " . json_encode($locationQuery) . " (Apply smart geography. Example: 'Metro Manila' includes Makati, Taguig, Pasay, etc. 'Region 3' includes Bulacan, Pampanga, etc.).
        - Category: " . json_encode($category) . " (Evaluate if the job TITLE or DESCRIPTION conceptually fits this category).
        - Student's Skills: " . json_encode($studentSkills) . "

        AVAILABLE JOBS:
        " . json_encode($simplifiedJobs) . "

        SCORING RULES (0-100):
        1. If ALL user inputs (Keyword, Location, Category) are EMPTY, score purely based on how well the job matches the 'Student's Skills'.
        2. If a Location is provided, prioritize jobs in or near that geography. Jobs outside that geography get a massive penalty but do not score them 0 if they match the Category/Keyword perfectly.
        3. If a Category is provided, determine if the job conceptually belongs there. Boost the score if it does.
        4. If a Search Keyword is provided, look for exact OR conceptual/abstract matches in the title, skills, or description.
        5. Output a JSON array. DO NOT include jobs with a score below 30.
        6. Sort the array with the highest scores at the top.

        REQUIRED JSON FORMAT:
        [
            { \"id\": 1, \"score\": 95, \"reason\": \"Matches perfectly because 'speaker' aligns with the strong communication skills needed for this role, and the location is within Metro Manila.\" }
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