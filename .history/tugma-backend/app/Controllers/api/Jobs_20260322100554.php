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

    // 1. GET ALL JOBS FOR EMPLOYER
    public function employerJobs($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');
        $model = new EmployerJobModel();
        
        $jobs = $model->where('firebase_uid', $firebase_uid)->orderBy('created_at', 'DESC')->findAll();
        foreach ($jobs as &$job) {
            $job['skills'] = json_decode($job['skills'], true) ?? [];
        }
        return $this->respond($jobs);
    }

    // 2. CREATE NEW JOB
    public function create($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerJobModel();
        $file = $this->request->getFile('image');
        $imageUrl = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80'; 

        if ($file && $file->isValid() && !$file->hasMoved()) {
            $newName = $file->getRandomName();
            $file->move(FCPATH . 'uploads/jobs', $newName);
            $imageUrl = base_url('uploads/jobs/' . $newName);
        }

        $salaryInput = trim((string)$this->request->getPost('salary'));
        $finalSalary = empty($salaryInput) ? 'Unpaid / Volunteer' : $salaryInput;
        $skillsJson = $this->request->getPost('skills');

        $data = [
            'firebase_uid'  => $firebase_uid,
            'title'         => $this->request->getPost('title') ?? 'Untitled Job',
            'type'          => $this->request->getPost('type') ?? 'Internship',
            'work_setup'    => $this->request->getPost('work_setup') ?? 'Onsite',
            'location'      => $this->request->getPost('location') ?? 'Remote',
            'days_per_week' => $this->request->getPost('days_per_week') ?? 5,
            'hours_per_day' => $this->request->getPost('hours_per_day') ?? 8,
            'salary'        => $finalSalary,
            'deadline'      => $this->request->getPost('deadline') ?: null,
            'start_date'    => $this->request->getPost('start_date') ?: null,
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

    // 3. UPDATE EXISTING JOB
    public function updateJob($job_id = null)
    {
        if (!$job_id) return $this->fail('No Job ID provided');

        $model = new EmployerJobModel();
        $job = $model->find($job_id);
        
        if (!$job) return $this->failNotFound('Job not found');

        $file = $this->request->getFile('image');
        $imageUrl = $job['image_url'];

        if ($file && $file->isValid() && !$file->hasMoved()) {
            $newName = $file->getRandomName();
            $file->move(FCPATH . 'uploads/jobs', $newName);
            $imageUrl = base_url('uploads/jobs/' . $newName);
        }

        $salaryInput = trim((string)$this->request->getPost('salary'));
        $finalSalary = empty($salaryInput) ? 'Unpaid / Volunteer' : $salaryInput;
        $skillsJson = $this->request->getPost('skills');

        $data = [
            'title'         => $this->request->getPost('title') ?? $job['title'],
            'type'          => $this->request->getPost('type') ?? $job['type'],
            'work_setup'    => $this->request->getPost('work_setup') ?? $job['work_setup'],
            'location'      => $this->request->getPost('location') ?? $job['location'],
            'days_per_week' => $this->request->getPost('days_per_week') ?? $job['days_per_week'],
            'hours_per_day' => $this->request->getPost('hours_per_day') ?? $job['hours_per_day'],
            'salary'        => $finalSalary,
            'deadline'      => $this->request->getPost('deadline') ?: $job['deadline'],
            'start_date'    => $this->request->getPost('start_date') ?: $job['start_date'],
            'description'   => $this->request->getPost('description') ?? $job['description'],
            'skills'        => $skillsJson ? $skillsJson : $job['skills'],
            'status'        => $this->request->getPost('status') ?? $job['status'],
            'image_url'     => $imageUrl
        ];

        try {
            $model->update($job_id, $data);
            return $this->respond(['message' => 'Job updated successfully!']);
        } catch (\Exception $e) {
            return $this->failServerError('Database Error: ' . $e->getMessage());
        }
    }

    // 4. DELETE DRAFT JOB
    public function deleteJob($job_id = null)
    {
        if (!$job_id) return $this->fail('No Job ID provided');
        $model = new EmployerJobModel();
        
        $job = $model->find($job_id);
        if (!$job) return $this->failNotFound('Job not found');

        if ($job['status'] === 'Active') {
            return $this->fail('Active jobs cannot be deleted. Please close the listing instead.');
        }

        if ($model->delete($job_id)) {
            return $this->respondDeleted(['message' => 'Job deleted successfully']);
        }
        return $this->failServerError('Could not delete job');
    }

    // 5. READ: GET /api/jobs/active (FOR STUDENTS)
    public function getActiveJobs()
    {
        $model = new EmployerJobModel();
    
        $jobs = $model->where('status', 'Active')->orderBy('created_at', 'DESC')->findAll();

        foreach ($jobs as &$job) {
            $job['skills'] = json_decode($job['skills'], true) ?? [];
        }

        return $this->respond($jobs);
    }
}