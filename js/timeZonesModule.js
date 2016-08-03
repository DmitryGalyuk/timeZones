(function(angular, moment) {
	'use strict';

	var timeZonesModule = angular.module('timeZonesModule', ['preferencesModule']);

	timeZonesModule.value('daytimeStart', 9);
	timeZonesModule.value('daytimeEnd', 19);

	timeZonesModule.service('timeZonesService', ['$interval', 'preferencesService', 'daytimeStart', 'daytimeEnd', '$http',
		function($interval, preferencesService, daytimeStart, daytimeEnd, $http) {
			return {

				timeIn: function(time, zoneId) {
					return moment(time).tz(zoneId);
				},

				getZoneByName: function(zoneName) {
					return {
						label: zoneName,
						zoneId: zoneName,
						offset: moment.tz(zoneName).format('Z'),
						offsetInt: moment.tz(zoneName)._offset / 60
					};
				},

				getDefaultZoneName: function() {
					return moment.tz.guess();
				},

				getAllTimeZoneNames: function() {
					return moment.tz.names();
				},

				loadZones: function() {
					var storedZones = preferencesService.load();
					if (storedZones.length === 0) {
						var defaultZoneName = this.getDefaultZoneName();
						storedZones.push(this.getZoneByName(defaultZoneName));
					}
					return storedZones;
				},

				timeFromZone: function(zoneId, hours) {
					return moment.tz(zoneId).add(hours, "h");
				},

				utcNow: function() {
					return moment.utc();
				},

				zoneTimeToUTC: function(zoneId, hours) {
					var zoneTime = moment.tz(zoneId);

					zoneTime.hours(hours);
					zoneTime.minutes(hours % 1 * 60);
					zoneTime.seconds(0);

					return moment.utc(zoneTime);

				},

				isDaytime: function(time) {
					return time.hours() >= daytimeStart && time.hours() < daytimeEnd;
				},
				daytime: {
					start: daytimeStart,
					end: daytimeEnd,
					midDay: (function(){
						var startMoment = moment().hours(daytimeStart);
						return startMoment.add((daytimeEnd - daytimeStart)/2, 'hours').hours();
					})(),
					midNight: (function(){
						var dayStart = moment().hours(daytimeStart);
						return dayStart.subtract((24 - (daytimeEnd - daytimeStart))/2, 'hours').hours();
					})()
				},
			};
		}
	]);

	timeZonesModule.filter('toZoneTime', ['timeZonesService', function(timeZonesService) {
		return function(utcTime, zone, format) {
			return timeZonesService.timeIn(utcTime, zone).format(format);
		};

	}]);

})(window.angular, window.moment);