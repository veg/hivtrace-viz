/**
    Functions that help manipulate network JSON and perform 
    other utility operations
*/

var d3 = require("d3"),
  _ = require("underscore"),
  clustersOfInterest = require("./clustersOfInterest.js"),
  kGlobals = require("./globals.js"),
  networkUtils = require("./core/networkUtils.js");

/**
    center_cluster_handler
    
    Centers a cluster on the screen and triggers a network update.
    
    @param self: the network object
    @param d: the cluster object to center
*/
function center_cluster_handler(self, d) {
  d.x = self.width / 2;
  d.y = self.height / 2;
  self.update(false, 0.4);
}

/**
    handle_cluster_click
    
    Handle contextual menus for clusters and cluster drag 
    
    @param self: network object
    @param cluster [optional]: the cluster object to act on
    @param release [optional]: the cluster object to release the "fixed" flag from
*/

function handle_cluster_click(self, cluster, release, event) {
  const e = event || d3.event;
  if (e && e.defaultPrevented) return;
  if (e) {
    e.stopPropagation();
  }
  var container = d3.select(self.container);
  var id = self.dom_prefix + "-context-menu";
  var menu_object = container.select("#" + id);

  if (menu_object.empty()) {
    menu_object = container
      .append("ul")
      .attr("id", id)
      .attr("class", "dropdown-menu")
      .attr("role", "menu");
  }

  menu_object.selectAll("li").remove();

  var already_fixed = cluster && cluster.fixed;

  if (cluster) {
    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .attr("href", "#")
      .text("Expand cluster")
      .on("click", (d) => {
        if (d3.event) {
          d3.event.stopPropagation();
        }
        cluster.fixed = 0;
        self.dispatch.cluster_expand(cluster);
        menu_object.style("display", "none");
      });

    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .attr("href", "#")
      .text("Center on screen")
      .on("click", (d) => {
        if (d3.event) {
          d3.event.stopPropagation();
        }
        cluster.fixed = 0;
        center_cluster_handler(self, cluster);
        menu_object.style("display", "none");
      });

    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .attr("href", "#")
      .text(
        cluster.fixed
          ? "Allow cluster to float"
          : "Hold cluster at current position"
      )
      .on("click", (d) => {
        if (d3.event) {
          d3.event.stopPropagation();
        }
        cluster.fixed = !cluster.fixed;
        menu_object.style("display", "none");
      });

    if (self.is_primary_graph) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .attr("href", "#")
        .text("Show this cluster in separate tab")
        .on("click", (d) => {
          if (d3.event) {
            d3.event.stopPropagation();
          }
          self.open_exclusive_tab_view(
            cluster.cluster_id,
            null,
            null,
            _.extend(self._distance_gate_options(), { "simplified-mspp": 1 })
          );
          menu_object.style("display", "none");
        });
    }

    if (clustersOfInterest.get_editor()) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .attr("href", "#")
        .text("Add this cluster to the cluster of interest")
        .on("click", (d) => {
          if (d3.event) {
            d3.event.stopPropagation();
          }
          clustersOfInterest
            .get_editor()
            .append_nodes(_.map(cluster.children, (c) => self.entity_id(c)));
        });
    }

    // Only show the "Show on map" option for clusters with valid country info (for now just 2 letter codes) for each node.
    const show_on_map_enabled = _.every(
      cluster.children,
      (node) => self._get_node_country(node).length === 2
    );

    if (show_on_map_enabled) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .attr("href", "#")
        .text("Show on map")
        .on("click", (d) => {
          if (d3.event) {
            d3.event.stopPropagation();
          }
          //console.log(cluster)
          self.open_exclusive_tab_view(
            cluster.cluster_id,
            null,
            (cluster_id) => "Map of cluster: " + cluster_id,
            { showing_on_map: true }
          );
        });
    }

    if (d3.event || event) {
      const mouse_coords = d3.mouse(container.node());
      menu_object
        .style("position", "absolute")
        .style("left", mouse_coords[0] + 5 + "px")
        .style("top", mouse_coords[1] + 5 + "px")
        .style("display", "block");
    }
  } else {
    if (release) {
      release.fixed = 0;
    }
    menu_object.style("display", "none");
  }

  container.on(
    "click",
    (d) => {
      if (
        d3.event.target === container.node() ||
        d3.event.target.tagName === "svg"
      ) {
        handle_cluster_click(
          self,
          null,
          already_fixed ? null : cluster,
          d3.event
        );
      }
    },
    true
  );
}

module.exports = {
  check_network_option: networkUtils.check_network_option,
  ensure_node_attributes_exist: (json) =>
    networkUtils.ensure_node_attributes_exist(json, kGlobals),
  normalize_node_attributes: (json) =>
    networkUtils.normalize_node_attributes(json, kGlobals),
  unpack_compact_json: networkUtils.unpack_compact_json,
  attribute_node_value_by_id: (node, id, number, self) =>
    networkUtils.attribute_node_value_by_id(node, id, number, self, kGlobals),
  is_empty: (self) => networkUtils.is_empty(self),
  has_network_attribute: (self, key) =>
    networkUtils.has_network_attribute(self, key, kGlobals),
  handle_cluster_click,
};
