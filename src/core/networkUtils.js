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

module.exports = {
  unpack_compact_json: unpack_compact_json,
  normalize_node_attributes: normalize_node_attributes,
};
