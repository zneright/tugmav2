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

    // Create a new job with Image Upload
    public function create($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerJobModel();

        // 1. Handle File Upload
        $file = $this->request->getFile('image');
        
        // Default placeholder image if they don't upload one
        $imageUrl = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80'; 

        if ($file && $file->isValid() && !$file->hasMoved()) {
            $newName = $file->getRandomName();
            // This will create an "uploads/jobs" folder inside your backend's "public" folder
            $file->move(FCPATH . 'uploads/jobs', $newName);
            $imageUrl = base_url('uploads/jobs/' . $newName);
        }

        // 2. Grab standard POST data
        $skillsJson = $this->request->getPost('skills');

        $data = [
            'firebase_uid'  => $firebase_uid,
            'title'         => $this->request->getPost('title') ?? 'Untitled Job',
            'type'          => 'Internship', // Hardcoded as requested
            'location'      => $this->request->getPost('location') ?? 'Remote',
            'days_per_week' => $this->request->getPost('days_per_week') ?? 5,
            'hours_per_day' => $this->request->getPost('hours_per_day') ?? 8,
            'salary'        => $this->request->getPost('salary') ?? 'Unspecified',
            'description'   => $this->request->getPost('description') ?? '',
            'skills'        => $skillsJson ? $skillsJson : json_encode([]),
            'status'        => $this->request->getPost('status') ?? 'Active',
            'image_url'     => $imageUrl
        ];

        try {
            $model->insert($data);
            return $this->respondCreated(['message' => 'Job created successfully!']);
        } catch (\Exception $e) {
            return $this->failServerError('Database Error: ' . $e->getMessage());
        }
    }
}