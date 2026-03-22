<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // ==========================================
    // 1. REGISTER NEW USER
    // ==========================================
    public function register()
    {
        try {
            $data = $this->request->getJSON(true);

            if (!isset($data['firebase_uid']) || !isset($data['email']) || !isset($data['role'])) {
                return $this->fail('Missing required fields');
            }

            $db = \Config\Database::connect();

            // Setup Base User Data
            $insertData = [
                'firebase_uid' => $data['firebase_uid'],
                'email'        => $data['email'],
                'role'         => $data['role'],
            ];

            // 🌟 SAFETY CHECK: If the old profile_data column is still in the users table, 
            // feed it an empty JSON array so MySQL doesn't reject the save.
            if ($db->fieldExists('profile_data', 'users')) {
                $insertData['profile_data'] = json_encode([]);
            }

            if ($data['role'] === 'student') {
                $insertData['first_name'] = $data['firstName'] ?? null;
                $insertData['last_name']  = $data['lastName'] ?? null;
            } elseif ($data['role'] === 'employer') {
                $insertData['first_name']   = $data['firstName'] ?? null;
                $insertData['last_name']    = $data['lastName'] ?? null;
                $insertData['company_name'] = $data['companyName'] ?? null;
                $insertData['company_size'] = $data['companySize'] ?? null;
            }

            // Insert into `users` table
            $db->table('users')->insert($insertData);

            // Pre-create Student Profile
            if ($data['role'] === 'student') {
                 $db->table('student_profiles')->insert([
                     'firebase_uid' => $data['firebase_uid']
                 ]);
            }

            // Pre-create Employer Profile
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
            
        } catch (\Exception $e) {
            return $this->failServerError('REGISTER Error: ' . $e->getMessage());
        }
    }

    // ==========================================
    // 2. GET USER ROLE
    // ==========================================
    public function getRole($uid = null)
    {
        try {
            $db = \Config\Database::connect();
            $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
            
            if ($user) {
                return $this->respond(['role' => $user->role]);
            }
            return $this->failNotFound('User not found in MySQL');
            
        } catch (\Exception $e) {
            return $this->failServerError('ROLE FETCH Error: ' . $e->getMessage());
        }
    }

    // ==========================================
    // 3. GET PROFILE
    public function getProfile($uid = null)
    {
        try {
            $db = \Config\Database::connect();
            
            $builder = $db->table('users');
            $builder->select('
                users.first_name, 
                users.last_name, 
                users.email, 
                users.role, 
                student_profiles.*
            ');
            $builder->join('student_profiles', 'student_profiles.firebase_uid = users.firebase_uid', 'left');
            $builder->where('users.firebase_uid', $uid);
            
            $data = $builder->get()->getRowArray();
            
            if (!$data) return $this->failNotFound('User not found');

            $response = [
                'firstName'          => $data['first_name'] ?? '',
                'lastName'           => $data['last_name'] ?? '',
                'email'              => $data['email'] ?? '',
                'role'               => $data['role'] ?? '',
                'title'              => $data['title'] ?? '',
                'course'             => $data['course'] ?? '',
                'classification'     => $data['classification'] ?? '',
                'address'            => $data['address'] ?? '',
                'expectedSalary'     => $data['expected_salary'] ?? '',
                'about'              => $data['about'] ?? '',
                'resumeName'         => $data['resume_name'] ?? '',
                'resumeData'         => $data['profile_data'] ?? '',
                'profilePhoto'       => $data['profile_photo'] ?? '',
                'coverPhoto'         => $data['cover_photo'] ?? '',
                'education'          => !empty($data['education']) ? json_decode($data['education'], true) : null,
                'ojt'                => !empty($data['ojt_data']) ? json_decode($data['ojt_data'], true) : null,
                'skills'             => !empty($data['skills']) ? json_decode($data['skills'], true) : [],
                'languages'          => !empty($data['languages']) ? json_decode($data['languages'], true) : [],
                'preferredLocations' => !empty($data['preferred_locations']) ? json_decode($data['preferred_locations'], true) : [],
            ];

            return $this->respond($response);

        } catch (\Exception $e) {
            return $this->failServerError('GET PROFILE Error: ' . $e->getMessage());
        }
    }

    // UPDATE PROFILE
    public function updateProfile($uid = null)
    {
        try {
            $data = $this->request->getJSON(true);
            if (!$data) return $this->fail('Invalid JSON payload sent from frontend.');

            $db = \Config\Database::connect();
            
            $userData = [
                'first_name' => $data['firstName'] ?? '',
                'last_name'  => $data['lastName'] ?? '',
            ];
            $db->table('users')->where('firebase_uid', $uid)->update($userData);

            $studentData = [
                'title'               => $data['title'] ?? '',
                'course'              => $data['course'] ?? '',
                'classification'      => $data['classification'] ?? '',
                'address'             => $data['address'] ?? '',
                'expected_salary'     => $data['expectedSalary'] ?? '',
                'about'               => $data['about'] ?? '',
                'education'           => json_encode($data['education'] ?? []),
                'ojt_data'            => json_encode($data['ojt'] ?? []),
                'skills'              => json_encode($data['skills'] ?? []),
                'languages'           => json_encode($data['languages'] ?? []),
                'preferred_locations' => json_encode($data['preferredLocations'] ?? []),
                'profile_photo'       => $data['profilePhoto'] ?? null,
                'cover_photo'         => $data['coverPhoto'] ?? null,
                'resume_name'         => $data['resumeName'] ?? null,
                'profile_data'        => $data['resumeData'] ?? null, 
            ];

            $profileExists = $db->table('student_profiles')->where('firebase_uid', $uid)->countAllResults();
            
            if ($profileExists > 0) {
                $db->table('student_profiles')->where('firebase_uid', $uid)->update($studentData);
            } else {
                $studentData['firebase_uid'] = $uid;
                $db->table('student_profiles')->insert($studentData);
            }

            return $this->respond(['message' => 'Profile synced successfully!']);

        } catch (\Exception $e) {
            return $this->failServerError('SAVE Error: ' . $e->getMessage());
        }
    }
}