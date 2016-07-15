

angular.module('threedi-client')
.controller('ResetModel', ['$scope', '$rootScope',
function ($scope, $rootScope) {
  console.log('controller ResetModel');
  $scope.test = 'my test';
  // when clicking the X, this function is called. Enable keypressing.
  $scope.close = function () {
    $rootScope.keypress_enabled = true;
  };
}]);
