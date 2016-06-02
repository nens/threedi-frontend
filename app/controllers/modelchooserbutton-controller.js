const angular = require('angular');

/* The load model button */
angular.module('threedi-client').controller('ModelChooserButton', [
  '$scope',
  'clientState',
  'state',
  '$rootScope',
  function (
    $scope,
    clientState,
    state,
    $rootScope
  ) {
    // Button handling
    $scope.state = state;


    $scope.$on('serverState', function () {
      $scope.isMaster = state.master;
    });

    $scope.modal = function () {
      if (state.master) {
        $rootScope.$broadcast('close_box', '');
        clientState.modal.setTemplate('model_picker', true);
      }
    };

    $scope.$on('keypress-choose-model', function () {
      if (state.master) {
        // $scope.modal();
      }
    });
  }
]);
