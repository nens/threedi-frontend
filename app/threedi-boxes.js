 /* threedi-boxes.js */


/* Helper controller for popups that use a slider */
angular.module("threedi-client")
  .controller("PopupSlider", ["$scope", "socket", "clientState",
    function($scope, socket, clientstate){

    $scope.value_percentage = [];  // default

    $scope.update_percentage = function(var_name, value) {
        $scope.value_percentage[var_name] = 100 * (
            value -
            clientstate.edit_ranges[var_name].min) / (
            clientstate.edit_ranges[var_name].max -
            clientstate.edit_ranges[var_name].min);
    };

    $scope.calc_value = function(var_name, value_fract) {
        var value_max = clientstate.edit_ranges[var_name].max;
        var value_min = clientstate.edit_ranges[var_name].min;
        var decimal_factor = Math.pow(10, clientstate.edit_ranges[var_name].decimals);
        var value = Math.round(value_fract * (value_max - value_min) *
                decimal_factor) / decimal_factor + value_min;
        $scope.update_percentage(var_name, value);
        return value;
    };

    $scope.get_x = function(event) {
        var x = event.offsetX;  // normal browsers
        if (x === undefined) {
            // hack for firefox
            x = event.clientX - $(event.currentTarget).offset().left;
        }
        return x;
    };
}]);


angular.module("threedi-client")
  .controller("RainCloud",
    ["$scope", "socket", "$rootScope", "clientState",
    function($scope, socket, $rootScope, clientstate){

    $scope.properties = null;

    $scope.mouse_is_down = false;
    $scope.controller_width = 300;  // assume that every slider here has the same width
    $scope.display_name = '';  // text to inform user

    $scope.clientstate = clientstate;

    $scope.update_display = function(value) {
        if (value >= 80) {
            $scope.display_name = '(heavy)';
        } else {
            $scope.display_name = '';
        }
    };

    $scope.set_diameter = function(diameter) {
        $scope.properties.diameter = diameter;
    };

    $scope.save = function(){
        socket.emit('change_rain',
            $scope.properties.x,
            $scope.properties.y,
            $scope.properties.diameter,
            $scope.properties.amount,
            3*3600,  // temporary duration
            $scope.properties.unique_id,
            function(){
                console.log('emit change cloud');
            }
        );
        $scope.close_box();
    };

    $scope.stop = function(){
        socket.emit('stop_disturbance',
            $scope.box.content.type,
            $scope.box.content.properties.unique_id,
            function () {
                console.log('stopped disturbance (@RainCloudCtrl)' );
            });
        $scope.close_box();
    };

    $scope.mouse_down = function(target_var, event) {
        $scope.mouse_is_down = true;
        var new_value = $scope.calc_value(
            target_var, $scope.get_x(event) / $scope.controller_width);
        if (target_var == 'rain') {
            $scope.properties.amount = new_value;
            $scope.update_display(new_value);
            $scope.clientstate = clientstate;  // set current values, they may have changed
        }
    };

    $scope.mouse_up = function(target_var, event) {
        $scope.mouse_is_down = false;
    };

    $scope.mouse_move = function(target_var, event) {
        if ($scope.mouse_is_down) {
            var new_value = $scope.calc_value(
                target_var, $scope.get_x(event) / $scope.controller_width);
            if (target_var == 'rain') {
                $scope.properties.amount = new_value;
                $scope.update_display(new_value);
            }
        }
    };

    $scope.$on('raincloud', function(message, content){
        $scope.properties = content.properties;
        $scope.$apply(function() {
            $scope.update_percentage('rain', $scope.properties.amount);
            $scope.update_display($scope.properties.amount);
        });
    });

    $scope.$on('keypress-1', function(message, value) {$scope.small();});
    $scope.$on('keypress-2', function(message, value) {$scope.big();});
    $scope.$on('keypress-3', function(message, value) {$scope.little();});
    $scope.$on('keypress-4', function(message, value) {$scope.much();});
    $scope.$on('keypress-enter', function(message, value) {$scope.save();});
}]);


