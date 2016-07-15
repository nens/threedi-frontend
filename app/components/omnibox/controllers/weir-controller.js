angular.module('threedi-client')
  .controller('Weir', [
    '$scope', 'state', 'socket', 'leaflet',
    function ($scope, state, socket, leaflet_service) {

      $scope.content = null;
      $scope.counter = 0;
      $scope.message = '';
      $scope.state = state;

      $scope.retrieveActive = function (structure, pk) {
        var activeStructure = {};
        if (!leaflet_service.onedee_status.current_status) {
          console.warn('no current status');
          return false;
        }
        if (leaflet_service.onedee_status.current_status.data.weirs === undefined) {
          console.warn('no weirs in current_status');
          return false;
        }
        if (leaflet_service.onedee_status.current_status.data.weirs === null) {
            // probably the simulation has not started yet.
          console.warn('simulation has not started yet');
          return false;
        }
        var structureData = leaflet_service.onedee_status.current_status.data.weirs;
        if (structureData['branchid'].hasOwnProperty(pk)) {
          for (var item in structureData) {
            activeStructure[item] = structureData[item][pk];
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

      $scope.infoWeir = function (content, initial) {
        var weir = $scope.retrieveActive('weir', 'weir-' + content.properties.sander_id);
        if (weir === false) { return;}
        var node_a = weir.right_calc_point;
        var node_b = weir.left_calc_point;
        var link_number = weir.link_number;
        if ((state.state.running_sim == '1') && (initial === true)) {
          angular.extend(content.properties, weir);
          $scope.content = content;
        }
        if ($scope.infourls == undefined) {
          var $layer = document.getElementsByClassName('workspace-wms-layer')[0];
          $scope.infourls = [
            {
              name: 'Water Level (upstream)',
              unit: '[m MSL]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&absolute=true&messages=true&quad=' + (node_a - 1) +
                        '&random=',
              next: 1
            },
            {
              name: 'Water Level (downstream)',
              unit: '[m MSL]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&absolute=true&messages=true&quad=' + (node_b - 1) +
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

      $scope.$on('weir', function (message, content) {
        $scope.content = content;
        $scope.$apply(function () {
          $scope.infourls = undefined;
          $scope.infoWeir(content, true);
          if ($scope.selectedInfo !== undefined) {
            $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
          }
        });
        $scope.counter = $scope.state.state.time_seconds;
      });

      $scope.$on('weir-close', function (message, content) {
        // disable any bouncing icon
        d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
      });

      $scope.set_weir = function () {
        if (!$scope.content.properties.hasOwnProperty('crest_level')) {
          $scope.content.properties.crest_level = 0.5;
        }
        socket.emit('change_weir',
            $scope.content.properties.sander_id,
            $scope.content.properties,
            function () {
              if (debug) {
                console.log('emit a change of weir-ass-shiz');
              }
            }
        );
      };

      $scope.$on('serverState', function () {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = $scope.state.state.time_seconds;
        // console.log("open box info orifice yeah" + state.state.timestep_calc);
        $scope.infoWeir($scope.content);
        if ($scope.selectedInfo !== undefined) {
          $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        }
      }, true);

    }]);
