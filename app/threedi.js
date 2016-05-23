'use strict';
/**
 *
 * The Main initiator for 3di angular app
 * and some constants
 *
 */

require('./styles/base.scss');
const angular = require('angular');

require('./state/state');
require('./threedi-graph/threedi-graph');
require('../vendor/angular-ui-utils/keypress');
require('./bootstrap-ui/bootstrap-ui');
require('./utils/utils');
require('./modes');
require('jquery');

var app = angular.module('threedi-client', [
  'global-state',
  'bootstrap-ui',
  'threedi-graph',
  'ui.keypress',
  'modes-module',
  'utils'
]);

require('./filters');
require('./threedi-ng');
require('./threedi-leaflet');
require('./animations');
require('./nxt-box');

/* Prevent tags collapsing with Django template tags */
angular.module('threedi-client').config(function cb ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

module.exports = app;
