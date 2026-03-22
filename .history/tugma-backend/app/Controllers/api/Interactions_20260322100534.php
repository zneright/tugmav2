<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Interactions extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    public function record()
    {
        try {
            $data = $this->request->getJSON(true);
            $db = \Config\Database::connect();
            $builder = $db->table('job_interactions');

            // Check if they already applied
            $hasApplied = $builder->where('student_uid', $data['student_uid'])
                                  ->where('job_id', $data['job_id'])
                                  ->where('interaction_type', 'applied')
                                  ->get()->getRowArray();

            if ($hasApplied) {
                return $this->respond(['message' => 'Already applied']);
            }

            // Check if a view already exists
            $existingView = $builder->where('student_uid', $data['student_uid'])
                                    ->where('job_id', $data['job_id'])
                                    ->where('interaction_type', 'viewed')
                                    ->get()->getRowArray();

            if ($data['type'] === 'viewed') {
                if (!$existingView) {
                    $builder->insert([
                        'student_uid' => $data['student_uid'],
                        'job_id' => $data['job_id'],
                        'interaction_type' => 'viewed',
                        'status' => ''
                    ]);
                }
                return $this->respond(['message' => 'View recorded']);
            }

            if ($data['type'] === 'applied') {
                if ($existingView) {
                    $builder->where('id', $existingView['id'])->update([
                        'interaction_type' => 'applied',
                        'status' => 'New Applicant'
                    ]);
                } else {
                    $builder->insert([
                        'student_uid' => $data['student_uid'],
                        'job_id' => $data['job_id'],
                        'interaction_type' => 'applied',
                        'status' => 'New Applicant'
                    ]);
                }
                return $this->respond(['message' => 'Application recorded']);
            }

        } catch (\Throwable $e) {
            return $this->failServerError('DB CRASH: ' . $e->getMessage());
        }
    }

    // GET ALL INTERACTIONS
    public function getStudentInteractions($uid)
    {
        $db = \Config\Database::connect();
        $interactions = $db->table('job_interactions')->where('student_uid', $uid)->get()->getResultArray();

        $viewed = [];
        $applied = [];

        foreach ($interactions as $i) {
            $jobId = (int)$i['job_id']; 
            if ($i['interaction_type'] === 'viewed') $viewed[] = $jobId;
            if ($i['interaction_type'] === 'applied') $applied[] = $jobId;
        }

        return $this->respond([
            'viewed' => array_values(array_unique($viewed)), 
            'applied' => array_values(array_unique($applied))
        ]);
    }

    // 3.GET DASHBOARD STATS 
    public function getDashboardStats($studentUid = null)
    {
        $db = \Config\Database::connect();

        $statsRaw = $db->table('job_interactions')
            ->select('status, interaction_type, COUNT(*) as total')
            ->where('student_uid', $studentUid)
            ->groupBy('status, interaction_type')
            ->get()
            ->getResultArray();

        $stats = [
            'applied' => 0, 'viewed' => 0, 'shortlisted' => 0,
            'hired' => 0, 'declined' => 0, 'pending' => 0, 'reviewed' => 0
        ];

        foreach ($statsRaw as $row) {
            if ($row['interaction_type'] === 'viewed') {
                $stats['viewed'] += (int)$row['total'];
            } else {
                $stats['applied'] += (int)$row['total'];
                
                if ($row['status'] === 'Shortlisted') $stats['shortlisted'] += (int)$row['total'];
                if ($row['status'] === 'Hired') $stats['hired'] += (int)$row['total'];
                if ($row['status'] === 'Rejected') $stats['declined'] += (int)$row['total'];
                if ($row['status'] === 'Reviewed') $stats['reviewed'] += (int)$row['total'];
                if ($row['status'] === 'New Applicant') $stats['pending'] += (int)$row['total'];
            }
        }

        return $this->respond($stats);
    }
}