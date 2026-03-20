<?php namespace App\Controllers\Api;

use App\Models\UserModel;
use App\Models\EmployerProfileModel;
use App\Models\StudentProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $format = 'json';

    // --- 1. REGISTER USER ---
    public function register()
    {
        $data = $this->request->getJSON(true); 

        if (!isset($data['firebase_uid']) || !isset($data['email']) || !isset($data['role'])) {
            return $this->fail('Missing required fields');
        }

        $db = \Config\Database::connect();
        
        // 1. Insert into base 'users' table
        $insertData = [
            'firebase_uid' => $data['firebase_uid'],
            'email'        => $data['email'],
            'role'         => $data['role'],
            'first_name'   => $data['firstName'] ?? null,
            'last_name'    => $data['lastName'] ?? null,
        ];
        
        if ($data['role'] === 'employer') {
            $insertData['company_name'] = $data['companyName'] ?? null;
            $insertData['company_size'] = $data['companySize'] ?? null;
        }

        $db->table('users')->insert($insertData);

        // 2. Setup Specific Profiles based on Role
        if ($data['role'] === 'employer') {
            $profileModel = new EmployerProfileModel();
            $profileModel->insert([
                'firebase_uid' => $data['firebase_uid'],
                'company_name' => $data['companyName'] ?? 'New Company',
                'company_size' => $data['companySize'] ?? '1-10',
                'tagline'      => '',
                'description'  => '',
                'perks'        => json_encode([]), 
                'email'        => $data['email'] 
            ]);
        } 
        else if ($data['role'] === 'student') {
            // 👇 NEW: Create empty Student Profile 👇
            $studentModel = new StudentProfileModel();
            $studentModel->insert([
                'firebase_uid'        => $data['firebase_uid'],
                'classification'      => 'Information Technology & Computer Science',
                'ojt_data'            => json_encode(['status' => 'Actively Looking', 'requiredHours' => 450, 'completedHours' => 0]),
                'education'           => json_encode(['elementary' => '', 'highSchool' => '', 'seniorHighSchool' => '', 'college' => '']),
                'skills'              => json_encode([]),
                'languages'           => json_encode([]),
                'preferred_locations' => json_encode([])
            ]);
        }

        return $this->respondCreated(['message' => 'User created successfully!']);
    }

    // --- 2. GET USER ROLE ---
    public function getRole($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
        
        if ($user) return $this->respond(['role' => $user->role]);
        return $this->failNotFound('User not found');
    }

    // --- 3. GET PROFILE ---
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        $response = [
            'firstName' => $user['first_name'],
            'lastName'  => $user['last_name'],
            'email'     => $user['email'],
            'role'      => $user['role']
        ];

        // Fetch from the new Student Table
        if ($user['role'] === 'student') {
            $studentModel = new \App\Models\StudentProfileModel();
            $profile = $studentModel->where('firebase_uid', $uid)->first();

            if ($profile) {
                $response['title'] = $profile['title'];
                $response['course'] = $profile['course'];
                $response['classification'] = $profile['classification'];
                $response['address'] = $profile['address'];
                $response['expectedSalary'] = $profile['expected_salary'];
                $response['about'] = $profile['about'];
                $response['resumeName'] = $profile['resume_name'];
                $response['profilePhoto'] = $profile['profile_photo'];
                $response['coverPhoto'] = $profile['cover_photo'];
                
                // 👇 THE FIX: Aggressive JSON Decoding 👇
                // 1. Decode OJT Data
                $ojt = json_decode($profile['ojt_data'], true);
                if (is_string($ojt)) $ojt = json_decode($ojt, true); // Catch double-encoding
                $response['ojt'] = is_array($ojt) ? $ojt : ['requiredHours' => 450];

                // 2. Decode Skills
                $skills = json_decode($profile['skills'], true);
                if (is_string($skills)) $skills = json_decode($skills, true);
                $response['skills'] = is_array($skills) ? $skills : [];

                // 3. Decode Languages & Locations
                $langs = json_decode($profile['languages'], true);
                if (is_string($langs)) $langs = json_decode($langs, true);
                $response['languages'] = is_array($langs) ? $langs : [];

                $locs = json_decode($profile['preferred_locations'], true);
                if (is_string($locs)) $locs = json_decode($locs, true);
                $response['preferredLocations'] = is_array($locs) ? $locs : [];
            }
        }

        return $this->respond($response);
    }

    // --- 4. UPDATE PROFILE ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        // 1. Update basic users table
        $userUpdate = [];
        if (isset($data['firstName'])) $userUpdate['first_name'] = $data['firstName'];
        if (isset($data['lastName']))  $userUpdate['last_name'] = $data['lastName'];
        
        if (!empty($userUpdate)) {
            $db->table('users')->where('firebase_uid', $uid)->update($userUpdate);
        }

        // 2. Determine Role and update specific table
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
        
        if ($user && $user->role === 'student') {
            $studentModel = new StudentProfileModel();
            $existing = $studentModel->where('firebase_uid', $uid)->first();

            $profileUpdate = [
                'firebase_uid'        => $uid,
                'title'               => $data['title'] ?? '',
                'course'              => $data['course'] ?? '',
                'classification'      => $data['classification'] ?? '',
                'address'             => $data['address'] ?? '',
                'expected_salary'     => $data['expectedSalary'] ?? '',
                'about'               => $data['about'] ?? '',
                'resume_name'         => $data['resumeName'] ?? '',
                'profile_photo'       => $data['profilePhoto'] ?? '',
                'cover_photo'         => $data['coverPhoto'] ?? '',
                'education'           => isset($data['education']) ? json_encode($data['education']) : json_encode([]),
                'ojt_data'            => isset($data['ojt']) ? json_encode($data['ojt']) : json_encode(['requiredHours' => 450]),
                'skills'              => isset($data['skills']) ? json_encode($data['skills']) : json_encode([]),
                'languages'           => isset($data['languages']) ? json_encode($data['languages']) : json_encode([]),
                'preferred_locations' => isset($data['preferredLocations']) ? json_encode($data['preferredLocations']) : json_encode([])
            ];

            if ($existing) {
                $studentModel->update($existing['id'], $profileUpdate);
            } else {
                $studentModel->insert($profileUpdate);
            }
        }

        return $this->respond(['message' => 'Profile updated successfully']);
    }
}