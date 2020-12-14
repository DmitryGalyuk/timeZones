/*jslint esversion: 6 */

(function (angular) {
	'use strict';

	var timeZonesApp = angular.module('timeZonesApp', [
		'ui.bootstrap', 'preferencesModule', 'timeZonesModule', 'timeZoneControlModule',
		'ui.slider', 'xeditable', 'xeditableDeleteModule', 'ngFlatDatepicker'
	]);


	timeZonesApp.controller('timeZonesController', [
		'$scope', 'preferencesService', '$interval', '$timeout', 'timeZonesService', 'appTime',
		function ($scope, preferencesService, $interval, $timeout, timeZonesService, appTime) {

			$scope.clearTimeZones = removeAllZones;
			$scope.saveZones = saveZones;
			$scope.deleteZone = deleteZone;
			$scope.startTicking = startTicking;
			$scope.stopTicking = stopTicking;
			$scope.$on('$destroy', () => $scope.stopTicking());
			$scope.onSelect = onZoneSelectedFromList;
			$scope.showCurrentTime = () => $scope.startTicking();
			$scope.clockStyle = clockStyle;
			$scope.appTime = appTime;
			$scope.timeIn = timeZonesService.timeIn;
			$scope.comparatorTimezone = (zone) => $scope.timeIn($scope.appTime._time, zone.zoneId)._d.toISOString();
			$scope.datepickerConfig = { dateFormat: 'MMM DD, YYYY', allowFuture: true };
			$scope.zonesChanged = zonesChanged;
			$scope.blinkedZones = [];
			$scope.isBlinkingZone = isBlinkingZone;

			$scope.locations = timeZonesService.getLocations();

			$scope.zones = assembleTimeZones();

			ensureCurrentZoneIsVisible();
			$scope.userZone = calculateUserZone();
			configureSlider();
			configureWatchControl();
			$scope.isTicking = false;
			$scope.startTicking();

			$scope.zones.onChange = zonesChanged;
			addTimeZonesFromHash();

			$scope.manualHashChange = false;
			window.addEventListener('hashchange', addTimeZonesFromHash);

			zonesChanged();


			function zonesChanged() {
				if ($scope.manualHashChange) {
					$scope.manualHashChange = false;
					return;
				}

				var state = {};
				if (!$scope.isTicking) {
					state.time = $scope.appTime.time();
				}
				state.zones = $scope.zones.map(
					(zone) => {
						var z = {};
						z.id = zone.zoneId;
						z.name = zone.label;
						return z;
					}
				);
				saveToHash(btoa(JSON.stringify(state)));
			}

			function assembleTimeZones() {
				var zones = timeZonesService.loadUserZones();

				var proxy = addOnChangeEvent(zones);
				return proxy;
			}

			function saveToHash(data) {
				$scope.manualHashChange = true;
				location.hash = data;
			}
			
			function addTimeZonesFromHash() {
				if (!location.hash) return;

				const newHash = arguments[0] 
					? arguments[0].newURL.substr(arguments[0].newURL.indexOf('#')+1)
					: location.hash.substr(1);
				const urlData = JSON.parse(atob(newHash));
				if (!urlData || !urlData.zones || !urlData.zones.length) return;

				if (!!urlData.time) {
					$scope.appTime.time($scope.timeIn(urlData.time, 'UTC'));
					stopTicking();
				}

				addZone(urlData.zones
					.filter( (zoneFromUrl) => $scope.zones.findIndex((zone) => zone.zoneId == zoneFromUrl.id) < 0)
					.map( (filteredZone) => timeZonesService.getZoneByName(filteredZone.id))
					.map( (zone) => blinkZone(zone))
				);

			}

			function addOnChangeEvent(o) {
				var proxy = new Proxy(o, {
					set: function (target, prop, value) {
						target[prop] = value;
						if (target.onChange && prop != 'length' && prop != 'onChange') {
							Reflect.apply(target.onChange, target, value);
						}
						return true;
					}
				});
				return proxy;
			}

			function saveZones() {
				zonesChanged(); 
				preferencesService.save($scope.zones);
			}
			
			function deleteZone(zoneId) {
				var zoneIndex = $scope.zones.findIndex((zone) => zone.zoneId === zoneId);
				if (zoneIndex >= 0) {
					$scope.zones.splice(zoneIndex, 1);
				}
				saveZones();
			}

			function removeAllZones() {
				preferencesService._clear()
				$scope.zones = addOnChangeEvent([]);
				$scope.zones.onChange = zonesChanged;
				addZone(timeZonesService.getDefaultZone());
				saveZones();
				$scope.startTicking();
			}

			function addZone(zone) {
				if(Array.isArray(zone)) {
					zone.forEach((z)=>$scope.zones.push(z));
				}
				else {
					$scope.zones.push(zone);
				}
				saveZones();
				$timeout(window.CoolClock.findAndCreateClocks, 0);
			}

			function startTicking() {
				$scope.isTicking = true;
				if (angular.isDefined($scope._intervalPromise))
					return;
				$scope._intervalPromise = $interval(function () {
					$scope.appTime.setDateTime();
				}, 1000);
			}

			function stopTicking() {
				$scope.isTicking = false;
				if (angular.isDefined($scope._intervalPromise)) {
					$interval.cancel($scope._intervalPromise);
					$scope._intervalPromise = undefined;
				}
			}

			function onZoneSelectedFromList($item, $model, $label, $event) {
				var zoneToAdd = timeZonesService.getLocationZone($label);
				zoneToAdd.label = $label;
				$scope.search = '';
				if ($scope.zones.find((zone) => zone.zoneId === zoneToAdd.zoneId)) {
					blinkZone(zoneToAdd);
					return;
				}
				addZone(zoneToAdd);
			}

			function blinkZone(zone) {
				$scope.blinkedZones.push(zone);
				$timeout(() => 
					$scope.blinkedZones.splice($scope.blinkedZones.findIndex((z)=>z.zoneId===zone.zoneId), 1)
					, 2000);
				return zone;
			}

			function isBlinkingZone(zone) {
				return $scope.blinkedZones.find((z) => zone.zoneId === z.zoneId)
			}

			function ensureCurrentZoneIsVisible() {
				var currentZone = timeZonesService.getDefaultZone();
				if (!$scope.zones.find((zone) => zone.offsetInt == currentZone.offsetInt)) {
					addZone(currentZone);
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
	

			function configureWatchControl() {
				window.CoolClock.prototype.refreshDisplay = function () {
					this.render(
						$scope.appTime.time().hours() + Math.floor(this.gmtOffset),
						$scope.appTime.time().minutes() + this.gmtOffset % 1 * 60,
						$scope.appTime.time().seconds());
				};
				window.CoolClock.prototype.nextTick = function () { };

				window.CoolClock.config.skins.swissRailOnBlack = {
					outerBorder: {lineWidth: 2, radius: 95, fillColor: 'black', color: 'white',  alpha: 1},
					smallIndicator: {lineWidth: 2, startAt: 88, endAt: 92, color: 'white', alpha: 1},
					largeIndicator: {lineWidth: 4, startAt: 79, endAt: 92, color: 'white', alpha: 1},
					hourHand: {lineWidth: 8, startAt: -15, endAt: 50, color: 'white', alpha: 1},
					minuteHand: {lineWidth: 7, startAt: -15, endAt: 75, color: 'white', alpha: 1},
					secondHand: {lineWidth: 5, startAt: -10, endAt: 85, color: 'red', alpha: 1},
					secondDecoration: {lineWidth: 1, startAt: 70, radius: 4, fillColor: 'red', color: 'red',alpha: 1}
				};

				window.CoolClock.config.skins.swissRailOnYellow = {
					outerBorder: {lineWidth: 2, radius: 95, fillColor: 'LemonChiffon', color: 'black',  alpha: 1},
					smallIndicator: {lineWidth: 2, startAt: 88, endAt: 92, color: 'black', alpha: 1},
					largeIndicator: {lineWidth: 4, startAt: 79, endAt: 92, color: 'black', alpha: 1},
					hourHand: {lineWidth: 8, startAt: -15, endAt: 50, color: 'black', alpha: 1},
					minuteHand: {lineWidth: 7, startAt: -15, endAt: 75, color: 'black', alpha: 1},
					secondHand: {lineWidth: 5, startAt: -10, endAt: 85, color: 'red', alpha: 1},
					secondDecoration: {lineWidth: 1, startAt: 70, radius: 4, fillColor: 'red', color: 'red',alpha: 1}
				};


				$scope.$watch('appTime.time()', window.CoolClock.findAndCreateClocks);
			}

			function clockStyle(time) {
				const isDay = timeZonesService.isDaytime(time);
				const darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

				if(!isDay) return "OnBlack";
				if(isDay && darkTheme) return "OnYellow";
				else return "";
			}

			function configureSlider() {
				$scope.sliderGradient = {
					points: [{
						color: (function () {
							var brightnesPercent = Math.round(timeZonesService.daytime.start / 24 * 255);
							var colorstring = [brightnesPercent, brightnesPercent, brightnesPercent].join(',');
							return 'rgb(' + colorstring + ')';
						})(),
						position: 0
					}, {
						color: (function () {
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
					cssParamsString: function () {
						$scope.sliderGradient.points.sort(function (a, b) {
							return a.position - b.position;
						});
						return $scope.sliderGradient.points.map(function (point) {
							return point.color + ' ' + point.position + '%';
						}).join(', ');

					}
				};
			}
	}
	]);


})(window.angular);