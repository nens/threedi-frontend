// create a map in the "map" div, set the view to a given place and zoom
// var map = L.map('map').setView([52.026726,4.397621], 13);
// now shwo the extent for the loaded model
const L = require('leaflet');

var map = L.map('map', {
  maxZoom: 20,
  noWrap: true
})
// .fitBounds([
//     [model_extent[0], model_extent[1]],
//     [model_extent[2], model_extent[3]]
// ]);


// Creates a red marker with the coffee icon
var infoMarker = function (color) {
  if (color === undefined) {
    color = 'green';
  }
  return L.AwesomeMarkers.icon({
    icon: 'info',
    prefix: 'fa',
    markerColor: color
  });
};

var raincloudIcon = function (color, uuid) {
  if (color === undefined) {
    color = 'red';
  }
  return L.AwesomeMarkers.icon({
    icon: 'threedi-rain',
    prefix: 'fa',
    markerColor: color,
    className: "awesome-marker leaflet-clickable scenario-event-" + uuid
  });

    // awesome-marker-icon-red awesome-marker leaflet-zoom-animated leaflet-clickable selected-icon
};

var dischargeIcon = function (color, uuid) {
  if (color === undefined) {
    color = 'blue';
  }
  return L.AwesomeMarkers.icon({
    icon: 'threedi-manhole',
    prefix: 'fa',
    markerColor: color,
    className: "awesome-marker leaflet-clickable scenario-event-" + uuid
  });
};

var manholeIcon = function (color) {
  if (color === undefined) {
    color = 'blue';
  }
  return L.AwesomeMarkers.icon({
    icon: 'threedi-pump',
    prefix: 'fa',
    markerColor: color,
    iconColor: '#000000'
  });
};

var floodfillIcon = function (color) {
  if (color === undefined) {
    color = 'darkblue';
  }
  return L.AwesomeMarkers.icon({
    icon: 'tint',
    prefix: 'fa',
    markerColor: color,
    iconColor: '#000000'
  });
};


var editIcon = function (color) {
  if (color === undefined) {
    color = 'green';
  }
  return L.AwesomeMarkers.icon({
    icon: 'pencil',
    prefix: 'fa',
    markerColor: color,
    iconColor: '#000000'
  });
};


L.Control.RemoveAll = L.Control.extend(
  {
    options:
    {
      position: 'topleft'
    },
    onAdd: function (map) {
      var controlDiv = L.DomUtil.create('div', 'leaflet-control-command');
        /* var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar tooldiv');*/
      L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
        .addListener(controlDiv, 'click', function () {
          drawnItems.clearLayers();
        });

      var controlUI = L.DomUtil.create('a', "leaflet-draw-draw-polygon", controlDiv);
      controlUI.title = "Draw a polygon";
      controlUI.href = '#';
      return controlDiv;
    }
  });
var removeAllControl = new L.Control.RemoveAll();
map.addControl(removeAllControl);

module.exports = map;
