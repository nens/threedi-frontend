/* Root controller

Usage:

-1) Add javascript ui-utils.

0) Add ui.directives.

var app = angular.module("threedi-client", ['Components', 'ui.directives']);

1) Place key and function mapping in <body>:

<body ng-controller="Root" ui-keypress="{32: 'trigger(\'start-
stop\')', 113: 'trigger(\'reset\')', 109: 'trigger(\'choose-model\')', 105:
'trigger(\'info-point\')', 108: 'trigger(\'info-line\')', 114:
'trigger(\'rain\')', 100: 'trigger(\'discharge\')', 110:
'trigger(\'navigate\')', 115: 'trigger(\'info-point\')', 97: 'trigger(\'info-
line\')', enter: 'trigger(\'enter\')', 102: 'trigger(\'navigate\')', 48:
'trigger(\'0\')', 49: 'trigger(\'1\')', 50: 'trigger(\'2\')', 51:
'trigger(\'3\')', 52: 'trigger(\'4\')', 53: 'trigger(\'5\')', 54:
'trigger(\'6\')', 55: 'trigger(\'7\')', 56: 'trigger(\'8\')', 57:
'trigger(\'9\')'}" ui-keyup="{'esc': 'trigger(\'esc\')', 37:
'trigger(\'left\')', 38: 'trigger(\'up\')', 39: 'trigger(\'right\')', 40:
'trigger(\'down\')'}">

2) "keypress-<action>" will be broadcast. Place a $scope.$on on this the
   broadcast where needed. Remember to include $rootScope in your controller.

$scope.$on('keypress-1', function(message, value) {$scope.small();});
$scope.$on('keypress-2', function(message, value) {$scope.big();});

Root controller: things that may not be bound to physical html objects

This controller is the root of all things. Changes on this Root controller are
distributed to all its children for free.

*/


const showalert = require('../showalert');
const $ = require('jquery');

