<?php namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;

class Applications extends ResourceController
{
    public function __construct()
    {
        header('Access-Control-Allow-Origin: *');
        header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
    }

    public function getEmployerApplicants($employer_uid = null)
    {
        if (!$employer_uid) return $this->fail('No employer UID provided');

        $db = \Config\Database::connect();
        
        // 1. Complex JOIN to get all application data in one go
        $builder = $db->table('job_interactions ji');
        $builder->select('ji.id as application_id, ji.created_at as applied_at, ji.status,
                          u.first_name, u.last_name, u.email, u.firebase_uid as student_uid,
                          sp.course, sp.skills as student_skills, sp.resume_name,
                          ej.id as job_id, ej.title as job_title, ej.skills as job_skills');
        $builder->join('employer_jobs ej', 'ej.id = ji.job_id');
        $builder->join('users u', 'u.firebase_uid = ji.student_uid');
        $builder->join('student_profiles sp', 'sp.firebase_uid = u.firebase_uid', 'left');
        $builder->where('ej.firebase_uid', $employer_uid);
        $builder->where('ji.interaction_type', 'applied');
        $builder->orderBy('ji.created_at', 'DESC');
        
        $applicants = $builder->get()->getResultArray();

        // 2. Calculate the "Match %" dynamically based on overlapping skills
        foreach ($applicants as &$app) {
            $jobSkills = json_decode($app['job_skills'], true) ?? [];
            $studentSkills = json_decode($app['student_skills'], true) ?? [];
            
            $matchCount = 0;
            foreach ($jobSkills as $js) {
                foreach ($studentSkills as $ss) {
                    if (strtolower($js) === strtolower($ss)) $matchCount++;
                }
            }
            
            $total = count($jobSkills) > 0 ? count($jobSkills) : 1;
            $percentage = round(($matchCount / $total) * 100);
            
            $app['match_percentage'] = $percentage > 100 ? 100 : $percentage;
        }

        return $this->respond($applicants);
    }

    public function updateStatus($application_id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$application_id || !isset($json['status'])) return $this->fail('Missing data');

        $db = \Config\Database::connect();
        $db->table('job_interactions')->where('id', $application_id)->update(['status' => $json['status']]);

        return $this->respond(['message' => 'Status updated']);
    }
}