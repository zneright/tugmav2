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

        // Check if it already exists to prevent duplicates
        $existing = $model->where('student_uid', $data['student_uid'])
                          ->where('job_id', $data['job_id'])
                          ->where('interaction_type', $data['type'])
                          ->first();

        if (!$existing) {
            $model->insert([
                'student_uid' => $data['student_uid'],
                'job_id' => $data['job_id'],
                'interaction_type' => $data['type']
            ]);
        }
        return $this->respond(['message' => 'Interaction recorded']);
    }

    // 2. Get all interactions for a student
    public function getStudentInteractions($uid)
    {
        $model = new JobInteractionModel();
        $interactions = $model->where('student_uid', $uid)->findAll();

        $viewed = [];
        $applied = [];

        foreach ($interactions as $i) {
            if ($i['interaction_type'] === 'viewed') $viewed[] = (int)$i['job_id'];
            if ($i['interaction_type'] === 'applied') $applied[] = (int)$i['job_id'];
        }

        return $this->respond(['viewed' => $viewed, 'applied' => $applied]);
    }
}