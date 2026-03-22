<?php namespace App\Models;

use CodeIgniter\Model;

class StudentProfileModel extends Model
{
    // The exact name of the table we just created in MySQL
    protected $table = 'student_profiles';
    
    // The primary key
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