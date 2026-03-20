<?php namespace App\Models;

use CodeIgniter\Model;

class JobInteractionModel extends Model
{
    protected $table = 'job_interactions';
    protected $primaryKey = 'id';
    // 🔥 ADD 'status' HERE
    protected $allowedFields = ['student_uid', 'job_id', 'interaction_type', 'status']; 
}