const angular = require('angular');
const showalert = require('./showalert');
const $ = require('jquery');
const map = require('./leaflet');

/**
 * The ClientState controller controls and watches the state. In every child you
 * can use setMode(mode) to set a mode and let the buttons react on it.
 */
angular.module('threedi-client')
  .controller('ClientState',
    ['$scope', 'state', 'clientState', 'modes',
    function($scope, state, clientstate, modes){

    $scope.clientstate = clientstate;
    $scope.c = clientstate;
    clientstate.bg_onedee_inverted = false; // for default bg, Google Satellite

    $scope.setMode = function(mode) {
        if (clientstate.program_mode !== mode) {
            // turn button on
            clientstate.setMode(mode);
        } else {
            // turn off if not info point or line
            if ((clientstate.program_mode !== modes.MODE_INFO_POINT) &&
                (clientstate.program_mode !== modes.MODE_INFO_LINE)) {
                clientstate.setMode(modes.MODE_INFO_POINT);
            }
        }
    };

    // this message comes from "state"
    // is not strictly necessary, but it is nice and short in the .html
    $scope.$on('serverState', function(message){
        $scope.isMaster = state.master;
        if ((!$scope.isMaster) &&
            (clientstate.program_mode !== modes.MODE_INFO_POINT) &&
            (clientstate.program_mode !== modes.MODE_INFO_LINE)) {
            // Reset client state to navigation mode
            clientstate.setMode(modes.MODE_INFO_POINT);
        }
    });

    // Remember: the buttons info-point, info-line, etc are part of
    // ClientState. The controllers are bound to the popup.
    $scope.$on('keypress-info-point', function(message, value) {
        $scope.setMode(modes.MODE_INFO_POINT);
    });

    $scope.$on('keypress-info-line', function(message, value) {
        $scope.setMode(modes.MODE_INFO_LINE);
    });

    // Set InfoPoint mode --> Lars: disabled for now, is interfering with manual input
    /*
    $scope.$on('keypress-1', function(message, value) {clientstate.setInfoMode('s1');});
    $scope.$on('keypress-2', function(message, value) {clientstate.setInfoMode('su');});
    $scope.$on('keypress-3', function(message, value) {clientstate.setInfoMode('vol');});
    $scope.$on('keypress-4', function(message, value) {clientstate.setInfoMode('dep');});
    $scope.$on('keypress-5', function(message, value) {clientstate.setInfoMode('ucx');});
    $scope.$on('keypress-6', function(message, value) {clientstate.setInfoMode('ucy');});
    $scope.$on('keypress-7', function(message, value) {clientstate.setInfoMode('interception');});
    $scope.$on('keypress-8', function(message, value) {clientstate.setInfoMode('rain');});
    $scope.$on('keypress-9', function(message, value) {clientstate.setInfoMode('evap');});
    */
}]);


/* Edit functions: Edit the current simulation. Must be in scope of ClientState */
angular.module("threedi-client")
  .controller("Simulator", [
    "$scope", "$rootScope", "socket", "state", "clientState", "leaflet", 'modes',
    function($scope, $rootScope, socket, state, clientstate, leaflet, modes){

    $scope.wait_for_server_response = true;
    $scope.leaflet = leaflet;
    $scope.enable_edit_button = true;
    $scope.mouse_is_down = false;
    $scope.time_mouse_is_down = 0;

    var c = clientstate;

    $scope.mouse_down = function(new_mode) {
        // we want to go to this mode, but we're not there yet
        $scope.time_mouse_is_down = 0;
        $scope.mouse_is_down = true;
        $scope.setMode(new_mode);
        if (new_mode === modes.MODE_EDIT) {
            $scope.$emit('edit-pause');  // stop the current simulation
        }

        if (clientstate.program_mode == modes.MODE_EDIT) {
            // only in correct program mode
            leaflet.toggle_layer_edit(true);  // turn edit control on
        } else {
            leaflet.toggle_layer_edit(false);  // turn edit control off
        }
    };

    $scope.mouse_up = function(new_mode) {
        $scope.mouse_is_down = false;
        $scope.time_mouse_is_down = 0;
    };

    // special function when clicking flood fill mode button
    $scope.mouse_down_ff = function() {
        if (clientstate.edit_ranges['flood_fill_mode'].value == 0) {
            $scope.mouse_down(modes.MODE_FLOODFILL_RELATIVE);
        } else {
            $scope.mouse_down(modes.MODE_FLOODFILL_ABSOLUTE);
        }
    }

    $scope.mouse_move = function() {
        $scope.time_mouse_is_down = 0;
    };

    $scope.must_show_rain_btn = function () {
        try {
            return c.features.scenario_rain_local ||
                   c.features.scenario_rain_radar ||
                   c.features.scenario_rain_design ||
                   c.features.scenario_rain_constant;
        } catch (e) {
            return false;
        }
    };

    $scope.must_show_discharge_btn = function () {
        try {
            return c.features.scenario_discharge_overland ||
                   c.features.scenario_discharge_ground
        } catch (e) {
            return false;
        }
    };

    $scope.floodfill_is_primary = function () {
        return c.program_mode == 'flood_fill_absolute' ||
               c.program_mode == 'flood_fill_relative';
    };

    $scope.must_show_twodee_edit_btn = function () {
        try {
            return c.features.scenario_edit_dem ||
                   c.features.scenario_edit_soil ||
                   c.features.scenario_edit_crop ||
                   c.features.scenario_edit_infiltration ||
                   c.features.scenario_edit_interception;
        } catch (e) {
            return false;
        }
    };

    // Pause due to Leaflet.draw edits
    map.on('draw:created', function(e) {
        $scope.$emit('edit-pause');
    });

    $scope.$on('serverState', function(message) {
        $scope.wait_for_server_response = false;
        if ((state.state.state === 'load-model') ||
            (state.state.state === 'archive') ||
            (parseInt(state.state.pending_actions) > 0)) {

            $scope.wait_for_server_response = true;
        }
    });

    $scope.$on('keypress-rain', function(message, value) {
        if (state.master) {
            $scope.setMode(modes.MODE_RAIN);
        }
    });

    $scope.$on('keypress-discharge', function(message, value) {
        if (state.master) {
            $scope.setMode(modes.MODE_DISCHARGE);
        }
    });


    $scope.$on('keypress-w', function(message, value) {
        if (state.master) {
            $scope.setMode(modes.MODE_MANHOLE);
        }
    });

    $scope.$on('keypress-edit', function(message, value) {
        if (state.master) {
            $scope.setMode(modes.MODE_EDIT);
        }
    });

    $rootScope.$on('new-model', function() {
        clientstate.setMode(modes.MODE_INFO_POINT);
    });

}]);


/* BackgroundLayer with Leaflet */
angular.module("threedi-client")
  .controller("BackgroundLayer", ["$scope", "$rootScope", "leaflet", "clientState",
    function ($scope, $rootScope, leaflet, clientState) {

    $scope.layers = clientState.backgroundLayers;  // defined using django in html
    $scope.active_layer = $scope.layers[backgroundLayerDefaultIndex];  // from django

    $scope.switch = function (layer) {
        $scope.active_layer = layer;
        leaflet.updatebgLayers(layer.layer, layer.onedee_inverted);
        clientState.bg_onedee_inverted = layer.onedee_inverted || false;
    };

}]);

/* StructureLayer with Leaflet */
angular.module("threedi-client")
  .controller("StructureLayer", [
    "$scope", "$rootScope", "leaflet", "LayerService", "clientState", "state",
    function ($scope, $rootScope, leaflet, LayerService, clientstate, state){
    $scope.layers = LayerService.structureLayers;

    $scope.toggleLayer = function (layer) {
        if (layer.layerType === 'separate') {
            // TODO: check if this works, now we never enter this code piece
            console.log("Toggle *seperate* layer!");
            if (layer.active) {
                layer.active = false;
                layer.remove();
            } else {
                layer.active = true;
                layer.add();
            }
        } else if (layer.layerType === 'embedded') {
            console.log("Toggle *embedded* layer!");
            if (clientstate.show_onedee[layer.objectType]) {
                console.log("turn layer off");
                clientstate.show_onedee[layer.objectType] = false;
            } else {
                console.log("turn layer on");
                clientstate.show_onedee[layer.objectType] = true;
            }
            layer.active = clientstate.show_onedee[layer.objectType];

            // update layers
            $rootScope.$broadcast('resetOneDee');  // for points
            $rootScope.$broadcast('animation-update');  // let everything move again
        }
    };
}]);

