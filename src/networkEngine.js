import * as d3 from "d3";
import _ from "underscore";

/**
 * @function initializeNetworkEngine
 * @description Initializes the D3 force layout and creates the SVG elements for the network.
 * @param {Object} self - The network object.
 * @param {Object} nodesTab - The nodes tab module.
 * @returns {void}
 */
export function initializeNetworkEngine(self, nodesTab) {
  self.network_layout = null;
  if (!self.isMJCNetwork) {
    self.network_layout = d3.layout
      .force()
      .charge((d) => {
        if (d.cluster_id) {
          return self.charge_correction * (-15 - 5 * d.children.length ** 0.4);
        }
        return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
      })
      .linkDistance(
        (d) => self.link_scale(d.length) * self.l_scale * 0.2 //Math.max(d.length, 0.005) * l_scale * 10;
      )
      .linkStrength((d) => {
        if (d.support !== undefined) {
          return 0.75 - 0.5 * d.support;
        }
        return 1;
      })
      .chargeDistance(self.l_scale * 0.1)
      .gravity(self.gravity_scale(self.json.Nodes.length))
      .friction(0.25);
  } else {
    self.network_layout = d3.layout.force();
  }
  d3.select(self.container).selectAll("svg").remove();

  if (self.is_primary_graph) {
    d3.select(self.container)
      .selectAll(".my_progress")
      .style("display", "none");
    nodesTab.getNodeTable().selectAll("*").remove();
    self.cluster_table.selectAll("*").remove();
  }

  self.network_svg = d3
    .select(self.container)
    .append("svg:svg")
    .attr("id", self.dom_prefix + "-network-svg")
    .attr("width", self.width + self.margin.left + self.margin.right)
    .attr("height", self.height + self.margin.top + self.margin.bottom);

  self.network_cluster_dynamics = null;

  var legend_drag = d3.behavior
    .drag()
    .on("dragstart", () => {
      if (d3.event && d3.event.sourceEvent)
        d3.event.sourceEvent.stopPropagation();
    })
    .on("drag", function (d) {
      if (d3.event) {
        d3.select(this).attr(
          "transform",
          "translate(" + [d3.event.x, d3.event.y] + ")"
        );
      }
    });
  self.legend_svg = self.network_svg
    .append("g")
    .attr("transform", "translate(5,5)")
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
    .attr("d", "M 0,0 L 2,6 L 0,12 L14,6 Z");

  self.change_window_size();
}

/**
 * @function handleNetworkOptions
 * @description Processes optional configurations for the network graph.
 * @param {Object} self - The network object.
 * @param {Object} options - Additional options for the graph.
 * @returns {void}
 */
export function handleNetworkOptions(self, options) {
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
      self.load_priority_sets(options["priority-sets-url"], is_writeable);
      self.MJCloadOwnPrioritySets(options);
    }

    if (self.showing_diff) {
      self.handle_attribute_categorical("_newly_added");
    }
  }
}
