// linegraph that receive data from controller
// and don't update themselves
angular.module("threedi-graph")
.directive('lineGraphStatic', function() {

  var svg;
  var updateGraph =  function (data) {
    nv.addGraph(function() {
      var chart = nv.models.lineChart()
      .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
      .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
      .x(function (d) { return new Date(d[0]); })
      .y(function (d) { return d[1]; })
      .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
      .showYAxis(true)        //Show the y-axis
      .showXAxis(true)        //Show the x-axis
      ;

    chart.xAxis
      .tickFormat(function(d) { 
        return d3.time.format('%x')(new Date(d)); 
      });

    chart.yAxis     //Chart y-axis settings
      .axisLabel('Machines used')
      .tickFormat(d3.format('.02f'));

    svg
      .datum(data)
      .call(chart);

    nv.utils.windowResize(function() { chart.update(); });

    return chart;
    });
  };

  var link = function (scope, element) {
 
    svg = d3.select(element[0]).append('svg');

    scope.$watch('data', function () {
      updateGraph(scope.data);
    });

  };

  return {
    restrict: 'E',
    replace: true,
    scope: {
      'data': '=',
      'title': '@'
    },
    template: '<div class="graph-wrapper"></div>',
    link: link
  };
});


