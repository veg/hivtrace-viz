const d3 = require("d3");
const _ = require("underscore");
const helpers = require("./helpers.js");

const hivtrace_generate_svg_polygon_lookup = {};

_.range(3, 20).forEach((d) => {
  const angle_step = (Math.PI * 2) / d;
  hivtrace_generate_svg_polygon_lookup[d] = _.range(1, d).map((i) => [
    Math.cos(angle_step * i),
    Math.sin(angle_step * i),
  ]);
});

const hivtrace_generate_svg_ellipse = function () {
  const self = this;

  self.ellipse = function () {
    return `M ${self.radius} 0 A ${self.radius} ${self.radius * 0.75} 0 1 0 ${self.radius} 0.00001`;
  };

  self.ellipse.type = function () {
    return self.ellipse;
  };

  self.ellipse.size = function (attr) {
    if (_.isNumber(attr)) {
      self.size = attr;
      self.radius = Math.sqrt((1.25 * attr) / Math.PI);
      return self.ellipse;
    }
    return self.size;
  };

  self.ellipse.size(64);
  return self.ellipse;
};

/**
 * Creates and returns an SVG polygon generator.
 */
function hivtrace_generate_svg_polygon() {
  const self = this;

  self.polygon = function () {
    let path = ` M${self.radius} 0`;

    if (self.sides in hivtrace_generate_svg_polygon_lookup) {
      path += hivtrace_generate_svg_polygon_lookup[self.sides]
        .map((value) => ` L${self.radius * value[0]} ${self.radius * value[1]}`)
        .join(" ");
    } else {
      const angle_step = (Math.PI * 2) / self.sides;
      let current_angle = 0;
      for (let i = 0; i < self.sides - 1; i++) {
        current_angle += angle_step;
        path += ` L${self.radius * Math.cos(current_angle)} ${self.radius * Math.sin(current_angle)}`;
      }
    }

    path += " Z";
    return path;
  };

  self.polygon.sides = function (attr) {
    if (_.isNumber(attr) && attr > 2) {
      self.sides = attr;
      return self.polygon;
    }
    return self.sides;
  };

  self.polygon.type = function () {
    return self.polygon;
  };

  self.polygon.size = function (attr) {
    if (_.isNumber(attr)) {
      self.size = attr;
      self.radius = Math.sqrt(attr / Math.PI);
      return self.polygon;
    }
    return self.size;
  };

  self.polygon.size(64);
  self.sides = 6;
  return self.polygon;
}

/**
 * Generates an SVG symbol based on the specified type.
 */
function hivtrace_generate_svg_symbol(type) {
  switch (type) {
    case "circle":
    case "cross":
    case "diamond":
    case "square":
    case "triangle-down":
    case "triangle-up":
      return d3.svg.symbol().type(type);
    case "triangle":
      return new hivtrace_generate_svg_polygon().sides(3);
    case "pentagon":
      return new hivtrace_generate_svg_polygon().sides(5);
    case "hexagon":
      return new hivtrace_generate_svg_polygon().sides(6);
    case "septagon":
      return new hivtrace_generate_svg_polygon().sides(7);
    case "octagon":
      return new hivtrace_generate_svg_polygon().sides(8);
    case "ellipse":
      return new hivtrace_generate_svg_ellipse();
    default:
      return d3.svg.symbol().type("circle");
  }
}

/**
 * Computes the degree of each node in a graph.
 */
function hivtrace_compute_node_degrees(obj) {
  const nodes = obj.Nodes;
  const edges = obj.Edges;

  Object.values(nodes).forEach((n) => {
    n.degree = 0;
  });

  edges.forEach((e) => {
    if (nodes[e.source]) nodes[e.source].degree++;
    if (nodes[e.target]) nodes[e.target].degree++;
  });
}

/**
 * Creates a download button for exporting table data to a text file.
 */
function hiv_trace_export_table_to_text(
  parent_id,
  table_id,
  csv,
  file_name_placeholder
) {
  let the_button = d3.select(parent_id);
  the_button.selectAll("[data-type='download-button']").remove();

  the_button = the_button
    .append("a")
    .attr("target", "_blank")
    .attr("data-type", "download-button")
    .on("click", function () {
      d3.event.preventDefault();
      const table_tag = d3.select(this).attr("data-table");
      const table_text = helpers.table_to_text(table_tag, csv ? "," : "\t");
      const fileName = (file_name_placeholder || table_tag.substring(1)) + (csv ? ".csv" : ".tsv");
      helpers.export_handler(
        table_text,
        fileName,
        csv ? "text/comma-separated-values" : "text/tab-separated-values"
      );
    })
    .attr("data-table", table_id);

  the_button.append("i").classed("fa fa-download fa-2x", true);
  return the_button;
}

