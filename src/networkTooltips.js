import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

/**
 * @function toggle_tooltip
 * @description Toggles a tooltip on a given element.
 * @param {HTMLElement} element - The element to toggle the tooltip on.
 * @param {boolean} turn_on - If true, shows the tooltip; otherwise, hides it.
 * @param {string} title - The title of the tooltip.
 * @param {string} tag - The content of the tooltip.
 * @param {string} container - The container for the tooltip.
 * @returns {void}
 */
export function toggle_tooltip(element, turn_on, title, tag, container) {
  if (!element) {
    return;
  }

  if (turn_on && !element.tooltip) {
    // check to see if there are any other tooltips shown
    $("[role='tooltip']").each(function (d) {
      $(this).remove();
    });

    var this_box = $(element);

    element.tooltip = this_box.tooltip({
      title: title + "<br>" + tag,
      html: true,
      container: container ? container : "body",
    });

    _.delay(_.bind(element.tooltip.tooltip, element.tooltip), 500, "show");
  } else if (!turn_on && element.tooltip) {
    element.tooltip.tooltip("destroy");
    element.tooltip = undefined;
  }
}

/**
 * @function node_info_string
 * @description Generates an information string for a node, including its degree, clustering coefficient, and other attributes.
 * @param {Object} self - The network graph instance.
 * @param {Object} n - The node object.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} misc - Miscellaneous helpers.
 * @param {Object} timeDateUtil - Time and date utilities.
 * @returns {string} The information string for the node.
 */
export function node_info_string(self, n, kGlobals, misc, timeDateUtil) {
  var str;

  if (!self._is_CDC_) {
    str =
      "Degree <em>" +
      n.degree +
      "</em><br>Clustering coefficient <em> " +
      misc.format_value(n.lcc, kGlobals.formats.FloatFormat) +
      "</em>";
  } else {
    str = "# links <em>" + n.degree + "</em>";
    try {
      if (
        n[kGlobals.network.AliasedSequencesID] &&
        n[kGlobals.network.AliasedSequencesID].length > 1
      ) {
        str +=
          "<br> Represents <em>" +
          n[kGlobals.network.AliasedSequencesID].length +
          "</em> sequences";
      }
    } catch {}
  }

  _.each(
    _.union(self._additional_node_pop_fields, [
      self.colorizer["category_id"],
      self.node_shaper["id"],
      self.colorizer["opacity_id"],
    ]),
    (key) => {
      if (key) {
        if (key in self.json[kGlobals.network.GraphAttrbuteID]) {
          var attribute = self.attribute_node_value_by_id(n, key);

          if (
            self.json[kGlobals.network.GraphAttrbuteID][key]["type"] === "Date"
          ) {
            try {
              attribute = timeDateUtil.DateViewFormat(attribute);
            } catch (err) {
              // do nothing
            }
          }
          if (attribute) {
            str +=
              "<br>" +
              self.json[kGlobals.network.GraphAttrbuteID][key].label +
              " <em>" +
              attribute +
              "</em>";
          }
        }
      }
    }
  );

  return str;
}

/**
 * @function edge_info_string
 * @description Generates an information string for an edge, including its length and support.
 * @param {Object} n - The edge object.
 * @param {Object} kGlobals - Global constants.
 * @returns {string} The information string for the edge.
 */
export function edge_info_string(n, kGlobals) {
  var str = "Length <em>" + kGlobals.formats.FloatFormat(n.length) + "</em>";
  if ("support" in n) {
    str +=
      "<br>Worst triangle-based support (p): <em>" +
      kGlobals.formats.FloatFormat(n.support) +
      "</em>";
  }

  return str;
}

/**
 * @function cluster_info_string
 * @description Generates an information string for a cluster, including its size, degree, and other attributes.
 * @param {Object} self - The network graph instance.
 * @param {string} id - The ID of the cluster.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} misc - Miscellaneous helpers.
 * @returns {string} The information string for the cluster.
 */
export function cluster_info_string(self, id, kGlobals, misc) {
  var the_cluster = self.clusters[self.cluster_mapping[id]],
    attr_info = the_cluster["binned_attributes"];

  var str;

  if (self._is_CDC_) {
    str =
      "<strong>" +
      (self.has_multiple_sequences
        ? self.cluster_sizes_in_entities[id]
        : self.cluster_sizes[id - 1]) +
      "</strong> individuals." +
      (self.has_multiple_sequences
        ? "<br><strong> " + self.cluster_sizes[id - 1] + "</strong> sequences."
        : "") +
      "<br>Mean links/individual <em> = " +
      kGlobals.formats.FloatFormat(the_cluster.degrees["mean"]) +
      "</em>" +
      "<br>Max links/individual <em> = " +
      the_cluster.degrees["max"] +
      "</em>";
  } else {
    str =
      "<strong>" +
      self.cluster_sizes[id - 1] +
      "</strong> nodes." +
      "<br>Mean degree <em>" +
      kGlobals.formats.FloatFormat(the_cluster.degrees["mean"]) +
      "</em>" +
      "<br>Max degree <em>" +
      the_cluster.degrees["max"] +
      "</em>" +
      "<br>Clustering coefficient <em> " +
      misc.format_value(the_cluster.cc, kGlobals.formats.FloatFormat) +
      "</em>";
  }

  if (attr_info) {
    attr_info.forEach((d) => {
      str += "<br>" + d[0] + " <em>" + d[1] + "</em>";
    });
  }

  return str;
}

/**
 * @function node_pop_on
 * @description Shows a tooltip for a node when the mouse is over it.
 */
export function node_pop_on(self, d, element, kGlobals, misc, timeDateUtil) {
  if (d3.event.defaultPrevented) return;

  toggle_tooltip(
    element,
    true,
    (self._is_CDC_ ? "Individual " : "Node ") + self.entity_id(d),
    node_info_string(self, d, kGlobals, misc, timeDateUtil),
    self.container
  );
}

/**
 * @function node_pop_off
 * @description Hides the tooltip for a node when the mouse is no longer over it.
 */
export function node_pop_off(element) {
  if (d3.event.defaultPrevented) return;
  toggle_tooltip(element, false);
}

/**
 * @function edge_pop_on
 * @description Shows a tooltip for an edge when the mouse is over it.
 */
export function edge_pop_on(self, e, element, kGlobals) {
  toggle_tooltip(
    element,
    true,
    e.source.id + " - " + e.target.id,
    edge_info_string(e, kGlobals),
    self.container
  );
}

/**
 * @function edge_pop_off
 * @description Hides the tooltip for an edge when the mouse is no longer over it.
 */
export function edge_pop_off(element) {
  toggle_tooltip(element, false);
}

/**
 * @function cluster_pop_on
 * @description Shows a tooltip for a cluster when the mouse is over it.
 */
export function cluster_pop_on(self, d, element, kGlobals, misc) {
  toggle_tooltip(
    element,
    true,
    "Cluster " + d.cluster_id,
    cluster_info_string(self, d.cluster_id, kGlobals, misc),
    self.container
  );
}

/**
 * @function cluster_pop_off
 * @description Hides the tooltip for a cluster when the mouse is no longer over it.
 */
export function cluster_pop_off(element) {
  toggle_tooltip(element, false);
}
