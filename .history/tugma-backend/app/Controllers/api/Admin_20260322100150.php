<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Admin extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    public function getDashboardStats()
    {
        $db = \Config\Database::connect();

        try {
            // 1. Basic Counts
            $studentCount = $db->table('users')->where('role', 'student')->countAllResults();
            $employerCount = $db->table('users')->where('role', 'employer')->countAllResults();
            $jobCount = $db->table('employer_jobs')->where('status', 'Active')->countAllResults();
            
            // 2. Interaction Data (Views, Applications, AI Scores, Funnel)
            $interactions = $db->table('job_interactions')->get()->getResultArray();
            $appCount = 0;
            $viewCount = 0;
            $hiredCount = 0;
            $totalAiScore = 0;
            $scoredApps = 0;
            
            $statusBreakdown = ['New Applicant' => 0, 'Reviewed' => 0, 'Shortlisted' => 0, 'Hired' => 0, 'Rejected' => 0];

            foreach ($interactions as $i) {
                if ($i['interaction_type'] === 'viewed') {
                    $viewCount++;
                } elseif ($i['interaction_type'] === 'applied') {
                    $appCount++;
                    $status = $i['status'] ?: 'New Applicant';
                    if (isset($statusBreakdown[$status])) {
                        $statusBreakdown[$status]++;
                    } else {
                        $statusBreakdown['New Applicant']++;
                    }
                    
                    if ($status === 'Hired') $hiredCount++;

                    if (!empty($i['ai_match_score'])) {
                        $totalAiScore += (float)$i['ai_match_score'];
                        $scoredApps++;
                    }
                }
            }
            
            $avgAiScore = $scoredApps > 0 ? round($totalAiScore / $scoredApps) : 0;

            // 3. Work Setup Distribution & Top Skills
            $jobs = $db->table('employer_jobs')->select('work_setup, skills')->where('status', 'Active')->get()->getResultArray();
            $workSetup = ['Remote' => 0, 'Onsite' => 0, 'Hybrid' => 0];
            $skillCounts = [];

            foreach ($jobs as $j) {
                // Setup
                $setup = $j['work_setup'] ?: 'Onsite';
                if (isset($workSetup[$setup])) $workSetup[$setup]++;

                // Skills
                $skillsRaw = json_decode($j['skills'], true);
                if (is_array($skillsRaw)) {
                    foreach ($skillsRaw as $skill) {
                        $s = trim($skill);
                        if (!isset($skillCounts[$s])) $skillCounts[$s] = 0;
                        $skillCounts[$s]++;
                    }
                }
            }
            arsort($skillCounts);
            $topSkills = array_slice($skillCounts, 0, 5, true); // Get top 5 skills

            $hoursQuery = $db->table('dtr_logs')->selectSum('hoursCredited')->get()->getRow();
            $totalHours = (int)($hoursQuery->hoursCredited ?? 0);

            $recentUsers = $db->table('users')
                              ->select('first_name, last_name, company_name, role, email')
                              ->orderBy('id', 'DESC')
                              ->limit(4)
                              ->get()->getResultArray();
            
            $activities = [];
            foreach ($recentUsers as $u) {
                if ($u['role'] === 'employer') {
                    $name = !empty($u['company_name']) ? $u['company_name'] : $u['email'];
                    $activities[] = [
                        'user' => $name,
                        'action' => 'registered as a new employer.',
                        'type' => 'employer',
                        'time' => 'Recently'
                    ];
                } else {
                    $name = trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
                    if (empty($name)) $name = 'A new student';
                    $activities[] = [
                        'user' => $name,
                        'action' => 'joined the platform to find OJT.',
                        'type' => 'student',
                        'time' => 'Recently'
                    ];
                }
            }

            $recentJobs = $db->table('employer_jobs ej')
                ->select('ej.title, ej.work_setup, ej.created_at, u.company_name')
                ->join('users u', 'u.firebase_uid = ej.firebase_uid', 'left')
                ->orderBy('ej.created_at', 'DESC')
                ->limit(4)
                ->get()->getResultArray();

            $base = max(10, $studentCount);
            $chartData = [
                round($base * 0.3), round($base * 0.45), round($base * 0.5), 
                round($base * 0.8), round($base * 1.1), round($base * 1.3), $base + 5
            ];

            return $this->respond([
                'stats' => [
                    'students' => $studentCount,
                    'employers' => $employerCount,
                    'jobs' => $jobCount,
                    'applications' => $appCount,
                    'views' => $viewCount,
                    'hired' => $hiredCount,
                    'avgAiScore' => $avgAiScore,
                    'totalHours' => $totalHours
                ],
                'distributions' => [
                    'workSetup' => $workSetup,
                    'appStatus' => $statusBreakdown
                ],
                'topSkills' => $topSkills,
                'recentJobs' => $recentJobs,
                'chartData' => $chartData,
                'activities' => array_slice($activities, 0, 5)
            ]);

        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to load Admin Stats',
                'message' => $e->getMessage()
            ]);
        }
    }
    public function getAllUsers()
    {
        $db = \Config\Database::connect();
        try {
            $users = $db->table('users')->orderBy('id', 'DESC')->get()->getResultArray();
            $formattedUsers = [];

            foreach ($users as $u) {
                $role = ucfirst($u['role']);
                $name = 'Unknown';
                
                if ($role === 'Employer') {
                    $name = !empty($u['company_name']) ? $u['company_name'] : trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
                    if (empty(trim($name))) $name = explode('@', $u['email'])[0]; // Fallback to email prefix
                } else {
                    $name = trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
                    if (empty(trim($name))) $name = explode('@', $u['email'])[0];
                }

                $joined = isset($u['created_at']) ? date('M d, Y', strtotime($u['created_at'])) : 'Recently';
                
                $status = isset($u['status']) ? ucfirst($u['status']) : 'Active';

                $formattedUsers[] = [
                    'id' => $u['firebase_uid'] ?? 'USR-' . $u['id'],
                    'db_id' => $u['id'],
                    'name' => $name,
                    'email' => $u['email'],
                    'role' => $role,
                    'status' => $status,
                    'joined' => $joined,
                    'avatar' => strtoupper(substr(trim($name), 0, 1))
                ];
            }
            
            return $this->respond($formattedUsers);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to load users', 
                'message' => $e->getMessage()
            ]);
        }
    }
    public function updateUserStatus($uid = null)
    {
        if (!$uid) return $this->fail('No UID provided');
        
        $db = \Config\Database::connect();
        $json = $this->request->getJSON(true);
        $newStatus = $json['status'] ?? 'Banned';

        try {
            if (!$db->fieldExists('status', 'users')) {
                $db->query("ALTER TABLE `users` ADD `status` VARCHAR(50) NOT NULL DEFAULT 'Active' AFTER `role`");
            }

            $db->table('users')->where('firebase_uid', $uid)->update(['status' => $newStatus]);
            
            return $this->respond(['message' => "User successfully marked as $newStatus"]);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to update status', 
                'message' => $e->getMessage()
            ]);
        }
    }

    public function deleteUser($uid = null)
    {
        if (!$uid) return $this->fail('No UID provided');
        
        $db = \Config\Database::connect();
        try {
            $db->table('users')->where('firebase_uid', $uid)->delete();
            $db->table('student_profiles')->where('firebase_uid', $uid)->delete();
            $db->table('employer_profiles')->where('firebase_uid', $uid)->delete();
            
            return $this->respondDeleted(['message' => 'User deleted permanently']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to delete user', 
                'message' => $e->getMessage()
            ]);
        }
    }
    public function getSupportTickets()
    {
        $db = \Config\Database::connect();
        
        try {
            $tickets = $db->table('notifications n')
                ->select('
                    n.id as ticket_id, 
                    n.title as subject, 
                    n.message, 
                    n.is_read, 
                    n.created_at,
                    u.firebase_uid,
                    u.first_name, 
                    u.last_name, 
                    u.company_name, 
                    u.email, 
                    u.role
                ')
                ->join('users u', 'u.firebase_uid = n.sender_uid', 'left')
                ->where('n.type', 'ticket')
                ->orderBy('n.is_read', 'ASC')
                ->orderBy('n.created_at', 'DESC')
                ->get()->getResultArray();

            $formattedTickets = [];
            foreach ($tickets as $t) {
                $name = 'Unknown User';
                if ($t['role'] === 'employer') {
                    $name = !empty($t['company_name']) ? $t['company_name'] : $t['email'];
                } else {
                    $name = trim(($t['first_name'] ?? '') . ' ' . ($t['last_name'] ?? ''));
                    if (empty($name)) $name = $t['email'];
                }

                $formattedTickets[] = [
                    'id' => 'TK-' . str_pad($t['ticket_id'], 4, '0', STR_PAD_LEFT),
                    'db_id' => $t['ticket_id'],
                    
                    'firebase_uid' => $t['firebase_uid'], 
                    
                    'user' => $name,
                    'email' => $t['email'],
                    'role' => ucfirst($t['role'] ?? 'User'),
                    'subject' => str_replace('Support Ticket: ', '', $t['subject']),
                    'message' => $t['message'],
                    'status' => $t['is_read'] == 1 ? 'Closed' : 'Open',
                    'created_at' => $t['created_at']
                ];
            }

            return $this->respond($formattedTickets);
            
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to load tickets', 
                'message' => $e->getMessage()
            ]);
        }
    }

    public function resolveTicket($ticket_id = null)
    {
        if (!$ticket_id) return $this->fail('No Ticket ID provided');
        
        $db = \Config\Database::connect();
        try {
            $db->table('notifications')->where('id', $ticket_id)->update(['is_read' => 1]);
            return $this->respond(['message' => 'Ticket resolved successfully']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to resolve ticket', 
                'message' => $e->getMessage()
            ]);
        }
    }
    public function replyTicket($ticket_id = null)
    {
        if (!$ticket_id) return $this->fail('No Ticket ID provided');
        
        $db = \Config\Database::connect();
        $json = $this->request->getJSON(true);
        
        $receiverUid = $json['receiver_uid'] ?? '';
        $subject = $json['subject'] ?? 'Support Ticket';
        $replyMessage = $json['message'] ?? '';

        if (empty($receiverUid) || empty($replyMessage)) {
            return $this->fail('Missing reply details');
        }

        try {
            $db->table('notifications')->insert([
                'user_uid'   => $receiverUid,
                'sender_uid' => 'ADMIN_SYSTEM', 
                'title'      => 'Support Response: ' . $subject,
                'message'    => $replyMessage,
                'type'       => 'alert', 
                'is_read'    => 0
            ]);

            $db->table('notifications')->where('id', $ticket_id)->update(['is_read' => 1]);
            
            return $this->respond(['message' => 'Reply sent to user successfully']);
            
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'error' => 'Failed to record reply', 
                'message' => $e->getMessage()
            ]);
        }
    }

    public function getAuditLogs()
    {
        $db = \Config\Database::connect();
        try {
            if (!$db->tableExists('audit_logs')) {
                $db->query("CREATE TABLE `audit_logs` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_uid` VARCHAR(255) NULL,
                    `action` VARCHAR(255) NOT NULL,
                    `details` TEXT NULL,
                    `ip_address` VARCHAR(50) NULL,
                    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
                )");
            }

            $logs = $db->table('audit_logs a')
                ->select('a.*, u.first_name, u.last_name, u.role, u.email, u.company_name')
                ->join('users u', 'u.firebase_uid = a.user_uid', 'left')
                ->orderBy('a.created_at', 'DESC')
                ->limit(100)
                ->get()->getResultArray();

            $formattedLogs = [];
            foreach ($logs as $log) {
                $name = 'System/Guest';
                if (!empty($log['role'])) {
                    if ($log['role'] === 'employer') {
                        $name = !empty($log['company_name']) ? $log['company_name'] : $log['email'];
                    } else {
                        $name = trim(($log['first_name'] ?? '') . ' ' . ($log['last_name'] ?? ''));
                        if (empty(trim($name))) $name = explode('@', $log['email'])[0];
                    }
                }

                $formattedLogs[] = [
                    'id' => 'LOG-' . $log['id'],
                    'uid' => $log['user_uid'],
                    'user_name' => $name,
                    'role' => ucfirst($log['role'] ?? 'System'),
                    'action' => $log['action'],
                    'details' => $log['details'],
                    'timestamp' => $log['created_at']
                ];
            }

            return $this->respond($formattedLogs);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'DB Error', 'message' => $e->getMessage()]);
        }
    }

    public function recordLog()
    {
        $db = \Config\Database::connect();
        $json = $this->request->getJSON(true);
        
        try {
            $db->table('audit_logs')->insert([
                'user_uid' => $json['uid'] ?? 'SYSTEM',
                'action'   => $json['action'] ?? 'Unknown Action',
                'details'  => $json['details'] ?? '',
                'ip_address' => $this->request->getIPAddress()
            ]);
            return $this->respondCreated(['message' => 'Action logged']);
        } catch (\Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON(['error' => 'Log failed', 'message' => $e->getMessage()]);
        }
    }
}