/**
 * Generates a time series visualization for a cluster of interest (COI).
 */
function hivtrace_coi_timeseries(cluster, element, plot_width = 1000) {
  const margin = { top: 30, right: 60, bottom: 10, left: 120 };
  const formatTime = d3.time.format("%Y-%m-%d");
  const data = _.sortBy(
    cluster.node_info.map((d) => [d[0], formatTime.parse(d[1])]),
    (d) => d[1]
  );
  const barHeight = 15;
  const height = Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;
  const events = Object.keys(cluster.event_info).map((i) => [i, formatTime.parse(i)]);
  const x_range = d3.extent([...data.map((d) => d[1]), ...events.map((d) => d[1])]);

  const x = d3.time.scale().domain(x_range).rangeRound([margin.left, plot_width - margin.right]);
  const y = d3.scale.ordinal().domain(d3.range(data.length + 1)).rangeRoundPoints([margin.top, height - margin.bottom], 0.1);

  const x_axis_object = d3.svg.axis().scale(x).orient("top").ticks(plot_width / 80).tickFormat(d3.time.format("%m/%y"));

  element.selectAll("svg").remove();
  const svg = element.append("svg").attr("width", plot_width).attr("height", height).attr("viewBox", [0, 0, plot_width, height]);

  svg.append("g").attr("transform", `translate(0,${0.6 * margin.top})`).attr("class", "y time_axis").call(x_axis_object).call((g) => g.select(".domain").remove());

  svg.append("g").attr("stroke", "#ddd").attr("stroke-width", 2).attr("opacity", 0.8).selectAll("line").data(events).enter().append("line")
    .attr("x1", (d) => x(d[1])).attr("x2", (d) => x(d[1])).attr("y1", () => y(0)).attr("y2", () => y(data.length));

  const lines = svg.append("g").selectAll("line").data(data).enter().append("line")
    .attr("stroke", "#aaa").attr("stroke-width", 2).attr("x1", () => x(x_range[1])).attr("x2", (d) => x(d[1])).attr("y1", (d, i) => y(i)).attr("y2", (d, i) => y(i));

  let time_boxes = [null, null];
  let highlight_nodes = new Set();
  const titles = [...data, ["Nat'l priority", x_range[0]]];
  const text_labels = svg.append("g").attr("font-family", "sans-serif").attr("font-size", 10).attr("font-weight", 700).selectAll("text").data(titles).enter().append("text")
    .attr("text-anchor", "end").attr("x", (d) => x(d[1])).attr("y", (d, i) => y(i) + y.rangeBand() / 2).attr("dy", "0.35em").attr("dx", "-0.25em").attr("fill", "black").text((d) => d[0]);

  svg.append("g").selectAll("circle").data(data).enter().append("circle").attr("fill", "black").attr("stroke", "black").attr("cx", (d) => x(d[1])).attr("cy", (d, i) => y(i)).attr("r", 1);

  svg.append("g").selectAll("circle").data(events).enter().append("circle")
    .attr("fill", (d) => (_.some(cluster.event_info[d[0]].national_priority) ? "firebrick" : "steelblue"))
    .attr("stroke", "black").attr("cx", (d) => x(d[1])).attr("cy", () => y(data.length))
    .attr("r", (d) => 2 + Math.sqrt(d3.sum(cluster.event_info[d[0]].connected_componets)))
    .on("mouseover", (d) => {
      const ed = cluster.event_info[d[0]];
      ed.national_priority.forEach((isPriority, i) => {
        if (isPriority) ed.priority_nodes[i].forEach((n) => highlight_nodes.add(n));
      });
      const years_ago = [1, 3].map((ya) => {
        const some_years_ago = new Date(d[1]);
        some_years_ago.setFullYear(d[1].getFullYear() - ya);
        return some_years_ago < x_range[0] ? x_range[0] : some_years_ago;
      });
      const fills = ["firebrick", "grey"];
      time_boxes = years_ago.map((sya, i) => svg.append("g").selectAll("rect").data([d]).enter().append("rect").attr("fill", fills[i]).attr("x", () => x(sya)).attr("y", () => y(0)).attr("width", x(d[1]) - x(sya)).attr("height", y(data.length - 1) - y(0)).attr("opacity", 0.25));
      lines.attr("stroke-width", (d) => (highlight_nodes.has(d[0]) ? 5 : 2)).attr("stroke", (d) => (highlight_nodes.has(d[0]) ? "black" : "#aaa"));
      text_labels.attr("fill", (d) => (highlight_nodes.has(d[0]) ? "firebrick" : "black"));
    })
    .on("mouseout", () => {
      lines.attr("stroke-width", 2).attr("stroke", "#aaa");
      text_labels.attr("fill", "black");
      highlight_nodes = new Set();
      time_boxes.forEach((box) => box && box.remove());
      time_boxes = [null, null];
    })
    .append("title")
    .text((d) => {
      const ed = cluster.event_info[d[0]];
      let text = `${d[0]}. `;
      if (_.some(ed.national_priority)) text += "National priority clusterOI. ";
      text += `${d3.sum(ed.connected_componets)} nodes in ${ed.connected_componets.length} components. `;
      text += `A total of ${d3.sum(ed.priority_nodes, (d) => d.length)} nodes dx'ed in the previous 12 months; maximum of ${d3.max(ed.priority_nodes, (d) => d.length)} in a subcluster`;
      return text;
    });
}

