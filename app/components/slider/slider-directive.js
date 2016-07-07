// const app = require('../../threedi');
const angular = require('angular');

angular.module('threedi-client')
.directive('slider', function (clientState) {
  var link = function (scope, elem) {
    scope.toggle_edit_mode = function (newMode) {
      localState = clientstate.edit_ranges[scope.varName]
      // clientstate.edit_ranges['{{ var_name }}'].
      clientState.edit_mode = newMode;
    };

    scope.valuePercentage = 100;
  };

  return {
    link: link,
    replace: true,
    templateUrl: './components/slider/slider.html'
  };
});