/* Manholes AND discharges. Must be inside the PopupSlider controller */
angular.module("threedi-client")
  .controller("Discharge", ["$scope", "socket", "clientState",
    function($scope, socket, clientstate){

    $scope.properties = null;
    $scope.mouse_is_down = false;
    $scope.controller_width = 300;  // assume that every slider here has the same width
    $scope.discharge_display = '';  // text to inform user that a negative value is a pump
    $scope.clientstate = clientstate;

    $scope.update_display = function(value) {
        if (value >= 0) {
            $scope.discharge_display = '(discharge)';
        } else {
            $scope.discharge_display = '(pump)';
        }
    };

    $scope.save = function(){
        socket.emit('change_discharge',
            $scope.properties.amount,
            $scope.properties.unique_id,
            function(){
                console.log('emit change discharge');
        });
        $scope.close_box();
    };

    $scope.stop = function(){
        socket.emit('stop_disturbance', $scope.box.content.type,
            $scope.box.content.properties.unique_id,
            function(){
                console.log('stopped disturbance (@DischargeCtrl)');
            });
        $scope.close_box();
    };

    $scope.mouse_down = function(target_var, event) {
        $scope.mouse_is_down = true;
        var new_value = $scope.calc_value(
            target_var, $scope.get_x(event) / $scope.controller_width);
        if (target_var === 'discharge') {
            $scope.properties.amount = new_value;
            $scope.update_display(new_value);
            $scope.clientstate = clientstate;  // set current values, they may have changed
        }
    };

    $scope.mouse_up = function(target_var, event) {
        $scope.mouse_is_down = false;
    };

    $scope.mouse_move = function(target_var, event) {
        if ($scope.mouse_is_down) {
            var new_value = $scope.calc_value(
                target_var, $scope.get_x(event) / $scope.controller_width);
            if (target_var === 'discharge') {
                $scope.properties.amount = new_value;
                $scope.update_display(new_value);
            }
        }
    };

    $scope.$on('manhole', function(message, content){
        console.log('manhole popup');
        $scope.$apply(function() {
            $scope.properties = content.properties;
            $scope.update_percentage('discharge', $scope.properties.amount);
            $scope.update_display($scope.properties.amount);
        });
    });

    $scope.$on('manhole-close', function(message, value) {
        // TODO: remove active/blinking stuff from manhole
        console.log('manhole-close');
        // disable any bouncing icon
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    $scope.$on('keypress-1', function(message, value) {$scope.little();});
    $scope.$on('keypress-2', function(message, value) {$scope.much();});
    $scope.$on('keypress-enter', function(message, value) {$scope.save();});
}]);


angular.module("threedi-client")
  .controller("PumpStation", [
    "$scope", "state", "socket", "leaflet",
    function($scope, state, socket, leaflet_service){

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
        };
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
            var $layer = document.getElementsByClassName("workspace-wms-layer")[0];
            $scope.infourls = [
            {
                name: 'Water Level (downstream)',
                unit: '[m]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_b - 1) +
                        '&random=',
                next: 1
            },{
                name: 'Water Level (upstream)',
                unit: '[m]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_a - 1) +
                        '&random=',
                next: 2,
                previous: 0
            },
            {
                name: 'Discharge',
                unit: '[m3/s]',
                type: 'q',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 'q' +
                        "&SRS=EPSG:4326&messages=true&absolute=false&quad=" + (link_number - 1) +
                        '&random=',
                previous: 1
            }];
            $scope.selectedInfo = $scope.infourls[0];
        }
    };

    $scope.$on('pumpstation', function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            $scope.infourls = undefined;
            $scope.infoPumpStation(content, true);
            if ($scope.selectedInfo !== undefined) {
                $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
            }
        });
        $scope.counter = $scope.state.state.time_seconds;
    });

    $scope.$on('pumpstation-close', function(message, content) {
        // disable any bouncing icon
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    $scope.set_pump = function(){
        socket.emit('change_pumpstation',
            $scope.content.properties.sander_id,
            $scope.content.properties,
            function(){
                if (debug) {
                    console.log('emit change pumpstation');
                }
            }
        );
    };

    $scope.$on('serverState', function() {
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
    $scope.need_scrolling = function() {
        if (($scope.content) &&
            ($scope.content.properties.display_name) &&
            ($scope.content.properties.display_name.length > 25)) {
            return true;
        } else {
            return false;
        }
    }

}]);


angular.module("threedi-client")
  .controller("Weir", [
    "$scope", "state", "socket", "leaflet",
    function($scope, state, socket, leaflet_service){

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
        };
        if (leaflet_service.onedee_status.current_status.data.weirs === null) {
            // probably the simulation has not started yet.
            console.warn('simulation has not started yet');
            return false;
        };
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
            var $layer = document.getElementsByClassName("workspace-wms-layer")[0];
            $scope.infourls = [
            {
                name: 'Water Level (upstream)',
                unit: '[m MSL]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&absolute=true&messages=true&quad=" + (node_a - 1) +
                        '&random=',
                next: 1
            },
            {
                name: 'Water Level (downstream)',
                unit: '[m MSL]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&absolute=true&messages=true&quad=" + (node_b - 1) +
                        '&random=',
                next: 2,
                previous: 0
            },
            {
                name: 'Discharge',
                unit: '[m3/s]',
                type: 'q',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 'q' +
                        "&SRS=EPSG:4326&messages=true&absolute=false&quad=" + (link_number - 1) +
                        '&random=',
                previous: 1
            }];
            $scope.selectedInfo = $scope.infourls[0];
        }
    };

    $scope.$on('weir', function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            $scope.infourls = undefined;
            $scope.infoWeir(content, true);
            if ($scope.selectedInfo !== undefined) {
                $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
            }
        });
        $scope.counter = $scope.state.state.time_seconds;
    });

    $scope.$on('weir-close', function(message, content) {
        // disable any bouncing icon
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
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
                    console.log('emit a change of weir-ass-shiz')
                }
            }
        );
    }

    $scope.$on('serverState', function() {
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


angular.module("threedi-client")
  .controller("Culvert", [
    "$scope", "state", "socket", "leaflet",
    function($scope, state, socket, leaflet_service){

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
            var $layer = document.getElementsByClassName("workspace-wms-layer")[0];
            $scope.infourls = [
            {
                name: 'Water Level (upstream)',
                unit: '[m]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_a - 1) +
                        '&random=',
                next: 1
            },
            {
                name: 'Water Level (downstream)',
                unit: '[m]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_b - 1) +
                        '&random=',
                previous: 0,
                next: 2
            },
            {
                name: 'Discharge',
                unit: '[m3/s]',
                type: 'q',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 'q' +
                        "&SRS=EPSG:4326&messages=true&absolute=false&quad=" + (link_number - 1) +
                        '&random=',
                previous: 1
            }];
            $scope.selectedInfo = $scope.infourls[0];
        }

    };

    $scope.$on('culvert', function(message, content) {
        // This is already done in threedi-leaflet.js ?
        // var feature_id = '#' + content.properties.object_type + '-' + content.properties.sander_id;
        // if (state.master) {
        //     d3.select(feature_id).classed('selected-icon', true);
        //     // why a selection with d3?
        // }

        $scope.content = content;
        $scope.$apply(function() {
            $scope.infourls = undefined;
            $scope.infoCulvert(content, true);
            if ($scope.selectedInfo !== undefined) {
                $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
            }
        });
        $scope.counter = $scope.state.state.time_seconds;
    });

    $scope.$on('culvert-close', function(message, content) {
        // disable any bouncing icon
        console.log('culvert-close');
        // just because this isn't being done with jquery, doesn't
        // mean I don't feel the spirit of jquery here..
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    $scope.set_culvert = function () {
      socket.emit('change_culvert',
        $scope.content.properties.sander_id,
        $scope.content.properties,
        function () {
          console.log('emit a change of culvert');
        }
      );
    }

    $scope.$on('serverState', function() {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = $scope.state.state.time_seconds;
        $scope.infoCulvert($scope.content);
        if ($scope.selectedInfo !== undefined) {
            $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        }
    }, true);
}]);


angular.module("threedi-client")
  .controller("Orifice", ["$scope", "state", "socket", function($scope, state, socket){

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

    var infoOrifice = function(content, initial) {
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
        if ((state.state.running_sim == "1") || (initial === true)) {
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
            var $layer = document.getElementsByClassName("workspace-wms-layer")[0];
            $scope.infourls = [
            {
                name: 'Water Level (downstream)',
                unit: '[m MSL]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_a - 1) +
                        '&random=',
                next: 1
            },{
                name: 'Water Level (upstream)',
                unit: '[m MSL]',
                type: 's1',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + (node_b - 1) +
                        '&random=',
                next: 2,
                previous: 0
            },
            {
                name: 'Discharge',
                unit: '[m3/s]',
                type: 'q',
                url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ":" + 'q' +
                        "&SRS=EPSG:4326&messages=true&absolute=false&quad=" + (link_number - 1) +
                        '&random=',
                previous: 1
            }];
            $scope.selectedInfo = $scope.infourls[0];
        }
        console.log("left: " + node_a + ", right: " + node_b + ", link: " + link_number);
    };

    $scope.$on('orifice', function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            $scope.infourls = undefined;
            infoOrifice(content, true);
            $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
        });
    });

    $scope.$on('orifice-close', function(message, content) {
        // disable any bouncing icon
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    $scope.add = function(property_name, delta, minimum, maximum){
        console.log("orifice: add ", property_name, minimum, maximum);
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
        console.log("orifice " + $scope.content.properties.sander_id + " [" + property_name + "] = " + property_value);
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
            function(){
                if (debug) {
                    console.log('emit change orifice');
                }
            }
        );
    };

    $scope.$on('serverState', function() {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = state.state.time_seconds;
        infoOrifice($scope.content);
        $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
    }, true);
}]);

