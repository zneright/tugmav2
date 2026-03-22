<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Messages extends ResourceController
{
    // 1. Get Inbox Conversations
    public function getConversations($uid = null)
    {
        $db = \Config\Database::connect();

        // Advanced SQL to group messages by user and get the latest message + unread counts
        $sql = "
            SELECT 
                u.firebase_uid as other_uid,
                u.first_name,
                u.last_name,
                (SELECT message FROM messages m2 WHERE (m2.sender_uid = u.firebase_uid AND m2.receiver_uid = ?) OR (m2.sender_uid = ? AND m2.receiver_uid = u.firebase_uid) ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages m2 WHERE (m2.sender_uid = u.firebase_uid AND m2.receiver_uid = ?) OR (m2.sender_uid = ? AND m2.receiver_uid = u.firebase_uid) ORDER BY created_at DESC LIMIT 1) as last_message_time,
                (SELECT COUNT(*) FROM messages m3 WHERE m3.sender_uid = u.firebase_uid AND m3.receiver_uid = ? AND m3.is_read = 0) as unread_count
            FROM users u
            WHERE u.firebase_uid IN (
                SELECT sender_uid FROM messages WHERE receiver_uid = ?
                UNION
                SELECT receiver_uid FROM messages WHERE sender_uid = ?
            )
            ORDER BY last_message_time DESC
        ";

        $query = $db->query($sql, [$uid, $uid, $uid, $uid, $uid, $uid, $uid]);
        $conversations = $query->getResultArray();

        $formatted = [];
        $colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600'];
        $i = 0;

        foreach ($conversations as $c) {
            // Format time nicely
            $timeStr = '';
            if ($c['last_message_time']) {
                $time = strtotime($c['last_message_time']);
                if (date('Y-m-d') == date('Y-m-d', $time)) $timeStr = date('h:i A', $time);
                else $timeStr = date('M d', $time);
            }

            $formatted[] = [
                'id' => $c['other_uid'], 
                'name' => trim(($c['first_name'] ?? 'Unknown') . ' ' . ($c['last_name'] ?? '')),
                'role' => 'Candidate', 
                'avatar' => !empty($c['first_name']) ? strtoupper(substr($c['first_name'], 0, 1)) : 'U',
                'lastMessage' => $c['last_message'],
                'time' => $timeStr,
                'unread' => (int)$c['unread_count'],
                'online' => true, // Keep 'online' static for hackathon visuals
                'color' => $colors[$i++ % count($colors)]
            ];
        }

        return $this->respond($formatted);
    }

    public function getChat($uid1 = null, $uid2 = null)
    {
        $db = \Config\Database::connect();

        $db->table('messages')
           ->where('sender_uid', $uid2)
           ->where('receiver_uid', $uid1)
           ->where('is_read', 0)
           ->update(['is_read' => 1]);

        // Get the full conversation
        $messages = $db->table('messages')
            ->groupStart()
                ->where('sender_uid', $uid1)
                ->where('receiver_uid', $uid2)
            ->groupEnd()
            ->orGroupStart()
                ->where('sender_uid', $uid2)
                ->where('receiver_uid', $uid1)
            ->groupEnd()
            ->orderBy('created_at', 'ASC')
            ->get()
            ->getResultArray();

        $formatted = [];
        foreach($messages as $m) {
            $formatted[] = [
                'id' => $m['id'],
                'sender' => $m['sender_uid'] === $uid1 ? 'me' : 'other',
                'text' => $m['message'],
                'time' => date('h:i A', strtotime($m['created_at']))
            ];
        }

        return $this->respond($formatted);
    }

    // Send a new message
    public function send()
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();

        if (empty($data['sender_uid']) || empty($data['receiver_uid']) || empty(trim($data['message']))) {
            return $this->fail('Invalid message data');
        }

        $insertData = [
            'sender_uid' => $data['sender_uid'],
            'receiver_uid' => $data['receiver_uid'],
            'message' => trim($data['message']),
            'is_read' => 0
        ];

        $db->table('messages')->insert($insertData);

        return $this->respondCreated(['message' => 'Sent']);
    }
}