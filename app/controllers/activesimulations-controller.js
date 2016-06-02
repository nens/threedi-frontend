const angular = require('angular');
angular.module('threedi-client').controller('ActiveSimulations', [
  '$scope',
  '$rootScope',
  '$http',
  'socket',
  'clientState',
  function (
    $scope,
    $rootScope,
    $http,
    socket,
    clientState
  ) {
    $scope.active_simulations = null;
    $scope.no_simulation = true;
    $scope.load_text = 'Requesting active simulations list...';
    $scope.tab = 'new';
    $scope.get_active_simulations = function () {
      var responsePromise = $http.get('/active_simulations/', {
        timeout: 5000
      });
      responsePromise.success(function (data) {
        if (isEmpty(data)) {
          $scope.no_simulations_text = 'No running simulations at the moment';
          $scope.no_simulation = true;
        } else {
          $scope.no_simulation = false;
        }
        $scope.active_simulations = data;
      }).error(function () {
        console.log('[active_simulations] error: ajax call failed!');
        $scope.active_simulations = [];
        $scope.no_simulation = true;
        $scope.no_simulations_text = 'Failed to retrieve simulations, try again.';
      });
    };
    $scope.followActiveSimulation = function (requestedSubgridId) {
      socket.emit( 'follow_simulation',
                         requestedSubgridId,
                         function () {});
      $rootScope.$broadcast('resetOneDee');
      $rootScope.$broadcast('animation-update');  // let everything move again
      $scope.tab = 'new';
            // $scope.show_first_tab = true;
      clientState.modal.active = false;

            // hacky but neccessary to tune in directly without the
            // need to refresh the browser manually
      socket.reconnect();
    };

    function isEmpty (obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }
  }]);