/**
 * Performs a cluster traversal to identify completely connected clusters.
 */
function hivtrace_cluster_complete_clusters(nodes, edges, edge_filter) {
  const clusters = [];
  const adjacency = {};
  const by_node = {};

  nodes.forEach((n) => {
    n.visited = false;
    adjacency[n.id] = [];
  });

  const filteredEdges = edge_filter ? edges.filter(edge_filter) : edges;

  filteredEdges.forEach((e) => {
    if (!nodes[e.source] || !nodes[e.target]) {
      throw new Error(`Edge does not map to an existing node ${e.source} to ${e.target}`);
    }
    adjacency[nodes[e.source].id].push([nodes[e.target], e]);
    adjacency[nodes[e.target].id].push([nodes[e.source], e]);
  });

  const traverse = (node) => {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
    }
    node.visited = true;
    adjacency[node.id].forEach((neighbor) => {
      if (!neighbor[0].visited) {
        const currentCluster = clusters[by_node[node.id]];
        if (currentCluster.every((n) => adjacency[n.id].some((r) => r[0].id === neighbor[0].id))) {
          by_node[neighbor[0].id] = by_node[node.id];
          clusters[by_node[neighbor[0].id]].push(neighbor[0]);
          traverse(neighbor[0]);
        } else {
          traverse(neighbor[0]);
        }
      }
    });
  };

  nodes.forEach((n) => { if (!n.visited) traverse(n); });
  return clusters;
}

function hivtrace_compute_adjacency(nodes, edges, edge_filter) {
  const adjacency = {};
  edges.forEach((e) => {
    if (!edge_filter || edge_filter(e)) {
      const src = nodes[e.source];
      const tgt = nodes[e.target];
      if (!adjacency[src.id]) adjacency[src.id] = new Set();
      adjacency[src.id].add(tgt.id);
      if (!adjacency[tgt.id]) adjacency[tgt.id] = new Set();
      adjacency[tgt.id].add(src.id);
    }
  });
  return adjacency;
}

function hivtrace_compute_adjacency_with_edges(nodes, edges, edge_filter) {
  const adjacency = {};
  edges.forEach((e) => {
    if (!edge_filter || edge_filter(e)) {
      const src = nodes[e.source];
      const tgt = nodes[e.target];
      if (!adjacency[src.id]) adjacency[src.id] = [];
      adjacency[src.id].push([tgt, e]);
      if (!adjacency[tgt.id]) adjacency[tgt.id] = [];
      adjacency[tgt.id].push([src, e]);
    }
  });
  return adjacency;
}

/**
 * Performs a depth-wise traversal on a cluster of nodes.
 */
