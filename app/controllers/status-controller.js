const angular = require('angular');
const moment = require('moment');
const map = require('../leaflet').map;

/* Lower bar contents */
angular.module('threedi-client').controller('Status', [
  '$scope',
  'state',
  'clientState',
  'AnimatedLayer',
  'socket',
  'UtilService',
  'BeaufortConverterService',
  function (
    $scope,
    state,
    clientstate,
    AnimatedLayer,
    socket,
    UtilService,
    BeaufortConverterService
  ) {
    $scope.c = clientstate;
    $scope.serverState = 'wait';
    $scope.has_rtc = '0';
    $scope.status_label = '-';
    $scope.state = null;
    $scope.state_for_color = '';  // for ng-class
    $scope.state_for_icon = '';  // for ng-class
    $scope.timestep = 0;
    $scope.pending_actions = 1;
    $scope.rain_label = '';
    $scope.show_rain_data = false;
    $scope.wind_label = '';
    $scope.show_wind_data = false;
    $scope.show_status_data = false;
    $scope.skipping = false;
    $scope.machines_busy = false;
    var msToBeaufort = BeaufortConverterService.ms_to_beaufort;

    var discrepancyMessage = function (stateTimestep, wmsTimestep) {
      var timestepDiff = stateTimestep - wmsTimestep;
      if (Math.abs(timestepDiff) > 10) {
        return '. WMS is behind (' + timestepDiff + ' ts)';
      } else {
        return '';
      }
    };

    $scope.$on('serverState', function () {
      /* sophisticated routine to give the user a good status view. */
      var wmsLayerTimestep = AnimatedLayer.last_loaded_timestep();
      var wmsLastRequestedTimestep = AnimatedLayer.get_last_requested_timestep();
      var currentTimestep = parseInt(state.state.timestep_calc);

      $scope.state = state.state;
      $scope.state_text = state.state_text;
      $scope.state_for_color = state.state.state;
      $scope.status_label = state.status_label;
      $scope.detail_info = state.detail_info;

        // circle or rotate. circle adds icon-circle class
      var machineManagerStates = ['machine-requested',
                                      'machine-requesting',
                                      'machine-powering',
                                      'machine-powered'];

      $scope.state_for_icon = 'rotate';
      if (debug_extra) { // eslint-disable-line
        console.log('State from server: ', state.state);
      }
      console.log('Current state: ', state.state.state, '**************');
      if (state.state.state === 'sim') {
        console.log('t =', state.state.time_seconds);
      }

      var discrMsg = '';
        // set some variables for visualization
      switch (state.state.state) {
      case 'wait':
        if ((currentTimestep !== wmsLayerTimestep) ||
                    (wmsLayerTimestep !== wmsLastRequestedTimestep)) {
          discrMsg = discrepancyMessage(currentTimestep, wmsLayerTimestep);
          $scope.status_label += ' Loading wms.';
          $scope.status_label += discrMsg;
          $scope.state_for_color = 'sim';
        }
        $scope.state_for_icon = 'circle';
        break;
      case 'sim':
        discrMsg = discrepancyMessage(currentTimestep, wmsLayerTimestep);
        $scope.status_label += discrMsg;
        if ((state.state.wms_busy === '1') ||
                    (currentTimestep - wmsLayerTimestep > 50) ||
                    (currentTimestep === 0)) {
          $scope.state_for_color = 'sim-busy';
        } else {
          $scope.state_for_color = 'sim';
          $scope.state_for_icon = 'circle';
        }
        break;
      case 'wait-load-model':
      case 'crashed-model':
        $scope.state_for_icon = 'circle';
        break;
      case 'machine-requested':
      case 'machine-requesting':
      case 'machine-powering':
      case 'machine-powered':
        $scope.state_for_color = 'mm-busy';
        break;
      default:
        // nothing really
        break;
      }

      $scope.has_rtc = parseFloat(state.state.has_rtc);
      $scope.pending_actions = (!UtilService.contains(machineManagerStates, state.state.state)) ? parseInt(state.state.pending_actions) : NaN;
      $scope.timestep = currentTimestep;
        // rain grid label
      if ((state.state.rain) &&
            (state.state.rain.current_rain_grid) &&
            (state.state.rain.current_rain_grid !== null)) {
        var rainEvent = JSON.parse(state.state.rain.current_rain_grid);
        if (rainEvent.rain_type === 'radar') {
          var dt = state.state.rain.current_rain_grid_radar_datetime;
          if (dt) {
            var prefix = dt.substring(0, dt.length - 6);
            var momentDate = moment.tz(prefix, 'Etc/UTC');
            $scope.rain_label = 'radar: ' +  momentDate.toDate();
          }
        } else if (rainEvent.rain_type === 'design') {
          $scope.rain_label =
                    'design: ' +
                    parseFloat(state.state.rain.current_rain_grid_design_mm_total).toFixed(1) +
                    ' mm at ' +
                    (parseFloat(state.state.rain.current_rain_grid_design_time_seconds) / 60) +
                    ' minutes';
        } else if (rainEvent.rain_type === 'constant') {
          $scope.rain_label =
                    'constant rain: ' +
                    Math.round(parseFloat(rainEvent.constant_intensity) * 10) / 10 + ' mm/h';
        }
      } else {
        $scope.rain_label = 'Area wide rain is disabled.';
        $scope.show_rain_data = false;
      }
        // wind label
      if ((state.state.vars !== undefined) && (state.state.vars.wind_speed !== undefined)) {
        var windSpeedBeaufort = msToBeaufort(state.state.vars.wind_speed, 0);
        $scope.wind_label = 'Wind speed: ' + windSpeedBeaufort + ' Beaufort (' +
                state.state.vars.wind_speed + ' m/s)' +
                '. Direction: ' + state.state.vars.wind_direction + '°';
      }
    });

    $scope.addRainIcon = function () {
      var c = $scope.clientstate;
      try {
        return ($scope.state.rain.current_rain_grid !== undefined &&
                    $scope.state.rain.current_rain_grid !== '{}') &&
                    (
                        c.features.scenario_rain_radar ||
                        c.features.scenario_rain_design ||
                        c.features.scenario_rain_constant
                    );
      } catch (e) {
        return false;
      }
    };

    $scope.getWindroseClass = function () {
      if ($scope.state === null) { return ''; }
      if ($scope.state === undefined) { return ''; }
      if ($scope.state.vars === undefined) { return ''; }

      var dir = $scope.state.vars.wind_direction;
      var result;

      if (!withinRange(22.5, dir, 337.5)) {
        result = 'fa-threedi-windrose-n';
      } else if (withinRange(22.5, dir, 67.5)) {
        result = 'fa-threedi-windrose-ne';
      } else if (withinRange(67.5, dir, 112.5)) {
        result = 'fa-threedi-windrose-e';
      } else if (withinRange(112.5, dir, 157.5)) {
        result = 'fa-threedi-windrose-se';
      } else if (withinRange(157.5, dir, 202.5)) {
        result = 'fa-threedi-windrose-s';
      } else if (withinRange(202.5, dir, 247.5)) {
        result = 'fa-threedi-windrose-sw';
      } else if (withinRange(247.5, dir, 292.5)) {
        result = 'fa-threedi-windrose-w';
      } else if (withinRange(292.5, dir, 337.5)) {
        result = 'fa-threedi-windrose-nw';
      }
      return result;
    };

    var withinRange = function (minn, pivot, maxx) {
      return (minn <= pivot) && (maxx >= pivot);
    };

    // set initial extent
    $scope.resetExtent = function () {
        // event comes in as string
      if ($scope.state.player.hasOwnProperty('initial_extent')) {
        clientstate.spatial.extent = JSON.parse($scope.state.player.initial_extent);
        map.fitBounds([
              [clientstate.spatial.extent[0], clientstate.spatial.extent[1]],
              [clientstate.spatial.extent[2], clientstate.spatial.extent[3]]]);
      } else {
        console.log('I am missing the serverState property player.initial_extent...');
      }
    };
  }
]);
