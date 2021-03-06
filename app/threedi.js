'use strict';
/**
 *
 * The Main initiator for 3di angular app
 * and some constants
 *
 */

require('jquery');
require('angular');
require('d3');

require('./styles/base.scss');

require('./state/state');
require('./threedi-graph/threedi-graph');
require('../vendor/angular-ui-utils/keypress');
require('./bootstrap-ui/bootstrap-ui');
require('./utils/utils');
require('./modes');

require('./templates.js');
require('./components/omnibox/omnibox');

var app = angular.module('threedi-client', [
  'global-state',
  'bootstrap-ui',
  'threedi-graph',
  'ui.keypress',
  'modes-module',
  'omnibox',
  'templates',
  'utils'
]);

require('./filters');
require('./threedi-ng');
require('./threedi-leaflet');
require('./animations');
require('./nxt-box');
require('./components/slider/slider-directive');

require('./schlider');

/* Prevent tags collapsing with Django template tags */
angular.module('threedi-client').config(function cb ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});

module.exports = app;
