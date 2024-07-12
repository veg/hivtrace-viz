/**
    Functions that help manipulate network JSON and perform 
    other utility operations
*/

var d3 = require("d3"),
  _ = require("underscore"),
  kGlobals = require("./globals.js");

function unpack_compact_json(json) {
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

function normalize_node_attributes(json) {
  /**
    normalize_node_attributes
    
    Iterate over node attributes, lower case all the keys for mapping.
    If attributes are found that are not in the data dictionary, attempt to map them using 
    "labels". 
*/
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

function ensure_node_attributes_exist(json) {
  /**
    ensure_node_attributes_exist
    
    Iterate over nodes in the network. If a node does not have an array of attributes or 
    data dictionary records, create an empty one. This makes error checking less complex downstream.
*/

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

function annotate_cluster_changes(self) {
  /**
    annotate_cluster_changes
    
    If the network contains information about cluster changes (new/moved/deleted nodes, etc),
    this function will annotate cluster objects (in place) with various attributes
        "delta" : change in the size of the cluster
        "flag"  : a status flag to be used in the cluster display table
            if set to 2 then TBD
            if set to 3 then TBD
        
*/
  if (self.cluster_attributes) {
    _.each(self.cluster_attributes, (cluster) => {
      if ("old_size" in cluster && "size" in cluster) {
        cluster["delta"] = cluster["size"] - cluster["old_size"];
        cluster["deleted"] =
          cluster["old_size"] +
          (cluster["new_nodes"] ? cluster["new_nodes"] : 0) -
          cluster["size"];
      } else if (cluster["type"] === "new") {
        cluster["delta"] = cluster["size"];
        if ("moved" in cluster) {
          cluster["delta"] -= cluster["moved"];
        }
      } else {
        cluster["delta"] = 0;
      }
      cluster["flag"] = cluster["moved"] || cluster["deleted"] ? 2 : 3;
    });
  }
}

function check_network_option(options, key, if_absent, if_present) {
  /**
    check_network_option
    
    Given a dictionary option list (can be null) and a key
    checks to see if the key is present
    
        if the key is absent or options is null, the return value will be "if_absent" (null by default)
        if the key is present, and `if_present` is set, will return the if_present value, otherwise will return options[key]
*/

  if (options) {
    if (key in options) {
      return _.isUndefined(if_present) ? options[key] : if_present;
    }
  }
  return if_absent;
}

module.exports = {
  annotate_cluster_changes,
  check_network_option,
  ensure_node_attributes_exist,
  normalize_node_attributes,
  unpack_compact_json,
};
