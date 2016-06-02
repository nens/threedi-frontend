const angular = require('angular');
angular.module('threedi-client').controller('Modules', [
  '$scope',
  'socket',
  'state',
  function (
    $scope,
    socket,
    state
  ) {
    $scope.modules;

    $scope.$on('serverState', function () {
      $scope.modules = state.state.module;
      $scope.time_seconds = state.state.time_seconds;
    });

    $scope.on = function (modVarName) {
            // modVarName is something like flow:active or flow:control:active
      if (state.master) {
        console.log('ON');
        socket.emit(
                    'set_var', 'module:' + modVarName, '1', function () {});
      }
    };

    $scope.off = function (modVarName) {
      if (state.master) {
        console.log('OFF');
        socket.emit(
                    'set_var', 'module:' + modVarName, '0', function () {});
      }
    };

    $scope.var_url = function (varParams) {
      var vars = JSON.parse(varParams);
      if (vars === null) {
        console.log('var_url returned nothing');
        return '';
      }
      return data_url + '?REQUEST=getgraphdata&xvar=' // eslint-disable-line
              + vars[0] + '&yvar='
              + vars[1] + '&decimals=2&time=' + $scope.time_seconds;
    };
  }
]);
