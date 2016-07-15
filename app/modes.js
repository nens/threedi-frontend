/**
 * Some state constants.
 */


var module = angular.module('modes-module', []).service('modes', function modes () {
  this.MODE_NAVIGATE = 'navigate';
  this.MODE_FLOODFILL_ABSOLUTE = 'flood_fill_absolute'; // --> flood_fill_mode 1
  this.MODE_FLOODFILL_RELATIVE = 'flood_fill_relative'; // --> flood_fill_mode 0
  this.MODE_DISCHARGE = 'discharge';
  this.MODE_RAIN = 'rain';
  this.MODE_EDIT = 'edit';
  this.MODE_INFO_POINT = 'infopoint';
  this.MODE_INFO_LINE = 'infoline';
  this.MODE_EDIT_ONEDEE = 'onedee';
  this.MODE_INFO_CHANNEL = 'infochannel';
  this.MODE_EXTERNAL = 'external';

  // In MODE_EDIT we use these subdivisions
  this.EDIT_MODE_DEFAULT = 'edit_bathy';
  this.EDIT_MODE_BATHY = 'edit_bathy'; // bathymetr
  this.EDIT_MODE_CROP_TYPE = 'edit_crop_type';
  this.EDIT_MODE_FRICTION = 'edit_friction';
  this.EDIT_MODE_GRID = 'edit_grid';
  this.EDIT_MODE_INFILTRATION = 'edit_infiltration';
  this.EDIT_MODE_INTERCEPTION = 'edit_interception';
  this.EDIT_MODE_LAND_USE = 'edit_land_use';
  this.EDIT_MODE_SOIL = 'edit_soil';

  this.RAIN_OFF = 'off';
  this.RAIN_RADAR = 'radar';
  this.RAIN_DESIGN = 'design';
  this.RAIN_CONSTANT = 'constant';

  return this;
});

module.exports = module;
