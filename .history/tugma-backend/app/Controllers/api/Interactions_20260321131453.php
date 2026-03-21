<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\JobInteractionModel;

class Interactions extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // 1. Record an interaction (View or Apply)
   public function record()
    {
        $data = $this->request->getJSON(true);
        $model = new JobInteractionModel();

        // 1. Check if ANY interaction exists for this user and job
        $existing = $model->where('student_uid', $data['student_uid'])
                          ->where('job_id', $data['job_id'])
                          ->first();

        // 2. If it's a VIEW request
        if ($data['type'] === 'viewed') {
            if (!$existing) {
                $model->insert([
                    'student_uid' => $data['student_uid'],
                    'job_id' => $data['job_id'],
                    'interaction_type' => 'viewed',
                    'status' => null // 🔥 CRITICAL: Views should NOT have a status
                ]);
            }
            return $this->respond(['message' => 'View recorded']);
        }

        // 3. If it's an APPLY request
        if ($data['type'] === 'applied') {
            if ($existing) {
                // 🔥 UPGRADE the existing view to an application
                $model->update($existing['id'], [
                    'interaction_type' => 'applied',
                    'status' => 'New Applicant' // Only set status when applying
                ]);
            } else {
                $model->insert([
                    'student_uid' => $data['student_uid'],
                    'job_id' => $data['job_id'],
                    'interaction_type' => 'applied',
                    'status' => 'New Applicant'
                ]);
            }
            return $this->respond(['message' => 'Applied recorded']);
        }
    }
    // 2. Get all interactions for a student
    public function getStudentInteractions($uid)
    {
        $db = \Config\Database::connect();
        $builder = $db->table('job_interactions');
        $interactions = $builder->where('student_uid', $uid)->get()->getResultArray();

        $viewed = [];
        $applied = [];

        foreach ($interactions as $i) {
            // 🔥 CRITICAL FIX: Ensure these are forced to Integers
            $jobId = (int)$i['job_id']; 
            
            if ($i['interaction_type'] === 'viewed') {
                $viewed[] = $jobId;
            }
            if ($i['interaction_type'] === 'applied') {
                $applied[] = $jobId;
            }
        }

        return $this->respond([
            // array_values + array_unique cleans the list
            'viewed' => array_values(array_unique($viewed)), 
            'applied' => array_values(array_unique($applied))
        ]);
    }
}