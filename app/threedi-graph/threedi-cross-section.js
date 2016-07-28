const $ = require('jquery');

angular.module("threedi-graph")
.directive('threediCrossSection', function($http) {
  var busy = false;

  var link = function(scope, element, attrs) {
    var getData = function(url, fn, options){
      $.ajax({
        url: url,
        success: function(data) {
          var formatted = [{
            "key": "offset",
            "values": data.offset,
            "color": "#ffffff"
          },{
            "key": "groundwater_delta",
            "values": data.groundwater_delta,
            "color": "#2D8265"
          },{
            "key": "elevation",
            "values": data.bathymetry_delta,
            "color": "#2C9331"
          },{
            "key": "depth",
            "values": data.depth,
            "color": "LightSkyBlue"
          }];
          //console.log('formatte 1', formatted, data);
          // new graph and contents
          fn(formatted, data.summary, options);

          setTimeout(function() {
            requestAnimationFrame(function() {
              busy = false;
            });
          }, 600);
        },
        error: function (data) {
          var empty = [{
            "key": "offset",
            "values": [[0, 0], [1/111, 0]],
            "color": "#ffffff",
            "opacity": "0.5"
          },{
            "key": "groundwater_delta",
            "values": [[0, 0], [1/111, 0]],
            "color": "#2D8265",
            "opacity": "0.5"
          },{
            "key": "elevation",
            "values": [[0, 0], [1/111, 0]],
            "color": "#2C9331"
          },{
            "key": "depth",
            "values": [[0,0], [1/111, 0]],
            "color": "LightSkyBlue"
          }];

          fn(empty);
          setTimeout(function() {
            requestAnimationFrame(function() {
              busy = false;
            });
          }, 600);
        }
        });  // $.ajax
    };

    var svg;
    var addGraph = function(formatted, summary, options) {
      nv.addGraph(function() {
        // 2 * pi * r / 360 = 111 km per degrees, approximately
        var chart = nv.models.stackedAreaChart()
          .x(function(d) { return 111 * d[0]; })
          .y(function(d) { return d[1]; })
          .clipEdge(true)
          .tooltipContent(function(key, y, e, graph) {
            var header = (scope.title !== undefined) ? scope.title : key;
            if ((scope.unit !== undefined) &&
                (scope.unit !== '') &&
                (scope.unit !== null) ) {
              header = header + ' - ' + scope.unit;
            }
            var unit_x = 'km';
            return '<h3 class="graph-header">' + header + ' </h3>' +
            '<p>' + e + ' at ' + y + unit_x + ' </p>';
          });

        chart.xAxis
          .axisLabel('Distance (km)')
          .tickFormat(d3.format(',.2f'));

        chart.yAxis
          .axisLabel('Level (mMSL)')
          .tickFormat(d3.format(',.2f'));


        var minVal, maxVal, marginVal;
          if (summary !== undefined) {
            // Get summary data from threedi-wms?
            minVal = summary.minimum;
            maxVal = summary.maximum;
            marginVal = summary.margin;
          } else {
            console.log('Please update threedi-wms for a better experience...');
            // Old threedi-wms...
            minVal = d3.min(formatted[0].values, function(d) {return d[1];});

            //Try stacked.y0????

            // Maximum heights
            var sumArray = new Array(formatted[0].values.length);
            for (var i=0; i<formatted[0].values.length; i++) {
              sumArray[i] = (minVal +
                  formatted[1].values[i][1] +
                  formatted[2].values[i][1] +
                  formatted[3].values[i][1]);
            }
            maxVal = d3.max(sumArray);
            marginVal = 0.1 * (maxVal - minVal);
          }

        chart.yDomain([minVal, maxVal + marginVal]);


        chart.showControls(false);
        chart.showLegend(false);

        var height = 300;
        var width = 390;
        if (options && typeof options === 'object') {
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
            .attr('id', 'crossection')
            .attr("height", height)
            .attr("width", width);
        }

        svg
          .datum(formatted)
          .transition()
          .duration(500)
          .call(chart);

        nv.utils.windowResize(chart.update);
        scope.current_chart = chart;
        return chart;

      }, function() {
        // callback function of this graph
        d3.selectAll(".nv-area").on('click', function() {
          // currently we don't want it to do anything. zooming in on a part
          // does not make sense
        });
      });  // nv.addGraph
    };


    var set_null_on_selection = function(selection) {
      for (var o in selection.remove()) {
        o = null;
      }
    };

    scope.$watch('url', function (url) {
      if (busy) {
        // Only update if an old request is already finished
        return;
      }
     if (scope.current_chart !== null) {
        // Still experimental, these are other options we may have to use.
        // d3.selectAll('circle').remove();
        // d3.selectAll('path').remove();
        // d3.selectAll('svg').remove();
        // remove stuff so memory clears up a bit.
        // set_null_on_selection(d3.selectAll('svg g'));
        // set_null_on_selection(d3.selectAll('svg path'));

        // remove elements down up to prevent detached elements
        set_null_on_selection(d3.selectAll('svg g.nv-areaWrap path'));
        set_null_on_selection(d3.selectAll('svg g.nv-areaWrap'));
        set_null_on_selection(d3.selectAll('svg g.nv-axis'));
        set_null_on_selection(d3.selectAll('svg g.nv-stackedWrap'));
        set_null_on_selection(d3.selectAll('svg g.nv-scatterWrap'));
        set_null_on_selection(d3.selectAll('svg g.nv-legendWrap'));
        set_null_on_selection(d3.selectAll('svg g.nv-controlWrap'));
        set_null_on_selection(d3.selectAll('svg g.nv-wrap'));
        set_null_on_selection(d3.selectAll('svg g.nvd3'));

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

      if (url !== '') {
        busy = true;
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
