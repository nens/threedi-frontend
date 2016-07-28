

angular.module('threedi-client').controller('DefaultSettings', [
  '$scope',
  'clientState',
  'state',
  '$rootScope',
  'socket',
  'BeaufortConverterService',
  function (
    $scope,
    clientState,
    state,
    $rootScope,
    socket,
    BeaufortConverterService
  ) {
        // socket is used to send and receive the value of:
        // min_time_sim_step, wind_direction, wind_speed

    $scope.scenario_event_defaults = clientState.scenario_event_defaults;
    $scope.map_defaults = clientState.map_defaults;
        // Values in input fields
    $scope.crop_type = $scope.scenario_event_defaults.crop_type;
    $scope.soil_type = $scope.scenario_event_defaults.soil_type;
    $scope.infiltration_value = $scope.scenario_event_defaults.infiltration_value;
    $scope.interception_value = $scope.scenario_event_defaults.interception_value;
        //
    $scope.bathy_mode = $scope.scenario_event_defaults.bathy_mode;
    $scope.land_use_value = $scope.scenario_event_defaults.land_use_color;
    $scope.wms_options_hmax = $scope.scenario_event_defaults.wms_options.hmax;
    $scope.wms_options_interpolation = $scope.scenario_event_defaults.wms_options.interpolate;
    $scope.wms_layer_depth = $scope.scenario_event_defaults.wms_layer_depth;
    $scope.flood_fill_level = $scope.scenario_event_defaults.flood_fill_level;
    $scope.flood_fill_mode = $scope.scenario_event_defaults.flood_fill_mode;

    $scope.info_mode = $scope.scenario_event_defaults.info_mode;
    $scope.onedee_info_mode = $scope.scenario_event_defaults.onedee_info_mode;
    $scope.time_step_duration = $scope.scenario_event_defaults.time_step_duration;
    $scope.min_time_sim_step = $scope.scenario_event_defaults.min_time_sim_step;

    $scope.wind_direction = $scope.scenario_event_defaults.wind_direction;
    $scope.wind_speed_beaufort = $scope.scenario_event_defaults.wind_speed_beaufort;

    $scope.fill_container = function (ignored) {
      var varContainer = {};
      for (var key in $scope.edit_ranges) {
        if ($scope.edit_ranges.hasOwnProperty(key) && ignored.indexOf(key) === -1) {
          varContainer[key] = {
            'min': $scope.edit_ranges[key].min,
            'max': $scope.edit_ranges[key].max,
            'min_name': key + '_min',
            'max_name': key + '_max'
          };
        }
      }
      return varContainer;
    };

        // Edit ranges
    $scope.edit_ranges = clientState.edit_ranges;
    var ignored = ['discharge_type', 'flood_fill_mode'];
    $scope.var_container = $scope.fill_container(ignored);

        // Is called in the template.
    $scope.beaufort_to_ms = BeaufortConverterService.beaufort_to_ms;
    $scope.ms_to_beaufort = BeaufortConverterService.ms_to_beaufort;

    $scope.$on('serverState', function () {
      // use server value
      if ((state.state !== undefined) && (state.state.vars !== undefined)) {
        $scope.scenario_event_defaults.min_time_sim_step = parseFloat(
                    state.state.vars.min_time_for_sim_step) * 10;
        $scope.min_time_sim_step = parseFloat(
                    state.state.vars.min_time_for_sim_step) * 10;

        $scope.scenario_event_defaults.time_step_duration = parseInt(
                    state.state.time_step_duration);
        $scope.time_step_duration = parseInt(
                    state.state.time_step_duration);

        $scope.scenario_event_defaults.wind_direction = parseFloat(
                    state.state.vars.wind_direction);
        $scope.wind_direction = parseFloat(
                    state.state.vars.wind_direction);
                // TODO: not beaufort right now
        $scope.scenario_event_defaults.wind_speed_beaufort = $scope.ms_to_beaufort(parseFloat(
                    state.state.vars.wind_speed), 0);
        $scope.wind_speed_beaufort = $scope.ms_to_beaufort(parseFloat(
                    state.state.vars.wind_speed), 0);
      }
    });

    $scope.save_number_value = function (varName, objectName, fieldName) {
            // varName is name of the variable in this controller
            // e.g.: 'flood_fill_relative_min'
            // fieldName is the actual object field getting changed
            // e.g.: 'min' (from clientState.edit_ranges['flood_fill_relative'].min)
            // objectName is the object of that field
            // e.g.: 'flood_fill_relative'
            // This function is constrained to clientState.edit_ranges

            // TODO: validation doesn't work (new angular version??)
      if ($scope.defaultSettings[varName].$valid) {
        clientState.edit_ranges[objectName][fieldName] = (
                    $scope.var_container[objectName][fieldName]);
      }
    };

    $scope.save_min_time_sim_step = function () {
      if ($scope.defaultSettings.min_time_sim_step.$valid) {
        clientState.scenario_event_defaults.min_time_sim_step = parseFloat(
                    $scope.min_time_sim_step);
        socket.emit('set_var',
                    'min_time_sim_step',
                    parseFloat($scope.min_time_sim_step) / 10,
                    function () {});
      }
    };

    $scope.save_wind = function () {
      clientState.scenario_event_defaults.wind_direction = parseFloat(
                $scope.wind_direction);
      clientState.scenario_event_defaults.wind_speed_beaufort = parseFloat(
                $scope.wind_speed_beaufort);
      socket.emit('change_object',
        {
          object_type: 'wind',
          wind_speed: $scope.beaufort_to_ms(parseFloat($scope.wind_speed_beaufort), 2),
          wind_direction: parseFloat($scope.wind_direction)
        }, function () {});
    };

    $scope.save_time_step_duration = function () {
      if ($scope.defaultSettings.time_step_duration.$valid) {
        clientState.scenario_event_defaults.time_step_duration = parseInt(
                    $scope.time_step_duration);
        socket.emit('set_var',
                    'time_step_duration', parseInt($scope.time_step_duration),
                    function () {});
      }
    };

    $scope.save_crop_type = function () {
      if ($scope.defaultSettings.crop_type.$valid) {
        clientState.scenario_event_defaults.crop_type = parseInt(
                    $scope.crop_type);
      }
    };

    $scope.save_soil_type = function () {
      if ($scope.defaultSettings.soil_type.$valid) {
        clientState.scenario_event_defaults.soil_type = parseInt(
                    $scope.soil_type);
      }
    };

    $scope.save_infiltration_value = function () {
      if ($scope.defaultSettings.infiltration_value.$valid) {
        clientState.scenario_event_defaults.infiltration_value = parseFloat(
                    $scope.infiltration_value);
      }
    };

    $scope.save_interception_value = function () {
      if ($scope.defaultSettings.interception_value.$valid) {
        clientState.scenario_event_defaults.interception_value = parseFloat(
                    $scope.interception_value);
      }
    };

    $scope.save_bathy_mode = function () {
      if ($scope.defaultSettings.bathy_mode.$valid) {
        clientState.scenario_event_defaults.bathy_mode = parseInt(
                    $scope.bathy_mode);
      }
    };

    $scope.save_land_use_value = function () {
      console.log('Save land use value');
      if ($scope.defaultSettings.land_use_value.$valid) {
        clientState.scenario_event_defaults.edit_land_use_color = parseInt(
                    $scope.land_use_value);
      }
    };

    $scope.save_flood_fill_level = function () {
      if ($scope.defaultSettings.flood_fill_level.$valid) {
        clientState.scenario_event_defaults.flood_fill_level = parseFloat(
                    $scope.flood_fill_level);
      }
    };

    $scope.save_flood_fill_mode = function () {
      if ($scope.defaultSettings.flood_fill_mode.$valid) {
        clientState.scenario_event_defaults.flood_fill_mode = parseInt(
                    $scope.flood_fill_mode);
      }
    };

        // Kinda dirty: requires $rootScope and state
    $scope.save_wms_options_hmax = function () {
      if (!$scope.defaultSettings.wms_options_hmax.$valid) {
        return;
      }
      clientState.scenario_event_defaults.wms_options.hmax = parseFloat(
                $scope.wms_options_hmax);

      $rootScope.$broadcast('animation-update');
    };

    $scope.save_wms_options_interpolation = function () {
      if (!$scope.defaultSettings.wms_options_interpolation.$valid) {
        return;
      }
      clientState.scenario_event_defaults.wms_options.interpolate =
                $scope.wms_options_interpolation;

      $rootScope.$broadcast('animation-update');
    };

    $scope.save_wms_layer_depth = function () {
      if (!$scope.defaultSettings.wms_layer_depth.$valid) {
        return;
      }
      clientState.scenario_event_defaults.wms_layer_depth = $scope.wms_layer_depth;
      $rootScope.$broadcast('animation-update', 'reset');
    };

    $scope.save_info_mode = function () {
      if ($scope.defaultSettings.info_mode.$valid) {
        clientState.scenario_event_defaults.info_mode = $scope.info_mode;
      }
    };

    $scope.save_onedee_info_mode = function () {
      if ($scope.defaultSettings.onedee_info_mode.$valid) {
        clientState.scenario_event_defaults.onedee_info_mode = $scope.onedee_info_mode;
      }
    };

    $scope.wind_direction_textual = function (deg) {
      // degrees to text;
      deg = deg % 360; // eslint-disable-line
      let direction = '';
      if ((deg < 22.5) || (deg >= 360 - 22.5)) {
        direction = 'coming from S';
      } else if ((deg >= 45 - 22.5) && (deg < 45 + 22.5)) {
        direction = 'coming from SW';
      } else if ((deg >= 90 - 22.5) && (deg < 90 + 22.5)) {
        direction = 'coming from W';
      } else if ((deg >= 135 - 22.5) && (deg < 135 + 22.5)) {
        direction = 'coming from NW';
      } else if ((deg >= 180 - 22.5) && (deg < 180 + 22.5)) {
        direction = 'coming from N';
      } else if ((deg >= 225 - 22.5) && (deg < 225 + 22.5)) {
        direction = 'coming from NE';
      } else if ((deg >= 270 - 22.5) && (deg < 270 + 22.5)) {
        direction = 'coming from E';
      } else if ((deg >= 315 - 22.5) && (deg < 315 + 22.5)) {
        direction = 'coming from SE';
      }
      return direction;
    };

    $scope.get_wind_direction = function () {
      return $scope.wind_direction
                   + '° ('
                   + $scope.wind_direction_textual($scope.wind_direction)
                   + ')';
    };
  }
])
// Got this directive from: http://stackoverflow.com/q/24248098
.directive('dynamicName', function ($compile) {
  return {
    restrict: 'A',
    terminal: true,
    priority: 1000,
    link: function (scope, element, attrs) {
      element.attr('name', scope.$eval(attrs.dynamicName));
      element.removeAttr('dynamic-name');
      $compile(element)(scope);
    }
  };
});
