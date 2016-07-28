
const map = require('../leaflet').map;

/* Edit functions: Edit the current simulation. Must be in scope of ClientState */
angular.module('threedi-client').controller('Simulator', [
  '$scope',
  '$rootScope',
  'socket',
  'state',
  'clientState',
  'leaflet',
  'modes',
  function (
    $scope,
    $rootScope,
    socket,
    state,
    clientState,
    leaflet,
    modes
  ) {
    $scope.wait_for_server_response = true;
    $scope.leaflet = leaflet;
    $scope.enable_edit_button = true;
    $scope.mouse_is_down = false;
    $scope.time_mouse_is_down = 0;

    var c = clientState;

    $scope.mouse_down = function (newMode) {
      // we want to go to this mode, but we're not there yet
      $scope.time_mouse_is_down = 0;
      $scope.mouse_is_down = true;
      $scope.setMode(newMode);
      if (newMode === modes.MODE_EDIT) {
        $scope.$emit('edit-pause');  // stop the current simulation
      }

      if (clientState.program_mode === modes.MODE_EDIT) {
        // only in correct program mode
        leaflet.toggle_layer_edit(true);  // turn edit control on
      } else {
        leaflet.toggle_layer_edit(false);  // turn edit control off
      }
    };

    $scope.mouse_up = function () {
      $scope.mouse_is_down = false;
      $scope.time_mouse_is_down = 0;
    };

    // special function when clicking flood fill mode button
    $scope.mouse_down_ff = function () {
      if (clientState.edit_ranges.flood_fill_mode.value === 0) {
        $scope.mouse_down(modes.MODE_FLOODFILL_RELATIVE);
      } else {
        $scope.mouse_down(modes.MODE_FLOODFILL_ABSOLUTE);
      }
    };

    $scope.mouse_move = function () {
      $scope.time_mouse_is_down = 0;
    };

    $scope.must_show_rain_btn = function () {
      try {
        return c.features.scenario_rain_local ||
                   c.features.scenario_rain_radar ||
                   c.features.scenario_rain_design ||
                   c.features.scenario_rain_constant;
      } catch (e) {
        return false;
      }
    };

    $scope.must_show_discharge_btn = function () {
      try {
        return c.features.scenario_discharge_overland ||
                   c.features.scenario_discharge_ground;
      } catch (e) {
        return false;
      }
    };

    $scope.floodfill_is_primary = function () {
      return c.program_mode === 'flood_fill_absolute' ||
               c.program_mode === 'flood_fill_relative';
    };

    $scope.must_show_twodee_edit_btn = function () {
      try {
        return c.features.scenario_edit_dem ||
                   c.features.scenario_edit_soil ||
                   c.features.scenario_edit_crop ||
                   c.features.scenario_edit_infiltration ||
                   c.features.scenario_edit_interception;
      } catch (e) {
        return false;
      }
    };

    // Pause due to Leaflet.draw edits
    map.on('draw:created', function () {
      $scope.$emit('edit-pause');
    });

    $scope.$on('serverState', function () {
      $scope.wait_for_server_response = false;
      if ((state.state.state === 'load-model') ||
            (state.state.state === 'archive') ||
            (parseInt(state.state.pending_actions) > 0)) {
        $scope.wait_for_server_response = true;
      }
    });

    $scope.$on('keypress-rain', function () {
      if (state.master) {
        $scope.setMode(modes.MODE_RAIN);
      }
    });

    $scope.$on('keypress-discharge', function () {
      if (state.master) {
        $scope.setMode(modes.MODE_DISCHARGE);
      }
    });


    $scope.$on('keypress-w', function () {
      if (state.master) {
        $scope.setMode(modes.MODE_MANHOLE);
      }
    });

    $scope.$on('keypress-edit', function () {
      if (state.master) {
        $scope.setMode(modes.MODE_EDIT);
      }
    });

    $rootScope.$on('new-model', function () {
      clientState.setMode(modes.MODE_INFO_POINT);
    });
  }
]);
