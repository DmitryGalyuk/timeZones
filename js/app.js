(function(angular) {
	'use strict';

	var timeZonesApp = angular.module('timeZonesApp', [
		'ui.bootstrap', 'preferencesModule', 'timeZonesModule', 'timeZoneControlModule',
		 'ui.slider', 'xeditable', 'xeditableDeleteModule'
	]);


	timeZonesApp.controller('timeZonesController', [
		'$scope', 'preferencesService', '$interval', '$timeout', 'timeZonesService',
		function($scope, preferencesService, $interval, $timeout, timeZonesService) {

			$scope.clearTimeZones = function() {
				preferencesService._clear();
			};

			$scope.saveZones = function() {
				preferencesService.save($scope.zones);
			};

			$scope.deleteZone = function(zoneId){
				var zoneIndex = $scope.zones.findIndex(function(zone){
					return zone.zoneId === zoneId;
				});
				if(zoneIndex){
					$scope.zones.splice(zoneIndex, 1);
				}
				$scope.saveZones();
			};

			var _intervalPromise;
			$scope.startTicking = function() {
				if (angular.isDefined(_intervalPromise))
					return;
				_intervalPromise = $interval(function() {
					$scope.appTime.time(timeZonesService.utcNow());
				}, 1000);
			};

			$scope.stopTicking = function() {
				if (angular.isDefined(_intervalPromise)) {
					$interval.cancel(_intervalPromise);
					_intervalPromise = undefined;
				}
			};

			$scope.$on("$destroy", function() {
				$scope.stopTicking();
			});

			$scope.onSelect = function($item, $model, $label, $event) {
				$scope.zones.push(timeZonesService.getZoneByName($label));
				$scope.search = "";
				preferencesService.save($scope.zones);
				$timeout(window.CoolClock.findAndCreateClocks, 0);
			};

			$scope.showCurrentTime = function() {
				$scope.startTicking();
			};

			$scope.appTime = {
				_time: timeZonesService.utcNow(),
				time: function(newTime) {
					if (arguments.length) {
						$scope.appTime._time = newTime;
						$scope.appTime.hours(newTime.hours());
					} else {
						return $scope.appTime._time;
					}
				},
				hours: function(newHours) {
					if (!newHours) {
						return $scope.appTime._time.hours();
					}

				}
			};

			$scope.sliderOptions = {
				orientation: 'vertical',
				start: function() {
					$scope.stopTicking();
				}

			};

			// timeZonesService.daytime
			$scope.sliderGradient = {
				points: [
					{
						color: (function() {
							var brightnesPercent = Math.round(timeZonesService.daytime.start / 24 * 255);
							var colorstring = [brightnesPercent, brightnesPercent, brightnesPercent].join(",");
							return "rgb(" + colorstring + ")";
						})(),
						position: 0
					},
					{
						color: (function() {
							var brightnesPercent = Math.round(timeZonesService.daytime.start / 24 * 255);
							var colorstring = [brightnesPercent, brightnesPercent, brightnesPercent].join(",");
							return "rgb(" + colorstring + ")";
						})(),
						position: 100
					},
					{
						color: 'rgb(128,128,128)',
						position: 100 - timeZonesService.daytime.start / 24 * 100
					},
					{
						color: 'rgb(255,255,255)',
						position: 100 - timeZonesService.daytime.midDay / 24 * 100
					},
					{
						color: 'rgb(128,128,128)',
						position: 100 - timeZonesService.daytime.end / 24 * 100
					},
					{
						color: 'rgb(0,0,0)',
						position: 100 - timeZonesService.daytime.midNight / 24 * 100
					}
				],
				cssParamsString: function(){
					$scope.sliderGradient.points.sort(function(a,b){return a.position-b.position;});
					return $scope.sliderGradient.points.map(function(point){
						return point.color + " " + point.position + "%";
					}).join(", ");

				}
			};


			$scope.$watch('appTime.time()', function(newValue, oldValue, scope) {
				window.CoolClock.findAndCreateClocks();
			});

			window.CoolClock.prototype.refreshDisplay = function() {
				this.render(
					$scope.appTime.time().hours() + Math.floor(this.gmtOffset),
					$scope.appTime.time().minutes() + this.gmtOffset % 1 * 60,
					$scope.appTime.time().seconds());
			};
			window.CoolClock.prototype.nextTick = function() {};

			window.CoolClock.config.skins.swissRailOnBlack = {
				outerBorder: {lineWidth: 2,radius: 95, fillColor: "black", color: "white", alpha: 1},
				smallIndicator: {lineWidth: 2, startAt: 88, endAt: 92, color: "white",alpha: 1},
				largeIndicator: {lineWidth: 4, startAt: 79, endAt: 92, color: "white", alpha: 1},
				hourHand: {lineWidth: 8, startAt: -15, endAt: 50, color: "white", alpha: 1},
				minuteHand: {lineWidth: 7, startAt: -15, endAt: 75, color: "white", alpha: 1},
				secondHand: {lineWidth: 5, startAt: -10, endAt: 85, color: "red", alpha: 1},
				secondDecoration: {lineWidth: 1, startAt: 70, radius: 4, fillColor: "red", color: "red",alpha: 1}
			};


			$scope.isDaytime = timeZonesService.isDaytime;
			$scope.timeIn = timeZonesService.timeIn;

			$scope.allZoneNames = timeZonesService.getAllTimeZoneNames();
			$scope.zones = timeZonesService.loadZones();

			$scope.startTicking();


		}
	]);


})(window.angular);