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
// ====================================================================
$routes->get('api/employer/profile/(:segment)', 'Api\Employer::profile/$1');
$routes->post('api/employer/profile/(:segment)', 'Api\Employer::updateProfile/$1');

// ====================================================================
// 5. JOBS & AI SEARCH ROUTES
// ====================================================================
$routes->get('api/jobs/active', 'Api\Jobs::getActiveJobs');
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
    // Other routes might be here like register...
    $routes->post('users/register', 'Users::register');

    // 👇 ADD THESE TWO LINES 👇
    $routes->get('users/profile/(:segment)', 'Users::getProfile/$1');
    $routes->put('users/profile/(:segment)', 'Users::updateProfile/$1');
});