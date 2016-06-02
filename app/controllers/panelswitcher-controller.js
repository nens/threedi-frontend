const angular = require('angular');
const $ = require('jquery');

/* This is the PI menu. */
angular.module('threedi-client').controller('PanelSwitcher', [
  '$scope',
  '$rootScope',
  'clientState',
  function (
    $scope,
    $rootScope,
    clientstate
  ) {
    $scope.clientstate = clientstate;

    $scope.open_close = function (itemName) {
      if (clientstate.active_panel !== itemName) {
        console.log('Show side bar');
        clientstate.active_panel = itemName;
        $scope.currently_opened = itemName;
        $('#off-canvas').addClass('show');
      } else {
        console.log('Hide side bar');
        $scope.currently_opened = '';
        clientstate.active_panel = '';
        $('#off-canvas').removeClass('show');
      }
    };

    $scope.must_show_infopoint_btn = function () {
      try {
        return clientstate.features.gui_infopoint_depth ||
        clientstate.features.gui_infopoint_waterlevel ||
        clientstate.features.gui_infopoint_groundwaterlevel;
      } catch (e) {
        return false;
      }
    };
  }
]);
