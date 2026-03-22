<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use Smalot\PdfParser\Parser;
use ZipArchive;
use App\Models\AtsHistoryModel;

class Ats extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") {
            die();
        }
    }

    // FETCH HISTORY (Now filtered by UID!)
    public function history($uid = null)
    {
        if (!$uid) return $this->fail('User UID is required');

        $model = new AtsHistoryModel();
        // Only fetch scans belonging to this specific user
        $history = $model->where('firebase_uid', $uid)->orderBy('created_at', 'DESC')->findAll(10);
        
        foreach ($history as &$item) {
            $item['json_result'] = json_decode($item['json_result'], true);
        }
        
        return $this->respond($history);
    }

    public function scan()
    {
        $file = $this->request->getFile('resume');
        $jobDescription = $this->request->getPost('jobDescription');
        $uid = $this->request->getPost('firebase_uid'); // <-- Catch the UID from frontend

        if (!$file || !$file->isValid()) {
            return $this->fail('No valid file uploaded.');
        }

        $ext = strtolower($file->getExtension());
        if (!in_array($ext, ['pdf', 'docx'])) {
            return $this->failValidationError('Please upload a .pdf or .docx file.');
        }

        try {
            $resumeText = "";

            if ($ext === 'pdf') {
                $parser = new Parser();
                $pdf = $parser->parseFile($file->getTempName());
                $resumeText = $pdf->getText();
            } else if ($ext === 'docx') {
                $resumeText = $this->readDocx($file->getTempName());
            }

            if (trim($resumeText) === '') {
                return $this->failServerError('We could not read any text. Ensure it is a standard text-based PDF or Word file.');
            }

            $aiFeedback = $this->gradeWithAI($resumeText, $jobDescription);

            $model = new AtsHistoryModel();
            $model->insert([
                'firebase_uid'    => $uid, // <-- SAVE THE UID TO THE DATABASE
                'file_name'       => $file->getClientName(),
                'job_description' => $jobDescription,
                'match_score'     => $aiFeedback['match_score'],
                'json_result'     => json_encode($aiFeedback),
                'created_at'      => date('Y-m-d H:i:s')
            ]);

            return $this->respond($aiFeedback);

        } catch (\Exception $e) {
            return $this->failServerError('Processing Error: ' . $e->getMessage());
        }
    }

    private function readDocx($filePath) {
        $zip = new ZipArchive;
        $text = '';
        if ($zip->open($filePath) === true) {
            if (($index = $zip->locateName('word/document.xml')) !== false) {
                $data = $zip->getFromIndex($index);
                $data = str_replace('</w:t>', ' </w:t>', $data);
                $text = strip_tags($data);
            }
            $zip->close();
        }
        return $text;
    }

    private function gradeWithAI($resumeText, $jobDescription)
    {
        $apiKey = 'AIzaSyBXU0kgKwoqXHEZURmO6cPS1-TNJ25JqSw'; 
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=' . $apiKey;   
        $safeResume = json_encode(substr($resumeText, 0, 6000));
        $safeJobDesc = json_encode(substr($jobDescription, 0, 3000));

        $prompt = "YOU ARE A WORLD-CLASS APPLICANT TRACKING SYSTEM (ATS). ANALYZE THIS RESUME AGAINST THE JOB DESCRIPTION. OUTPUT ONLY RAW VALID JSON.
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
            "contents" => [["parts" => [["text" => $prompt]]]],
            "generationConfig" => ["responseMimeType" => "application/json"],
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
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
        curl_close($ch);

        $result = json_decode($response, true);

        if ($httpCode !== 200) {
            throw new \Exception('Gemini Error ' . $httpCode . ': ' . ($result['error']['message'] ?? 'Unknown Error'));
        }
        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            throw new \Exception('AI Refused to answer.');
        }

        $aiText = $result['candidates'][0]['content']['parts'][0]['text'];
        $aiText = str_replace(['```json', '```'], '', $aiText);
        
        return json_decode(trim($aiText), true);
    }
}