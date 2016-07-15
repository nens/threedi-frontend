// create the directives as re-usable components
angular.module("threedi-graph")
.directive('threediWindrose', function($http) {
  var link = function(scope, element, attrs) {
      // parents scope, html element, attributes attached to element
      // we are changing wind_speed and wind_direction, then call save_wind()

      var windrose_radius = 20;
      var windrose_center_x = 200;
      var windrose_center_y = 200;
      var mouse_down = false;

      var windrose_xy = function(wind_direction, wind_speed) {
        return {
          rotate: wind_direction + 180,
          magnitude: wind_speed
        };
      };

      var angle_degrees = function(dx, dy) {
        var result = null;
        if ((dx === 0) && (dy >= 0)) {
          return 90;
        } else if ((dx === 0) && (dy < 0)) {
          return 270;
        } else {
          if (dx >= 0) {
            result = 180 * Math.atan(dy/dx) / Math.PI;
          } else {
            result = 180 * Math.atan(dy/dx) / Math.PI + 180;
          }
          return result;
        }
      };

      var magnitude = function(dx, dy) {
        return Math.sqrt(dx * dx + dy * dy);
      };

      var update_wind_direction_speed = function(event) {
        var dx = event.offsetX - windrose_center_x;
        var dy = -(event.offsetY - windrose_center_y);

        var angle = ((90 - angle_degrees(dx, dy)) + 360) % 360;
        var speed = Math.min(magnitude(dx, dy) / 20, 10);
        scope.wind_direction = Number(angle.toFixed(0));
        scope.wind_speed_beaufort = Number(speed.toFixed(0));

        // add visual item
        scope.windrose_marker = windrose_xy(scope.wind_direction, scope.wind_speed_beaufort);
      };

      // initial
      scope.windrose_marker = windrose_xy(scope.wind_direction, scope.wind_speed_beaufort);

      element.bind('mousedown', function(event) {
        mouse_down = true;
      });
      element.bind('mousemove', function(event) {
        if (mouse_down) {
          update_wind_direction_speed(event);
        }
      });
      element.bind('mouseup', function(event) {
        mouse_down = false;
        update_wind_direction_speed(event);
        scope.save_wind();
      });
      element.bind('mouseover', function() {
        element.css('cursor', 'pointer');
      });
    };

  return {
    restrict: 'E',
    replace: true,
    templateUrl: './templates/windrose.html',
    link: link
  };
});
