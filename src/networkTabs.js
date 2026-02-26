import _ from "underscore";
import * as misc from "./misc";

/**
 * Closes an exclusive tab and restores the previous one.
 * @param {string} tab_element - The ID of the tab element to close.
 * @param {string} tab_content - The ID of the tab content to remove.
 * @param {string} restore_to_tag - The ID of the tab to restore to.
 */
export function open_exclusive_tab_close(tab_element, tab_content, restore_to_tag) {
  $(restore_to_tag).tab("show");
  $("#" + tab_element).remove();
  $("#" + tab_content).remove();
}

/**
 * Opens an exclusive tab view for a specific cluster.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {string} cluster_id - The ID of the cluster to view.
 * @param {Function} custom_filter - A custom filter function for nodes.
 * @param {Function} custom_name - A function to generate a custom name for the tab.
 * @param {Object} additional_options - Additional options for the tab view.
 * @param {boolean} include_injected_edges - If true, includes injected edges.
 * @param {Object} context - Contextual variables from the main graph scope.
 * @returns {Object} The cluster view object.
 */
export function open_exclusive_tab_view(
  self,
  cluster_id,
  custom_filter,
  custom_name,
  additional_options,
  include_injected_edges,
  context
) {
  const { kGlobals, helpers, attributes } = context;

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

  return open_exclusive_tab_view_aux(
    self,
    filtered_json,
    custom_name ? custom_name(cluster_id) : "Cluster " + cluster_id,
    additional_options,
    context
  );
}

/**
 * Auxiliary function to open an exclusive tab view.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} filtered_json - The filtered JSON data for the view.
 * @param {string} title - The title of the new tab.
 * @param {Object} option_extras - Extra options for the tab.
 * @param {Object} context - Contextual variables.
 * @returns {Object} The cluster view object or the ID of the new tab content.
 */
export function open_exclusive_tab_view_aux(
  self,
  filtered_json,
  title,
  option_extras,
  context
) {
  const { attributes, parent_container, options, hivtrace_cluster_network_graph } = context;

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
      open_exclusive_tab_close(
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
    if (e.relatedTarget) {
      go_here_when_closed = e.relatedTarget;
    }
  });

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

    cluster_options["today"] = self.today;
    cluster_options["auto_expand_single_cluster"] = true;
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
  } else {
    return new_tab_content.attr("id");
  }
  return cluster_view;
}
