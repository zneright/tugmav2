<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Notifications extends ResourceController
{
    public function __construct()
    {
        // Standard Hackathon CORS bypass
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // Fetch all notifications for a specific user
    public function getUserNotifications($uid = null)
    {
        if (!$uid) return $this->fail('User UID is required');

        $db = \Config\Database::connect();
        
        try {
            $notifications = $db->table('notifications')
                ->where('user_uid', $uid)
                ->orderBy('created_at', 'DESC')
                ->get()
                ->getResultArray();

            return $this->respond($notifications);
        } catch (\Throwable $e) {
            // 🔥 FIXED: Catching \Throwable guarantees a JSON response instead of a 500 HTML crash
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Database crash',
                'message' => $e->getMessage(),
                'hint' => 'Did you create the notifications table in phpMyAdmin?'
            ]);
        }
    }

    // Mark a specific notification as read
    public function markAsRead($id = null)
    {
        if (!$id) return $this->fail('Notification ID required');

        $db = \Config\Database::connect();
        
        try {
            $db->table('notifications')->where('id', $id)->update(['is_read' => 1]);
            return $this->respond(['message' => 'Marked as read']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => $e->getMessage()]);
        }
    }

    // Mark ALL notifications for a user as read
    public function markAllAsRead($uid = null)
    {
        if (!$uid) return $this->fail('User UID required');

        $db = \Config\Database::connect();
        
        try {
            $db->table('notifications')->where('user_uid', $uid)->update(['is_read' => 1]);
            return $this->respond(['message' => 'All marked as read']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => $e->getMessage()]);
        }
    }

    // Used by employers to send manual notifications to their applicants
    public function sendToApplicants()
    {
        $data = $this->request->getJSON(true);
        if (!isset($data['employer_uid']) || !isset($data['title']) || !isset($data['message'])) {
            return $this->fail('Missing required fields');
        }

        $db = \Config\Database::connect();
        
        try {
            // Get all students who applied to this employer
            $builder = $db->table('job_interactions ji')
                ->select('ji.student_uid')
                ->join('employer_jobs ej', 'ej.id = ji.job_id')
                ->where('ej.firebase_uid', $data['employer_uid'])
                ->where('ji.interaction_type', 'applied');
                
            // Optional: Filter by specific job if provided
            if (!empty($data['job_id'])) {
                $builder->where('ji.job_id', $data['job_id']);
            }
            
            // Optional: Filter by status if provided (e.g. "Shortlisted")
            if (!empty($data['status_filter'])) {
                $builder->where('ji.status', $data['status_filter']);
            }

            $students = $builder->groupBy('ji.student_uid')->get()->getResultArray();

            if (empty($students)) {
                return $this->respond(['message' => 'No applicants found matching the criteria.', 'count' => 0]);
            }

            $insertData = [];
            foreach ($students as $student) {
                $insertData[] = [
                    'user_uid' => $student['student_uid'],
                    'title' => $data['title'],
                    'message' => $data['message'],
                    'type' => 'message',
                    'is_read' => 0
                ];
            }

            // Batch insert for performance
            $db->table('notifications')->insertBatch($insertData);

            return $this->respondCreated([
                'message' => 'Notifications sent successfully', 
                'count' => count($insertData)
            ]);

        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Database crash on Send',
                'message' => $e->getMessage()
            ]);
        }
    }
}