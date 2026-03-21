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

    // 🔥 REFACTORED: Bulletproof Save / Upgrade Logic 🔥
    public function record()
    {
        try {
            $data = $this->request->getJSON(true);
            $db = \Config\Database::connect();
            $builder = $db->table('job_interactions');

            // 1. Find if ANY interaction exists for this user + job
            $existing = $builder->where('student_uid', $data['student_uid'])
                                ->where('job_id', $data['job_id'])
                                ->get()->getRowArray();

            // 2. If the user is just VIEWING the job
            if ($data['type'] === 'viewed') {
                if (!$existing) {
                    $builder->insert([
                        'student_uid' => $data['student_uid'],
                        'job_id' => $data['job_id'],
                        'interaction_type' => 'viewed',
                        'status' => '' // Empty string prevents the 500 DB Crash!
                    ]);
                }
                return $this->respond(['message' => 'View recorded']);
            }

            // 3. If the user is APPLYING for the job
            if ($data['type'] === 'applied') {
                if ($existing) {
                    // If they already applied, stop here.
                    if ($existing['interaction_type'] === 'applied') {
                        return $this->respond(['message' => 'Already applied']);
                    }
                    
                    // If they previously viewed it, UPGRADE the row to an application
                    $builder->where('id', $existing['id'])->update([
                        'interaction_type' => 'applied',
                        'status' => 'New Applicant'
                    ]);
                } else {
                    // If they never viewed it and just applied directly
                    $builder->insert([
                        'student_uid' => $data['student_uid'],
                        'job_id' => $data['job_id'],
                        'interaction_type' => 'applied',
                        'status' => 'New Applicant'
                    ]);
                }
                return $this->respond(['message' => 'Application successful']);
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
}