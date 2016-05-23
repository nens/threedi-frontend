/**
 * Bootstrap ui stuff e.g. modals
 */

const angular = require('angular');

angular.module('bootstrap-ui', [
  'global-state'
]);

require('./datetimepicker-directive');
require('./modal-directive');
