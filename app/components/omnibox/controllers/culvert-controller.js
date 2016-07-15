
angular.module('threedi-client')
  .controller('Culvert', [
    '$scope', 'state', 'socket', 'leaflet',
    function ($scope, state, socket, leaflet_service) {

      $scope.content = null;
      $scope.message = '';
      $scope.state = state;
      $scope.counter = 0;

      $scope.retrieveActive = function (structure, pk) {
        var activeStructure = {};
        if (!leaflet_service.onedee_status.current_status) {
          console.warn('no current status');
          return false;
        }
        if (leaflet_service.onedee_status.current_status.data.culverts === null) {
            // probably the simulation has not started yet.
          console.warn('culverts not found');
          return false;
        }
        var structureData = leaflet_service.onedee_status.current_status.data.culverts;
        if (structureData['branchid'].hasOwnProperty(pk)) {
          for (var item in structureData) {
            if (item == 'valve_opening') {
                    // valve_opening is a string; needs to be converted to a
                    // number to be editable in the popup
              activeStructure[item] = Number(structureData[item][pk]);
            } else {
              activeStructure[item] = structureData[item][pk];
            }
          }
        } else {
          console.log('no structure with sander_id');
          activeStructure = undefined;
        }
        return activeStructure;
      };

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

      $scope.infoCulvert = function (content, initial) {
        var culvert = $scope.retrieveActive('culvert', 'culvert-' + content.properties.sander_id);
        if (culvert === false) { return;}
        var node_a = culvert.right_calc_point;
        var node_b = culvert.left_calc_point;
        var link_number = culvert.link_number;
        if ((state.state.running_sim == '1') || (initial == true)) {
          angular.extend(content.properties, culvert);
          $scope.content = content;
        }
        if ($scope.infourls == undefined) {
          var $layer = document.getElementsByClassName('workspace-wms-layer')[0];
          $scope.infourls = [
            {
              name: 'Water Level (upstream)',
              unit: '[m]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_a - 1) +
                        '&random=',
              next: 1
            },
            {
              name: 'Water Level (downstream)',
              unit: '[m]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_b - 1) +
                        '&random=',
              previous: 0,
              next: 2
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

      };

      $scope.$on('culvert', function (message, content) {
        // This is already done in threedi-leaflet.js ?
        // var feature_id = '#' + content.properties.object_type + '-' + content.properties.sander_id;
        // if (state.master) {
        //     d3.select(feature_id).classed('selected-icon', true);
        //     // why a selection with d3?
        // }

        $scope.content = content;
        $scope.$apply(function () {
          $scope.infourls = undefined;
          $scope.infoCulvert(content, true);
          if ($scope.selectedInfo !== undefined) {
            $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
          }
        });
        $scope.counter = $scope.state.state.time_seconds;
      });

      $scope.$on('culvert-close', function (message, content) {
        // disable any bouncing icon
        console.log('culvert-close');
        // just because this isn't being done with jquery, doesn't
        // mean I don't feel the spirit of jquery here..
        d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
      });

      $scope.set_culvert = function () {
        socket.emit('change_culvert',
        $scope.content.properties.sander_id,
        $scope.content.properties,
        function () {
          console.log('emit a change of culvert');
        }
      );
      };

      $scope.$on('serverState', function () {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = $scope.state.state.time_seconds;
        $scope.infoCulvert($scope.content);
        if ($scope.selectedInfo !== undefined) {
          $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        }
      }, true);
    }]);
