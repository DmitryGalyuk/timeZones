(function(angular) {
	'use strict';

	var xeditableDeleteModule = angular.module('xeditableDeleteModule', ['xeditable']);
	xeditableDeleteModule.directive('xeditableDelete', function() {
		// Runs during compile
		return {
			// name: '',
			priority: 1000,
			// terminal: true,
			// scope: {}, // {} = isolate, true = child, false/undefined = no change
			// controller: function($scope, $element, $attrs, $transclude) {},
			require: 'editableText', // Array = multiple requires, ? = optional, ^ = check parent elements
			restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
			// template: '',
			// templateUrl: '',
			// replace: true,
			// transclude: true,
			// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
			link: function($scope, iElm, iAttrs, controller) {
				var xeditableRender = controller.render;

				var extendedRender = function() {
					var deleteButton = angular.element("<button type='button'>");
					deleteButton.text(iAttrs.deleteText);
					deleteButton.attr('ng-click', iAttrs.deleteCallback);

					var buttons = controller.editorEl.find(".editable-buttons");

					buttons.append(deleteButton);
				};

				controller.render = function(){
					xeditableRender.apply(this, arguments);
					extendedRender.apply(this, arguments);
				};


			}
		};
	});
})(window.angular);