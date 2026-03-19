<?php namespace App\Models;

use CodeIgniter\Model;

class EmployerJobModel extends Model
{
    protected $table            = 'employer_jobs';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useTimestamps    = true; 
    
    protected $allowedFields    = [
        'firebase_uid', 'title', 'type', 'location', 
        'days_per_week', 'hours_per_day',
        'salary', 'description', 'skills', 'status', 
        'applicants_count', 'image_url'
    ];
}