/*
 * Support for animations
 * Animated layer: keep track of an animated wms.
*/

const map = require('./leaflet').map;
require('./lib/leaflet-plugins/TileLayer.WMS.incrementalSingleTile');

angular.module('threedi-client')
  .factory('AnimatedLayer', [function () {
    var startedLoading,
      name,
      options,
      current_timestep;
    var current_in_map = {};  // indices if layers that are in OL.map
    var to_delete_from_map = null;
    var readyForNext = null;  // This is the layer that should be shown after stopping simulation
    var startedLoading = Date.now();  // date that the last layer started loading; for timeout construction.
    var current_anim_frame = 0;  // testing

    var max_timesteps = -1;

    var min_time_between_loads = 0; // testing with max update rate

    var layers = {}; // it will automatically be updated by setTimestep when needed
    var last_layer_options = null;
    var last_loaded_timestep = null; // timestep last loaded layer; is passed to a controller
    var last_requested_timestep = null;

    /* We're using this key to determine if a specific layer is already on the
    map (current_in_map). Previously it contained only the timestep, but now we
    take the extra_options in account, so option changes also trigger a refresh.
    */
    var layerKey = function (timestep, extra_options) {
      return JSON.stringify([timestep, extra_options]);
    };

    var layerFromTs = function (timestep, extra_options) {
      // extra_options is a hashmap {option: value, ...}
      // Create layer from given timestep.
      var me = this;
      this.options.time = timestep;

      // apply extra_options to options
      if ((extra_options !== undefined) && (extra_options !== null)) {
        for (key in extra_options) {
          this.options[key] = extra_options[key];
        }
          // console.log('Ani wms with extras: ', this.options);
      }

      // Normal wms layer with tiles
      // var layer = new L.TileLayer.WMS(
      //     this.url,
      //     this.options);

      // testing with single tile layer
      var layer = new L.tileLayer.wmsIncrementalSingleTile(
          this.url, this.options);

      layer.on('loading', function (e) {
          // for debugging
          // console.log('start loading layer ', this.options.time);
        me.most_recent_loading = timestep;
        last_requested_timestep = timestep;  // for outside monitoring
          // this.time_start_loading = Date.now();
      });

      layer.on('load', function (e) {
        last_loaded_timestep = this.options.time;

        this.setOpacity(0.8);
        var this_layer = this;

          // Flag set to check if layer is actually on the map
        var currentLayerKey = layerKey(this.options.time, this.extra_options);
        var is_in_map = currentLayerKey in me.current_in_map;
        var layer_extra_options = this.extra_options;

          // remove existing layers which are currently on the map
        if (is_in_map) {
          for (var currentMapKey in me.current_in_map) {
                // Remove layers other than the current one,
                // to prevent (temporary) vanishing layers
                // It is sometimes (temporary) possible that an extra layer is
                // visible that should not be there.
            layer = me.current_in_map[currentMapKey];
            if (currentMapKey !== currentLayerKey)
                {
              map.removeLayer(layer);
              delete me.current_in_map[currentMapKey];
            }
                // raise marker above anything, not necessary?
                // TODO L
                // map.raiseLayer(markers, map.layers.length);
          }
        } else {
              // console.log("Not removing layers, bacause is_in_map = ", is_in_map);
              // the layer is not yet loaded, so do not remove old layers yet
              // below: try to load this layer using readyForNext
        }

        var nextKey = me.readyForNext;
        setTimeout(function () {
          requestAnimationFrame(function () {
            me.readyForNext = null;
            if ((nextKey !== null) && !(is_in_map)) {
              var parsedLayerKey = JSON.parse(nextKey);
              me.setTimestep(parseInt(parsedLayerKey[0]), parsedLayerKey[1]);
            }
          });
        }, 50);
        if (debug_extra) {
          delta_time = Date.now() - me.startedLoading;
          fps = Math.round((1000 / delta_time) * 10) / 10;
          console.log('Frame took ' + delta_time + ' ms; ' + fps + ' fps');
        }
        me.last_loaded_layer_dt = Date.now();
      });

      // add extra_options for later retrieval
      layer.extra_options = extra_options;

      return layer;
    };

    var equalHashMaps = function (h1, h2) {
      // since h1 === h2 doesn't work, we'll have to write a function for it

      // do not let it crash and return false: we assume h1 and h2 are
      // hashmaps most of the time.
      if ((h1 === null) || (h2 === null) || (h1 === undefined) || (h2 === undefined)) return false;
      for (var i in h1) {
        if (h1[i] !== h2[i]) return false;
      }
      for (var i in h2) {
        if (h1[i] !== h2[i]) return false;
      }
      return true;
    };

    var setTimestep = function (timestep, extra_options, force) {
      if (isNaN(timestep)) {
        return;
      }
        // 5 seconds timeout
      var now = Date.now();
      var currentLayerKey = layerKey(timestep, extra_options);
      if ((this.readyForNext !== null) && (now < this.startedLoading + 5000)) {
        if (debug_extra) { console.log('not ready for next timestep... still busy ', timestep); }
            // is the first next thing
            // Can be overwritten, which is ok.
        this.readyForNext = currentLayerKey;
        return;
      }
      if (now < this.startedLoading + this.min_time_between_loads) {
            // The client is too fast, park timestep for later.
        console.log('Client too fast.. wait', (now - (this.startedLoading + this.min_time_between_loads)));
        return;
      }
      this.current_timestep = timestep;
      if (timestep < 0) { return; }

      if ((this.current_in_map[currentLayerKey] === undefined) || (force)) {
            // new layer
            // for debugging
            // console.log('adding to map ', ts);
        this.startedLoading = Date.now();
        var new_layer = this.layerFromTs(timestep, extra_options);
        // map.addLayer(new_layer); // TODO: turn on
        this.current_in_map[currentLayerKey] = new_layer;
        this.readyForNext = currentLayerKey;
      }
        // if (debug){ console.log('current_in_map', this.current_in_map);

    };

    var animated_layer = function (options) {
      name = options.name;
      url = options.url;
      options = options.options;
      current_timestep = 0;  // to be altered from outside
      return {
        options: options,
        name: name,
        url: url,
        layerFromTs: layerFromTs,
        setTimestep: setTimestep,
        startedLoading: startedLoading,
        current_in_map: current_in_map,
        to_delete_from_map: to_delete_from_map,
        readyForNext: readyForNext,
        max_timesteps: max_timesteps,
        min_time_between_loads: min_time_between_loads,
        layers: layers,
        layerName: function (timestep) {
          return name + ' (' + timestep + ')';
        },
        updateMap: function () {
          // update visible layer
          // add/remove layers
          if (debug) {
            console.log('updating map');
          }
        },
        shutdown: function () {
          // make sure to remove all objects that are in memory/OL
          if (debug) {
            console.log('ani layer shutting down...');
          }
          for (ts in this.current_in_map) {
            if (debug) {
              console.log('removing layer ', this.current_in_map[ts].options.time);
            }
            map.removeLayer(this.current_in_map[ts]);
          }
          this.current_in_map = {};
          this.current_visible = null;
        },
      };
    };
    /* Initialize animation object. We must provide model_slug to correctly
     calculate the complete wms url. Optionally give wms_layer_depth,
     which can be depth or velocity */
    var animation_init = function (model_slug, url, wms_layer_depth) {
      console.log('initialize new model wms ani');
      if (model_slug === undefined) {
        console.log('no animation to be initialized');
        return;
      }

      if (wms_layer_depth === undefined) {
        wms_layer_depth = 'depth';
      }
      /*
      http://localhost:5000/wms?request=getinfo&dataset=/home/user/git/nens/threedi-server/threedi_server/../var/data/subgrid_map.nc&srs=epsg:3857 */

      // this is confusing: options for the wms itself AND the settings for
      // creating the leaflet layer are in here. The settings for leaflet is
      // "caught" and the rest is passed through.
      var options = {
        layers: model_slug + ':' + wms_layer_depth,
        messages: 'true',
        format: 'image/png',
        transparent: true,
        nocache: 'yes',
        fadeAnimation: false,
          // detectRetina: true,
        fast: 1.4,
        opacity: 0.0,
        maxZoom: 20,   // leaflet option
      };

      var ani_layer = animated_layer({
        name: name,
        url: url,
        options: options,
      });

      return ani_layer;
    };

    return {
      animation_init: animation_init,
      last_loaded_timestep: function () { return last_loaded_timestep; },
      get_last_requested_timestep: function () { return last_requested_timestep; },
    };
  }]);
