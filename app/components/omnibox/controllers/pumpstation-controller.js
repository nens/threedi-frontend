
angular.module('threedi-client')
  .controller('PumpStation', [
    '$scope', 'state', 'socket', 'leaflet',
    function ($scope, state, socket, leaflet_service) {

      $scope.content = null;
      $scope.counter = 0;
      $scope.message = '';
      $scope.state = state;
      $scope.leaflet_service = leaflet_service;

    // Possible DRY for other controllers
      $scope.retrieveActive = function (structure, pk) {
        var activeStructure = {};
        if (!leaflet_service.onedee_status.current_status) {
          return false;
        }
        if (leaflet_service.onedee_status.current_status.data.pumps === null) {
            // probably the simulation has not started yet.
            // console.warn('simulation has not started yet');
          return false;
        }
        var structureData = leaflet_service.onedee_status.current_status.data.pumps;
        if (structureData['capacity'].hasOwnProperty(pk)) {
          for (var item in structureData) {
            activeStructure[item] = structureData[item][pk];
          }
        } else {
          console.log('no structure with pk');
          activeStructure = undefined;
        }
        return activeStructure;
      };

      $scope.selectInfo = function (id) {
        $scope.selectedInfo = $scope.infourls[id];
        if ($scope.infourls.length - 1 > id) {
          $scope.selectedInfo.next = id + 1;
          console.info(id, $scope.selectedInfo);
        }
        if (id > 0) {
          $scope.selectedInfo.previous = id - 1;
        }
        $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
      };

      $scope.infoPumpStation = function (content, initial) {
        var pumpstation = $scope.retrieveActive('pumpstation', 'pumpstation-' + content.properties.sander_id);
        if (pumpstation === false) {
          console.log('Warning: error retrieving clicked pumpstation');
          return;
        }
        var node_a = pumpstation.right_calc_point;
        var node_b = pumpstation.left_calc_point;
        var link_number = pumpstation.link_number;
        if ((state.state.running_sim == '1') || (initial === true)) {
          pumpstation.start_level_suction_side = parseFloat(pumpstation.start_level_suction_side);
          pumpstation.stop_level_suction_side = parseFloat(pumpstation.stop_level_suction_side);
          pumpstation.capacity = parseFloat(pumpstation.capacity);
          angular.extend(content.properties, pumpstation);
            // console.info(content.properties);
          $scope.content = content;
        }
        if ($scope.infourls == undefined) {
          var $layer = document.getElementsByClassName('workspace-wms-layer')[0];
          $scope.infourls = [
            {
              name: 'Water Level (downstream)',
              unit: '[m]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_b - 1) +
                        '&random=',
              next: 1
            }, {
              name: 'Water Level (upstream)',
              unit: '[m]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + (node_a - 1) +
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
      };

      $scope.$on('pumpstation', function (message, content) {
        $scope.content = content;
        $scope.$apply(function () {
          $scope.infourls = undefined;
          $scope.infoPumpStation(content, true);
          if ($scope.selectedInfo !== undefined) {
            $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
          }
        });
        $scope.counter = $scope.state.state.time_seconds;
      });

      $scope.$on('pumpstation-close', function (message, content) {
        // disable any bouncing icon
        d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
      });

      $scope.set_pump = function () {
        socket.emit('change_pumpstation',
            $scope.content.properties.sander_id,
            $scope.content.properties,
            function () {
              if (debug) {
                console.log('emit change pumpstation');
              }
            }
        );
      };

      $scope.$on('serverState', function () {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = $scope.state.state.time_seconds;
        // console.log("open box info orifice yeah" + state.state.timestep_calc);
        $scope.infoPumpStation($scope.content);
        if ($scope.selectedInfo !== undefined) {
          $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        }
      }, true);

    // check if we need scrolling for the pumpstation display_name
      $scope.need_scrolling = function () {
        if (($scope.content) &&
            ($scope.content.properties.display_name) &&
            ($scope.content.properties.display_name.length > 25)) {
          return true;
        } else {
          return false;
        }
      };

    }]);
