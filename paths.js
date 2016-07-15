// Path definitions for tests and builds

var basePath = './app/';
var threediFiles = {
  vendor: basePath + 'vendor/',
  leaflet_plugins: basePath + 'leaflet-plugins/',
  src: basePath + 'js/',
  build: basePath + 'build/',
  test: basePath + 'tests/'
};

module.exports = {
  images: basePath + 'images/**',
  vendorfiles:[
  'node_modules/leaflet/dist/leaflet.js',
  // bower:js
  'node_modules/jquery/dist/jquery.js',
  'node_modules/Leaflet.awesome-markers/dist/leaflet.awesome-markers.js',
  'node_modules/Leaflet.bouncemarker/bouncemarker.js',
  'node_modules/Leaflet.groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.js',
  'node_modules/Leaflet.utfgrid/dist/leaflet.utfgrid.js',
  'node_modules/angular/angular.js',
  'node_modules/angular-resource/angular-resource.js',
  'node_modules/angular-ui-utils/keypress.js',
  'node_modules/bootstrap/dist/js/bootstrap.js',
  'node_modules/bootstrap-css/js/bootstrap.min.js',
  'node_modules/moment/moment.js',
  'node_modules/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
  'node_modules/jquery-ui/ui/jquery-ui.js',
  'node_modules/moment-timezone/builds/moment-timezone-with-data-2010-2020.js',
  'node_modules/d3/d3.js',
  'node_modules/nvd3/build/nv.d3.js',
  'node_modules/angular-mocks/angular-mocks.js',
  // endbower
  threediFiles.leaflet_plugins + 'TileLayer.GeoJSONd3.js',
  threediFiles.vendor + 'socket.io-client/dist/socket.io.js'
  ],
  mockfiles: [
    threediFiles.test + 'mock.js',
  ],
  appfiles: [
    // first the modules then the rest
    threediFiles.src + 'threedi.js',

    threediFiles.src + 'bootstrap-ui/bootstrap-ui.js',
    threediFiles.src + 'bootstrap-ui/*.js',

    threediFiles.src + 'state/state.js',
    threediFiles.src + 'state/*.js',

    threediFiles.src + 'utils/utils.js',
    threediFiles.src + 'utils/*.js',

    threediFiles.src + 'moment.js',

    threediFiles.src + 'threedi-graph/threedi-graph.js',
    threediFiles.src + 'threedi-graph/*.js',

    threediFiles.src + 'threedi-ng.js',
    threediFiles.src + 'threedi-boxes.js',
    threediFiles.src + 'threedi-leaflet.js',
    threediFiles.src + 'animations.js',
    threediFiles.src + 'filters.js',
    threediFiles.src + 'leaflet.js'
  ],
  testfiles: [threediFiles.test + '**/*.js'],
  build: threediFiles.build
};
