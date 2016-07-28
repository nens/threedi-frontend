
const $ = require('jquery');

/* This is the PI menu. */
angular.module('threedi-client').controller('PanelSwitcher', [
  '$scope',
  '$rootScope',
  'clientState',
  function (
    $scope,
    $rootScope,
    clientState
  ) {
    $scope.clientState = clientState;

    $scope.open_close = function (itemName) {
      if (clientState.active_panel !== itemName) {
        console.log('Show side bar');
        clientState.active_panel = itemName;
        $scope.currently_opened = itemName;
        $('#off-canvas').addClass('show');
      } else {
        console.log('Hide side bar');
        $scope.currently_opened = '';
        clientState.active_panel = '';
        $('#off-canvas').removeClass('show');
      }
    };

    $scope.must_show_infopoint_btn = function () {
      try {
        return clientState.features.gui_infopoint_depth ||
        clientState.features.gui_infopoint_waterlevel ||
        clientState.features.gui_infopoint_groundwaterlevel;
      } catch (e) {
        return false;
      }
    };
  }
]);
