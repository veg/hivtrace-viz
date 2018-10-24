var d3 = require("d3"),
  _ = require("underscore"),
  helpers = require("./helpers.js");

function hivtrace_cluster_adjacency_list(obj) {
  var nodes = obj.Nodes,
    edges = obj.Edges;

  var adjacency_list = {};

  edges.forEach(function(e, i) {
    function in_nodes(n, id) {
      return n.id == id;
    }

    var seq_ids = e["sequences"];

    var n1 = nodes.filter(function(n) {
        return in_nodes(n, seq_ids[0]);
      })[0],
      n2 = nodes.filter(function(n) {
        return in_nodes(n, seq_ids[1]);
      })[0];

    adjacency_list[n1.id]
      ? adjacency_list[n1.id].push(n2)
      : (adjacency_list[n1.id] = [n2]);
    adjacency_list[n2.id]
      ? adjacency_list[n2.id].push(n1)
      : (adjacency_list[n2.id] = [n1]);
  });

  return adjacency_list;
}

var hivtrace_generate_svg_polygon_lookup = {};

_.each(_.range(3, 20), function(d) {
  var angle_step = (Math.PI * 2) / d;
  hivtrace_generate_svg_polygon_lookup[d] = _.map(_.range(1, d), function(i) {
    return [Math.cos(angle_step * i), Math.sin(angle_step * i)];
  });
});

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
  }
  //console.log (type);
  return d3.svg.symbol().type("circle");
}

