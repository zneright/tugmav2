<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUsersTable extends Migration
{
    
    public function up()
    {
        $this->forge->addField([
            'id'            => ['type' => 'INT', 'unsigned' => true, 'auto_increment' => true],
            'firebase_uid'  => ['type' => 'VARCHAR', 'constraint' => '128', 'unique' => true], // Crucial Link!
            'email'         => ['type' => 'VARCHAR', 'constraint' => '150', 'unique' => true],
            'role'          => ['type' => 'ENUM("student", "employer", "admin")'],
            
            // --- STUDENT SPECIFIC (Nullable) ---
            'first_name'    => ['type' => 'VARCHAR', 'constraint' => '100', 'null' => true],
            'last_name'     => ['type' => 'VARCHAR', 'constraint' => '100', 'null' => true],
            'school'        => ['type' => 'VARCHAR', 'constraint' => '150', 'null' => true],
            
            // --- EMPLOYER SPECIFIC (Nullable) ---
            'company_name'  => ['type' => 'VARCHAR', 'constraint' => '150', 'null' => true],
            'company_size'  => ['type' => 'VARCHAR', 'constraint' => '50', 'null' => true],
            
            'created_at datetime default current_timestamp',
        ]);
        $this->forge->addKey('id', true);
        $this->forge->createTable('users');
    }

    public function down()
    {
        //
    }
}
