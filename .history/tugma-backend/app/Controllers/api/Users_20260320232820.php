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

        // Initialize Employer Profile
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
        // Initialize Student Profile
        elseif ($data['role'] === 'student') {
            $studentModel = new StudentProfileModel();
            $studentModel->insert(['firebase_uid' => $data['firebase_uid']]);
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

        // Always return the baseline user table data
        $response = [
            'firstName' => $user['first_name'] ?? '',
            'lastName'  => $user['last_name'] ?? '',
            'email'     => $user['email'],
            'role'      => $user['role']
        ];

        if ($user['role'] === 'student') {
            $studentModel = new StudentProfileModel();
            $profile = $studentModel->where('firebase_uid', $uid)->first();

            if ($profile) {
                // Map snake_case database columns back to React's camelCase state
                $response = array_merge($response, [
                    'title'              => $profile['title'] ?? '',
                    'course'             => $profile['course'] ?? '',
                    'classification'     => $profile['classification'] ?? 'Information Technology & Computer Science',
                    'address'            => $profile['address'] ?? '',
                    'expectedSalary'     => $profile['expected_salary'] ?? '',
                    'about'              => $profile['about'] ?? '',
                    'resumeName'         => $profile['resume_name'] ?? '',
                    'profilePhoto'       => $profile['profile_photo'] ?? '',
                    'coverPhoto'         => $profile['cover_photo'] ?? '',
                    
                    // Decode database JSON strings back to React Arrays/Objects
                    'education'          => !empty($profile['education']) ? json_decode($profile['education'], true) : [],
                    'ojt'                => !empty($profile['ojt_data']) ? json_decode($profile['ojt_data'], true) : [],
                    'skills'             => !empty($profile['skills']) ? json_decode($profile['skills'], true) : [],
                    'languages'          => !empty($profile['languages']) ? json_decode($profile['languages'], true) : [],
                    'preferredLocations' => !empty($profile['preferred_locations']) ? json_decode($profile['preferred_locations'], true) : []
                ]);
            }
        } else {
            // Employer Fallback: parse the old JSON format
            $profileData = !empty($user['profile_data']) ? json_decode($user['profile_data'], true) : [];
            if (is_array($profileData)) {
                $response = array_merge($response, $profileData);
            }
        }

        return $this->respond($response);
    }

    // --- UPDATE PROFILE ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        // 1. Update the actual users table for First and Last Name
        $userUpdate = [];
        if (isset($data['firstName'])) $userUpdate['first_name'] = $data['firstName'];
        if (isset($data['lastName']))  $userUpdate['last_name'] = $data['lastName'];
        
        if (!empty($userUpdate)) {
            $db->table('users')->where('firebase_uid', $uid)->update($userUpdate);
        }

        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();

        // 2. Route Profile Data properly based on Role
        if ($user && $user['role'] === 'student') {
            $studentModel = new StudentProfileModel();
            $existing = $studentModel->where('firebase_uid', $uid)->first();

            // Map React camelCase back to DB snake_case
            $studentUpdate = [
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

                // Encode React arrays/objects into JSON for the database
                'education'           => isset($data['education']) ? json_encode($data['education']) : null,
                'ojt_data'            => isset($data['ojt']) ? json_encode($data['ojt']) : null,
                'skills'              => isset($data['skills']) ? json_encode($data['skills']) : null,
                'languages'           => isset($data['languages']) ? json_encode($data['languages']) : null,
                'preferred_locations' => isset($data['preferredLocations']) ? json_encode($data['preferredLocations']) : null,
            ];

            if ($existing) {
                $studentModel->update($existing['id'], $studentUpdate);
            } else {
                $studentModel->insert($studentUpdate);
            }
        } else {
            // Employer Fallback
            $jsonStore = $data;
            unset($jsonStore['firstName'], $jsonStore['lastName'], $jsonStore['email'], $jsonStore['role']);
            
            if ($db->fieldExists('profile_data', 'users')) {
                $db->table('users')->where('firebase_uid', $uid)->update(['profile_data' => json_encode($jsonStore)]);
            }
        }

        return $this->respond(['message' => 'Profile updated successfully']);
    }
}