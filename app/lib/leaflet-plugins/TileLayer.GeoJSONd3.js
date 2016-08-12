// code from https://gist.github.com/ZJONSSON/5529395
// this GeoJSOND3 generates one linestring per tile

// this GeoJSOND3 does show all line elements separately, which results in
// a large number (>10000) of linestrings. Animating these slows down
// performance considerably.
/* Experimental vector tile layer for Leaflet
 * Uses D3 to render GeoJSON; faster than Leaflet's native.
 * Originally by Ziggy Jonsson: http://bl.ocks.org/ZJONSSON/5602552
 * Reworked by Nelson Minar: http://bl.ocks.org/NelsonMinar/5624141
 *
 * Todo:
 *   Make this work even if <svg> isn't in the DOM yet
 *   Make this work for tile types that aren't FeatureCollection
 *   Match D3 idioms for .classed(), .style(), etc
 *   Work on allowing feature popups, etc.
 */

// const L = require('leaflet'); L should be global

L.TileLayer.GeoJSONd3 =  L.TileLayer.extend({
    onAdd : function(map) {
        this.map = map;
        L.TileLayer.prototype.onAdd.call(this,map);
        this._path = d3.geo.path().projection(function(d) {
            var point = map.latLngToLayerPoint(new L.LatLng(d[1],d[0]));
            return [point.x,point.y];
        });
        this.on("tileunload",function(d) {
            if (d.tile.xhr) d.tile.xhr.abort();
            if (d.tile.nodes) d.tile.nodes.remove();
            d.tile.nodes = null;
            d.tile.xhr = null;
        });
    },
    _loadTile : function(tile,tilePoint) {
        var self = this;
        this._adjustTilePoint(tilePoint);

        var svg = d3.select(document.body).select("svg");

        // Line-like structures (we do not want to process points here), e.g.: v2_breach is excluded).
        var LINE_STRUCTURES = [
            'culvert',
            'pumpstation',
            'weir',
            'orifice',
            'channel',
            'v2_pipe',
            'v2_weir',
            'v2_orifice',
            'v2_culvert',
            'v2_channel',
            'v2_pumpstation',
            'v2_levee'
        ];

        // Whitelist of clickable structures and objects. E.g., v2_levee from
        // LINE_STRUCTURES is not clickable.
        var CLICKABLE_STRUCTURES = [
            'culvert',
            'pumpstation',
            'weir',
            'orifice',
            'channel',
            'v2_pipe',
            'v2_weir',
            'v2_orifice',
            'v2_culvert',
            'v2_channel',
            'v2_pumpstation'
        ];

        if (!tile.nodes && !tile.xhr) {
            tile.xhr = d3.json(this.getTileUrl(tilePoint),
                    function(geoJson) {

                tile.xhr = null;
                tile.nodes = svg.append("g");
                var paths = tile.nodes.selectAll("path");

                // distinguish between channel paths and other paths like levee
                if (self.options.object_type &&
                   (self.options.object_type === 'channel' ||
                    self.options.object_type === 'twodee-line')) {
                    // create dashed array
                    paths
                        .data(geoJson.features.filter(function (d) {
                            // v2_pumpstation, v2_weir come as
                            // Point and as LineString
                            return (
                                (LINE_STRUCTURES.indexOf(d.properties.object_type) > -1) &&
                                (d.geometry.type === 'LineString'));
                        }))
                        .enter()
                        .append("path")
                        .attr("d", self._path)
                        // .attr("class", self.options.class + " clickable-channel")
                        .attr("class", function(d, i) {
                            var result = self.options.class;

                            if (CLICKABLE_STRUCTURES.indexOf(d.properties.object_type) > -1) {
                                result += ' clickable-channel';
                            }
                            // channels here are actually lines, which
                            // can be a channel, but also a pipe, a weir,
                            // an orifice or a pumpstation
                            switch (d.properties.object_type) {
                                /* match object_types for ThreediModel.model_type=='3di'*/
                                case 'culvert':
                                case 'pumpstation':
                                case 'weir':
                                case 'orifice':
                                    result += ' v1-point';
                                    break;
                                case 'channel':
                                    result += ' channel-default';
                                    break;

                                /* match object_types for ThreediModel.model_type=='3di-v2' */

                                case 'v2_pipe':
                                    switch (d.properties.props.sewerage_type) {
                                        case 1:  // RWA, blue
                                            result += ' v2_pipe v2_pipe_rwa';
                                            break;
                                        case 2:  // DWA, red
                                            result += ' v2_pipe v2_pipe_dwa';
                                            break;
                                        case 3:  // DWA, red
                                            result += ' v2_pipe v2_pipe_transport';
                                            break;
                                        case 0:  // mixed
                                            result += ' v2_pipe v2_pipe_combined';
                                            break;
                                        default:  // default
                                            console.log("unknown sewerage type");
                                            console.log(d.properties);
                                            result += ' v2_pipe';
                                            break;
                                    }
                                    break;
                                case 'v2_weir':
                                    result += ' v2_weir';
                                    break;
                                case 'v2_orifice':
                                    result += ' v2_orifice';
                                    break;
                                case 'v2_culvert':
                                    result += ' v2_culvert';
                                    break;
                                case 'v2_channel':
                                    result += ' v2_channel';
                                    break;
                                case 'v2_pumpstation':
                                    result += ' v2_pumpstation';
                                    break;
                                case 'v2_levee':
                                    // default setting, must match clientState service show_onedee.v2_levee
                                    result += ' v2_levee hide';
                                    break;

                                /* match anything, really */
                                default:
                                    console.log("unknown object type for geojson");
                                    console.log(d.properties);
                                    result += ' channel-default';
                                    break;
                            }
                            return result;
                        })
                        .style("stroke-dasharray", function(d, i) {
                            switch (d.properties.object_type) {
                                case 'v2_levee':
                                    return;  // no dash array
                                default:
                                    break;
                                }
                            var len = d3.select(this).node().getTotalLength();
                            var nr_of_particles = Math.floor(len/12.0);
                            nr_of_particles = nr_of_particles === 0 ? 1 : nr_of_particles;
                            var particle_distance = len/nr_of_particles;
                            var dash_array = '';
                            for (var i=0; i<nr_of_particles; i++) {
                                dash_array += '0.01,' + (particle_distance - 0.01);
                                if (i < (nr_of_particles - 1)) {
                                    dash_array += ',';
                                }
                            }
                            return dash_array;
                          })
                        .attr("id", self.options.identifier);

                    // this variable is to distinguish between 2d and 1d background channels
                    var twodee_extra_attr = (self.options.object_type === 'twodee-line') ? " twodee-line-bg" : "";

                    // Create background channel on top of channel.
                    paths
                        .data(geoJson.features.filter(function (d) {
                            return (LINE_STRUCTURES.indexOf(d.properties.object_type) > -1);
                        }))
                        .enter()
                        .append("path")
                        .attr("d", self._path)
                        .attr("class", function (d) {
                            var str = "background-channel" + twodee_extra_attr;
                            str += " background-channel-" + d.properties.object_type;
                            if (CLICKABLE_STRUCTURES.indexOf(d.properties.object_type) > -1) {
                                str += ' clickable-channel';
                            }
                            return str;
                        }).attr("id", function (d) {
                            return "background-line-" + d.properties.line_idx;
                        });
                    // Draw boundary rectangles in a hacky way
                    // For v2/sewerage this is done differently
                    paths
                        .data(geoJson.features.filter(function (d) {
                            return d.properties.hasOwnProperty('boundary');
                        }))
                        .enter()
                        .append("rect")
                        .attr("class", "boundary-point leaflet-clickable")
                        .attr("x", function(d) {
                            var path = self._path(d.properties.boundary);
                            // magic conversion to screen coordinates
                            // result looks like M505,162m0,4.5a4.5,4.5 0 1,1 0,-9a4.5,4.5 0 1,1 0,9z
                            // filter out 505 (x coordinate) and 162 (y coordinate)
                            var x_coordinate = parseInt(path.split("M")[1].split(",")[0])-5;
                            return x_coordinate;
                        })
                        .attr("y", function(d) {
                            var path = self._path(d.properties.boundary);
                            return parseInt(path.split("m")[0].split(",")[1])-5;
                        })
                        .attr("width", "10")
                        .attr("height", "10")
                        .attr("stroke-width", "2")
                        .style("stroke", "black")
                        .style("fill", "white");
                } else {
                    // for paths other than channel, e.g. levee
                    paths
                        .data(geoJson.features).enter()
                        .append("path")
                        .attr("d", self._path)
                        .attr("class", self.options.class);
                }
            });
        }
        // update administration
        this._tilesToLoad -= 1;
        if (this._tilesToLoad === 0) {
            this.fire('load');
        }
    }
});

// module.exports = L.TileLayer.GeoJSONd3;