function hivtrace_cluster_depthwise_traversal(
  nodes,
  edges,
  edge_filter,
  save_edges,
  seed_nodes,
  white_list,
  given_adjacency
) {
  const clusters = [];
  const by_node = {};
  let adjacency = given_adjacency;

  if (!adjacency) {
    adjacency = {};
    nodes.forEach((n) => {
      n.visited = false;
      adjacency[n.id] = [];
    });

    let filteredEdges = edge_filter ? edges.filter(edge_filter) : edges;
    if (white_list) {
      filteredEdges = filteredEdges.filter((e) => white_list.has(nodes[e.source].id) && white_list.has(nodes[e.target].id));
    }

    filteredEdges.forEach((e) => {
      if (!nodes[e.source] || !nodes[e.target]) {
        throw new Error(`Edge does not map to an existing node ${e.source} to ${e.target}`);
      }
      adjacency[nodes[e.source].id].push([nodes[e.target], e]);
      adjacency[nodes[e.target].id].push([nodes[e.source], e]);
    });
  } else {
    nodes.forEach((n) => { n.visited = false; });
  }

  const traverse = (node) => {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
      if (save_edges) save_edges.push([]);
    }
    node.visited = true;

    const neighbors = adjacency[node.id] || [];
    let i = neighbors.length;
    while (i--) {
      const neighbor = neighbors[i];
      if (!neighbor[0].visited) {
        const clusterIdx = by_node[node.id];
        by_node[neighbor[0].id] = clusterIdx;
        clusters[clusterIdx].push(neighbor[0]);
        if (save_edges) save_edges[clusterIdx].push(neighbor[1]);
        traverse(neighbor[0]);
      }
    }
  };

  (seed_nodes || nodes).forEach((n) => { if (!n.visited) traverse(n); });
  return clusters;
}

function edge_typer(e, edge_types, T) {
  return edge_types[e.length <= T ? 0 : 1];
}

function random_id(alphabet = ["a", "b", "c", "d", "e", "f", "g"], length = 32) {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += _.sample(alphabet);
  }
  return s;
}

/**
 * Generates a plot visualizing cluster dynamics over time.
 */
