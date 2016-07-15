

/* Controller for 'make_sure' and 'message' */
angular.module('threedi-client').controller('MakeSureCtrl', [
  'clientState',
  '$rootScope',
  'state',
  'socket',
  '$scope',
  function (
    clientState,
    $rootScope,
    state,
    socket,
    $scope
  ) {
    $scope.error_message = '';  // = clientState.error_message_for_controller;
    $scope.normal_message = '';  // = clientState.normal_message_for_controller;

    $scope.logUserOut = function () {
      window.location = angular.element('#logout-btn-via-modal').data('url');
    };

    $scope.checkErrorMessage = function () {
      $scope.error_message = clientState.error_message_for_controller;
      return $scope.error_message;
    };

    $scope.checkNormalMessage = function () {
      $scope.normal_message = clientState.normal_message_for_controller;
      return $scope.normal_message;
    };

    $scope.resetMessages = function () {
      clientState.error_message_for_controller = '';
      $scope.error_message = '';
      clientState.normal_message_for_controller = '';
      $scope.normal_message = '';
    };

    $scope.model_picker = function () {
      $scope.resetMessages();
      clientState.modal.setTemplate('model_picker', true);
    };

    $scope.quit_session = function () {
      console.log('Quit session');
      $scope.resetMessages();
      clientState.modal.setTemplate('landing', true);
      restartTheShiz();
    };

    $scope.close = function () {
      $scope.resetMessages();
      clientState.modal.setTemplate('model_picker', false);
    };

    function restartTheShiz () {
      if (state.master) {
        socket.emit('end_session', function () {});
      }
      clientState.spatial.resetExtent();
      $rootScope.$broadcast('killOneDee');
    }
  }
]);
