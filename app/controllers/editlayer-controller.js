// here be dragons

const angular = require('angular');
const $ = require('jquery');

/* EditLayer with Leaflet */
angular.module('threedi-client').controller('EditLayer', [
  '$scope',
  '$rootScope',
  'leaflet',
  'state',
  'clientState',
  'Layer',
  'LayerService',
  'modes',
  function (
    $scope,
    $rootScope,
    leaflet,
    state,
    clientState,
    Layer,
    LayerService,
    modes
  ) {
        // Dirty way to define which one is initially active.
    $scope.layers = LayerService.editLayers;
    $scope.admin_layers = LayerService.adminLayers;
    $scope.active_layer = '';
    $scope.active_twodee_draws = 0;
    $scope.loaded_model_type; // defaults to null
    $scope.c = clientState;
    $scope.animationLayers = LayerService.animationLayers;

        /*
        enable or disable layer by looking at editable_maps,
        a property enabled is set to true or false.

        type is one of: {
            bathy, crop, friction, grid, grid-type, infiltration, interception,
            soil, twodee-links, landuse}
        the layer is enabled when the type occurs in editable_maps AND it is set
            to true.
        */
    var layerEnabler = function (item) {
      var l = LayerService.editLayers[item];
      if (l) {
        l.enabled = false;
        if ($scope.editable_maps !== '' &&
                    $scope.editable_maps) {
          if (l.hasOwnProperty('type')) {
            l.enabled = (
                            $scope.editable_maps.hasOwnProperty(l.type) &&
                            $scope.editable_maps[l.type]
                        );
          }
        }
      }
    };

    $scope.$watch('editable_maps', function () {
            // (re)build LayerService.editLayers because tile layer urls
            // need to be dynamically generated.
            // 'push' is misleading, it is more like 'update', overwriting existing items.

            // editType: defined in threedi-model.editable_maps and determines if the layer if visible
            // editMode: determines which layer to edit.

            /** **********************
             * Foreground layers *
             ************************/

            // apparently the editType indexes the layers
            // e.g. LayerService.editLayers['bathy']
      LayerService.editLayers.push(
                new Layer('DEM', 'WMS', '', {
                  layers: ':bathymetry',
                  messages: true,
                  editType: 'bathy',
                  editMode: modes.EDIT_MODE_DEFAULT
                })
            );
      LayerService.editLayers.push(
                new Layer('Soil', 'WMS', '', {
                  layers: ':soil',
                  editType: 'soil',
                  editMode: modes.EDIT_MODE_SOIL,
                  color: 'color-orange'
                })
            );
      LayerService.editLayers.push(
                new Layer('Land Use', 'WMS', '', {
                  layers: ':landuse',
                  editType: 'landuse',
                  editMode: modes.EDIT_MODE_LAND_USE
                })
            );
      LayerService.editLayers.push(
                new Layer('Crop Type', 'WMS', '', {
                  layers: ':crop',
                  editType: 'crop',
                  color: 'color-green',
                  editMode: modes.EDIT_MODE_CROP_TYPE
                })
            );
      LayerService.editLayers.push(
                new Layer('Infiltration', 'WMS', '', {
                  layers: ':infiltration',
                  editType: 'infiltration',
                  color: 'color-dark-red',
                  editMode: modes.EDIT_MODE_INFILTRATION
                })
            );
      LayerService.editLayers.push(
                new Layer('Interception', 'WMS', '', {
                  layers: ':interception',
                  editType: 'interception',
                  color: 'color-dark-green',
                  editMode: modes.EDIT_MODE_INTERCEPTION
                })
            );

            /** **********************
             * Administation layers *
             ************************/

      LayerService.adminLayers.push(
                new Layer('Grid', 'WMS', '', {
                  layers: ':grid',
                  editType: 'grid',
                  invertedColor: false,
                  modelType: '3di'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + nod + lines', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&layer=grid',
                  invertedColor: false,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + lines', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&nod=0&layer=grid',
                  invertedColor: false,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + nod', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&line=0&layer=grid',
                  invertedColor: false,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + nod + lines (inv)', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&layer=grid&color=ber',
                  invertedColor: true,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + lines (inv)', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&nod=0&layer=grid&color=ber',
                  invertedColor: true,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('Grid + nod (inv)', 'TMS', '', {
                  color: 'color-none',
                  editType: 'grid-tile',
                  url_extra: '&line=0&layer=grid&color=ber',
                  invertedColor: true,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('2D links', 'GeoJSONd3', '', {
                  color: 'color-none',
                  editType: 'twodee-links',
                  url_extra: '',
                  invertedColor: false,
                  modelType: '3di-v2'
                })
            );
      LayerService.adminLayers.push(
                new Layer('2D links (inv)', 'GeoJSONd3', '', {
                  color: 'color-none',
                  editType: 'twodee-links',
                  class_extra: ' channel-inverted',
                  invertedColor: true,
                  modelType: '3di-v2'
                })
            );

            // enable or disable layers, according to editable_maps
      Object.keys($scope.layers).map(layerEnabler);
      Object.keys($scope.admin_layers).map(layerEnabler);

      if ($scope.active_layer) {
        $scope.active_layer.opacity = 0.6;
      }
    });

    $scope.$watch('animation_maps', function () {
            // (re)build LayerService.editLayers because tile layer urls
            // need to be dynamically generated.
            // 'push' is misleading, it is more like 'update', overwriting existing items.

      LayerService.animationLayers.push({
        enabled: $scope.animation_maps.depth,
        display_name: 'Depth',
        name: 'depth'});
      LayerService.animationLayers.push({
        enabled: $scope.animation_maps.velocity,
        display_name: 'Velocity',
        name: 'velocity'});
      LayerService.animationLayers.push({
        enabled: $scope.animation_maps.ground_water_depth,
        display_name: 'Ground Water Depth',
        name: 'ground_water_depth'});
      LayerService.animationLayers.push({
        enabled: $scope.animation_maps.ground_water_level,
        display_name: 'Ground Water Level',
        name: 'ground_water_level'});
      LayerService.animationLayers.push({
        enabled: $scope.animation_maps.damage,
        display_name: 'Damage',
        name: 'damage'}
            );
    });

        /* TODO: This is stale for the moment
        *  The idea is to add to a input range html element:
        *  ng-change="setOpacity" ng-bind="active_layer.opacity"
        *
        */
    $scope.setOpacity = function () {
      if ($scope.active_layer.hasOwnProperty('layer')) {
        $scope.active_layer.layer.setOpacity(
                    $scope.active_layer.opacity);
      }
    };

        /* remove active foreground layer */
    $scope.removeActiveLayer = function () {
      $scope.active_layer = '';
      leaflet.updatefgLayers(); // in stead of passing undefined, pass nothing.
      leaflet.toggle_layer_edit(false);  // turn edit control off
    };

    $scope.switch = function (layer) {
      if ($scope.active_layer.name === layer.name) {
        $scope.active_layer = '';
      } else {
                // set new active layer
        $scope.active_layer = layer;
      }

      switch (layer.type) {
      case 'grid-tile':
        break;
      case 'twodee-links':
        break;
      default:
                    // normal case
        layer.layer.setUrl(leaflet.wms_server_url());
        var wmsType = (layer.type === 'bathy')
                        ? 'bathymetry'
                        : layer.type;
        layer.layer.setParams({
          layers: state.state.loaded_model + ':' + wmsType,
          timestep: state.state.time_seconds  // used to avoid browser caching
        });
        break;
      }

      if (layer.name === 'DEM') {
                // request initial DEM range, then add layer
        if ($scope.active_layer !== '') {
          $.get(leaflet.updateDEMRequestURL(), function (data) {
                        // hacking into L.tileLayer.wms
            clientState.scenario_event_defaults.wms_limits = [
              Math.floor(data.limits[0]), Math.ceil(data.limits[1])];
            layer.layer.wmsParams.limits =
                            Math.floor(data.limits[0]) + ',' + Math.ceil(data.limits[1]);
            leaflet.updatefgLayers(layer);
          });
        } else {
          leaflet.updatefgLayers();
        }
      } else {
        if ($scope.active_layer !== '') {
          leaflet.updatefgLayers(layer);
        } else {
          leaflet.updatefgLayers();
        }
      }

            // For facilitating draw functionality
      clientState.edit_mode = layer.editMode;
    };

    $scope.$on('serverState', function () {
            // update active_layer if needed -> after an edit the layer must be reloaded
      if ($scope.active_twodee_draws !== parseInt(state.state.active_twodee_draws)) {
        $scope.active_twodee_draws = parseInt(state.state.active_twodee_draws);
        if (($scope.hasOwnProperty('active_layer')) && $scope.active_layer) {
                    // leaflet.updatefgLayers(undefined);
          setTimeout(function () {
            var rememberMeLayer = $scope.active_layer;
            $scope.removeActiveLayer();
            $scope.switch(rememberMeLayer);
          }, 3000); // Allow wms server to update after 2d edit
        }
      }

            // Use this show/hide layers in the menu
      if (state.state.loaded_model_type === '3di') {
        $scope.loaded_model_type = '3di';
      } else {
        $scope.loaded_model_type = '3di-v2';
      }
    });

    $rootScope.$on('new-model', function () {
      $scope.removeActiveLayer();
            // set default animation layer to depth
      clientState.scenario_event_defaults.wms_layer_depth = 'depth';
    });

    $scope.switchAnimationLayer = function (layer) {
      clientState.scenario_event_defaults.wms_layer_depth = layer.name;
      $rootScope.$broadcast('animation-update', 'reset');
    };
  }
]);
