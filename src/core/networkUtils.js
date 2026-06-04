var _ = require("underscore");

function unpack_column(col, length) {
  if (Array.isArray(col)) {
    return col;
  }
  
  if (col === null || typeof col !== "object") {
    return Array(length).fill(col);
  }

  // Handle Front coding
  if ("front" in col) {
    var unpacked_lens = unpack_column(col.lens, length);
    var unpacked_suffixes = unpack_column(col.suffixes, length);
    var arr = [unpacked_suffixes[0]];
    for (var i = 1; i < length; i++) {
      var common_len = unpacked_lens[i];
      var suffix = unpacked_suffixes[i];
      var prev = arr[i - 1];
      arr.push(prev.substring(0, common_len) + suffix);
    }
    return arr;
  }

  // Handle RLE coding
  if ("rle" in col) {
    var runs_len = col.len;
    var unpacked_values = unpack_column(col.values, runs_len);
    var unpacked_runs = unpack_column(col.runs, runs_len);
    var arr = [];
    for (var i = 0; i < runs_len; i++) {
      var val = unpacked_values[i];
      var run = unpacked_runs[i];
      for (var j = 0; j < run; j++) {
        arr.push(val);
      }
    }
    return arr;
  }

  // Handle Delta coding
  if ("delta" in col) {
    var diffs = unpack_column(col.values, length);
    var arr = Array(length);
    arr[0] = diffs[0];
    for (var i = 1; i < length; i++) {
      arr[i] = arr[i - 1] + diffs[i];
    }
    return arr;
  }
  
  if ("default" in col) {
    var arr = Array(length).fill(col.default);
    if (col.exceptions) {
      for (var idxStr in col.exceptions) {
        arr[parseInt(idxStr, 10)] = col.exceptions[idxStr];
      }
    }
    return arr;
  }
  
  if ("keys" in col && "values" in col) {
    return col.values.map(function(v) { return col.keys[v]; });
  }
  
  // Recursive object
  var unpackedSubCols = {};
  for (var subKey in col) {
    unpackedSubCols[subKey] = unpack_column(col[subKey], length);
  }
  
  var result = [];
  for (var i = 0; i < length; i++) {
    if (unpackedSubCols["_null_mask"] && unpackedSubCols["_null_mask"][i]) {
      result.push(null);
      continue;
    }
    var row = {};
    for (var subKey in col) {
      if (subKey === "_null_mask") continue;
      row[subKey] = unpackedSubCols[subKey][i];
    }
    result.push(row);
  }
  return result;
}

function unpack_compact_json(json) {
  if (!json.Settings || !json.Settings.compact_json) {
    return;
  }
  if (
    json.Nodes &&
    _.isArray(json.Nodes) &&
    (json.Nodes.length === 0 ||
      (typeof json.Nodes[0] === "object" && !_.isArray(json.Nodes[0])))
  ) {
    json.Settings.compact_json = false;
    return;
  }

  if (json.Settings && json.Settings.compact_json === "optimized") {
    _.each(["Nodes", "Edges"], (key) => {
      if (json[key] && !_.isArray(json[key])) {
        // Find length of columns
        var len = 0;
        if (key === "Nodes" && json.Settings && json.Settings.node_count) {
          len = json.Settings.node_count;
        } else if (key === "Edges" && json.Settings && json.Settings.edge_count) {
          len = json.Settings.edge_count;
        } else {
          // Fallback
          _.each(json[key], (col) => {
            if (len === 0) {
              if (_.isArray(col)) {
                len = col.length;
              } else if (col && typeof col === "object") {
                if (_.isArray(col.values)) {
                  len = col.values.length;
                }
              }
            }
          });

          if (len === 0) {
            _.each(json[key], (col) => {
              if (col && typeof col === "object" && col.values) {
                len = Math.max(len, col.values.length);
              }
            });
          }
        }

        var expanded = [];
        var keys = _.keys(json[key]);
        var unpackedCols = {};
        _.each(keys, (k) => {
          unpackedCols[k] = unpack_column(json[key][k], len);
        });

        for (var i = 0; i < len; i++) {
          var row = {};
          _.each(keys, (k) => {
            row[k] = unpackedCols[k][i];
          });
          expanded.push(row);
        }
        json[key] = expanded;
      }
    });
    if (json.Settings) {
      json.Settings.compact_json = false;
      delete json.Settings.node_count;
      delete json.Settings.edge_count;
    }
  } else {
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
    if (json.Settings) {
      json.Settings.compact_json = false;
    }
  }

  // Reconstruct sequences at the end of unpacking (both old and optimized formats)
  if (json.Edges && _.isArray(json.Edges) && json.Nodes && _.isArray(json.Nodes)) {
    _.each(json.Edges, (e) => {
      if (!e.sequences && "source" in e && "target" in e) {
        var sourceNode = json.Nodes[e.source];
        var targetNode = json.Nodes[e.target];
        if (sourceNode && targetNode) {
          e.sequences = [sourceNode.id, targetNode.id];
        }
      }
    });
  }
}

module.exports = {
  unpack_compact_json: unpack_compact_json,
};
