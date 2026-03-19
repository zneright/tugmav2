<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\EmployerProfileModel;

class Employer extends ResourceController
{
    public function __construct()
    {
        // Allow React to talk to CodeIgniter
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") {
            die();
        }
    }

    // READ: GET /api/employer/profile/{firebase_uid}
    public function profile($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerProfileModel();
        $profile = $model->where('firebase_uid', $firebase_uid)->first();

        // If the employer just signed up and has no profile yet, return safe defaults
        if (!$profile) {
            return $this->respond([
                'company_name' => 'Your Company Name',
                'company_size' => '1-10',
                'tagline' => 'Write a short, catchy tagline here.',
                'description' => 'Tell students what makes your company a great place to work...',
                'perks' => ['Remote Work'], // Default perk
                'location' => 'City, Country',
                'website' => 'https://',
                'email' => ''
            ]);
        }

        // Convert the MySQL JSON string back to a real array for React
        $profile['perks'] = json_decode($profile['perks'], true) ?? [];
        return $this->respond($profile);
    }

    // UPDATE or CREATE: POST /api/employer/profile/{firebase_uid}
    public function updateProfile($firebase_uid = null)
    {
        if (!$firebase_uid) return $this->fail('No UID provided');

        $model = new EmployerProfileModel();
        $json = $this->request->getJSON(true);
        $profile = $model->where('firebase_uid', $firebase_uid)->first();

        // Package the data from React
        $updateData = [
            'firebase_uid' => $firebase_uid,
            'company_name' => $json['company_name'] ?? '',
            'company_size' => $json['company_size'] ?? '1-10',
            'tagline'      => $json['tagline'] ?? '',
            'description'  => $json['description'] ?? '',
            'location'     => $json['location'] ?? '',
            'website'      => $json['website'] ?? '',
            'email'        => $json['email'] ?? '',
            'perks'        => isset($json['perks']) ? json_encode($json['perks']) : json_encode([]),
            'updated_at'   => date('Y-m-d H:i:s')
        ];

        if ($profile) {
            // If they already exist, update their row
            $model->update($profile['id'], $updateData);
        } else {
            // If this is their first time saving, insert a new row
            $model->insert($updateData);
        }

        return $this->respond(['message' => 'Profile saved successfully!', 'data' => $updateData]);
    }
}