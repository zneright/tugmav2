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

            // 3. Work Setup Distribution
            $jobs = $db->table('employer_jobs')->select('work_setup')->where('status', 'Active')->get()->getResultArray();
            $workSetup = ['Remote' => 0, 'Onsite' => 0, 'Hybrid' => 0];
            foreach ($jobs as $j) {
                $setup = $j['work_setup'] ?: 'Onsite';
                if (isset($workSetup[$setup])) $workSetup[$setup]++;
            }

            // 4. Total OJT Hours Platform-wide
            $hoursQuery = $db->table('dtr_logs')->selectSum('hoursCredited')->get()->getRow();
            $totalHours = (int)($hoursQuery->hoursCredited ?? 0);

            // 5. Generate Real Activity Feed
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

            // 6. Latest Job
            $latestJob = $db->table('employer_jobs')->select('title')->orderBy('id', 'DESC')->limit(1)->get()->getRowArray();
            if ($latestJob) {
                array_unshift($activities, [
                    'user' => 'System',
                    'action' => 'New job "' . $latestJob['title'] . '" was published.',
                    'type' => 'system',
                    'time' => 'Just now'
                ]);
            }

            // Dynamic Chart Mock based on user counts
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
}