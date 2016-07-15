/**
 * Initiates state module
 */


require('../modes');

angular.module('global-state', [
  'modes-module'
]);

require('./clientstate-service');
require('./socket-service');
require('./layer-service');
