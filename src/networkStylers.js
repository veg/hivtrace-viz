import * as d3 from "d3";
import _ from "underscore";

/**
 * Determines the size of a node based on its degree.
 * @param {Object} d - The node object.
 * @returns {number} The size of the node.
 */
export function node_size(d) {
  var r = 5 + Math.sqrt(d.degree);
  return 4 * r * r;
}

/**
 * Checks if a node has the 'multiple_membership' attribute.
 * @param {Object} n - The node object.
 * @returns {boolean} True if the node has multiple memberships, false otherwise.
 */
export function node_multiple_membership(n) {
  return n["multiple_membership"];
}

/**
 * Determines the color of a node based on its attributes and the current colorizer settings.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} d - The node object.
 * @param {Object} kGlobals - Global constants.
 * @returns {string} The color of the node.
 */
export function node_color(self, d, kGlobals) {
  var hms = (d, c) => {
    if (node_multiple_membership(d)) {
      return "url(#" + self.generate_cross_hatch_pattern(c) + ")";
    }
    return c;
  };

  if (self.colorizer["category_id"]) {
    var v = self.attribute_node_value_by_id(d, self.colorizer["category_id"]);
    if (self.colorizer["continuous"]) {
      if (v === kGlobals.missing.label) {
        return hms(d, kGlobals.missing.color);
      }
    }
    return hms(d, self.colorizer["category"](v));
  }

  if (d.hxb2_linked) {
    return hms(d, "black");
  }

  if (d.is_lanl) {
    return hms(d, "red");
  }

  return hms(d, "gray");
}

/**
 * Determines the opacity of a node based on the current opacity settings.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} d - The node object.
 * @returns {number} The opacity of the node.
 */
export function node_opacity(self, d) {
  if (self.colorizer["opacity"]) {
    return self.colorizer["opacity"](
      self.attribute_node_value_by_id(d, self.colorizer["opacity_id"], true)
    );
  }
  return 1;
}

/**
 * Determines the color of a cluster based on its attributes.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} d - The cluster object.
 * @param {string} type - The type of the cluster.
 * @returns {string} The color of the cluster.
 */
export function cluster_color(self, d, type) {
  if (d["binned_attributes"]) {
    return self.colorizer["category"](type);
  }
  return "#bdbdbd";
}

/**
 * Generates the SVG path for a link, optionally with a pull effect.
 * @param {Object} d - The link data object.
 * @returns {string} The SVG path string.
 */
export function link_path_generator(d) {
  var pull = d.pull || 0.0;
  var path;

  if (pull !== 0.0) {
    var dist_x = d.target.x - d.source.x;
    var dist_y = d.target.y - d.source.y;
    pull *= Math.sqrt(dist_x * dist_x + dist_y * dist_y);

    var theta = Math.PI / 6; // 18deg additive angle
    var alpha = dist_x ? Math.atan(-dist_y / dist_x) : Math.PI / 2; // angle with the X axis

    if (pull < 0) {
      theta = -theta;
      pull = -pull;
    }

    var dx = Math.cos(theta + alpha) * pull,
      dx2 = Math.cos(theta - alpha) * pull;

    var dy = Math.sin(theta + alpha) * pull,
      dy2 = Math.sin(theta - alpha) * pull;

    var s1, s2;
    if (d.target.x >= d.source.x) {
      s1 = [dx, -dy];
      s2 = [-dx2, -dy2];
    } else {
      s1 = [-dx2, -dy2];
      s2 = [dx, -dy];
    }

    path =
      "M" +
      d.source.x +
      " " +
      d.source.y +
      " C " +
      (d.source.x + s1[0]) +
      " " +
      (d.source.y + s1[1]) +
      ", " +
      (d.target.x + s2[0]) +
      " " +
      (d.target.y + s2[1]) +
      ", " +
      d.target.x +
      " " +
      d.target.y;
  } else {
    path =
      "M" +
      d.source.x +
      " " +
      d.source.y +
      " L " +
      d.target.x +
      " " +
      d.target.y;
  }
  return path;
}

/**
 * Computes a radial gradient for a cluster based on a categorical attribute.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} cluster - The cluster object.
 * @param {string} cat_id - The category ID to use for the gradient.
 * @param {Object} kGlobals - Global constants.
 * @returns {string} The ID of the generated gradient.
 */
export function compute_cluster_gradient(self, cluster, cat_id, kGlobals) {
  if (cat_id) {
    var id = self.dom_prefix + "-cluster-gradient-" + self.gradient_id++;
    var gradient = self.network_svg
      .selectAll("defs")
      .append("radialGradient")
      .attr("id", id);
    var values = _.map(cluster.children, (node) => {
      var value = self.attribute_node_value_by_id(node, cat_id);
      return value === kGlobals.missing.label ? Infinity : value;
    }).sort((a, b) => 0 + a - (0 + b));
    var finite = _.filter(values, (d) => d < Infinity);
    var infinite = values.length - finite.length;

    if (infinite) {
      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", kGlobals.missing.color);
      gradient
        .append("stop")
        .attr("offset", String((infinite / values.length) * 100) + "%")
        .attr("stop-color", kGlobals.missing.color);
    }

    _.each(finite, (value, index) => {
      gradient
        .append("stop")
        .attr(
          "offset",
          String(((1 + index + infinite) * 100) / values.length) + "%"
        )
        .attr("stop-color", self.colorizer["category"](value));
    });

    return id;
  }
  return null;
}
