<?php namespace App\Controllers\Api;

use App\Models\EmployerProfileModel;
use App\Models\StudentProfileModel;
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

        $studentModel = new StudentProfileModel();
        $profile = $studentModel->where('firebase_uid', $uid)->first();

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
            $response['resumeUrl']  = $profile['resume_url'];
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

    // --- UPDATE PROFILE (Saves standard info to `users` and files to `student_profiles`) ---
    public function updateProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $postData = $this->request->getPost();

        if (empty($postData) && empty($_FILES)) {
            return $this->fail('No data received. Profile was NOT updated to prevent data loss.');
        }

        // 1. Update basic user details in the `users` table
        $userUpdate = [];
        if (isset($postData['firstName'])) $userUpdate['first_name'] = $postData['firstName'];
        if (isset($postData['lastName'])) $userUpdate['last_name'] = $postData['lastName'];
        if (!empty($userUpdate)) {
            $db->table('users')->where('firebase_uid', $uid)->update($userUpdate);
        }

        // 2. Setup Upload Directories
        $uploadPathResumes = FCPATH . 'uploads/resumes/';
        $uploadPathPhotos = FCPATH . 'uploads/photos/';
        if (!is_dir($uploadPathResumes)) mkdir($uploadPathResumes, 0777, true);
        if (!is_dir($uploadPathPhotos)) mkdir($uploadPathPhotos, 0777, true);

        // 3. Fetch existing profile to retain old data if some fields are missing
        $studentModel = new StudentProfileModel();
        $existingProfile = $studentModel->where('firebase_uid', $uid)->first() ?? [];

        // 4. Map the frontend data to your MySQL column names
        $profileUpdate = [
            'firebase_uid'        => $uid,
            'title'               => $postData['title'] ?? ($existingProfile['title'] ?? ''),
            'course'              => $postData['course'] ?? ($existingProfile['course'] ?? ''),
            'classification'      => $postData['classification'] ?? ($existingProfile['classification'] ?? ''),
            'address'             => $postData['address'] ?? ($existingProfile['address'] ?? ''),
            'expected_salary'     => $postData['expectedSalary'] ?? ($existingProfile['expected_salary'] ?? ''),
            'about'               => $postData['about'] ?? ($existingProfile['about'] ?? ''),
            'education'           => $postData['education'] ?? ($existingProfile['education'] ?? '[]'),
            'ojt_data'            => $postData['ojt'] ?? ($existingProfile['ojt_data'] ?? '{}'),
            'skills'              => $postData['skills'] ?? ($existingProfile['skills'] ?? '[]'),
            'languages'           => $postData['languages'] ?? ($existingProfile['languages'] ?? '[]'),
            'preferred_locations' => $postData['preferredLocations'] ?? ($existingProfile['preferred_locations'] ?? '[]'),
        ];

        // 5. Handle Resume Upload
        $resumeFile = $this->request->getFile('resume');
        if ($resumeFile && $resumeFile->isValid() && !$resumeFile->hasMoved()) {
            $newName = $resumeFile->getRandomName();
            $resumeFile->move($uploadPathResumes, $newName);
            $profileUpdate['resume_name'] = $resumeFile->getClientName();
            $profileUpdate['resume_url'] = base_url('uploads/resumes/' . $newName);
        }

        // 6. Handle Profile Photo Upload
        $profilePhoto = $this->request->getFile('profilePhotoFile');
        if ($profilePhoto && $profilePhoto->isValid() && !$profilePhoto->hasMoved()) {
            $newName = $profilePhoto->getRandomName();
            $profilePhoto->move($uploadPathPhotos, $newName);
            $profileUpdate['profile_photo'] = base_url('uploads/photos/' . $newName);
        }

        // 7. Handle Cover Photo Upload
        $coverPhoto = $this->request->getFile('coverPhotoFile');
        if ($coverPhoto && $coverPhoto->isValid() && !$coverPhoto->hasMoved()) {
            $newName = $coverPhoto->getRandomName();
            $coverPhoto->move($uploadPathPhotos, $newName);
            $profileUpdate['cover_photo'] = base_url('uploads/photos/' . $newName);
        }

        // 8. Insert or Update into student_profiles table
        if (!empty($existingProfile)) {
            $studentModel->update($existingProfile['id'], $profileUpdate);
        } else {
            $studentModel->insert($profileUpdate);
        }

        return $this->respond(['message' => 'Profile and files updated safely!']);
    }
}