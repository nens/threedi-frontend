
/* Manholes AND discharges. Must be inside the PopupSlider controller */
angular.module('threedi-client')
  .controller('Discharge', ['$scope', 'socket', 'clientState',
    function ($scope, socket, clientstate) {

      $scope.properties = null;
      $scope.mouse_is_down = false;
      $scope.controller_width = 300;  // assume that every slider here has the same width
      $scope.discharge_display = '';  // text to inform user that a negative value is a pump
      $scope.clientstate = clientstate;

      $scope.update_display = function (value) {
        if (value >= 0) {
          $scope.discharge_display = '(discharge)';
        } else {
          $scope.discharge_display = '(pump)';
        }
      };

      $scope.save = function () {
        socket.emit('change_discharge',
            $scope.properties.amount,
            $scope.properties.unique_id,
            function () {
              console.log('emit change discharge');
            });
        $scope.close_box();
      };

      $scope.stop = function () {
        socket.emit('stop_disturbance', $scope.box.content.type,
            $scope.box.content.properties.unique_id,
            function () {
              console.log('stopped disturbance (@DischargeCtrl)');
            });
        $scope.close_box();
      };

      $scope.mouse_down = function (target_var, event) {
        $scope.mouse_is_down = true;
        var new_value = $scope.calc_value(
            target_var, $scope.get_x(event) / $scope.controller_width);
        if (target_var === 'discharge') {
          $scope.properties.amount = new_value;
          $scope.update_display(new_value);
          $scope.clientstate = clientstate;  // set current values, they may have changed
        }
      };

      $scope.mouse_up = function (target_var, event) {
        $scope.mouse_is_down = false;
      };

      $scope.mouse_move = function (target_var, event) {
        if ($scope.mouse_is_down) {
          var new_value = $scope.calc_value(
                target_var, $scope.get_x(event) / $scope.controller_width);
          if (target_var === 'discharge') {
            $scope.properties.amount = new_value;
            $scope.update_display(new_value);
          }
        }
      };

      $scope.$on('manhole', function (message, content) {
        console.log('manhole popup');
        $scope.$apply(function () {
          $scope.properties = content.properties;
          $scope.update_percentage('discharge', $scope.properties.amount);
          $scope.update_display($scope.properties.amount);
        });
      });

      $scope.$on('manhole-close', function (message, value) {
        // TODO: remove active/blinking stuff from manhole
        console.log('manhole-close');
        // disable any bouncing icon
        d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
      });

      $scope.$on('keypress-1', function (message, value) {$scope.little();});
      $scope.$on('keypress-2', function (message, value) {$scope.much();});
      $scope.$on('keypress-enter', function (message, value) {$scope.save();});
    }]);
