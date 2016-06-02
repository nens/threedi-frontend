const angular = require('angular');
const backgroundLayerDefaultIndex = 0; //backgroundLayerDefaultIndex;

/* BackgroundLayer with Leaflet */
angular.module('threedi-client').controller('BackgroundLayer', [
  '$scope',
  '$rootScope',
  'leaflet',
  'clientState',
  function ($scope, $rootScope, leaflet, clientState) {
    $scope.layers = clientState.backgroundLayers;  // defined using django in html
    $scope.active_layer = $scope.layers[backgroundLayerDefaultIndex];  // from django

    $scope.switch = function (layer) {
      $scope.active_layer = layer;
      leaflet.updatebgLayers(layer.layer, layer.onedee_inverted);
      clientState.bg_onedee_inverted = layer.onedee_inverted || false;
    };
  }
]);
