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
        
        // Optional: Pre-create empty student profile
        if ($data['role'] === 'student') {
             $db->table('student_profiles')->insert([
                 'firebase_uid' => $data['firebase_uid']
             ]);
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
        
        // 1. Fetch base user info
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        if (!$user) return $this->failNotFound('User not found');

        $response = [
            'firstName' => $user['first_name'] ?? '',
            'lastName'  => $user['last_name'] ?? '',
            'email'     => $user['email'] ?? '',
            'role'      => $user['role'] ?? '',
            'school'    => $user['school'] ?? ''
        ];

        // 2. Fetch from student_profiles if role is student
        if ($user['role'] === 'student') {
            $studentProfile = $db->table('student_profiles')->where('firebase_uid', $uid)->get()->getRowArray();
            
            if ($studentProfile) {
                $response['title']          = $studentProfile['title'] ?? '';
                $response['course']         = $studentProfile['course'] ?? '';
                $response['classification'] = $studentProfile['classification'] ?? 'Information Technology & Computer Science';
                $response['address']        = $studentProfile['address'] ?? '';
                $response['expectedSalary'] = $studentProfile['expected_salary'] ?? '';
                $response['about']          = $studentProfile['about'] ?? '';
                $response['resumeName']     = $studentProfile['resume_name'] ?? '';
                $response['profilePhoto']   = $studentProfile['profile_photo'] ?? '';
                $response['coverPhoto']     = $studentProfile['cover_photo'] ?? '';
                
                // Parse JSON fields securely
                $response['education']          = !empty($studentProfile['education']) ? json_decode($studentProfile['education'], true) : [];
                $response['ojt']                = !empty($studentProfile['ojt_data']) ? json_decode($studentProfile['ojt_data'], true) : [];
                $response['skills']             = !empty($studentProfile['skills']) ? json_decode($studentProfile['skills'], true) : [];
                $response['languages']          = !empty($studentProfile['languages']) ? json_decode($studentProfile['languages'], true) : [];
                $response['preferredLocations'] = !empty($studentProfile['preferred_locations']) ? json_decode($studentProfile['preferred_locations'], true) : [];
            }
        } else {
            // Employer or other role fallback (using the old JSON structure if needed)
            $profileData = !empty($user['profile_data']) ? json_decode($user['profile_data'], true) : [];
            if (!is_array($profileData)) $profileData = [];
            $response = array_merge($profileData, $response);
        }

        return $this->respond($response);
    }

    // --- UPDATE PROFILE ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        if (!$user) return $this->failNotFound('User not found');

        // 1. Map Core User Data (users table)
        $userUpdate = [];
        if (isset($data['firstName'])) $userUpdate['first_name'] = $data['firstName'];
        if (isset($data['lastName']))  $userUpdate['last_name']  = $data['lastName'];
        if (isset($data['education']['college']['school'])) {
            $userUpdate['school'] = $data['education']['college']['school'];
        }

        if (!empty($userUpdate)) {
            $db->table('users')->where('firebase_uid', $uid)->update($userUpdate);
        }

        // 2. Map Extended Profile Data (student_profiles table)
        if ($user['role'] === 'student') {
            $studentUpdate = [];
            
            if (isset($data['title']))          $studentUpdate['title'] = $data['title'];
            if (isset($data['course']))         $studentUpdate['course'] = $data['course'];
            if (isset($data['classification'])) $studentUpdate['classification'] = $data['classification'];
            if (isset($data['address']))        $studentUpdate['address'] = $data['address'];
            if (isset($data['expectedSalary'])) $studentUpdate['expected_salary'] = $data['expectedSalary'];
            if (isset($data['about']))          $studentUpdate['about'] = $data['about'];
            if (isset($data['resumeName']))     $studentUpdate['resume_name'] = $data['resumeName'];
            if (isset($data['profilePhoto']))   $studentUpdate['profile_photo'] = $data['profilePhoto'];
            if (isset($data['coverPhoto']))     $studentUpdate['cover_photo'] = $data['coverPhoto'];
            
            // Convert array structures back to JSON for storage
            if (isset($data['education']))          $studentUpdate['education'] = json_encode($data['education']);
            if (isset($data['ojt']))                $studentUpdate['ojt_data'] = json_encode($data['ojt']);
            if (isset($data['skills']))             $studentUpdate['skills'] = json_encode($data['skills']);
            if (isset($data['languages']))          $studentUpdate['languages'] = json_encode($data['languages']);
            if (isset($data['preferredLocations'])) $studentUpdate['preferred_locations'] = json_encode($data['preferredLocations']);

            // Upsert: Check if profile exists, update if true, insert if false
            $existingProfile = $db->table('student_profiles')->where('firebase_uid', $uid)->get()->getRowArray();
            if ($existingProfile) {
                $db->table('student_profiles')->where('firebase_uid', $uid)->update($studentUpdate);
            } else {
                $studentUpdate['firebase_uid'] = $uid;
                $db->table('student_profiles')->insert($studentUpdate);
            }
        }

        return $this->respond(['message' => 'Profile updated successfully']);
    }
}