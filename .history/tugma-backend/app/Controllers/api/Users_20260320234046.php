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