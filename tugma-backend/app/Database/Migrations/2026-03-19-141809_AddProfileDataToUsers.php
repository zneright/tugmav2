<?php namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddProfileDataToUsers extends Migration
{
    public function up()
    {
        $this->forge->addColumn('users', [
            'profile_data' => [
                'type' => 'JSON',
                'null' => true,
            ]
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('users', 'profile_data');
    }
}