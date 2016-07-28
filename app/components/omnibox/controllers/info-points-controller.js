
const $ = require('jquery');

/* click on the map OR click on a channel, node, sewerage-weir, sewerage-orifice */
angular.module('threedi-client')
  .controller('InfoPoint', ['$scope', 'state', 'clientState', '$rootScope', 'leaflet', 'socket',
    function ($scope, state, clientState, $rootScope, leaflet, socket) {
      $scope.content = null;
      $scope.state = state;
      $scope.counter = 0;
      $scope.title = null;
      $scope.infourls = [];
      $scope.which_settings = undefined;  // determines which settings screen. 'structure-settings'
      $scope.show_settings = false;  // normal < and > buttons, true: settings screen
      $scope.selectedInfo = undefined;  // initial, must update manually after changing screens.
      $scope.selectedUrl = '';  // initial, must update manually after changing screens.
      $scope.close_after_apply = false;
    // update clientState.info_startingpoint accordingly as well
      $scope.must_show_delete_btn = undefined;

    // Valid object types that have settings
    // TODO: what is the purpose? Looks like it is never used.
      var VALID_CONTENTTYPES_SETTINGS = [
        'sewerage-pumpstation',
        'node',
        'v2_pumpstation',
        'v2_channel',
        'v2_pipe',
        'v2_weir',
        'v2_orifice',
        'v2_culvert'
      ];

    // Special case for nodes, these node types can have settings
      var VALID_NOD_TYPE_SETTINGS = [
        '1db'
      ];

      var boxAwesome = document.getElementById('box-awesome');
      $scope.mouseOnBox = null;

    // In the boxes test this can be null.
      if (boxAwesome !== null) {
        boxAwesome.onmouseover = function () {
          $scope.mouseOnBox = true;
        };
        boxAwesome.onmouseout = function () {
          $scope.mouseOnBox = false;
        };
      } else {
        console.log('Something went wrong: boxAwesome is null');
      }

      $scope.stop = function (type_) {
        socket.emit('stop_disturbance',
            type_,
            $scope.box.content.properties.unique_id,
            function () {
              console.log('stopped disturbance (@InfoPointCtrl)');
            });
        $scope.close_box();
      };

      $scope.updateSelectedUrl = function () {
        if ($scope.selectedInfo === undefined) {
          return;
        }
        if ($scope.selectedInfo.url === undefined) {
          return;
        }
        $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
      };

      $scope.updateContentWithStatusUrl = function () {
        /* specialized function to update contents with current data
        For each object type, the update may be different.
        */
        if ($scope.content.properties === undefined || $scope.mouseOnBox) {
          return;
        }
        var object_type = $scope.content.properties.object_type;
        if (object_type === 'v2_rain_cloud') {
          $scope.content.properties.amount = $scope.content.properties.data.amount;
          $scope.content.properties.diameter = Math.trunc($scope.content.properties.data.diameter);
          $scope.content.properties.duration_h = 3;
            // put the data on the same level for change_object
          $scope.content.properties.x = $scope.content.properties.data.x;
          $scope.content.properties.y = $scope.content.properties.data.y;
            // something for the GUI
          $scope.content.properties.display_name = '' + $scope.content.properties.obj_id;

        } else if (object_type === 'v2_discharge') {
          $scope.content.properties.amount = $scope.content.properties.data.amount;
          $scope.content.properties.duration_h = 3;
            // put the data on the same level for change_object
          $scope.content.properties.x = $scope.content.properties.data.x;
          $scope.content.properties.y = $scope.content.properties.data.y;
            // something for the GUI
          $scope.content.properties.display_name = '' + $scope.content.properties.obj_id;
        }

        // from here: you need a status_url
        if (!$scope.content.hasOwnProperty('status_url')) {
          return;
        }
        switch (object_type) {
        case 'v2_channel':
        case 'v2_pipe':
        case 'v2_orifice':
        case 'v2_weir':
        case 'v2_culvert':
          console.log('Fetching actual status data for ' + object_type + '...');
          $.get($scope.content.status_url, function (data) {
                    // example response Object {flou: 1, flod: 1}
                    // required fields: flou, flod
            if ((data.flou === 0) && (data.flod === 0)) {
              $scope.content.properties.opened = 0;
            } else {
              $scope.content.properties.opened = 1;
            }
                    // some defaults
            $scope.content.properties.delay = 0;
            $scope.content.properties.duration = -1;
          });
          break;
        case 'v2_pumpstation':
          console.log('Fetching actual status data for ' + object_type + '...');
          $.get($scope.content.status_url, function (data) {
                    // required fields: flou, flod, p1dq, p1don, p1doff
            if (data.p1dq === 0.00) {
              $scope.content.properties.powered_on = 0;
            } else {
              $scope.content.properties.powered_on = 1;
            }
            $scope.content.properties.capacity = data.p1dq * 1000;
            $scope.content.properties.start_level = data.p1don;
            $scope.content.properties.stop_level = data.p1doff;
                    // some defaults
            $scope.content.properties.pump_delay = 0;
            $scope.content.properties.pump_duration = -1;
          });
          break;
        case 'v2_breach':
          console.log('Fetching actual status data for ' + object_type + '...');
          $.get($scope.content.status_url, function (data) {
            switch (data.kcu) {
            case 55:
              $scope.content.properties.breached = 0;
              break;
            case 56:
              $scope.content.properties.breached = 1;
              break;
            default:
              console.log(
                                'Warning: Unknown kcu for breach. kcu=', data.kcu);
              $scope.content.properties.breached = 0;
              break;
            }
            $scope.content.properties.time_h = 0.1;
            $scope.content.properties.width_m = 10;

          });
        default:
          break;
        }
      };

    // enable the normal info screen on a given index
      $scope.selectInfo = function (id) {
        $scope.selectedInfo = $scope.infourls[id];
        if ($scope.infourls.length - 1 > id) {
          $scope.selectedInfo.next = id + 1;
          clientState.info_startingpoint = id;
        }
        if (id > 0) {
          $scope.selectedInfo.previous = id - 1;
          clientState.info_startingpoint = id;
        }
        $scope.selectedUrl = $scope.selectedInfo.url;
        $scope.show_settings = false;
      };

    // enable the settings screen with possibility to go to the graphs view
      $scope.switch_settings = function () {
        // enable settings screen
        $scope.show_settings = true;
        // make it able to click <, > by faking a selection
        $scope.selectedInfo = {
          name: 'Settings',
          previous: 0,
          next: 0
        };
      };

    // enable the settings screen with disabled arrows
      $scope.set_settings_no_graphs = function () {
        $scope.show_settings = true;
        $scope.selectedInfo = {
          name: 'Settings'
        };
      };

      var addNextPreviousAttr = function (obj_arr) {
        // Add next and previous attributes to the object array
        for (var idx = 0; idx < obj_arr.length; idx++) {
          if (idx > 0) {
            obj_arr[idx].previous = idx - 1;
          }
          if (idx < obj_arr.length - 1) {
            obj_arr[idx].next = idx + 1;
          }
        }
      };

      var removeUndefined = function (obj_arr) {
        /* remove an element if it is either undefined or the boolean false */
        return obj_arr.filter(function (elm) {
          return ((typeof elm !== 'undefined') && (elm !== false));
        });
      };

      var getTsFlowVelocity = function (layer, link_number, meta_data) {
        var result = {
          name: 'Flow Velocity',
          unit: '[m/s]',
          type: 'unorm',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':unorm' +
                    '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + link_number + '&random='
        };
        if (meta_data)
          result.meta = meta_data;
        return result;
      };

      var getTsDischarge = function (layer, link_number, meta_data) {
        var result = {
          name: 'Discharge',
          unit: '[m3/s]',
          type: 'q',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':q' +
                    '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + link_number + '&random='
        };
        if (meta_data)
          result.meta = meta_data;
        return result;
      };

      var getTsDischargePump = function (layer, idx, meta_data) {
        // q_pump, not pumpq!!
        var result = {
          name: 'Discharge',
          unit: '[m3/s]',
          type: 'q',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':q_pump' +
                    '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + idx + '&random='
        };
        if (meta_data)
          result.meta = meta_data;
        return result;
      };

      var getTsWaterLevel = function (layer, flowelem_index, meta_data) {
        if (flowelem_index) {
          var result = {
            name: 'Water Level',
            unit: '[m MSL]',
            type: 's1',
            url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                     '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':s1' +
                     '&SRS=EPSG:4326&messages=true&absolute=true&quad=' + flowelem_index + '&random='
          };
          if (meta_data)
            result.meta = meta_data;
          return result;
        } else
            return undefined;
      };

      var getTsDepth = function (layer, idx, meta_data) {
        var result = {
          name: 'Depth',
          unit: '[m]',
          type: 's1',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
            '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':' + 's1' +
            '&SRS=EPSG:4326&messages=true&QUAD=' + idx +
            '&random=',
          meta: meta_data
        };
        return result;
      };

      var getTsBreachDepth = function (layer, idx, meta_data) {
        var result = {
          name: 'Breach Depth',
          unit: '[m]',
          type: 'breach_depth',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
            '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':' + 'breach_depth' +
            '&SRS=EPSG:4326&QUAD=' + idx +
            '&masked_value=0&random=',
          meta: meta_data
        };
        return result;
      };

      var getTsBreachWidth = function (layer, idx, meta_data) {
        var result = {
          name: 'Breach Width',
          unit: '[m]',
          type: 'breach_width',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
            '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':' + 'breach_width' +
            '&SRS=EPSG:4326&QUAD=' + idx +
            '&masked_value=0&random=',
          meta: meta_data
        };
        return result;
      };

      var getTsCrossectionalArea = function (layer, idx, meta_data) {
        var result = {
          name: 'Wet crossectional area',
          unit: '[m2]',
          type: 'au',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
            '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':' + 'au' +
            '&SRS=EPSG:4326&QUAD=' + idx +
            '&random=',
          meta: meta_data
        };
        return result;
      };

      var getTsFreeBoard = function (layer, idx, meta_data) {
        var result = {
          name: 'Freeboard',
          type: 'freeboard',
          unit: '[m]',
          url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
            '/data?' + 'REQUEST=gettimeseries&LAYERS=' + $scope.state.state.loaded_model + ':' + 's1' +
            '&SRS=EPSG:4326&messages=true&absolute=false&freeboard=true&QUAD=' + idx +
            '&random=',
          meta: meta_data
        };
        return result;
      };

    // show only metadata
      var getTsMeta = function (meta_data) {
        return {
          name: '',
          unit: '[m]',
          url: '',
          meta: meta_data
        };
      };

      var infoPoint = function (content) {
        var $layer = document.getElementsByClassName('workspace-wms-layer')[0];  // there is only one
        var infourls = [];
        var link_number = null;
        var node_idx = null;
        // content must have property type, contenttype, point (contenttype==map_info).
        $scope.show_settings = false;  // start at normal screen
        $scope.which_settings = undefined;  // default: causes disabled settings button
        var has_1d2d = content.properties && content.properties.has_1d2d;

        $scope.must_show_delete_btn = false;

        // You can set this flag to false to prevent updating selectedInfo
        var updateSelectedInfo = true;

        if (content.contenttype === 'channel') {
            // We already know the node index (named quad)
          var flowlink_index, flowelem_index;
          if (content.properties) {
            link_number = content.properties.link_number;
            node_idx = content.properties.node_a;
            if (content.properties.hasOwnProperty('condition')) {
              content.condition = 'Boundary Condition: ' + content.properties.condition;
            }
          }
          infourls = [
                // if flowelem_index is undefined, the item will be filtered out
            getTsWaterLevel($layer, node_idx),
            getTsFlowVelocity($layer, link_number),
            getTsDischarge($layer, link_number)
          ];

        } else if (content.contenttype === 'twodee-line') {
            // Should this become link_number, a.o.t. line_number??
          var line_number = content.properties.line_number;
          infourls = [
            getTsFlowVelocity($layer, line_number, content.properties.meta),
            getTsDischarge($layer, line_number, content.properties.meta)
          ];

        } else if (content.contenttype === 'sewerage-pipe') {
          link_number = content.properties.link_number;
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'sewerage-weir') {
          link_number = content.properties.sander_id;  // to be changed to link_number
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'sewerage-orifice') {
          link_number = content.properties.sander_id;  // to be changed to link_number
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'sewerage-pumpstation') {
            // in this case, idx0 is correct
          var idx0 = content.properties.idx0;
          infourls = [
            getTsDischargePump($layer, idx0, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'node') {
            // infourls;
          if (content.properties.nod_type === '1d') {
            var nod_idx1 = content.properties.nod_idx1;  // 1-based indexing in netcdf?
            infourls = [
            clientState.features.gui_infonode && {
                name: 'Depth',
                unit: '[m]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&QUAD=' + nod_idx1 +
                        '&random=',
                meta: content.properties.meta
              },
            clientState.features.gui_infonode && {
                name: 'Water Level',
                type: 's1',
                unit: '[m MSL]',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                        '&SRS=EPSG:4326&messages=true&absolute=true&QUAD=' + nod_idx1 +
                        '&random=',
                meta: content.properties.meta
              }
          ];
          } else if (content.properties.nod_type === '1db') {
                // only show meta data
          infourls = [getTsMeta(content.properties.meta)];
          $scope.which_settings = 'structure-settings';
        } else {
          console.log('There is something wrong with a node item.');
          console.log(content);
        }
        } else if (content.contenttype === 'v2_manhole') {
          var node_idx = content.properties.node_idx;
          infourls = [
          clientState.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
          clientState.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta),
          clientState.features.gui_infonode && has_1d2d && getTsFreeBoard($layer, node_idx, content.properties.meta)
        ];
        } else if (content.contenttype === 'v2_connection_nodes') {
        var node_idx = content.properties.node_idx;
        infourls = [
            clientState.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
            clientState.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta)
          ];
      } else if (content.contenttype === 'v2_node') {
            // added calculation node
          var node_idx = content.properties.node_idx;
          infourls = [
            clientState.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
            clientState.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta)
          ];
        } else if (content.contenttype === 'map_info') {
            // default, click on map
          var lonlat = content.point;
          infourls = [
            clientState.features.gui_infopoint_depth && {
              name: 'Depth',
              unit: '[m]',
              type: 's1',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                    '&SRS=EPSG:4326&messages=true&POINT=' + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random='
            },
            clientState.features.gui_infopoint_waterlevel && {
              name: 'Water Level',
              type: 's1',
              unit: '[m MSL]',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 's1' +
                    '&SRS=EPSG:4326&messages=true&absolute=true&POINT=' + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random='
            },
            clientState.features.gui_infopoint_groundwaterlevel && {
              name: 'Ground Water Level',
              type: 'sg',
              unit: '[m MSL]',
              url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + 'REQUEST=gettimeseries&LAYERS=' + state.state.loaded_model + ':' + 'sg' +
                    '&SRS=EPSG:4326&messages=true&POINT=' + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random='
            }
          ];

        } else if (content.contenttype === 'v2_pipe') {
          link_number = content.properties.line_idx;
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_orifice') {
          link_number = content.properties.line_idx;
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_weir') {
          link_number = content.properties.line_idx;
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_culvert') {
          link_number = content.properties.line_idx;
          infourls = [
            getTsFlowVelocity($layer, link_number, content.properties.meta),
            getTsDischarge($layer, link_number, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_channel') {
          if (content.properties) {
            flowlink_index = content.properties.line_idx;
          }
          infourls = [
            getTsFlowVelocity($layer, flowlink_index, content.properties.meta),
            getTsDischarge($layer, flowlink_index, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_pumpstation') {
          var pump_idx = content.properties.pump_idx;
          infourls = [
            getTsFlowVelocity($layer, pump_idx, content.properties.meta),
            getTsDischargePump($layer, pump_idx, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';

        } else if (content.contenttype === 'v2_rain_cloud') {
          $scope.must_show_delete_btn = true;
          $scope.which_settings = 'structure-settings';
            // enable settings screen
          $scope.set_settings_no_graphs();
          updateSelectedInfo = false;

        } else if (content.contenttype === 'v2_discharge') {
          $scope.must_show_delete_btn = true;
          $scope.which_settings = 'structure-settings';
            // enable settings screen
          $scope.set_settings_no_graphs();
          updateSelectedInfo = false;

        } else if (content.contenttype === 'v2_breach') {
            // breach location
            // table au starts at 0, so the line_idx corresponds
          var line_idx = content.properties.line_idx;
          var breach_idx = content.properties.breach_idx;
            // TODO: no timeseries
          infourls = [
            getTsDischarge($layer, line_idx, content.properties.meta),
            getTsBreachDepth($layer, breach_idx, content.properties.meta),
            getTsBreachWidth($layer, breach_idx, content.properties.meta),
            getTsCrossectionalArea($layer, line_idx, content.properties.meta)
          ];
          $scope.which_settings = 'structure-settings';
        } else if (content.contenttype === 'unknown') {
          var infourls = [
            {
              name: 'unknown',
              unit: '',
              url: '',
              meta: content.properties.meta
            }
          ];

        }

        // Remove unused features and add attributes
        $scope.infourls = removeUndefined(infourls);
        addNextPreviousAttr($scope.infourls);

        // Adjust the starting point when changed
        if (clientState.info_startingpoint > $scope.infourls.length - 1) {
            // length can be 0 if you do not have graphs
          clientState.info_startingpoint = Math.max($scope.infourls.length - 1, 0);
        }

        // selectedInfo is set in v2_rain_cloud, so do not overwrite!
        if (updateSelectedInfo) {
          $scope.selectedInfo = $scope.infourls[clientState.info_startingpoint];
        }

        if (
            ($scope.selectedInfo !== undefined) &&
            ($scope.selectedInfo.hasOwnProperty('url')) &&
            ($scope.selectedInfo.url !== '')) {
            // normal case
          $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        }
        // do not set selectedUrl otherwise, because it triggers a request.
      };

    // Popup
      $scope.$on('infopoint', function (message, content) {
        $scope.content = content;
        $scope.updateContentWithStatusUrl();
        if (content.hasOwnProperty('close_after_apply') && content.close_after_apply) {
          $scope.close_after_apply = true;
        } else {
          $scope.close_after_apply = false;
        }
        $scope.$apply(function () {
          infoPoint(content);
        });
      });

    // Remove channel highlight/infopoint when box is closed.
      $scope.$on('infopoint-close', function (message, value) {
        leaflet.removeChannelMarker();
        leaflet.removeInfoMarker();
        $scope.content = null;
        d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
      });

    /* Keep the graph updated */
      $scope.$on('serverState', function () {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = state.state.time_seconds;
        $scope.updateSelectedUrl();
        if (state.state.state === 'sim') {
            // only during a running simulation, or it looks like a users input
            // is ignored because it is overwritten by the servers current value
          $scope.updateContentWithStatusUrl();
        }

        // if (($scope.selectedUrl !== '') && ($scope.selectedUrl !== undefined)) {
        //     $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        // }
      }, true);

    // check if we need scrolling for the pumpstation display_name
      $scope.need_scrolling = function () {
        return $scope.content
               &&
               $scope.content.properties.display_name
               &&
               $scope.content.properties.display_name.length > 10;
      };
    }]);