/* EditLayer with Leaflet */
angular.module('threedi-client')
  .controller('EditLayer', [
      '$scope',
      '$rootScope',
      'leaflet',
      'state',
      'clientState',
      'Layer',
      'LayerService',
      'modes',

    function($scope, $rootScope, leaflet, state, clientState, Layer, LayerService, modes) {
        // Dirty way to define which one is initially active.
        $scope.layers = LayerService.editLayers;
        $scope.admin_layers = LayerService.adminLayers;
        $scope.active_layer = '';
        $scope.active_twodee_draws = 0;
        $scope.loaded_model_type = undefined;
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
            if (l !== undefined) {
                l.enabled = false;
                if ($scope.editable_maps !== "" &&
                    $scope.editable_maps !== undefined) {
                    if (l.hasOwnProperty('type')) {
                        l.enabled =
                            $scope.editable_maps.hasOwnProperty(l.type) &&
                            $scope.editable_maps[l.type];
                    }
                }
            }
        };

        $scope.$watch('editable_maps', function() {
            // (re)build LayerService.editLayers because tile layer urls
            // need to be dynamically generated.
            // 'push' is misleading, it is more like 'update', overwriting existing items.

            // editType: defined in threedi-model.editable_maps and determines if the layer if visible
            // editMode: determines which layer to edit.

            /************************
             * Foreground layers *
             ************************/

            // apparently the editType indexes the layers
            // e.g. LayerService.editLayers['bathy']
            LayerService.editLayers.push(
                new Layer("DEM", "WMS", '', {
                    layers: ':bathymetry',
                    messages: true,
                    editType: 'bathy',
                    editMode: modes.EDIT_MODE_DEFAULT,
                })
            );
            LayerService.editLayers.push(
                new Layer("Soil", "WMS", '', {
                    layers: ':soil',
                    editType: 'soil',
                    editMode: modes.EDIT_MODE_SOIL,
                    color: 'color-orange',
                })
            );
            LayerService.editLayers.push(
                new Layer("Land Use", "WMS", '', {
                    layers: ':landuse',
                    editType: 'landuse',
                    editMode: modes.EDIT_MODE_LAND_USE
                })
            );
            LayerService.editLayers.push(
                new Layer("Crop Type", "WMS", '', {
                    layers: ':crop',
                    editType: 'crop',
                    color: 'color-green',
                    editMode: modes.EDIT_MODE_CROP_TYPE,
                })
            );
            LayerService.editLayers.push(
                new Layer("Infiltration", "WMS", '', {
                    layers: ':infiltration',
                    editType: 'infiltration',
                    color: 'color-dark-red',
                    editMode: modes.EDIT_MODE_INFILTRATION
                })
            );
            LayerService.editLayers.push(
                new Layer("Interception", "WMS", '', {
                    layers: ':interception',
                    editType: 'interception',
                    color: 'color-dark-green',
                    editMode: modes.EDIT_MODE_INTERCEPTION
                })
            );

            /************************
             * Administation layers *
             ************************/

            LayerService.adminLayers.push(
                new Layer("Grid", "WMS", '', {
                    layers: ':grid',
                    editType: 'grid',
                    invertedColor: false,
                    modelType: '3di'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + nod + lines", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&layer=grid',
                    invertedColor: false,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + lines", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&nod=0&layer=grid',
                    invertedColor: false,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + nod", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&line=0&layer=grid',
                    invertedColor: false,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + nod + lines (inv)", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&layer=grid&color=ber',
                    invertedColor: true,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + lines (inv)", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&nod=0&layer=grid&color=ber',
                    invertedColor: true,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("Grid + nod (inv)", "TMS", '', {
                    color: 'color-none',
                    editType: 'grid-tile',
                    url_extra: '&line=0&layer=grid&color=ber',
                    invertedColor: true,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("2D links", "GeoJSONd3", '', {
                    color: 'color-none',
                    editType: 'twodee-links',
                    url_extra: '',
                    invertedColor: false,
                    modelType: '3di-v2'
                })
            );
            LayerService.adminLayers.push(
                new Layer("2D links (inv)", "GeoJSONd3", '', {
                    color: 'color-none',
                    editType: 'twodee-links',
                    class_extra: ' channel-inverted',
                    invertedColor: true,
                    modelType: '3di-v2'
                })
            );

            // enable or disable layers, according to editable_maps
            keys($scope.layers).map(layerEnabler);
            keys($scope.admin_layers).map(layerEnabler);

            if ($scope.active_layer) {
                $scope.active_layer.opacity = 0.6;
            }
        });

        $scope.$watch('animation_maps', function() {
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
        $scope.removeActiveLayer = function() {
            $scope.active_layer = '';
            leaflet.updatefgLayers(undefined);
            leaflet.toggle_layer_edit(false);  // turn edit control off
        };

        $scope.switch = function(layer) {
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
                    $.get(leaflet.updateDEMRequestURL(), function(data) {
                        // hacking into L.tileLayer.wms
                        clientState.scenario_event_defaults.wms_limits = [
                            Math.floor(data.limits[0]), Math.ceil(data.limits[1])];
                        layer.layer.wmsParams.limits =
                            Math.floor(data.limits[0]) + "," + Math.ceil(data.limits[1]);
                        leaflet.updatefgLayers(layer);
                    });
                } else {
                    leaflet.updatefgLayers(undefined);
                }
            } else {
                if ($scope.active_layer !== '') {
                    leaflet.updatefgLayers(layer);
                } else {
                    leaflet.updatefgLayers(undefined);
                }
            }

            // For facilitating draw functionality
            clientState.edit_mode = layer.editMode;
        };

        $scope.$on('serverState', function() {
            // update active_layer if needed -> after an edit the layer must be reloaded
            if ($scope.active_twodee_draws !== parseInt(state.state.active_twodee_draws)) {
                $scope.active_twodee_draws = parseInt(state.state.active_twodee_draws);
                if (($scope.hasOwnProperty('active_layer')) && $scope.active_layer) {
                    //leaflet.updatefgLayers(undefined);
                    setTimeout(function() {
                        var remember_me_layer = $scope.active_layer;
                        $scope.removeActiveLayer();
                        $scope.switch(remember_me_layer);
                    }, 3000); // Allow wms server to update after 2d edit
                }
            }

            // Use this show/hide layers in the menu
            if (state.state.loaded_model_type === '3di') {
                $scope.loaded_model_type = '3di'
            } else {
                $scope.loaded_model_type = '3di-v2'
            }
        });

        $rootScope.$on('new-model', function() {
            $scope.removeActiveLayer();
            // set default animation layer to depth
            clientState.scenario_event_defaults.wms_layer_depth = 'depth';
        });

        $scope.switchAnimationLayer = function(layer) {
            clientState.scenario_event_defaults.wms_layer_depth = layer.name;
            $rootScope.$broadcast('animation-update', 'reset');
        }

    }
]);


/* Lower bar contents */
angular.module("threedi-client")
  .controller("Status", ["$scope", "state", "clientState", "AnimatedLayer", "socket", "UtilService", "BeaufortConverterService",
    function ($scope, state, clientstate, AnimatedLayer, socket, UtilService, BeaufortConverterService) {
    $scope.c = clientstate;
    $scope.serverState = 'wait';
    $scope.has_rtc = '0';
    $scope.status_label = '-';
    $scope.state = null;
    $scope.state_for_color = '';  // for ng-class
    $scope.state_for_icon = '';  // for ng-class
    $scope.timestep = 0;
    $scope.pending_actions = 1;
    $scope.rain_label = '';
    $scope.show_rain_data = false;
    $scope.wind_label = '';
    $scope.show_wind_data = false;
    $scope.show_status_data = false;
    $scope.skipping = false;
    $scope.machines_busy = false;
    var ms_to_beaufort = BeaufortConverterService.ms_to_beaufort;

    var discrepancyMessage = function(state_timestep, wms_timestep) {
        var timestep_diff = state_timestep - wms_timestep;
        if (Math.abs(timestep_diff) > 10)
            return '. WMS is behind ('
                    + timestep_diff + ' ts)';
        else
            return '';
    };

    $scope.$on('serverState', function() {

        /* sophisticated routine to give the user a good status view. */
        var wms_layer_timestep = AnimatedLayer.last_loaded_timestep();
        var wms_last_requested_timestep = AnimatedLayer.get_last_requested_timestep();
        var current_timestep = parseInt(state.state.timestep_calc);

        $scope.state = state.state;
        $scope.state_text = state.state_text;
        $scope.state_for_color = state.state.state;
        $scope.status_label = state.status_label;
        $scope.detail_info = state.detail_info;

        // circle or rotate. circle adds icon-circle class
        var machine_manager_states = ['machine-requested',
                                      'machine-requesting',
                                      'machine-powering',
                                      'machine-powered'];

        $scope.state_for_icon = 'rotate';
        if (debug_extra) {
            console.log('State from server: ', state.state);
        }
        console.log('Current state: ', state.state.state, '**************');
        if (state.state.state === 'sim') {
            console.log('t =', state.state.time_seconds);
        }

        // set some variables for visualization
        switch(state.state.state) {
            case 'wait':
                if ((current_timestep !== wms_layer_timestep) ||
                    (wms_layer_timestep !== wms_last_requested_timestep)) {
                    var discrMsg = discrepancyMessage(current_timestep, wms_layer_timestep);
                    $scope.status_label += ' Loading wms.';
                    $scope.status_label += discrMsg;
                    $scope.state_for_color = 'sim';
                }
                $scope.state_for_icon = 'circle';
                break;
            case 'sim':
                var discrMsg = discrepancyMessage(current_timestep, wms_layer_timestep);
                $scope.status_label += discrMsg;
                if ((state.state.wms_busy === '1') ||
                    (current_timestep - wms_layer_timestep > 50) ||
                    (current_timestep === 0)) {
                    $scope.state_for_color = 'sim-busy';
                } else {
                    $scope.state_for_color = 'sim';
                    $scope.state_for_icon = 'circle';
                }
                break;
            case 'wait-load-model':
            case 'crashed-model':
                $scope.state_for_icon = 'circle';
                break;
            case 'machine-requested':
            case 'machine-requesting':
            case 'machine-powering':
            case 'machine-powered':
                $scope.state_for_color = 'mm-busy';
                break;
        }

        $scope.has_rtc = parseFloat(state.state.has_rtc);
        $scope.pending_actions = (!contains(machine_manager_states, state.state.state)) ? parseInt(state.state.pending_actions) : NaN;
        $scope.timestep = current_timestep;
        // rain grid label
        if ((state.state.rain !== undefined) &&
            (state.state.rain.current_rain_grid !== undefined) &&
            (state.state.rain.current_rain_grid !== null)) {
            var rain_event = JSON.parse(state.state.rain.current_rain_grid);
            if (rain_event.rain_type === 'radar') {
                var dt = state.state.rain.current_rain_grid_radar_datetime;
                if (dt) {
                    var prefix = dt.substring(0, dt.length - 6);
                    var moment_date = moment.tz(prefix, "Etc/UTC");
                    $scope.rain_label = 'radar: ' +  moment_date.toDate();
                }

            } else if (rain_event.rain_type === 'design') {
                $scope.rain_label =
                    'design: ' +
                    parseFloat(state.state.rain.current_rain_grid_design_mm_total).toFixed(1) +
                    ' mm at ' +
                    (parseFloat(state.state.rain.current_rain_grid_design_time_seconds) / 60) +
                    ' minutes';
            } else if (rain_event.rain_type === 'constant') {
                $scope.rain_label =
                    'constant rain: ' +
                    Math.round(parseFloat(rain_event.constant_intensity)*10)/10 + ' mm/h';
            }
        } else {
            $scope.rain_label = 'Area wide rain is disabled.';
            $scope.show_rain_data = false;
        }
        // wind label
        if ((state.state.vars !== undefined) && (state.state.vars.wind_speed !== undefined)) {
            var wind_speed_beaufort = ms_to_beaufort(state.state.vars.wind_speed, 0);
            $scope.wind_label = 'Wind speed: ' + wind_speed_beaufort + ' Beaufort (' +
                state.state.vars.wind_speed + ' m/s)' +
                '. Direction: ' + state.state.vars.wind_direction + '°';
        }
    });

    $scope.add_rain_icon = function () {
        var state = $scope.state,
            c = $scope.clientstate;
        try {
            return (state.rain.current_rain_grid != undefined &&
                    state.rain.current_rain_grid != '{}') &&
                    (
                        c.features.scenario_rain_radar ||
                        c.features.scenario_rain_design ||
                        c.features.scenario_rain_constant
                    );
        } catch (e) {
            return false;
        }
    };

    $scope.get_windrose_class = function () {

        if ($scope.state === null) { return ''; }
        if ($scope.state === undefined) { return ''; }
        if ($scope.state.vars === undefined) { return ''; }

        var dir = $scope.state.vars.wind_direction;
        var result = undefined;

        if (!within_range(22.5, dir, 337.5)) {
            result = 'fa-threedi-windrose-n';
        } else if (within_range(22.5, dir, 67.5)) {
            result = 'fa-threedi-windrose-ne';
        } else if (within_range(67.5, dir, 112.5)) {
            result = 'fa-threedi-windrose-e';
        } else if (within_range(112.5, dir, 157.5)) {
            result = 'fa-threedi-windrose-se';
        } else if (within_range(157.5, dir, 202.5)) {
            result = 'fa-threedi-windrose-s';
        } else if (within_range(202.5, dir, 247.5)) {
            result = 'fa-threedi-windrose-sw';
        } else if (within_range(247.5, dir, 292.5)) {
            result = 'fa-threedi-windrose-w'
        } else if (within_range(292.5, dir, 337.5)) {
            result = 'fa-threedi-windrose-nw';
        }
        return result;
    };

    var within_range = function (minn, pivot, maxx) {
        return (minn <= pivot) && (maxx >= pivot);
    };

    // set initial extent
    $scope.resetExtent = function() {
        // event comes in as string
        if ($scope.state.player.hasOwnProperty('initial_extent')) {
            clientstate.spatial.extent = JSON.parse($scope.state.player.initial_extent);
            map.fitBounds([
              [clientstate.spatial.extent[0], clientstate.spatial.extent[1]],
              [clientstate.spatial.extent[2], clientstate.spatial.extent[3]]]);
        } else {
            console.log("I am missing the serverState property player.initial_extent...");
        }
    };

}]);

/* BootingStatus
state.machines_busy, state_text, progressAmount, status_label
-function returnFromBusyState()
*/
angular.module("threedi-client")
  .controller("BootingStatus", ["$scope", "state", "UtilService",
    function ($scope, state, UtilService){
        $scope.state = null;
        $scope.progressAmount = 0;
        $scope.machine_requested = false;

        function updateProgressBar () {
            switch(state.state.state) {
                case 'machine-requesting':
                    $scope.progressAmount = 5;
                    break;
                case 'machine-requested':
                    $scope.progressAmount = 10;
                    $scope.machine_requested = true;
                    break;
                case 'standby':
                    if ($scope.machine_requested) {
                        $scope.progressAmount = 20;
                    }
                    break;
                case 'prepare-wms':
                    $scope.progressAmount = 25;
                    break;
                case 'machine-powering':
                    $scope.progressAmount = 35;
                    break;
                case 'machine-powered':
                    $scope.progressAmount = 45;
                    break;
                case 'load-model':
                    $scope.progressAmount = 65;
                    break;
                case 'init-modules':
                    $scope.progressAmount = 80;
                    break;
                case 'loaded-model':
                    $scope.progressAmount = 90;
                    break;
                case 'wait':
                    var percentageToGo = 100 - $scope.progressAmount;
                    var newProgressAmount = $scope.progressAmount
                        + Math.round(percentageToGo / 2);
                    $scope.progressAmount = Math.min(100, newProgressAmount);
                    break;
            }
        }

        $scope.$on('serverState', function() {
            updateProgressBar();
            $scope.state = state;
        });

        // "back home" button when booting fails.
        $scope.returnFromBusyState = function () {
            UtilService.openWelcomePopup();
        };
}]);


/* The star on the lower left corner */
angular.module("threedi-client")
  .controller("Director", ["$scope", "$rootScope", "clientState", "state", "socket",
    function ($scope, $rootScope, clientState, state, socket){
    $scope.c = clientState;

    $scope.$on('serverState', function(message){
        $scope.isMaster = state.master;
        $scope.have_master = state.have_master;

        if (!state.hasOwnProperty('state')) { return "there's no state to read" ;}
        if (!state.state.hasOwnProperty('player')) { return "there's no state to read" ;}

        if ($scope.have_master) {
            $scope.master_name = state.state.player.master_name;
        } else {
            $scope.master_name = state.state.player.master_name;
        }
    });

    $scope.requestMaster = function(){
        if (state.master) {
            console.log('giving up master');
        } else {
            console.log('trying to set master...');
        }
        socket.emit('set_master', !state.master, function() {});
    }

    $scope.open_archive_scenario = function() {
        $rootScope.$broadcast('close_box', '');
        $rootScope.keypress_enabled = false;
        clientState.modal.setTemplate('archive_scenario', true);
    }
}]);


/*Resetting the model needs confirmation */
angular.module("threedi-client")
  .controller("Confirmation", ["$scope", "$rootScope", "clientState", "state", "Message",
    function ($scope, $rootScope, clientState, state, Message){

    $scope.$on('serverState', function(message){
        $scope.isMaster = state.master;
        $scope.have_master = state.have_master;
        if (!state.hasOwnProperty('player')) { return "there's no state to read" ;}
        if ($scope.have_master) {
            $scope.master_name = state.state.player.master_name;
        } else {
            $scope.master_name = '';  // there is no master, but the name is still there
        }
    });

    /* if "message" is empty the default string in angular.module("threedi-client")
  .factory(Message) will be used*/
    $scope.confirm = function(message) {
            $scope.message = message
            if ($scope.message) {
                Message.setConfirmMessage($scope.message) // updating the factory,
            }
            $rootScope.$broadcast('close_box', '');
            $rootScope.keypress_enabled = false;
            clientState.modal.setTemplate('confirmation', true);
    }
}]);


/*Controller that provides access to the Message object via a getter */
angular.module("threedi-client")
  .controller("GetMessages", ["$scope", "Message",
    function ($scope, Message){

    $scope.$watch(function () {
        return Message.getConfirmMessage();
            }, function (txt) {
                if (txt) {
                    $scope.confirmMessage = txt;
                }
            });
}]);


/* Play, stop, reset */
angular.module('threedi-client')
  .controller('RemoteControl',
    ['$scope', '$rootScope', 'socket', 'state', 'leaflet', 'clientState', 'modes',
    function($scope, $rootScope, socket, state, leaflet, clientstate, modes){
    var c = clientstate;
    $scope.wait_for_server_response = true;
    $scope.isMaster = false;

    $scope.$on('serverState', function(message) {
        $scope.isMaster = state.master;
        $scope.isPlaying = state.state.running_sim !== "0";
        $scope.wait_for_server_response = false;
        if ((state.state.state === 'load-model') ||
            (state.state.state === 'archive') ||
            (parseInt(state.state.pending_actions) > 0)) {

            $scope.wait_for_server_response = true;
        }
        $scope.state = state.state;
        $scope.has_future_events = state.state.has_future_events === '1';  // value
    });

	$scope.play = function(){
        $scope.wait_for_server_response = true;
		if ($scope.isPlaying){
            $scope.stop();
        } else{
            $scope.isPlaying = true;
            clientstate.setMode(modes.MODE_INFO_POINT);
            socket.emit(
                'run_simulation',
                function() {
                    console.log('emit simulation run');
                });
            // update edit polygon button
            if (clientstate.program_mode == modes.MODE_EDIT) {
                // only in correct program mode
                leaflet.toggle_layer_edit(true);  // turn edit control on
            } else {
                leaflet.toggle_layer_edit(false);  // turn edit control off
            }
        }
	};

	$scope.stop = function(){
        $scope.wait_for_server_response = true;
        $scope.isPlaying = false;
		socket.emit(
            'stop_simulation',
            function() {
                console.log('emit simulation stop');
            });
	};

	$scope.reset = function(){
        $scope.wait_for_server_response = true;
        $scope.isPlaying = false;
		socket.emit(
            'reset_simulation',
            function() {
                $rootScope.$broadcast('new-model');
                console.log('emit simulation reset');
            });
	};

    $scope.$on('keypress-start-stop', function(message, value) {
        if (state.master) {
            if ($scope.isPlaying) {
                $scope.stop();
            } else {
                $scope.play();
            }
        }
    });

    $scope.$on('keypress-reset', function(message, value) {
        if (state.master) {
            $scope.reset();
        }
    });

    $scope.$on('edit-pause', function(message, value) {
        if (state.master && $scope.isPlaying) {
            $scope.stop();
        }
    });
}]);

angular.module("threedi-client")
  .controller("TouchingGround", ["$rootScope", "$scope", "clientState", "state", "socket", "UtilService",
    function($rootScope, $scope, clientstate, state, socket, UtilService) {
        // TODO read the default extent from apps's settings
        $scope.end_session_visible = false;
        $scope.master_link = false; // show different link for master
        $scope.follow_link = false; // and follower
        $scope.end_session_visible = true;
        if (!is_user_connected_to_subgrid) {
            UtilService.openWelcomePopup();
        }

        /* Click on "Quit current session" */
        $scope.squareOne = function () {
          if (state.master) {
           clientstate.makeSure();
          } else if (!state.master) {
            socket.emit('unfollow', state.master, function() {});
            clientstate.spatial.resetExtent();
            $rootScope.$broadcast('killOneDee');
            UtilService.openWelcomePopup();
          }
        };

        /* Click on Log out */
        $scope.buttonLogOut = function () {
          clientstate.makeSureLogOut();
        };

    }
]);

/* The load model button */
angular.module("threedi-client")
  .controller("ModelChooserButton", ["$scope", "clientState", "state", "$rootScope",
    function($scope, clientState, state, $rootScope){

    // Button handling
    $scope.state = state;


    $scope.$on('serverState', function(message){
        $scope.isMaster = state.master;
    });

    $scope.modal = function() {
        if (state.master) {
            $rootScope.$broadcast('close_box', '');
            clientState.modal.setTemplate('model_picker', true);
        }
    };

    $scope.$on('keypress-choose-model', function(message, value) {
        if (state.master) {
            //$scope.modal();
        }
    });
}]);


/* Content of model popup */
angular.module("threedi-client")
  .controller("ModelChooser", ["$scope", "$http", "socket", "clientState", "state",
    function($scope, $http, socket, clientState, state){
        $scope.is_loading = false;
        $scope.load_text = 'Loading...';
        $scope.is_loading_model_data = false;
        $scope.loading_model_data_text = 'Loading model data. Please wait...';
        $scope.error_text = '';
        $scope.state_text = '';
        $scope.mode = 'model'; // 'model' or 'scenario'
        $scope.scenarios = [];
        $scope.selected_model = null;
        $scope.selected_model_name = null;
        $scope.wait_for_model_loaded = true;
        $scope.loading_model_done = false;
        $scope.landing = false;
        // model data from inpy api
        $scope.model_list = [];
        $scope.model_list_count = null;
        $scope.model_list_previous_url = null;
        $scope.model_list_next_url = null;
        $scope.model_search_query = null;
        $scope.model_sort_key = 'last_update'; // default sort key
        $scope.model_sort_direction = 'desc';  // default sort direction

        $scope.init = function () {
            // init function for this controller; loads the model list
            $scope.getModelList();
        };

        function isEmpty(obj) {
            // check if the given obj is empty: null, undefined, '' or {}
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }

        var toggleSortDirection = function() {
            if ($scope.model_sort_direction == 'desc') {
                $scope.model_sort_direction = 'asc';
            } else {
                $scope.model_sort_direction = 'desc';
            }
        };

        var getSortString = function() {
            return $scope.model_sort_key + '_' + $scope.model_sort_direction;
        };

        $scope.getSortedModelList = function(sort_key) {
            if ($scope.model_sort_key == sort_key) {
                // same key; only toggle the sort direction
                toggleSortDirection();
            } else {
                $scope.model_sort_key = sort_key;
                if (sort_key == 'model') {
                    // default for model is ascending
                    $scope.model_sort_direction = 'asc';
                } else {
                    $scope.model_sort_direction = 'desc';
                }
            }
            $scope.getModelList();
        };

        $scope.do_model_search = function() {
            var search_query = $('#model-search input').val();
            if (search_query) {
                $scope.model_search_query = search_query;
            } else {
                $scope.model_search_query = null;
            }
            $scope.getModelList();
        };

        $scope.getModelList = function(previous_next) {
            $scope.is_loading_model_data = true;
            $scope.error_text = '';
            var url;
            switch (previous_next) {
                case 'previous':
                    url = $scope.model_list_previous_url;
                    break;
                case 'next':
                    url = $scope.model_list_next_url;
                    break;
                default:
                    url = inp_server_models_api_url + '?fp=' +
                          inp_server_filter_params + '&page_size=' +
                          inp_server_models_api_page_size + '&sort=' +
                          getSortString();
            }
            if ($scope.model_search_query !== null) {
                url += '&q=' + $scope.model_search_query;
            }
            console.log("URL for calling inpy (for available models):", url);
            var responsePromise = $http.get(url, {timeout: 20000});
            responsePromise.success(function (data, status, headers, config) {
                if (isEmpty(data)) {
                    console.log("No model list data at the moment");
                    $scope.model_list = [];
                    $scope.model_list_count = null;
                    $scope.model_list_previous_url = null;
                    $scope.model_list_next_url = null;
                    $scope.error_text = 'No model data found. Contact helpdesk to solve this issue.';
                } else {
                    console.log("model list data: ", data);
                    $scope.model_list = data.results;
                    $scope.model_list_count = data.count;
                    $scope.model_list_previous_url = data.previous;
                    $scope.model_list_next_url = data.next;
                    if (data.count === 0) {
                        $scope.error_text = 'No model data available for you. Contact helpdesk to solve this.';
                    } else {
                        $scope.error_text = '';
                    }
                }
                $scope.is_loading_model_data = false;
            }).error(function (data, status, headers, config) {
                $scope.model_list = [];
                console.log('Error - AJAX to retrieve models failed!');
                $scope.error_text = 'Error fetching model data: please try again or contact the helpdesk.';
                $scope.is_loading_model_data = false;
                $scope.model_list = [];
                $scope.model_list_count = null;
                $scope.model_list_previous_url = null;
                $scope.model_list_next_url = null;
            });
        };

        // setter to change to true on click event from landing.html
        $scope.touchDown = function(landing) {
            $scope.landing = landing;
        };

        // determine if the loading screen is to be showed
        $scope.show_loading = function() {
            if (clientState.error_message_for_controller !== "") {
                $scope.error_message = clientState.error_message_for_controller;
                return false;
            }
            return $scope.is_loading;
        };

        $scope.$on('no_machines_available', function (message) {
          $scope.is_loading = false;
          $scope.$parent.tab = 'follow';  // so, what happens then?
          // update the current list of active simulations
          $scope.get_active_simulations();
        });

        $scope.$on('serverState', function(message) {
            // update state_text
            var state_text = state.state.state;
            if (state.state.state_extra !== undefined) {
                state_text = state_text + ', ' + state.state.state_extra;
            }
            $scope.state_text = state_text;
            // update is_loading
            if (state.state.state === 'load-model' ||
                state.state.state === 'loaded-model' ||
                state.state.state === 'init-modules') {
                $scope.is_loading = true;
            } else if (
                state.state.state === 'standby' ||
                state.state.state === 'prepare-wms') {
                // no opinion
            } else {
                $scope.is_loading = false;
                if ($scope.wait_for_model_loaded) {

/*                    // Close and reset model chooser*/
                    //var modelChooserModal = $("#modelChooserModal");
                    //modelChooserModal.find('.modal-footer').show();
                    //modelChooserModal.find('.modal-header').find('.close').show();
                    //modelChooserModal.modal('hide');
                    //$scope.wait_for_model_loaded = false;
                    //if ($scope.landing) {
                        //$scope.loading_model_done = true;
                        //var LandingModal = $("#LandingModal");
                        //LandingModal.modal('hide');
                        //$scope.touchDown(false)
                    /*}*/
                }
            }
        });

    $scope.emit_model_event = function (model_slug, scenario_slug, model_type,
                                        change)
    {
        var event_handler;
        if (change){
            event_handler = 'change_model';
        }
        else {
            event_handler = 'initial_model';
        }
        socket.emit(event_handler,
            model_slug, scenario_slug, model_type,
            function() {
                console.log(
                    "emitted ", event_handler, model_slug,
                    scenario_slug, model_type);
            });
        // socket.emit('change_model', model_name, function() {});
        // Put the chooser screen in "in progress" state.
        $scope.setMode('model');
        // show a progress
        $scope.is_loading = true;
        $scope.wait_for_model_loaded = true;  // box is now open
        $scope.load_text = 'Loading ' + $scope.selected_model_name + ' ...';
    };

    //$scope.setModel = function (model_slug, model_display_name, scenarios_json, editable_maps, model_type) {
    /*
    set (load) a new model.

    function is called from model_picker.html, landing.html and timeout.html

    model object must have properties:

    slug, display_name, scenarios_json,
    editable_maps, animation_maps,
    threedi_model_repository.model_type,

    as_master: normally true, you can set it to false
     */
    $scope.setModel = function (model, as_master) {
        if ((state.master) || (as_master === false)) {
            var model_slug = model.slug;
            var model_display_name = model.display_name;
            var scenarios_json = model.scenarios_json;
            var editable_maps = model.editable_maps;
            var animation_maps = model.animation_maps;
            var model_type = model.threedi_model_repository.model_type;
            console.log('chosen model: ', model);

            // apparently need to specify parent.
            try {
                $scope.$parent.editable_maps = JSON.parse(editable_maps);
            } catch (e) {
                console.error('editable maps are not really json', e);
                console.log(editable_maps);
                $scope.$parent.editable_maps = [];
            }
            try {
                $scope.$parent.animation_maps = JSON.parse(animation_maps);
            } catch (e) {
                console.error('animation maps are not really json', e);
                console.log(animation_maps);
            }

            $scope.selected_model = model_slug;
            $scope.selected_model_name = model_display_name;
            $scope.emit_model_event(
                $scope.selected_model, null, model_type, as_master);

            // reset error message, if any
            clientState.error_message_for_controller = '';
            $scope.error_message = clientState.error_message_for_controller;
        } else {
            console.log("cannot change model as slave, as_master=" + as_master);
        }
    };

    $scope.setScenario = function(scenario_slug) {
        // now we have model and scenario -> send to server
        console.log('chosen scenario: ', scenario_slug);
        $scope.emit_model_event($scope.selected_model, scenario_slug);
    };

    $scope.setMode = function(new_mode) {
        $scope.mode = new_mode;
    };

    // call the init function that loads the models
    $scope.init();
}]);


/* This is the PI menu. */
angular.module("threedi-client")
  .controller("PanelSwitcher",
    ["$scope", "$rootScope", "clientState", function(
     $scope, $rootScope, clientstate) {

    $scope.clientstate = clientstate;

    $scope.open_close = function(item_name) {
        if (clientstate.active_panel !== item_name) {
            console.log("Show side bar");
            clientstate.active_panel = item_name;
            $scope.currently_opened = item_name;
            $('#off-canvas').addClass("show");
        } else {
            console.log("Hide side bar");
            $scope.currently_opened = '';
            clientstate.active_panel = '';
            $('#off-canvas').removeClass("show");
        }
    }

    $scope.must_show_infopoint_btn = function () {
        try {
           return clientstate.features.gui_infopoint_depth ||
                  clientstate.features.gui_infopoint_waterlevel ||
                  clientstate.features.gui_infopoint_groundwaterlevel;
        } catch (e) {
            return false;
        }
    }

}]);

angular.module("threedi-client")
  .controller("DefaultSettings",
    ["$scope", "clientState", "state", "$rootScope", "socket", "BeaufortConverterService",
    function($scope, clientstate, state, $rootScope, socket, BeaufortConverterService) {
        // socket is used to send and receive the value of:
        // min_time_sim_step, wind_direction, wind_speed

        $scope.scenario_event_defaults = clientstate.scenario_event_defaults;
        $scope.map_defaults = clientstate.map_defaults;
        // Values in input fields
        $scope.crop_type = $scope.scenario_event_defaults.crop_type;
        $scope.soil_type = $scope.scenario_event_defaults.soil_type;
        $scope.infiltration_value = $scope.scenario_event_defaults.infiltration_value;
        $scope.interception_value = $scope.scenario_event_defaults.interception_value;
        //
        $scope.bathy_mode = $scope.scenario_event_defaults.bathy_mode;
        $scope.land_use_value = $scope.scenario_event_defaults.land_use_color;
        $scope.wms_options_hmax = $scope.scenario_event_defaults.wms_options['hmax'];
        $scope.wms_options_interpolation = $scope.scenario_event_defaults.wms_options['interpolate'];
        $scope.wms_layer_depth = $scope.scenario_event_defaults.wms_layer_depth;
        $scope.flood_fill_level = $scope.scenario_event_defaults.flood_fill_level;
        $scope.flood_fill_mode = $scope.scenario_event_defaults.flood_fill_mode;

        $scope.info_mode = $scope.scenario_event_defaults.info_mode;
        $scope.onedee_info_mode = $scope.scenario_event_defaults.onedee_info_mode;
        $scope.time_step_duration = $scope.scenario_event_defaults.time_step_duration;
        $scope.min_time_sim_step = $scope.scenario_event_defaults.min_time_sim_step;

        $scope.wind_direction = $scope.scenario_event_defaults.wind_direction;
        $scope.wind_speed_beaufort = $scope.scenario_event_defaults.wind_speed_beaufort;

        $scope.fill_container = function(ignored) {
            var var_container = {};
            for (var key in $scope.edit_ranges) {
                if ($scope.edit_ranges.hasOwnProperty(key) && ignored.indexOf(key) === -1) {
                    var val = $scope.edit_ranges[key];
                    var_container[key] = {
                        'min': $scope.edit_ranges[key].min,
                        'max': $scope.edit_ranges[key].max,
                        'min_name': key + '_min',
                        'max_name': key + '_max'
                    };
                }
            }
            return var_container;
        };

        // Edit ranges
        $scope.edit_ranges = clientstate.edit_ranges;
        var ignored = ['discharge_type', 'flood_fill_mode'];
        $scope.var_container = $scope.fill_container(ignored);

        // Is called in the template.
        var beaufort_to_ms = BeaufortConverterService.beaufort_to_ms;
        var ms_to_beaufort = BeaufortConverterService.ms_to_beaufort;
        $scope.beaufort_to_ms = beaufort_to_ms;
        $scope.ms_to_beaufort = ms_to_beaufort;

        $scope.$on('serverState', function(message){
           // use server value
            if ((state.state !== undefined) && (state.state.vars !== undefined)) {
                $scope.scenario_event_defaults.min_time_sim_step = parseFloat(
                    state.state.vars.min_time_for_sim_step) * 10;
                $scope.min_time_sim_step = parseFloat(
                    state.state.vars.min_time_for_sim_step) * 10;

                $scope.scenario_event_defaults.time_step_duration = parseInt(
                    state.state.time_step_duration);
                $scope.time_step_duration = parseInt(
                    state.state.time_step_duration);

                $scope.scenario_event_defaults.wind_direction = parseFloat(
                    state.state.vars.wind_direction);
                $scope.wind_direction = parseFloat(
                    state.state.vars.wind_direction);
                // TODO: not beaufort right now
                $scope.scenario_event_defaults.wind_speed_beaufort = ms_to_beaufort(parseFloat(
                    state.state.vars.wind_speed), 0);
                $scope.wind_speed_beaufort = ms_to_beaufort(parseFloat(
                    state.state.vars.wind_speed), 0);
            }
        });

        $scope.save_number_value = function(var_name, object_name, field_name) {
            // var_name is name of the variable in this controller
            // e.g.: 'flood_fill_relative_min'
            // field_name is the actual object field getting changed
            // e.g.: 'min' (from clientstate.edit_ranges['flood_fill_relative'].min)
            // object_name is the object of that field
            // e.g.: 'flood_fill_relative'
            // This function is constrained to clientstate.edit_ranges

            // TODO: validation doesn't work (new angular version??)
            if ($scope.defaultSettings[var_name].$valid) {
                clientstate.edit_ranges[object_name][field_name] = (
                    $scope.var_container[object_name][field_name]);
            }
        };

        $scope.save_min_time_sim_step = function() {
            if ($scope.defaultSettings.min_time_sim_step.$valid) {
                clientstate.scenario_event_defaults.min_time_sim_step = parseFloat(
                    $scope.min_time_sim_step);
                socket.emit('set_var',
                    'min_time_sim_step',
                    parseFloat($scope.min_time_sim_step)/10,
                    function() {});
            }
        };

        $scope.save_wind = function() {
            clientstate.scenario_event_defaults.wind_direction = parseFloat(
                $scope.wind_direction);
            clientstate.scenario_event_defaults.wind_speed_beaufort = parseFloat(
                $scope.wind_speed_beaufort);
            socket.emit('change_object',
                {
                    object_type: 'wind',
                    wind_speed: beaufort_to_ms(parseFloat($scope.wind_speed_beaufort), 2),
                    wind_direction: parseFloat($scope.wind_direction)
                }, function() {});
        };

        $scope.save_time_step_duration = function() {
            if ($scope.defaultSettings.time_step_duration.$valid) {
                clientstate.scenario_event_defaults.time_step_duration = parseInt(
                    $scope.time_step_duration);
                socket.emit('set_var',
                    'time_step_duration', parseInt($scope.time_step_duration),
                    function() {});
            }
        };

        $scope.save_crop_type = function() {
            if ($scope.defaultSettings.crop_type.$valid) {
                clientstate.scenario_event_defaults.crop_type = parseInt(
                    $scope.crop_type);
            }
        };

        $scope.save_soil_type = function() {
            if ($scope.defaultSettings.soil_type.$valid) {
                clientstate.scenario_event_defaults.soil_type = parseInt(
                    $scope.soil_type);
            }
        };

        $scope.save_infiltration_value = function() {
            if ($scope.defaultSettings.infiltration_value.$valid) {
                clientstate.scenario_event_defaults.infiltration_value = parseFloat(
                    $scope.infiltration_value);
            }
        };

        $scope.save_interception_value = function() {
            if ($scope.defaultSettings.interception_value.$valid) {
                clientstate.scenario_event_defaults.interception_value = parseFloat(
                    $scope.interception_value);
            }
        };

        $scope.save_bathy_mode = function() {
            if ($scope.defaultSettings.bathy_mode.$valid) {
                clientstate.scenario_event_defaults.bathy_mode = parseInt(
                    $scope.bathy_mode);
            }
        };

        $scope.save_land_use_value = function() {
            console.log("Save land use value");
            if ($scope.defaultSettings.land_use_value.$valid) {
                clientstate.scenario_event_defaults.edit_land_use_color = parseInt(
                    $scope.land_use_value);
            }
        };

        $scope.save_flood_fill_level = function() {
            if ($scope.defaultSettings.flood_fill_level.$valid) {
                clientstate.scenario_event_defaults.flood_fill_level = parseFloat(
                    $scope.flood_fill_level);
            }
        };

        $scope.save_flood_fill_mode = function() {
            if ($scope.defaultSettings.flood_fill_mode.$valid) {
                clientstate.scenario_event_defaults.flood_fill_mode = parseInt(
                    $scope.flood_fill_mode);
            }
        };

        // Kinda dirty: requires $rootScope and state
        $scope.save_wms_options_hmax = function() {
            if (!$scope.defaultSettings.wms_options_hmax.$valid) {
                return;
            }
            clientstate.scenario_event_defaults.wms_options['hmax'] = parseFloat(
                $scope.wms_options_hmax);

            $rootScope.$broadcast('animation-update');
        };

        $scope.save_wms_options_interpolation = function() {
            if (!$scope.defaultSettings.wms_options_interpolation.$valid) {
                return;
            }
            clientstate.scenario_event_defaults.wms_options['interpolate'] =
                $scope.wms_options_interpolation;

            $rootScope.$broadcast('animation-update');
        };

        $scope.save_wms_layer_depth = function() {
            if (!$scope.defaultSettings.wms_layer_depth.$valid) {
                return;
            }
            clientstate.scenario_event_defaults.wms_layer_depth = $scope.wms_layer_depth;
            $rootScope.$broadcast('animation-update', 'reset');
        };

        $scope.save_info_mode = function() {
            if ($scope.defaultSettings.info_mode.$valid) {
                clientstate.scenario_event_defaults.info_mode = $scope.info_mode;
            }
        };

        $scope.save_onedee_info_mode = function() {
            if ($scope.defaultSettings.onedee_info_mode.$valid) {
                clientstate.scenario_event_defaults.onedee_info_mode = $scope.onedee_info_mode;
            }
        };

        $scope.wind_direction_textual = function(deg) {
            // degrees to text;
            deg = deg % 360;
            if ((deg < 22.5) || (deg >= 360-22.5)) {
                return 'coming from S';
            } else if ((deg >= 45-22.5) && (deg < 45+22.5)) {
                return 'coming from SW';
            } else if ((deg >= 90-22.5) && (deg < 90+22.5)) {
                return 'coming from W';
            } else if ((deg >= 135-22.5) && (deg < 135+22.5)) {
                return 'coming from NW';
            } else if ((deg >= 180-22.5) && (deg < 180+22.5)) {
                return 'coming from N';
            } else if ((deg >= 225-22.5) && (deg < 225+22.5)) {
                return 'coming from NE';
            } else if ((deg >= 270-22.5) && (deg < 270+22.5)) {
                return 'coming from E';
            } else if ((deg >= 315-22.5) && (deg < 315+22.5)) {
                return 'coming from SE';
            }
        };

        $scope.get_wind_direction = function () {
            return $scope.wind_direction
                   + "° ("
                   + $scope.wind_direction_textual($scope.wind_direction)
                   + ")";
        };

}])
// Got this directive from: http://stackoverflow.com/q/24248098
.directive("dynamicName",function($compile) {
    return {
        restrict:"A",
        terminal:true,
        priority:1000,
        link: function(scope,element,attrs) {
            element.attr('name', scope.$eval(attrs.dynamicName));
            element.removeAttr("dynamic-name");
            $compile(element)(scope);
        }
    }
});


angular.module("threedi-client")
  .controller("ResetModel", ["$scope", "$rootScope",
    function($scope, $rootScope){
        console.log('controller ResetModel')
        $scope.test = "my test";
        // when clicking the X, this function is called. Enable keypressing.
        $scope.close = function() {
            $rootScope.keypress_enabled = true;
        }
}]);


/*
The Archive scenario screen.

Keypress is disabled before entering this controller.
Enable when leaving using $rootScope.
*/
angular.module("threedi-client")
  .controller("LoadSave", ["$scope", "$rootScope", "clientState", "socket", "state",
    function($scope, $rootScope, clientState, socket, state){
        $scope.storing = false;
        $scope.clicked_archive = false;
        $scope.results = {
          max_depth: true,
          arrival_time: true,
          arrival_time_at_depth_enabled: true,
          arrival_time_at_depth_value: 0.3,
          vulnerable_buildings: true,
          roads: true,
          wss: true,
          hisssm: true,
          water_flow_velocity: true,
          water_rise_velocity: true
        };

        // when clicking the X, this function is called. Enable keypressing.
        $scope.close = function() {
            $rootScope.keypress_enabled = true;
        };

        $scope.$on('serverState', function(message){
            $scope.storing = state.state.state === 'archive';
            if (($scope.storing == false) && ($scope.clicked_archive)) {
                // close modal
                clientState.modal.active = false;
                $rootScope.keypress_enabled = true;
                $scope.clicked_archive = false;
            }
        });

        $scope.archive_scenario = function() {
            if ($scope.storing) {
                console.log('Not archiving because I\'m already busy.');
                return;
            }
            if (state.master === true) { // adding class "disabled" only makes it grey
              console.log($scope.results);
                $scope.clicked_archive = true;
                $scope.storing = true;
                showalert("Busy archiving scenario");
                socket.emit("archive_scenario", {
                  name: $scope.scenario_name,
                  results_dict: $scope.results,
                  notify: $scope.notify
                },
              function () {
              });
            }
        };
}]);

angular.module("threedi-client")
  .controller("Debug", ["$scope", "socket", "state",
    function($scope, socket, state){
        $scope.debug_vars;
        $scope.line_number;
        $scope.node_number;

        $scope.debug_beam_to_wms = function() {
            if (state.master) { // adding class "disabled" only makes it grey
                socket.emit("debug_beam_to_wms", function() {});
            }
        };

        $scope.light_my_line = function() {
            console.log($scope.line_number);
            // sander_id 'accidently' correspond to the line number
            d3.selectAll('#channel-' + $scope.line_number).classed('lighted-channel', true);
            // 1d2d + 2d lines
            d3.selectAll('#line2d-' + $scope.line_number).classed('lighted-channel', true);
        }

        $scope.light_my_node = function() {
            console.log($scope.node_number);
            // sander_id 'accidently' correspond to the node number
            d3.selectAll('#node-' + $scope.node_number).classed('lighted-node', true);
        }

        $scope.$on('serverState', function(message){
            if ((state.state.vars !== undefined) && (state.state.vars.debug !== undefined)) {
                $scope.debug_vars = state.state.vars.debug;
            }
        });

}]);

angular.module("threedi-client")
  .controller("Modules", ["$scope", "socket", "state", function($scope, socket, state){
        $scope.modules;

        $scope.$on('serverState', function(message){
            $scope.modules = state.state.module;
            $scope.time_seconds = state.state.time_seconds;
        });

        $scope.on = function(mod_var_name) {
            // mod_var_name is something like flow:active or flow:control:active
            if (state.master) {
                console.log("ON");
                socket.emit(
                    "set_var", "module:" + mod_var_name, "1", function() {});
            }
        };

        $scope.off = function(mod_var_name) {
            if (state.master) {
                console.log("OFF");
                socket.emit(
                    "set_var", "module:" + mod_var_name, "0", function() {});
            }
        };

        $scope.var_url = function(var_params) {
            var vars = JSON.parse(var_params);
            if (vars === null) {
                console.log('var_url returned nothing');
                return "";
            }
            return data_url + "?REQUEST=getgraphdata&xvar="+vars[0]+"&yvar="+vars[1]+"&decimals=2&time=" + $scope.time_seconds;
        }
}]);

angular.module("threedi-client")
  .controller("LoadScenario", ["$scope", "socket",
    function($scope, socket) {
        $scope.load_scenario = function() {
            console.log("Load scenario ")
            console.log($scope.scenario);
            socket.emit("load_scenario", $scope.scenario.id, function() {});
        };
}]);

angular.module("threedi-client")
  .controller("ScenarioInfo", ["$scope", "$rootScope", "clientState",
    function($scope, $rootScope, clientState) {
        $scope.c = clientState;

        $rootScope.$on('scenario_events', function(message, scenario_events) {
            $scope.stats_road_m2 = 0;
            $scope.stats_housing_m2 = 0;
            $scope.stats_unpaved_m2 = 0;
            $scope.stats_water_m2 = 0;

            $scope.stats_earth_m2 = 0;
            $scope.stats_earth_m3 = 0;
            scenario_events.forEach(function(scenario_event){
                // ['#888888', '#52ff00', '#f73959', '#1285cd'],
                // quick and dirty stats. They do not represent correct values.
                if (scenario_event.type === 'twodee-edit') {
                    if (scenario_event.edit_mode === 'edit_land_use') {
                        if (scenario_event.color_value == '#888888') {
                            $scope.stats_road_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#52ff00') {
                            $scope.stats_unpaved_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#f73959') {
                            $scope.stats_housing_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#1285cd') {
                            $scope.stats_water_m2 += scenario_event.size * scenario_event.size;
                        }
                    } else if (scenario_event.edit_mode === 'edit_bathy') {
                        // bathy-edit
                        $scope.stats_earth_m2 += scenario_event.size * scenario_event.size;

                        $scope.stats_earth_m3 += scenario_event.size * scenario_event.size * scenario_event.value;
                    }
                }
            });

            // Round everything
            $scope.stats_earth_m2 = Math.round($scope.stats_earth_m2 / 100) * 100;
            $scope.stats_earth_m3 = Math.round($scope.stats_earth_m3 / 100) * 100;
            $scope.stats_road_m2 = Math.round($scope.stats_road_m2 / 100) * 100;
            $scope.stats_unpaved_m2 = Math.round($scope.stats_unpaved_m2 / 100) * 100;
            $scope.stats_housing_m2 = Math.round($scope.stats_housing_m2 / 100) * 100;
            $scope.stats_water_m2 = Math.round($scope.stats_water_m2 / 100) * 100;
        })
}]);

/*
The slider is used to control the most important variable of an edit.

Hold the slider for 2 seconds and a settings screen is popped up for that item.
*/
angular.module("threedi-client")
  .controller("ThreediSlider", ["$scope", "$rootScope", "clientState", 'modes',
    function($scope, $rootScope, clientstate, modes) {

    $scope.value_min = 0;
    $scope.value_max = 100;
    $scope.value_percentage = 0;

    $scope.decimal_factor = 1;  // factor to be divided with and multiplied with in rounding

    $scope.mouse_is_down = false;
    $scope.promise = null;
    $scope.time_down = 0;

    $scope.slider_width = 300;

    $scope.range_name = null;

    $scope.must_hide_slider = function () {
        return !(
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_bathy') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_soil') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_crop_type') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_infiltration') ||
                 (clientstate.program_mode === 'edit') &&
                 (clientstate.edit_mode === 'edit_interception') ||
                 (clientstate.program_mode === 'rain') ||
                 (clientstate.program_mode === 'flood_fill_relative') ||
                 (clientstate.program_mode === 'flood_fill_absolute') ||
                 (clientstate.program_mode === 'discharge') ||
                 (clientstate.program_mode === 'wind')
                );
    };

    $scope.must_hide_inline_settings = function () {
        return ((clientstate.program_mode == 'rain') &&
               !(clientstate.features.scenario_rain_local)) ||
               (clientstate.program_mode == 'wind');
    };

    $scope.open_settings_from_slider = function() {
        $scope.time_down = 0;
        $scope.mouse_is_down = false;
        $rootScope.$broadcast('close_box', '');
        clientstate.modal.setTemplate('edit_settings', true);
    }

    $scope.update_current_slider = function() {
        // we set the range_name in the $scope because it is used in the template as well.
        if (clientstate.program_mode == modes.MODE_EDIT) {
            $scope.range_name = clientstate.edit_mode;
        } else {
            $scope.range_name = clientstate.program_mode;
        }
        if ($scope.range_name in clientstate.edit_ranges) {
            $scope.value_min = clientstate.edit_ranges[$scope.range_name].min;
            $scope.value_max = clientstate.edit_ranges[$scope.range_name].max;
            $scope.decimal_factor = Math.pow(10, clientstate.edit_ranges[$scope.range_name].decimals);
            var value_fract = (
                clientstate.edit_ranges[$scope.range_name].value -
                $scope.value_min) / (
                $scope.value_max - $scope.value_min);
            $scope.set_value($scope.range_name, value_fract);
        }
    }

    // if the program mode switches, we have to update some vars
    $scope.$watch('clientstate.program_mode', function() {
        $scope.update_current_slider();
    });

    // edit_mode also influences the range_name
    $scope.$watch('clientstate.edit_mode', function() {
        $scope.update_current_slider();
    });

    $scope.update_percentage = function(var_name) {
        $scope.value_percentage = 100 * (
            clientstate.edit_ranges[var_name].value -
            clientstate.edit_ranges[var_name].min) / (
            clientstate.edit_ranges[var_name].max -
            clientstate.edit_ranges[var_name].min);
    }

    $scope.$watch('clientstate.edit_ranges.rain.value', function() {
        $scope.update_percentage('rain');
    });

    $scope.$watch('clientstate.edit_ranges.discharge.value', function() {
        $scope.update_percentage('discharge');
    });

    $scope.$watch('clientstate.edit_ranges.flood_fill_absolute.value', function() {
        $scope.update_percentage('flood_fill_absolute');
    });
    $scope.$watch('clientstate.edit_ranges.flood_fill_relative.value', function() {
        $scope.update_percentage('flood_fill_relative');
    });

    $scope.$watch('clientstate.edit_ranges.edit_bathy.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_BATHY) {
            $scope.update_percentage('edit_bathy');
        }
    });

    $scope.$watch('clientstate.edit_ranges.edit_soil.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_SOIL) {
            $scope.update_percentage('edit_soil');
        }
    });

    $scope.$watch('clientstate.edit_ranges.edit_crop_type.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_CROP_TYPE) {
            $scope.update_percentage('edit_crop_type');
        }
    });

    $scope.$watch('clientstate.edit_ranges.edit_friction.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_FRICTION) {
            $scope.update_percentage('edit_friction');
        }
    });

    $scope.$watch('clientstate.edit_ranges.edit_infiltration.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_INFILTRATION) {
            $scope.update_percentage('edit_infiltration');
        }
    });

    $scope.$watch('clientstate.edit_ranges.edit_interception.value', function() {
        if (clientstate.edit_mode == modes.EDIT_MODE_INTERCEPTION) {
            $scope.update_percentage('edit_interception');
        }
    });

    // calculate real value using fraction and round to correct number of decimals
    $scope.set_value = function(range_name, value_fract) {
        $scope.value_percentage = 100 * value_fract;
        clientstate.edit_ranges[range_name].value =
            Math.round(value_fract * ($scope.value_max - $scope.value_min) *
                $scope.decimal_factor) / $scope.decimal_factor +
            $scope.value_min;
    }

    $scope.mouse_down = function(event) {
        $scope.mouse_is_down = true;
        $scope.time_down = 0;
    }

    $scope.get_x = function(event) {
        var x = event.offsetX;  // normal browsers
        if (x === undefined) {
            // hack for firefox
            x = event.clientX - $(event.currentTarget).offset().left;
        }
        return x;
    }

    $scope.mouse_up = function(event) {
        $scope.mouse_is_down = false;
        $scope.set_value($scope.range_name, $scope.get_x(event) / $scope.slider_width);
    }

    $scope.mouse_move = function(event) {
        if ($scope.mouse_is_down) {
            $scope.set_value($scope.range_name, $scope.get_x(event) / $scope.slider_width);
            $scope.time_down = 0;
        }
    }


}]);


