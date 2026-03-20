<?php namespace App\Models;

use CodeIgniter\Model;

class StudentProfileModel extends Model
{
    protected $table = 'student_profiles';
    protected $primaryKey = 'id';
    
    // Exact columns CodeIgniter is allowed to save to
    protected $allowedFields = [
        'firebase_uid', 'title', 'course', 'classification', 'address',
        'expected_salary', 'about', 'education', 'ojt_data', 'skills',
        'languages', 'preferred_locations', 'resume_name', 
        'resume_url', 
        'profile_photo', 'cover_photo'
    ];
}