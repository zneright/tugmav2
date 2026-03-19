<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Api extends ResourceController
{
    public function test()
    {
        return $this->respond([
            'status' => 'success',
            'message' => 'Tugma backend is officially hooked up!'
        ]);
    }
}