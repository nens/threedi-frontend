/**
 * Initiates state module
 */

const angular = require('angular');
require('../modes');

angular.module('global-state', [
  'modes-module'
]);

require('./clientstate-service');
require('./socket-service');
require('./layer-service');
