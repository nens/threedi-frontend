/**
 *
 * Datalayers can be initiated and added later on.
 */



angular.module('global-state').factory('Layer', [
    'LeafletLayer',
    'modes',
    function (LeafletLayer, modes) {

  var Layer = function (name, layerType, url, options) {
    Object.defineProperty(this, 'name', {
      value: name,
      enumerable: true,
      writable: false
    });
    Object.defineProperty(this, 'messages', {
      value: (options.messages) ? options.messages : false,
      enumerable: true,
      writable: false
    });
    Object.defineProperty(this, 'type', {
      value: (options.editType) ? options.editType : undefined,
      enumerable: true,
      writable: true
    });
    Object.defineProperty(this, 'enabled', {
      // will be overwritten depending on occurrence of editType in editable_maps
      value: (options.enabled) ? options.enabled : false,
      enumerable: true,
      writable: true
    });
    Object.defineProperty(this, 'layer', {
      value: new LeafletLayer(url, layerType, options),
      enumerable: true,
      writable: true
    });
    Object.defineProperty(this, 'objectType', {
      writable: false,
      enumerable: true,
      value: (options.objectType) ? options.objectType : undefined
    });
    Object.defineProperty(this, 'layerType', {
      value: layerType,
      enumerable: true,
      writable: true
    });
    Object.defineProperty(this, 'colorClass', {
      value: (options.color) ? options.color : 'color-none',
      enumerable: true,
      writable: false
    });
    Object.defineProperty(this, 'editMode', {
      value: (options.editMode) ? options.editMode : modes.EDIT_MODE_DEFAULT,
      enumerable: true,
      writable: false
    });
    Object.defineProperty(this, 'editPolygon', {
      // note: we have no other method for editing and
      // editPolygon is dependent on editMode
      value: (options.editPolygon) ? options.editPolygon : true,
      enumerable: true,
      writable: false
    });
    Object.defineProperty(this, 'active', {
      value: (options.active) ? options.active : false,
      enumerable: true,
      writable: true
    });
    Object.defineProperty(this, 'add', {
      value: function () {
        this.layer.addTo(map);
      },
      writable: false,
      enumerable: false
    });
    Object.defineProperty(this, 'remove', {
      value: function () {
        map.removeLayer(this.layer);
        if (this.layerType === 'Vector') {
          d3.selectAll('.' + this.objectType).remove();
        }
      },
      writable: false,
      enumerable: false
    });
    Object.defineProperty(this, 'invertedColor', {
      value: options.invertedColor ? true : false,
      writable: true,
      enumerable: true
    });
    Object.defineProperty(this, 'modelType', {
      value: options.modelType || 'all',
      writable: true,
      enumerable: true
    });
  };
  return Layer;

}]);


angular.module('global-state').factory('LeafletLayer', function () {
  var leafletLayer = function (url, type, options) {
    if (type === 'WMS') {
      return L.tileLayer.wms('', {
        layers: options.layers,
        format: 'image/png',
        transparent: true,
        opacity: (options.opacity) ? options.opacity : 0.5,
        maxZoom: 20,
        messages: options.messages,
        attribution: "© 2013 Nelen & Schuurmans"
      });
    } else if (type === 'Vector') {
      return new L.TileLayer.GeoJSONd3(url, {
        class: options.className,
        object_type: options.objectType,
        identifier: function(d) {
          // this still needs to be more generic
          return "levee-" + d.properties.sander_id;
        },
        maxZoom: 20
      });
    } else if (type === 'TMS') {
      return new L.tileLayer(tile_url + options.url_extra, {
          format: 'image/png',
          transparent: true,
          opacity: 1.0,
          maxZoom: 20,
          attribution: "© 2015 Nelen & Schuurmans"
      });
    } else if (type === 'GeoJSONd3') {
      return new L.TileLayer.GeoJSONd3(onedee_url + '.geojson?object_types=twodee_line', {
          class: "channel" + options.class_extra,
          object_type: "twodee-line",
          maxZoom: 20,
          identifier: function(d) {
              return "line2d-" + d.properties.line_number;
          }
      });
   }
  };

  return leafletLayer;
});

/**
 *
 *  Keeper of layers
 */
angular.module('global-state').service('LayerService', function () {

  function LayerModel () {
    Object.defineProperty(this, 'layerNames', {
        value: []
    });;
    Object.defineProperty(this, 'push', {
      value: function (item) {
        this[item.name] = item;
        this.layerNames.push(item.name);
      },
      writable: false,
      enumerable: false
    });
    Object.defineProperty(this, 'clear', {
      value: function(item) {
        var it;
        for (var i=0; i<this.layerNames.length; i++) {
          delete this[this.layerNames[i]];
        }
        this.layerNames = [];
      },
      writable: false,
      enumerable: false
    });
  }

  return {
    editLayers: new LayerModel(),
    adminLayers: new LayerModel(),
    backgroundLayers: new LayerModel(),
    structureLayers: new LayerModel(),
    animationLayers: new LayerModel()
  };
});