angular.module("threedi-client")
  .service('state', ["$rootScope", "clientState", function ($rootScope, clientState) {

    /**
     * @function
     * @description make sure booting modal is open and update progress
     */
    function openBootingModal () {
        clientState.modal.setTemplate('booting', true);
    }

  return {
    // TODO: use this object, not derivatives like master, time, ...
    state: null,
    scenarios: null,
    master: false,
    // to be filled by setPlayerState
    status_label: null,
    state_text: '',
    machines_busy: false,
    detail_info: '',

    // set this.master according to state and sessid
    // side effect: can send broadcast close_box
    setMaster: function(state, sessid){
      if (!state.hasOwnProperty('player')) { return "there's no state to read" ;}
        this.have_master = (state.player.master_sessid !== undefined);
        // Check if you're the master
        if (state.player.master_sessid == sessid) {
            if (!this.master) {
                console.log('You just became master');
            }
            this.master = true;
        } else {
            if (this.master) {
                console.log('You just became slave');
                // close all open boxes
                $rootScope.$broadcast('close_box', '');
                // In case you just quit the session, you want the landing page.
                // In other cases we can close the modal.
                if (clientState.modal.templateName !== 'landing') {
                    clientState.modal.active = false;
                }
            }
            this.master = false;
        }
    },
    // prepare global tile_url, onedee_url
    // can broadcast new-model, close_box, animation-update
    // can close modal
    // manipulate clientState variables
    setPlayerstate: function(state, old_state){
        if (!state.hasOwnProperty('player')) { return "there's no state to read" ;}
        if ((state.player.mode === 'sim') || (state.player.mode === 'play')) {  // always??

            if ((state.loaded_model !== undefined) &&  // server has a loaded model
                (state.loaded_model !== 'None') &&
                ( ( (old_state !== null) &&
                    (old_state.loaded_model !== state.loaded_model) ) ||  // new loaded model
                  (old_state === null) ) ) // initial
                {

                // update tile_url for foregroundlayers
                tile_url = tile_url_template
                    .replace('_model_name_', state.loaded_model)
                    .replace('_model_version_', state.loaded_model_version);

                onedee_url = onedee_url_template
                    .replace('_model_name_', state.loaded_model)
                    .replace('_model_version_', state.loaded_model_version);

                console.log('new model detected');
                if (old_state === null) {
                    // freshly loaded page: set onedee inversion correctly
                    $rootScope.$broadcast('new-model', backgroundLayerDefaultInversion);
                } else {
                    $rootScope.$broadcast('new-model');
                }

                // reset some variables
                clientState.edit_mode = modes.EDIT_MODE_DEFAULT;
                clientState.setMode(modes.MODE_INFO_POINT);
                clientState.info_startingpoint = 0;

                showalert('Using model ' + state.loaded_model_display_name + '.');

                // Close AwesomeBox if open.
                $rootScope.$broadcast('close_box', '');

                // Close modal windows if open
                clientState.modal.active = false;
            }

            // in some states windows can always be closed.
            if ((state.state === 'standby') ||
                (state.state === 'load-model') ||
                (state.state === 'wait-load-model')) {

                // there is no model loaded, so close all existing windows.
                console.log("Close all boxes and modals.");
                // Close AwesomeBox if open.
                $rootScope.$broadcast('close_box', '');
                // Close modal windows if open, if it is not the load screen.
                if ((clientState.modal.templateName !== 'model_picker') &&
                    (clientState.modal.templateName !== 'landing') &&
                    (clientState.modal.templateName !== 'booting')) {
                    clientState.modal.active = false;
                }
            }

            $rootScope.$broadcast('animation-update');
        }

        // set textual derivatives in this + clientState
        var state_text = state.state;
        if (state.state_extra !== undefined) {
            state_text = state_text + ", " + state.state_extra;
        }
        this.state_text = state_text;

        clientState.normal_message_for_controller = "";
        clientState.error_message_for_controller = "";

        switch (state.state) {
            case 'standby':
                this.status_label = 'Standby (no model loaded)';
                break;
            case 'wait':
                this.status_label = 'Wait for instructions.';
                break;
            case 'sim':
                this.status_label = 'Simulation running';
                break;
            case 'prepare-wms':
                this.status_label = 'Preparing wms before loading model';
                break;
            case 'load-model':
                this.status_label = 'Loading model';
                break;
            case 'init-modules':
                this.status_label = 'Init modules: ' + state.state_extra;
                break;
            case 'loaded-model':
                this.status_label = 'Preparing model data';
                break;
            case 'archive':
                this.status_label = 'Archiving';
                break;
            case 'stopping':
                this.status_label = 'Stopping simulation';
                break;
            case 'wait-load-model':
                this.status_label = 'Wait for user to choose model';
                if (this.master) {
                    clientState.normal_message_for_controller =
                        "There is no model loaded. Choose an initial model.";
                    clientState.modal.setTemplate('message', true);
                }
                break;
            case 'crashed-model':
                this.status_label = 'Model crashed. Wait for user to choose model';
                if (this.master) {
                    clientState.normal_message_for_controller = "";
                    clientState.error_message_for_controller = state.state_extra;
                    clientState.modal.setTemplate('message', true);
                }
                break;
            case 'machine-requested':
            case 'machine-requesting':
            case 'machine-powering':
            case 'machine-powered':
                var detail_info_raw = state.state;
                this.detail_info = detail_info_raw.replace("-", " ");
                this.machines_busy = false;
                this.status_label = 'Machine is booting';
                openBootingModal();
                break;
            case 'machine-unavailable-limit-reached':
            case 'machine-unavailable-perform-scaling':
                this.machines_busy = true;
                this.status_label = 'but there is no machine available at this moment.' +
                    ' Please try again later.' + this.state_text;
                openBootingModal();
                break;
            case 'machine-unavailable':
                this.machines_busy = true;
                this.status_label = state.state_extra +
                    ' Please try again later.';
                openBootingModal();
                break;
            case 'timed_out':
                clientstate.modal.setTemplate('timeout', true);
                break;
        }
    },
    // broadcast scenario_events
    setScenarioEvents: function(state) {
        if (typeof state.scenario_events != 'undefined') {
            $rootScope.$broadcast('scenario_events', state.scenario_events);
        }
    },
    showAlertIfAny: function(state){
        if (typeof state.message != 'undefined') {
            showalert(state.message, 'alert-' + state.message_type);
        }
    },
    setState: function(state, sessid){
        // this function is performs all the
        // different steps involved with the state
        var old_state = this.state;

        if (JSON.stringify(state) === JSON.stringify(old_state)) {
          return; // do nothing the state hasn't changed.
        }

        this.state = state;  // store state
        this.setMaster(state, sessid);
        this.setPlayerstate(state, old_state);
        this.setScenarioEvents(state);
        //this.setAfterModelChange(state);
        this.showAlertIfAny(state);

        $rootScope.$broadcast('serverState');  // Let everybody react
    },
    setAvailableScenarios: function(scenarios) {
        // process a new list of available scenarios
        //this.available_scenarios = scenarios;
        this.scenarios = scenarios;
        // so, where does the "available-scenarios" go?
        $rootScope.$broadcast('available-scenarios');
    }
  }
}]);


