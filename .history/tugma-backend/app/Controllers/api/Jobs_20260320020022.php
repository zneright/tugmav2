<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\EmployerJobModel;

class Jobs extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    // Get all jobs for a specific employer
    public function employerJobs($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerJobModel();
        // Get jobs, newest first
        $jobs = $model->where('firebase_uid', $firebase_uid)->orderBy('created_at', 'DESC')->findAll();

        // Decode JSON skills for React
        foreach ($jobs as &$job) {
            $job['skills'] = json_decode($job['skills'], true) ?? [];
        }

        return $this->respond($jobs);
    }

    // Create a new job
    public function create($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerJobModel();
        $json = $this->request->getJSON(true);

        $data = [
            'firebase_uid'  => $firebase_uid,
            'title'         => $json['title'] ?? 'Untitled Job',
            'type'          => $json['type'] ?? 'Full-time',
            'location'      => $json['location'] ?? 'Remote',
            'days_per_week' => $json['days_per_week'] ?? 5, // 👈 ADD THIS
            'hours_per_day' => $json['hours_per_day'] ?? 8,
            'salary'        => $json['salary'] ?? 'Unspecified',
            'description'   => $json['description'] ?? '',
            'skills'        => isset($json['skills']) ? json_encode($json['skills']) : json_encode([]),
            'status'        => $json['status'] ?? 'Active',
            'image_url'     => $json['image_url'] ?? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80'
        ];

        $model->insert($data);
        return $this->respondCreated(['message' => 'Job created successfully!']);
    }
}