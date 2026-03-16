import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

export function extract_attributes_for_nodes(nodes, column_names, self, tables, HTX) {
  var result = [_.map(column_names, (c) => c.raw_attribute_key)];

  _.each(nodes, (n) => {
    result.push(
      _.map(column_names, (c) => {
        if (c.raw_attribute_key === tables._networkNodeIDField) {
          let uid = self.primary_key(n);
          /** only display [+] for MSPP nodes where EVERYTHING is tagged as new **/

          if (self.has_multiple_sequences) {
            if (
              _.every(self.primary_key_list[uid], (node) =>
                HTX.HIVTxNetwork.is_new_node(node)
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
          return n[c.raw_attribute_key];
        }
        return self.attribute_node_value_by_id(n, c.raw_attribute_key);
      })
    );
  });
  return result;
}

export function extract_exportable_attributes(extended, self, kGlobals, tables, i18n) {
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
          return i18n("clusters_tab")["cluster_id"];
        },
      },
    ];
  }

  return_array.push(
    _.filter(
      self.json[kGlobals.network.GraphAttrbuteID],
      (d) => d.type in allowed_types
    )
  );

  return _.flatten(return_array, true);
}

export function extract_mjc_attributes(priority_group_name, self, kGlobals, timeDateUtil) {
  if (!self.isMJCNetwork) {
    return [];
  }

  // for all nodes in the priority group, update the mjc_date_added to the current viewed priority group
  if (priority_group_name) {
    let priority_group = self.priority_groups_find_by_name(priority_group_name);
    let nodeToAddedDateMap = {};
    for (let n of priority_group.nodes) {
      let value = n.added;
      if (value !== "REDACTED") {
        value = timeDateUtil.DateViewFormatExport(self.parse_dates(value));
      }
      nodeToAddedDateMap[n.name] = value;
    }

    if (priority_group) {
      const cluster_nodes = priority_group.node_objects;
      _.each(cluster_nodes, (n) => {
        n.patient_attributes.mjc_date_added = nodeToAddedDateMap[n.id];
      });
    }
  }

  const MJC_ATTRIBUTES = [
    "mjc_data_owners",
    "cur_state_cd",
    "rsd_state_cd",
    "mjc_date_added",
    "hiv_aids_dx_dt_last_year",
    "hiv_aids_dx_dt_month_year",
  ];

  return MJC_ATTRIBUTES.filter(
    (attr_key) => attr_key in self.json[kGlobals.network.GraphAttrbuteID]
  ).map((attr_key) => self.json[kGlobals.network.GraphAttrbuteID][attr_key]);
}

export function extract_nodes_by_id(id, self) {
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
}

