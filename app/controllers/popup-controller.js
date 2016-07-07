/* Helper controller for popups that use a slider */
angular.module('threedi-client')
.controller('PopupSlider', ['$scope', 'socket', 'clientState',
function ($scope, socket, clientstate) {

  $scope.value_percentage = [];  // default

  $scope.update_percentage = function (var_name, value) {
    $scope.value_percentage[var_name] = 100 * (
      value -
      clientstate.edit_ranges[var_name].min) / (
        clientstate.edit_ranges[var_name].max -
        clientstate.edit_ranges[var_name].min);
    };

    $scope.calc_value = function (var_name, value_fract) {
      var value_max = clientstate.edit_ranges[var_name].max;
      var value_min = clientstate.edit_ranges[var_name].min;
      var decimal_factor = Math.pow(10, clientstate.edit_ranges[var_name].decimals);
      var value = Math.round(value_fract * (value_max - value_min) *
      decimal_factor) / decimal_factor + value_min;
      $scope.update_percentage(var_name, value);
      return value;
    };

    $scope.get_x = function (event) {
      var x = event.offsetX;  // normal browsers
      if (x === undefined) {
        // hack for firefox
        x = event.clientX - $(event.currentTarget).offset().left;
      }
      return x;
    };
  }
]);
