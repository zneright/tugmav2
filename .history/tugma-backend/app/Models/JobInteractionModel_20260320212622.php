<?php namespace App\Models;

use CodeIgniter\Model;

class JobInteractionModel extends Model
{
    protected $table = 'job_interactions';
    protected $primaryKey = 'id';
    protected $allowedFields = ['student_uid', 'job_id', 'interaction_type'];
}