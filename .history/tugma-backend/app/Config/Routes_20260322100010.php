<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('api/test', 'Api::test');

// ====================================================================
// 1. GLOBAL CORS "CATCH-ALL"
// ====================================================================
$routes->options('api/(.*)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

// ====================================================================
// 2. USER & PROFILE ROUTES
// ====================================================================
$routes->post('api/users/register', 'Api\Users::register');
$routes->get('api/users/role/(:segment)', 'Api\Users::getRole/$1');
$routes->get('api/users/profile/(:segment)', 'Api\Users::getProfile/$1');

// 🔥 FIXED: This is strictly a POST route now so files work smoothly
$routes->post('api/users/profile/(:segment)', 'Api\Users::updateProfile/$1'); 

// ====================================================================
// 3. ATS ROUTES
// ====================================================================
$routes->post('api/ats/scan', 'Api\Ats::scan');
$routes->get('api/ats/history', 'Api\Ats::history');

// ====================================================================
// 4. EMPLOYER ROUTES
$routes->get('api/employer/profile/(:segment)', 'Api\Employer::profile/$1');
$routes->post('api/employer/profile/(:segment)', 'Api\Employer::updateProfile/$1');

// 5. JOBS & AI SEARCH ROUTES
$routes->get('api/jobs/active', 'Api\Jobs::getActiveJobs');
$routes->post('api/aisearch', 'Api\AiSearch::searchMatches');
$routes->post('api/jobs/aisearch', 'Api\AiSearch::searchMatches'); 
$routes->get('api/jobs/employer/(:segment)', 'Api\Jobs::employerJobs/$1');
$routes->post('api/jobs/employer/(:segment)', 'Api\Jobs::create/$1');
$routes->post('api/jobs/update/(:num)', 'Api\Jobs::updateJob/$1');
$routes->delete('api/jobs/delete/(:num)', 'Api\Jobs::deleteJob/$1');
$routes->get('api/jobs', 'Api\Jobs::getActiveJobs');

$routes->post('api/interactions/record', 'Api\Interactions::record');
$routes->get('api/interactions/student/(:segment)', 'Api\Interactions::getStudentInteractions/$1');

$routes->get('api/applications/employer/(:segment)', 'Api\Applications::getEmployerApplicants/$1');
$routes->post('api/applications/update-status/(:num)', 'Api\Applications::updateStatus/$1');
$routes->post('api/applications/analyze/(:num)', 'Api\Applications::analyzeApplicant/$1');
$routes->get('uploads/resumes/(:any)', 'Api\Applications::downloadResume/$1');

$routes->group('api', ['namespace' => 'App\Controllers\Api'], function($routes) {
    $routes->post('users/register', 'Users::register');

    $routes->get('users/profile/(:segment)', 'Users::getProfile/$1');
    $routes->put('users/profile/(:segment)', 'Users::updateProfile/$1');
});

$routes->post('api/applications/apply', 'Api\Applications::apply');


$routes->get('api/messages/conversations/(:segment)', 'Api\Messages::getConversations/$1');
$routes->get('api/messages/chat/(:segment)/(:segment)', 'Api\Messages::getChat/$1/$2');
$routes->post('api/messages/send', 'Api\Messages::send');

$routes->get('api/applications/student/(:segment)', 'Api\Applications::getStudentApplications/$1');
$routes->get('api/interactions/dashboard/(:any)', 'Api\Interactions::getDashboardStats/$1');

$routes->get('api/dtr/logs/(:segment)', 'Api\Dtr::getLogs/$1');
$routes->post('api/dtr/add', 'Api\Dtr::addLog');

// 6. NOTIFICATION ROUTES
$routes->get('api/notifications/recipients', 'Api\Notifications::getBroadcastRecipients');

$routes->get('api/notifications/(:segment)', 'Api\Notifications::getUserNotifications/$1');
$routes->get('api/notifications/sent/(:segment)', 'Api\Notifications::getSentNotifications/$1');
$routes->post('api/notifications/read/(:num)', 'Api\Notifications::markAsRead/$1');
$routes->post('api/notifications/read-all/(:segment)', 'Api\Notifications::markAllAsRead/$1');
$routes->post('api/notifications/send-bulk', 'Api\Notifications::sendToApplicants');
$routes->delete('api/notifications/(:num)', 'Api\Notifications::deleteNotification/$1');
$routes->post('api/notifications/delete-blast', 'Api\Notifications::deleteSentBlast');

$routes->post('api/notifications/ticket', 'Api\Notifications::submitTicket');

$routes->post('api/notifications/admin-broadcast', 'Api\Notifications::sendGlobalBroadcast');

$routes->get('api/admin/dashboard', 'Api\Admin::getDashboardStats');

$routes->get('api/admin/users', 'Api\Admin::getAllUsers');
$routes->post('api/admin/users/(:segment)/status', 'Api\Admin::updateUserStatus/$1');
$routes->delete('api/admin/users/(:segment)', 'Api\Admin::deleteUser/$1');

$routes->get('api/admin/tickets', 'Api\Admin::getSupportTickets');
$routes->post('api/admin/tickets/(:num)/resolve', 'Api\Admin::resolveTicket/$1');

$routes->post('api/admin/tickets/(:num)/reply', 'Api\Admin::replyTicket/$1');

$routes->get('api/admin/audit-logs', 'Api\Admin::getAuditLogs');
$routes->post('api/audit/log', 'Api\Admin::recordLog');