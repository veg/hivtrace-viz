var _ = require("underscore");
var d3 = require("d3");
var helpers = require("./helpers");

var _defaultFloatFormat = d3.format(",.2r");
var _defaultPercentFormat = d3.format(",.3p");

/**
## hivtraceClusterGraphSummary Function

Creates and populates a summary table for an HIV trace cluster graph.

#### Parameters

* `graph`: The input graph data.
* `tag`: The HTML element to append the summary table to.
* `not_CDC`: A flag indicating whether to include CDC-specific statistics or not (optional).

#### Returns

None
*/

function hivtraceClusterGraphSummary(network, tag, not_CDC) {
  // Store the container tag and not_CDC setting on the network object so it can re-render itself when async load completes.
  network.graph_summary_tag = tag;
  network.graph_summary_not_CDC = not_CDC;

  // Select the target element for appending the summary table
  var summary_table = d3.select(tag).select("tbody");

  // Create a new tbody if it does not exist
  if (summary_table.empty()) {
    summary_table = d3.select(tag).append("tbody");
  }

  let graph = network.json;

  // Initialize an empty array to store table data
  var table_data = [];

  // Iterate over the graph's network summary and add relevant statistics
  if (!summary_table.empty()) {
    _.each(graph["Network Summary"], (value, key) => {
      // Handle special case for cluster count
      if (not_CDC && key === "Clusters") {
        value = _.size(graph["Cluster description"]);
      }

      // Check if the value is a number and add it to table data
      if (_.isNumber(value)) {
        table_data.push([
          __("statistics")[key.replace(/ /g, "_").toLowerCase()],
          value,
        ]);
      }
    });

    // Show breakdown of unlinked nodes (singletons) if they exist
    let unlinked_nodes = graph.Nodes.filter(
      (n) => n.cluster === null || n.cluster === undefined
    );
    if (unlinked_nodes.length > 0) {
      let unlinked_with_seq = 0;
      let unlinked_poor_seq = 0;
      let unlinked_no_seq = 0;
      unlinked_nodes.forEach((n) => {
        let has_seq = true; // Default
        let is_poor = false;
        if (n.patient_attributes) {
          if (n.patient_attributes.has_sequence !== undefined) {
            has_seq = !!n.patient_attributes.has_sequence;
          } else if (n.patient_attributes.sequence_status !== undefined) {
            has_seq = n.patient_attributes.sequence_status !== "none";
          }
          is_poor = n.patient_attributes.poor_quality !== undefined && n.patient_attributes.poor_quality !== null;
        }
        if (has_seq) {
          unlinked_with_seq++;
        } else if (is_poor) {
          unlinked_poor_seq++;
        } else {
          unlinked_no_seq++;
        }
      });
      if (unlinked_poor_seq > 0 || unlinked_no_seq > 0) {
        table_data.push(["Unlinked nodes (with sequences)", unlinked_with_seq]);
        if (unlinked_poor_seq > 0) {
          table_data.push([
            "Unlinked nodes (with poor quality sequences)",
            unlinked_poor_seq,
          ]);
        }
        if (unlinked_no_seq > 0) {
          table_data.push([
            "Unlinked nodes (without sequences)",
            unlinked_no_seq,
          ]);
        }
      }
    }
  }

  // Extract degrees from graph and calculate statistics
  var degrees = [];
  _.each(graph["Degrees"]["Distribution"], (value, index) => {
    for (var k = 0; k < value; k++) {
      degrees.push(index + 1);
    }
  });
  degrees = helpers.describe_vector(degrees);

  // Add degrees statistics to table data
  table_data.push([__("statistics")["links_per_node"], ""]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
    _defaultFloatFormat(degrees["mean"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    _defaultFloatFormat(degrees["median"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
    degrees["min"] + " - " + degrees["max"],
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "</i>",
    degrees["Q1"] + " - " + degrees["Q3"],
  ]);

  // Extract cluster sizes from graph and calculate statistics
  degrees = helpers.describe_vector(graph["Cluster sizes"]);

  // Add cluster sizes statistics to table data
  table_data.push([__("statistics")["cluster_sizes"], ""]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
    _defaultFloatFormat(degrees["mean"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    _defaultFloatFormat(degrees["median"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
    degrees["min"] + " - " + degrees["max"],
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "</i>",
    degrees["Q1"] + " - " + degrees["Q3"],
  ]);

  if (network.has_multiple_sequences) {
    table_data.push([
      "Persons with >1 sequence",
      _.filter(network.primary_key_list, (d, k) => d.length > 1).length,
    ]);
    table_data.push([
      "Persons in multiple clusters",
      _.size(network.entities_in_multiple_clusters),
    ]);
  }

  // If not CDC flag is false, add additional statistics
  if (!not_CDC) {
    // Extract edge lengths from graph and calculate statistics
    degrees = helpers.describe_vector(_.map(graph["Edges"], (e) => e.length));

    // Add edge length statistics to table data
    table_data.push(["Genetic distances (links only)", ""]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
      _defaultPercentFormat(degrees["mean"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
      _defaultPercentFormat(degrees["median"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
      _defaultPercentFormat(degrees["min"]) +
        " - " +
        _defaultPercentFormat(degrees["max"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "</i>",
      _defaultPercentFormat(degrees["Q1"]) +
        " - " +
        _defaultPercentFormat(degrees["Q3"]),
    ]);
  }

  // Update table rows and columns
  var rows = summary_table.selectAll("tr").data(table_data);
  rows.enter().append("tr");
  rows.exit().remove();
  var columns = rows.selectAll("td").data((d) => d);
  columns.enter().append("td");
  columns.exit();
  columns.html((d) => d);
}

module.exports.hivtraceClusterGraphSummary = hivtraceClusterGraphSummary;
