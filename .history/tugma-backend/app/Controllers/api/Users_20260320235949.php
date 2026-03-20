<?php namespace App\Controllers\Api;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // --- GET PROFILE (Unified Fetch) ---
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        
        // Join users (for names) with student_profiles (for course, skills, etc)
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

        // Map database snake_case to React camelCase
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
            'resumeData'         => $data['profile_data'] ?? '', // Your Base64 storage
            'profilePhoto'       => $data['profile_photo'] ?? '',
            'coverPhoto'         => $data['cover_photo'] ?? '',
            'education'          => !empty($data['education']) ? json_decode($data['education'], true) : null,
            'ojt'                => !empty($data['ojt_data']) ? json_decode($data['ojt_data'], true) : null,
            'skills'             => !empty($data['skills']) ? json_decode($data['skills'], true) : [],
            'languages'          => !empty($data['languages']) ? json_decode($data['languages'], true) : [],
            'preferredLocations' => !empty($data['preferred_locations']) ? json_decode($data['preferred_locations'], true) : [],
        ];

        return $this->respond($response);
    }

    // --- UPDATE PROFILE (Saves to both tables) ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        // 1. Update the 'users' table (Names)
        $userData = [
            'first_name' => $data['firstName'] ?? '',
            'last_name'  => $data['lastName'] ?? '',
        ];
        $db->table('users')->where('firebase_uid', $uid)->update($userData);

        // 2. Update the 'student_profiles' table
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
            'profile_data'        => $data['resumeData'] ?? null, // Storing Base64 here
        ];

        $profileExists = $db->table('student_profiles')->where('firebase_uid', $uid)->countAllResults();
        
        if ($profileExists > 0) {
            $db->table('student_profiles')->where('firebase_uid', $uid)->update($studentData);
        } else {
            $studentData['firebase_uid'] = $uid;
            $db->table('student_profiles')->insert($studentData);
        }

        return $this->respond(['message' => 'Profile synced successfully!']);
    }
}