export function cluster_list_view_render(
  cluster_id,
  group_by_attribute,
  the_list,
  priority_group,
  self,
  kGlobals,
  timeDateUtil,
  helpers,
  i18n
) {
  the_list.selectAll("*").remove();
  var column_ids = self.isMJCNetwork
    ? self._extract_mjc_attributes(priority_group)
    : self._extract_exportable_attributes();
  var cluster_nodes;

  if (priority_group) {
    cluster_nodes = self.priority_groups_find_by_name(priority_group);
    if (cluster_nodes) {
      // For MJC networks, use nodes array directly since node_objects only contains local nodes
      if (self.isMJCNetwork) {
        cluster_nodes = cluster_nodes.nodes || [];
      } else if (self.has_multiple_sequences) {
        cluster_nodes = self.aggregate_indvidual_level_records(
          cluster_nodes.node_objects
        );
      } else {
        cluster_nodes = cluster_nodes.node_objects;
      }
    } else {
      return;
    }
  } else {
    cluster_nodes = self._extract_nodes_by_id(cluster_id);
  }
  d3.select(
    self.get_ui_element_selector_by_role("cluster_list_data_export", true)
  ).on("click", (d) => {
    if (self._is_CDC_executive_mode) {
      alert(kGlobals.network.WarnExecutiveMode);
    } else {
      helpers.export_csv_button(
        self._extract_attributes_for_nodes(cluster_nodes, column_ids)
      );
    }
  });

  if (group_by_attribute) {
    _.each(column_ids, (column) => {
      var binned = _.groupBy(cluster_nodes, (n) =>
        self.attribute_node_value_by_id(n, column.raw_attribute_key)
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
            _.map(binned[key], (n) => self.cleanRedacted(self.entity_id(n))).join(
              ", "
            )
          );
      });
    });
  } else {
    // For MJC networks, nodes have a simpler structure directly from the API
    if (self.isMJCNetwork) {
      const mjcFields = [
        { key: "jurisdiction", label: "Jurisdiction" },
        { key: "dx_date", label: "Diagnosis Date" },
        { key: "added", label: "Date Added to MJ ClusterOI" },
        { key: "dx_within_12mo", label: "Diagnosed in Last 12 Months" },
      ];
      _.each(cluster_nodes, (node) => {
        var patient_record = the_list.append("li");
        patient_record
          .append("code")
          .text(self.cleanRedacted(node.name || "Unknown"));
        var patient_list = patient_record
          .append("dl")
          .classed("dl-horizontal", true);
        _.each(mjcFields, (field) => {
          let value = node[field.key];
          // Format dates nicely
          if (field.key.includes("date") || field.key === "added") {
            try {
              value = value
                ? timeDateUtil.DateViewFormatExport(new Date(value))
                : "N/A";
            } catch (e) {
              value = value || "N/A";
            }
          }
          // Format boolean
          if (typeof value === "boolean") {
            value = value ? "Yes" : "No";
          }
          patient_list.append("dt").text(field.label);
          patient_list.append("dd").text(value || "N/A");
        });
      });
    } else {
      _.each(cluster_nodes, (node) => {
        var patient_record = the_list.append("li");
        patient_record
          .append("code")
          .text(self.cleanRedacted(self.entity_id(node)));
        var patient_list = patient_record
          .append("dl")
          .classed("dl-horizontal", true);
        _.each(column_ids, (column) => {
          patient_list
            .append("dt")
            .text(column.label || column.raw_attribute_key);
          patient_list
            .append("dd")
            .text(self.attribute_node_value_by_id(node, column.raw_attribute_key));
        });
      });
    }
  }
}

