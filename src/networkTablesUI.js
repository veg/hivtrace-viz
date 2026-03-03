import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

export function cluster_table_draw_id(element, payload, self, kGlobals, i18n) {
  var this_cell = d3.select(element);
  this_cell.selectAll("*").remove();
  const _is_subcluster = payload[1];
  var cluster_id = payload[0];

  if (_is_subcluster) {
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
              i == 0 ? "Sequence-level view for sub-cluster " + payload[0] : null,
              i == 1 ? { "simplified-mspp": 1 } : null
            );
          })
          .append("i")
          .classed("fa " + icn, true)
          .attr(
            "title",
            i == 1 ? i18n("clusters_tab")["view"] : "Sequence-level view"
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
        .attr("title", i18n("clusters_tab")["view"]);
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
            i == 1 ? i18n("clusters_tab")["view"] : "Sequence-level view"
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
        .attr("title", i18n("clusters_tab")["view"]);
    }
  }
  this_cell
    .append("button")
    .classed("btn btn-sm pull-right", true)
    .style("margin-right", "0.25em")
    .attr("data-toggle", "modal")
    .attr("data-target", self.get_ui_element_selector_by_role("cluster_list", true))
    .attr("data-cluster", cluster_id)
    .append("i")
    .classed("fa fa-list", true)
    .attr("title", i18n("clusters_tab")["list"]);

  return this_cell;
}

export function cluster_table_draw_buttons(element, payload, self, i18n, HTX) {
  var this_cell = d3.select(element);
  this_cell.selectAll("*").remove();
  this_cell.text("");
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
      labels.push([label_diff(payload[4]), payload[4]["flag"]]);
    } else if (payload[4]["type"] === "merged") {
      labels.push([
        "Merged " +
          payload[4]["old_clusters"].join(", ") +
          " " +
          label_diff(payload[4]),
        payload[4]["flag"],
      ]);
    }
  }

  labels.push([
    [
      payload[0]
        ? i18n("clusters_tab")["expand"]
        : i18n("clusters_tab")["collapse"],
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

  if (labels.length === 0) {
    this_cell.text("");
  }

  var buttons = this_cell.selectAll("button").data(labels);
  buttons.enter().append("button");
  buttons.exit().remove();
  buttons
    .classed("btn btn-xs", true)
    .classed("btn-default", (d) => d[1] !== 1 && d[1] !== 2)
    .classed("btn-danger", (d) => d[1] === 2)
    .classed("btn-success", (d) => d[1] === 3)
    .style("margin-right", "0.25em")
    .attr("disabled", (d) => (d[1] === 1 ? "disabled" : null))
    .on("click", (d) => {
      if (d[1] === 0) {
        if (payload[0]) {
          self.expand_cluster(self.clusters[payload[3] - 1], true);
        } else {
          self.collapse_cluster(self.clusters[payload[3] - 1]);
        }
        self.update_volatile_elements(self.cluster_table);
        if (self.subcluster_table) {
          self.update_volatile_elements(self.subcluster_table);
        }
      } else if (d[1] === 2 || d[1] === 3) {
        var shown_types = { Existing: 1, "Newly added": 1 },
          link_class = ["Existing", "Newly added"];

        self.open_exclusive_tab_view(
          payload[3],
          null,
          (cluster_id) => "Cluster " + cluster_id + " [changes view]",
          self._social_view_options(link_class, shown_types, (e) => {
            if (_.isObject(e.source) && HTX.HIVTxNetwork.is_new_node(e.source)) {
              return "Newly added";
            }
            if (_.isObject(e.target) && HTX.HIVTxNetwork.is_new_node(e.target)) {
              return "Newly added";
            }
            return "Existing";
          })
        );
      }
    });

  buttons.each(function (d) {
    var b = d3.select(this);
    b.selectAll("*").remove();
    if (_.isArray(d[0])) {
      b.append("i").classed("fa " + d[0][1], true);
      if (d[0][0]) {
        b.attr("title", d[0][0]);
      }
    } else {
      b.text(d[0]);
    }
  });

  return this_cell;
}

export function draw_cluster_table(
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
) {
  var skip_clusters = options && options["no-clusters"];
  var skip_subclusters = !(options && options["subclusters"]);

  element = element || self.cluster_table;

  if (element) {
    var headers = [
      [
        {
          value: i18n("general")["cluster"] + " ID",
          sort: function (c) {
            return _.map(
              c.value[0].split(kGlobals.SubclusterSeparator),
              (ss) => kGlobals.formats.DotFormatPadder(Number(ss))
            ).join("|");
          },
          help: "Unique cluster ID",
        },
        {
          value: i18n("general")["attributes"],
          sort: function (c) {
            c = c.value();
            if (c[4]) {
              return c[4]["delta"];
            }
            return c[0];
          },
          help: "Visibility in the network tab and other attributes",
        },
        {
          value: i18n("clusters_tab")["size"],
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
        value: i18n("clusters_tab")["number_of_genotypes_in_past_2_months"],
        sort: "value",
        help: "# of cases in cluster genotyped in the last 2 months",
      });

      headers[0].push({
        value: i18n("clusters_tab")["scaled_number_of_genotypes_in_past_2_months"],
        sort: "value",
        help: "# of cases in cluster genotyped in the last 2 months divided by the square-root of the cluster size",
      });
    }

    if (!self._is_CDC_) {
      headers[0].push({
        value:
          i18n("statistics")["links_per_node"] +
          "<br>" +
          i18n("statistics")["mean"] +
          "[" +
          i18n("statistics")["median"] +
          ", IQR]",
        html: true,
      });

      headers[0].push({
        value:
          i18n("statistics")["genetic_distances_among_linked_nodes"] +
          "<br>" +
          i18n("statistics")["mean"] +
          "[" +
          i18n("statistics")["median"] +
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

    _.each(self.clusters, (cluster) => {
      var make_row = function (d, is_subcluster) {
        var this_row = [
          // CLUSTER ID
          {
            value: [d.cluster_id, is_subcluster, d],
            callback: self._cluster_table_draw_id,
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
            callback: self._cluster_table_draw_buttons,
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
                    clustersOfInterest.get_editor().append_node_objects(d.children);
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
                  d3.time.months(
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
                  d3.time.months(
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
}
