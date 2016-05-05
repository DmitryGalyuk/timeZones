(function (angular)
{
'use strict';

var currentTimeModule = angular.module('currentTimeModule', []);

currentTimeModule.factory('currentTimeService', function(){
	return {
		utcNow: function (){
			return new Date().getTime();
		}
	};

});

})(window.angular);