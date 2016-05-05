(function(angular) {
	'use strict';

	var timeZonesListModule = angular.module('timeZonesListModule', ['currentTimeModule']);

	timeZonesListModule.controller('timeZonesListController', ['$scope', function($scope) {
		var injector = angular.injector(["currentTimeModule"]);
		var currentTimeService = injector.get("currentTimeService");

		$scope.timeZones = [{
			name: 'Minsk',
			offset: "GMT+2"

		}, {
			name: 'London',
			offset: "GMT+0"

		}];
		$scope.utctime = currentTimeService.utcNow();

	}]);

})(window.angular);