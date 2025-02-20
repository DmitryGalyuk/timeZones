(function(angular) {
	'use strict';

	var timeZoneControlModule = angular.module('timeZoneControlModule', ['timeZonesModule']);

	timeZoneControlModule.directive('timeSlider', ['timeZonesService', function(timeZoneService) {
		// Runs during compile
		return {
			scope: false, // {} = isolate, true = child, false/undefined = no change
			require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
			link: function($scope, iElm, iAttrs, ngModel) {
				function parse(val) {
					var parsedTime = Number(val);
					var timeZoneId = iAttrs.zoneId;
					return timeZoneService.zoneTimeToUTC(timeZoneId, parsedTime);
				}

				function format(timeToShow) {
					var timeZoneId = iAttrs.zoneId;
					var hours = timeZoneService.timeIn(timeToShow, timeZoneId).hours();
					if (timeToShow.minutes() < 30) {
						return hours.toString();
					} else {
						return (hours + 0.5).toString();
					}
				}

				ngModel.$formatters.push(format);
				ngModel.$parsers.push(parse);


			}
		};
	}]);



})(window.angular);