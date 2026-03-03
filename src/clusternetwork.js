import * as d3 from "d3";
import _ from "underscore";
import jsConvert from "js-convert-case";
import * as helpers from "./helpers.js";
import * as colorPicker from "./colorPicker.js";
import * as scatterPlot from "./scatterplot.js";
import * as tables from "./tables.js";
import * as timeDateUtil from "./timeDateUtil.js";
import * as nodesTab from "./nodesTab.js";
import * as clustersOfInterest from "./clustersOfInterest.js";
import { hivtrace_cluster_depthwise_traversal } from "./misc";
import * as misc from "./misc"; // Keep misc import
import * as kGlobals from "./globals.js";
import * as network from "./network.js";
import * as HTX from "./hiv_tx_network.js";
import * as columnDefinitions from "./column_definitions.js";
import "jQuery-QueryBuilder";
import "jQuery-QueryBuilder/dist/css/query-builder.default.css";
import "bootstrap-datepicker"; // Keep datepicker import

// Import network configuration helpers
import { initializeNetworkSettings } from "./networkConfig";
import {
  draw_attribute_labels,
  check_for_predefined_shapes,
} from "./networkLegend";
import {
  open_exclusive_tab_close,
  open_exclusive_tab_view,
  open_exclusive_tab_view_aux,
} from "./networkTabs";
import {
  node_size as node_size_ext,
  node_multiple_membership as node_multiple_membership_ext,
  node_color as node_color_ext,
  node_opacity as node_opacity_ext,
  cluster_color as cluster_color_ext,
  link_path_generator as link_path_generator_ext,
  compute_cluster_gradient as compute_cluster_gradient_ext,
} from "./networkStylers";

import * as Tooltips from "./networkTooltips";
import * as NetworkStats from "./networkStatistics";
import * as NetworkSearch from "./networkSearch";
import * as NetworkSubcluster from "./networkSubcluster";
import * as NetworkNodeInteraction from "./networkNodeInteraction";
import * as NetworkUIHelpers from "./networkUIHelpers";
import * as NetworkControls from "./networkControls";
import * as NetworkTablesUI from "./networkTablesUI";
import * as NetworkAttributeMenus from "./networkAttributeMenus";
import * as NetworkAttributeHandlers from "./networkAttributeHandlers";

// Import the refactored social network loader function
import { load_nodes_edges as loadSocialNetworkData } from "./socialNetworkLoader";

/**
 * Renders an HIV transmission network graph.
 * @param {Object} json - The JSON object containing network nodes, edges, and meta-information.
 * @param {string} network_container - The CSS selector of the DOM element where the SVG containing the network will be placed (e.g. '#element').
 * @param {string} [network_status_string] - The CSS selector of the DOM element where the text describing the current state of the network is shown (e.g. '#element').
 * @param {string} [network_warning_tag] - The CSS selector of the DOM element where any warning messages would go (e.g. '#element').
 * @param {string} [button_bar_ui] - The ID of the control bar.
 * @param {Object} [attributes] - A JSON object with mapped node attributes.
 * @param {boolean} [filter_edges_toggle] - A flag to toggle edge filtering.
 * @param {string} [clusters_table] - The CSS selector for the clusters table.
 * @param {string} [nodes_table] - The CSS selector for the nodes table.
 * @param {string} [parent_container] - The CSS selector for the parent container.
 * @param {Object} [options] - Additional options for the graph.
 */
