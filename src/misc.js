var d3 = require("d3"),
  _ = require("underscore"),
  helpers = require("./helpers.js");

var hivtrace_generate_svg_polygon_lookup = {};

_.each(_.range(3, 20), (d) => {
  var angle_step = (Math.PI * 2) / d;
  hivtrace_generate_svg_polygon_lookup[d] = _.map(_.range(1, d), (i) => [
    Math.cos(angle_step * i),
    Math.sin(angle_step * i),
  ]);
});

var hivtrace_generate_svg_ellipse = function () {
  var self = this;

  self.ellipse = function () {
    var path =
      "M " +
      self.radius +
      " 0 A " +
      self.radius * 1 +
      " " +
      self.radius * 0.75 +
      " 0 1 0 " +
      self.radius +
      " 0.00001";
    return path;
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
 *
 * @constructor
 * @returns {Object} An object with methods to generate and manipulate an SVG polygon.
 * @property {function} polygon - Generates the SVG path for the polygon.
 * @property {function} sides - Gets or sets the number of sides of the polygon.
 *   When called with a number > 2, sets the sides and returns the polygon generator.
 *   When called without arguments, returns the current number of sides.
 * @property {function} type - Returns the polygon generator function.
 * @property {function} size - Gets or sets the size of the polygon.
 *   When called with a number, sets the size and returns the polygon generator.
 *   When called without arguments, returns the current size.
 *
 * @example
 * const polygonGenerator = hivtrace_generate_svg_polygon();
 * const path = polygonGenerator();
 * polygonGenerator.sides(8);
 * polygonGenerator.size(100);
 *
 * @requires lodash
 * @requires hivtrace_generate_svg_polygon_lookup
 */

function hivtrace_generate_svg_polygon() {
  var self = this;

  self.polygon = function () {
    var path = " M" + self.radius + " 0";

    if (self.sides in hivtrace_generate_svg_polygon_lookup) {
      path += hivtrace_generate_svg_polygon_lookup[self.sides]
        .map(
          (value) =>
            " L" + self.radius * value[0] + " " + self.radius * value[1]
        )
        .join(" ");
    } else {
      var angle_step = (Math.PI * 2) / self.sides,
        current_angle = 0;
      for (let i = 0; i < self.sides - 1; i++) {
        current_angle += angle_step;
        path +=
          " L" +
          self.radius * Math.cos(current_angle) +
          " " +
          self.radius * Math.sin(current_angle);
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
 *
 * @param {string} type - The type of symbol to generate.
 *   Possible values are:
 *   - "circle"
 *   - "cross"
 *   - "diamond"
 *   - "square"
 *   - "triangle-down"
 *   - "triangle-up"
 *   - "triangle"
 *   - "pentagon"
 *   - "hexagon"
 *   - "septagon"
 *   - "octagon"
 *   - "ellipse"
 *
 * @returns {Object} A D3 symbol generator or a custom polygon/ellipse generator.
 *   - For "circle", "cross", "diamond", "square", "triangle-down", "triangle-up":
 *     Returns a D3 symbol generator of the specified type.
 *   - For "triangle", "pentagon", "hexagon", "septagon", "octagon":
 *     Returns a custom polygon generator with the specified number of sides.
 *   - For "ellipse":
 *     Returns a custom ellipse generator.
 *   - For any other input:
 *     Returns a D3 symbol generator of type "circle" as default.
 *
 * @requires d3
 * @requires hivtrace_generate_svg_polygon
 * @requires hivtrace_generate_svg_ellipse
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
 *
 * @param {Object} obj - The graph object containing nodes and edges.
 * @param {Object} obj.Nodes - An object representing the nodes of the graph.
 * @param {Object} obj.Edges - An object representing the edges of the graph.
 * @param {string} obj.Edges[].source - The source node of an edge.
 * @param {string} obj.Edges[].target - The target node of an edge.
 *
 * @description
 * This function modifies the input object by adding a 'degree' property to each node.
 * The degree of a node is the number of edges connected to it.
 *
 * @example
 * const graph = {
 *   Nodes: {
 *     "1": {},
 *     "2": {}
 *   },
 *   Edges: {
 *     "e1": { source: "1", target: "2" }
 *   }
 * };
 * hivtrace_compute_node_degrees(graph);
 * // graph.Nodes["1"].degree === 1
 * // graph.Nodes["2"].degree === 1
 */

function hivtrace_compute_node_degrees(obj) {
  var nodes = obj.Nodes,
    edges = obj.Edges;

  for (var n in nodes) {
    nodes[n].degree = 0;
  }

  for (var e in edges) {
    nodes[edges[e].source].degree++;
    nodes[edges[e].target].degree++;
  }
}

/**
 * Creates a download button for exporting table data to a text file.
 *
 * @param {string} parent_id - The selector for the parent element where the button will be appended.
 * @param {string} table_id - The selector for the table to be exported.
 * @param {boolean} csv - If true, exports as CSV; if false, exports as TSV.
 * @param {string} [file_name_placeholder] - The base name for the exported file. If not provided, it defaults to the table_id without the first character.
 * @returns {d3.Selection} The D3 selection of the created button.
 *
 * @requires d3
 * @requires helpers
 *
 * @description
 * This function creates a download button that, when clicked, exports the data from the specified table
 * as either a CSV or TSV file. It uses D3 for DOM manipulation and assumes the existence of a `helpers`
 * object with `table_to_text` and `export_handler` methods.
 *
 * @example
 * hiv_trace_export_table_to_text("#parent-div", "#data-table", true, "export-data");
 */

function hiv_trace_export_table_to_text(
  parent_id,
  table_id,
  csv,
  file_name_placeholder
) {
  var the_button = d3.select(parent_id);
  the_button.selectAll("[data-type='download-button']").remove();

  the_button = the_button
    .append("a")
    .attr("target", "_blank")
    .attr("data-type", "download-button")
    .on("click", function (data, element) {
      d3.event.preventDefault();
      var table_tag = d3.select(this).attr("data-table");
      var table_text = helpers.table_to_text(table_tag, csv ? "," : "\t");
      file_name_placeholder = file_name_placeholder || table_tag.substring(1);
      if (!csv) {
        helpers.export_handler(
          table_text,
          file_name_placeholder + ".tsv",
          "text/tab-separated-values"
        );
      } else {
        helpers.export_handler(
          table_text,
          file_name_placeholder + ".csv",
          "text/comma-separated-values"
        );
      }
    })
    .attr("data-table", table_id);

  the_button.append("i").classed("fa fa-download fa-2x", true);
  return the_button;
}

/**
 * Generates a time series visualization for a cluster of interest (COI).
 *
 * @param {Object} cluster - The cluster object containing node and event information.
 * @param {Object} cluster.node_info - Information about nodes in the cluster.
 * @param {Object} cluster.event_info - Information about events in the cluster.
 * @param {d3.Selection} element - The D3 selection of the element where the visualization will be rendered.
 * @param {number} [plot_width=1000] - The width of the plot in pixels.
 *
 * @description
 * This function creates a detailed time series visualization for a cluster of interest (COI).
 * It displays nodes and events over time, with interactive features for highlighting
 * and displaying additional information.
 *
 * The visualization includes:
 * - A time axis
 * - Lines representing nodes
 * - Circles representing events
 * - Interactive highlighting and tooltips
 * - Time range boxes for context
 *
 * @requires d3
 * @requires lodash
 *
 * @example
 * const cluster = {
 *   node_info: {...},
 *   event_info: {...}
 * };
 * const element = d3.select("#visualization-container");
 * hivtrace_coi_timeseries(cluster, element, 1200);
 */

function hivtrace_coi_timeseries(cluster, element, plot_width) {
  const margin = { top: 30, right: 60, bottom: 10, left: 120 };
  const formatTime = d3.time.format("%Y-%m-%d");
  let data = _.sortBy(
    _.map(cluster.node_info, (d) => [d[0], formatTime.parse(d[1])]),
    (d) => d[1]
  );
  const barHeight = 15;
  const height =
    Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;
  const events = _.map(cluster.event_info, (d, i) => [i, formatTime.parse(i)]);
  const x_range = d3.extent(
    _.map(data, (d) => d[1]).concat(_.map(events, (d) => d[1]))
  );

  plot_width = plot_width || 1000;

  let x = d3.time
    .scale()
    .domain(x_range)
    .rangeRound([margin.left, plot_width - margin.right]);

  let y = d3.scale
    .ordinal()
    .domain(d3.range(data.length + 1))
    .rangeRoundPoints([margin.top, height - margin.bottom], 0.1);

  let x_axis_object = d3.svg
    .axis()
    .scale(x)
    .orient("top")
    .ticks(plot_width / 80)
    .tickFormat(d3.time.format("%m/%y"));

  element.selectAll("svg").remove();

  const svg = element
    .append("svg")
    .attr("width", plot_width)
    .attr("height", height)
    .attr("viewBox", [0, 0, plot_width, height]);

  svg
    .append("g")
    .attr("transform", "translate(0," + 0.6 * margin.top + ")")
    .attr("class", "y time_axis")
    //.style ("shape-rendering","crispEdges").style ("font-family", "sans-serif").style ("font-size","8").style ("fill", "none").style("stroke","black")
    .call(x_axis_object)
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 2)
    .attr("opacity", 0.8)
    .selectAll("line")
    .data(events)
    .enter()
    .append("line")
    .attr("x1", (d) => x(d[1]))
    .attr("x2", (d) => x(d[1]))
    .attr("y1", (d, i) => y(0))
    .attr("y2", (d, i) => y(data.length));

  let lines = svg
    .append("g")
    .selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .attr("x1", (d) => x(x_range[1]))
    .attr("x2", (d) => x(d[1]))
    .attr("y1", (d, i) => y(i))
    .attr("y2", (d, i) => y(i));

  let time_boxes = [null, null];
  let highlight_nodes = new Set();

  let titles = data.concat([["Nat'l priority", x_range[0]]]);
  let text_labels = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("font-weight", 700)
    .selectAll("text")
    .data(titles)
    .enter()
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", (d) => x(d[1]))
    .attr("y", (d, i) => y(i) + y.rangeBand() / 2)
    .attr("dy", "0.35em")
    .attr("dx", "-0.25em")
    .attr("fill", "black")
    .text((d) => d[0]);

  svg
    .append("g")
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("fill", "black")
    .attr("stroke", "black")
    .attr("cx", (d) => x(d[1]))
    .attr("cy", (d, i) => y(i))
    .attr("r", 1);

  svg
    .append("g")
    .selectAll("circle")
    .data(events)
    .enter()
    .append("circle")
    .attr("fill", (d, i) =>
      _.some(cluster.event_info[d[0]].national_priority)
        ? "firebrick"
        : "steelblue"
    )
    .attr("stroke", "black")
    .attr("cx", (d) => x(d[1]))
    .attr("cy", (d, i) => y(data.length))
    .attr(
      "r",
      (d) => 2 + Math.sqrt(d3.sum(cluster.event_info[d[0]].connected_componets))
    )
    .on("mouseover", (d, e) => {
      const ed = cluster.event_info[d[0]];
      _.each(ed.national_priority, (d, i) => {
        if (d) {
          _.each(ed.priority_nodes[i], (n) => highlight_nodes.add(n));
        }
      });
      //console.log (highlight_nodes);
      let years_ago = _.map([1, 3], (ya) => {
        let some_years_ago = new Date(d[1]);
        some_years_ago.setFullYear(d[1].getFullYear() - ya);
        if (some_years_ago < x_range[0]) some_years_ago = x_range[0];
        return some_years_ago;
      });

      let fills = ["firebrick", "grey"];
      time_boxes = _.map(years_ago, (sya, i) =>
        svg
          .append("g")
          .selectAll("rect")
          .data([d])
          .enter()
          .append("rect")
          .attr("fill", fills[i])
          .attr("x", (d) => x(sya))
          .attr("y", (d) => y(0))
          .attr("width", x(d[1]) - x(sya))
          .attr("height", (d) => -y(0) + y(data.length - 1))
          .attr("opacity", 0.25)
      );

      lines
        .attr("stroke-width", (d) => (highlight_nodes.has(d[0]) ? 5 : 2))
        .attr("stroke", (d) => (highlight_nodes.has(d[0]) ? "black" : "#aaa"));
      text_labels.attr("fill", (d) =>
        highlight_nodes.has(d[0]) ? "firebrick" : "black"
      );
    })
    .on("mouseout", (e, d) => {
      lines.attr("stroke-width", 2).attr("stroke", "#aaa");
      text_labels.attr("fill", "black");
      highlight_nodes = new Set();
      _.each(time_boxes, (box) => (box ? box.remove() : 0));
      time_boxes = [null, null];
    })
    .append("title")
    .text((d) => {
      const ed = cluster.event_info[d[0]];
      let text = d[0] + ". ";
      if (_.some(ed.national_priority)) {
        text += "National priority clusterOI. ";
      }
      text +=
        String(d3.sum(ed.connected_componets)) +
        " nodes in " +
        ed.connected_componets.length +
        " components. ";
      text +=
        "A total of " +
        d3.sum(ed.priority_nodes, (d) => d.length) +
        " nodes dx'ed in the previous 12 months; maximum of " +
        d3.max(ed.priority_nodes, (d) => d.length) +
        " in a subcluster";
      return text;
    });
}

/**
 * Performs a cluster traversal to identify completely connected clusters.
 *
 * @param {Object[]} nodes - An array of node objects. Each node should have an `id` property.
 * @param {Object[]} edges - An array of edge objects. Each edge should have `source` and `target` properties
 *   referencing node IDs.
 * @param {Function} [edge_filter] - An optional filtering function applied to edges before traversal.
 *   The function should accept an edge object and return a boolean indicating whether to include the edge.
 
 * @throws {Error} If an edge references non-existent nodes.
 *
 * @returns {Object[][]} An array of clusters, where each cluster is an array of node objects.
 */

function hivtrace_cluster_complete_clusters(nodes, edges, edge_filter) {
  var clusters = [],
    adjacency = {},
    by_node = {};

  _.each(nodes, (n) => {
    n.visited = false;
    adjacency[n.id] = [];
  });

  if (edge_filter) {
    edges = _.filter(edges, edge_filter);
  }

  _.each(edges, (e) => {
    try {
      adjacency[nodes[e.source].id].push([nodes[e.target], e]);
      adjacency[nodes[e.target].id].push([nodes[e.source], e]);
    } catch {
      throw Error(
        "Edge does not map to an existing node " + e.source + " to " + e.target
      );
    }
  });

  var traverse = function (node) {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
    }

    node.visited = true;

    _.each(adjacency[node.id], (neighbor) => {
      if (!neighbor[0].visited) {
        // only traverse further if the neighbor node is connected to EVERY other node in the cluster

        if (
          (_.every(clusters[by_node[node.id]]),
          (n) => {
            _.find(adjacency[n.id], (r) => r[0] == neighbor[0].id);
          })
        ) {
          by_node[neighbor[0].id] = by_node[node.id];
          clusters[by_node[neighbor[0].id]].push(neighbor[0]);
          traverse(neighbor[0]);
        } else {
          traverse(neighbor[0]);
        }
      }
    });
  };

  _.each(nodes, (n) => {
    if (!n.visited) {
      traverse(n);
    }
  });

  return clusters;
}

/**
 * Performs a depth-wise traversal on a cluster of nodes, considering edges and optional filters.
 *
 * @param {Object[]} nodes - An array of node objects. Each node should have an `id` property.
 * @param {Object[]} edges - An array of edge objects. Each edge should have `source` and `target` properties
 *   referencing node IDs.
 * @param {Function} [edge_filter] - An optional filtering function applied to edges before traversal.
 *   The function should accept an edge object and return a boolean indicating whether to include the edge.

    computes and returns an adjacency list in the form
    
    node id => set of adjacent (connected) node ids
    

*/

function hivtrace_compute_adjacency(nodes, edges, edge_filter) {
  let adjacency = {};
  _.each(edges, (e) => {
    if (!edge_filter || edge_filter(e)) {
      let src = nodes[e.source];
      let tgt = nodes[e.target];

      if (!(src.id in adjacency)) {
        adjacency[src.id] = new Set();
      }
      adjacency[src.id].add(tgt.id);

      if (!(tgt.id in adjacency)) {
        adjacency[tgt.id] = new Set();
      }
      adjacency[tgt.id].add(src.id);
    }
  });
  return adjacency;
}

/**
 * Performs a depth-wise traversal on a cluster of nodes, considering edges and optional filters.
 *
 * @param {Object[]} nodes - An array of node objects. Each node should have an `id` property.
 * @param {Object[]} edges - An array of edge objects. Each edge should have `source` and `target` properties
 *   referencing node IDs.
 * @param {Function} [edge_filter] - An optional filtering function applied to edges before traversal.
 *   The function should accept an edge object and return a boolean indicating whether to include the edge.

    computes and returns an adjacency list in the form
    
    node id => set of adjacent (connected) node ids
    

*/

function hivtrace_compute_adjacency_with_edges(nodes, edges, edge_filter) {
  let adjacency = {};

  _.each(edges, (e) => {
    if (!edge_filter || edge_filter(e)) {
      let src = nodes[e.source];
      let tgt = nodes[e.target];

      if (!(src.id in adjacency)) {
        adjacency[src.id] = [];
      }
      adjacency[src.id].push([tgt, e]);

      if (!(tgt.id in adjacency)) {
        adjacency[tgt.id] = [];
      }
      adjacency[tgt.id].push([src, e]);
    }
  });
  return adjacency;
}

/**
 * Performs a depth-wise traversal on a cluster of nodes, considering edges and optional filters.
 *
 * @param {Object[]} nodes - An array of node objects. Each node should have an `id` property.
 * @param {Object[]} edges - An array of edge objects. Each edge should have `source` and `target` properties
 *   referencing node IDs.
 * @param {Function} [edge_filter] - An optional filtering function applied to edges before traversal.
 *   The function should accept an edge object and return a boolean indicating whether to include the edge.
 * @param {Function} [save_edges] - An optional function used to store traversed edges. It should be called with
 *   an array where each element represents the edges within a cluster.
 * @param {Object[]} [seed_nodes] - An optional array of node objects to use as starting points for traversal.
 *   If not provided, all nodes will be considered.
 * @param {Set} [white_list] - An optional set of node IDs restricting traversal to nodes within the set.
 *
 * @throws {Error} If an edge references non-existent nodes.
 *
 * @returns {Object[][]} An array of clusters, where each cluster is an array of node objects.
 */

function hivtrace_cluster_depthwise_traversal(
  nodes,
  edges,
  edge_filter,
  save_edges,
  seed_nodes,
  white_list,
  given_adjacency
  // an optional set of node IDs (a subset of 'nodes') that will be considered for traversal
  // it is further assumed that seed_nodes are a subset of white_list, if the latter is specified
) {
  var clusters = [],
    adjacency = {},
    by_node = {};

  seed_nodes = seed_nodes || nodes;

  /*
  var len = arr.length;
while (len--) {
    // blah blah
}
  */

  if (given_adjacency) {
    var N = nodes.length;
    while (N--) {
      nodes[N].visited = false;
    }
    // _.each(nodes, (n) => {
    //  n.visited = false;
    //});
    adjacency = given_adjacency;
  } else {
    var N = nodes.length;
    while (N--) {
      nodes[N].visited = false;
      adjacency[nodes[N].id] = [];
    }
    //_.each(nodes, (n) => {
    //  n.visited = false;
    //  adjacency[n.id] = [];
    //});

    if (edge_filter) {
      edges = _.filter(edges, edge_filter);
    }

    if (white_list) {
      edges = _.filter(
        edges,
        (e) =>
          white_list.has(nodes[e.source].id) &&
          white_list.has(nodes[e.target].id)
      );
    }

    _.each(edges, (e) => {
      try {
        adjacency[nodes[e.source].id].push([nodes[e.target], e]);
        adjacency[nodes[e.target].id].push([nodes[e.source], e]);
      } catch {
        throw Error(
          "Edge does not map to an existing node " +
            e.source +
            " to " +
            e.target
        );
      }
    });
  }

  var traverse = function (node) {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
      if (save_edges) {
        save_edges.push([]);
      }
    }
    node.visited = true;

    var N = adjacency[node.id] ? adjacency[node.id].length : 0;
    while (N--) {
      let neighbor = adjacency[node.id][N];
      if (!neighbor[0].visited) {
        by_node[neighbor[0].id] = by_node[node.id];
        clusters[by_node[neighbor[0].id]].push(neighbor[0]);
        if (save_edges) {
          save_edges[by_node[neighbor[0].id]].push(neighbor[1]);
        }
        traverse(neighbor[0]);
      }
    }

    /*
    _.each(adjacency[node.id], (neighbor) => {
      if (!neighbor[0].visited) {
        by_node[neighbor[0].id] = by_node[node.id];
        clusters[by_node[neighbor[0].id]].push(neighbor[0]);
        if (save_edges) {
          save_edges[by_node[neighbor[0].id]].push(neighbor[1]);
        }
        traverse(neighbor[0]);
      }
    });
    */
  };

  _.each(seed_nodes, (n) => {
    if (!n.visited) {
      traverse(n);
    }
  });

  return clusters;
}

/**
 * Determines the type of an edge based on its length and predefined edge types.

 * @param {Object} e - The edge object to be classified.
 * @param {string[]} edge_types - An array of two edge types. The first type is used for edges shorter than or equal to `T`,
 *   and the second type is used for edges longer than `T`.
 * @param {number} T - The threshold value for edge length classification.

 * @returns {string} The edge type corresponding to the edge's length.
 */

function edge_typer(e, edge_types, T) {
  return edge_types[e.length <= T ? 0 : 1];
}

/**
 * Generates a random ID string using a specified alphabet and length.

 * @param {string[]} [alphabet] - An optional array of characters to use in the ID. If not provided, a default alphabet of letters "a" to "g" is used.
 * @param {number} [length] - An optional length for the ID. If not provided, a default length of 32 is used.

 * @returns {string} A randomly generated ID string.
 */

function random_id(alphabet, length) {
  alphabet = alphabet || ["a", "b", "c", "d", "e", "f", "g"];
  length = length || 32;
  var s = "";
  for (var i = 0; i < length; i++) {
    s += _.sample(alphabet);
  }
  return s;
}

/**
 * Generates a plot visualizing cluster dynamics over time.
 *
 * @param {Object[]} time_series - An array of data points, each with a required `time` property (a date object)
 *   and optional properties representing attributes.
 * @param {d3.selection} container - A D3 selection representing the container element for the plot.
 * @param {string} x_title - The title for the x-axis.
 * @param {string} y_title - The title for the y-axis.
 * @param {d3.scale} [y_scale] - An optional D3 scale for the y-axis. If not provided, a linear scale will be used.
 * @param {Function} [bin_by] - An optional function used to bin data points into time intervals.
 *   The function should accept a date object and return an array with three elements:
 *   - The bin label (e.g., "Q1 2023").
 *   - The start date of the bin.
 *   - The middle date of the bin (used for x-axis positioning).
 *   If not provided, a default function that bins by quarters is used.
 * @param {Object} [options] - An optional configuration object for the plot.
 *   - `base_line`: (number, default: 20) The baseline value for the y-axis.
 *   - `top`: (number, default: 40) The top padding for the plot.
 *   - `right`: (number, default: 30) The right padding for the plot.
 *   - `bottom`: (number, default: 60) The bottom padding for the plot.
 *   - `left`: (number, default: 100) The left padding for the plot.
 *   - `font_size`: (number, default: 18) The font size for labels and text elements.
 *   - `rect_size`: (number, default: 22) The size of rectangles used in the legend.
 *   - `width`: (number, default: 1024) The width of the plot container.
 *   - `height`: (number, default: 600) The height of the plot container.
 *   - `barchart`: (boolean, default: false) If true, the plot will be displayed as a bar chart.
 *   - `skip_cumulative`: (boolean, default: false) If true, the cumulative area will not be displayed.
 *   - `x-tick-format`: (Function) An optional function for formatting x-axis tick labels.
 *   - `prefix`: (string) An optional prefix to add to attribute names displayed in the legend.
 *   - `colorizer`: (Object) An optional colorizer object for attributes. Keys should be attribute names,
 *     and values should be D3 scales used for coloring lines/bars.
 *   - `drag`: (Object) An optional drag object for enabling dragging the plot.
 *
 * @throws {Error} If no data points are provided.
 */

function hivtrace_plot_cluster_dynamics(
  time_series,
  container,
  x_title,
  y_title,
  y_scale,
  bin_by,
  options
) {
  options = options || {
    base_line: 20,
    top: 40,
    right: 30,
    bottom: 3 * 20,
    left: 5 * 20,
    font_size: 18,
    rect_size: 22,
    width: 1024,
    height: 600,
  };

  // Only accept time_series with time that is a date
  time_series = _.filter(time_series, (ts) => _.isDate(ts.time));

  if (time_series.length === 0) {
    return;
  }

  var do_barchart = options && options["barchart"];
  var skip_cumulative = (options && options["skip_cumulative"]) || do_barchart;

  var width = options.width - options.left - options.right;
  var height = options.height - options.top - options.bottom;
  var min_diff;

  if (!bin_by) {
    bin_by = function (date) {
      var year = date.getFullYear(),
        nearest_quarter = new Date(),
        mid_point = new Date();

      nearest_quarter.setDate(1);
      nearest_quarter.setFullYear(year);
      mid_point.setFullYear(year);

      var quarter = Math.floor(date.getMonth() / 3);

      nearest_quarter.setMonth(quarter * 3);
      nearest_quarter.setHours(0, 0, 0);
      mid_point.setHours(0, 0, 0);

      nearest_quarter.setFullYear(year);
      mid_point.setMonth(quarter * 3 + 1);
      mid_point.setDate(15);

      return ["Q" + (quarter + 1) + " " + year, nearest_quarter, mid_point];
    };

    min_diff = new Date(2018, 3, 0) - new Date(2018, 0, 0);
  }

  var x_tick_format = function (d) {
    var year = d.getFullYear();
    var quarter = Math.floor(d.getMonth() / 3) + 1;

    return String(year) + "-Q" + quarter;
  };

  if (options && options["x-tick-format"]) {
    x_tick_format = options["x-tick-format"];
  }

  /** plot_data is an array with entries like
        {
            "time": DATE,
            "sex_trans":"IDU-Male"
        }

        "time" is required, everything else are optional attributes

        1. First, we bin everything into ranges (like years or quarters, this is returned by the mapper callback)
        2. Second, we compute growth dynamics of total counts and individual attributes
        3. Third, if additional attributes are present, one that's tagged for display is stratified by values and
           converted into time series

    */

  var x = d3.time.scale().range([0, width]);

  var y = y_scale ? y_scale : d3.scale.linear();

  if (!y_scale) {
    y.rangeRound([height, 0]);
  } else {
    y.range([height, 0]);
  }

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom")
    .ticks(d3.time.month, 3)
    .tickFormat(d3.time.format("%m/%Y"));

  if (x_tick_format) {
    xAxis.tickFormat(x_tick_format);
  }

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .tickFormat((v) => {
      if (v << 0 === v) {
        // an integer
        return v;
      }
      return null;
    });

  var binned = {};
  var values_by_attribute = {};
  var total_id = "total";
  var total_color = "#555555";
  var prefix = options && options["prefix"] ? options["prefix"] : "";
  var max_bin = 0;

  _.each(time_series, (point, index) => {
    var bin_tag = bin_by(point["time"]);

    if (!(bin_tag[0] in binned)) {
      binned[bin_tag[0]] = { time: bin_tag[1], x: bin_tag[2] };
      binned[bin_tag[0]][total_id] = 0;
      _.each(point, (v, k) => {
        if (k !== "time") {
          binned[bin_tag[0]][k] = {};
        }
      });
    }

    binned[bin_tag[0]][total_id] += 1;
    max_bin = Math.max(max_bin, binned[bin_tag[0]][total_id]);

    var y = {};
    y[total_id] = index + 1;
    _.each(point, (v, k) => {
      if (k !== "time") {
        binned[bin_tag[0]][k][v] = binned[bin_tag[0]][k][v]
          ? binned[bin_tag[0]][k][v] + 1
          : 1;
        if (!(k in values_by_attribute)) {
          values_by_attribute[k] = {};
        }
        if (v in values_by_attribute[k]) {
          values_by_attribute[k][v]++;
        } else {
          values_by_attribute[k][v] = 1;
        }
        max_bin = Math.max(max_bin, binned[bin_tag[0]][k][v]);
        y[k] = _.clone(values_by_attribute[k]);
      }
    });

    point["y"] = y;
    point["_bin"] = bin_tag[1];
  });

  var binned_array = [];
  _.each(binned, (v, k) => {
    v["id"] = k;
    binned_array.push(v);
  });

  binned_array.sort((a, b) => b["time"] - a["time"]);

  if (do_barchart) {
    if (_.isUndefined(min_diff)) {
      _.each(binned_array, (d, i) => {
        if (i > 0) {
          min_diff = Math.min(
            min_diff,
            -(d["time"] - binned_array[i - 1]["time"])
          );
        }
      });
    }
    min_diff *= 0.8; // convert to seconds and shrink a bit
  }

  var min_x = d3.min(time_series, (d) =>
    d["time"] < d["_bin"] ? d["time"] : d["_bin"]
  );
  var max_x = d3.max(time_series, (d) =>
    d["time"] > d["_bin"] ? d["time"] : d["_bin"]
  );

  if (do_barchart) {
    var max_x2 = new Date();
    max_x2.setTime(max_x.getTime() + min_diff);
    max_x = max_x2;
    max_x2 = new Date();
    max_x2.setTime(min_x.getTime() - min_diff);
    min_x = max_x2;
  }

  let quarter_span = Math.floor((max_x - min_x) / 3600 / 24 / 1000 / 30);
  if (quarter_span > 8) {
    xAxis.ticks(d3.time.month, 3 * Math.ceil(quarter_span / 8));
  }

  x.domain([min_x, max_x]).clamp(true);
  y.domain([
    0.0,
    Math.round(skip_cumulative ? max_bin + 1 : time_series.length * 1.2),
  ]).clamp(true);

  /* step-plot generator*/

  /*var svg = container.append("svg")//.style("display", "table-cell")
        .attr("width", width + options.left + options.right)
        .attr("height", height + options.top + options.bottom);*/

  container.selectAll("*").remove(); // clean up previous plots

  var svg = container
    .append("g")
    .attr("transform", "translate(" + options.left + "," + options.top + ")");

  var legend_area = container
    .append("g")
    .attr(
      "transform",
      "translate(" +
        (options.left + options.font_size * 2.5) +
        "," +
        (options.top + options.font_size) +
        ")"
    );

  /* set the domain for the codons */

  var y_key = _.keys(values_by_attribute)[0];

  var color_scale =
    "colorizer" in options &&
    options["colorizer"] &&
    y_key in options["colorizer"]
      ? options["colorizer"][y_key]
      : d3.scale.category10();

  color_scale = _.wrap(color_scale, (func, arg) => {
    if (arg === total_id) return total_color;
    return func(arg);
  });

  var plot_types = _.keys(values_by_attribute[y_key]);

  if (do_barchart) {
    if (plot_types.length === 0) {
      plot_types.push(total_id);
    }
  } else {
    plot_types.push(total_id);
  }

  plot_types.sort();

  if (options && options["drag"]) {
    var drag = d3.behavior.drag();
    drag.on("drag", function () {
      options["drag"].x += d3.event.dx;
      options["drag"].y += d3.event.dy;
      d3.select(this).attr(
        "transform",
        "translate(" + options["drag"].x + "," + options["drag"].y + ")"
      );
    });
    container.call(drag);
  }

  function opacity_toggle(tag, on_off) {
    if (do_barchart) {
      d3.selectAll('[data-plotid="' + tag + '"]').style(
        "stroke-width",
        on_off ? 4 : 1
      );
    } else {
      d3.selectAll('[data-plotid="' + tag + '"]').style(
        "fill-opacity",
        on_off ? 0.5 : 0.1
      );
    }
    d3.selectAll('[data-curveid="' + tag + '"]').style(
      "stroke-width",
      on_off ? 3 : 1
    );
  }

  if (!do_barchart || plot_types.length > 1 || plot_types[0] !== total_id) {
    var legend_lines = legend_area.selectAll("g").data(plot_types);

    legend_lines.enter().append("g").attr("class", "annotation-text");

    legend_lines
      .selectAll("text")
      .data((d) => [d])
      .enter()
      .append("text")
      .attr(
        "transform",
        (d, i, j) =>
          "translate(" +
          options.rect_size +
          "," +
          (options.rect_size * (plot_types.length - 1 - j) -
            (options.rect_size - options.font_size)) +
          ")"
      )
      .attr("dx", "0.2em")
      .style("font-size", options.font_size)
      .text((d) => d)
      .on("mouseover", (d) => {
        opacity_toggle(prefix + d, true);
      })
      .on("mouseout", (d) => {
        opacity_toggle(prefix + d, false);
      });

    legend_lines
      .selectAll("rect")
      .data((d) => [d])
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (d, i, j) => options.rect_size * (plot_types.length - 2 - j))
      .attr("width", options.rect_size)
      .attr("height", options.rect_size)
      .attr("class", "area")
      .style("fill", (d, i, j) => color_scale(d))
      .on("mouseover", (d) => {
        opacity_toggle(prefix + d, true);
      })
      .on("mouseout", (d) => {
        opacity_toggle(prefix + d, false);
      });
  }

  var last = _.clone(time_series[time_series.length - 1]);
  last["time"] = x.domain()[1];
  time_series.push(last);

  _.each(plot_types, (plot_key, idx) => {
    var plot_color = color_scale(plot_key);
    var y_accessor = function (d) {
      //console.log ((plot_key in d['y']) ? d['y'][plot_key] : 0);
      if (plot_key in d["y"]) {
        return d["y"][plot_key];
      }
      if (y_key in d["y"]) {
        if (plot_key in d["y"][y_key]) {
          return d["y"][y_key][plot_key];
        }
      }
      return 0.0;
    };

    var bin_accessor = function (d) {
      if (y_key && plot_key in d[y_key]) {
        return d[y_key][plot_key];
      } else if (plot_key in d) {
        return d[plot_key];
      }
      return 0.0;
    };

    if (!skip_cumulative) {
      var curve = d3.svg
        .area()
        .x((d) => x(d["time"]))
        .y1((d) => y(y_accessor(d)))
        .y0((d) => y(0))
        .interpolate("step");

      svg
        .append("path")
        .datum(time_series)
        .classed("trend", true)
        .style("fill", plot_color)
        .style("stroke", plot_color)
        .attr("d", curve)
        .attr("data-plotid", prefix + plot_key);
    }

    if (do_barchart) {
      binned_array.forEach((d) => {
        var dd = new Date();
        dd.setTime(d["time"].getTime() - min_diff * 0.5);
        var dd2 = new Date();
        dd2.setTime(d["time"].getTime() + min_diff * 0.5);
        var xc = x(dd);
        var w = x(dd2) - x(dd);
        var last_y = "last_y" in d ? d["last_y"] : 0;
        var new_y = bin_accessor(d);
        svg
          .append("rect")
          .attr("x", xc)
          .attr("y", y(last_y + new_y))
          .attr("height", y(0) - y(new_y))
          .attr("width", w)
          .attr("data-plotid", prefix + plot_key)
          .classed("tracer", true)
          .style("fill", plot_color)
          .style("stroke", d3.rgb(plot_color).darker(2))
          .style("fill-opacity", 1)
          .append("title")
          .text(
            plot_key +
              " " +
              new_y +
              " cases in " +
              (x_tick_format ? x_tick_format(d["time"]) : d["time"])
          );

        d["last_y"] = (d["last_y"] ? d["last_y"] : 0) + new_y;
      });
    } else {
      binned_array.forEach((d) => {
        svg
          .append("circle")
          .attr("cx", x(d["time"]))
          .attr("cy", y(bin_accessor(d)))
          .attr("r", "5")
          .classed("node", true)
          .style("fill", plot_color)
          .style("stroke", plot_color)
          .attr("title", plot_key + " : " + bin_accessor(d));
      });

      var curve_year = d3.svg
        .line()
        .x((d) => x(d["time"]))
        .y((d) => y(bin_accessor(d)))
        .interpolate("cardinal");

      svg
        .append("path")
        .datum(binned_array)
        .classed("tracer", true)
        .style("stroke", plot_color)
        .attr("d", curve_year)
        .attr("data-curveid", prefix + plot_key);
    }
  });

  /* x-axis */
  var x_axis = svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .style("font-size", options.font_size)
    .call(xAxis);

  x_axis
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("dy", "0.9em")
    .attr("dx", "-1.75em");

  x_axis
    .append("text")
    .attr("x", width / 2)
    .attr("dy", "3.5em")
    .style("text-anchor", "middle")
    .style("font-size", options.font_size * 1.5)
    .text(x_title);

  /* y-axis*/
  svg
    .append("g")
    .attr("class", "y axis")
    .style("font-size", options.font_size)
    .call(yAxis)
    .append("text")
    .style("font-size", options.font_size * 1.5)
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", "-2em")
    //.attr("dx", "-1em")
    .style("text-anchor", "end")
    .text(y_title); // beta - alpha
}

/** Retrieves a CSS selector for UI elements based on their `data-hivtrace-ui-role` attribute.

 * @param {string} role - The value of the `data-hivtrace-ui-role` attribute.

 * @returns {string} A CSS selector string targeting elements with the specified role.
*/

function get_ui_element_selector_by_role(role) {
  return ` [data-hivtrace-ui-role='${role}']`;
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
