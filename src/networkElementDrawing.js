import _ from "underscore";
import * as d3 from "d3";

/**
 * @function draw_a_node
 * @description Draws a single node in the network, including its shape, color, and label.
 * @param {Object} self - The network object.
 * @param {HTMLElement} container - The container element for the node.
 * @param {Object} node - The node object to draw.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} misc - Misc utilities.
 * @returns {void}
 */
export function draw_a_node(self, container, node, kGlobals, misc) {
  if (node) {
    container = d3.select(container);

    let symbol_type;

    if (node.hxb2_linked && !node.is_lanl) {
      symbol_type = "cross";
    } else if (node.is_lanl) {
      symbol_type = "triangle-down";
    } else {
      symbol_type = self.node_shaper["shaper"](node);
    }

    node.rendered_size = Math.sqrt(self.node_size(node)) / 2 + 2;

    container
      .selectAll("path")
      .attr("d", misc.symbol(symbol_type).size(self.node_size(node)))
      .style("fill", (d) => self.node_color(d))
      .classed(
        "multi_sequence",
        (d) =>
          _.isArray(d[kGlobals.network.AliasedSequencesID]) &&
          d[kGlobals.network.AliasedSequencesID].length > 1
      );

    if (node.show_label) {
      if (container.selectAll("text").empty()) {
        node.label_x = 0;
        node.label_y = 0;
        container
          .append("text")
          .classed("node-label", true)
          .text(node.id)
          .attr(
            "transform",
            "translate(" +
              node.rendered_size * 1.25 +
              "," +
              node.rendered_size * 0.5 +
              ")"
          )
          .datum(node)
          .call(self.node_label_drag);
      }
    } else {
      container.selectAll("text").remove();
    }

    container
      .attr("class", "node")
      .classed(
        "selected_object",
        (d) => d.match_filter && !self.hide_unselected
      )
      .classed("injected_object", (d) => d.node_class === "injected")
      .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
      .style("opacity", (d) => self.node_opacity(d))
      .style("display", (d) => {
        if (d.is_hidden) return "none";
        return null;
      })
      .call(
        self.network_layout.drag().on("dragstart", function (d) {
          if (d3.event && d3.event.sourceEvent)
            d3.event.sourceEvent.stopPropagation();
          self.dispatch.node_pop_off(this);
        })
      )
      .on("dragend", (d) => {
        if (d3.event && d3.event.sourceEvent)
          d3.event.sourceEvent.stopPropagation();
      })
      .on("click", function (d) {
        if (d3.event) {
          d3.event.stopPropagation();
        }
        self.dispatch.node_click(d);
      })
      .on("mouseover", function (d) {
        self.dispatch.node_pop_on(d, this);
      })
      .on("mouseout", function (d) {
        self.dispatch.node_pop_off(this);
      });
  }
}

/**
 * @function draw_a_cluster
 * @description Draws a single cluster in the network as a pie chart of its constituent nodes.
 * @param {Object} self - The network object.
 * @param {HTMLElement} container - The container element for the cluster.
 * @param {Object} the_cluster - The cluster object to draw.
 * @returns {void}
 */
export function draw_a_cluster(self, container, the_cluster) {
  var container_group = d3.select(container);

  var draw_from = the_cluster["binned_attributes"]
    ? the_cluster["binned_attributes"].map((d) => d.concat([0]))
    : [[null, 1, 0]];

  if (the_cluster.match_filter) {
    draw_from = draw_from.concat([
      ["selected", the_cluster.match_filter, 1],
      [
        "not selected",
        the_cluster.children.length - the_cluster.match_filter,
        1,
      ],
    ]);
  }

  var sums = [
    d3.sum(
      draw_from.filter((d) => d[2] === 0),
      (d) => d[1]
    ),
    d3.sum(
      draw_from.filter((d) => d[2] !== 0),
      (d) => d[1]
    ),
  ];

  var running_totals = [0, 0];

  draw_from = draw_from.map((d) => {
    var index = d[2];
    var v = {
      container: container,
      cluster: the_cluster,
      startAngle: (running_totals[index] / sums[index]) * 2 * Math.PI,
      endAngle: ((running_totals[index] + d[1]) / sums[index]) * 2 * Math.PI,
      name: d[0],
      rim: index > 0,
    };
    running_totals[index] += d[1];
    return v;
  });

  var arc_radius = self.cluster_box_size(the_cluster) * 0.5;
  the_cluster.rendered_size = arc_radius + 2;
  var paths = container_group.selectAll("path").data(draw_from);
  paths.enter().append("path");
  paths.exit().remove();

  paths
    .classed("cluster", true)
    .classed("hiv-trace-problematic", (d) => the_cluster.hxb2_linked && !d.rim)
    .classed("hiv-trace-selected", (d) => d.rim)
    .attr("d", (d) =>
      (d.rim
        ? d3.svg
            .arc()
            .innerRadius(arc_radius + 2)
            .outerRadius(arc_radius + 5)
        : d3.svg.arc().innerRadius(0).outerRadius(arc_radius))(d)
    )
    .style("fill", (d, i) => {
      if (d.rim) {
        return self.colorizer["selected"](d.name);
      }

      if (the_cluster["gradient"]) {
        return "url(#" + the_cluster["gradient"] + ")";
      }

      return self.cluster_color(the_cluster, d.name);
    })
    .style("stroke-linejoin", (d, i) => (draw_from.length > 1 ? "round" : ""))
    .style("display", (d) => {
      if (the_cluster.is_hidden) return "none";
      return null;
    })
    .on("click", function (d) {
      if (d3.event) {
        d3.event.stopPropagation();
      }
      self.dispatch.cluster_click(the_cluster);
    })
    .on("mouseover", function (d) {
      self.dispatch.cluster_pop_on(the_cluster, this);
    })
    .on("mouseout", function (d) {
      self.dispatch.cluster_pop_off(this);
    });
}
