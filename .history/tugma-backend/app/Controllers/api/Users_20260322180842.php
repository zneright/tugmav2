<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // REGISTER NEW USER
    public function register()
    {
        try {
            $data = $this->request->getJSON(true);

            if (!isset($data['firebase_uid']) || !isset($data['email']) || !isset($data['role'])) {
                return $this->fail('Missing required fields');
            }

            $db = \Config\Database::connect();

            $insertData = [
                'firebase_uid' => $data['firebase_uid'],
                'email'        => $data['email'],
                'role'         => $data['role'],
                // Apply name mapping for ALL roles (Student, Employer, Admin)
                'first_name'   => $data['firstName'] ?? null,
                'last_name'    => $data['lastName'] ?? null,
            ];

            if ($db->fieldExists('profile_data', 'users')) {
                $insertData['profile_data'] = json_encode([]);
            }

            if ($data['role'] === 'employer') {
                $insertData['company_name'] = $data['companyName'] ?? null;
                $insertData['company_size'] = $data['companySize'] ?? null;
            }

            $db->table('users')->insert($insertData);

            if ($data['role'] === 'student') {
                 $db->table('student_profiles')->insert([
                     'firebase_uid' => $data['firebase_uid']
                 ]);
            }

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

    //GET USER ROLE & STATUS
    public function getRole($uid = null)
    {
        try {
            $db = \Config\Database::connect();
            $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRow();
            
            if ($user) {
                return $this->respond([
                    'role' => $user->role,
                    'status' => $user->status ?? 'Active' 
                ]);
            }
            return $this->failNotFound('User not found in MySQL');
            
        } catch (\Exception $e) {
            return $this->failServerError('ROLE FETCH Error: ' . $e->getMessage());
        }
    }

    // GET PROFILE
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
    public function deleteProfile($uid = null)
    {
        if (!$uid) {
            return $this->fail('User ID is required.');
        }

        try {
            $db = \Config\Database::connect();
            
            $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
            
            if (!$user) {
                return $this->failNotFound('User not found or already deleted.');
            }

            $studentProfile = $db->table('student_profiles')->where('firebase_uid', $uid)->get()->getRowArray();
            $employerProfile = $db->table('employer_profiles')->where('firebase_uid', $uid)->get()->getRowArray();
            
            $employerJobs = $db->table('employer_jobs')->where('firebase_uid', $uid)->get()->getResultArray();
            
            $jobInteractions = $db->table('job_interactions')->where('student_uid', $uid)->get()->getResultArray();
            $applications = $db->table('applications')->where('student_uid', $uid)->get()->getResultArray();
            $dtrLogs = $db->table('dtr_logs')->where('student_uid', $uid)->get()->getResultArray();
       
            $atsHistory = [];
            if ($db->tableExists('ats_history')) {
               
                 try {
                     $atsHistory = $db->table('ats_history')->where('firebase_uid', $uid)->get()->getResultArray();
                 } catch (\Exception $e) {
                     $atsHistory = ["error" => "Could not link ATS history to user."];
                 }
            }
            
            $messages = $db->table('messages')
                           ->where('sender_uid', $uid)
                           ->orWhere('receiver_uid', $uid)
                           ->get()->getResultArray();

            $notifications = $db->table('notifications')
                                ->where('user_uid', $uid)
                                ->orWhere('sender_uid', $uid)
                                ->get()->getResultArray();

            $comprehensiveArchive = [
                'student_profile'  => $studentProfile ?: null,
                'employer_profile' => $employerProfile ?: null,
                'employer_jobs'    => $employerJobs,
                'job_interactions' => $jobInteractions,
                'applications'     => $applications,
                'dtr_logs'         => $dtrLogs,
                'ats_history'      => $atsHistory, 
                'messages'         => $messages,
                'notifications'    => $notifications
            ];

            $archivedData = [
                'firebase_uid'  => $user['firebase_uid'],
                'email'         => $user['email'],
                'role'          => $user['role'],
                'first_name'    => $user['first_name'],
                'last_name'     => $user['last_name'],
                'profile_data'  => json_encode($comprehensiveArchive),
                'archived_at'   => date('Y-m-d H:i:s'),
                'reason'        => 'User initiated self-deletion'
            ];

            $db->transStart();

            $db->table('archived_users')->insert($archivedData);

            $db->table('student_profiles')->where('firebase_uid', $uid)->delete();
            $db->table('employer_profiles')->where('firebase_uid', $uid)->delete();
            $db->table('employer_jobs')->where('firebase_uid', $uid)->delete();
            
            // Student tied data
            $db->table('job_interactions')->where('student_uid', $uid)->delete();
            $db->table('applications')->where('student_uid', $uid)->delete();
            $db->table('dtr_logs')->where('student_uid', $uid)->delete();

            // --- NEW: Delete ATS History ---
            if ($db->tableExists('ats_history') && $db->fieldExists('firebase_uid', 'ats_history')) {
                $db->table('ats_history')->where('firebase_uid', $uid)->delete();
            }
            
            // Delete Messages
            $db->table('messages')
               ->groupStart()
                   ->where('sender_uid', $uid)
                   ->orWhere('receiver_uid', $uid)
               ->groupEnd()
               ->delete();
               
            // Delete Notifications
            $db->table('notifications')
               ->groupStart()
                   ->where('user_uid', $uid)
                   ->orWhere('sender_uid', $uid)
               ->groupEnd()
               ->delete();

            // Finally, delete the main user record
            $db->table('users')->where('firebase_uid', $uid)->delete();

            // Complete Transaction
            $db->transComplete();

            if ($db->transStatus() === false) {
                return $this->failServerError('Failed to archive and delete account. Database transaction rolled back.');
            }

            return $this->respondDeleted([
                'status' => 200,
                'message' => 'All user data successfully archived and completely removed from active records.'
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('DELETE Error: ' . $e->getMessage());
        }
    }
}