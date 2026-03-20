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

        // 1. Check if they already have an 'applied' status (this is the highest level)
        $hasApplied = $model->where('student_uid', $data['student_uid'])
                            ->where('job_id', $data['job_id'])
                            ->where('interaction_type', 'applied')
                            ->first();

        if ($hasApplied) {
            return $this->respond(['message' => 'Already applied']);
        }

        // 2. If they are just 'viewing', check if a 'viewed' row exists
        $existingView = $model->where('student_uid', $data['student_uid'])
                              ->where('job_id', $data['job_id'])
                              ->where('interaction_type', 'viewed')
                              ->first();

        if ($data['type'] === 'viewed') {
            if (!$existingView) {
                $model->insert([
                    'student_uid' => $data['student_uid'],
                    'job_id' => $data['job_id'],
                    'interaction_type' => 'viewed'
                ]);
            }
            return $this->respond(['message' => 'Viewed recorded']);
        }

        // 3. If they are 'applying', either update the 'view' row or insert new 'applied' row
        if ($data['type'] === 'applied') {
            if ($existingView) {
                // Turn the view into an application
                $model->update($existingView['id'], [
                    'interaction_type' => 'applied',
                    'status' => 'New Applicant'
                ]);
            } else {
                $model->insert([
                    'student_uid' => $data['student_uid'],
                    'job_id' => $data['job_id'],
                    'interaction_type' => 'applied',
                    'status' => 'New Applicant'
                ]);
            }
            return $this->respond(['message' => 'Application recorded']);
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