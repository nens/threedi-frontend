
angular.module('threedi-client')
  .controller('StructureSettings', ['$scope', 'state', 'clientState', '$rootScope', 'leaflet', 'socket',
    function ($scope, state, clientState, $rootScope, leaflet, socket) {

      $scope.has_changes_not_applied = false;

      var intToYesNo = function (i) {
        if (i == 0) {
          return 'no';
        } else {
          return 'yes';
        }
      };

    // Read_more: https://en.wikipedia.org/wiki/Identity_function
      var noOp = function (i) {
        return i;
      };

    // Must match the data sent from controller (prepare_redis_tiles)
      var PARAM_MAPPING = {
        'sewerage-pumpstation': [
          {
            'field_name': 'start_level',
            'description': 'Start Level [m MSL]',
            'increment': 0.1,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'stop_level',
            'description': 'Stop Level [m MSL]',
            'increment': 0.1,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'capacity',
            'description': 'Capacity [L/s]',
            'increment': 0.5,
            'minimum': 0.5,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'powered_on',
            'description': 'Powered On (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'pump_delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'pump_duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'node': {
            // node has sub types
          '1db': [
            {
              'field_name': 'boundary_value0',
              'description': 'First boundary value',
              'increment': 0.1,
              'display_fun': noOp
            },
            {
              'field_name': 'boundary_value1',
              'description': 'Second boundary value',
              'increment': 0.1,
              'display_fun': noOp
            }
          ]
        },
        'sewerage-weir': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'sewerage-pipe': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        // v2 lines, pipe, weir, culvert, orifice, channel currently have
        // the same properties, but they could change
        // please do not refactor.
        'v2_pipe': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_weir': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_orifice': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_culvert': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_channel': [
          {
            'field_name': 'opened',
            'description': 'Opened (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_pumpstation': [
          {
            'field_name': 'start_level',
            'description': 'Start Level [m MSL]',
            'increment': 0.1,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'stop_level',
            'description': 'Stop Level [m MSL]',
            'increment': 0.1,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'capacity',
            'description': 'Capacity [L/s]',
            'increment': 0.5,
            'minimum': 0.5,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'powered_on',
            'description': 'Powered On (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'pump_delay',
            'description': 'Delay control [H]',
            'increment': 0.5,
            'minimum': 0,
            'maximum': 6,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'pump_duration',
            'description': 'Duration of control [H, -1=indefinite]',
            'increment': 1,
            'minimum': -1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_rain_cloud': [
          {
            'field_name': 'amount',
            'description': 'Amount [mm/h]',
            'increment': 10,
            'minimum': 10,
            'maximum': 300,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'diameter',
            'description': 'Diameter [m]',
            'increment': 10,
            'minimum': 10,
            'maximum': 100000,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration_h',
            'description': 'Duration [H]',
            'increment': 1,
            'minimum': 0,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_discharge': [
          {
            'field_name': 'amount',
            'description': 'Amount [m3/s]',
            'increment': 10,
            'minimum': 10,
            'maximum': 1000,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'duration_h',
            'description': 'Duration [H]',
            'increment': 1,
            'minimum': 0,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          }
        ],
        'v2_breach': [
          {
            'field_name': 'breached',
            'description': 'Breached (yes/no)',
            'increment': 1,
            'minimum': 0,
            'maximum': 1,
            'display_fun': intToYesNo,
            'set_after_change': false
          },
          {
            'field_name': 'time_h',
            'description': 'Time [H]',
            'increment': 0.1,
            'minimum': 0.1,
            'maximum': 12,
            'display_fun': noOp,
            'set_after_change': false
          },
          {
            'field_name': 'width_m',
            'description': 'Initial breach width [m]',
            'increment': 1,
            'minimum': 1,
            'maximum': 100,
            'display_fun': noOp,
            'set_after_change': false
          }
        ]
      };

      $scope._params = function () {
        if ($scope.content === null) {
          return null;
        }
        var mapping = PARAM_MAPPING[$scope.content.contenttype];
        if (Array.isArray(mapping)) {
          return mapping;
        } else if ($scope.content.contenttype === 'node') {
            // TODO: a bit hardcoded condition check...
          var nodType = $scope.content.properties.nod_type;
          return mapping[nodType];
        }
        return null;
      };

    // do not do this kind of things, you never know when the function is run.
    // $scope.params = $scope._params();

      $scope.addition = function (source, additive, minimum, maximum, set_after_change) {
        // addition with respect to minimum and/or maximum.
        $scope.content.properties[source] = (
            parseFloat($scope.content.properties[source]) + additive).toFixed(2);
        if (minimum !== undefined) {
          $scope.content.properties[source] = Math.max(
                $scope.content.properties[source], minimum);
        }
        if (maximum !== undefined) {
          $scope.content.properties[source] = Math.min(
                $scope.content.properties[source], maximum);
        }
        if ((set_after_change === undefined) || (set_after_change === true)) {
          $scope.set();
        } else {
          $scope.has_changes_not_applied = true;
        }
      };

    /* click 'Apply' button */
      $scope.set = function () {
        var line_idx = $scope.content.properties
                       &&
                       $scope.content.properties.line_idx;
        if (line_idx) {
          var closed = $scope.content.properties.opened === 0;
          leaflet.set_onedee_flod_flou_by_index(line_idx, closed);
        }

        socket.emit('change_object',
            $scope.content.properties,
            function () {
              console.log('emit change_object: ', $scope.content.properties);
              $scope.has_changes_not_applied = false;
                // state.structure_has_changes_not_applied = true;
              if ($scope.close_after_apply) {
                    // close box
                $scope.close_box();
              }
            }
        );
      };

    }]);
