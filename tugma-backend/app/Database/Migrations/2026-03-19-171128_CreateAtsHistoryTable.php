<?php namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAtsHistoryTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'INT',
                'constraint'     => 11,
                'auto_increment' => true,
            ],
            'file_name' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
            ],
            'job_description' => [
                'type' => 'TEXT',
            ],
            'match_score' => [
                'type'       => 'INT',
                'constraint' => 11,
            ],
            'json_result' => [
                'type' => 'JSON',
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
        ]);
        
        $this->forge->addKey('id', true);
        $this->forge->createTable('ats_history');
    }

    public function down()
    {
        $this->forge->dropTable('ats_history');
    }
}