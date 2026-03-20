<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    public function register()
    {
        $data = $this->request->getJSON(true); 

        if (!isset($data['firebase_uid']) || !isset($data['email']) || !isset($data['role'])) {
            return $this->fail('Missing required fields');
        }

        $insertData = [
            'firebase_uid' => $data['firebase_uid'],
            'email'        => $data['email'],
            'role'         => $data['role'],
        ];

        if ($data['role'] === 'student') {
            $insertData['first_name'] = $data['firstName'] ?? null;
            $insertData['last_name']  = $data['lastName'] ?? null;
        } elseif ($data['role'] === 'employer') {
            $insertData['first_name']   = $data['firstName'] ?? null;
            $insertData['last_name']    = $data['lastName'] ?? null;
            $insertData['company_name'] = $data['companyName'] ?? null;
            $insertData['company_size'] = $data['companySize'] ?? null;
        }

        $db = \Config\Database::connect();
        $db->table('users')->insert($insertData);

        if ($data['role'] === 'employer') {
            $profileModel = new EmployerProfileModel();
            
            $profileData = [
                'firebase_uid' => $data['firebase_uid'],
                'company_name' => $data['companyName'] ?? 'New Company',
                'company_size' => $data['companySize'] ?? '1-10',
                'tagline'      => '',
                'description'  => '',
                'perks'        => json_encode([]), 
                'email'        => $data['email'] 
            ];
            
            $profileModel->insert($profileData);
        }
        return $this->respondCreated(['message' => 'User created in MySQL successfully!']);
    }
    // Get user role by Firebase UID
    public function getRole($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
        
        if ($user) {
            return $this->respond(['role' => $user->role]);
        }
        
        return $this->failNotFound('User not found in MySQL');
    }
    // --- GET PROFILE ---
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        // Merge standard columns with the JSON data
        $profileData = $user['profile_data'] ? json_decode($user['profile_data'], true) : [];
        
        $response = array_merge([
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ], $profileData);

        return $this->respond($response);
    }

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