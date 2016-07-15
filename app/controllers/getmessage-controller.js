

/* Controller that provides access to the Message object via a getter */
angular.module('threedi-client')
  .controller('GetMessages', ['$scope', 'Message',
    function ($scope, Message) {
      $scope.$watch(function () {
        return Message.getConfirmMessage();
      }, function (txt) {
        if (txt) {
          $scope.confirmMessage = txt;
        }
      });
    }
]);
