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

            // If the AI failed to return valid JSON, return an error
            if ($aiFeedback === null) {
                 return $this->failServerError('Failed to analyze the resume. The AI returned an invalid response.');
            }

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

        // Clean inputs more aggressively so they don't break the JSON payload
        $safeResume = json_encode(substr($resumeText, 0, 7000));
        $safeJobDesc = json_encode(substr($jobDescription, 0, 3000));

        // The Strict Prompt telling the AI exactly how to format the response
        $prompt = "YOU ARE A WORLD-CLASS APPLICANT TRACKING SYSTEM (ATS). YOUR PRIMARY OBJECTIVE IS TO STRICTLY ANALYZE, SCORE, AND STRUCTURE RESUME EVALUATIONS AGAINST A GIVEN JOB DESCRIPTION.

YOU MUST OUTPUT ONLY A RAW, VALID JSON OBJECT — NO MARKDOWN, NO EXTRA TEXT, NO EXPLANATIONS OUTSIDE JSON.

### INPUT FORMAT ###
- RESUME TEXT: " . $safeResume . "
- JOB DESCRIPTION: " . $safeJobDesc . "

### OUTPUT FORMAT (STRICT — FOLLOW EXACTLY) ###
{
  \"match_score\": 85,
  \"overall_assessment\": \"string\",
  \"strengths\": [\"string\", \"string\"],
  \"weaknesses\": [\"string\", \"string\"],
  \"missing_keywords\": [\"string\", \"string\"],
  \"matched_keywords\": [\"string\", \"string\"],
  \"experience_relevance\": 80,
  \"education_relevance\": 90,
  \"skills_relevance\": 75,
  \"improvement_suggestions\": [\"string\", \"string\"]
}

### CRITICAL INSTRUCTIONS ###
- NEVER OUTPUT ANYTHING OUTSIDE JSON.
- DO NOT INCLUDE EXPLANATIONS OUTSIDE JSON.
- DO NOT USE MARKDOWN OR CODE BLOCKS.
- ALL numeric values must be integers between 0 and 100.
- ENSURE VALID JSON FORMAT (NO TRAILING COMMAS).
- RETURN ONLY THE JSON OBJECT.";

        // Package the request for Gemini
        $data = [
            "contents" => [
                ["parts" => [["text" => $prompt]]]
            ],
            // Force the AI to return JSON using generationConfig
            "generationConfig" => [
                 "responseMimeType" => "application/json"
            ]
        ];

        // Send cURL Request
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

        $response = curl_exec($ch);
        
        if (curl_errno($ch)) {
            curl_close($ch);
            return null; // Curl error
        }
        curl_close($ch);

        $responseData = json_decode($response, true);
        
        // Check if Gemini returned an error
        if (isset($responseData['error'])) {
            error_log('Gemini API Error: ' . json_encode($responseData['error']));
            return null;
        }

        // Extract the actual text response from Gemini's payload
        $aiText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

        // Decode and return. If it fails to decode, it returns null.
        return json_decode(trim($aiText), true);
    }
}