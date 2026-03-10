import _ from "underscore";
import * as d3 from "d3";
import * as Tooltips from "./networkTooltips";
import * as kGlobals from "./globals.js";
import * as misc from "./misc.js";
import * as timeDateUtil from "./timeDateUtil.js";

/**
 * @function handle_node_click
 * @description Handles the click event on a node, displaying a context menu.
 * @param {Object} node - The clicked node object.
 * @param {Object} self - The network object.
 * @param {Object} clustersOfInterest - The COI module.
 * @param {Function} i18n - Translation function.
 * @returns {void}
 */
export function handle_node_click(node, self, clustersOfInterest, i18n) {
  if (d3.event && d3.event.defaultPrevented) return;
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
      .text(i18n("clusters_main")["collapse_cluster"])
      .on("click", (d) => {
        node.fixed = 0;
        self.dispatch.cluster_collapse(node);
        menu_object.style("display", "none");
      });

    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .text((d) => (node.show_label ? "Hide text label" : "Show text label"))
      .on("click", (d) => {
        node.fixed = 0;
        node.show_label = !node.show_label;
        self.update(true);
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

    if (d3.event) {
      menu_object
        .style("position", "absolute")
        .style("left", String(d3.event.offsetX) + "px")
        .style("top", String(d3.event.offsetY) + "px")
        .style("display", "block");
    }
  } else {
    menu_object.style("display", "none");
  }

  container.on(
    "click",
    function (d) {
      handle_node_click.call(this, null, self, clustersOfInterest, i18n);
    },
    false
  );
}

/**
 * @function get_initial_xy
 * @description Calculates initial x and y coordinates for clusters based on packing or treemap layout.
 * @param {boolean} packed - If true, uses a pack layout; otherwise, uses a treemap layout.
 * @param {Object} self - The network object.
 * @returns {Array} A tuple containing the laid out clusters and all clusters.
 */
export function get_initial_xy(packed, self) {
  // create clusters from nodes
  var mapped_clusters = self.get_all_clusters(self.nodes);

  var d_clusters = {
    id: "root",
    children: [],
  };

  // filter out clusters that are to be excluded
  if (self.exclude_cluster_ids) {
    mapped_clusters = _.omit(mapped_clusters, self.exclude_cluster_ids);
  }

  let all_clusters = _.map(mapped_clusters, (value, key) => ({
    cluster_id: key,
    children: value,
  }));

  if (_.size(mapped_clusters) > self.max_points_to_render) {
    let reduced_clusters = _.chain(all_clusters)
      .pairs()
      .sortBy((d) => (-d.children ? d.children.length : 0))
      .value();
    d_clusters.children = [];
    for (let i = 0; i < self.max_points_to_render; i++) {
      d_clusters.children.push({
        cluster_id: reduced_clusters[i][0],
        children: reduced_clusters[i][1],
      });
    }
  } else {
    d_clusters.children = all_clusters;
  }

  var treemap = packed
    ? d3.layout
        .pack()
        .size([self.width, self.height])
        //.sticky(true)
        .children((d) => d.children)
        .value((d) => d.parent.children.length ** 1.5)
        .sort((a, b) => b.value - a.value)
        .padding(5)
    : d3.layout
        .treemap()
        .size([self.width, self.height])
        //.sticky(true)
        .children((d) => d.children)
        .value((d) => d.parent.children.length ** 1.0)
        .sort((a, b) => a.value - b.value)
        .ratio(1);

  var clusters = treemap.nodes(d_clusters);
  return [clusters, all_clusters];
}

/**
 * @function node_pop_on
 * @description Displays a tooltip for a node.
 * @param {Object} self - The network object.
 * @param {Object} d - The node data.
 * @param {HTMLElement} element - The node element.
 * @returns {void}
 */
export function node_pop_on(self, d, element) {
  Tooltips.node_pop_on(self, d, element, kGlobals, misc, timeDateUtil);
}

/**
 * @function node_pop_off
 * @description Hides the node tooltip.
 * @param {HTMLElement} element - The node element.
 * @returns {void}
 */
export function node_pop_off(element) {
  Tooltips.node_pop_off(element);
}

/**
 * @function edge_pop_on
 * @description Displays a tooltip for an edge.
 * @param {Object} self - The network object.
 * @param {Object} e - The edge data.
 * @param {HTMLElement} element - The edge element.
 * @returns {void}
 */
export function edge_pop_on(self, e, element) {
  Tooltips.edge_pop_on(self, e, element, kGlobals);
}

/**
 * @function edge_pop_off
 * @description Hides the edge tooltip.
 * @param {HTMLElement} element - The edge element.
 * @returns {void}
 */
export function edge_pop_off(element) {
  Tooltips.edge_pop_off(element);
}

/**
 * @function cluster_pop_on
 * @description Displays a tooltip for a cluster.
 * @param {Object} self - The network object.
 * @param {Object} d - The cluster data.
 * @param {HTMLElement} element - The cluster element.
 * @returns {void}
 */
export function cluster_pop_on(self, d, element) {
  Tooltips.cluster_pop_on(self, d, element, kGlobals, misc);
}

/**
 * @function cluster_pop_off
 * @description Hides the cluster tooltip.
 * @param {HTMLElement} element - The cluster element.
 * @returns {void}
 */
export function cluster_pop_off(element) {
  Tooltips.cluster_pop_off(element);
}