function hivtrace_plot_cluster_dynamics(
  time_series,
  container,
  x_title,
  y_title,
  y_scale,
  bin_by,
  options = {
    base_line: 20,
    top: 40,
    right: 30,
    bottom: 60,
    left: 100,
    font_size: 18,
    rect_size: 22,
    width: 1024,
    height: 600,
  }
) {
  const filteredTimeSeries = time_series.filter((ts) => _.isDate(ts.time));
  if (filteredTimeSeries.length === 0) return;

  const do_barchart = options.barchart;
  const skip_cumulative = options.skip_cumulative || do_barchart;
  const width = options.width - options.left - options.right;
  const height = options.height - options.top - options.bottom;
  let min_diff;

  if (!bin_by) {
    bin_by = (date) => {
      const year = date.getFullYear();
      const nearest_quarter = new Date(year, Math.floor(date.getMonth() / 3) * 3, 1, 0, 0, 0);
      const mid_point = new Date(year, Math.floor(date.getMonth() / 3) * 3 + 1, 15, 0, 0, 0);
      return [`Q${Math.floor(date.getMonth() / 3) + 1} ${year}`, nearest_quarter, mid_point];
    };
    min_diff = new Date(2018, 3, 0) - new Date(2018, 0, 0);
  }

  const x_tick_format = options["x-tick-format"] || ((d) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`);

  const x = d3.time.scale().range([0, width]);
  const y = y_scale || d3.scale.linear().rangeRound([height, 0]);
  if (y_scale) y.range([height, 0]);

  const xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.month, 3).tickFormat(d3.time.format("%m/%Y"));
  if (x_tick_format) xAxis.tickFormat(x_tick_format);

  const yAxis = d3.svg.axis().scale(y).orient("left").tickFormat((v) => (Number.isInteger(v) ? v : null));

  const binned = {};
  const values_by_attribute = {};
  const total_id = "total";
  const total_color = "#555555";
  const prefix = options.prefix || "";
  let max_bin = 0;

  filteredTimeSeries.forEach((point, index) => {
    const [binTag, binStart, binMid] = bin_by(point.time);
    if (!binned[binTag]) {
      binned[binTag] = { time: binStart, x: binMid, [total_id]: 0 };
      Object.keys(point).forEach((k) => { if (k !== "time") binned[binTag][k] = {}; });
    }
    binned[binTag][total_id]++;
    max_bin = Math.max(max_bin, binned[binTag][total_id]);

    const yVal = { [total_id]: index + 1 };
    Object.entries(point).forEach(([k, v]) => {
      if (k !== "time") {
        binned[binTag][k][v] = (binned[binTag][k][v] || 0) + 1;
        if (!values_by_attribute[k]) values_by_attribute[k] = {};
        values_by_attribute[k][v] = (values_by_attribute[k][v] || 0) + 1;
        max_bin = Math.max(max_bin, binned[binTag][k][v]);
        yVal[k] = { ...values_by_attribute[k] };
      }
    });
    point.y = yVal;
    point._bin = binStart;
  });

  const binned_array = Object.entries(binned).map(([k, v]) => ({ ...v, id: k }));
  binned_array.sort((a, b) => b.time - a.time);

  if (do_barchart) {
    if (min_diff === undefined) {
      for (let i = 1; i < binned_array.length; i++) {
        min_diff = Math.min(min_diff || Infinity, Math.abs(binned_array[i].time - binned_array[i - 1].time));
      }
    }
    min_diff *= 0.8;
  }

  let min_x = d3.min(filteredTimeSeries, (d) => (d.time < d._bin ? d.time : d._bin));
  let max_x = d3.max(filteredTimeSeries, (d) => (d.time > d._bin ? d.time : d._bin));

  if (do_barchart) {
    max_x = new Date(max_x.getTime() + min_diff);
    min_x = new Date(min_x.getTime() - min_diff);
  }

  const quarter_span = Math.floor((max_x - min_x) / 3600 / 24 / 1000 / 30);
  if (quarter_span > 8) xAxis.ticks(d3.time.month, 3 * Math.ceil(quarter_span / 8));

  x.domain([min_x, max_x]).clamp(true);
  y.domain([0, Math.round(skip_cumulative ? max_bin + 1 : filteredTimeSeries.length * 1.2)]).clamp(true);

  container.selectAll("*").remove();
  const svg = container.append("g").attr("transform", `translate(${options.left},${options.top})`);
  const legend_area = container.append("g").attr("transform", `translate(${options.left + options.font_size * 2.5},${options.top + options.font_size})`);

  const y_key = Object.keys(values_by_attribute)[0];
  let color_scale = options.colorizer && options.colorizer[y_key] ? options.colorizer[y_key] : d3.scale.category10();
  const originalColorScale = color_scale;
  color_scale = (arg) => (arg === total_id ? total_color : originalColorScale(arg));

  const plot_types = Object.keys(values_by_attribute[y_key] || {});
  if (!do_barchart || plot_types.length === 0) plot_types.push(total_id);
  plot_types.sort();

  if (options.drag) {
    const drag = d3.behavior.drag().on("drag", function () {
      options.drag.x += d3.event.dx;
      options.drag.y += d3.event.dy;
      d3.select(this).attr("transform", `translate(${options.drag.x},${options.drag.y})`);
    });
    container.call(drag);
  }

  const opacity_toggle = (tag, on_off) => {
    if (do_barchart) {
      d3.selectAll(`[data-plotid="${tag}"]`).style("stroke-width", on_off ? 4 : 1);
    } else {
      d3.selectAll(`[data-plotid="${tag}"]`).style("fill-opacity", on_off ? 0.5 : 0.1);
    }
    d3.selectAll(`[data-curveid="${tag}"]`).style("stroke-width", on_off ? 3 : 1);
  };

  if (!do_barchart || plot_types.length > 1 || plot_types[0] !== total_id) {
    const legend_lines = legend_area.selectAll("g").data(plot_types);
    legend_lines.enter().append("g").attr("class", "annotation-text");
    legend_lines.append("text")
      .attr("transform", (d, i) => `translate(${options.rect_size},${options.rect_size * (plot_types.length - 1 - i) - (options.rect_size - options.font_size)})`)
      .attr("dx", "0.2em").style("font-size", options.font_size).text((d) => d)
      .on("mouseover", (d) => opacity_toggle(prefix + d, true))
      .on("mouseout", (d) => opacity_toggle(prefix + d, false));
    legend_lines.append("rect")
      .attr("x", 0).attr("y", (d, i) => options.rect_size * (plot_types.length - 2 - i))
      .attr("width", options.rect_size).attr("height", options.rect_size).attr("class", "area")
      .style("fill", (d) => color_scale(d))
      .on("mouseover", (d) => opacity_toggle(prefix + d, true))
      .on("mouseout", (d) => opacity_toggle(prefix + d, false));
  }

  const lastPoint = { ...filteredTimeSeries[filteredTimeSeries.length - 1], time: x.domain()[1] };
  filteredTimeSeries.push(lastPoint);

  plot_types.forEach((plot_key) => {
    const plot_color = color_scale(plot_key);
    const y_accessor = (d) => (d.y[plot_key] !== undefined ? d.y[plot_key] : (d.y[y_key] && d.y[y_key][plot_key] !== undefined ? d.y[y_key][plot_key] : 0));
    const bin_accessor = (d) => (y_key && d[y_key] && d[y_key][plot_key] !== undefined ? d[y_key][plot_key] : (d[plot_key] !== undefined ? d[plot_key] : 0));

    if (!skip_cumulative) {
      const curve = d3.svg.area().x((d) => x(d.time)).y1((d) => y(y_accessor(d))).y0(() => y(0)).interpolate("step");
      svg.append("path").datum(filteredTimeSeries).classed("trend", true).style("fill", plot_color).style("stroke", plot_color).attr("d", curve).attr("data-plotid", prefix + plot_key);
    }

    if (do_barchart) {
      binned_array.forEach((d) => {
        const xc = x(new Date(d.time.getTime() - min_diff * 0.5));
        const w = x(new Date(d.time.getTime() + min_diff * 0.5)) - xc;
        const last_y = d.last_y || 0;
        const new_y = bin_accessor(d);
        svg.append("rect").attr("x", xc).attr("y", y(last_y + new_y)).attr("height", y(0) - y(new_y)).attr("width", w).attr("data-plotid", prefix + plot_key).classed("tracer", true).style("fill", plot_color).style("stroke", d3.rgb(plot_color).darker(2)).style("fill-opacity", 1).append("title").text(`${plot_key} ${new_y} cases in ${x_tick_format ? x_tick_format(d.time) : d.time}`);
        d.last_y = last_y + new_y;
      });
    } else {
      binned_array.forEach((d) => {
        svg.append("circle").attr("cx", x(d.time)).attr("cy", y(bin_accessor(d))).attr("r", "5").classed("node", true).style("fill", plot_color).style("stroke", plot_color).attr("title", `${plot_key} : ${bin_accessor(d)}`);
      });
      const curve_year = d3.svg.line().x((d) => x(d.time)).y((d) => y(bin_accessor(d))).interpolate("cardinal");
      svg.append("path").datum(binned_array).classed("tracer", true).style("stroke", plot_color).attr("d", curve_year).attr("data-curveid", prefix + plot_key);
    }
  });

  const x_axis = svg.append("g").attr("class", "x axis").attr("transform", `translate(0,${height})`).style("font-size", options.font_size).call(xAxis);
  x_axis.selectAll("text").attr("transform", "rotate(-45)").attr("dy", "0.9em").attr("dx", "-1.75em");
  x_axis.append("text").attr("x", width / 2).attr("dy", "3.5em").style("text-anchor", "middle").style("font-size", options.font_size * 1.5).text(x_title);

  svg.append("g").attr("class", "y axis").style("font-size", options.font_size).call(yAxis).append("text").style("font-size", options.font_size * 1.5).attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "-2em").style("text-anchor", "end").text(y_title);
}

function get_ui_element_selector_by_role(role, no_leading_space) {
  return `${no_leading_space ? "" : " "}[data-hivtrace-ui-role='${role}']`;
}

module.exports = {
  edge_typer,
  coi_timeseries: hivtrace_coi_timeseries,
  compute_node_degrees: hivtrace_compute_node_degrees,
  export_table_to_text: hiv_trace_export_table_to_text,
  symbol: hivtrace_generate_svg_symbol,
  cluster_dynamics: hivtrace_plot_cluster_dynamics,
  hivtrace_cluster_depthwise_traversal,
  random_id,
  get_ui_element_selector_by_role,
  hivtrace_cluster_complete_clusters,
  hivtrace_compute_adjacency,
  hivtrace_compute_adjacency_with_edges,
};
