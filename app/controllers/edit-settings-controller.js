// globally because.. you know
const moment = require('moment');
require('moment-timezone');

/* Settings popup */
angular.module('threedi-client')
  .controller('EditSettings', ['$scope', 'clientState', 'state', 'socket', 'modes',
  function ($scope, clientstate, state, socket, modes) {
    $scope.close = function () {
      clientstate.modal.active = false;
      $scope.emit_to_socket();
    };

    $scope.close_via_OK_button = function () {
      clientstate.modal.active = false;
      // If this timeout is omitted, +/- 20% of emit_to_socket calls
      // erroniously use the previously set $scope.radar_dt value.
      // TODO: find out why this happens/use a neater ("more-angular-esque")
      // solution.
      if (state.master) {
        setTimeout(function () {
          console.log('[dbg] Submitting (after delay) to server: radar_dt ='
            + $scope.radar_dt);
          $scope.emit_to_socket();
        }, 1000);
      }
    };

    // note: the part after manual_input_ must match a range_var
    // used in a template tag.
    $scope.manual_input_rain = false;
    $scope.manual_input_rain_duration = false;
    $scope.manual_input_rain_size = false;

    $scope.manual_input_discharge = false;

    $scope.manual_input_edit_bathy = false;
    $scope.manual_input_edit_soil = false;
    $scope.manual_input_edit_crop_type = false;
    $scope.manual_input_edit_infiltration = false;
    $scope.manual_input_edit_interception = false;

    $scope.clientstate = clientstate;
    $scope.mouse_is_down = false;
    $scope.value_percentage = [];
    $scope.slider_width = 300;

    // note: the part after manual_input_ must match a range_var
    // used in a template tag.
    $scope.manual_input_rain = false;
    $scope.manual_input_rain_duration = false;
    $scope.manual_input_rain_size = false;

    $scope.manual_input_discharge = false;

    $scope.manual_input_edit_bathy = false;
    $scope.manual_input_edit_soil = false;
    $scope.manual_input_edit_crop_type = false;
    $scope.manual_input_edit_infiltration = false;
    $scope.manual_input_edit_interception = false;

    // these sliders are special and cannot (easily) be replaced by the template tag
    $scope.manual_input = false;  // flood fill absolute
    $scope.manual_input_constant = false;  // constant rain
    $scope.manual_input_radar = false;  // radar

    // area wide rain
    $scope.rain_type = modes.RAIN_OFF;

    $scope.radar_dt_timezone = 'Europe/Amsterdam'; // TODO: make this variable from back-end
    $scope.radar_dt =
      moment.tz('2013-10-13 12:00', $scope.radar_dt_timezone).toDate();

    $scope.radar_dt_server = null;  // dt from server, probably in iso
    $scope.user_changed_radar_dt = false;
    $scope.model_type = null;

    $scope.update_from_server = function () {
      if ($scope.model_type === null) {
        $scope.model_type = state.state.loaded_model_type;
      }

      if ((state.state.rain === undefined) ||
        (state.state.rain.current_rain_grid === undefined) ||
        (state.state.rain.current_rain_grid === null) ||
        (state.state.rain.current_rain_grid === '{}')) {
        // this breaks stuff. so it doesn't by default turn it off
        // $scope.rain_type = modes.RAIN_OFF;
        return;
      }

      if (new Date() - $scope.rain_type_changed < 1000 ||
        state.state.state === 'stopping') {
        return;
      }

      var rain_event = JSON.parse(state.state.rain.current_rain_grid);
      $scope.rain_type = rain_event.rain_type;  // set current tab
      try {
        $scope.radar_dt_server = (
          state.state.rain.current_rain_grid_radar_datetime);
      } catch (e) {
        $scope.radar_dt_server = undefined;
      }

      if (($scope.radar_dt_server !== undefined) &&
          ($scope.radar_dt_server !== 'None')) {
        // From the server-side ts, we strip the UTC offset hours, and act like
        // the timestamp is relative to Greenwich....
        // TODO: also split on "-" since we might receive server-side timestamps
        // with a negative UTC offset..
        var prefix = $scope.radar_dt_server.split('+')[0];
        // Therefore, we need to interpret the string like it's timezone
        // is "Etc/UTC":
        var momentDate = moment.tz(prefix, 'Etc/UTC');
        $scope.radar_dt = momentDate.toDate();
      }

      clientstate.edit_ranges['radar_multiplier'].value = rain_event.radar_multiplier;
      clientstate.edit_ranges['rain_design_definition'].value = rain_event.design_definition;
      clientstate.edit_ranges['rain_constant_intensity'].value = rain_event.constant_intensity;
    };

    // initial update
    $scope.update_from_server();

    // react on server state
    $scope.$on('serverState', $scope.update_from_server);

    $scope.$on('new-model', function () {
      // reset all vars
      console.log('new-model in settings-controller');
      $scope.rain_type = modes.RAIN_OFF;
    });

    $scope.emit_to_socket = function () {
      // note: modes.RAIN_OFF is also a type
      // we give all the available numbers, but the server will choose
      // depending on the rain_type

      if (state.master === true) {
        console.log("emit to socket: 'area_wide_rain'...");
        socket.emit('area_wide_rain',
            $scope.rain_type,
            $scope.radar_dt.toISOString(),
            clientstate.edit_ranges['radar_multiplier'].value,
            clientstate.edit_ranges['rain_design_definition'].value,
            clientstate.edit_ranges['rain_constant_intensity'].value,
            function () {});
      } else {
        console.log(
          "Warning: wanted to emit area_wide_rain, but that's for master only");
      }
    };

    // change rain type triggers en emit.
    $scope.set_rain_type = function (newType) {
      // Stop simulation
      if (state.master === true) {
        console.log('emit to socket: stop_simulation');
        socket.emit(
            'stop_simulation',
            function () {
              console.log('emit simulation stop');
            });

        $scope.rain_type_changed = new Date();
        $scope.rain_type = newType;
        if (newType !== 'radar')
          $scope.emit_to_socket();
      } else {
        console.log(
          "Warning: wanted to set_rain_type, but that's for master only");
      }
    };

    // sliders
    // calculate value_percentage
    $scope.update_percentage = function (var_name) {
      $scope.value_percentage[var_name] = 100 * (
          clientstate.edit_ranges[var_name].value -
          clientstate.edit_ranges[var_name].min) / (
            clientstate.edit_ranges[var_name].max -
            clientstate.edit_ranges[var_name].min);
    };

    $scope.update_percentage_pow2 = function (var_name) {
      $scope.value_percentage[var_name] = 100 *
        Math.pow((clientstate.edit_ranges[var_name].value -
              clientstate.edit_ranges[var_name].min) /
            (clientstate.edit_ranges[var_name].max -
             clientstate.edit_ranges[var_name].min), 0.5);
    };

    $scope.$watch('clientstate.edit_ranges.rain.value', function () {
      $scope.update_percentage('rain');
    });

    $scope.$watch('clientstate.edit_ranges.rain_duration.value', function () {
      $scope.update_percentage('rain_duration');
    });

    $scope.$watch('clientstate.edit_ranges.rain_size.value', function () {
      $scope.update_percentage('rain_size');
    });

    $scope.$watch('clientstate.edit_ranges.discharge.value', function () {
      $scope.update_percentage('discharge');
    });

    $scope.$watch('clientstate.edit_ranges.discharge_type.value', function () {
      $scope.update_percentage('discharge_type');
    });

    $scope.$watch('clientstate.edit_ranges.edit_bathy.value', function () {
      $scope.update_percentage('edit_bathy');
    });

    $scope.$watch('clientstate.edit_ranges.edit_soil.value', function () {
      $scope.update_percentage('edit_soil');
    });

    $scope.$watch('clientstate.edit_ranges.edit_crop_type.value', function () {
      $scope.update_percentage('edit_crop_type');
    });

    $scope.$watch('clientstate.edit_ranges.edit_infiltration.value', function () {
      $scope.update_percentage('edit_infiltration');
    });

    $scope.$watch('clientstate.edit_ranges.edit_interception.value', function () {
      $scope.update_percentage('edit_interception');
    });

    $scope.$watch('clientstate.edit_ranges.radar_multiplier.value', function () {
      $scope.update_percentage('radar_multiplier');
    });

    $scope.$watch('clientstate.edit_ranges.rain_constant_intensity.value', function () {
      $scope.update_percentage_pow2('rain_constant_intensity');
    });

    $scope.$watch('clientstate.edit_ranges.flood_fill_absolute.value', function () {
      $scope.update_percentage('flood_fill_absolute');
    });

    $scope.$watch('clientstate.edit_ranges.flood_fill_relative.value', function () {
      $scope.update_percentage('flood_fill_relative');
    });

    $scope.$watch('clientstate.edit_ranges.flood_fill_mode.value', function () {
      $scope.update_percentage('flood_fill_mode');
      // keep track of the flood_fill mode
      if ((clientstate.program_mode === modes.MODE_FLOODFILL_ABSOLUTE) ||
        (clientstate.program_mode === modes.MODE_FLOODFILL_RELATIVE)) {
        if (clientstate.edit_ranges['flood_fill_mode'].value === 0) {
          clientstate.setMode(modes.MODE_FLOODFILL_RELATIVE);
        } else if (clientstate.edit_ranges['flood_fill_mode'].value === 1) {
          clientstate.setMode(modes.MODE_FLOODFILL_ABSOLUTE);
        }
      }
    });

    // TODO: is this part correct or should it be deleted?

    $scope.$watch('clientstate.edit_ranges.edit_bathy.value', function () {
      $scope.update_percentage('edit_bathy');
    });

    $scope.$watch('clientstate.edit_ranges.edit_crop_type.value', function () {
      $scope.update_percentage('edit_crop_type');
    });

    $scope.$watch('clientstate.edit_ranges.edit_soil.value', function () {
      $scope.update_percentage('edit_soil');
    });

    $scope.$watch('clientstate.edit_ranges.edit_infiltration.value', function () {
      $scope.update_percentage('edit_infiltration');
    });

    $scope.$watch('clientstate.edit_ranges.edit_interception.value', function () {
      $scope.update_percentage('edit_interception');
    });

    // END TODO

    $scope.get_x = function (event) {
      var x = event.offsetX;  // normal browsers
      if (x === undefined) {
        // hack for firefox
        x = event.clientX - $(event.currentTarget).offset().left;
      }
      return x;
    };

    // calculate real value using fraction and round to correct number of decimals
    $scope.set_value = function (var_name, value_fract) {
      var value_max = clientstate.edit_ranges[var_name].max;
      var value_min = clientstate.edit_ranges[var_name].min;
      var decimal_factor = Math.pow(10, clientstate.edit_ranges[var_name].decimals);
      var old_value = clientstate.edit_ranges[var_name].value;
      if ((clientstate.edit_ranges[var_name].slider_type === undefined) ||
          (clientstate.edit_ranges[var_name].slider_type === 'linear')) {
        clientstate.edit_ranges[var_name].value =
              Math.round(value_fract * (value_max - value_min) *
                  decimal_factor) / decimal_factor + value_min;
      } else if (clientstate.edit_ranges[var_name].slider_type === 'pow2') {
        clientstate.edit_ranges[var_name].value =
              Math.round(Math.pow(value_fract, 2) *
                  (value_max - value_min) * decimal_factor) /
              decimal_factor + value_min;
      }
      $scope.update_percentage(var_name);
      return old_value != clientstate.edit_ranges[var_name].value;  // changed
    };

    $scope.mouse_down = function (var_name, event) {
      $scope.mouse_is_down = true;
    };

    $scope.mouse_up = function (var_name, event) {
      $scope.mouse_is_down = false;
      return $scope.set_value(var_name, $scope.get_x(event) / $scope.slider_width);
    };

    $scope.mouse_move = function (var_name, event) {
      if ($scope.mouse_is_down) {
        return $scope.set_value(var_name, $scope.get_x(event) / $scope.slider_width);
      }
      return false;
    };

    // for rain_design_definition
    $scope.mouse_click = function (var_name, value) {
      clientstate.edit_ranges[var_name].value = value;
      console.log('################',
          clientstate.edit_ranges[var_name].value);
      $scope.emit_to_socket();
    };

    $scope.toggle_edit_mode = function (new_mode) {
      clientstate.edit_mode = new_mode;
    };

    $scope.must_show_flood_fill_validation_error = function () {
      return (clientstate.edit_ranges.flood_fill_mode.value === '1'
              && $scope.manualInputAbsolute.$error.required
              && $scope.manual_input)
              ||
              (clientstate.edit_ranges.flood_fill_mode.value === '0'
              && $scope.manualInput.$error.required
              && $scope.manual_input);
    };

  }]);
