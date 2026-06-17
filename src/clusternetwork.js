import * as d3 from "d3";
import _ from "underscore";
import jsConvert from "js-convert-case";
import * as topojson from "topojson";
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
    .attr("placeholder", __("network_tab")["text_in_attributes"]);
  $("#show_as").html(__("attributes_tab")["show_as"]);

  //console.log (json.Nodes[0][kGlobals.network.NodeAttributeID],json.Nodes[1][kGlobals.network.NodeAttributeID]);

  network.normalize_node_attributes(json);
  network.ensure_node_attributes_exist(json);

  /** SLKP 20190902: somehow some of our networks have malformed edges! This will remove them */
  json.Edges = _.filter(
    json.Edges || [],
    (e) => "source" in e && "target" in e
  );

  /** Not primary networks are individual cluster/subcluster views.
      They don't interfere with the primary network object, and UI elements

   */

  const izPrimaryGraph = network.check_network_option(
    options,
    "secondary",
    true,
    false
  );

  console.time("[PERF] HIVTxNetwork instantiation");
  var self = new HTX.HIVTxNetwork(json, button_bar_ui, null, !izPrimaryGraph);
  console.timeEnd("[PERF] HIVTxNetwork instantiation");
  self.post_init_callbacks = [];

  console.time("[PERF] self.process_multiple_sequences");
  self.process_multiple_sequences();
  console.timeEnd("[PERF] self.process_multiple_sequences");

  self.isMJCNetwork = options && options["is-mjc-network"] ? true : false;
  self.fullMJCNetwork = options && options["full-mjc-network"] ? true : false;
  self.mjcUUID = self.isMJCNetwork ? options["mjc-uuid"] || null : null;
  self.MJCVariables = self.isMJCNetwork ? options["mjc-variables"] || {} : {};

  self._is_CDC_ = options && options["no_cdc"] ? false : true;

  self._is_seguro = network.check_network_option(
    options,
    "seguro",
    false,
    true
  );

  self._is_CDC_executive_mode = network.check_network_option(
    options,
    "cdc-executive-mode",
    false
  );

  console.time("[PERF] helpers.getUniqueValues");
  self.uniqValues = helpers.getUniqueValues(
    self.json.Nodes,
    self.json[kGlobals.network.GraphAttrbuteID]
  );
  console.timeEnd("[PERF] helpers.getUniqueValues");

  self.uniqs = _.mapObject(self.uniqValues, (d) => d.length);

  self.schema = self.json[kGlobals.network.GraphAttrbuteID];
  // set initial color schemes
  self.networkColorScheme = kGlobals.PresetColorSchemes;
  self.networkShapeScheme = kGlobals.PresetShapeSchemes;

  self.ww = network.check_network_option(
    options,
    "width",
    d3.select(parent_container).property("clientWidth")
  );

  self.margin = {
    top: 20,
    right: 10,
    bottom: 30,
    left: 10,
  };
  self.width = self.ww - self.margin.left - self.margin.right;
  self.height = (self.width * 9) / 16;

  self.container = network_container;
  self.nodes = [];

  self.edges = [];
  self.clusters = [];
  self.cluster_sizes = [];
  self.cluster_mapping = {};
  self.percent_format = kGlobals.formats.PercentFormat;
  self.missing = kGlobals.missing.label;
  self.cluster_attributes = self.json["Cluster description"] || null;
  self.precomputed_subclusters = self.json["Subclusters"] || null;
  self.network_warning_tag = network_warning_tag;

  console.time("[PERF] self.annotate_cluster_changes");
  self.annotate_cluster_changes();
  console.timeEnd("[PERF] self.annotate_cluster_changes");

  self.filter_edges = true;
  self.hide_hxb2 = false;
  self.cluster_table = d3.select(clusters_table);

  if (self._is_CDC_) {
    self.priority_set_table = network.check_network_option(
      options,
      "priority-table"
    );
    self.priority_set_archive_table = network.check_network_option(
      options,
      "priority-table-archive"
    );
    self.priority_set_table_write = network.check_network_option(
      options,
      "priority-table-writeback"
    );
    if (self.priority_set_table) {
      self.priority_set_table = d3.select(self.priority_set_table);
    }
    if (self.priority_set_archive_table) {
      self.priority_set_archive_table = d3.select(
        self.priority_set_archive_table
      );
    }
  } else {
    self.priority_set_table = null;
    self.priority_set_table_write = null;
  }

  self.needs_an_update = false;
  self.hide_unselected = false;
  self.show_percent_in_pairwise_table = false;

  self.priority_set_table_writeable = !self.isMJCNetwork;

  /** if there's a function passed as "init_code", run it now */

  if (options && _.isFunction(options["init_code"])) {
    options["init_code"].call(null, self, options);
  }

  /** Whenever the code creates a DOM element, it will be done using this prefix
      to generate element IDs
   */

  self.dom_prefix = network.check_network_option(
    options,
    "prefix",
    "hiv-trace"
  );

  /** Retrieve additional columns (as dict, see comments further down in the code)
      for the "clusters" table

   */
  self.extra_cluster_table_columns = network.check_network_option(
    options,
    "cluster-table-columns",
    null
  );

  self.parent_graph_object = network.check_network_option(
    options,
    "parent_graph",
    null
  );

  self.legend_multiple_sequences = network.check_network_option(
    options,
    "legend_multiple_sequences",
    self.parent_graph_object
      ? self.parent_graph_object.legend_multiple_sequences
      : self.legend_multiple_sequences
  );

  /** set the TODAY date for the network*/

  if (self.json.Settings && self.json.Settings.created) {
    self.today = new Date(json.Settings.created);
  } else {
    self.today = network.check_network_option(
      options,
      "today",
      timeDateUtil.getCurrentDate()
    );
  }

  /** get the reference (creation) date for the network.
      it's the same as "today" for primary networks,
      but is inherited from parent networks for secondary graphs (e.g. cluster or subcluster views)
  */

  if (self._is_CDC_) {
    // define various CDC settings

    /** Do not automatically create CoI */
    self._is_CDC_auto_mode = network.check_network_option(
      options,
      "cdc-no-auto-priority-set-mode",
      true,
      false
    );

    /** these are the default columns selected in the "nodes" table */

    const default_node_attributes = [
      tables._networkNodeIDField,
      "sex_trans",
      "race_cat",
      "hiv_aids_dx_dt",
      "cur_city_name",
    ];



    self.displayed_node_subset = network.check_network_option(
      options,
      "node-attributes",
      default_node_attributes
    );

    /** retrieve the target DOM ID for placing the "subcluster" table into */
    self.subcluster_table = network.check_network_option(
      options,
      "subcluster-table",
      null,
      d3.select(options["subcluster-table"])
    );

    /** extra column definitions for the subcluster table */
    self.extra_subcluster_table_columns = null;

    // SLKP 20200727 issues

    /** Secure HIV-TRACE specific settings */
    const rawJurisdictionOption = self.lookup_option(
      "jurisdiction",
      "unknown",
      options
    );
    self.CDC_data = {
      jurisdiction: rawJurisdictionOption.toLowerCase().replace(/\s/g, ""),
      // Raw group_id (case preserved) used for node-level jurisdiction comparisons
      // against patient_attributes.jurisdiction / joint_owners emitted by the backend.
      group_id: rawJurisdictionOption,
      timestamp: self.today,
      "autocreate-priority-set-size": 5,
    };

    /** What jurisdiction are we using for Secure HIV-TRACE?
        This determines the two-letter prefix for auto-naming Clusters of Interest
        If none, use PG prefix
     */

    if (self.CDC_data.jurisdiction in kGlobals.CDCJurisdictionCodes) {
      self.CDC_data["jurisdiction_code"] =
        kGlobals.CDCJurisdictionCodes[self.CDC_data.jurisdiction].toUpperCase();
    } else {
      self.CDC_data["jurisdiction_code"] = "PG";
    }

    /** Check if this is a low morbidity jurisdiction */
    if (
      kGlobals.CDCJurisdictionLowMorbidity.has(self.CDC_data["jurisdiction"])
    ) {
      self.CDC_data["autocreate-priority-set-size"] = 3;
    }

    /** Populate column table definitions */
    if (self.subcluster_table) {
      self.extra_subcluster_table_columns =
        columnDefinitions.secure_hiv_trace_subcluster_columns(self);
    } else if (self.extra_cluster_table_columns) {
      self.extra_cluster_table_columns =
        self.extra_cluster_table_columns.concat(
          columnDefinitions.secure_hiv_trace_subcluster_columns(self)
        );
    } else {
      self.extra_cluster_table_columns =
        columnDefinitions.secure_hiv_trace_subcluster_columns(self);
    }
  } // end self._is_CDC_

  if (self._is_CDC_) {
    self.extra_node_table_columns = null;
  } else {
    self.extra_node_table_columns = network.check_network_option(
      options,
      "node-table-columns"
    );
  }

  /** default subcluster definition threshold */
  self.subcluster_threshold = network.check_network_option(
    options,
    "subcluster-thershold",
    0.005
  );

  if (self.isPrimaryGraph) {
    HTX.HIVTxNetwork._primaryInstance = self;
    clustersOfInterest.init(self);
    nodesTab.init(d3.select(nodes_table));
  }

  self.countryCentersObject = network.check_network_option(
    options,
    "country-centers"
  );
  self.countryOutlines = network.check_network_option(
    options,
    "country-outlines"
  );

  if (self.countryCentersObject && self.countryOutlines) {
    self._calc_country_nodes(options);
    self.showing_on_map = options.showing_on_map;
  } else {
    self.showing_on_map = false;
  }

  /** this array contains fields that will be appended to node pop-overs in the network tab
      they will precede all the fields that are shown based on selected labeling */
  self._additional_node_pop_fields = [];

  self.minimum_cluster_size = network.check_network_option(
    options,
    "minimum size",
    5
  );

  timeDateUtil.init(options, self._is_CDC_, timeDateUtil._networkCDCDateField);

  if (self._is_CDC_) {
    self._additional_node_pop_fields.push(timeDateUtil._networkCDCDateField);
  }

  self.core_link_length = network.check_network_option(
    options,
    "core-link",
    -1
  );
  self.additional_edge_styler = network.check_network_option(
    options,
    "edge-styler"
  );

  if (self.json.Notes) {
    _.each(self.json.Notes, (s) => (self.warning_string += s + "<br>"));
  }

  /**
    the true branch is taken if the network JSON contains "Cluster description"
  */
  if (self.cluster_attributes) {
    self.warning_string += __("network_tab")["cluster_display_info"];
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
      self.warning_string += __("network_tab")["cluster_display_info"];
      self.using_time_filter.setUTCFullYear(
        self.using_time_filter.getUTCFullYear() - 1
      );
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    }
  }

  self.initial_packed =
    options && options["initial_layout"] === "tiled" ? false : true;

  self._networkPredefinedAttributeTransforms = {
    /** runtime computed node attributes, e.g. transforms of existing attributes */

    binned_vl_recent_value: self.define_attribute_binned_vl(
      "vl_recent_value",
      "Most Recent Viral Load Category Binned"
    ),

    binned_vl_recent_value_adj: self.define_attribute_binned_vl(
      "vl_recent_value_adj",
      "Most Recent Viral Load Category Binned"
    ),

    vl_result_interpretation: self.define_attribute_vl_interpretaion(),

    age_dx_normalized: self.define_attribute_age_dx(),

    years_since_dx: self.define_attribute_dx_years(
      true,
      "Years since diagnosis"
    ),

    hiv_aids_dx_dt_year: self.define_attribute_dx_years(
      false,
      "Diagnosis Year"
    ),

    sequence_count: self.define_attribute_sequence_count("Number of sequences"),
  };

  if (self.isMJCNetwork) {
    // not actually displayed in node list view
    self._networkPredefinedAttributeTransforms["mjc_date_identified"] =
      self.define_attribute_mjc_date_identified(
        "Date Identified in MJ ClusterOI (Contains All ClusterOI Dates)"
      );
    self._networkPredefinedAttributeTransforms["selected_mjc_date_identified"] =
      self.define_attribute_sel_mjc_date_identified(
        "Date Identified in MJ ClusterOI"
      );
    // not actually displayed in node list view
    self._networkPredefinedAttributeTransforms["mjc_date_identified_12mo"] =
      self.define_attribute_mjc_date_identified_12mo(
        "Identified in Last 12 Mo (Contains All ClusterOI Dates)"
      );
    self._networkPredefinedAttributeTransforms[
      "selected_mjc_date_identified_12mo"
    ] = self.define_attribute_sel_mjc_date_identified_12mo(
      "Identified in Last 12 Mo"
    );
    self._networkPredefinedAttributeTransforms["hiv_aids_dx_dt_month_year"] =
      self.define_attribute_dx_month_year("Diagnosis Month/Year");
    self._networkPredefinedAttributeTransforms["hiv_aids_dx_dt_12mo"] =
      self.define_attribute_dx_12mo("DX in Last 12 Mo.");
    self._networkPredefinedAttributeTransforms["hiv_aids_dx_dt_36mo"] =
      self.define_attribute_dx_36mo("DX in Last 36 Mo.");
  }

  if (self.cluster_attributes) {
    self._networkPredefinedAttributeTransforms["_newly_added"] =
      self.define_attribute_network_update();
  }

  /** inject any attributes passed through "computed-attributes" */

  if (options && options["computed-attributes"]) {
    _.extend(
      self._networkPredefinedAttributeTransforms,
      options["computed-attributes"]
    );
  }

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

  /**
   * @function _draw_topomap
   * @description This function draws the topological map.
   * @param {boolean} no_redraw - If true, the map will not be redrawn.
   * @returns {Object} The network object itself.
   */
  self._draw_topomap = function (no_redraw) {
    if (options && "showing_on_map" in options) {
      var countries = topojson.feature(
        self.countryOutlines,
        self.countryOutlines.objects.countries
      ).features;
      var mapsvg = d3.select("#" + self.dom_prefix + "-network-svg");
      var path = d3.geo.path().projection(self.mapProjection);
      countries = mapsvg.selectAll(".country").data(countries);

      countries.enter().append("path");
      countries.exit().remove();

      self.countries_in_cluster = {};

      _.each(self.nodes, (node) => {
        var countryCodeAlpha2 = self._get_node_country(node);
        var countryCodeNumeric =
          self.countryCentersObject[countryCodeAlpha2].countryCodeNumeric;
        if (!(countryCodeNumeric in self.countries_in_cluster)) {
          self.countries_in_cluster[countryCodeNumeric] = true;
        }
      });

      countries
        .attr("class", "country")
        .attr("d", path)
        .attr("stroke", "saddlebrown")
        .attr("fill", (d) => {
          if (d.id in self.countries_in_cluster) {
            return "navajowhite";
          }
          return "bisque";
        })
        .attr("stroke-width", (d) => {
          if (d.id in self.countries_in_cluster) {
            return 1.5;
          }
          return 0.5;
        });
    }
    return self;
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
    //console.log (restore_to_tag);
    $(restore_to_tag).tab("show");
    $("#" + tab_element).remove();
    $("#" + tab_content).remove();
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
    var cluster = _.find(
      self.clusters,
      (c) => String(c.cluster_id) === String(cluster_id)
    );

    if (!cluster) {
      return;
    }

    additional_options = additional_options || {};

    additional_options["parent_graph"] = self;

    var filtered_json = self.extract_single_cluster(
      custom_filter
        ? _.filter(self.json.Nodes, custom_filter)
        : cluster.children,
      null,
      null,
      null,
      include_injected_edges
    );

    if (self.has_multiple_sequences) {
      /**
            20241030 SLKP
            Perform a greedy collapse of all the sequences that map to the same primary key
            For a reduced cluster view
        */

      _.each(filtered_json.Nodes, (n) => {
        if (n["multiple clusters"]) n["multiple_membership"] = true;
      });

      if (additional_options["simplified-mspp"]) {
        filtered_json = self.simplify_multisequence_cluster(filtered_json);
      }
    }

    if (kGlobals.network.GraphAttrbuteID in self.json) {
      filtered_json[kGlobals.network.GraphAttrbuteID] = {};
      $.extend(
        true,
        filtered_json[kGlobals.network.GraphAttrbuteID],
        self.json[kGlobals.network.GraphAttrbuteID]
      );
    }

    var export_items = [];
    if (!self._is_CDC_executive_mode) {
      export_items.push([
        "Export cluster to .CSV",
        function (network) {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(
              self._extract_nodes_by_id(cluster_id),
              self._extract_exportable_attributes()
            )
          );
        },
      ]);
    }

    //self._check_for_time_series(export_items);

    if ("extra_menu" in additional_options) {
      _.each(export_items, (item) => {
        additional_options["extra_menu"]["items"].push(item);
      });
    } else {
      _.extend(additional_options, {
        extra_menu: {
          title: "Action",
          items: export_items,
        },
      });
    }

    return self.open_exclusive_tab_view_aux(
      filtered_json,
      custom_name ? custom_name(cluster_id) : "Cluster " + cluster_id,
      additional_options
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
    var random_prefix = misc.random_id();
    var random_tab_id = random_prefix + "_tab";
    var random_content_id = random_prefix + "_div";
    var random_button_bar = random_prefix + "_ui";

    while (
      $("#" + random_tab_id).length ||
      $("#" + random_content_id).length ||
      $("#" + random_button_bar).length
    ) {
      random_prefix = misc.random_id();
      random_tab_id = random_prefix + "_tab";
      random_content_id = random_prefix + "_div";
      random_button_bar = random_prefix + "_ui";
    }

    var tab_container = "top_level_tab_container";
    var content_container = "top_level_tab_content";
    var go_here_when_closed = "#trace-default-tab";

    // add new tab to the menu bar and switch to it
    var new_tab_header = $("<li></li>").attr("id", random_tab_id);

    var new_link = $("<a></a>")
      .attr("href", "#" + random_content_id)
      .attr("data-toggle", "tab")
      .text(title);
    $(
      '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
    )
      .appendTo(new_link)
      .on("click", () => {
        self.open_exclusive_tab_close(
          random_tab_id,
          random_content_id,
          go_here_when_closed
        );
      });

    new_link.appendTo(new_tab_header);
    $("#" + tab_container).append(new_tab_header);

    var new_tab_content = $("<div></div>")
      .addClass("tab-pane")
      .attr("id", random_content_id)
      .data("cluster", option_extras.cluster_id);

    if (option_extras.type === "subcluster") {
      new_tab_content
        .addClass("subcluster-view")
        .addClass("subcluster-" + option_extras.cluster_id.replace(".", "_"));
    }

    //     <li class='disabled' id="attributes-tab"><a href="#trace-attributes" data-toggle="tab">Attributes</a></li>
    var new_button_bar;
    if (filtered_json) {
      new_button_bar = $('[data-hivtrace="cluster-clone"]')
        .clone()
        .attr("data-hivtrace", null);
      new_button_bar
        .find("[data-hivtrace-button-bar='yes']")
        .attr("id", random_button_bar)
        .addClass("cloned-cluster-tab")
        .attr("data-hivtrace-button-bar", null);

      new_button_bar.appendTo(new_tab_content);
    }
    new_tab_content.appendTo("#" + content_container);

    $(new_link).on("show.bs.tab", (e) => {
      //console.log (e);
      if (e.relatedTarget) {
        //console.log (e.relatedTarget);
        go_here_when_closed = e.relatedTarget;
      }
    });

    // show the new tab
    $(new_link).tab("show");

    var cluster_view;

    if (filtered_json) {
      var cluster_options = {
        no_cdc: options && options["no_cdc"],
        "minimum size": 0,
        secondary: true,
        prefix: random_prefix,
        extra_menu:
          options && "extra_menu" in options ? options["extra_menu"] : null,
        "edge-styler":
          options && "edge-styler" in options ? options["edge-styler"] : null,
        "no-subclusters": true,
        "no-subcluster-compute": false,
      };

      if (option_extras) {
        _.extend(cluster_options, option_extras);
      }

      if (
        option_extras.showing_on_map &&
        self.countryCentersObject &&
        self.countryOutlines
      ) {
        cluster_options["showing_on_map"] = true;
        cluster_options["country-centers"] = self.countryCentersObject;
        cluster_options["country-outlines"] = self.countryOutlines;

        // Create an array of the countries in the selected cluster for use in styling the map.
        if ("extra-graphics" in cluster_options) {
          var draw_map = function (other_code, network) {
            other_code(network);
            return network._draw_topomap();
          };

          cluster_options["extra-graphics"] = _.wrap(
            draw_map,
            cluster_options["extra-graphics"]
          );
        } else {
          cluster_options["extra-graphics"] = function (network) {
            return network._draw_topomap();
          };
        }
      }

      cluster_options["today"] = self.today;
      cluster_options["auto_expand_single_cluster"] = true;
      if (self.fullMJCNetwork) {
        cluster_options["full-mjc-network"] = true;
        cluster_options["is-mjc-network"] = true;
      }
      cluster_view = hivtrace_cluster_network_graph(
        filtered_json,
        "#" + random_content_id,
        null,
        null,
        random_button_bar,
        attributes,
        null,
        null,
        null,
        parent_container,
        cluster_options
      );

      if (self.colorizer["category_id"]) {
        if (self.colorizer["continuous"]) {
          cluster_view.handle_attribute_continuous(
            self.colorizer["category_id"]
          );
        } else {
          cluster_view.handle_attribute_categorical(
            self.colorizer["category_id"]
          );
        }
      }

      if (self.node_shaper["id"]) {
        cluster_view.handle_shape_categorical(self.node_shaper["id"]);
      }

      if (self.colorizer["opacity_id"]) {
        cluster_view.handle_attribute_opacity(self.colorizer["opacity_id"]);
      }

      //cluster_view.expand_cluster_handler(cluster_view.clusters[0], true);
    } else {
      return new_tab_content.attr("id");
    }
    return cluster_view;
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
    if (d3.event.defaultPrevented) return;
    var container = d3.select(self.container);
    var id = "d3_context_menu_id";
    var menu_object = container.select("#" + id);

    if (menu_object.empty()) {
      menu_object = container
        .append("ul")
        .attr("id", id)
        .attr("class", "dropdown-menu")
        .attr("role", "menu");
    }

    menu_object.selectAll("li").remove();

    if (node) {
      node.fixed = 1;
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text(__("clusters_main")["collapse_cluster"])
        .on("click", (d) => {
          node.fixed = 0;
          collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text((d) => (node.show_label ? "Hide text label" : "Show text label"))
        .on("click", (d) => {
          node.fixed = 0;
          //node.show_label = !node.show_label;
          handle_node_label(container, node);
          //collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      if (clustersOfInterest.get_editor()) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text((d) => "Add this node to the cluster of interest")
          .on("click", (d) => {
            clustersOfInterest
              .get_editor()
              .append_node(self.entity_id(node), true);
          });
      }

      // SW20180605 : To be implemented

      //menu_object
      //  .append("li")
      //  .append("a")
      //  .attr("tabindex", "-1")
      //  .text("Show sequences used to make cluster")
      //  .on("click", function(d) {
      //    node.fixed = 0;
      //    show_sequences_in_cluster (node, true);
      //    menu_object.style("display", "none");
      //  });

      menu_object
        .style("position", "absolute")
        .style("left", String(d3.event.offsetX) + "px")
        .style("top", String(d3.event.offsetY) + "px")
        .style("display", "block");
    } else {
      menu_object.style("display", "none");
    }

    container.on(
      "click",
      (d) => {
        handle_node_click(null);
      },
      true
    );
  };

  /**
   * @function get_initial_xy
   * @description Calculates initial x and y coordinates for clusters based on packing or treemap layout.
   * @param {boolean} packed - If true, uses a pack layout; otherwise, uses a treemap layout.
   * @returns {Array} A tuple containing the laid out clusters and all clusters.
   */
  function get_initial_xy(packed) {
    // create clusters from nodes
    var mapped_clusters = get_all_clusters(self.nodes);

    var d_clusters = {
      id: "root",
      children: [],
    };

    // filter out clusters that are to be excluded
    if (self.exclude_cluster_ids) {
      mapped_clusters = _.omit(mapped_clusters, self.exclude_cluster_ids);
    }

    // Filter out unclustered/None/null/undefined groups and clusters of size <= 1
    var filtered_mapped_clusters = {};
    _.each(mapped_clusters, (value, key) => {
      if (
        key !== "null" &&
        key !== "undefined" &&
        key !== "None" &&
        key !== "" &&
        value.length > 1
      ) {
        filtered_mapped_clusters[key] = value;
      }
    });
    mapped_clusters = filtered_mapped_clusters;

    let all_clusters = _.map(mapped_clusters, (value, key) => ({
      cluster_id: key,
      children: value,
    }));

    if (_.size(mapped_clusters) > max_points_to_render) {
      let reduced_clusters = _.chain(all_clusters)
        .pairs()
        .sortBy((d) => (-d.children ? d.children.length : 0))
        .value();
      d_clusters.children = [];
      for (let i = 0; i < max_points_to_render; i++) {
        d_clusters.children.push({
          cluster_id: reduced_clusters[i][0],
          children: reduced_clusters[i][1],
        });
      }
    } else {
      d_clusters.children = all_clusters;
    }

    // d3 calls `.value` on the root when it has no children (empty subcluster);
    // the root has no `.parent`, so guard against it to avoid crashing the render.
    var treemap = packed
      ? d3.layout
          .pack()
          .size([self.width, self.height])
          //.sticky(true)
          .children((d) => d.children)
          .value((d) => (d.parent ? d.parent.children.length : 1) ** 1.5)
          .sort((a, b) => b.value - a.value)
          .padding(5)
      : d3.layout
          .treemap()
          .size([self.width, self.height])
          //.sticky(true)
          .children((d) => d.children)
          .value((d) => (d.parent ? d.parent.children.length : 1) ** 1.0)
          .sort((a, b) => a.value - b.value)
          .ratio(1);

    var clusters = treemap.nodes(d_clusters);
    return [clusters, all_clusters];
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
              var set_date = timeDateUtil.DateViewFormatSlider.parse(
                this.value
              );
              if (this.value) {
                network._refresh_subcluster_view(set_date);

                enclosure
                  .classed("has-success", true)
                  .classed("has-error", false);
              } else {
                enclosure
                  .classed("has-success", false)
                  .classed("has-error", true);
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

    /*var selector =
      ".subcluster-" +
      cluster.id.replace(".", "_") +
      " .show-small-clusters-button";

    var item = $(
      '<span class="input-group-addon btn view-parent-btn">View Parent</span>'
    )
      .data("cluster_id", cluster.parent_cluster.cluster_id)
      .insertAfter(selector);

    item.on("click", function(e) {
      self.open_exclusive_tab_view($(this).data("cluster_id"));
    });*/
  };

  /**
   * @function oldest_nodes_first
   * @description Compares two nodes to determine which one is older based on their diagnosis date.
   * @param {Object} n1 - The first node object.
   * @param {Object} n2 - The second node object.
   * @returns {number} -1 if n1 is older, 1 if n2 is older, or based on ID if dates are equal.
   */
  var oldest_nodes_first = function (n1, n2) {
    const date_field = date_field || timeDateUtil._networkCDCDateField;

    // consistent node sorting, older nodes first
    var node1_dx = self.attribute_node_value_by_id(n1, date_field);
    var node2_dx = self.attribute_node_value_by_id(n2, date_field);

    if (node1_dx === node2_dx) {
      return n1.id < n2.id ? -1 : 1;
    }
    return node1_dx < node2_dx ? -1 : 1;
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
  function default_layout(packed) {
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

    self.clusters.forEach(collapse_cluster);
  }

  /**
   * @function change_spacing
   * @description Adjusts the spacing between nodes in the network layout.
   * @param {number} delta - The factor by which to change the charge correction.
   * @returns {void}
   */
  function change_spacing(delta) {
    self.charge_correction *= delta;
    network_layout.start();
  }

  /**
   * @function change_window_size
   * @description Changes the size of the network visualization window.
   * @param {number} delta - The amount by which to change the width and height.
   * @param {boolean} trigger - If true, triggers a network layout restart.
   * @returns {void}
   */
  function change_window_size(delta, trigger) {
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
    self._calc_country_nodes(options);
    self._draw_topomap(true);
    if (trigger) {
      network_layout.start();
    } else if (delta) {
      self.update(true);
    }
  }

  /**
   * @function compute_adjacency_list
   * @description Computes the adjacency list for each node in the network.
   * @returns {void}
   */
  self.compute_adjacency_list = _.once(() => {
    self.nodes.forEach((n) => {
      n.neighbors = d3.set();
    });

    self.edges.forEach((e) => {
      self.nodes[e.source].neighbors.add(e.target);
      self.nodes[e.target].neighbors.add(e.source);
    });
  });

  /**
   * @function compute_local_clustering_coefficients
   * @description Computes the local clustering coefficient for each node in the network.
   * @returns {void}
   */
  self.compute_local_clustering_coefficients = _.once(() => {
    self.compute_adjacency_list();

    self.nodes.forEach((n) => {
      _.defer((a_node) => {
        const neighborhood_size = a_node.neighbors.size();
        if (neighborhood_size < 2) {
          a_node.lcc = misc.undefined;
        } else if (neighborhood_size > 500) {
          a_node.lcc = misc.too_large;
        } else {
          // count triangles
          const neighborhood = a_node.neighbors.values();
          let counter = 0;
          for (let n1 = 0; n1 < neighborhood_size; n1 += 1) {
            for (let n2 = n1 + 1; n2 < neighborhood_size; n2 += 1) {
              if (
                self.nodes[neighborhood[n1]].neighbors.has(neighborhood[n2])
              ) {
                counter++;
              }
            }
          }

          a_node.lcc =
            (2 * counter) / neighborhood_size / (neighborhood_size - 1);
        }
      }, n);
    });
  });

  /**
   * @function get_node_by_id
   * @description Retrieves a node object by its ID.
   * @param {string} id - The ID of the node to retrieve.
   * @returns {Object} The node object with the specified ID, or undefined if not found.
   */
  self.get_node_by_id = function (id) {
    return self.nodes.filter((n) => n.id === id)[0];
  };

  /**
   * @function compute_local_clustering_coefficients_worker
   * @description Computes local clustering coefficients using a web worker.
   * @returns {void}
   */
  self.compute_local_clustering_coefficients_worker = _.once(() => {
    var worker = new Worker("workers/lcc.js");

    worker.onmessage = function (event) {
      var nodes = event.data.Nodes;

      nodes.forEach((n) => {
        const node_to_update = self.get_node_by_id(n.id);
        node_to_update.lcc = n.lcc ? n.lcc : misc.undefined;
      });
    };

    var worker_obj = {};
    worker_obj["Nodes"] = self.nodes;
    worker_obj["Edges"] = self.edges;
    worker.postMessage(worker_obj);
  });

  /**
   * @function estimate_cubic_compute_cost
   * @description Estimates the cubic computational cost for a given cluster.
   * @param {Object} c - The cluster object.
   * @returns {number} The estimated cubic computational cost.
   */
  var estimate_cubic_compute_cost = _.memoize(
    (c) => {
      self.compute_adjacency_list();
      return _.reduce(
        _.first(_.pluck(c.children, "degree").sort(d3.descending), 3),
        (memo, value) => memo * value,
        1
      );
    },
    (c) => c.cluster_id
  );

  /**
   * @function compute_global_clustering_coefficients
   * @description Computes the global clustering coefficient for each cluster in the network.
   * @returns {void}
   */
  self.compute_global_clustering_coefficients = _.once(() => {
    self.compute_adjacency_list();

    self.clusters.forEach((c) => {
      _.defer((a_cluster) => {
        const cluster_size = a_cluster.children.length;
        if (cluster_size < 3) {
          a_cluster.cc = misc.undefined;
        } else if (estimate_cubic_compute_cost(a_cluster, true) >= 5000000) {
          a_cluster.cc = misc.too_large;
        } else {
          // pull out all the nodes that have this cluster id
          const member_nodes = [];

          var triads = 0;
          var triangles = 0;

          self.nodes.forEach((n, i) => {
            if (n.cluster === a_cluster.cluster_id) {
              member_nodes.push(i);
            }
          });
          member_nodes.forEach((node) => {
            const my_neighbors = self.nodes[node].neighbors
              .values()
              .map((d) => Number(d))
              .sort(d3.ascending);
            for (let n1 = 0; n1 < my_neighbors.length; n1 += 1) {
              for (let n2 = n1 + 1; n2 < my_neighbors.length; n2 += 1) {
                triads += 1;
                if (
                  self.nodes[my_neighbors[n1]].neighbors.has(my_neighbors[n2])
                ) {
                  triangles += 1;
                }
              }
            }
          });

          a_cluster.cc = triangles / triads;
        }
      }, c);
    });
  });

  /**
   * @function mark_nodes_as_processing
   * @description Marks nodes with a specified property to indicate they are being processed.
   * @param {string} property - The property name to set on the nodes.
   * @returns {void}
   */
  self.mark_nodes_as_processing = function (property) {
    self.nodes.forEach((n) => {
      n[property] = misc.processing;
    });
  };

  /**
   * @function compute_graph_stats
   * @description Computes and displays various graph statistics.
   * @returns {void}
   */
  self.compute_graph_stats = function () {
    d3.select(this).classed("disabled", true).select("i").classed({
      "fa-calculator": false,
      "fa-cog": true,
      "fa-spin": true,
    });
    self.mark_nodes_as_processing("lcc");
    self.compute_local_clustering_coefficients_worker();
    self.compute_global_clustering_coefficients();
    d3.select(this).remove();
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
      if (d.cluster) {
        if (typeof self.cluster_sizes[d.cluster - 1] === "undefined") {
          self.cluster_sizes[d.cluster - 1] = 1;
        } else {
          self.cluster_sizes[d.cluster - 1]++;
        }
        cluster_set.add(d.cluster);
      }
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
        const cluster_id = nodes[0].cluster;
        if (cluster_id) {
          if (self.cluster_sizes_in_entities[cluster_id]) {
            self.cluster_sizes_in_entities[cluster_id]++;
          } else {
            self.cluster_sizes_in_entities[cluster_id] = 1;
          }
        }
        entity_count++;
      });
      if (self.json["Network Summary"]) {
        self.json["Network Summary"]["Nodes"] = entity_count;
        self.json["Network Summary"]["Clusters"] = _.filter(
          self.cluster_sizes_in_entities,
          (d, c) => c !== "null" && c !== "undefined" && d > 1
        ).length;
        self.json["Cluster sizes"] = [];
        _.each(self.cluster_sizes_in_entities, (d, c) => {
          if (c !== "null" && c !== "undefined" && d > 1) {
            self.json["Cluster sizes"].push(d);
          }
        });
      }
    } else {
      if (self.json["Network Summary"]) {
        const valid_clusters = _.filter(self.cluster_sizes, (size) => size > 1);
        self.json["Network Summary"]["Clusters"] = valid_clusters.length;
        self.json["Cluster sizes"] = valid_clusters;
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
      var result = [_.map(column_names, (c) => c.raw_attribute_key)];

      _.each(nodes, (n) => {
        result.push(
          _.map(column_names, (c) => {
            if (c.raw_attribute_key === tables._networkNodeIDField) {
              let uid = self.primary_key(n);
              /** only display [+] for MSPP nodes where EVERYTHING is tagged as new **/

              if (self.has_multiple_sequences) {
                if (
                  _.every(this.primary_key_list[uid], (n) =>
                    HTX.HIVTxNetwork.is_new_node(n)
                  )
                ) {
                  return uid + tables._networkNewNodeMarker;
                }
              } else {
                if (HTX.HIVTxNetwork.is_new_node(n)) {
                  return uid + tables._networkNewNodeMarker;
                }
              }
              return uid;
            }
            if (_.has(n, c.raw_attribute_key)) {
              return self._format_attribute_value(n[c.raw_attribute_key]);
            }
            return self._format_attribute_value(
              self.attribute_node_value_by_id(n, c.raw_attribute_key)
            );
          })
        );
      });
      return result;
    };

    /**
     * @function _extract_exportable_attributes
     * @description Extracts attributes that are suitable for export.
     * @param {boolean} extended - If true, includes extended attributes like Node ID and Cluster.
     * @returns {Array<Object>} An array of attribute objects.
     */
    self._extract_exportable_attributes = function (extended) {
      var allowed_types = {
        String: 1,
        Date: 1,
        Number: 1,
      };

      var return_array = [];

      if (extended) {
        return_array = [
          {
            raw_attribute_key: tables._networkNodeIDField,
            type: "String",
            label: "Node ID",
            format: function () {
              return "Node ID";
            },
          },
          {
            raw_attribute_key: "cluster",
            type: "String",
            label: "Which cluster the individual belongs to",
            format: function () {
              return __("clusters_tab")["cluster_id"];
            },
          },
        ];
      }

      const has_seq_attributes = _.some(self.json.Nodes, (n) =>
        n[kGlobals.network.NodeAttributeID] &&
        (n[kGlobals.network.NodeAttributeID].has_sequence !== undefined ||
          n[kGlobals.network.NodeAttributeID].poor_quality !== undefined)
      );

      if (has_seq_attributes) {
        return_array.push({
          raw_attribute_key: "sequence_status",
          type: "String",
          label: "Sequence Status",
          enum: ["Sequenced", "Poor Quality", "Unsequenced"],
          format: function () {
            return "Sequence Status";
          },
        });
      }

      return_array.push(
        _.filter(
          self.json[kGlobals.network.GraphAttrbuteID],
          (d) => d.type in allowed_types
        )
      );

      var flattened = _.flatten(return_array, true);
      var seen = {};
      return _.filter(flattened, (d) => {
        if (d.raw_attribute_key in seen) {
          return false;
        }
        seen[d.raw_attribute_key] = true;
        return true;
      });
    };

    /**
     * Returns true if the viewing jurisdiction owns `node` — either as primary
     * owner (`patient_attributes.jurisdiction`) or joint owner
     * (`patient_attributes.joint_owners`). Foreign nodes whose fields are
     * redacted to the string "REDACTED" correctly fall through to false.
     */
    self.isMine = function (node) {
      const group_id = self.CDC_data && self.CDC_data.group_id;
      if (!group_id) return false;
      const pa = node && node[kGlobals.network.NodeAttributeID];
      if (!pa) return false;
      if (pa.jurisdiction === group_id) return true;
      if (
        Array.isArray(pa.joint_owners) &&
        pa.joint_owners.includes(group_id)
      ) {
        return true;
      }
      return false;
    };

    /**
     * Format an attribute value for display/export. Array values (e.g.
     * `joint_owners`) are joined with "; " so they don't collide with the CSV
     * delimiter and render readably in the node list.
     */
    self._format_attribute_value = function (v) {
      return Array.isArray(v) ? v.join("; ") : v;
    };

    self._extract_mjc_attributes = function (priority_group_name) {
      if (!self.isMJCNetwork) {
        return [];
      }

      // pull from the mjc_date_identified attribute of the nodes directly
      if (priority_group_name) {
        const priority_group =
          self.priority_groups_find_by_name(priority_group_name);
        for (const node of priority_group.node_objects) {
          if (
            node.patient_attributes &&
            "mjc_date_identified" in node.patient_attributes
          ) {
            if (
              typeof node.patient_attributes.mjc_date_identified !== "object"
            ) {
              node.patient_attributes.selected_mjc_date_identified =
                node.patient_attributes.mjc_date_identified;
            } else if (
              !Object.hasOwn(
                node.patient_attributes.mjc_date_identified,
                priority_group_name
              )
            ) {
              node.patient_attributes.selected_mjc_date_identified =
                kGlobals.missing.label;
            } else {
              node.patient_attributes.selected_mjc_date_identified =
                timeDateUtil.DateViewFormatExport(
                  this.parse_dates(
                    new Date(
                      node.patient_attributes.mjc_date_identified[
                        priority_group_name
                      ]
                    )
                  )
                );
            }
          }

          if (
            node.patient_attributes &&
            "mjc_date_identified_12mo" in node.patient_attributes
          ) {
            if (
              typeof node.patient_attributes.mjc_date_identified_12mo !==
              "object"
            ) {
              node.patient_attributes.selected_mjc_date_identified_12mo =
                node.patient_attributes.mjc_date_identified_12mo;
            } else if (
              !Object.hasOwn(
                node.patient_attributes.mjc_date_identified_12mo,
                priority_group_name
              )
            ) {
              node.patient_attributes.selected_mjc_date_identified_12mo =
                kGlobals.missing.label;
            } else {
              node.patient_attributes.selected_mjc_date_identified_12mo =
                node.patient_attributes.mjc_date_identified_12mo[
                  priority_group_name
                ];
            }
          }
        }
      }

      const MJC_ATTRIBUTES = [
        "jurisdiction",
        "joint_owners",
        "cur_state_cd",
        "rsd_state_cd",
        "selected_mjc_date_identified",
        "selected_mjc_date_identified_12mo",
        "hiv_aids_dx_dt_month_year",
        "hiv_aids_dx_dt_12mo",
        "hiv_aids_dx_dt_36mo",
      ];

      return MJC_ATTRIBUTES.filter(
        (attr_key) => attr_key in self.json[kGlobals.network.GraphAttrbuteID]
      ).map(
        (attr_key) => self.json[kGlobals.network.GraphAttrbuteID][attr_key]
      );
    };

    /**
     * @function _extract_nodes_by_id
     * @description Extracts nodes belonging to a specific cluster or subcluster ID.
     * @param {string} id - The ID of the cluster or subcluster.
     * @returns {Array<Object>} An array of node objects.
     */
    self._extract_nodes_by_id = function (id) {
      let restricted_node_subset = _.filter(
        self.nodes,
        (n) =>
          n.cluster.toString() === id.toString() ||
          n.subcluster_label === id.toString()
      );
      if (self.has_multiple_sequences) {
        restricted_node_subset = self.aggregate_indvidual_level_records(
          restricted_node_subset
        );
      }
      return restricted_node_subset;
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
      the_list.selectAll("*").remove();
      var column_ids = self.isMJCNetwork
        ? self._extract_mjc_attributes(priority_group)
        : self._extract_exportable_attributes();
      var cluster_nodes;

      if (priority_group) {
        cluster_nodes = self.priority_groups_find_by_name(priority_group);
        if (cluster_nodes) {
          if (self.has_multiple_sequences) {
            cluster_nodes = self.aggregate_indvidual_level_records(
              cluster_nodes.node_objects || []
            );
          } else {
            cluster_nodes = cluster_nodes.node_objects || [];
          }
        } else {
          return;
        }
      } else {
        cluster_nodes = self._extract_nodes_by_id(cluster_id);
      }

      // Filter out REDACTED nodes if the toggle is active
      if (self.isMJCNetwork && !self.fullMJCNetwork) {
        var $redacted_toggle = $(
          self.get_ui_element_selector_by_role(
            "cluster_list_redacted_toggle",
            true
          )
        );
        if ($redacted_toggle.data("redacted-hidden")) {
          cluster_nodes = cluster_nodes.filter(
            (n) => !self.isRedacted(self.entity_id(n))
          );
        }
      }

      d3.select(
        self.get_ui_element_selector_by_role("cluster_list_data_export", true)
      ).on("click", (d) => {
        if (self._is_CDC_executive_mode) {
          alert(kGlobals.network.WarnExecutiveMode);
        } else {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(cluster_nodes, column_ids),
            self.isMJCNetwork ? "MJ_export" : undefined
          );
        }
      });

      cluster_nodes = _.sortBy(cluster_nodes, (n) => this.entity_id(n));

      if (group_by_attribute) {
        _.each(column_ids, (column) => {
          var binned = _.groupBy(cluster_nodes, (n) =>
            self._format_attribute_value(
              self.attribute_node_value_by_id(n, column.raw_attribute_key)
            )
          );
          var sorted_keys = _.keys(binned).sort();
          var attribute_record = the_list.append("li");
          attribute_record
            .append("code")
            .text(column.label || column.raw_attribute_key);
          var attribute_list = attribute_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(sorted_keys, (key) => {
            attribute_list.append("dt").text(key);
            attribute_list
              .append("dd")
              .text(
                _.map(binned[key], (n) =>
                  this.cleanRedacted(this.entity_id(n))
                ).join(", ")
              );
          });
        });
      } else {
        _.each(cluster_nodes, (node) => {
          var patient_record = the_list.append("li");
          patient_record
            .append("code")
            .text(this.cleanRedacted(this.entity_id(node)));
          var patient_list = patient_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(column_ids, (column) => {
            patient_list
              .append("dt")
              .text(column.label || column.raw_attribute_key)
              .attr("title", column.label || column.raw_attribute_key)
              .style("width", "50%")
              .style("text-align", "left")
              .style("margin-left", "1em");
            patient_list
              .append("dd")
              .text(
                self._format_attribute_value(
                  self.attribute_node_value_by_id(
                    node,
                    column.raw_attribute_key
                  )
                )
              );
          });
        });
      }
    };

    /**
     * @function _setup_cluster_list_view
     * @description Sets up the cluster list view, including event listeners for toggling and modal display.
     * @returns {void}
     */
    self._setup_cluster_list_view = function () {
      d3.select(
        self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
      ).on("click", function () {
        d3.event.preventDefault();
        var group_by_id;

        var button_clicked = $(this);
        if (button_clicked.data(__("clusters_tab")["view"]) === "id") {
          button_clicked.data(__("clusters_tab")["view"], "attribute");
          button_clicked.text(__("clusters_tab")["group_by_id"]);
          group_by_id = false;
        } else {
          button_clicked.data(__("clusters_tab")["view"], "id");
          button_clicked.text(__("clusters_tab")["group_by_attribute"]);
          group_by_id = true;
        }

        var cluster_id = button_clicked.data("cluster");

        self._cluster_list_view_render(
          cluster_id ? cluster_id.toString() : "",
          !group_by_id,
          d3.select(
            self.get_ui_element_selector_by_role("cluster_list_payload", true)
          ),
          button_clicked.data("priority_list")
        );
      });

      // Redacted nodes toggle — only for non-admin MJC networks
      d3.select(
        self.get_ui_element_selector_by_role(
          "cluster_list_redacted_toggle",
          true
        )
      ).on("click", function () {
        d3.event.preventDefault();
        var $btn = $(this);
        var hidden = $btn.data("redacted-hidden");
        $btn.data("redacted-hidden", !hidden);
        $btn.text(hidden ? "Hide Redacted" : "Show Redacted");

        var view_toggle = $(
          self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
        );

        self._cluster_list_view_render(
          view_toggle.data("cluster")
            ? view_toggle.data("cluster").toString()
            : "",
          view_toggle.data(__("clusters_tab")["view"]) !== "id",
          d3.select(
            self.get_ui_element_selector_by_role("cluster_list_payload", true)
          ),
          view_toggle.data("priority_list")
        );
      });

      $(self.get_ui_element_selector_by_role("cluster_list", true)).on(
        "show.bs.modal",
        (event) => {
          var $modal = $(event.target);
          var link_clicked = event.relatedTarget
            ? $(event.relatedTarget)
            : null;

          // Try to get priority_set from relatedTarget first, then from modal data (for programmatic triggers)
          var cluster_id = link_clicked ? link_clicked.data("cluster") : null;
          var priority_list = link_clicked
            ? link_clicked.data("priority_set")
            : null;

          // Fall back to modal data for programmatic triggers
          if (!priority_list) {
            priority_list = $modal.data("priority_set_trigger");
          }

          console.log(
            "Modal show - priority_list:",
            priority_list,
            "cluster_id:",
            cluster_id
          );

          var modal = d3.select(
            self.get_ui_element_selector_by_role("cluster_list", true)
          );
          modal
            .selectAll(".modal-title")
            .text(
              __("clusters_tab")["listing_nodes"] +
                (priority_list
                  ? ` in ${
                      self.isMJCNetwork ? "MJ " : ""
                    }cluster of interest ` + priority_list
                  : " " + __("general")["cluster"] + " " + cluster_id)
            );

          var view_toggle = $(
            self.get_ui_element_selector_by_role(
              "cluster_list_view_toggle",
              true
            )
          );

          if (priority_list) {
            view_toggle.data("priority_list", priority_list);
            view_toggle.data("cluster", "");
          } else {
            view_toggle.data("cluster", cluster_id);
            view_toggle.data("priority_list", null);
          }

          // Show/hide and reset the redacted toggle for MJC non-admin networks
          var $redacted_toggle = $(
            self.get_ui_element_selector_by_role(
              "cluster_list_redacted_toggle",
              true
            )
          );
          if (self.isMJCNetwork && !self.fullMJCNetwork) {
            $redacted_toggle.show();
            $redacted_toggle.data("redacted-hidden", true);
            $redacted_toggle.text("Show Redacted");
          } else {
            $redacted_toggle.hide();
          }

          self._cluster_list_view_render(
            cluster_id,
            //cluster_id,
            $(
              self.get_ui_element_selector_by_role(
                "cluster_list_view_toggle",
                true
              )
            ).data(__("clusters_tab")["view"]) !== "id",
            modal.select(
              self.get_ui_element_selector_by_role("cluster_list_payload", true)
            ),
            priority_list
          );
        }
      );

      $(self.get_ui_element_selector_by_role("overlap_list", true)).on(
        "show.bs.modal",
        (event) => {
          var link_clicked = $(event.relatedTarget);
          var priority_list = link_clicked.data("priority_set");
          var use_mjc_overlap_list = link_clicked.data("use_mjc_overlap_list");

          var modal = d3.select(
            self.get_ui_element_selector_by_role("overlap_list", true)
          );
          modal
            .selectAll(".modal-title")
            .text(
              "View how nodes in " +
                (self.isMJCNetwork ? "MJ " : "") +
                "clusterOI " +
                priority_list +
                (self.isMJCNetwork
                  ? " overlap with your jurisdiction's clusterOI"
                  : use_mjc_overlap_list
                  ? " overlap with MJ clusterOI"
                  : " overlap with other clusterOI")
            );

          const ps = self.priority_groups_find_by_name(priority_list);
          if (!ps) return;
          if (!use_mjc_overlap_list && !self.priority_node_overlap) return;
          if (use_mjc_overlap_list && !self.priority_node_overlap_mjc) return;

          var headers = [
            [
              {
                value: "Node",
                help: "EHARS_ID of the node that overlaps with other clusterOI",
                sort: "value",
                presort: "asc",
              },
              {
                value: self.isMJCNetwork
                  ? "My Jurisdiction's Cluster(s) of Interest"
                  : "Other Cluster(s) of Interest",
                help: self.isMJCNetwork
                  ? "Names of my jurisdiction's clusterOI where this node is included"
                  : "Names of other clusterOI where this node is included",
                sort: "value",
              },
            ],
          ];

          var rows = [];
          var rows_for_export = [
            [
              "Overlapping Cluster of Interest",
              "Node",
              self.isMJCNetwork ? "My clusterOI" : "Other clusterOI",
            ],
          ];

          _.each(
            self.aggregate_indvidual_level_records(
              use_mjc_overlap_list ? ps.nodes : ps.node_objects
            ),
            (n) => {
              const eid = self.entity_id(n);
              if (self.isRedacted(eid)) {
                return;
              }
              const overlap =
                use_mjc_overlap_list && !self.isMJCNetwork
                  ? self.priority_node_overlap_mjc[eid]
                  : self.priority_node_overlap[eid];
              let other_sets = "None";
              // Cross-set overlap maps only contain "other side" names, so size >= 1 means overlap
              const is_cross_set = self.isMJCNetwork || use_mjc_overlap_list;
              if (overlap && overlap.size > (is_cross_set ? 0 : 1)) {
                other_sets = _.sortBy(
                  _.filter([...overlap], (d) => d !== priority_list)
                ).join("; ");
              }
              rows.push([
                { value: self.cleanRedacted(eid) },
                { value: other_sets },
              ]);
              rows_for_export.push([
                ps.name,
                self.cleanRedacted(eid),
                other_sets,
              ]);
            }
          );

          d3.select(
            self.get_ui_element_selector_by_role(
              "overlap_list_data_export",
              true
            )
          ).on("click", (d) => {
            helpers.export_csv_button(rows_for_export, "overlap");
          });

          tables.add_a_sortable_table(
            modal.select(
              self.get_ui_element_selector_by_role(
                "overlap_list_data_table",
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
      var cluster_ui_container = d3.select(
        self.get_ui_element_selector_by_role("cluster_operations_container")
      );

      cluster_ui_container.selectAll("li").remove();

      var fix_handler = function (do_fix) {
        _.each([self.clusters, self.nodes], (list) => {
          _.each(list, (obj) => {
            obj.fixed = do_fix;
          });
        });
      };

      var node_label_handler = function (do_show) {
        var shown_nodes = self.network_svg.selectAll(".node");
        if (!shown_nodes.empty()) {
          shown_nodes.each((node) => {
            node.show_label = do_show;
          });
          self.update(true);
        }
      };

      var layout_reset_handler = function (packed) {
        var fixed = [];
        _.each(self.clusters, (obj) => {
          if (obj.fixed) {
            fixed.push(obj);
          }
          obj.fixed = false;
        });
        default_layout(packed);
        network_layout.tick();
        self.update();
        _.each(fixed, (obj) => {
          obj.fixed = true;
        });
      };

      var cluster_commands = [
        [
          __("clusters_main")["export_colors"],
          () => {
            const colorScheme = helpers.exportColorScheme(
              self.uniqValues,
              self.colorizer
            );

            //TODO: If using database backend, use api instead
            helpers.copyToClipboard(JSON.stringify(colorScheme));
          },
          true,
          "hivtrace-export-color-scheme",
        ],
        [
          __("clusters_main")["expand_all"],
          function () {
            return self.expand_some_clusters();
          },
          true,
          "hivtrace-expand-all",
        ],
        [
          __("clusters_main")["collapse_all"],
          function () {
            return self.collapse_some_clusters();
          },
          true,
          "hivtrace-collapse-all",
        ],
        [
          __("clusters_main")["expand_filtered"],
          function () {
            return self.expand_some_clusters(
              self.select_some_clusters((n) => n.match_filter)
            );
          },
          true,
          "hivtrace-expand-filtered",
        ],
        [
          __("clusters_main")["collapse_filtered"],
          function () {
            return self.collapse_some_clusters(
              self.select_some_clusters((n) => n.match_filter)
            );
          },
          true,
          "hivtrace-collapse-filtered",
        ],
        [
          __("clusters_main")["fix_all_objects_in_place"],
          _.partial(fix_handler, true),
          true,
          "hivtrace-fix-in-place",
        ],
        [
          __("clusters_main")["allow_all_objects_to_float"],
          _.partial(fix_handler, false),
          true,
          "hivtrace-allow-to-float",
        ],
        [
          __("clusters_main")["reset_layout"] + " [packed]",
          _.partial(layout_reset_handler, true),
          true,
          "hivtrace-reset-layout",
        ],
        [
          __("clusters_main")["reset_layout"] + " [tiled]",
          _.partial(layout_reset_handler, false),
          true,
          "hivtrace-reset-layout",
        ],
        [
          __("network_tab")["show_labels_for_all"],
          _.partial(node_label_handler, true),
          true,
          "hivtrace-node-labels-on",
        ],
        [
          __("network_tab")["hide_labels_for_all"],
          _.partial(node_label_handler, false),
          true,
          "hivtrace-node-labels-off",
        ],
        [
          "Hide problematic clusters",
          function (item) {
            d3.select(item).text(
              self.hide_hxb2
                ? "Hide problematic clusters"
                : "Show problematic clusters"
            );
            self.toggle_hxb2();
          },
          self.has_hxb2_links,
          "hivtrace-hide-problematic-clusters",
        ],
        [
          __("network_tab")["highlight_unsupported_edges"],
          function (item) {
            if (self.highlight_unsuppored_edges) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_highlight_unsupported_edges();
          },
          true,
          "hivtrace-highlight-unsuppored_edges",
          self.highlight_unsuppored_edges,
        ],
      ];

      if (self.cluster_attributes) {
        cluster_commands.push([
          "Show only changes since last network update",
          function (item) {
            if (self.showing_diff) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_diff();
          },
          true,
          "hivtrace-show-network-diff",
          self.showing_diff,
        ]);
      }

      if (timeDateUtil.getClusterTimeScale()) {
        cluster_commands.push([
          __("network_tab")["only_recent_clusters"],
          function (item) {
            if (self.using_time_filter) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_time_filter();
          },
          true,
          "hivtrace-show-using-time-filter",
          self.using_time_filter,
        ]);
      }

      if (!self._is_CDC_) {
        cluster_commands.push([
          "Show removed edges",
          function (item) {
            self.filter_edges = !self.filter_edges;
            d3.select(item).text(
              self.filter_edges ? "Show removed edges" : "Hide removed edges"
            );
            self.update(false);
          },
          function () {
            return _.some(self.edges, (d) => d.removed);
          },
          "hivtrace-show-removed-edges",
        ]);
      } else {
        cluster_commands.push([
          "Add filtered objects to cluster of interest",
          function (item) {
            if (clustersOfInterest.get_editor()) {
              clustersOfInterest
                .get_editor()
                .append_node_objects(
                  _.filter(self.json["Nodes"], (n) => n.match_filter)
                );
            }
          },
          clustersOfInterest.get_editor,
          "hivtrace-add-filtered-to-panel",
        ]);
      }

      cluster_commands.forEach(function (item, index) {
        let shown = item[2];
        if (_.isFunction(shown)) {
          shown = shown(item);
        }
        if (shown) {
          var handler_callback = item[1];
          var line_item = this.append("li")
            .append("a")
            .text(item[0])
            .attr("href", "#")
            //.attr("id", item[3])
            .on("click", function (e) {
              handler_callback(this);
              //d3.event.stopPropagation();
              //d3.event.preventDefault();
            });

          if (item.length > 4) {
            // checkbox
            line_item.text("");
            if (item[4]) {
              line_item
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            line_item.insert("span").text(item[0]);
          }
        }
      }, cluster_ui_container);

      var button_group = d3.select(
        self.get_ui_element_selector_by_role("button_group")
      );

      if (!button_group.empty()) {
        button_group.selectAll("button").remove();
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["expand_spacing"])
          .on("click", (d) => {
            change_spacing(5 / 4);
          })
          .append("i")
          .classed("fa fa-plus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["compress_spacing"])
          .on("click", (d) => {
            change_spacing(4 / 5);
          })
          .append("i")
          .classed("fa fa-minus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["enlarge_window"])
          .on("click", (d) => {
            change_window_size(100, true);
          })
          .append("i")
          .classed("fa fa-expand", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["shrink_window"])
          .on("click", (d) => {
            change_window_size(-100, true);
          })
          .append("i")
          .classed("fa fa-compress", true);

        if (!self._is_CDC_) {
          button_group
            .append("button")
            .classed("btn btn-default btn-sm", true)
            .attr("title", "Compute graph statistics")
            .attr("id", "hivtrace-compute-graph-statistics")
            .on("click", function (d) {
              _.bind(self.compute_graph_stats, this)();
            })
            .append("i")
            .classed("fa fa-calculator", true);
        } else {
          button_group
            .append("button")
            .classed("btn btn-default btn-sm", true)
            .attr("title", __("network_tab")["toggle_epicurve"])
            .attr("id", "hivtrace-toggle-epi-curve")
            .on("click", (d) => {
              self.check_for_time_series();
            })
            .append("i")
            .classed("fa fa-line-chart", true);
        }

        var export_image = d3.select(
          self.get_ui_element_selector_by_role("export_image")
        );

        if (!export_image.empty()) {
          export_image.selectAll("div").remove();

          const buttonGroupDropdown = export_image
            .insert("div", ":first-child")
            .classed("input-group-btn dropdown-img", true);

          const dropdownList = buttonGroupDropdown
            .append("ul")
            .classed("dropdown-menu", true)
            .attr("aria-labelledby", "dropdownImg");

          dropdownList
            .append("li")
            .classed("dropdown-item export-img-item", true)
            .append("a")
            .attr("href", "#")
            .text("SVG")
            .on("click", (d) => {
              helpers.save_image("svg", "#" + self.dom_prefix + "-network-svg");
            });

          dropdownList
            .append("li")
            .classed("dropdown-item export-img-item", true)
            .append("a")
            .attr("href", "#")
            .text("PNG")
            .on("click", (d) => {
              helpers.save_image("png", "#" + self.dom_prefix + "-network-svg");
            });

          const imgBtn = buttonGroupDropdown
            .append("button")
            .attr("id", "dropdownImg")
            .attr("data-toggle", "dropdown")
            .classed("btn btn-default btn-sm dropdown-toggle", true)
            .attr("title", __("network_tab")["save_image"])
            .attr("id", "hivtrace-export-image");

          imgBtn.append("i").classed("fa fa-image", true);

          imgBtn.append("span").classed("caret", true);
        }
      }

      $(self.get_ui_element_selector_by_role("filter"))
        .off("input propertychange")
        .on(
          "input propertychange",
          _.throttle(function (e) {
            var filter_value = $(this).val();
            self.filter(tables.filter_parse(filter_value));
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("hide_filter"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.hide_unselected = !self.hide_unselected;
            self.filter_visibility();
            self.update(true);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("show_small_clusters"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            if ("size" in self.cluster_filtering_functions) {
              delete self.cluster_filtering_functions["size"];
            } else {
              self.cluster_filtering_functions["size"] = self.filter_by_size;
            }

            self.update(false);
          }, 250)
        );

      self._node_filter_options = [
        "No filter",
        "Diagnosed within last 36 months",
        "Diagnosed within last 12 months",
        "Part of a site system clusterOI",
        "Part of a site clusterOI (system or manual)",
        "Part of a site clusterOI meeting national priority",
        "Not in a site clusterOI (system or manual)",
        "Not meeting national priority",
      ];

      self._node_filter_active = new Set();

      const _collect_pg_node_ids = function (pg_groups, pg_filter) {
        const node_set = new Set();
        _.each(pg_filter ? _.filter(pg_groups, pg_filter) : pg_groups, (pg) => {
          _.each(pg.nodes, (n) => node_set.add(n.name));
        });
        return node_set;
      };

      const _pg_filters = {
        system: (pg) => pg.createdBy === kGlobals.CDCCOICreatedBySystem,
        national_priority: (pg) => pg.meets_priority_def,
      };

      self._compute_node_filter_set = function (filter_index) {
        const ref_date = self.get_reference_date();
        // Site clusterOIs live on the primary instance (sub-network instances
        // have empty arrays). MJ view uses overlap groups, regular view uses
        // defined_priority_groups.
        const primary_instance = HTX.HIVTxNetwork._primaryInstance;
        const pg_groups = self.isMJCNetwork
          ? primary_instance && primary_instance.overlap_defined_priority_groups
          : (primary_instance && primary_instance.defined_priority_groups) ||
            self.defined_priority_groups;

        // Diagnosed within last 36 months
        if (filter_index === 1) {
          const cutoff = timeDateUtil.n_months_ago(ref_date, 36);
          return new Set(
            _.map(
              _.filter(self.nodes, (n) =>
                self.filter_by_date(
                  cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  n,
                  false
                )
              ),
              (n) => n.id
            )
          );
        }

        // Diagnosed within last 12 months
        if (filter_index === 2) {
          const cutoff = timeDateUtil.n_months_ago(ref_date, 12);
          return new Set(
            _.map(
              _.filter(self.nodes, (n) =>
                self.filter_by_date(
                  cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  n,
                  false
                )
              ),
              (n) => n.id
            )
          );
        }

        if (filter_index >= 3 && filter_index <= 7) {
          // Defensive: click handler already gates on availability.
          if (!pg_groups || !pg_groups.length) return null;

          // MJ overlap groups don't carry meets_priority_def; fall back to the
          // latest history entry. Regular views already have the flag correct.
          if (self.isMJCNetwork) {
            _.each(pg_groups, (pg) => {
              if (
                pg.meets_priority_def === undefined &&
                pg.history &&
                pg.history.length
              ) {
                const latest = pg.history[pg.history.length - 1];
                pg.meets_priority_def = !!latest.national_priority;
              }
            });
          }

          // Part of a site system clusterOI
          if (filter_index === 3)
            return _collect_pg_node_ids(pg_groups, _pg_filters.system);
          // Part of a site clusterOI (system or manual)
          if (filter_index === 4) return _collect_pg_node_ids(pg_groups, null);
          // Part of a site clusterOI meeting national priority
          if (filter_index === 5)
            return _collect_pg_node_ids(
              pg_groups,
              _pg_filters.national_priority
            );

          // Not in a site clusterOI (system or manual)
          if (filter_index === 6) {
            const in_coi = _collect_pg_node_ids(pg_groups, null);
            return new Set(
              _.map(
                _.filter(self.nodes, (n) => !in_coi.has(n.id)),
                (n) => n.id
              )
            );
          }
          // Not meeting national priority
          if (filter_index === 7) {
            const in_priority = _collect_pg_node_ids(
              pg_groups,
              _pg_filters.national_priority
            );
            return new Set(
              _.map(
                _.filter(self.nodes, (n) => !in_priority.has(n.id)),
                (n) => n.id
              )
            );
          }
        }

        return null; // No filter (index 0) or unrecognized
      };

      self.apply_node_filter = function () {
        var node_set = null;

        if (self._node_filter_active.size > 0) {
          // Intersect all active filter sets
          self._node_filter_active.forEach((filter_index) => {
            const filter_set = self._compute_node_filter_set(filter_index);
            if (filter_set === null) return;
            if (node_set === null) {
              node_set = filter_set;
            } else {
              node_set = new Set(
                [...node_set].filter((id) => filter_set.has(id))
              );
            }
          });
        }

        // Per-instance state (don't mutate shared node objects, otherwise
        // other views rendering the same nodes get affected).
        self._node_filter_visible_ids = node_set;
        if (node_set !== null) {
          self._node_filter_hidden_clusters = new Set();
          self.clusters.forEach((c) => {
            const cluster_nodes = self.nodes_by_cluster[c.cluster_id] || [];
            if (
              cluster_nodes.length > 0 &&
              cluster_nodes.every((n) => !node_set.has(n.id))
            ) {
              self._node_filter_hidden_clusters.add(c.cluster_id);
            }
          });
        } else {
          self._node_filter_hidden_clusters = null;
        }

        self.update(true);
      };

      self._setup_node_filter_ui = function () {
        const filter_container = d3.select(
          self.get_ui_element_selector_by_role("node_filter_menu")
        );
        if (filter_container.empty()) return;
        filter_container.selectAll("li").remove();

        self._node_filter_options.forEach((label, index) => {
          var is_no_filter = index === 0;
          filter_container
            .append("li")
            .append("a")
            .attr("href", "#")
            .style("font-weight", is_no_filter ? "bold" : null)
            .text(label)
            .on("click", function () {
              d3.event.preventDefault();

              if (is_no_filter) {
                // "No filter" clears all active filters
                self._node_filter_active.clear();
                filter_container.selectAll("a").style("font-weight", null);
                d3.select(this).style("font-weight", "bold");
              } else {
                // Filters 3-7 need site clusterOI data; bail before toggling
                // so the filter doesn't get stuck "on" with nothing to apply.
                if (index >= 3 && index <= 7) {
                  const primary_instance = HTX.HIVTxNetwork._primaryInstance;
                  const pg_groups = self.isMJCNetwork
                    ? primary_instance &&
                      primary_instance.overlap_defined_priority_groups
                    : (primary_instance &&
                        primary_instance.defined_priority_groups) ||
                      self.defined_priority_groups;
                  if (!pg_groups || !pg_groups.length) {
                    alert(
                      "Site clusterOI data is not yet available for filtering."
                    );
                    return;
                  }
                }
                // Toggle this filter on/off
                if (self._node_filter_active.has(index)) {
                  self._node_filter_active.delete(index);
                  d3.select(this).style("font-weight", null);
                } else {
                  self._node_filter_active.add(index);
                  d3.select(this).style("font-weight", "bold");
                }

                // Un-bold "No filter" when any filter is active; re-bold it when none are
                var no_filter_item = filter_container.select("a");
                no_filter_item.style(
                  "font-weight",
                  self._node_filter_active.size === 0 ? "bold" : null
                );
              }

              // Update the dropdown label
              var count = self._node_filter_active.size;
              var label_text;
              if (count === 0) {
                label_text = "No filter";
              } else if (count === 1) {
                label_text =
                  self._node_filter_options[
                    self._node_filter_active.values().next().value
                  ];
              } else {
                label_text = count + " filters active";
              }
              d3.select(
                self.get_ui_element_selector_by_role("node_filter_label")
              ).html("Show: " + label_text + ' <span class="caret"></span>');

              self.apply_node_filter();
            });
        });

        d3.select(
          self.get_ui_element_selector_by_role("node_filter_enclosure")
        ).style("display", null);
      };

      $(self.get_ui_element_selector_by_role("set_min_cluster_size"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.minimum_cluster_size = e.target.value;
            self.update(false);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("pairwise_table_pecentage", true))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.show_percent_in_pairwise_table =
              !self.show_percent_in_pairwise_table;
            render_binned_table(
              "attribute_table",
              self.colorizer["category_map"],
              self.colorizer["category_pairwise"]
            );
          }, 250)
        );
    }

    console.time("[PERF] filtering nodes and edges");
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

    self.edges = graph_data.Edges
      ? graph_data.Edges.filter(
          (v, i) => v.source in connected_links && v.target in connected_links
        )
      : [];

    self.edges = self.edges.map((v, i) => {
      var cp_v = _.clone(v);
      cp_v.source = connected_links[v.source];
      cp_v.target = connected_links[v.target];
      cp_v.id = i;
      return cp_v;
    });
    console.timeEnd("[PERF] filtering nodes and edges");

    compute_node_degrees(self.nodes, self.edges);

    if (!self.isMJCNetwork || self.fullMJCNetwork) {
      default_layout(self.initial_packed);
      self.clusters.forEach((d, i) => {
        self.cluster_mapping[d.cluster_id] = i;
        d.hxb2_linked = d.children.some((c) => c.hxb2_linked);
        _compute_cluster_degrees(d);
        d.distances = [];
      });
    }

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
      const tPopStart = performance.now();
      if (button_bar_ui) {
        // decide if the variable can be considered categorical by examining its range
        const t1 = performance.now();

        // Single-pass optimization for String attributes
        const stringAttrsToPopulate = [];
        for (const [k, d] of Object.entries(
          graph_data[kGlobals.network.GraphAttrbuteID] || {}
        )) {
          if (!d["value_range"] && d["type"] === "String") {
            d.discrete = true;
            d["raw_attribute_key"] = k;
            if (!("label" in d)) {
              d["label"] = k;
            }
            d["value_range_set"] = new Set();
            d.is_volatile = !!(
              self.json[kGlobals.network.GraphAttrbuteID][k] &&
              self.json[kGlobals.network.GraphAttrbuteID][k].volatile
            );
            if (d.is_volatile) {
              d.mapper = self.json[kGlobals.network.GraphAttrbuteID][k].map;
            }
            stringAttrsToPopulate.push(d);
          }
        }

        if (stringAttrsToPopulate.length > 0) {
          const node_attr_id = kGlobals.network.NodeAttributeID;
          const missing_label = kGlobals.missing.label;
          const N = graph_data.Nodes.length;

          for (let i = 0; i < N; i++) {
            const nd = graph_data.Nodes[i];
            const hasAttrs = nd && node_attr_id in nd;
            const attrs = hasAttrs ? nd[node_attr_id] : null;

            for (let j = 0; j < stringAttrsToPopulate.length; j++) {
              const d = stringAttrsToPopulate[j];
              const k = d["raw_attribute_key"];

              if (d.is_volatile) {
                if (hasAttrs && k in attrs) {
                  let v = d.mapper(nd, self);
                  if (typeof v === "string" && v.length === 0)
                    v = missing_label;
                  d["value_range_set"].add(v || missing_label);
                } else {
                  d["value_range_set"].add(missing_label);
                }
              } else {
                if (attrs && k in attrs) {
                  let v = attrs[k];
                  if (typeof v === "string" && v.length === 0)
                    v = missing_label;
                  d["value_range_set"].add(v !== undefined ? v : missing_label);
                } else {
                  d["value_range_set"].add(missing_label);
                }
              }
            }
          }

          for (let j = 0; j < stringAttrsToPopulate.length; j++) {
            const d = stringAttrsToPopulate[j];
            d["value_range"] = [...d["value_range_set"]];
            delete d["value_range_set"];
            delete d["is_volatile"];
            delete d["mapper"];
            d["dimension"] = d["value_range"].length;
          }
        }

        var valid_cats = _.filter(
          _.map(
            graph_data[kGlobals.network.GraphAttrbuteID],
            self._aux_populate_category_fields
          ),
          (d, k) => /*if (d.discrete) {
              console.log (d["value_range"].length);
          }*/ {
            return (
              d.discrete &&
              "value_range" in d &&
              /*d["value_range"].length <= kGlobals.MaximumValuesInCategories &&*/
              !d["_hidden_"] &&
              (!subset || subset.has(d["raw_attribute_key"]))
            );
          }
        );

        var valid_shapes = _.filter(
          valid_cats,
          (d) =>
            (!subset || subset.has(d["raw_attribute_key"])) &&
            ((d.discrete && d.dimension <= 7) ||
              (d["raw_attribute_key"] in self.networkShapeScheme &&
                !d["_hidden_"]))
        );
        const t2 = performance.now();

        // sort values alphabetically for consistent coloring

        _.each(valid_cats, self._aux_process_category_values);
        const t3 = performance.now();

        /*const colorStopsPath = [
          kGlobals.network.GraphAttrbuteID,
          self.colorizer["category_id"],
          "color_stops",
        ];*/

        const tScaleStart = performance.now();
        var valid_scales = _.filter(
          _.map(graph_data[kGlobals.network.GraphAttrbuteID], (d, k) => {
            let color_stops = _.get(
              self.json,
              [kGlobals.network.GraphAttrbuteID, k, "color_stops"],
              kGlobals.network.ContinuousColorStops
            );

            function determine_scaling(d, values, scales, trueRange) {
              var low_var = Infinity;
              d["value_range"] = trueRange || d3.extent(values);

              const isLarge = values.length > 1000;
              const sampleSize = isLarge ? 1000 : values.length;
              const step = isLarge ? Math.floor(values.length / sampleSize) : 1;

              _.each(scales, (scl, i) => {
                var bins = _.map(_.range(color_stops), () => 0);
                scl.range([0, color_stops - 1]).domain(d["value_range"]);

                if (isLarge) {
                  for (let i = 0; i < sampleSize; i++) {
                    const val = values[i * step];
                    const binIdx = ~~scl(val);
                    if (binIdx >= 0 && binIdx < color_stops) {
                      bins[binIdx]++;
                    }
                  }
                } else {
                  let N = values.length;
                  while (N--) {
                    bins[~~scl(values[N])]++; // truncate the value
                  }
                }

                var actualLen = isLarge ? sampleSize : values.length;
                var mean = actualLen / color_stops;
                var vrnc = _.reduce(
                  bins,
                  (p, c) => p + (c - mean) * (c - mean)
                );

                if (vrnc < low_var) {
                  low_var = vrnc;
                  d["scale"] = scl;
                  d["scale_color_stops"] = color_stops;
                }
              });
            }

            d["raw_attribute_key"] = k;

            if (d.type === "Number" || d.type === "Number-categories") {
              if (d["scale"] && d["scale_color_stops"] === color_stops) {
                return d;
              }

              // Get the true extent (min/max range) from the pre-computed unique values
              const numericUniqs = (self.uniqValues[k] || [])
                .map(Number)
                .filter((v) => !isNaN(v));
              const range = d3.extent(numericUniqs);

              const values = [];
              const node_attr_id = kGlobals.network.NodeAttributeID;
              const is_volatile =
                self.json[kGlobals.network.GraphAttrbuteID][k].volatile;
              const is_number_type = d.type === "Number";

              const nodes = self.json.Nodes || [];
              const nodesLen = nodes.length;
              const maxSampleNodes = 5000;
              const isLargeNodes = nodesLen > maxSampleNodes;
              const stepNodes = isLargeNodes
                ? Math.floor(nodesLen / maxSampleNodes)
                : 1;
              const limitNodes = isLargeNodes ? maxSampleNodes : nodesLen;

              if (is_volatile) {
                const mapper =
                  self.json[kGlobals.network.GraphAttrbuteID][k].map;
                for (let idx = 0; idx < limitNodes; idx++) {
                  const nd = nodes[isLargeNodes ? idx * stepNodes : idx];
                  if (nd && node_attr_id in nd && k in nd[node_attr_id]) {
                    let v = mapper(nd, self);
                    if (typeof v === "string") {
                      if (v.length === 0) continue;
                      if (is_number_type) {
                        v = Number(v);
                        if (!isNaN(v)) values.push(v);
                      }
                    } else if (typeof v === "number" && !isNaN(v)) {
                      values.push(v);
                    }
                  }
                }
              } else {
                for (let idx = 0; idx < limitNodes; idx++) {
                  const nd = nodes[isLargeNodes ? idx * stepNodes : idx];
                  if (nd && node_attr_id in nd) {
                    const attrs = nd[node_attr_id];
                    if (attrs && k in attrs) {
                      let v = attrs[k];
                      if (typeof v === "string") {
                        if (v.length === 0) continue;
                        if (is_number_type) {
                          v = Number(v);
                          if (!isNaN(v)) values.push(v);
                        }
                      } else if (typeof v === "number" && !isNaN(v)) {
                        values.push(v);
                      }
                    }
                  }
                }
              }

              if (values.length === 0) {
                return {};
              }

              const scales_to_consider = [d3.scale.linear()];

              if (!d.is_integer) {
                if (range[0] > 0) {
                  scales_to_consider.push(d3.scale.log());
                }
                if (range[0] >= 0) {
                  scales_to_consider.push(d3.scale.pow().exponent(1 / 3));
                  scales_to_consider.push(d3.scale.pow().exponent(1 / 4));
                  scales_to_consider.push(d3.scale.pow().exponent(1 / 2));
                  scales_to_consider.push(d3.scale.pow().exponent(1 / 8));
                  scales_to_consider.push(d3.scale.pow().exponent(1 / 16));
                }
              }
              determine_scaling(d, values, scales_to_consider, range);
            } else if (d.type === "Date") {
              if (d["scale"] && d["scale_color_stops"] === color_stops) {
                return d;
              }
              const values = _.filter(
                _.map(graph_data.Nodes, (nd) => {
                  var a_date = self.attribute_node_value_by_id(nd, k);
                  if (a_date instanceof Date) {
                    return a_date;
                  }
                  if (a_date === kGlobals.missing.label) {
                    return null;
                  }
                  if (a_date === "REDACTED" && self.isMJCNetwork) {
                    return "REDACTED";
                  }
                  try {
                    var parsed = this.parse_dates(a_date);
                    HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                      nd,
                      k,
                      parsed
                    );
                    return parsed;
                  } catch (err) {
                    if (a_date === "REDACTED" && self.isMJCNetwork) {
                      HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                        nd,
                        k,
                        "REDACTED"
                      );
                      return "REDACTED";
                    } else {
                      HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                        nd,
                        k,
                        kGlobals.missing.label
                      );
                      return null;
                    }
                  }
                }),
                (v) =>
                  v === kGlobals.missing.label || v === "REDACTED" || !v
                    ? null
                    : v
              );
              // automatically determine the scale and see what spaces the values most evenly
              if (values.length === 0) {
                // invalid scale
                return {};
              }

              determine_scaling(d, values, [d3.time.scale.utc()]);
            }
            return d;
          }),
          (d) =>
            (d.type === "Number" ||
              d.type === "Date" ||
              d.type === "Number-categories") &&
            !d["_hidden_"]
        );
        const tScaleEnd = performance.now();

        const _menu_label_gen = (d) =>
          (d["annotation"] ? "[" + d["annotation"] + "] " : "") + d["label"];

        //console.log (valid_scales);
        //valid_cats.splice (0,0, {'label' : 'None', 'index' : -1});

        [
          d3.select(self.get_ui_element_selector_by_role("attributes")),
          d3.select(
            self.get_ui_element_selector_by_role("attributes_cat", true)
          ),
        ].forEach((m) => {
          //console.log (m);

          if (m.empty()) {
            return;
          }
          m.selectAll("li").remove();

          var menu_items = [
            [
              [
                "None",
                null,
                _.partial(self.handle_attribute_categorical, null),
              ],
            ],
            [[__("network_tab")["categorical"], "heading", null]],
          ].concat(
            valid_cats.map((d, i) => [
              [
                _menu_label_gen(d),
                d["raw_attribute_key"],
                _.partial(
                  self.handle_attribute_categorical,
                  d["raw_attribute_key"]
                ),
              ],
            ])
          );

          if (valid_scales.length) {
            menu_items = menu_items
              .concat([[[__("network_tab")["continuous"], "heading", null]]])
              .concat(
                valid_scales.map((d, i) => [
                  [
                    _menu_label_gen(d),
                    d["raw_attribute_key"],
                    _.partial(
                      self.handle_attribute_continuous,
                      d["raw_attribute_key"]
                    ),
                  ],
                ])
              );
          }

          var cat_menu = m.selectAll("li").data(menu_items);

          cat_menu
            .enter()
            .append("li")
            .classed("disabled", (d) => d[0][1] === "heading")
            .style("font-variant", (d) =>
              d[0][1] < -1 ? "small-caps" : "normal"
            );

          cat_menu
            .selectAll("a")
            .data((d) => d)
            .enter()
            .append("a")
            .html((d, i, j) => {
              let htm = d[0];
              let type = "unknown";

              if (d[1] in self.schema) {
                type = self.schema[d[1]].type;
              }

              if (d[1] in self.uniqs && type === "String") {
                htm =
                  htm +
                  '<span title="Number of unique values" class="badge pull-right">' +
                  self.uniqs[d[1]] +
                  "</span>";
              }

              return htm;
            })
            .attr("style", (d, i, j) => {
              if (d[1] === "heading") return "font-style: italic";
              if (j === 0) {
                return " font-weight: bold;";
              }
              return null;
            })
            .attr("href", "#")
            .on("click", (d) => {
              if (d[2]) {
                d[2].call();
              }
            });
        });

        [d3.select(self.get_ui_element_selector_by_role("shapes"))].forEach(
          (m) => {
            m.selectAll("li").remove();
            var cat_menu = m
              .selectAll("li")
              .data(
                [
                  [
                    [
                      "None",
                      null,
                      _.partial(self.handle_shape_categorical, null),
                    ],
                  ],
                ].concat(
                  valid_shapes.map((d, i) => [
                    [
                      _menu_label_gen(d),
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_shape_categorical,
                        d["raw_attribute_key"]
                      ),
                    ],
                  ])
                )
              );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", (d) =>
                d[0][1] < -1 ? "small-caps" : "normal"
              );

            cat_menu
              .selectAll("a")
              .data((d) => d)
              .enter()
              .append("a")
              .html((d, i, j) => {
                let htm = d[0];
                let type = "unknown";

                if (_.contains(_.keys(self.schema), d[1])) {
                  type = self.schema[d[1]].type;
                }

                if (_.contains(_.keys(self.uniqs), d[1]) && type === "String") {
                  htm =
                    htm +
                    '<span title="Number of unique values" class="badge pull-right">' +
                    self.uniqs[d[1]] +
                    "</span>";
                }

                return htm;
              })
              .attr("style", (d, i, j) => {
                if (j === 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", (d) => {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );

        $(self.get_ui_element_selector_by_role("opacity_invert"))
          .off("click")
          .on("click", function (e) {
            if (self.colorizer["opacity_scale"]) {
              self.colorizer["opacity_scale"].range(
                self.colorizer["opacity_scale"].range().reverse()
              );
              self.update(true);
              self.draw_attribute_labels();
            }
            $(this).toggleClass("btn-active btn-default");
          });

        $(self.get_ui_element_selector_by_role("attributes_invert"))
          .off("click")
          .on("click", function (e) {
            if (self.colorizer["category_id"]) {
              graph_data[kGlobals.network.GraphAttrbuteID][
                self.colorizer["category_id"]
              ]["scale"].range(
                graph_data[kGlobals.network.GraphAttrbuteID][
                  self.colorizer["category_id"]
                ]["scale"]
                  .range()
                  .reverse()
              );
              self.clusters.forEach((the_cluster) => {
                the_cluster["gradient"] = compute_cluster_gradient(
                  the_cluster,
                  self.colorizer["category_id"]
                );
              });
              self.update(true);
              self.draw_attribute_labels();
            }
            $(this).toggleClass("btn-active btn-default");
          });

        [d3.select(self.get_ui_element_selector_by_role("opacity"))].forEach(
          (m) => {
            m.selectAll("li").remove();
            var cat_menu = m
              .selectAll("li")
              .data(
                [
                  [
                    [
                      "None",
                      null,
                      _.partial(self.handle_attribute_opacity, null),
                    ],
                  ],
                ].concat(
                  valid_scales.map((d, i) => [
                    [
                      d["label"],
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_attribute_opacity,
                        d["raw_attribute_key"]
                      ),
                    ],
                  ])
                )
              );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", (d) =>
                d[0][1] < -1 ? "small-caps" : "normal"
              );
            cat_menu
              .selectAll("a")
              .data((d) => d)
              .enter()
              .append("a")
              .text((d, i, j) => d[0])
              .attr("style", (d, i, j) => {
                if (j === 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", (d) => {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );

        if (self._setup_node_filter_ui) {
          self._setup_node_filter_ui();
        }
        const tPopEnd = performance.now();
        console.log(
          `[PERF_DETAIL] _aux_populate_category_menus: total = ${(
            tPopEnd - tPopStart
          ).toFixed(2)}ms\n` +
            `  - valid_cats filter/fields = ${(t2 - t1).toFixed(2)}ms\n` +
            `  - _aux_process_category_values = ${(t3 - t2).toFixed(2)}ms\n` +
            `  - valid_scales & determine_scaling = ${(
              tScaleEnd - tScaleStart
            ).toFixed(2)}ms\n` +
            `  - D3 UI Menu rendering = ${(tPopEnd - tScaleEnd).toFixed(2)}ms`
        );
      }
    };

    const initSteps = [];

    if (attributes) {
      initSteps.push({
        name: "Mapping node attributes...",
        run: () => {
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
                        graph_data[kGlobals.network.GraphAttrbuteID][i][
                          "values"
                        ]
                      )
                    ) {
                      graph_data[kGlobals.network.GraphAttrbuteID][i]["values"][
                        v
                      ] =
                        graph_data[kGlobals.network.GraphAttrbuteID][i][
                          "range"
                        ];
                      graph_data[kGlobals.network.GraphAttrbuteID][i][
                        "range"
                      ] += 1;
                    }
                  }
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
        },
      });

      initSteps.push({
        name: "Transforming predefined attributes...",
        run: () => {
          console.time("[PERF] populate_predefined_attribute");
          for (const [key, def] of Object.entries(
            self._networkPredefinedAttributeTransforms
          )) {
            self.populate_predefined_attribute(def, key);
          }
          console.timeEnd("[PERF] populate_predefined_attribute");
        },
      });

      initSteps.push({
        name: "Populating category menus...",
        run: () => {
          console.time("[PERF] self._aux_populate_category_menus");
          self._aux_populate_category_menus();
          console.timeEnd("[PERF] self._aux_populate_category_menus");
        },
      });
    }

    initSteps.push({
      name: "Calculating cluster distances...",
      run: () => {
        if (self.cluster_sizes.length > max_points_to_render) {
          var sorted_array = _.filter(
            _.map(self.cluster_sizes, (d, i) => [d, i + 1]),
            (d) => !_.isUndefined(d[0])
          );
          sorted_array = sorted_array.sort((a, b) => a[0] - b[0]);

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

        console.time("[PERF] cluster distances calculations");
        self.edges.forEach((e, i) => {
          var cid = self.nodes[e.target].cluster;
          if (cid !== null && cid !== undefined) {
            var cidx = self.cluster_mapping[cid];
            if (cidx !== undefined && self.clusters[cidx]) {
              self.clusters[cidx].distances.push(e.length);
            }
          }
        });

        self.clusters.forEach((d, i) => {
          d.distances = helpers.describe_vector(d.distances);
        });
        console.timeEnd("[PERF] cluster distances calculations");

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
      },
    });

    initSteps.push({
      name: "Updating network visualization...",
      run: () => {
        self.update();
      },
    });

    initSteps.push({
      name: "Applying configuration options...",
      run: () => {
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
            self.loadOverlapPrioritySets(
              options["overlap-priority-sets-url"],
              () =>
                self.load_priority_sets(
                  options["priority-sets-url"],
                  is_writeable
                )
            );
          }

          if (options["priority-set-add-from-mjc-url"]) {
            self.priority_set_add_from_mjc_url =
              options["priority-set-add-from-mjc-url"];
          }

          if (options["mjc-archive-url"]) {
            self.mjc_archive_url = options["mjc-archive-url"];
          }

          if (options["mjc-uuid"]) {
            self.mjc_uuid = options["mjc-uuid"];
          }

          if (self.showing_diff) {
            self.handle_attribute_categorical("_newly_added");
          }
        }

        if (self.isPrimaryGraph) {
          self.annotate_multiple_clusters_on_nodes();
        }

        if (self._is_CDC_ && !self.isMJCNetwork) {
          self.define_node_search_table();
        }

        self.draw_attribute_labels();
        network_layout.start();

        if (window.hivtrace && window.hivtrace.graphSummary && self.graph_summary_tag) {
          window.hivtrace.graphSummary(self, self.graph_summary_tag, self.graph_summary_not_CDC);
        }
      },
    });

    function runInitSteps(index) {
      if (index >= initSteps.length) {
        if (self.post_init_callbacks) {
          const callbacks = self.post_init_callbacks;
          delete self.post_init_callbacks;
          callbacks.forEach((cb) => cb());
        }
        return;
      }
      window.updateNetworkLoadingStatus(initSteps[index].name);
      setTimeout(() => {
        initSteps[index].run();
        runInitSteps(index + 1);
      }, 1);
    }

    // The redacted MJC view returns early from `update()` before the deferred
    // render that clears these placeholders, and it draws neither the network
    // SVG nor the cluster/subcluster tables, so skip showing the spinners here
    // (otherwise they stay up forever and the page appears to hang on load).
    if (self.isPrimaryGraph && !(self.isMJCNetwork && !self.fullMJCNetwork)) {
      const showPlaceholder = (element, message) => {
        if (element && element.node()) {
          element.style("display", "none");
          const parentNode = element.node().parentNode;
          if (parentNode) {
            const d3Parent = d3.select(parentNode);
            d3Parent.selectAll(".table-loading-placeholder").remove();
            d3Parent
              .insert("div", () => element.node())
              .classed("table-loading-placeholder", true)
              .style("padding", "2em")
              .style("text-align", "center")
              .style("color", "#666")
              .style("font-size", "16px")
              .html('<i class="fa fa-spinner fa-spin"></i> ' + message);
          }
        }
      };

      showPlaceholder(self.cluster_table, "Building clusters table...");

      const subTable = network.check_network_option(
        options,
        "subcluster-table"
      );
      if (subTable) {
        showPlaceholder(d3.select(subTable), "Building subclusters table...");
      }

      if (!self._is_CDC_) {
        showPlaceholder(nodesTab.getNodeTable(), "Building node table...");
      }
    }

    runInitSteps(0);
  }

  /**
   * @function _cluster_table_draw_id
   * @description Draws the ID column for the cluster table, including view buttons for subclusters and clusters.
   * @param {HTMLElement} element - The HTML element for the table cell.
   * @param {Array} payload - The data payload for the cell, containing cluster ID and type.
   * @returns {void}
   */
  function _cluster_table_draw_id(element, payload) {
    var this_cell = d3.select(element);
    this_cell.selectAll("*").remove();
    const _is_subcluster = payload[1];
    var cluster_id = payload[0];

    if (_is_subcluster) {
      //console.log (payload);

      //this_cell.append("i")
      //      .classed("fa fa-arrow-circle-o-right", true).style("padding-right", "0.25em");

      /*if (payload[2].rr_count) {
        this_cell
          .append("i")
          .classed("fa fa-exclamation-triangle", true)
          .attr("title", "Subcluster has recent/rapid nodes");
      }*/
      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
      if (self.has_multiple_sequences) {
        _.each(["fa-eye", "fa-user-circle"], (icn, i) => {
          this_cell
            .append("button")
            .classed("btn btn-sm pull-right", true)
            .style("margin-right", "0.25em")
            .on("click", (e) => {
              self.view_subcluster(
                payload[2],
                null,
                i == 0
                  ? "Sequence-level view for sub-cluster " + payload[0]
                  : null,
                i == 1 ? { "simplified-mspp": 1 } : null
              );
            })
            .append("i")
            .classed("fa " + icn, true)
            .attr(
              "title",
              i == 1 ? __("clusters_tab")["view"] : "Sequence-level view"
            );
        });
      } else {
        this_cell
          .append("button")
          .classed("btn btn-sm pull-right", true)
          .style("margin-right", "0.25em")
          .on("click", (e) => {
            self.view_subcluster(payload[2]);
          })
          .append("i")
          .classed("fa fa-eye", true)
          .attr("title", __("clusters_tab")["view"]);
      }
    } else {
      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
      if (self.has_multiple_sequences) {
        _.each(["fa-eye", "fa-user-circle"], (icn, i) => {
          this_cell
            .append("button")
            .classed("btn btn-sm pull-right", true)
            .style("margin-right", "0.25em")
            .on("click", (e) => {
              self.open_exclusive_tab_view(
                cluster_id,
                null,
                i == 0
                  ? (cn) => {
                      return "Sequence-level view for cluster " + cn;
                    }
                  : null,
                i == 1 ? { "simplified-mspp": 1 } : null
              );
            })
            .append("i")
            .classed("fa " + icn, true)
            .attr(
              "title",
              i == 1 ? __("clusters_tab")["view"] : "Sequence-level view"
            );
        });
      } else {
        this_cell
          .append("button")
          .classed("btn btn-sm pull-right", true)
          .style("margin-right", "0.25em")
          .on("click", (e) => {
            self.open_exclusive_tab_view(cluster_id);
          })
          .append("i")
          .classed("fa fa-eye", true)
          .attr("title", __("clusters_tab")["view"]);
      }
    }
    this_cell
      .append("button")
      .classed("btn btn-sm pull-right", true)
      .style("margin-right", "0.25em")
      //.text(__("clusters_tab")["list"])
      .attr("data-toggle", "modal")
      .attr(
        "data-target",
        self.get_ui_element_selector_by_role("cluster_list", true)
      )
      .attr("data-cluster", cluster_id)
      .append("i")
      .classed("fa fa-list", true)
      .attr("title", __("clusters_tab")["list"]);
  }

  /**
   * @function _cluster_table_draw_buttons
   * @description Draws buttons for cluster table rows, including expand/collapse, problematic status, and change view.
   * @param {HTMLElement} element - The HTML element for the table cell.
   * @param {Array} payload - The data payload for the cell, containing cluster information.
   * @returns {void}
   */
  function _cluster_table_draw_buttons(element, payload) {
    var this_cell = d3.select(element);
    const label_diff = function (c_info) {
      const d = c_info["delta"];
      const moved = c_info["moved"];
      const deleted = c_info["deleted"];
      const new_count = c_info["new_nodes"] ? c_info["new_nodes"] : 0;

      let label_str = "";
      if (moved) label_str = " " + moved + " moved ";
      if (new_count) label_str += "+" + new_count + " new ";
      if (deleted) label_str += "-" + deleted + " previous ";
      return label_str;
    };

    var labels = [];

    if (payload[4]) {
      if (payload[4]["type"] === "new") {
        if (payload[4]["moved"]) {
          labels.push(["renamed " + label_diff(payload[4]), 2]);
        } else {
          labels.push(["new", 3]);
        }
      } else if (payload[4]["type"] === "extended") {
        labels.push([label_diff(payload[4]), payload["4"]["flag"]]);
      } else if (payload[4]["type"] === "merged") {
        labels.push([
          "Merged " +
            payload[4]["old_clusters"].join(", ") +
            " " +
            label_diff(payload[4]),
          payload["4"]["flag"],
        ]);
      }
    }

    labels.push([
      [
        payload[0]
          ? __("clusters_tab")["expand"]
          : __("clusters_tab")["collapse"],
        payload[0] ? "fa-expand" : "fa-compress",
      ],
      0,
    ]);
    if (payload[1]) {
      labels.push([["problematic", "fa-exclamation-circle"], 1]);
    }
    if (payload[2]) {
      labels.push([["match", "fa-check-square"], 1]);
    }
    var buttons = this_cell.selectAll("button").data(labels);
    buttons.enter().append("button");
    buttons.exit().remove();
    buttons
      .classed("btn btn-xs", true)
      .classed("btn-default", (d) => d[1] !== 1 && d[1] !== 2)
      .classed("btn-danger", (d) => d[1] === 2)
      .classed("btn-success", (d) => d[1] === 3)
      /*.text(function(d) {
        return d[0];
      })*/
      .style("margin-right", "0.25em")
      .attr("disabled", (d) => (d[1] === 1 ? "disabled" : null))
      .on("click", (d) => {
        if (d[1] === 0) {
          if (payload[0]) {
            expand_cluster(self.clusters[payload[3] - 1], true);
          } else {
            collapse_cluster(self.clusters[payload[3] - 1]);
          }
          self.update_volatile_elements(self.cluster_table);
          if (self.subcluster_table) {
            self.update_volatile_elements(self.subcluster_table);
          }
        } else if (d[1] === 2 || d[1] === 3) {
          //_social_view_options (labeled_links, shown_types),

          var shown_types = { Existing: 1, "Newly added": 1 },
            link_class = ["Existing", "Newly added"];

          self
            .open_exclusive_tab_view(
              payload[3],
              null,
              (cluster_id) => "Cluster " + cluster_id + " [changes view]",
              self._social_view_options(link_class, shown_types, (e) => {
                if (
                  _.isObject(e.source) &&
                  HTX.HIVTxNetwork.is_new_node(e.source)
                ) {
                  return "Newly added";
                }
                if (
                  _.isObject(e.target) &&
                  HTX.HIVTxNetwork.is_new_node(e.target)
                ) {
                  return "Newly added";
                }

                return e.attributes.indexOf("added-to-prior") >= 0
                  ? "Newly added"
                  : "Existing";
              })
            )
            .handle_attribute_categorical("_newly_added");
        }
      });
    buttons.each(function (d, i) {
      var this_e = d3.select(this);
      if (_.isString(d[0])) {
        this_e.selectAll("i").remove();
        this_e.text(d[0]);
      } else {
        var i_span = this_e.selectAll("i").data([d[0]]);
        i_span.enter().append("i");
        i_span
          .attr("class", (d) => "fa " + d[1], true)
          .attr("title", (d) => d[0]);
      }
    });
  }

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
      if (payload[0] === null) {
        labels = [];
      } else if (_.isString(payload[0])) {
        labels = [[payload[0], 1, "btn-warning"]];
      } else {
        labels = [["can't be shown", 1]];
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
            collapse_cluster(self.clusters[payload[3] - 1], true);
          } else {
            expand_cluster(self.clusters[payload[3] - 1]);
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
    if (self.priority_set_archive_table) {
      self.update_volatile_elements(self.priority_set_archive_table);
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
                if (v instanceof Date) {
                  return timeDateUtil.DateViewFormatSlider(v);
                }
                var parsed = timeDateUtil.DateViewFormatSlider.parse(v);
                if (!parsed) {
                  parsed = new Date(v);
                }
                if (parsed && !isNaN(parsed.getTime())) {
                  return timeDateUtil.DateViewFormatSlider(parsed);
                }
                return v;
              },
            };
          } else if (self.displayed_node_subset[c].type === "Number") {
            cell_definition = {
              value: cell,
              format:
                self.displayed_node_subset[c].label_format || d3.format(".2f"),
            };
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
    beginning_of_time.setUTCFullYear(1900);
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
      event_date_m3y.setUTCFullYear(event_date.getUTCFullYear() - 3);
      event_date_m3y.setUTCHours(0, 0, 0, 0);
      const event_date_m1y = timeDateUtil.DateViewFormatSlider.parse(DT);
      event_date_m1y.setUTCFullYear(event_date.getUTCFullYear() - 1);
      event_date_m1y.setUTCHours(0, 0, 0, 0);
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

    if (container && container.node()) {
      container.style("display", "none");
      const parentNode = container.node().parentNode;
      if (parentNode) {
        const d3Parent = d3.select(parentNode);
        d3Parent.selectAll(".table-loading-placeholder").remove();
        d3Parent
          .insert("div", () => container.node())
          .classed("table-loading-placeholder", true)
          .style("padding", "2em")
          .style("text-align", "center")
          .style("color", "#666")
          .style("font-size", "16px")
          .html('<i class="fa fa-spinner fa-spin"></i> Building node table...');
      }
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
                  if (
                    n.cluster === null ||
                    n.cluster === undefined ||
                    n.cluster === "None" ||
                    self.cluster_mapping[n.cluster] === undefined
                  ) {
                    return [null];
                  }
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
  self.draw_cluster_table = function (extra_columns, element, options, cb) {
    var skip_clusters = options && options["no-clusters"];
    var skip_subclusters = !(options && options["subclusters"]);

    element = element || self.cluster_table;

    if (element && element.node()) {
      element.style("display", "none");
      const parentNode = element.node().parentNode;
      if (parentNode) {
        const d3Parent = d3.select(parentNode);
        d3Parent.selectAll(".table-loading-placeholder").remove();
        const msg = skip_clusters
          ? "Building subclusters table..."
          : "Building clusters table...";
        d3Parent
          .insert("div", () => element.node())
          .classed("table-loading-placeholder", true)
          .style("padding", "2em")
          .style("text-align", "center")
          .style("color", "#666")
          .style("font-size", "16px")
          .html('<i class="fa fa-spinner fa-spin"></i> ' + msg);
      }
      var headers = [
        [
          {
            value: __("general")["cluster"] + " ID",
            sort: function (c) {
              return _.map(
                c.value[0].split(kGlobals.SubclusterSeparator),
                (ss) => kGlobals.formats.DotFormatPadder(Number(ss))
              ).join("|");
            },
            help: "Unique cluster ID",
          },
          {
            value: __("general")["attributes"],
            sort: function (c) {
              c = c.value();
              if (c[4]) {
                // has attributes
                return c[4]["delta"];
              }
              return c[0];
            },
            help: "Visibility in the network tab and other attributes",
          },
          {
            value: __("clusters_tab")["size"],
            sort: "value",
            help: "Number of nodes in the cluster",
          },
        ],
      ];

      if (self.cluster_attributes) {
        headers[0][1]["presort"] = "desc";
      }

      if (self._is_seguro) {
        headers[0].push({
          value: __("clusters_tab")["number_of_genotypes_in_past_2_months"],
          sort: "value",
          help: "# of cases in cluster genotyped in the last 2 months",
        });

        headers[0].push({
          value:
            __("clusters_tab")["scaled_number_of_genotypes_in_past_2_months"],
          sort: "value",
          help: "# of cases in cluster genotyped in the last 2 months divided by the square-root of the cluster size",
        });
      }

      if (!self._is_CDC_) {
        headers[0].push({
          value:
            __("statistics")["links_per_node"] +
            "<br>" +
            __("statistics")["mean"] +
            "[" +
            __("statistics")["median"] +
            ", IQR]",
          html: true,
        });

        headers[0].push({
          value:
            __("statistics")["genetic_distances_among_linked_nodes"] +
            "<br>" +
            __("statistics")["mean"] +
            "[" +
            __("statistics")["median"] +
            ", IQR]",
          help: "Genetic distance among nodes in the cluster",
          html: true,
        });
      }

      if (extra_columns) {
        _.each(extra_columns, (d) => {
          headers[0].push(d.description);
        });
      }

      if (options && options["headers"]) {
        options["headers"](headers);
      }

      var rows = [];

      var make_row = function (d, is_subcluster) {
        var this_row = [
          // CLUSTER ID
          {
            value: [d.cluster_id, is_subcluster, d], //.cluster_id,
            callback: _cluster_table_draw_id,
          },
          // CLUSTER ATTRIBUTES AND BUTTONS
          {
            value: function () {
              var actual_cluster = is_subcluster ? d.parent_cluster : d;

              return [
                actual_cluster.collapsed,
                actual_cluster.hxb2_linked,
                actual_cluster.match_filter,
                actual_cluster.cluster_id,
                is_subcluster
                  ? null
                  : self.cluster_attributes
                  ? self.cluster_attributes[actual_cluster.cluster_id]
                  : null,
              ];
            },
            callback: _cluster_table_draw_buttons,
            volatile: true,
          },
          // CLUSTER SIZE
          {
            value: self.unique_entity_list(d.children).length,
          },
        ];

        if (self._is_CDC_) {
          this_row[2].volatile = true;
          this_row[2].actions = function (item, value) {
            if (!clustersOfInterest.get_editor()) {
              return null;
            }
            return [
              {
                icon: "fa-plus",
                action: function (button, v) {
                  if (clustersOfInterest.get_editor()) {
                    clustersOfInterest
                      .get_editor()
                      .append_node_objects(d.children);
                  }
                  return false;
                },
                help: "Add to cluster of interest",
              },
            ];
          };
        }

        if (self._is_seguro) {
          this_row.push({
            value: d,
            format: function (d) {
              return _.filter(
                d.children,
                (child) =>
                  d3.time.months.utc(
                    child.patient_attributes["sample_dt"],
                    timeDateUtil.getCurrentDate()
                  ).length <= 2
              ).length;
            },
          });

          this_row.push({
            value: d,
            format: function (d) {
              const recent = _.filter(
                d.children,
                (child) =>
                  d3.time.months.utc(
                    child.patient_attributes["sample_dt"],
                    timeDateUtil.getCurrentDate()
                  ).length <= 2
              ).length;
              return recent / Math.sqrt(d.children.length);
            },
          });
        }

        if (!self._is_CDC_) {
          this_row.push({
            value: d.degrees,
            format: function (d) {
              try {
                return (
                  kGlobals.formats.FloatFormat(d["mean"]) +
                  " [" +
                  kGlobals.formats.FloatFormat(d["median"]) +
                  ", " +
                  kGlobals.formats.FloatFormat(d["Q1"]) +
                  " - " +
                  kGlobals.formats.FloatFormat(d["Q3"]) +
                  "]"
                );
              } catch (e) {
                return "";
              }
            },
          });
          this_row.push({
            value: d.distances,
            format: function (d) {
              try {
                return (
                  kGlobals.formats.FloatFormat(d["mean"]) +
                  " [" +
                  kGlobals.formats.FloatFormat(d["median"]) +
                  ", " +
                  kGlobals.formats.FloatFormat(d["Q1"]) +
                  " - " +
                  kGlobals.formats.FloatFormat(d["Q3"]) +
                  "]"
                );
              } catch (e) {
                return "";
              }
            },
          });
        }
        if (extra_columns) {
          _.each(extra_columns, (ed) => {
            this_row.push(ed.generator(d, self));
          });
        }

        return this_row;
      };

      if (cb) {
        var chunk_size = 3000;
        var cluster_index = 0;

        function processClusterRowsChunk() {
          var end = Math.min(cluster_index + chunk_size, self.clusters.length);
          for (var idx = cluster_index; idx < end; idx++) {
            var cluster = self.clusters[idx];
            if (!skip_clusters) {
              rows.push(make_row(cluster, false));
            }
            if (!skip_subclusters) {
              _.each(cluster.subclusters, (sub_cluster) => {
                rows.push(make_row(sub_cluster, true));
              });
            }
          }

          cluster_index = end;
          if (self.clusters.length > 3000) {
            const percent = Math.round(
              (cluster_index / self.clusters.length) * 100
            );
            const typeLabel = skip_clusters ? "subcluster" : "cluster";
            window.updateNetworkLoadingStatus(
              `Preparing ${typeLabel} table rows... (${percent}%)`
            );
          }

          if (cluster_index < self.clusters.length) {
            setTimeout(processClusterRowsChunk, 1);
          } else {
            tables.add_a_sortable_table(
              element,
              headers,
              rows,
              true,
              options && options["caption"] ? options["caption"] : null,
              clustersOfInterest.get_editor()
            );
            cb();
          }
        }

        processClusterRowsChunk();
      } else {
        _.each(self.clusters, (cluster) => {
          if (!skip_clusters) {
            rows.push(make_row(cluster, false));
          }
          if (!skip_subclusters) {
            _.each(cluster.subclusters, (sub_cluster) => {
              rows.push(make_row(sub_cluster, true));
            });
          }
        });

        tables.add_a_sortable_table(
          element,
          headers,
          rows,
          true,
          options && options["caption"] ? options["caption"] : null,
          clustersOfInterest.get_editor()
        );
      }
    } else {
      if (cb) {
        cb();
      }
    }
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
      const has_seq =
        node.patient_attributes &&
        node.patient_attributes.has_sequence !== undefined
          ? node.patient_attributes.has_sequence
          : node.patient_attributes &&
            node.patient_attributes.sequence_status !== "none";

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
        .style("fill-opacity", (d) => {
          const d_has_seq =
            d.patient_attributes &&
            d.patient_attributes.has_sequence !== undefined
              ? d.patient_attributes.has_sequence
              : d.patient_attributes &&
                d.patient_attributes.sequence_status !== "none";
          if (d_has_seq === false) {
            const d_is_poor =
              d.patient_attributes &&
              d.patient_attributes.poor_quality !== undefined &&
              d.patient_attributes.poor_quality !== null;
            return d_is_poor ? 0.20 : 0.08;
          }
          return 1.0;
        })
        .style("stroke-width", (d) => {
          if (d.match_filter && !self.hide_unselected) {
            return "5px";
          }
          const d_has_seq =
            d.patient_attributes &&
            d.patient_attributes.has_sequence !== undefined
              ? d.patient_attributes.has_sequence
              : d.patient_attributes &&
                d.patient_attributes.sequence_status !== "none";
          if (d_has_seq === false) return "2.5px";
          return "0.5px";
        })
        .style("stroke-dasharray", (d) => {
          if (d.match_filter && !self.hide_unselected) {
            return "none";
          }
          const d_has_seq =
            d.patient_attributes &&
            d.patient_attributes.has_sequence !== undefined
              ? d.patient_attributes.has_sequence
              : d.patient_attributes &&
                d.patient_attributes.sequence_status !== "none";
          if (d_has_seq === false) {
            const d_is_poor =
              d.patient_attributes &&
              d.patient_attributes.poor_quality !== undefined &&
              d.patient_attributes.poor_quality !== null;
            return d_is_poor ? "1,3" : "3,3";
          }
          return "none";
        })
        .style("stroke", (d) => {
          if (d.match_filter && !self.hide_unselected) {
            return "#000";
          }
          const d_has_seq =
            d.patient_attributes &&
            d.patient_attributes.has_sequence !== undefined
              ? d.patient_attributes.has_sequence
              : d.patient_attributes &&
                d.patient_attributes.sequence_status !== "none";
          if (d_has_seq === false) {
            const d_is_poor =
              d.patient_attributes &&
              d.patient_attributes.poor_quality !== undefined &&
              d.patient_attributes.poor_quality !== null;
            if (d_is_poor) {
              return "#d9534f";
            }
            let c = node_color(d);
            if (c.indexOf("url(#") === 0) {
              return "#777";
            }
            return d3.rgb(c).darker(1.2).toString();
          }
          return "#000";
        })
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
        .attr("transform", (d) => {
          const x =
            isNaN(d.x) || typeof d.x === "undefined"
              ? self.width / 2 || 0
              : d.x;
          const y =
            isNaN(d.y) || typeof d.y === "undefined"
              ? self.height / 2 || 0
              : d.y;
          return "translate(" + x + "," + y + ")";
        })
        .style("opacity", (d) => node_opacity(d))
        .style("display", (d) => {
          if (d.is_hidden) return "none";
          if (
            self._node_filter_visible_ids &&
            !self._node_filter_visible_ids.has(d.id)
          )
            return "none";
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
        if (
          self._node_filter_hidden_clusters &&
          self._node_filter_hidden_clusters.has(the_cluster.cluster_id)
        )
          return "none";
        return null;
      });
  }

  /**
   * @function check_for_predefined_shapes
   * @description Checks for predefined shape schemes for a given category and returns the domain and range for the shape scale.
   * @param {string} cat_id - The category ID to check.
   * @returns {Object} An object containing the domain and range for the shape scale.
   */
  function check_for_predefined_shapes(cat_id) {
    //console.log (cat_id);

    if (cat_id in self.networkShapeScheme) {
      var domain = _.range(
        0,
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_range"]
          .length
      );

      return {
        domain: domain,
        range: _.map(
          domain,
          (v) =>
            self.networkShapeScheme[cat_id][
              graph_data[kGlobals.network.GraphAttrbuteID][cat_id][
                "value_range"
              ][v]
            ]
        ),
      };
    }
    return {
      domain: _.range(
        0,
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id].dimension
      ),
      range: kGlobals.ShapeOrdering,
    };
  }

  /**
   * @function handle_shape_categorical
   * @description Handles the selection of a categorical attribute to be used for node shapes.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @returns {void}
   */
  self.handle_shape_categorical = function (cat_id) {
    if (self.post_init_callbacks) {
      self.post_init_callbacks.push(() => {
        self.handle_shape_categorical(cat_id);
      });
      return;
    }
    var set_attr = "None";

    ["shapes"].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d && d[1] === cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html(
        __("network_tab")["shape"] +
          ": " +
          set_attr +
          ' <span class="caret"></span>'
      );
    });

    if (cat_id) {
      var domain_range = check_for_predefined_shapes(cat_id);

      var shape_mapper = d3.scale
        .ordinal()
        .domain(domain_range["domain"])
        .range(domain_range["range"]);
      self.node_shaper["id"] = cat_id;
      self.node_shaper["shaper"] = function (d) {
        return shape_mapper(
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"](
            self.attribute_node_value_by_id(d, cat_id)
          )
        );
      };
      self.node_shaper["category_map"] =
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"];
    } else {
      self.node_shaper.id = null;
      self.node_shaper.shaper = () => "circle";
      self.node_shaper["category_map"] = null;
    }
    //console.log (graph_data [kGlobals.network.GraphAttrbuteID][cat_id]['value_map'], self.node_shaper.domain(), self.node_shaper.range());
    self.draw_attribute_labels();
    self.update(true);
    d3.event.preventDefault();
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
    // draw color legend in the network SVG

    var determine_label_format_cont = function (field_data) {
      if ("label_format" in field_data) {
        return field_data["label_format"];
      }
      if (field_data["type"] === "Date") {
        return timeDateUtil.DateViewFormatShort;
      }
      return d3.format(",.4r");
    };

    self.legend_svg.selectAll("g.hiv-trace-legend").remove();

    var offset = 10;

    if (self.legend_caption) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(self.legend_caption)
        .style("font-weight", "bold");
      offset += 18;
    }

    if (
      self.legend_multiple_sequences &&
      self.rendered_object_counts &&
      self.rendered_object_counts["nodes"] > 0
    ) {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(3," + (offset + 5) + ")")
        .append("circle")
        .attr("cx", "6")
        .attr("cy", "-4")
        .attr("r", "6")
        .classed("multi_sequence", true)
        .style("fill", "none");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + (offset + 5) + ")")
        .append("text")
        .text("Represents >1 sequence");
      offset += 24;
    }

    const has_unsequenced =
      self.rendered_object_counts &&
      self.rendered_object_counts["nodes"] > 0 &&
      self.nodes.some(
        (n) =>
          n.patient_attributes &&
          (n.patient_attributes.has_sequence === false ||
            n.patient_attributes.sequence_status === "none") &&
          (n.patient_attributes.poor_quality === undefined ||
            n.patient_attributes.poor_quality === null)
      );

    const has_poor_seq =
      self.rendered_object_counts &&
      self.rendered_object_counts["nodes"] > 0 &&
      self.nodes.some(
        (n) =>
          n.patient_attributes &&
          (n.patient_attributes.has_sequence === false ||
            n.patient_attributes.sequence_status === "none") &&
          n.patient_attributes.poor_quality !== undefined &&
          n.patient_attributes.poor_quality !== null
      );

    if (has_unsequenced) {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(3," + (offset + 5) + ")")
        .append("circle")
        .attr("cx", "6")
        .attr("cy", "-4")
        .attr("r", "6")
        .style("fill", "rgba(0,0,0,0.08)")
        .style("stroke", "#777")
        .style("stroke-width", "2px")
        .style("stroke-dasharray", "3,3");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + (offset + 5) + ")")
        .append("text")
        .text("Unlinked node without sequence data");
      offset += 24;
    }

    if (has_poor_seq) {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(3," + (offset + 5) + ")")
        .append("circle")
        .attr("cx", "6")
        .attr("cy", "-4")
        .attr("r", "6")
        .style("fill", "rgba(0,0,0,0.20)")
        .style("stroke", "#d9534f")
        .style("stroke-width", "2px")
        .style("stroke-dasharray", "1,3");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + (offset + 5) + ")")
        .append("text")
        .text("Unlinked node with poor/unusable sequence");
      offset += 24;
    }

    if (
      self.rendered_object_counts &&
      self.rendered_object_counts.has_hatching
    ) {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("circle")
        .attr("cx", "8")
        .attr("cy", "-4")
        .attr("r", "8")
        .classed("legend", true)
        .style(
          "fill",
          "url(#" + self.generate_cross_hatch_pattern("#cab") + ")"
        );
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text("Contains sequences in >1 cluster/subcluster");
      offset += 24;
    }

    if (self.edge_legend) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(self.edge_legend["caption"])
        .style("font-weight", "bold");
      offset += 18;

      _.each(self.edge_legend["types"], (value, key) => {
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(key);

        value.call(
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("line")
            .attr("x1", "0")
            .attr("y1", "-4")
            .attr("x2", "12")
            .attr("y2", "-4")
            .classed("legend", true)
        );

        offset += 18;
      });
    }

    if (self.colorizer["category_id"]) {
      //_.each (self.colorizer["category_map"](null, "map"), function (v){ console.log (v); });

      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          "Color: " +
            self.json[kGlobals.network.GraphAttrbuteID][
              self.colorizer["category_id"]
            ].label
        )
        .style("font-weight", "bold");
      offset += 18;

      if (self.colorizer["continuous"]) {
        var anchor_format = determine_label_format_cont(
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]
        );

        var color_stops =
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]["color_stops"] || kGlobals.network.ContinuousColorStops;

        var scale =
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]["scale"];

        _.each(_.range(color_stops), (value) => {
          var x = scale.invert(value);
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(20," + offset + ")")
            .append("text")
            .text(anchor_format(x));
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("circle")
            .attr("cx", "8")
            .attr("cy", "-4")
            .attr("r", "8")
            .classed("legend", true)
            .style("fill", self.colorizer["category"](x));
          offset += 18;
        });

        if (
          "category_values" in
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]
        ) {
          _.each(
            graph_data[kGlobals.network.GraphAttrbuteID][
              self.colorizer["category_id"]
            ]["category_values"],
            (value) => {
              self.legend_svg
                .append("g")
                .classed("hiv-trace-legend", true)
                .attr("transform", "translate(20," + offset + ")")
                .append("text")
                .text(value);
              self.legend_svg
                .append("g")
                .classed("hiv-trace-legend", true)
                .attr("transform", "translate(0," + offset + ")")
                .append("circle")
                .attr("cx", "8")
                .attr("cy", "-4")
                .attr("r", "8")
                .classed("legend", true)
                .style("fill", self.colorizer["category"](value));

              offset += 18;
            }
          );
        }

        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text("missing");
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", kGlobals.missing.color);

        offset += 18;
      } else {
        _.each(self.colorizer["category_map"](null, "map"), (value, key) => {
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(20," + offset + ")")
            .append("text")
            .text(key);
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("circle")
            .attr("cx", "8")
            .attr("cy", "-4")
            .attr("r", "8")
            .classed("legend", true)
            .style("fill", self.colorizer["category"](key));

          offset += 18;
        });
      }
    }

    if (self.node_shaper["id"]) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          "Shape: " +
            self.json[kGlobals.network.GraphAttrbuteID][self.node_shaper["id"]]
              .label
        )
        .style("font-weight", "bold");
      offset += 18;

      var domain_range = check_for_predefined_shapes(self.node_shaper["id"]);
      var shape_mapper = d3.scale
        .ordinal()
        .domain(domain_range["domain"])
        .range(domain_range["range"]);

      _.each(self.node_shaper["category_map"](null, "map"), (value, key) => {
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(key);

        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("path")
          .attr("transform", "translate(5,-5)")
          .attr("d", misc.symbol(shape_mapper(value)).size(128))
          .classed("legend", true)
          .style("fill", "none");

        offset += 18;
      });
    }

    if (self.colorizer["opacity_id"]) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          __("network_tab")["opacity"] +
            ": " +
            self.json[kGlobals.network.GraphAttrbuteID][
              self.colorizer["opacity_id"]
            ].label
        )
        .style("font-weight", "bold");
      offset += 18;

      anchor_format = determine_label_format_cont(
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["opacity_id"]
        ]
      );

      scale =
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["opacity_id"]
        ]["scale"];

      _.each(_.range(kGlobals.network.ContinuousColorStops), (value) => {
        var x = scale.invert(value);
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(anchor_format(x));
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", "black")
          .style("opacity", self.colorizer["opacity"](x));

        offset += 18;
      });

      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text("missing");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("circle")
        .attr("cx", "8")
        .attr("cy", "-4")
        .attr("r", "8")
        .classed("legend", true)
        .style("fill", "black")
        .style("opacity", kGlobals.missing.opacity);

      offset += 18;
    }
  };

  /**
   * @function compute_cluster_gradient
   * @description Computes a radial gradient for a cluster based on a categorical attribute.
   * @param {Object} cluster - The cluster object.
   * @param {string} cat_id - The category ID to use for the gradient.
   * @returns {string} The ID of the generated gradient.
   */
  function compute_cluster_gradient(cluster, cat_id) {
    if (cat_id) {
      var id = self.dom_prefix + "-cluster-gradient-" + self.gradient_id++;
      var gradient = self.network_svg
        .selectAll("defs")
        .append("radialGradient")
        .attr("id", id);
      var values = _.map(cluster.children, (node) => {
        var value = self.attribute_node_value_by_id(node, cat_id);
        return value === kGlobals.missing.label ? Infinity : value;
      }).sort((a, b) => 0 + a - (0 + b));
      var finite = _.filter(values, (d) => d < Infinity);
      var infinite = values.length - finite.length;

      if (infinite) {
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", kGlobals.missing.color);
        gradient
          .append("stop")
          .attr("offset", String((infinite / values.length) * 100) + "%")
          .attr("stop-color", kGlobals.missing.color);
      }

      _.each(finite, (value, index) => {
        gradient
          .append("stop")
          .attr(
            "offset",
            String(((1 + index + infinite) * 100) / values.length) + "%"
          )
          .attr("stop-color", self.colorizer["category"](value));
      });
      //gradient.append ("stop").attr ("offset", "100%").attr ("stop-color", self.colorizer['category'] (dom[1]));

      return id;
    }
    return null;
  }

  /**
   * @function handle_attribute_opacity
   * @description Handles the selection of a continuous attribute to be used for node opacity.
   * @param {string} cat_id - The ID of the continuous attribute.
   * @returns {void}
   */
  self.handle_attribute_opacity = function (cat_id) {
    if (self.post_init_callbacks) {
      self.post_init_callbacks.push(() => {
        self.handle_attribute_opacity(cat_id);
      });
      return;
    }
    var set_attr = "None";

    ["opacity"].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d && d[1] === cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html(
        __("network_tab")["opacity"] +
          ": " +
          set_attr +
          ' <span class="caret"></span>'
      );
    });

    d3.select(self.get_ui_element_selector_by_role("opacity_invert"))
      .style("display", set_attr === "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    self.colorizer["opacity_id"] = cat_id;
    if (cat_id) {
      var scale = graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"];
      self.colorizer["opacity_scale"] = d3.scale
        .linear()
        .domain([0, kGlobals.network.ContinuousColorStops - 1])
        .range([0.25, 1]);
      self.colorizer["opacity"] = function (v) {
        if (v === kGlobals.missing.label) {
          return kGlobals.missing.opacity;
        }
        return self.colorizer["opacity_scale"](scale(v));
      };
    } else {
      self.colorizer["opacity"] = null;
      self.colorizer["opacity_scale"] = null;
    }

    self.draw_attribute_labels();
    self.update(true);
    d3.event.preventDefault();
  };

  /**
   * @function handle_attribute_continuous
   * @description Handles the selection of a continuous attribute to be used for node color.
   * @param {string} cat_id - The ID of the continuous attribute.
   * @returns {void}
   */
  self.handle_attribute_continuous = function (cat_id) {
    if (self.post_init_callbacks) {
      self.post_init_callbacks.push(() => {
        self.handle_attribute_continuous(cat_id);
      });
      return;
    }
    var set_attr = "None";

    render_chord_diagram("aux_svg_holder", null, null);
    render_binned_table("attribute_table", null, null);

    self.network_svg.selectAll("radialGradient").remove();

    self.clusters.forEach((the_cluster) => {
      delete the_cluster["binned_attributes"];
      delete the_cluster["gradient"];
    });

    [
      ["attributes", false],
      ["attributes_cat", true],
    ].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d && d[1] === cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(
        self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])
      ).html("Color: " + set_attr + ' <span class="caret"></span>');
    });

    d3.select(self.get_ui_element_selector_by_role("attributes_invert"))
      .style("display", set_attr === "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    if (cat_id) {
      // map values to inverted scale
      const color_stops =
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_stops"] ||
        kGlobals.network.ContinuousColorStops;

      if (graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_scale"]) {
        self.colorizer["category"] = graph_data[
          kGlobals.network.GraphAttrbuteID
        ][cat_id]["color_scale"](
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id],
          self
        );

        self.uniqValues[cat_id]["min"] =
          self.colorizer["category"](color_stops);
        self.uniqValues[cat_id]["max"] =
          self.colorizer["category"](color_stops);
      } else {
        self.colorizer["category"] = _.wrap(
          d3.scale
            .linear()
            .domain(_.range(kGlobals.network.ContinuousColorStops))
            .range(["#fff7ec", "#7f0000"])
            .interpolate(d3.interpolateRgb),
          (func, arg) => {
            self.uniqValues[cat_id]["min"] = "#fff7ec";
            self.uniqValues[cat_id]["max"] = "#7f0000";

            return func(
              graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"](
                arg
              ) *
                (1 / kGlobals.network.ContinuousColorStops)
            );
          }
        );
      }

      if (
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
      ) {
        // get min and max
        const min =
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
            "min"
          ] || self.uniqValues[cat_id]["min"];
        const max =
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
            "max"
          ] || self.uniqValues[cat_id]["max"];

        self.uniqValues[cat_id]["min"] =
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
            "min"
          ] || self.uniqValues[cat_id]["min"];
        self.uniqValues[cat_id]["max"] =
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
            "max"
          ] || self.uniqValues[cat_id]["max"];

        self.colorizer["category"] = _.wrap(
          d3.scale
            .linear()
            .domain(_.range(color_stops))
            .range([min, max])
            .interpolate(d3.interpolateRgb),
          (func, arg) =>
            func(
              graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"](
                arg
              ) *
                (1 / color_stops)
            )
        );
      }

      self.colorizer["category_id"] = cat_id;
      self.colorizer["continuous"] = true;
      self.clusters.forEach((the_cluster) => {
        the_cluster["gradient"] = compute_cluster_gradient(the_cluster, cat_id);
      });

      var points = [];

      _.each(self.edges, (e) => {
        var src = self.attribute_node_value_by_id(
            self.nodes[e.source],
            cat_id,
            true
          ),
          tgt = self.attribute_node_value_by_id(
            self.nodes[e.target],
            cat_id,
            true
          );

        if (src !== kGlobals.missing.label && tgt !== kGlobals.missing.label) {
          points.push({
            x: src,
            y: tgt,
            title:
              self.nodes[e.source].id +
              " (" +
              src +
              ") -- " +
              self.nodes[e.target].id +
              " (" +
              tgt +
              ")",
          });
        }
      });
      d3.select(
        self.get_ui_element_selector_by_role("aux_svg_holder_enclosed", true)
      ).style("display", null);

      scatterPlot.scatterPlot(
        points,
        400,
        400,
        self.get_ui_element_selector_by_role("aux_svg_holder", true),
        {
          x: "Source",
          y: "Target",
        },
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["type"] === "Date"
      );
    } else {
      self.colorizer["category"] = null;
      self.colorizer["category_id"] = null;
      self.colorizer["continuous"] = false;
      self.colorizer["category_pairwise"] = null;
      self.colorizer["category_map"] = null;
    }

    // Draw color picker for manual override
    self.renderColorPicker(cat_id, "continuous");

    self.draw_attribute_labels();
    self.update(true);

    if (d3.event) {
      d3.event.preventDefault();
    }
  };

  /**
   * @function define_node_search_table
   * @description Defines the node search table using jQuery QueryBuilder.
   * @returns {void}
   */
  self.define_node_search_table = function () {
    if (self.isMJCNetwork) {
      return;
    }

    self.node_search_div = self.get_ui_element_selector_by_role(
      "node_search_div",
      true
    );

    if (self.node_search_div && self.isPrimaryGraph) {
      const compute_type = (t, d) => {
        if (t == "String") return "string";
        if (t == "Number") return d.is_integer ? "integer" : "double";
        if (t == "Date") return "date";
        return "string";
      };

      self.node_search_attributes = self._extract_exportable_attributes(false);

      self.qb_filter_def = _.sortBy(
        _.map(self.node_search_attributes, (d) => {
          let def = {
            id: d.raw_attribute_key,
            label: d.label,
            type: compute_type(d.type, d),
          };

          if (d.enum) {
            def.values = _.map(_.clone(d.enum), (d) => ({
              value: d,
              label: _.escape(d),
            }));
            def.input = "select";
          }

          if (def.type == "date") {
            def.plugin = "datepicker";
            def.plugin_config = {
              format: "yyyy/mm/dd",
              todayBtn: "linked",
              todayHighlight: true,
              autoclose: true,
            };
            def.operators = [
              "equal",
              "not equal",
              "less",
              "less_or_equal",
              "greater",
              "greater_or_equal",
            ];
          } else {
            if (def.type == "string") {
              def.operators = [
                "equal",
                "not equal",
                "contains",
                "begins_with",
                "ends_with",
                "is_empty",
                "is_not_empty",
              ];
            } else if (def.type == "integer" || def.type == "double") {
              def.operators = [
                "equal",
                "not equal",
                "less",
                "less_or_equal",
                "greater",
                "greater_or_equal",
                "between",
              ];
            }
          }
          return def;
        }),
        (d) => d.label
      );

      if (self.nodeFilterObject) {
        try {
          if (_.isEqual(self.nodeFilterObject, self.qb_filter_def)) {
            return;
          }
        } catch (err) {
          console.log(err);
        }
        $(self.node_search_div).queryBuilder("destroy");
        self.nodeFilterObject = null;
        self.aggregate_entity_data = null;
      }

      let query_buttons = d3
        .select(self.node_search_div)
        .selectAll('[data-hivtrace-ui-role="node-selector-search-buttonbar"]');

      if (query_buttons.empty()) {
        d3.select(self.node_search_div)
          .append("div")
          .classed("alert alert-info alert-dismissible", true)
          .style("font-size", "150%")
          .text(
            "Please define some search criteria to find and display information on persons in the network. By default, no persons are displayed."
          )
          .append("button")
          .classed("close", true)
          .attr("data-dismiss", "alert")
          .append("span")
          .html("&times;");

        /*
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
                */

        query_buttons = d3
          .select(self.node_search_div)
          .append("div")
          .classed("btn-group btn-group-sm", true)
          .attr("data-hivtrace-ui-role", "node-selector-search-buttonbar");
        self.node_query_button_reset = query_buttons
          .append("button")
          .text("Reset")
          .classed("btn btn-warning", true);
        self.node_query_button_search = query_buttons
          .append("button")
          .text("Search")
          .classed("btn btn-primary", true);
      }

      self.nodeFilterObject = _.clone(self.qb_filter_def);

      let qb = $(self.node_search_div).queryBuilder({
        plugins: {
          "filter-description": null,
          "bt-tooltip-errors": null,
          "not-group": null,
        },
        filters: self.qb_filter_def,
      });

      d3.select($(self.node_search_div).get(0))
        .selectAll(".group-conditions")
        .selectAll("label")
        .classed("btn-primary", false)
        .classed("btn-default", true);

      $(self.node_search_div).on(
        "afterInit.queryBuilder afterSetRules.queryBuilder afterAddGroup.queryBuilder",
        function (e, level) {
          d3.select($(self.node_search_div).get(0))
            .selectAll(".group-conditions")
            .selectAll("label")
            .classed("btn-primary", false)
            .classed("btn-default", true);
        }
      );

      /**
       * @function process_search_field
       * @description Processes a single search condition against a value.
       * @param {*} value - The value to check.
       * @param {Object} condition - The search condition.
       * @returns {boolean} True if the value meets the condition, false otherwise.
       */
      self.process_search_field = (value, condition) => {
        switch (condition.type) {
          case "string": {
            if (!value) value = "";
            value = value.toLowerCase();
            switch (condition.operator) {
              case "equal":
                return value == condition.value;
              case "not equal":
                return value != condition.value;
              case "contains":
                return value.indexOf(condition.value) >= 0;
              case "begins_with":
                return value.indexOf(condition.value) == 0;
              case "ends_with":
                return (
                  value.indexOf(condition.value) ==
                  Math.max(0, value.length - condition.value.length)
                );
              case "is_not_empty":
                return value.length > 0;
              case "is_empty":
                return value.length == 0;
            }
            break;
          }
          case "date":
          case "integer":
          case "double": {
            if (
              value === null ||
              value === undefined ||
              value === "" ||
              (typeof value === "number" && isNaN(value))
            )
              return false;
            switch (condition.operator) {
              case "equal":
                return value == condition.value;
              case "not equal":
                return value != condition.value;
              case "less":
                return value < condition.value;
              case "less_or_equal":
                return value <= condition.value;
              case "greater":
                return value > condition.value;
              case "greater_or_equal":
                return value >= condition.value;
              case "between":
                return (
                  value >= condition.value[0] && value <= condition.value[1]
                );
            }
            break;
          }
        }
        return false;
      };

      /**
       * @function process_search
       * @description Processes a set of search rules against a data object.
       * @param {Object} data - The data object to check.
       * @param {Object} rules - The search rules.
       * @returns {boolean} True if the data object meets the search criteria, false otherwise.
       */
      self.process_search = (data, rules) => {
        let rule_results;
        if (rules.rules) {
          rule_results = _.map(rules.rules, (r) => {
            return self.process_search(data, r);
          });
        } else {
          return self.process_search_field(
            self.attribute_node_value_by_id(
              data,
              rules.id,
              rules.type == "number"
            ),
            rules
          );
        }

        if (rules.condition == "AND") {
          rule_results = _.every(rule_results, (d) => d);
        } else if (rules.condition == "OR") {
          rule_results = _.some(rule_results, (d) => d);
        } else {
          rule_results = false;
        }

        return rules.not ? !rule_results : rule_results;
      };

      /**
       * @function rule_lc
       * @description Converts string values in search rules to lowercase.
       * @param {Object} rules - The search rules to process.
       * @returns {void}
       */
      self.rule_lc = (rules) => {
        if (rules.rules) {
          _.each(rules.rules, (r) => {
            self.rule_lc(r);
          });
        } else {
          if (rules.value) {
            if (rules.type == "string") {
              rules.value = rules.value.toLowerCase();
            } else if (rules.type == "date") {
              rules.value = timeDateUtil.DateViewNodeSearch.parse(rules.value);
            }
          }
        }
      };

      if (!self.aggregate_entity_data) {
        self.aggregate_entity_data = self.aggregate_indvidual_level_records();
      }

      self.node_query_button_reset.on("click", (d) => {
        $(self.node_search_div).queryBuilder("reset");
        self.draw_extended_node_table([], null, null, {
          "no-filter": true,
        });
      });

      self.node_query_button_search.on("click", (d) => {
        var result = $(self.node_search_div).queryBuilder("getRules");
        if (!$.isEmptyObject(result)) {
          self.rule_lc(result);
          self.draw_extended_node_table(
            _.filter(self.aggregate_entity_data, (d) =>
              self.process_search(d, result)
            ),
            null,
            null,
            { "no-filter": true }
          );
        } else {
          self.draw_extended_node_table([], null, null, {
            "no-filter": true,
          });
        }
      });
    }

    if (self.isPrimaryGraph) {
      self.draw_extended_node_table([], null, null, { "no-filter": true });
    }
  };

  /**
   * @function handle_attribute_categorical
   * @description Handles the selection of a categorical attribute to be used for node color.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @param {boolean} skip_update - If true, skips updating the network visualization after applying the new color scheme.
   * @returns {void}
   */
  self.handle_attribute_categorical = function (cat_id, skip_update) {
    if (self.post_init_callbacks) {
      self.post_init_callbacks.push(() => {
        self.handle_attribute_categorical(cat_id, skip_update);
      });
      return;
    }
    var set_attr = "None";

    d3.select(self.get_ui_element_selector_by_role("attributes_invert")).style(
      "display",
      "none"
    );

    self.network_svg.selectAll("radialGradient").remove();

    [
      ["attributes", false],
      ["attributes_cat", true],
    ].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d && d[1] === cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(
        self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])
      ).html("Color: " + set_attr + ' <span class="caret"></span>');
    });

    self.clusters.forEach((the_cluster) => {
      delete the_cluster["gradient"];
      the_cluster["binned_attributes"] = stratify(
        attribute_cluster_distribution(the_cluster, cat_id)
      );
    });

    self.colorizer["continuous"] = false;

    //TODO -- if preset color scheme does not exist, create one and always use the logic here.

    if (cat_id) {
      if (cat_id in self.networkColorScheme) {
        let cat_data =
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["enum"];
        if (cat_data) {
          cat_data = new Set(_.map(cat_data, (d) => d.toLowerCase()));
        }
        var domain = [],
          range = [];
        _.each(self.networkColorScheme[cat_id], (value, key) => {
          if (cat_data) {
            if (!cat_data.has(key.toLowerCase())) {
              return;
            }
          }
          domain.push(key);
          range.push(value);
        });
        self.colorizer["category"] = d3.scale
          .ordinal()
          .domain(domain)
          .range(range);
      } else if (
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_scale"]
      ) {
        self.colorizer["category"] = graph_data[
          kGlobals.network.GraphAttrbuteID
        ][cat_id]["color_scale"](
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id],
          self
        );
      } else {
        self.colorizer["category"] = d3.scale
          .ordinal()
          .range(kGlobals.Categorical);

        var extended_range = _.clone(self.colorizer["category"].range());
        extended_range.push(kGlobals.missing.color);

        self.colorizer["category"].domain(
          _.range(kGlobals.MaximumValuesInCategories + 1)
        );

        self.colorizer["category"].range(extended_range);

        if (
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id][
            "stable-ish order"
          ]
        ) {
          self.colorizer["category"] = _.wrap(
            self.colorizer["category"],
            (func, arg) => {
              if (arg === kGlobals.missing.label) {
                return func(kGlobals.MaximumValuesInCategories);
              }

              const ci = graph_data[kGlobals.network.GraphAttrbuteID][cat_id];

              if (ci["reduced_value_range"]) {
                if (!(arg in ci["reduced_value_range"])) {
                  arg = kGlobals.network.ReducedValue;
                }
              }

              return func(ci["stable-ish order"][arg]);
            }
          );
          //console.log (graph_data[kGlobals.network.GraphAttrbuteID][cat_id]['stable-ish order']);
        }
      }

      if (
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
      ) {
        self.colorizer["category"] = _.wrap(
          self.colorizer["category"],
          (func, arg) => {
            if (
              arg in
              graph_data[kGlobals.network.GraphAttrbuteID][cat_id][
                "user-defined"
              ]
            ) {
              return graph_data[kGlobals.network.GraphAttrbuteID][cat_id][
                "user-defined"
              ][arg];
            }
            return func(arg);
          }
        );
      }

      self.colorizer["category_id"] = cat_id;
      self.colorizer["category_map"] =
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"];

      //console.log (cat_id, self.json[kGlobals.network.GraphAttrbuteID][cat_id], graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"] (null, "lookup"));
      //self.colorizer['category_map'][null] =  graph_data [kGlobals.network.GraphAttrbuteID][cat_id]['range'];

      //try {
      //console.log (self.colorizer["category_map"]);
      self.colorizer["category_pairwise"] = attribute_pairwise_distribution(
        cat_id,
        self._aux_get_attribute_dimension(cat_id),
        self.colorizer["category_map"]
      );
      //} catch (err) {
      // TODO: there are still lingering issues with this "category_map"
      //}

      render_chord_diagram(
        "aux_svg_holder",
        self.colorizer["category_map"],
        self.colorizer["category_pairwise"]
      );
      render_binned_table(
        "attribute_table",
        self.colorizer["category_map"],
        self.colorizer["category_pairwise"]
      );
    } else {
      self.colorizer["category"] = null;
      self.colorizer["category_id"] = null;
      self.colorizer["category_pairwise"] = null;
      self.colorizer["category_map"] = null;
      render_chord_diagram("aux_svg_holder", null, null);
      render_binned_table("attribute_table", null, null);
    }
    if (self.handle_inline_charts) {
      self.handle_inline_charts();
    }

    self.draw_attribute_labels();
    self.update(true);
    if (d3.event) {
      d3.event.preventDefault();
    }

    // Draw color picker for manual override
    self.renderColorPicker(cat_id, "categorical");
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

      if (n.match_filter) {
        var parent_cluster =
          self.cluster_mapping && self.cluster_mapping[n.cluster] !== undefined
            ? self.clusters[self.cluster_mapping[n.cluster]]
            : null;
        if (parent_cluster) {
          parent_cluster.match_filter += 1;
        }
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
    if (
      !d.source ||
      !d.target ||
      typeof d.source.x === "undefined" ||
      typeof d.source.y === "undefined" ||
      typeof d.target.x === "undefined" ||
      typeof d.target.y === "undefined" ||
      isNaN(d.source.x) ||
      isNaN(d.source.y) ||
      isNaN(d.target.x) ||
      isNaN(d.target.y)
    ) {
      return;
    }

    var pull = d.pull || 0.0;
    var path;

    if (pull !== 0.0) {
      var dist_x = d.target.x - d.source.x;
      var dist_y = d.target.y - d.source.y;
      pull *= Math.sqrt(dist_x * dist_x + dist_y * dist_y);

      var theta = Math.PI / 6; // 18deg additive angle

      var alpha = dist_x ? Math.atan(-dist_y / dist_x) : Math.PI / 2; // angle with the X axis

      if (pull < 0) {
        theta = -theta;
        pull = -pull;
      }

      var dx = Math.cos(theta + alpha) * pull,
        dx2 = Math.cos(theta - alpha) * pull;

      var dy = Math.sin(theta + alpha) * pull,
        dy2 = Math.sin(theta - alpha) * pull;

      var s1, s2;
      if (d.target.x >= d.source.x) {
        s1 = [dx, -dy];
        s2 = [-dx2, -dy2];
      } else {
        s1 = [-dx2, -dy2];
        s2 = [dx, -dy];
      }

      path =
        "M" +
        d.source.x +
        " " +
        d.source.y +
        " C " +
        (d.source.x + s1[0]) +
        " " +
        (d.source.y + s1[1]) +
        ", " +
        (d.target.x + s2[0]) +
        " " +
        (d.target.y + s2[1]) +
        ", " +
        d.target.x +
        " " +
        d.target.y;
    } else {
      path =
        "M" +
        d.source.x +
        " " +
        d.source.y +
        " L " +
        d.target.x +
        " " +
        d.target.y;
    }

    d3.select(this).attr("d", path);
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
      ) &&
      !(self.isMJCNetwork && !self.fullMJCNetwork)
    ) {
      // compute priority clusters
      self.annotate_priority_clusters(
        timeDateUtil._networkCDCDateField,
        36,
        12
      );

      /*try {
        if (self.isPrimaryGraph) {
          self.priority_groups_compute_node_membership();
        }
      } catch (err) {
        console.log(err);
      }*/
    }

    if (self.isMJCNetwork && !self.fullMJCNetwork) {
      d3.select(self.container)
        .selectAll(".my_progress")
        .style("display", "none");
      // The redacted MJC view renders no network/tables and returns early, so
      // nothing downstream would clear the generic loading overlay. Tear it
      // down here so the page does not hang on "Analyzing Network Data".
      if (typeof window !== "undefined") {
        if (window.perfMeasurements) {
          window.perfMeasurements.done = true;
        }
        if (window.finalizeNetworkLoading) {
          window.finalizeNetworkLoading();
        }
      }
      return;
    }

    var rendered_nodes, rendered_clusters, link;
    var draw_me;

    if (!soft) {
      window.updateNetworkLoadingStatus("Preparing data to graph...");
      draw_me = prepare_data_to_graph();
      network_layout.nodes(draw_me.all).links(draw_me.edges);
      update_network_string(draw_me.nodes.length, draw_me.edges.length);

      if (
        self._is_CDC_ &&
        !(options && options["no-subclusters"]) &&
        options &&
        options["no-subcluster-compute"]
      ) {
        window.updateNetworkLoadingStatus("Computing subclusters...");

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
    }

    // 2. Defer heavy SVG rendering and layout to a timeout to yield control to the browser.
    // This allows the browser to paint and display the tables first!
    setTimeout(() => {
      self.needs_an_update = false;

      if (options && options["extra-graphics"]) {
        options["extra-graphics"].call(null, self, options);
      }

      if (friction) {
        network_layout.friction(friction);
      }
      self.display_warning(self.warning_string, true);

      function runSteps(steps, index) {
        if (index >= steps.length) {
          d3.select(self.container)
            .selectAll(".my_progress")
            .style("display", "none");
          self.network_svg.selectAll(".svg-loading-placeholder").remove();
          self.draw_attribute_labels();
          // Empty result (e.g. a cluster of interest that resolves to a single
          // isolated node at a strict link distance): nothing is drawn, so show a
          // notice instead of a blank canvas.
          if (self.network_svg.selectAll(".node").empty()) {
            self.network_svg
              .append("text")
              .classed("svg-empty-placeholder", true)
              .attr("x", (self.width + self.margin.left + self.margin.right) / 2)
              .attr("y", self.margin.top + 30)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .style("font-size", "18px")
              .style("fill", "#666666")
              .style("font-family", "sans-serif")
              .text("No nodes to display at this link distance.");
          }
          // Network render + layout are complete. Tear down the generic loading
          // overlay (installed by initializeLoadingScreen) for pages that boot
          // without the window.init interceptor, e.g. the secure app.
          if (typeof window !== "undefined") {
            if (window.perfMeasurements) {
              window.perfMeasurements.done = true;
            }
            if (window.finalizeNetworkLoading) {
              window.finalizeNetworkLoading();
            }
          }
          return;
        }
        setTimeout(() => {
          steps[index](() => {
            runSteps(steps, index + 1);
          });
        }, 0);
      }

      if (!soft) {
        const steps = [
          // Step 1: Draw Clusters Table (Async/Chunked)
          (cb) => {
            console.time("[PERF] self.draw_cluster_table");
            self.draw_cluster_table(
              self.extra_cluster_table_columns,
              self.cluster_table,
              null,
              () => {
                console.timeEnd("[PERF] self.draw_cluster_table");
                cb();
              }
            );
          },
          // Step 2: Draw Subclusters Table (Async/Chunked)
          (cb) => {
            if (self.subcluster_table) {
              console.time("[PERF] self.draw_subcluster_table");
              self.draw_cluster_table(
                self.extra_subcluster_table_columns,
                self.subcluster_table,
                {
                  "no-clusters": true,
                  subclusters: true,
                  headers: function (headers) {
                    headers[0][0].value = "Subcluster ID";
                    headers[0][0].help = "Unique subcluster ID";
                    headers[0][2].help =
                      "Number of total cases in the subcluster";
                  },
                },
                () => {
                  console.timeEnd("[PERF] self.draw_subcluster_table");
                  cb();
                }
              );
            } else {
              cb();
            }
          },
          // Step 3: Draw Node Table (Async/Chunked)
          (cb) => {
            if (self._is_CDC_) {
              cb();
            } else {
              self.draw_node_table(self.extra_node_table_columns, null, null, {
                "no-filter": true,
              });
              cb();
            }
          },
          // Step 4: Edge set calculation
          (cb) => {
            window.updateNetworkLoadingStatus("Analyzing network links...");
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
            cb();
          },

          // Step 2: Draw links (append SVG paths in chunks)
          (cb) => {
            window.updateNetworkLoadingStatus("Rendering link elements...");
            self.network_svg.selectAll(".svg-loading-placeholder").remove();
            link = self.network_svg
              .selectAll(".link")
              .data(draw_me.edges, (d) => d.id);

            var enter_data = draw_me.edges;
            link.exit().remove();

            var chunk_size = 1000;
            var index = 0;
            function appendLinksChunk() {
              var end = Math.min(index + chunk_size, enter_data.length);
              for (var i = index; i < end; i++) {
                var d = enter_data[i];
                var path = self.network_svg
                  .append("path")
                  .datum(d)
                  .classed("link", true)
                  .classed(
                    "removed",
                    self.highlight_unsuppored_edges && d.removed
                  )
                  .classed(
                    "unsupported",
                    self.highlight_unsuppored_edges &&
                      "support" in d &&
                      d["support"] > 0.05
                  )
                  .classed("core-link", d["length"] <= self.core_link_length)
                  .classed("mspp-link", d["weight"] > 1)
                  .on("mouseover", edge_pop_on)
                  .on("mouseout", edge_pop_off);

                if (d.directed) {
                  path.attr(
                    "marker-end",
                    "url(#" + self.dom_prefix + "_arrowhead)"
                  );
                }
              }
              index = end;
              if (index < enter_data.length) {
                setTimeout(appendLinksChunk, 1);
              } else {
                cb();
              }
            }
            appendLinksChunk();
          },

          // Step 3: Draw nodes and clusters (append SVG groups/paths in chunks)
          (cb) => {
            window.updateNetworkLoadingStatus("Rendering node elements...");
            rendered_nodes = self.network_svg
              .selectAll(".node")
              .data(draw_me.nodes, (d) => d.id);

            var node_enter_data = draw_me.nodes;
            rendered_nodes.exit().remove();

            rendered_clusters = self.network_svg
              .selectAll(".cluster-group")
              .data(
                draw_me.clusters.map((d) => d),
                (d) => d.cluster_id
              );

            rendered_clusters.exit().remove();
            rendered_clusters
              .enter()
              .append("g")
              .attr("class", "cluster-group")
              .attr("transform", (d) => {
                const x =
                  isNaN(d.x) || typeof d.x === "undefined"
                    ? self.width / 2 || 0
                    : d.x;
                const y =
                  isNaN(d.y) || typeof d.y === "undefined"
                    ? self.height / 2 || 0
                    : d.y;
                return "translate(" + x + "," + y + ")";
              })
              .on("click", (d) => network.handle_cluster_click(self, d))
              .on("mouseover", cluster_pop_on)
              .on("mouseout", cluster_pop_off)
              .call(network_layout.drag().on("dragstart", cluster_pop_off));

            var node_chunk_size = 1000;
            var node_index = 0;
            function appendNodesChunk() {
              var end = Math.min(
                node_index + node_chunk_size,
                node_enter_data.length
              );
              for (var i = node_index; i < end; i++) {
                var d = node_enter_data[i];
                var g = self.network_svg
                  .append("g")
                  .datum(d)
                  .classed("node", true);
                g.append("path");
              }
              node_index = end;
              if (node_index < node_enter_data.length) {
                setTimeout(appendNodesChunk, 1);
              } else {
                cb();
              }
            }
            appendNodesChunk();
          },

          // Step 4: Render objects counts and detail styling (Chunked)
          (cb) => {
            window.updateNetworkLoadingStatus("Styling nodes and clusters...");
            rendered_nodes = self.network_svg.selectAll(".node");
            link = self.network_svg.selectAll(".link");
            rendered_clusters = self.network_svg.selectAll(".cluster-group");

            self.rendered_object_counts = {
              nodes: rendered_nodes.size(),
              edges: link.size(),
              clusters: rendered_clusters.size(),
              has_hatching: false,
            };

            var nodes_array = rendered_nodes[0];
            var node_style_index = 0;
            function styleNodesChunk() {
              var end = Math.min(node_style_index + 1000, nodes_array.length);
              for (var i = node_style_index; i < end; i++) {
                var node_el = nodes_array[i];
                if (node_el) {
                  var d = d3.select(node_el).datum();
                  draw_a_node(node_el, d);
                  self.rendered_object_counts.has_hatching =
                    self.rendered_object_counts.has_hatching ||
                    node_multiple_membership(d);
                }
              }
              node_style_index = end;
              if (node_style_index < nodes_array.length) {
                setTimeout(styleNodesChunk, 1);
              } else {
                styleClusters();
              }
            }

            function styleClusters() {
              rendered_clusters.each(function (d) {
                draw_a_cluster(this, d);
              });
              styleLinks();
            }

            var links_array = link[0];
            var link_style_index = 0;
            function styleLinks() {
              var end = Math.min(link_style_index + 1000, links_array.length);
              for (var i = link_style_index; i < end; i++) {
                var link_el = links_array[i];
                if (link_el) {
                  var d = d3.select(link_el).datum();
                  var opacity = Math.max(
                    node_opacity(d.target),
                    node_opacity(d.source)
                  );
                  d3.select(link_el).style("opacity", opacity);
                  if (self.additional_edge_styler) {
                    self.additional_edge_styler(link_el, d, self);
                  }
                  var display;
                  if (
                    d.target.is_hidden ||
                    d.source.is_hidden ||
                    d.is_hidden ||
                    d.target.mjc_hidden ||
                    d.source.mjc_hidden
                  ) {
                    display = "none";
                  } else if (
                    self._node_filter_visible_ids &&
                    (!self._node_filter_visible_ids.has(d.target.id) ||
                      !self._node_filter_visible_ids.has(d.source.id))
                  ) {
                    display = "none";
                  } else {
                    display = null;
                  }
                  d3.select(link_el)
                    .style("display", display)
                    .classed(
                      "selected_object",
                      d.ref.length_filter && !self.hide_unselected
                    );
                }
              }
              link_style_index = end;
              if (link_style_index < links_array.length) {
                setTimeout(styleLinks, 1);
              } else {
                cb();
              }
            }

            styleNodesChunk();
          },

          // Step 5: Setup force layout tick and start
          (cb) => {
            window.updateNetworkLoadingStatus("Starting layout simulation...");
            currently_displayed_objects =
              rendered_clusters[0].length + rendered_nodes[0].length;

            network_layout.on("tick", null); // Clear default listener during batching
            network_layout.start();
            network_layout.stop();

            function updateDOMPositions() {
              var sizes = network_layout.size();

              rendered_nodes.attr("transform", (d) => {
                // Defalut values (just to keep nodes in the svg container rectangle).
                var xBoundLower = 10;
                var xBoundUpper = sizes[0] - 10;
                var yBoundLower = 10;
                var yBoundUpper = sizes[1] - 10;

                if (self.showing_on_map) {
                  const allowed_offset_from_center_of_country = 15;
                  // If the country is in the list that we have, override the default values for the bounds.
                  var country_code = self._get_node_country(d);

                  if (country_code in self.countryCentersObject) {
                    const center =
                      self.countryCentersObject[country_code].countryXY;

                    xBoundLower =
                      center[0] - allowed_offset_from_center_of_country;
                    xBoundUpper =
                      center[0] + allowed_offset_from_center_of_country;
                    yBoundLower =
                      center[1] - allowed_offset_from_center_of_country;
                    yBoundUpper =
                      center[1] + allowed_offset_from_center_of_country;
                  }
                }

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
            }

            let lastUpdate = 0;
            function tickBatch() {
              const isInitialLoad =
                window.perfMeasurements && !window.perfMeasurements.done;
              const ticksPerBatch = isInitialLoad ? 40 : 8;

              // Run a batch of layout calculations asynchronously
              for (let i = 0; i < ticksPerBatch; i++) {
                network_layout.tick();
                if (network_layout.alpha() < 0.005) {
                  break;
                }
              }

              const alpha = network_layout.alpha();
              const isEnd = alpha < 0.005;

              // Update DOM elements only if it is the end, or if we are not in initial load,
              // or periodically (e.g. every 250ms) to show progress.
              const now = Date.now();
              if (isEnd || !isInitialLoad || now - lastUpdate > 250) {
                updateDOMPositions();
                lastUpdate = now;
              }

              if (window.perfMeasurements && !window.perfMeasurements.done) {
                const progress = Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round((1 - (alpha - 0.005) / (0.1 - 0.005)) * 100)
                  )
                );
                window.updateNetworkLoadingStatus(
                  `Generating layout & SVG... (${progress}%)`
                );
              }

              if (isEnd) {
                // Restore standard tick handler for interactive drag actions
                network_layout.on("tick", updateDOMPositions);
                network_layout.start();
                if (window.perfMeasurements && !window.perfMeasurements.done) {
                  window.perfMeasurements.done = true;
                  if (window.finalizeNetworkLoading) {
                    window.finalizeNetworkLoading();
                  }
                }
                cb();
              } else {
                setTimeout(tickBatch, 1);
              }
            }

            setTimeout(tickBatch, 1);
          },
        ];

        runSteps(steps, 0);
      } else {
        rendered_nodes = self.network_svg.selectAll(".node");
        rendered_clusters = self.network_svg.selectAll(".cluster-group");
        link = self.network_svg.selectAll(".link");
        update_network_string(rendered_nodes.size(), link.size());

        self.rendered_object_counts = {
          nodes: rendered_nodes.size(),
          edges: link.size(),
          clusters: rendered_clusters.size(),
          has_hatching: false,
        };

        rendered_nodes.each(function (d) {
          draw_a_node(this, d);
          self.rendered_object_counts.has_hatching =
            self.rendered_object_counts.has_hatching ||
            node_multiple_membership(d);
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
            if (
              d.target.is_hidden ||
              d.source.is_hidden ||
              d.is_hidden ||
              d.target.mjc_hidden ||
              d.source.mjc_hidden
            ) {
              return "none";
            }
            if (
              self._node_filter_visible_ids &&
              (!self._node_filter_visible_ids.has(d.target.id) ||
                !self._node_filter_visible_ids.has(d.source.id))
            ) {
              return "none";
            }
            return null;
          })
          .classed(
            "selected_object",
            (d) => d.ref.length_filter && !self.hide_unselected
          );

        link.each(self.link_generator_function);
        d3.select(self.container)
          .selectAll(".my_progress")
          .style("display", "none");
        self.draw_attribute_labels();
      }
    }, 20);
  };

  /**
   * @function tick
   * @description Updates the positions of nodes and links during each tick of the network layout.
   * @returns {void}
   */
  function tick() {
    if (self.isMJCNetwork && !self.fullMJCNetwork) {
      return;
    }

    if (typeof node === "undefined" || typeof link === "undefined") {
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
      if (id === "sequence_status") {
        let status = "Sequenced";
        if (d[kGlobals.network.NodeAttributeID]) {
          const has_seq = d[kGlobals.network.NodeAttributeID].has_sequence !== undefined
            ? d[kGlobals.network.NodeAttributeID].has_sequence
            : d[kGlobals.network.NodeAttributeID].sequence_status !== "none";
          const poor_val = d[kGlobals.network.NodeAttributeID].poor_quality;
          const is_poor = poor_val === 1 ||
                          poor_val === "1" ||
                          poor_val === true ||
                          (typeof poor_val === "string" && poor_val.toLowerCase() === "yes");
          if (is_poor) {
            status = "Poor Quality";
          } else if (has_seq) {
            status = "Sequenced";
          } else {
            status = "Unsequenced";
          }
        }
        return status;
      }
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
    if (self.showing_on_map) {
      return 50;
    }
    var r = 5 + Math.sqrt(d.degree); //return (d.match_filter ? 10 : 4)*r*r;
    return 4 * r * r;
  }

  /**
   * @function node_multiple_membership
   * @description Checks if a node has the 'multiple_membership' attribute.
   * @param {Object} n - The node object.
   * @returns {boolean} True if the node has multiple memberships, false otherwise.
   */
  function node_multiple_membership(n) {
    return n["multiple_membership"];
  }

  /**
   * @function node_color
   * @description Determines the color of a node based on its attributes and the current colorizer settings.
   * @param {Object} d - The node object.
   * @returns {string} The color of the node.
   */
  function node_color(d) {
    var hms = (d, c) => {
      if (node_multiple_membership(d)) {
        return "url(#" + self.generate_cross_hatch_pattern(c) + ")";
      }
      return c;
    };

    if (self.colorizer["category_id"]) {
      var v = self.attribute_node_value_by_id(d, self.colorizer["category_id"]);
      if (self.colorizer["continuous"]) {
        if (v === kGlobals.missing.label) {
          return hms(d, kGlobals.missing.color);
        }
        //console.log (v, self.colorizer['category'](v));
      }
      return hms(d, self.colorizer["category"](v));
    }

    if (d.hxb2_linked) {
      return hms(d, "black");
    }

    if (d.is_lanl) {
      return hms(d, "red");
    }

    return hms(d, "gray");
  }

  /**
   * @function node_opacity
   * @description Determines the opacity of a node based on the current opacity settings.
   * @param {Object} d - The node object.
   * @returns {number} The opacity of the node.
   */
  function node_opacity(d) {
    if (self.colorizer["opacity"]) {
      return self.colorizer["opacity"](
        self.attribute_node_value_by_id(d, self.colorizer["opacity_id"], true)
      );
    }
    return 1;
  }

  /**
   * @function cluster_color
   * @description Determines the color of a cluster based on its attributes.
   * @param {Object} d - The cluster object.
   * @param {string} type - The type of the cluster.
   * @returns {string} The color of the cluster.
   */
  function cluster_color(d, type) {
    if (d["binned_attributes"]) {
      return self.colorizer["category"](type);
    }
    return "#bdbdbd";
  }

  /**
   * @function node_info_string
   * @description Generates an information string for a node, including its degree, clustering coefficient, and other attributes.
   * @param {Object} n - The node object.
   * @returns {string} The information string for the node.
   */
  function node_info_string(n) {
    var str;

    if (!self._is_CDC_) {
      str =
        "Degree <em>" +
        n.degree +
        "</em><br>Clustering coefficient <em> " +
        misc.format_value(n.lcc, kGlobals.formats.FloatFormat) +
        "</em>";
    } else {
      str = "# links <em>" + n.degree + "</em>";
      try {
        if (
          n[kGlobals.network.AliasedSequencesID] &&
          n[kGlobals.network.AliasedSequencesID].length > 1
        ) {
          str +=
            "<br> Represents <em>" +
            n[kGlobals.network.AliasedSequencesID].length +
            "</em> sequences";
        }
      } catch {}
    }

    _.each(
      _.union(self._additional_node_pop_fields, [
        self.colorizer["category_id"],
        self.node_shaper["id"],
        self.colorizer["opacity_id"],
      ]),
      (key) => {
        if (key) {
          if (key in graph_data[kGlobals.network.GraphAttrbuteID]) {
            var attribute = self.attribute_node_value_by_id(n, key);

            if (
              graph_data[kGlobals.network.GraphAttrbuteID][key]["type"] ===
              "Date"
            ) {
              try {
                attribute = timeDateUtil.DateViewFormat(attribute);
              } catch (err) {
                // do nothing
              }
            }
            if (attribute) {
              str +=
                "<br>" +
                graph_data[kGlobals.network.GraphAttrbuteID][key].label +
                " <em>" +
                attribute +
                "</em>";
            }
          }
        }
      }
    );

    return str;
  }

  /**
   * @function edge_info_string
   * @description Generates an information string for an edge, including its length and support.
   * @param {Object} n - The edge object.
   * @returns {string} The information string for the edge.
   */
  function edge_info_string(n) {
    var str = "Length <em>" + kGlobals.formats.FloatFormat(n.length) + "</em>";
    if ("support" in n) {
      str +=
        "<br>Worst triangle-based support (p): <em>" +
        kGlobals.formats.FloatFormat(n.support) +
        "</em>";
    }

    return str;
  }

  /**
   * @function node_pop_on
   * @description Shows a tooltip for a node when the mouse is over it.
   * @param {Object} d - The node object.
   * @returns {void}
   */
  function node_pop_on(d) {
    if (d3.event.defaultPrevented) return;

    toggle_tooltip(
      this,
      true,
      (self._is_CDC_ ? "Individual " : "Node ") + self.entity_id(d),
      node_info_string(d),
      self.container
    );
  }

  /**
   * @function node_pop_off
   * @description Hides the tooltip for a node when the mouse is no longer over it.
   * @param {Object} d - The node object.
   * @returns {void}
   */
  function node_pop_off(d) {
    if (d3.event.defaultPrevented) return;

    toggle_tooltip(this, false);
  }

  /**
   * @function edge_pop_on
   * @description Shows a tooltip for an edge when the mouse is over it.
   * @param {Object} e - The edge object.
   * @returns {void}
   */
  function edge_pop_on(e) {
    toggle_tooltip(
      this,
      true,
      e.source.id + " - " + e.target.id,
      edge_info_string(e),
      self.container
    );
  }

  /**
   * @function edge_pop_off
   * @description Hides the tooltip for an edge when the mouse is no longer over it.
   * @param {Object} d - The edge object.
   * @returns {void}
   */
  function edge_pop_off(d) {
    toggle_tooltip(this, false);
  }

  /*------------ Cluster Methods ---------------*/

  /**
   * Creates a new object that groups nodes by cluster
   * @param {Array<Object>} nodes - An array of node objects.
   * @returns {Object} An object where keys are cluster IDs and values are arrays of nodes.
   */
  function get_all_clusters(nodes) {
    var by_cluster = _.groupBy(nodes, "cluster");
    return by_cluster;
  }

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
  function collapse_cluster(x, keep_in_q) {
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
  }

  /**
   * @function expand_cluster
   * @description Expands a cluster, showing its children nodes.
   * @param {Object} x - The cluster object to expand.
   * @param {boolean} copy_coord - If true, copies coordinates from the parent cluster to the children.
   * @returns {void}
   */
  function expand_cluster(x, copy_coord) {
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
  }

  /**
   * @function render_binned_table
   * @description Renders a table with binned data.
   * @param {string} id - The ID of the table element.
   * @param {Function} the_map - A function that maps values to categories.
   * @param {Array<Array<number>>} matrix - The data matrix to render.
   * @returns {void}
   */
  function render_binned_table(id, the_map, matrix) {
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
  }

  /**
   * @function render_chord_diagram
   * @description Renders a chord diagram to visualize relationships between categories.
   * @param {string} id - The ID of the container element for the diagram.
   * @param {Function} the_map - A function that maps values to categories.
   * @param {Array<Array<number>>} matrix - The data matrix to render.
   * @returns {void}
   */
  function render_chord_diagram(id, the_map, matrix) {
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
  }

  /**
   * @function attribute_pairwise_distribution
   * @description Computes the pairwise distribution of an attribute for the edges in the network.
   * @param {string} id - The ID of the attribute.
   * @param {number} dim - The dimension of the attribute.
   * @param {Function} the_map - A function that maps attribute values to indices.
   * @param {boolean} only_expanded - If true, only considers edges in expanded clusters.
   * @returns {Array<Array<number>>} The pairwise distribution matrix.
   */
  function attribute_pairwise_distribution(id, dim, the_map, only_expanded) {
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
  }

  /**
   * @function _aux_populate_category_fields
   * @description Populates category fields for a given attribute.
   * @param {Object} d - The attribute object.
   * @param {string} k - The key of the attribute.
   * @returns {Object} The updated attribute object.
   */
  self._aux_populate_category_fields = function (d, k) {
    if (d["value_range"]) {
      return d;
    }
    d["raw_attribute_key"] = k;
    if (!("label" in d)) {
      d["label"] = k;
    }
    d.discrete = false;

    if ("enum" in d) {
      d.discrete = true;
      d["value_range"] = new Set(d["enum"]);
      d["value_range"].add(kGlobals.missing.label);

      if (
        _.every(graph_data.Nodes, (nd) =>
          d["value_range"].has(self.attribute_node_value_by_id(nd, k))
        )
      ) {
        d["value_range"] = _.clone(d["enum"]);
        if (!(kGlobals.missing.label in d["value_range"])) {
          d["value_range"].push(kGlobals.missing.label);
        }
        d["dimension"] = d["value_range"].length;
        d["no-sort"] = true;
        return d;
      }

      // confirm that the values in the range are actually in the enum
    }

    if (d["type"] === "String") {
      d.discrete = true;
      d["value_range"] = new Set();

      const node_attr_id = kGlobals.network.NodeAttributeID;
      const is_volatile =
        self.json[kGlobals.network.GraphAttrbuteID][k].volatile;
      const missing_label = kGlobals.missing.label;

      if (is_volatile) {
        const mapper = self.json[kGlobals.network.GraphAttrbuteID][k].map;
        graph_data.Nodes.forEach((nd) => {
          if (nd && node_attr_id in nd && k in nd[node_attr_id]) {
            let v = mapper(nd, self);
            if (typeof v === "string" && v.length === 0) v = missing_label;
            d["value_range"].add(v || missing_label);
          } else {
            d["value_range"].add(missing_label);
          }
        });
      } else {
        graph_data.Nodes.forEach((nd) => {
          if (nd && node_attr_id in nd) {
            const attrs = nd[node_attr_id];
            if (attrs && k in attrs) {
              let v = attrs[k];
              if (typeof v === "string" && v.length === 0) v = missing_label;
              d["value_range"].add(v !== undefined ? v : missing_label);
            } else {
              d["value_range"].add(missing_label);
            }
          } else {
            d["value_range"].add(missing_label);
          }
        });
      }

      d["value_range"] = [...d["value_range"]];
      d["dimension"] = d["value_range"].length;
    }
    return d;
  };

  /**
   * @function _aux_get_attribute_dimension
   * @description Gets the dimension of a categorical attribute.
   * @param {string} cat_id - The ID of the categorical attribute.
   * @returns {number} The dimension of the attribute.
   */
  self._aux_get_attribute_dimension = function (cat_id) {
    if (cat_id in graph_data[kGlobals.network.GraphAttrbuteID]) {
      const cinfo = graph_data[kGlobals.network.GraphAttrbuteID][cat_id];
      if ("reduced_value_range" in cinfo) {
        return _.size(cinfo["reduced_value_range"]);
      }
      return cinfo.dimension;
    }
    return 0;
  };

  /**
   * @function _aux_process_category_values
   * @description Processes the values of a categorical attribute, creating a value map and a stable-ish order.
   * @param {Object} d - The attribute object.
   * @returns {Object} The updated attribute object.
   */
  self._aux_process_category_values = function (d) {
    const cacheKey = d["raw_attribute_key"];
    self._category_cache = self._category_cache || {};
    const cache = self._category_cache[cacheKey];
    if (
      d["stable-ish order"] &&
      cache &&
      cache.nodes_ref === self.nodes &&
      cache.nodes_len === self.nodes.length
    ) {
      return d;
    }

    var values,
      reduced_range = null;

    delete d["reduced_value_range"];
    if (d["no-sort"]) {
      values = d["value_range"];
    } else if (d["type"] === "String") {
      values = d["value_range"].sort();

      if (d.dimension > kGlobals.MaximumValuesInCategories) {
        const counts = {};
        const rawKey = d["raw_attribute_key"];
        const len = self.nodes.length;
        for (let i = 0; i < len; i++) {
          const val = self.attribute_node_value_by_id(self.nodes[i], rawKey);
          counts[val] = (counts[val] || 0) + 1;
        }
        const compressed_values = Object.entries(counts).sort(
          (a, b) => b[1] - a[1]
        );

        reduced_range = [];
        let i = 0;
        while (
          reduced_range.length < kGlobals.MaximumValuesInCategories - 1 &&
          i < compressed_values.length
        ) {
          if (compressed_values[i][0] !== kGlobals.missing.label) {
            reduced_range.push(compressed_values[i][0]);
          }
          i++;
        }
        reduced_range = reduced_range.sort();
        reduced_range.push(kGlobals.network.ReducedValue);
      }

      var string_hash = function (str) {
        var hash = 5801;
        for (var ci = 0; ci < str.length; ci++) {
          var charCode = str.charCodeAt(ci);
          hash = (hash << (5 + hash)) + charCode;
        }
        return hash;
      };

      const use_these_values = reduced_range || values;

      var hashed = _.map(use_these_values, string_hash);
      var available_keys = {};
      var reindexed = {};

      for (var i = 0; i < kGlobals.MaximumValuesInCategories; i++) {
        available_keys[i] = true;
      }

      _.each(hashed, (value, index) => {
        if (value < 0) {
          value = -value;
        }

        var first_try = value % kGlobals.MaximumValuesInCategories;
        if (first_try in available_keys) {
          reindexed[use_these_values[index]] = first_try;
          delete available_keys[first_try];
          return;
        }

        var second_try =
          Math.floor(value / kGlobals.MaximumValuesInCategories) %
          kGlobals.MaximumValuesInCategories;
        if (second_try in available_keys) {
          reindexed[use_these_values[index]] = second_try;
          delete available_keys[second_try];
          return;
        }

        var last_resort = parseInt(_.keys(available_keys).sort()[0]);
        reindexed[use_these_values[index]] = last_resort;
        delete available_keys[last_resort];
      });

      d["stable-ish order"] = reindexed;
    }

    var map = {};

    if (reduced_range) {
      const rrl = _.object(_.map(_.pairs(reduced_range), (d) => [d[1], d[0]]));

      _.each(values, (d2, i) => {
        if (d2 in rrl) {
          map[d2] = rrl[d2];
        } else {
          map[d2] = rrl[kGlobals.network.ReducedValue];
        }
      });

      d["reduced_value_range"] = rrl;
      //console.log (rrl, map);
      d["value_map"] = function (v, key) {
        if (key) {
          //console.log (key, map);
          return key === "lookup" ? _.invert(rrl) : rrl;
        }
        return map[v];
      };
    } else {
      _.each(values, (d2, i) => {
        map[d2] = i;
      });

      d["value_map"] = function (v, key) {
        if (key) {
          //console.log (key, map);
          return key === "lookup" ? _.invert(map) : map;
        }
        return map[v];
      };
    }

    if (cacheKey) {
      self._category_cache[cacheKey] = {
        nodes_ref: self.nodes,
        nodes_len: self.nodes.length,
      };
    }
    return d;
  };

  /**
   * @function attribute_cluster_distribution
   * @description Gets the distribution of a specific attribute within a cluster.
   * @param {Object} the_cluster - The cluster object.
   * @param {string} attribute_id - The ID of the attribute.
   * @returns {Array|null} An array of attribute values, or null if the attribute is not found.
   */
  function attribute_cluster_distribution(the_cluster, attribute_id) {
    if (attribute_id && the_cluster) {
      return the_cluster.children.map((d) =>
        self.attribute_node_value_by_id(d, attribute_id)
      );
    }
    return null;
  }

  /**
   * @function cluster_info_string
   * @description Generates an information string for a cluster, including its size, degree, and other attributes.
   * @param {string} id - The ID of the cluster.
   * @returns {string} The information string for the cluster.
   */
  function cluster_info_string(id) {
    var the_cluster = self.clusters[self.cluster_mapping[id]],
      attr_info = the_cluster["binned_attributes"];

    var str;

    if (self._is_CDC_) {
      str =
        "<strong>" +
        (self.has_multiple_sequences
          ? self.cluster_sizes_in_entities[id]
          : self.cluster_sizes[id - 1]) +
        "</strong> individuals." +
        (self.has_multiple_sequences
          ? "<br><strong> " +
            self.cluster_sizes[id - 1] +
            "</strong> sequences."
          : "") +
        "<br>Mean links/individual <em> = " +
        kGlobals.formats.FloatFormat(the_cluster.degrees["mean"]) +
        "</em>" +
        "<br>Max links/individual <em> = " +
        the_cluster.degrees["max"] +
        "</em>";
    } else {
      str =
        "<strong>" +
        self.cluster_sizes[id - 1] +
        "</strong> nodes." +
        "<br>Mean degree <em>" +
        kGlobals.formats.FloatFormat(the_cluster.degrees["mean"]) +
        "</em>" +
        "<br>Max degree <em>" +
        the_cluster.degrees["max"] +
        "</em>" +
        "<br>Clustering coefficient <em> " +
        misc.format_value(the_cluster.cc, kGlobals.formats.FloatFormat) +
        "</em>";
    }

    if (attr_info) {
      attr_info.forEach((d) => {
        str += "<br>" + d[0] + " <em>" + d[1] + "</em>";
      });
    }

    return str;
  }

  /**
   * @function cluster_pop_on
   * @description Shows a tooltip for a cluster when the mouse is over it.
   * @param {Object} d - The cluster object.
   * @returns {void}
   */
  function cluster_pop_on(d) {
    toggle_tooltip(
      this,
      true,
      "Cluster " + d.cluster_id,
      cluster_info_string(d.cluster_id),
      self.container
    );
  }

  /**
   * @function cluster_pop_off
   * @description Hides the tooltip for a cluster when the mouse is no longer over it.
   * @param {Object} d - The cluster object.
   * @returns {void}
   */
  function cluster_pop_off(d) {
    toggle_tooltip(this, false);
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
            collapse_cluster(cluster, true);
          }
          if (k || open_cluster_queue.length) {
            open_cluster_queue.splice(0, k);
          }
        }

        if (leftover <= 0) {
          expand_cluster(d, !move_out);
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
    var cidx = self.cluster_mapping[d.cluster];
    if (cidx === undefined || !self.clusters[cidx]) {
      return;
    }
    _.each(
      self.extract_single_cluster(
        self.clusters[cidx].children,
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
  function handle_node_label(container, node) {
    node.show_label = !node.show_label;
    self.update(true);
  }

  /**
   * @function collapse_cluster_handler
   * @description Handles the collapse of a cluster.
   * @param {Object} d - The cluster object to collapse.
   * @param {boolean} do_update - If true, updates the network visualization after collapsing.
   * @returns {void}
   */
  function collapse_cluster_handler(d, do_update) {
    var cidx = self.cluster_mapping[d.cluster];
    if (cidx !== undefined && self.clusters[cidx]) {
      collapse_cluster(self.clusters[cidx]);
      if (do_update) {
        self.update(false, 0.4);
      }
    }
  }

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
      if (!x.collapsed) collapse_cluster(x);
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
      self.using_time_filter.setUTCFullYear(
        self.using_time_filter.getUTCFullYear() - 1
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
  function stratify(array) {
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
  }

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
          if (self.cluster_mapping[k] !== undefined) {
            var existing_cluster = self.clusters[self.cluster_mapping[k]];
            if (existing_cluster) {
              if (!existing_cluster.injected) {
                existing_cluster.injected = {};
              }
              existing_cluster.injected[annotation] = injected_count;
              if ("linked_clusters" in existing_cluster) {
                _.extend(existing_cluster["linked_clusters"], cluster_ids);
              } else {
                existing_cluster["linked_clusters"] = cluster_ids;
              }
            }
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
    //if (d3.event.defaultPrevented) return;
    if (!element) {
      return;
    }

    if (turn_on && !element.tooltip) {
      // check to see if there are any other tooltips shown
      $("[role='tooltip']").each(function (d) {
        $(this).remove();
      });

      var this_box = $(element);

      // var this_data = d3.select(element).datum();
      //this_data.fixed = true;

      element.tooltip = this_box.tooltip({
        title: title + "<br>" + tag,
        html: true,
        container: container ? container : "body",
      });

      _.delay(_.bind(element.tooltip.tooltip, element.tooltip), 500, "show");
    } else if (!turn_on && element.tooltip) {
      element.tooltip.tooltip("destroy");
      element.tooltip = undefined;
    }
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
  if (!self.isMJCNetwork || self.fullMJCNetwork) {
    network_layout = d3.layout
      .force()
      .on("tick", tick)
      .charge((d) => {
        if (self.showing_on_map) {
          return -60;
        }
        if (d.cluster_id) {
          return self.charge_correction * (-15 - 5 * d.children.length ** 0.4);
        }
        return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
      })
      .linkDistance(
        (d) => link_scale(d.length) * l_scale * 0.2 //Math.max(d.length, 0.005) * l_scale * 10;
      )
      .linkStrength((d) => {
        if (self.showing_on_map) {
          return 0.01;
        }
        if (d.support !== undefined) {
          return 0.75 - 0.5 * d.support;
        }
        return 1;
      })
      .chargeDistance(l_scale * 0.1)
      .gravity(self.showing_on_map ? 0 : gravity_scale(self.json.Nodes.length))
      .friction(0.25);
  } else {
    network_layout = d3.layout.force();
  }
  d3.select(self.container).selectAll("svg").remove();

  if (self.isPrimaryGraph) {
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

  // Skip the SVG loading placeholder for the redacted MJC view: it returns
  // early from `update()` without rendering the graph, so the placeholder would
  // never be cleared and the page would appear to hang on load.
  if (!(self.isMJCNetwork && !self.fullMJCNetwork)) {
    self.network_svg
      .append("text")
      .classed("svg-loading-placeholder", true)
      .attr("x", (self.width + self.margin.left + self.margin.right) / 2)
      .attr("y", self.margin.top + 30)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", "18px")
      .style("fill", "#666666")
      .style("font-family", "sans-serif")
      .text("Loading network visualization...");
  }

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
  const legend_vertical_offset = self.showing_on_map ? 100 : 5;
  self.legend_svg = self.network_svg
    .append("g")
    .attr("transform", "translate(5," + legend_vertical_offset + ")")
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

  change_window_size();

  initial_json_load();

  // Options setup, search table definitions, and layout start are now handled
  // asynchronously within initial_json_load steps to keep the main thread responsive.

  return self;
};

export {
  hivtrace_cluster_depthwise_traversal as computeCluster,
  hivtrace_cluster_network_graph as clusterNetwork,
};
