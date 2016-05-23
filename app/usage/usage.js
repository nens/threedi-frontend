/**
 *
 * Usage module for usage admin page
 */
angular.module('usage', [
    'threedi-graph'
    ]);

angular.module('usage')
  .config(function ($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
});


angular.module('usage')
  .controller('MainCtrl', function ($scope, $http) {

  $scope.activeSimulations = active_simulations;
  $scope.pastSimulations = past_simulations;
  $scope.usageMonitor = [];
  $scope.activeOrganisation = undefined;
  $scope.activeUser = undefined;
  $scope.hours = {};
  $scope.users = {};
  $scope.storage = {};

  $scope.redirect_url = function(url) {
    window.location.href = url;
  };

  $scope.toggleKey = function (value, key) {
    if ($scope[key] === value) {
      $scope[key] = undefined;
    } else {
      $scope[key] = value;
    }
  };

  Object.keys(usage_monitor).forEach(function (organisation) {
    // Just binding the storage data so we can loop over it. Not consistent
    // with the rest of the hours code, nor pretty.
    var storage = usage_monitor[organisation].storage;
    $scope.storage[organisation] = storage;

    var hours = usage_monitor[organisation].hours;
    $scope.hours[organisation] = hours;
    $scope.hours[organisation].percentage = (1 - (hours.machine_uptime / hours.bought)) * 100;

    $scope.users[organisation] = {};
    angular.forEach(usage_monitor[organisation].users, function (userHours, user) {
      $scope.users[organisation][user] = {
        userHours: userHours,
        percentage: Math.round((userHours / hours.used) * 10000) / 100   // round to 2 decimals
      };

    });

    $scope.usageMonitor.push({
      key: organisation,
      values: usage_monitor[organisation].timestamps
    });
  });


  var getCSRF = function () {
    var cookies = document.cookie;
    var cookie = cookies.split('csrftoken=')[1].split(';')[0];
    return cookie;
  };

  var updateActiveSimulations = function () {
    $http({url: '/active_everything/'})
      .success(function (response) {
        $scope.activeSimulations = response;
      });
  };

  $scope.suspendMachine = function (subgridId, $index) {
    $scope.activeSimulations[subgridId].suspending = true;
    var csrftoken = getCSRF();
    var data = "machine="+ subgridId;
    $http({
      method: 'POST',
      url: '/suspend_machine/',
      data: data,
      headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .success(function () {
      updateActiveSimulations();
    })
    .error(function (error) {
      throw new Error(error);
    });
  };

});
