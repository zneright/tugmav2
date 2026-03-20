<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('api/test', 'Api::test');

$routes->options('api/users/register', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

$routes->options('api/(.*)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

$routes->post('api/users/register', 'Api\Users::register');
$routes->get('api/users/role/(:segment)', 'Api\Users::getRole/$1');
$routes->get('api/users/profile/(:segment)', 'Api\Users::getProfile/$1');
$routes->put('api/users/profile/(:segment)', 'Api\Users::updateProfile/$1');
$routes->options('api/users/profile/(:segment)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

$routes->post('api/ats/scan', 'Api\Ats::scan');
$routes->get('api/ats/history', 'Api\Ats::history');
$routes->options('api/ats/(:any)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return $response;
});


// Employer Profile
$routes->get('api/employer/profile/(:segment)', 'Api\Employer::profile/$1');
$routes->post('api/employer/profile/(:segment)', 'Api\Employer::updateProfile/$1');

$routes->options('api/employer/(.*)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

// Jobs 
$routes->get('api/jobs/employer/(:segment)', 'Api\Jobs::employerJobs/$1');
$routes->post('api/jobs/employer/(:segment)', 'Api\Jobs::create/$1');
$routes->post('api/jobs/update/(:num)', 'Api\Jobs::updateJob/$1');
$routes->delete('api/jobs/delete/(:num)', 'Api\Jobs::deleteJob/$1');

$routes->options('api/jobs/(.*)', static function() {
    $response = response();
    $response->setStatusCode(204);
    $response->setHeader('Access-Control-Allow-Origin', '*');
    $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    return $response;
});

$routes->get('api/jobs/active', 'Api\Jobs::getActiveJobs');
$routes->get('api/users/profile/(:segment)', 'Api\Users::getProfile/$1');