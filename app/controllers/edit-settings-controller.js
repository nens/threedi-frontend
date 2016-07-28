// globally because.. you know
const moment = require('moment');
require('moment-timezone');

/* Settings popup */
angular.module('threedi-client')
  .controller('EditSettings', ['$scope', 'clientState', 'state', 'socket', 'modes',
  function ($scope, clientState, state, socket, modes) {
    $scope.close = function () {
      clientState.modal.active = false;
      $scope.emit_to_socket();
    };

    $scope.close_via_OK_button = function () {
      clientState.modal.active = false;
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

    $scope.clientState = clientState;
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

      clientState.edit_ranges['radar_multiplier'].value = rain_event.radar_multiplier;
      clientState.edit_ranges['rain_design_definition'].value = rain_event.design_definition;
      clientState.edit_ranges['rain_constant_intensity'].value = rain_event.constant_intensity;
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
            clientState.edit_ranges['radar_multiplier'].value,
            clientState.edit_ranges['rain_design_definition'].value,
            clientState.edit_ranges['rain_constant_intensity'].value,
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

    $scope.must_show_flood_fill_validation_error = function () {
      return (clientState.edit_ranges.flood_fill_mode.value === '1'
              && $scope.manualInputAbsolute.$error.required
              && $scope.manual_input)
              ||
              (clientState.edit_ranges.flood_fill_mode.value === '0'
              && $scope.manualInput.$error.required
              && $scope.manual_input);
    };

  }]);
