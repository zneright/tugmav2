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
    // --- GET PROFILE ---
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        if (!$user) return $this->failNotFound('User not found');

        $studentModel = new \App\Models\StudentProfileModel();
        $profile = $studentModel->where('firebase_uid', $uid)->first();

        // Standard response
        $response = [
            'firstName' => $user['first_name'],
            'lastName'  => $user['last_name'],
            'email'     => $user['email'],
            'role'      => $user['role'],
        ];

        if ($profile) {
            $response['title'] = $profile['title'];
            $response['course'] = $profile['course'];
            $response['classification'] = $profile['classification'];
            $response['address'] = $profile['address'];
            $response['expectedSalary'] = $profile['expected_salary'];
            $response['about'] = $profile['about'];
            $response['resumeName'] = $profile['resume_name'];
            $response['resumeUrl']  = $profile['resume_url']; // 👈 Real URL
            $response['profilePhoto'] = $profile['profile_photo'];
            $response['coverPhoto'] = $profile['cover_photo'];
            
            // Decode JSON strings back into Objects/Arrays for React
            $response['education'] = json_decode($profile['education'], true) ?? [];
            $response['ojt'] = json_decode($profile['ojt_data'], true) ?? [];
            $response['skills'] = json_decode($profile['skills'], true) ?? [];
            $response['languages'] = json_decode($profile['languages'], true) ?? [];
            $response['preferredLocations'] = json_decode($profile['preferred_locations'], true) ?? [];
        }

        return $this->respond($response);
    }

    // --- UPDATE PROFILE (Handles Files) ---
    public function updateProfile($uid = null)
    {
        $studentModel = new \App\Models\StudentProfileModel();
        
        // Use getPost for FormData
        $data = [
            'title'           => $this->request->getPost('title'),
            'course'          => $this->request->getPost('course'),
            'classification'  => $this->request->getPost('classification'),
            'address'         => $this->request->getPost('address'),
            'expected_salary' => $this->request->getPost('expectedSalary'),
            'about'           => $this->request->getPost('about'),
            'education'       => $this->request->getPost('education'), 
            'ojt_data'        => $this->request->getPost('ojt'),       
            'skills'          => $this->request->getPost('skills'),    
            'languages'       => $this->request->getPost('languages'),
            'preferred_locations' => $this->request->getPost('preferredLocations'),
        ];

        $uploadPath = ROOTPATH . 'public/uploads/profiles/';
        if (!is_dir($uploadPath)) mkdir($uploadPath, 0777, true);

        // Handle Resume Upload
        $resumeFile = $this->request->getFile('resume');
        if ($resumeFile && $resumeFile->isValid() && !$resumeFile->hasMoved()) {
            $newName = $resumeFile->getRandomName();
            $resumeFile->move($uploadPath, $newName);
            $data['resume_name'] = $resumeFile->getClientName();
            $data['resume_url'] = base_url("uploads/profiles/$newName");
        }

        // Handle Profile Photo
        $profileImg = $this->request->getFile('profilePhotoFile');
        if ($profileImg && $profileImg->isValid()) {
            $newName = $profileImg->getRandomName();
            $profileImg->move($uploadPath, $newName);
            $data['profile_photo'] = base_url("uploads/profiles/$newName");
        }

        // Handle Cover Photo
        $coverImg = $this->request->getFile('coverPhotoFile');
        if ($coverImg && $coverImg->isValid()) {
            $newName = $coverImg->getRandomName();
            $coverImg->move($uploadPath, $newName);
            $data['cover_photo'] = base_url("uploads/profiles/$newName");
        }

        $existing = $studentModel->where('firebase_uid', $uid)->first();
        if ($existing) {
            $studentModel->update($existing['id'], $data);
        } else {
            $data['firebase_uid'] = $uid;
            $studentModel->insert($data);
        }

        return $this->respond(['message' => 'Success']);
    }
}