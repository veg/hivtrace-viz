var _ = require("underscore");
var d3 = require("d3");
var helpers = require("./helpers");

var _defaultFloatFormat = d3.format(",.2r");
var _defaultPercentFormat = d3.format(",.3p");

// The function for creating the "Network Statistics" table that is displayed on the "Statistics" tab.
var hivtraceClusterGraphSummary = function (graph, tag, not_CDC) {
  var summary_table;

  summary_table = d3.select(tag).select("tbody");
  if (summary_table.empty()) {
    summary_table = d3.select(tag).append("tbody");
  }

  var table_data = [];

  if (!summary_table.empty()) {
    _.each(graph["Network Summary"], (value, key) => {
      if (key === "Clusters") {
        value = _.size(graph["Cluster description"]);
      }

      if (_.isNumber(value)) {
        table_data.push([
          __("statistics")[key.replace(/ /g, "_").toLowerCase()],
          value,
        ]);
      }
    });
  }

  var degrees = [];
  _.each(graph["Degrees"]["Distribution"], (value, index) => {
    for (var k = 0; k < value; k++) {
      degrees.push(index + 1);
    }
  });
  degrees = helpers.describe_vector(degrees);
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

  degrees = helpers.describe_vector(graph["Cluster sizes"]);
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
    "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "range</i>",
    degrees["Q1"] + " - " + degrees["Q3"],
  ]);

  if (!not_CDC) {
    degrees = helpers.describe_vector(
      _.map(graph["Edges"], (e) => e.length)
    );
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
      "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "range</i>",
      _defaultPercentFormat(degrees["Q1"]) +
      " - " +
      _defaultPercentFormat(degrees["Q3"]),
    ]);
  }

  var rows = summary_table.selectAll("tr").data(table_data);
  rows.enter().append("tr");
  rows.exit().remove();
  var columns = rows.selectAll("td").data((d) => d);
  columns.enter().append("td");
  columns.exit();
  columns.html((d) => d);
};

module.exports.hivtraceClusterGraphSummary = hivtraceClusterGraphSummary;
