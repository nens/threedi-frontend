// Path definitions for tests and builds

var basePath = './app';
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
  'threedi_server/static/vendor/leaflet/dist/leaflet.js',
  // bower:js
  'threedi_server/static/vendor/jquery/jquery.js',
  'threedi_server/static/vendor/Leaflet.awesome-markers/dist/leaflet.awesome-markers.js',
  'threedi_server/static/vendor/Leaflet.bouncemarker/bouncemarker.js',
  'threedi_server/static/vendor/Leaflet.groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.js',
  'threedi_server/static/vendor/Leaflet.utfgrid/dist/leaflet.utfgrid.js',
  'threedi_server/static/vendor/angular/angular.js',
  'threedi_server/static/vendor/angular-resource/angular-resource.js',
  'threedi_server/static/vendor/angular-ui-utils/keypress.js',
  'threedi_server/static/vendor/bootstrap/dist/js/bootstrap.js',
  'threedi_server/static/vendor/bootstrap-css/js/bootstrap.min.js',
  'threedi_server/static/vendor/moment/moment.js',
  'threedi_server/static/vendor/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
  'threedi_server/static/vendor/jquery-ui/ui/jquery-ui.js',
  'threedi_server/static/vendor/moment-timezone/builds/moment-timezone-with-data-2010-2020.js',
  'threedi_server/static/vendor/d3/d3.js',
  'threedi_server/static/vendor/nvd3/build/nv.d3.js',
  'threedi_server/static/vendor/angular-mocks/angular-mocks.js',
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
