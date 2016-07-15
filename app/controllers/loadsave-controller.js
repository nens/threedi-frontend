
const showalert = require('../showalert');

/*
The Archive scenario screen.

Keypress is disabled before entering this controller.
Enable when leaving using $rootScope.
*/
angular.module('threedi-client').controller('LoadSave', [
  '$scope',
  '$rootScope',
  'clientState',
  'socket',
  'state',
  function ($scope,
    $rootScope,
    clientState,
    socket,
    state
  ) {
    $scope.storing = false;
    $scope.clicked_archive = false;
    $scope.results = {
      max_depth: true,
      arrival_time: true,
      arrival_time_at_depth_enabled: true,
      arrival_time_at_depth_value: 0.3,
      vulnerable_buildings: true,
      roads: true,
      wss: true,
      hisssm: true,
      water_flow_velocity: true,
      water_rise_velocity: true
    };

    // when clicking the X, this function is called. Enable keypressing.
    $scope.close = function () {
      $rootScope.keypress_enabled = true;
    };

    $scope.$on('serverState', function () {
      $scope.storing = state.state.state === 'archive';
      if (($scope.storing === false) && ($scope.clicked_archive)) {
        // close modal
        clientState.modal.active = false;
        $rootScope.keypress_enabled = true;
        $scope.clicked_archive = false;
      }
    });

    $scope.archive_scenario = function () {
      if ($scope.storing) {
        console.log('Not archiving because I\'m already busy.');
        return;
      }
      if (state.master === true) { // adding class "disabled" only makes it grey
        console.log($scope.results);
        $scope.clicked_archive = true;
        $scope.storing = true;
        showalert('Busy archiving scenario');
        socket.emit('archive_scenario', {
          name: $scope.scenario_name,
          results_dict: $scope.results,
          notify: $scope.notify
        },
      function () {
      });
      }
    };
  }]);
