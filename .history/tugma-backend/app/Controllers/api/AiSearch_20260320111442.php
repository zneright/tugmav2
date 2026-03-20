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

        // 1. Fetch all currently active jobs
        $model = new EmployerJobModel();
        $jobs = $model->where('status', 'Active')->findAll();

        if (empty($jobs)) return $this->respond([]);

        // Decode skills for the AI payload to save tokens
        $simplifiedJobs = array_map(function($j) {
            return [
                'id' => $j['id'],
                'title' => $j['title'],
                'location' => $j['location'],
                'skills' => json_decode($j['skills'], true) ?? [],
                'work_setup' => $j['work_setup']
            ];
        }, $jobs);

        // 2. Call Gemini AI
        $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

        $prompt = "YOU ARE AN AI JOB MATCHMAKER. Analyze the available jobs against the user's search intent.
        
        USER SEARCH INTENT:
        - Keywords: " . json_encode($searchQuery) . "
        - Location: " . json_encode($locationQuery) . " (BE SMART: If they say 'Metro Manila', include Makati, Taguig, Pasay, etc. If they say 'Region 3', include Bulacan, Pampanga, etc.)
        - Category: " . json_encode($category) . "
        - Student's Existing Skills: " . json_encode($studentSkills) . "

        AVAILABLE JOBS:
        " . json_encode($simplifiedJobs) . "

        INSTRUCTIONS:
        1. Filter out jobs that STRICTLY DO NOT match the location (if location is provided).
        2. Score the remaining jobs (0-100) based on how well they match the keywords, category, and student skills.
        3. If the search query and location are empty, just score them based on the Student's Existing Skills.
        4. Return ONLY a valid JSON array containing the matching jobs, sorted by score (highest first). Drop jobs with a score below 30 if a specific search was made.
        
        JSON FORMAT EXPECTED:
        [
            { \"id\": job_id_here, \"score\": 95, \"reason\": \"Short 1-sentence reason why it matches their search/skills.\" }
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
        $aiMatches = json_decode(trim($aiText), true) ?? [];

        // 3. Merge AI Results with Full Job Data
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