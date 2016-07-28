

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
    clientState
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
        if (clientState.show_onedee[layer.objectType]) {
          clientState.show_onedee[layer.objectType] = false;
        } else {
          clientState.show_onedee[layer.objectType] = true;
        }
        layer.active = clientState.show_onedee[layer.objectType];

        // update layers
        $rootScope.$broadcast('resetOneDee');  // for points
        $rootScope.$broadcast('animation-update');  // let everything move again
      }
    };
  }
]);
