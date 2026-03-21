<?php namespace App\Models;

use CodeIgniter\Model;

class JobInteractionModel extends Model
{
    protected $table = 'job_interactions';
    protected $primaryKey = 'id';
    // Ensure all these are allowed
    protected $allowedFields = ['id', 'student_uid', 'job_id', 'interaction_type', 'status']; 
}