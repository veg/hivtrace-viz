var d3 = require("d3"),
  _ = require("underscore");

/**
 * Renders a histogram for a graph property and displays a descriptive label.

 * @param {Object} graph - An object containing graph data, including distribution and fitted data for the property.
 * @param {string} histogram_tag - The ID of the HTML element where the histogram will be rendered.
 * @param {string} histogram_label - The ID of the HTML element where the descriptive label will be displayed.

 * @returns {void}
 */

function hivtrace_histogram(graph, histogram_tag, histogram_label) {
  var defaultFloatFormat = d3.format(",.2f");
  var histogram_w = 300,
    histogram_h = 300;

  hivtrace_render_histogram(
    graph["Degrees"]["Distribution"],
    graph["Degrees"]["fitted"],
    histogram_w,
    histogram_h,
    histogram_tag
  );

  var label =
    "Network degree distribution is best described by the <strong>" +
    graph["Degrees"]["Model"] +
    "</strong> model, with &rho; of " +
    defaultFloatFormat(graph["Degrees"]["rho"]);

  if (graph["Degrees"]["rho CI"] !== undefined) {
    label +=
      " (95% CI " +
      defaultFloatFormat(graph["Degrees"]["rho CI"][0]) +
      " - " +
      defaultFloatFormat(graph["Degrees"]["rho CI"][1]) +
      ")";
  }

  d3.select(histogram_label).html(label);
}

/**
 * Renders a histogram for edge lengths (genetic distances) and displays a label.

 * @param {Object} graph - An object containing graph data, including edges.
 * @param {string} histogram_tag - The ID of the HTML element where the histogram will be rendered.
 * @param {string} histogram_label - The ID of the HTML element where the descriptive label will be displayed.

 * @returns {void}
*/

function hivtrace_histogram_distances(graph, histogram_tag, histogram_label) {
  var histogram_w = 300,
    histogram_h = 300;

  var edge_lengths = _.map(graph["Edges"], (edge) => edge.length);

  hivtrace_render_histogram_continuous(
    edge_lengths,
    histogram_w,
    histogram_h,
    histogram_tag
  );

  var label = __("statistics")["genetic_distances_among_linked_nodes"];
  d3.select(histogram_label).html(label);
}

/**
 * Renders a histogram for continuous data using D3.js.

 * @param {number[]} data - An array of numerical values.
 * @param {number} w - The width of the plot area.
 * @param {number} h - The height of the plot area.
 * @param {string} id - The ID of the HTML element where the histogram will be rendered.

 * @returns {void}
 */

function hivtrace_render_histogram_continuous(data, w, h, id) {
  var margin = {
      top: 10,
      right: 30,
      bottom: 50,
      left: 10,
    },
    width = w - margin.right,
    height = h - margin.top - margin.bottom;

  var histogram_svg = d3.select(id).selectAll("svg");

  if (histogram_svg) {
    histogram_svg.remove();
  }

  if (data.length > 0) {
    var histogram_data = d3.layout.histogram()(data);

    var x = d3.scale.linear().domain(d3.extent(data));
    var y_axis_label_width = 12;
    var x_axis_label_height = 18;

    var y = d3.scale
      .linear()
      .domain([0, d3.max(_.map(histogram_data, (b) => b.y))])
      .range([height, 0]);

    margin.left +=
      y_axis_label_width + 10 * Math.ceil(Math.log10(y.domain()[1]));
    margin.top += x_axis_label_height;
    width -= margin.left;
    x.range([0, width]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left");

    histogram_data.splice(0, 0, {
      x: x.domain()[0],
      y: 0,
      dx: 0,
    });
    histogram_data.splice(histogram_data.length, 0, {
      x: x.domain()[1],
      y: 0,
      dx: 0,
    });

    histogram_svg = d3
      .select(id)
      .insert("svg", ".histogram-label")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .datum(histogram_data);

    var histogram_line = d3.svg
      .line()
      .x((d) => x(d.x + d.dx))
      .y((d) => y(d.y))
      .interpolate("step-before");

    histogram_svg.selectAll("path").remove();
    histogram_svg
      .append("path")
      .attr("d", (d) => histogram_line(d) + "Z")
      .attr("class", "histogram");

    var x_axis = histogram_svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    x_axis
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .attr("dx", "1em")
      .attr("dy", "0.5em");

    var y_axis_label = histogram_svg // eslint-disable-line
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + y_axis_label_width)
      .attr("x", 0 - height / 2)
      .style("text-anchor", "middle")
      .text("Edges");

    var x_axis_label = histogram_svg // eslint-disable-line
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
      )
      .style("text-anchor", "middle")
      .text("Genetic Distance");

    var y_axis = histogram_svg // eslint-disable-line
      .append("g")
      .attr("class", "y axis")
      //.attr("transform", "translate(0," + height + ")")
      .call(yAxis);
  }
}

/**
 * Renders a histogram for discrete data using D3.js.

 * @param {number[]} counts - An array of counts for each category.
 * @param {number[]} [fit] (optional) - An array of fitted values for each category.
 * @param {number} w - The width of the plot area.
 * @param {number} h - The height of the plot area.
 * @param {string} id - The ID of the HTML element where the histogram will be rendered.

 * @returns {void}
 */

function hivtrace_render_histogram(counts, fit, w, h, id) {
  var margin = {
      top: 10,
      right: 30,
      bottom: 50,
      left: 30,
    },
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom;

  var x = d3.scale
    .linear()
    .domain([0, counts.length + 1])
    .range([0, width]);

  var y = d3.scale
    .log()
    .domain([1, d3.max(counts)])
    .range([height, 0]);

  var total = d3.sum(counts);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");

  var histogram_svg = d3.select(id).selectAll("svg");

  if (histogram_svg) {
    histogram_svg.remove();
  }

  var data_to_plot = counts.map((d, i) => ({
    x: i + 1,
    y: d + 1,
  }));
  data_to_plot.push({
    x: counts.length + 1,
    y: 1,
  });
  data_to_plot.push({
    x: 0,
    y: 1,
  });
  data_to_plot.push({
    x: 0,
    y: counts[0] + 1,
  });

  histogram_svg = d3
    .select(id)
    .insert("svg", ".histogram-label")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .datum(data_to_plot);

  var histogram_line = d3.svg
    .line()
    .x((d) => x(d.x))
    .y((d) => y(d.y))
    .interpolate("step-before");

  histogram_svg.selectAll("path").remove();
  histogram_svg
    .append("path")
    .attr("d", (d) => histogram_line(d) + "Z")
    .attr("class", "histogram");

  if (fit) {
    var fit_line = d3.svg
      .line()
      .interpolate("linear")
      .x((d, i) => x(i + 1) + (x(i + 1) - x(i)) / 2)
      .y((d) => y(1 + d * total));
    histogram_svg
      .append("path")
      .datum(fit)
      .attr("class", "line")
      .attr("d", (d) => fit_line(d));
  }

  var x_axis = histogram_svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  x_axis
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .attr("dx", "1em")
    .attr("dy", "0.5em");
}

exports.histogram = hivtrace_histogram;
exports.histogramDistances = hivtrace_histogram_distances;
