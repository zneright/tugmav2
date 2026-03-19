<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser;

class Ats extends ResourceController
{
    // 🔥 REQUIRED: This stops the browser from blocking the React request 🔥
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method == "OPTIONS") {
            die();
        }
    }

    public function scan()
    {
        $file = $this->request->getFile('resume');
        $jobDescription = $this->request->getPost('jobDescription');

        if (!$file || !$file->isValid()) {
            return $this->fail('No valid file uploaded.');
        }

        if ($file->getExtension() !== 'pdf') {
            return $this->failValidationError('Please upload a PDF file.');
        }

        try {
            // 1. Extract Text
            $parser = new Parser();
            $pdf = $parser->parseFile($file->getTempName());
            $resumeText = $pdf->getText();

            // 2. Grade with AI
            $aiFeedback = $this->gradeWithAI($resumeText, $jobDescription);

            // 3. Return JSON
            return $this->respond($aiFeedback);

        } catch (\Exception $e) {
            return $this->failServerError('Processing Error: ' . $e->getMessage());
        }
    }

    private function gradeWithAI($resumeText, $jobDescription)
    {
        $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;
        // 🔥 REQUIRED: json_encode prevents quotation marks in the PDF from breaking the payload
        $safeResume = json_encode(substr($resumeText, 0, 6000));
        $safeJobDesc = json_encode(substr($jobDescription, 0, 3000));

        $prompt = "YOU ARE A WORLD-CLASS APPLICANT TRACKING SYSTEM (ATS). ANALYZE THIS RESUME AGAINST THE JOB DESCRIPTION.
        OUTPUT ONLY RAW VALID JSON.
        
        RESUME: " . $safeResume . "
        JOB: " . $safeJobDesc . "

        JSON STRUCTURE:
        {
          \"match_score\": number,
          \"overall_assessment\": \"string\",
          \"strengths\": [],
          \"weaknesses\": [],
          \"missing_keywords\": [],
          \"matched_keywords\": [],
          \"experience_relevance\": number,
          \"education_relevance\": number,
          \"skills_relevance\": number,
          \"improvement_suggestions\": []
        }";

        $data = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ],
            // Force JSON response format
            "generationConfig" => [
                "responseMimeType" => "application/json"
            ],
            // Safety settings to prevent AI blocking the response
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
        
        // 👇 Using your header approach here! 👇
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
        curl_close($ch);

        $result = json_decode($response, true);

        // Better Error Logging
        if ($httpCode !== 200) {
            throw new \Exception('Gemini API returned status ' . $httpCode . ': ' . ($result['error']['message'] ?? 'Unknown Error'));
        }

        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            $reason = $result['candidates'][0]['finishReason'] ?? 'Unknown reason';
            throw new \Exception('AI Refused to answer. Reason: ' . $reason);
        }

        $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
        $aiText = str_replace(['```json', '```'], '', $aiText);
        
        return json_decode(trim($aiText), true);
    }
}