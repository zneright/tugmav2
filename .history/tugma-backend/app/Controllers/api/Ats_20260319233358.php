<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser;

class Ats extends ResourceController
{
    public function scan()
    {
        // 1. Get the uploaded file and job description
        $file = $this->request->getFile('resume');
        $jobDescription = $this->request->getPost('jobDescription');

        if (!$file->isValid() || $file->getExtension() !== 'pdf') {
            return $this->failValidationErrors('Please upload a valid PDF file.');
        }

        try {
            // 2. Extract Text from the PDF
            $parser = new Parser();
            $pdf = $parser->parseFile($file->getTempName());
            $resumeText = $pdf->getText();

            // 3. Send to AI for Grading
            $aiFeedback = $this->gradeWithAI($resumeText, $jobDescription);

            // 4. Return the AI's JSON back to React
            return $this->respond($aiFeedback);

        } catch (\Exception $e) {
            return $this->failServerError('Error parsing PDF: ' . $e->getMessage());
        }
    }

    private function gradeWithAI($resumeText, $jobDescription)
    {
        // 🔥 GET YOUR FREE API KEY AT: https://aistudio.google.com/app/apikey
        $apiKey = 'AIzaSyAJQBYDfVr6KKx_yx8S6TY7heYfMm7gh7A'; 
        
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . $apiKey;

        // The Strict Prompt telling the AI exactly how to format the response
        $prompt = "You are a strict Applicant Tracking System (ATS). Grade the following resume against the job description. 
        You MUST respond ONLY with a raw, valid JSON object matching this exact structure (do not use markdown blocks like ```json):
        {
            \"overallScore\": (number between 0-100),
            \"metrics\": {
                \"impact\": (number 0-100),
                \"formatting\": (number 0-100),
                \"keywords\": (number 0-100)
            },
            \"strengths\": [\"string\", \"string\"],
            \"improvements\": [\"string\", \"string\"],
            \"missingKeywords\": [\"string\", \"string\"]
        }
        
        Resume Text: " . substr($resumeText, 0, 5000) . " 
        Job Description: " . substr($jobDescription, 0, 2000);

        // Package the request for Gemini
        $data = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ]
        ];

        // Send cURL Request
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $response = curl_exec($ch);
        curl_close($ch);

        $responseData = json_decode($response, true);
        
        // Extract the actual text response from Gemini's payload
        $aiText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

        // Clean up formatting in case Gemini accidentally adds ```json tags
        $aiText = str_replace(['```json', '```'], '', $aiText);

        return json_decode(trim($aiText), true);
    }
}