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
    public function updateProfile($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $db = \Config\Database::connect();
        
        // 1. We are using FormData, so we pull from getPost(), not getJSON()
        $firstName = $this->request->getPost('firstName');
        $lastName = $this->request->getPost('lastName');
        $title = $this->request->getPost('title');
        $address = $this->request->getPost('address');
        $classification = $this->request->getPost('classification');
        $course = $this->request->getPost('course');
        $expectedSalary = $this->request->getPost('expectedSalary');
        $about = $this->request->getPost('about');
        $profilePhoto = $this->request->getPost('profilePhoto');
        $coverPhoto = $this->request->getPost('coverPhoto');

        // These are sent as JSON strings via FormData, so we keep them as strings for the DB
        $education = $this->request->getPost('education');
        $ojt = $this->request->getPost('ojt');
        $skills = $this->request->getPost('skills');
        $languages = $this->request->getPost('languages');
        $preferredLocations = $this->request->getPost('preferredLocations');

        // 🔥 2. HANDLE THE REAL PHYSICAL RESUME UPLOAD 🔥
        $file = $this->request->getFile('resume');
        $resumeName = $this->request->getPost('resumeName'); // Fetch old name or new name

        if ($file && $file->isValid() && !$file->hasMoved()) {
            // Give it a clean, unique name to prevent overwriting
            $resumeName = time() . '_' . preg_replace('/[^a-zA-Z0-9.-]/', '_', $file->getClientName());
            
            // Move it to public/uploads/resumes
            $uploadPath = FCPATH . 'uploads/resumes/';
            if (!is_dir($uploadPath)) {
                mkdir($uploadPath, 0777, true);
            }
            $file->move($uploadPath, $resumeName);
        }

        // 3. Package data for the Database
        $data = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'title' => $title,
            'address' => $address,
            'location' => $address, // Keep legacy field synced if used
            'classification' => $classification,
            'course' => $course,
            'expected_salary' => $expectedSalary,
            'about' => $about,
            'education' => $education,
            'ojt_data' => $ojt,
            'skills' => $skills,
            'languages' => $languages,
            'preferred_locations' => $preferredLocations,
            'profile_photo_url' => $profilePhoto,
            'cover_photo_url' => $coverPhoto
        ];

        // Only update resume_name if a new one was actually uploaded
        if (!empty($resumeName)) {
            $data['resume_name'] = $resumeName;
        }

        try {
            // Update the users table
            $db->table('users')->where('firebase_uid', $firebase_uid)->update([
                'first_name' => $firstName,
                'last_name' => $lastName
            ]);

            // Update the student_profiles table
            $db->table('student_profiles')->where('firebase_uid', $firebase_uid)->update($data);

            return $this->respond(['message' => 'Profile updated successfully']);
        } catch (\Exception $e) {
            return $this->failServerError('Database Error: ' . $e->getMessage());
        }
    }
}