/* Root controller

Usage:

-1) Add javascript ui-utils.

0) Add ui.directives.

var app = angular.module("threedi-client", ['Components', 'ui.directives']);

1) Place key and function mapping in <body>:

<body ng-controller="Root" ui-keypress="{32: 'trigger(\'start-
stop\')', 113: 'trigger(\'reset\')', 109: 'trigger(\'choose-model\')', 105:
'trigger(\'info-point\')', 108: 'trigger(\'info-line\')', 114:
'trigger(\'rain\')', 100: 'trigger(\'discharge\')', 110:
'trigger(\'navigate\')', 115: 'trigger(\'info-point\')', 97: 'trigger(\'info-
line\')', enter: 'trigger(\'enter\')', 102: 'trigger(\'navigate\')', 48:
'trigger(\'0\')', 49: 'trigger(\'1\')', 50: 'trigger(\'2\')', 51:
'trigger(\'3\')', 52: 'trigger(\'4\')', 53: 'trigger(\'5\')', 54:
'trigger(\'6\')', 55: 'trigger(\'7\')', 56: 'trigger(\'8\')', 57:
'trigger(\'9\')'}" ui-keyup="{'esc': 'trigger(\'esc\')', 37:
'trigger(\'left\')', 38: 'trigger(\'up\')', 39: 'trigger(\'right\')', 40:
'trigger(\'down\')'}">

2) "keypress-<action>" will be broadcast. Place a $scope.$on on this the
   broadcast where needed. Remember to include $rootScope in your controller.

$scope.$on('keypress-1', function(message, value) {$scope.small();});
$scope.$on('keypress-2', function(message, value) {$scope.big();});

Root controller: things that may not be bound to physical html objects

This controller is the root of all things. Changes on this Root controller are
distributed to all its children for free.

*/
angular.module("threedi-client")
  .controller("Root",
    ["$rootScope", "$scope", "$http", "clientState", "state", "socket",
    function($rootScope, $scope, $http, clientState, state, socket){
        $rootScope.keypress_enabled = true;  // kinda dirty
        $scope.trigger = function (action) {
            if ($rootScope.keypress_enabled) {
                console.log('keyboard trigger: ', "keypress-" + action);
                $rootScope.$broadcast("keypress-" + action);
            }
        };

    $scope.state = state;

    // set initial heartbeat timeout
    $scope.heartbeat_timeout = new Date().getTime() + 11000;
    $scope.refresh_browser = false;

    $scope.editable_maps = '';
    $scope.animation_maps = '';

    $scope.$watch('state.state.loaded_model', function (newVal, oldVal) {
        if (newVal === oldVal) {return;}
        $http({method: 'GET', url: '/api/v1/active-model'})
            .success(function (data) {
                $scope.editable_maps = data.editable_maps;
                $scope.animation_maps = data.animation_maps;
            })
            .error(function (data) {
                console.error('API call failed:', data);
            });
    });

    /*When starting up fresh. State will be an empty dict*/
    socket.on('freeze', function(sender_sessid, your_sessid, state) {
        console.log('processing state from server: ', state);
        $scope.waiting = true;
        resetHeartbeat();
    });

    socket.on('state', function(sender_sessid, your_sessid, state) {
        $scope.state.setState(state, your_sessid);

        // update features
        if (state.hasOwnProperty('features')) {
            clientState.features = state.features;
            $rootScope.$broadcast('features');  // Let everybody react
        }
        resetHeartbeat();
    });

    socket.on('heartbeat', function() {
        resetHeartbeat();
    });

    socket.on('scenarios', function(scenarios) {
        console.log('processing scenario list from server: ', scenarios);
        $scope.state.setAvailableScenarios(scenarios);
    });

    socket.on('message', function(msg_list) {
        // TODO: messages that trigger some GUI elements should be done using
        // the state object. Only messages purely for the user should be
        // handled here.
        $scope.isMaster = state.master;
        var msg = msg_list[0];

        if (msg === 'model_kaput') {
          showalert('model seems to be invalid', 'error alert-danger', 10000);
          $rootScope.$broadcast('killOneDee');
          $rootScope.$broadcast('close_box', '');
          clientState.modal.setTemplate('landing', true);
          socket.emit('unfollow', state.master, function() {});
          doReconnect();
        } else if (msg === 'end_session') {
            // TODO show correct user name in the alertbox
            showalert('session has been ended...');
            console.log('Session ended, isMaster: ', $scope.isMaster);
            // TODO check if this is safe - should just apply for followers
            // not masters that have ended the session
            if (!$scope.isMaster){
                socket.emit('unfollow', state.master, function() {});
                $rootScope.$broadcast('killOneDee');
                $rootScope.$broadcast('close_box', '');
                clientState.modal.setTemplate('landing', true);
                console.log("end_session, !is_master. -> set landing page");
                doReconnect();
            }
        } else if (msg === 'no_machines_available') {
          $rootScope.$broadcast('no_machines_available');
        } else {
          var msg_class = msg_list[1];
          showalert(msg, msg_class);
        }
    });

    // It is unclear if this is effective. It does no harm though and it
    // actively tries to connect.
    var doReconnect = function() {
        if ($scope.refresh_browser) {
            console.log('Reconnecting to server...');
            socket.reconnect();
            setTimeout(doReconnect, 2000);
        }
    };

    var doHeartBeat = function() {

        var its_time = new Date().getTime() > $scope.heartbeat_timeout,
            not_refreshing_browser = !$scope.refresh_browser,
            not_waiting = !$scope.waiting;

        if (its_time && not_refreshing_browser) {
            if (not_waiting) {
                showalert('Connection to server lost. Reconnecting.',
                    'alert-danger alert-anchor', 1000000);
                // anchor allow us to remove the message again...
                $scope.refresh_browser = true;
                doReconnect();
            } else {
                console.log('********** waiting for unfreeze ********');
                $scope.refresh_browser = false;
                $scope.waiting = true;
            }
        }

        socket.emit('heartbeat', '');
        // response is a state update.
        setTimeout(function() {
            requestAnimationFrame(doHeartBeat);
        }, 5000);
    };

    setTimeout(function() {
        requestAnimationFrame(doHeartBeat);
    }, 5000);

    var resetHeartbeat = function(msg) {
        // reset heartbeat; allow 11 seconds timeout
        $scope.heartbeat_timeout = new Date().getTime() + 11000;
        $(".alert-anchor").remove();  // remove connection alert, if set
        $scope.refresh_browser = false;
    };

    $scope.open_settings = function(new_mode) {
        $rootScope.$broadcast('close_box', '');
        if (new_mode !== undefined) {
            clientState.setMode(new_mode);
        }
        clientState.modal.setTemplate('edit_settings', true);
    };

    $scope.ui_keypress = {
         32: 'trigger(\'start-stop\')',
        113: 'trigger(\'reset\')',
        119: 'trigger(\'w\')',
        109: 'trigger(\'choose-model\')',
        105: 'trigger(\'info-point\')',
        108: 'trigger(\'info-line\')',
        114: 'trigger(\'rain\')',
        100: 'trigger(\'discharge\')',
        101: 'trigger(\'edit\')',
        110: 'trigger(\'navigate\')',
        115: 'trigger(\'info-point\')',
        97: 'trigger(\'info-line\')',
        enter: 'trigger(\'enter\')',
        102: 'trigger(\'navigate\')',
        48: 'trigger(\'0\')',
        49: 'trigger(\'1\')',
        50: 'trigger(\'2\')',
        51: 'trigger(\'3\')',
        52: 'trigger(\'4\')',
        53: 'trigger(\'5\')',
        54: 'trigger(\'6\')',
        55: 'trigger(\'7\')',
        56: 'trigger(\'8\')',
        57: 'trigger(\'9\')',
        96: 'trigger(\'grave-accent\')'
    };

    $scope.ui_keyup = {
        'esc': 'trigger(\'esc\')',
        37: 'trigger(\'left\')',
        38: 'trigger(\'up\')',
        39: 'trigger(\'right\')',
        40: 'trigger(\'down\')'
    };
}]);

