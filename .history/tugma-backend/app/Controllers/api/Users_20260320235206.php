<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // --- GET PROFILE (With Join) ---
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        
        // Join users with student_profiles based on firebase_uid
        $builder = $db->table('users');
        $builder->select('users.*, student_profiles.*');
        $builder->join('student_profiles', 'student_profiles.firebase_uid = users.firebase_uid', 'left');
        $builder->where('users.firebase_uid', $uid);
        
        $user = $builder->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        // Prepare the response to match your React state structure
        $response = [
            'firstName'          => $user['first_name'] ?? '',
            'lastName'           => $user['last_name'] ?? '',
            'email'              => $user['email'] ?? '',
            'role'               => $user['role'] ?? '',
            'title'              => $user['title'] ?? '',
            'course'             => $user['course'] ?? '',
            'classification'     => $user['classification'] ?? '',
            'address'            => $user['address'] ?? '',
            'expectedSalary'     => $user['expected_salary'] ?? '',
            'about'              => $user['about'] ?? '',
            'resumeName'         => $user['resume_name'] ?? '',
            'resumeData'         => $user['profile_data'] ?? '', // Using profile_data column for base64 if needed
            'profilePhoto'       => $user['profile_photo'] ?? '',
            'coverPhoto'         => $user['cover_photo'] ?? '',
            'education'          => !empty($user['education']) ? json_decode($user['education'], true) : null,
            'ojt'                => !empty($user['ojt_data']) ? json_decode($user['ojt_data'], true) : null,
            'skills'             => !empty($user['skills']) ? json_decode($user['skills'], true) : [],
            'languages'          => !empty($user['languages']) ? json_decode($user['languages'], true) : [],
            'preferredLocations' => !empty($user['preferred_locations']) ? json_decode($user['preferred_locations'], true) : [],
        ];

        return $this->respond($response);
    }

    // --- UPDATE PROFILE (Update both tables) ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        // 1. Update 'users' table (Names)
        $userData = [
            'first_name' => $data['firstName'] ?? '',
            'last_name'  => $data['lastName'] ?? '',
        ];
        $db->table('users')->where('firebase_uid', $uid)->update($userData);

        // 2. Update 'student_profiles' table
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
        ];

        // Check if profile exists to either insert or update
        $exists = $db->table('student_profiles')->where('firebase_uid', $uid)->countAllResults();
        
        if ($exists > 0) {
            $db->table('student_profiles')->where('firebase_uid', $uid)->update($studentData);
        } else {
            $studentData['firebase_uid'] = $uid;
            $db->table('student_profiles')->insert($studentData);
        }

        return $this->respond(['message' => 'Profile updated successfully']);
    }
}