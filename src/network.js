/**
    Functions that help manipulate network JSON and perform 
    other utility operations
*/

var d3 = require("d3"),
  _ = require("underscore"),
  clustersOfInterest = require("./clustersOfInterest.js"),
  kGlobals = require("./globals.js");

/**
    unpack_compact_json:
    If the input network JSON is in compact form, i.e. instead of storing 
        key : value
    it stores
        key : integer index of value
        unique_values: list of values
    convert it to 
        key: value 
        
    The operation is performed in place on the `json` argument
*/

function unpack_compact_json(json) {
  _.each(["Nodes", "Edges"], (key) => {
    var fields = _.keys(json[key]);
    var expanded = [];
    _.each(fields, (f, idx) => {
      var field_values = json[key][f];
      if (!_.isArray(field_values) && "values" in field_values) {
        var expanded_values = [];
        _.each(field_values["values"], (v) => {
          expanded_values.push(field_values["keys"][v]);
        });
        field_values = expanded_values;
      }
      _.each(field_values, (fv, j) => {
        if (idx === 0) {
          expanded.push({});
        }
        expanded[j][f] = fv;
      });
    });
    json[key] = expanded;
  });
}

/**
    normalize_node_attributes
    
    Iterate over node attributes, lower case all the keys for mapping.
    If attributes are found that are not in the data dictionary, attempt to map them using 
    "labels". 
*/
function normalize_node_attributes(json) {
  const label_key_map = _.object(
    _.map(json[kGlobals.network.GraphAttrbuteID], (d, k) => [d.label, k])
  );

  _.each(json.Nodes, (n) => {
    if (kGlobals.network.NodeAttributeID in n) {
      let new_attrs = {};
      if (n[kGlobals.network.NodeAttributeID] !== null) {
        new_attrs = Object.fromEntries(
          Object.entries(n[kGlobals.network.NodeAttributeID]).map(([k, v]) => [
            k.toLowerCase(),
            v,
          ])
        );
      }

      // Map attributes from patient_schema labels to keys, if necessary
      const unrecognizedKeys = _.difference(
        _.keys(new_attrs),
        _.keys(json[kGlobals.network.GraphAttrbuteID])
      );

      if (unrecognizedKeys.length) {
        _.each(unrecognizedKeys, (k) => {
          if (_.contains(_.keys(label_key_map), k)) {
            new_attrs[label_key_map[k]] = new_attrs[k];
            delete new_attrs[k];
          }
        });
      }

      n[kGlobals.network.NodeAttributeID] = new_attrs;
    }
  });
}
/**
    ensure_node_attributes_exist
    
    Iterate over nodes in the network. If a node does not have an array of attributes or 
    data dictionary records, create an empty one. This makes error checking less complex downstream.
*/

function ensure_node_attributes_exist(json) {
  const validate_these_keys = new Set([
    "attributes",
    kGlobals.network.NodeAttributeID,
  ]);
  json.Nodes.forEach((n) => {
    for (const i of validate_these_keys) {
      if (!n[i]) {
        n[i] = [];
      }
    }
  });
}

function check_network_option(options, key, if_absent, if_present) {
  /**
    check_network_option
    
    Given a dictionary option list (can be null) and a key
    checks to see if the key is present
    
        if the key is absent or "options" is null, the return value will be "if_absent" (null by default)
        if the key is present, and `if_present` is set, will return the if_present value, otherwise will return options[key]
*/

  if (options) {
    if (key in options) {
      return if_present === undefined ? options[key] : if_present;
    }
  }
  return if_absent;
}

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

function handle_cluster_click(self, cluster, release) {
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

  var already_fixed = cluster && cluster.fixed;

  if (cluster) {
    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .text("Expand cluster")
      .on("click", (d) => {
        cluster.fixed = 0;
        self.expand_cluster_handler(cluster, true);
        menu_object.style("display", "none");
      });

    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .text("Center on screen")
      .on("click", (d) => {
        cluster.fixed = 0;
        center_cluster_handler(self, cluster);
        menu_object.style("display", "none");
      });

    menu_object
      .append("li")
      .append("a")
      .attr("tabindex", "-1")
      .text((d) => {
        if (cluster.fixed) return "Allow cluster to float";
        return "Hold cluster at current position";
      })
      .on("click", (d) => {
        cluster.fixed = !cluster.fixed;
        menu_object.style("display", "none");
      });

    if (self.isPrimaryGraph) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text((d) => "Show this cluster in separate tab")
        .on("click", (d) => {
          self.open_exclusive_tab_view(
            cluster.cluster_id,
            null,
            null,
            self._distance_gate_options()
          );
          menu_object.style("display", "none");
        });
    }

    if (clustersOfInterest.get_editor()) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text((d) => "Add this cluster to the cluster of interest")
        .on("click", (d) => {
          clustersOfInterest
            .get_editor()
            .append_nodes(_.map(cluster.children, (c) => c.id));
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
        .text("Show on map")
        .on("click", (d) => {
          //console.log(cluster)
          self.open_exclusive_tab_view(
            cluster.cluster_id,
            null,
            (cluster_id) => "Map of cluster: " + cluster_id,
            { showing_on_map: true }
          );
        });
    }

    //cluster.fixed = 1;

    menu_object
      .style("position", "absolute")
      .style("left", String(d3.event.offsetX) + "px")
      .style("top", String(d3.event.offsetY) + "px")
      .style("display", "block");
  } else {
    if (release) {
      release.fixed = 0;
    }
    menu_object.style("display", "none");
  }

  container.on(
    "click",
    (d) => {
      handle_cluster_click(self, null, already_fixed ? null : cluster);
    },
    true
  );
}

module.exports = {
  check_network_option,
  ensure_node_attributes_exist,
  normalize_node_attributes,
  unpack_compact_json,
  handle_cluster_click,
};
