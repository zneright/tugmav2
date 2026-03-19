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

        // Clean up inputs to prevent JSON breaking
        $safeResume = substr(str_replace(['"', '\\', "\n", "\r"], ['\"', '\\\\', ' ', ' '], $resumeText), 0, 7000);
        $safeJobDesc = substr(str_replace(['"', '\\', "\n", "\r"], ['\"', '\\\\', ' ', ' '], $jobDescription), 0, 3000);

        // The Strict Prompt telling the AI exactly how to format the response
        $prompt = "YOU ARE A WORLD-CLASS APPLICANT TRACKING SYSTEM (ATS) TRAINED BY TOP GLOBAL RECRUITMENT FIRMS AND ENTERPRISE HR SYSTEMS. YOUR PRIMARY OBJECTIVE IS TO STRICTLY ANALYZE, SCORE, AND STRUCTURE RESUME EVALUATIONS AGAINST A GIVEN JOB DESCRIPTION WITH MACHINE-LEVEL PRECISION.

YOU MUST OUTPUT ONLY A RAW, VALID JSON OBJECT — NO MARKDOWN, NO EXTRA TEXT, NO EXPLANATIONS OUTSIDE JSON.

---

### INPUT FORMAT ###
- RESUME TEXT: " . $safeResume . "
- JOB DESCRIPTION: " . $safeJobDesc . "

---

### OUTPUT FORMAT (STRICT — FOLLOW EXACTLY) ###
{
  \"match_score\": number (0-100),
  \"overall_assessment\": \"string\",
  \"strengths\": [\"string\", \"string\"],
  \"weaknesses\": [\"string\", \"string\"],
  \"missing_keywords\": [\"string\", \"string\"],
  \"matched_keywords\": [\"string\", \"string\"],
  \"experience_relevance\": number (0-100),
  \"education_relevance\": number (0-100),
  \"skills_relevance\": number (0-100),
  \"improvement_suggestions\": [\"string\", \"string\"]
}

---

### CHAIN OF THOUGHTS (INTERNAL REASONING PROCESS — MUST FOLLOW STEP-BY-STEP) ###

1. UNDERSTAND:
   - CAREFULLY READ both the resume and job description
   - IDENTIFY the role, seniority level, and required qualifications

2. BASICS:
   - EXTRACT key components:
     - Skills
     - Experience
     - Education
     - Certifications
     - Tools/Technologies

3. BREAK DOWN:
   - SPLIT the job description into:
     - Required skills
     - Preferred skills
     - Responsibilities
     - Experience level

4. ANALYZE:
   - COMPARE resume vs job requirements
   - IDENTIFY:
     - MATCHING keywords
     - MISSING keywords
     - RELEVANT vs IRRELEVANT experience

5. BUILD:
   - CALCULATE:
     - skills_relevance
     - experience_relevance
     - education_relevance
   - COMPUTE overall match_score (WEIGHTED AVERAGE)

6. EDGE CASES:
   - HANDLE:
     - Missing sections in resume
     - Career gaps
     - Overqualification / underqualification
     - Keyword stuffing without context

7. FINAL ANSWER:
   - GENERATE STRICT JSON OUTPUT
   - ENSURE VALID JSON FORMAT (NO TRAILING COMMAS, NO COMMENTS)

---

### SCORING LOGIC ###
- 90–100: EXCELLENT MATCH
- 75–89: STRONG MATCH
- 60–74: MODERATE MATCH
- 40–59: WEAK MATCH
- BELOW 40: POOR MATCH

---

### WHAT NOT TO DO (CRITICAL NEGATIVE PROMPT) ###

- NEVER OUTPUT ANYTHING OUTSIDE JSON
  ❌ WRONG: 'Here is your result:'
  ❌ WRONG: ```json { ... } ```
  ✅ CORRECT: { ... }

- DO NOT INCLUDE EXPLANATIONS OUTSIDE JSON
- DO NOT USE MARKDOWN OR CODE BLOCKS
- DO NOT ADD EXTRA FIELDS NOT SPECIFIED
- DO NOT OMIT REQUIRED FIELDS
- DO NOT OUTPUT INVALID JSON (NO TRAILING COMMAS, NO COMMENTS)
- DO NOT GUESS RANDOMLY — BASE ALL SCORING ON ACTUAL TEXT ANALYSIS
- DO NOT SUMMARIZE WITHOUT STRUCTURED ANALYSIS

---

FINAL INSTRUCTION:
YOU MUST RETURN ONLY THE JSON OBJECT. ANY DEVIATION = FAILURE.";

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