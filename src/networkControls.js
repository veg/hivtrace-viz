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
        self.toggle_hxb2();
      },
      self.has_hxb2_links,
      "hivtrace-hide-problematic-clusters",
    ],
    [
      i18n("network_tab")["highlight_unsupported_edges"],
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
      i18n("network_tab")["only_recent_clusters"],
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
      .attr("title", i18n("network_tab")["expand_spacing"])
      .on("click", (d) => {
        self.change_spacing(5 / 4);
      })
      .append("i")
      .classed("fa fa-plus", true);
    button_group
      .append("button")
      .classed("btn btn-default btn-sm", true)
      .attr("title", i18n("network_tab")["compress_spacing"])
      .on("click", (d) => {
        self.change_spacing(4 / 5);
      })
      .append("i")
      .classed("fa fa-minus", true);
    button_group
      .append("button")
      .classed("btn btn-default btn-sm", true)
      .attr("title", i18n("network_tab")["enlarge_window"])
      .on("click", (d) => {
        self.change_window_size(100, true);
      })
      .append("i")
      .classed("fa fa-expand", true);
    button_group
      .append("button")
      .classed("btn btn-default btn-sm", true)
      .attr("title", i18n("network_tab")["shrink_window"])
      .on("click", (d) => {
        self.change_window_size(-100, true);
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
        .attr("title", i18n("network_tab")["toggle_epicurve"])
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
        .attr("title", i18n("network_tab")["save_image"])
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
        self.show_percent_in_pairwise_table = !self.show_percent_in_pairwise_table;
        self.render_binned_table(
          "attribute_table",
          self.colorizer["category_map"],
          self.colorizer["category_pairwise"]
        );
      }, 250)
    );
}
