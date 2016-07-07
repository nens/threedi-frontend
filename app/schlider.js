/* Directives */

angular
.module('Components', [])
.directive('jqSchlider', function () {
  return {
    restrict: 'E',
    replace: true,
    template: '<div class="schlider"></div>',
    scope: {
      'ngEnabled': '=',
      'max': '=',
      'at': '=',
      'orientation': '@'
    },
    link: function (scope, element) {
      if (scope.orientation !== 'vertical') {
        scope.orientation = 'horizontal';
      }
      element.slider({
        stop: function () {
          // dafuq
        },
        orientation: scope.orientation
      });

      element.on('slidestop', function (event, ui) {
        scope.$apply(function () {
          scope.$parent.slider.at = ui.value;
        });
      });

      scope.$watch('max', function (value) {
        element.slider('option', 'max', value);
      });

      scope.$watch('at', function (value) {
        element.slider('option', 'value', value);
      });

      scope.$watch('ngEnabled', function (value) {
        element.attr('enabled', value);

        if ((value) || (value === 'true')) {
          element.slider('enable');
        } else {
          element.slider('disable');
        }
      });
    }
  };
});
