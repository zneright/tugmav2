<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Notifications extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // 1. Fetch INBOX (Received Notifications)
    public function getUserNotifications($uid = null)
    {
        if (!$uid) return $this->fail('User UID is required');
        $db = \Config\Database::connect();
        try {
            $notifications = $db->table('notifications')
                ->where('user_uid', $uid)
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();
            return $this->respond($notifications);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'DB error', 'message' => $e->getMessage()]);
        }
    }

    // 2. Fetch SENT (Grouped so it doesn't flood the screen)
    public function getSentNotifications($uid = null)
    {
        if (!$uid) return $this->fail('User UID is required');
        $db = \Config\Database::connect();
        try {
            // 🔥 FIX: Added MIN() and MAX() to prevent MySQL 'ONLY_FULL_GROUP_BY' crashes!
            $sent = $db->table('notifications')
                ->select('MIN(id) as id, title, message, MIN(type) as type, MAX(created_at) as created_at, COUNT(user_uid) as recipient_count')
                ->where('sender_uid', $uid)
                ->groupBy('title, message') // Groups identical bulk sends into 1 row safely
                ->orderBy('created_at', 'DESC')
                ->get()->getResultArray();
            
            return $this->respond($sent);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'DB error', 'message' => $e->getMessage()]);
        }
    }

    // 3. Send Bulk Notifications 
    public function sendToApplicants()
    {
        $data = $this->request->getJSON(true);
        if (!isset($data['employer_uid']) || !isset($data['title']) || !isset($data['message'])) return $this->fail('Missing fields');

        $db = \Config\Database::connect();
        try {
            $builder = $db->table('job_interactions ji')
                ->select('ji.student_uid')
                ->join('employer_jobs ej', 'ej.id = ji.job_id')
                ->where('ej.firebase_uid', $data['employer_uid'])
                ->where('ji.interaction_type', 'applied');
                
            // 🔥 FIX: Re-applied the trim() and like() methods so it NEVER fails to find "Hired" students
            if (!empty($data['job_id']) && $data['job_id'] !== 'ALL') {
                $builder->where('ji.job_id', trim($data['job_id']));
            }
            if (!empty($data['status_filter']) && $data['status_filter'] !== 'ALL') {
                $builder->like('ji.status', trim($data['status_filter'])); 
            }

            $students = $builder->groupBy('ji.student_uid')->get()->getResultArray();
            
            if (empty($students)) {
                return $this->respond(['message' => 'No applicants found matching the criteria. Sent to 0.', 'count' => 0]);
            }

            $insertData = [];
            foreach ($students as $student) {
                $insertData[] = [
                    'user_uid' => $student['student_uid'],
                    'sender_uid' => $data['employer_uid'], 
                    'title' => $data['title'],
                    'message' => $data['message'],
                    'type' => 'message',
                    'is_read' => 0
                ];
            }
            $db->table('notifications')->insertBatch($insertData);
            return $this->respondCreated(['message' => 'Sent successfully', 'count' => count($insertData)]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'DB error', 'message' => $e->getMessage()]);
        }
    }

    // 4. Mark as Read
    public function markAsRead($id = null)
    {
        $db = \Config\Database::connect();
        $db->table('notifications')->where('id', $id)->update(['is_read' => 1]);
        return $this->respond(['message' => 'Marked']);
    }

    public function markAllAsRead($uid = null)
    {
        $db = \Config\Database::connect();
        $db->table('notifications')->where('user_uid', $uid)->update(['is_read' => 1]);
        return $this->respond(['message' => 'All marked']);
    }

    // 5. Delete INBOX Notification
    public function deleteNotification($id = null)
    {
        $db = \Config\Database::connect();
        $db->table('notifications')->where('id', $id)->delete();
        return $this->respondDeleted(['message' => 'Deleted']);
    }

    // 6. Unsend / Delete SENT Blast (THIS REMOVES IT FOR EVERYONE)
    public function deleteSentBlast()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        try {
            $db->table('notifications')
               ->where('sender_uid', $data['sender_uid'])
               ->where('title', $data['title'])
               ->where('message', $data['message'])
               ->delete(); // This deletes it from EVERY student's inbox!
               
            return $this->respondDeleted(['message' => 'Blast unsent successfully']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'DB error', 'message' => $e->getMessage()]);
        }
    }
    public function getBroadcastRecipients()
    {
        // Get parameters from URL query string
        $title = $this->request->getGet('title');
        $message = $this->request->getGet('message');
        $sender_uid = $this->request->getGet('sender_uid');

        if (!$title || !$message || !$sender_uid) {
            return $this->fail('Missing parameters: Ensure title, message, and sender_uid are provided.');
        }

        $db = \Config\Database::connect();
        try {
            $builder = $db->table('notifications n');
            $builder->select('u.first_name, u.last_name, u.email, n.is_read, n.created_at');
            $builder->join('users u', 'u.firebase_uid = n.user_uid');
            
            // 🔥 Match based on the exact grouping used in the Sent tab
            $builder->where([
                'n.sender_uid' => $sender_uid,
                'n.title'      => $title,
                'n.message'    => $message
            ]);

            $recipients = $builder->get()->getResultArray();

            return $this->respond($recipients);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => $e->getMessage()]);
        }
    }
}