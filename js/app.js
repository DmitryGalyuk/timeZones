/*jslint esversion: 6 */

(function(angular) {
	'use strict';

	var timeZonesApp = angular.module('timeZonesApp', [
		'ui.bootstrap', 'preferencesModule', 'timeZonesModule', 'timeZoneControlModule',
		'ui.slider', 'xeditable', 'xeditableDeleteModule', 'ngFlatDatepicker'
	]);


	timeZonesApp.controller('timeZonesController', [
		'$scope', 'preferencesService', '$interval', '$timeout', 'timeZonesService', 'appTime',
		function($scope, preferencesService, $interval, $timeout, timeZonesService, appTime) {

			$scope.clearTimeZones = () => preferencesService._clear();
			$scope.saveZones = () => preferencesService.save($scope.zones);
			$scope.deleteZone = deleteZone;
			$scope.startTicking = startTicking;
			$scope.stopTicking = stopTicking;
			$scope.$on('$destroy', () => $scope.stopTicking());
			$scope.onSelect = onZoneSelectedFromList;
			$scope.showCurrentTime = () => $scope.startTicking();
			$scope.isDaytime = timeZonesService.isDaytime;
			$scope.timeIn = timeZonesService.timeIn;
			$scope.comparatorTimezone = (zone) => $scope.timeIn($scope.appTime._time, zone.zoneId)._d.toISOString();
			$scope.datepickerConfig = {dateFormat: 'MMM DD, YYYY',allowFuture:true};

			$scope.locations = timeZonesService.getLocations();
			// $scope.allZoneNames = timeZonesService.getAllTimeZoneNames();
			$scope.zones = timeZonesService.loadUserZones();
			ensureCurrentZoneIsVisible();
			$scope.userZone = calculateUserZone();
			$scope.appTime = appTime;
			configureSlider();
			configureWatchControl();
			$scope.startTicking();

			function deleteZone(zoneId) {
				var zoneIndex = $scope.zones.findIndex((zone) => zone.zoneId === zoneId);
				if (zoneIndex !== undefined) {
					$scope.zones.splice(zoneIndex, 1);
				}
				$scope.saveZones();
			}

			function startTicking() {
				if (angular.isDefined($scope._intervalPromise))
					return;
				$scope._intervalPromise = $interval(function() {
					$scope.appTime.setDateTime();
				}, 1000);
			}

			function stopTicking() {
				if (angular.isDefined($scope._intervalPromise)) {
					$interval.cancel($scope._intervalPromise);
					$scope._intervalPromise = undefined;
				}
			}

			function onZoneSelectedFromList($item, $model, $label, $event) {
				var zoneToAdd = timeZonesService.getLocationZone($label);
				zoneToAdd.label = $label;
				$scope.search = '';
				if ($scope.zones.find((zone) => zone.label === zoneToAdd.label)) {
					blinkZone(zoneToAdd);
					return;
				}
				$scope.zones.push(zoneToAdd);
				preferencesService.save($scope.zones);
				$timeout(window.CoolClock.findAndCreateClocks, 0);
			}

			function blinkZone(zone) {
				$scope.blinkedZone = zone;
				$timeout(() => $scope.blinkedZone = undefined, 500);
			}

			function configureWatchControl() {
				window.CoolClock.prototype.refreshDisplay = function() {
					this.render(
						$scope.appTime.time().hours() + Math.floor(this.gmtOffset),
						$scope.appTime.time().minutes() + this.gmtOffset % 1 * 60,
						$scope.appTime.time().seconds());
				};
				window.CoolClock.prototype.nextTick = function() {};

				window.CoolClock.config.skins.swissRailOnBlack = {
					outerBorder: {
						lineWidth: 2,
						radius: 95,
						fillColor: 'black',
						color: 'white',
						alpha: 1
					},
					smallIndicator: {
						lineWidth: 2,
						startAt: 88,
						endAt: 92,
						color: 'white',
						alpha: 1
					},
					largeIndicator: {
						lineWidth: 4,
						startAt: 79,
						endAt: 92,
						color: 'white',
						alpha: 1
					},
					hourHand: {
						lineWidth: 8,
						startAt: -15,
						endAt: 50,
						color: 'white',
						alpha: 1
					},
					minuteHand: {
						lineWidth: 7,
						startAt: -15,
						endAt: 75,
						color: 'white',
						alpha: 1
					},
					secondHand: {
						lineWidth: 5,
						startAt: -10,
						endAt: 85,
						color: 'red',
						alpha: 1
					},
					secondDecoration: {
						lineWidth: 1,
						startAt: 70,
						radius: 4,
						fillColor: 'red',
						color: 'red',
						alpha: 1
					}
				};

				$scope.$watch('appTime.time()', window.CoolClock.findAndCreateClocks);
			}

			function configureSlider() {
				$scope.sliderOptions = {
					orientation: 'vertical',
					start: function() {
						$scope.stopTicking();
					}
				};

				$scope.sliderGradient = {
					points: [{
						color: (function() {
							var brightnesPercent = Math.round(timeZonesService.daytime.start / 24 * 255);
							var colorstring = [brightnesPercent, brightnesPercent, brightnesPercent].join(',');
							return 'rgb(' + colorstring + ')';
						})(),
						position: 0
					}, {
						color: (function() {
							var brightnesPercent = Math.round(timeZonesService.daytime.start / 24 * 255);
							var colorstring = [brightnesPercent, brightnesPercent, brightnesPercent].join(',');
							return 'rgb(' + colorstring + ')';
						})(),
						position: 100
					}, {
						color: 'rgb(128,128,128)',
						position: 100 - timeZonesService.daytime.start / 24 * 100
					}, {
						color: 'rgb(255,255,255)',
						position: 100 - timeZonesService.daytime.midDay / 24 * 100
					}, {
						color: 'rgb(128,128,128)',
						position: 100 - timeZonesService.daytime.end / 24 * 100
					}, {
						color: 'rgb(0,0,0)',
						position: 100 - timeZonesService.daytime.midNight / 24 * 100
					}],
					cssParamsString: function() {
						$scope.sliderGradient.points.sort(function(a, b) {
							return a.position - b.position;
						});
						return $scope.sliderGradient.points.map(function(point) {
							return point.color + ' ' + point.position + '%';
						}).join(', ');

					}
				};
			}

			function ensureCurrentZoneIsVisible() {
				var currentZone = timeZonesService.getDefaultZone();
				if (!$scope.zones.find((zone) => zone.offsetInt == currentZone.offsetInt)) {
					$scope.zones.push(currentZone);
				}
			}

			function calculateUserZone() {
				var currentZone = timeZonesService.getDefaultZone();
				var zoneIndex = $scope.zones.findIndex((zone) => zone.zoneId === currentZone.zoneId);
				if (zoneIndex > 0) {
					return $scope.zones[zoneIndex];
				} else {
					return $scope.zones.find((zone) => zone.offsetInt === currentZone.offsetInt);
				}
			}
		}
	]);


})(window.angular);
