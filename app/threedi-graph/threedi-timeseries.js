require('nvd3');

// create the directives as re-usable components
angular.module("threedi-graph")
.directive('threediTimeseries', function($http) {
  var busy = false;
  var readyForNext = null;


  var link = function(scope, element, attrs) {
    var svg;
    var getData = function(url, fn, options){
        $.ajax({
          url: url,
        success: function(data) {
          var formatted = [{
            "key": "timeseries",
            "values": data.timeseries
          }];
          fn(formatted, options);
          setTimeout(function() {
            busy = false;
          }, 600);  // wait a while before accepting new
        },
        error: function (data) {
          var empty = [{
            "key": "timeseries",
            "values": [[0, 0]]}];
          fn(empty);
          setTimeout(function() {
            busy = false;
          }, 600);  // wait a while before accepting new
        }
        });  // $.ajax
      };

      var xUnit = 'Time (hours)';
      var yUnit = 'Depth (m)';

      var getPrefix = function () {
        return (scope.title !== undefined) ? scope.title : key;
      };

      var updateUnit = function (unit, original, prefix) {
        if ((scope.unit !== undefined) &&
          (scope.unit !== '') &&
          (scope.unit !== null) ) {
          if (prefix) {
            return prefix + '' + unit;
          } else {
            return unit;
          }
        } else {
          return original;
        }
      };


      var addGraph = function(formatted, options) {
        nv.addGraph(function() {
          var chart = nv.models.lineChart()
            .defined(function(d) { return (d[1] !== null && !isNaN(d[1])); })
            .x(function(d) { return Date.parse(d[0]); })
            .y(function(d) { return d[1]; })
            .clipEdge(true)
            // .tooltipContent(function(key, y, e, graph) {
            //   prefix = getPrefix();
            //
            //   var header = updateUnit(scope.unit, yUnit, prefix);
            //   return '<h3 class="graph-header">' + header + ' </h3>' +
            //   '<p>' + e + ' at ' + y + ' </p>';
            // })
            .useVoronoi(false);


        var epoch = 0;
        try {
          // try to get the startdate.
          epoch = +Date.parse(formatted[0].values[0][0]);
        } catch(err) {
          throw new Error(err);
        }
        chart.xAxis
          .axisLabel(xUnit)
          .tickFormat(function(d) {
            var minutes = ((+d) - epoch)  / 1000 / 60;
            var minutes_mod = Math.floor(minutes % 60);
            if (minutes_mod < 10) {minutes_mod = '0' + minutes_mod;}
            return Math.floor(minutes / 60)+':'+minutes_mod;
          });

        chart.yAxis
          .axisLabel(function () {
            return updateUnit(scope.unit, yUnit);
          }())
          .tickFormat(d3.format(',.2f'));

        var yMin = d3.min(formatted[0].values, function(d) { return d[1]; });
        var yMax = d3.max(formatted[0].values, function(d) { return d[1]; });
        var yDelta = Math.abs(yMax - yMin);
        if (yDelta < 0.01) {
          yDelta = yDelta === 0 ? 0.01 : yDelta;
          chart.yDomain([yMin-yDelta*5, yMax+yDelta*5]);
        } else {
          chart.yDomain([yMin-yDelta*0.05/yDelta, yMax+yDelta*0.05/yDelta]);
        }
        chart.showLegend(false);

        var height = 300;
        var width = 390;
        if (options && (typeof options === 'object')) {
          if (options.hasOwnProperty('width')) {
            width = options.width;
          }
          if (options.hasOwnProperty('height')) {
            height = options.height;
          }
        }
        // if svg variable is undefined
        // create a svg element and add to
        // the directive element.
        if (!svg) {
         svg = d3.select(element.context)
          .append('svg')
          .attr('id', 'nv-chart')
          .attr("height", height)
          .attr("width", width);
        }

        svg
          .datum(formatted)
          .call(chart);

        nv.utils.windowResize(chart.update);
        scope.current_chart = chart;
        return chart;

        });  // nv.addGraph
      };

      scope.$watch('url', function (url) {
        if ((url !== '') ) {
          if (busy) {
            // We don't have time for it now, but later you want
            // the latest available graph.
            readyForNext = url;
            return;
          }

          if (scope.current_chart !== null) {
            scope.current_chart = null;

            window.nv.charts = {};
            window.nv.graphs = [];
            window.nv.logs = {};
            window.onresize = null;
          }



          var options = {};
          if (attrs.width && attrs.height) {
            options.width = parseInt(attrs.width);
            options.height = parseInt(attrs.height);
          }
          busy = true;
          // callback different if chart doesn't exist yet
          getData(url, addGraph, options);
        }
      });  // scope.watch
    };


  return {
    restrict: 'E',
    replace: true,
    scope: {
      'url': '@',
      'unit': '@',
      'title': '@'
    },
    template: '<div class="graph-wrapper"></div>',
    link: link
  };
});
