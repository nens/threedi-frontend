angular.module('threedi-client')
  .controller('InfoLine', ['$scope', 'state', 'leaflet', function ($scope, state, leaflet) {
    $scope.content = null;
    $scope.state = state;

    var infoLine = function (content) {
      var $layer = document.getElementsByClassName('workspace-wms-layer')[0];  // there is only one
      var url = $layer.dataset.workspaceWmsUrl.split('/wms')[0] + '/data';
      var linestring = 'LINESTRING+(' + content.firstpoint.lng.toString() + '+' + content.firstpoint.lat.toString() + '%2C' +
                    content.endpoint.lng.toString() + '+' + content.endpoint.lat.toString() + ')';
      var requestData = 'request=getprofile&srs=epsg:4326&messages=true&interpolate=' + content.interpolate + '&layers=' +
                        state.state.loaded_model + '&line=' + linestring + '&time=' + state.state.timestep_calc;
      $scope.infourl = url + '?' + requestData;
      $scope.unit = '[m MSL]';
    };

    $scope.$on('infoline', function (message, content) {
      $scope.content = content;
      $scope.$apply(function () {
        infoLine(content);
      });
    });

    $scope.$on('infoline-close', function (message, value) {
        // $scope.infourl = "";  // this is picked up by nxt-graph, it deletes the currect chart
      leaflet.removeLineMarker();
        // disable any bouncing icon
      d3.selectAll('.leaflet-clickable').classed('selected-icon', false);
    });

    $scope.$on('serverState', function () {
        // Update on server update
      if ($scope.content === null) {return;}
      infoLine($scope.content);
    });
  }]);
