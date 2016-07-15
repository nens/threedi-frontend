

angular.module('threedi-client').controller('LoadScenario', ['$scope', 'socket',
function ($scope, socket) {
  $scope.load_scenario = function () {
    console.log('Load scenario ');
    console.log($scope.scenario);
    socket.emit('load_scenario', $scope.scenario.id, function () {});
  };
}
]);