/*Grands access to messages from different controllers. */
angular.module("threedi-client")
  .factory("Message", function() {
    var txt_message = {
        confirmMessage: 'Please confirm...!' //default message
    };

    return {
        getConfirmMessage: function () {
            return txt_message.confirmMessage;
        },
        setConfirmMessage: function (txt) {
            txt_message.confirmMessage = txt;
        }
    };
});

angular.module("threedi-client")
  .controller("ActiveSimulations",
    ["$scope", "$rootScope", "$http", "socket", "clientState",
    function($scope, $rootScope, $http, socket, clientState) {

        $scope.active_simulations = null;
        $scope.no_simulation = true;
        $scope.load_text = 'Requesting active simulations list...';
        $scope.tab = 'new';
        $scope.get_active_simulations = function() {
            var responsePromise = $http.get("/active_simulations/", {
              timeout: 5000
            });
            responsePromise.success(function (data, status, headers, config) {
              if (isEmpty(data)) {
                  $scope.no_simulations_text = "No running simulations at the moment";
                  $scope.no_simulation = true;
              } else {
                  $scope.no_simulation = false;
              }
              $scope.active_simulations = data;
            }).error(function (data, status, headers, config) {
              console.log('[active_simulations] error: ajax call failed!');
              $scope.active_simulations = [];
              $scope.no_simulation = true;
              $scope.no_simulations_text = "Failed to retrieve simulations, try again.";
            });
        };
        $scope.followActiveSimulation = function(requested_subgrid_id) {
            socket.emit( 'follow_simulation',
                         requested_subgrid_id,
                         function(){});
            $rootScope.$broadcast('resetOneDee');
            $rootScope.$broadcast('animation-update');  // let everything move again
            $scope.tab = 'new';
            //$scope.show_first_tab = true;
            clientState.modal.active = false;

            // hacky but neccessary to tune in directly without the
            // need to refresh the browser manually
            socket.reconnect();
        };

        function isEmpty(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        }
}]);

