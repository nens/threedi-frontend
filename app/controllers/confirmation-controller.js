const angular = require('angular');

/* Resetting the model needs confirmation */
angular.module('threedi-client').controller('Confirmation', [
  '$scope',
  '$rootScope',
  'clientState',
  'state',
  'Message',
  function (
      $scope,
      $rootScope,
      clientState,
      state,
      Message
    ) {
    $scope.$on('serverState', function () {
      $scope.isMaster = state.master;
      $scope.have_master = state.have_master;
      if (!state.hasOwnProperty('player')) { return "there's no state to read";}
      if ($scope.have_master) {
        $scope.master_name = state.state.player.master_name;
      } else {
        $scope.master_name = '';  // there is no master, but the name is still there
      }

      return $scope.master_name;
    });

    /* if "message" is empty the default string in angular.module("threedi-client")
  .factory(Message) will be used*/
    $scope.confirm = function (message) {
      $scope.message = message;
      if ($scope.message) {
        Message.setConfirmMessage($scope.message); // updating the factory,
      }
      $rootScope.$broadcast('close_box', '');
      $rootScope.keypress_enabled = false;
      clientState.modal.setTemplate('confirmation', true);
    };
  }]);
