const _ = require("underscore");
const d3 = require("d3");

/**
 * Encapsulates CDC-specific priority definitions and attribute generators.
 */

function define_attribute_COI_membership(self, kGlobals, timeDateUtil, date) {
  date = date || self.get_reference_date();

  const subcluster_enum = [
    "No, dx>36 months", // 0
    "No, but dx≤12 months",
    "Yes (dx≤12 months)",
    "Yes (12<dx≤36 months)",
    "Future node", // 4
    "Not a member of subcluster", // 5
    "Not in a subcluster",
    "No, but 12<dx≤36 months",
  ];

  return {
    depends: [timeDateUtil._networkCDCDateField],
    label: `ClusterOI membership as of ${timeDateUtil.DateViewFormat(date)}`,
    enum: subcluster_enum,
    volatile: true,
    color_scale: () => d3.scale
        .ordinal()
        .domain(subcluster_enum.concat([kGlobals.missing.label]))
        .range(
          _.union(
            [
              "steelblue",
              "pink",
              "red",
              "#FF8C00",
              "#9A4EAE",
              "yellow",
              "#FFFFFF",
              "#FFD580",
            ],
            [kGlobals.missing.color]
          )
        ),

    map: (node) => {
      if (node.subcluster_label) {
        if (node.priority_flag > 0) {
          return subcluster_enum[node.priority_flag];
        }
        return subcluster_enum[0];
      }
      return subcluster_enum[6];
    },
  };
}

function define_attribute_binned_vl(self, kGlobals, field, title) {
  const vl_bins = ["<200", "200-10000", ">10000"];

  return {
    depends: [field],
    label: title,
    enum: vl_bins,
    type: "String",
    color_scale: () => d3.scale
        .ordinal()
        .domain(vl_bins.concat([kGlobals.missing.label]))
        .range(
          _.union(kGlobals.SequentialColor[3], [kGlobals.missing.color])
        ),

    map: (node) => {
      const vl_value = self.attribute_node_value_by_id(node, field, true);

      if (vl_value !== kGlobals.missing.label) {
        if (vl_value <= 200) {
          return vl_bins[0];
        }
        if (vl_value <= 10000) {
          return vl_bins[1];
        }
        return vl_bins[2];
      }

      return kGlobals.missing.label;
    },
  };
}

function define_attribute_vl_interpretaion(self, kGlobals) {
  return {
    depends: ["vl_recent_value", "result_interpretation"],
    label: "Viral load result interpretation",
    color_stops: 6,
    scale: d3.scale.log(10).domain([10, 1e6]).range([0, 5]),
    category_values: ["Suppressed", "Viremic (above assay limit)"],
    type: "Number-categories",
    color_scale: (attr) => {
      const color_scale_d3 = d3.scale
        .linear()
        .range([
          "#d53e4f",
          "#fc8d59",
          "#fee08b",
          "#e6f598",
          "#99d594",
          "#3288bd",
        ])
        .domain(_.range(kGlobals.network.ContinuousColorStops, -1, -1));

      return function (v) {
        if (_.isNumber(v)) {
          return color_scale_d3(attr.scale(v));
        }
        switch (v) {
          case attr.category_values[0]:
            return color_scale_d3(0);
          case attr.category_values[1]:
            return color_scale_d3(5);
          default:
            return kGlobals.missing.color;
        }
      };
    },
    label_format: d3.format(",.0f"),
    map: (node) => {
      const vl_value = self.attribute_node_value_by_id(
        node,
        "vl_recent_value",
        true
      );
      const result_interpretation = self.attribute_node_value_by_id(
        node,
        "result_interpretation"
      );

      if (
        vl_value !== kGlobals.missing.label ||
        result_interpretation !== kGlobals.missing.label
      ) {
        if (result_interpretation !== kGlobals.missing.label) {
          if (result_interpretation === "<") {
            return "Suppressed";
          }
          if (result_interpretation === ">") {
            return "Viremic (above assay limit)";
          }
          if (vl_value !== kGlobals.missing.label) {
            return vl_value;
          }
        } else {
          return vl_value;
        }
      }

      return kGlobals.missing.label;
    },
  };
}

function define_attribute_network_update(HIVTxNetwork) {
  return {
    label: "Sequence updates compared to previous network",
    enum: ["Existing", "New", "Moved clusters"],
    type: "String",
    map: (node) => {
      if (HIVTxNetwork.is_new_node(node)) {
        return "New";
      }
      if (node.attributes.indexOf("moved_clusters") >= 0) {
        return "Moved clusters";
      }
      return "Existing";
    },
    color_scale: () => d3.scale
        .ordinal()
        .domain(["Existing", "New", "Moved clusters", "Missing"])
        .range(["#7570b3", "#d95f02", "#1b9e77", "gray"]),
  };
}

function define_attribute_mjc_date_added(kGlobals, label) {
  return {
    depends: [],
    label: label,
    type: "Date",
    map: (node) => kGlobals.missing.label,
  };
}

