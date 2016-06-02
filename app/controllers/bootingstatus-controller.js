
/* BootingStatus
state.machines_busy, state_text, progressAmount, status_label
-function returnFromBusyState()
*/
angular.module("threedi-client")
  .controller("BootingStatus", ["$scope", "state", "UtilService",
    function ($scope, state, UtilService){
        $scope.state = null;
        $scope.progressAmount = 0;
        $scope.machine_requested = false;

        function updateProgressBar () {
            switch(state.state.state) {
                case 'machine-requesting':
                    $scope.progressAmount = 5;
                    break;
                case 'machine-requested':
                    $scope.progressAmount = 10;
                    $scope.machine_requested = true;
                    break;
                case 'standby':
                    if ($scope.machine_requested) {
                        $scope.progressAmount = 20;
                    }
                    break;
                case 'prepare-wms':
                    $scope.progressAmount = 25;
                    break;
                case 'machine-powering':
                    $scope.progressAmount = 35;
                    break;
                case 'machine-powered':
                    $scope.progressAmount = 45;
                    break;
                case 'load-model':
                    $scope.progressAmount = 65;
                    break;
                case 'init-modules':
                    $scope.progressAmount = 80;
                    break;
                case 'loaded-model':
                    $scope.progressAmount = 90;
                    break;
                case 'wait':
                    var percentageToGo = 100 - $scope.progressAmount;
                    var newProgressAmount = $scope.progressAmount
                        + Math.round(percentageToGo / 2);
                    $scope.progressAmount = Math.min(100, newProgressAmount);
                    break;
            }
        }

        $scope.$on('serverState', function() {
            updateProgressBar();
            $scope.state = state;
        });

        // "back home" button when booting fails.
        $scope.returnFromBusyState = function () {
            UtilService.openWelcomePopup();
        };
}]);


/* The star on the lower left corner */
angular.module("threedi-client")
  .controller("Director", ["$scope", "$rootScope", "clientState", "state", "socket",
    function ($scope, $rootScope, clientState, state, socket){
    $scope.c = clientState;

    $scope.$on('serverState', function(message){
        $scope.isMaster = state.master;
        $scope.have_master = state.have_master;

        if (!state.hasOwnProperty('state')) { return "there's no state to read" ;}
        if (!state.state.hasOwnProperty('player')) { return "there's no state to read" ;}

        if ($scope.have_master) {
            $scope.master_name = state.state.player.master_name;
        } else {
            $scope.master_name = state.state.player.master_name;
        }
    });

    $scope.requestMaster = function(){
        if (state.master) {
            console.log('giving up master');
        } else {
            console.log('trying to set master...');
        }
        socket.emit('set_master', !state.master, function() {});
    }

    $scope.open_archive_scenario = function() {
        $rootScope.$broadcast('close_box', '');
        $rootScope.keypress_enabled = false;
        clientState.modal.setTemplate('archive_scenario', true);
    }
}]);
