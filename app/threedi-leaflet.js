/* Do things on the map and keep track of those things */

// max number of pending requests before adding new requests
const MAX_ONEDEE_PENDING_REQUESTS = 0;

require('jquery');

const angular = require('angular');
const d3 = require('d3');
const map = require('./leaflet');
const L = require('leaflet');

// require('./threedi'); // threedi-client module

angular.module('threedi-client').service('leaflet', [
  '$rootScope',
  '$interpolate',
  'clientState',
  'socket',
  'modes',
  'state',
  'AnimatedLayer',
  'Layer',
  'LayerService',
  'UtilService',
  function (
    $rootScope,
    $interpolate,
    clientstate,
    socket,
    modes,
    state,
    AnimatedLayer,
    Layer,
    LayerService,
    UtilService
  ) {
    var info_marker = null;  // remember my info marker
    var lineMarker = null;  // remember my line marker
    var channel_clicked = false;  // remember if channel is clicked
    var channelElm = null;        // The clicked channel
    var scenario = {};
    var wms_ani_layer = null;
    var wms_ani_initialized = null;  // will be set to model_slug
    var backgroundLayer = null;
    var me = this;
    var use_server_extent_as_master = false;
    var draw_control_check = null;

    var INFOPOINT_BOX_TYPES = [
      'channel',              // deltares models
      'node',                 // obsolete
      'sewerage-weir',        // obsolete
      'sewerage-orifice',     // obsolete
      'sewerage-pumpstation', // obsolete
      'v2_pumpstation',
      'v2_weir',
      'v2_orifice',
      'v2_culvert',
      'v2_manhole',
      'v2_connection_nodes',
      'v2_node',
      'v2_rain_cloud',
      'v2_discharge',
      'v2_breach'
    ];

    // rainclouds and manholes that are received from the server.
    scenario.rainclouds = {};
    scenario.manholes = {};
    scenario.events = {};
    // temp rainclouds and manholes for quick user feedback.
    scenario.temp_objects = [];

    // set the initial default extent (world map)
    map.fitBounds([
        [clientstate.spatial.extent[0], clientstate.spatial.extent[1]],
        [clientstate.spatial.extent[2], clientstate.spatial.extent[3]]
    ]);

    // Placed a few animation things in leaflet, because they interact with
    // the map.

    /* shut down the animation layer so it can be used for another model */
    var animation_shutdown = function () {
      if ((wms_ani_layer !== null) && (wms_ani_layer !== undefined)) {
        console.log('shutting down existing wms ani layer');
        wms_ani_layer.shutdown();
      }
      wms_ani_initialized = null;
        // resetting the animations
      console.log('Onedee: update_onedee_layer after animation shutdown');
      update_onedee_layer('model_slug', 0, false);
    };

    // translate object type to box type
    var box_type = function (object_type) {
      return contains(INFOPOINT_BOX_TYPES, object_type)
            ? 'infopoint'
            : object_type;
    };

    /* onedee layers */
    var onedee_status = {
      busy_retrieving: false,
      wanted_onedee_timestep: 0,
        // keep track of requested timesteps
      requested_onedee_timestep: new Array(),  // new Set(),
      current_status_timestep: null,  // current data
      current_status: null,  // data
      onedee_in_map: false,
      layer_group: null  // if onedee_in_map == true, layer_group contains onedee layers group that is shown on map
    };

    var previousClick; // this is a checker because TileLayer adds layers in wrong order.
    var firstClick = true; // this is a checker because TileLayer adds layers in wrong order.

    var onedee_model_url = function () {
        // note: the classic 3Di models ignore the model name and version
      var result = onedee_url
            .replace('_model_name_', state.state.loaded_model)
            .replace('_model_version_', state.state.loaded_model_version);
      return result;
    };

    // look in clientstate.show_onedee if layer_name has to be shown
    var show_onedee_layer = function (layer_name) {
      if (!clientstate.show_onedee.hasOwnProperty(layer_name)) {
            // default
        return true;
      }
      return clientstate.show_onedee[layer_name];
    };

    /* All 1d objects in 1 layer: culvert, weir, pumpstation and orifice */
    clientstate.spatial.layers.createObjectLayer = function () {
        // used to filter only point objects.
      var point_objects = {
        'orifice': true,
        'culvert': true,
        'weir': true,
        'pumpstation': true,
        'sewerage-weir': true,
        'sewerage-orifice': true,
        'sewerage-pumpstation': true,
        'node': true,
        'v2_connection_nodes': true,
        'v2_manhole': true,
        'v2_node': true,
        'v2_pumpstation': true,
        'v2_breach': true,
        'v2_weir': true
      };
        // onedee_url must be created dynamically
      return {
        active: false,
        layer: new L.TileLayer.GeoJSON(

            onedee_model_url() + '.geojson?object_types=channel,pipe,pumpstation_line,node,weir,orifice,culvert,pumpstation,channel,v2_gui',

          {
            maxZoom: 20
                // enabling this function will enable creating a GeometryCollection,
                // which causes problems wh0200ile handling clicks. See if this works better in all cases.
                // unique: function (feature) {
                //     // sander_id by it self will NOT be unique
                //     return feature.properties.object_type + feature.properties.sander_id;
                // }
          },
          { // TODO: interpolate all of sander ids node_idx and hhtml classes
            pointToLayer: function (feature, latlng) {
              var html_classes;
              var icon;

                    // check if feature is being shown
              if (!show_onedee_layer(feature.properties.object_type)) {
                icon = new L.DivIcon({
                  className: '',
                  html: '<svg viewBox="0 0 0 0"></svg>'
                });
                return L.marker(latlng, {icon: icon});
              }

              if (feature.properties.object_type === 'orifice') {
                icon = new L.DivIcon({
                  className: '',
                            // svg path from images/culvert.svg (open with editor to see path)
                  html: UtilService.svgTemp('orifice', {
                    sanderId: feature.properties.sander_id,
                    htmlClasses: 'leaflet-marker-icon orifice-icon leaflet-zoom-animated leaflet-clickable'
                  })
                });
              } else if (feature.properties.object_type === 'culvert') {
                icon = new L.DivIcon({
                  className: '',
                            // svg path from images/culvert.svg (open with editor to see path)
                  html: UtilService.svgTemp('culvert', {
                    sanderId: feature.properties.sander_id,
                    htmlClasses: 'leaflet-marker-icon culvert-icon leaflet-zoom-animated leaflet-clickable'
                  })
                });
              } else if (feature.properties.object_type === 'weir') {
                html_classes = 'leaflet-marker-icon weir-icon leaflet-zoom-animated leaflet-clickable';
                icon = new L.DivIcon({
                  className: '',
                            // svg path from images/weir.svg (open with editor to see path)
                  html: require('./svg-icons/weir.html')
                });
              } else if (feature.properties.object_type === 'pumpstation') {
                if (feature.properties.capacity <= 20) {
                  html_classes = 'leaflet-marker-icon pumpstation-icon onedee-structure-icon leaflet-zoom-animated leaflet-clickable';
                } else {
                  html_classes = 'leaflet-marker-icon pumpstation-icon-big onedee-structure-icon leaflet-zoom-animated leaflet-clickable';
                }
                icon = new L.DivIcon({
                  className: '',
                            // svg paths from images/pump.svg (open with editor to see paths)
                  html: require('./svg-icons/pumpstation.html')
                });
              } else if (feature.properties.object_type === 'sewerage-weir') {
                        // it looks just like the 'other' weir, but behaves like a line
                html_classes = 'leaflet-marker-icon weir-icon leaflet-zoom-animated leaflet-clickable';
                icon = new L.DivIcon({
                  className: '',
                            // svg path from images/weir.svg (open with editor to see path)
                  html: require('./svg-icons/sewerage-weir.html')
                });
              } else if (feature.properties.object_type === 'sewerage-orifice') {
                html_classes = 'leaflet-marker-icon orifice-icon leaflet-zoom-animated leaflet-clickable';
                icon = new L.DivIcon({
                    className: '',
                            // svg path from images/culvert.svg (open with editor to see path)
                    html: require('./svg-icons/sewerage-orifice.html')
                  });
              } else if (feature.properties.object_type === 'sewerage-pumpstation') {
                  html_classes = 'leaflet-marker-icon pumpstation-icon onedee-structure-icon leaflet-zoom-animated leaflet-clickable';
                  icon = new L.DivIcon({
                    className: '',
                            // svg paths from images/pump.svg (open with editor to see paths)
                    html: require('./svg-icons/sewerage-pumpstation.html')
                  });
                } else if (feature.properties.object_type === 'node') {
                        // calculation node
                  html_classes = 'leaflet-marker-icon leaflet-zoom-animated leaflet-clickable';
                  icon;
                  if (feature.properties.nod_type === '1d') {
                            // 1d node
                      html_classes += ' node-icon';
                      if (feature.properties.nod_manhole_type !== undefined) {
                          switch (feature.properties.nod_manhole_type) {
                          case 0:
                            html_classes += ' node-manhole';
                            break;
                          case 1:
                            html_classes += ' node-outlet';
                            break;
                          case 2:
                            html_classes += ' node-pumpstation';
                            break;
                          }
                        }
                      if (feature.properties.nod_subtype !== undefined) {
                          if (feature.properties.nod_subtype === 'added') {
                            html_classes += ' node-added';
                          }
                        }
                      icon = new L.DivIcon({
                          className: '',
                                // svg path from images/weir.svg (open with editor to see path)
                          html: require('./svg-icons/node-circle.html')
                        });
                    } else if (feature.properties.nod_type === '1db') {
                            // 1d boundary node
                        html_classes += ' boundary-node-icon';
                        icon = new L.DivIcon({
                          className: '',
                                // svg path from images/weir.svg (open with editor to see path)
                          html: require('./svg-icons/boundary-node.html')
                        });
                      }
                } else if (feature.properties.object_type === 'v2_connection_nodes') {
                        // calculation node
                    html_classes = 'leaflet-marker-icon leaflet-zoom-animated leaflet-clickable';
                    html_classes += ' node-icon';
                    icon = new L.DivIcon({
                        className: '',
                        html: require('./svg-icons/connection-node.html')
                      });
                  } else if (feature.properties.object_type === 'v2_manhole') {
                        // calculation node
                      html_classes = 'leaflet-marker-icon leaflet-zoom-animated leaflet-clickable';
                      html_classes += ' node-icon node-manhole';
                      icon = new L.DivIcon({
                        className: '',
                        html: require('./svg-icons/v2-manhole.html')
                      });
                    } else if (feature.properties.object_type === 'v2_node') {
                        // calculation node
                      html_classes = 'leaflet-marker-icon leaflet-zoom-animated leaflet-clickable';
                      html_classes += ' node-icon node-added';
                      icon = new L.DivIcon({
                        className: '',
                        html: require('./svg-icons/v2-node.html')
                      });
                    } else if (feature.properties.object_type === 'v2_pumpstation') {
                      html_classes = 'leaflet-marker-icon pumpstation-icon onedee-structure-icon leaflet-zoom-animated leaflet-clickable';
                      icon = new L.DivIcon({
                        className: 'v2_pumpstation',
                            // svg paths from images/pump.svg (open with editor to see paths)
                        html: require('./svg-icons/v2-pumpstation.html')
                      });
                    } else if (feature.properties.object_type === 'v2_breach') {
                        // breach.
                        // TODO: new icon
                      html_classes = 'leaflet-marker-icon leaflet-zoom-animated leaflet-clickable';
                      html_classes += ' node-icon node-breach';
                      icon = new L.DivIcon({
                        className: '',
                        html: require('./svg-icons/v2-breach.html')
                      });
                    } else if (feature.properties.object_type === 'v2_weir') {
                      html_classes = 'leaflet-marker-icon weir-icon leaflet-zoom-animated leaflet-clickable';
                      icon = new L.DivIcon({
                        className: '',
                            // svg path from images/weir.svg (open with editor to see path)
                        html: require('./svg-icons/v2-weir.html')
                      });
                    } else {
                      console.log('feature object_type unknown: ', feature.properties.object_type);
                      console.log(feature);
                    }
              return L.marker(latlng, {icon: icon});
            },
            onEachFeature: function (feature, layer) {
                    // handle click on a feature.
                    // check if feature is being shown
              if (!show_onedee_layer(feature.properties.object_type)) {
                        // not shown -> no click handler
                return;
              }

                    // not handling clicking on lines here
              layer.on('click', function (e) {
                var thisClick = feature.properties.object_type;
                var node_idx = null;
                var status_url = null;
                        // redundancy for old methods of idx.
                if (feature.properties.hasOwnProperty('node_idx')) {
                            // in case of a normal node
                  node_idx = feature.properties.node_idx;
                } else if (feature.properties.hasOwnProperty('pump_idx')) {
                            // in case of a pumpstation
                            // TODO: check if this is correct, or do we have to add 1?
                  node_idx = feature.properties.pump_idx;
                            // actual idx!
                  status_url = data_url + '?REQUEST=getobjectdata&object_type=' + feature.properties.object_type + '&idx=' + (node_idx);
                } else if (feature.properties.hasOwnProperty('nod_idx1')) {
                  console.log('Warning: using nod_idx1 because there is no node_idx, re-run \'prepare tiles\'');
                  node_idx = feature.properties.nod_idx1;
                } else if (feature.properties.hasOwnProperty('line_idx')) {
                            // in some cases (v2_breach), a point refers to a line
                  node_idx = feature.properties.line_idx;
                } else if (feature.properties.hasOwnProperty('sander_id')) {
                  console.log('Warning: using sander_id because there is no node_idx, re-run \'prepare tiles\'');
                  node_idx = feature.properties.sander_id;
                }
                if (status_url === null) {
                            // note: by default (node_idx - 1) is given to the data_url!
                  status_url = data_url + '?REQUEST=getobjectdata&object_type=' + feature.properties.object_type + '&idx=' + (node_idx - 1);
                }

                if (previousClick != thisClick) {
                  if (firstClick) {
                    firstClick = false;
                  }
                  previousClick = thisClick;
                }
                if (state.master) {
                            // 'type' will be broadcasted and is unique per box type
                            // 'contenttype' is used optionally within a single controller, infopoint uses it a lot
                            // node / point
                  $rootScope.$broadcast('open_box', {
                                // orifice, weir, pumpstation, culvert, node
                                // sewerage-weir, sewerage-orifice
                    type: box_type(feature.properties.object_type),
                    contenttype: feature.properties.object_type,
                    point: feature.geometry,
                    properties: feature.properties,
                    status_url: status_url
                  });
                            // open_box will by itself broadcast content.type and
                            // here we can inject our own handler

                            // make bouncing icon
                  var feature_id = '#' + feature.properties.object_type + '-' + node_idx;
                            // select icon in d3 leaflet layer
                  d3.select(feature_id).classed('selected-icon', true);
                } else {
                  showalert('You need to be a Director to change object properties.', 'alert-danger');
                }
                previousClick = thisClick;
              });
            },  // onEachFeature
            filter: function (feature, layer) {
                    // let only point objects pass.
                    // v2_pumpstation, v2_weir: comes with flavors Point and
                    // as LineString.
              return (
                        (feature.properties.object_type in point_objects) &&
                        (feature.geometry.type === 'Point'));
            }
          }
          ) // end of monstrous Leaflet layer
      }; // end of objectLayer definition

    };

    // Add a fake GeoJSON line to coerce Leaflet into creating the <svg> tag that GeoJSONd3 needs
    new L.geoJson({
      'type': 'LineString',
      'coordinates': [[0, 0], [0, 0]]
    }).addTo(map);

    clientstate.spatial.layers.createChannelLayer = function (inverted) {
        // onedee_url must be created dynamically

      var classString = 'channel';
      if (inverted)
        classString += ' channel-inverted';
      var the_url = onedee_model_url()
            + '.geojson?object_types=channel,pipe,pumpstation_line,node,'
            + 'weir,orifice,culvert,pumpstation,channel,v2_gui';

        // note: one would want a click handler on each feature, just like in
        // createObjectsLayer. But how??
      return {
        active: false,
        layer: new L.TileLayer.GeoJSONd3(the_url, {
          class: classString,
          object_type: 'channel',
          maxZoom: 20,
          identifier: function (d) {
            if (d.properties.hasOwnProperty('line_idx')) {
                        // v2 lines
              return 'line-' + d.properties.line_idx;
            } else if (d.properties.hasOwnProperty('pump_idx')) {
                        // v2 pumpstation
                        // the name must be different than the v2_pumpstation point
              return 'v2_pumpstation-line-' + d.properties.pump_idx;
            } else {
                        // deltares stuff
              return 'channel-' + d.properties.sander_id;
            }
          }
        })
      }; // end of channelLayer definition
    };

    /* end 'onedee layers' */

    // When is LayerSwitch triggered by whom?
    $rootScope.$on('LayerSwitch', function (message, value) {
      L.tileLayer(value, {
        fadeAnimation: false,
        maxZoom: 20
      }).addTo(map);
    });

    var killOneDee = function () {
      animation_shutdown();
      removeDrawings();
      if (onedee_status.onedee_in_map === true) {
        console.log('remove onedee layers');
            // remove the moving dots and levees (if any)
        d3.selectAll('.channel').remove();
        d3.selectAll('.boundary-point').remove();
        d3.selectAll('.levee').remove();
        d3.selectAll('.background-channel').remove();

        map.removeLayer(clientstate.spatial.layers.oneDeeLayerGroup.layer);
        onedee_status.onedee_in_map = false;
        onedee_status.layer_group = null;
      }
    };

    function showLeveeLayer () {
      d3.selectAll('.v2_levee').classed('hide', false);
      d3.selectAll('.background-channel-v2_levee').classed('hide', false);
    }

    function hideLeveeLayer () {
      d3.selectAll('.v2_levee').classed('hide', true);
      d3.selectAll('.background-channel-v2_levee').classed('hide', true);
    }

    // One of the 'series' of onedee_status helpers.
    // Empty our onedee_status.requested_onedee_timestep and abort all requests
    var resetRequestedOnedee = function () {
      onedee_status.requested_onedee_timestep.forEach(
            function (cur_value, index, arr) {
                // onedee_status.requested_onedee_timestep.delete(value);
              onedee_status.requested_onedee_timestep[index].abort();
              delete onedee_status.requested_onedee_timestep[index];
            }
        );

    };

    /* TODO: This function reloads the geojson tiles and applies all the visual
    goodies. When loading a new model, this is what you want. However, when
    toggling a layer like 'breach locations', this function is also called. In
    that case you do not want to reload the geojson tiles.
    */
    var resetOneDee = function (message, inverted_color) {
      killOneDee();

        // if state.state === null don't do this. but Null is kind of a
        // weird bird in truthy falsy javascript.
      if (!Object.hasOwnProperty.call(state, 'state') || state.state === null)
        {
        return;
      }

        // determine if you need 1d or not
      var onedee_layers = [];
      if (state.state.has_onedee === '1') {
        var layers = clientstate.spatial.layers;
            // if (inverted_color) {
        onedee_layers = [
          layers.createChannelLayer(inverted_color).layer,
          layers.createObjectLayer().layer
        ];
      }
        // ///////////////////
        // Deltares levees //
      LayerService.structureLayers.clear();
      if (state.state.has_levee === '1') {
        var leveeLayer = new Layer('Levees', 'Vector', onedee_url + '.geojson?object_types=levee', {
          active: true,
          layerType: 'seperate',  // invented here. Other layers are (hopefully) subsets of the main geojson: 'embedded'.
          className: 'levee',
          objectType: 'levee'
        });

        LayerService.structureLayers.push(leveeLayer);
        LayerService.structureLayers['Levees'].add();  // add layer to map
      }

        // //////////////////////////
        // Flow levees + breaches //
        // //////////////////////////

      if (state.state.has_v2_levees === '1') {
        var leveeLayer = {
          active: clientstate.show_onedee.v2_levee,  // initial, for gui
          name: 'v2_levee',  // required in LayerService
          displayName: 'Levees',
          layerType: 'embedded',
          objectType: 'v2_levee'
        };
        LayerService.structureLayers.push(leveeLayer);
      }

      if (state.state.has_v2_breaches === '1') {
        var breachLayer = {
          active: clientstate.show_onedee.v2_breach,  // initial, for gui
          name: 'v2_breach',  // required in LayerService
          displayName: 'Breaches',
          layerType: 'embedded',
          objectType: 'v2_breach'
        };
        LayerService.structureLayers.push(breachLayer);
      }

      clientstate.spatial.layers.oneDeeLayerGroup = {
        active: false,
        layer: new L.LayerGroup(onedee_layers)
      };
        // set up / reset onedee_status
      resetRequestedOnedee();
      if (state.state.has_onedee === '1' || state.state.has_levee === '1') {
        map.addLayer(clientstate.spatial.layers.oneDeeLayerGroup.layer);
        onedee_status.onedee_in_map = true;
        onedee_status.layer_group = clientstate.spatial.layers.oneDeeLayerGroup.layer;
      }

      this.use_server_extent_as_master = true;  // make the master listen to the extent for one time.
    };

    var newModel = function (message, inverted_color) {
        // reset the data
      onedee_status.current_status = null;
        // set defaults for show_onedee
      clientstate.show_onedee.v2_breach = clientstate.show_onedee_default.v2_breach;
      clientstate.show_onedee.v2_levee = clientstate.show_onedee_default.v2_levee;
      clientstate.show_onedee.v2_pumpstation = clientstate.show_onedee_default.v2_pumpstation;
        // remove v1 levee layer if available
      if (LayerService.structureLayers.hasOwnProperty('Levees')) {
        LayerService.structureLayers['Levees'].remove();
        delete LayerService.structureLayers['Levees'];
      }
        // then update visuals
      resetOneDee(message, inverted_color);
    };

    $rootScope.$on('new-model', newModel);
    $rootScope.$on('killOneDee', killOneDee);
    $rootScope.$on('resetOneDee', resetOneDee);

    // WMS server url as specified in index.html
    this.wms_server_url = function () {
        // TODO: get the url in a prettier way.
      var $layer = $('.workspace-wms-layer');  // there is only one
      var url = $layer.attr('data-workspace-wms-url');
      return url;
    };

    /* !! Note: for now, makeOnedeeClickable & visibility for v2_levee */
    var makeOnedeeClickable = function () {
        // run this function when all onedee lines are loaded to add a click handler
      d3.selectAll('.clickable-channel').on('click', function (d, i) {
        var object_type = d.properties.object_type;
        var line_idx = d.properties.line_idx - 1;
        var status_url = data_url + '?REQUEST=getobjectdata&object_type=' + d.properties.object_type + '&idx=' + line_idx;
            // use data from status_url to possibly change d.properties, before
            // feeding it to open_box

            // Highlight a clicked channel
        if (channelElm !== null) {
          channelElm.classList.remove('clicked-channel');
        }
        channelElm = d3.event.target; // Note: d3.event.target === this
        channel_clicked = true;
        channelElm.classList.add('clicked-channel');

            // prevent default click handler
        clientstate.program_mode = modes.MODE_EXTERNAL;
            // now open the infopoint box
        $rootScope.$broadcast('open_box', {
          type: 'infopoint',
          contenttype: object_type,
          loaded_model: state.state.loaded_model,
          properties: d.properties,
          status_url: status_url
        });
      });

        // 'old' boundary point click
      d3.selectAll('.boundary-point').on('click', function (d) {
        clientstate.program_mode = modes.MODE_EXTERNAL;
        $rootScope.$broadcast('open_box', {
          type: 'infopoint',
                // mode: clientstate.scenario_event_defaults.onedee_info_mode,
          contenttype: 'channel',
          loaded_model: state.state.loaded_model,
          properties: {
            title: d.properties.code,
            flowlink_index: d.properties.link_number,
            flowelem_index: d.properties.node_a,
            condition: d.properties.condition
          }
        });
      });

      if (clientstate.show_onedee.v2_levee) {
        showLeveeLayer();
      } else {
        hideLeveeLayer();
      }
    };

    var retryMakeOnedeeClickable = function (layerToWatch, maxRetries) {
        // retry make onedee clickable, call when layer._tilesToLoad is not 0 yet.
      if (layerToWatch._tilesToLoad === 0) {
        makeOnedeeClickable();  // we want to do this after the check.
        return;
      } else if (maxRetries > 0) {
        makeOnedeeClickable();
        setTimeout(function () {
          retryMakeOnedeeClickable(layerToWatch, maxRetries - 1);
        }, 1000);
      } else {
        makeOnedeeClickable();
        console.log('Warning: not all lines may be clickable, but I\'ve given up hope.');
      }
    };

    var animationUpdate = function (message, cmd) {
        /*
        Master function to update the wms and onedee layers.

        Set timestep of animation value.timestep, value.model_slug

        cmd is optional, it can have the value 'reset'.
        */
      var timestep = parseInt(state.state.timestep);
      var timestep_calc = parseInt(state.state.timestep_calc);
      var loaded_model = state.state.loaded_model;
      var pumpstation = null;
      var force_update = false;

      if (!(wms_ani_initialized === loaded_model) ||
            (cmd === 'reset')) {

        if (wms_ani_initialized !== null) {
          animation_shutdown();
        }

        var url = me.wms_server_url();

            // Only call to a global function.
        if (state.state.has_twodee === '1') {
          console.log('Initializing animation layer...');
          wms_ani_layer = AnimatedLayer.animation_init(
                    state.state.loaded_model, url,
                    clientstate.scenario_event_defaults.wms_layer_depth
                    );
        } else {
          console.log('No animation layer.');
          wms_ani_layer = null;
        }
        wms_ani_initialized = state.state.loaded_model;
      }
      if (state.state.state === 'sim') {
        clientstate.scenario_event_defaults.wms_options['fast'] = 2;
      } else {
        clientstate.scenario_event_defaults.wms_options['fast'] = 1;
      }
      if (wms_ani_layer !== undefined && wms_ani_layer !== null) {
            // 3rd option is 'force': in case of a reset we want an explicit
            // update of the map layer.
        wms_ani_layer.setTimestep(
                timestep_calc,  // We can also take timestep
                clientstate.scenario_event_defaults.wms_options,
                cmd === 'reset');
      }
        // fetch onedee data
        // * In v1 models, there is an 'optimizing algorithm' in threedi-wms
        //   that require reloading the getquantity after seeing new lines/nodes
        // ** Normally in v2 models, only load new data when we're in a new
        //   timestep
        // update_onedee_layer also calls refresh_onedee_layer once after
        // loading, but retryRefreshOnedeeLayer + retryMakeOnedeeClickable are
        // more robust.
      if ((state.state.has_onedee === '1') && (
            (state.state.loaded_model_type === '3di') ||
            (onedee_status.current_status_timestep !== timestep_calc)
            )) {
            // we call this very often, but we only force updating when
            // the simulation has stopped
        force_update = state.state.state !== 'sim';
        update_onedee_layer(
                state.state.loaded_model, timestep_calc, force_update);
      }
        // apply onedee data to onedee layer
      if (state.state.has_onedee === '1') {
            // TODO: better do apply the click handler after 'load', but
            // strangly the DOM is not yet updated at that time
        if (clientstate.spatial.layers.oneDeeLayerGroup === undefined) {
          console.log('warning: oneDeeLayerGroup is undefined, skipping.');
          return;
        }
            // Not all geojson tiles may be loaded yet:
            // with retryMakeOnedeeClickable/retryRefreshOnedeeLayer the click
            // handler + visualization are applied until all geojsons are loaded.
        clientstate.spatial.layers.oneDeeLayerGroup.layer.eachLayer(function (layer) {
          retryMakeOnedeeClickable(layer, 5);
          retryRefreshOnedeeLayer(layer, 10);
        });

            // d3.selectAll('.v2_levee').classed('hide', true);
      }
    };

    $rootScope.$on('animation-update', animationUpdate);

    var update_onedee_pumpstation = function (pumpstation) {
        // All pumps are available as #pumpstation-<code>
      if (pumpstation === null) { return; }  // nothing to do
      if (pumpstation === undefined) { return; }  // nothing to do
      if (parseInt(state.state.timestep) === 0) { return;}
      for (var pump_id in pumpstation.is_active) {
            // pumpstation.id is something like pumpstation-1
        var pumpstation_id = '#' + pump_id;
        var speed_time = 0;
        if (pumpstation.is_active[pump_id]) {
          speed_time = 2; // one speed for active pumpstations
        }
        if (speed_time != 0) {
                // Using rotate-counter-clockwise class instead of rotate
                // because of the svg's pump blade direction. Looks nicer
                // counter clockwise.
          d3.select(pumpstation_id)
                    .classed('rotate-counter-clockwise', true)
                    .style('-webkit-animation-duration', speed_time + 's')
                    .style('-moz-animation-duration', speed_time + 's')
                    .style('animation-duration', speed_time + 's');
        } else {
                // speed == 0: remove rotate class
          d3.select(pumpstation_id)
                    .classed('rotate-counter-clockwise', false)
                    .style('-webkit-animation-duration', '0s')
                    .style('-moz-animation-duration', '0s')
                    .style('animation-duration', '0s');
        }
      }
    };

    var update_v2_pumpstation_cap = function (pumpstation) {
        // Update sewerage pumpstation capacities; cap=0 is also the case when
        // the pumpstation is disabled.
      var pumpstation_id;
      var pumpstation_line_id;

        // All pumps are available as #sewerage-pumpstation-<code>
      if (pumpstation === undefined) { return; }  // nothing to do
      if (parseInt(state.state.time_seconds) === 0) { return;}
      for (var idx in pumpstation) {
        pumpstation_line_id = '#v2_pumpstation-line-' + (parseInt(idx));
        pumpstation_id = '#v2_pumpstation-' + (parseInt(idx)) + ' path';

        var is_active = false;
        if (pumpstation[idx] > 0) {
          is_active = true;
        }

        d3.select(pumpstation_line_id)
                .classed('disabled-object', !is_active);
        d3.selectAll(pumpstation_id)
                .classed('disabled-object', !is_active);
      }
    };

    var update_v2_pumpstation = function (pumpstation) {
        // All pumps are available as #sewerage-pumpstation-<code>

        // this works, but it slows down the GUI considerably
        // if (pumpstation === undefined) { return; }  // nothing to do
        // if (parseInt(state.state.time_seconds) == 0) { return;}
        // for (var idx in pumpstation) {
        //     var pumpstation_id = '#sewerage-pumpstation-' + (parseInt(idx) + 1);

        //     var speed_time = 0;
        //     if (pumpstation[idx] > 0) {
        //           speed_time = 2; // one speed for active pumpstations
        //     }
        //     // Using rotate-counter-clockwise class instead of rotate
        //     // because of the svg's pump blade direction. Looks nicer
        //     // counter clockwise.
        //     d3.select(pumpstation_id)
        //         .classed('rotate-counter-clockwise', true)
        //         .style('-webkit-animation-duration', speed_time + 's')
        //         .style('-moz-animation-duration', speed_time + 's')
        //         .style('animation-duration', speed_time + 's');
        // }
    };

    var set_onedee_unorm = function (data) {
        /*
        expects the existence of data.data['unorm']
        */
        // draws given unorm data on the map
      var duration_sewerage = function (d) {
        if (data === null) {return '100000s';}
        var speed_time = 100000;
        var value = Math.abs(data.data['unorm'][d.properties.link_number]);
            // adjusted for sewerage
        if ((value > 0.01) && (value <= 0.02)) {
          speed_time = 1000;
        } else if ((value > 0.02) && (value <= 0.1)) {
          speed_time = 600;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 400;
        } else if ((value > 0.3) && (value <= 0.5)) {
          speed_time = 300;
        } else if ((value > 0.5) && (value <= 0.8)) {
          speed_time = 250;
        } else if ((value > 0.8) && (value <= 1.5)) {
          speed_time = 200;
        } else if ((value > 1.5)) {
          speed_time = 120;
        }
        return speed_time + 's';
      };
      var duration_v2 = function (d) {
        if (data === null) {return '100000s';}
        var speed_time = 100000;
        var value = Math.abs(data.data['unorm'][d.properties.line_idx]);
            // adjusted for sewerage
        if ((value > 0.01) && (value <= 0.02)) {
          speed_time = 1000;
        } else if ((value > 0.02) && (value <= 0.1)) {
          speed_time = 600;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 400;
        } else if ((value > 0.3) && (value <= 0.5)) {
          speed_time = 300;
        } else if ((value > 0.5) && (value <= 0.8)) {
          speed_time = 250;
        } else if ((value > 0.8) && (value <= 1.5)) {
          speed_time = 200;
        } else if ((value > 1.5)) {
          speed_time = 120;
        }
        return speed_time + 's';
      };
      var duration_default = function (d) {
        if (data === null) {return '100000s';}
        var speed_time = 100000;
        var value = Math.abs(data.data['unorm'][d.properties.link_number]);
        if ((value > 0.01) && (value <= 0.05)) {
          speed_time = 800;
        } else if ((value > 0.05) && (value <= 0.1)) {
          speed_time = 700;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 600;
        } else if ((value > 0.3) && (value <= 1)) {
          speed_time = 300;
        } else if ((value > 1.0) && (value <= 3.0)) {
          speed_time = 200;
        } else if ((value > 3)) {
          speed_time = 150;
        }
        return speed_time + 's';
      };
        // Twodee needs refactoring, a lot of copy paste
      var duration_twodee = function (d) {
        if (data === null) {return '100000s';}
        var speed_time = 100000;
        var value = Math.abs(data.data['unorm'][d.properties.line_number]);
        if ((value > 0.01) && (value <= 0.05)) {
          speed_time = 800;
        } else if ((value > 0.05) && (value <= 0.1)) {
          speed_time = 700;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 600;
        } else if ((value > 0.3) && (value <= 1)) {
          speed_time = 300;
        } else if ((value > 1.0) && (value <= 3.0)) {
          speed_time = 200;
        } else if ((value > 3)) {
          speed_time = 150;
        }
        return speed_time + 's';
      };
      var duration_sewerage_pump = function (d) {
        if (data === null) {return '100000s';}
            // this can occur between loading models.
            // if (data.data['sewerage_pumps'] === undefined) {return '100000s';}
        var speed_time = 100000;
        var value = Math.abs(data.data['sewerage_pumps'][d.properties.idx0]);
            // adjusted for sewerage
        if ((value > 0.01) && (value <= 0.02)) {
          speed_time = 1000;
        } else if ((value > 0.02) && (value <= 0.1)) {
          speed_time = 600;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 400;
        } else if ((value > 0.3) && (value <= 0.5)) {
          speed_time = 300;
        } else if ((value > 0.5) && (value <= 0.8)) {
          speed_time = 250;
        } else if ((value > 0.8) && (value <= 1.5)) {
          speed_time = 200;
        } else if ((value > 1.5)) {
          speed_time = 120;
        }
        return speed_time + 's';
      };
      var duration_v2_pumpstation = function (d) {
        if (d === null) {return '100000s';}
        if (d === undefined) {return '100000s';}
        if (d.properties === undefined) {return '100000s';}
            // this can occur between loading models.
            // if (data.data['sewerage_pumps'] === undefined) {return '100000s';}
        var speed_time = 100000;
            // for now, sewerage_pumps is the name that is given by flow_wms.
        var value = Math.abs(data.data['sewerage_pumps'][d.properties.pump_idx]);
            // adjusted for sewerage
        if ((value > 0.01) && (value <= 0.02)) {
          speed_time = 1000;
        } else if ((value > 0.02) && (value <= 0.1)) {
          speed_time = 600;
        } else if ((value > 0.1) && (value <= 0.3)) {
          speed_time = 400;
        } else if ((value > 0.3) && (value <= 0.5)) {
          speed_time = 300;
        } else if ((value > 0.5) && (value <= 0.8)) {
          speed_time = 250;
        } else if ((value > 0.8) && (value <= 1.5)) {
          speed_time = 200;
        } else if ((value > 1.5)) {
          speed_time = 120;
        }
        return speed_time + 's';
      };
      var direction = function (d) {
        if (data === null) {return 'moveitforward';}
        var value = data.data['unorm'][d.properties.link_number];
        if (value > 0) {
          return 'moveitbackwards';
        } else {
          return 'moveitforward';
        }
      };
      var direction_twodee = function (d) {
        if (data === null) {return 'moveitforward';}
        var value = data.data['unorm'][d.properties.line_number];
        if (value > 0) {
          return 'moveitbackwards';
        } else {
          return 'moveitforward';
        }
      };
      var direction_sewerage_pump = function (d) {
        if (data === null) {return 'moveitforward';}
        var value = data.data['sewerage_pumps'][d.properties.link_number];
        if (value > 0) {
          return 'moveitbackwards';
        } else {
          return 'moveitforward';
        }
      };
      var direction_v2 = function (d) {
        if (d === null) {return 'moveitforward';}
        if (d === undefined) {return 'moveitforward';}
        var value = data.data['unorm'][d.properties.line_idx];
        if (value > 0) {
          return 'moveitbackwards';
        } else {
          return 'moveitforward';
        }
      };
      var direction_v2_pumpstation = function (d) {
        if (d === null) {return 'moveitforward';}
        if (d === undefined) {return 'moveitforward';}
        var value = data.data['sewerage_pumps'][d.properties.pump_idx];
        if (value > 0) {
          return 'moveitbackwards';
        } else {
          return 'moveitforward';
        }
      };
        // all channel types are splitted and can have their own visualization
        // functions
        // d3.selectAll('.channel')
        //     .style('-webkit-animation-duration', duration_sewerage)
        //     .style('-moz-animation-duration', duration_sewerage)
        //     .style('animation-duration', duration_sewerage)
        //     .style('-webkit-animation-name', direction)
        //     .style('-moz-animation-name', direction)
        //     .style('animation-name', direction);

        // this can occur between loading models. it is not 100% fool proof,
        // but it looks like it prevents most of the errors
      if (data === null) {return;}
      if (data.data['unorm'] === undefined) {return;}

      var channel_transport = d3.selectAll('.channel-transport');
      var channel_mixed = d3.selectAll('.channel-mixed');
      var channel_dwa = d3.selectAll('.channel-dwa');
      var channel_rwa = d3.selectAll('.channel-rwa');
      var channel_weir = d3.selectAll('.channel-weir');
      var channel_orifice = d3.selectAll('.channel-orifice');
      var channel_default = d3.selectAll('.channel-default');
      var channel_pumpstation = d3.selectAll('.channel-pumpstation');
      var twodee_line = d3.selectAll('.twodee-line');

        // testing v2...
      var v2_pipe = d3.selectAll('.v2_pipe');
      var v2_orifice = d3.selectAll('.v2_orifice');
      var v2_weir = d3.selectAll('.v2_weir');
      var v2_culvert = d3.selectAll('.v2_culvert');
      var v2_channel = d3.selectAll('.v2_channel');
      var v2_pumpstation = d3.selectAll('.v2_pumpstation');

      if (v2_pipe[0].length > 0) {
        v2_pipe
                .style('-webkit-animation-duration', duration_v2)
                .style('-moz-animation-duration', duration_v2)
                .style('animation-duration', duration_v2)
                .style('-webkit-animation-name', direction_v2)
                .style('-moz-animation-name', direction_v2)
                .style('animation-name', direction_v2);
      }
      if (v2_orifice[0].length > 0) {
        v2_orifice
                .style('-webkit-animation-duration', duration_v2)
                .style('-moz-animation-duration', duration_v2)
                .style('animation-duration', duration_v2)
                .style('-webkit-animation-name', direction_v2)
                .style('-moz-animation-name', direction_v2)
                .style('animation-name', direction_v2);
      }
      if (v2_weir[0].length > 0) {
        v2_weir
                .style('-webkit-animation-duration', duration_v2)
                .style('-moz-animation-duration', duration_v2)
                .style('animation-duration', duration_v2)
                .style('-webkit-animation-name', direction_v2)
                .style('-moz-animation-name', direction_v2)
                .style('animation-name', direction_v2);
      }
      if (v2_culvert[0].length > 0) {
        v2_culvert
                .style('-webkit-animation-duration', duration_v2)
                .style('-moz-animation-duration', duration_v2)
                .style('animation-duration', duration_v2)
                .style('-webkit-animation-name', direction_v2)
                .style('-moz-animation-name', direction_v2)
                .style('animation-name', direction_v2);
      }
      if (v2_channel[0].length > 0) {
        v2_channel
                .style('-webkit-animation-duration', duration_v2)
                .style('-moz-animation-duration', duration_v2)
                .style('animation-duration', duration_v2)
                .style('-webkit-animation-name', direction_v2)
                .style('-moz-animation-name', direction_v2)
                .style('animation-name', direction_v2);
      }
      if (v2_pumpstation[0].length > 0) {
        v2_pumpstation
                .style('-webkit-animation-duration', duration_v2_pumpstation)
                .style('-moz-animation-duration', duration_v2_pumpstation)
                .style('animation-duration', duration_v2_pumpstation)
                .style('-webkit-animation-name', direction_v2_pumpstation)
                .style('-moz-animation-name', direction_v2_pumpstation)
                .style('animation-name', direction_v2_pumpstation);
      }
      if (channel_transport[0].length > 0) {
        channel_transport
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_mixed[0].length > 0) {
        channel_mixed
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_dwa[0].length > 0) {
        channel_dwa
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_rwa[0].length > 0) {
        channel_rwa
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_weir[0].length > 0) {
        channel_weir
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_orifice[0].length > 0) {
        channel_orifice
                .style('-webkit-animation-duration', duration_sewerage)
                .style('-moz-animation-duration', duration_sewerage)
                .style('animation-duration', duration_sewerage)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (channel_pumpstation[0].length > 0) {
        channel_pumpstation
                .style('-webkit-animation-duration', duration_sewerage_pump)
                .style('-moz-animation-duration', duration_sewerage_pump)
                .style('animation-duration', duration_sewerage_pump)
                .style('-webkit-animation-name', direction_sewerage_pump)
                .style('-moz-animation-name', direction_sewerage_pump)
                .style('animation-name', direction_sewerage_pump);
      }
      if (channel_default[0].length > 0) {
        channel_default
                .style('-webkit-animation-duration', duration_default)
                .style('-moz-animation-duration', duration_default)
                .style('animation-duration', duration_default)
                .style('-webkit-animation-name', direction)
                .style('-moz-animation-name', direction)
                .style('animation-name', direction);
      }
      if (twodee_line[0].length > 0) {
        twodee_line
                .style('-webkit-animation-duration', duration_twodee)
                .style('-moz-animation-duration', duration_twodee)
                .style('animation-duration', duration_twodee)
                .style('-webkit-animation-name', direction_twodee)
                .style('-moz-animation-name', direction_twodee)
                .style('animation-name', direction_twodee);
      }
    };

    var set_onedee_q = function (data) {
        /* expects the existence of data.data['q'] */
        // draws current q data on the map
      d3.selectAll('.channel-default')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segments identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.link_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.link_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.link_number]);
              var result = 3;  // 2
              if ((value > 0.1) && (value <= 0.7)) {
                result = 4;  // 3
              } else if ((value > 0.7) && (value <= 1.5)) {
                result = 5;  // 4
              } else if ((value > 1.5) && (value <= 3)) {
                result = 6;  // 5
              } else if (value > 3) {
                result = 7;  // 6
              }
              return result;
            });
        // adjusted for sewerage
      d3.selectAll('.channel-mixed')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segment identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.link_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.link_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.link_number]);
              var result = 3;
              if ((value > 0.005) && (value <= 0.01)) {
                result = 4.5;
              } else if ((value > 0.01) && (value <= 0.02)) {
                result = 5;
              } else if ((value > 0.02) && (value <= 0.05)) {
                result = 6;
              } else if ((value > 0.05) && (value <= 0.07)) {
                result = 7.5;
              } else if (value > 0.1) {
                result = 9;
              }
              return result;
            });
      d3.selectAll('.channel-rwa')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segment identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.link_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.link_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.link_number]);
              var result = 3;
              if ((value > 0.005) && (value <= 0.01)) {
                result = 4.5;
              } else if ((value > 0.01) && (value <= 0.02)) {
                result = 5;
              } else if ((value > 0.02) && (value <= 0.05)) {
                result = 6;
              } else if ((value > 0.05) && (value <= 0.07)) {
                result = 7.5;
              } else if (value > 0.1) {
                result = 9;
              }
              return result;
            });
      d3.selectAll('.channel-dwa')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segment identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.link_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.link_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.link_number]);
              var result = 3;
              if ((value > 0.0000) && (value <= 0.001)) {
                result = 5;
              } else if ((value > 0.001) && (value <= 0.002)) {
                result = 5.5;
              } else if ((value > 0.002) && (value <= 0.005)) {
                result = 6;
              } else if ((value > 0.005) && (value <= 0.007)) {
                result = 6.5;
              } else if (value > 0.01) {
                result = 7;
              }
              return result;
            });
      d3.selectAll('.channel-transport')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segment identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.link_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.link_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.link_number]);
              var result = 3;
              if ((value > 0.005) && (value <= 0.01)) {
                result = 4.5;
              } else if ((value > 0.01) && (value <= 0.02)) {
                result = 5;
              } else if ((value > 0.02) && (value <= 0.05)) {
                result = 6;
              } else if ((value > 0.05) && (value <= 0.07)) {
                result = 7.5;
              } else if (value > 0.1) {
                result = 9;
              }
              return result;
            });
        // copied from .channel-rwa
      d3.selectAll('.twodee-line')
            .style('stroke-width', function (d) {
                // Delatares 1D segment identifiers can have other names than
                // Guus segment identifiers, shall we make it consistent?
                // /////////////////////////////////////////////////////////////
                // TODO: d.properties.line_number
                //       vs.
                //       d.properties.line_idx??
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.line_number)
                {
                return 2;
              }
              var value = Math.abs(data.data['q'][d.properties.line_number]);
              var result = 3;
              if ((value > 0.0000) && (value <= 0.001)) {
                result = 5;
              } else if ((value > 0.001) && (value <= 0.002)) {
                result = 5.5;
              } else if ((value > 0.002) && (value <= 0.005)) {
                result = 6;
              } else if ((value > 0.005) && (value <= 0.007)) {
                result = 6.5;
              } else if (value > 0.01) {
                result = 7;
              }
              return result;
            });
        // v2 testing
      d3.selectAll('.v2_channel, .v2_pipe, .v2_culvert, .v2_orifice, .v2_weir')
            .style('stroke-width', function (d) {

              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.line_idx)
                {
                return 2;
              }

              var value = Math.abs(data.data['q'][d.properties.line_idx]);
              var result = 3;
              if ((value > 0.0000) && (value <= 0.001)) {
                result = 5;
              } else if ((value > 0.001) && (value <= 0.002)) {
                result = 5.5;
              } else if ((value > 0.002) && (value <= 0.005)) {
                result = 6;
              } else if ((value > 0.005) && (value <= 0.007)) {
                result = 6.5;
              } else if (value > 0.01) {
                result = 7;
              }
              return result;
            });
      d3.selectAll('.v2_pumpstation')
            .style('stroke-width', function (d) {
              if (contains([null, undefined], d)
                    || !data
                    || !data.data
                    || !data.data.q
                    || !d.properties.pump_idx)
                {
                return 2;
              }

              var value = Math.abs(data.data['q'][d.properties.pump_idx]);
              var result = 3;
              if ((value > 0.0000) && (value <= 0.001)) {
                result = 5;
              } else if ((value > 0.001) && (value <= 0.002)) {
                result = 5.5;
              } else if ((value > 0.002) && (value <= 0.005)) {
                result = 6;
              } else if ((value > 0.005) && (value <= 0.007)) {
                result = 6.5;
              } else if (value > 0.01) {
                result = 7;
              }
              return result;
            });
    };

    var update_flod_flou = function (flod_data, flou_data) {

      if (contains([flod_data, flou_data], undefined) ||
            contains([flod_data, flou_data], null)) {
        return;
      }

      var k,
        css_id_fg,
        css_id_bg,
        NOFLOW_CLASS_NAME = 'v2_noflow';

      d3.selectAll('.clickable-channel').classed(NOFLOW_CLASS_NAME, false);
      for (k in flod_data) {
        if (flod_data[k] === 0 && flou_data[k] === 0) {
          k = parseInt(k) + 1;
          css_id_fg = '#line-' + k;
          css_id_bg = '#background-line-' + k;
          d3.select(css_id_fg).classed(NOFLOW_CLASS_NAME, true);
          d3.select(css_id_bg).classed(NOFLOW_CLASS_NAME, true);
        }
      }
    };

    this.set_onedee_flod_flou_by_index = function (index_1_based, closed) {

      var index = index_1_based - 1,
        closed_num = closed ? 0 : 1,
        already_got_flod_flou_data,
        already_got_data = onedee_status.current_status &&
                               onedee_status.current_status.data;
      if (already_got_data) {
        already_got_flod_flou_data =
                onedee_status.current_status.data.flod !== undefined &&
                onedee_status.current_status.data.flou !== undefined;
      } else {
        already_got_flod_flou_data = false;
      }

      if (already_got_flod_flou_data) {
        onedee_status.current_status.data.flod[index] = closed_num;
        onedee_status.current_status.data.flou[index] = closed_num;
      } else {
            // All indices before the param 'index' will be open (=default),
            // all indices after that remain undefined: per saldo we have
            // enough information for direct feedback (i.e. without the need
            // for the serverState to be fed back from the server) for the
            // closed down segment.
        var i,
          flod_data = [],
          flou_data = [];
        for (i = 0; i < index; i++)
          flod_data[i] = flou_data[i] = 1;
        flod_data[index] = flou_data[index] = closed_num;
        if (!onedee_status.current_status) {
          onedee_status.current_status = {data: {}};
        } else if (!onedee_status.current_status.data) {
          onedee_status.current_status.data = {};
        }
        onedee_status.current_status.data.flod = flod_data;
        onedee_status.current_status.data.flou = flou_data;
      }
      update_flod_flou(onedee_status.current_status.data.flod,
                         onedee_status.current_status.data.flou);
    };

    var refresh_onedee_layer = function () {
        /* apply data to onedee layer */
      set_onedee_unorm(onedee_status.current_status);
      set_onedee_q(onedee_status.current_status);
      if (onedee_status.current_status !== null) {
        update_onedee_pumpstation(
                onedee_status.current_status.data.pumps);
        update_v2_pumpstation_cap(
                onedee_status.current_status.data.p1dq);
        update_v2_pumpstation(
                onedee_status.current_status.data.sewerage_pumps);
        update_flod_flou(onedee_status.current_status.data.flod,
                             onedee_status.current_status.data.flou);
      }
    };

    var retryRefreshOnedeeLayer = function (layerToWatch, maxRetries) {
      refresh_onedee_layer();
      if (maxRetries === undefined) {
        return;
      }
      if (maxRetries === 0) {
        console.log('I\'m tired of trying to refresh the onedee layer.');
        return;
      }
      if (layerToWatch._tilesToLoad > 0) {
        setTimeout(
                function () {retryRefreshOnedeeLayer(layerToWatch, maxRetries - 1);},
                1000);
      }
    };

    // determine Array size, from:
    // http://stackoverflow.com/questions/5223/length-of-a-javascript-object-that-is-associative-array
    Object.size = function (obj) {
      var size = 0, key;
      for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
      }
      return size;
    };

    var update_onedee_layer = function (model_slug, timestep, force) {
        /*
        get _data_ using getquantity and update GUI accordingly. the server serves
        the data from memory most of the time.

        model_slug: needed in getquantity url
        timestep: probably only needed in threedi-wms in 'fallback mode',
            requiring netcdf.
        force: even if the onedee_status is currently busy, update anyway.

        This function should do the following and has conditions:
        - Check if there are already onedee layers loading (max xxx)
        - May return without doing anything if already busy (unless force)
        - With force === true, getquantity is requested, ignoring
          MAX_ONEDEE_PENDING_REQUESTS. If the request is already in 'the queue',
          just return. If there are too many requests running, abort (all) old
          requests (for MAX_ONEDEE_PENDING_REQUESTS == 0 this works good).
        - If getquantity somehow crashes, remove item from
          requested_onedee_layer and update layer accordingly.

        - During a simulation the fn should be called with force === false
        - After a stop the fn should be called with force === true
        */
      var requested_onedee_timestep_size =
            Object.size(onedee_status.requested_onedee_timestep);

      if (debug_extra) {
        console.log('**** update_onedee_layer, force: ' + force);
      }

        /* See if we have to fetch data, then update */
      if (timestep === 0) {
            // reset
        d3.selectAll('.channel')
                .style('-webkit-animation-name', '')
                .style('-moz-animation-name', '')
                .style('animation-name', '');
        return;
      }
      if ((requested_onedee_timestep_size > MAX_ONEDEE_PENDING_REQUESTS) && (
            force === false)) {
        if (debug_extra) {
          console.log(
                    '**** return, already too much to do:' +
                    requested_onedee_timestep_size);
        }
        return;
      }
      if (timestep in onedee_status.requested_onedee_timestep) {
        if (debug_extra) {
          console.log(
                    '**** return, (forced) timestep already in queue: ' +
                    timestep);
        }
        return;
      }
        // already too much requests, but we got a forced call that we must obey
      if ((requested_onedee_timestep_size > MAX_ONEDEE_PENDING_REQUESTS) && (
            force === true)) {
        if (debug_extra) {
          console.log(
                    '**** resetting requested onedee calls, upcoming force.');
        }
        resetRequestedOnedee();
      }

      onedee_status.requested_onedee_timestep[timestep] = $.get(
            data_url + '?REQUEST=getquantity&LAYERS=' + model_slug + '&quantity=unorm,q,weirs,orifices,pumps,culverts,sewerage_pumps,p1dq,flou,flod&decimals=2&time=' + timestep,
            function (data) {
                // the data status
              onedee_status.current_status = data;
              if (debug_extra) {
                console.log(
                        '**** got timestep' + timestep +
                        ', replacing timestep:' +
                        onedee_status.current_status_timestep);
              }
              onedee_status.current_status_timestep = timestep;
                // remove the reqeusted_onedee_timestep registration
              delete onedee_status.requested_onedee_timestep[timestep];
                // update layout accordingly
              refresh_onedee_layer();
            } // function
        ).fail(function (data) {
                // {readyState: 0, status: 0, statusText: 'abort'} -> ignore
                // {readyState: 0, responseText: '', status: 0, statusText: 'error'} -> handle
          if (data.statusText === 'error') {
            console.log(
                        '**** error in request getquantity for timestep',
                        timestep);
            onedee_status.current_status = null;
            onedee_status.current_status_timestep = null;
          }
        }
        ).always(function () {
                // remove the reqeusted_onedee_timestep registration
          delete onedee_status.requested_onedee_timestep[timestep];
                // update layout accordingly
          refresh_onedee_layer();
        }
        );
    };

    // Guess size of extent in meters, biggest axis. For things relative sized
    // to the screen.
    var extentSize = function () {
      var bounds = map.getBounds();
        // 2 * pi * r / 360 = 111 km per degrees, approximately
      var size = Math.max(
            Math.abs(bounds._southWest.lat - bounds._northEast.lat),
            Math.abs(bounds._southWest.lng - bounds._northEast.lng)
            ) * 111000;
      return size;
    };

    var emitExtent = function () {
      var bounds = map.getBounds();
      var extent_list = [
        bounds._southWest.lat, bounds._southWest.lng,
        bounds._northEast.lat, bounds._northEast.lng
      ];
      socket.emit(
            'set_map_location', extent_list,
            function () {
              console.log('emit map location', extent_list);
            });
    };

    // Draw a line and remove existing line (if exists).
    var removeLineMarker = function () {
      if (lineMarker) {map.removeLayer(lineMarker);}
    };

    var drawLine = function (startpoint, endpoint) {

      var INTERSECT_TOOL_CLASS = 'intersect_tool';
      var pointList = [startpoint, endpoint];
      var firstpolyline = L.polyline(pointList);
      removeLineMarker();
      map.addLayer(firstpolyline);
      var pathString = firstpolyline.getPathString();
      var the_line = d3.select('path.leaflet-clickable[d="' + pathString + '"]');
      the_line.classed(INTERSECT_TOOL_CLASS, true);
      var ANIM_TIME = 400,
        MIN_WIDTH = 3,
        MAX_WIDTH = 8,
        MIN_OPA = 0.5,
        MAX_OPA = 1.0,
        CYCLE_COUNT = 2;

      var transition = function (the_line, count) {
        (function repeat () {
          if (count-- === 0)
            return;
          the_line
                    .transition()
                    .duration(ANIM_TIME)
                    .style({'stroke-width': MAX_WIDTH, 'stroke-opacity': MIN_OPA})
                    .transition()
                    .duration(ANIM_TIME)
                    .style({'stroke-width': MIN_WIDTH, 'stroke-opacity': MAX_OPA})
                    .each('end', repeat);
        })();
      };

      transition(the_line, CYCLE_COUNT);
      lineMarker = firstpolyline;  // Remember what we've added
    };

    var drawTemp = function (lat, lng, icon) {
      var marker = L.marker(
            [lat, lng],
            {icon: icon, opacity: 0.5});
      scenario.temp_objects.push(marker);
      map.addLayer(marker);
    };

    var drawTempRect = function (lat, lng, size_m, color) {
      var size = size_m / 135 / 1000;  // a guess of the size, then somewhat smaller
      var poly = [
            [lat - size * 0.6, lng + size],
            [lat - size * 0.6, lng - size],
            [lat + size * 0.6, lng - size],
            [lat + size * 0.6, lng + size]];
      console.log('draw temp poly');
      var marker = L.polygon(poly, {
        stroke: false, fillColor: color,
        fillOpacity: 0.5, clickable: false});
      scenario.temp_objects.push(marker);
      map.addLayer(marker);
    };

    var drawFirstClick = function (lat, lng, diameter, opacity, color) {
      console.log('drawFirstClick => lat lng diameter opacity color', lat,
                    lng, diameter, opacity, color);
      var CSS_CLASS = 'intersect_tool_first_click';
      var the_circle = L.circle([lat, lng], diameter, {fillOpacity: opacity});
      map.addLayer(the_circle);
      var ps = the_circle.getPathString();
      var the_circle_elem = d3.select('path.leaflet-clickable[d="'
                                        + ps + '"]');
      the_circle_elem.classed(CSS_CLASS, true);
      scenario.temp_objects.push(the_circle);
    };

    var drawRainCloudDiameter = function (lat, lng, diameter, opacity, color) {
      console.log('drawRainCloudDiameter => lat lng diameter opacity color',
                    lat, lng, diameter, opacity, color);
      var CSS_CLASS = 'rain_cloud_diameter';
      var the_circle = L.circle([lat, lng], diameter, {fillOpacity: opacity});
      map.addLayer(the_circle);
      var ps = the_circle.getPathString();
      var the_circle_elem = d3.select('path.leaflet-clickable[d="'
                              + ps + '"]');
      the_circle_elem.classed(CSS_CLASS, true);
      setTimeout(function () {
        the_circle_elem
                .transition()
                .duration(400)
                .style({'fill-opacity': 0});
        scenario.temp_objects.push(the_circle);
      }, 2000);
    };

    var clearTempObjects = function (optional_timeout) {
      var timeout = 5000;  // default
      if (optional_timeout !== undefined) {
        timeout = optional_timeout;
      }
      setTimeout(function () {
        requestAnimationFrame(function () {
          for (var i in scenario.temp_objects) {
            map.removeLayer(scenario.temp_objects[i]);
          }
          scenario.temp_objects = [];
        });
      }, timeout);
    };

    map.on('click', function (e) {
      handle_short_click(e);
    });

    var handle_short_click = function (e) {
        // Remove channel highlighting when clicked outside of channel
      if (channelElm !== null) {
        if (!channel_clicked) {
          channelElm.classList.remove('clicked-channel');
          channelElm = null;
        }
        channel_clicked = false;
      }

      console.log('handle short click');
      if (clientstate.program_mode === modes.MODE_NAVIGATE) {
        console.log('click in navigate mode');
            // Close any open box. Why doesn't this work right away?
            // $rootScope.$broadcast('close_box', '');
      } else if (clientstate.program_mode === modes.MODE_DISCHARGE) {
        var amount = getDefaultValue(
                clientstate.edit_ranges[modes.MODE_DISCHARGE].value,
                'discharge_amount');
        console.log('LA click in manhole/discharge mode: ',
                e.latlng.lng, e.latlng.lat,
                amount);
        var itype = parseInt(clientstate.edit_ranges['discharge_type'].value);
            // send data to server
        socket.emit('add_manhole', e.latlng.lng, e.latlng.lat,
                amount, itype,
                function () {
                  console.log('emit manhole/discharge placement');
                });
            // place temp manhole
        var iconFn = amount >= 0 ? dischargeIcon : manholeIcon;
        drawTemp(e.latlng.lat, e.latlng.lng, iconFn());

      } else if (clientstate.program_mode === modes.MODE_RAIN) {
        var rain_size = getDefaultValue(
                clientstate.edit_ranges['rain_size'].value,
                'rain_size');
        var rain_diameter = extentSize() * rain_size;
        var rain_duration = getDefaultValue(
                clientstate.edit_ranges['rain_duration'].value,
                'rain_duration');
        var rain_amount = getDefaultValue(
                clientstate.edit_ranges[modes.MODE_RAIN].value,
                'rain_amount');
        console.log('click in rain mode: ',
                e.latlng.lng, e.latlng.lat,
                rain_diameter,
                rain_amount,
                rain_duration * 3600);
        socket.emit('add_rain', e.latlng.lng, e.latlng.lat,
                rain_diameter, // 500.0,
                rain_amount,
                rain_duration * 3600, // hour -> seconds
                function () {
                  console.log('emit rain');
                });
            // place temp raincloud:
        drawTemp(e.latlng.lat, e.latlng.lng, raincloudIcon());
            // place temp circle, for indicating the diameter
        drawRainCloudDiameter(e.latlng.lat, e.latlng.lng, rain_diameter / 2,
                                  0.3);

      } else if (clientstate.program_mode === modes.MODE_FLOODFILL_ABSOLUTE ||
                   clientstate.program_mode === modes.MODE_FLOODFILL_RELATIVE) {
        var level;
        var mode;
        var source;

        mode = parseInt(clientstate.edit_ranges['flood_fill_mode'].value);
        if (mode === 0) {
          source = 'flood_fill_relative';
        } else {
          source = 'flood_fill_absolute';
        }
        level = getDefaultValue(clientstate.edit_ranges[source].value, source);

        console.log('LA: click in floodfill mode: ',
                e.latlng.lng, e.latlng.lat,
                source, level, mode);
            // send data to server

        socket.emit('flood_fill',
                        e.latlng.lng,
                        e.latlng.lat,
                        level,
                        mode,
                        function () {});
            // place temp icon
        drawTemp(e.latlng.lat, e.latlng.lng, floodfillIcon());
      }  else if (clientstate.program_mode === modes.MODE_EDIT) {
            // The actual edit function is activated with the polygon button.
      } else if (clientstate.program_mode === modes.MODE_INFO_POINT) {
        $rootScope.$broadcast('open_box', {
          type: 'infopoint',
          contenttype: 'map_info',
          point: e.latlng
        });
        if (info_marker !== null) {map.removeLayer(info_marker);}
        info_marker = L.marker(
                e.latlng,
                {icon: infoMarker(), bounceOnAdd: true}).addTo(map);
      } else if (clientstate.program_mode === modes.MODE_INFO_LINE) {
            /*
http://localhost:5000/3di/data?request=getprofile&layers=DelflandiPad&srs=EPSG%3A900913&line=LINESTRING+(487690.73298813+6804234.0094661%2C488588.86807036+6803985.5891242)&time=28

            */

        if (clientstate.first_click === null) {
          removeLineMarker();
          drawFirstClick(e.latlng.lat, e.latlng.lng, extentSize() * 0.002,
                               0.8);
          clientstate.first_click = e.latlng;
          showalert('Now click a second time to draw a line.');
          return;
        }

        $rootScope.$broadcast('open_box', {
          type: 'infoline',
          firstpoint: clientstate.first_click,
          endpoint: e.latlng,
          loaded_model: state.state.loaded_model,
          interpolate: clientstate.scenario_event_defaults.wms_options.interpolate
        });

        clearTempObjects(0);
        drawLine(clientstate.first_click, e.latlng);
        clientstate.first_click = null;

      } else if (clientstate.program_mode === modes.MODE_EXTERNAL) {
            // an external handler shows markes / popups / etc.
            // go back to modes.MODE_INFO_POINT silently
        clientstate.setMode(modes.MODE_INFO_POINT);
      } else {
        console.log('going back to default mode from: ' + clientstate.program_mode);
        clientstate.setMode(modes.MODE_INFO_POINT);
      }
    };

    /*
    when no value is supplied by manual input this function returns a default
    defined at clientstate.scenario_event_defaults
     */
    function getDefaultValue (current_value, name) {
      if (typeof current_value === 'undefined' || current_value === 'NaN') {
        return clientstate.scenario_event_defaults[name];
      } else {
        return current_value;
      }
    }

    this.updateDEMRequestURL = function () {
      var request_url = me.wms_server_url();
      var bounds = map.getBounds();
      var extent = [
        bounds._southWest.lng, bounds._southWest.lat,
        bounds._northEast.lng, bounds._northEast.lat
      ];
      request_url += '?SERVICE=WMS&REQUEST=GetInfo&VERSION=1.1.1&MESSAGES=true';
      request_url += '&SRS=EPSG%3A4326&WIDTH=256&HEIGHT=256';
      request_url += '&BBOX=' + extent[0] + ',' + extent[1] + ',' + extent[2] + ',' + extent[3];
      return request_url;
    };

    // Update DEM range, if DEM layer is enabled.
    // The ranges are updated 'smart', not too often and using a calculated granularity.
    this.updateDEMRange = function () {
      if ((this.foregroundLayer !== null) && (this.foregroundLayer.name === 'DEM')) {
        var request_url = me.updateDEMRequestURL();
        $.get(request_url, function (data) {
          var limits = data.limits;
          var orig_limits = clientstate.scenario_event_defaults.wms_limits;
          new_limit_low = Math.floor(data.limits[0]);
          new_limit_high = Math.floor(data.limits[1] + 1);
          if ((new_limit_low !== orig_limits[0]) || (new_limit_high !== orig_limits[1])) {
            need_change = true;
          }
          if (need_change) {
            console.log('Rescaling DEM to ' + new_limit_low + ' to ' + new_limit_high);
            clientstate.scenario_event_defaults.wms_limits = [new_limit_low, new_limit_high];
                    // hacking into existing L.tileLayer.wms...
            me.foregroundLayer.layer.wmsParams.limits = new_limit_low + ',' + new_limit_high;
            me.updatefgLayers(me.foregroundLayer, true);
          }

        });
      }
    };

    map.on('moveend', function (e) {
      if (state.master) {
        emitExtent();
      }
        // Update onedee elements when map is moved
        // with multiple machine architecture state can be empty so make
        // sure it is not null
      if (state.state !== null && state.state.has_onedee === '1') {
            // just do the whole stack of updates: more consistent, more robust
        animationUpdate('', '');
      }

      me.updateDEMRange();
    });

    // Draw all scenario event objects on map
    $rootScope.$on('scenario_events', function (message, scenario_events) {
      if (scenario_events.length === 0) {
        for (var unique_id in scenario.events) {
          map.removeLayer(scenario.events[unique_id].mapmarker);
          if (scenario.events[unique_id].mapmarker2 !== null) {
            map.removeLayer(scenario.events[unique_id].mapmarker2);
          }
        }
        scenario.events = {};
      } else {
        scenario_events.forEach(function (scenario_event) {
                // only show a marker once based on rain_cloud.unique_id
          if (!scenario.events.hasOwnProperty(scenario_event.unique_id)) {
                    // only draw a marker for non-ended items
                    // there are 2 time systems: timestep_start/end and sim_time_start/end
                    // preferred is sim_time_start/end,
                    // timestep may not be correct
            if ((((typeof scenario_event.sim_time_end === 'undefined') && (typeof scenario_event.timestep_start !== 'undefined')) ||
                          (scenario_event.sim_time_end === 'None') ||
                          (scenario_event.sim_time_end === null) ||
                          (parseInt(state.state.time_seconds) <= scenario_event.sim_time_end)
                        ) &&
                        (parseInt(state.state.time_seconds) >= scenario_event.sim_time_start)
                        ) {

              var map_marker = null;  // to be filled in
              var map_marker2 = null;  // raincloud has 2 markers
              if (scenario_event.hasOwnProperty('object_type')) {
                            // some events have 'object_type' instead of plain
                            // 'type' for easier object manipulation using
                            // 'change_object' in controller.py
                            // but nxt-box requires 'type'
                scenario_event.type = scenario_event.object_type;
              }

              if (scenario_event.type === 'raincloud') {
                var marker_color = 'red';
                if (scenario_event.amount > 20) {
                  marker_color = 'darkred';
                }
                map_marker = L.marker(
                                [scenario_event.wgs84_y, scenario_event.wgs84_x],
                                {icon: raincloudIcon(marker_color, scenario_event.unique_id),
                                 riseOnHover: true, bounceOnAdd: true});
                map_marker.on('click', function () {
                  if (state.master) {
                                    // Temporary show circle.
                    drawRainCloudDiameter(
                                        scenario_event.wgs84_y,
                                        scenario_event.wgs84_x,
                                        scenario_event.diameter / 2,
                                        0.3);

                                    // Box
                    var content = {
                      type: 'raincloud',
                      properties: scenario_event,
                      marker: map_marker
                    };
                    $rootScope.$broadcast('open_box', content);
                  }
                });
                map_marker2 = L.circle(
                                [scenario_event.wgs84_y, scenario_event.wgs84_x],
                                scenario_event.diameter / 2,
                                {color: '#8888ff', stroke: false,
                                fillOpacity: 0.3,
                                clickable: false} );
              } else if (scenario_event.type === 'manhole') {
                var marker_color = 'blue';
                if (scenario_event.amount > 100) {
                  marker_color = 'darkblue';
                }
                if (scenario_event.itype === 2) {
                                // groundwater: make it brown
                  marker_color = 'brown';
                }
                if (scenario_event.amount > 0) {
                  var marker_icon = dischargeIcon(marker_color, scenario_event.unique_id);
                } else {
                  var marker_icon = manholeIcon(marker_color);  // pump
                }
                map_marker = L.marker(
                                [scenario_event.wgs84_y, scenario_event.wgs84_x],
                                {icon: marker_icon,
                                 riseOnHover: true,
                                bounceOnAdd: true});
                map_marker.on('click', function (e) {
                  if (state.master) {
                    var content = {
                      type: 'manhole',
                      properties: scenario_event,
                      marker: e.target
                    };
                    $rootScope.$broadcast('open_box', content);
                  }
                });
              } else if (scenario_event.type === 'flood_fill') {
                console.log('scenario_event flood fill');
                var marker_color;
                var marker_icon;
                marker_color = 'darkblue';
                marker_icon = floodfillIcon(marker_color);
                map_marker = L.marker(
                                [parseFloat(scenario_event.wgs84_y), parseFloat(scenario_event.wgs84_x)],
                                {icon: marker_icon,
                                 riseOnHover: true,
                                bounceOnAdd: true});
                map_marker.on('click', function (e) {
                  if (state.master) {
                    var content = {
                        type: 'floodfill',
                        properties: scenario_event,
                        marker: e.target
                      };
                    $rootScope.$broadcast('open_box', content);
                  }
                });

              } else if (scenario_event.type === 'twodee-draw') {
                var color = 'blue';
                var display_name = '';
                switch (scenario_event.edit_mode) {
                case EDIT_modes.MODE_INFILTRATION:
                  color = 'darkred';
                  display_name = 'Infiltration';
                  break;
                case EDIT_modes.MODE_CROP_TYPE:
                  color = 'green';
                  display_name = 'Crop type';
                  break;
                case EDIT_modes.MODE_SOIL:
                  color = 'orange';
                  display_name = 'Soil';
                  break;
                case EDIT_modes.MODE_INTERCEPTION:
                  color = 'darkgreen';
                  display_name = 'Interception';
                  break;
                case EDIT_modes.MODE_BATHY:
                  color = 'red';
                  display_name = 'DEM';
                  break;
                default:
                  console.log('boooo!');
                }
                var marker_icon = editIcon(color);
                map_marker = L.marker(
                                [scenario_event.coordinates_wgs84[0][1], scenario_event.coordinates_wgs84[0][0]],
                                {icon: marker_icon,
                                 riseOnHover: true,
                                bounceOnAdd: true});
                map_marker.on('click', function (e) {
                  if (state.master) {
                      var geojson_obj = geojson_from_coords(scenario_event.coordinates_wgs84, color);
                      showGeoJson(geojson_obj, scenario_event.unique_id);
                    }
                });
                map_marker.on('mouseover', function (e) {
                  e.target.bindPopup(display_name + ': Click to display the polygon shape. Click on the shape to hide it again').openPopup();
                });
                map_marker.on('mouseout', function (e) {
                  e.target.closePopup();
                });
              } else if (scenario_event.type === 'area-wide-rain') {
                            // nothing to do
              } else if (scenario_event.type === 'sewerage-pumpstation') {
                            // set some classes: happens too soon!
                            // d3.selectAll('#sewerage-pumpstation-' + scenario_event.pump_id).classed('disabled-object', true);
                } else if (scenario_event.type === 'sewerage-pipe') {
                  } else if (scenario_event.type === 'sewerage-weir') {
                    } else if (scenario_event.type === 'node') {
                            // nothing to show
                      } else if (scenario_event.type === 'v2_node') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_channel') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_pumpstation') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_pipe') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_culvert') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_breach') {
                            // nothing to show
                        } else if (scenario_event.type === 'v2_rain_cloud') {
                          var marker_color = 'red';
                          if (scenario_event.data.amount > 20) {
                            marker_color = 'darkred';
                          }
                          map_marker = L.marker(
                                [scenario_event.data.wgs84_y, scenario_event.data.wgs84_x],
                                {icon: raincloudIcon(marker_color, scenario_event.unique_id),
                                 riseOnHover: true, bounceOnAdd: true});
                          map_marker.on('click', function () {
                            if (state.master) {
                                    // Temporary show circle.
                              drawRainCloudDiameter(
                                        scenario_event.data.wgs84_y,
                                        scenario_event.data.wgs84_x,
                                        scenario_event.data.diameter / 2,
                                        0.3);

                                    // Box
                                    // close_after_apply: the box is for this scenario event only
                                    // when clicking apply, the current box is not applicable anymore
                              var content = {
                                type: box_type(scenario_event.type),
                                contenttype: scenario_event.type,
                                properties: scenario_event,
                                marker: map_marker,
                                close_after_apply: true
                              };
                              $rootScope.$broadcast('open_box', content);
                            }
                          });
                          map_marker2 = L.circle(
                            [
                              scenario_event.data.wgs84_y,
                              scenario_event.data.wgs84_x
                            ],
                                scenario_event.data.diameter / 2,
                            {
                              color: '#8888ff',
                              stroke: false,
                              fillOpacity: 0.3,
                              clickable: false
                            }
                            );
                        } else if (scenario_event.type === 'v2_discharge') {
                          marker_color = scenario_event.data.amount > 20
                                ? 'darkblue'
                                : 'blue';
                          var lat_lng =
                            [
                              scenario_event.data.wgs84_y,
                              scenario_event.data.wgs84_x
                            ];
                          map_marker = L.marker(
                                lat_lng,
                            {
                              icon:
                                        dischargeIcon(marker_color, scenario_event.unique_id),
                              riseOnHover:
                                        true,
                              bounceOnAdd:
                                        true
                            }
                            );

                          map_marker.on('click', function () {
                            if (state.master) {
                                    // Temporary show circle:
                                    // close_after_apply: the box is for this scenario event only
                                    // when clicking apply, the current box is not applicable anymore
                              var content = {
                                type: box_type(scenario_event.type),
                                contenttype: scenario_event.type,
                                properties: scenario_event,
                                marker: map_marker,
                                close_after_apply: true
                              };
                              $rootScope.$broadcast('open_box', content);
                            }
                          });

                        } else if (scenario_event.type === 'v2_channel') {
                            // In this case, we do simply nothing....
                        } else if (scenario_event.type === 'v2_weir') {
                            // In this case, we do simply nothing....
                        } else if (scenario_event.type === 'wind') {
                            // In this case, we do simply nothing....
                        } else {
                          console.log('Error drawing scenario_event: type unknown [' + scenario_event.type + ']');
                        }
              if (map_marker !== null) {
                scenario.events[scenario_event.unique_id] = {
                  'mapmarker': map_marker,
                  'mapmarker2': null,  // map_marker2,
                  'properties': scenario_event
                };
                map.addLayer(map_marker);
              }
              if (map_marker2 !== null) {
                map.addLayer(map_marker2);
                scenario.temp_objects.push(map_marker2);
              }
            }
          } else {
                    // Remove an old scenario event.
            if ((scenario_event.sim_time_end !== null) &&
                        (state.state.time_seconds >= scenario_event.sim_time_end)) {

              if (scenario.events[scenario_event.unique_id] !== undefined) {
                map.removeLayer(scenario.events[scenario_event.unique_id].mapmarker);
                if (scenario.events[scenario_event.unique_id].mapmarker2 !== null) {
                  map.removeLayer(scenario.events[scenario_event.unique_id].mapmarker2);
                }
              }
            }
          }
        });
      }
        // Remove temp objects: the server must have picked them up.
      clearTempObjects();
    });

    $rootScope.$on('serverState', function () {
      if (state.state.player === undefined) {
        // we are probably in the wait-load-model state, do nothing
        return;
      }
      if (((!state.master) && (state.state.player.extent)) ||
        (this.use_server_extent_as_master && state.state.state === 'wait')) {
        this.use_server_extent_as_master = false;
        clientstate.spatial.extent = JSON.parse(state.state.player.extent); // event comes in as string
          // for some reason this neeeeeds to happen here.
        map.fitBounds([
            [clientstate.spatial.extent[0], clientstate.spatial.extent[1]],
            [clientstate.spatial.extent[2], clientstate.spatial.extent[3]]]);
      }
    });

    // initial background layer
    const backgroundLayerDefaultIndex = 0;
    var funcBackgroundLayer = clientstate.backgroundLayers[backgroundLayerDefaultIndex].layer;
    map.addLayer(funcBackgroundLayer);

    backgroundLayer = funcBackgroundLayer;
    this.foregroundLayer = null;

    this.updatebgLayers = function (newBackgroundLayer, onedee_inverted) {
      if (backgroundLayer !== newBackgroundLayer) {
        map.removeLayer(backgroundLayer);
        backgroundLayer = newBackgroundLayer;
        map.addLayer(backgroundLayer, true);
        backgroundLayer.bringToBack();
        $rootScope.$broadcast('resetOneDee', onedee_inverted);
        $rootScope.$broadcast('animation-update');  // let everything move again
      }
    };

    // layer is the new layer, or undefined (then the current layer is disabled again)
    this.updatefgLayers = function (layer, force_update) {
      if (this.foregroundLayer !== null &&
            map.hasLayer(this.foregroundLayer.layer)) {
        if (this.foregroundLayer.type === 'twodee-links') {
                // 2d layer needs to be removed this way
          d3.selectAll('.twodee-line').remove();
          d3.selectAll('.twodee-line-bg').remove();
        }
        map.removeLayer(this.foregroundLayer.layer);
        this.foregroundLayer = null;
      }
      if ((this.foregroundLayer != layer || force_update === true) &&
            (layer !== undefined)) {
        this.foregroundLayer = layer;
        map.addLayer(this.foregroundLayer.layer, false);
        this.foregroundLayer.layer.bringToFront();
      }
    };

    this.removeInfoMarker = function () {
      if (info_marker !== null) {
        map.removeLayer(info_marker);
        info_marker = null;
      }
    };

    this.removeLineMarker = function () {
      if (lineMarker !== null) {
        map.removeLayer(lineMarker);
        lineMarker = null;
      }
    };

    // Remove channel highlight when info box is closed
    // (gets called in threedi-boxes.js)
    this.removeChannelMarker = function () {
      if (channelElm !== null && channel_clicked === false) {
        channelElm.classList.remove('clicked-channel');
        channel_clicked = false;
        channelElm = null;
      }
    };

    this.onedee_status = onedee_status;  // make it visible for outsiders

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    require('leaflet-draw')
    var drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
            // position: 'topleft',
        polyline: false,
        polygon: {
          title: 'Draw a sexy polygon!',
          allowIntersection: false,
          drawError: {
            color: '#b00b00',
            timeout: 1000
          },
          shapeOptions: {
            color: '#bada55'
          },
          showArea: true
        },
        circle: false,
        rectangle: false,
            // polyline: {
            //     metric: true,
            //     shapeOptions: {
            //         weight: 10
            //     }
            // },
            // circle: {
            //     shapeOptions: {
            //         color: 'red'
            //     }
            // },
        marker: false
      },
      edit: false
        // edit: {
        //     featureGroup: drawnItems
        // }
    });

    // Add and remove DrawControl menu when layer is selected/unselected
    this.toggle_layer_edit = function (edit_polygon) {
      if (edit_polygon === true) {
        if (draw_control_check === null) {
          draw_control_check = map.addControl(drawControl);
        }
      } else {
        if (draw_control_check !== null) {
          map.removeControl(drawControl);
          draw_control_check = null;
        }
      }
    };

    function geojson_from_coords (coords, color, geo_type) {
      geo_type = typeof geo_type !== 'undefined' ? geo_type : 'Polygon';
      return  {
        'type':'Feature',
        'properties':{
          'style': {
            'color': color,
            'weight': 3,
            'opacity': 1
          }
        },
        'geometry':{
          'type': geo_type,
          'coordinates': [coords]
        }
      };
    }

    var xisting_ids = {};
    function showGeoJson (geojsonObject, unique_id) {
      draw_layer = L.geoJson(undefined, {
        style: function (feature) {
          return feature.properties.style;
        },
        onEachFeature: onEachFeature
      });
      if (unique_id in xisting_ids) {
        drawnItems.removeLayer(xisting_ids[unique_id]);
      }
      draw_layer.addData(geojsonObject);
      xisting_ids[unique_id] = draw_layer._leaflet_id;
      drawnItems.addLayer(draw_layer);
    }

    function onEachFeature (feature, layer) {
      layer.on('click', function clear_polygon () {
        map.removeLayer(layer);
      });
    }

    // checks if an javascript 'dict' has key/values pairs
    function isEmpty (ob) {
      for (var i in ob) {
        return false;
      }
      return true;
    }

    // can be called to remove all drawings at once
    var removeDrawings = function () {
      if (!isEmpty(xisting_ids)) {
        drawnItems.clearLayers();
      }
    };

    // Triggered when new vector has been drawn.
    map.on('draw:created', function (e) {
      var type = e.layerType,
        layer = e.layer;

      if (type === 'polyline' || type === 'polygon') {
        var layer_str = JSON.stringify(layer.toGeoJSON());
        console.log(type + ' object: ');
        console.log(layer_str);

            // TODO: use correct variables & values
        var edit_mode = clientstate.edit_mode;
        var draw_value = 0;
        switch (edit_mode) {
        case EDIT_modes.MODE_CROP_TYPE:
          draw_value = clientstate.edit_ranges['edit_crop_type'].value;
          console.log('crop type');
          break;
        case EDIT_modes.MODE_SOIL:
          draw_value = clientstate.edit_ranges['edit_soil'].value;
          console.log('soil');
          break;
        case EDIT_modes.MODE_INFILTRATION:
          draw_value = clientstate.edit_ranges['edit_infiltration'].value;
          console.log('infiltration');
          break;
        case EDIT_modes.MODE_INTERCEPTION:
          draw_value = clientstate.edit_ranges['edit_interception'].value;
          console.log('interception');
          break;
        case EDIT_modes.MODE_BATHY:
                    // bathy is -dps ! We are actually drawing the dps.
          draw_value = -clientstate.edit_ranges['edit_bathy'].value;
          console.log('bathy');
          break;
        }
        var line_width = 0;

        socket.emit('draw', layer_str, edit_mode, draw_value, line_width, function () {
          console.log('draw geometry type: ' + type);
          console.log('edit mode: ' + edit_mode);
        });
      }

        // drawnItems.addLayer(layer); // according to example code
                                       // need to use this to enable editing with menu
      map.addLayer(layer);    // items not editable anymore because not added to
                                // drawnItems featuregroup
      scenario.temp_objects.push(layer);
    });
  }]);
