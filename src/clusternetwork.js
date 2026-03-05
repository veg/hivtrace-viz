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
import { initializeNetworkScales } from "./networkScales";
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
import * as NetworkClusters from "./networkClusters";
import * as NetworkNodeInteraction from "./networkNodeInteraction";
import * as NetworkUIHelpers from "./networkUIHelpers";
import * as NetworkControls from "./networkControls";
import * as NetworkTablesUI from "./networkTablesUI";
import * as NetworkNodeTableUI from "./networkNodeTableUI";
import * as NetworkGraphData from "./networkGraphData";
import * as NetworkStatisticsUI from "./networkStatisticsUI";
import * as NetworkColorPickerUI from "./networkColorPickerUI";
import { annotate_priority_clusters } from "./networkPriority";
import * as NetworkElementDrawing from "./networkElementDrawing";
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
  self.handle_node_click = function (node) {
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
      self
    );
  }

  /**
   * @function prepare_data_to_graph
   * @description Prepares the graph data for rendering, filtering clusters and nodes.
   * @returns {Object} An object containing prepared graph data (all, edges, nodes, clusters).
   */
  function prepare_data_to_graph() {
    return NetworkGraphData.prepare_data_to_graph(self);
  }

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

  /**
   * @function _extract_mjc_attributes
   * @description Extracts MJC attributes for a priority group.
   * @param {string} priority_group_name - The name of the priority group.
   * @returns {Array} An array of extracted MJC attributes.
   */
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
   * @param {string} [date_field] - The field in the node object representing the date.
   * @returns {number} -1 if n1 is older, 1 if n2 is older, or based on ID if dates are equal.
   */
  self.oldest_nodes_first = function (n1, n2, date_field) {
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
    return annotate_priority_clusters(
      date_field,
      span_months,
      recent_months,
      start_date,
      self,
      timeDateUtil,
      kGlobals,
      helpers
    );
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

    //var sizes = self.network_layout.size();

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
    self.network_layout.start();
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
        .domain(d3.extent(self.network_layout.nodes(), (node) => node.x));
      rescale_x.range(_.map(rescale_x.domain(), (v) => v * x_scale));
      //.range ([50,self.width-50]),
      var rescale_y = d3.scale
        .linear()
        .domain(d3.extent(self.network_layout.nodes(), (node) => node.y));
      rescale_y.range(_.map(rescale_y.domain(), (v) => v * y_scale));

      _.each(self.network_layout.nodes(), (node) => {
        node.x = rescale_x(node.x);
        node.y = rescale_y(node.y);
      });
    }

    self.width = Math.min(Math.max(self.width, 200), 4000);
    self.height = Math.min(Math.max(self.height, 200), 4000);

    self.network_layout.size([self.width, self.height]);
    self.network_svg.attr("width", self.width).attr("height", self.height);
    if (trigger) {
      self.network_layout.start();
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

    NetworkControls.setup_priority_set_merge_controls(
      self,
      tables,
      clustersOfInterest
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
    self.singletons = graph_data.Nodes.filter((v, i) => v.cluster === null).length;

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
      self.compute_cluster_degrees(d);
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

    if (self.cluster_sizes.length > self.max_points_to_render) {
      var sorted_array = _.filter(
        _.map(self.cluster_sizes, (d, i) => [d, i + 1]),
        (d) => !_.isUndefined(d[0])
      );
      sorted_array = sorted_array.sort((a, b) => a[0] - b[0]);

      //.map((d, i) => [d, i + 1])
      //.sort((a, b) => a[0] - b[0]);

      for (var k = 0; k < sorted_array.length - self.max_points_to_render; k++) {
        self.exclude_cluster_ids[sorted_array[k][1]] = 1;
      }

      if (_.size(self.exclude_cluster_ids)) {
        self.warning_string +=
          (self.warning_string.length ? "<br>" : "") +
          "Excluded " +
          (sorted_array.length - self.max_points_to_render) +
          " clusters (maximum size " +
          sorted_array[k - 1][0] +
          " nodes) because only " +
          self.max_points_to_render +
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
  self._node_table_draw_buttons = function (element, payload) {
    return NetworkNodeTableUI.node_table_draw_buttons(
      element,
      payload,
      self,
      nodesTab
    );
  };

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
    return NetworkNodeTableUI.update_volatile_elements(
      container,
      suppress_editor,
      clustersOfInterest,
      tables
    );
  };

  self.redraw_tables = function () {
    return NetworkNodeTableUI.redraw_tables(self, nodesTab, kGlobals);
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
    return NetworkNodeTableUI.draw_extended_node_table(
      node_list,
      container,
      extra_columns,
      options,
      self,
      nodesTab,
      clustersOfInterest,
      kGlobals,
      tables,
      timeDateUtil,
      jsConvert
    );
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
    return NetworkNodeTableUI.draw_node_table(
      extra_columns,
      node_list,
      headers,
      rows,
      container,
      table_caption,
      ND,
      self,
      nodesTab,
      clustersOfInterest,
      tables
    );
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
      // const nodes_removed = graph_data.Nodes.length - self.singletons - self.nodes.length;
      // const networkString = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
      //         + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
      //         + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
      // if (self.singletons > 0) {
      //   networkString += "<strong>" +self.singletons + "</strong> singleton nodes are not shown. ";
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
    return NetworkElementDrawing.draw_a_node(self, container, node, kGlobals, misc);
  }

  /**
   * @function draw_a_cluster
   * @description Draws a single cluster in the network as a pie chart of its constituent nodes.
   * @param {HTMLElement} container - The container element for the cluster.
   * @param {Object} the_cluster - The cluster object to draw.
   * @returns {void}
   */
  function draw_a_cluster(container, the_cluster) {
    return NetworkElementDrawing.draw_a_cluster(self, container, the_cluster);
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
    return NetworkColorPickerUI.renderColorPicker(
      cat_id,
      type,
      self,
      graph_data,
      kGlobals,
      colorPicker
    );
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
      self.network_layout.friction(friction);
    }
    self.display_warning(self.warning_string, true);

    var rendered_nodes, rendered_clusters, link;

    if (!soft) {
      var draw_me = prepare_data_to_graph();

      self.network_layout.nodes(draw_me.all).links(draw_me.edges);
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
        .on("mouseover", self.edge_pop_on)
        .on("mouseout", self.edge_pop_off)
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
        .on("mouseover", self.cluster_pop_on)
        .on("mouseout", self.cluster_pop_off)
        .call(self.network_layout.drag().on("dragstart", self.cluster_pop_off));

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
            self.compute_cluster_degrees(c);
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
        self.rendered_object_counts.has_hatching || self.node_multiple_membership(d);
    });

    rendered_clusters.each(function (d) {
      draw_a_cluster(this, d);
    });

    link.style("opacity", (d) =>
      Math.max(self.node_opacity(d.target), self.node_opacity(d.source))
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
      self.currently_displayed_objects =
        rendered_clusters[0].length + rendered_nodes[0].length;

      self.network_layout.on("tick", () => {
        var sizes = self.network_layout.size();

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

      self.network_layout.start();
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

    var sizes = self.network_layout.size();

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
    return misc.compute_node_degrees({ Nodes: nodes, Edges: edges });
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
  self.node_size = function (d) {
    return node_size_ext(d);
  };

  /**
   * @function node_multiple_membership
   * @description Checks if a node has the 'multiple_membership' attribute.
   * @param {Object} n - The node object.
   * @returns {boolean} True if the node has multiple memberships, false otherwise.
   */
  self.node_multiple_membership = function (n) {
    return node_multiple_membership_ext(n);
  };

  /**
   * @function node_color
   * @description Determines the color of a node based on its attributes and the current colorizer settings.
   * @param {Object} d - The node object.
   * @returns {string} The color of the node.
   */
  self.node_color = function (d) {
    return node_color_ext(self, d, kGlobals);
  };

  /**
   * @function node_opacity
   * @description Determines the opacity of a node based on the current opacity settings.
   * @param {Object} d - The node object.
   * @returns {number} The opacity of the node.
   */
  self.node_opacity = function (d) {
    return node_opacity_ext(self, d);
  };

  /**
   * @function cluster_color
   * @description Determines the color of a cluster based on its attributes.
   * @param {Object} d - The cluster object.
   * @param {string} type - The type of the cluster.
   * @returns {string} The color of the cluster.
   */
  self.cluster_color = function (d, type) {
    return cluster_color_ext(self, d, type);
  };

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

  self.node_pop_on = function (d) {
    return NetworkNodeInteraction.node_pop_on(
      self,
      d,
      this,
      kGlobals,
      misc,
      timeDateUtil,
      Tooltips
    );
  };

  self.node_pop_off = function (d) {
    return NetworkNodeInteraction.node_pop_off(this, Tooltips);
  };

  self.edge_pop_on = function (e) {
    return NetworkNodeInteraction.edge_pop_on(self, e, this, kGlobals, Tooltips);
  };

  self.edge_pop_off = function (d) {
    return NetworkNodeInteraction.edge_pop_off(this, Tooltips);
  };

  /*------------ Cluster Methods ---------------*/

  /**
   * Creates a new object that groups nodes by cluster
   * @param {Array<Object>} nodes - An array of node objects.
   * @returns {Object} An object where keys are cluster IDs and values are arrays of nodes.
   */
  self.get_all_clusters = function (nodes) {
    return NetworkClusters.get_all_clusters(nodes);
  };

  /**
   * @function collapse_cluster
   * @description Collapses a cluster, hiding its children nodes.
   * @param {Object} x - The cluster object to collapse.
   * @param {boolean} keep_in_q - If true, keeps the cluster in the open cluster queue.
   * @returns {number} The number of children in the collapsed cluster.
   */
  self.collapse_cluster = function (x, keep_in_q) {
    return NetworkClusters.collapse_cluster(self, x, keep_in_q);
  };

  /**
   * @function expand_cluster
   * @description Expands a cluster, showing its children nodes.
   * @param {Object} x - The cluster object to expand.
   * @param {boolean} copy_coord - If true, copies coordinates from the parent cluster to the children.
   * @returns {void}
   */
  self.expand_cluster = function (x, copy_coord) {
    return NetworkClusters.expand_cluster(self, x, copy_coord);
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
    return NetworkStatisticsUI.render_binned_table(
      id,
      the_map,
      matrix,
      self,
      kGlobals,
      misc
    );
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
    return NetworkStatisticsUI.render_chord_diagram(id, the_map, matrix, self);
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
    return NetworkStatisticsUI.attribute_pairwise_distribution(
      id,
      dim,
      the_map,
      only_expanded,
      draw_me,
      self
    );
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

  self.cluster_pop_on = function (d) {
    return NetworkNodeInteraction.cluster_pop_on(
      self,
      d,
      this,
      kGlobals,
      misc,
      Tooltips
    );
  };

  self.cluster_pop_off = function (d) {
    return NetworkNodeInteraction.cluster_pop_off(this, Tooltips);
  };

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

      if (new_nodes > self.max_points_to_render) {
        self.warning_string = "This cluster is too large to be displayed";
      } else {
        var leftover =
          new_nodes + self.currently_displayed_objects - self.max_points_to_render;
        if (leftover > 0) {
          var k = 0;
          for (; k < self.open_cluster_queue.length && leftover > 0; k++) {
            var cluster =
              self.clusters[self.cluster_mapping[self.open_cluster_queue[k]]];
            leftover -= cluster.children.length - 1;
            self.collapse_cluster(cluster, true);
          }
          if (k || self.open_cluster_queue.length) {
            self.open_cluster_queue.splice(0, k);
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
   * @function compute_cluster_degrees
   * @description Computes the degrees of a cluster and stores them in the cluster object.
   * @param {Object} d - The cluster object.
   * @returns {void}
   */
  self.compute_cluster_degrees = function (d) {
    var degrees = d.children.map((c) => c.degree);
    degrees.sort(d3.ascending);
    d.degrees = helpers.describe_vector(degrees);
  };

  /**
   * @function handle_node_label
   * @description Toggles the visibility of a node's label.
   * @param {HTMLElement} container - The container element for the node.
   * @param {Object} node - The node object.
   * @returns {void}
   */
  self.handle_node_label = function (container, node) {
    return NetworkNodeInteraction.handle_node_label(self, container, node);
  };

  /**
   * @function collapse_cluster_handler
   * @description Handles the collapse of a cluster.
   * @param {Object} d - The cluster object to collapse.
   * @param {boolean} do_update - If true, updates the network visualization after collapsing.
   * @returns {void}
   */
  self.collapse_cluster_handler = function (d, do_update) {
    return NetworkNodeInteraction.collapse_cluster_handler(self, d, do_update);
  };

  /**
   * @function cluster_box_size
   * @description Determines the size of a cluster box based on the number of entities in the cluster.
   * @param {Object} c - The cluster object.
   * @returns {number} The size of the cluster box.
   */
  self.cluster_box_size = function (c) {
    let cc;
    if (self.cluster_sizes_in_entities) {
      cc = self.cluster_sizes_in_entities[c.cluster_id];
    }
    cc = cc || c.children.length;

    return 8 * Math.sqrt(cc);
  };

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
    return NetworkStatisticsUI.extract_network_time_series(
      time_attr,
      other_attributes,
      node_filter,
      self
    );
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
    return NetworkStatisticsUI.stratify(array);
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

  initializeNetworkScales(self);
  var graph_data = self.json; // the raw JSON network object

  self.open_cluster_queue = [];
  self.currently_displayed_objects = 0;

  /*------------ D3 globals and SVG elements ---------------*/

  self.network_layout = null;
  if (!self.isMJCNetwork) {
    self.network_layout = d3.layout
      .force()
      .on("tick", tick)
      .charge((d) => {
        if (d.cluster_id) {
          return self.charge_correction * (-15 - 5 * d.children.length ** 0.4);
        }
        return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
      })
      .linkDistance(
        (d) => self.link_scale(d.length) * self.l_scale * 0.2 //Math.max(d.length, 0.005) * l_scale * 10;
      )
      .linkStrength((d) => {
        if (d.support !== undefined) {
          return 0.75 - 0.5 * d.support;
        }
        return 1;
      })
      .chargeDistance(self.l_scale * 0.1)
      .gravity(self.gravity_scale(self.json.Nodes.length))
      .friction(0.25);
  } else {
    self.network_layout = d3.layout.force();
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
  self.network_layout.start();

  return self;
};

export {
  hivtrace_cluster_depthwise_traversal as computeCluster,
  hivtrace_cluster_network_graph as clusterNetwork,
};
