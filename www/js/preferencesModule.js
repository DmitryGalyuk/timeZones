(function(angular, localStorage) {
	'use strict';

	var preferencesModule = angular.module('preferencesModule', []);
	preferencesModule.service('preferencesService', function() {

		var service = this;
		service.STORED_ZONES_KEY = "userTimeZones";

		service.load = function() {
			var storedValue = localStorage[service.STORED_ZONES_KEY];
			if (storedValue === undefined) {
				return [];
			}
			return angular.fromJson(storedValue);
		};

		service.save = function(valueToSave) {
			localStorage[service.STORED_ZONES_KEY] = angular.toJson(valueToSave, false);
		};

		service._clear = function(){
			localStorage.removeItem(service.STORED_ZONES_KEY);
		};

	});

})(window.angular, window.localStorage);