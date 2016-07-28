angular.module('threedi-client').controller('RainCloud', [
  '$scope',
  'socket',
  '$rootScope',
  'clientState',
  function ($scope, socket, $rootScope, clientState) {
    $scope.properties = null;

    $scope.mouse_is_down = false;
    $scope.controller_width = 300;  // assume that every slider here has the same width
    $scope.display_name = '';  // text to inform user

    $scope.clientState = clientState;

    $scope.update_display = function (value) {
      if (value >= 80) {
        $scope.display_name = '(heavy)';
      } else {
        $scope.display_name = '';
      }
    };

    $scope.set_diameter = function (diameter) {
      $scope.properties.diameter = diameter;
    };

    $scope.save = function () {
      socket.emit('change_rain',
        $scope.properties.x,
        $scope.properties.y,
        $scope.properties.diameter,
        $scope.properties.amount,
        3 * 3600,  // temporary duration
        $scope.properties.unique_id,
        function () {
          console.log('emit change cloud');
        }
      );
      $scope.close_box();
    };

    $scope.stop = function () {
      socket.emit('stop_disturbance',
        $scope.box.content.type,
        $scope.box.content.properties.unique_id,
        function () {
          console.log('stopped disturbance (@RainCloudCtrl)' );
        }
      );
      $scope.close_box();
    };

    $scope.mouse_down = function (target_var, event) {
      $scope.mouse_is_down = true;
      var new_value = $scope.calc_value(
        target_var, $scope.get_x(event) / $scope.controller_width);
        if (target_var == 'rain') {
          $scope.properties.amount = new_value;
          $scope.update_display(new_value);
          $scope.clientState = clientState;  // set current values, they may have changed
        }
    };

    $scope.mouse_up = function (target_var, event) {
      $scope.mouse_is_down = false;
    };

    $scope.mouse_move = function (target_var, event) {
      if ($scope.mouse_is_down) {
        var new_value = $scope.calc_value(
          target_var, $scope.get_x(event) / $scope.controller_width);
          if (target_var == 'rain') {
            $scope.properties.amount = new_value;
            $scope.update_display(new_value);
          }
        }
      };

      $scope.$on('raincloud', function (message, content) {
        $scope.properties = content.properties;
        $scope.$apply(function () {
          $scope.update_percentage('rain', $scope.properties.amount);
          $scope.update_display($scope.properties.amount);
        });
      });

      $scope.$on('keypress-1', function (message, value) {$scope.small();});
      $scope.$on('keypress-2', function (message, value) {$scope.big();});
      $scope.$on('keypress-3', function (message, value) {$scope.little();});
      $scope.$on('keypress-4', function (message, value) {$scope.much();});
      $scope.$on('keypress-enter', function (message, value) {$scope.save();});
  }
]);
