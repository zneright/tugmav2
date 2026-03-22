<?php namespace App\Models;

use CodeIgniter\Model;

class StudentProfileModel extends Model
{
    protected $table = 'student_profiles';
    
    protected $primaryKey = 'id';
    
    protected $allowedFields = [
        'firebase_uid', 
        'title', 
        'course', 
        'classification', 
        'address',
        'expected_salary', 
        'about', 
        'education', 
        'ojt_data', 
        'skills',
        'languages', 
        'preferred_locations', 
        'resume_name', 
        'profile_photo', 
        'cover_photo'
    ];
}