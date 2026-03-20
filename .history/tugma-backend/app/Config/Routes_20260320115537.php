<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('api/test', 'Api::test');

// ====================================================================
// 1. GLOBAL CORS "CATCH-ALL" (Fixes all Preflight / CORS policy errors)
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
// Note: If your React app sends a POST to update the profile, change 'put' to 'post' here.
$routes->put('api/users/profile/(:segment)', 'Api\Users::updateProfile/$1'); 

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

// For students to view all active jobs
$routes->get('api/jobs/active', 'Api\Jobs::getActiveJobs');

// For the AI Search feature
$routes->post('api/jobs/aisearch', 'Api\AiSearch::searchMatches'); 

// For employers to view their own jobs
$routes->get('api/jobs/employer/(:segment)', 'Api\Jobs::employerJobs/$1');

// Job creation, updating, and deletion
$routes->post('api/jobs/employer/(:segment)', 'Api\Jobs::create/$1');
$routes->post('api/jobs/update/(:num)', 'Api\Jobs::updateJob/$1');
$routes->delete('api/jobs/delete/(:num)', 'Api\Jobs::deleteJob/$1');

// Fallback: If a GET request hits /api/jobs directly, map it to getActiveJobs
$routes->get('api/jobs', 'Api\Jobs::getActiveJobs');