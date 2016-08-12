/**
 *
 * State service keeps watch over the state.
 * Is able to manipulate it.
 * And returns the values
 * that are needed in all the right places.
 */

const $ = require('jquery');

const map = require('../leaflet').map;
const showalert = require('../showalert');
const leaflet = L; // should always be global require('leaflet');


angular.module('global-state').service('clientState', ['modes', function (modes) {
  var state = {};

  /**
   * Watchable string version of the state
   * @param {string} stateStr - which part of the state you want
   * @returns {string} - property or json dict
   */
  state.toString = function (stateStr) {
    return function () {
      var property = state;
      angular.forEach(stateStr.split('.'), function (accessor) {
        if (property) {
          property = property[accessor];
        }
      });

      if (typeof property === 'string') {
        return property;
      } else {
        return JSON.stringify(property);
      }
    };
  };

  var _backgroundLayers = [];
  _backgroundLayers = _backgroundLayers.concat(window.backgroundLayers);

  _backgroundLayers.map(function (bgLayer) {
    if (!(bgLayer.layer instanceof leaflet.Class)) {
      switch (bgLayer.layer_type) {
      case 'TMS':
        bgLayer.layer = leaflet.tileLayer(bgLayer.layer, bgLayer.layer_options);
        break;
      case 'WMS':
        bgLayer.layer = leaflet.tileLayer.wms(bgLayer.layer, bgLayer.layer_options);
        break;
      default:
        break;
      }
    }
  });

  state.backgroundLayers = _backgroundLayers;

  state.modelExtent = [
    [window.model_extent[0], window.model_extent[1]],
    [window.model_extent[2], window.model_extent[3]]
  ];

  var Spatial = function () {
    this.defaultExtent = function () {
      return state.modelExtent;
    };

    var extent = this.defaultExtent();

    Object.defineProperty(this, 'extent', {
      get: function () {
        return extent;
      },
      set: function (value) {
        if (value === null) {
          extent = this.defaultExtent();
        } else {
          extent = value;
        }
      }
    });

    this.resetExtent = function () {
      extent = this.defaultExtent();
    };


    // this is about to move to layerservice stuff
    this.layers = {};

    this.removeLayer = function (name) {
      map.removeLayer(this.layers[name].layer);
    };
  };

  state.spatial = new Spatial();

  state.makeSure = function () {
    state.modal.setTemplate('make_sure', true);
  };

  state.makeSureLogOut = function () {
    state.modal.setTemplate('make_sure_log_out', true);
  };

  state.modal = {
    active: true,
    templateName: 'landing' // default
  };

  /**
   * Switch modal template
   * @param {string} templateName - name of template
   * @param {boolean} active - whether active or not
   * @returns {void}
   */
  state.modal.setTemplate = function (templateName, active) {
    state.modal.templateName = templateName;
    state.modal.active = active;
  };

  angular.extend(state, {

   // ABOUT edit_ranges
   // current value, min, max for slider. partly going to replace scenario_event_defaults?
   // these match a program_mode, they are the most important setting for that program mode

    // all available features, see doc 'features controller voor GUI'
    features: null,

    program_mode: modes.MODE_INFO_POINT,
    edit_mode: modes.EDIT_MODE_DEFAULT,
    info_startingpoint: 0, // index for infopoint graphics array
    first_click: null,  // testing for infoline
    random: 0,  // for manually triggering some watches
    edit_ranges: {
      'rain': {
        min: 0,
        max: 200,
        value: 20,
        unit: 'mm/h',
        name: 'intensity',
        decimals: 1
      },
      'discharge': {
        min: -100,
        max: 500,
        value: 50,
        unit: 'm3/s',
        name: 'Q',
        decimals: 2
      },
      'flood_fill_absolute': {
        min: -5,
        max: 5,
        value: 0,
        unit: 'm MSL',
        name: 'absolute',
        decimals: 2
      },
      'flood_fill_mode': {
        // 0 is relative, 1 is absolute.
        value: 1,
        unit: '',
        name: 'flood fill mode',
        decimals: 0
      },
      'flood_fill_relative': {
        min: 0,
        max: 15,
        value: 1,
        unit: 'm',
        name: 'relative',
        decimals: 2
      },
      'edit_bathy': {
        min: -10,
        max: 10,
        value: -3,
        unit: 'm',
        name: 'dem height',
        decimals: 1,
        edit_mode: 'edit_bathy'
      },
      'edit_infiltration': {
        min: 0,
        max: 500,
        value: 480,
        unit: 'mm/day',
        name: 'infiltration',
        decimals: -1,
        edit_mode: 'edit_infiltration'
      },
      'edit_interception': {
        min: 0,
        max: 0.05,
        value: 0.05,
        unit: 'm',
        name: 'interception',
        decimals: 2,
        edit_mode: 'edit_interception'
      },
      'edit_friction': {
        min: 0,
        max: 1,
        value: 0.5,
        unit: '?',
        name: 'friction',
        decimals: 1,
        edit_mode: 'edit_friction'
      },
      'edit_crop_type': {
        min: 0,
        max: 30,
        value: 0,
        unit: '',
        name: 'crop type',
        decimals: 0,
        edit_mode: 'edit_crop_type'
      },
      'edit_soil': {
        min: 0,
        max: 30,
        value: 0,
        unit: '',
        name: 'soil',
        decimals: 0,
        edit_mode: 'edit_soil'
      },
      // these do not match program_modes,
      // but instead they are used in the popup
      'rain_duration': {
        min: 1,
        max: 10,
        value: 3,
        unit: 'h',
        name: 'duration',
        decimals: 0
      },
      'rain_size': {
        min: 0.1,
        max: 0.5,
        value: 0.15,
        unit: '',
        name: 'size',
        decimals: 2
      },
      'discharge_type': {
        value: 1,
        unit: '',
        name: 'discharge type'
      },
      // area wide rain
      'radar_multiplier': {
        min: 0.1,
        max: 5,
        value: 1.0,
        unit: 'x',
        name: 'multiplier',
        decimals: 1
      },
      'rain_constant_intensity': {
        min: 0,
        max: 200,
        value: 1,
        unit: 'mm/h',
        name: 'intensity',
        decimals: 1,
        slider_type: 'pow2' // make it behave ^2
      },
      'rain_design_definition': {
        min: 3,
        max: 10,
        value: 8,
        decimals: 0
      }
    },
    scenario_event_defaults: {
      wind_direction: 0,
      wind_speed_beaufort: 0,
      crop_type: 1,
      soil_type: 1,
      infiltration_value: 480,
      interception_value: 0.05,
      discharge_amount: 50,  // m3/s
      discharge_type: 1,  // 1=overland, 2=groundwater
      manhole_amount: -1,  // m3/s, is technically the same as discharge
      rain_amount: 10,  // mm/h
      rain_size: 0.15,  //
      rain_duration: 3,  // hours
      flood_fill_relative: 1, // m
      flood_fill_absolute: 0, // m MSL
      bathy_value: 15,  // meters
      bathy_mode: 1,  // 1=absolute, 0=relative
      edit_land_use_color: 2,  // This part is hacky/for demo purposes.
      edit_land_use_colors: ['#888888', '#52ff00', '#f73959', '#1285cd'],
      edit_land_use_names: ['road', 'unpaved', 'housing', 'water'],
      info_mode: 's1',  // s1=depth
      onedee_info_mode: 'unorm',
      // fast: is overriden in threedi-leaflet.js
      wms_options: {hmax: 0.5, interpolate: 'linear', fast: 1},  // options that will be added to the animation wms url
      wms_layer_depth: 'depth',
      wms_limits: [-5, 5],  // these are changed dynamically
      min_time_sim_step: 0,  // minimum time for simulation time step for subgrid_controller
      time_step_duration: 600  // maximum time step duration
    },
    map_defaults: {
      onedee_layer_status: 0  // 0 = off, 1 = on
    },
    error_message_for_controller: '',  // message from server intended for modal popup
    normal_message_for_controller: '',  // message from server intended for modal popup
    setMode: function (mode) {
      this.program_mode = mode;
      this.first_click = null;

      // setting mouse cursor for modes
      if (mode === modes.MODE_INFO_LINE) {
        $('#map').addClass('map-crosshair');
      } else {
        $('#map').removeClass('map-crosshair');
      }
    },
    setInfoMode: function (mode) {
      // What to see in the InfoPoint box?
      this.scenario_event_defaults.info_mode = mode;
      showalert('Info mode is now ' + mode);
    },
    active_panel: '',  // pi menu, background layer, ...
    // show_onedee is used in createObjectLayer
    // add as needed. default (unlisted) is true
    show_onedee_default: {  // these values are set when switching models
      'v2_breach': false,
      'v2_levee': false,  // default setting, must match TileLayer.GeoJson..
      'v2_pumpstation': true
    },
    show_onedee: {  // these are actual working values and can be changed
      'v2_breach': false,
      'v2_levee': false,
      'v2_pumpstation': true
    }
  });

  return state;
}]);
