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
    // --- UPDATE PROFILE (BULLETPROOF VERSION) ---
    public function updateProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $postData = $this->request->getPost();

        // 🚨 1. FAILSAFE: If PHP received absolutely nothing, abort. Do NOT wipe the DB.
        if (empty($postData) && empty($_FILES)) {
            return $this->fail('No data received. The profile was NOT updated to prevent data loss.');
        }

        // 2. Fetch existing profile so we can merge data instead of overwriting blindly
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        $existingProfile = $user['profile_data'] ? json_decode($user['profile_data'], true) : [];

        // 3. Decode the JSON arrays sent by React
        $jsonFields = ['education', 'ojt', 'skills', 'languages', 'preferredLocations'];
        foreach ($jsonFields as $field) {
            if (isset($postData[$field])) {
                $postData[$field] = json_decode($postData[$field], true);
            }
        }

        // 4. Handle File Uploads
        $uploadPathResumes = FCPATH . 'uploads/resumes/';
        $uploadPathPhotos = FCPATH . 'uploads/photos/';
        if (!is_dir($uploadPathResumes)) mkdir($uploadPathResumes, 0777, true);
        if (!is_dir($uploadPathPhotos)) mkdir($uploadPathPhotos, 0777, true);

        $resumeFile = $this->request->getFile('resume');
        if ($resumeFile && $resumeFile->isValid() && !$resumeFile->hasMoved()) {
            $newName = $resumeFile->getRandomName();
            $resumeFile->move($uploadPathResumes, $newName);
            $postData['resumeName'] = $resumeFile->getClientName();
            $postData['resumeUrl'] = base_url('uploads/resumes/' . $newName);
        }

        $profilePhoto = $this->request->getFile('profilePhotoFile');
        if ($profilePhoto && $profilePhoto->isValid() && !$profilePhoto->hasMoved()) {
            $newName = $profilePhoto->getRandomName();
            $profilePhoto->move($uploadPathPhotos, $newName);
            $postData['profilePhoto'] = base_url('uploads/photos/' . $newName);
        }

        $coverPhoto = $this->request->getFile('coverPhotoFile');
        if ($coverPhoto && $coverPhoto->isValid() && !$coverPhoto->hasMoved()) {
            $newName = $coverPhoto->getRandomName();
            $coverPhoto->move($uploadPathPhotos, $newName);
            $postData['coverPhoto'] = base_url('uploads/photos/' . $newName);
        }

        // 5. Extract standard columns
        $updateData = [];
        if (isset($postData['firstName'])) $updateData['first_name'] = $postData['firstName'];
        if (isset($postData['lastName'])) $updateData['last_name'] = $postData['lastName'];
        
        // Remove standard columns & method spoofing token so they don't clutter the JSON
        unset($postData['firstName'], $postData['lastName'], $postData['email'], $postData['role'], $postData['_method']);

        // 🛡️ 6. THE SAFETY NET: Merge new data over old data. Missing fields are kept, not erased.
        $finalProfileData = array_merge($existingProfile, $postData);

        // 7. Save safely to database
        $updateData['profile_data'] = json_encode($finalProfileData);
        $db->table('users')->where('firebase_uid', $uid)->update($updateData);

        return $this->respond(['message' => 'Profile updated safely!']);
    }
}