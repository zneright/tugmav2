<?php namespace App\Controllers\Api;
use App\Models\EmployerProfileModel;
use CodeIgniter\RESTful\ResourceController;

class Users extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format    = 'json';

    // ... [Keep your register and getRole methods exactly the same] ...

    public function getProfile($uid = null)
    {
        $db = \Config\Database::connect();
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        
        if (!$user) return $this->failNotFound('User not found');

        $profileData = $user['profile_data'] ? json_decode($user['profile_data'], true) : [];
        
        $response = array_merge([
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ], $profileData);

        return $this->respond($response);
    }

    // --- UPDATE PROFILE (FIXED FOR FILE UPLOADS) ---
    public function updateProfile($uid = null)
    {
        $db = \Config\Database::connect();
        
        // 1. Use getPost() because React is sending FormData (multipart/form-data)
        $postData = $this->request->getPost();

        if (empty($postData)) {
            return $this->fail('No data received. Ensure you are sending FormData.');
        }

        // 2. Decode the JSON strings sent by FormData back into PHP Arrays
        $jsonFields = ['education', 'ojt', 'skills', 'languages', 'preferredLocations'];
        foreach ($jsonFields as $field) {
            if (isset($postData[$field])) {
                $postData[$field] = json_decode($postData[$field], true);
            }
        }

        // 3. Fetch existing user profile so we don't overwrite existing files if no new ones are uploaded
        $user = $db->table('users')->where('firebase_uid', $uid)->get()->getRowArray();
        $existingProfile = $user['profile_data'] ? json_decode($user['profile_data'], true) : [];

        // 4. Setup Upload Directories in your CI4 `public` folder
        $uploadPathResumes = FCPATH . 'uploads/resumes/';
        $uploadPathPhotos = FCPATH . 'uploads/photos/';
        
        if (!is_dir($uploadPathResumes)) mkdir($uploadPathResumes, 0777, true);
        if (!is_dir($uploadPathPhotos)) mkdir($uploadPathPhotos, 0777, true);

        // 5. Handle Resume Upload
        $resumeFile = $this->request->getFile('resume');
        if ($resumeFile && $resumeFile->isValid() && !$resumeFile->hasMoved()) {
            $newName = $resumeFile->getRandomName(); // e.g., 1683492.pdf
            $resumeFile->move($uploadPathResumes, $newName);
            $postData['resumeName'] = $resumeFile->getClientName(); // Original name for display
            $postData['resumeUrl'] = base_url('uploads/resumes/' . $newName); // URL to download
        } else {
            // Keep old resume if a new one wasn't uploaded
            if (isset($existingProfile['resumeName'])) $postData['resumeName'] = $existingProfile['resumeName'];
            if (isset($existingProfile['resumeUrl'])) $postData['resumeUrl'] = $existingProfile['resumeUrl'];
        }

        // 6. Handle Profile Photo
        $profilePhoto = $this->request->getFile('profilePhotoFile');
        if ($profilePhoto && $profilePhoto->isValid() && !$profilePhoto->hasMoved()) {
            $newName = $profilePhoto->getRandomName();
            $profilePhoto->move($uploadPathPhotos, $newName);
            $postData['profilePhoto'] = base_url('uploads/photos/' . $newName);
        } else {
            if (isset($existingProfile['profilePhoto'])) $postData['profilePhoto'] = $existingProfile['profilePhoto'];
        }

        // 7. Handle Cover Photo
        $coverPhoto = $this->request->getFile('coverPhotoFile');
        if ($coverPhoto && $coverPhoto->isValid() && !$coverPhoto->hasMoved()) {
            $newName = $coverPhoto->getRandomName();
            $coverPhoto->move($uploadPathPhotos, $newName);
            $postData['coverPhoto'] = base_url('uploads/photos/' . $newName);
        } else {
            if (isset($existingProfile['coverPhoto'])) $postData['coverPhoto'] = $existingProfile['coverPhoto'];
        }

        // 8. Extract standard columns
        $updateData = [];
        if (isset($postData['firstName'])) $updateData['first_name'] = $postData['firstName'];
        if (isset($postData['lastName'])) $updateData['last_name'] = $postData['lastName'];
        
        // Clean up text arrays so we don't save duplicate data inside the JSON
        unset($postData['firstName'], $postData['lastName'], $postData['email'], $postData['role']);

        // 9. Save everything else into profile_data JSON
        $updateData['profile_data'] = json_encode($postData);
        $db->table('users')->where('firebase_uid', $uid)->update($updateData);

        return $this->respond(['message' => 'Profile and files updated successfully!']);
    }
}