var d3 = require("d3"),
  _ = require("underscore");

function hivtrace_render_prevalence(
  data,
  w,
  h,
  id,
  x_title,
  y_title,
  y_scale,
  fractions,
  baseline
) {
  var base_line = baseline || 14;

  var container = d3.select(id);

  var margin = {
      top: base_line * 2,
      right: base_line * 1.5,
      bottom: 3 * base_line,
      left: 5 * base_line
    },
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom,
    font_size = baseline * 1.25,
    rect_size = font_size * 1.25;

  var x = d3.time.scale().range([0, width]);

  var y = y_scale ? y_scale : d3.scale.linear();

  y.range([height, 0]);

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom"); //.ticks (5, y.tickFormat(5, ".0f"));

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .ticks(8, fractions ? "p" : "f");

  x.domain(
    d3.extent(plot_data, function(d) {
      return d["x"];
    })
  ).clamp(true);

  var extents = d3.extent(plot_data, function(d) {
    return _.max(d["y"]);
  });

  var year_range = [
    plot_data[0]["x"].getFullYear(),
    plot_data[plot_data.length - 1]["x"].getFullYear()
  ];

  _.each(annual, function(v, year) {
    if (year >= year_range[0] && year <= year_range[1]) {
      var my_f = _.max(v, function(f) {
        return f[1] / (fractions ? 1 : f[0]);
      });
      extents[1] = Math.max(extents[1], my_f[1]);
    }
  });

  y.domain([0.0, extents[1] * 1.2]);

  var svg = container
    .append("svg") //.style("display", "table-cell")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  var legend_area = svg
    .append("g")
    .attr(
      "transform",
      "translate(" +
        (margin.left + font_size * 2.5) +
        "," +
        (margin.top + font_size) +
        ")"
    );

  svg = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  /* set the domain for the codons */

  var color_scale = d3.scale.category10();

  var plot_types = _.map(plot_data[0]["y"], function(v, k) {
    return k;
  });

  plot_types.sort();

  var legend_lines = legend_area.selectAll("g").data(plot_types);

  legend_lines
    .enter()
    .append("g")
    .attr("class", "annotation-text");

  legend_lines
    .selectAll("text")
    .data(function(d) {
      return [d];
    })
    .enter()
    .append("text")
    .attr("transform", function(d, i, j) {
      return (
        "translate(" +
        rect_size +
        "," +
        (rect_size * (plot_types.length - 1 - j) - (rect_size - font_size)) +
        ")"
      );
    })
    .attr("dx", "0.2em")
    .text(function(d) {
      return d;
    });

  //console.log (plot_data);

  legend_lines
    .selectAll("rect")
    .data(function(d) {
      return [d];
    })
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i, j) {
      return rect_size * (plot_types.length - 2 - j);
    })
    .attr("width", rect_size)
    .attr("height", rect_size)
    .attr("class", "area")
    .style("fill", function(d, i, j) {
      return color_scale(d);
    });

  _.each(plot_types, function(plot_key, idx) {
    var plot_color = color_scale(plot_key);

    var y_accessor = function(d) {
      return d["y"][plot_key];
    };
    var year_points = [];

    for (k = year_range[0]; k <= year_range[1]; k++) {
      if (k in annual) {
        fraction = annual[k][plot_key];
        fraction = fraction[1];
        year_points.push({ x: new Date(k, 7, 1), y: fraction });
      }
    }

    var scaler_per_year = 1000 * 60 * 60 * 24 * 365;

    var lf = linear_fit(
      year_points.map(function(d) {
        return [(d["x"] - x.domain()[0]) / scaler_per_year, d["y"]];
      })
    );

    /*var line = d3.svg.line()
                .x(function(d) { return x(d['x']); })
                .y(function(d) { return y(
                Math.max (0,(d['x'] - x.domain ()[0] )*lf["slope"]/scaler_per_year+lf["intercept"]))
                ; })
                .interpolate ("linear");*/

    var line = d3.svg
      .line()
      .x(function(d) {
        return x(d["x"]);
      })
      .y(function(d) {
        return y(d["y"]);
      })
      .interpolate("basis");

    svg
      .append("path")
      .datum(year_points)
      .classed("line", true)
      .style("stroke", plot_color)
      .attr("d", line);

    /*var curve_year = d3.svg.line()
                .x(function(d) { return x(d['x']); })
                .y(function(d) { return y(d['y']); })
                .interpolate ("basis");
        
               svg.append("path")
                  .datum(year_points)
                  .classed ("tracer", true)
                  .style ("stroke", plot_color)
                  .attr("d", curve_year); */

    year_points.forEach(function(d) {
      svg
        .append("circle")
        .attr("cx", x(d["x"]))
        .attr("cy", y(d["y"]))
        .attr("r", "5")
        .classed("node", true)
        .style("fill", plot_color)
        .style("stroke", plot_color);
    });

    year_points.forEach(function(d) {
      svg
        .append("text")
        .attr("x", x(d["x"]) + 5)
        .attr("y", y(d["y"]) + 5)
        .text(d["y"]) //.attr ("transform", "rotate (" + 30*(1 - 2*idx) + " " + x(d['x']) + " " + y(d['y']) + ")")
        .attr("dy", "" + (0.5 - idx) + "em");
    });

    var curve = d3.svg
      .area()
      .x(function(d) {
        return x(d["x"]);
      })
      .y1(function(d) {
        return y(y_accessor(d));
      })
      .y0(function(d) {
        return y(0);
      })
      .interpolate("line");

    svg
      .append("path")
      .datum(plot_data)
      .classed("trend", true)
      .style("fill", plot_color)
      .style("stroke", plot_color)
      .attr("d", curve);
  });

  /* x-axis */
  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("x", width)
    .attr("dy", "+2.5em")
    .style("text-anchor", "end")
    .text(x_title);

  /* y-axis*/
  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(y_title); // beta - alpha

  /* plot title */
  /*if (title) {
            svg.append("text").text(title).style("font-size", "24px").attr("dx", "2em").attr("dy", "-0.1em");
        }*/
}

exports.prevalence = hivtrace_render_prevalence;
