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

module.exports = {
  unpack_compact_json: unpack_compact_json,
};
