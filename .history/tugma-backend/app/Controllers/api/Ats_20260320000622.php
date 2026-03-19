<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser;

class Ats extends ResourceController
{
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

        // Your World-Class Prompt
        $prompt = "YOU ARE A WORLD-CLASS APPLICANT TRACKING SYSTEM (ATS). YOUR PRIMARY OBJECTIVE IS TO STRICTLY ANALYZE, SCORE, AND STRUCTURE RESUME EVALUATIONS AGAINST A GIVEN JOB DESCRIPTION.

        YOU MUST OUTPUT ONLY A RAW, VALID JSON OBJECT — NO MARKDOWN, NO EXTRA TEXT.

        INPUTS:
        - RESUME TEXT: " . substr($resumeText, 0, 6000) . "
        - JOB DESCRIPTION: " . substr($jobDescription, 0, 3000) . "

        OUTPUT FORMAT (STRICT):
        {
          \"match_score\": number,
          \"overall_assessment\": \"string\",
          \"strengths\": [\"string\"],
          \"weaknesses\": [\"string\"],
          \"missing_keywords\": [\"string\"],
          \"matched_keywords\": [\"string\"],
          \"experience_relevance\": number,
          \"education_relevance\": number,
          \"skills_relevance\": number,
          \"improvement_suggestions\": [\"string\"]
        }";

        $data = ["contents" => [["parts" => [["text" => $prompt]]]]];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);

        // Crash Protection: Check if Gemini returned a valid response
        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('AI Provider Error: ' . ($result['error']['message'] ?? 'Empty response'));
        }

        $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
        
        // Clean markdown if AI ignores the instruction
        $aiText = str_replace(['```json', '```'], '', $aiText);
        
        $decoded = json_decode(trim($aiText), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('AI returned invalid JSON formatting.');
        }

        return $decoded;
    }
}