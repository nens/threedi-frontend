const angular = require('angular');
const $ = require('jquery');

/*
The slider is used to control the most important variable of an edit.

Hold the slider for 2 seconds and a settings screen is popped up for that item.
*/
angular.module('threedi-client').controller('ThreediSlider', [
  '$scope',
  '$rootScope',
  'clientState',
  'modes',
  function (
    $scope,
    $rootScope,
    clientstate,
    modes
  ) {
    $scope.value_min = 0;
    $scope.value_max = 100;
    $scope.value_percentage = 0;

    $scope.decimal_factor = 1;  // factor to be divided with and multiplied with in rounding

    $scope.mouse_is_down = false;
    $scope.promise = null;
    $scope.time_down = 0;

    $scope.slider_width = 300;

    $scope.range_name = null;

    $scope.must_hide_slider = function () {
      return !(
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_bathy') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_soil') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_crop_type') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_infiltration') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_interception') ||
                 (clientstate.program_mode === 'rain') ||
                 (clientstate.program_mode === 'flood_fill_relative') ||
                 (clientstate.program_mode === 'flood_fill_absolute') ||
                 (clientstate.program_mode === 'discharge') ||
                 (clientstate.program_mode === 'wind')
                );
    };

    $scope.must_hide_inline_settings = function () {
      return ((clientstate.program_mode === 'rain') &&
               !(clientstate.features.scenario_rain_local)) ||
               (clientstate.program_mode === 'wind');
    };

    $scope.open_settings_from_slider = function () {
      $scope.time_down = 0;
      $scope.mouse_is_down = false;
      $rootScope.$broadcast('close_box', '');
      clientstate.modal.setTemplate('edit_settings', true);
    };

    $scope.update_current_slider = function () {
        // we set the range_name in the $scope because it is used in the template as well.
      if (clientstate.program_mode === modes.MODE_EDIT) {
        $scope.range_name = clientstate.edit_mode;
      } else {
        $scope.range_name = clientstate.program_mode;
      }
      if ($scope.range_name in clientstate.edit_ranges) {
        $scope.value_min = clientstate.edit_ranges[$scope.range_name].min;
        $scope.value_max = clientstate.edit_ranges[$scope.range_name].max;
        $scope.decimal_factor = Math.pow(10, clientstate.edit_ranges[$scope.range_name].decimals);
        var valueFract = (
                clientstate.edit_ranges[$scope.range_name].value -
                $scope.value_min) / (
                $scope.value_max - $scope.value_min);
        $scope.set_value($scope.range_name, valueFract);
      }
    };

    // if the program mode switches, we have to update some vars
    $scope.$watch('clientstate.program_mode', function () {
      $scope.update_current_slider();
    });

    // edit_mode also influences the range_name
    $scope.$watch('clientstate.edit_mode', function () {
      $scope.update_current_slider();
    });

    $scope.update_percentage = function (varName) {
      $scope.value_percentage = 100 * (
            clientstate.edit_ranges[varName].value -
            clientstate.edit_ranges[varName].min) / (
            clientstate.edit_ranges[varName].max -
            clientstate.edit_ranges[varName].min);
    };

    $scope.$watch('clientstate.edit_ranges.rain.value', function () {
      $scope.update_percentage('rain');
    });

    $scope.$watch('clientstate.edit_ranges.discharge.value', function () {
      $scope.update_percentage('discharge');
    });

    $scope.$watch('clientstate.edit_ranges.flood_fill_absolute.value', function () {
      $scope.update_percentage('flood_fill_absolute');
    });
    $scope.$watch('clientstate.edit_ranges.flood_fill_relative.value', function () {
      $scope.update_percentage('flood_fill_relative');
    });

    $scope.$watch('clientstate.edit_ranges.edit_bathy.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_BATHY) {
        $scope.update_percentage('edit_bathy');
      }
    });

    $scope.$watch('clientstate.edit_ranges.edit_soil.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_SOIL) {
        $scope.update_percentage('edit_soil');
      }
    });

    $scope.$watch('clientstate.edit_ranges.edit_crop_type.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_CROP_TYPE) {
        $scope.update_percentage('edit_crop_type');
      }
    });

    $scope.$watch('clientstate.edit_ranges.edit_friction.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_FRICTION) {
        $scope.update_percentage('edit_friction');
      }
    });

    $scope.$watch('clientstate.edit_ranges.edit_infiltration.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_INFILTRATION) {
        $scope.update_percentage('edit_infiltration');
      }
    });

    $scope.$watch('clientstate.edit_ranges.edit_interception.value', function () {
      if (clientstate.edit_mode === modes.EDIT_MODE_INTERCEPTION) {
        $scope.update_percentage('edit_interception');
      }
    });

    // calculate real value using fraction and round to correct number of decimals
    $scope.set_value = function (rangeName, valueFract) {
      $scope.value_percentage = 100 * valueFract;
      clientstate.edit_ranges[rangeName].value =
            Math.round(valueFract * ($scope.value_max - $scope.value_min) *
                $scope.decimal_factor) / $scope.decimal_factor +
            $scope.value_min;
    };

    $scope.mouse_down = function () {
      $scope.mouse_is_down = true;
      $scope.time_down = 0;
    };

    $scope.get_x = function (event) {
      var x = event.offsetX;  // normal browsers
      if (x === undefined) {
        // hack for firefox
        x = event.clientX - $(event.currentTarget).offset().left;
      }
      return x;
    };

    $scope.mouse_up = function (event) {
      $scope.mouse_is_down = false;
      $scope.set_value($scope.range_name, $scope.get_x(event) / $scope.slider_width);
    };

    $scope.mouse_move = function (event) {
      if ($scope.mouse_is_down) {
        $scope.set_value($scope.range_name, $scope.get_x(event) / $scope.slider_width);
        $scope.time_down = 0;
      }
    };
  }
]);
