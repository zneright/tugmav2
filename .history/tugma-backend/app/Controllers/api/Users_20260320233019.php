<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    public function register()
    {
        $data = $this->request->getJSON(true); // Get data from React

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
    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        // FIX: Ensure this always results in an array to prevent array_merge from crashing
        $profileData = !empty($user['profile_data']) ? json_decode($user['profile_data'], true) : [];
        if (!is_array($profileData)) {
            $profileData = [];
        }
        
        // Ensure we are explicitly mapping the database columns to the frontend keys
        $response = array_merge($profileData, [
            'firstName' => $user['first_name'] ?? '',
            'lastName'  => $user['last_name'] ?? '',
            'email'     => $user['email'] ?? '',
            'role'      => $user['role'] ?? ''
        ]);

        return $this->respond($response);
    }

    // --- UPDATE PROFILE ---
    public function updateProfile($uid = null)
    {
        $data = $this->request->getJSON(true);
        $db = \Config\Database::connect();
        
        $updateData = [];
        
        // 1. Update the actual table columns for names
        // FIX: Used array_key_exists instead of isset. If the frontend sends an empty string, 
        // isset might fail or behave unexpectedly, dropping the name update entirely.
        if (array_key_exists('firstName', $data)) {
            $updateData['first_name'] = $data['firstName'];
        }
        if (array_key_exists('lastName', $data)) {
            $updateData['last_name'] = $data['lastName'];
        }
        
        // 2. Prepare the JSON data
        $jsonStore = $data;
        unset($jsonStore['firstName'], $jsonStore['lastName'], $jsonStore['email'], $jsonStore['role']);
        
        $updateData['profile_data'] = json_encode($jsonStore);

        $db->table('users')->where('firebase_uid', $uid)->update($updateData);

        return $this->respond(['message' => 'Profile updated successfully']);
    }
}