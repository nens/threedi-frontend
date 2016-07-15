


/* Play, stop, reset */
angular.module('threedi-client').controller('RemoteControl', [
  '$scope',
  '$rootScope',
  'socket',
  'state',
  'leaflet',
  'clientState',
  'modes',
  function (
      $scope,
      $rootScope,
      socket,
      state,
      leaflet,
      clientstate,
       modes
     ) {
    $scope.wait_for_server_response = true;
    $scope.isMaster = false;

    $scope.$on('serverState', function () {
      $scope.isMaster = state.master;
      $scope.isPlaying = state.state.running_sim !== '0';
      $scope.wait_for_server_response = false;
      if ((state.state.state === 'load-model') ||
            (state.state.state === 'archive') ||
            (parseInt(state.state.pending_actions) > 0)) {
        $scope.wait_for_server_response = true;
      }
      $scope.state = state.state;
      $scope.has_future_events = state.state.has_future_events === '1';  // value
    });

    $scope.play = function () {
      $scope.wait_for_server_response = true;
      if ($scope.isPlaying) {
        $scope.stop();
      } else {
        $scope.isPlaying = true;
        clientstate.setMode(modes.MODE_INFO_POINT);
        socket.emit(
                'run_simulation',
                function () {
                  console.log('emit simulation run');
                });
            // update edit polygon button
        if (clientstate.program_mode === modes.MODE_EDIT) {
                // only in correct program mode
          leaflet.toggle_layer_edit(true);  // turn edit control on
        } else {
          leaflet.toggle_layer_edit(false);  // turn edit control off
        }
      }
    };

    $scope.stop = function () {
      $scope.wait_for_server_response = true;
      $scope.isPlaying = false;
      socket.emit(
            'stop_simulation',
            function () {
              console.log('emit simulation stop');
            });
    };

    $scope.reset = function () {
      $scope.wait_for_server_response = true;
      $scope.isPlaying = false;
      socket.emit(
            'reset_simulation',
            function () {
              $rootScope.$broadcast('new-model');
              console.log('emit simulation reset');
            });
    };

    $scope.$on('keypress-start-stop', function () {
      if (state.master) {
        if ($scope.isPlaying) {
          $scope.stop();
        } else {
          $scope.play();
        }
      }
    });

    $scope.$on('keypress-reset', function () {
      if (state.master) {
        $scope.reset();
      }
    });

    $scope.$on('edit-pause', function () {
      if (state.master && $scope.isPlaying) {
        $scope.stop();
      }
    });
  }
]);
