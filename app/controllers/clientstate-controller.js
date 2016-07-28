

/**
 * The ClientState controller controls and watches the state. In every child you
 * can use setMode(mode) to set a mode and let the buttons react on it.
 */

angular.module('threedi-client').controller('ClientState', [
  '$scope',
  'state',
  'clientState',
  'modes',
  function ($scope, state, clientState, modes) {
    $scope.clientState = clientState;
    $scope.c = clientState;
    clientState.bg_onedee_inverted = false; // for default bg, Google Satellite

    $scope.setMode = function (mode) {
      if (clientState.program_mode !== mode) {
        // turn button on
        clientState.setMode(mode);
      } else {
        // turn off if not info point or line
        if ((clientState.program_mode !== modes.MODE_INFO_POINT) &&
        (clientState.program_mode !== modes.MODE_INFO_LINE)) {
          clientState.setMode(modes.MODE_INFO_POINT);
        }
      }
    };

    // this message comes from "state"
    // is not strictly necessary, but it is nice and short in the .html
    $scope.$on('serverState', function () {
      $scope.isMaster = state.master;
      if ((!$scope.isMaster) &&
      (clientState.program_mode !== modes.MODE_INFO_POINT) &&
      (clientState.program_mode !== modes.MODE_INFO_LINE)) {
        // Reset client state to navigation mode
        clientState.setMode(modes.MODE_INFO_POINT);
      }
    });

    // Remember: the buttons info-point, info-line, etc are part of
    // ClientState. The controllers are bound to the popup.
    $scope.$on('keypress-info-point', function () {
      $scope.setMode(modes.MODE_INFO_POINT);
    });

    $scope.$on('keypress-info-line', function () {
      $scope.setMode(modes.MODE_INFO_LINE);
    });

    // Set InfoPoint mode --> Lars: disabled for now, is interfering with manual input
    /*
    $scope.$on('keypress-1', function(message, value) {clientState.setInfoMode('s1');});
    $scope.$on('keypress-2', function(message, value) {clientState.setInfoMode('su');});
    $scope.$on('keypress-3', function(message, value) {clientState.setInfoMode('vol');});
    $scope.$on('keypress-4', function(message, value) {clientState.setInfoMode('dep');});
    $scope.$on('keypress-5', function(message, value) {clientState.setInfoMode('ucx');});
    $scope.$on('keypress-6', function(message, value) {clientState.setInfoMode('ucy');});
    $scope.$on('keypress-7', function(message, value) {clientState.setInfoMode('interception');});
    $scope.$on('keypress-8', function(message, value) {clientState.setInfoMode('rain');});
    $scope.$on('keypress-9', function(message, value) {clientState.setInfoMode('evap');});
    */
  }
]);
