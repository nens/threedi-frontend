/**
 * Wrapper around datetimepicker. To solve stuff
 * once and for all
 *
 */

require('eonasdan-bootstrap-datetimepicker');

angular.module('bootstrap-ui')
.directive('datetimepicker', ['$filter', function ($filter) {
  var link = function (scope, elem) {
    scope.displayModel = $filter('date')(
      scope.dateModel,
      'dd-MM-yyyy HH:mm'
      // 'Europe/Amsterdam'
    );
    scope.displayModel = scope.dateModel;

    angular.element(elem).datetimepicker({
      format: 'DD-MM-YYYY HH:mm',
      locale: 'en',
      forceParse: false
    });

    // v0:
    // datetimepicker won't register a change when you picked dates
    angular.element(elem).on('dp.change', function (e) {
      var date = e.date._d;
      scope.dateModel = date;
    });
  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    scope: {
      'dateModel': '='
    },
    templateUrl: './templates/datetimepicker.html'
  };

}]);
