/**
 *
 * Instantiate threedi graph module for threedi
 * graph types.
 *
 */
const angular = require('angular');
angular.module('threedi-graph', []);

require('./bubble-graph-static');
require('./line-graph-static');
require('./threedi-cross-section');
require('./threedi-timeseries');
require('./threedi-windrose');
