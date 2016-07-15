
angular.module('threedi-client')
  .controller('Orifice', ['$scope', 'state', 'socket', function ($scope, state, socket) {

    $scope.content = null;
    $scope.counter = 0;
    $scope.message = '';

    $scope.selectInfo = function (id) {
      $scope.selectedInfo = $scope.infourls[id];
      if ($scope.infourls.length - 1 > id) {
        $scope.selectedInfo.next = id + 1;
      }
      if (id > 0) {
        $scope.selectedInfo.previous = id - 1;
      }
      $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
    };

    var infoOrifice = function (content, initial) {
      var orifice_data = JSON.parse(state.state.orifice);
      var ids = orifice_data['id'];
      var orifice_idx = null;
      for (var id in Object.keys(ids)) {
        if (orifice_data['id'][id] == 'orifice-' + content.properties.sander_id) {
          orifice_idx = id;
          break;
        }
      }
      var node_a = content.properties.node_a;
      var node_b = content.properties.node_b;
      var link_number = content.properties.link_number;
      if ((state.state.running_sim == '1') || (initial === true)) {
            // user edit otherwise gets overwritten by server value
        content.properties.crest_width = orifice_data['crest_width'][orifice_idx];
        content.properties.opening_level = orifice_data['open_level'][orifice_idx];
        content.properties.lat_contr_coeff = orifice_data['lat_contr_coeff'][orifice_idx];
        content.properties.crest_level = orifice_data['crest_level'][orifice_idx];
        content.properties.opening_height = content.properties.opening_level - content.properties.crest_level;
        console.log('OH OL CL' + content.properties.opening_height + ' ' +
                content.properties.opening_level + ' ' +
                orifice_data['crest_level'][orifice_idx]);
        $scope.content = content;
      }

      if ($scope.infourls == undefined) {
        var $layer = document.getElementsByClassName('workspace-wms-layer')[0];
        $scope.infourls = [
          {
            name: 'Water Level (downstream)',
            unit: '[m MSL]',
            type: 's1',
            url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_a - 1) +
                        '&random=',
            next: 1
          }, {
            name: 'Water Level (upstream)',
            unit: '[m MSL]',
            type: 's1',
            url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_b - 1) +
                        '&random=',
            next: 2,
            previous: 0
          },
          {
            name: 'Discharge',
            unit: '[m3/s]',
            type: 'q',
            url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 'q' +
                        '&SRS=EPSG:4326&messages=true&absolute=false&quad=' + (link_number - 1) +
                        '&random=',
            previous: 1
          }];
        $scope.selectedInfo = $scope.infourls[0];
      }
      console.log('left: ' + node_a + ', right: ' + node_b + ', link: ' + link_number);
    };

    $scope.$on('orifice', function (message, content) {
      $scope.content = content;
      $scope.$apply(function () {
        $scope.infourls = undefined;
        infoOrifice(content, true);
        $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
      });
    });

    $scope.$on('orifice-close', function (message, content) {
        // disable any bouncing icon
      d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
    });

    $scope.add = function (property_name, delta, minimum, maximum) {
      console.log('orifice: add ', property_name, minimum, maximum);
      var property_value = null;
      if (property_name == 'opening_height') {
        if ($scope.content.properties['opening_level'] === null) {return;}
        if ($scope.content.properties['crest_level'] === null) {return;}
        property_value = parseFloat($scope.content.properties['opening_level']) - parseFloat($scope.content.properties['crest_level']);
      } else {
        if ($scope.content.properties[property_name] === null) {
          console.log('Failed requesting property value for ' + property_name);
          return;
        }
        property_value = parseFloat($scope.content.properties[property_name]);
      }
      console.log('orifice ' + $scope.content.properties.sander_id + ' [' + property_name + '] = ' + property_value);
        // for now, the used properties crest_width, opening_level  and lat_contr_coeff should be > 0
      property_value = (property_value + delta).toFixed(2);
      property_value = Math.max(property_value, minimum);
      property_value = Math.min(property_value, maximum);
      $scope.content.properties[property_name] = property_value;
        // In case of opening height, re-calculate opening_level
      if (property_name == 'opening_height') {
        $scope.content.properties['opening_level'] = parseFloat(
                $scope.content.properties['opening_height']) + parseFloat(
                $scope.content.properties['crest_level']);
      }
        // now send it back to the server
      socket.emit('change_orifice',
            $scope.content.properties.sander_id,
            $scope.content.properties,
            function () {
              if (debug) {
                console.log('emit change orifice');
              }
            }
        );
    };

    $scope.$on('serverState', function () {
        // When this function is called, it is already in an apply.
      if ($scope.content === null) {return;}
      $scope.counter = state.state.time_seconds;
      infoOrifice($scope.content);
      $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
    }, true);
  }]);