angular.module("threedi-client")
  .controller("StructureSettings", ["$scope", "state", "clientState", "$rootScope", "leaflet", "socket",
    function($scope, state, clientstate, $rootScope, leaflet, socket) {

    $scope.has_changes_not_applied = false;

    var intToYesNo = function(i) {
        if (i == 0) {
            return 'no';
        } else {
            return 'yes';
        }
    }

    // Read_more: https://en.wikipedia.org/wiki/Identity_function
    var noOp = function(i) {
        return i;
    }

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
                },
            ],
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
            },
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
        ],
    };

    $scope._params = function() {
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
    $scope.set = function() {
        var line_idx = $scope.content.properties
                       &&
                       $scope.content.properties.line_idx;
        if (line_idx) {
            var closed = $scope.content.properties.opened === 0;
            leaflet.set_onedee_flod_flou_by_index(line_idx, closed);
        }

        socket.emit("change_object",
            $scope.content.properties,
            function() {
                console.log('emit change_object: ', $scope.content.properties);
                $scope.has_changes_not_applied = false;
                //state.structure_has_changes_not_applied = true;
                if ($scope.close_after_apply) {
                    // close box
                    $scope.close_box();
                }
            }
        );
    };

}]);

/* click on the map OR click on a channel, node, sewerage-weir, sewerage-orifice */
angular.module("threedi-client")
  .controller("InfoPoint", ["$scope", "state", "clientState", "$rootScope", "leaflet", "socket",
    function($scope, state, clientstate, $rootScope, leaflet, socket) {

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
    // update clientstate.info_startingpoint accordingly as well
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

    var boxAwesome = document.getElementById("box-awesome");
    $scope.mouseOnBox = null;

    // In the boxes test this can be null.
    if (boxAwesome !== null) {
        boxAwesome.onmouseover = function(){
            $scope.mouseOnBox = true;
        };
        boxAwesome.onmouseout = function(){
            $scope.mouseOnBox = false;
        };
    } else {
        console.log("Something went wrong: boxAwesome is null");
    }

    $scope.stop = function(type_){
        socket.emit('stop_disturbance',
            type_,
            $scope.box.content.properties.unique_id,
            function () {
                console.log('stopped disturbance (@InfoPointCtrl)');
            });
        $scope.close_box();
    };

    $scope.updateSelectedUrl = function() {
        if ($scope.selectedInfo === undefined) {
            return;
        }
        if ($scope.selectedInfo.url === undefined) {
            return;
        }
        $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter; // trigger refresh
    };

    $scope.updateContentWithStatusUrl = function() {
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
            $scope.content.properties.display_name = "" + $scope.content.properties.obj_id;

        } else if (object_type === 'v2_discharge') {
            $scope.content.properties.amount = $scope.content.properties.data.amount;
            $scope.content.properties.duration_h = 3;
            // put the data on the same level for change_object
            $scope.content.properties.x = $scope.content.properties.data.x;
            $scope.content.properties.y = $scope.content.properties.data.y;
            // something for the GUI
            $scope.content.properties.display_name = "" + $scope.content.properties.obj_id;
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
                console.log("Fetching actual status data for " + object_type + "...");
                $.get($scope.content.status_url, function(data) {
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
                console.log("Fetching actual status data for " + object_type + "...");
                $.get($scope.content.status_url, function(data) {
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
                console.log("Fetching actual status data for " + object_type + "...");
                $.get($scope.content.status_url, function(data) {
                    switch (data.kcu) {
                        case 55:
                            $scope.content.properties.breached = 0;
                            break;
                        case 56:
                            $scope.content.properties.breached = 1;
                            break;
                        default:
                            console.log(
                                "Warning: Unknown kcu for breach. kcu=", data.kcu);
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
            clientstate.info_startingpoint = id;
        }
        if (id > 0) {
            $scope.selectedInfo.previous = id - 1;
            clientstate.info_startingpoint = id;
        }
        $scope.selectedUrl = $scope.selectedInfo.url;
        $scope.show_settings = false;
    };

    // enable the settings screen with possibility to go to the graphs view
    $scope.switch_settings = function() {
        // enable settings screen
        $scope.show_settings = true;
        // make it able to click <, > by faking a selection
        $scope.selectedInfo = {
            name: "Settings",
            previous: 0,
            next: 0
        };
    };

    // enable the settings screen with disabled arrows
    $scope.set_settings_no_graphs = function() {
        $scope.show_settings = true;
        $scope.selectedInfo = {
            name: "Settings"
        };
    };

    var addNextPreviousAttr = function(obj_arr) {
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

    var removeUndefined = function(obj_arr) {
        /* remove an element if it is either undefined or the boolean false */
        return obj_arr.filter(function(elm) {
            return ((typeof elm !== 'undefined') && (elm !== false));
        });
    };

    var getTsFlowVelocity = function (layer, link_number, meta_data) {
        var result = {
            name: 'Flow Velocity',
            unit: '[m/s]',
            type: 'unorm',
            url: layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    "/data?REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ":unorm" +
                    "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + link_number + '&random=',
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
                    "/data?REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ":q" +
                    "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + link_number + '&random=',
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
                    "/data?REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ":q_pump" +
                    "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + idx + '&random=',
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
                     '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ":s1" +
                     "&SRS=EPSG:4326&messages=true&absolute=true&quad=" + flowelem_index + '&random=',
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
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ':' + 's1' +
            "&SRS=EPSG:4326&messages=true&QUAD=" + idx +
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
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ':' + 'breach_depth' +
            "&SRS=EPSG:4326&QUAD=" + idx +
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
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ':' + 'breach_width' +
            "&SRS=EPSG:4326&QUAD=" + idx +
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
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ':' + 'au' +
            "&SRS=EPSG:4326&QUAD=" + idx +
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
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + $scope.state.state.loaded_model + ':' + 's1' +
            "&SRS=EPSG:4326&messages=true&absolute=false&freeboard=true&QUAD=" + idx +
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

    var infoPoint = function(content) {
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
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
                    content.condition = "Boundary Condition: " + content.properties.condition;
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
                    clientstate.features.gui_infonode && {
                        name: 'Depth',
                        unit: '[m]',
                        type: 's1',
                        url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ':' + 's1' +
                        "&SRS=EPSG:4326&messages=true&QUAD=" + nod_idx1 +
                        '&random=',
                        meta: content.properties.meta
                    },
                    clientstate.features.gui_infonode && {
                        name: 'Water Level',
                        type: 's1',
                        unit: '[m MSL]',
                        url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                        '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ':' + 's1' +
                        "&SRS=EPSG:4326&messages=true&absolute=true&QUAD=" + nod_idx1 +
                        '&random=',
                        meta: content.properties.meta
                    },
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
                clientstate.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
                clientstate.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta),
                clientstate.features.gui_infonode && has_1d2d && getTsFreeBoard($layer, node_idx, content.properties.meta)
            ];
        } else if (content.contenttype === 'v2_connection_nodes') {
            var node_idx = content.properties.node_idx;
            infourls = [
                clientstate.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
                clientstate.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta),
            ];
        } else if (content.contenttype === 'v2_node') {
            // added calculation node
            var node_idx = content.properties.node_idx;
            infourls = [
                clientstate.features.gui_infonode && getTsDepth($layer, node_idx, content.properties.meta),
                clientstate.features.gui_infonode && getTsWaterLevel($layer, node_idx, content.properties.meta)
            ];
        } else if (content.contenttype === 'map_info') {
            // default, click on map
            var lonlat = content.point;
            infourls = [
                clientstate.features.gui_infopoint_depth && {
                    name: 'Depth',
                    unit: '[m]',
                    type: 's1',
                    url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ':' + 's1' +
                    "&SRS=EPSG:4326&messages=true&POINT=" + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random=',
                },
                clientstate.features.gui_infopoint_waterlevel && {
                    name: 'Water Level',
                    type: 's1',
                    unit: '[m MSL]',
                    url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ':' + 's1' +
                    "&SRS=EPSG:4326&messages=true&absolute=true&POINT=" + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random=',
                },
                clientstate.features.gui_infopoint_groundwaterlevel && {
                    name: 'Ground Water Level',
                    type: 'sg',
                    unit: '[m MSL]',
                    url: $layer.dataset['workspaceWmsUrl'].split('/wms')[0] +
                    '/data?' + "REQUEST=gettimeseries&LAYERS=" + state.state.loaded_model + ':' + 'sg' +
                    "&SRS=EPSG:4326&messages=true&POINT=" + lonlat.lng.toString() + ',' + lonlat.lat.toString() +
                    '&random=',
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
        if (clientstate.info_startingpoint > $scope.infourls.length - 1) {
            // length can be 0 if you do not have graphs
            clientstate.info_startingpoint = Math.max($scope.infourls.length - 1, 0);
        }

        // selectedInfo is set in v2_rain_cloud, so do not overwrite!
        if (updateSelectedInfo) {
            $scope.selectedInfo = $scope.infourls[clientstate.info_startingpoint];
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
    $scope.$on("infopoint", function(message, content) {
        $scope.content = content;
        $scope.updateContentWithStatusUrl();
        if (content.hasOwnProperty('close_after_apply') && content.close_after_apply) {
            $scope.close_after_apply = true;
        } else {
            $scope.close_after_apply = false;
        }
        $scope.$apply(function() {
            infoPoint(content);
        });
    });

    // Remove channel highlight/infopoint when box is closed.
    $scope.$on('infopoint-close', function(message, value) {
        leaflet.removeChannelMarker();
        leaflet.removeInfoMarker();
        $scope.content = null;
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    /* Keep the graph updated */
    $scope.$on('serverState', function() {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        $scope.counter = state.state.time_seconds;
        $scope.updateSelectedUrl();
        if (state.state.state === "sim") {
            // only during a running simulation, or it looks like a users input
            // is ignored because it is overwritten by the servers current value
            $scope.updateContentWithStatusUrl();
        }

        // if (($scope.selectedUrl !== '') && ($scope.selectedUrl !== undefined)) {
        //     $scope.selectedUrl = $scope.selectedInfo.url + $scope.counter;
        // }
    }, true);

    // check if we need scrolling for the pumpstation display_name
    $scope.need_scrolling = function() {
        return $scope.content
               &&
               $scope.content.properties.display_name
               &&
               $scope.content.properties.display_name.length > 10;
    };
}]);


angular.module("threedi-client")
  .controller("InfoLine", ["$scope", "state", "leaflet", function($scope, state, leaflet) {
    $scope.content = null;
    $scope.state = state;

    var infoLine = function(content) {
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        var url = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data';
        var linestring = 'LINESTRING+(' + content.firstpoint.lng.toString() + '+' + content.firstpoint.lat.toString() + '%2C' +
                    content.endpoint.lng.toString() + '+' + content.endpoint.lat.toString() + ')';
        var requestData = 'request=getprofile&srs=epsg:4326&messages=true&interpolate=' + content.interpolate + '&layers=' +
                        state.state.loaded_model + '&line=' + linestring + '&time=' + state.state.timestep_calc;
        $scope.infourl = url +'?' + requestData;
        $scope.unit = '[m MSL]';
    };

    $scope.$on("infoline", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            infoLine(content);
        });
    });

    $scope.$on('infoline-close', function(message, value) {
        //$scope.infourl = "";  // this is picked up by nxt-graph, it deletes the currect chart
        leaflet.removeLineMarker();
        // disable any bouncing icon
        d3.selectAll(".leaflet-clickable").classed("selected-icon", false);
    });

    $scope.$on('serverState', function() {
        // Update on server update
        if ($scope.content === null) {return;}
        infoLine($scope.content);
    });
}]);
