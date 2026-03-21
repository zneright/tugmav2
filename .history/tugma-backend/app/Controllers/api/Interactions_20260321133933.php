    <?php namespace App\Controllers\Api;

    use CodeIgniter\RESTful\ResourceController;

    class Interactions extends ResourceController
    {
        public function __construct()
        {
            header('Access-Control-Allow-Origin: *');
            header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization");
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
            if ($_SERVER['REQUEST_METHOD'] == "OPTIONS") die();
        }

        // 🔥 BULLETPROOF RECORDING 🔥
        public function record()
        {
            try {
                $data = $this->request->getJSON(true);
                $db = \Config\Database::connect();
                $builder = $db->table('job_interactions');

                // 1. Check if they already applied
                $hasApplied = $builder->where('student_uid', $data['student_uid'])
                                    ->where('job_id', $data['job_id'])
                                    ->where('interaction_type', 'applied')
                                    ->get()->getRowArray();

                if ($hasApplied) {
                    return $this->respond(['message' => 'Already applied']);
                }

                // 2. Check if a view already exists
                $existingView = $builder->where('student_uid', $data['student_uid'])
                                        ->where('job_id', $data['job_id'])
                                        ->where('interaction_type', 'viewed')
                                        ->get()->getRowArray();

                if ($data['type'] === 'viewed') {
                    if (!$existingView) {
                        $builder->insert([
                            'student_uid' => $data['student_uid'],
                            'job_id' => $data['job_id'],
                            'interaction_type' => 'viewed',
                            'status' => null // Views do NOT get a status
                        ]);
                    }
                    return $this->respond(['message' => 'View recorded']);
                }

                if ($data['type'] === 'applied') {
                    if ($existingView) {
                        // Upgrade view to an application
                        $builder->where('id', $existingView['id'])->update([
                            'interaction_type' => 'applied',
                            'status' => 'New Applicant'
                        ]);
                    } else {
                        // Insert fresh application
                        $builder->insert([
                            'student_uid' => $data['student_uid'],
                            'job_id' => $data['job_id'],
                            'interaction_type' => 'applied',
                            'status' => 'New Applicant'
                        ]);
                    }
                    return $this->respond(['message' => 'Application recorded']);
                }

            } catch (\Throwable $e) {
                // IF IT CRASHES, SEND THE REAL ERROR TO REACT!
                return $this->failServerError('DB CRASH: ' . $e->getMessage());
            }
        }

        // 2. GET ALL INTERACTIONS
        public function getStudentInteractions($uid)
        {
            $db = \Config\Database::connect();
            $interactions = $db->table('job_interactions')->where('student_uid', $uid)->get()->getResultArray();

            $viewed = [];
            $applied = [];

            foreach ($interactions as $i) {
                $jobId = (int)$i['job_id']; 
                if ($i['interaction_type'] === 'viewed') $viewed[] = $jobId;
                if ($i['interaction_type'] === 'applied') $applied[] = $jobId;
            }

            return $this->respond([
                'viewed' => array_values(array_unique($viewed)), 
                'applied' => array_values(array_unique($applied))
            ]);
        }
    }