function define_attribute_dx_years(self, kGlobals, timeDateUtil, relative, label) {
  return {
    depends: [timeDateUtil._networkCDCDateField],
    label: label,
    type: "Number",
    label_format: relative ? d3.format(".2f") : d3.format(".0f"),
    map: (node) => {
      try {
        let value = self.parse_dates(
          self.attribute_node_value_by_id(
            node,
            timeDateUtil._networkCDCDateField,
            false,
            true,
            true
          )
        );

        if (value) {
          if (relative) {
            value = (self.get_reference_date() - value) / 31536000000;
          } else value = String(value.getFullYear());
        } else {
          value = kGlobals.missing.label;
        }

        return value;
      } catch {
        return kGlobals.missing.label;
      }
    },
    color_scale: (attr) => {
      const range_without_missing = _.without(
        attr.value_range,
        kGlobals.missing.label
      );
      const color_scale = _.compose(
        d3.interpolateRgb("#ffffcc", "#800026"),
        d3.scale
          .linear()
          .domain([
            range_without_missing[0],
            range_without_missing[range_without_missing.length - 1],
          ])
          .range([0, 1])
      );
      return function (v) {
        if (v === kGlobals.missing.label) {
          return kGlobals.missing.color;
        }
        return color_scale(v);
      };
    },
  };
}

function define_attribute_dx_month_year(self, kGlobals, timeDateUtil, label) {
  return {
    depends: [timeDateUtil._networkCDCMonthYearField],
    label: label,
    type: "String",
    map: (node) => {
      try {
        return self.attribute_node_value_by_id(
          node,
          timeDateUtil._networkCDCMonthYearField,
          false,
          false,
          true
        );
      } catch {
        return kGlobals.missing.label;
      }
    },
  };
}

function define_attribute_dx_last_year(self, kGlobals, timeDateUtil, label) {
  return {
    depends: [timeDateUtil._networkCDCLastYearField],
    label: label,
    type: "String",
    enum: ["Yes", "No"],
    map: (node) => {
      try {
        return self.attribute_node_value_by_id(
          node,
          timeDateUtil._networkCDCLastYearField,
          false,
          false,
          true
        );
      } catch {
        return kGlobals.missing.label;
      }
    },
  };
}

function define_attribute_sequence_count(self, kGlobals, label) {
  return {
    depends: [],
    label: label,
    type: "Number",
    label_format: d3.format("d"),
    map: (node) => {
      if (node[kGlobals.network.AliasedSequencesID]) {
        return node[kGlobals.network.AliasedSequencesID].length;
      }
      if (self.has_multiple_sequences) {
        return self.fetch_sequences_for_pid(self.primary_key(node)).length;
      }
      return 1;
    },
    color_scale: (attr) => {
      const range_without_missing = _.without(
        attr.value_range,
        kGlobals.missing.label
      );
      const color_scale = _.compose(
        d3.interpolateRgb("#ffffcc", "#800026"),
        d3.scale
          .linear()
          .domain([
            range_without_missing[0],
            range_without_missing[range_without_missing.length - 1],
          ])
          .range([0, 1])
      );
      return function (v) {
        if (v === kGlobals.missing.label) {
          return kGlobals.missing.color;
        }
        return color_scale(v);
      };
    },
  };
}

