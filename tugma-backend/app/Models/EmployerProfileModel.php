<?php namespace App\Models;

use CodeIgniter\Model;

class EmployerProfileModel extends Model
{
    protected $table            = 'employer_profiles';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    
    protected $allowedFields    = [
        'firebase_uid', 
        'company_name', 
        'company_size', 
        'tagline', 
        'description', 
        'perks', 
        'location', 
        'website', 
        'email',
        'updated_at'
    ];
}