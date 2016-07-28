

angular.module('threedi-client').controller('TouchingGround', [
  '$rootScope',
  '$scope',
  'clientState',
  'state',
  'socket',
  'UtilService',
  function (
    $rootScope,
    $scope,
    clientState,
    state,
    socket,
    UtilService
  ) {
    // TODO read the default extent from apps's settings
    $scope.end_session_visible = false;
    $scope.master_link = false; // show different link for master
    $scope.follow_link = false; // and follower
    $scope.end_session_visible = true;
    if (!is_user_connected_to_subgrid) { // eslint-disable-line
                                         // --> comes from server
      UtilService.openWelcomePopup();
    }

        /* Click on "Quit current session" */
    $scope.squareOne = function () {
      if (state.master) {
        clientState.makeSure();
      } else if (!state.master) {
        socket.emit('unfollow', state.master, function () {});
        clientState.spatial.resetExtent();
        $rootScope.$broadcast('killOneDee');
        UtilService.openWelcomePopup();
      }
    };

        /* Click on Log out */
    $scope.buttonLogOut = function () {
      clientState.makeSureLogOut();
    };
  }
]);
