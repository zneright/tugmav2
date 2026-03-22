<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Dtr extends ResourceController
{
    public function __construct()
    {
        // Standard Hackathon CORS bypass
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // 🔥 1. FETCH ALL LOGS FOR A STUDENT 🔥
    public function getLogs($studentUid = null)
    {
        if (!$studentUid) return $this->fail('No student UID provided');

        $db = \Config\Database::connect();
        
        try {
            // Get logs ordered by newest first
            $logs = $db->table('dtr_logs')
                       ->where('student_uid', $studentUid)
                       ->orderBy('created_at', 'DESC') 
                       ->get()
                       ->getResultArray();

            // Format data exactly how the React frontend expects it
            $formattedLogs = array_map(function($log) {
                return [
                    'id' => $log['id'],
                    'date' => $log['date'],
                    'hoursLogged' => (int)$log['hoursLogged'],
                    'hoursCredited' => (int)$log['hoursCredited'],
                    'task' => $log['task'],
                    'isDouble' => (bool)$log['isDouble'] // Convert tinyint back to boolean
                ];
            }, $logs);

            return $this->respond($formattedLogs);

        } catch (\Throwable $e) {
            // Fail safe 500 error handler
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Database crash',
                'message' => $e->getMessage()
            ]);
        }
    }

    // 🔥 2. ADD A NEW DTR LOG 🔥
    public function addLog()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();

        // Safety check
        if (!isset($data['student_uid']) || !isset($data['hoursLogged']) || !isset($data['task'])) {
            return $this->fail('Missing required DTR data.');
        }

        try {
            $insertData = [
                'student_uid' => $data['student_uid'],
                'date' => $data['date'],
                'hoursLogged' => $data['hoursLogged'],
                'hoursCredited' => $data['hoursCredited'],
                'task' => $data['task'],
                'isDouble' => empty($data['isDouble']) ? 0 : 1 // Convert boolean to tinyint for MySQL
            ];

            // Save to database
            $db->table('dtr_logs')->insert($insertData);
            $newId = $db->insertID(); // Grab the auto-incremented ID
` $newLog = [
                'id' => $newId,
                'date' => $insertData['date'],
                'hoursLogged' => (int)$insertData['hoursLogged'],
                'hoursCredited' => (int)$insertData['hoursCredited'],
                'task' => $insertData['task'],
                'isDouble' => (bool)$insertData['isDouble']
            ];

            return $this->respondCreated($newLog);

        } catch (\Throwable $e) {
             return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Database crash',
                'message' => $e->getMessage()
            ]);
        }
    }
}