export function setup_cluster_list_view(self, kGlobals, timeDateUtil, helpers, i18n, tables, clustersOfInterest) {
  d3.select(
    self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
  ).on("click", function () {
    d3.event.preventDefault();
    var group_by_id;

    var button_clicked = $(this);
    if (button_clicked.data(i18n("clusters_tab")["view"]) === "id") {
      button_clicked.data(i18n("clusters_tab")["view"], "attribute");
      button_clicked.text(i18n("clusters_tab")["group_by_id"]);
      group_by_id = false;
    } else {
      button_clicked.data(i18n("clusters_tab")["view"], "id");
      button_clicked.text(i18n("clusters_tab")["group_by_attribute"]);
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

  $(self.get_ui_element_selector_by_role("cluster_list", true)).on(
    "show.bs.modal",
    (event) => {
      var $modal = $(event.target);
      var link_clicked = event.relatedTarget ? $(event.relatedTarget) : null;

      // Try to get priority_set from relatedTarget first, then from modal data (for programmatic triggers)
      var cluster_id = link_clicked ? link_clicked.data("cluster") : null;
      var priority_list = link_clicked ? link_clicked.data("priority_set") : null;

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

      var $modal = $(self.get_ui_element_selector_by_role("cluster_list", true));
      $modal.find(".modal-title")
        .text(
          i18n("clusters_tab")["listing_nodes"] +
            (priority_list
              ? ` in ${self.isMJCNetwork ? "MJ " : ""}cluster of interest ` +
                priority_list
              : " " + i18n("general")["cluster"] + " " + cluster_id)
        );

      var view_toggle = $(
        self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
      );

      if (priority_list) {
        view_toggle.data("priority_list", priority_list);
        view_toggle.data("cluster", "");
      } else {
        view_toggle.data("cluster", cluster_id);
        view_toggle.data("priority_list", null);
      }

      self._cluster_list_view_render(
        cluster_id,
        //cluster_id,
        $(
          self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
        ).data(i18n("clusters_tab")["view"]) !== "id",
        d3.select(
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

      var modal = d3.select(
        self.get_ui_element_selector_by_role("overlap_list", true)
      );
      modal
        .selectAll(".modal-title")
        .text(
          "View how nodes in cluster of interest " +
            priority_list +
            (self.isMJCNetwork
              ? " overlap with your jurisdiction's clusterOI"
              : " overlap with other clusterOI")
        );

      const ps = self.priority_groups_find_by_name(priority_list);
      if (!(ps && self.priority_node_overlap)) return;

      var headers = [
        [
          {
            value: "Node",
            help: "EHARS_ID of the node that overlaps with other clusterOI",
            sort: "value",
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

      _.each(self.aggregate_indvidual_level_records(ps.node_objects), (n) => {
        const eid = self.entity_id(n);
        const overlap = self.priority_node_overlap[eid];
        let other_sets = "None";
        if (overlap && overlap.size > 1) {
          other_sets = _.sortBy(
            _.filter([...overlap], (d) => d !== priority_list)
          ).join("; ");
        }
        rows.push([{ value: self.cleanRedacted(eid) }, { value: other_sets }]);
        rows_for_export.push([ps.name, self.cleanRedacted(eid), other_sets]);
      });

      d3.select(
        self.get_ui_element_selector_by_role("overlap_list_data_export", true)
      ).on("click", (d) => {
        helpers.export_csv_button(rows_for_export, "overlap");
      });

      const table_container = modal.select(
        self.get_ui_element_selector_by_role("overlap_list_data_table", true)
      );
      $(table_container.node()).addClass("table table-striped table-sm table-hover caption-top table-smaller");

      tables.add_a_sortable_table(
        table_container,
        headers,
        rows,
        true,
        null,
        clustersOfInterest.get_editor()
      );
    }
  );
}

/**
 * @function get_node_country
 * @description Retrieves the country code for a given node.
 * @param {Object} self - The network object.
 * @param {Object} node - The node object.
 * @param {Object} kGlobals - Global constants.
 * @returns {string} The country code (Alpha2) of the node.
 */
export function get_node_country(self, node, kGlobals) {
  var countryCodeAlpha2 = self.attribute_node_value_by_id(node, "country");
  if (countryCodeAlpha2 === kGlobals.missing.label) {
    countryCodeAlpha2 = self.attribute_node_value_by_id(node, "Country");
  }
  return countryCodeAlpha2;
}

/**
 * @function update_network_string
 * @description Updates the network status string with current network statistics.
 * @param {Object} self - The network object.
 * @param {string} network_status_string - The selector for the status string element.
 * @param {number} node_count - Number of shown nodes.
 * @param {number} edge_count - Number of shown edges.
 * @returns {void}
 */
export function update_network_string(
  self,
  network_status_string,
  node_count,
  edge_count
) {
  if (network_status_string) {
    const clusters_shown = _.filter(self.clusters, (c) => !c.collapsed).length;

    const clusters_selected = _.filter(
      self.clusters,
      (c) => !c.is_hidden && c.match_filter !== undefined && c.match_filter > 0
    ).length;

    const nodes_selected = _.filter(
      self.nodes,
      (n) => n.match_filter && !n.is_hidden
    ).length;

    const networkString =
      "<span class = 'badge bg-secondary'>" +
      self.clusters.length +
      "</span> clusters <span class = 'badge bg-primary'>" +
      clusters_shown +
      " expanded / " +
      clusters_selected +
      " match </span> <span class = 'badge bg-secondary'> " +
      self.nodes.length +
      "</span> nodes <span class = 'badge bg-primary'>" +
      node_count +
      " shown / " +
      nodes_selected +
      " match </span> <span class = 'badge bg-secondary'> " +
      self.edges.length +
      "</span> " +
      (self._is_CDC_ ? "links" : "edges") +
      " <span class = 'badge bg-primary'>" +
      edge_count +
      " shown</span>";

    d3.select(network_status_string).html(networkString);
  }
}