var hivtrace_generate_svg_ellipse = function() {
  var self = this;

  self.ellipse = function() {
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

  self.ellipse.type = function() {
    return self.ellipse;
  };

  self.ellipse.size = function(attr) {
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

var hivtrace_generate_svg_polygon = function() {
  var self = this;

  self.polygon = function() {
    var path = " M" + self.radius + " 0";

    if (self.sides in hivtrace_generate_svg_polygon_lookup) {
      path += hivtrace_generate_svg_polygon_lookup[self.sides]
        .map(function(value) {
          return " L" + self.radius * value[0] + " " + self.radius * value[1];
        })
        .join(" ");
    } else {
      var angle_step = (Math.PI * 2) / self.sides,
        current_angle = 0;
      for (i = 0; i < self.sides - 1; i++) {
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

  self.polygon.sides = function(attr) {
    if (_.isNumber(attr) && attr > 2) {
      self.sides = attr;
      return self.polygon;
    }

    return self.sides;
  };

  self.polygon.type = function() {
    return self.polygon;
  };

  self.polygon.size = function(attr) {
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
};

function hivtrace_new_cluster_adjacency_list(obj) {
  var nodes = obj.Nodes,
    edges = obj.Edges;

  nodes.forEach(function(n) {
    n.neighbors = d3.set();
  });

  edges.forEach(function(e) {
    nodes[e.source].neighbors.add(e.target);
    nodes[e.target].neighbors.add(e.source);
  });
}

// Reconstructs path from floyd-warshall algorithm
function hivtrace_get_path(next, i, j) {
  var all_paths = [];
  i = parseInt(i);
  j = parseInt(j);

  for (var c = 0; c < next[i][j].length; c++) {
    var k = next[i][j][c];
    var intermediate = k;

    if (intermediate === null || intermediate == i) {
      return [[parseInt(i), parseInt(j)]];
    } else {
      var paths_i_k = hivtrace_get_path(next, i, intermediate);
      var paths_k_j = hivtrace_get_path(next, intermediate, j);

      for (var i_k_index = 0; i_k_index < paths_i_k.length; i_k_index++) {
        var i_k = paths_i_k[i_k_index];
        for (var k_j_index = 0; k_j_index < paths_k_j.length; k_j_index++) {
          var k_j = paths_k_j[k_j_index];
          if (i_k.length) {
            if (
              i_k[0] == i &&
              i_k[i_k.length - 1] == k &&
              k_j[0] == k &&
              k_j[k_j.length - 1] == j
            ) {
              i_k.pop();
              all_paths.push(i_k.concat(k_j));
            }
          }
        }
      }
    }
  }

  return all_paths;
}

function hivtrace_paths_with_node(node, next, i, j) {
  var paths = hivtrace_get_path(next, i, j);

  // Retrieve intermediary paths
  paths = paths.map(function(sublist) {
    return sublist.slice(1, -1);
  });

  if (!paths) {
    return 0;
  }

  var num_nodes = [];

  for (var k = 0; i < paths.length; k++) {
    sublist = paths[k];
    num_nodes.push(
      d3.sum(
        sublist.map(function(n) {
          return n == node;
        })
      )
    );
  }

  var mean = d3.mean(num_nodes);

  if (mean === undefined) {
    mean = 0;
  }

  return mean;
}

// Same as compute shortest paths, but with an additional next parameter for reconstruction
function hivtrace_compute_shortest_paths_with_reconstruction(
  obj,
  subset,
  use_actual_distances
) {
  // Floyd-Warshall implementation
  var distances = [];
  var next = [];

  var adjacency_list = hivtrace_cluster_adjacency_list(obj);

  if (!subset) {
    subset = Object.keys(adjacency_list);
  }

  var node_count = subset.length;

  for (var i = 0; i < subset.length; i++) {
    var a_node = subset[i];
    var empty_arr = _.range(node_count).map(function(d) {
      return null;
    });
    var zeroes = _.range(node_count).map(function(d) {
      return null;
    });
    distances.push(zeroes);
    next.push(empty_arr);
  }

  for (var index = 0; index < subset.length; index++) {
    var a_node = subset[index]; // eslint-disable-line
    for (var index2 = 0; index2 < subset.length; index2++) {
      var second_node = subset[index2];
      if (second_node != a_node) {
        if (
          adjacency_list[a_node]
            .map(function(n) {
              return n.id;
            })
            .indexOf(second_node) != -1
        ) {
          distances[index][index2] = 1;
          distances[index2][index] = 1;
        }
      }
    }
  }

  for (var index_i = 0; index_i < subset.length; index_i++) {
    var n_i = subset[index_i];
    for (var index_j = 0; index_j < subset.length; index_j++) {
      var n_j = subset[index_j];
      if (index_i == index_j) {
        next[index_i][index_j] = [];
      } else {
        next[index_i][index_j] = [index_i];
      }
    }
  }

  // clone distances
  var distances2 = _.map(distances, _.clone);

  for (var index_k = 0; index_k < subset.length; index_k++) {
    // eslint-disable-next-line
    for (var index_i = 0; index_i < subset.length; index_i++) {
      var n_i = subset[index_i]; // eslint-disable-line
      // eslint-disable-next-line
      for (var index_j = 0; index_j < subset.length; index_j++) {
        var n_j = subset[index_j]; // eslint-disable-line

        if (n_i != n_j) {
          d_ik = distances[index_k][index_i];
          d_jk = distances[index_k][index_j];
          d_ij = distances[index_i][index_j];

          if (d_ik !== null && d_jk !== null) {
            d_ik += d_jk;
            if (d_ij === null || d_ij > d_ik) {
              distances2[index_i][index_j] = d_ik;
              distances2[index_j][index_i] = d_ik;
              next[index_i][index_j] = [];
              next[index_i][index_j] = next[index_i][index_j].concat(
                next[index_k][index_j]
              );
              continue;
            } else if (d_ij == d_ik) {
              next[index_i][index_j] = next[index_i][index_j].concat(
                next[index_k][index_j]
              );
            }
          }
          distances2[index_j][index_i] = distances[index_j][index_i];
          distances2[index_i][index_j] = distances[index_i][index_j];
        }
      }
    }

    var t = distances2;
    distances2 = distances;
    distances = t;
  }

  return {
    ordering: subset,
    distances: distances,
    next: next
  };
}

function hivtrace_filter_to_node_in_cluster(node, obj) {
  var nodes = obj.Nodes,
    edges = obj.Edges,
    cluster_id = null;

  // Retrieve nodes that are part of the cluster
  var node_obj = nodes.filter(function(n) {
    return node == n.id;
  });

  if (node_obj) {
    cluster_id = node_obj[0].cluster;
  } else {
    console.log("could not find node"); // eslint-disable-line
    return null;
  }

  // Filter out all edges and nodes that belong to the cluster
  var nodes_in_cluster = nodes.filter(function(n) {
    return cluster_id == n.cluster;
  });
  var node_ids = nodes_in_cluster.map(function(n) {
    return n.id;
  });
  var edges_in_cluster = edges.filter(function(e) {
    return node_ids.indexOf(e.sequences[0]) != -1;
  });

  var filtered_obj = {};
  filtered_obj["Nodes"] = nodes_in_cluster;
  filtered_obj["Edges"] = edges_in_cluster;
  return filtered_obj;
}

function hivtrace_compute_betweenness_centrality_all_nodes_in_cluster(
  cluster,
  obj,
  cb
) {
  var nodes = obj.Nodes,
    edges = obj.Edges;

  var nodes_in_cluster = nodes.filter(function(n) {
    return cluster == n.cluster;
  });
  var node_ids = nodes_in_cluster.map(function(n) {
    return n.id;
  });
  var edges_in_cluster = edges.filter(function(e) {
    return node_ids.indexOf(e.sequences[0]) != -1;
  });

  var filtered_obj = {};
  filtered_obj["Nodes"] = nodes_in_cluster;
  filtered_obj["Edges"] = edges_in_cluster;

  // get length of cluster
  if (nodes_in_cluster.length > 70) {
    cb("cluster too large", null);
    return;
  }

  // get paths
  var paths = hivtrace_compute_shortest_paths_with_reconstruction(filtered_obj);
  node_ids = nodes_in_cluster.map(function(n) {
    return n.id;
  });

  var betweenness = {};
  nodes_in_cluster.forEach(function(n) {
    betweenness[n.id] = hivtrace_compute_betweenness_centrality(
      n.id,
      filtered_obj,
      paths
    );
  });

  cb(null, betweenness);
  return;
}

// Returns dictionary of nodes' betweenness centrality
// Utilizes the Floyd-Warshall Algorithm with reconstruction
function hivtrace_compute_betweenness_centrality(node, obj, paths) {
  if (!paths) {
    var filtered_obj = hivtrace_filter_to_node_in_cluster(node, obj);
    paths = hivtrace_compute_shortest_paths_with_reconstruction(filtered_obj);
  }

  // find index of id
  var index = paths.ordering.indexOf(node);

  if (index == -1) {
    return null;
  }

  var length = paths.distances.length;

  if (length != 2) {
    scale = 1 / ((length - 1) * (length - 2));
  } else {
    scale = 1;
  }

  // If s->t goes through 1, add to sum
  // Reconstruct each shortest path and check if node is in it
  var paths_with_node = [];
  for (var i in _.range(length)) {
    for (var j in _.range(length)) {
      paths_with_node.push(hivtrace_paths_with_node(index, paths.next, i, j));
    }
  }

  return d3.sum(paths_with_node) * scale;
}

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

function hivtrace_get_node_by_id(id, obj) {
  return (
    obj.Nodes.filter(function(n) {
      return id == n.id;
    })[0] || undefined
  );
}

function hivtrace_compute_cluster_betweenness(obj, callback) {
  var nodes = obj.Nodes;

  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  // Get all unique clusters
  var clusters = nodes.map(function(n) {
    return n.cluster;
  });
  var unique_clusters = clusters.filter(onlyUnique);

  var cb_count = 0;

  function cb(err, results) {
    cb_count++;

    for (var node in results) {
      hivtrace_get_node_by_id(node, obj)["betweenness"] = results[node];
    }

    if (cb_count >= unique_clusters.length) {
      callback("done");
    }
  }

  // Compute betweenness in parallel
  unique_clusters.forEach(function(cluster_id) {
    hivtrace_betweenness_centrality_all_nodes_in_cluster(cluster_id, obj, cb);
  });

  // once all settled callback
}

function hivtrace_is_contaminant(node) {
  return node.attributes.indexOf("problematic") != -1;
}

function hiv_trace_export_table_to_text(parent_id, table_id, sep) {
  var the_button = d3.select(parent_id);
  the_button.selectAll("[data-type='download-button']").remove();

  the_button = the_button
    .append("a")
    .attr("target", "_blank")
    .attr("data-type", "download-button")
    .on("click", function(data, element) {
      d3.event.preventDefault();
      var table_tag = d3.select(this).attr("data-table");
      var table_text = helpers.table_to_text(table_tag);
      helpers.export_handler(
        table_text,
        table_tag.substring(1) + ".tsv",
        "text/tab-separated-values"
      );
    })
    .attr("data-table", table_id);

  the_button.append("i").classed("fa fa-download fa-2x", true);
  return the_button;
}

function hivtrace_format_value(value, formatter) {
  if (typeof value === "undefined") {
    return "Not computed";
  }
  if (value === hivtrace_undefined) {
    return "Undefined";
  }
  if (value === hivtrace_too_large) {
    return "Size limit";
  }

  if (value === hivtrace_processing) {
    return '<span class="fa fa-spin fa-spinner"></span>';
  }

  return formatter ? formatter(value) : value;
}

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
    height: 600
  };

  if (time_series.length == 0) {
    return;
  }

  var do_barchart = options && options["barchart"];
  var skip_cumulative = (options && options["skip_cumulative"]) || do_barchart;

  var width = options.width - options.left - options.right;
  var height = options.height - options.top - options.bottom;
  var min_diff;

  if (!bin_by) {
    bin_by = function(date) {
      var year = date.getFullYear(),
        nearest_quarter = new Date(),
        mid_point = new Date();

      nearest_quarter.setDate(1);
      nearest_quarter.setFullYear(year);
      mid_point.setFullYear(year);

      var quarter = Math.floor(date.getMonth() / 3) + 1;
      nearest_quarter.setMonth(quarter * 3);
      nearest_quarter.setHours(0, 0, 0);
      mid_point.setHours(0, 0, 0);

      nearest_quarter.setFullYear(year + (quarter == 4 ? 1 : 0));
      mid_point.setMonth(quarter * 3 + 1);
      mid_point.setDate(15);

      return ["Q" + quarter + " " + year, nearest_quarter, mid_point];
    };

    min_diff = new Date(2018, 3, 0) - new Date(2018, 0, 0);
  }

  var x_tick_format = function(d) {
    var year = d.getFullYear();
    var quarter = Math.floor(d.getMonth() / 3) + 1;

    return "" + year + "-Q" + quarter;
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
    .ticks(8)
    .tickFormat(d3.time.format("%m/%Y"));

  if (x_tick_format) {
    xAxis.tickFormat(x_tick_format);
  }

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .tickFormat(function(v) {
      if (v << 0 == v) {
        // an integer
        return v;
      }
      return;
    });

  var binned = {};
  var values_by_attribute = {};
  var total_id = "total";
  var total_color = "#555555";
  var prefix = options && options["prefix"] ? options["prefix"] : "";
  var max_bin = 0;

  _.each(time_series, function(point, index) {
    var bin_tag = bin_by(point["time"]);
    if (!(bin_tag[0] in binned)) {
      binned[bin_tag[0]] = { time: bin_tag[1], x: bin_tag[2] };
      binned[bin_tag[0]][total_id] = 0;
      _.each(point, function(v, k) {
        if (k != "time") {
          binned[bin_tag[0]][k] = {};
        }
      });
    }

    binned[bin_tag[0]][total_id] += 1;
    max_bin = Math.max(max_bin, binned[bin_tag[0]][total_id]);

    var y = {};
    y[total_id] = index + 1;
    _.each(point, function(v, k) {
      if (k != "time") {
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
  _.each(binned, function(v, k) {
    v["id"] = k;
    binned_array.push(v);
  });

  binned_array.sort(function(a, b) {
    return b["time"] > a["time"] ? 1 : b["time"] == a["time"] ? 0 : -1;
  });

  if (do_barchart) {
    if (_.isUndefined(min_diff)) {
      _.each(binned_array, function(d, i) {
        if (i > 0) {
          min_diff = Math.min(
            min_diff,
            -(d["time"] - binned_array[i - 1]["time"])
          );
        }
      });
    }
    min_diff = min_diff * 0.8; // convert to seconds and shrink a bit
  }

  var min_x = d3.min(time_series, function(d) {
    return d["time"] < d["_bin"] ? d["time"] : d["_bin"];
  });
  var max_x = d3.max(time_series, function(d) {
    return d["time"] > d["_bin"] ? d["time"] : d["_bin"];
  });

  if (do_barchart) {
    var max_x2 = new Date();
    max_x2.setTime(max_x.getTime() + min_diff);
    max_x = max_x2;
  }

  x.domain([min_x, max_x]).clamp(true);
  y.domain([
    0.0,
    Math.round(skip_cumulative ? max_bin + 1 : time_series.length * 1.2)
  ]).clamp(true);

  /* step-plot generator*/

  /*var svg = container.append("svg")//.style("display", "table-cell")
        .attr("width", width + options.left + options.right)
        .attr("height", height + options.top + options.bottom);*/

  container.selectAll("*").remove(); // clean up previous plots

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

  var svg = container
    .append("g")
    .attr("transform", "translate(" + options.left + "," + options.top + ")");

  /* set the domain for the codons */

  var y_key = _.keys(values_by_attribute)[0];

  var color_scale =
    "colorizer" in options &&
    options["colorizer"] &&
    y_key in options["colorizer"]
      ? options["colorizer"][y_key]
      : d3.scale.category10();

  color_scale = _.wrap(color_scale, function(func, arg) {
    if (arg == total_id) return total_color;
    return func(arg);
  });

  var plot_types = _.keys(values_by_attribute[y_key]);

  if (do_barchart) {
    if (plot_types.length == 0) {
      plot_types.push(total_id);
    }
  } else {
    plot_types.push(total_id);
  }

  plot_types.sort();

  if (options && options["drag"]) {
    var drag = d3.behavior.drag();
    drag.on("drag", function() {
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

  if (!do_barchart || plot_types.length > 1 || plot_types[0] != total_id) {
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
          options.rect_size +
          "," +
          (options.rect_size * (plot_types.length - 1 - j) -
            (options.rect_size - options.font_size)) +
          ")"
        );
      })
      .attr("dx", "0.2em")
      .style("font-size", options.font_size)
      .text(function(d) {
        return d;
      })
      .on("mouseover", function(d) {
        opacity_toggle(prefix + d, true);
      })
      .on("mouseout", function(d) {
        opacity_toggle(prefix + d, false);
      });

    legend_lines
      .selectAll("rect")
      .data(function(d) {
        return [d];
      })
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", function(d, i, j) {
        return options.rect_size * (plot_types.length - 2 - j);
      })
      .attr("width", options.rect_size)
      .attr("height", options.rect_size)
      .attr("class", "area")
      .style("fill", function(d, i, j) {
        return color_scale(d);
      })
      .on("mouseover", function(d) {
        opacity_toggle(prefix + d, true);
      })
      .on("mouseout", function(d) {
        opacity_toggle(prefix + d, false);
      });
  }

  var last = _.clone(time_series[time_series.length - 1]);
  last["time"] = x.domain()[1];
  time_series.push(last);

  _.each(plot_types, function(plot_key, idx) {
    var plot_color = color_scale(plot_key);
    var y_accessor = function(d) {
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

    var bin_accessor = function(d) {
      if (y_key && plot_key in d[y_key]) {
        return d[y_key][plot_key];
      } else {
        if (plot_key in d) {
          return d[plot_key];
        }
      }
      return 0.0;
    };

    if (!skip_cumulative) {
      var curve = d3.svg
        .area()
        .x(function(d) {
          return x(d["time"]);
        })
        .y1(function(d) {
          return y(y_accessor(d));
        })
        .y0(function(d) {
          return y(0);
        })
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
      binned_array.forEach(function(d) {
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
      binned_array.forEach(function(d) {
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
        .x(function(d) {
          return x(d["time"]);
        })
        .y(function(d) {
          return y(bin_accessor(d));
        })
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

module.exports.compute_node_degrees = hivtrace_compute_node_degrees;
module.exports.export_table_to_text = hiv_trace_export_table_to_text;
module.exports.undefined = {};
module.exports.too_large = {};
module.exports.processing = {};
module.exports.format_value = hivtrace_format_value;
module.exports.symbol = hivtrace_generate_svg_symbol;
module.exports.cluster_dynamics = hivtrace_plot_cluster_dynamics;