angular.module('threedi-client').controller('Root', [
  '$rootScope',
  '$scope',
  '$http',
  'clientState',
  'state',
  'socket',
  function (
    $rootScope,
    $scope,
    $http,
    clientState,
    state,
    socket
  ) {
    $rootScope.keypress_enabled = true;  // kinda dirty
    $scope.trigger = function (action) {
      if ($rootScope.keypress_enabled) {
        console.log('keyboard trigger: ', 'keypress-' + action);
        $rootScope.$broadcast('keypress-' + action);
      }
    };

    $scope.state = state;
    $scope.user = user;

    // set initial heartbeat timeout
    $scope.heartbeat_timeout = new Date().getTime() + 11000;
    $scope.refresh_browser = false;

    $scope.editable_maps = '';
    $scope.animation_maps = '';

    $scope.$watch('state.state.loaded_model', function (newVal, oldVal) {
      if (newVal === oldVal) {return;}
      $http({method: 'GET', url: '/api/v1/active-model'})
            .success(function (data) {
              $scope.editable_maps = data.editable_maps;
              $scope.animation_maps = data.animation_maps;
            })
            .error(function (data) {
              console.error('API call failed:', data);
            });
    });

    /* When starting up fresh. State will be an empty dict*/
    socket.on('freeze', function (senderSessid, yourSessid, state) {
      console.log('processing state from server: ', state);
      $scope.waiting = true;
      resetHeartbeat();
    });

    socket.on('state', function (senderSessid, yourSessid, state) {
      $scope.state.setState(state, yourSessid);

        // update features
      if (state.hasOwnProperty('features')) {
        clientState.features = state.features;
        $rootScope.$broadcast('features');  // Let everybody react
      }
      resetHeartbeat();
    });

    socket.on('heartbeat', function () {
      resetHeartbeat();
    });

    socket.on('scenarios', function (scenarios) {
      console.log('processing scenario list from server: ', scenarios);
      $scope.state.setAvailableScenarios(scenarios);
    });

    socket.on('message', function (msgList) {
        // TODO: messages that trigger some GUI elements should be done using
        // the state object. Only messages purely for the user should be
        // handled here.
      $scope.isMaster = state.master;
      var msg = msgList[0];

      if (msg === 'model_kaput') {
        showalert('model seems to be invalid', 'error alert-danger', 10000);
        $rootScope.$broadcast('killOneDee');
        $rootScope.$broadcast('close_box', '');
        clientState.modal.setTemplate('landing', true);
        socket.emit('unfollow', state.master, function () {});
        doReconnect();
      } else if (msg === 'end_session') {
            // TODO show correct user name in the alertbox
        showalert('session has been ended...');
        console.log('Session ended, isMaster: ', $scope.isMaster);
            // TODO check if this is safe - should just apply for followers
            // not masters that have ended the session
        if (!$scope.isMaster) {
          socket.emit('unfollow', state.master, function () {});
          $rootScope.$broadcast('killOneDee');
          $rootScope.$broadcast('close_box', '');
          clientState.modal.setTemplate('landing', true);
          console.log('end_session, !is_master. -> set landing page');
          doReconnect();
        }
      } else if (msg === 'no_machines_available') {
        $rootScope.$broadcast('no_machines_available');
      } else {
        var msgClass = msgList[1];
        showalert(msg, msgClass);
      }
    });

    // It is unclear if this is effective. It does no harm though and it
    // actively tries to connect.
    var doReconnect = function () {
      if ($scope.refresh_browser) {
        console.log('Reconnecting to server...');
        socket.reconnect();
        setTimeout(doReconnect, 2000);
      }
    };

    var doHeartBeat = function () {
      var itsTime = new Date().getTime() > $scope.heartbeat_timeout;
      var notRefreshingBrowser = !$scope.refresh_browser;
      var notWating = !$scope.waiting;

      if (itsTime && notRefreshingBrowser) {
        if (notWating) {
          showalert('Connection to server lost. Reconnecting.',
                    'alert-danger alert-anchor', 1000000);
                // anchor allow us to remove the message again...
          $scope.refresh_browser = true;
          doReconnect();
        } else {
          console.log('********** waiting for unfreeze ********');
          $scope.refresh_browser = false;
          $scope.waiting = true;
        }
      }

      socket.emit('heartbeat', '');
        // response is a state update.
      setTimeout(function () {
        requestAnimationFrame(doHeartBeat);
      }, 5000);
    };

    setTimeout(function () {
      requestAnimationFrame(doHeartBeat);
    }, 5000);

    var resetHeartbeat = function () {
      // reset heartbeat; allow 11 seconds timeout
      $scope.heartbeat_timeout = new Date().getTime() + 11000;
      $('.alert-anchor').remove();  // remove connection alert, if set
      $scope.refresh_browser = false;
    };

    $scope.open_settings = function (newMode) {
      $rootScope.$broadcast('close_box', '');
      if (newMode !== undefined) {
        clientState.setMode(newMode);
      }
      clientState.modal.setTemplate('edit_settings', true);
    };

    $scope.ui_keypress = {
      32: 'trigger(\'start-stop\')',
      113: 'trigger(\'reset\')',
      119: 'trigger(\'w\')',
      109: 'trigger(\'choose-model\')',
      105: 'trigger(\'info-point\')',
      108: 'trigger(\'info-line\')',
      114: 'trigger(\'rain\')',
      100: 'trigger(\'discharge\')',
      101: 'trigger(\'edit\')',
      110: 'trigger(\'navigate\')',
      115: 'trigger(\'info-point\')',
      97: 'trigger(\'info-line\')',
      enter: 'trigger(\'enter\')',
      102: 'trigger(\'navigate\')',
      48: 'trigger(\'0\')',
      49: 'trigger(\'1\')',
      50: 'trigger(\'2\')',
      51: 'trigger(\'3\')',
      52: 'trigger(\'4\')',
      53: 'trigger(\'5\')',
      54: 'trigger(\'6\')',
      55: 'trigger(\'7\')',
      56: 'trigger(\'8\')',
      57: 'trigger(\'9\')',
      96: 'trigger(\'grave-accent\')'
    };

    $scope.ui_keyup = {
      'esc': 'trigger(\'esc\')',
      37: 'trigger(\'left\')',
      38: 'trigger(\'up\')',
      39: 'trigger(\'right\')',
      40: 'trigger(\'down\')'
    };

    $scope.logoutUrl = logout_with_master_removal; // eslint-disable-line
  }

]);
