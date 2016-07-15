

/* StructureLayer with Leaflet */
angular.module('threedi-client').controller('StructureLayer', [
  '$scope',
  '$rootScope',
  'leaflet',
  'LayerService',
  'clientState',
  function (
    $scope,
    $rootScope,
    leaflet,
    LayerService,
    clientstate
  ) {
    $scope.layers = LayerService.structureLayers;

    $scope.toggleLayer = function (layer) {
      if (layer.layerType === 'separate') {
        // TODO: check if this works, now we never enter this code piece
        if (layer.active) {
          layer.active = false;
          layer.remove();
        } else {
          layer.active = true;
          layer.add();
        }
      } else if (layer.layerType === 'embedded') {
        if (clientstate.show_onedee[layer.objectType]) {
          clientstate.show_onedee[layer.objectType] = false;
        } else {
          clientstate.show_onedee[layer.objectType] = true;
        }
        layer.active = clientstate.show_onedee[layer.objectType];

        // update layers
        $rootScope.$broadcast('resetOneDee');  // for points
        $rootScope.$broadcast('animation-update');  // let everything move again
      }
    };
  }
]);
