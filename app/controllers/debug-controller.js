
const d3 = require('d3');

angular.module('threedi-client').controller('Debug', [
  '$scope',
  'socket',
  'state',
  function (
    $scope,
    socket,
    state
  ) {
    $scope.debug_vars;
    $scope.line_number;
    $scope.node_number;

    $scope.debug_beam_to_wms = function () {
      if (state.master) { // adding class "disabled" only makes it grey
        socket.emit('debug_beam_to_wms', function () {});
      }
    };

    $scope.light_my_line = function () {
      console.log($scope.line_number);
      // sander_id 'accidently' correspond to the line number
      d3.selectAll('#channel-' + $scope.line_number).classed('lighted-channel', true);
      // 1d2d + 2d lines
      d3.selectAll('#line2d-' + $scope.line_number).classed('lighted-channel', true);
    };

    $scope.light_my_node = function () {
      console.log($scope.node_number);
      // sander_id 'accidently' correspond to the node number
      d3.selectAll('#node-' + $scope.node_number).classed('lighted-node', true);
    };

    $scope.$on('serverState', function () {
      if ((state.state.vars !== undefined) && (state.state.vars.debug !== undefined)) {
        $scope.debug_vars = state.state.vars.debug;
      }
    });
  }
]);