function define_attribute_age_dx(self, kGlobals) {
  return {
    depends: ["age_dx"],
    overwrites: "age_dx",
    label: "Age at Diagnosis",
    enum: ["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "≥60"],
    type: "String",
    color_scale: () => d3.scale
        .ordinal()
        .domain([
          "<13",
          "13-19",
          "20-29",
          "30-39",
          "40-49",
          "50-59",
          "≥60",
          kGlobals.missing.label,
        ])
        .range([
          "#b10026",
          "#e31a1c",
          "#fc4e2a",
          "#fd8d3c",
          "#feb24c",
          "#fed976",
          "#ffffb2",
          "#636363",
        ]),
    map: (node) => {
      const vl_value = self.attribute_node_value_by_id(node, "age_dx");
      if (vl_value === ">=60" || vl_value === "\ufffd60" || Number(vl_value) >= 60) {
        return "≥60";
      }
      return vl_value;
    },
  };
}

function priority_groups_all_events(self, timeDateUtil) {
  const events = new Set();
  if (self.defined_priority_groups) {
    _.each(self.defined_priority_groups, (g) => {
      _.each(g.nodes, (n) => {
        events.add(timeDateUtil.DateViewFormatSlider(n.added));
      });
    });
  }
  return events;
}

function priority_groups_compute_node_membership(self, kGlobals, timeDateUtil) {
  const pg_nodesets = [];

  const node2set = {};

  _.each(self.defined_priority_groups, (g) => {
    pg_nodesets.push([g.name, g.createdBy === kGlobals.CDCCOICreatedBySystem]);

    _.each(g.nodes, (n) => {
      if (n.name in node2set) {
        node2set[n.name].push(pg_nodesets.length - 1);
      } else {
        node2set[n.name] = [pg_nodesets.length - 1];
      }
    });
  });

  const pg_enum = [
    "Yes (dx≤12 months)",
    "Yes (12<dx≤36 months)",
    "Yes (dx>36 months)",
    "No",
  ];

  /** define and populate categorical node attributes */

  const ref_date = self.get_reference_date();

  const attrib_defs = {
    subcluster_or_priority_node: {
      depends: [timeDateUtil._networkCDCDateField],
      label: kGlobals.CDCNPMember,
      enum: pg_enum,
      type: "String",
      volatile: true,
      color_scale: () => d3.scale
          .ordinal()
          .domain(pg_enum.concat([kGlobals.missing.label]))
          .range([
            "red",
            "orange",
            "yellow",
            "steelblue",
            kGlobals.missing.color,
          ]),
      map: (node) => {
        const npcoi =
          node.id in node2set
            ? _.some(node2set[node.id], (d) => pg_nodesets[d][1])
            : false;
        if (npcoi) {
          const cutoffs = [
            timeDateUtil.n_months_ago(ref_date, 12),
            timeDateUtil.n_months_ago(ref_date, 36),
          ];

          if (
            self.filter_by_date(
              cutoffs[0],
              timeDateUtil._networkCDCDateField,
              ref_date,
              node,
              false
            )
          ) {
            return pg_enum[0];
          }
          if (
            self.filter_by_date(
              cutoffs[1],
              timeDateUtil._networkCDCDateField,
              ref_date,
              node,
              false
            )
          ) {
            return pg_enum[1];
          }

          return pg_enum[2];
        }
        return pg_enum[3];
      },
    },
    cluster_uid: {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Clusters of Interest",
      type: "String",
      volatile: true,
      map: (node) => {
        const memberships = node2set[node.id] || [];
        if (memberships.length === 1) {
          return pg_nodesets[memberships[0]][0];
        } else if (memberships.length > 1) {
          return "Multiple";
        }
        return "None";
      },
    },
    subcluster_id: {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Subcluster ID",
      type: "String",
      map: (node) => {
        if (node) {
          return node.subcluster_label || "None";
        }
        return kGlobals.missing.label;
      },
    },
  };

  for (const [key, def] of Object.entries(attrib_defs)) {
    self.populate_predefined_attribute(def, key);
  }

  self._aux_populate_category_menus();
  if (self._is_CDC_ && !self.isMJCNetwork) {
    try {
      self.define_node_search_table();
    } catch (e) {
      console.error("Error initializing node search table:", e);
    }
  }
}

function check_for_time_series(self, kGlobals, timeDateUtil, misc, export_items) {
  const event_handler = (network, e) => {
    let e_sel = e ? d3.select(e) : null;

    if (!network.network_cluster_dynamics) {
      network.network_cluster_dynamics = network.network_svg
        .append("g")
        .attr("id", `${self.dom_prefix}-dynamics-svg`)
        .attr("transform", `translate (${network.width * 0.45},0)`);

      network.handle_inline_charts = function (plot_filter) {
        let attr = null;
        let color = null;
        if (network.colorizer["category_id"] && !network.colorizer["continuous"]) {
          const attr_desc =
            network.json[kGlobals.network.GraphAttrbuteID][
              network.colorizer["category_id"]
            ];
          attr = {};
          attr[network.colorizer["category_id"]] = attr_desc["label"];
          color = {};
          color[attr_desc["label"]] = network.colorizer["category"];
        }

        misc.cluster_dynamics(
          network.extract_network_time_series(
            timeDateUtil.getClusterTimeScale(),
            attr,
            plot_filter
          ),
          network.network_cluster_dynamics,
          "Quarter of Diagnosis",
          "Number of Cases",
          null,
          null,
          {
            base_line: 20,
            top: network.margin.top,
            right: network.margin.right,
            bottom: 3 * 20,
            left: 5 * 20,
            font_size: 12,
            rect_size: 14,
            width: network.width / 2,
            height: network.height / 2,
            colorizer: color,
            prefix: network.dom_prefix,
            barchart: true,
            drag: {
              x: network.width * 0.45,
              y: 0,
            },
          }
        );
      };
      network.handle_inline_charts();
      if (e_sel) {
        e_sel.text("Hide time-course plots");
      }
    } else {
      if (e_sel) {
        e_sel.text("Show time-course plots");
      }
      network.network_cluster_dynamics.remove();
      network.network_cluster_dynamics = null;
      network.handle_inline_charts = null;
    }
  };

  if (timeDateUtil.getClusterTimeScale()) {
    if (export_items) {
      export_items.push(["Show time-course plots", event_handler]);
    } else {
      event_handler(self);
    }
  }
}

module.exports = {
  define_attribute_COI_membership,
  define_attribute_binned_vl,
  define_attribute_vl_interpretaion,
  define_attribute_network_update,
  define_attribute_mjc_date_added,
  define_attribute_dx_years,
  define_attribute_dx_month_year,
  define_attribute_dx_last_year,
  define_attribute_sequence_count,
  define_attribute_age_dx,
  priority_groups_all_events,
  priority_groups_compute_node_membership,
  check_for_time_series,
};
