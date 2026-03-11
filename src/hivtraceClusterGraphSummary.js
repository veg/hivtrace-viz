var _ = require("underscore");
var $ = require("jquery");
var helpers = require("./helpers");
var kGlobals = require("./globals");

/**
## hivtraceClusterGraphSummary Function

Creates and populates a summary table for an HIV trace cluster graph.

#### Parameters

* `network`: The network object.
* `tag`: The HTML element selector or jQuery object to append the summary table to.
* `not_CDC`: A flag indicating whether to include CDC-specific statistics or not (optional).

#### Returns

None
*/

function hivtraceClusterGraphSummary(network, tag, not_CDC) {
  var $tag = $(tag);
  if (!$tag.length) return;

  var $tbody = $tag.find("tbody");
  if ($tbody.length === 0) {
    $tbody = $("<tbody></tbody>").appendTo($tag);
  } else {
    $tbody.empty();
  }

  let graph = network.json;
  var table_data = [];

  _.each(graph["Network Summary"], (value, key) => {
    if (not_CDC && key === "Clusters") {
      value = _.size(graph["Cluster description"]);
    }

    if (_.isNumber(value)) {
      table_data.push([
        __("statistics")[key.replace(/ /g, "_").toLowerCase()],
        value,
      ]);
    }
  });

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
    kGlobals.formats.FloatFormat(degrees["mean"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    kGlobals.formats.FloatFormat(degrees["median"]),
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
    kGlobals.formats.FloatFormat(degrees["mean"]),
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    kGlobals.formats.FloatFormat(degrees["median"]),
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

  if (!not_CDC) {
    degrees = helpers.describe_vector(_.map(graph["Edges"], (e) => e.length));

    table_data.push(["Genetic distances (links only)", ""]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
      kGlobals.formats.PercentFormat(degrees["mean"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
      kGlobals.formats.PercentFormat(degrees["median"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
      kGlobals.formats.PercentFormat(degrees["min"]) +
        " - " +
        kGlobals.formats.PercentFormat(degrees["max"]),
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "</i>",
      kGlobals.formats.PercentFormat(degrees["Q1"]) +
        " - " +
        kGlobals.formats.PercentFormat(degrees["Q3"]),
    ]);
  }

  _.each(table_data, (row) => {
    var $tr = $("<tr></tr>").appendTo($tbody);
    _.each(row, (cell) => {
      $("<td></td>").html(cell).appendTo($tr);
    });
  });
}

module.exports.hivtraceClusterGraphSummary = hivtraceClusterGraphSummary;
