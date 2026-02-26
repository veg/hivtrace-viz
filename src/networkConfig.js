import _ from "underscore";
import * as d3 from "d3";
import * as network from "./network.js";
import * as kGlobals from "./globals.js";
import * as timeDateUtil from "./timeDateUtil.js";
import * as columnDefinitions from "./column_definitions.js";
import * as tables from "./tables.js";

/**
 * Extracts and initializes configuration options for the HIV transmission network.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} json - The JSON data.
 * @param {Object} options - Configuration options.
 * @param {string} parent_container - Selector for the parent container.
 */
export function initializeNetworkSettings(self, options, parent_container, network_container, network_warning_tag) {
  const json = self.json;
  self.container = network_container;
  self.network_warning_tag = network_warning_tag;
  self.isMJCNetwork = options && options["is-mjc-network"] ? true : false;
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

  self.schema = json[kGlobals.network.GraphAttrbuteID];
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

  self.nodes = [];
  self.edges = [];
  self.clusters = [];
  self.cluster_sizes = [];
  self.cluster_mapping = {};
  self.percent_format = kGlobals.formats.PercentFormat;
  self.missing = kGlobals.missing.label;
  self.cluster_attributes = json["Cluster description"] || null;
  self.precomputed_subclusters = json["Subclusters"] || null;

  self.filter_edges = true;
  self.hide_hxb2 = false;

  if (self._is_CDC_) {
    self.priority_set_table_write = network.check_network_option(
      options,
      "priority-table-writeback"
    );
  } else {
    self.priority_set_table_write = null;
  }

  self.needs_an_update = false;
  self.hide_unselected = false;
  self.show_percent_in_pairwise_table = false;

  self.priority_set_table_writeable = !self.isMJCNetwork;

  self.dom_prefix = network.check_network_option(
    options,
    "prefix",
    "hiv-trace"
  );

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

  /** set the TODAY date for the network*/
  if (json.Settings && json.Settings.created) {
    self.today = new Date(json.Settings.created);
  } else {
    self.today = network.check_network_option(
      options,
      "today",
      timeDateUtil.getCurrentDate()
    );
  }

  if (self._is_CDC_) {
    self._is_CDC_auto_mode = network.check_network_option(
      options,
      "cdc-no-auto-priority-set-mode",
      true,
      false
    );

    self.displayed_node_subset = network.check_network_option(
      options,
      "node-attributes",
      [
        tables._networkNodeIDField,
        "sex_trans",
        "race_cat",
        "hiv_aids_dx_dt",
        "cur_city_name",
      ]
    );

    /** retrieve the target DOM ID for placing the "subcluster" table into */
    self.subcluster_table = network.check_network_option(
      options,
      "subcluster-table",
      null,
      d3.select(options["subcluster-table"])
    );

    self.CDC_data = {
      jurisdiction: self
        .lookup_option("jurisdiction", "unknown", options)
        .toLowerCase()
        .replace(/\s/g, ""),
      timestamp: self.today,
      "autocreate-priority-set-size": 5,
    };

    if (self.CDC_data.jurisdiction in kGlobals.CDCJurisdictionCodes) {
      self.CDC_data["jurisdiction_code"] =
        kGlobals.CDCJurisdictionCodes[self.CDC_data.jurisdiction].toUpperCase();
    } else {
      self.CDC_data["jurisdiction_code"] = "PG";
    }

    if (kGlobals.CDCJurisdictionLowMorbidity.has(self.CDC_data["jurisdiction"])) {
      self.CDC_data["autocreate-priority-set-size"] = 3;
    }

    /** extra column definitions for the subcluster table */
    self.extra_subcluster_table_columns = null;

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
  }

  if (self._is_CDC_) {
    self.extra_node_table_columns = null;
  } else {
    self.extra_node_table_columns = network.check_network_option(
      options,
      "node-table-columns"
    );
  }

  self.subcluster_threshold = network.check_network_option(
    options,
    "subcluster-thershold",
    0.005
  );

  self.minimum_cluster_size = network.check_network_option(
    options,
    "minimum size",
    5
  );

  self.core_link_length = network.check_network_option(
    options,
    "core-link",
    -1
  );
  self.additional_edge_styler = network.check_network_option(
    options,
    "edge-styler"
  );
  
  self.initial_packed =
    options && options["initial_layout"] === "tiled" ? false : true;
}
