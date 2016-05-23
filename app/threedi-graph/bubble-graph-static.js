// and don't update themselves
angular.module("threedi-graph")
.directive('bubbleGraphStatic', function() {

  var svg;
  var updateGraph =  function (data) {
    nv.addGraph(function() {
      var chart = nv.models.scatterChart()
      .showDistX(true)    //showDist, when true, will display those little distribution lines on the axis.
      .showDistY(true)
      .duration(350)
      .margin({left: 100, bottom: 70})  //Adjust chart margins to give the x-axis some breathing room.
      //.useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
      .x(function (d) { return new Date(d[0]); })
      .y(function (d) { return d[1]; })
      .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
      .showYAxis(true)        //Show the y-axis
      .showXAxis(true)        //Show the x-axis
      .color(d3.scale.category10().range());

    //Configure how the tooltip looks.
    chart.tooltipContent(function(key, date, value) {
      var acronym = '';
      // get first letter for each organisation
      key.split(' ').forEach(function (word) {acronym += word[0]; }); 
      return '<h5>' + acronym + '</h5>' + '<h5>' + value + '</h5>';
    });
    chart.xAxis
      .tickSize(10)
      .tickFormat(function(d) { 
        return d3.time.format('%Y/%m/%d-%H:%M')(new Date(d));
      });

    chart.yAxis     //Chart y-axis settings
      .axisLabel('Machines used')
      .tickFormat(d3.format('.02f'));

    chart.yDomain([0, 5]);

    var fixTicks = function () {
      var xTicks = d3.select('.nv-x.nv-axis > g').selectAll('g');
      xTicks
        .selectAll('text')
        .attr('transform', function(d,i,j) { return 'translate (-10, 25) rotate(-25 0,0)' }) ;
    };

    svg
      .datum(data)
      .call(chart)
      .call(fixTicks);

    chart.dispatch.on('renderEnd', fixTicks);

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
