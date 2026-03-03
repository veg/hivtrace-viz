import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

/**
 * @function oldest_nodes_first
 * @description Compares two nodes to determine which one is older based on their diagnosis date.
 * @param {Object} n1 - The first node object.
 * @param {Object} n2 - The second node object.
 * @param {Object} self - The network object.
 * @param {Object} timeDateUtil - The time/date utility module.
 * @param {string} date_field - Optional date field to use.
 * @returns {number} -1 if n1 is older, 1 if n2 is older, or based on ID if dates are equal.
 */
export const oldest_nodes_first = function (n1, n2, self, timeDateUtil, date_field) {
  const d_field = date_field || timeDateUtil._networkCDCDateField;

  // consistent node sorting, older nodes first
  var node1_dx = self.attribute_node_value_by_id(n1, d_field);
  var node2_dx = self.attribute_node_value_by_id(n2, d_field);

  if (node1_dx === node2_dx) {
    return n1.id < n2.id ? -1 : 1;
  }
  return node1_dx < node2_dx ? -1 : 1;
};

/**
 * @function view_subcluster
 * @description Displays a subcluster view with various filtering and naming options.
 * @param {Object} cluster - The cluster object to view.
 * @param {Function|Array} custom_filter - A custom filter function or array of nodes.
 * @param {string} custom_name - A custom name for the subcluster view.
 * @param {Object} view_sub_options - Additional options for the subcluster view.
 * @param {Function} custom_edge_filter - A custom filter function for edges.
 * @param {boolean} include_injected_edges - If true, includes injected edges.
 * @param {number} length_threshold - The length threshold for subclusters.
 * @param {Object} self - The network object.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} timeDateUtil - Time/date utility module.
 * @param {Object} helpers - Helper functions.
 * @param {Function} i18n - Translation function.
 * @returns {Object} The cluster view object.
 */
export function view_subcluster(
  cluster,
  custom_filter,
  custom_name,
  view_sub_options,
  custom_edge_filter,
  include_injected_edges,
  length_threshold,
  self,
  kGlobals,
  timeDateUtil,
  helpers,
  i18n
) {
  length_threshold = length_threshold || self.subcluster_threshold;

  view_sub_options = view_sub_options || {};
  view_sub_options["parent_graph"] = self;

  let nodes = cluster.children;
  if (custom_filter) {
    if (_.isArray(custom_filter)) {
      nodes = custom_filter;
    } else {
      nodes = _.filter(self.json.Nodes, custom_filter);
    }
  }

  var filtered_json = self.extract_single_cluster(
    nodes,
    custom_edge_filter || ((e) => e.length <= length_threshold),
    false,
    null,
    include_injected_edges
  );

  if (self.has_multiple_sequences) {
    _.each(filtered_json.Nodes, (n) => {
      if (n["multiple subclusters"]) n["multiple_membership"] = true;
    });
    if (view_sub_options["simplified-mspp"]) {
      filtered_json = self.simplify_multisequence_cluster(filtered_json);
    }
  }

  _.each(filtered_json.Nodes, (n) => {
    n.subcluster_label = "1.1";
  });

  if (kGlobals.network.GraphAttrbuteID in self.json) {
    filtered_json[kGlobals.network.GraphAttrbuteID] = {};
    $.extend(
      true,
      filtered_json[kGlobals.network.GraphAttrbuteID],
      self.json[kGlobals.network.GraphAttrbuteID]
    );
  }

  var extra_menu_items = [
    [
      function (network, item) {
        var enclosure = item.append("div").classed("form-group", true);
        enclosure
          .append("label")
          .text("Recalculate National Priority from ")
          .classed("control-label", true);
        enclosure
          .append("input")
          .attr("type", "date")
          .classed("form-control", true)
          .attr("value", timeDateUtil.DateViewFormatSlider(self.today))
          .attr("max", timeDateUtil.DateViewFormatSlider(self.today))
          .attr(
            "min",
            timeDateUtil.DateViewFormatSlider(
              d3.min(network.nodes, (node) =>
                network.attribute_node_value_by_id(
                  node,
                  timeDateUtil._networkCDCDateField
                )
              )
            )
          )
          .on("change", function (e) {
            //d3.event.preventDefault();
            var set_date = timeDateUtil.DateViewFormatSlider.parse(this.value);
            if (this.value) {
              network._refresh_subcluster_view(set_date);

              enclosure.classed("has-success", true).classed("has-error", false);
            } else {
              enclosure.classed("has-success", false).classed("has-error", true);
            }
          })
          .on("click", (e) => {
            d3.event.stopPropagation();
          });
      },
      null,
    ],
  ];
  if (!self._is_CDC_executive_mode) {
    extra_menu_items.push([
      "Export cluster to .CSV",
      function (network) {
        helpers.export_csv_button(
          network._extract_attributes_for_nodes(
            network._extract_nodes_by_id("1.1"),
            network._extract_exportable_attributes()
          )
        );
      },
    ]);
  }

  view_sub_options["type"] = "subcluster";
  view_sub_options["cluster_id"] = cluster.cluster_id || "N/A";
  if ("extra_menu" in view_sub_options) {
    view_sub_options["extra_menu"]["items"] =
      view_sub_options["extra_menu"]["items"].concat(extra_menu_items);
  } else {
    view_sub_options["extra_menu"] = {
      title: "Action",
      items: extra_menu_items,
    };
  }

  //self._check_for_time_series(extra_menu_items);
  var cluster_view = self.open_exclusive_tab_view_aux(
    filtered_json,
    custom_name || "Subcluster " + cluster.cluster_id,
    view_sub_options
  );
  if (!view_sub_options.skip_recent_rapid) {
    cluster_view.handle_attribute_categorical("subcluster_or_priority_node");
  }
  return cluster_view;
}