/* Controller for 'make_sure' and 'message' */
angular.module('threedi-client')
  .controller('MakeSureCtrl', ["clientState", "$rootScope", "state", "socket", "$scope",
      function (clientState, $rootScope, state, socket, $scope) {

  $scope.error_message = "";  // = clientState.error_message_for_controller;
  $scope.normal_message = "";  // = clientState.normal_message_for_controller;

  $scope.logUserOut = function () {
    window.location = angular.element('#logout-btn-via-modal').data('url');
  };

  $scope.checkErrorMessage = function () {
    $scope.error_message = clientState.error_message_for_controller;
    return $scope.error_message;
  };

  $scope.checkNormalMessage = function () {
    $scope.normal_message = clientState.normal_message_for_controller;
    return $scope.normal_message;
  };

  $scope.resetMessages = function () {
    clientState.error_message_for_controller = "";
    $scope.error_message = "";
    clientState.normal_message_for_controller = "";
    $scope.normal_message = "";
  };

  $scope.model_picker = function () {
    $scope.resetMessages();
    clientState.modal.setTemplate('model_picker', true);
  };

  $scope.quit_session = function () {
    console.log("Quit session");
    $scope.resetMessages();
    clientState.modal.setTemplate('landing', true);
    restartTheShiz();
  };

  $scope.close = function () {
    $scope.resetMessages();
    clientState.modal.setTemplate('model_picker', false);
  };

  function restartTheShiz () {
    if (state.master) {
      socket.emit('end_session', function() {});
    }
    clientState.spatial.resetExtent();
    $rootScope.$broadcast('killOneDee');
  }

}]);

angular.module('threedi-client')
   .service('BeaufortConverterService', function(){
    // Equations based on empircal relation: v = 0.836 B^3/2 m/s
    this.beaufort_to_ms = function(speed, precision) {
      var v = 0.836 * Math.pow(speed, 1.5);
      return Number(v.toFixed(precision));
    };

    this.ms_to_beaufort = function(speed, precision) {
      var v = Math.pow(speed / 0.836, (2.0/3.0));
      return Number(v.toFixed(precision));
    };
});
