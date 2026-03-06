var _ = require("underscore");

/**
 * unpack_compact_json:
 * If the input network JSON is in compact form, convert it to 
 * key: value pairs.
 * The operation is performed in place on the `json` argument.
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
 * normalize_node_attributes
 * 
 * Iterate over node attributes, lower case all the keys for mapping.
 * If attributes are found that are not in the data dictionary, attempt to map them using 
 * "labels". 
 */
function normalize_node_attributes(json, kGlobals) {
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
 * ensure_node_attributes_exist
 * 
 * Iterate over nodes in the network. If a node does not have an array of attributes or 
 * data dictionary records, create an empty one.
 */
function ensure_node_attributes_exist(json, kGlobals) {
  const validate_these_keys = new Set([
    "attributes",
    kGlobals.network.NodeAttributeID,
  ]);
    
  json.Nodes.forEach((n) => {
    for (const i of validate_these_keys) {
      if (!n[i]) {
        n[i] = i === "attributes" ? [] : {};
      }
    }
  });
}

/**
 * check_network_option
 * 
 * Checks if a key is present in an options dictionary.
 */
function check_network_option(options, key, if_absent, if_present) {
  if (options) {
    if (key in options) {
      return if_present === undefined ? options[key] : if_present;
    }
  }
  return if_absent;
}

/**
 * attribute_node_value_by_id
 *
 * Extracts the value of a given attribute for a node.
 */
function attribute_node_value_by_id(d, id, number, self, kGlobals) {
  try {
    if (kGlobals.network.NodeAttributeID in d && id) {
      if (id in d[kGlobals.network.NodeAttributeID]) {
        let v;

        if (self.json[kGlobals.network.GraphAttrbuteID][id].volatile) {
          v = self.json[kGlobals.network.GraphAttrbuteID][id].map(d, self);
        } else {
          v = d[kGlobals.network.NodeAttributeID][id];
        }

        if (_.isString(v)) {
          if (v.length === 0) {
            return kGlobals.missing.label;
          } else if (number) {
            v = Number(v);
            return _.isNaN(v) ? kGlobals.missing.label : v;
          }
        }
        return v;
      }
    }
  } catch (e) {
    console.log("attribute_node_value_by_id", e, d, id, number);
  }
  return kGlobals.missing.label;
}

/**
 * is_empty
 *
 * Checks if the network is empty.
 */
function is_empty(self) {
  return self.cluster_sizes.length === 0;
}

/**
 * has_network_attribute
 *
 * Checks if a network attribute exists.
 */
function has_network_attribute(self, key, kGlobals) {
  if (kGlobals.network.GraphAttrbuteID in self.json) {
    return key in self.json[kGlobals.network.GraphAttrbuteID];
  }
  return false;
}

module.exports = {
  unpack_compact_json: unpack_compact_json,
  normalize_node_attributes: normalize_node_attributes,
  ensure_node_attributes_exist: ensure_node_attributes_exist,
  check_network_option: check_network_option,
  attribute_node_value_by_id: attribute_node_value_by_id,
  is_empty: is_empty,
  has_network_attribute: has_network_attribute,
};
