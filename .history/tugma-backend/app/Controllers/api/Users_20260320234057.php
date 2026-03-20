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

    public function getProfile($uid = null)
{
    try {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) {
            return $this->failNotFound('User not found');
        }

        // Decode JSON safely
        $profileData = json_decode($user['profile_data'] ?? '', true);
        if (!is_array($profileData)) {
            $profileData = [];
        }
        
        // Ensure keys match React's camelCase state exactly
        $response = array_merge($profileData, [
            'firstName' => $user['first_name'] ?? '',
            'lastName'  => $user['last_name'] ?? '',
            'school'    => $user['school'] ?? '',
            'email'     => $user['email'] ?? '',
            'role'      => $user['role'] ?? ''
        ]);

        return $this->respond($response);
    } catch (\Exception $e) {
        // This will send the actual error message to your Network tab instead of just "500"
        return $this->failServerError($e->getMessage());
    }
}

    // --- UPDATE PROFILE ---
    // --- UPDATE PROFILE ---
public function updateProfile($uid = null)
{
    $data = $this->request->getJSON(true);
    $db = \Config\Database::connect();
    
    $updateData = [];

    // Map React camelCase to DB snake_case
    if (isset($data['firstName'])) $updateData['first_name'] = $data['firstName'];
    if (isset($data['lastName']))  $updateData['last_name']  = $data['lastName'];
    
    // Sync the "College" school name to the dedicated 'school' column
    if (isset($data['education']['college']['school'])) {
        $updateData['school'] = $data['education']['college']['school'];
    }

    // Prepare the rest for the JSON column
    $jsonStore = $data;
    // Remove fields that have dedicated columns to avoid data redundancy
    unset($jsonStore['firstName'], $jsonStore['lastName'], $jsonStore['email'], $jsonStore['role']);
    
    $updateData['profile_data'] = json_encode($jsonStore);

    $db->table('users')->where('firebase_uid', $uid)->update($updateData);

    return $this->respond(['message' => 'Profile updated successfully']);
}
}