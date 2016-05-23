/**
 * Initialize utils
 */

const angular = require('angular');
require('../state/state');

angular.module('utils', [
  'global-state'
]);

require('./utils-service');