var hivtrace_cluster_network_graph = function (
  json,
  network_container,
  network_status_string,
  network_warning_tag,
  button_bar_ui,
  attributes,
  filter_edges_toggle,
  clusters_table,
  nodes_table,
  parent_container,
  options
) {
  const i18n = (d) => {
    if (typeof __ !== "undefined") {
      return __(d);
    }
    const english_fallbacks = {
      general: {
        cluster: "Cluster",
        attributes: "Attributes",
      },
      clusters_tab: {
        size: "Size",
        number_of_genotypes_in_past_2_months: "Genotypes past 2 mo",
        scaled_number_of_genotypes_in_past_2_months: "Genotypes past 2 mo (scaled)",
        listing_nodes: "Listing nodes",
        expand: "Expand",
        collapse: "Collapse",
        view: "View",
        list: "List",
      },
      clusters_main: {
        collapse_cluster: "Collapse cluster",
      },
    };
    return (
      english_fallbacks[d] ||
      new Proxy(
        {},
        {
          get: (target, prop) => {
            return prop;
          },
        }
      )
    );
  };

  // unpack compact JSON if needed

  if (json.Settings && json.Settings.compact_json) {
    network.unpack_compact_json(json);
  }

  // if schema is not set, set to an empty dictionary
  if (!json[kGlobals.network.GraphAttrbuteID]) {
    json[kGlobals.network.GraphAttrbuteID] = {};
  }

  // Make attributes case-insensitive by LowerCasing all keys in schema
  json[kGlobals.network.GraphAttrbuteID] = Object.fromEntries(
    Object.entries(json[kGlobals.network.GraphAttrbuteID]).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ])
  );

  // Attempt Translations
  $("#filter_input")
    .val("")
    .attr("placeholder", i18n("network_tab")["text_in_attributes"]);
  $("#show_as").html(i18n("attributes_tab")["show_as"]);

  //console.log (json.Nodes[0][kGlobals.network.NodeAttributeID],json.Nodes[1][kGlobals.network.NodeAttributeID]);

  network.normalize_node_attributes(json);
  network.ensure_node_attributes_exist(json);

  /** SLKP 20190902: somehow some of our networks have malformed edges! This will remove them */
  json.Edges = _.filter(json.Edges, (e) => "source" in e && "target" in e);

  /** Not primary networks are individual cluster/subcluster views.
      They don't interfere with the primary network object, and UI elements

   */

  const izPrimaryGraph = network.check_network_option(
    options,
    "secondary",
    true,
    false
  );

  var self = new HTX.HIVTxNetwork(json, button_bar_ui, null, !izPrimaryGraph);

  self.process_multiple_sequences();

  initializeNetworkSettings(
    self,
    options,
    parent_container,
    network_container,
    network_warning_tag
  );

  self.uniqValues = helpers.getUniqueValues(
    self.json.Nodes,
    self.json[kGlobals.network.GraphAttrbuteID]
  );

  self.uniqs = _.mapObject(self.uniqValues, (d) => d.length);

  self.annotate_cluster_changes();

  self.cluster_table = d3.select(clusters_table);

  if (self._is_CDC_) {
    self.priority_set_table = network.check_network_option(
      options,
      "priority-table"
    );
    if (self.priority_set_table) {
      self.priority_set_table = d3.select(self.priority_set_table);
    }
  } else {
    self.priority_set_table = null;
  }

  /** if there's a function passed as "init_code", run it now */

  if (options && _.isFunction(options["init_code"])) {
    options["init_code"].call(null, self, options);
  }

  if (self.is_primary_graph) {
    clustersOfInterest.init(self);
    nodesTab.init(d3.select(nodes_table));
  }

  /** this array contains fields that will be appended to node pop-overs in the network tab
      they will precede all the fields that are shown based on selected labeling */
  self._additional_node_pop_fields = [];

  timeDateUtil.init(options, self._is_CDC_, timeDateUtil._networkCDCDateField);

  if (self._is_CDC_) {
    self._additional_node_pop_fields.push(timeDateUtil._networkCDCDateField);
  }

  if (self.json.Notes) {
    _.each(self.json.Notes, (s) => (self.warning_string += s + "<br>"));
  }

  /**
    the true branch is taken if the network JSON contains "Cluster description"
  */
  if (self.cluster_attributes) {
    self.warning_string += i18n("network_tab")["cluster_display_info"];
    self.showing_diff = true;
    self.cluster_filtering_functions["new"] = self.filter_if_added;
  } else {
    self.showing_diff = false;
    if (
      timeDateUtil.getClusterTimeScale() &&
      "Cluster sizes" in self.json &&
      self.json["Cluster sizes"].length > 250
    ) {
      self.using_time_filter = timeDateUtil.getCurrentDate();
      self.warning_string += i18n("network_tab")["cluster_display_info"];
      self.using_time_filter.setFullYear(
        self.using_time_filter.getFullYear() - 1
      );
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    }
  }

  self.initial_packed =
    options && options["initial_layout"] === "tiled" ? false : true;

  /*------------ Network layout code ---------------*/

  /**
   * @function _get_node_country
   * @description Retrieves the country code for a given node.
   * @param {Object} node - The node object.
   * @returns {string} The country code (Alpha2) of the node.
   */
  self._get_node_country = function (node) {
    var countryCodeAlpha2 = self.attribute_node_value_by_id(node, "country");
    if (countryCodeAlpha2 === kGlobals.missing.label) {
      countryCodeAlpha2 = self.attribute_node_value_by_id(node, "Country");
    }
    return countryCodeAlpha2;
  };

  const tab_context = {
    kGlobals,
    helpers,
    attributes,
    parent_container,
    options,
    hivtrace_cluster_network_graph,
  };

  /**
   * @function open_exclusive_tab_close
   * @description This function closes an exclusive tab and restores the previous one.
   * @param {string} tab_element - The ID of the tab element to close.
   * @param {string} tab_content - The ID of the tab content to remove.
   * @param {string} restore_to_tag - The ID of the tab to restore to.
   * @returns {void}
   */
  self.open_exclusive_tab_close = function (
    tab_element,
    tab_content,
    restore_to_tag
  ) {
    open_exclusive_tab_close(tab_element, tab_content, restore_to_tag);
  };

  /**
   * @function open_exclusive_tab_view
   * @description This function opens an exclusive tab view for a specific cluster.
   * @param {string} cluster_id - The ID of the cluster to view.
   * @param {Function} custom_filter - A custom filter function for nodes.
   * @param {Function} custom_name - A function to generate a custom name for the tab.
   * @param {Object} additional_options - Additional options for the tab view.
   * @param {boolean} include_injected_edges - If true, includes injected edges.
   * @returns {Object} The cluster view object.
   */
  self.open_exclusive_tab_view = function (
    cluster_id,
    custom_filter,
    custom_name,
    additional_options,
    include_injected_edges
  ) {
    return open_exclusive_tab_view(
      self,
      cluster_id,
      custom_filter,
      custom_name,
      additional_options,
      include_injected_edges,
      tab_context
    );
  };

  /**
   * @function open_exclusive_tab_view_aux
   * @description Auxiliary function to open an exclusive tab view.
   * @param {Object} filtered_json - The filtered JSON data for the view.
   * @param {string} title - The title of the new tab.
   * @param {Object} option_extras - Extra options for the tab.
   * @returns {Object} The cluster view object or the ID of the new tab content.
   */
  self.open_exclusive_tab_view_aux = function (
    filtered_json,
    title,
    option_extras
  ) {
    return open_exclusive_tab_view_aux(
      self,
      filtered_json,
      title,
      option_extras,
      tab_context
    );
  };

  // ensure all checkboxes are unchecked at initialization
  $('input[type="checkbox"]').prop("checked", false);

  /**
   * @function handle_node_click
   * @description Handles the click event on a node, displaying a context menu.
   * @param {Object} node - The clicked node object.
   * @returns {void}
   */
  var handle_node_click = function (node) {
    return NetworkNodeInteraction.handle_node_click.call(
      this,
      node,
      self,
      clustersOfInterest,
      i18n
    );
  };

  /**
   * @function get_initial_xy
   * @description Calculates initial x and y coordinates for clusters based on packing or treemap layout.
   * @param {boolean} packed - If true, uses a pack layout; otherwise, uses a treemap layout.
   * @returns {Array} A tuple containing the laid out clusters and all clusters.
   */
  function get_initial_xy(packed) {
    return NetworkNodeInteraction.get_initial_xy(
      packed,
      self,
      max_points_to_render
    );
  }

  /**
   * @function prepare_data_to_graph
   * @description Prepares the graph data for rendering, filtering clusters and nodes.
   * @returns {Object} An object containing prepared graph data (all, edges, nodes, clusters).
   */
  function prepare_data_to_graph() {
    var graphMe = {};
    graphMe.all = [];
    graphMe.edges = [];
    graphMe.nodes = [];
    graphMe.clusters = [];

    var expandedClusters = [];
    var drawnNodes = [];

    self.clusters.forEach((x) => {
      if (self.cluster_display_filter(x)) {
        // Check if hxb2_linked is in a child
        var hxb2_exists =
          x.children.some((c) => c.hxb2_linked) && self.hide_hxb2;
        if (!hxb2_exists) {
          if (x.collapsed) {
            graphMe.clusters.push(x);
            graphMe.all.push(x);
          } else {
            expandedClusters[x.cluster_id] = true;
          }
        }
      }
    });

    self.nodes.forEach((x, i) => {
      if (expandedClusters[x.cluster]) {
        drawnNodes[i] = graphMe.nodes.length + graphMe.clusters.length;
        graphMe.nodes.push(x);
        graphMe.all.push(x);
      }
    });

    self.edges.forEach((x) => {
      if (!(x.removed && self.filter_edges)) {
        if (
          drawnNodes[x.source] !== undefined &&
          drawnNodes[x.target] !== undefined
        ) {
          var y = {};
          for (var prop in x) {
            y[prop] = x[prop];
          }

          y.source = drawnNodes[x.source];
          y.target = drawnNodes[x.target];
          y.ref = x;
          graphMe.edges.push(y);
        }
      }
    });

    return graphMe;
  }

  /**
   * @function _refresh_subcluster_view
   * @description Refreshes the subcluster view based on a given date.
   * @param {Date} set_date - The date to use for refreshing the view.
   * @returns {void}
   */
  self._refresh_subcluster_view = function (set_date) {
    self.annotate_priority_clusters(
      timeDateUtil._networkCDCDateField,
      36,
      12,
      set_date
    );

    var field_def = self.define_attribute_COI_membership(self, set_date);

    //console.log (field_def.dimension);

    if (field_def) {
      _.each(self.nodes, (node) => {
        const attr_v = field_def["map"](node, self);
        HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
          node,
          "subcluster_temporal_view",
          attr_v
        );
      });

      self.inject_attribute_description("subcluster_temporal_view", field_def);
      self._aux_process_category_values(
        self._aux_populate_category_fields(
          field_def,
          "subcluster_temporal_view"
        )
      );
      self.handle_attribute_categorical("subcluster_temporal_view");
    }
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
   * @returns {Object} The cluster view object.
   */
  self.view_subcluster = function (
    cluster,
    custom_filter,
    custom_name,
    view_sub_options,
    custom_edge_filter,
    include_injected_edges,
    length_threshold
  ) {
    return NetworkSubcluster.view_subcluster(
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
    );
  };

  /**
   * @function oldest_nodes_first
   * @description Compares two nodes to determine which one is older based on their diagnosis date.
   * @param {Object} n1 - The first node object.
   * @param {Object} n2 - The second node object.
   * @returns {number} -1 if n1 is older, 1 if n2 is older, or based on ID if dates are equal.
   */
  var oldest_nodes_first = function (n1, n2, date_field) {
    return NetworkSubcluster.oldest_nodes_first(
      n1,
      n2,
      self,
      timeDateUtil,
      date_field
    );
  };

  /**
   * @function annotate_priority_clusters
   * @description Annotates clusters with priority flags based on date and membership criteria.
   * @param {string} date_field - The field in the node object representing the date.
   * @param {number} span_months - The number of months for the long cutoff.
   * @param {number} recent_months - The number of months for the short cutoff.
   * @param {Date} start_date - The starting date for the annotation.
   * @returns {void}
   */
  self.annotate_priority_clusters = function (
    date_field,
    span_months,
    recent_months,
    start_date
  ) {
    /*
        values for priority_flag
            0: 0.5% subcluster
            1: last 12 months NOT in a priority cluster
            2: last 12 month IN priority cluster
            3: in priority cluster but not in 12 months
            4-7 is only computed for start dates different from the network date
            4: date present but is in the FUTURE compared to start_date
            5: date present but is between 1900 and start_date
            6: date missing
            7: in 0.5% cluster 12<dx<36 months but not a CoI


        SLKP 20221128:
            Add a calculation for simple classification of priority clusters

            0: not in a national priority CoI
            1: IN a national priority CoI ≤12 months
            2: IN a national priority CoI 12 - 36 months
            3: IN a national priority CoI >36 months
    */

    try {
      start_date = start_date || self.get_reference_date();

      var cutoff_long = timeDateUtil.n_months_ago(start_date, span_months);
      var cutoff_short = timeDateUtil.n_months_ago(start_date, recent_months);

      var node_iterator;

      if (start_date === self.today) {
        node_iterator = self.nodes;
      } else {
        var beginning_of_time = timeDateUtil.getCurrentDate();
        beginning_of_time.setYear(1900);
        node_iterator = [];
        _.each(self.nodes, (node) => {
          var filter_result = self.filter_by_date(
            beginning_of_time,
            date_field,
            start_date,
            node
            //true
          );
          if (_.isUndefined(filter_result)) {
            node.priority_flag = 6;
          } else if (filter_result) {
            node.priority_flag = 5;
            node_iterator.push(node);
          } else {
            node.priority_flag = 4;
          }
        });
      }

      // extract all clusters at once to avoid inefficiencies of multiple edge-set traversals

      var split_clusters = {};
      var node_id_to_local_cluster = {};

      // reset all annotations

      _.each(node_iterator, (node) => {
        node.nationalCOI = 0;
        if (node.cluster) {
          if (!(node.cluster in split_clusters)) {
            split_clusters[node.cluster] = { Nodes: [], Edges: [] };
          }
          node_id_to_local_cluster[node.id] =
            split_clusters[node.cluster]["Nodes"].length;
          split_clusters[node.cluster]["Nodes"].push(node);
        }
      });

      _.each(self.edges, (edge) => {
        if (edge.length <= self.subcluster_threshold) {
          var edge_cluster = self.nodes[edge.source].cluster;

          var source_id = self.nodes[edge.source].id;
          var target_id = self.nodes[edge.target].id;

          if (
            source_id in node_id_to_local_cluster &&
            target_id in node_id_to_local_cluster
          ) {
            var copied_edge = _.clone(edge);

            copied_edge.source = node_id_to_local_cluster[source_id];
            copied_edge.target = node_id_to_local_cluster[target_id];

            split_clusters[edge_cluster]["Edges"].push(copied_edge);
          }
        }
      });

      const cluster_id_match =
        self.precomputed_subclusters &&
        self.subcluster_threshold in self.precomputed_subclusters
          ? self.precomputed_subclusters
          : null;

      _.each(split_clusters, (cluster_nodes, cluster_index) => {
        /** extract subclusters; all nodes at given threshold */
        /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */

        //var cluster_nodes       = self.extract_single_cluster (cluster.children, null, true);

        var array_index = self.cluster_mapping[cluster_index];

        self.clusters[array_index].priority_score = 0;

        var edges = [];

        /** all clusters with more than one member connected at 'threshold' edge length */
        /** 20241031 SLKP
            Here, if there's more than one sequence per entity,
            additional filtering will take place to NOT retain
            sub-clusters that are comprised entirely of sequences from the same entity
        **/

        let null_subcluster_filter = (cc) => {
          return cc.length > 1;
        };

        if (self.has_multiple_sequences) {
          null_subcluster_filter = (cc) => {
            return self.unique_entity_list(cc).length > 1;
          };
        }

        var subclusters = _.filter(
          hivtrace_cluster_depthwise_traversal(
            cluster_nodes.Nodes,
            cluster_nodes.Edges,
            null,
            edges
          ),
          null_subcluster_filter
        );

        /** all edge sets with more than one edge */
        edges = _.filter(edges, (es) => es.length > 1);

        /** sort subclusters by oldest node */
        _.each(subclusters, (c, i) => {
          c.sort(oldest_nodes_first);
        });

        subclusters.sort((c1, c2) => oldest_nodes_first(c1[0], c2[0]));

        let next_id = subclusters.length + 1;

        subclusters = _.map(subclusters, (c, i) => {
          let subcluster_id = i + 1;

          if (cluster_id_match) {
            const precomputed_values = {};
            _.each(c, (n) => {
              if ("subcluster" in n) {
                var sub_at_k = _.find(
                  n.subcluster,
                  (t) => t[0] === self.subcluster_threshold
                );
                if (sub_at_k) {
                  precomputed_values[
                    sub_at_k[1].split(kGlobals.SubclusterSeparator)[1]
                  ] = 1;
                  return;
                }
              }

              precomputed_values[null] = 1;
            });

            if (
              null in precomputed_values ||
              _.keys(precomputed_values).length !== 1
            ) {
              subcluster_id = next_id++;
            } else {
              subcluster_id = _.keys(precomputed_values)[0];
            }

            /*if ((i+1) !== 0 + subcluster_id) {
                console.log (self.clusters[array_index].cluster_id, i, "=>", subcluster_id, _.keys(precomputed_values));
             }*/
          }

          var label =
            self.clusters[array_index].cluster_id +
            kGlobals.SubclusterSeparator +
            subcluster_id;

          _.each(c, (n) => {
            //if (!("subcluster_label" in n)) {
            n.subcluster_label = label;
            //}
            n.priority_flag = 0;
          });

          return {
            children: _.clone(c),
            parent_cluster: self.clusters[array_index],
            cluster_id: label,
            distances: helpers.describe_vector(
              _.map(edges[i], (e) => e.length)
            ),
          };
        });

        _.each(subclusters, (c) => {
          _compute_cluster_degrees(c);
        });

        self.clusters[array_index].subclusters = subclusters;

        /** now, for each subcluster, extract the recent and rapid part */

        /** Recent & Rapid (National Priority) Cluster: the part of the Sub-Cluster inferred using only cases diagnosed in the previous 36 months
                and at least two cases dx-ed in the previous 12 months; there is a path between all nodes in a National Priority Cluster

            20180406 SLKP: while unlikely, this definition could result in multiple National Priority clusters
            per subclusters; for now we will add up all the cases for prioritization, and
            display the largest National Priority cluster if there is more than one
        */

        _.each(subclusters, (sub) => {
          // extract nodes based on dates

          const date_filter = (n) =>
            self.filter_by_date(cutoff_long, date_field, start_date, n);

          var subcluster_json = self.extract_single_cluster(
            _.filter(sub.children, date_filter),
            null,
            true,
            cluster_nodes
          );

          var rr_cluster = _.filter(
            hivtrace_cluster_depthwise_traversal(
              subcluster_json.Nodes,
              _.filter(
                subcluster_json.Edges,
                (e) => e.length <= self.subcluster_threshold
              )
            ),
            (cc) => cc.length > 1
          );

          sub.rr_count = rr_cluster.length;

          rr_cluster.sort((a, b) => b.length - a.length);

          sub.priority_score = [];
          sub.recent_nodes = [];

          const future_date = new Date(start_date.getTime() + 1e13);

          _.each(rr_cluster, (recent_cluster) => {
            var priority_nodes = _.groupBy(recent_cluster, (n) =>
              self.filter_by_date(cutoff_short, date_field, start_date, n)
            );

            sub.recent_nodes.push(_.map(recent_cluster, (n) => n.id));
            const meets_priority_def =
              true in priority_nodes &&
              priority_nodes[true].length >=
                (self.CDC_data
                  ? self.CDC_data["autocreate-priority-set-size"]
                  : 3);

            if (true in priority_nodes) {
              // recent
              sub.priority_score.push(_.map(priority_nodes[true], (n) => n.id));
              _.each(priority_nodes[true], (n) => {
                n.priority_flag = self.filter_by_date(
                  start_date,
                  date_field,
                  future_date,
                  n
                )
                  ? 4
                  : 1;

                if (meets_priority_def) {
                  if (n.priority_flag === 1) {
                    n.priority_flag = 2;
                  }
                  n.nationalCOI = 1;
                }
              });
            }

            if (false in priority_nodes) {
              // not recent
              _.each(priority_nodes[false], (n) => {
                n.priority_flag = 3;

                if (meets_priority_def) {
                  if (
                    self.filter_by_date(cutoff_long, date_field, start_date, n)
                  ) {
                    n.nationalCOI = 2;
                  } else {
                    n.nationalCOI = 3;
                  }
                } else {
                  n.priority_flag = 7;
                }
              });
            }
          });

          //console.log (sub.recent_nodes);
          self.clusters[array_index].priority_score = sub.priority_score;
        });
      });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * @function default_layout
   * @description Applies a default layout to the clusters, either packed or tiled.
   * @param {boolean} packed - If true, uses a packed layout; otherwise, uses a tiled layout.
   * @returns {void}
   */
  self.default_layout = function (packed) {
    // let's create an array of clusters from the json

    let [init_layout, cluster_set] = get_initial_xy(packed);

    if (self.clusters.length === 0) {
      self.clusters = cluster_set;
    } /*else {
      var coordinate_update = {};
      _.each(self.clusters, (c) => {
        coordinate_update[c.cluster_id] = c;
      });
      _.each(init_layout, (c) => {
        if ("cluster_id" in c) {
          _.extendOwn(coordinate_update[c.cluster_id], c);
        }
      });
    }*/

    //var sizes = network_layout.size();

    var set_init_coords = packed
      ? function (n) {
          if ("x" in n) {
            n.x += n.r * 0.5;
            n.y += n.r * 0.5;
          } else {
            n.x = Math.random() * self.width;
            n.y = Math.random() * self.height;
          }
        }
      : function (n) {
          if ("x" in n) {
            n.x += n.dx * 0.5;
            n.y += n.dy * 0.5;
          } else {
            n.x = Math.random() * self.width;
            n.y = Math.random() * self.height;
          }
        };

    _.each([self.nodes, self.clusters], (list) => {
      _.each(list, set_init_coords);
    });

    self.clusters.forEach(self.collapse_cluster);
  };

  /**
   * @function change_spacing
   * @description Adjusts the spacing between nodes in the network layout.
   * @param {number} delta - The factor by which to change the charge correction.
   * @returns {void}
   */
  self.change_spacing = function (delta) {
    self.charge_correction *= delta;
    network_layout.start();
  };

  /**
   * @function change_window_size
   * @description Changes the size of the network visualization window.
   * @param {number} delta - The amount by which to change the width and height.
   * @param {boolean} trigger - If true, triggers a network layout restart.
   * @returns {void}
   */
  self.change_window_size = function (delta, trigger) {
    if (delta) {
      var x_scale = (self.width + delta / 2) / self.width;
      var y_scale = (self.height + delta / 2) / self.height;

      self.width += delta;
      self.height += delta;

      var rescale_x = d3.scale
        .linear()
        .domain(d3.extent(network_layout.nodes(), (node) => node.x));
      rescale_x.range(_.map(rescale_x.domain(), (v) => v * x_scale));
      //.range ([50,self.width-50]),
      var rescale_y = d3.scale
        .linear()
        .domain(d3.extent(network_layout.nodes(), (node) => node.y));
      rescale_y.range(_.map(rescale_y.domain(), (v) => v * y_scale));

      _.each(network_layout.nodes(), (node) => {
        node.x = rescale_x(node.x);
        node.y = rescale_y(node.y);
      });
    }

    self.width = Math.min(Math.max(self.width, 200), 4000);
    self.height = Math.min(Math.max(self.height, 200), 4000);

    network_layout.size([self.width, self.height]);
    self.network_svg.attr("width", self.width).attr("height", self.height);
    if (trigger) {
      network_layout.start();
    } else if (delta) {
      self.update(true);
    }
  };

  /**
   * @function compute_adjacency_list
   * @description Computes the adjacency list for each node in the network.
   * @returns {void}
   */
  self.compute_adjacency_list = _.once(() => {
    NetworkStats.compute_adjacency_list(self);
  });

  /**
   * @function compute_local_clustering_coefficients
   * @description Computes the local clustering coefficient for each node in the network.
   * @returns {void}
   */
  self.compute_local_clustering_coefficients = _.once(() => {
    NetworkStats.compute_local_clustering_coefficients(self, misc);
  });

  /**
   * @function get_node_by_id
   * @description Retrieves a node object by its ID.
   * @param {string} id - The ID of the node to retrieve.
   * @returns {Object} The node object with the specified ID, or undefined if not found.
   */
  self.get_node_by_id = function (id) {
    return NetworkStats.get_node_by_id(self, id);
  };

  /**
   * @function compute_local_clustering_coefficients_worker
   * @description Computes local clustering coefficients using a web worker.
   * @returns {void}
   */
  self.compute_local_clustering_coefficients_worker = _.once(() => {
    NetworkStats.compute_local_clustering_coefficients_worker(self, misc);
  });

  /**
   * @function compute_global_clustering_coefficients
   * @description Computes the global clustering coefficient for each cluster in the network.
   * @returns {void}
   */
  self.compute_global_clustering_coefficients = _.once(() => {
    NetworkStats.compute_global_clustering_coefficients(
      self,
      misc,
      estimate_cubic_compute_cost
    );
  });

  /**
   * @function mark_nodes_as_processing
   * @description Marks nodes with a specified property to indicate they are being processed.
   * @param {string} property - The property name to set on the nodes.
   * @returns {void}
   */
  self.mark_nodes_as_processing = function (property) {
    NetworkStats.mark_nodes_as_processing(self, property, misc);
  };

  /**
   * @function compute_graph_stats
   * @description Computes and displays various graph statistics.
   * @returns {void}
   */
  self.compute_graph_stats = function () {
    NetworkStats.compute_graph_stats(self, misc, this);
  };

  /*------------ Constructor ---------------*/
  /**
   * @function initial_json_load
   * @description Initializes the network graph from the provided JSON data.
   * @returns {void}
   */
  function initial_json_load() {
    var connected_links = {};
    var total = 0;
    self.exclude_cluster_ids = {};
    self.has_hxb2_links = false;
    self.cluster_sizes = [];
    self.cluster_sizes_in_entities = {};

    let cluster_set = new Set();

    graph_data.Nodes.forEach((d) => {
      if (typeof self.cluster_sizes[d.cluster - 1] === "undefined") {
        self.cluster_sizes[d.cluster - 1] = 1;
      } else {
        self.cluster_sizes[d.cluster - 1]++;
      }
      cluster_set.add(d.cluster);
      if ("is_lanl" in d) {
        d.is_lanl = d.is_lanl === "true";
      }

      if (!("attributes" in d)) {
        d.attributes = [];
      }

      if (d.attributes.indexOf("problematic") >= 0) {
        self.has_hxb2_links = true;
        d.hxb2_linked = true;
      }
    });

    if (self.has_multiple_sequences) {
      let entity_count = 0;
      self.apply_to_entities((entity_id, nodes) => {
        if (self.cluster_sizes_in_entities[nodes[0].cluster]) {
          self.cluster_sizes_in_entities[nodes[0].cluster]++;
        } else {
          self.cluster_sizes_in_entities[nodes[0].cluster] = 1;
        }
        entity_count++;
      });
      if (self.json["Network Summary"]) {
        self.json["Network Summary"]["Nodes"] = entity_count;
        self.json["Network Summary"]["Clusters"] = _.size(
          self.cluster_sizes_in_entities
        );
        self.json["Cluster sizes"] = [];
        _.each(self.cluster_sizes_in_entities, (d, c) => {
          self.json["Cluster sizes"].push(d);
        });
      }
    } else {
      if (self.json["Network Summary"]) {
        self.json["Network Summary"]["Clusters"] = cluster_set.size;
      }
    }

    /* add buttons and handlers */
    /* clusters first */

    /**
     * @function _extract_attributes_for_nodes
     * @description Extracts specified attributes for a list of nodes.
     * @param {Array<Object>} nodes - An array of node objects.
     * @param {Array<Object>} column_names - An array of column name objects, each with a `raw_attribute_key`.
     * @returns {Array<Array<string>>} A 2D array where the first row is headers and subsequent rows are node attribute values.
     */
    self._extract_attributes_for_nodes = function (nodes, column_names) {
      return NetworkUIHelpers.extract_attributes_for_nodes(
        nodes,
        column_names,
        self,
        tables,
        HTX
      );
    };

    /**
     * @function _extract_exportable_attributes
     * @description Extracts attributes that are suitable for export.
     * @param {boolean} extended - If true, includes extended attributes like Node ID and Cluster.
     * @returns {Array<Object>} An array of attribute objects.
     */
    self._extract_exportable_attributes = function (extended) {
      return NetworkUIHelpers.extract_exportable_attributes(
        extended,
        self,
        kGlobals,
        tables,
        i18n
      );
    };

    self._extract_mjc_attributes = function (priority_group_name) {
      return NetworkUIHelpers.extract_mjc_attributes(
        priority_group_name,
        self,
        kGlobals,
        timeDateUtil
      );
    };

    /**
     * @function _extract_nodes_by_id
     * @description Extracts nodes belonging to a specific cluster or subcluster ID.
     * @param {string} id - The ID of the cluster or subcluster.
     * @returns {Array<Object>} An array of node objects.
     */
    self._extract_nodes_by_id = function (id) {
      return NetworkUIHelpers.extract_nodes_by_id(id, self);
    };

    /**
     * @function _cluster_list_view_render
     * @description Renders a list view of cluster nodes, optionally grouped by attribute.
     * @param {string} cluster_id - The ID of the cluster to render.
     * @param {boolean} group_by_attribute - If true, groups nodes by attribute; otherwise, lists individual nodes.
     * @param {Object} the_list - The D3 selection of the list element to render into.
     * @param {string} priority_group - The name of the priority group (if applicable).
     * @returns {void}
     */
    self._cluster_list_view_render = function (
      cluster_id,
      group_by_attribute,
      the_list,
      priority_group
    ) {
      return NetworkUIHelpers.cluster_list_view_render(
        cluster_id,
        group_by_attribute,
        the_list,
        priority_group,
        self,
        kGlobals,
        timeDateUtil,
        helpers,
        i18n
      );
    };

    /**
     * @function _setup_cluster_list_view
     * @description Sets up the cluster list view, including event listeners for toggling and modal display.
     * @returns {void}
     */
    self._setup_cluster_list_view = function () {
      return NetworkUIHelpers.setup_cluster_list_view(
        self,
        kGlobals,
        timeDateUtil,
        helpers,
        i18n,
        tables,
        clustersOfInterest
      );
    };

    $(self.get_ui_element_selector_by_role("priority_set_merge", true)).on(
      "show.bs.modal",
      (event) => {
        var modal = d3.select(
          self.get_ui_element_selector_by_role("priority_set_merge", true)
        );

        const desc = modal.selectAll(".modal-desc");

        const proceed_btn = d3.select(
          self.get_ui_element_selector_by_role(
            "priority_set_merge_table_proceed",
            true
          )
        );

        if (
          self.defined_priority_groups &&
          self.defined_priority_groups.length > 1
        ) {
          desc.text("Select two or more clusters of interest to merge");

          var headers = [
            [
              {
                value: "Select",
              },
              {
                value: "Cluster of interest",
                help: "Cluster of interest Name",
                sort: "value",
              },
              {
                value: "Persons",
                help: "How many persons are in this cluster of interest",
                sort: "value",
              },
              {
                value: "Overlaps",
                help: "Overlaps with",
                sort: "value",
              },
            ],
          ];

          const current_selection = new Set();
          let current_node_set = null;
          let current_node_objects = null;

          const handle_selection = (name, selected) => {
            if (selected) {
              current_selection.add(name);
            } else {
              current_selection.delete(name);
            }
            if (current_selection.size > 1) {
              let clusterOITotalNOdes = 0;
              current_node_set = new Set();
              current_node_objects = {};
              _.each(self.defined_priority_groups, (pg) => {
                if (current_selection.has(pg.name)) {
                  clusterOITotalNOdes += self.unique_entity_list(
                    pg.node_objects
                  ).length;
                  _.each(pg.nodes, (n) => {
                    current_node_set.add(n.name);
                    current_node_objects[n.name] = {
                      _priority_set_date: n.added,
                      _priority_set_kind: n.kind,
                    };
                  });
                }
              });
              desc.html(
                "Merge " +
                  current_selection.size +
                  " clusterOI with " +
                  clusterOITotalNOdes +
                  " persons, creating a new clusterOI with " +
                  self.unique_entity_list_from_ids([...current_node_set])
                    .length +
                  " persons. <br><small>Note that the clusters of interest being merged will <b>not</b> be automatically deleted</small>"
              );
              proceed_btn.attr("disabled", null);
            } else {
              desc.text("Select two or more clusters of interest to merge");
              proceed_btn.attr("disabled", "disabled");
            }
          };

          const handle_merge = () => {
            if (current_node_set) {
              clustersOfInterest.open_editor(
                self,
                [],
                "",
                "Merged from " + [...current_selection].join(" and ")
              );
              clustersOfInterest
                .get_editor()
                .append_nodes(
                  [...current_node_set],
                  current_node_objects,
                  true
                );
            }
            $(modal.node()).modal("hide");
          };

          proceed_btn.attr("disabled", "disabled").on("click", handle_merge);

          var rows = [];
          _.each(self.defined_priority_groups, (pg) => {
            const my_overlaps = new Set();
            _.each(pg.node_objects, (n) => {
              _.each(
                [...self.priority_node_overlap[self.entity_id(n)]],
                (ps) => {
                  if (ps !== pg.name) {
                    my_overlaps.add(ps);
                  }
                }
              );
            });

            rows.push([
              {
                value: pg,
                callback: function (element, payload) {
                  var this_cell = d3.select(element);
                  this_cell
                    .append("input")
                    .attr("type", "checkbox")
                    .style("margin-left", "1em")
                    .on("click", function (e) {
                      handle_selection(payload.name, $(this).prop("checked"));
                    });
                },
              },
              { value: pg.name },
              { value: self.unique_entity_list(pg.node_objects).length },
              {
                value: [...my_overlaps],
                format: (d) => d.join("<br>"),
                html: true,
              },
            ]);
          });

          tables.add_a_sortable_table(
            modal.select(
              self.get_ui_element_selector_by_role(
                "priority_set_merge_table",
                true
              )
            ),
            headers,
            rows,
            true,
            null,
            clustersOfInterest.get_editor()
          );
        }
      }
    );

    // Setup cluster list view for both regular networks (with button bar) and MJC networks
    if (button_bar_ui || self.isMJCNetwork) {
      self._setup_cluster_list_view();
    }

    if (button_bar_ui) {
      NetworkControls.setup_network_controls(
        self,
        i18n,
        helpers,
        timeDateUtil,
        tables,
        misc,
        clustersOfInterest
      );
    }

    if (kGlobals.network.GraphAttrbuteID in self.json) {
      attributes = self.json[kGlobals.network.GraphAttrbuteID];
    } else if (attributes && "hivtrace" in attributes) {
      attributes = attributes["hivtrace"];
    }

    // Initialize class attributes
    singletons = graph_data.Nodes.filter((v, i) => v.cluster === null).length;

    self.nodes_by_cluster = {};

    self.nodes = graph_data.Nodes.filter((v, i) => {
      if (
        v.cluster &&
        typeof self.exclude_cluster_ids[v.cluster] === "undefined"
      ) {
        if (v.cluster in self.nodes_by_cluster) {
          self.nodes_by_cluster[v.cluster].push(v);
        } else {
          self.nodes_by_cluster[v.cluster] = [v];
        }

        connected_links[i] = total++;
        return true;
      }
      return false;
    });

    self.edges = graph_data.Edges.filter(
      (v, i) => v.source in connected_links && v.target in connected_links
    );

    self.edges = self.edges.map((v, i) => {
      var cp_v = _.clone(v);
      cp_v.source = connected_links[v.source];
      cp_v.target = connected_links[v.target];
      cp_v.id = i;
      return cp_v;
    });

    compute_node_degrees(self.nodes, self.edges);

    self.default_layout(self.initial_packed);
    self.clusters.forEach((d, i) => {
      self.cluster_mapping[d.cluster_id] = i;
      d.hxb2_linked = d.children.some((c) => c.hxb2_linked);
      _compute_cluster_degrees(d);
      d.distances = [];
    });

    try {
      if (options && options["extra_menu"]) {
        var extra_ui_container = d3.select(
          self.get_ui_element_selector_by_role("extra_operations_container")
        );

        d3.select(
          self.get_ui_element_selector_by_role("extra_operations_enclosure")
        )
          .selectAll("button")
          .text(options["extra_menu"]["title"])
          .append("span")
          .classed("caret", "true");
        //extra_ui_container
        extra_ui_container.selectAll("li").remove();

        options["extra_menu"]["items"].forEach(function (item, index) {
          //console.log (item);
          var handler_callback = item[1];
          if (_.isFunction(item[0])) {
            item[0](self, this.append("li"));
          } else {
            this.append("li")
              .append("a")
              .text(item[0])
              .attr("href", "#")
              .on("click", function (e) {
                handler_callback(self, this);
                d3.event.preventDefault();
              });
          }
        }, extra_ui_container);

        d3.select(
          self.get_ui_element_selector_by_role("extra_operations_enclosure")
        ).style("display", null);
      }
    } catch (err) {
      console.log(err);
    }

    self._aux_populate_category_menus = function (subset) {
      return NetworkAttributeMenus.aux_populate_category_menus(
        subset,
        self,
        i18n,
        kGlobals,
        HTX,
        button_bar_ui
      );
    };

    if (attributes) {
      /*
         map attributes into nodes and into the graph object itself using
         kGlobals.network.GraphAttrbuteID as the key
      */

      if ("attribute_map" in attributes) {
        var attribute_map = attributes["attribute_map"];

        if ("map" in attribute_map && attribute_map["map"].length > 0) {
          graph_data[kGlobals.network.GraphAttrbuteID] = attribute_map[
            "map"
          ].map((a, i) => ({
            label: a,
            type: null,
            values: {},
            index: i,
            range: 0,
          }));

          graph_data.Nodes.forEach((n) => {
            n[kGlobals.network.GraphAttrbuteID] = n.id.split(
              attribute_map["delimiter"]
            );
            n[kGlobals.network.GraphAttrbuteID].forEach((v, i) => {
              if (i < graph_data[kGlobals.network.GraphAttrbuteID].length) {
                if (
                  !(
                    v in
                    graph_data[kGlobals.network.GraphAttrbuteID][i]["values"]
                  )
                ) {
                  graph_data[kGlobals.network.GraphAttrbuteID][i]["values"][v] =
                    graph_data[kGlobals.network.GraphAttrbuteID][i]["range"];
                  graph_data[kGlobals.network.GraphAttrbuteID][i]["range"] += 1;
                }
              }
              //graph_data [kGlobals.network.GraphAttrbuteID][i]["values"][v] = 1 + (graph_data [kGlobals.network.GraphAttrbuteID][i]["values"][v] ? graph_data [kGlobals.network.GraphAttrbuteID][i]["values"][v] : 0);
            });
          });

          graph_data[kGlobals.network.GraphAttrbuteID].forEach((d) => {
            if (
              d["range"] < graph_data.Nodes.length &&
              d["range"] > 1 &&
              d["range"] <= 20
            ) {
              d["type"] = "category";
            }
          });
        }
      }

      for (const [key, def] of Object.entries(
        self._networkPredefinedAttributeTransforms
      )) {
        self.populate_predefined_attribute(def, key);
      }

      self._aux_populate_category_menus();
    }

    if (self.cluster_sizes.length > max_points_to_render) {
      var sorted_array = _.filter(
        _.map(self.cluster_sizes, (d, i) => [d, i + 1]),
        (d) => !_.isUndefined(d[0])
      );
      sorted_array = sorted_array.sort((a, b) => a[0] - b[0]);

      //.map((d, i) => [d, i + 1])
      //.sort((a, b) => a[0] - b[0]);

      for (var k = 0; k < sorted_array.length - max_points_to_render; k++) {
        self.exclude_cluster_ids[sorted_array[k][1]] = 1;
      }

      if (_.size(self.exclude_cluster_ids)) {
        self.warning_string +=
          (self.warning_string.length ? "<br>" : "") +
          "Excluded " +
          (sorted_array.length - max_points_to_render) +
          " clusters (maximum size " +
          sorted_array[k - 1][0] +
          " nodes) because only " +
          max_points_to_render +
          " objects can be shown at once.";
      }
    }

    self.edges.forEach((e, i) => {
      self.clusters[
        self.cluster_mapping[self.nodes[e.target].cluster]
      ].distances.push(e.length);
    });

    self.clusters.forEach((d, i) => {
      d.distances = helpers.describe_vector(d.distances);
    });
    //self.clusters

    if (
      network.check_network_option(
        options,
        "auto_expand_single_cluster",
        false,
        true
      )
    ) {
      if (self.clusters.length == 1) {
        self.clusters[0].collapsed = false;
      }
    }

    self.update();
  }

  /**
   * @function _cluster_table_draw_id
   * @description Draws the ID column for the cluster table, including view buttons for subclusters and clusters.
   * @param {HTMLElement} element - The HTML element for the table cell.
   * @param {Array} payload - The data payload for the cell, containing cluster ID and type.
   * @returns {void}
   */
  self._cluster_table_draw_id = function (element, payload) {
    return NetworkTablesUI.cluster_table_draw_id(
      element,
      payload,
      self,
      kGlobals,
      i18n
    );
  };

  /**
   * @function _cluster_table_draw_buttons
   * @description Draws buttons for cluster table rows, including expand/collapse, problematic status, and change view.
   * @param {HTMLElement} element - The HTML element for the table cell.
   * @param {Array} payload - The data payload for the cell, containing cluster information.
   * @returns {void}
   */
  self._cluster_table_draw_buttons = function (element, payload) {
    return NetworkTablesUI.cluster_table_draw_buttons(
      element,
      payload,
      self,
      i18n,
      HTX
    );
  };

  /**
   * @function _node_table_draw_buttons
   * @description Draws buttons for node table rows, including hide/show and view cluster.
   * @param {HTMLElement} element - The HTML element for the table cell.
   * @param {Array} payload - The data payload for the cell, containing node information.
   * @returns {void}
   */
  function _node_table_draw_buttons(element, payload) {
    var this_cell = d3.select(element);
    let labels;
    if (payload.length === 1) {
      if (_.isString(payload[0])) {
        labels = [[payload[0], 1, "btn-warning"]];
      } else {
        labels = ["can't be shown", 1];
      }
    } else {
      labels = [[payload[0] ? "hide" : "show", 0]];
      // TODO: deprecated? remove if not needed (5/22/2024 meeting with @spond, @daniel-ji, @stevenweaver)
    }

    if (payload.length === 2 && payload[1] >= 1) {
      labels.push([
        "view cluster",
        function () {
          self.open_exclusive_tab_view(payload[1]);
        },
      ]);
    }

    var buttons = this_cell.selectAll("button").data(labels);
    buttons.enter().append("button");
    buttons.exit().remove();
    buttons
      .classed("btn btn-xs btn-node-property", true)
      .classed("btn-primary", true)
      //.classed(function (d) {return d.length >=3 ? d[2] : "";}, function (d) {return d.length >= 3;})
      .text((d) => d[0])
      .attr("disabled", (d) =>
        d[1] && !_.isFunction(d[1]) ? "disabled" : null
      )
      .on("click", (d) => {
        if (_.isFunction(d[1])) {
          d[1].call(d);
        } else if (d[1] === 0) {
          if (payload[0]) {
            self.collapse_cluster(self.clusters[payload[3] - 1], true);
          } else {
            self.expand_cluster(self.clusters[payload[3] - 1]);
          }
          //format_a_cell(d3.select(element).datum(), null, element);
          self.update_volatile_elements(nodesTab.getNodeTable());
        }
      });
    buttons.each(function (d, e) {
      if (d.length >= 3) {
        d3.select(this).classed("btn-primary", false).classed(d[2], true);
      }
    });
  }

  /*self.process_table_volatile_event = function (e) {
    console.log (e);
    e.detail
      .selectAll("td")
      .filter(function(d) {
        return "volatile" in d;
      })
      .each(function(d, i) {
        format_a_cell(d, i, this);
      });
  };*/

  self.update_volatile_elements = function (container, suppress_editor) {
    //var event = new CustomEvent('hiv-trace-viz-volatile-update', { detail: container });
    //container.node().dispatchEvent (event);

    const coe = !suppress_editor ? clustersOfInterest.get_editor() : null;

    container
      .selectAll("td, th")
      .filter((d) => "volatile" in d)
      .each(function (d, i) {
        // TODO: QUESTION: Should this have priority_set_editor arg passed in as well?
        tables.format_a_cell(d, i, this, coe);
      });
  };

  self.redraw_tables = function () {
    self.update_volatile_elements(self.cluster_table);
    if (self.subcluster_table) {
      self.update_volatile_elements(self.subcluster_table);
    }
    const nt = nodesTab.getNodeTable();
    self.update_volatile_elements(
      nt,
      nt.node_table_N > nt.node_table_DN ||
        nt.node_table_DN > kGlobals.CoIAddLimit
    );
    if (self.priority_set_table) {
      self.update_volatile_elements(self.priority_set_table);
    }
  };

  /**
   * @function draw_extended_node_table
   * @description Draws an extended table of nodes with their attributes.
   * @param {Array<Object>} node_list - An array of node objects to display.
   * @param {HTMLElement} container - The container element for the table.
   * @param {Array} extra_columns - An array of extra columns to add to the table.
   * @param {Object} options - Additional options for the table.
   * @returns {void}
   */
  self.draw_extended_node_table = function (
    node_list,
    container,
    extra_columns,
    options
  ) {
    container = container || nodesTab.getNodeTable();
    options = options || {};

    if (container) {
      node_list = node_list || self.aggregate_indvidual_level_records();

      const N = node_list.length;

      if (node_list.length > max_nodes_to_show) {
        node_list = node_list.slice(0, max_nodes_to_show);
      }

      container.node_table_N = N;
      container.node_table_DN = node_list.length;

      var column_ids = self._extract_exportable_attributes(true);

      self.displayed_node_subset = _.filter(
        _.map(self.displayed_node_subset, (n, i) => {
          if (_.isString(n)) {
            n = _.find(column_ids, (cd) => cd.raw_attribute_key === n);

            if (n) {
              return n;
            }
            return column_ids[i];
          }
          return n;
        }),
        (c) => c
      );

      var node_data = self._extract_attributes_for_nodes(
        node_list,
        self.displayed_node_subset
      );
      node_data.splice(0, 1);

      var table_headers = _.map(self.displayed_node_subset, (n, col_id) => ({
        value: n.raw_attribute_key,
        sort: "value",
        filter: options && options["no-filter"] ? false : true,
        volatile: true,
        help: "label" in n ? n.label : n.raw_attribute_key,
        callback: function (element, payload) {
          var dropdown = d3
            .select(element)
            .append("div")
            .classed("dropdown", true);
          // add col_id to ensure that the dropdowns are unique
          var menu_id = "hivtrace_node_column_" + payload + "_" + col_id;
          var dropdown_button = dropdown
            .append("button")
            .classed({
              btn: true,
              "btn-default": true,
              "btn-xs": true,
              "dropdown-toggle": true,
            })
            .attr("type", "button")
            .attr("data-toggle", "dropdown")
            .attr("aria-haspopup", "true")
            .attr("aria-expanded", "false")
            .attr("id", menu_id);

          function format_key(key) {
            const formattedKey = jsConvert.toHeaderCase(key);
            const words = formattedKey.split(" ");
            const mappedWords = _.map(words, (word) => {
              if (word.toLowerCase() === "hivtrace") {
                return "HIV-TRACE";
              }
              if (word.toLowerCase() === "id") {
                return "ID";
              }

              return word;
            });
            return mappedWords.join(" ");
          }

          function get_text_label(key) {
            return key in self.json.patient_attribute_schema
              ? self.json.patient_attribute_schema[key].label
              : format_key(key);
          }

          dropdown_button.text(get_text_label(payload));

          dropdown_button.append("i").classed({
            fa: true,
            "fa-caret-down": true,
            "fa-lg": true,
          });
          var dropdown_list = dropdown
            .append("ul")
            .classed("dropdown-menu", true)
            .attr("aria-labelledby", menu_id);

          dropdown_list = dropdown_list
            .selectAll("li")
            .data(
              _.filter(
                column_ids,
                (alt) => alt.raw_attribute_key !== n.raw_attribute_key
              )
            );
          dropdown_list.enter().append("li");
          dropdown_list.each(function (data, i) {
            var handle_change = d3
              .select(this)
              .append("a")
              .attr("href", "#")
              .text((data) => get_text_label(data.raw_attribute_key));
            handle_change.on("click", (d) => {
              self.displayed_node_subset[col_id] = d;
              self.draw_extended_node_table(
                node_list,
                container,
                extra_columns,
                options
              );
            });
          });
          return dropdown;
        },
      }));

      if (extra_columns) {
        _.each(extra_columns, (d) => {
          if (d.prepend) {
            table_headers.splice(0, 0, d.description);
          } else {
            table_headers.push(d.description);
          }
        });
      }
      //console.log (self.displayed_node_subset);

      var table_rows = node_data.map((n, i) => {
        var this_row = _.map(n, (cell, c) => {
          let cell_definition = null;

          if (self.displayed_node_subset[c].type === "Date") {
            cell_definition = {
              value: cell,
              format: function (v) {
                if (v === kGlobals.missing.label) {
                  return v;
                }
                return timeDateUtil.DateViewFormatSlider(v);
              },
            };
          } else if (self.displayed_node_subset[c].type === "Number") {
            cell_definition = { value: cell, format: d3.format(".2f") };
          }
          if (!cell_definition) {
            cell_definition = { value: cell };
          }

          // this makes the table rendering too slow

          /*if (c === 0 && self._is_CDC_) {
             cell_definition.volatile = true;
             cell_definition.actions = function (item, value) {
              if (!clustersOfInterest.get_editor()) {
                    return null;
              } else {
                    return [
                        {
                            "icon"   : "fa-plus-square",
                            "action" : function (button,v) {
                                if (clustersOfInterest.get_editor()) {
                                    clustersOfInterest.get_editor().append_node_objects (d.children);
                                }
                                return false;
                            },
                            "help"   : "Add to priority set"
                        }
                    ];
                }
            };
          }*/

          return cell_definition;
        });

        if (extra_columns) {
          _.each(extra_columns, (ed) => {
            if (ed.prepend) {
              this_row.splice(0, 0, ed.generator(node_list[i], self));
            } else {
              this_row.push(ed.generator(node_list[i], self));
            }
          });
        }

        return this_row;
      });

      self.draw_node_table(
        null,
        node_list,
        [table_headers],
        table_rows,
        container,
        'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network entities <span class="label label-warning" data-hivtrace-ui-role="table-count-warning"></span>',
        N
      );
    }
  };

  /**
   * @function generate_coi_temporal_report
   * @description Generates a temporal report for a given cluster of interest (CoI).
   * @param {Object} ref_set - The reference set for the CoI.
   * @param {number} D - The distance threshold.
   * @returns {Object} A report object containing node and event information.
   */
  self.generate_coi_temporal_report = function (ref_set, D) {
    if (!ref_set) return {};
    D = D || 0.005;

    const nodesD = hivtrace_cluster_depthwise_traversal(
      self.json["Nodes"],
      self.json["Edges"],
      (e) => e.length <= D,
      null,
      ref_set.node_objects
    );

    const full_subclusters = _.map(nodesD, (cc) =>
      self.extract_single_cluster(cc, (e) => e.length <= D)
    );
    // the nodes in full_subclusters are now shallow clones
    // const nodeid2cc = _.chain(nodesD) // unused var
    //   .map((cc, i) => _.map(cc, (n) => [n.id, i]))
    //   .flatten(1)
    //   .object()
    //   .value();
    // node id => index of its connected component in the full_subclusters array
    const pg_nodes = new Set(_.map(ref_set.node_objects, (n) => n.id));
    // set of node IDs in the CoI
    const seed_nodes = _.map(full_subclusters, (fc) =>
      _.filter(fc["Nodes"], (n) => pg_nodes.has(n.id))
    );
    // for each connected component, store the list of nodes that are both in the CC and the CoI
    // these are shallow copies
    _.each(seed_nodes, (sn) => _.each(sn, (n) => (n.visited = false)));

    var beginning_of_time = timeDateUtil.getCurrentDate();
    beginning_of_time.setFullYear(1900);

    // unused var
    // const nodesD2 = _.map(full_subclusters, (fc, i) => hivtrace_cluster_depthwise_traversal(
    //   fc["Nodes"],
    //   fc["Edges"],
    //   (e) => (e.length <= D),
    //   null,
    //   seed_nodes[i]
    // ));

    const network_events = _.sortBy([...self.priority_groups_all_events()]);
    network_events.reverse();
    const info_by_event = {};

    _.each(network_events, (DT) => {
      const event_date = timeDateUtil.DateViewFormatSlider.parse(DT);
      const event_date_m3y = timeDateUtil.DateViewFormatSlider.parse(DT);
      event_date_m3y.setFullYear(event_date.getFullYear() - 3);
      const event_date_m1y = timeDateUtil.DateViewFormatSlider.parse(DT);
      event_date_m1y.setFullYear(event_date.getFullYear() - 1);
      const n_filter = (n) =>
        self.filter_by_date(
          beginning_of_time,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );
      const n_filter3 = (n) =>
        self.filter_by_date(
          event_date_m3y,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );
      const n_filter1 = (n) =>
        self.filter_by_date(
          event_date_m1y,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );

      let nodesD2 = _.map(full_subclusters, (fc, i) => {
        const white_list = new Set(
          _.map(_.filter(fc["Nodes"], n_filter), (n) => n.id)
        );
        const cc_nodes = fc["Nodes"];
        return hivtrace_cluster_depthwise_traversal(
          cc_nodes,
          fc["Edges"],
          (e) =>
            e.length <= D &&
            n_filter3(cc_nodes[e.source]) &&
            n_filter3(cc_nodes[e.target]),
          null,
          _.filter(seed_nodes[i], n_filter),
          white_list
        );
      });

      nodesD2 = _.flatten(nodesD2, 1);
      //console.log (nodesD2);

      info_by_event[DT] = {
        connected_componets: _.map(nodesD2, (nd) => nd.length),
        priority_nodes: _.map(nodesD2, (nd) =>
          _.map(_.filter(nd, n_filter1), (n) => n.id)
        ),
      };

      info_by_event[DT]["national_priority"] = _.map(
        info_by_event[DT].priority_nodes,
        (m) => m.length >= self.CDC_data["autocreate-priority-set-size"]
      );
    });

    const report = {
      node_info: _.map(ref_set.node_objects, (n) => [
        n.id,
        timeDateUtil.DateViewFormatSlider(
          self.attribute_node_value_by_id(n, timeDateUtil._networkCDCDateField)
        ),
      ]),
      event_info: info_by_event,
    };

    /*let options = ["0","1","2","3","4","5","6","7","8","9","10"];
          let rename = {};
          _.each (report.node_info, (n)=> {
                rename[n[0]] = "N" + _.sample (options, 9).join ("");
                n[0] = rename[n[0]];
          });
          _.each (report.event_info, (d)=> {
              d.priority_nodes = _.map (d.priority_nodes, (d)=>_.map (d, (n)=>rename[n]));
          });
          //console.log (report);
          */

    //helpers.export_json_button(report);
    return report;
  };

  /**
   * @function draw_node_table
   * @description Draws a table of nodes with their attributes.
   * @param {Array} extra_columns - An array of extra columns to add to the table.
   * @param {Array<Object>} node_list - An array of node objects to display.
   * @param {Array<Array<Object>>} headers - An array of header definitions for the table.
   * @param {Array<Array<Object>>} rows - An array of row data for the table.
   * @param {HTMLElement} container - The container element for the table.
   * @param {string} table_caption - The caption for the table.
   * @param {number} ND - The total number of nodes.
   * @returns {void}
   */
  self.draw_node_table = function (
    extra_columns,
    node_list,
    headers,
    rows,
    container,
    table_caption,
    ND
  ) {
    container = container || nodesTab.getNodeTable();

    if (container) {
      node_list = node_list || self.nodes;

      ND = ND || node_list.length;

      if (!headers) {
        headers = [
          [
            {
              value: "ID",
              sort: "value",
              help: "Node ID",
            },
            {
              value: "Action",
              sort: "value",
            },
            {
              value: "# of links",
              sort: "value",
              help: "Number of links (Node degree)",
            },
            {
              value: "Cluster",
              sort: "value",
              help: "Which cluster does the node belong to",
            },
          ],
        ];

        if (extra_columns) {
          _.each(extra_columns, (d) => {
            if (d.prepend) {
              headers[0].splice(0, 0, d.description);
            } else {
              headers[0].push(d.description);
            }
          });
        }

        rows = node_list.map((n, i) => {
          var this_row = [
            {
              value: n.id,
              help: "Node ID",
            },
            {
              value: function () {
                if (n.node_class !== "injected") {
                  try {
                    if (self.exclude_cluster_ids[n.cluster]) {
                      // parent cluster can't be rendered
                      // because of size restrictions
                      return [n.cluster];
                    }
                    return [
                      !self.clusters[self.cluster_mapping[n.cluster]].collapsed,
                      n.cluster,
                    ];
                  } catch (err) {
                    return [-1];
                  }
                } else {
                  return [n.node_annotation];
                }
              },
              callback: _node_table_draw_buttons,
              volatile: true,
            },
            {
              value: "degree" in n ? n.degree : "Not defined",
              help: "Node degree",
            },
            {
              value: "cluster" in n ? n.cluster : "Not defined",
              help: "Which cluster does the node belong to",
            },
          ];

          if (extra_columns) {
            _.each(extra_columns, (ed) => {
              if (ed.prepend) {
                this_row.splice(0, 0, ed.generator(n, self));
              } else {
                this_row.push(ed.generator(n, self));
              }
            });
          }
          return this_row;
        });
      }

      tables.add_a_sortable_table(
        container,
        headers,
        rows,
        true,
        table_caption,
        clustersOfInterest.get_editor(),
        ND
      );
    }
  };

  /**
   * @function draw_cluster_table
   * @description Draws a table of clusters with their attributes.
   * @param {Array} extra_columns - An array of extra columns to add to the table.
   * @param {HTMLElement} element - The container element for the table.
   * @param {Object} options - Additional options for the table.
   * @returns {void}
   */
  /**
   * @function draw_cluster_table
   * @description Renders the cluster table with various metrics and action buttons.
   * @param {Array<Object>} extra_columns - Additional column definitions to include in the table.
   * @param {string|HTMLElement} element - The selector or HTML element for the table container.
   * @param {Object} options - Configuration options for table rendering (e.g., skip clusters, subclusters).
   * @returns {void}
   */
  self.draw_cluster_table = function (extra_columns, element, options) {
    return NetworkTablesUI.draw_cluster_table(
      extra_columns,
      element,
      options,
      self,
      i18n,
      kGlobals,
      tables,
      timeDateUtil,
      clustersOfInterest,
      HTX
    );
  };

  /*------------ Update layout code ---------------*/
  /**
   * @function update_network_string
   * @description Updates the network status string with the current counts of nodes, edges, and clusters.
   * @param {number} node_count - The number of nodes currently displayed.
   * @param {number} edge_count - The number of edges currently displayed.
   * @returns {void}
   */
  function update_network_string(node_count, edge_count) {
    if (network_status_string) {
      const clusters_shown = _.filter(
        self.clusters,
        (c) => !c.collapsed
      ).length;

      const clusters_selected = _.filter(
        self.clusters,
        (c) =>
          !c.is_hidden && c.match_filter !== undefined && c.match_filter > 0
      ).length;

      const nodes_selected = _.filter(
        self.nodes,
        (n) => n.match_filter && !n.is_hidden
      ).length;

      // const clusters_removed = self.cluster_sizes.length - self.clusters.length;
      // const nodes_removed = graph_data.Nodes.length - singletons - self.nodes.length;
      // const networkString = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
      //         + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
      //         + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
      // if (singletons > 0) {
      //   networkString += "<strong>" +singletons + "</strong> singleton nodes are not shown. ";
      // }

      const networkString =
        "<span class = 'badge'>" +
        self.clusters.length +
        "</span> clusters <span class = 'label label-primary'>" +
        clusters_shown +
        " expanded / " +
        clusters_selected +
        " match </span> <span class = 'badge'> " +
        self.nodes.length +
        "</span> nodes <span class = 'label label-primary'>" +
        node_count +
        " shown / " +
        nodes_selected +
        " match </span> <span class = 'badge'> " +
        self.edges.length +
        "</span> " +
        (self._is_CDC_ ? "links" : "edges") +
        " <span class = 'label label-primary'>" +
        edge_count +
        " shown</span>";

      d3.select(network_status_string).html(networkString);
    }
  }

  /**
   * @function draw_a_node
   * @description Draws a single node in the network, including its shape, color, and label.
   * @param {HTMLElement} container - The container element for the node.
   * @param {Object} node - The node object to draw.
   * @returns {void}
   */
  function draw_a_node(container, node) {
    if (node) {
      container = d3.select(container);
      //console.log (container.selectAll ("path"));
      //var path_component = containter.selectAll ("path");

      let symbol_type;

      if (node.hxb2_linked && !node.is_lanl) {
        symbol_type = "cross";
      } else if (node.is_lanl) {
        symbol_type = "triangle-down";
      } else {
        symbol_type = self.node_shaper["shaper"](node);
      }

      node.rendered_size = Math.sqrt(node_size(node)) / 2 + 2;

      container
        .selectAll("path")
        .attr("d", misc.symbol(symbol_type).size(node_size(node)))
        .style("fill", (d) => node_color(d))
        .classed(
          "multi_sequence",
          (d) =>
            _.isArray(d[kGlobals.network.AliasedSequencesID]) &&
            d[kGlobals.network.AliasedSequencesID].length > 1
        );

      if (node.show_label) {
        if (container.selectAll("text").empty()) {
          node.label_x = 0;
          node.label_y = 0;
          container
            .append("text")
            .classed("node-label", true)
            .text(node.id)
            .attr(
              "transform",
              "translate(" +
                node.rendered_size * 1.25 +
                "," +
                node.rendered_size * 0.5 +
                ")"
            )
            .datum(node)
            .call(self.node_label_drag);
        }
      } else {
        container.selectAll("text").remove();
      }

      container
        //.attr("d", misc.symbol(symbol_type).size(node_size(node)))
        .attr("class", "node")
        .classed(
          "selected_object",
          (d) => d.match_filter && !self.hide_unselected
        )
        .classed("injected_object", (d) => d.node_class === "injected")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .style("opacity", (d) => node_opacity(d))
        .style("display", (d) => {
          if (d.is_hidden) return "none";
          return null;
        })
        .call(
          network_layout.drag().on("dragstart", (d) => {
            d3.event.sourceEvent.stopPropagation();
            node_pop_off();
          })
        )
        .on("dragend", (d) => {
          d3.event.sourceEvent.stopPropagation();
        })
        .on("click", handle_node_click)
        .on("mouseover", node_pop_on)
        .on("mouseout", node_pop_off);
    }
  }

  /**
   * @function draw_a_cluster
   * @description Draws a single cluster in the network as a pie chart of its constituent nodes.
   * @param {HTMLElement} container - The container element for the cluster.
   * @param {Object} the_cluster - The cluster object to draw.
   * @returns {void}
   */
  function draw_a_cluster(container, the_cluster) {
    var container_group = d3.select(container);

    var draw_from = the_cluster["binned_attributes"]
      ? the_cluster["binned_attributes"].map((d) => d.concat([0]))
      : [[null, 1, 0]];

    if (the_cluster.match_filter) {
      draw_from = draw_from.concat([
        ["selected", the_cluster.match_filter, 1],
        [
          "not selected",
          the_cluster.children.length - the_cluster.match_filter,
          1,
        ],
      ]);
    }

    var sums = [
      d3.sum(
        draw_from.filter((d) => d[2] === 0),
        (d) => d[1]
      ),
      d3.sum(
        draw_from.filter((d) => d[2] !== 0),
        (d) => d[1]
      ),
    ];

    var running_totals = [0, 0];

    draw_from = draw_from.map((d) => {
      var index = d[2];
      var v = {
        container: container,
        cluster: the_cluster,
        startAngle: (running_totals[index] / sums[index]) * 2 * Math.PI,
        endAngle: ((running_totals[index] + d[1]) / sums[index]) * 2 * Math.PI,
        name: d[0],
        rim: index > 0,
      };
      running_totals[index] += d[1];
      return v;
    });

    var arc_radius = cluster_box_size(the_cluster) * 0.5;
    the_cluster.rendered_size = arc_radius + 2;
    var paths = container_group.selectAll("path").data(draw_from);
    paths.enter().append("path");
    paths.exit().remove();

    paths
      .classed("cluster", true)
      .classed(
        "hiv-trace-problematic",
        (d) => the_cluster.hxb2_linked && !d.rim
      )
      .classed("hiv-trace-selected", (d) => d.rim)
      .attr("d", (d) =>
        (d.rim
          ? d3.svg
              .arc()
              .innerRadius(arc_radius + 2)
              .outerRadius(arc_radius + 5)
          : d3.svg.arc().innerRadius(0).outerRadius(arc_radius))(d)
      )
      .style("fill", (d, i) => {
        if (d.rim) {
          return self.colorizer["selected"](d.name);
        }

        if (the_cluster["gradient"]) {
          return "url(#" + the_cluster["gradient"] + ")";
        }

        return cluster_color(the_cluster, d.name);
      })
      .style("stroke-linejoin", (d, i) => (draw_from.length > 1 ? "round" : ""))
      .style("display", (d) => {
        if (the_cluster.is_hidden) return "none";
        return null;
      });
  }

  /**
   * @function handle_shape_categorical
   * @description Handles the selection of a categorical attribute to be used for node shapes.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @returns {void}
   */
  self.handle_shape_categorical = function (cat_id) {
    return NetworkAttributeHandlers.handle_shape_categorical(
      cat_id,
      self,
      i18n,
      kGlobals
    );
  };

  /**
   * @function renderColorPicker
   * @description Renders a color picker for a given category, allowing users to override the default colors.
   * @param {string} cat_id - The ID of the category.
   * @param {string} type - The type of the category (e.g., 'categorical', 'continuous').
   * @returns {void}
   */
  self.renderColorPicker = function (cat_id, type) {
    const renderColorPickerCategorical = function (cat_id) {
      // For each unique value, render item.
      let colorizer = self.colorizer;
      let items = _.map(_.filter(self.uniqValues[cat_id]), (d) =>
        colorPicker.colorPickerInput(d, colorizer)
      );

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change((e) => {
        let color = e.target.value;
        let name = e.target.name;

        // Set color in user-defined colorizer
        if (
          _.isUndefined(
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
          )
        ) {
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"] =
            {};
        }

        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
          name
        ] = color;
        self.handle_attribute_categorical(cat_id);
      });
    };

    const renderColorPickerContinuous = function (cat_id, color_stops) {
      // For each unique value, render item.
      // Min and max range for continuous values
      let items = [
        colorPicker.colorStops("Color Stops", color_stops),
        colorPicker.colorPickerInputContinuous(
          "Min",
          self.uniqValues[cat_id]["min"]
        ),
        colorPicker.colorPickerInputContinuous(
          "Max",
          self.uniqValues[cat_id]["max"]
        ),
      ];

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change((e) => {
        let color = e.target.value;
        let name = e.target.name;

        // Set color in user-defined colorizer
        if (
          _.isUndefined(
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
          )
        ) {
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"] =
            {};
        }

        // get both for user-defined
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
          name
        ] = color;
        self.handle_attribute_continuous(cat_id);
      });

      // Set onchange event for items
      $(".hivtrace-color-stops").change((e) => {
        let num = parseInt(e.target.value);
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]["color_stops"] = num;

        self._aux_populate_category_menus();
        self.handle_attribute_continuous(cat_id);
        self.update();
      });
    };

    if (type === "categorical") {
      renderColorPickerCategorical(cat_id);
    } else if (type === "continuous") {
      renderColorPickerContinuous(
        cat_id,
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]["color_stops"]
      );
    } else {
      console.log("Error: type not recognized");
    }

    if (cat_id !== null) {
      $("#colorPickerOption").show();
    } else {
      $("#colorPickerOption").hide();
    }
  };

  /**
   * @function draw_attribute_labels
   * @description Draws the legend for the current color, shape, and opacity attributes.
   * @returns {void}
   */
  self.draw_attribute_labels = function () {
    draw_attribute_labels(self);
  };

  /**
   * @function compute_cluster_gradient
   * @description Computes a radial gradient for a cluster based on a categorical attribute.
   * @param {Object} cluster - The cluster object.
   * @param {string} cat_id - The category ID to use for the gradient.
   * @returns {string} The ID of the generated gradient.
   */
  self.compute_cluster_gradient = function (cluster, cat_id) {
    return compute_cluster_gradient_ext(self, cluster, cat_id, kGlobals);
  };

  /**
   * @function handle_attribute_opacity
   * @description Handles the selection of a continuous attribute to be used for node opacity.
   * @param {string} cat_id - The ID of the continuous attribute.
   * @returns {void}
   */
  self.handle_attribute_opacity = function (cat_id) {
    return NetworkAttributeHandlers.handle_attribute_opacity(
      cat_id,
      self,
      i18n,
      kGlobals
    );
  };

  /**
   * @function handle_attribute_continuous
   * @description Handles the selection of a continuous attribute to be used for node color.
   * @param {string} cat_id - The ID of the continuous attribute.
   * @returns {void}
   */
  self.handle_attribute_continuous = function (cat_id) {
    return NetworkAttributeHandlers.handle_attribute_continuous(
      cat_id,
      self,
      i18n,
      kGlobals,
      scatterPlot
    );
  };

      const search_context = {
        kGlobals,
        timeDateUtil,
        tables,
      };
  
      /**
       * @function define_node_search_table
       * @description Defines the node search table using jQuery QueryBuilder.
       * @returns {void}
       */
      self.define_node_search_table = function () {
        NetworkSearch.define_node_search_table(self, search_context);
      };
    /**
   * @function handle_attribute_categorical
   * @description Handles the selection of a categorical attribute to be used for node color.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @param {boolean} skip_update - If true, skips updating the network visualization after applying the new color scheme.
   * @returns {void}
   */
  /**
   * @function handle_attribute_categorical
   * @description Handles the selection of a categorical attribute to be used for node coloring.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @param {boolean} skip_update - If true, skips updating the network visualization.
   * @returns {void}
   */
  self.handle_attribute_categorical = function (cat_id, skip_update) {
    return NetworkAttributeHandlers.handle_attribute_categorical(
      cat_id,
      skip_update,
      self,
      i18n,
      kGlobals,
      HTX
    );
  };

  /**
   * @function filter_visibility
   * @description Filters the visibility of nodes and clusters based on whether they match the current filter.
   * @returns {void}
   */
  self.filter_visibility = function () {
    self.clusters.forEach((c) => {
      c.is_hidden = self.hide_unselected && !c.match_filter;
    });
    self.nodes.forEach((n) => {
      n.is_hidden = self.hide_unselected && !n.match_filter;
    });
  };

  /**
   * @function filter
   * @description Filters the network based on a set of conditions, including regular expressions, distance, and date.
   * @param {Array<Object>} conditions - An array of conditions to filter by.
   * @param {boolean} skip_update - If true, skips updating the network visualization after filtering.
   * @returns {void}
   */
  self.filter = function (conditions, skip_update) {
    var anything_changed = false;

    conditions = _.map(["re", "distance", "date"], (cnd) =>
      _.map(
        _.filter(conditions, (v) => v.type === cnd),
        (v) => (cnd === "distance" ? v : v.value)
      )
    );

    if (conditions[1].length) {
      self.nodes.forEach((n) => {
        n.length_filter = false;
      });

      _.each(self.edges, (e) => {
        var did_match = _.some(conditions[1], (d) =>
          d.greater_than ? e.length >= d.value : e.length < d.value
        );

        if (did_match) {
          self.nodes[e.source].length_filter = true;
          self.nodes[e.target].length_filter = true;
        }
        e.length_filter = did_match;
      });
    } else {
      self.nodes.forEach((n) => {
        n.length_filter = false;
      });
      self.edges.forEach((e) => {
        e.length_filter = false;
      });
    }

    if (conditions[2].length) {
      self.nodes.forEach((n) => {
        var node_T = self.attribute_node_value_by_id(
          n,
          timeDateUtil.getClusterTimeScale()
        );
        n.date_filter = _.some(
          conditions[2],
          (d) => node_T >= d[0] && node_T <= d[1]
        );
      });
    } else {
      self.nodes.forEach((n) => {
        n.date_filter = false;
      });
    }

    self.clusters.forEach((c) => {
      c.match_filter = 0;
    });

    self.edges.forEach((e) => {
      if (e.length_filter) {
        anything_changed = true;
      }
    });

    self.nodes.forEach((n) => {
      var did_match = _.some(
        conditions[0],
        (regexp) =>
          regexp.test(n.id) ||
          _.some(n[kGlobals.network.NodeAttributeID], (attr) =>
            regexp.test(attr)
          )
      );

      did_match = did_match || n.length_filter || n.date_filter;

      if (did_match !== n.match_filter) {
        n.match_filter = did_match;
        anything_changed = true;
      }

      if (n.match_filter && n.parent) {
        n.parent.match_filter += 1;
      }
    });

    if (anything_changed && self.handle_inline_charts) {
      self.handle_inline_charts((n) => n.match_filter);
    }

    if (anything_changed && !skip_update) {
      if (self.hide_unselected) {
        self.filter_visibility();
      }

      self.update(true);
    }
  };

  /**
   * @function is_empty
   * @description Checks if the cluster sizes array is empty.
   * @returns {boolean} True if the cluster sizes array is empty, false otherwise.
   */
  self.is_empty = function () {
    return self.cluster_sizes.length === 0;
  };

  /**
   * @function link_generator_function
   * @description Generates the SVG path for a link, optionally with a pull effect.
   * @param {Object} d - The link data object.
   * @returns {void}
   */
  self.link_generator_function = function (d) {
    d3.select(this).attr("d", link_path_generator_ext(d));
  };

  /**
   * @function update
   * @description Updates the network visualization, redrawing nodes, links, and clusters.
   * @param {boolean} soft - If true, performs a soft update without re-initializing layout.
   * @param {number} friction - The friction value for the network layout.
   * @returns {void}
   */
  self.update = function (soft, friction) {
    if (
      self._is_CDC_ &&
      !(
        options &&
        options["no-subclusters"] &&
        options["no-subcluster-compute"]
      )
    ) {
      // compute priority clusters
      self.annotate_priority_clusters(
        timeDateUtil._networkCDCDateField,
        36,
        12
      );

      /*try {
        if (self.is_primary_graph) {
          self.priority_groups_compute_node_membership();
        }
      } catch (err) {
        console.log(err);
      }*/
    }

    if (self.isMJCNetwork) {
      return;
    }

    self.needs_an_update = false;

    if (options && options["extra-graphics"]) {
      options["extra-graphics"].call(null, self, options);
    }

    if (friction) {
      network_layout.friction(friction);
    }
    self.display_warning(self.warning_string, true);

    var rendered_nodes, rendered_clusters, link;

    if (!soft) {
      var draw_me = prepare_data_to_graph();

      network_layout.nodes(draw_me.all).links(draw_me.edges);
      update_network_string(draw_me.nodes.length, draw_me.edges.length);

      var edge_set = {};

      _.each(draw_me.edges, (d) => {
        d.pull = 0.0;
        var tag;

        if (d.source < d.target) {
          tag = String(d.source) + "|" + d.target;
        } else {
          tag = String(d.target) + "|" + d.source;
        }
        if (tag in edge_set) {
          edge_set[tag].push(d);
        } else {
          edge_set[tag] = [d];
        }
      });

      _.each(edge_set, (v) => {
        if (v.length > 1) {
          var step = 1 / (v.length - 1);
          _.each(v, (edge, index) => {
            edge.pull = -0.5 + index * step;
          });
        }
      });

      link = self.network_svg
        .selectAll(".link")
        .data(draw_me.edges, (d) => d.id);

      //link.enter().append("line").classed("link", true);
      link.enter().append("path").classed("link", true);
      link.exit().remove();

      link
        .classed("removed", (d) => self.highlight_unsuppored_edges && d.removed)
        .classed(
          "unsupported",
          (d) =>
            self.highlight_unsuppored_edges &&
            "support" in d &&
            d["support"] > 0.05
        )
        .classed(
          "core-link",
          (d) =>
            //console.log (d["length"] <= self.core_link_length);
            d["length"] <= self.core_link_length
          //return false;
        )
        .classed(
          "mspp-link",
          (d) =>
            //console.log (d["length"] <= self.core_link_length);
            d["weight"] > 1
          //return false;
        );

      link
        .on("mouseover", edge_pop_on)
        .on("mouseout", edge_pop_off)
        .filter((d) => d.directed)
        .attr("marker-end", "url(#" + self.dom_prefix + "_arrowhead)");

      rendered_nodes = self.network_svg
        .selectAll(".node")
        .data(draw_me.nodes, (d) => d.id);

      rendered_nodes.exit().remove();

      /*rendered_nodes.enter().each (function (d) {
        this.append ("path");
      });*/

      rendered_nodes.enter().append("g").append("path");

      rendered_clusters = self.network_svg.selectAll(".cluster-group").data(
        draw_me.clusters.map((d) => d),
        (d) => d.cluster_id
      );

      rendered_clusters.exit().remove();
      rendered_clusters
        .enter()
        .append("g")
        .attr("class", "cluster-group")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .on("click", (d) => network.handle_cluster_click(self, d))
        .on("mouseover", cluster_pop_on)
        .on("mouseout", cluster_pop_off)
        .call(network_layout.drag().on("dragstart", cluster_pop_off));

      self.draw_cluster_table(
        self.extra_cluster_table_columns,
        self.cluster_table
      );

      if (
        self._is_CDC_ &&
        !(options && options["no-subclusters"]) &&
        options &&
        options["no-subcluster-compute"]
      ) {
        // use precomputed subclusters

        _.each(self.clusters, (cluster_nodes, cluster_index) => {
          /** extract subclusters; all nodes at given threshold */
          /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */
          let subclusters = _.groupBy(
            cluster_nodes.children,
            (n) => n.subcluster_id
          );
          subclusters = _.values(
            _.reject(subclusters, (v, k) => k === "undefined")
          );

          /** sort subclusters by oldest node */
          _.each(subclusters, (c, i) => {
            c.sort(oldest_nodes_first);
          });

          subclusters.sort((c1, c2) => oldest_nodes_first(c1[0], c2[0]));

          subclusters = _.map(subclusters, (c, i) => {
            const parent_cluster_id = c[0].parent_cluster_id;
            const subcluster_id = c[0].subcluster_id;
            const label = c[0].subcluster_label;

            var edges = [];

            // unused var
            // var meta_data = _.filter(
            //   hivtrace_cluster_depthwise_traversal(
            //     cluster_nodes.Nodes,
            //     cluster_nodes.Edges,
            //     null,
            //     edges
            //   ),
            //   (cc) => {
            //     return cc.length > 1;
            //   }
            // );

            edges = _.filter(edges, (es) => es.length > 1);

            var stats =
              self.json.subcluster_summary_stats[parent_cluster_id][
                subcluster_id
              ];

            return {
              children: _.clone(c),
              parent_cluster: cluster_nodes,
              cluster_id: label,
              subcluster_label: subcluster_id,
              recent_nodes: stats.recent_nodes,
              priority_score: stats.priority_score,
              distances: helpers.describe_vector(
                _.map(edges[i], (e) => e.length)
              ),
            };
          });

          _.each(subclusters, (c) => {
            _compute_cluster_degrees(c);
          });

          cluster_nodes.subclusters = subclusters || [];

          // add additional information
          const stats =
            self.json.subcluster_summary_stats[cluster_nodes.cluster_id];
          cluster_nodes.recent_nodes = _.map(
            _.values(stats),
            (d) => d.recent_nodes[0] || 0
          );
          cluster_nodes.priority_score = _.map(
            _.values(stats),
            (d) => d.priority_score[0] || 0
          );
        });
      }

      if (self.subcluster_table) {
        /*
            SLKP 20200727 scan subclusters and identify which, if any
            will need to be automatically created as priority sets
        */

        // draw subcluster tables

        self.draw_cluster_table(
          self.extra_subcluster_table_columns,
          self.subcluster_table,
          {
            "no-clusters": true,
            subclusters: true,
            headers: function (headers) {
              headers[0][0].value = "Subcluster ID";
              headers[0][0].help = "Unique subcluster ID";
              headers[0][2].help = "Number of total cases in the subcluster";
            },
          }
        );
      }

      if (self._is_CDC_) {
        // defer until later
      } else {
        self.draw_node_table(self.extra_node_table_columns, null, null, {
          "no-filter": true,
        });
      }
    } else {
      rendered_nodes = self.network_svg.selectAll(".node");
      rendered_clusters = self.network_svg.selectAll(".cluster-group");
      link = self.network_svg.selectAll(".link");
      update_network_string(rendered_nodes.size(), link.size());
    }

    self.rendered_object_counts = {
      nodes: rendered_nodes.size(),
      edges: link.size(),
      clusters: rendered_clusters.size(),
      has_hatching: false,
    };

    rendered_nodes.each(function (d) {
      draw_a_node(this, d);
      self.rendered_object_counts.has_hatching =
        self.rendered_object_counts.has_hatching || node_multiple_membership(d);
    });

    rendered_clusters.each(function (d) {
      draw_a_cluster(this, d);
    });

    link.style("opacity", (d) =>
      Math.max(node_opacity(d.target), node_opacity(d.source))
    );

    if (self.additional_edge_styler) {
      link.each(function (d) {
        self.additional_edge_styler(this, d, self);
      });
    }

    link
      .style("display", (d) => {
        if (d.target.is_hidden || d.source.is_hidden || d.is_hidden) {
          return "none";
        }
        return null;
      })
      .classed(
        "selected_object",
        (d) => d.ref.length_filter && !self.hide_unselected
      );

    if (!soft) {
      currently_displayed_objects =
        rendered_clusters[0].length + rendered_nodes[0].length;

      network_layout.on("tick", () => {
        var sizes = network_layout.size();

        rendered_nodes.attr("transform", (d) => {
          // Defalut values (just to keep nodes in the svg container rectangle).
          var xBoundLower = 10;
          var xBoundUpper = sizes[0] - 10;
          var yBoundLower = 10;
          var yBoundUpper = sizes[1] - 10;

          return (
            "translate(" +
            (d.x = Math.max(xBoundLower, Math.min(xBoundUpper, d.x))) +
            "," +
            (d.y = Math.max(yBoundLower, Math.min(yBoundUpper, d.y))) +
            ")"
          );
        });
        rendered_clusters.attr(
          "transform",
          (d) =>
            "translate(" +
            (d.x = Math.max(
              d.rendered_size,
              Math.min(sizes[0] - d.rendered_size, d.x)
            )) +
            "," +
            (d.y = Math.max(
              d.rendered_size,
              Math.min(sizes[1] - d.rendered_size, d.y)
            )) +
            ")"
        );

        link.each(self.link_generator_function);
      });

      network_layout.start();
    } else {
      link.each(self.link_generator_function);
    }
  };

  /**
   * @function tick
   * @description Updates the positions of nodes and links during each tick of the network layout.
   * @returns {void}
   */
  function tick() {
    if (self.isMJCNetwork) {
      return;
    }

    var sizes = network_layout.size();

    node
      .attr("cx", (d) => (d.x = Math.max(10, Math.min(sizes[0] - 10, d.x))))
      .attr("cy", (d) => (d.y = Math.max(10, Math.min(sizes[1] - 10, d.y))));

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  }

  /*------------ Node Methods ---------------*/
  /**
   * @function compute_node_degrees
   * @description Computes the degree of each node in the network.
   * @param {Array<Object>} nodes - An array of node objects.
   * @param {Array<Object>} edges - An array of edge objects.
   * @returns {void}
   */
  function compute_node_degrees(nodes, edges) {
    for (var n in nodes) {
      nodes[n].degree = 0;
    }

    for (var e in edges) {
      nodes[edges[e].source].degree++;
      nodes[edges[e].target].degree++;
    }
  }

  self.attribute_node_value_by_id = function (d, id, number) {
    try {
      if (kGlobals.network.NodeAttributeID in d && id) {
        if (id in d[kGlobals.network.NodeAttributeID]) {
          let v;

          if (self.json[kGlobals.network.GraphAttrbuteID][id].volatile) {
            v = self.json[kGlobals.network.GraphAttrbuteID][id].map(d, self);
          } else {
            v = d[kGlobals.network.NodeAttributeID][id];
          }

          if (_.isString(v)) {
            if (v.length === 0) {
              return kGlobals.missing.label;
            } else if (number) {
              v = Number(v);
              return _.isNaN(v) ? kGlobals.missing.label : v;
            }
          }
          return v;
        }
      }
    } catch (e) {
      console.log("self.attribute_node_value_by_id", e, d, id, number);
    }
    return kGlobals.missing.label;
  };

  /**
   * @function has_network_attribute
   * @description Checks if a given attribute exists in the network schema.
   * @param {string} key - The key of the attribute to check.
   * @returns {boolean} True if the attribute exists, false otherwise.
   */
  self.has_network_attribute = function (key) {
    if (kGlobals.network.GraphAttrbuteID in self.json) {
      return key in self.json[kGlobals.network.GraphAttrbuteID];
    }
    return false;
  };

  /**
   * @function node_size
   * @description Determines the size of a node based on its degree and whether it is being shown on a map.
   * @param {Object} d - The node object.
   * @returns {number} The size of the node.
   */
  function node_size(d) {
    return node_size_ext(d);
  }

  /**
   * @function node_multiple_membership
   * @description Checks if a node has the 'multiple_membership' attribute.
   * @param {Object} n - The node object.
   * @returns {boolean} True if the node has multiple memberships, false otherwise.
   */
  function node_multiple_membership(n) {
    return node_multiple_membership_ext(n);
  }

  /**
   * @function node_color
   * @description Determines the color of a node based on its attributes and the current colorizer settings.
   * @param {Object} d - The node object.
   * @returns {string} The color of the node.
   */
  function node_color(d) {
    return node_color_ext(self, d, kGlobals);
  }

  /**
   * @function node_opacity
   * @description Determines the opacity of a node based on the current opacity settings.
   * @param {Object} d - The node object.
   * @returns {number} The opacity of the node.
   */
  function node_opacity(d) {
    return node_opacity_ext(self, d);
  }

  /**
   * @function cluster_color
   * @description Determines the color of a cluster based on its attributes.
   * @param {Object} d - The cluster object.
   * @param {string} type - The type of the cluster.
   * @returns {string} The color of the cluster.
   */
  function cluster_color(d, type) {
    return cluster_color_ext(self, d, type);
  }

  /**
   * @function node_info_string
   * @description Generates an information string for a node, including its degree, clustering coefficient, and other attributes.
   * @param {Object} n - The node object.
   * @returns {string} The information string for the node.
   */
  function node_info_string(n) {
    return Tooltips.node_info_string(self, n, kGlobals, misc, timeDateUtil);
  }

  function edge_info_string(n) {
    return Tooltips.edge_info_string(n, kGlobals);
  }

  function node_pop_on(d) {
    Tooltips.node_pop_on(self, d, this, kGlobals, misc, timeDateUtil);
  }

  function node_pop_off(d) {
    Tooltips.node_pop_off(this);
  }

  function edge_pop_on(e) {
    Tooltips.edge_pop_on(self, e, this, kGlobals);
  }

  function edge_pop_off(d) {
    Tooltips.edge_pop_off(this);
  }

  /*------------ Cluster Methods ---------------*/

  /**
   * Creates a new object that groups nodes by cluster
   * @param {Array<Object>} nodes - An array of node objects.
   * @returns {Object} An object where keys are cluster IDs and values are arrays of nodes.
   */
  self.get_all_clusters = function (nodes) {
    var by_cluster = _.groupBy(nodes, "cluster");
    return by_cluster;
  };

  /**
   * @function compute_cluster_centroids
   * @description Computes the centroids of clusters based on the positions of their children nodes.
   * @param {Object} clusters - An object containing cluster data.
   * @returns {void}
   */
  function compute_cluster_centroids(clusters) {
    for (var c in clusters) {
      var cls = clusters[c];
      cls.x = 0;
      cls.y = 0;
      if (_.has(cls, "children")) {
        cls.children.forEach((x) => {
          cls.x += x.x;
          cls.y += x.y;
        });
        cls.x /= cls.children.length;
        cls.y /= cls.children.length;
      }
    }
  }

  /**
   * @function collapse_cluster
   * @description Collapses a cluster, hiding its children nodes.
   * @param {Object} x - The cluster object to collapse.
   * @param {boolean} keep_in_q - If true, keeps the cluster in the open cluster queue.
   * @returns {number} The number of children in the collapsed cluster.
   */
  self.collapse_cluster = function (x, keep_in_q) {
    self.needs_an_update = true;
    x.collapsed = true;
    currently_displayed_objects -= self.cluster_sizes[x.cluster_id - 1] - 1;
    if (!keep_in_q) {
      var idx = open_cluster_queue.indexOf(x.cluster_id);
      if (idx >= 0) {
        open_cluster_queue.splice(idx, 1);
      }
    }
    compute_cluster_centroids([x]);
    return x.children.length;
  };

  /**
   * @function expand_cluster
   * @description Expands a cluster, showing its children nodes.
   * @param {Object} x - The cluster object to expand.
   * @param {boolean} copy_coord - If true, copies coordinates from the parent cluster to the children.
   * @returns {void}
   */
  self.expand_cluster = function (x, copy_coord) {
    self.needs_an_update = true;
    x.collapsed = false;
    currently_displayed_objects += self.cluster_sizes[x.cluster_id - 1] - 1;
    open_cluster_queue.push(x.cluster_id);

    if (copy_coord) {
      x.children.forEach((n) => {
        n.x = x.x + (Math.random() - 0.5) * x.children.length;
        n.y = x.y + (Math.random() - 0.5) * x.children.length;
      });
    } else {
      x.children.forEach((n) => {
        n.x = self.width * 0.25 + (Math.random() - 0.5) * x.children.length;
        n.y = 0.25 * self.height + (Math.random() - 0.5) * x.children.length;
      });
    }
  };

  /**
   * @function render_binned_table
   * @description Renders a table with binned data.
   * @param {string} id - The ID of the table element.
   * @param {Function} the_map - A function that maps values to categories.
   * @param {Array<Array<number>>} matrix - The data matrix to render.
   * @returns {void}
   */
  self.render_binned_table = function (id, the_map, matrix) {
    var the_table = d3.select(self.get_ui_element_selector_by_role(id, true));
    if (the_table.empty()) {
      return;
    }

    the_table.selectAll("thead").remove();
    the_table.selectAll("tbody").remove();

    d3.select(
      self.get_ui_element_selector_by_role(id + "_enclosed", true)
    ).style("display", matrix ? null : "none");

    if (matrix) {
      var fill = self.colorizer["category"];
      var lookup = the_map(null, "lookup");

      var headers = the_table
        .append("thead")
        .append("tr")
        .selectAll("th")
        .data([""].concat(matrix[0].map((d, i) => lookup[i])));

      headers.enter().append("th");
      headers
        .html((d) => "<span>&nbsp;" + d + "</span>")
        .each(function (d, i) {
          if (i) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", () => fill(d));
          }
        });

      if (self.show_percent_in_pairwise_table) {
        var sum = _.map(matrix, (row) => _.reduce(row, (p, c) => p + c, 0));

        matrix = _.map(matrix, (row, row_index) =>
          _.map(row, (c) => c / sum[row_index])
        );
      }

      var rows = the_table
        .append("tbody")
        .selectAll("tr")
        .data(matrix.map((d, i) => [lookup[i]].concat(d)));

      rows.enter().append("tr");
      rows
        .selectAll("td")
        .data((d) => d)
        .enter()
        .append("td")
        .html((d, i) => {
          if (i === 0) {
            return "<span>&nbsp;" + d + "</span>";
          } else if (self.show_percent_in_pairwise_table) {
            return kGlobals.formats.PercentFormat(d);
          }

          return d;
        })
        .each(function (d, i) {
          if (i === 0) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", () => fill(d));
          }
        });
    }
  };

  /**
   * @function render_chord_diagram
   * @description Renders a chord diagram to visualize relationships between categories.
   * @param {string} id - The ID of the container element for the diagram.
   * @param {Function} the_map - A function that maps values to categories.
   * @param {Array<Array<number>>} matrix - The data matrix to render.
   * @returns {void}
   */
  self.render_chord_diagram = function (id, the_map, matrix) {
    var container = d3.select(self.get_ui_element_selector_by_role(id, true));

    if (container.empty()) {
      return;
    }

    container.selectAll("svg").remove();

    d3.select(
      self.get_ui_element_selector_by_role(id + "_enclosed", true)
    ).style("display", matrix ? null : "none");

    if (matrix) {
      var lookup = the_map(null, "lookup");

      var svg = container.append("svg");

      var chord = d3.layout
        .chord()
        .padding(0.05)
        .sortSubgroups(d3.descending)
        .matrix(matrix);

      var text_offset = 20,
        width = 450,
        height = 450,
        innerRadius = Math.min(width, height - text_offset) * 0.41,
        outerRadius = innerRadius * 1.1;

      var fill = self.colorizer["category"],
        font_size = 12;

      var text_label = svg
        .append("g")
        .attr(
          "transform",
          "translate(" + width / 2 + "," + (height - text_offset) + ")"
        )
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", font_size)
        .text("");

      svg = svg
        .attr("width", width)
        .attr("height", height - text_offset)
        .append("g")
        .attr(
          "transform",
          "translate(" + width / 2 + "," + (height - text_offset) / 2 + ")"
        );

      // Returns an event handler for fading a given chord group.
      const fade = function (opacity, t) {
        return function (g, i) {
          text_label.text(t ? lookup[i] : "");
          svg
            .selectAll(".chord path")
            .filter((d) => d.source.index !== i && d.target.index !== i)
            .transition()
            .style("opacity", opacity);
        };
      };

      svg
        .append("g")
        .selectAll("path")
        .data(chord.groups)
        .enter()
        .append("path")
        .style("fill", (d) => fill(lookup[d.index]))
        .style("stroke", (d) => fill(lookup[d.index]))
        .attr(
          "d",
          d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius)
        )
        .on("mouseover", fade(0.1, true))
        .on("mouseout", fade(1, false));

      svg
        .append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord.chords)
        .enter()
        .append("path")
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("fill", (d) => fill(d.target.index))
        .style("opacity", 1);
    }
  };

  /**
   * @function attribute_pairwise_distribution
   * @description Computes the pairwise distribution of an attribute for the edges in the network.
   * @param {string} id - The ID of the attribute.
   * @param {number} dim - The dimension of the attribute.
   * @param {Function} the_map - A function that maps attribute values to indices.
   * @param {boolean} only_expanded - If true, only considers edges in expanded clusters.
   * @param {Object} draw_me - The prepared graph data (optional, used if only_expanded is true).
   * @returns {Array<Array<number>>} The pairwise distribution matrix.
   */
  self.attribute_pairwise_distribution = function (
    id,
    dim,
    the_map,
    only_expanded,
    draw_me
  ) {
    var scan_from = only_expanded ? draw_me.edges : self.edges;
    var the_matrix = [];
    for (var i = 0; i < dim; i += 1) {
      the_matrix.push([]);
      for (var j = 0; j < dim; j += 1) {
        the_matrix[i].push(0);
      }
    }

    _.each(scan_from, (edge) => {
      //console.log (self.attribute_node_value_by_id(self.nodes[edge.source], id), self.attribute_node_value_by_id(self.nodes[edge.target], id));
      the_matrix[
        the_map(self.attribute_node_value_by_id(self.nodes[edge.source], id))
      ][
        the_map(self.attribute_node_value_by_id(self.nodes[edge.target], id))
      ] += 1;
    });
    // check if there are null values

    var haz_null = the_matrix.some((d, i) => {
      if (i === dim - 1) {
        return d.some((d2) => d2 > 0);
      }
      return d[dim - 1] > 0;
    });
    if (!haz_null) {
      the_matrix.pop();
      for (let i = 0; i < dim - 1; i += 1) {
        the_matrix[i].pop();
      }
    }

    // symmetrize the matrix

    dim = the_matrix.length;

    for (let i = 0; i < dim; i += 1) {
      for (let j = i; j < dim; j += 1) {
        the_matrix[i][j] += the_matrix[j][i];
        the_matrix[j][i] = the_matrix[i][j];
      }
    }

    return the_matrix;
  };

  /**
   * @function _aux_populate_category_fields
   * @description Populates category fields for a given attribute.
   * @param {Object} d - The attribute object.
   * @param {string} k - The key of the attribute.
   * @returns {Object} The updated attribute object.
   */
  self._aux_populate_category_fields = function (d, k) {
    return NetworkAttributeMenus.aux_populate_category_fields(
      d,
      k,
      self,
      kGlobals
    );
  };

  /**
   * @function _aux_get_attribute_dimension
   * @description Gets the dimension of a categorical attribute.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @returns {number} The dimension of the attribute.
   */
  self._aux_get_attribute_dimension = function (cat_id) {
    return NetworkAttributeMenus.aux_get_attribute_dimension(
      cat_id,
      self,
      kGlobals
    );
  };

  /**
   * @function _aux_process_category_values
   * @description Processes the values of a categorical attribute, creating a value map and a stable-ish order.
   * @param {Object} d - The attribute object.
   * @returns {Object} The updated attribute object.
   */
  self._aux_process_category_values = function (d) {
    return NetworkAttributeMenus.aux_process_category_values(d, self, kGlobals);
  };

  /**
   * @function attribute_cluster_distribution
   * @description Gets the distribution of a specific attribute within a cluster.
   * @param {Object} the_cluster - The cluster object.
   * @param {string} attribute_id - The ID of the attribute.
   * @returns {Array|null} An array of attribute values, or null if the attribute is not found.
   */
  self.attribute_cluster_distribution = function (the_cluster, attribute_id) {
    if (attribute_id && the_cluster) {
      return the_cluster.children.map((d) =>
        self.attribute_node_value_by_id(d, attribute_id)
      );
    }
    return null;
  };

  /**
   * @function cluster_info_string
   * @description Generates an information string for a cluster, including its size, degree, and other attributes.
   * @param {string} id - The ID of the cluster.
   * @returns {string} The information string for the cluster.
   */
  function cluster_info_string(id) {
    return Tooltips.cluster_info_string(self, id, kGlobals, misc);
  }

  function cluster_pop_on(d) {
    Tooltips.cluster_pop_on(self, d, this, kGlobals, misc);
  }

  function cluster_pop_off(d) {
    Tooltips.cluster_pop_off(this);
  }

  /**
   * @function expand_cluster_handler
   * @description Handles the expansion of a cluster, taking into account the maximum number of points to render.
   * @param {Object} d - The cluster object to expand.
   * @param {boolean} do_update - If true, updates the network visualization after expanding.
   * @param {boolean} move_out - If true, moves the cluster out of the way after expanding.
   * @returns {string} An empty string.
   */
  self.expand_cluster_handler = function (d, do_update, move_out) {
    if (d.collapsed) {
      var new_nodes = self.cluster_sizes[d.cluster_id - 1] - 1;

      if (new_nodes > max_points_to_render) {
        self.warning_string = "This cluster is too large to be displayed";
      } else {
        var leftover =
          new_nodes + currently_displayed_objects - max_points_to_render;
        if (leftover > 0) {
          var k = 0;
          for (; k < open_cluster_queue.length && leftover > 0; k++) {
            var cluster =
              self.clusters[self.cluster_mapping[open_cluster_queue[k]]];
            leftover -= cluster.children.length - 1;
            self.collapse_cluster(cluster, true);
          }
          if (k || open_cluster_queue.length) {
            open_cluster_queue.splice(0, k);
          }
        }

        if (leftover <= 0) {
          self.expand_cluster(d, !move_out);
        }
      }

      if (do_update) {
        self.update(false, 0.6);
      }
    }
    return "";
  };

  /**
   * @function show_sequences_in_cluster
   * @description Shows the sequences that make up a cluster.
   * @param {Object} d - The cluster object.
   * @returns {void}
   */
  function show_sequences_in_cluster(d) {
    var sequences = {};
    _.each(
      self.extract_single_cluster(
        self.clusters[self.cluster_mapping[d.cluster]].children,
        null,
        true
      ).Edges,
      (e) => {
        _.each(e.sequences, (s) => {
          if (!(s in sequences)) {
            sequences[s] = 1;
          }
        });
      }
    );
    //console.log (_.keys(sequences));
  }

  /**
   * @function _compute_cluster_degrees
   * @description Computes the degrees of a cluster and stores them in the cluster object.
   * @param {Object} d - The cluster object.
   * @returns {void}
   */
  function _compute_cluster_degrees(d) {
    var degrees = d.children.map((c) => c.degree);
    degrees.sort(d3.ascending);
    d.degrees = helpers.describe_vector(degrees);
  }

  /**
   * @function handle_node_label
   * @description Toggles the visibility of a node's label.
   * @param {HTMLElement} container - The container element for the node.
   * @param {Object} node - The node object.
   * @returns {void}
   */
  self.handle_node_label = function (container, node) {
    node.show_label = !node.show_label;
    self.update(true);
  };

  /**
   * @function collapse_cluster_handler
   * @description Handles the collapse of a cluster.
   * @param {Object} d - The cluster object to collapse.
   * @param {boolean} do_update - If true, updates the network visualization after collapsing.
   * @returns {void}
   */
  self.collapse_cluster_handler = function (d, do_update) {
    self.collapse_cluster(self.clusters[self.cluster_mapping[d.cluster]]);
    if (do_update) {
      self.update(false, 0.4);
    }
  };

  /**
   * @function cluster_box_size
   * @description Determines the size of a cluster box based on the number of entities in the cluster.
   * @param {Object} c - The cluster object.
   * @returns {number} The size of the cluster box.
   */
  function cluster_box_size(c) {
    let cc;
    if (self.cluster_sizes_in_entities) {
      cc = self.cluster_sizes_in_entities[c.cluster_id];
    }
    cc = cc || c.children.length;

    return 8 * Math.sqrt(cc);
  }

  /**
   * @function extract_network_time_series
   * @description Extracts a time series from the network data based on a given time attribute.
   * @param {string} time_attr - The time attribute to use for the series.
   * @param {Object} other_attributes - Other attributes to include in the series.
   * @param {Function} node_filter - A function to filter nodes.
   * @returns {Array<Object>} An array of time series data points.
   */
  self.extract_network_time_series = function (
    time_attr,
    other_attributes,
    node_filter
  ) {
    var use_these_nodes = node_filter
      ? _.filter(self.nodes, node_filter)
      : self.nodes;

    var result = _.map(use_these_nodes, (node) => {
      var series = {
        time: self.attribute_node_value_by_id(node, time_attr),
      };
      if (other_attributes) {
        _.each(other_attributes, (attr, key) => {
          series[attr] = self.attribute_node_value_by_id(node, key);
        });
      }
      return series;
    });

    result.sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time === b.time) return 0;
      return 1;
    });

    return result;
  };

  /**
   * @function expand_some_clusters
   * @description Expands a given subset of clusters, or all clusters if no subset is provided.
   * @param {Array<Object>} [subset] - An array of cluster objects to expand.
   * @returns {void}
   */
  self.expand_some_clusters = function (subset) {
    subset = subset || self.clusters;
    subset.forEach((x) => {
      if (!x.is_hidden) {
        self.expand_cluster_handler(x, false);
      }
    });
    self.update();
  };

  /**
   * @function select_some_clusters
   * @description Selects a subset of clusters based on a given condition.
   * @param {Function} condition - A function that returns true for clusters that should be selected.
   * @returns {Array<Object>} An array of selected cluster objects.
   */
  self.select_some_clusters = function (condition) {
    return self.clusters.filter((c, i) =>
      _.some(c.children, (n) => condition(n))
    );
  };

  /**
   * @function collapse_some_clusters
   * @description Collapses a given subset of clusters, or all clusters if no subset is provided.
   * @param {Array<Object>} [subset] - An array of cluster objects to collapse.
   * @returns {void}
   */
  self.collapse_some_clusters = function (subset) {
    subset = subset || self.clusters;
    subset.forEach((x) => {
      if (!x.collapsed) self.collapse_cluster(x);
    });
    self.update();
  };

  /**
   * @function toggle_hxb2
   * @description Toggles the visibility of problematic (HXB2-linked) clusters.
   * @returns {void}
   */
  self.toggle_hxb2 = function () {
    self.hide_hxb2 = !self.hide_hxb2;
    self.update();
  };

  /**
   * @function toggle_diff
   * @description Toggles the visibility of changes since the last network update.
   * @returns {void}
   */
  self.toggle_diff = function () {
    self.showing_diff = !self.showing_diff;
    if (self.showing_diff) {
      self.cluster_filtering_functions["new"] = self.filter_if_added;
    } else {
      delete self.cluster_filtering_functions["new"];
    }
    self.update();
  };

  /**
   * @function toggle_highlight_unsupported_edges
   * @description Toggles the highlighting of unsupported edges.
   * @returns {void}
   */
  self.toggle_highlight_unsupported_edges = function () {
    self.highlight_unsuppored_edges = !self.highlight_unsuppored_edges;
    self.update();
  };

  /**
   * @function toggle_time_filter
   * @description Toggles the time filter for displaying recent clusters.
   * @returns {void}
   */
  self.toggle_time_filter = function () {
    if (self.using_time_filter) {
      self.using_time_filter = null;
    } else {
      self.using_time_filter = timeDateUtil.getCurrentDate();
      self.using_time_filter.setFullYear(
        self.using_time_filter.getFullYear() - 1
      );
    }

    if (self.using_time_filter) {
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    } else {
      delete self.cluster_filtering_functions["recent"];
    }
    self.update();
  };

  /**
   * @function stratify
   * @description Stratifies an array of values into a sorted array of unique values and their counts.
   * @param {Array} array - The array of values to stratify.
   * @returns {Array<Array>} A sorted array of [value, count] pairs.
   */
  self.stratify = function (array) {
    if (array) {
      var dict = {},
        stratified = [];

      array.forEach((d) => {
        if (d in dict) {
          dict[d] += 1;
        } else {
          dict[d] = 1;
        }
      });
      for (var uv in dict) {
        stratified.push([uv, dict[uv]]);
      }
      return stratified.sort((a, b) => a[0] - b[0]);
    }
    return array;
  };

  /**
   * @function _distance_gate_options
   * @description Returns an options object for the distance gate, including edge styling and an extra menu.
   * @param {number} threshold - The distance threshold.
   * @returns {Object} An options object.
   */
  self._distance_gate_options = function (threshold) {
    threshold = threshold || 0.005;

    return {
      "edge-styler": function (element, d, network) {
        var e_type = misc.edge_typer(
          d,
          network.edge_types,
          network.edge_cluster_threshold
        );
        if (e_type !== "") {
          d3.select(element).style(
            "stroke",
            network._edge_colorizer(
              misc.edge_typer(
                d,
                network.edge_types,
                network.edge_cluster_threshold
              )
            )
          ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));
        }
        d.is_hidden = !network.shown_types[e_type];
        d3.select(element).style("stroke-width", "4px");
      },

      init_code: function (network) {
        function style_edge(type) {
          this.style("stroke-width", "5px");
          if (type.length) {
            this.style("stroke", network._edge_colorizer(type)); //.style ("stroke-dasharray", network._edge_dasher (type));
          } else {
            this.classed("link", true);
            var def_color = this.style("stroke");
            this.classed("link", null);
            this.style("stroke", def_color);
          }
        }

        network.update_cluster_threshold_display = (T) => {
          network.edge_cluster_threshold = T;
          network.edge_types = [
            "≤" + network.edge_cluster_threshold,
            ">" + network.edge_cluster_threshold,
          ];

          network._edge_colorizer = d3.scale
            .ordinal()
            .range(kGlobals.EdgeColorBase)
            .domain(network.edge_types);
          //network._edge_dasher   = _edge_dasher;
          network.shown_types = _.object(
            _.map(network.edge_types, (d) => [d, 1])
          );
          network.edge_legend = {
            caption: "Links by distance",
            types: {},
          };

          _.each(network.shown_types, (ignore, t) => {
            if (t.length) {
              network.edge_legend.types[t] = _.partial(style_edge, t);
            }
          });
        };

        network.update_cluster_threshold_display(threshold);
      },

      extra_menu: {
        title: "Additional options",
        items: [
          [
            function (network, item) {
              //console.log(network.edge_cluster_threshold);
              var enclosure = item.append("div").classed("form-group", true);
              enclosure
                .append("label")
                .text("Genetic distance threshold ")
                .classed("control-label", true);
              enclosure
                .append("input")
                .classed("form-control", true)
                .attr("value", String(network.edge_cluster_threshold))
                .on("change", function (e) {
                  //d3.event.preventDefault();
                  if (this.value) {
                    const newT = parseFloat(this.value);
                    if (_.isNumber(newT) && newT > 0.0 && newT < 1) {
                      network.update_cluster_threshold_display(newT);
                      network.draw_attribute_labels();
                      network.update(true);
                      enclosure
                        .classed("has-success", true)
                        .classed("has-error", false);
                      return;
                    }
                  }

                  enclosure
                    .classed("has-success", false)
                    .classed("has-error", true);
                })
                .on("click", (e) => {
                  d3.event.stopPropagation();
                });
            },
            null,
          ],
        ],
      },
    };
  };

  /**
   * @function _social_view_options
   * @description Returns an options object for the social network view, including edge styling and an extra menu.
   * @param {Array<string>} labeled_links - An array of labels for the links.
   * @param {Object} shown_types - An object specifying which edge types are shown.
   * @param {Function} edge_typer - A function that returns the type of an edge.
   * @returns {Object} An options object.
   */
  self._social_view_options = function (
    labeled_links,
    shown_types,
    edge_typer
  ) {
    edge_typer =
      edge_typer ||
      function (e) {
        return _.has(e, "edge_type") ? e["edge_type"] : "";
      };

    return {
      //"simplified-mspp" : self.has_multiple_sequences,
      "edge-styler": function (element, d, network) {
        var e_type = edge_typer(d);
        if (e_type !== "") {
          d3.select(element).style(
            "stroke",
            network._edge_colorizer(edge_typer(d))
          ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));

          d.is_hidden = !network.shown_types[e_type];
        } else {
          d.is_hidden = !network.shown_types[""];
        }
        d3.select(element).style("stroke-width", "5px");
      },

      init_code: function (network) {
        function style_edge(type) {
          this.style("stroke-width", "5px");
          if (type.length) {
            this.style("stroke", network._edge_colorizer(type)); //.style ("stroke-dasharray", network._edge_dasher (type));
          } else {
            this.classed("link", true);
            var def_color = this.style("stroke");
            this.classed("link", null);
            this.style("stroke", def_color);
          }
        }

        var edge_types = _.keys(shown_types);
        edge_types.sort();

        network._edge_colorizer = d3.scale
          .ordinal()
          .range(kGlobals.CategoricalBase)
          .domain(edge_types);
        //network._edge_dasher   = _edge_dasher;
        network.shown_types = _.clone(shown_types);
        network.edge_legend = {
          caption: "Network links",
          types: {},
        };

        _.each(network.shown_types, (ignore, t) => {
          if (t.length) {
            network.edge_legend.types[t] = _.partial(style_edge, t);
          } else {
            network.edge_legend.types["Molecular links"] = _.partial(
              style_edge,
              t
            );
          }
        });
      },

      extra_menu: {
        title: "Additional options",
        items: _.map(labeled_links, (edge_class) => [
          function (network, element) {
            function toggle_element() {
              network.shown_types[edge_class] =
                !network.shown_types[edge_class];
              checkbox.attr(
                "checked",
                network.shown_types[edge_class] ? "" : null
              );
              network.update(true);
            }

            var link;

            if (edge_class.length) {
              link = element
                .append("a")
                .text(edge_class + " links")
                .style("color", network._edge_colorizer(edge_class))
                .on("click", toggle_element);
            } else {
              link = element
                .append("a")
                .text("Molecular links")
                .on("click", toggle_element);
            }
            var checkbox = link
              .append("input")
              .attr("type", "checkbox")
              .attr("checked", "");
          },
        ]),
      },
    };
  };

  /*------------ Node injection (social network) ---------------*/

  // The load_nodes_edges function is now imported from socialNetworkLoader.js
  // We will call it by passing 'self' as the first argument.
  /**
   * @function load_nodes_edges
   * @description Loads nodes and edges from the social network loader.
   * @param {Array} nodes_and_attributes - An array of nodes and their attributes.
   * @param {string} index_id - The ID of the index to use.
   * @param {Array} edges_and_attributes - An array of edges and their attributes.
   * @param {string} annotation - An annotation for the loaded data.
   * @returns {Object} The result of loading the nodes and edges.
   */
  self.load_nodes_edges = (
    nodes_and_attributes,
    index_id,
    edges_and_attributes,
    annotation
  ) => {
    return loadSocialNetworkData(
      self,
      nodes_and_attributes,
      index_id,
      edges_and_attributes,
      annotation
    );
  };

  /**
   * @function update_clusters_with_injected_nodes
   * @description Updates clusters with injected nodes from a social network.
   * @param {Function} node_filter - A function to filter nodes.
   * @param {Function} edge_filter - A function to filter edges.
   * @param {string} annotation - An annotation for the injected nodes.
   * @returns {Array<Object>} An array of recomputed clusters.
   */
  self.update_clusters_with_injected_nodes = function (
    node_filter,
    edge_filter,
    annotation
  ) {
    let recomputed_clusters;

    try {
      node_filter =
        node_filter ||
        function () {
          return true;
        };
      edge_filter =
        edge_filter ||
        function () {
          return true;
        };

      recomputed_clusters = hivtrace_cluster_depthwise_traversal(
        _.filter(self.json.Nodes, node_filter),
        self.json.Edges,
        null,
        false
      );

      _.each(recomputed_clusters, (c) => {
        var cluster_ids = {};
        var injected_count = 0;

        _.each(c, (n) => {
          cluster_ids[n.cluster] = 1;
          injected_count += n.cluster ? 0 : 1;
        });

        //var cluster_ids = _.keys (cluster_ids);

        //console.log (cluster_ids.length);

        // count how many "injected" nodes are there in the new cluster

        if (injected_count) {
          delete cluster_ids[undefined];
        }

        _.each(c, (n) => {
          if ("extended_cluster" in n) {
            _.extend(n["extended_cluster"], cluster_ids);
          } else {
            n["extended_cluster"] = cluster_ids;
          }
        });

        _.each(cluster_ids, (c, k) => {
          var existing_cluster = self.clusters[self.cluster_mapping[k]];
          if (!existing_cluster.injected) {
            existing_cluster.injected = {};
          }
          existing_cluster.injected[annotation] = injected_count;
          if ("linked_clusters" in existing_cluster) {
            _.extend(existing_cluster["linked_clusters"], cluster_ids);
          } else {
            existing_cluster["linked_clusters"] = cluster_ids;
          }
        });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }

    return recomputed_clusters;
  };
  /*------------ Event Functions ---------------*/
  /**
   * @function toggle_tooltip
   * @description Toggles a tooltip on a given element.
   * @param {HTMLElement} element - The element to toggle the tooltip on.
   * @param {boolean} turn_on - If true, shows the tooltip; otherwise, hides it.
   * @param {string} title - The title of the tooltip.
   * @param {string} tag - The content of the tooltip.
   * @param {string} container - The container for the tooltip.
   * @returns {void}
   */
  function toggle_tooltip(element, turn_on, title, tag, container) {
    Tooltips.toggle_tooltip(element, turn_on, title, tag, container);
  }

  /*------------ Init code ---------------*/

  var l_scale = 5000, // link scale
    graph_data = self.json, // the raw JSON network object
    max_points_to_render = 1536,
    max_nodes_to_show = 4096,
    singletons = 0,
    open_cluster_queue = [],
    currently_displayed_objects,
    gravity_scale = d3.scale
      .pow()
      .exponent(0.5)
      .domain([1, 100000])
      .range([0.1, 0.15]),
    link_scale = d3.scale.pow().exponent(1.25).clamp(true).domain([0, 0.1]);

  /*------------ D3 globals and SVG elements ---------------*/

  var network_layout = null;
  if (!self.isMJCNetwork) {
    network_layout = d3.layout
      .force()
      .on("tick", tick)
      .charge((d) => {
        if (d.cluster_id) {
          return self.charge_correction * (-15 - 5 * d.children.length ** 0.4);
        }
        return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
      })
      .linkDistance(
        (d) => link_scale(d.length) * l_scale * 0.2 //Math.max(d.length, 0.005) * l_scale * 10;
      )
      .linkStrength((d) => {
        if (d.support !== undefined) {
          return 0.75 - 0.5 * d.support;
        }
        return 1;
      })
      .chargeDistance(l_scale * 0.1)
      .gravity(gravity_scale(self.json.Nodes.length))
      .friction(0.25);
  } else {
    network_layout = d3.layout.force();
  }
  d3.select(self.container).selectAll("svg").remove();

  if (self.is_primary_graph) {
    d3.select(self.container)
      .selectAll(".my_progress")
      .style("display", "none");
    nodesTab.getNodeTable().selectAll("*").remove();
    self.cluster_table.selectAll("*").remove();
  }

  self.network_svg = d3
    .select(self.container)
    .append("svg:svg")
    //.style ("border", "solid black 1px")
    .attr("id", self.dom_prefix + "-network-svg")
    .attr("width", self.width + self.margin.left + self.margin.right)
    .attr("height", self.height + self.margin.top + self.margin.bottom);

  self.network_cluster_dynamics = null;

  //.append("g")
  // .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

  var legend_drag = d3.behavior
    .drag()
    .on("dragstart", () => {
      d3.event.sourceEvent.stopPropagation();
    })
    .on("drag", function (d) {
      d3.select(this).attr(
        "transform",
        "translate(" + [d3.event.x, d3.event.y] + ")"
      );
    });
  self.legend_svg = self.network_svg
    .append("g")
    .attr("transform", "translate(5,5)")
    .call(legend_drag);

  self.network_svg
    .append("defs")
    .append("marker")
    .attr("id", self.dom_prefix + "_arrowhead")
    .attr("refX", 18)
    .attr("refY", 6)
    .attr("markerWidth", 20)
    .attr("markerHeight", 16)
    .attr("orient", "auto")
    .attr("stroke", "#666666")
    .attr("markerUnits", "userSpaceOnUse")
    .attr("fill", "#AAAAAA")
    .append("path")
    .attr("d", "M 0,0 L 2,6 L 0,12 L14,6 Z"); //this is actual shape for arrowhead

  self.change_window_size();

  initial_json_load();

  if (options) {
    if (_.isNumber(options["charge"])) {
      self.charge_correction = options["charge"];
    }

    if ("colorizer" in options) {
      self.colorizer = options["colorizer"];
    }

    if ("node_shaper" in options) {
      self.node_shaper = options["node_shaper"];
    }

    if ("callbacks" in options) {
      options["callbacks"](self);
    }

    if (_.isArray(options["expand"])) {
      self.expand_some_clusters(
        _.filter(
          self.clusters,
          (c) => options["expand"].indexOf(c.cluster_id) >= 0
        )
      );
    }

    if (options["priority-sets-url"]) {
      const is_writeable = options["is-writeable"];
      //  in the MJC case, self.defined_priority_groups (and any other related variables / functions) will be modifying the MJClusterOI,
      // while self.own_defined_priority_groups will be the user's own jurisdiction's priority groups (which is loaded in the MJCloadOwnPrioritySets callback)
      self.load_priority_sets(options["priority-sets-url"], is_writeable);
      self.MJCloadOwnPrioritySets(options);
    }

    if (self.showing_diff) {
      self.handle_attribute_categorical("_newly_added");
    }
  }

  if (self.is_primary_graph) {
    self.annotate_multiple_clusters_on_nodes();
  }

  if (self._is_CDC_ && !self.isMJCNetwork) {
    self.define_node_search_table();
  }

  self.draw_attribute_labels();
  d3.select(self.container).selectAll(".my_progress").style("display", "none");
  network_layout.start();

  return self;
};

export {
  hivtrace_cluster_depthwise_traversal as computeCluster,
  hivtrace_cluster_network_graph as clusterNetwork,
};
