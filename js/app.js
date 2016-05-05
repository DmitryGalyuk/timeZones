(function(angular) {
'use strict';

var timeZonesApp = angular.module('timeZonesApp', [
	'ngRoute',
	'timeZonesListModule',
	'currentTimeModule'
	]);

timeZonesApp.config(['$routeProvider',function($routeProvider) {
	$routeProvider.when('/list', {
		templateUrl: '/partials/list.html',
		controller: 'timeZonesListController'
	})
	.when('/add', {
		templateUrl: '/partials/add.html',
		controller: 'timeZonesAddController'
	})
	.otherwise({
		redirectTo: '/list'
	});
	
}]);
})(window.angular);
