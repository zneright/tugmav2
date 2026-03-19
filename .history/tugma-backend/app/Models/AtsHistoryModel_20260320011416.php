<?php namespace App\Models;

use CodeIgniter\Model;

class AtsHistoryModel extends Model
{
    protected $table            = 'ats_history';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    
    protected $allowedFields    = [
        'file_name', 
        'job_description', 
        'match_score', 
        'json_result', 
        'created_at'
    ];

    // Use CodeIgniter's built-in timestamps
    protected $useTimestamps = false; 
}