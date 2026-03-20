<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // ... [Keep your register and getRole methods exactly the same] ...

    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        $profileData = $user['profile_data'] ? json_decode($user['profile_data'], true) : [];
        
        $response = array_merge([
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ], $profileData);

        return $this->respond($response);
    }

    // --- UPDATE PROFILE (FIXED FOR FILE UPLOADS) ---
    public function updateProfile($uid = null)
{
    $db = \Config\Database::connect();
    $studentModel = new \App\Models\StudentProfileModel();

    // 1. Check if user exists in the main users table
    $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
    if (!$user) return $this->failNotFound('User not found');

    // 2. Prepare Data from FormData
    $data = [
        'title'           => $this->request->getPost('title'),
        'course'          => $this->request->getPost('course'),
        'classification'  => $this->request->getPost('classification'),
        'address'         => $this->request->getPost('address'),
        'expected_salary' => $this->request->getPost('expectedSalary'),
        'about'           => $this->request->getPost('about'),
        'education'       => $this->request->getPost('education'), // Already stringified
        'ojt_data'        => $this->request->getPost('ojt'),       // Already stringified
        'skills'          => $this->request->getPost('skills'),    // Already stringified
        'languages'       => $this->request->getPost('languages'),
        'preferred_locations' => $this->request->getPost('preferredLocations'),
    ];

    // 3. HANDLE FILE UPLOADS (Actual Files)
    $uploadPath = ROOTPATH . 'public/uploads/profiles/';
    if (!is_dir($uploadPath)) mkdir($uploadPath, 0777, true);

    // Profile Photo
    $profileImg = $this->request->getFile('profilePhotoFile');
    if ($profileImg && $profileImg->isValid()) {
        $newName = $profileImg->getRandomName();
        $profileImg->move($uploadPath, $newName);
        $data['profile_photo'] = base_url("uploads/profiles/$newName");
    }

    // Cover Photo
    $coverImg = $this->request->getFile('coverPhotoFile');
    if ($coverImg && $coverImg->isValid()) {
        $newName = $coverImg->getRandomName();
        $coverImg->move($uploadPath, $newName);
        $data['cover_photo'] = base_url("uploads/profiles/$newName");
    }

    // Resume PDF
    $resumeFile = $this->request->getFile('resume');
    if ($resumeFile && $resumeFile->isValid()) {
        $newName = $resumeFile->getRandomName();
        $resumeFile->move($uploadPath, $newName);
        $data['resume_name'] = $resumeFile->getClientName();
        // We save the URL to the DB so the employer can click it
        $data['resume_url'] = base_url("uploads/profiles/$newName"); 
    }

    // 4. SAVE OR UPDATE
    $existing = $studentModel->where('firebase_uid', $uid)->first();
    
    if ($existing) {
        $studentModel->update($existing['id'], $data);
    } else {
        $data['firebase_uid'] = $uid;
        $studentModel->insert($data);
    }

    return $this->respond(['status' => 'success', 'message' => 'Profile updated']);
}
}