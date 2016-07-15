


angular.module('threedi-client').controller('ScenarioInfo', [
  '$scope', '$rootScope', 'clientState',
  function ($scope, $rootScope, clientState) {
    $scope.c = clientState;

    $rootScope.$on('scenario_events', function (message, scenarioEvents) {
      $scope.stats_road_m2 = 0;
      $scope.stats_housing_m2 = 0;
      $scope.stats_unpaved_m2 = 0;
      $scope.stats_water_m2 = 0;

      $scope.stats_earth_m2 = 0;
      $scope.stats_earth_m3 = 0;
      scenarioEvents.forEach(function (scenarioEvent) {
                // ['#888888', '#52ff00', '#f73959', '#1285cd'],
                // quick and dirty stats. They do not represent correct values.
        if (scenarioEvent.type === 'twodee-edit') {
          if (scenarioEvent.edit_mode === 'edit_land_use') {
            if (scenarioEvent.color_value === '#888888') {
              $scope.stats_road_m2 += scenarioEvent.size * scenarioEvent.size;
            }
            if (scenarioEvent.color_value === '#52ff00') {
              $scope.stats_unpaved_m2 += scenarioEvent.size * scenarioEvent.size;
            }
            if (scenarioEvent.color_value === '#f73959') {
              $scope.stats_housing_m2 += scenarioEvent.size * scenarioEvent.size;
            }
            if (scenarioEvent.color_value === '#1285cd') {
              $scope.stats_water_m2 += scenarioEvent.size * scenarioEvent.size;
            }
          } else if (scenarioEvent.edit_mode === 'edit_bathy') {
                        // bathy-edit
            $scope.stats_earth_m2 += scenarioEvent.size * scenarioEvent.size;

            $scope.stats_earth_m3 += scenarioEvent.size * scenarioEvent.size * scenarioEvent.value;
          }
        }
      });

            // Round everything
      $scope.stats_earth_m2 = Math.round($scope.stats_earth_m2 / 100) * 100;
      $scope.stats_earth_m3 = Math.round($scope.stats_earth_m3 / 100) * 100;
      $scope.stats_road_m2 = Math.round($scope.stats_road_m2 / 100) * 100;
      $scope.stats_unpaved_m2 = Math.round($scope.stats_unpaved_m2 / 100) * 100;
      $scope.stats_housing_m2 = Math.round($scope.stats_housing_m2 / 100) * 100;
      $scope.stats_water_m2 = Math.round($scope.stats_water_m2 / 100) * 100;
    });
  }
]);
