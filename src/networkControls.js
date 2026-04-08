import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

export function setup_network_controls(
  self,
  i18n,
  helpers,
  timeDateUtil,
  tables,
  misc,
  clustersOfInterest
) {
  var cluster_ui_container = d3.select(
    self.get_ui_element_selector_by_role("cluster_operations_container")
  );

  if (cluster_ui_container.empty()) return;

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
    self.default_layout(packed);
    self.network_layout.tick();
    self.update();
    _.each(fixed, (obj) => {
      obj.fixed = true;
    });
  };

  var cluster_commands = [
    [
      i18n("clusters_main")["export_colors"],
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
      i18n("clusters_main")["expand_all"],
      function () {
        return self.expand_some_clusters();
      },
      true,
      "hivtrace-expand-all",
    ],
    [
      i18n("clusters_main")["collapse_all"],
      function () {
        return self.collapse_some_clusters();
      },
      true,
      "hivtrace-collapse-all",
    ],
    [
      i18n("clusters_main")["expand_filtered"],
      function () {
        return self.expand_some_clusters(
          self.select_some_clusters((n) => n.match_filter)
        );
      },
      true,
      "hivtrace-expand-filtered",
    ],
    [
      i18n("clusters_main")["collapse_filtered"],
      function () {
        return self.collapse_some_clusters(
          self.select_some_clusters((n) => n.match_filter)
        );
      },
      true,
      "hivtrace-collapse-filtered",
    ],
    [
      i18n("clusters_main")["fix_all_objects_in_place"],
      _.partial(fix_handler, true),
      true,
      "hivtrace-fix-in-place",
    ],
    [
      i18n("clusters_main")["allow_all_objects_to_float"],
      _.partial(fix_handler, false),
      true,
      "hivtrace-allow-to-float",
    ],
    [
      i18n("clusters_main")["reset_layout"] + " [packed]",
      _.partial(layout_reset_handler, true),
      true,
      "hivtrace-reset-layout",
    ],
    [
      i18n("clusters_main")["reset_layout"] + " [tiled]",
      _.partial(layout_reset_handler, false),
      true,
      "hivtrace-reset-layout",
    ],
    [
      i18n("network_tab")["show_labels_for_all"],
      _.partial(node_label_handler, true),
      true,
      "hivtrace-node-labels-on",
    ],
    [
      i18n("network_tab")["hide_labels_for_all"],
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
        toggle_hxb2(self);
      },
      self.has_hxb2_links,
      "hivtrace-hide-problematic-clusters",
    ],
    [
      i18n("network_tab")["highlight_unsupported_edges"],
      function (item) {
        if (self.highlight_unsuppored_edges) {
          d3.select(item).selectAll(".fa-square-check").remove();
        } else {
          d3.select(item)
            .insert("i", ":first-child")
            .attr("class", "fa-solid fa-square-check");
        }
        toggle_highlight_unsupported_edges(self);
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
          d3.select(item).selectAll(".fa-square-check").remove();
        } else {
          d3.select(item)
            .insert("i", ":first-child")
            .attr("class", "fa-solid fa-square-check");
        }
        toggle_diff(self);
      },
      true,
      "hivtrace-show-network-diff",
      self.showing_diff,
    ]);
  }

  if (timeDateUtil.getClusterTimeScale()) {
    cluster_commands.push([
      i18n("network_tab")["only_recent_clusters"],
      function (item) {
        if (self.using_time_filter) {
          d3.select(item).selectAll(".fa-square-check").remove();
        } else {
          d3.select(item)
            .insert("i", ":first-child")
            .attr("class", "fa-solid fa-square-check");
        }
        toggle_time_filter(self, timeDateUtil);
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
        .classed("dropdown-item", true)
        .text(item[0])
        .attr("href", "#")
        //.attr("id", item[3])
        .on("click", function (e) {
          handler_callback(this);
          if (d3.event) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
          }
        });

      if (item.length > 4) {
        // checkbox
        line_item.text("");
        if (item[4]) {
          line_item
            .insert("i", ":first-child")
            .attr("class", "fa-solid fa-square-check");
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
      .classed("btn btn-outline-secondary btn-sm", true)
      .attr("title", i18n("network_tab")["expand_spacing"])
      .on("click", (d) => {
        self.change_spacing(5 / 4);
      })
      .append("i")
      .attr("class", "fa-solid fa-plus");
    button_group
      .append("button")
      .classed("btn btn-outline-secondary btn-sm", true)
      .attr("title", i18n("network_tab")["compress_spacing"])
      .on("click", (d) => {
        self.change_spacing(4 / 5);
      })
      .append("i")
      .attr("class", "fa-solid fa-minus");
    button_group
      .append("button")
      .classed("btn btn-outline-secondary btn-sm", true)
      .attr("title", i18n("network_tab")["enlarge_window"])
      .on("click", (d) => {
        self.change_window_size(100, true);
      })
      .append("i")
      .attr("class", "fa-solid fa-expand");
    button_group
      .append("button")
      .classed("btn btn-outline-secondary btn-sm", true)
      .attr("title", i18n("network_tab")["shrink_window"])
      .on("click", (d) => {
        self.change_window_size(-100, true);
      })
      .append("i")
      .attr("class", "fa-solid fa-compress");

    if (!self._is_CDC_) {
      button_group
        .append("button")
        .classed("btn btn-outline-secondary btn-sm", true)
        .attr("title", "Compute graph statistics")
        .attr("id", "hivtrace-compute-graph-statistics")
        .on("click", function (d) {
          _.bind(self.compute_graph_stats, this)();
        })
        .append("i")
        .attr("class", "fa-solid fa-calculator");
    } else {
      button_group
        .append("button")
        .classed("btn btn-outline-secondary btn-sm", true)
        .attr("title", i18n("network_tab")["toggle_epicurve"])
        .attr("id", "hivtrace-toggle-epi-curve")
        .on("click", (d) => {
          self.check_for_time_series();
        })
        .append("i")
        .attr("class", "fa-solid fa-chart-line");
    }

    var export_image = d3.select(
      self.get_ui_element_selector_by_role("export_image")
    );

    if (!export_image.empty()) {
      export_image.selectAll("div").remove();

      const buttonGroupDropdown = export_image
        .append("div")
        .classed("dropdown", true);

      const dropdownList = buttonGroupDropdown
        .append("ul")
        .classed("dropdown-menu", true)
        .attr("aria-labelledby", "dropdownImg");

      dropdownList
        .append("li")
        .append("a")
        .classed("dropdown-item", true)
        .attr("href", "#")
        .text("SVG")
        .on("click", (d) => {
          helpers.save_image("svg", "#" + self.dom_prefix + "-network-svg");
        });

      dropdownList
        .append("li")
        .append("a")
        .classed("dropdown-item", true)
        .attr("href", "#")
        .text("PNG")
        .on("click", (d) => {
          helpers.save_image("png", "#" + self.dom_prefix + "-network-svg");
        });

      const imgBtn = buttonGroupDropdown
        .append("button")
        .attr("data-bs-toggle", "dropdown")
        .classed("btn btn-outline-secondary btn-sm dropdown-toggle float-end", true)
        .attr("title", i18n("network_tab")["save_image"])
        .attr("id", "hivtrace-export-image");

      imgBtn.append("i").attr("class", "fa-solid fa-image");
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

  $(self.get_ui_element_selector_by_role("set_min_cluster_size"))
    .off("change")
    .on(
      "change",
      _.throttle((e) => {
        self.minimum_cluster_size = e.target.value;
        self.update(false);
      }, 250)
    );

  // pairwise_table_pecentage is in the Attributes tab, not nested in the bar
  $(self.get_ui_element_selector_by_role("pairwise_table_pecentage", true))
    .off("change")
    .on(
      "change",
      _.throttle((e) => {
        self.show_percent_in_pairwise_table = !self.show_percent_in_pairwise_table;
        self.render_binned_table(
          "attribute_table",
          self.colorizer["category_map"],
          self.colorizer["category_pairwise"]
        );
      }, 250)
    );
}

export function setup_priority_set_merge_controls(
  self,
  tables,
  clustersOfInterest
) {
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
              .append_nodes([...current_node_set], current_node_objects, true);
          }
          bootstrap.Modal.getOrCreateInstance(modal.node()).hide();
        };

        proceed_btn.attr("disabled", "disabled").on("click", handle_merge);

        var rows = [];
        _.each(self.defined_priority_groups, (pg) => {
          const my_overlaps = new Set();
          _.each(pg.node_objects, (n) => {
            _.each([...self.priority_node_overlap[self.entity_id(n)]], (ps) => {
              if (ps !== pg.name) {
                my_overlaps.add(ps);
              }
            });
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

        const table_container = modal.select(
          self.get_ui_element_selector_by_role("priority_set_merge_table", true)
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
    }
  );
}

export function setup_priority_set_controls(
  self,
  i18n,
  helpers,
  timeDateUtil,
  tables,
  misc,
  clustersOfInterest
) {
  var priority_ui_container = d3.select(
    $(self.get_ui_element_selector_by_role("priority_operations_container")).get(0)
  );

  if (priority_ui_container.empty()) return;

  priority_ui_container.selectAll("li").remove();

  var priority_commands = [
    [
      "Clear all clusters of interest",
      function () {
        if (confirm("Are you sure you want to clear all clusters of interest?")) {
          self.defined_priority_groups = [];
          self.priority_groups_compute_overlap();
          self.draw_priority_set_table();
          self.update();
        }
      },
      true,
    ],
    [
      "Merge clusters of interest",
      function () {
        bootstrap.Modal.getOrCreateInstance(
          $(
            self.get_ui_element_selector_by_role("priority_set_merge", true)
          ).get(0)
        ).show();
      },
      true,
    ],
  ];

  priority_commands.forEach(function (item, index) {
    if (item[2]) {
      this.append("li")
        .append("a")
        .classed("dropdown-item", true)
        .text(item[0])
        .attr("href", "#")
        .on("click", function (e) {
          item[1](this);
          if (d3.event) d3.event.preventDefault();
        });
    }
  }, priority_ui_container);

  setup_priority_set_merge_controls(self, tables, clustersOfInterest);
}

/**
 * @function toggle_hxb2
 * @description Toggles the visibility of problematic (HXB2-linked) clusters.
 * @param {Object} self - The network object.
 * @returns {void}
 */
export function toggle_hxb2(self) {
  self.hide_hxb2 = !self.hide_hxb2;
  self.update();
}

/**
 * @function toggle_diff
 * @description Toggles the visibility of changes since the last network update.
 * @param {Object} self - The network object.
 * @returns {void}
 */
export function toggle_diff(self) {
  self.showing_diff = !self.showing_diff;
  if (self.showing_diff) {
    self.cluster_filtering_functions["new"] = self.filter_if_added;
  } else {
    delete self.cluster_filtering_functions["new"];
  }
  self.update();
}

/**
 * @function toggle_highlight_unsupported_edges
 * @description Toggles the highlighting of unsupported edges.
 * @param {Object} self - The network object.
 * @returns {void}
 */
export function toggle_highlight_unsupported_edges(self) {
  self.highlight_unsuppored_edges = !self.highlight_unsuppored_edges;
  self.update();
}

/**
 * @function toggle_time_filter
 * @description Toggles the time filter for displaying recent clusters.
 * @param {Object} self - The network object.
 * @param {Object} timeDateUtil - The time/date utility module.
 * @returns {void}
 */
export function toggle_time_filter(self, timeDateUtil) {
  if (self.using_time_filter) {
    self.using_time_filter = null;
  } else {
    self.using_time_filter = timeDateUtil.getCurrentDate();
    self.using_time_filter.setFullYear(self.using_time_filter.getFullYear() - 1);
  }

  if (self.using_time_filter) {
    self.cluster_filtering_functions["recent"] = self.filter_time_period;
  } else {
    delete self.cluster_filtering_functions["recent"];
  }
  self.update();
}
