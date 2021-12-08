var d3 = require("d3"),
  _ = require("underscore"),
  misc = require("./misc"),
  helpers = require("./helpers"),
  colorPicker = require("./colorPicker"),
  scatterPlot = require("./scatterplot"),
  topojson = require("topojson"),
  jsPanel = require("jspanel4").jsPanel,
  autocomplete = require("autocomplete.js");

const _networkSubclusterSeparator = ".";
const _networkNewNodeMarker = "[+]";
var _networkGraphAttrbuteID = "patient_attribute_schema";
var _networkNodeAttributeID = "patient_attributes";
var _networkNodeIDField = "hivtrace_node_id";
var _networkMissing = __("general")["missing"];
var _networkMissingOpacity = "0.1";
var _networkMissingColor = "#999";
var _networkContinuousColorStops = 9;
var _networkWarnExecutiveMode =
  "This feature is not available in the executive mode.";
var _networkTimeQuery = new RegExp("([0-9]{8}):([0-9]{8})", "i");
var _networkShapeOrdering = [
  "circle",
  "square",
  "hexagon",
  "diamond",
  "cross",
  "octagon",
  "ellipse",
  "pentagon"
];

var _defaultFloatFormat = d3.format(",.2r");
var _defaultPercentFormat = d3.format(",.3p");
var _defaultPercentFormatShort = d3.format(".2p");
var _defaultDateFormats = [
  d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ"),
  d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ")
];

var _defaultDateViewFormat = d3.time.format("%b %d, %Y");
var _defaultDateViewFormatShort = d3.time.format("%B %Y");
var _defaultDateViewFormatSlider = d3.time.format("%Y-%m-%d");
var _networkDotFormatPadder = d3.format("08d");
var _defaultDateViewFormatMMDDYYY = d3.time.format("%m%d%Y");
var _defaultDateViewFormatClusterCreate = d3.time.format("%Y%m");

var _networkCategoricalBase = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928"
];

var _networkCategorical = [];

_.each([0, -0.5, 0.5], function(k) {
  _.each(_networkCategoricalBase, function(s) {
    _networkCategorical.push(
      d3
        .rgb(s)
        .darker(k)
        .toString()
    );
  });
});

var _maximumValuesInCategories = _networkCategorical.length;

var _networkSequentialColor = {
  2: ["#feb24c", "#e31a1c"],
  3: ["#ffeda0", "#feb24c", "#f03b20"],
  4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
  5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
  6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
  7: [
    "#ffffb2",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#b10026"
  ],
  8: [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#b10026"
  ],
  9: [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#bd0026",
    "#800026"
  ]
};

var _networkPresetColorSchemes = {
  trans_categ: {
    "MSM-Male": "#1f78b4",
    "MSM-Unknown sex": "#1f78b4",
    "Heterosexual Contact-Male": "#e31a1c",
    "Heterosexual Contact-Female": "#e31a1c",
    "Heterosexual Contact-Unknown sex": "#e31a1c",
    "IDU-Male": "#33a02c",
    "MSM & IDU-Male": "#33a02c",
    "IDU-Female": "#33a02c",
    "IDU-Unknown sex": "#33a02c",
    "Other/Unknown-Male": "#636363",
    "Other/Unknown-Female": "#636363",
    "Other-Male": "#636363",
    "Other-Female": "#636363",
    Missing: "#636363",
    "": "#636363",
    "Other/Unknown-Unknown sex": "#636363",
    Perinatal: "#ff7f00",
    "Other/Unknown-Child": "#ff7f00",
    "Other-Child": "#ff7f00"
  },
  race: {
    Asian: "#1f77b4",
    "Black/African American": "#bcbd22",
    "Hispanic/Latino": "#9467bd",
    "American Indian/Alaska Native": "#2ca02c",
    "Native Hawaiian/Other Pacific Islander": "#17becf",
    "Multiple Races": "#e377c2",
    "Multiple races": "#e377c2",
    "Unknown race": "#999",
    Missing: "#999",
    missing: "#999",
    White: "#d62728"
  }
};

var _networkPresetShapeSchemes = {
  birth_sex: {
    Male: "square",
    Female: "ellipse",
    Missing: "diamond",
    missing: "diamond",
    Unknown: "diamond"
  },
  race: {
    Asian: "hexagon",
    "Black/African American": "square",
    "Hispanic/Latino": "triangle",
    "American Indian/Alaska Native": "pentagon",
    "Native Hawaiian/Other Pacific Islander": "octagon",
    "Multiple Races": "diamond",
    "Unknown race": "diamond",
    Missing: "diamond",
    missing: "diamond",
    White: "ellipse"
  },
  current_gender: {
    Male: "square",
    Female: "ellipse",
    "Transgender-Male to Female": "hexagon",
    "Transgender-Female to Male": "pentagon",
    "Additional Gender Identity": "diamond",
    Unknown: "diamond",
    Missing: "diamond",
    missing: "diamond"
  }
};

var _cdcPrioritySetKind = [
  "01 state/local molecular cluster analysis",
  "02 national molecular cluster analysis",
  "03 state/local time-space cluster analysis",
  "04 national time-space cluster analysis",
  "05 provider notification",
  "06 partner services notification",
  "07 other"
];

var _cdcPrioritySetNodeKind = [
  "01 through analysis/notification",
  "02 through investigation"
];

var _cdcJurisdictionCodes = {
  alabama: "al",
  alaska: "ak",
  "american samoa": "as",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  delaware: "de",
  "district of columbia": "dc",
  "federated states of micronesia": "fm",
  florida: "fl",
  georgia: "ga",
  guam: "gu",
  hawaii: "hi",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  "marshall islands": "mh",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  "new hampshire": "nh",
  "new jersey": "nj",
  "new mexico": "nm",
  "new york": "ny",
  "north carolina": "nc",
  "north dakota": "nd",
  "northern mariana islands": "mp",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  palau: "pw",
  pennsylvania: "pa",
  "puerto rico": "pr",
  "rhode island": "ri",
  "south carolina": "sc",
  "south dakota": "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  "virgin islands": "vi",
  virginia: "va",
  washington: "wa",
  "west virginia": "wv",
  wisconsin: "wi",
  wyoming: "wy",
  chicago: "cx",
  philadelphia: "px",
  "los angeles": "lx",
  "new york city": "nx",
  "san francisco": "sx",
  "american samoa": "as",
  guam: "gu",
  "republic of palau": "pw",
  "u.s. virgin islands": "vi"
};

var _cdcJurisdictionLowMorbidity = new Set([
  "alaska",
  "delaware",
  "hawaii",
  "idaho",
  "iowa",
  "kansas",
  "maine",
  "montana",
  "nebraska",
  "new hampshire",
  "new mexico",
  "north dakota",
  "rhode island",
  "south dakota",
  "utah",
  "vermont",
  "virgin islands",
  "west virginia",
  "wyoming"
]);

const _cdcPrioritySetKindAutomaticCreation = _cdcPrioritySetKind[0];
const _cdcPrioritySetDefaultNodeKind = _cdcPrioritySetNodeKind[0];

// Constants for the map.

// TODO: convert and save this data rather than do it each time.

var hivtrace_cluster_depthwise_traversal = function(
  nodes,
  edges,
  edge_filter,
  save_edges,
  seed_nodes
) {
  var clusters = [],
    adjacency = {},
    by_node = {};

  seed_nodes = seed_nodes || nodes;

  _.each(nodes, function(n) {
    n.visited = false;
    adjacency[n.id] = [];
  });

  if (edge_filter) {
    edges = _.filter(edges, edge_filter);
  }

  _.each(edges, function(e) {
    try {
      adjacency[nodes[e.source].id].push([nodes[e.target], e]);
      adjacency[nodes[e.target].id].push([nodes[e.source], e]);
    } catch (err) {
      throw "Edge does not map to an existing node " +
        e.source +
        " to " +
        e.target;
    }
  });

  var traverse = function(node) {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
      if (save_edges) {
        save_edges.push([]);
      }
    }
    node.visited = true;

    _.each(adjacency[node.id], function(neighbor) {
      if (!neighbor[0].visited) {
        by_node[neighbor[0].id] = by_node[node.id];
        clusters[by_node[neighbor[0].id]].push(neighbor[0]);
        if (save_edges) {
          save_edges[by_node[neighbor[0].id]].push(neighbor[1]);
        }
        traverse(neighbor[0]);
      }
    });
  };

  _.each(seed_nodes, function(n) {
    if (!n.visited) {
      traverse(n);
    }
  });

  return clusters;
};

var _networkUpperBoundOnDate = new Date().getFullYear();
var _networkCDCDateField = "hiv_aids_dx_dt";

var hivtrace_cluster_network_graph = function(
  json,
  network_container,
  network_status_string,
  network_warning_tag,
  button_bar_ui,
  attributes,
  filter_edges_toggle,
  clusters_table,
  nodes_table,
  parent_container,
  options
) {
  // [REQ] json                        :          the JSON object containing network nodes, edges, and meta-information
  // [REQ] network_container           :          the CSS selector of the DOM element where the SVG containing the network will be placed (e.g. '#element')
  // [OPT] network_status_string       :          the CSS selector of the DOM element where the text describing the current state of the network is shown (e.g. '#element')
  // [OPT] network_warning_tag         :          the CSS selector of the DOM element where the any warning messages would go (e.g. '#element')
  // [OPT] button_bar_ui               :          the ID of the control bar which can contain the following elements (prefix = button_bar_ui value)
  //                                                - [prefix]_cluster_operations_container : a drop-down for operations on clusters
  //                                                - [prefix]_attributes :  a drop-down for operations on attributes
  //                                                - [prefix]_filter : a text box used to search the graph
  // [OPT] network_status_string       :          the CSS selector of the DOM element where the text describing the current state of the network is shown (e.g. '#element')
  // [OPT] attributes                  :          A JSON object with mapped node attributes

  if (json.Settings && json.Settings.compact_json) {
    _.each(["Nodes", "Edges"], key => {
      var fields = _.keys(json[key]);
      var expanded = [];
      _.each(fields, (f, idx) => {
        var field_values = json[key][f];
        if (!_.isArray(field_values) && "values" in field_values) {
          //console.log ('COMPRESSED');
          var expanded_values = [];
          _.each(field_values["values"], v => {
            expanded_values.push(field_values["keys"][v]);
          });
          field_values = expanded_values;
        }
        _.each(field_values, (fv, j) => {
          if (idx == 0) {
            expanded.push({});
          }
          expanded[j][f] = fv;
        });
      });
      json[key] = expanded;
    });
  }

  // if schema is not set, set to empty dictionary
  if (!json[_networkGraphAttrbuteID]) {
    json[_networkGraphAttrbuteID] = {};
  }

  // Make attributes case-insensitive by LowerCasing all keys in schema
  const new_schema = Object.fromEntries(
    Object.entries(json[_networkGraphAttrbuteID]).map(([k, v]) => [
      k.toLowerCase(),
      v
    ])
  );

  json[_networkGraphAttrbuteID] = new_schema;

  // Make attributes case-insensitive by LowerCasing all keys in node attributes
  let label_key_map = _.object(
    _.map(json.patient_attribute_schema, (d, k) => [d.label, k])
  );

  _.each(json.Nodes, n => {
    if ("patient_attributes" in n) {
      const new_attrs = Object.fromEntries(
        Object.entries(n.patient_attributes).map(([k, v]) => [
          k.toLowerCase(),
          v
        ])
      );

      // Map attributes from patient_schema labels to keys, if necessary
      let unrecognizedKeys = _.difference(
        _.keys(new_attrs),
        _.keys(json.patient_attribute_schema)
      );

      if (unrecognizedKeys.length) {
        _.each(unrecognizedKeys, k => {
          if (_.contains(_.keys(label_key_map), k)) {
            new_attrs[label_key_map[k]] = new_attrs[k];
            delete new_attrs[k];
          }
        });
      }

      n.patient_attributes = new_attrs;
    }
  });

  let uniqs = helpers.get_unique_count(json.Nodes, new_schema);
  let uniqValues = helpers.getUniqueValues(json.Nodes, new_schema);

  // annotate each node with patient_attributes if does not exist
  json.Nodes.forEach(function(n) {
    if (!n["attributes"]) {
      n["attributes"] = [];
    }

    if (!n[_networkNodeAttributeID]) {
      n[_networkNodeAttributeID] = [];
    }
  });

  /** SLKP 20190902: somehow our networks have malformed edges! This will remove them */
  json.Edges = _.filter(json.Edges, function(e) {
    if ("source" in e && "target" in e) {
      return true;
    }
    return false;
  });

  var self = {};

  self._is_CDC_ = options && options["no_cdc"] ? false : true;
  self._is_seguro = options && options["seguro"] ? true : false;
  self._is_CDC_executive_mode =
    options && options["cdc-executive-mode"] ? true : false;

  self.json = json;
  self.uniqs = uniqs;
  self.uniqValues = uniqValues;
  self.schema = json[_networkGraphAttrbuteID];
  // set initial color schemes
  self.networkColorScheme = _networkPresetColorSchemes;

  self.ww =
    options && options["width"]
      ? options["width"]
      : d3.select(parent_container).property("clientWidth");
  self.container = network_container;
  self.nodes = [];
  self.edges = [];
  self.clusters = [];
  self.cluster_sizes = [];
  self.cluster_mapping = {};
  self.percent_format = _defaultPercentFormat;
  self.missing = _networkMissing;
  self.cluster_attributes = json["Cluster description"]
    ? json["Cluster description"]
    : null;
  self.warning_string = "";
  self.precomputed_subclusters = json["Subclusters"]
    ? json["Subclusters"]
    : null;

  if (self.cluster_attributes) {
    _.each(self.cluster_attributes, function(cluster) {
      if ("old_size" in cluster && "size" in cluster) {
        cluster["delta"] = cluster["size"] - cluster["old_size"];
        cluster["deleted"] =
          cluster["old_size"] +
          (cluster["new_nodes"] ? cluster["new_nodes"] : 0) -
          cluster["size"];
      } else {
        if (cluster["type"] == "new") {
          cluster["delta"] = cluster["size"];
          if ("moved" in cluster) {
            cluster["delta"] -= cluster["moved"];
          }
        } else {
          cluster["delta"] = 0;
        }
      }
      cluster["flag"] = cluster["moved"] || cluster["deleted"] ? 2 : 3;
      //console.log (cluster);
    });
  }

  if (options && _.isFunction(options["init_code"])) {
    options["init_code"].call(null, self, options);
  }

  self.dom_prefix =
    options && options["prefix"] ? options["prefix"] : "hiv-trace";
  self.extra_cluster_table_columns =
    options && options["cluster-table-columns"]
      ? options["cluster-table-columns"]
      : null;

  self.subcluster_table = null;
  self.ui_container_selector = button_bar_ui;
  self.primary_graph = options && "secondary" in options ? false : true;
  self.parent_graph_object =
    options && "parent_graph" in options ? options["parent_graph"] : null;

  self.get_ui_element_selector_by_role = function(role, not_nested) {
    if (not_nested && !self.primary_graph) {
      return undefined;
    }
    return (
      (not_nested ? "" : "#" + self.ui_container_selector) +
      " [data-hivtrace-ui-role='" +
      role +
      "']"
    );
  };

  if (json.Settings && json.Settings.created) {
    self.today = new Date(json.Settings.created);
  } else {
    self.today = options && options["today"] ? options["today"] : new Date();
  }

  self.get_reference_date = function() {
    if (!self.primary_graph && self.parent_graph_object)
      return self.parent_graph_object.today;

    return self.today;
  };

  if (self._is_CDC_) {
    // define various CDC settings

    self._lookup_option = function(key, default_value) {
      if (self.json.Settings && self.json.Settings[key])
        return self.json.Settings[key];
      if (options && options[key]) returnoptions[key];
      return default_value;
    };

    self.displayed_node_subset =
      options && options["node-attributes"]
        ? options["node-attributes"]
        : [
            _networkNodeIDField,
            "trans_categ",
            "race",
            "hiv_aids_dx_dt",
            "cur_city_name"
          ];

    self.subcluster_table =
      options && options["subcluster-table"]
        ? d3.select(options["subcluster-table"])
        : null;

    self.extra_subcluster_table_columns = null;

    var lookup_form_generator = function() {
      return '<div><ul data-hivtrace-ui-role = "priority-membership-list"></ul></div>';
    };

    // SLKP 20200727 issues

    self.CDC_data = {
      jurisdiction: self
        ._lookup_option("jurisdiction", "unknown")
        .toLowerCase(),
      timestamp: self.today,
      "autocreate-priority-set-size": 5
    };

    if (self.CDC_data.jurisdiction in _cdcJurisdictionCodes) {
      self.CDC_data["jurisdiction_code"] = _cdcJurisdictionCodes[
        self.CDC_data.jurisdiction
      ].toUpperCase();
    } else {
      self.CDC_data["jurisdiction_code"] = "PG";
    }

    if (_cdcJurisdictionLowMorbidity.has(self.CDC_data["jurisdiction"])) {
      self.CDC_data["autocreate-priority-set-size"] = 3;
    }

    var cdc_extra = [
      {
        description: {
          value: "Cases dx within 36 months",
          sort: function(c) {
            return c.value.length ? c.value[0].length : 0;
          },
          help:
            "Number of cases diagnosed in the past 36 months connected only through cases diagnosed within the past 36 months"
        },
        generator: function(cluster) {
          return {
            html: true,
            value: cluster.recent_nodes,
            volatile: true,
            format: function(v) {
              v = v || [];
              if (v.length) {
                return _.map(v, v => v.length).join(", ");
              } else {
                return "";
              }
            },
            actions: function(item, value) {
              if (
                !self.priority_set_editor ||
                cluster.recent_nodes.length == 0
              ) {
                return null;
              } else {
                return _.map(cluster.recent_nodes, function(c) {
                  let nodeset = new Set(c);
                  return {
                    icon: "fa-plus",
                    action: function(button, v) {
                      if (self.priority_set_editor) {
                        self.priority_set_editor.append_node_objects(
                          _.filter(cluster.children, n => {
                            return nodeset.has(n.id) && n.priority_flag > 0;
                          })
                        );
                      }
                      return false;
                    },
                    help: "Add to priority set"
                  };
                });
              }
            }
          };
        }
      },
      {
        description: {
          value: "Cases dx within 12 months",
          //"value",
          sort: function(c) {
            let v = c.value || [];
            return v.length > 0 ? v[0].length : 0;
          },
          presort: "desc",
          help:
            "Number of cases diagnosed in the past 12 months connected only through cases diagnosed within the past 36 months"
        },
        generator: function(cluster) {
          let definition = {
            html: true,
            value: cluster.priority_score,
            volatile: true,
            format: function(v) {
              v = v || [];
              if (v.length) {
                var str = _.map(v, c => c.length).join(", ");
                if (v[0].length >= 3) {
                  var color = v[0].length >= 5 ? "red" : "orange";
                  return "<span style='color:" + color + "'>" + str + "</span>";
                }
                return str;
              }
              return "";
            }
          };

          definition["actions"] = function(item, value) {
            let result = [];

            if (cluster.priority_score.length > 0) {
              result = result.concat(
                _.map(cluster.priority_score, function(c) {
                  return {
                    icon: "fa-question",
                    help:
                      "Do some of these " +
                      c.length +
                      " nodes belong to a priority set?",
                    action: function(this_button, cv) {
                      let nodeset = new Set(c);
                      this_button = $(this_button.node());
                      if (this_button.data("popover_shown") != "shown") {
                        let popover = this_button
                          .popover({
                            sanitize: false,
                            placement: "right",
                            container: "body",
                            html: true,
                            content: lookup_form_generator,
                            trigger: "manual"
                          })
                          .on("shown.bs.popover", function(e) {
                            var clicked_object = d3.select(this);
                            var popover_div = d3.select(
                              "#" + clicked_object.attr("aria-describedby")
                            );
                            var list_element = popover_div.selectAll(
                              self.get_ui_element_selector_by_role(
                                "priority-membership-list",
                                true
                              )
                            );

                            list_element.selectAll("li").remove();
                            let check_membership = _.filter(
                              _.map(self.defined_priority_groups, g => {
                                //console.log(g);
                                return [
                                  g.name,
                                  _.filter(g.nodes, n => nodeset.has(n.name))
                                    .length,
                                  _.filter(
                                    g.partitioned_nodes[1]["new_direct"],
                                    n => nodeset.has(n.id)
                                  ).length,
                                  _.filter(
                                    g.partitioned_nodes[1]["new_indirect"],
                                    n => nodeset.has(n.id)
                                  ).length
                                ];
                              }),
                              gg => gg[1] + gg[2] + gg[3] > 0
                            );

                            if (check_membership.length == 0) {
                              check_membership = [
                                [
                                  "No nodes belong to any priority set or are linked to any of the priority sets."
                                ]
                              ];
                            } else {
                              check_membership = _.map(check_membership, m => {
                                let description = "";
                                if (m[1]) {
                                  description +=
                                    " " + m[1] + " nodes belong to ";
                                }
                                if (m[2]) {
                                  description +=
                                    " " +
                                    m[2] +
                                    " nodes are directly linked @ " +
                                    _defaultPercentFormatShort(
                                      self.subcluster_threshold
                                    );
                                }
                                if (m[3]) {
                                  description +=
                                    " " +
                                    m[3] +
                                    " nodes are indirectly linked @ " +
                                    _defaultPercentFormatShort(
                                      self.subcluster_threshold
                                    );
                                }

                                description +=
                                  " to priority set <code>" + m[0] + "</code>";
                                return description;
                              });
                            }
                            list_element = list_element
                              .selectAll("li")
                              .data(check_membership);
                            list_element.enter().insert("li");
                            list_element.html(function(d) {
                              return d;
                            });
                          });

                        popover.popover("show");
                        this_button.data("popover_shown", "shown");
                        this_button
                          .off("hidden.bs.popover")
                          .on("hidden.bs.popover", function() {
                            $(this).data("popover_shown", "hidden");
                          });
                      } else {
                        this_button.data("popover_shown", "hidden");
                        this_button.popover("destroy");
                      }
                    }
                  };
                })
              );
            }

            if (self.priority_set_editor && cluster.priority_score.length > 0) {
              result = result.concat(
                _.map(cluster.priority_score, function(c) {
                  let nodeset = new Set(c);
                  return {
                    icon: "fa-plus",
                    action: function(button, v) {
                      if (self.priority_set_editor) {
                        self.priority_set_editor.append_node_objects(
                          _.filter(cluster.children, n => {
                            return (
                              nodeset.has(n.id) &&
                              (n.priority_flag == 2 || n.priority_flag == 1)
                            );
                          })
                        );
                      }
                      return false;
                    },
                    help: "Add to priority set"
                  };
                })
              );
            }

            return result;
          };

          return definition;
        }
      }
    ];
  } // end self._is_CDC_

  self.node_label_drag = d3.behavior
    .drag()
    .on("drag", function(d) {
      d.label_x += d3.event.dx;
      d.label_y += d3.event.dy;
      d3.select(this).attr(
        "transform",
        "translate(" +
          (d.label_x + d.rendered_size * 1.25) +
          "," +
          (d.label_y + d.rendered_size * 0.5) +
          ")"
      );
    })
    .on("dragstart", function() {
      d3.event.sourceEvent.stopPropagation();
    })
    .on("dragend", function() {
      d3.event.sourceEvent.stopPropagation();
    });

  if (self.subcluster_table) {
    self.extra_subcluster_table_columns = cdc_extra;
  } else {
    if (self.extra_cluster_table_columns) {
      self.extra_cluster_table_columns = self.extra_cluster_table_columns.concat(
        cdc_extra
      );
    } else {
      self.extra_cluster_table_columns = cdc_extra;
    }
  }

  self.extra_node_table_columns =
    options && options["node-table-columns"]
      ? options["node-table-columns"]
      : self._is_CDC_
      ? [
          {
            description: {
              value: "Recent and Rapid",
              sort: "value",
              help:
                "Is the node a member of a regular or recent & rapid subcluster?"
            },
            generator: function(node) {
              return {
                callback: function(element, payload) {
                  //payload = _.filter (payload, function (d) {return d});
                  var this_cell = d3.select(element);

                  var data_to_use = [
                    [payload[0][0], payload[0][1], payload[0][2]],
                    [payload[1][0] ? "36 months" : "", payload[1][1]],
                    [payload[2][0] ? "12 months" : "", payload[2][1]],
                    [
                      payload.length > 3 && payload[3][0]
                        ? "Recent cluster >= 3"
                        : "",
                      payload.length > 3 ? payload[3][1] : null
                    ]
                  ];

                  var buttons = this_cell.selectAll("span").remove();

                  _.each(data_to_use, function(button_text) {
                    //self.open_exclusive_tab_view (cluster_id)
                    if (button_text[0].length) {
                      var button_obj = this_cell
                        .append("span")
                        .classed("btn btn-xs btn-node-property", true)
                        .classed(button_text[1], true)
                        .text(button_text[0]);

                      if (_.isFunction(button_text[2])) {
                        button_obj.on("click", button_text[2]);
                      } else {
                        button_obj.attr("disabled", true);
                      }
                    }
                  });
                },
                value: function() {
                  return [
                    [
                      node.subcluster_label
                        ? "Subcluster " + node.subcluster_label
                        : "",
                      "btn-primary",
                      node.subcluster_label
                        ? function() {
                            self.view_subcluster(
                              node.subcluster_label,
                              function(n) {
                                return (
                                  n.subcluster_label == node.subcluster_label
                                );
                              },
                              "Subcluster " + node.subcluster_label
                            );
                          }
                        : null
                    ],

                    [node.priority_flag == 3, "btn-warning"],
                    [node.priority_flag == 1, "btn-danger"],
                    [node.priority_flag == 2, "btn-danger"]
                  ];
                }
              };
            }
          }
        ]
      : null;

  self.colorizer = {
    selected: function(d) {
      return d == "selected" ? d3.rgb(51, 122, 183) : "#FFF";
    }
  };

  self.subcluster_threshold =
    options && options["subcluster-thershold"]
      ? options["subcluster-thershold"]
      : 0.005;

  self.highlight_unsuppored_edges = true;

  //---------------------------------------------------------------------------------------------------
  // BEGIN: NODE SET GROUPS
  //---------------------------------------------------------------------------------------------------

  self.defined_priority_groups = [];
  /**
    {
         'name'  : 'unique name',
         'nodes' : [
          {
              'node_id' : text,
              'added' : date,
              'kind' : text
          }],
         'created' : date,
         'description' : 'text',
         'modified' : date,
         'kind' : 'text'
     }
  */
  self.priority_groups_pending = function() {
    return _.filter(self.defined_priority_groups, pg => pg.pending).length;
  };
  self.priority_groups_expanded = function() {
    return _.filter(self.defined_priority_groups, pg => pg.expanded).length;
  };

  self.priority_groups_check_name = function(string, prior_name) {
    if (string.length) {
      return !_.some(
        self.defined_priority_groups,
        d => d.name == string && d.name != prior_name
      );
    }
    return false;
  };

  self.load_priority_sets = function(url) {
    d3.json(url, function(error, results) {
      if (error) {
        throw "Failed loading priority set file " + error.responseURL;
      } else {
        self.defined_priority_groups = _.clone(results);
        _.each(self.defined_priority_groups, pg => {
          _.each(pg.nodes, n => {
            try {
              n.added = _defaultDateFormats[0].parse(n.added);
            } catch (e) {}
          });
        });
        self.priority_groups_validate(self.defined_priority_groups, true);

        self.auto_create_priority_sets = [];
        // propose some
        let today_string = _defaultDateFormats[0](self.today);
        let node_id_to_object = {};

        _.each(self.json.Nodes, (n, i) => {
          node_id_to_object[n.id] = n;
        });

        function _generate_auto_id(subcluster_id) {
          let id =
            self.CDC_data["jurisdiction_code"] +
            "_" +
            _defaultDateViewFormatClusterCreate(self.CDC_data["timestamp"]) +
            "_" +
            subcluster_id;
          let suffix = "";
          let k = 1;
          while (
            _.find(
              self.auto_create_priority_sets,
              d => d.name == id + suffix
            ) ||
            _.find(self.defined_priority_groups, d => d.name == id + suffix)
          ) {
            suffix = "_" + k;
          }
          return id + suffix;
        }

        _.each(self.clusters, (cluster_data, cluster_id) => {
          _.each(cluster_data.subclusters, subcluster_data => {
            _.each(subcluster_data.priority_score, priority_score => {
              if (
                priority_score.length >=
                self.CDC_data["autocreate-priority-set-size"]
              ) {
                // only generate a new set if it doesn't match what is already there
                let node_set = {};
                _.each(priority_score, n => {
                  node_set[n] = 1;
                });
                if (
                  _.some(self.defined_priority_groups, pg => {
                    let matched = _.countBy(
                      _.map(pg.nodes, pn => pn.name in node_set)
                    );
                    return matched[true] == priority_score.length;
                  })
                ) {
                  return;
                }
                let autoname = _generate_auto_id(subcluster_data.cluster_id);
                self.auto_create_priority_sets.push({
                  name: autoname,
                  description: "Automatically created priority set " + autoname,
                  nodes: _.map(priority_score, n =>
                    self.priority_group_node_record(n, self.today)
                  ),
                  created: today_string,
                  kind: _cdcPrioritySetKindAutomaticCreation,
                  pending: true
                });
              }
            });
          });
        });

        if (self.auto_create_priority_sets.length) {
          // SLKP 20200727 now check to see if any of the priority sets
          // need to be auto-generated
          //console.log (self.auto_create_priority_sets);
          self.defined_priority_groups.push(...self.auto_create_priority_sets);
          self.warning_string +=
            "<br/>Automatically created <b>" +
            self.priority_groups_pending() +
            "</b> and expanded <b>" +
            self.priority_groups_expanded() +
            "</b> priority sets. <b>Please review and confirm in the <code>Priority Sets</code> tab<br>";
          self.display_warning(self.warning_string, true);
        }
        self.priority_groups_validate(self.defined_priority_groups);
        //console.log (self.defined_priority_groups);
        self.draw_priority_set_table();
      }
    });
  };

  self.priority_groups_find_by_name = function(name) {
    if (self.defined_priority_groups) {
      return _.find(self.defined_priority_groups, g => g.name == name);
    }
    return null;
  };

  self.priority_group_node_record = function(node_id, date, kind) {
    return {
      name: node_id,
      added: date || self.today,
      kind: kind || _cdcPrioritySetDefaultNodeKind
    };
  };

  self.priority_groups_validate = function(groups, auto_extend) {
    /**
      groups is a list of priority groups

      name: unique string
      description: string,
      nodes: {
          {
              'id' : node id,
              'added' : date,
              'kind' : enum (one of _cdcPrioritySetNodeKind)
          }
      },
      created: date,
      kind: enum (one of _cdcPrioritySetKind)


    */

    if (_.some(groups, g => !g.validated)) {
      let nodeset = {};
      _.each(self.json.Nodes, n => (nodeset[n.id] = n));
      _.each(groups, pg => {
        if (!pg.validated) {
          pg.node_objects = [];
          pg.not_in_network = [];
          pg.validated = true;
          pg.created = _.isDate(pg.created)
            ? pg.created
            : _defaultDateFormats[0].parse(pg.created);
          pg.modified = pg.modified
            ? _.isDate(pg.modified)
              ? pg.modified
              : _defaultDateFormats[0].parse(pg.modified)
            : pg.created;

          _.each(pg.nodes, node => {
            let nodeid = node.name;
            if (nodeid in nodeset) {
              pg.node_objects.push(nodeset[nodeid]);
            } else {
              pg.not_in_network.push(nodeid);
            }
          });

          /**     extract network data at 0.015 and subcluster thresholds
                            filter on dates subsequent to created date
                     **/

          let my_nodeset = new Set(_.map(pg.node_objects, n => n.id));

          let node_set15 = _.flatten(
            hivtrace_cluster_depthwise_traversal(
              json["Nodes"],
              json["Edges"],
              e => {
                return e.length <= 0.015;
              },
              null,
              pg.node_objects
            )
          );

          let node_set_subcluster = _.flatten(
            hivtrace_cluster_depthwise_traversal(
              json["Nodes"],
              json["Edges"],
              e => {
                return e.length <= self.subcluster_threshold;
              },
              null,
              pg.node_objects
            )
          );

          let direct_at_15 = new Set();

          let json15 = _extract_single_cluster(
            node_set15,
            e => {
              return (
                e.length <= 0.015 &&
                (my_nodeset.has(json["Nodes"][e.target].id) ||
                  my_nodeset.has(json["Nodes"][e.source].id))
              );
            },
            true
          );

          _.each(json15["Edges"], e => {
            _.each([e.source, e.target], nid => {
              if (!my_nodeset.has(json15["Nodes"][nid].id)) {
                direct_at_15.add(json15["Nodes"][nid].id);
              }
            });
          });

          let json_subcluster = _extract_single_cluster(
            node_set_subcluster,
            e => {
              return (
                e.length <= self.subcluster_threshold &&
                (my_nodeset.has(json["Nodes"][e.target].id) ||
                  my_nodeset.has(json["Nodes"][e.source].id))
              );
            },
            true
          );

          let direct_subcluster = new Set();
          _.each(json_subcluster["Edges"], e => {
            _.each([e.source, e.target], nid => {
              if (!my_nodeset.has(json_subcluster["Nodes"][nid].id)) {
                direct_subcluster.add(json_subcluster["Nodes"][nid].id);
              }
            });
          });

          let current_time = self.today;
          let current_time_str = _defaultDateFormats[0](current_time);

          //console.log (pg.name, node_set_subcluster, direct_subcluster);

          pg.partitioned_nodes = _.map(
            [
              [node_set15, direct_at_15],
              [node_set_subcluster, direct_subcluster]
            ],
            ns => {
              let nodesets = {
                existing_direct: [],
                new_direct: [],
                existing_indirect: [],
                new_indirect: []
              };

              _.each(ns[0], n => {
                if (my_nodeset.has(n.id)) return;
                let key = "";
                if (
                  self._filter_by_date(
                    pg.created,
                    _networkCDCDateField,
                    current_time,
                    n,
                    true
                  )
                ) {
                  key = "new";
                } else {
                  key = "existing";
                }

                if (ns[1].has(n.id)) {
                  key += "_direct";
                } else {
                  key += "_indirect";
                }

                nodesets[key].push(n);
              });

              //console.log (pg.name, nodesets);

              return nodesets;
            }
          );

          if (auto_extend) {
            //console.log (pg.partitioned_nodes);
            if (pg.partitioned_nodes[1]["new_direct"].length) {
              _.each(pg.partitioned_nodes[1]["new_direct"], n => {
                pg.nodes.push({
                  name: n.id,
                  added: current_time,
                  kind: _cdcPrioritySetDefaultNodeKind,
                  autoadded: true
                });
                pg.node_objects.push(n);
              });
              pg.validated = false;
              pg.expanded = pg.partitioned_nodes[1]["new_direct"].length;
            }
          }
        }
      });
    }
  };

  self.priority_groups_update_node_sets = function(name, operation) {
    // name : the name of the priority group being added
    // operation: one of
    // "insert" , "delete", "update"

    let to_post = {
      operation: operation,
      name: name,
      url: window.location.href,
      sets: JSON.stringify(
        self.priority_groups_export().filter(pg => pg.name == name)
      )
    };

    if (self.priority_set_table_write) {
      d3.text(self.priority_set_table_write)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(to_post), function(error, data) {
          if (error) {
            $(".container").html(
              '<div class="alert alert-danger">FATAL ERROR. Please reload the page and contact help desk.</div>'
            );
          }
        });
    }
  };

  self.priority_groups_compute_node_membership = function() {
    _.each(self.json.Nodes, n => {
      n["priority_sets"] = [];
    });
    _.each(self.defined_priority_groups, pg => {
      if (pg.validated) {
        _.each(pg.node_objects, pn => pn["priority_sets"].push(pg.name));
      }
    });
    _.each(self.json.Nodes, n => {
      inject_attribute_node_value_by_id(
        n,
        "priority_sets",
        n["priority_sets"].length ? n["priority_sets"].join(", ") : "-"
      );
      delete n["priority_sets"];
    });
  };

  self.priority_groups_add_set = function(
    nodeset,
    update_table,
    not_validated,
    prior_name,
    op_code
  ) {
    op_code = op_code || "insert";
    if (not_validated) {
      self.priority_groups_validate([nodeset]);
    }
    if (prior_name) {
      let prior_index = _.findIndex(
        self.defined_priority_groups,
        d => d.name == prior_name
      );
      if (prior_index >= 0) {
        self.defined_priority_groups[prior_index] = nodeset;
      } else {
        self.defined_priority_groups.push(nodeset);
      }
    } else {
      self.defined_priority_groups.push(nodeset);
    }
    self.priority_groups_update_node_sets(nodeset.name, op_code);

    if (update_table) {
      self.draw_priority_set_table();
    }
  };

  self.priority_groups_edit_set_description = function(
    name,
    description,
    update_table
  ) {
    if (self.defined_priority_groups) {
      var idx = _.findIndex(self.defined_priority_groups, g => g.name == name);
      if (idx >= 0) {
        self.defined_priority_groups[idx].description = description;
        self.priority_groups_update_node_sets(name, "update");
        if (update_table) {
          self.draw_priority_set_table();
        }
      }
    }
  };

  self.priority_groups_remove_set = function(name, update_table) {
    if (self.defined_priority_groups) {
      var idx = _.findIndex(self.defined_priority_groups, g => g.name == name);
      if (idx >= 0) {
        self.defined_priority_groups.splice(idx, 1);
        self.priority_groups_update_node_sets(name, "delete");
        if (update_table) {
          self.draw_priority_set_table();
        }
      }
    }
  };

  self.priority_groups_export = function(group_set, include_unvalidated) {
    group_set = group_set || self.defined_priority_groups;

    return _.map(
      _.filter(group_set, g => include_unvalidated || g.validated),
      g => {
        return {
          name: g.name,
          description: g.description,
          nodes: g.nodes,
          modified: _defaultDateFormats[0](g.modified),
          kind: g.kind,
          created: _defaultDateFormats[0](g.created)
        };
      }
    );
  };

  self.priority_groups_is_new_node = function(group_set, node) {
    return node.added.getTime() == self.today.getTime();
  };

  self.priority_groups_export_nodes = function(group_set, include_unvalidated) {
    group_set = group_set || self.defined_priority_groups;

    return _.flatten(
      _.map(
        _.filter(group_set, g => include_unvalidated || g.validated),
        g => {
          //const refTime = g.modified.getTime();
          //console.log ("GROUP: ",g.name, " = ", g.modified);
          return _.map(g.nodes, gn => {
            //console.log (gn.added);
            return {
              eHARS_uid: gn.name,
              cluster_uid: g.name,
              cluster_ident_method: g.kind,
              person_ident_method: gn.kind,
              person_ident_dt: gn.added
                ? _defaultDateViewFormatMMDDYYY(gn.added)
                : "N/A",
              new_case: self.priority_groups_is_new_node(g, gn) ? 1 : 0
            };
          });
        }
      )
    );
  };

  //---------------------------------------------------------------------------------------------------
  // END: NODE SET GROUPS
  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------
  // BEGIN: NODE SET EDITOR
  //---------------------------------------------------------------------------------------------------

  self.priority_set_editor = null;

  self.priority_set_view = function(priority_set, options) {
    options = options || {};

    let nodes = priority_set.node_objects || priority_set.network_nodes;
    let current_time = new Date();
    let edge_length =
      options["priority-edge-length"] || self.subcluster_threshold;
    let reference_date = options["timestamp"] || self.today;
    let title = options["title"] || "Preview of priority set";
    let node_dates = {};

    if (priority_set.nodes) {
      _.each(priority_set.nodes, nd => {
        node_dates[nd.name] = nd.added;
      });
    } else {
      _.each(priority_set.network_nodes, nd => {
        node_dates[nd.id] = nd["_priority_set_date"];
      });
    }

    _.each(nodes, d => {
      d.priority_set = 1;
    });

    let node_set = _.flatten(
      hivtrace_cluster_depthwise_traversal(
        json["Nodes"],
        json["Edges"],
        e => {
          return e.length <= edge_length;
        },
        null,
        nodes
      )
    );

    //console.log (_.keys (priority_set), node_set, priority_set.network_nodes);

    let subcluster_view = self
      .view_subcluster(
        -1,
        node_set,
        title,
        {
          skip_recent_rapid: true,
          init_code: function(network) {
            _.each(network.json.Edges, e => {
              let other_node = null;
              if (network.json.Nodes[e.target].priority_set == 1) {
                other_node = network.json.Nodes[e.source];
              } else {
                if (network.json.Nodes[e.source].priority_set == 1) {
                  other_node = network.json.Nodes[e.target];
                }
              }
              if (other_node && other_node.priority_set != 1) {
                other_node.priority_set = 2;
              }
            });
          },
          "computed-attributes": {
            date_added: {
              depends: [_networkCDCDateField],
              label: "Date added to priority set",
              type: "Date",
              map: function(node) {
                return node.id in node_dates
                  ? node_dates[node.id]
                  : _networkMissing;
              }
            },
            priority_set: {
              depends: [_networkCDCDateField],
              label: "Priority Set Status",
              enum: [
                "Priority Set",
                "Existing",
                "New [direct]",
                "New [indirect]"
              ],
              map: function(node) {
                if (node.priority_set == 1) {
                  return "Priority Set";
                }
                if (
                  self._filter_by_date(
                    reference_date,
                    _networkCDCDateField,
                    current_time,
                    node,
                    true
                  )
                ) {
                  if (node.priority_set == 2) {
                    return "New [direct]";
                  } else {
                    return "New [indirect]";
                  }
                }
                return "Existing";
              },
              color_scale: function() {
                return d3.scale
                  .ordinal()
                  .domain([
                    "Priority Set",
                    "Existing",
                    "New [direct]",
                    "New [indirect]",
                    _networkMissing
                  ])
                  .range(["#7570b3", "white", "#d95f02", "#1b9e77", "gray"]);
              }
            }
          }
        },
        null,
        null,
        edge_length
      )
      .handle_attribute_categorical("priority_set");

    _.each(nodes, d => {
      delete d.priority_set;
    });
  };
  self.has_priority_set_editor = function() {
    if (self.priority_set_editor) {
      return self.priority_set_editor;
    }
    if (self.parent_graph_object) {
      return self.parent_graph_object.has_priority_set_editor();
    }
    return null;
  };

  self.priority_set_inject_node_attibutes = function(nodes, node_attributes) {
    let attr_by_id = {};
    _.each(node_attributes, (n, i) => {
      attr_by_id[n.name] = {
        _priority_set_date: n.added || self.today,
        _priority_set_kind: n.kind || _cdcPrioritySetDefaultNodeKind,
        _priority_set_autoadded: n.autoadded || false
      };
    });
    _.each(nodes, n => {
      if (n.id in attr_by_id) {
        _.extend(n, attr_by_id[n.id]);
      }
    });
  };

  self.open_priority_set_editor = function(
    node_set,
    name,
    description,
    cluster_kind,
    kind_options,
    validation_mode,
    existing_set
  ) {
    /*
        validation_mode could be
          - null (create new set)
          - "validate" (validate an automatically generated dataset)
          - "revise" (validate an automatically generated dataset)
    */
    if (self.priority_set_editor || !self.primary_graph) return;
    // only open one editor at a time
    // only primary network supports editor view

    if (self._is_CDC_executive_mode) {
      alert(_networkWarnExecutiveMode);
      return;
    }

    self.priority_set_editor = jsPanel.create({
      theme: "bootstrap-primary",
      headerTitle: "Priority node set editor",
      headerControls: { size: "lg", maximize: "remove" },
      position: {
        my: "left-bottom",
        at: "left-bottom",
        offsetX: 0,
        offsetY: 0
      },
      contentSize: {
        width: function() {
          return window.innerWidth * 0.8;
        },
        height: function() {
          return window.innerHeight / 3;
        }
      },
      content: "",
      contentOverflow: "scroll",
      callback: function() {
        var panel_object = this;
        panel_object.network_nodes = [];
        panel_object.saved = false;
        panel_object.prior_name =
          validation_mode && validation_mode.length && existing_set
            ? existing_set.name
            : null;

        panel_object.can_edit_kind = existing_set
          ? existing_set.expanded == 0
          : true;
        panel_object.can_edit_name = existing_set ? existing_set.pending : true;

        panel_object.can_add = function(id) {
          return !_.some(panel_object.network_nodes, d => d.id == id);
        };

        var panel_content = d3.select(panel_object.content);
        panel_content.selectAll("*").remove();

        var form = panel_content
          .append("form")
          .attr("action", "javascript:void(0)")
          .classed("form-inline", true);

        var form_grp = form.append("div").classed("form-group", true);
        var node_ids_selector = form_grp
          .append("input")
          .classed("form-control input-sm", true)
          .attr("placeholder", "Add node by ID")
          .attr("data-hivtrace-ui-role", "priority-panel-nodeids");
        var submit_button = form
          .append("button")
          .classed("btn btn-primary btn-sm", true)
          .attr("disabled", "disabled")
          .on("click", function(e) {
            panel_object.append_node();
          });

        submit_button.append("i").classed("fa fa-plus", true);
        //var preview_grp = form.append ("div").classed ("form-group", true);

        var form_save = panel_content
          .append("form")
          .classed("form", true)
          .attr("action", "javascript:void(0);")
          .style("display", "none");

        var grp_name = form_save.append("div");

        if (panel_object.prior_name) {
          grp_name.classed("form-group has-success", true);
        } else {
          grp_name.classed("form-group has-error", true);
        }

        var grp_name_button = grp_name
          .append("input")
          .classed("form-control input-sm", true)
          .attr("placeholder", "Name priority set")
          .attr("data-hivtrace-ui-role", "priority-panel-name");

        if (name) {
          grp_name_button.attr("value", name);
        }

        grp_name
          .append("p")
          .classed("help-block", true)
          .text("Name this priority set");

        var grp_kind = form_save.append("div").classed("form-group", true);

        var grp_kind_select = grp_kind
          .append("select")
          .classed("form-control input-sm", true)
          .attr("data-hivtrace-ui-role", "priority-panel-kind");

        if (!panel_object.can_edit_kind) {
          grp_kind_select.property("disabled", true);
          grp_kind_select.attr(
            "title",
            "The method of cluster identification cannot be changed for auto-populated priority sets. However, after confirming this priority set, you can clone it and then change this field as needed"
          );
        } else {
          grp_kind_select.attr("title", null);
        }
        if (!panel_object.can_edit_name) {
          grp_name_button.property("disabled", true);
        }

        grp_kind_select
          .selectAll("option")
          .data(kind_options || _cdcPrioritySetKind)
          .enter()
          .insert("option")
          .text(d => d)
          .property("selected", d => d == cluster_kind);

        grp_kind
          .append("p")
          .classed("help-block", true)
          .text("Method of identification");

        var grp_desc = form_save.append("div").classed("form-group", true);

        grp_desc
          .append("textarea")
          .classed("form-control input-sm", true)
          .attr("placeholder", "Priority Set Description")
          .attr("data-hivtrace-ui-role", "priority-panel-description")
          .text(description);
        grp_desc
          .append("p")
          .classed("help-block", true)
          .text("Describe this priority set");

        panel_object.first_save = true;
        panel_object.cleanup_attributes = this.cleanup_attributes = function() {
          _.each(self.nodes, n => {
            _.each(
              [
                "_priority_set_fixed",
                "_priority_set_date",
                "_priority_set_kind",
                "_priority_set_autoadded"
              ],
              xtra => {
                delete n[xtra];
              }
            );
          });
        };

        function is_node_editable(node) {
          return !node["_priority_set_fixed"];
        }

        function save_priority_set() {
          form_save.style("display", null);

          // check if can save
          if (panel_object.network_nodes.length) {
            let name, desc, kind;

            [name, desc, kind] = _.map(
              [
                "priority-panel-name",
                "priority-panel-description",
                "priority-panel-kind"
              ],
              k =>
                $(
                  d3
                    .select(self.get_ui_element_selector_by_role(k, true))
                    .node()
                ).val()
            );

            //console.log (name, desc, kind);
            //console.log (self.priority_groups_check_name(name));

            if (
              !panel_object.first_save &&
              self.priority_groups_check_name(name, panel_object.prior_name)
            ) {
              let set_description = {
                name: name,
                description: desc,
                nodes: _.map(panel_object.network_nodes, d => {
                  return {
                    name: d.id,
                    added: d["_priority_set_date"],
                    kind: d["_priority_set_kind"]
                  };
                }),
                created:
                  existing_set && validation_mode && validation_mode.length
                    ? _defaultDateFormats[0](existing_set.created)
                    : _defaultDateFormats[0](new Date()),
                modified:
                  validation_mode == "validate"
                    ? _defaultDateFormats[0](self.today)
                    : _defaultDateFormats[0](new Date()),
                kind: kind
              };
              //console.log (set_description);
              panel_object.saved = true;
              self.priority_groups_add_set(
                set_description,
                true,
                true,
                panel_object.prior_name,
                panel_object.prior_name
                  ? existing_set.pending
                    ? "insert"
                    : "update"
                  : null
              );
              // clean up temporary flags from nodes
              panel_object.cleanup_attributes();
              panel_object.close();
            }
            panel_object.first_save = false;
          }
        }

        var save_set_button = form
          .append("button")
          .classed("btn btn-primary btn-sm pull-right", true)
          .text(validation_mode == "validate" ? "Confirm" : "Save")
          .attr("disabled", "disabled")
          .on("click", function(e) {
            save_priority_set();
          });

        form
          .append("button")
          .classed("btn btn-info btn-sm pull-right", true)
          .text("Preview @1.5%")
          .on("click", function(e) {
            self.priority_set_view(self.priority_set_editor, {
              "priority-edge-length": 0.015
            });
          });
        form
          .append("button")
          .classed("btn btn-info btn-sm pull-right", true)
          .text("Preview @" + self.subcluster_threshold * 100 + "%")
          .on("click", function(e) {
            self.priority_set_view(self.priority_set_editor, {
              "priority-edge-length": self.subcluster_threshold
            });
          });

        $(grp_name_button.node())
          .off("input propertychange")
          .on("input propertychange", function(e) {
            let current_text = $(this).val();
            if (
              self.priority_groups_check_name(
                current_text,
                panel_object.prior_name
              )
            ) {
              grp_name.classed({ "has-success": true, "has-error": false });
              if (panel_object.network_nodes.length) {
                save_set_button.attr("disabled", null);
              }
            } else {
              grp_name.classed({ "has-success": false, "has-error": true });
              save_set_button.attr("disabled", "disabled");
            }
          });

        var auto_object = autocomplete(
          self.get_ui_element_selector_by_role("priority-panel-nodeids", true),
          { hint: false },
          [
            {
              source: function(query, callback) {
                var hits = [];
                const pattern = new RegExp(query, "i");
                for (
                  var i = 0;
                  hits.length < 10 && i < json["Nodes"].length;
                  i++
                ) {
                  if (pattern.test(json["Nodes"][i].id)) {
                    if (panel_object.can_add(json["Nodes"][i].id)) {
                      hits.push(json["Nodes"][i].id);
                    }
                  }
                }
                callback(hits);
              },
              templates: {
                suggestion: function(suggestion) {
                  return suggestion;
                }
              }
            }
          ]
        );

        panel_object.validate_input = function(expression, skip_ui) {
          expression = expression || auto_object.autocomplete.getVal();
          const validator = _.filter(json["Nodes"], n => n.id == expression);
          if (validator.length == 1 && panel_object.can_add(validator[0].id)) {
            if (!skip_ui) {
              submit_button.attr("disabled", null);
            }
            return validator[0];
          } else {
            if (!skip_ui) {
              submit_button.attr("disabled", "disabled");
            }
          }
          return null;
        };

        panel_object._append_node = function(node) {
          if (!("_priority_set_date" in node)) {
            node["_priority_set_date"] = new Date();
          }
          if (!("_priority_set_kind" in node)) {
            node["_priority_set_kind"] = _cdcPrioritySetDefaultNodeKind;
          }
          panel_object.network_nodes.push(node);
        };

        panel_object.append_node = function(id, skip_ui) {
          var node_to_add = panel_object.validate_input(id, skip_ui);
          if (node_to_add) {
            panel_object._append_node(node_to_add);
            panel_object.table_handler(panel_object);
            panel_object.validate_input();
          }
        };

        panel_object.append_nodes = function(nodes_to_add) {
          let existing_ids = {};

          _.each(panel_object.network_nodes, n => {
            existing_ids[n.id] = 1;
          });

          let need_update = false;
          let valid_ids = {};
          _.each(json["Nodes"], n => {
            if (!existing_ids[n.id]) {
              valid_ids[n.id] = n;
            }
          });

          _.each(nodes_to_add, n => {
            if (!(n in existing_ids) && n in valid_ids) {
              panel_object._append_node(valid_ids[n]);
              existing_ids[n] = 1;
              need_update = true;
            }
          });

          if (need_update) {
            panel_object.table_handler(panel_object);
          }
        };

        panel_object.append_node_objects = function(nodes_to_add) {
          let existing_ids = {};

          _.each(panel_object.network_nodes, n => {
            existing_ids[n.id] = 1;
          });

          let need_update = false;

          _.each(nodes_to_add, n => {
            if (!(n.id in existing_ids)) {
              panel_object._append_node(n);
              existing_ids[n.id] = 1;
              need_update = true;
            }
          });

          if (need_update) {
            panel_object.table_handler(panel_object);
          }
        };

        panel_object.remove_node = function(n) {
          panel_object.network_nodes = _.filter(
            panel_object.network_nodes,
            function(nn) {
              return nn != n;
            }
          );
          panel_object.table_handler(panel_object);
        };

        auto_object
          .on("autocomplete:selected", function(
            event,
            suggestion,
            dataset,
            context
          ) {
            auto_object.autocomplete.setVal(suggestion);
            panel_object.validate_input();
          })
          .on("input propertychange", function() {
            panel_object.validate_input();
          });

        panel_object.table_handler = function(panel) {
          var table_container = panel_content
            .selectAll("table")
            .data(["panel"]);
          table_container.enter().append("table");
          table_container.classed(
            "table table-striped table-condensed table-hover table-smaller",
            true
          );

          panel.setHeaderTitle(
            "Priority set editor (" +
              panel.network_nodes.length +
              " nodes)" +
              (validation_mode ? " [validation mode] " : "")
          );

          save_set_button.attr(
            "disabled",
            panel.network_nodes.length ? null : "disabled"
          );

          self.draw_extended_node_table(panel.network_nodes, table_container, [
            {
              prepend: true,
              description: {
                value: "Added",
                help: "When was this person added to the priority set?"
              },
              generator: function(node) {
                return {
                  value: node,
                  callback: function(element, payload) {
                    let this_cell = d3.select(element);
                    if (payload["_priority_set_date"]) {
                      if (payload["_priority_set_autoadded"]) {
                        this_cell.style("color", "darkred");
                      }
                      if (!is_node_editable(payload)) {
                        this_cell.text(
                          _defaultDateViewFormatMMDDYYY(
                            payload["_priority_set_date"]
                          )
                        );
                      } else {
                        this_cell
                          .append("input")
                          .attr("type", "date")
                          .attr(
                            "value",
                            _defaultDateViewFormatSlider(
                              payload["_priority_set_date"]
                            )
                          )
                          .on("change", function(e, d) {
                            try {
                              payload[
                                "_priority_set_date"
                              ] = _defaultDateViewFormatSlider.parse(
                                $(d3.event.target).val()
                              );
                            } catch (err) {}
                          });
                      }
                    } else {
                      this_cell.text("N/A");
                    }
                  }
                };
              }
            },
            {
              prepend: true,
              description: {
                value: "Identification method",
                help:
                  "How was this person identified as part of this priority set?"
              },
              generator: function(node) {
                return {
                  value: node,
                  html: true,
                  actions: function(item, value) {
                    if (is_node_editable(value)) {
                      return [
                        {
                          //icon: "fa-caret-down",
                          classed: { "btn-default": true },
                          text: value["_priority_set_kind"], //.split(" ")[0],
                          help: "How was this person identified?",
                          dropdown: _cdcPrioritySetNodeKind,
                          action: function(button, menu_value) {
                            value["_priority_set_kind"] = menu_value;
                            button.text(
                              value["_priority_set_kind"] //.split(" ")[0]
                            );
                          }
                        }
                      ];
                    }
                    return [];
                  },

                  callback: function(element, payload) {
                    let this_cell = d3.select(element);
                    if (!is_node_editable(payload)) {
                      this_cell
                        .append("abbr")
                        .attr("title", payload["_priority_set_kind"])
                        .text(payload["_priority_set_kind"] /*.split(" ")[0]*/);
                    }
                    return this_cell;
                  }
                };
              }
            },
            {
              // delete object option
              prepend: true,
              description: {
                value: "",
                actions: [
                  {
                    icon: "fa-trash",
                    action: function(b, v) {
                      // iterate through the table and remove shown nodes one at a time
                      // checking that the row is shown to allow for filtering and such

                      let remaining_nodes = new Set(panel.network_nodes);

                      table_container
                        .selectAll("tr")
                        .filter(function(d) {
                          return d3.select(this).style("display") != "none";
                        })
                        .each(function(d) {
                          d3.select(this)
                            .selectAll("td:first-child > button")
                            .each(function(d) {
                              let this_node = d3.select(this).datum();
                              if (is_node_editable(this_node)) {
                                remaining_nodes.delete(this_node);
                              }
                            });
                        });

                      const leftovers = remaining_nodes.values();
                      panel.network_nodes = [];
                      for (let entry of leftovers) {
                        panel.network_nodes.push(entry);
                      }
                      panel.table_handler(panel);
                    }
                  }
                ]
              },
              generator: function(node) {
                return {
                  value: node,
                  callback: function(element, payload) {
                    var this_cell = d3.select(element);
                    if (!is_node_editable(payload)) {
                      this_cell
                        .append("button")
                        .classed("btn btn-default btn-xs", true)
                        .style("margin-left", "1em")
                        .datum(payload)
                        .property("disabled", true)
                        .append("i")
                        .classed("fa fa-ban", true);
                    } else {
                      this_cell
                        .append("button")
                        .classed("btn btn-default btn-xs", true)
                        .style("margin-left", "1em")
                        .datum(payload)
                        .on("click", function() {
                          panel_object.remove_node(payload);
                        })
                        .append("i")
                        .classed("fa fa-trash", true);
                    }
                  }
                };
              }
            }
          ]);
        };

        panel_object.content.style.padding = "5px";
        panel_object.network_nodes = node_set;
        // inject node attributes if available
        if (validation_mode) {
          // existing nodes cannot be deleted
          _.each(panel_object.network_nodes, n => {
            n["_priority_set_fixed"] = true;
          });
        }
        if (existing_set) {
          self.priority_set_inject_node_attibutes(
            panel_object.network_nodes,
            existing_set.nodes
          );
        }

        panel_object.table_handler(this);
      },
      dragit: {
        containment: [50, 0, 0, 0]
      },
      onbeforeclose: function() {
        if (!this.saved) {
          if (confirm("Close priority set editor?")) {
            //console.log ("Closing...");
            this.cleanup_attributes();
            return true;
          }
          return false;
        }
        return true;
      },
      onclosed: function() {
        self.priority_set_editor = null;
        self.redraw_tables();
      }
    });
  };

  if (self._is_CDC_ && self.primary_graph) {
    let new_set = self.get_ui_element_selector_by_role(
      "new_priority_set",
      true
    );
    if (new_set) {
      window.addEventListener("beforeunload", function(e) {
        if (self.priority_groups_pending() > 0) {
          e.preventDefault();
          e.returnValue =
            "There are priority sets that have not been confirmed. Closing the window now will not finalize their creation.";
        }
        delete e["returnValue"];
      });

      d3.selectAll(new_set).on("click", function(e) {
        self.open_priority_set_editor([]);
        self.redraw_tables();
      });
    }
  }

  //---------------------------------------------------------------------------------------------------
  // END: NODE SET EDITOR
  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------

  self.node_shaper = {
    id: null,
    shaper: function() {
      return "circle";
    }
  };

  (self.filter_edges = true),
    (self.hide_hxb2 = false),
    (self.charge_correction = 5),
    (self.margin = {
      top: 20,
      right: 10,
      bottom: 30,
      left: 10
    }),
    (self.width = self.ww - self.margin.left - self.margin.right),
    (self.height = (self.width * 9) / 16),
    (self.cluster_table = d3.select(clusters_table)),
    (self.node_table = d3.select(nodes_table)),
    (self.priority_set_table =
      self._is_CDC_ && options && options["priority-table"]
        ? d3.select(options["priority-table"])
        : null),
    (self.priority_set_table_write =
      self._is_CDC_ && options && options["priority-table-writeback"]
        ? options["priority-table-writeback"]
        : null);
  (self.needs_an_update = false),
    (self.hide_unselected = false),
    (self.show_percent_in_pairwise_table = false),
    (self.gradient_id = 0);

  self._calc_country_nodes = function(options) {
    if (options && "country-centers" in options) {
      self.mapProjection = d3.geo
        .mercator()
        .translate([
          self.margin.left + self.width / 2,
          self.margin.top + self.height / 2
        ])
        .scale((150 * self.width) / 960);
      _.each(self.countryCentersObject, function(value) {
        value.countryXY = self.mapProjection([value.longt, value.lat]);
      });
    }
  };

  if (
    options &&
    "country-centers" in options &&
    "country-outlines" in options
  ) {
    self.countryCentersObject = options["country-centers"];
    self.countryOutlines = options["country-outlines"];
    self._calc_country_nodes(options);
    //console.log (self.countryCentersObject);
    self.showing_on_map = options.showing_on_map;
    //console.log (self.showing_on_map);
  } else {
    self.countryCentersObject = null;
    self.showing_on_map = false;
  }

  self._additional_node_pop_fields = [];
  /** this array contains fields that will be appended to node pop-overs in the network tab
      they will precede all the fields that are shown based on selected labeling */

  if (options && "minimum size" in options) {
    self.minimum_cluster_size = options["minimum size"];
  } else {
    if (self._is_CDC_) {
      self.minimum_cluster_size = 5;
    } else {
      self.minimum_cluster_size = 2;
    }
  }

  if (options && "cluster-time" in options) {
    self.cluster_time_scale = options["cluster-time"];
  }

  if (self._is_CDC_) {
    self._additional_node_pop_fields.push(_networkCDCDateField);
    self.cluster_time_scale = self.cluster_time_scale || _networkCDCDateField;
  }

  if (options && "core-link" in options) {
    self.core_link_length = options["core-link"];
  } else {
    self.core_link_length = -1;
  }

  if (options && "edge-styler" in options) {
    self.additional_edge_styler = options["edge-styler"];
  } else {
    self.additional_edge_styler = null;
  }

  self.filter_by_size = function(cluster, value) {
    return cluster.children.length >= self.minimum_cluster_size;
  };

  self.filter_singletons = function(cluster, value) {
    return cluster.children.length > 1;
  };

  self.filter_if_added = function(cluster) {
    return self.cluster_attributes[cluster.cluster_id].type != "existing";
  };

  self.filter_time_period = function(cluster) {
    return _.some(self.nodes_by_cluster[cluster.cluster_id], function(n) {
      return (
        self.attribute_node_value_by_id(n, self.cluster_time_scale) >=
        self.using_time_filter
      );
    });
  };

  self.cluster_filtering_functions = {
    size: self.filter_by_size,
    singletons: self.filter_singletons
  };

  self.using_time_filter = null;

  if (self.json.Notes) {
    _.each(self.json.Notes, s => (self.warning_string += s + "<br>"));
  }

  if (self.cluster_attributes) {
    self.warning_string +=
      "Only displaying clusters added/changed since the last update [use the <i>Clusters</i> menu to change this]<br>";
    self.showing_diff = true;
    self.cluster_filtering_functions["new"] = self.filter_if_added;
  } else {
    self.showing_diff = false;
    if (
      self.cluster_time_scale &&
      "Cluster sizes" in self.json &&
      self.json["Cluster sizes"].length > 250
    ) {
      self.using_time_filter = new Date();
      self.warning_string +=
        "Only displaying clusters with nodes dates in the last 12 months [use the <i>Clusters</i> menu to change this]<br>";
      self.using_time_filter.setFullYear(
        self.using_time_filter.getFullYear() - 1
      );
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    }
  }

  self.cluster_display_filter = function(cluster) {
    return _.every(self.cluster_filtering_functions, function(filter) {
      return filter(cluster);
    });
  };

  self.initial_packed =
    options && options["initial_layout"] == "tiled" ? false : true;

  self.recent_rapid_definition = function(network, date) {
    date = date || self.get_reference_date();
    var subcluster_enum = [
      "Subcluster", // 0
      "12 months (on or after " + // 1
        _defaultDateViewFormat(_n_months_ago(date, 12)) +
        ")",
      "12 months (on or after " + // 2
        _defaultDateViewFormat(_n_months_ago(date, 12)) +
        ") and R&R subcluster",
      "36 months (on or after " + // 3
        _defaultDateViewFormat(_n_months_ago(date, 36)) +
        ")",
      "Future node (after " + _defaultDateViewFormat(date) + ")", // 4
      "Not a member of subcluster (as of " + _defaultDateViewFormat(date) + ")", // 5
      "Not in a subcluster"
    ];

    return {
      depends: [_networkCDCDateField],
      label: "Subcluster or Priority Node",
      enum: subcluster_enum,
      type: "String",
      volatile: true,
      color_scale: function() {
        return d3.scale
          .ordinal()
          .domain(subcluster_enum.concat([_networkMissing]))
          .range(
            _.union(
              [
                "#CCCCCC",
                "pink",
                "red",
                "blue",
                "#9A4EAE",
                "yellow",
                "#FFFFFF"
              ],
              [_networkMissingColor]
            )
          );
      },

      map: function(node) {
        if (node.subcluster_label) {
          if (node.priority_flag > 0) {
            return subcluster_enum[node.priority_flag];
          }
          return subcluster_enum[0];
        }
        return subcluster_enum[6];
      }
    };
  };

  self._networkPredefinedAttributeTransforms = {
    /** runtime computed node attributes, e.g. transforms of existing attributes */

    binned_vl_recent_value: {
      depends: ["vl_recent_value"],
      label: "binned_vl_recent_value",
      enum: ["<200", "200-10000", ">10000"],
      color_scale: function() {
        return d3.scale
          .ordinal()
          .domain(["<200", "200-10000", ">10000", _networkMissing])
          .range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
      },

      map: function(node) {
        var vl_value = self.attribute_node_value_by_id(
          node,
          "vl_recent_value",
          true
        );
        if (vl_value != _networkMissing) {
          if (vl_value <= 200) {
            return "<200";
          }
          if (vl_value <= 10000) {
            return "200-10000";
          }
          return ">10000";
        }
        return _networkMissing;
      }
    },

    binned_vl_recent_value_adj: {
      depends: ["vl_recent_value_adj"],
      label: "Most Recent Viral Load Category",
      enum: ["<200", "200-10000", ">10000"],
      color_scale: function() {
        return d3.scale
          .ordinal()
          .domain(["<200", "200-10000", ">10000", _networkMissing])
          .range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
      },

      map: function(node) {
        var vl_value = self.attribute_node_value_by_id(
          node,
          "vl_recent_value_adj",
          true
        );
        if (vl_value != _networkMissing) {
          if (vl_value <= 200) {
            return "<200";
          }
          if (vl_value <= 10000) {
            return "200-10000";
          }
          return ">10000";
        }
        return _networkMissing;
      }
    },

    vl_result_interpretation: {
      depends: ["vl_recent_value", "result_interpretation"],
      label: "vl_result_interpretation",
      color_stops: 6,
      scale: d3.scale
        .log(10)
        .domain([10, 1e6])
        .range([0, 5]),
      category_values: ["Suppressed", "Viremic (above assay limit)"],
      type: "Number-categories",
      color_scale: function(attr) {
        var color_scale_d3 = d3.scale
          .linear()
          .range([
            "#d53e4f",
            "#fc8d59",
            "#fee08b",
            "#e6f598",
            "#99d594",
            "#3288bd"
          ])
          .domain(_.range(_networkContinuousColorStops, -1, -1));

        return function(v) {
          if (_.isNumber(v)) {
            return color_scale_d3(attr.scale(v));
          }
          switch (v) {
            case attr.category_values[0]:
              return color_scale_d3(0);
              break;
            case attr.category_values[1]:
              return color_scale_d3(5);
              break;

            default:
              return _networkMissingColor;
          }
        };
      },
      label_format: d3.format(",.0f"),
      map: function(node) {
        var vl_value = self.attribute_node_value_by_id(
          node,
          "vl_recent_value",
          true
        );
        var result_interpretation = self.attribute_node_value_by_id(
          node,
          "result_interpretation"
        );

        if (
          vl_value != _networkMissing ||
          result_interpretation != _networkMissing
        ) {
          if (result_interpretation != _networkMissing) {
            if (result_interpretation == "<") {
              return "Suppressed";
            }
            if (result_interpretation == ">") {
              return "Viremic (above assay limit)";
            }
            if (vl_value != _networkMissing) {
              return vl_value;
            }
          } else {
            return vl_value;
          }
        }

        return _networkMissing;
      }
    },

    recent_rapid: self.recent_rapid_definition,

    subcluster_index: {
      depends: [_networkCDCDateField],
      label: "Subcluster ID",
      type: "String",

      map: function(node) {
        return node.subcluster_label;
      }
    },

    /*priority_sets: {
      depends: [_networkCDCDateField],
      label: "Priority sets",
      type: "String",
      map: function(node) {
        //console.log (node);
        return "None";
      }
    },*/

    age_dx: {
      depends: ["age"],
      overwrites: "age",
      label: "age_dx",
      enum: ["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "≥60"],
      color_scale: function() {
        return d3.scale
          .ordinal()
          .domain([
            "<13",
            "13-19",
            "20-29",
            "30-39",
            "40-49",
            "50-59",
            "≥60",
            _networkMissing
          ])
          .range([
            "#b10026",
            "#e31a1c",
            "#fc4e2a",
            "#fd8d3c",
            "#feb24c",
            "#fed976",
            "#ffffb2",
            "#636363"
          ]);
      },
      map: function(node) {
        var vl_value = self.attribute_node_value_by_id(node, "age");
        if (vl_value == ">=60") {
          return "≥60";
        }
        return vl_value;
      }
    },

    hiv_aids_dx_dt_year: {
      depends: [_networkCDCDateField],
      label: "HIV/AIDS Diagnosis Year",
      type: "Number",
      label_format: d3.format(".0f"),
      map: function(node) {
        try {
          var value = self._parse_dates(
            self.attribute_node_value_by_id(node, _networkCDCDateField)
          );
          if (value) {
            value = "" + value.getFullYear();
          } else {
            value = _networkMissing;
          }
          return value;
        } catch (err) {
          return _networkMissing;
        }
      },
      color_scale: function(attr) {
        var range_without_missing = _.without(
          attr.value_range,
          _networkMissing
        );
        var color_scale = _.compose(
          d3.interpolateRgb("#ffffcc", "#800026"),
          d3.scale
            .linear()
            .domain([
              range_without_missing[0],
              range_without_missing[range_without_missing.length - 1]
            ])
            .range([0, 1])
        );
        return function(v) {
          if (v == _networkMissing) {
            return _networkMissingColor;
          }
          return color_scale(v);
        };
      }
    }
  };

  if (self.cluster_attributes) {
    self._networkPredefinedAttributeTransforms["_newly_added"] = {
      label: "Compared to previous network",
      enum: ["Existing", "New", "Moved clusters"],
      map: function(node) {
        if (node.attributes.indexOf("new_node") >= 0) {
          return "New";
        }
        if (node.attributes.indexOf("moved_clusters") >= 0) {
          return "Moved clusters";
        }
        return "Existing";
      },
      color_scale: function() {
        return d3.scale
          .ordinal()
          .domain(["Existing", "New", "Moved clusters", _networkMissing])
          .range(["#7570b3", "#d95f02", "#1b9e77", "gray"]);
      }
    };
  }

  if (self.precomputed_subclusters) {
    _.each(self.precomputed_subclusters, (v, k) => {
      self._networkPredefinedAttributeTransforms["_subcluster" + k] = {
        label: "Subcluster @" + d3.format("p")(+k),
        type: "String",
        map: function(node) {
          if ("subcluster" in node) {
            var sub_at_k = _.find(node.subcluster, t => t[0] == k);
            if (sub_at_k) {
              return sub_at_k[1];
            }
          }
          return "Not in a subcluster";
        }
      };
    });
  }

  if (options && options["computed-attributes"]) {
    _.extend(
      self._networkPredefinedAttributeTransforms,
      options["computed-attributes"]
    );
  }

  self._parse_dates = function(value) {
    if (value instanceof Date) {
      return value;
    }
    var parsed_value = null;

    var passed = _.any(_defaultDateFormats, function(f) {
      parsed_value = f.parse(value);
      return parsed_value;
    });

    //console.log (value + " mapped to " + parsed_value);

    if (passed) {
      if (
        self._is_CDC_ &&
        (parsed_value.getFullYear() < 1970 ||
          parsed_value.getFullYear() > _networkUpperBoundOnDate)
      ) {
        throw "Invalid date";
      }
      return parsed_value;
    }

    throw "Invalid date";
  };

  /*------------ Network layout code ---------------*/
  var handle_cluster_click = function(cluster, release) {
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

    var already_fixed = cluster && cluster.fixed == 1;

    if (cluster) {
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text("Expand cluster")
        .on("click", function(d) {
          cluster.fixed = 0;
          self.expand_cluster_handler(cluster, true);
          menu_object.style("display", "none");
        });

      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text("Center on screen")
        .on("click", function(d) {
          cluster.fixed = 0;
          center_cluster_handler(cluster);
          menu_object.style("display", "none");
        });

      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text(function(d) {
          if (cluster.fixed) return "Allow cluster to float";
          return "Hold cluster at current position";
        })
        .on("click", function(d) {
          cluster.fixed = !cluster.fixed;
          menu_object.style("display", "none");
        });

      if (self.primary_graph) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text(function(d) {
            return "Show this cluster in separate tab";
          })
          .on("click", function(d) {
            self.open_exclusive_tab_view(cluster.cluster_id);
            menu_object.style("display", "none");
          });
      }

      let pse = self.has_priority_set_editor();
      if (pse) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text(function(d) {
            return "Add this cluster to priority set";
          })
          .on("click", function(d) {
            self
              .has_priority_set_editor()
              .append_nodes(_.map(cluster.children, c => c.id));
          });
      }

      // Only show the "Show on map" option for clusters with valid country info (for now just 2 letter codes) for each node.
      var show_on_map_enabled = self.countryCentersObject;

      show_on_map_enabled = _.every(cluster.children, function(node) {
        //console.log (node.patient_attributes);
        return self._get_node_country(node).length == 2;
      });

      if (show_on_map_enabled) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text("Show on map")
          .on("click", function(d) {
            //console.log(cluster)
            self.open_exclusive_tab_view(
              cluster.cluster_id,
              null,
              cluster_id => {
                return "Map of cluster: " + cluster_id;
              },
              { showing_on_map: true }
            );
          });
      }

      cluster.fixed = 1;

      menu_object
        .style("position", "absolute")
        .style("left", "" + d3.event.offsetX + "px")
        .style("top", "" + d3.event.offsetY + "px")
        .style("display", "block");
    } else {
      if (release) {
        release.fixed = 0;
      }
      menu_object.style("display", "none");
    }

    container.on(
      "click",
      function(d) {
        handle_cluster_click(null, already_fixed ? null : cluster);
      },
      true
    );
  };

  /*self._handle_inline_charts = function (e) {

  }*/

  self._get_node_country = function(node) {
    var countryCodeAlpha2 = self.attribute_node_value_by_id(node, "country");
    if (countryCodeAlpha2 == _networkMissing) {
      countryCodeAlpha2 = self.attribute_node_value_by_id(node, "Country");
    }
    return countryCodeAlpha2;
  };

  self._draw_topomap = function(no_redraw) {
    if (options && "showing_on_map" in options) {
      var countries = topojson.feature(
        countryOutlines,
        countryOutlines.objects.countries
      ).features;
      var mapsvg = d3.select("#" + self.dom_prefix + "-network-svg");
      var path = d3.geo.path().projection(self.mapProjection);
      var countries = mapsvg.selectAll(".country").data(countries);

      countries.enter().append("path");
      countries.exit().remove();

      self.countries_in_cluster = {};

      _.each(self.nodes, function(node) {
        var countryCodeAlpha2 = self._get_node_country(node);
        var countryCodeNumeric =
          self.countryCentersObject[countryCodeAlpha2].countryCodeNumeric;
        if (!(countryCodeNumeric in self.countries_in_cluster)) {
          self.countries_in_cluster[countryCodeNumeric] = true;
        }
      });

      countries
        .attr("class", "country")
        .attr("d", path)
        .attr("stroke", "saddlebrown")
        .attr("fill", function(d) {
          if (d.id in self.countries_in_cluster) {
            return "navajowhite";
          } else {
            return "bisque";
          }
        })
        .attr("stroke-width", function(d) {
          if (d.id in self.countries_in_cluster) {
            return 1.5;
          } else {
            return 0.5;
          }
        });
    }
    return self;
  };

  self._check_for_time_series = function(export_items) {
    var event_handler = function(network, e) {
      if (e) {
        e = d3.select(e);
      }
      if (!network.network_cluster_dynamics) {
        network.network_cluster_dynamics = network.network_svg
          .append("g")
          .attr("id", self.dom_prefix + "-dynamics-svg")
          .attr("transform", "translate (" + network.width * 0.45 + ",0)");

        network.handle_inline_charts = function(plot_filter) {
          var attr = null;
          var color = null;
          if (
            network.colorizer["category_id"] &&
            !network.colorizer["continuous"]
          ) {
            var attr_desc =
              network.json[_networkGraphAttrbuteID][
                network.colorizer["category_id"]
              ];
            attr = {};
            attr[network.colorizer["category_id"]] = attr_desc["label"];
            color = {};
            color[attr_desc["label"]] = network.colorizer["category"];
          }

          misc.cluster_dynamics(
            network.extract_network_time_series(
              self.cluster_time_scale,
              attr,
              plot_filter
            ),
            network.network_cluster_dynamics,
            "Quarter of Diagnosis",
            "Number of Cases",
            null,
            null,
            {
              base_line: 20,
              top: network.margin.top,
              right: network.margin.right,
              bottom: 3 * 20,
              left: 5 * 20,
              font_size: 12,
              rect_size: 14,
              width: network.width / 2,
              height: network.height / 2,
              colorizer: color,
              prefix: network.dom_prefix,
              barchart: true,
              drag: {
                x: network.width * 0.45,
                y: 0
              }
            }
          );
        };
        network.handle_inline_charts();
        if (e) {
          e.text("Hide time-course plots");
        }
      } else {
        if (e) {
          e.text("Show time-course plots");
        }
        network.network_cluster_dynamics.remove();
        network.network_cluster_dynamics = null;
        network.handle_inline_charts = null;
      }
    };

    if (self.cluster_time_scale) {
      if (export_items) {
        export_items.push(["Show time-course plots", event_handler]);
      } else {
        event_handler(self);
      }
    }
  };

  self.open_exclusive_tab_close = function(
    tab_element,
    tab_content,
    restore_to_tag
  ) {
    //console.log (restore_to_tag);
    $(restore_to_tag).tab("show");
    $("#" + tab_element).remove();
    $("#" + tab_content).remove();
  };

  self.open_exclusive_tab_view = function(
    cluster_id,
    custom_filter,
    custom_name,
    additional_options,
    include_injected_edges
  ) {
    var cluster = _.find(self.clusters, function(c) {
      return c.cluster_id == cluster_id;
    });

    if (!cluster) {
      return;
    }

    additional_options = additional_options || {};

    additional_options["parent_graph"] = self;

    var filtered_json = _extract_single_cluster(
      custom_filter
        ? _.filter(self.json.Nodes, custom_filter)
        : cluster.children,
      null,
      null,
      null,
      include_injected_edges
    );

    if (_networkGraphAttrbuteID in json) {
      filtered_json[_networkGraphAttrbuteID] = {};
      jQuery.extend(
        true,
        filtered_json[_networkGraphAttrbuteID],
        json[_networkGraphAttrbuteID]
      );
    }

    var export_items = [];
    if (!self._is_CDC_executive_mode) {
      export_items.push([
        "Export cluster to .CSV",
        function(network) {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(
              self._extract_nodes_by_id(cluster_id),
              self._extract_exportable_attributes()
            )
          );
        }
      ]);
    }

    //self._check_for_time_series(export_items);

    if ("extra_menu" in additional_options) {
      _.each(export_items, function(item) {
        additional_options["extra_menu"]["items"].push(item);
      });
    } else {
      _.extend(additional_options, {
        extra_menu: {
          title: "Action",
          items: export_items
        }
      });
    }

    return self.open_exclusive_tab_view_aux(
      filtered_json,
      custom_name ? custom_name(cluster_id) : "Cluster " + cluster_id,
      additional_options
    );
  };

  self._random_id = function(alphabet, length) {
    alphabet = alphabet || ["a", "b", "c", "d", "e", "f", "g"];
    length = length || 32;
    var s = "";
    for (var i = 0; i < length; i++) {
      s += _.sample(alphabet);
    }
    return s;
  };

  self.open_exclusive_tab_view_aux = function(
    filtered_json,
    title,
    option_extras
  ) {
    var letters = ["a", "b", "c", "d", "e", "f", "g"];

    var random_prefix = self._random_id(letters, 32);
    var random_tab_id = random_prefix + "_tab";
    var random_content_id = random_prefix + "_div";
    var random_button_bar = random_prefix + "_ui";

    while (
      $("#" + random_tab_id).length ||
      $("#" + random_content_id).length ||
      $("#" + random_button_bar).length
    ) {
      random_prefix = self._random_id(letters, 32);
      random_tab_id = random_prefix + "_tab";
      random_content_id = random_prefix + "_div";
      random_button_bar = random_prefix + "_ui";
    }

    var tab_container = "top_level_tab_container";
    var content_container = "top_level_tab_content";
    var go_here_when_closed = "#trace-default-tab";

    // add new tab to the menu bar and switch to it
    var new_tab_header = $("<li></li>").attr("id", random_tab_id);

    var new_link = $("<a></a>")
      .attr("href", "#" + random_content_id)
      .attr("data-toggle", "tab")
      .text(title);
    $(
      '<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
    )
      .appendTo(new_link)
      .on("click", function() {
        self.open_exclusive_tab_close(
          random_tab_id,
          random_content_id,
          go_here_when_closed
        );
      });

    new_link.appendTo(new_tab_header);
    $("#" + tab_container).append(new_tab_header);

    var new_tab_content = $("<div></div>")
      .addClass("tab-pane")
      .attr("id", random_content_id)
      .data("cluster", option_extras.cluster_id);

    if (option_extras.type == "subcluster") {
      new_tab_content
        .addClass("subcluster-view")
        .addClass("subcluster-" + option_extras.cluster_id.replace(".", "_"));
    }

    //     <li class='disabled' id="attributes-tab"><a href="#trace-attributes" data-toggle="tab">Attributes</a></li>
    var new_button_bar = $('[data-hivtrace="cluster-clone"]')
      .clone()
      .attr("data-hivtrace", null);
    new_button_bar
      .find("[data-hivtrace-button-bar='yes']")
      .attr("id", random_button_bar)
      .addClass("cloned-cluster-tab")
      .attr("data-hivtrace-button-bar", null);

    new_button_bar.appendTo(new_tab_content);
    new_tab_content.appendTo("#" + content_container);

    $(new_link).on("show.bs.tab", function(e) {
      //console.log (e);
      if (e.relatedTarget) {
        //console.log (e.relatedTarget);
        go_here_when_closed = e.relatedTarget;
      }
    });

    // show the new tab
    $(new_link).tab("show");

    var cluster_options = {
      no_cdc: options && options["no_cdc"],
      "minimum size": 0,
      secondary: true,
      prefix: random_prefix,
      extra_menu:
        options && "extra_menu" in options ? options["extra_menu"] : null,
      "edge-styler":
        options && "edge-styler" in options ? options["edge-styler"] : null,
      "no-subclusters": true,
      "no-subcluster-compute": false
    };

    if (option_extras) {
      _.extend(cluster_options, option_extras);
    }

    if (
      option_extras.showing_on_map &&
      self.countryCentersObject &&
      self.countryOutlines
    ) {
      cluster_options["showing_on_map"] = true;
      cluster_options["country-centers"] = self.countryCentersObject;
      cluster_options["country-outlines"] = self.countryOutlines;

      // Create an array of the countries in the selected cluster for use in styling the map.
      if ("extra-graphics" in cluster_options) {
        var draw_map = function(other_code, network) {
          other_code(network);
          return network._draw_topomap();
        };

        cluster_options["extra-graphics"] = _.wrap(
          draw_map,
          cluster_options["extra-graphics"]
        );
      } else {
        cluster_options["extra-graphics"] = function(network) {
          return network._draw_topomap();
        };
      }
    }

    var cluster_view = hivtrace.clusterNetwork(
      filtered_json,
      "#" + random_content_id,
      null,
      null,
      random_button_bar,
      attributes,
      null,
      null,
      null,
      parent_container,
      cluster_options
    );

    if (self.colorizer["category_id"]) {
      if (self.colorizer["continuous"]) {
        cluster_view.handle_attribute_continuous(self.colorizer["category_id"]);
      } else {
        cluster_view.handle_attribute_categorical(
          self.colorizer["category_id"]
        );
      }
    }

    if (self.node_shaper["id"]) {
      cluster_view.handle_shape_categorical(self.node_shaper["id"]);
    }

    if (self.colorizer["opacity_id"]) {
      cluster_view.handle_attribute_opacity(self.colorizer["opacity_id"]);
    }

    cluster_view.expand_cluster_handler(cluster_view.clusters[0], true);
    return cluster_view;
  };

  // ensure all checkboxes are unchecked at initialization
  $('input[type="checkbox"]').prop("checked", false);

  var handle_node_click = function(node) {
    if (d3.event.defaultPrevented) return;
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

    if (node) {
      node.fixed = 1;
      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text(__("clusters_main")["collapse_cluster"])
        .on("click", function(d) {
          node.fixed = 0;
          collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text(function(d) {
          return node.show_label ? "Hide text label" : "Show text label";
        })
        .on("click", function(d) {
          node.fixed = 0;
          //node.show_label = !node.show_label;
          handle_node_label(container, node);
          //collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      let pse = self.has_priority_set_editor();
      if (pse) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text(function(d) {
            return "Add this node to priority set";
          })
          .on("click", function(d) {
            self.has_priority_set_editor().append_node(node.id, true);
          });
      }

      // SW20180605 : To be implemented

      //menu_object
      //  .append("li")
      //  .append("a")
      //  .attr("tabindex", "-1")
      //  .text("Show sequences used to make cluster")
      //  .on("click", function(d) {
      //    node.fixed = 0;
      //    show_sequences_in_cluster (node, true);
      //    menu_object.style("display", "none");
      //  });

      menu_object
        .style("position", "absolute")
        .style("left", "" + d3.event.offsetX + "px")
        .style("top", "" + d3.event.offsetY + "px")
        .style("display", "block");
    } else {
      menu_object.style("display", "none");
    }

    container.on(
      "click",
      function(d) {
        handle_node_click(null);
      },
      true
    );
  };

  function get_initial_xy(packed) {
    // create clusters from nodes
    var mapped_clusters = get_all_clusters(self.nodes);

    var d_clusters = {
      id: "root",
      children: []
    };

    // filter out clusters that are to be excluded
    if (self.exclude_cluster_ids) {
      mapped_clusters = _.omit(mapped_clusters, self.exclude_cluster_ids);
    }

    d_clusters.children = _.map(mapped_clusters, (value, key) => {
      return {
        cluster_id: key,
        children: value
      };
    });

    var treemap = packed
      ? d3.layout
          .pack()
          .size([self.width, self.height])
          //.sticky(true)
          .children(function(d) {
            return d.children;
          })
          .value(function(d) {
            return Math.pow(d.parent.children.length, 1.5);
          })
          .sort(function(a, b) {
            return b.value - a.value;
          })
          .padding(5)
      : d3.layout
          .treemap()
          .size([self.width, self.height])
          //.sticky(true)
          .children(function(d) {
            return d.children;
          })
          .value(function(d) {
            return Math.pow(d.parent.children.length, 1.0);
          })
          .sort(function(a, b) {
            return a.value - b.value;
          })
          .ratio(1);

    var clusters = treemap.nodes(d_clusters);
    _.each(clusters, function(c) {
      //c.fixed = true;
    });
    return clusters;
  }

  function prepare_data_to_graph() {
    var graphMe = {};
    graphMe.all = [];
    graphMe.edges = [];
    graphMe.nodes = [];
    graphMe.clusters = [];

    var expandedClusters = [];
    var drawnNodes = [];

    self.clusters.forEach(function(x) {
      if (self.cluster_display_filter(x)) {
        // Check if hxb2_linked is in a child
        var hxb2_exists =
          x.children.some(function(c) {
            return c.hxb2_linked;
          }) && self.hide_hxb2;
        if (!hxb2_exists) {
          if (x.collapsed) {
            graphMe.clusters.push(x);
            graphMe.all.push(x);
          } else {
            expandedClusters[x.cluster_id] = true;
          }
        }
      }
    });

    self.nodes.forEach(function(x, i) {
      if (expandedClusters[x.cluster]) {
        drawnNodes[i] = graphMe.nodes.length + graphMe.clusters.length;
        graphMe.nodes.push(x);
        graphMe.all.push(x);
      }
    });

    self.edges.forEach(function(x) {
      if (!(x.removed && self.filter_edges)) {
        if (
          drawnNodes[x.source] !== undefined &&
          drawnNodes[x.target] !== undefined
        ) {
          var y = {};
          for (var prop in x) {
            y[prop] = x[prop];
          }

          y.source = drawnNodes[x.source];
          y.target = drawnNodes[x.target];
          graphMe.edges.push(y);
        }
      }
    });

    return graphMe;
  }

  self._refresh_subcluster_view = function(set_date) {
    self.annotate_priority_clusters(_networkCDCDateField, 36, 12, set_date);

    var field_def = self.recent_rapid_definition(self, set_date);

    if (field_def) {
      self.inject_attribute_description("recent_rapid", field_def);
      self._aux_process_category_values(
        self._aux_populate_category_fields(field_def, "recent_rapid")
      );
      self.handle_attribute_categorical("recent_rapid");
    }
  };

  self.view_subcluster = function(
    cluster,
    custom_filter,
    custom_name,
    options,
    custom_edge_filter,
    include_injected_edges,
    length_threshold
  ) {
    length_threshold = length_threshold || self.subcluster_threshold;
    var filtered_json = _extract_single_cluster(
      custom_filter
        ? _.isArray(custom_filter)
          ? custom_filter
          : _.filter(self.json.Nodes, custom_filter)
        : cluster.children,
      custom_edge_filter ||
        function(e) {
          return e.length <= length_threshold;
        },
      false,
      null,
      include_injected_edges
    );

    _.each(filtered_json.Nodes, function(n) {
      n.subcluster_label = "1.1";
    });

    if (_networkGraphAttrbuteID in json) {
      filtered_json[_networkGraphAttrbuteID] = {};
      jQuery.extend(
        true,
        filtered_json[_networkGraphAttrbuteID],
        json[_networkGraphAttrbuteID]
      );
    }

    options = options || new Object();

    options["parent_graph"] = self;

    var extra_menu_items = [
      [
        function(network, item) {
          var enclosure = item.append("div").classed("form-group", true);
          var label = enclosure
            .append("label")
            .text("Recalculate R&R from ")
            .classed("control-label", true);
          var date = enclosure
            .append("input")
            .attr("type", "date")
            .classed("form-control", true)
            .attr("value", _defaultDateViewFormatSlider(self.today))
            .attr("max", _defaultDateViewFormatSlider(self.today))
            .attr(
              "min",
              _defaultDateViewFormatSlider(
                d3.min(network.nodes, function(node) {
                  return network.attribute_node_value_by_id(
                    node,
                    _networkCDCDateField
                  );
                })
              )
            )
            .on("change", function(e) {
              //d3.event.preventDefault();
              var set_date = _defaultDateViewFormatSlider.parse(this.value);
              if (this.value) {
                network._refresh_subcluster_view(set_date);

                enclosure
                  .classed("has-success", true)
                  .classed("has-error", false);
              } else {
                enclosure
                  .classed("has-success", false)
                  .classed("has-error", true);
              }
            })
            .on("click", function(e) {
              d3.event.stopPropagation();
            });
        },
        null
      ]
    ];
    if (!self._is_CDC_executive_mode) {
      extra_menu_items.push([
        "Export cluster to .CSV",
        function(network) {
          helpers.export_csv_button(
            network._extract_attributes_for_nodes(
              network._extract_nodes_by_id("1.1"),
              network._extract_exportable_attributes()
            )
          );
        }
      ]);
    }

    options["type"] = "subcluster";
    options["cluster_id"] = cluster.cluster_id || "N/A";
    if ("extra_menu" in options) {
      options["extra_menu"]["items"] = options["extra_menu"]["items"].concat(
        extra_menu_items
      );
    } else {
      options["extra_menu"] = {
        title: "Action",
        items: extra_menu_items
      };
    }

    //self._check_for_time_series(extra_menu_items);
    var cluster_view = self.open_exclusive_tab_view_aux(
      filtered_json,
      custom_name || "Subcluster " + cluster.cluster_id,
      options
    );
    if (!options.skip_recent_rapid)
      cluster_view.handle_attribute_categorical("recent_rapid");
    return cluster_view;

    /*var selector =
      ".subcluster-" +
      cluster.id.replace(".", "_") +
      " .show-small-clusters-button";

    var item = $(
      '<span class="input-group-addon btn view-parent-btn">View Parent</span>'
    )
      .data("cluster_id", cluster.parent_cluster.cluster_id)
      .insertAfter(selector);

    item.on("click", function(e) {
      self.open_exclusive_tab_view($(this).data("cluster_id"));
    });*/
  };

  function _n_months_ago(reference_date, months) {
    var past_date = new Date(reference_date);
    var past_months = past_date.getMonth();
    var diff_year = Math.floor(months / 12);
    var left_over = months - diff_year * 12;

    if (left_over > past_months) {
      past_date.setFullYear(past_date.getFullYear() - diff_year - 1);
      past_date.setMonth(12 - (left_over - past_months));
    } else {
      past_date.setFullYear(past_date.getFullYear() - diff_year);
      past_date.setMonth(past_months - left_over);
    }

    //past_date.setTime (past_date.getTime () - months * 30 * 24 * 3600000);
    return past_date;
  }

  var oldest_nodes_first = function(n1, n2) {
    let date_field = date_field || _networkCDCDateField;

    // consistent node sorting, older nodes first
    var node1_dx = self.attribute_node_value_by_id(n1, date_field);
    var node2_dx = self.attribute_node_value_by_id(n2, date_field);

    if (node1_dx == node2_dx) {
      return n1.id < n2.id ? -1 : 1;
    } else {
      return node1_dx < node2_dx ? -1 : 1;
    }

    return 0;
  };

  self._filter_by_date = function(
    cutoff,
    date_field,
    start_date,
    node,
    count_newly_added
  ) {
    if (count_newly_added && self._is_new_node(node)) {
      return true;
    }
    var node_dx = self.attribute_node_value_by_id(node, date_field);
    if (node_dx instanceof Date) {
      return node_dx >= cutoff && node_dx <= start_date;
    } else {
      try {
        node_dx = self._parse_dates(
          self.attribute_node_value_by_id(node, date_field)
        );
        if (node_dx instanceof Date) {
          return node_dx >= cutoff && node_dx <= start_date;
        }
      } catch (err) {
        return undefined;
      }
    }
    return false;
  };

  self.annotate_priority_clusters = function(
    date_field,
    span_months,
    recent_months,
    start_date
  ) {
    try {
      start_date = start_date || self.get_reference_date();

      var cutoff_long = _n_months_ago(start_date, span_months);
      var cutoff_short = _n_months_ago(start_date, recent_months);

      var node_iterator;

      if (start_date == self.today) {
        node_iterator = self.nodes;
      } else {
        var beginning_of_time = new Date();
        beginning_of_time.setYear(1900);
        node_iterator = [];
        _.each(self.nodes, function(node) {
          var filter_result = self._filter_by_date(
            beginning_of_time,
            date_field,
            start_date,
            node
            //true
          );
          if (_.isUndefined(filter_result)) {
            node.priority_flag = 6;
          } else {
            if (filter_result) {
              node.priority_flag = 5;
              node_iterator.push(node);
            } else {
              node.priority_flag = 4;
            }
          }
        });
      }

      // extract all clusters at once to avoid inefficiencies of multiple edge-set traverals

      var split_clusters = {};
      var node_id_to_local_cluster = {};

      // reset all annotations

      _.each(node_iterator, function(node) {
        if (node.cluster) {
          if (!(node.cluster in split_clusters)) {
            split_clusters[node.cluster] = { Nodes: [], Edges: [] };
          }
          node_id_to_local_cluster[node.id] =
            split_clusters[node.cluster]["Nodes"].length;
          split_clusters[node.cluster]["Nodes"].push(node);
        }
      });

      _.each(self.edges, function(edge) {
        if (edge.length <= self.subcluster_threshold) {
          var edge_cluster = self.nodes[edge.source].cluster;

          var source_id = self.nodes[edge.source].id,
            target_id = self.nodes[edge.target].id;

          if (
            source_id in node_id_to_local_cluster &&
            target_id in node_id_to_local_cluster
          ) {
            var copied_edge = _.clone(edge);

            copied_edge.source = node_id_to_local_cluster[source_id];
            copied_edge.target = node_id_to_local_cluster[target_id];

            split_clusters[edge_cluster]["Edges"].push(copied_edge);
          }
        }
      });

      let cluster_id_match =
        self.precomputed_subclusters &&
        self.subcluster_threshold in self.precomputed_subclusters
          ? self.precomputed_subclusters
          : null;

      _.each(split_clusters, function(cluster_nodes, cluster_index) {
        /** extract subclusters; all nodes at given threshold */
        /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */

        //var cluster_nodes       = _extract_single_cluster (cluster.children, null, true);

        var array_index = self.cluster_mapping[cluster_index];

        self.clusters[array_index].priority_score = 0;

        /** all clusters with more than one member connected at 'threshold' edge length */
        var edges = [];

        var subclusters = _.filter(
          hivtrace_cluster_depthwise_traversal(
            cluster_nodes.Nodes,
            cluster_nodes.Edges,
            null,
            edges
          ),
          function(cc) {
            return cc.length > 1;
          }
        );

        edges = _.filter(edges, function(es) {
          return es.length > 1;
        });

        /** sort subclusters by oldest node */
        _.each(subclusters, function(c, i) {
          c.sort(oldest_nodes_first);
        });

        subclusters.sort(function(c1, c2) {
          return oldest_nodes_first(c1[0], c2[0]);
        });

        let next_id = subclusters.length + 1;

        subclusters = _.map(subclusters, function(c, i) {
          let subcluster_id = i + 1;

          if (cluster_id_match) {
            let precomputed_values = {};
            _.each(c, function(n) {
              if ("subcluster" in n) {
                var sub_at_k = _.find(
                  n.subcluster,
                  t => t[0] == self.subcluster_threshold
                );
                if (sub_at_k) {
                  precomputed_values[
                    sub_at_k[1].split(_networkSubclusterSeparator)[1]
                  ] = 1;
                  return;
                }
              }

              precomputed_values[null] = 1;
            });

            if (
              null in precomputed_values ||
              _.keys(precomputed_values).length != 1
            ) {
              subcluster_id = next_id++;
            } else {
              subcluster_id = _.keys(precomputed_values)[0];
            }

            /*if ((i+1) != 0 + subcluster_id) {
                console.log (self.clusters[array_index].cluster_id, i, "=>", subcluster_id, _.keys(precomputed_values));
             }*/
          }

          var label =
            self.clusters[array_index].cluster_id +
            _networkSubclusterSeparator +
            subcluster_id;

          _.each(c, function(n) {
            //if (!("subcluster_label" in n)) {
            n.subcluster_label = label;
            //}
            n.priority_flag = 0;
          });

          return {
            children: _.clone(c),
            parent_cluster: self.clusters[array_index],
            cluster_id: label,
            distances: helpers.describe_vector(
              _.map(edges[i], function(e) {
                return e.length;
              })
            )
          };
        });

        _.each(subclusters, function(c) {
          _compute_cluster_degrees(c);
        });

        self.clusters[array_index].subclusters = subclusters;

        /** now, for each subcluster, extract the recent and rapid part */

        /** Recent & Rapid (R&R) Cluster: the part of the Sub-Cluster inferred using only cases dx�d in the previous 36 months
                and at least two cases dx-ed in the previous 12 months; there is a path between all nodes in an R&R Cluster

                20180406 SLKP: while unlikely, this definition could result in multiple R&R clusters
                per subclusters; for now we will add up all the cases for prioritization, and
                display the largest R&R cluster if there is more than one
            */

        _.each(subclusters, function(sub) {
          // extract nodes based on dates
          var subcluster_json = _extract_single_cluster(
            _.filter(
              sub.children,
              _.partial(
                self._filter_by_date,
                cutoff_long,
                date_field,
                start_date
              )
            ),
            null,
            true,
            cluster_nodes
          );

          var rr_cluster = _.filter(
            hivtrace_cluster_depthwise_traversal(
              subcluster_json.Nodes,
              _.filter(subcluster_json.Edges, function(e) {
                return e.length <= self.subcluster_threshold;
              })
            ),
            function(cc) {
              return cc.length > 1;
            }
          );

          sub.rr_count = rr_cluster.length;

          rr_cluster.sort(function(a, b) {
            return b.length - a.length;
          });

          sub.priority_score = [];
          sub.recent_nodes = [];

          _.each(rr_cluster, function(recent_cluster) {
            var priority_nodes = _.groupBy(
              recent_cluster,
              _.partial(
                self._filter_by_date,
                cutoff_short,
                date_field,
                start_date
              )
            );

            sub.recent_nodes.push(_.map(recent_cluster, n => n.id));

            if (true in priority_nodes) {
              // recent
              sub.priority_score.push(_.map(priority_nodes[true], n => n.id));
              _.each(priority_nodes[true], function(n) {
                n.priority_flag = self._filter_by_date(
                  start_date,
                  date_field,
                  start_date,
                  n
                )
                  ? 4
                  : 1;
                if (priority_nodes[true].length >= 3) {
                  if (n.priority_flag == 1) {
                    n.priority_flag = 2;
                  }
                }
              });
            }
            if (false in priority_nodes) {
              // not recent
              _.each(priority_nodes[false], function(n) {
                n.priority_flag = 3;
              });
            }
          });

          //console.log (sub.recent_nodes);
          self.clusters[array_index].priority_score = sub.priority_score;
        });
      });
    } catch (err) {
      console.log(err);
      return;
    }
  };

  function default_layout(packed) {
    // let's create an array of clusters from the json

    var init_layout = get_initial_xy(packed);

    if (self.clusters.length == 0) {
      self.clusters = init_layout.filter(function(v, i, obj) {
        return !(typeof v.cluster_id === "undefined");
      });
    } else {
      var coordinate_update = {};
      _.each(self.clusters, function(c) {
        coordinate_update[c.cluster_id] = c;
      });
      _.each(init_layout, function(c) {
        if ("cluster_id" in c) {
          _.extendOwn(coordinate_update[c.cluster_id], c);
        }
      });
    }

    //var sizes = network_layout.size();

    var set_init_coords = packed
      ? function(n) {
          n.x += n.r * 0.5;
          n.y += n.r * 0.5;
        }
      : function(n) {
          n.x += n.dx * 0.5;
          n.y += n.dy * 0.5;
        };

    _.each([self.nodes, self.clusters], function(list) {
      _.each(list, set_init_coords);
    });

    self.clusters.forEach(collapse_cluster);
  }

  function change_spacing(delta) {
    self.charge_correction = self.charge_correction * delta;
    network_layout.start();
  }

  function change_window_size(delta, trigger) {
    if (delta) {
      var x_scale = (self.width + delta / 2) / self.width;
      var y_scale = (self.height + delta / 2) / self.height;

      self.width += delta;
      self.height += delta;

      var rescale_x = d3.scale.linear().domain(
        d3.extent(network_layout.nodes(), function(node) {
          return node.x;
        })
      );
      rescale_x.range(
        _.map(rescale_x.domain(), function(v) {
          return v * x_scale;
        })
      );
      //.range ([50,self.width-50]),
      var rescale_y = d3.scale.linear().domain(
        d3.extent(network_layout.nodes(), function(node) {
          return node.y;
        })
      );
      rescale_y.range(
        _.map(rescale_y.domain(), function(v) {
          return v * y_scale;
        })
      );

      _.each(network_layout.nodes(), function(node) {
        node.x = rescale_x(node.x);
        node.y = rescale_y(node.y);
      });
    }

    self.width = Math.min(Math.max(self.width, 200), 4000);
    self.height = Math.min(Math.max(self.height, 200), 4000);

    network_layout.size([self.width, self.height]);
    self.network_svg.attr("width", self.width).attr("height", self.height);
    self._calc_country_nodes(options);
    self._draw_topomap(true);
    if (trigger) {
      network_layout.start();
    } else {
      if (delta) {
        self.update(true);
      }
    }
  }

  self.compute_adjacency_list = _.once(function() {
    self.nodes.forEach(function(n) {
      n.neighbors = d3.set();
    });

    self.edges.forEach(function(e) {
      self.nodes[e.source].neighbors.add(e.target);
      self.nodes[e.target].neighbors.add(e.source);
    });
  });

  self.compute_local_clustering_coefficients = _.once(function() {
    self.compute_adjacency_list();

    self.nodes.forEach(function(n) {
      _.defer(function(a_node) {
        neighborhood_size = a_node.neighbors.size();
        if (neighborhood_size < 2) {
          a_node.lcc = misc.undefined;
        } else {
          if (neighborhood_size > 500) {
            a_node.lcc = misc.too_large;
          } else {
            // count triangles
            neighborhood = a_node.neighbors.values();
            counter = 0;
            for (n1 = 0; n1 < neighborhood_size; n1 += 1) {
              for (n2 = n1 + 1; n2 < neighborhood_size; n2 += 1) {
                if (
                  self.nodes[neighborhood[n1]].neighbors.has(neighborhood[n2])
                ) {
                  counter++;
                }
              }
            }

            a_node.lcc =
              (2 * counter) / neighborhood_size / (neighborhood_size - 1);
          }
        }
      }, n);
    });
  });

  self.get_node_by_id = function(id) {
    return self.nodes.filter(function(n) {
      return n.id == id;
    })[0];
  };

  self.compute_local_clustering_coefficients_worker = _.once(function() {
    var worker = new Worker("workers/lcc.js");

    worker.onmessage = function(event) {
      var nodes = event.data.Nodes;

      nodes.forEach(function(n) {
        node_to_update = self.get_node_by_id(n.id);
        node_to_update.lcc = n.lcc ? n.lcc : misc.undefined;
      });
    };

    var worker_obj = {};
    worker_obj["Nodes"] = self.nodes;
    worker_obj["Edges"] = self.edges;
    worker.postMessage(worker_obj);
  });

  var estimate_cubic_compute_cost = _.memoize(
    function(c) {
      self.compute_adjacency_list();
      return _.reduce(
        _.first(_.pluck(c.children, "degree").sort(d3.descending), 3),
        function(memo, value) {
          return memo * value;
        },
        1
      );
    },
    function(c) {
      return c.cluster_id;
    }
  );

  self.compute_global_clustering_coefficients = _.once(function() {
    self.compute_adjacency_list();

    self.clusters.forEach(function(c) {
      _.defer(function(a_cluster) {
        cluster_size = a_cluster.children.length;
        if (cluster_size < 3) {
          a_cluster.cc = misc.undefined;
        } else {
          if (estimate_cubic_compute_cost(a_cluster, true) >= 5000000) {
            a_cluster.cc = misc.too_large;
          } else {
            // pull out all the nodes that have this cluster id
            member_nodes = [];

            var triads = 0;
            var triangles = 0;

            self.nodes.forEach(function(n, i) {
              if (n.cluster == a_cluster.cluster_id) {
                member_nodes.push(i);
              }
            });
            member_nodes.forEach(function(node) {
              my_neighbors = self.nodes[node].neighbors
                .values()
                .map(function(d) {
                  return +d;
                })
                .sort(d3.ascending);
              for (n1 = 0; n1 < my_neighbors.length; n1 += 1) {
                for (n2 = n1 + 1; n2 < my_neighbors.length; n2 += 1) {
                  triads += 1;
                  if (
                    self.nodes[my_neighbors[n1]].neighbors.has(my_neighbors[n2])
                  ) {
                    triangles += 1;
                  }
                }
              }
            });

            a_cluster.cc = triangles / triads;
          }
        }
      }, c);
    });
  });

  self.mark_nodes_as_processing = function(property) {
    self.nodes.forEach(function(n) {
      n[property] = misc.processing;
    });
  };

  self.compute_graph_stats = function() {
    d3.select(this)
      .classed("disabled", true)
      .select("i")
      .classed({
        "fa-calculator": false,
        "fa-cog": true,
        "fa-spin": true
      });
    self.mark_nodes_as_processing("lcc");
    self.compute_local_clustering_coefficients_worker();
    self.compute_global_clustering_coefficients();
    d3.select(this).remove();
  };

  /*------------ Constructor ---------------*/
  function initial_json_load() {
    var connected_links = {};
    var total = 0;
    self.exclude_cluster_ids = {};
    self.has_hxb2_links = false;
    self.cluster_sizes = [];

    graph_data.Nodes.forEach(function(d) {
      if (typeof self.cluster_sizes[d.cluster - 1] === "undefined") {
        self.cluster_sizes[d.cluster - 1] = 1;
      } else {
        self.cluster_sizes[d.cluster - 1]++;
      }
      if ("is_lanl" in d) {
        d.is_lanl = d.is_lanl == "true";
      }

      if (!("attributes" in d)) {
        d.attributes = [];
      }

      if (d.attributes.indexOf("problematic") >= 0) {
        self.has_hxb2_links = d.hxb2_linked = true;
      }
    });

    /* add buttons and handlers */
    /* clusters first */
    self._is_new_node = function(n) {
      return n.attributes.indexOf("new_node") >= 0;
    };

    self._extract_attributes_for_nodes = function(nodes, column_names) {
      var result = [
        _.map(column_names, function(c) {
          return c.raw_attribute_key;
        })
      ];

      _.each(nodes, function(n) {
        result.push(
          _.map(column_names, function(c) {
            if (c.raw_attribute_key == _networkNodeIDField) {
              if (self._is_new_node(n)) {
                return n.id + _networkNewNodeMarker;
              }
              return n.id;
            }
            if (_.has(n, c.raw_attribute_key)) {
              return n[c.raw_attribute_key];
            }
            return self.attribute_node_value_by_id(n, c.raw_attribute_key);
          })
        );
      });
      return result;
    };

    self._extract_exportable_attributes = function(extended) {
      var allowed_types = {
        String: 1,
        Date: 1,
        Number: 1
      };

      var return_array = [];

      if (extended) {
        return_array = [
          {
            raw_attribute_key: _networkNodeIDField,
            type: "String",
            label: "Node ID",
            format: function() {
              return "Node ID";
            }
          },
          {
            raw_attribute_key: "cluster",
            type: "String",
            label: "Which cluster the individual belongs to",
            format: function() {
              return __("clusters_tab")["cluster_id"];
            }
          }
        ];
      }

      return_array.push(
        _.filter(self.json[_networkGraphAttrbuteID], function(d) {
          return d.type in allowed_types;
        })
      );

      return _.flatten(return_array, true);
    };

    self._extract_nodes_by_id = function(id) {
      var string_id = id.toString();
      return _.filter(self.nodes, function(n) {
        return n.cluster == id || n.subcluster_label == string_id;
      });
    };

    self._cluster_list_view_render = function(
      cluster_id,
      group_by_attribute,
      the_list,
      priority_group
    ) {
      the_list.selectAll("*").remove();
      var column_ids = self._extract_exportable_attributes();
      var cluster_nodes;

      if (priority_group) {
        cluster_nodes = self.priority_groups_find_by_name(priority_group);
        if (cluster_nodes) {
          cluster_nodes = cluster_nodes.node_objects;
        } else {
          return;
        }
      } else {
        cluster_nodes = self._extract_nodes_by_id(cluster_id);
      }

      d3.select(
        self.get_ui_element_selector_by_role("cluster_list_data_export", true)
      ).on("click", function(d) {
        if (self._is_CDC_executive_mode) {
          alert(_networkWarnExecutiveMode);
        } else {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(cluster_nodes, column_ids)
          );
        }
      });

      if (group_by_attribute) {
        _.each(column_ids, function(column) {
          var binned = _.groupBy(cluster_nodes, function(n) {
            return self.attribute_node_value_by_id(n, column.raw_attribute_key);
          });
          var sorted_keys = _.keys(binned).sort();
          var attribute_record = the_list.append("li");
          attribute_record.append("code").text(column.raw_attribute_key);
          var attribute_list = attribute_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(sorted_keys, function(key) {
            attribute_list.append("dt").text(key);
            attribute_list.append("dd").text(
              _.map(binned[key], function(n) {
                return n.id;
              }).join(", ")
            );
          });
        });
      } else {
        _.each(cluster_nodes, function(node) {
          var patient_record = the_list.append("li");
          patient_record.append("code").text(node.id);
          var patient_list = patient_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(column_ids, function(column) {
            patient_list.append("dt").text(column.raw_attribute_key);
            patient_list
              .append("dd")
              .text(
                self.attribute_node_value_by_id(node, column.raw_attribute_key)
              );
          });
        });
      }
    };

    self._setup_cluster_list_view = function() {
      d3.select(
        self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
      ).on("click", function() {
        d3.event.preventDefault();
        var group_by_id = false;

        var button_clicked = $(this);
        if (button_clicked.data(__("clusters_tab")["view"]) == "id") {
          button_clicked.data(__("clusters_tab")["view"], "attribute");
          button_clicked.text(__("clusters_tab")["group_by_id"]);
          group_by_id = false;
        } else {
          button_clicked.data(__("clusters_tab")["view"], "id");
          button_clicked.text(__("clusters_tab")["group_by_attribute"]);
          group_by_id = true;
        }

        var cluster_id = button_clicked.data("cluster");

        self._cluster_list_view_render(
          cluster_id ? cluster_id.toString() : "",
          !group_by_id,
          d3.select(
            self.get_ui_element_selector_by_role("cluster_list_payload", true)
          ),
          button_clicked.data("priority_list")
        );
      });

      $(self.get_ui_element_selector_by_role("cluster_list", true)).on(
        "show.bs.modal",
        function(event) {
          var link_clicked = $(event.relatedTarget);
          var cluster_id = link_clicked.data("cluster");
          var priority_list = link_clicked.data("priority_set");

          var modal = d3.select(
            self.get_ui_element_selector_by_role("cluster_list", true)
          );
          modal
            .selectAll(".modal-title")
            .text(
              __("clusters_tab")["listing_nodes"] +
                (priority_list
                  ? " in priority set " + priority_list
                  : " " + __("general")["cluster"] + " " + cluster_id)
            );

          var view_toggle = $(
            self.get_ui_element_selector_by_role(
              "cluster_list_view_toggle",
              true
            )
          );

          if (priority_list) {
            view_toggle.data("priority_list", priority_list);
            view_toggle.data("cluster", "");
          } else {
            view_toggle.data("cluster", cluster_id);
            view_toggle.data("priority_list", null);
          }

          self._cluster_list_view_render(
            cluster_id,
            //cluster_id,
            $(
              self.get_ui_element_selector_by_role(
                "cluster_list_view_toggle",
                true
              )
            ).data(__("clusters_tab")["view"]) != "id",
            modal.select(
              self.get_ui_element_selector_by_role("cluster_list_payload", true)
            ),
            priority_list
          );
        }
      );
    };

    if (button_bar_ui) {
      self._setup_cluster_list_view();

      var cluster_ui_container = d3.select(
        self.get_ui_element_selector_by_role("cluster_operations_container")
      );

      cluster_ui_container.selectAll("li").remove();

      var fix_handler = function(do_fix) {
        _.each([self.clusters, self.nodes], function(list) {
          _.each(list, function(obj) {
            obj.fixed = do_fix;
          });
        });
      };

      var node_label_handler = function(do_show) {
        var shown_nodes = self.network_svg.selectAll(".node");
        if (!shown_nodes.empty()) {
          shown_nodes.each(function(node) {
            node.show_label = do_show;
          });
          self.update(true);
        }
      };

      var layout_reset_handler = function(packed) {
        var fixed = [];
        _.each(self.clusters, function(obj) {
          if (obj.fixed) {
            fixed.push(obj);
          }
          obj.fixed = false;
        });
        default_layout(packed);
        network_layout.tick();
        self.update();
        _.each(fixed, function(obj) {
          obj.fixed = true;
        });
      };

      var cluster_commands = [
        [
          __("clusters_main")["expand_all"],
          function() {
            return self.expand_some_clusters();
          },
          true,
          "hivtrace-expand-all"
        ],
        [
          __("clusters_main")["collapse_all"],
          function() {
            return self.collapse_some_clusters();
          },
          true,
          "hivtrace-collapse-all"
        ],
        [
          __("clusters_main")["expand_filtered"],
          function() {
            return self.expand_some_clusters(
              self.select_some_clusters(function(n) {
                return n.match_filter;
              })
            );
          },
          true,
          "hivtrace-expand-filtered"
        ],
        [
          __("clusters_main")["collapse_filtered"],
          function() {
            return self.collapse_some_clusters(
              self.select_some_clusters(function(n) {
                return n.match_filter;
              })
            );
          },
          true,
          "hivtrace-collapse-filtered"
        ],
        [
          __("clusters_main")["fix_all_objects_in_place"],
          _.partial(fix_handler, true),
          true,
          "hivtrace-fix-in-place"
        ],
        [
          __("clusters_main")["allow_all_objects_to_float"],
          _.partial(fix_handler, false),
          true,
          "hivtrace-allow-to-float"
        ],
        [
          __("clusters_main")["reset_layout"] + " [packed]",
          _.partial(layout_reset_handler, true),
          true,
          "hivtrace-reset-layout"
        ],
        [
          __("clusters_main")["reset_layout"] + " [tiled]",
          _.partial(layout_reset_handler, false),
          true,
          "hivtrace-reset-layout"
        ],
        [
          __("network_tab")["show_labels_for_all"],
          _.partial(node_label_handler, true),
          true,
          "hivtrace-node-labels-on"
        ],
        [
          __("network_tab")["hide_labels_for_all"],
          _.partial(node_label_handler, false),
          true,
          "hivtrace-node-labels-off"
        ],
        [
          "Hide problematic clusters",
          function(item) {
            d3.select(item).text(
              self.hide_hxb2
                ? "Hide problematic clusters"
                : "Show problematic clusters"
            );
            self.toggle_hxb2();
          },
          self.has_hxb2_links,
          "hivtrace-hide-problematic-clusters"
        ],
        [
          __("network_tab")["highlight_unsupported_edges"],
          function(item) {
            if (self.highlight_unsuppored_edges) {
              d3.select(item)
                .selectAll(".fa-check-square")
                .remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_highlight_unsupported_edges();
          },
          true,
          "hivtrace-highlight-unsuppored_edges",
          self.highlight_unsuppored_edges
        ]
      ];

      if (self.cluster_attributes) {
        cluster_commands.push([
          "Show only changes since last network update",
          function(item) {
            if (self.showing_diff) {
              d3.select(item)
                .selectAll(".fa-check-square")
                .remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_diff();
          },
          true,
          "hivtrace-show-network-diff",
          self.showing_diff
        ]);
      }

      if (self.cluster_time_scale) {
        cluster_commands.push([
          __("network_tab")["only_recent_clusters"],
          function(item) {
            if (self.using_time_filter) {
              d3.select(item)
                .selectAll(".fa-check-square")
                .remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_time_filter();
          },
          true,
          "hivtrace-show-using-time-filter",
          self.using_time_filter
        ]);
      }

      if (!self._is_CDC_) {
        cluster_commands.push([
          "Show removed edges",
          function(item) {
            self.filter_edges = !self.filter_edges;
            d3.select(item).text(
              self.filter_edges ? "Show removed edges" : "Hide removed edges"
            );
            self.update(false);
          },
          function() {
            return _.some(self.edges, function(d) {
              return d.removed;
            });
          },
          "hivtrace-show-removed-edges"
        ]);
      } else {
        cluster_commands.push([
          "Add filtered objects to priority set",
          function(item) {
            let editor_panel = self.has_priority_set_editor();
            if (editor_panel)
              editor_panel.append_node_objects(
                _.filter(json["Nodes"], n => n.match_filter)
              );
          },
          self.has_priority_set_editor,
          "hivtrace-add-filtered-to-panel"
        ]);
      }

      cluster_commands.forEach(function(item, index) {
        let shown = item[2];
        if (_.isFunction(shown)) {
          shown = shown(item);
        }
        if (shown) {
          var handler_callback = item[1];
          var line_item = this.append("li")
            .append("a")
            .text(item[0])
            .attr("href", "#")
            //.attr("id", item[3])
            .on("click", function(e) {
              handler_callback(this);
              //d3.event.stopPropagation();
              //d3.event.preventDefault();
            });

          if (item.length > 4) {
            // checkbox
            line_item.text("");
            if (item[4]) {
              line_item
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            line_item.insert("span").text(item[0]);
          }
        }
      }, cluster_ui_container);

      var button_group = d3.select(
        self.get_ui_element_selector_by_role("button_group")
      );

      if (!button_group.empty()) {
        button_group.selectAll("button").remove();
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["expand_spacing"])
          .on("click", function(d) {
            change_spacing(5 / 4);
          })
          .append("i")
          .classed("fa fa-plus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["compress_spacing"])
          .on("click", function(d) {
            change_spacing(4 / 5);
          })
          .append("i")
          .classed("fa fa-minus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["enlarge_window"])
          .on("click", function(d) {
            change_window_size(100, true);
          })
          .append("i")
          .classed("fa fa-expand", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["shrink_window"])
          .on("click", function(d) {
            change_window_size(-100, true);
          })
          .append("i")
          .classed("fa fa-compress", true);

        if (!self._is_CDC_) {
          button_group
            .append("button")
            .classed("btn btn-default btn-sm", true)
            .attr("title", "Compute graph statistics")
            .attr("id", "hivtrace-compute-graph-statistics")
            .on("click", function(d) {
              _.bind(self.compute_graph_stats, this)();
            })
            .append("i")
            .classed("fa fa-calculator", true);
        } else {
          button_group
            .append("button")
            .classed("btn btn-default btn-sm", true)
            .attr("title", "Toggle epi-curve")
            .attr("id", "hivtrace-toggle-epi-curve")
            .on("click", function(d) {
              self._check_for_time_series();
            })
            .append("i")
            .classed("fa fa-line-chart", true);
        }

        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["save_image"])
          //.attr("id", "hivtrace-export-image")
          .on("click", function(d) {
            helpers.save_image("png", "#" + self.dom_prefix + "-network-svg");
          })
          .append("i")
          .classed("fa fa-image", true);
      }

      $(self.get_ui_element_selector_by_role("filter"))
        .off("input propertychange")
        .on(
          "input propertychange",
          _.throttle(function(e) {
            var filter_value = $(this).val();
            self.filter(self.filter_parse(filter_value));
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("hide_filter"))
        .off("change")
        .on(
          "change",
          _.throttle(function(e) {
            self.hide_unselected = !self.hide_unselected;
            self.filter_visibility();
            self.update(true);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("show_small_clusters"))
        .off("change")
        .on(
          "change",
          _.throttle(function(e) {
            if ("size" in self.cluster_filtering_functions) {
              delete self.cluster_filtering_functions["size"];
            } else {
              self.cluster_filtering_functions["size"] = self.filter_by_size;
            }

            self.update(false);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("pairwise_table_pecentage", true))
        .off("change")
        .on(
          "change",
          _.throttle(function(e) {
            self.show_percent_in_pairwise_table = !self.show_percent_in_pairwise_table;
            render_binned_table(
              "attribute_table",
              self.colorizer["category_map"],
              self.colorizer["category_pairwise"]
            );
          }, 250)
        );
    }

    if (_networkGraphAttrbuteID in json) {
      attributes = json[_networkGraphAttrbuteID];
    } else {
      if (attributes && "hivtrace" in attributes) {
        attributes = attributes["hivtrace"];
      }
    }

    // Initialize class attributes
    singletons = graph_data.Nodes.filter(function(v, i) {
      return v.cluster === null;
    }).length;

    self.nodes_by_cluster = {};

    self.nodes = graph_data.Nodes.filter(function(v, i) {
      if (
        v.cluster &&
        typeof self.exclude_cluster_ids[v.cluster] === "undefined"
      ) {
        if (v.cluster in self.nodes_by_cluster) {
          self.nodes_by_cluster[v.cluster].push(v);
        } else {
          self.nodes_by_cluster[v.cluster] = [v];
        }

        connected_links[i] = total++;
        return true;
      }
      return false;
    });

    self.edges = graph_data.Edges.filter(function(v, i) {
      return v.source in connected_links && v.target in connected_links;
    });

    self.edges = self.edges.map(function(v, i) {
      var cp_v = _.clone(v);
      cp_v.source = connected_links[v.source];
      cp_v.target = connected_links[v.target];
      cp_v.id = i;
      return cp_v;
    });

    compute_node_degrees(self.nodes, self.edges);

    default_layout(self.initial_packed);
    self.clusters.forEach(function(d, i) {
      self.cluster_mapping[d.cluster_id] = i;
      d.hxb2_linked = d.children.some(function(c) {
        return c.hxb2_linked;
      });
      _compute_cluster_degrees(d);
      d.distances = [];
    });

    try {
      if (options && options["extra_menu"]) {
        var extra_ui_container = d3.select(
          self.get_ui_element_selector_by_role("extra_operations_container")
        );

        d3.select(
          self.get_ui_element_selector_by_role("extra_operations_enclosure")
        )
          .selectAll("button")
          .text(options["extra_menu"]["title"])
          .append("span")
          .classed("caret", "true");
        //extra_ui_container
        extra_ui_container.selectAll("li").remove();

        options["extra_menu"]["items"].forEach(function(item, index) {
          //console.log (item);
          var handler_callback = item[1];
          if (_.isFunction(item[0])) {
            item[0](self, this.append("li"));
          } else {
            this.append("li")
              .append("a")
              .text(item[0])
              .attr("href", "#")
              .on("click", function(e) {
                handler_callback(self, this);
                d3.event.preventDefault();
              });
          }
        }, extra_ui_container);

        d3.select(
          self.get_ui_element_selector_by_role("extra_operations_enclosure")
        ).style("display", null);
      }
    } catch (err) {
      console.log(err);
    }

    self._aux_populate_category_menus = function() {
      if (button_bar_ui) {
        // decide if the variable can be considered categorical by examining its range

        //console.log ("self._aux_populate_category_menus");
        var valid_cats = _.filter(
          _.map(
            graph_data[_networkGraphAttrbuteID],
            self._aux_populate_category_fields
          ),
          function(d) {
            //console.log (d);
            return (
              d.discrete &&
              "value_range" in d &&
              d["value_range"].length <= _maximumValuesInCategories &&
              !d["_hidden_"]
            );
          }
        );

        var valid_shapes = _.filter(valid_cats, function(d) {
          return (
            (d.discrete && d.dimension <= 7) ||
            (d["raw_attribute_key"] in _networkPresetShapeSchemes &&
              !d["_hidden_"])
          );
        });

        // sort values alphabetically for consistent coloring

        _.each([valid_cats, valid_shapes], function(list) {
          _.each(list, self._aux_process_category_values);
        });

        let color_stops = _networkContinuousColorStops;

        try {
          color_stops =
            graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
              "color_stops"
            ] || _networkContinuousColorStops;
        } catch (err) {}

        var valid_scales = _.filter(
          _.map(graph_data[_networkGraphAttrbuteID], function(d, k) {
            function determine_scaling(d, values, scales) {
              var low_var = Infinity;

              _.each(scales, function(scl) {
                d["value_range"] = d3.extent(values);
                var bins = _.map(_.range(color_stops), function() {
                  return 0;
                });
                scl.range([0, color_stops - 1]).domain(d["value_range"]);
                _.each(values, function(v) {
                  bins[Math.floor(scl(v))]++;
                });

                var mean = values.length / color_stops;
                var vrnc = _.reduce(bins, function(p, c) {
                  return p + (c - mean) * (c - mean);
                });

                //console.log (d['value_range'], bins);

                if (vrnc < low_var) {
                  low_var = vrnc;
                  d["scale"] = scl;
                }
              });
            }

            d["raw_attribute_key"] = k;

            if (true) {
              if (d.type == "Number" || d.type == "Number-categories") {
                var values = _.filter(
                  _.map(graph_data.Nodes, function(nd) {
                    return self.attribute_node_value_by_id(
                      nd,
                      k,
                      d.type == "Number"
                    );
                  }),
                  function(v) {
                    return _.isNumber(v);
                  }
                );
                // automatically determine the scale and see what spaces the values most evenly
                determine_scaling(d, values, [
                  d3.scale.linear(),
                  d3.scale.log(),
                  d3.scale.pow().exponent(1 / 3),
                  d3.scale.pow().exponent(0.25),
                  d3.scale.pow().exponent(0.5),
                  d3.scale.pow().exponent(1 / 8),
                  d3.scale.pow().exponent(1 / 16)
                ]);
              } else {
                if (d.type == "Date") {
                  var values = _.filter(
                    _.map(graph_data.Nodes, function(nd) {
                      try {
                        var a_date = self.attribute_node_value_by_id(nd, k);
                        //console.log (k, a_date);
                        inject_attribute_node_value_by_id(
                          nd,
                          k,
                          self._parse_dates(a_date)
                        );
                      } catch (err) {
                        inject_attribute_node_value_by_id(
                          nd,
                          k,
                          _networkMissing
                        );
                      }
                      return self.attribute_node_value_by_id(nd, k);
                    }),
                    function(v) {
                      return v == _networkMissing ? null : v;
                    }
                  );
                  // automatically determine the scale and see what spaces the values most evenly
                  if (values.length == 0) {
                    // invalid scale
                    return {};
                  }

                  determine_scaling(d, values, [d3.time.scale()]);
                }
              }
            }
            return d;
          }),
          function(d) {
            return (
              (d.type == "Number" ||
                d.type == "Date" ||
                d.type == "Number-categories") &&
              !d["_hidden_"]
            );
          }
        );

        function _menu_label_gen(d) {
          return (
            (d["annotation"] ? "[" + d["annotation"] + "] " : "") + d["label"]
          );
        }

        //console.log (valid_scales);
        //valid_cats.splice (0,0, {'label' : 'None', 'index' : -1});

        [
          d3.select(self.get_ui_element_selector_by_role("attributes")),
          d3.select(
            self.get_ui_element_selector_by_role("attributes_cat", true)
          )
        ].forEach(function(m) {
          //console.log (m);

          if (m.empty()) {
            return;
          }
          m.selectAll("li").remove();

          var menu_items = [
            [
              ["None", null, _.partial(self.handle_attribute_categorical, null)]
            ],
            [["Categorical", "heading", null]]
          ].concat(
            valid_cats.map(function(d, i) {
              return [
                [
                  _menu_label_gen(d),
                  d["raw_attribute_key"],
                  _.partial(
                    self.handle_attribute_categorical,
                    d["raw_attribute_key"]
                  )
                ]
              ];
            })
          );

          if (valid_scales.length) {
            menu_items = menu_items
              .concat([[["Continuous", "heading", null]]])
              .concat(
                valid_scales.map(function(d, i) {
                  return [
                    [
                      _menu_label_gen(d),
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_attribute_continuous,
                        d["raw_attribute_key"]
                      )
                    ]
                  ];
                })
              );
          }

          var cat_menu = m.selectAll("li").data(menu_items);

          cat_menu
            .enter()
            .append("li")
            .classed("disabled", function(d) {
              return d[0][1] == "heading";
            })
            .style("font-variant", function(d) {
              return d[0][1] < -1 ? "small-caps" : "normal";
            });

          cat_menu
            .selectAll("a")
            .data(function(d) {
              return d;
            })
            .enter()
            .append("a")
            .html(function(d, i, j) {
              let htm = d[0];
              let type = "unknown";

              if (_.contains(_.keys(self.schema), d[1])) {
                type = self.schema[d[1]].type;
              }

              if (_.contains(_.keys(self.uniqs), d[1]) && type == "String") {
                htm =
                  htm +
                  '<span title="Number of unique values" class="badge pull-right">' +
                  self.uniqs[d[1]] +
                  "</span>";
              }

              return htm;
            })
            .attr("style", function(d, i, j) {
              if (d[1] == "heading") return "font-style: italic";
              if (j == 0) {
                return " font-weight: bold;";
              }
              return null;
            })
            .attr("href", "#")
            .on("click", function(d) {
              if (d[2]) {
                d[2].call();
              }
            });
        });

        [d3.select(self.get_ui_element_selector_by_role("shapes"))].forEach(
          function(m) {
            m.selectAll("li").remove();
            var cat_menu = m.selectAll("li").data(
              [
                [["None", null, _.partial(self.handle_shape_categorical, null)]]
              ].concat(
                valid_shapes.map(function(d, i) {
                  return [
                    [
                      _menu_label_gen(d),
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_shape_categorical,
                        d["raw_attribute_key"]
                      )
                    ]
                  ];
                })
              )
            );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", function(d) {
                return d[0][1] < -1 ? "small-caps" : "normal";
              });

            cat_menu
              .selectAll("a")
              .data(function(d) {
                return d;
              })
              .enter()
              .append("a")
              .html(function(d, i, j) {
                let htm = d[0];
                let type = "unknown";

                if (_.contains(_.keys(self.schema), d[1])) {
                  type = self.schema[d[1]].type;
                }

                if (_.contains(_.keys(self.uniqs), d[1]) && type == "String") {
                  htm =
                    htm +
                    '<span title="Number of unique values" class="badge pull-right">' +
                    self.uniqs[d[1]] +
                    "</span>";
                }

                return htm;
              })
              .attr("style", function(d, i, j) {
                if (j == 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", function(d) {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );

        $(self.get_ui_element_selector_by_role("opacity_invert"))
          .off("click")
          .on("click", function(e) {
            if (self.colorizer["opacity_scale"]) {
              self.colorizer["opacity_scale"].range(
                self.colorizer["opacity_scale"].range().reverse()
              );
              self.update(true);
              self.draw_attribute_labels();
            }
            $(this).toggleClass("btn-active btn-default");
          });

        $(self.get_ui_element_selector_by_role("attributes_invert"))
          .off("click")
          .on("click", function(e) {
            if (self.colorizer["category_id"]) {
              graph_data[_networkGraphAttrbuteID][
                self.colorizer["category_id"]
              ]["scale"].range(
                graph_data[_networkGraphAttrbuteID][
                  self.colorizer["category_id"]
                ]["scale"]
                  .range()
                  .reverse()
              );
              self.clusters.forEach(function(the_cluster) {
                the_cluster["gradient"] = compute_cluster_gradient(
                  the_cluster,
                  self.colorizer["category_id"]
                );
              });
              self.update(true);
              self.draw_attribute_labels();
            }
            $(this).toggleClass("btn-active btn-default");
          });

        [d3.select(self.get_ui_element_selector_by_role("opacity"))].forEach(
          function(m) {
            m.selectAll("li").remove();
            var cat_menu = m.selectAll("li").data(
              [
                [["None", null, _.partial(self.handle_attribute_opacity, null)]]
              ].concat(
                valid_scales.map(function(d, i) {
                  return [
                    [
                      d["label"],
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_attribute_opacity,
                        d["raw_attribute_key"]
                      )
                    ]
                  ];
                })
              )
            );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", function(d) {
                return d[0][1] < -1 ? "small-caps" : "normal";
              });
            cat_menu
              .selectAll("a")
              .data(function(d) {
                return d;
              })
              .enter()
              .append("a")
              .text(function(d, i, j) {
                return d[0];
              })
              .attr("style", function(d, i, j) {
                if (j == 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", function(d) {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );
      }
    };

    if (attributes) {
      /*
         map attributes into nodes and into the graph object itself using
         _networkGraphAttrbuteID as the key
      */

      if ("attribute_map" in attributes) {
        var attribute_map = attributes["attribute_map"];

        if ("map" in attribute_map && attribute_map["map"].length > 0) {
          graph_data[_networkGraphAttrbuteID] = attribute_map["map"].map(
            function(a, i) {
              return {
                label: a,
                type: null,
                values: {},
                index: i,
                range: 0
              };
            }
          );

          graph_data.Nodes.forEach(function(n) {
            n[_networkGraphAttrbuteID] = n.id.split(attribute_map["delimiter"]);
            n[_networkGraphAttrbuteID].forEach(function(v, i) {
              if (i < graph_data[_networkGraphAttrbuteID].length) {
                if (!(v in graph_data[_networkGraphAttrbuteID][i]["values"])) {
                  graph_data[_networkGraphAttrbuteID][i]["values"][v] =
                    graph_data[_networkGraphAttrbuteID][i]["range"];
                  graph_data[_networkGraphAttrbuteID][i]["range"] += 1;
                }
              }
              //graph_data [_networkGraphAttrbuteID][i]["values"][v] = 1 + (graph_data [_networkGraphAttrbuteID][i]["values"][v] ? graph_data [_networkGraphAttrbuteID][i]["values"][v] : 0);
            });
          });

          graph_data[_networkGraphAttrbuteID].forEach(function(d) {
            if (
              d["range"] < graph_data.Nodes.length &&
              d["range"] > 1 &&
              d["range"] <= 20
            ) {
              d["type"] = "category";
            }
          });
        }
      }

      _.each(self._networkPredefinedAttributeTransforms, function(
        computed,
        key
      ) {
        if (_.isFunction(computed)) {
          computed = computed(self);
        }

        if (
          !computed["depends"] ||
          _.every(computed["depends"], d =>
            _.has(graph_data[_networkGraphAttrbuteID], d)
          )
        ) {
          var extension = {};
          extension[key] = computed;
          _.extend(graph_data[_networkGraphAttrbuteID], extension);
          self.inject_attribute_description(key, computed);
          _.each(graph_data.Nodes, function(node) {
            inject_attribute_node_value_by_id(
              node,
              key,
              computed["map"](node, self)
            );
          });

          // add unique values
          self.uniqValues[key] = computed.enum;

          if (computed["overwrites"]) {
            if (
              _.has(graph_data[_networkGraphAttrbuteID], computed["overwrites"])
            ) {
              graph_data[_networkGraphAttrbuteID][computed["overwrites"]][
                "_hidden_"
              ] = true;
            }
          }
        }
      });

      self._aux_populate_category_menus();

      // populate the UI elements
    }

    if (self.cluster_sizes.length > max_points_to_render) {
      var sorted_array = self.cluster_sizes
        .map(function(d, i) {
          return [d, i + 1];
        })
        .sort(function(a, b) {
          return a[0] - b[0];
        });

      for (var k = 0; k < sorted_array.length - max_points_to_render; k++) {
        self.exclude_cluster_ids[sorted_array[k][1]] = 1;
      }

      self.warning_string +=
        (self.warning_string.length ? "<br>" : "") +
        "Excluded " +
        (sorted_array.length - max_points_to_render) +
        " clusters (maximum size " +
        sorted_array[k - 1][0] +
        " nodes) because only " +
        max_points_to_render +
        " objects can be shown at once.";
    }

    self.edges.forEach(function(e, i) {
      self.clusters[
        self.cluster_mapping[self.nodes[e.target].cluster]
      ].distances.push(e.length);
    });

    self.clusters.forEach(function(d, i) {
      d.distances = helpers.describe_vector(d.distances);
    });
    //self.clusters

    self.update();
  }

  function sort_table_toggle_icon(element, value) {
    //console.log (value);
    if (value) {
      $(element).data("sorted", value);
      d3.select(element)
        .selectAll("i")
        .classed("fa-sort-amount-desc", value == "desc")
        .classed("fa-sort-amount-asc", value == "asc")
        .classed("fa-sort", value == "unsorted");
    } else {
      var sorted_state = $(element).data("sorted");
      sort_table_toggle_icon(element, sorted_state == "asc" ? "desc" : "asc");
      return sorted_state == "asc" ? d3.descending : d3.ascending;
    }
  }

  /** element is the sortable clicker **/

  function filter_table_by_column_handler(datum, conditions) {
    if (conditions.length) {
      return _.some(conditions, c => {
        if (c.type == "re") {
          return c.value.test(datum);
        } else if (c.type == "date") {
          return datum >= c.value[0] && datum <= c.value[1];
        } else if (c.type == "distance") {
          if (c.greater_than) return datum > c.value;

          return datum <= c.value;
        }
        return false;
      });
    }

    return true;
  }

  function filter_table(element) {
    if (d3.event) {
      d3.event.preventDefault();
    }

    var table_element = $(element).closest("table");

    if (table_element.length) {
      // construct compound filters over all columns

      var filter_array = [];
      var filter_handlers = [];

      d3.select(table_element[0])
        .selectAll("thead th")
        .each(function(d, i) {
          if (d.filter) {
            if (_.isString(d.filter_term) && d.filter_term.length) {
              filter_array[d.column_id] = self.filter_parse(d.filter_term);
              filter_handlers[d.column_id] = _.isFunction(d.filter)
                ? d.filter
                : filter_table_by_column_handler;
            } else {
              filter_array[d.column_id] = null;
              filter_handlers[d.column_id] = null;
            }
          }
        });

      var shown_rows = 0;

      d3.select(table_element[0])
        .select("tbody")
        .selectAll("tr")
        .each(function(d, r) {
          var this_row = d3.select(this);
          var hide_me = false;

          this_row.selectAll("td").each(function(d, i) {
            if (!hide_me) {
              if (filter_array[i]) {
                if (
                  !filter_handlers[i](table_get_cell_value(d), filter_array[i])
                ) {
                  hide_me = true;
                }
              }
            }
          });

          if (hide_me) {
            this_row.style("display", "none");
          } else {
            shown_rows += 1;
            this_row.style("display", null);
          }
        });
      d3.select(table_element[0])
        .select("caption")
        .select(self.get_ui_element_selector_by_role("table-count-shown", true))
        .text(shown_rows);

      /*.selectAll("td").each (function (d, i) {
            if (i == filter_on) {
                var this_cell = d3.select (this);
                d3.select (this).style ("display", filter_handler ())
            }
        });*/

      // select all other elements from thead and toggle their icons

      /*$(table_element)
        .find("thead [data-column-id]")
        .filter(function() {
          return parseInt($(this).data("column-id")) != sort_on;
        })
        .each(function() {
          sort_table_toggle_icon(this, "unsorted");
        });*/
    }
  }

  /** element is the sortable clicker **/
  function sort_table_by_column(element, datum) {
    if (d3.event) {
      d3.event.preventDefault();
    }
    var table_element = $(element).closest("table");
    if (table_element.length) {
      var sort_on = parseInt($(element).data("column-id"));
      var sort_key = datum.sort;

      var sorted_state = $(element).data("sorted");
      var sorted_function = sort_table_toggle_icon(element);

      var sort_accessor;

      if (sort_key) {
        if (_.isFunction(sort_key)) {
          sort_accessor = function(x) {
            return sort_key(x);
          };
        } else {
          sort_accessor = function(x) {
            var val = x[sort_key];
            if (_.isFunction(val)) return val();
            return val;
          };
        }
      } else {
        sort_accessor = function(x) {
          return x;
        };
      }

      d3.select(table_element[0])
        .select("tbody")
        .selectAll("tr")
        .sort(function(a, b) {
          return sorted_function(
            sort_accessor(a[sort_on]),
            sort_accessor(b[sort_on])
          );
        });

      // select all other elements from thead and toggle their icons

      $(table_element)
        .find("thead [data-column-id]")
        .filter(function() {
          return parseInt($(this).data("column-id")) != sort_on;
        })
        .each(function() {
          sort_table_toggle_icon(this, "unsorted");
        });
    }
  }

  function table_get_cell_value(data) {
    return _.isFunction(data.value) ? data.value() : data.value;
  }

  function format_a_cell(data, index, item) {
    var this_sel = d3.select(item);
    var current_value = table_get_cell_value(data);
    var handle_sort = this_sel;

    handle_sort.selectAll("*").remove();

    if ("callback" in data) {
      handle_sort = data.callback(item, current_value);
    } else {
      var repr = "format" in data ? data.format(current_value) : current_value;
      if ("html" in data && data.html) this_sel.html(repr);
      else this_sel.text(repr);
    }

    if ("filter" in data) {
      data.filter_term = "";
      data.column_id = index;

      if (data.value == _networkNodeIDField) {
        // this is an ugly hardcode.
        let pse = self.has_priority_set_editor();
        if (pse) {
          //console.log ("Here");
          var add_to_ps = handle_sort.append("a").property("href", "#");
          add_to_ps
            .append("i")
            .classed("fa fa-plus", true)
            .style("margin-left", "0.2em");

          add_to_ps.on("click", function(d) {
            let node_ids = [];
            self.node_table.selectAll("tr").each(function(d, i) {
              let this_row = d3.select(this);
              if (this_row.style("display") != "none") {
                this_row.selectAll("td").each(function(d, j) {
                  if (j == data.column_id) {
                    let has_marker = d.value.indexOf(_networkNewNodeMarker);
                    if (has_marker > 0) {
                      node_ids.push(d.value.substring(0, has_marker));
                    } else {
                      node_ids.push(d.value);
                    }
                  }
                });
              }
            });
            pse.append_nodes(node_ids);
          });
        }
      }

      var clicker = handle_sort.append("a").property("href", "#");

      clicker
        .append("i")
        .classed("fa fa-search", true)
        .style("margin-left", "0.2em");

      var search_form_generator = function() {
        return (
          '<form class="form-inline"> \
                        <div class="form-group"> \
                            <div class="input-group">\
                            <input type="text" class="form-control input-sm" data-hivtrace-ui-role = "table-filter-term" placeholder="Filter On" style = "min-width: 100px">\
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-reset"><i class="fa fa-times-circle"></i></a> </div>\
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-apply"><i class="fa fa-filter"></i></a> </div> \
                            <div class="input-group-addon">\
                                <i class="fa fa-question" data-toggle="collapse" data-target="#filter-help-column' +
          index +
          '"  aria-expanded="false" aria-controls="collapseExample"></i>\
                            </div> \
                        </div>\
                        </div>\
                    </form>\
                    <div class="collapse" id="filter-help-column' +
          index +
          '">\
                      <div class="well">\
                        Type in text to select columns which \
                        <em>contain the term</em>. <br />\
                        For example, typing in <code>MSM</code> will select rows\
                        that have "MSM" as a part of the column value.\
                        <p />\
                        Type in space separated terms (<code>MSM IDU</code>) to\
                        search for <b>either</b> term. <p/>\
                        Type in terms in quotes (<code>"male"</code>) to search\
                        for this <b>exact</b> term. <p/>\
                        If columns have date information you can use\
                        <code>YYYYMMDD:YYYYMMDD</code> to search for date ranges.<p/>\
                        Use <code>&lt;value</code> or <code>&gt;value</code>\
                        to search numerical columns<p/>\
                      </div>\
                    </div>\
                    '
        );
      };

      var search_popover = $(clicker.node())
        .popover({
          html: true,
          sanitize: false,
          content: search_form_generator,
          placement: "bottom"
        })
        .on("shown.bs.popover", function(e) {
          var search_icon = d3.select(this);

          const update_term = function(v) {
            data.filter_term = v;
            search_icon
              .selectAll("i")
              .classed("fa-search", !v.length)
              .classed("fa-search-plus", v.length);
          };

          var popover_div = d3.select(
            "#" + d3.select(this).attr("aria-describedby")
          );
          var search_click = popover_div.selectAll(
            self.get_ui_element_selector_by_role("table-filter-apply", true)
          );
          var reset_click = popover_div.selectAll(
            self.get_ui_element_selector_by_role("table-filter-reset", true)
          );
          var search_box = popover_div.selectAll(
            self.get_ui_element_selector_by_role("table-filter-term", true)
          );

          search_box.property("value", data.filter_term);

          search_click.on("click", function(d) {
            update_term(search_box.property("value"));
            filter_table(clicker.node());
          });

          reset_click.on("click", function(d) {
            search_box.property("value", "");
            update_term("");
            filter_table(clicker.node());
          });
        });
    }

    if (handle_sort && "sort" in data) {
      var clicker = handle_sort
        .append("a")
        .property("href", "#")
        .on("click", function(d) {
          sort_table_by_column(this, d);
        })
        .attr("data-sorted", "unsorted")
        .attr("data-column-id", index);
      clicker
        .append("i")
        .classed("fa fa-sort", true)
        .style("margin-left", "0.2em");

      if ("presort" in data) {
        if (data["presort"] == "desc") {
          clicker.attr("data-sorted", "asc");
        }
        sort_table_by_column(clicker.node(), data);
      }
    }

    if ("actions" in data) {
      let by_group = data.actions;

      if (!(_.isArray(data.actions) && _.isArray(data.actions[0]))) {
        by_group = [data.actions];
      }

      _.each(by_group, bgrp => {
        let button_group = handle_sort
          .append("div")
          .classed("btn-group btn-group-xs", true)
          .attr("style", "padding-left:0.5em");
        _.each(
          _.isFunction(bgrp) ? bgrp(button_group, current_value) : bgrp,
          b => {
            if (_.isFunction(b)) {
              b = b(button_group, current_value);
            }
            if (b) {
              let this_button = null;
              if (_.isArray(b.dropdown)) {
                let button_group_dropdown = button_group
                  .append("div")
                  .classed("btn-group btn-group-xs", true);

                this_button = button_group_dropdown
                  .append("button")
                  .classed("btn btn-default btn-xs dropdown-toggle", true)
                  .attr("data-toggle", "dropdown");

                var dropdown_list = button_group_dropdown
                  .append("ul")
                  .classed("dropdown-menu", true);
                //.attr("aria-labelledby", menu_id);

                let is_option_array = _.isObject(b.dropdown[0]);
                let items = b.dropdown;

                function get_item_text(item) {
                  if (_.has(item, "label")) {
                    return item["label"];
                  }
                  return item;
                }

                dropdown_list = dropdown_list.selectAll("li").data(items);
                dropdown_list.enter().append("li");
                dropdown_list.each(function(data, i) {
                  var handle_change = d3
                    .select(this)
                    .append("a")
                    .attr("href", "#")
                    .text(function(data) {
                      return get_item_text(data);
                    });
                  if (_.has(data, "data") && data["data"]) {
                    //let element = $(this_button.node());
                    _.each(data.data, (v, k) => {
                      handle_change.attr("data-" + k, v);
                    });
                  }
                  handle_change.on("click", function(d) {
                    if (_.has(d, "action") && d["action"]) {
                      d["action"](this_button, d["label"]);
                    } else {
                      if (b.action) b.action(this_button, get_item_text(d));
                    }
                  });
                });
              } else {
                this_button = button_group
                  .append("button")
                  .classed("btn btn-default btn-xs", true);
                if (b.action)
                  this_button.on("click", function(e) {
                    d3.event.preventDefault();
                    b.action(this_button, current_value);
                  });
              }
              if (b.icon) {
                this_button.append("i").classed("fa " + b.icon, true);
              } else {
                this_button.text(b.text).style("font-size", "8px");
              }

              if (b.data) {
                //let element = $(this_button.node());
                _.each(b.data, (v, k) => {
                  this_button.attr("data-" + k, v);
                });
              }

              if (b.classed) {
                _.each(b.classed, (v, k) => {
                  this_button.classed(k, v);
                });
              }

              if (b.help) {
                this_button.attr("title", b.help);
              }
            }
          }
        );
      });
    }

    if ("help" in data) {
      this_sel.attr("title", data.help);
    }
  }

  function add_a_sortable_table(
    container,
    headers,
    content,
    overwrite,
    caption
  ) {
    if (!container || !container.node()) {
      return;
    }

    var thead = container.selectAll("thead");
    var tbody = container.selectAll("tbody");

    if (tbody.empty() || overwrite) {
      tbody.remove();
      tbody = d3.select(document.createElement("tbody"));
      tbody
        .selectAll("tr")
        .data(content)
        .enter()
        .append("tr")
        .selectAll("td")
        .data(function(d) {
          return d;
        })
        .enter()
        .append("td")
        .call(function(selection) {
          return selection.each(function(d, i) {
            //handle_cluster_click;
            format_a_cell(d, i, this);
          });
        });
      container.node().appendChild(tbody.node());
    }

    // head AFTER rows, so we can handle pre-sorting
    if (thead.empty() || overwrite) {
      thead.remove();
      thead = container.insert("thead", ":first-child");
      thead
        .selectAll("tr")
        .data(headers)
        .enter()
        .append("tr")
        .selectAll("th")
        .data(function(d) {
          return d;
        })
        .enter()
        .append("th")
        .call(function(selection) {
          return selection.each(function(d, i) {
            format_a_cell(d, i, this);
          });
        });
    }
    //'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network nodes');

    if (caption) {
      var table_caption = container.selectAll("caption").data([caption]);
      table_caption.enter().insert("caption", ":first-child");
      table_caption.html(function(d) {
        return d;
      });
      table_caption
        .select(self.get_ui_element_selector_by_role("table-count-total", true))
        .text(content.length);
      table_caption
        .select(self.get_ui_element_selector_by_role("table-count-shown", true))
        .text(content.length);
    }
  }

  function _cluster_table_draw_id(element, payload) {
    var this_cell = d3.select(element);
    this_cell.selectAll("*").remove();
    var _is_subcluster = payload[1];
    var cluster_id = payload[0];

    if (_is_subcluster) {
      //console.log (payload);

      //this_cell.append("i")
      //      .classed("fa fa-arrow-circle-o-right", true).style("padding-right", "0.25em");

      /*if (payload[2].rr_count) {
        this_cell
          .append("i")
          .classed("fa fa-exclamation-triangle", true)
          .attr("title", "Subcluster has recent/rapid nodes");
      }*/
      this_cell
        .append("span")
        .text(cluster_id)
        .style("padding-right", "0.5em");

      this_cell
        .append("button")
        .classed("btn btn-sm pull-right", true)
        //.text(__("clusters_tab")["view"])
        .on("click", function(e) {
          self.view_subcluster(payload[2]);
        })
        .append("i")
        .classed("fa fa-eye", true)
        .attr("title", __("clusters_tab")["view"]);
    } else {
      this_cell
        .append("span")
        .text(cluster_id)
        .style("padding-right", "0.5em");
      this_cell
        .append("button")
        .classed("btn btn-sm pull-right", true)
        .style("margin-right", "0.25em")
        .on("click", function(e) {
          self.open_exclusive_tab_view(cluster_id);
        })
        .append("i")
        .classed("fa fa-eye", true)
        .attr("title", __("clusters_tab")["view"]);
    }
    this_cell
      .append("button")
      .classed("btn btn-sm pull-right", true)
      .style("margin-right", "0.25em")
      //.text(__("clusters_tab")["list"])
      .attr("data-toggle", "modal")
      .attr(
        "data-target",
        self.get_ui_element_selector_by_role("cluster_list", true)
      )
      .attr("data-cluster", cluster_id)
      .append("i")
      .classed("fa fa-list", true)
      .attr("title", __("clusters_tab")["list"]);
  }

  function _cluster_table_draw_buttons(element, payload) {
    var this_cell = d3.select(element);
    const label_diff = function(c_info) {
      const d = c_info["delta"];
      const moved = c_info["moved"];
      const deleted = c_info["deleted"];
      const new_count = c_info["new_nodes"] ? c_info["new_nodes"] : 0;

      /*if (moved) {
            if (d > 0) {
                return "" + moved + " nodes moved +" + d + " new";
            } else {
                if (d == 0) {
                    return "" + moved + " nodes moved";
                } else {
                    return "" + moved + " nodes moved " + (-d) + " removed";
                }
            }

        } else {
            if (d > 0) {
                return "+" + d + " nodes";
            } else {
                if (d == 0) {
                    return "no size change";
                } else {
                    return "" + (-d) + " nodes removed";
                }
            }
        }*/

      var label_str = "";
      if (moved) label_str = " " + moved + " moved ";
      if (new_count) label_str += "+" + new_count + " new ";
      if (deleted) label_str += "-" + deleted + " previous ";
      return label_str;
    };

    var labels = [];

    if (payload[4]) {
      if (payload[4]["type"] == "new") {
        if (payload[4]["moved"]) {
          labels.push(["renamed " + label_diff(payload[4]), 2]);
        } else {
          labels.push(["new", 3]);
        }
      } else {
        if (payload[4]["type"] == "extended") {
          labels.push([label_diff(payload[4]), payload["4"]["flag"]]);
        } else {
          if (payload[4]["type"] == "merged") {
            labels.push([
              "Merged " +
                payload[4]["old_clusters"].join(", ") +
                " " +
                label_diff(payload[4]),
              payload["4"]["flag"]
            ]);
          }
        }
      }
    }

    labels.push([
      [
        payload[0]
          ? __("clusters_tab")["expand"]
          : __("clusters_tab")["collapse"],
        payload[0] ? "fa-expand" : "fa-compress"
      ],
      0
    ]);
    if (payload[1]) {
      labels.push([["problematic", "fa-exclamation-circle"], 1]);
    }
    if (payload[2]) {
      labels.push([["match", "fa-check-square"], 1]);
    }
    var buttons = this_cell.selectAll("button").data(labels);
    buttons.enter().append("button");
    buttons.exit().remove();
    buttons
      .classed("btn btn-xs", true)
      .classed("btn-default", function(d) {
        return d[1] != 1 && d[1] != 2;
      })
      .classed("btn-danger", function(d) {
        return d[1] == 2;
      })
      .classed("btn-success", function(d) {
        return d[1] == 3;
      })
      /*.text(function(d) {
        return d[0];
      })*/
      .style("margin-right", "0.25em")
      .attr("disabled", function(d) {
        return d[1] == 1 ? "disabled" : null;
      })
      .on("click", function(d) {
        if (d[1] == 0) {
          if (payload[0]) {
            expand_cluster(self.clusters[payload[3] - 1], true);
          } else {
            collapse_cluster(self.clusters[payload[3] - 1]);
          }
          self.update_volatile_elements(self.cluster_table);
          if (self.subcluster_table) {
            self.update_volatile_elements(self.subcluster_table);
          }
        } else {
          if (d[1] == 2 || d[1] == 3) {
            //_social_view_options (labeled_links, shown_types),

            var shown_types = { Existing: 1, "Newly added": 1 },
              link_class = ["Existing", "Newly added"];

            self
              .open_exclusive_tab_view(
                payload[3],
                null,
                cluster_id => "Cluster " + cluster_id + " [changes view]",
                self._social_view_options(link_class, shown_types, e => {
                  return e.attributes.indexOf("added-to-prior") >= 0
                    ? "Newly added"
                    : "Existing";
                })
              )
              .handle_attribute_categorical("_newly_added");
          }
        }
      });
    buttons.each(function(d, i) {
      var this_e = d3.select(this);
      if (_.isString(d[0])) {
        this_e.selectAll("i").remove();
        this_e.text(d[0]);
      } else {
        var i_span = this_e.selectAll("i").data([d[0]]);
        i_span.enter().append("i");
        i_span
          .attr(
            "class",
            function(d) {
              return "fa " + d[1];
            },
            true
          )
          .attr("title", function(d) {
            return d[0];
          });
      }
    });
  }

  function _extract_single_cluster(
    nodes,
    filter,
    no_clone,
    given_json,
    include_extra_edges
  ) {
    /**
        Extract the nodes and edges between them into a separate objects
        @param nodes [array]  the list of nodes to extract
        @param filter [function, optional] (edge) -> bool filtering function for deciding which edges will be used to define clusters
        @param no_clone [bool] if set to T, node objects are not shallow cloned in the return object

        @return [dict] the object representing "Nodes" and "Edges" in the extracted cluster

    */

    var cluster_json = {};
    var map_to_id = {};

    cluster_json.Nodes = _.map(nodes, function(c, i) {
      map_to_id[c.id] = i;

      if (no_clone) {
        return c;
      }
      var cc = _.clone(c);
      cc.cluster = 1;
      return cc;
    });

    given_json = given_json || json;

    cluster_json.Edges = _.filter(given_json.Edges, function(e) {
      if (_.isUndefined(e.source) || _.isUndefined(e.target)) {
        return false;
      }

      return (
        given_json.Nodes[e.source].id in map_to_id &&
        given_json.Nodes[e.target].id in map_to_id &&
        (include_extra_edges || !self.is_edge_injected(e))
      );
    });

    if (filter) {
      cluster_json.Edges = _.filter(cluster_json.Edges, filter);
    }

    cluster_json.Edges = _.map(cluster_json.Edges, function(e) {
      var ne = _.clone(e);
      ne.source = map_to_id[given_json.Nodes[e.source].id];
      ne.target = map_to_id[given_json.Nodes[e.target].id];
      return ne;
    });

    return cluster_json;
  }

  function _node_table_draw_buttons(element, payload) {
    var this_cell = d3.select(element);
    var labels = [
      payload.length == 1
        ? _.isString(payload[0])
          ? [payload[0], 1, "btn-warning"]
          : ["can't be shown", 1]
        : [payload[0] ? "hide" : "show", 0]
    ];

    if (payload.length == 2 && payload[1] >= 1) {
      labels.push([
        "view cluster",
        function() {
          self.open_exclusive_tab_view(payload[1]);
        }
      ]);
    }

    var buttons = this_cell.selectAll("button").data(labels);
    buttons.enter().append("button");
    buttons.exit().remove();
    buttons
      .classed("btn btn-xs btn-node-property", true)
      .classed("btn-primary", true)
      //.classed(function (d) {return d.length >=3 ? d[2] : "";}, function (d) {return d.length >= 3;})
      .text(function(d) {
        return d[0];
      })
      .attr("disabled", function(d) {
        return d[1] && !_.isFunction(d[1]) ? "disabled" : null;
      })
      .on("click", function(d) {
        if (_.isFunction(d[1])) {
          d[1].call(d);
        } else {
          if (d[1] == 0) {
            if (payload[0]) {
              collapse_cluster(self.clusters[payload[3] - 1], true);
            } else {
              expand_cluster(self.clusters[payload[3] - 1]);
            }
            //format_a_cell(d3.select(element).datum(), null, element);
            self.update_volatile_elements(self.node_table);
          }
        }
      });
    buttons.each(function(d, e) {
      if (d.length >= 3) {
        d3.select(this)
          .classed("btn-primary", false)
          .classed(d[2], true);
      }
    });
  }

  /*self.process_table_volatile_event = function (e) {
    console.log (e);
    e.detail
      .selectAll("td")
      .filter(function(d) {
        return "volatile" in d;
      })
      .each(function(d, i) {
        format_a_cell(d, i, this);
      });
  };*/

  self.update_volatile_elements = function(container) {
    //var event = new CustomEvent('hiv-trace-viz-volatile-update', { detail: container });
    //container.node().dispatchEvent (event);

    container
      .selectAll("td, th")
      .filter(function(d) {
        return "volatile" in d;
      })
      .each(function(d, i) {
        format_a_cell(d, i, this);
      });
  };

  self.redraw_tables = function() {
    self.update_volatile_elements(self.cluster_table);
    if (self.subcluster_table) {
      self.update_volatile_elements(self.subcluster_table);
    }
    self.update_volatile_elements(self.node_table);
    if (self.priority_set_table) {
      self.update_volatile_elements(self.priority_set_table);
    }
  };

  self.draw_extended_node_table = function(
    node_list,
    container,
    extra_columns
  ) {
    container = container || self.node_table;

    if (container) {
      node_list = node_list || self.nodes;
      var column_ids = self._extract_exportable_attributes(true);

      self.displayed_node_subset = _.filter(
        _.map(self.displayed_node_subset, function(n, i) {
          if (_.isString(n)) {
            n = _.find(column_ids, function(cd) {
              return cd.raw_attribute_key == n;
            });

            if (n) {
              return n;
            }
            return column_ids[i];
          }
          return n;
        }),
        c => c
      );

      var node_data = self._extract_attributes_for_nodes(
        node_list,
        self.displayed_node_subset
      );
      node_data.splice(0, 1);
      var table_headers = _.map(self.displayed_node_subset, function(
        n,
        col_id
      ) {
        return {
          value: n.raw_attribute_key,
          sort: "value",
          filter: true,
          volatile: true,
          help: "label" in n ? n.label : n.raw_attribute_key,
          //format: (d) => "label" in d ? d.label : d.raw_attribute_key,
          callback: function(element, payload) {
            var dropdown = d3
              .select(element)
              .append("div")
              .classed("dropdown", true);
            var menu_id = "hivtrace_node_column_" + payload;
            var dropdown_button = dropdown
              .append("button")
              .classed({
                btn: true,
                "btn-default": true,
                "btn-xs": true,
                "dropdown-toggle": true
              })
              .attr("type", "button")
              .attr("data-toggle", "dropdown")
              .attr("aria-haspopup", "true")
              .attr("aria-expanded", "false")
              .attr("id", menu_id);

            dropdown_button.text(payload);

            dropdown_button.append("i").classed({
              fa: true,
              "fa-caret-down": true,
              "fa-lg": true
            });
            var dropdown_list = dropdown
              .append("ul")
              .classed("dropdown-menu", true)
              .attr("aria-labelledby", menu_id);

            dropdown_list = dropdown_list.selectAll("li").data(
              _.filter(column_ids, function(alt) {
                return alt.raw_attribute_key != n.raw_attribute_key;
              })
            );
            dropdown_list.enter().append("li");
            dropdown_list.each(function(data, i) {
              var handle_change = d3
                .select(this)
                .append("a")
                .attr("href", "#")
                .text(function(data) {
                  return data.raw_attribute_key;
                });
              handle_change.on("click", function(d) {
                self.displayed_node_subset[col_id] = d;
                self.draw_extended_node_table(
                  node_list,
                  container,
                  extra_columns
                );
              });
            });
            return dropdown;
          }
        };
      });

      if (extra_columns) {
        _.each(extra_columns, function(d) {
          if (d.prepend) {
            table_headers.splice(0, 0, d.description);
          } else {
            table_headers.push(d.description);
          }
        });
      }
      //console.log (self.displayed_node_subset);

      var table_rows = node_data.map(function(n, i) {
        var this_row = _.map(n, function(cell, c) {
          let cell_definition = null;

          if (self.displayed_node_subset[c].type == "Date") {
            cell_definition = {
              value: cell,
              format: function(v) {
                if (v == _networkMissing) {
                  return v;
                }
                return _defaultDateViewFormatSlider(v);
              }
            };
          } else {
            if (self.displayed_node_subset[c].type == "Number") {
              cell_definition = { value: cell, format: d3.format(".2f") };
            }
          }
          if (!cell_definition) {
            cell_definition = { value: cell };
          }

          // this makes the table rendering too slow

          /*if (c == 0 && self._is_CDC_) {
             cell_definition.volatile = true;
             cell_definition.actions = function (item, value) {
              if (!self.priority_set_editor) {
                    return null;
              } else {
                    return [
                        {
                            "icon"   : "fa-plus-square",
                            "action" : function (button,v) {
                                if (self.priority_set_editor) {
                                    self.priority_set_editor.append_node_objects (d.children);
                                }
                                return false;
                            },
                            "help"   : "Add to priority set"
                        }
                    ];
                }
            };
          }*/

          return cell_definition;
        });

        if (extra_columns) {
          _.each(extra_columns, function(ed) {
            if (ed.prepend) {
              this_row.splice(0, 0, ed.generator(node_list[i], self));
            } else {
              this_row.push(ed.generator(node_list[i], self));
            }
          });
        }

        return this_row;
      });

      self.draw_node_table(
        null,
        null,
        [table_headers],
        table_rows,
        container,
        'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network nodes'
      );
    }
  };

  self.draw_priority_set_table = function(container, priority_groups) {
    container = container || self.priority_set_table;
    if (container) {
      priority_groups = priority_groups || self.defined_priority_groups;
      self.priority_groups_compute_node_membership();
      var headers = [
        [
          {
            value: "Name",
            sort: "value",
            filter: true,
            help: "Priority set name"
          },
          {
            value: "Modified/created",
            sort: function(c) {
              return c.value[0];
            },
            help: "When was the priority last modified"
          },
          {
            value: "Method",
            sort: function(c) {
              return c.value;
            },
            help: "Method of cluster identification"
          },
          {
            value: "Size",
            sort: function(c) {
              c = c.value;
              if (c) {
                return c[0];
              }
              return 0;
            },
            help: "Number of nodes in the priority set"
          },
          {
            value: "Connected @1.5%",
            sort: function(c) {
              c = c.value;
              if (c) {
                return c["new_direct"].length + c["new_indirect"].length;
              }
              return 0;
            },
            help:
              "Number of nodes connected to the nodes in the priority set: direct and indirect"
          },
          {
            value:
              "Connected @" +
              _defaultPercentFormatShort(self.subcluster_threshold),
            sort: function(c) {
              c = c.value;
              if (c) {
                return c["new_direct"].length + c["new_indirect"].length;
              }
              return 0;
            },
            presort: "desc",
            help:
              "Number of nodes connected to the nodes in the priority set: direct and indirect"
          }

          /*,
            {
              value: "Cluster",
              sort: "value",
              help: "Which cluster does the node belong to"
            }*/
        ]
      ];

      var edit_form_generator = function() {
        return '<form class="form"> \
                        <div class="form-group"> \
                            <div class="input-group">\
                            <textarea class="form-control input-sm" data-hivtrace-ui-role = "priority-description-form" cols = "40" rows = "3"></textarea>\
                            </div>\
                        </div>\
                        <button data-hivtrace-ui-role = "priority-description-dismiss" class = "btn btn-sm btn-default">Dismiss</button>\
                        <button data-hivtrace-ui-role = "priority-description-save" class = "btn btn-sm btn-default">Save</button>\
                    </form>';
      };

      var rows = [];
      _.each(priority_groups, function(pg) {
        var this_row = [
          {
            value: pg.name,
            help:
              pg.description +
              (pg.pending ? " (new, pending confirmation)" : "") +
              (pg.expanded
                ? " (" + pg.expanded + " new nodes; pending confirmation)"
                : ""),
            volatile: true,
            format: value =>
              pg.pending || pg.expanded
                ? "<span style = 'color: " +
                  (pg.expanded ? "orange " : "darkred") +
                  "; font-weight: 900;'>" +
                  value +
                  "</span>"
                : value,
            html: true,
            actions: []
          },
          {
            value: [pg.modified, pg.created],
            format: function(value) {
              let vs = _.map(value, v => _defaultDateViewFormat(v));

              if (vs[0] != vs[1]) {
                return vs[0] + " / " + vs[1];
              }
              return vs[0];
            }
          },
          {
            value: pg.kind,
            format: function(v) {
              if (v) {
                return (
                  "<abbr title = '" + v + "'>" + v.split(" ")[0] + "</abbr>"
                );
              }
              return "N/A";
            },
            html: true
          },
          {
            value: [
              pg.node_objects.length,
              _.filter(pg.nodes, g => self.priority_groups_is_new_node(pg, g))
                .length
            ],
            format: function(v) {
              //console.log (pg);
              if (v) {
                return (
                  "" +
                  v[0] +
                  (v[1]
                    ? ' <span title="Number of nodes added since the last network update" class="label label-default">' +
                      v[1] +
                      " new</span>"
                    : "")
                );
              }
              return "N/A";
            },
            html: true
          }
        ];
        _.each([0, 1], index => {
          this_row.push({
            //html: false,
            value: pg.partitioned_nodes[index],
            format: function(value) {
              let desc =
                "" +
                value["new_direct"].length +
                " direct, " +
                value["new_indirect"].length +
                " indirect";
              return desc;
            },
            volatile: true,
            actions: _.map(["new_direct", "new_indirect"], d => {
              let f = function(button_group, value) {
                if (self.priority_set_editor) {
                  return {
                    icon: "fa-plus",
                    help: "Add " + d + " nodes to new priority set",
                    action: function(button, value) {
                      self.priority_set_editor.append_node_objects(value[d]);
                    }
                  };
                }
                return null;
              };
              return f;
            })
          });
        });

        if (pg.pending || pg.expanded) {
          // pending user review
          this_row[0].actions = [
            {
              icon: "fa-eye",
              help: "Review and save this priority set",
              action: function(button, value) {
                let nodeset = self.priority_groups_find_by_name(value);
                if (nodeset) {
                  if (self.priority_set_editor) {
                    alert(
                      "Cannot confirm a priority set while an editor window is open"
                    );
                  } else {
                    self.open_priority_set_editor(
                      nodeset.node_objects,
                      nodeset.name,
                      nodeset.description,
                      nodeset.kind,
                      null,
                      "validate",
                      nodeset
                    );
                  }
                }
              }
            }
          ];
        } else {
          function _action_drop_down() {
            let dropdown = _.flatten(
              [
                _.map([self.subcluster_threshold, 0.015], threshold => {
                  return {
                    label:
                      "View this priority set at link distance of " +
                      _defaultPercentFormatShort(threshold),
                    action: function(button, value) {
                      self.priority_set_view(pg, {
                        timestamp: pg.modified,
                        "priority-edge-length": threshold,
                        title: pg.name + " @" + _defaultPercentFormat(threshold)
                      });
                    }
                  };
                })
              ],
              true
            );

            if (!self._is_CDC_executive_mode) {
              dropdown.push({
                label: "Clone this priority set in a new editor pane",
                action: function(button, value) {
                  let ref_set = self.priority_groups_find_by_name(pg.name);
                  let copied_node_objects = _.clone(ref_set.node_objects);
                  self.priority_set_inject_node_attibutes(
                    copied_node_objects,
                    pg.nodes
                  );
                  self.open_priority_set_editor(
                    copied_node_objects,
                    "Clone of " + pg.name,
                    ref_set.description,
                    ref_set.kind
                  );
                  self.redraw_tables();
                }
              });
              dropdown.push({
                label: "Delete this priority node set",
                action: function(button, value) {
                  if (confirm("This action cannon be undone. Proceed?")) {
                    self.priority_groups_remove_set(pg.name, true);
                  }
                }
              });
              dropdown.push({
                label: "View nodes in this priority set",
                data: {
                  toggle: "modal",
                  target: self.get_ui_element_selector_by_role(
                    "cluster_list",
                    true
                  ),
                  priority_set: pg.name
                }
              });
            }
            dropdown.push({
              label: "Add nodes to this priority set",
              action: function(button, value) {
                let ref_set = self.priority_groups_find_by_name(pg.name);

                if (ref_set) {
                  if (ref_set.modified.getTime() > self.today.getTime()) {
                    alert(
                      "Cannot alter priority sets modified after the date at which this network was created"
                    );
                  } else {
                    self.open_priority_set_editor(
                      ref_set.node_objects,
                      ref_set.name,
                      ref_set.description,
                      ref_set.kind,
                      null,
                      "update",
                      ref_set
                    );
                  }
                }
              }
            });

            return dropdown;
          }

          this_row[0].actions = [_.clone(this_row[0].actions)];
          this_row[0].actions[this_row[0].actions.length - 1].splice(
            -1,
            0,
            {
              icon: "fa-info-circle",
              help: "View/edit this priority set",
              dropdown: _action_drop_down()
              /*action: function (button, menu_value) {
                  console.log (menu_value);
              }*/
            },
            {
              icon: "fa-edit",
              classed: { "btn-info": true },
              help: "Edit description",
              action: function(this_button, cv) {
                this_button = $(this_button.node());
                if (this_button.data("popover_shown") != "shown") {
                  let popover = this_button
                    .popover({
                      sanitize: false,
                      placement: "right",
                      container: "body",
                      html: true,
                      content: edit_form_generator,
                      trigger: "manual"
                    })
                    .on("shown.bs.popover", function(e) {
                      var clicked_object = d3.select(this);
                      var popover_div = d3.select(
                        "#" + clicked_object.attr("aria-describedby")
                      );
                      var textarea_element = popover_div.selectAll(
                        self.get_ui_element_selector_by_role(
                          "priority-description-form",
                          true
                        )
                      );
                      var button_element = popover_div.selectAll(
                        self.get_ui_element_selector_by_role(
                          "priority-description-save",
                          true
                        )
                      );
                      textarea_element.text(pg.description);
                      button_element.on("click", function(d) {
                        self.priority_groups_edit_set_description(
                          pg.name,
                          $(textarea_element.node()).val(),
                          true
                        );
                        this_button.click();
                      });
                      button_element = popover_div.selectAll(
                        self.get_ui_element_selector_by_role(
                          "priority-description-dismiss",
                          true
                        )
                      );
                      button_element.on("click", function(d) {
                        d3.event.preventDefault();
                        this_button.click();
                      });
                    });

                  popover.popover("show");
                  this_button.data("popover_shown", "shown");
                  this_button
                    .off("hidden.bs.popover")
                    .on("hidden.bs.popover", function() {
                      $(this).data("popover_shown", "hidden");
                    });
                } else {
                  this_button.data("popover_shown", "hidden");
                  this_button.popover("destroy");
                }
              }
            }
          );

          this_row[0].actions[this_row[0].actions.length - 1].splice(
            -1,
            0,
            function(button_group, value) {
              if (self.priority_set_editor) {
                return {
                  icon: "fa-plus",
                  help:
                    "Add nodes in this priority set to the new priority set",
                  action: function(button, value) {
                    let nodeset = self.priority_groups_find_by_name(value);
                    if (nodeset) {
                      self.priority_set_editor.append_node_objects(
                        nodeset.node_objects
                      );
                    }
                  }
                };
              }
              return null;
            }
          );
        }
        this_row[0].actions = _.flatten(this_row[0].actions);
        //console.log (this_row[0]);
        if (pg.not_in_network.length) {
          this_row[2]["actions"] = [
            {
              text: "" + pg.not_in_network.length + " missing",
              classed: { "btn-danger": true, disabled: true },
              help: "Missing nodes: " + pg.not_in_network.join(", ")
            }
          ];
        }
        rows.push(this_row);
      });

      let has_pending = self.priority_groups_pending(),
        has_expanded = self.priority_groups_expanded(),
        has_required_actions;

      if (has_pending + has_expanded) {
        let labeler = (c, description, c2) => {
          if (c) {
            c2 = c2 ? " and " : "";
            return c2 + c + " " + description;
          }
          return "";
        };

        has_required_actions =
          '<div class="alert alert-danger">There are ' +
          labeler(has_pending, "auto-generated") +
          labeler(has_expanded, "auto-expanded", has_pending) +
          ' priority sets. Click the <i class = "fa fa-eye"></i> button to review and confirm the newly added nodes for each such cluster</div>';
      } else {
        has_required_actions = "";
      }

      add_a_sortable_table(
        container,
        headers,
        rows,
        true,
        has_required_actions +
          'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> priority sets.\
            <button class = "btn btn-sm btn-warning pull-right" data-hivtrace-ui-role="priority-subclusters-export">Export to JSON</button>\
            <button class = "btn btn-sm btn-primary pull-right" data-hivtrace-ui-role="priority-subclusters-export-csv">Export to CSV</button>\
            '
      );

      d3.select(
        self.get_ui_element_selector_by_role(
          "priority-subclusters-export",
          true
        )
      ).on("click", function(d) {
        helpers.export_json_button(self.priority_groups_export());
      });
      d3.select(
        self.get_ui_element_selector_by_role(
          "priority-subclusters-export-csv",
          true
        )
      ).on("click", function(d) {
        helpers.export_csv_button(self.priority_groups_export_nodes());
      });
    }
  };

  self.draw_node_table = function(
    extra_columns,
    node_list,
    headers,
    rows,
    container,
    table_caption
  ) {
    container = container || self.node_table;

    if (container) {
      node_list = node_list || self.nodes;

      if (!headers) {
        headers = [
          [
            {
              value: "ID",
              sort: "value",
              help: "Node ID"
            },
            {
              value: "Action",
              sort: "value"
            },
            {
              value: "# of links",
              sort: "value",
              help: "Number of links (Node degree)"
            },
            {
              value: "Cluster",
              sort: "value",
              help: "Which cluster does the node belong to"
            }
          ]
        ];

        if (extra_columns) {
          _.each(extra_columns, function(d) {
            if (d.prepend) {
              headers[0].splice(0, 0, d.description);
            } else {
              headers[0].push(d.description);
            }
          });
        }

        rows = node_list.map(function(n, i) {
          var this_row = [
            {
              value: n.id,
              help: "Node ID"
            },
            {
              value: function() {
                if (n.node_class != "injected") {
                  try {
                    if (self.exclude_cluster_ids[n.cluster]) {
                      // parent cluster can't be rendered
                      // because of size restrictions
                      return [n.cluster];
                    }
                    return [
                      !self.clusters[self.cluster_mapping[n.cluster]].collapsed,
                      n.cluster
                    ];
                  } catch (err) {
                    return [-1];
                  }
                } else {
                  return [n.node_annotation];
                }
              },
              callback: _node_table_draw_buttons,
              volatile: true
            },
            {
              value: "degree" in n ? n.degree : "Not defined",
              help: "Node degree"
            },
            {
              value: "cluster" in n ? n.cluster : "Not defined",
              help: "Which cluster does the node belong to"
            }
          ];

          if (extra_columns) {
            _.each(extra_columns, function(ed) {
              if (ed.prepend) {
                this_row.splice(0, 0, ed.generator(n, self));
              } else {
                this_row.push(ed.generator(n, self));
              }
            });
          }
          return this_row;
        });
      }

      add_a_sortable_table(
        container,
        headers,
        rows,
        true,
        table_caption
        // rows
      );
    }
  };

  self.draw_cluster_table = function(extra_columns, element, options) {
    var skip_clusters = options && options["no-clusters"];
    var skip_subclusters = !(options && options["subclusters"]);

    element = element || self.cluster_table;

    if (element) {
      var headers = [
        [
          {
            value: __("general")["cluster"] + " ID",
            sort: function(c) {
              return _.map(
                c.value[0].split(_networkSubclusterSeparator),
                function(ss) {
                  return _networkDotFormatPadder(+ss);
                }
              ).join("|");
            },
            help: "Unique cluster ID"
          },
          {
            value: __("general")["attributes"],
            sort: function(c) {
              c = c.value();
              if (c[4]) {
                // has attributes
                return c[4]["delta"];
              } else {
                return c[0];
              }
            },
            help: "Visibility in the network tab and other attributes"
          },
          {
            value: __("clusters_tab")["size"],
            sort: "value",
            help: "Number of nodes in the cluster"
          }
        ]
      ];

      if (self.cluster_attributes) {
        headers[0][1]["presort"] = "desc";
      }

      if (self._is_seguro) {
        headers[0].push({
          value: __("clusters_tab")["number_of_genotypes_in_past_2_months"],
          sort: "value",
          help: "# of cases in cluster genotyped in the last 2 months"
        });

        headers[0].push({
          value: __("clusters_tab")[
            "scaled_number_of_genotypes_in_past_2_months"
          ],
          sort: "value",
          help:
            "# of cases in cluster genotyped in the last 2 months divided by the square-root of the cluster size"
        });
      }

      if (!self._is_CDC_) {
        headers[0].push({
          value:
            __("statistics")["links_per_node"] +
            "<br>" +
            __("statistics")["mean"] +
            "[" +
            __("statistics")["median"] +
            ", IQR]",
          html: true
        });

        headers[0].push({
          value:
            __("statistics")["genetic_distances_among_linked_nodes"] +
            "<br>" +
            __("statistics")["mean"] +
            "[" +
            __("statistics")["median"] +
            ", IQR]",
          help: "Genetic distance among nodes in the cluster",
          html: true
        });
      }

      if (extra_columns) {
        _.each(extra_columns, function(d) {
          headers[0].push(d.description);
        });
      }

      if (options && options["headers"]) {
        options["headers"](headers);
      }

      var rows = [];

      _.each(self.clusters, function(cluster) {
        var make_row = function(d, is_subcluster) {
          var this_row = [
            {
              value: [d.cluster_id, is_subcluster, d], //.cluster_id,
              callback: _cluster_table_draw_id
            },
            {
              value: function() {
                var actual_cluster = is_subcluster ? d.parent_cluster : d;

                return [
                  actual_cluster.collapsed,
                  actual_cluster.hxb2_linked,
                  actual_cluster.match_filter,
                  actual_cluster.cluster_id,
                  is_subcluster
                    ? null
                    : self.cluster_attributes
                    ? self.cluster_attributes[actual_cluster.cluster_id]
                    : null
                ];
              },
              callback: _cluster_table_draw_buttons,
              volatile: true
            },
            {
              value: d.children.length
            }
          ];

          if (self._is_CDC_) {
            this_row[2].volatile = true;
            this_row[2].actions = function(item, value) {
              if (!self.priority_set_editor) {
                return null;
              } else {
                return [
                  {
                    icon: "fa-plus",
                    action: function(button, v) {
                      if (self.priority_set_editor) {
                        self.priority_set_editor.append_node_objects(
                          d.children
                        );
                      }
                      return false;
                    },
                    help: "Add to priority set"
                  }
                ];
              }
            };
          }

          if (self._is_seguro) {
            this_row.push({
              value: d,
              format: function(d) {
                return _.filter(
                  d.children,
                  child =>
                    d3.time.months(
                      child.patient_attributes["sample_dt"],
                      new Date()
                    ).length <= 2
                ).length;
              }
            });

            this_row.push({
              value: d,
              format: function(d) {
                let recent = _.filter(
                  d.children,
                  child =>
                    d3.time.months(
                      child.patient_attributes["sample_dt"],
                      new Date()
                    ).length <= 2
                ).length;
                return recent / Math.sqrt(d.children.length);
              }
            });
          }

          if (!self._is_CDC_) {
            this_row.push({
              value: d.degrees,
              format: function(d) {
                try {
                  return (
                    _defaultFloatFormat(d["mean"]) +
                    " [" +
                    _defaultFloatFormat(d["median"]) +
                    ", " +
                    _defaultFloatFormat(d["Q1"]) +
                    " - " +
                    _defaultFloatFormat(d["Q3"]) +
                    "]"
                  );
                } catch (e) {
                  return "";
                }
              }
            });
            this_row.push({
              value: d.distances,
              format: function(d) {
                try {
                  return (
                    _defaultFloatFormat(d["mean"]) +
                    " [" +
                    _defaultFloatFormat(d["median"]) +
                    ", " +
                    _defaultFloatFormat(d["Q1"]) +
                    " - " +
                    _defaultFloatFormat(d["Q3"]) +
                    "]"
                  );
                } catch (e) {
                  return "";
                }
              }
            });
          }
          if (extra_columns) {
            _.each(extra_columns, function(ed) {
              this_row.push(ed.generator(d, self));
            });
          }

          return this_row;
        };

        if (!skip_clusters) {
          rows.push(make_row(cluster, false));
        }

        if (!skip_subclusters) {
          _.each(cluster.subclusters, function(sub_cluster) {
            rows.push(make_row(sub_cluster, true));
          });
        }
      });

      add_a_sortable_table(
        element,
        headers,
        rows,
        true,
        options && options["caption"] ? options["caption"] : null
      );
    }
  };

  /*------------ Update layout code ---------------*/
  function update_network_string(node_count, edge_count) {
    if (network_status_string) {
      var clusters_shown = _.filter(self.clusters, function(c) {
          return !c.collapsed;
        }).length,
        clusters_removed = self.cluster_sizes.length - self.clusters.length,
        nodes_removed =
          graph_data.Nodes.length - singletons - self.nodes.length;

      var clusters_selected = _.filter(self.clusters, function(c) {
        return (
          !c.is_hidden && c.match_filter !== undefined && c.match_filter > 0
        );
      }).length;

      var nodes_selected = _.filter(self.nodes, function(n) {
        return n.match_filter && !n.is_hidden;
      }).length;

      /*var s = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
              + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
              + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
      if (singletons > 0) {
          s += "<strong>" +singletons + "</strong> singleton nodes are not shown. ";
      }*/

      var s =
        "<span class = 'badge'>" +
        self.clusters.length +
        "</span> clusters <span class = 'label label-primary'>" +
        clusters_shown +
        " expanded / " +
        clusters_selected +
        " match </span> <span class = 'badge'> " +
        self.nodes.length +
        "</span> nodes <span class = 'label label-primary'>" +
        node_count +
        " shown / " +
        nodes_selected +
        " match </span> <span class = 'badge'> " +
        self.edges.length +
        "</span> " +
        (self._is_CDC_ ? "links" : "edges") +
        " <span class = 'label label-primary'>" +
        edge_count +
        " shown</span>";

      d3.select(network_status_string).html(s);
    }
  }

  function draw_a_node(container, node) {
    if (node) {
      container = d3.select(container);
      //console.log (container.selectAll ("path"));
      //var path_component = containter.selectAll ("path");

      var symbol_type =
        node.hxb2_linked && !node.is_lanl
          ? "cross"
          : node.is_lanl
          ? "triangle-down"
          : self.node_shaper["shaper"](node);

      node.rendered_size = Math.sqrt(node_size(node)) / 2 + 2;

      container
        .selectAll("path")
        .attr("d", misc.symbol(symbol_type).size(node_size(node)))
        .style("fill", function(d) {
          return node_color(d);
        });

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
        //.attr("d", misc.symbol(symbol_type).size(node_size(node)))
        .attr("class", "node")
        .classed("selected_object", function(d) {
          return d.match_filter && !self.hide_unselected;
        })
        .classed("injected_object", function(d) {
          return d.node_class == "injected";
        })
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
        .style("opacity", function(d) {
          return node_opacity(d);
        })
        .style("display", function(d) {
          if (d.is_hidden) return "none";
          return null;
        })
        .call(
          network_layout.drag().on("dragstart", function(d) {
            d3.event.sourceEvent.stopPropagation();
            node_pop_off();
          })
        )
        .on("dragend", function(d) {
          d3.event.sourceEvent.stopPropagation();
        })
        .on("click", handle_node_click)
        .on("mouseover", node_pop_on)
        .on("mouseout", node_pop_off);
    }
  }

  function draw_a_cluster(container, the_cluster) {
    var container_group = d3.select(container);

    var draw_from = the_cluster["binned_attributes"]
      ? the_cluster["binned_attributes"].map(function(d) {
          return d.concat([0]);
        })
      : [[null, 1, 0]];

    if (the_cluster.match_filter) {
      draw_from = draw_from.concat([
        ["selected", the_cluster.match_filter, 1],
        [
          "not selected",
          the_cluster.children.length - the_cluster.match_filter,
          1
        ]
      ]);
    }

    var sums = [
      d3.sum(
        draw_from.filter(function(d) {
          return d[2] == 0;
        }),
        function(d) {
          return d[1];
        }
      ),
      d3.sum(
        draw_from.filter(function(d) {
          return d[2] != 0;
        }),
        function(d) {
          return d[1];
        }
      )
    ];

    var running_totals = [0, 0];

    draw_from = draw_from.map(function(d) {
      var index = d[2];
      var v = {
        container: container,
        cluster: the_cluster,
        startAngle: (running_totals[index] / sums[index]) * 2 * Math.PI,
        endAngle: ((running_totals[index] + d[1]) / sums[index]) * 2 * Math.PI,
        name: d[0],
        rim: index > 0
      };
      running_totals[index] += d[1];
      return v;
    });

    var arc_radius = cluster_box_size(the_cluster) * 0.5;
    the_cluster.rendered_size = arc_radius + 2;
    var paths = container_group.selectAll("path").data(draw_from);
    paths.enter().append("path");
    paths.exit().remove();

    paths
      .classed("cluster", true)
      .classed("hiv-trace-problematic", function(d) {
        return the_cluster.hxb2_linked && !d.rim;
      })
      .classed("hiv-trace-selected", function(d) {
        return d.rim;
      })
      .attr("d", function(d) {
        return (d.rim
          ? d3.svg
              .arc()
              .innerRadius(arc_radius + 2)
              .outerRadius(arc_radius + 5)
          : d3.svg
              .arc()
              .innerRadius(0)
              .outerRadius(arc_radius))(d);
      })
      .style("fill", function(d, i) {
        return d.rim
          ? self.colorizer["selected"](d.name)
          : the_cluster["gradient"]
          ? "url(#" + the_cluster["gradient"] + ")"
          : cluster_color(the_cluster, d.name);
      })
      .style("stroke-linejoin", function(d, i) {
        return draw_from.length > 1 ? "round" : "";
      })
      .style("display", function(d) {
        if (the_cluster.is_hidden) return "none";
        return null;
      });
  }

  function check_for_predefined_shapes(cat_id) {
    //console.log (cat_id);

    if (cat_id in _networkPresetShapeSchemes) {
      var domain = _.range(
        0,
        graph_data[_networkGraphAttrbuteID][cat_id]["value_range"].length
      );

      return {
        domain: domain,
        range: _.map(domain, function(v) {
          return _networkPresetShapeSchemes[
            cat_id
          ][graph_data[_networkGraphAttrbuteID][cat_id]["value_range"][v]];
        })
      };
    } else {
      return {
        domain: _.range(
          0,
          graph_data[_networkGraphAttrbuteID][cat_id].dimension
        ),
        range: _networkShapeOrdering
      };
    }
  }

  self.handle_shape_categorical = function(cat_id) {
    var set_attr = "None";

    ["shapes"].forEach(function(lbl) {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", function(d, i) {
          if (d[1] == cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html(
        __("network_tab")["shape"] +
          ": " +
          set_attr +
          ' <span class="caret"></span>'
      );
    });

    if (cat_id) {
      var domain_range = check_for_predefined_shapes(cat_id);

      var shape_mapper = d3.scale
        .ordinal()
        .domain(domain_range["domain"])
        .range(domain_range["range"]);
      self.node_shaper["id"] = cat_id;
      self.node_shaper["shaper"] = function(d) {
        return shape_mapper(
          graph_data[_networkGraphAttrbuteID][cat_id]["value_map"](
            self.attribute_node_value_by_id(d, cat_id)
          )
        );
      };
      self.node_shaper["category_map"] =
        graph_data[_networkGraphAttrbuteID][cat_id]["value_map"];
    } else {
      self.node_shaper.id = null;
      self.node_shaper.shaper = function() {
        return "circle";
      };
      self.node_shaper["category_map"] = null;
    }
    //console.log (graph_data [_networkGraphAttrbuteID][cat_id]['value_map'], self.node_shaper.domain(), self.node_shaper.range());
    self.draw_attribute_labels();
    self.update(true);
    d3.event.preventDefault();
  };

  self.renderColorPicker = function(cat_id, type) {
    let renderColorPickerCategorical = function(cat_id) {
      // For each unique value, render item.
      let colorizer = self.colorizer;
      let items = _.map(_.filter(self.uniqValues[cat_id]), d =>
        colorPicker.colorPickerInput(d, colorizer)
      );

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change(e => {
        let color = e.target.value;
        let name = e.target.name;

        // Set color in user-defined colorizer
        if (
          _.isUndefined(
            graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]
          )
        ) {
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"] = {};
        }

        graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"][
          name
        ] = color;
        self.handle_attribute_categorical(cat_id);
      });
    };

    let renderColorPickerContinuous = function(cat_id, color_stops) {
      // For each unique value, render item.
      // Min and max range for continuous values
      let items = [
        colorPicker.colorStops("Scale", color_stops),
        colorPicker.colorPickerInputContinuous(
          "Min",
          self.uniqValues[cat_id]["min"]
        ),
        colorPicker.colorPickerInputContinuous(
          "Max",
          self.uniqValues[cat_id]["max"]
        )
      ];

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change(e => {
        let color = e.target.value;
        let name = e.target.name;

        // Set color in user-defined colorizer
        if (
          _.isUndefined(
            graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]
          )
        ) {
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"] = {};
        }

        // get both for user-defined
        graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"][
          name
        ] = color;
        self.handle_attribute_continuous(cat_id);
      });

      // Set onchange event for items
      $(".hivtrace-color-stops").change(e => {
        let num = parseInt(e.target.value);
        graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
          "color_stops"
        ] = num;

        self._aux_populate_category_menus();
        self.handle_attribute_continuous(cat_id);
        self.update();
      });
    };

    if (type == "categorical") {
      renderColorPickerCategorical(cat_id);
    } else if (type == "continuous") {
      renderColorPickerContinuous(
        cat_id,
        graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
          "color_stops"
        ]
      );
    } else {
      console.log("Error: type not recognized");
    }

    if (cat_id != null) {
      $("#colorPickerOption").show();
    } else {
      $("#colorPickerOption").hide();
    }
  };

  self.draw_attribute_labels = function() {
    // draw color legend in the network SVG

    var determine_label_format_cont = function(field_data) {
      if ("label_format" in field_data) {
        return field_data["label_format"];
      }
      if (field_data["type"] == "Date") {
        return _defaultDateViewFormatShort;
      }
      return d3.format(",.4r");
    };

    self.legend_svg.selectAll("g.hiv-trace-legend").remove();

    var offset = 10;

    if (self.legend_caption) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(self.legend_caption)
        .style("font-weight", "bold");
      offset += 18;
    }

    if (self.edge_legend) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(self.edge_legend["caption"])
        .style("font-weight", "bold");
      offset += 18;

      _.each(self.edge_legend["types"], function(value, key) {
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(key);

        value.call(
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("line")
            .attr("x1", "0")
            .attr("y1", "-4")
            .attr("x2", "12")
            .attr("y2", "-4")
            .classed("legend", true)
        );

        offset += 18;
      });
    }

    if (self.colorizer["category_id"]) {
      //_.each (self.colorizer["category_map"](null, "map"), function (v){ console.log (v); });

      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          "Color: " +
            self.json[_networkGraphAttrbuteID][self.colorizer["category_id"]]
              .label
        )
        .style("font-weight", "bold");
      offset += 18;

      if (self.colorizer["continuous"]) {
        var anchor_format = determine_label_format_cont(
          graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]
        );

        var color_stops =
          graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
            "color_stops"
          ] || _networkContinuousColorStops;

        var scale =
          graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
            "scale"
          ];

        _.each(_.range(color_stops), function(value) {
          var x = scale.invert(value);
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(20," + offset + ")")
            .append("text")
            .text(anchor_format(x));
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("circle")
            .attr("cx", "8")
            .attr("cy", "-4")
            .attr("r", "8")
            .classed("legend", true)
            .style("fill", self.colorizer["category"](x));
          offset += 18;
        });

        if (
          "category_values" in
          graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]
        ) {
          _.each(
            graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
              "category_values"
            ],
            function(value) {
              self.legend_svg
                .append("g")
                .classed("hiv-trace-legend", true)
                .attr("transform", "translate(20," + offset + ")")
                .append("text")
                .text(value);
              self.legend_svg
                .append("g")
                .classed("hiv-trace-legend", true)
                .attr("transform", "translate(0," + offset + ")")
                .append("circle")
                .attr("cx", "8")
                .attr("cy", "-4")
                .attr("r", "8")
                .classed("legend", true)
                .style("fill", self.colorizer["category"](value));

              offset += 18;
            }
          );
        }

        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text("missing");
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", _networkMissingColor);

        offset += 18;
      } else {
        _.each(self.colorizer["category_map"](null, "map"), function(
          value,
          key
        ) {
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(20," + offset + ")")
            .append("text")
            .text(key);
          self.legend_svg
            .append("g")
            .classed("hiv-trace-legend", true)
            .attr("transform", "translate(0," + offset + ")")
            .append("circle")
            .attr("cx", "8")
            .attr("cy", "-4")
            .attr("r", "8")
            .classed("legend", true)
            .style("fill", self.colorizer["category"](key));

          offset += 18;
        });
      }
    }

    if (self.node_shaper["id"]) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          "Shape: " +
            self.json[_networkGraphAttrbuteID][self.node_shaper["id"]].label
        )
        .style("font-weight", "bold");
      offset += 18;

      var domain_range = check_for_predefined_shapes(self.node_shaper["id"]);
      var shape_mapper = d3.scale
        .ordinal()
        .domain(domain_range["domain"])
        .range(domain_range["range"]);

      _.each(self.node_shaper["category_map"](null, "map"), function(
        value,
        key
      ) {
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(key);

        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("path")
          .attr("transform", "translate(5,-5)")
          .attr("d", misc.symbol(shape_mapper(value)).size(128))
          .classed("legend", true)
          .style("fill", "none");

        offset += 18;
      });
    }

    if (self.colorizer["opacity_id"]) {
      self.legend_svg
        .append("g")
        .attr("transform", "translate(0," + offset + ")")
        .classed("hiv-trace-legend", true)
        .append("text")
        .text(
          __("network_tab")["opacity"] +
            ": " +
            self.json[_networkGraphAttrbuteID][self.colorizer["opacity_id"]]
              .label
        )
        .style("font-weight", "bold");
      offset += 18;

      var anchor_format = determine_label_format_cont(
        graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]]
      );

      var scale =
        graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]][
          "scale"
        ];

      _.each(_.range(_networkContinuousColorStops), function(value) {
        var x = scale.invert(value);
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(anchor_format(x));
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", "black")
          .style("opacity", self.colorizer["opacity"](x));

        offset += 18;
      });

      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text("missing");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("circle")
        .attr("cx", "8")
        .attr("cy", "-4")
        .attr("r", "8")
        .classed("legend", true)
        .style("fill", "black")
        .style("opacity", _networkMissingOpacity);

      offset += 18;
    }
  };

  function compute_cluster_gradient(cluster, cat_id) {
    if (cat_id) {
      var id = self.dom_prefix + "-cluster-gradient-" + self.gradient_id++;
      var gradient = self.network_svg
        .selectAll("defs")
        .append("radialGradient")
        .attr("id", id);
      var values = _.map(cluster.children, function(node) {
        var value = self.attribute_node_value_by_id(node, cat_id);
        return value == _networkMissing ? Infinity : value;
      }).sort(function(a, b) {
        return 0 + a - (0 + b);
      });
      var finite = _.filter(values, function(d) {
        return d < Infinity;
      });
      var infinite = values.length - finite.length;

      if (infinite) {
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", _networkMissingColor);
        gradient
          .append("stop")
          .attr("offset", "" + (infinite / values.length) * 100 + "%")
          .attr("stop-color", _networkMissingColor);
      }

      _.each(finite, function(value, index) {
        gradient
          .append("stop")
          .attr(
            "offset",
            "" + ((1 + index + infinite) * 100) / values.length + "%"
          )
          .attr("stop-color", self.colorizer["category"](value));
      });
      //gradient.append ("stop").attr ("offset", "100%").attr ("stop-color", self.colorizer['category'] (dom[1]));

      return id;
    }
    return null;
  }

  self.handle_attribute_opacity = function(cat_id) {
    var set_attr = "None";

    ["opacity"].forEach(function(lbl) {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", function(d, i) {
          if (d[1] == cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html(
        __("network_tab")["opacity"] +
          ": " +
          set_attr +
          ' <span class="caret"></span>'
      );
    });

    d3.select(self.get_ui_element_selector_by_role("opacity_invert"))
      .style("display", set_attr == "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    self.colorizer["opacity_id"] = cat_id;
    if (cat_id) {
      var scale = graph_data[_networkGraphAttrbuteID][cat_id]["scale"];
      self.colorizer["opacity_scale"] = d3.scale
        .linear()
        .domain([0, _networkContinuousColorStops - 1])
        .range([0.25, 1]);
      self.colorizer["opacity"] = function(v) {
        if (v == _networkMissing) {
          return _networkMissingOpacity;
        }
        return self.colorizer["opacity_scale"](scale(v));
      };
    } else {
      self.colorizer["opacity"] = null;
      self.colorizer["opacity_scale"] = null;
    }

    self.draw_attribute_labels();
    self.update(true);
    d3.event.preventDefault();
  };

  self.handle_attribute_continuous = function(cat_id) {
    var set_attr = "None";

    render_chord_diagram("aux_svg_holder", null, null);
    render_binned_table("attribute_table", null, null);

    self.network_svg.selectAll("radialGradient").remove();

    self.clusters.forEach(function(the_cluster) {
      delete the_cluster["binned_attributes"];
      delete the_cluster["gradient"];
    });

    [
      ["attributes", false],
      ["attributes_cat", true]
    ].forEach(function(lbl) {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", function(d, i) {
          if (d[1] == cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(
        self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])
      ).html("Color: " + set_attr + ' <span class="caret"></span>');
    });

    d3.select(self.get_ui_element_selector_by_role("attributes_invert"))
      .style("display", set_attr == "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    if (cat_id) {
      // map values to inverted scale
      let color_stops =
        graph_data[_networkGraphAttrbuteID][cat_id]["color_stops"] ||
        _networkContinuousColorStops;

      if (graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"]) {
        self.colorizer["category"] = graph_data[_networkGraphAttrbuteID][
          cat_id
        ]["color_scale"](graph_data[_networkGraphAttrbuteID][cat_id], self);

        self.uniqValues[cat_id]["min"] = self.colorizer["category"](
          color_stops
        );
        self.uniqValues[cat_id]["max"] = self.colorizer["category"](
          color_stops
        );
      } else {
        self.colorizer["category"] = _.wrap(
          d3.scale
            .linear()
            .domain(_.range(_networkContinuousColorStops))
            .range(["#fff7ec", "#7f0000"])
            .interpolate(d3.interpolateRgb),
          function(func, arg) {
            self.uniqValues[cat_id]["min"] = "#fff7ec";
            self.uniqValues[cat_id]["max"] = "#7f0000";

            return func(
              graph_data[_networkGraphAttrbuteID][cat_id]["scale"](arg) *
                (1 / _networkContinuousColorStops)
            );
          }
        );
      }

      if (graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]) {
        // get min and max
        let min =
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]["min"] ||
          self.uniqValues[cat_id]["min"];
        let max =
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]["max"] ||
          self.uniqValues[cat_id]["max"];

        self.uniqValues[cat_id]["min"] =
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]["min"] ||
          self.uniqValues[cat_id]["min"];
        self.uniqValues[cat_id]["max"] =
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]["max"] ||
          self.uniqValues[cat_id]["max"];

        self.colorizer["category"] = _.wrap(
          d3.scale
            .linear()
            .domain(_.range(color_stops))
            .range([min, max])
            .interpolate(d3.interpolateRgb),
          function(func, arg) {
            return func(
              graph_data[_networkGraphAttrbuteID][cat_id]["scale"](arg) *
                (1 / color_stops)
            );
          }
        );
      }

      self.colorizer["category_id"] = cat_id;
      self.colorizer["continuous"] = true;
      self.clusters.forEach(function(the_cluster) {
        the_cluster["gradient"] = compute_cluster_gradient(the_cluster, cat_id);
      });

      var points = [];

      _.each(self.edges, function(e) {
        var src = self.attribute_node_value_by_id(
            self.nodes[e.source],
            cat_id,
            true
          ),
          tgt = self.attribute_node_value_by_id(
            self.nodes[e.target],
            cat_id,
            true
          );

        if (src != _networkMissing && tgt != _networkMissing) {
          points.push({
            x: src,
            y: tgt,
            title:
              self.nodes[e.source].id +
              " (" +
              src +
              ") -- " +
              self.nodes[e.target].id +
              " (" +
              tgt +
              ")"
          });
        }
      });
      d3.select(
        self.get_ui_element_selector_by_role("aux_svg_holder_enclosed", true)
      ).style("display", null);

      scatterPlot.scatterPlot(
        points,
        400,
        400,
        self.get_ui_element_selector_by_role("aux_svg_holder", true),
        {
          x: "Source",
          y: "Target"
        },
        graph_data[_networkGraphAttrbuteID][cat_id]["type"] == "Date"
      );
    } else {
      self.colorizer["category"] = null;
      self.colorizer["category_id"] = null;
      self.colorizer["continuous"] = false;
      self.colorizer["category_pairwise"] = null;
      self.colorizer["category_map"] = null;
    }

    // Draw color picker for manual override
    self.renderColorPicker(cat_id, "continuous");

    self.draw_attribute_labels();
    self.update(true);

    if (d3.event) {
      d3.event.preventDefault();
    }
  };

  self.handle_attribute_categorical = function(cat_id, skip_update) {
    var set_attr = "None";

    d3.select(self.get_ui_element_selector_by_role("attributes_invert")).style(
      "display",
      "none"
    );

    self.network_svg.selectAll("radialGradient").remove();

    [
      ["attributes", false],
      ["attributes_cat", true]
    ].forEach(function(lbl) {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", function(d, i) {
          if (d[1] == cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(
        self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])
      ).html("Color: " + set_attr + ' <span class="caret"></span>');
    });

    self.clusters.forEach(function(the_cluster) {
      delete the_cluster["gradient"];
      the_cluster["binned_attributes"] = stratify(
        attribute_cluster_distribution(the_cluster, cat_id)
      );
    });

    self.colorizer["continuous"] = false;

    //TODO -- if preset color scheme does not exist, create one and always use the logic here.

    if (cat_id) {
      if (cat_id in self.networkColorScheme) {
        var domain = [],
          range = [];
        _.each(self.networkColorScheme[cat_id], function(value, key) {
          domain.push(key);
          range.push(value);
        });
        self.colorizer["category"] = d3.scale
          .ordinal()
          .domain(domain)
          .range(range);
      } else {
        if (graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"]) {
          self.colorizer["category"] = graph_data[_networkGraphAttrbuteID][
            cat_id
          ]["color_scale"](graph_data[_networkGraphAttrbuteID][cat_id], self);
        } else {
          self.colorizer["category"] = d3.scale
            .ordinal()
            .range(_networkCategorical);

          var extended_range = _.clone(self.colorizer["category"].range());
          extended_range.push(_networkMissingColor);

          self.colorizer["category"].domain(
            _.range(_maximumValuesInCategories + 1)
          );

          self.colorizer["category"].range(extended_range);

          if (graph_data[_networkGraphAttrbuteID][cat_id]["stable-ish order"]) {
            self.colorizer["category"] = _.wrap(
              self.colorizer["category"],
              function(func, arg) {
                if (arg == _networkMissing) {
                  return func(_maximumValuesInCategories);
                }
                return func(
                  graph_data[_networkGraphAttrbuteID][cat_id][
                    "stable-ish order"
                  ][arg]
                );
              }
            );
            //console.log (graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order']);
          }
        }
      }

      if (graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]) {
        self.colorizer["category"] = _.wrap(
          self.colorizer["category"],
          function(func, arg) {
            if (
              arg in graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]
            ) {
              return graph_data[_networkGraphAttrbuteID][cat_id][
                "user-defined"
              ][arg];
            } else {
              return func(arg);
            }
          }
        );
      }

      self.colorizer["category_id"] = cat_id;
      self.colorizer["category_map"] =
        graph_data[_networkGraphAttrbuteID][cat_id]["value_map"];

      //console.log (cat_id, self.json[_networkGraphAttrbuteID][cat_id], graph_data[_networkGraphAttrbuteID][cat_id]["value_map"] (null, "lookup"));
      //self.colorizer['category_map'][null] =  graph_data [_networkGraphAttrbuteID][cat_id]['range'];

      //try {
      //console.log (self.colorizer["category_map"]);
      self.colorizer["category_pairwise"] = attribute_pairwise_distribution(
        cat_id,
        graph_data[_networkGraphAttrbuteID][cat_id].dimension,
        self.colorizer["category_map"]
      );
      //} catch (err) {
      // TODO: there are still lingering issues with this "category_map"
      //}

      render_chord_diagram(
        "aux_svg_holder",
        self.colorizer["category_map"],
        self.colorizer["category_pairwise"]
      );
      render_binned_table(
        "attribute_table",
        self.colorizer["category_map"],
        self.colorizer["category_pairwise"]
      );
    } else {
      self.colorizer["category"] = null;
      self.colorizer["category_id"] = null;
      self.colorizer["category_pairwise"] = null;
      self.colorizer["category_map"] = null;
      render_chord_diagram("aux_svg_holder", null, null);
      render_binned_table("attribute_table", null, null);
    }
    if (self.handle_inline_charts) {
      self.handle_inline_charts();
    }

    self.draw_attribute_labels();
    self.update(true);
    if (d3.event) {
      d3.event.preventDefault();
    }

    // Draw color picker for manual override
    self.renderColorPicker(cat_id, "categorical");
  };

  self.filter_visibility = function() {
    self.clusters.forEach(function(c) {
      c.is_hidden = self.hide_unselected && !c.match_filter;
    });
    self.nodes.forEach(function(n) {
      n.is_hidden = self.hide_unselected && !n.match_filter;
    });
  };

  self.filter_parse = function(filter_value) {
    return filter_value
      .split(" ")
      .filter(function(d) {
        return d.length > 0;
      })
      .map(function(d) {
        if (d.length > 2) {
          if (d[0] == '"' && d[d.length - 1] == '"') {
            return {
              type: "re",
              value: new RegExp("^" + d.substr(1, d.length - 2) + "$", "i")
            };
          }
          if (d[0] == "<" || d[0] == ">") {
            var distance_threshold = parseFloat(d.substr(1));
            if (distance_threshold > 0) {
              return {
                type: "distance",
                greater_than: d[0] == ">",
                value: distance_threshold
              };
            }
          }
          if (self.cluster_time_scale) {
            var is_range = _networkTimeQuery.exec(d);
            if (is_range) {
              return {
                type: "date",
                value: _.map([is_range[1], is_range[2]], function(d) {
                  return new Date(
                    d.substring(0, 4) +
                      "-" +
                      d.substring(4, 6) +
                      "-" +
                      d.substring(6, 8)
                  );
                })
              };
            }
          }
        }
        return {
          type: "re",
          value: new RegExp(d, "i")
        };
      });
  };

  self.filter = function(conditions, skip_update) {
    var anything_changed = false;

    conditions = _.map(["re", "distance", "date"], function(cnd) {
      return _.map(
        _.filter(conditions, function(v) {
          return v.type == cnd;
        }),
        function(v) {
          return v.value;
        }
      );
    });

    if (conditions[1].length) {
      self.nodes.forEach(function(n) {
        n.length_filter = false;
      });

      _.each(self.edges, function(e) {
        var did_match = _.some(conditions[1], function(d) {
          return e.length <= d;
        });

        if (did_match) {
          self.nodes[e.source].length_filter = true;
          self.nodes[e.target].length_filter = true;
        }
      });
    } else {
      self.nodes.forEach(function(n) {
        n.length_filter = false;
      });
    }

    if (conditions[2].length) {
      self.nodes.forEach(function(n) {
        var node_T = self.attribute_node_value_by_id(
          n,
          self.cluster_time_scale
        );
        n.date_filter = _.some(conditions[2], function(d) {
          return node_T >= d[0] && node_T <= d[1];
        });
      });
    } else {
      self.nodes.forEach(function(n) {
        n.date_filter = false;
      });
    }

    self.clusters.forEach(function(c) {
      c.match_filter = 0;
    });

    self.nodes.forEach(function(n) {
      var did_match = _.some(conditions[0], function(regexp) {
        return (
          regexp.test(n.id) ||
          _.some(n[_networkNodeAttributeID], function(attr) {
            return regexp.test(attr);
          })
        );
      });

      did_match = did_match || n.length_filter || n.date_filter;

      if (did_match != n.match_filter) {
        n.match_filter = did_match;
        anything_changed = true;
      }

      if (n.match_filter) {
        n.parent.match_filter += 1;
      }
    });

    if (anything_changed && self.handle_inline_charts) {
      self.handle_inline_charts(function(n) {
        return n.match_filter;
      });
    }

    if (anything_changed && !skip_update) {
      if (self.hide_unselected) {
        self.filter_visibility();
      }

      self.update(true);
    }
  };

  self.is_empty = function() {
    return self.cluster_sizes.length == 0;
  };

  self.display_warning = function(warning_string, is_html) {
    if (network_warning_tag) {
      if (warning_string.length) {
        var warning_box = d3.select(network_warning_tag);
        warning_box.selectAll("div").remove();
        if (is_html) {
          warning_box.append("div").html(warning_string);
        } else {
          warning_box.append("div").text(warning_string);
        }
        warning_box.style("display", "block");
        warning_string = "";
      } else {
        d3.select(network_warning_tag).style("display", "none");
      }
    }
  };

  self.link_generator_function = function(d) {
    var pull = d.pull || 0.0;
    var path;

    if (pull != 0.0) {
      var dist_x = d.target.x - d.source.x;
      var dist_y = d.target.y - d.source.y;
      var pull = pull * Math.sqrt(dist_x * dist_x + dist_y * dist_y);

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

    d3.select(this).attr("d", path);
  };

  self.update = function(soft, friction) {
    self.needs_an_update = false;

    if (options && options["extra-graphics"]) {
      options["extra-graphics"].call(null, self, options);
    }

    if (friction) {
      network_layout.friction(friction);
    }
    self.display_warning(self.warning_string, true);

    var rendered_nodes, rendered_clusters, link;

    if (!soft) {
      var draw_me = prepare_data_to_graph();

      network_layout.nodes(draw_me.all).links(draw_me.edges);
      update_network_string(draw_me.nodes.length, draw_me.edges.length);

      var edge_set = {};

      _.each(draw_me.edges, function(d) {
        d.pull = 0.0;
        var tag = "";

        if (d.source < d.target) {
          tag = "" + d.source + "|" + d.target;
        } else {
          tag = "" + d.target + "|" + d.source;
        }
        if (tag in edge_set) {
          edge_set[tag].push(d);
        } else {
          edge_set[tag] = [d];
        }
      });

      _.each(edge_set, function(v) {
        if (v.length > 1) {
          var step = 1 / (v.length - 1);
          _.each(v, function(edge, index) {
            edge.pull = -0.5 + index * step;
          });
        }
      });

      link = self.network_svg
        .selectAll(".link")
        .data(draw_me.edges, function(d) {
          return d.id;
        });

      //link.enter().append("line").classed("link", true);
      link
        .enter()
        .append("path")
        .classed("link", true);
      link.exit().remove();

      link
        .classed("removed", function(d) {
          return self.highlight_unsuppored_edges && d.removed;
        })
        .classed("unsupported", function(d) {
          return (
            self.highlight_unsuppored_edges &&
            "support" in d &&
            d["support"] > 0.05
          );
        })
        .classed("core-link", function(d) {
          //console.log (d["length"] <= self.core_link_length);
          return d["length"] <= self.core_link_length;
          //return false;
        });

      link
        .on("mouseover", edge_pop_on)
        .on("mouseout", edge_pop_off)
        .filter(function(d) {
          return d.directed;
        })
        .attr("marker-end", "url(#" + self.dom_prefix + "_arrowhead)");

      rendered_nodes = self.network_svg
        .selectAll(".node")
        .data(draw_me.nodes, function(d) {
          return d.id;
        });

      rendered_nodes.exit().remove();

      /*rendered_nodes.enter().each (function (d) {
        this.append ("path");
      });*/

      rendered_nodes
        .enter()
        .append("g")
        .append("path");

      rendered_clusters = self.network_svg.selectAll(".cluster-group").data(
        draw_me.clusters.map(function(d) {
          return d;
        }),
        function(d) {
          return d.cluster_id;
        }
      );

      rendered_clusters.exit().remove();
      rendered_clusters
        .enter()
        .append("g")
        .attr("class", "cluster-group")
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
        .on("click", handle_cluster_click)
        .on("mouseover", cluster_pop_on)
        .on("mouseout", cluster_pop_off)
        .call(network_layout.drag().on("dragstart", cluster_pop_off));

      self.draw_cluster_table(
        self.extra_cluster_table_columns,
        self.cluster_table
      );

      if (
        self._is_CDC_ &&
        !(
          options &&
          options["no-subclusters"] &&
          options["no-subcluster-compute"]
        )
      ) {
        // compute priority clusters
        self.annotate_priority_clusters(_networkCDCDateField, 36, 12);

        try {
          graph_data[_networkGraphAttrbuteID][
            "recent_rapid"
          ] = self._aux_process_category_values(
            self._aux_populate_category_fields(
              graph_data[_networkGraphAttrbuteID]["recent_rapid"],
              "recent_rapid"
            )
          );
        } catch (err) {
          //console.log(err);
        }
      }

      if (
        self._is_CDC_ &&
        !(options && options["no-subclusters"]) &&
        options &&
        options["no-subcluster-compute"]
      ) {
        // use precomputed subclusters

        _.each(self.clusters, function(cluster_nodes, cluster_index) {
          /** extract subclusters; all nodes at given threshold */
          /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */
          let subclusters = _.groupBy(
            cluster_nodes.children,
            n => n.subcluster_id
          );
          subclusters = _.values(
            _.reject(subclusters, (v, k) => {
              return k == "undefined";
            })
          );

          /** sort subclusters by oldest node */
          _.each(subclusters, function(c, i) {
            c.sort(oldest_nodes_first);
          });

          subclusters.sort(function(c1, c2) {
            return oldest_nodes_first(c1[0], c2[0]);
          });

          subclusters = _.map(subclusters, function(c, i) {
            let parent_cluster_id = c[0].parent_cluster_id;
            let subcluster_id = c[0].subcluster_id;
            let label = c[0].subcluster_label;

            var edges = [];

            var meta_data = _.filter(
              hivtrace_cluster_depthwise_traversal(
                cluster_nodes.Nodes,
                cluster_nodes.Edges,
                null,
                edges
              ),
              function(cc) {
                return cc.length > 1;
              }
            );

            edges = _.filter(edges, function(es) {
              return es.length > 1;
            });

            var stats =
              self.json.subcluster_summary_stats[parent_cluster_id][
                subcluster_id
              ];

            return {
              children: _.clone(c),
              parent_cluster: cluster_nodes,
              cluster_id: label,
              subcluster_label: subcluster_id,
              recent_nodes: stats.recent_nodes,
              priority_score: stats.priority_score,
              distances: helpers.describe_vector(
                _.map(edges[i], function(e) {
                  return e.length;
                })
              )
            };
          });

          _.each(subclusters, function(c) {
            _compute_cluster_degrees(c);
          });

          cluster_nodes.subclusters = subclusters || [];

          // add additional information
          let stats =
            self.json.subcluster_summary_stats[cluster_nodes.cluster_id];
          cluster_nodes.recent_nodes = _.map(
            _.values(stats),
            d => d.recent_nodes[0] || 0
          );
          cluster_nodes.priority_score = _.map(
            _.values(stats),
            d => d.priority_score[0] || 0
          );
        });
      }

      if (self.subcluster_table) {
        /*
            SLKP 20200727 scan subclusters and identify which, if any
            will need to be automatically created as priority sets
        */

        // draw subcluster tables

        self.draw_cluster_table(
          self.extra_subcluster_table_columns,
          self.subcluster_table,
          {
            "no-clusters": true,
            subclusters: true,
            headers: function(headers) {
              headers[0][0].value = "Subcluster ID";
              headers[0][0].help = "Unique subcluster ID";
              headers[0][2].help = "Number of total cases in the subcluster";
            }
          }
        );
      }
      if (self._is_CDC_) {
        self.draw_extended_node_table();
      } else {
        self.draw_node_table(self.extra_node_table_columns);
      }
    } else {
      rendered_nodes = self.network_svg.selectAll(".node");
      rendered_clusters = self.network_svg.selectAll(".cluster-group");
      link = self.network_svg.selectAll(".link");
      update_network_string(rendered_nodes.size(), link.size());
    }

    rendered_nodes.each(function(d) {
      draw_a_node(this, d);
    });

    rendered_clusters.each(function(d) {
      draw_a_cluster(this, d);
    });

    link.style("opacity", function(d) {
      return Math.max(node_opacity(d.target), node_opacity(d.source));
    });

    if (self.additional_edge_styler) {
      link.each(function(d) {
        self.additional_edge_styler(this, d, self);
      });
    }

    link.style("display", function(d) {
      if (d.target.is_hidden || d.source.is_hidden || d.is_hidden) {
        return "none";
      }
      return null;
    });

    if (!soft) {
      currently_displayed_objects =
        rendered_clusters[0].length + rendered_nodes[0].length;

      network_layout.on("tick", function() {
        var sizes = network_layout.size();

        rendered_nodes.attr("transform", function(d) {
          // Defalut values (just to keep nodes in the svg container rectangle).
          var xBoundLower = 10;
          var xBoundUpper = sizes[0] - 10;
          var yBoundLower = 10;
          var yBoundUpper = sizes[1] - 10;

          if (self.showing_on_map) {
            const allowed_offset_from_center_of_country = 15;
            // If the country is in the list that we have, override the default values for the bounds.
            var country_code = self._get_node_country(d);

            if (country_code in self.countryCentersObject) {
              let center = self.countryCentersObject[country_code].countryXY;

              xBoundLower = center[0] - allowed_offset_from_center_of_country;
              xBoundUpper = center[0] + allowed_offset_from_center_of_country;
              yBoundLower = center[1] - allowed_offset_from_center_of_country;
              yBoundUpper = center[1] + allowed_offset_from_center_of_country;
            }
          }

          return (
            "translate(" +
            (d.x = Math.max(xBoundLower, Math.min(xBoundUpper, d.x))) +
            "," +
            (d.y = Math.max(yBoundLower, Math.min(yBoundUpper, d.y))) +
            ")"
          );
        });
        rendered_clusters.attr("transform", function(d) {
          return (
            "translate(" +
            (d.x = Math.max(
              d.rendered_size,
              Math.min(sizes[0] - d.rendered_size, d.x)
            )) +
            "," +
            (d.y = Math.max(
              d.rendered_size,
              Math.min(sizes[1] - d.rendered_size, d.y)
            )) +
            ")"
          );
        });

        link.each(self.link_generator_function);
      });

      network_layout.start();
    } else {
      link.each(self.link_generator_function);
    }
  };

  function tick() {
    var sizes = network_layout.size();

    node
      .attr("cx", function(d) {
        return (d.x = Math.max(10, Math.min(sizes[0] - 10, d.x)));
      })
      .attr("cy", function(d) {
        return (d.y = Math.max(10, Math.min(sizes[1] - 10, d.y)));
      });

    link
      .attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });
  }

  /*------------ Node Methods ---------------*/
  function compute_node_degrees(nodes, edges) {
    for (var n in nodes) {
      nodes[n].degree = 0;
    }

    for (var e in edges) {
      nodes[edges[e].source].degree++;
      nodes[edges[e].target].degree++;
    }
  }

  self.attribute_node_value_by_id = function(d, id, number) {
    try {
      if (_networkNodeAttributeID in d && id) {
        if (id in d[_networkNodeAttributeID]) {
          var v;

          if (self.json[_networkGraphAttrbuteID][id].volatile) {
            v = self.json[_networkGraphAttrbuteID][id].map(d, self);
          } else {
            v = d[_networkNodeAttributeID][id];
          }

          if (_.isString(v)) {
            if (v.length == 0) {
              return _networkMissing;
            } else {
              if (number) {
                v = +v;
                return _.isNaN(v) ? _networkMissing : v;
              }
            }
          }
          return v;
        }
      }
    } catch (e) {
      console.log("self.attribute_node_value_by_id", e, d, id, number);
    }
    return _networkMissing;
  };

  function inject_attribute_node_value_by_id(d, id, value) {
    //console.log ("Injecting " + id + " with value " + value);
    if (_networkNodeAttributeID in d && id) {
      d[_networkNodeAttributeID][id] = value;
    }
  }

  self.has_network_attribute = function(key) {
    if (_networkGraphAttrbuteID in self.json) {
      return key in self.json[_networkGraphAttrbuteID];
    }
    return false;
  };

  self.inject_attribute_description = function(key, d) {
    if (_networkGraphAttrbuteID in self.json) {
      var new_attr = {};
      new_attr[key] = d;
      _.extend(self.json[_networkGraphAttrbuteID], new_attr);
      //self.json[_networkGraphAttrbuteID][key] = _.clone (d);
    }
  };

  function node_size(d) {
    if (self.showing_on_map) {
      return 50;
    }
    var r = 5 + Math.sqrt(d.degree); //return (d.match_filter ? 10 : 4)*r*r;
    return 4 * r * r;
  }

  function node_color(d) {
    /*if (d.match_filter) {
        return "white";
    }*/

    if (self.colorizer["category_id"]) {
      var v = self.attribute_node_value_by_id(d, self.colorizer["category_id"]);
      if (self.colorizer["continuous"]) {
        if (v == _networkMissing) {
          return _networkMissingColor;
        }
        //console.log (v, self.colorizer['category'](v));
      }
      return self.colorizer["category"](v);
    }
    return d.hxb2_linked ? "black" : d.is_lanl ? "red" : "gray";
  }

  function node_opacity(d) {
    if (self.colorizer["opacity"]) {
      return self.colorizer["opacity"](
        self.attribute_node_value_by_id(d, self.colorizer["opacity_id"], true)
      );
    }
    return 1;
  }

  function cluster_color(d, type) {
    if (d["binned_attributes"]) {
      return self.colorizer["category"](type);
    }
    return "#bdbdbd";
  }

  function hxb2_node_color(d) {
    return "black";
  }

  function node_info_string(n) {
    var str;

    if (!self._is_CDC_) {
      str =
        "Degree <em>" +
        n.degree +
        "</em><br>Clustering coefficient <em> " +
        misc.format_value(n.lcc, _defaultFloatFormat) +
        "</em>";
    } else {
      str = "# links <em>" + n.degree + "</em>";
    }

    _.each(
      _.union(self._additional_node_pop_fields, [
        self.colorizer["category_id"],
        self.node_shaper["id"],
        self.colorizer["opacity_id"]
      ]),
      function(key) {
        if (key) {
          if (key in graph_data[_networkGraphAttrbuteID]) {
            var attribute = self.attribute_node_value_by_id(n, key);

            if (graph_data[_networkGraphAttrbuteID][key]["type"] == "Date") {
              try {
                attribute = _defaultDateViewFormat(attribute);
              } catch (err) {}
            }
            if (attribute) {
              str +=
                "<br>" +
                graph_data[_networkGraphAttrbuteID][key].label +
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

  function edge_info_string(n) {
    var str = "Length <em>" + _defaultFloatFormat(n.length) + "</em>";
    if ("support" in n) {
      str +=
        "<br>Worst triangle-based support (p): <em>" +
        _defaultFloatFormat(n.support) +
        "</em>";
    }

    var attribute = self.attribute_node_value_by_id(
      n,
      self.colorizer["category_id"]
    );

    return str;
  }

  function node_pop_on(d) {
    if (d3.event.defaultPrevented) return;

    toggle_tooltip(
      this,
      true,
      (self._is_CDC_ ? "Individual " : "Node ") + d.id,
      node_info_string(d),
      self.container
    );
  }

  function node_pop_off(d) {
    if (d3.event.defaultPrevented) return;

    toggle_tooltip(this, false);
  }

  function edge_pop_on(e) {
    toggle_tooltip(
      this,
      true,
      e.source.id + " - " + e.target.id,
      edge_info_string(e),
      self.container
    );
  }

  function edge_pop_off(d) {
    toggle_tooltip(this, false);
  }

  /*------------ Cluster Methods ---------------*/

  /* Creates a new object that groups nodes by cluster
   * @param nodes
   * @returns clusters
   */
  function get_all_clusters(nodes) {
    var by_cluster = _.groupBy(nodes, "cluster");
    return by_cluster;
  }

  function compute_cluster_centroids(clusters) {
    for (var c in clusters) {
      var cls = clusters[c];
      cls.x = 0;
      cls.y = 0;
      if (_.has(cls, "children")) {
        cls.children.forEach(function(x) {
          cls.x += x.x;
          cls.y += x.y;
        });
        cls.x /= cls.children.length;
        cls.y /= cls.children.length;
      }
    }
  }

  function collapse_cluster(x, keep_in_q) {
    self.needs_an_update = true;
    x.collapsed = true;
    currently_displayed_objects -= self.cluster_sizes[x.cluster_id - 1] - 1;
    if (!keep_in_q) {
      var idx = open_cluster_queue.indexOf(x.cluster_id);
      if (idx >= 0) {
        open_cluster_queue.splice(idx, 1);
      }
    }
    compute_cluster_centroids([x]);
    return x.children.length;
  }

  function expand_cluster(x, copy_coord) {
    self.needs_an_update = true;
    x.collapsed = false;
    currently_displayed_objects += self.cluster_sizes[x.cluster_id - 1] - 1;
    open_cluster_queue.push(x.cluster_id);

    if (copy_coord) {
      x.children.forEach(function(n) {
        n.x = x.x + (Math.random() - 0.5) * x.children.length;
        n.y = x.y + (Math.random() - 0.5) * x.children.length;
      });
    } else {
      x.children.forEach(function(n) {
        n.x = self.width * 0.25 + (Math.random() - 0.5) * x.children.length;
        n.y = 0.25 * self.height + (Math.random() - 0.5) * x.children.length;
      });
    }
  }

  function render_binned_table(id, the_map, matrix) {
    var the_table = d3.select(self.get_ui_element_selector_by_role(id, true));
    if (the_table.empty()) {
      return;
    }

    the_table.selectAll("thead").remove();
    the_table.selectAll("tbody").remove();

    d3.select(
      self.get_ui_element_selector_by_role(id + "_enclosed", true)
    ).style("display", matrix ? null : "none");

    if (matrix) {
      var fill = self.colorizer["category"];
      var lookup = the_map(null, "lookup");

      var headers = the_table
        .append("thead")
        .append("tr")
        .selectAll("th")
        .data(
          [""].concat(
            matrix[0].map(function(d, i) {
              return lookup[i];
            })
          )
        );

      headers.enter().append("th");
      headers
        .html(function(d) {
          return "<span>&nbsp;" + d + "</span>";
        })
        .each(function(d, i) {
          if (i) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", function() {
                return fill(d);
              });
          }
        });

      if (self.show_percent_in_pairwise_table) {
        var sum = _.map(matrix, function(row) {
          return _.reduce(
            row,
            function(p, c) {
              return p + c;
            },
            0
          );
        });

        matrix = _.map(matrix, function(row, row_index) {
          return _.map(row, function(c) {
            return c / sum[row_index];
          });
        });
      }

      var rows = the_table
        .append("tbody")
        .selectAll("tr")
        .data(
          matrix.map(function(d, i) {
            return [lookup[i]].concat(d);
          })
        );

      rows.enter().append("tr");
      rows
        .selectAll("td")
        .data(function(d) {
          return d;
        })
        .enter()
        .append("td")
        .html(function(d, i) {
          return i == 0
            ? "<span>&nbsp;" + d + "</span>"
            : self.show_percent_in_pairwise_table
            ? _defaultPercentFormat(d)
            : d;
        })
        .each(function(d, i) {
          if (i == 0) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", function() {
                return fill(d);
              });
          }
        });
    }
  }

  function render_chord_diagram(id, the_map, matrix) {
    var container = d3.select(self.get_ui_element_selector_by_role(id, true));

    if (container.empty()) {
      return;
    }

    container.selectAll("svg").remove();

    d3.select(
      self.get_ui_element_selector_by_role(id + "_enclosed", true)
    ).style("display", matrix ? null : "none");

    if (matrix) {
      var lookup = the_map(null, "lookup");

      var svg = container.append("svg");

      var chord = d3.layout
        .chord()
        .padding(0.05)
        .sortSubgroups(d3.descending)
        .matrix(matrix);

      var text_offset = 20,
        width = 450,
        height = 450,
        innerRadius = Math.min(width, height - text_offset) * 0.41,
        outerRadius = innerRadius * 1.1;

      var fill = self.colorizer["category"],
        font_size = 12;

      var text_label = svg
        .append("g")
        .attr(
          "transform",
          "translate(" + width / 2 + "," + (height - text_offset) + ")"
        )
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", font_size)
        .text("");

      svg = svg
        .attr("width", width)
        .attr("height", height - text_offset)
        .append("g")
        .attr(
          "transform",
          "translate(" + width / 2 + "," + (height - text_offset) / 2 + ")"
        );

      svg
        .append("g")
        .selectAll("path")
        .data(chord.groups)
        .enter()
        .append("path")
        .style("fill", function(d) {
          return fill(lookup[d.index]);
        })
        .style("stroke", function(d) {
          return fill(lookup[d.index]);
        })
        .attr(
          "d",
          d3.svg
            .arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
        )
        .on("mouseover", fade(0.1, true))
        .on("mouseout", fade(1, false));

      svg
        .append("g")
        .attr("class", "chord")
        .selectAll("path")
        .data(chord.chords)
        .enter()
        .append("path")
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("fill", function(d) {
          return fill(d.target.index);
        })
        .style("opacity", 1);

      // Returns an event handler for fading a given chord group.
      function fade(opacity, t) {
        return function(g, i) {
          text_label.text(t ? lookup[i] : "");
          svg
            .selectAll(".chord path")
            .filter(function(d) {
              return d.source.index != i && d.target.index != i;
            })
            .transition()
            .style("opacity", opacity);
        };
      }
    }
  }

  function attribute_pairwise_distribution(id, dim, the_map, only_expanded) {
    var scan_from = only_expanded ? draw_me.edges : self.edges;
    var the_matrix = [];
    for (var i = 0; i < dim; i += 1) {
      the_matrix.push([]);
      for (var j = 0; j < dim; j += 1) {
        the_matrix[i].push(0);
      }
    }

    _.each(scan_from, function(edge) {
      //console.log (self.attribute_node_value_by_id(self.nodes[edge.source], id), self.attribute_node_value_by_id(self.nodes[edge.target], id));
      the_matrix[
        the_map(self.attribute_node_value_by_id(self.nodes[edge.source], id))
      ][
        the_map(self.attribute_node_value_by_id(self.nodes[edge.target], id))
      ] += 1;
    });
    // check if there are null values

    var haz_null = the_matrix.some(function(d, i) {
      if (i == dim - 1) {
        return d.some(function(d2) {
          return d2 > 0;
        });
      }
      return d[dim - 1] > 0;
    });
    if (!haz_null) {
      the_matrix.pop();
      for (i = 0; i < dim - 1; i += 1) {
        the_matrix[i].pop();
      }
    }

    // symmetrize the matrix

    dim = the_matrix.length;

    for (i = 0; i < dim; i += 1) {
      for (j = i; j < dim; j += 1) {
        the_matrix[i][j] += the_matrix[j][i];
        the_matrix[j][i] = the_matrix[i][j];
      }
    }

    return the_matrix;
  }

  self._aux_populate_category_fields = function(d, k) {
    d["raw_attribute_key"] = k;
    if (!("label" in d)) {
      d["label"] = k;
    }
    d.discrete = false;
    if (d["type"] == "String") {
      d.discrete = true;
      d["value_range"] = _.keys(
        _.countBy(graph_data.Nodes, function(nd) {
          return self.attribute_node_value_by_id(nd, k);
        })
      );
      d["dimension"] = d["value_range"].length;
    } else {
      if ("enum" in d) {
        d.discrete = true;
        d["value_range"] = _.clone(d["enum"]);
        if (!(_networkMissing in d["value_range"])) {
          d["value_range"].push(_networkMissing);
        }
        d["dimension"] = d["value_range"].length;
        d["no-sort"] = true;
      }
    }
    return d;
  };

  self._aux_process_category_values = function(d) {
    var values;
    if (d["no-sort"]) {
      values = d["value_range"];
    } else {
      if (d["type"] == "String") {
        values = d["value_range"].sort();

        if (d.dimension <= _maximumValuesInCategories) {
          var string_hash = function(str) {
            var hash = 5801;
            for (var ci = 0; ci < str.length; ci++) {
              var charCode = str.charCodeAt(ci);
              hash = (hash << (5 + hash)) + charCode;
            }
            return hash;
          };

          var hashed = _.map(values, string_hash);
          var available_keys = {};
          var reindexed = {};

          for (var i = 0; i < _maximumValuesInCategories; i++) {
            available_keys[i] = true;
          }

          _.each(hashed, function(value, index) {
            if (value < 0) {
              value = -value;
            }

            var first_try = value % _maximumValuesInCategories;
            if (first_try in available_keys) {
              reindexed[values[index]] = first_try;
              delete available_keys[first_try];
              return;
            }

            var second_try =
              Math.floor(value / _maximumValuesInCategories) %
              _maximumValuesInCategories;
            if (second_try in available_keys) {
              reindexed[values[index]] = second_try;
              delete available_keys[second_try];
              return;
            }

            var last_resort = parseInt(_.keys(available_keys).sort()[0]);
            reindexed[values[index]] = last_resort;
            delete available_keys[last_resort];
          });

          d["stable-ish order"] = reindexed;
        }
        //values = _.unzip(_.zip (d['value_range'], ordering_map).sort (function (a,b) { if (a[1] < b[1]) return -1; if (a[1] > b[1]) return 1; return 0}))[0]; //d['value_range'].sort ();
      } else {
        values = d["value_range"].sort();
      }
    }

    var map = new Object();

    _.each(values, function(d2, i) {
      map[d2] = i;
    });

    d["value_map"] = function(v, key) {
      return key ? (key == "lookup" ? _.invert(map) : map) : map[v];
    };
    return d;
  };

  function attribute_cluster_distribution(the_cluster, attribute_id) {
    if (attribute_id && the_cluster) {
      return the_cluster.children.map(function(d) {
        return self.attribute_node_value_by_id(d, attribute_id);
      });
    }
    return null;
  }

  function cluster_info_string(id) {
    var the_cluster = self.clusters[self.cluster_mapping[id]],
      attr_info = the_cluster["binned_attributes"];

    var str;

    if (self._is_CDC_) {
      str =
        "<strong>" +
        self.cluster_sizes[id - 1] +
        "</strong> individuals." +
        "<br>Mean links/individual <em> = " +
        _defaultFloatFormat(the_cluster.degrees["mean"]) +
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
        _defaultFloatFormat(the_cluster.degrees["mean"]) +
        "</em>" +
        "<br>Max degree <em>" +
        the_cluster.degrees["max"] +
        "</em>" +
        "<br>Clustering coefficient <em> " +
        misc.format_value(the_cluster.cc, _defaultFloatFormat) +
        "</em>";
    }

    if (attr_info) {
      attr_info.forEach(function(d) {
        str += "<br>" + d[0] + " <em>" + d[1] + "</em>";
      });
    }

    return str;
  }

  function cluster_pop_on(d) {
    toggle_tooltip(
      this,
      true,
      "Cluster " + d.cluster_id,
      cluster_info_string(d.cluster_id),
      self.container
    );
  }

  function cluster_pop_off(d) {
    toggle_tooltip(this, false);
  }

  self.expand_cluster_handler = function(d, do_update, move_out) {
    if (d.collapsed) {
      var new_nodes = self.cluster_sizes[d.cluster_id - 1] - 1;

      if (new_nodes > max_points_to_render) {
        self.warning_string = "This cluster is too large to be displayed";
      } else {
        var leftover =
          new_nodes + currently_displayed_objects - max_points_to_render;
        if (leftover > 0) {
          var k = 0;
          for (; k < open_cluster_queue.length && leftover > 0; k++) {
            var cluster =
              self.clusters[self.cluster_mapping[open_cluster_queue[k]]];
            leftover -= cluster.children.length - 1;
            collapse_cluster(cluster, true);
          }
          if (k || open_cluster_queue.length) {
            open_cluster_queue.splice(0, k);
          }
        }

        if (leftover <= 0) {
          expand_cluster(d, !move_out);
        }
      }

      if (do_update) {
        self.update(false, 0.6);
      }
    }
    return "";
  };

  function show_sequences_in_cluster(d) {
    var sequences = new Object();
    _.each(
      _extract_single_cluster(
        self.clusters[self.cluster_mapping[d.cluster]].children,
        null,
        true
      ).Edges,
      function(e) {
        _.each(e.sequences, function(s) {
          if (!(s in sequences)) {
            sequences[s] = 1;
          }
        });
      }
    );
    //console.log (_.keys(sequences));
  }

  function _compute_cluster_degrees(d) {
    var degrees = d.children.map(function(c) {
      return c.degree;
    });
    degrees.sort(d3.ascending);
    d.degrees = helpers.describe_vector(degrees);
  }

  function handle_node_label(container, node) {
    node.show_label = !node.show_label;
    self.update(true);
  }

  function collapse_cluster_handler(d, do_update) {
    collapse_cluster(self.clusters[self.cluster_mapping[d.cluster]]);
    if (do_update) {
      self.update(false, 0.4);
    }
  }

  function center_cluster_handler(d) {
    d.x = self.width / 2;
    d.y = self.height / 2;
    self.update(false, 0.4);
  }

  function cluster_box_size(c) {
    return 8 * Math.sqrt(c.children.length);
  }

  self.extract_network_time_series = function(
    time_attr,
    other_attributes,
    node_filter
  ) {
    var use_these_nodes = node_filter
      ? _.filter(self.nodes, node_filter)
      : self.nodes;

    var result = _.map(use_these_nodes, function(node) {
      var series = {
        time: self.attribute_node_value_by_id(node, time_attr)
      };
      if (other_attributes) {
        _.each(other_attributes, function(attr, key) {
          series[attr] = self.attribute_node_value_by_id(node, key);
        });
      }
      return series;
    });

    result.sort(function(a, b) {
      if (a.time < b.time) return -1;
      if (a.time == b.time) return 0;
      return 1;
    });

    return result;
  };

  self.expand_some_clusters = function(subset) {
    subset = subset || self.clusters;
    subset.forEach(function(x) {
      if (!x.is_hidden) {
        self.expand_cluster_handler(x, false);
      }
    });
    self.update();
  };

  self.select_some_clusters = function(condition) {
    return self.clusters.filter(function(c, i) {
      return _.some(c.children, function(n) {
        return condition(n);
      });
    });
  };

  self.collapse_some_clusters = function(subset) {
    subset = subset || self.clusters;
    subset.forEach(function(x) {
      if (!x.collapsed) collapse_cluster(x);
    });
    self.update();
  };

  self.toggle_hxb2 = function() {
    self.hide_hxb2 = !self.hide_hxb2;
    self.update();
  };

  self.toggle_diff = function() {
    self.showing_diff = !self.showing_diff;
    if (self.showing_diff) {
      self.cluster_filtering_functions["new"] = self.filter_if_added;
    } else {
      delete self.cluster_filtering_functions["new"];
    }
    self.update();
  };

  self.toggle_highlight_unsupported_edges = function() {
    self.highlight_unsuppored_edges = !self.highlight_unsuppored_edges;
    self.update();
  };

  self.toggle_time_filter = function() {
    if (self.using_time_filter) {
      self.using_time_filter = null;
    } else {
      self.using_time_filter = new Date();
      self.using_time_filter.setFullYear(
        self.using_time_filter.getFullYear() - 1
      );
    }

    if (self.using_time_filter) {
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    } else {
      delete self.cluster_filtering_functions["recent"];
    }
    self.update();
  };

  function stratify(array) {
    if (array) {
      var dict = {},
        stratified = [];

      array.forEach(function(d) {
        if (d in dict) {
          dict[d] += 1;
        } else {
          dict[d] = 1;
        }
      });
      for (var uv in dict) {
        stratified.push([uv, dict[uv]]);
      }
      return stratified.sort(function(a, b) {
        return a[0] - b[0];
      });
    }
    return array;
  }

  self.is_edge_injected = function(e) {
    //console.log (e, "edge_type" in e);
    return "edge_type" in e;
  };

  self._social_view_options = function(labeled_links, shown_types, edge_typer) {
    edge_typer =
      edge_typer ||
      function(e) {
        return _.has(e, "edge_type") ? e["edge_type"] : "";
      };

    return {
      "edge-styler": function(element, d, network) {
        var e_type = edge_typer(d);
        if (e_type != "") {
          d3.select(element).style(
            "stroke",
            network._edge_colorizer(edge_typer(d))
          ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));

          d.is_hidden = !network.shown_types[e_type];
        } else {
          d.is_hidden = !network.shown_types[""];
        }
        d3.select(element).style("stroke-width", "5px");
      },

      init_code: function(network) {
        function style_edge(type) {
          this.style("stroke-width", "5px");
          if (type.length) {
            this.style("stroke", network._edge_colorizer(type)); //.style ("stroke-dasharray", network._edge_dasher (type));
          } else {
            this.classed("link", true);
            var def_color = this.style("stroke");
            this.classed("link", null);
            this.style("stroke", def_color);
          }
        }

        var edge_types = _.keys(shown_types);
        edge_types.sort();

        network._edge_colorizer = d3.scale
          .ordinal()
          .range(_networkCategoricalBase)
          .domain(edge_types);
        //network._edge_dasher   = _edge_dasher;
        network.shown_types = _.clone(shown_types);
        network.edge_legend = {
          caption: "Network links",
          types: {}
        };

        _.each(network.shown_types, function(ignore, t) {
          if (t.length) {
            network.edge_legend.types[t] = _.partial(style_edge, t);
          } else {
            network.edge_legend.types["Molecular links"] = _.partial(
              style_edge,
              t
            );
          }
        });
      },

      extra_menu: {
        title: "Additional options",
        items: _.map(labeled_links, function(edge_class) {
          return [
            function(network, element) {
              function toggle_element() {
                network.shown_types[edge_class] = !network.shown_types[
                  edge_class
                ];
                checkbox.attr(
                  "checked",
                  network.shown_types[edge_class] ? "" : null
                );
                network.update(true);
              }

              var link;

              if (edge_class.length) {
                link = element
                  .append("a")
                  .text(edge_class + " links")
                  .style("color", network._edge_colorizer(edge_class))
                  .on("click", toggle_element);
              } else {
                link = element
                  .append("a")
                  .text("Molecular links")
                  .on("click", toggle_element);
              }
              var checkbox = link
                .append("input")
                .attr("type", "checkbox")
                .attr("checked", "");
            }
          ];
        })
      }
    };
  };

  /*------------ Node injection (social network) ---------------*/

  self.load_nodes_edges = function(
    nodes_and_attributes,
    index_id,
    edges_and_attributes,
    annotation
  ) {
    annotation = annotation || "Social";
    /**
        1. Scan the list of nodes for
            a. Nodes not present in the existing network
            b. Attribute names
            c. Attribute values

        2. Scan the list of edges for
            a. Edges not present in the existing network
            b. Attribute names
            c. Attribute values
     */

    var new_nodes = [];
    var edge_types_dict = {};
    var existing_nodes = 0;

    try {
      var injected_nodes = {};
      var node_attributes = {};
      var existing_network_nodes = {};
      var node_name_2_id = {};

      _.each(self.json.Nodes, (n, i) => {
        existing_network_nodes[n.id] = n;
        node_name_2_id[n.id] = i;
      });

      const handle_node_attributes = (target, n) => {
        _.each(n, function(attribute_value, attribute_key) {
          if (attribute_key != index_id) {
            inject_attribute_node_value_by_id(
              target,
              attribute_key,
              attribute_value
            );
          }
        });
      };

      const inject_new_node = (node_name, n) => {
        let new_node = {
          node_class: "injected",
          node_annotation: annotation,
          attributes: [],
          degree: 0
        };
        new_node[_networkNodeAttributeID] = {};
        new_node.id = node_name;
        handle_node_attributes(new_node, n);
        node_name_2_id[node_name] = self.json.Nodes.length;
        self.json.Nodes.push(new_node);
        new_nodes.push(new_node);
      };

      if (nodes_and_attributes && nodes_and_attributes.length) {
        if (!(index_id in nodes_and_attributes[0])) {
          throw index_id +
            " is not one of the attributes in the imported node records";
        }

        _.each(nodes_and_attributes[0], function(r, i) {
          if (i != index_id) {
            var attribute_definition = {
              label: i,
              type: "String",
              annotation: annotation
            };
            self.inject_attribute_description(i, attribute_definition);
          }
        });

        _.each(nodes_and_attributes, function(n) {
          if (n[index_id] in existing_network_nodes) {
            handle_node_attributes(existing_network_nodes[n[index_id]], n);
            existing_nodes++;
          } else {
            inject_new_node(n[index_id], n);
          }
        });
      }

      if (edges_and_attributes && edges_and_attributes.length) {
        const auto_inject = !(
          nodes_and_attributes && nodes_and_attributes.length
        );

        if (auto_inject) {
          _.map(existing_network_nodes, e => false);
        }

        _.each(edges_and_attributes, function(e) {
          try {
            if ("Index" in e && "Partner" in e && "Contact" in e) {
              if (!(e["Index"] in node_name_2_id)) {
                if (auto_inject) {
                  inject_new_node(e["Index"], []);
                } else {
                  throw "Invalid index node";
                }
              } else {
                if (auto_inject) {
                  existing_network_nodes[e["Index"]] = true;
                }
              }

              if (!(e["Partner"] in node_name_2_id)) {
                if (auto_inject) {
                  inject_new_node(e["Partner"], []);
                } else {
                  throw "Invalid partner node";
                }
              } else {
                if (auto_inject) {
                  existing_network_nodes[e["Partner"]] = true;
                }
              }

              edge_types_dict[e["Contact"]] =
                (edge_types_dict[e["Contact"]]
                  ? edge_types_dict[e["Contact"]]
                  : 0) + 1;

              var new_edge = {
                source: node_name_2_id[e["Index"]],
                target: node_name_2_id[e["Partner"]],
                edge_type: e["Contact"],
                length: 0.005,
                directed: true
              };

              self.json.Edges.push(new_edge);
            } else {
              throw "Missing required attribute";
            }
          } catch (err) {
            throw "Invalid edge specification ( " +
              err +
              ") " +
              JSON.stringify(e);
          }
        });

        if (auto_inject) {
          existing_nodes = _.size(_.filter(existing_network_nodes, e => e));
        }

        self._aux_populate_category_menus();

        self.update_clusters_with_injected_nodes(null, null, annotation);
        if (self._is_CDC_) {
          self.draw_extended_node_table(self.json.Nodes);
        } else {
          self.draw_node_table(self.extra_node_table_columns, self.json.Nodes);
        }
        if (!self.extra_cluster_table_columns) {
          self.extra_cluster_table_columns = [];
        }
        if (!self.extra_subcluster_table_columns) {
          self.extra_subcluster_table_columns = [];
        }

        var edge_types_by_cluster = {};
        _.each(self.json.Edges, function(e) {
          try {
            var edge_clusters = _.union(
              _.keys(self.json.Nodes[e.source].extended_cluster),
              _.keys(self.json.Nodes[e.target].extended_cluster)
            );
            _.each(edge_clusters, function(c) {
              if (!(c in edge_types_by_cluster)) {
                edge_types_by_cluster[c] = {};
              }
              if (e.edge_type) {
                edge_types_by_cluster[c][e.edge_type] = 1;
              }
            });
          } catch (err) {
            console.log(err);
          }
        });

        var edge_types_by_cluster_sorted = {};
        _.each(edge_types_by_cluster, function(v, c) {
          var my_keys = _.keys(v);
          my_keys.sort();
          edge_types_by_cluster_sorted[c] = my_keys;
        });

        /*var _edge_dasher = d3.scale
          .ordinal()
          .range(_networkCategoricalDashPatterns)
          .domain(edge_types);
        */

        var _social_view_handler = function(
          id,
          node_filter,
          labeled_links,
          shown_types,
          title,
          e
        ) {
          self.open_exclusive_tab_view(
            id,
            node_filter,
            title,
            self._social_view_options(labeled_links, shown_types),
            true
          );
        };

        var _injected_column_subcluster_button_handler = function(
          payload,
          edge_filter,
          title,
          e
        ) {
          function edge_filter_for_subclusters(edge) {
            return (
              self.is_edge_injected(edge) ||
              edge.length <= self.subcluster_threshold
            );
          }

          var subcluster_edges = [];

          var direct_links_only = hivtrace_cluster_depthwise_traversal(
            self.json.Nodes,
            self.json.Edges,
            edge_filter || edge_filter_for_subclusters,
            //null,
            subcluster_edges,
            payload.children
          );

          var labeled_links = {},
            shown_types = {};
          _.each(subcluster_edges[0], function(e) {
            if (e.edge_type) {
              labeled_links[e.edge_type] = 1;
              shown_types[e.edge_type] = 1;
            }
          });

          labeled_links = _.keys(labeled_links);
          labeled_links.sort();
          labeled_links.push("");
          shown_types[""] = 1;

          title =
            title ||
            function(id) {
              return (
                "Subcluster " + payload.cluster_id + "[+ " + annotation + "]"
              );
            };

          var cv = self.view_subcluster(
            payload,
            direct_links_only[0],
            title(payload.cluster_id),
            self._social_view_options(labeled_links, shown_types),
            edge_filter_for_subclusters,
            true
          );
          //cv.annotate_priority_clusters(_networkCDCDateField, 36, 12);
          //cv.handle_attribute_categorical("recent_rapid");
          cv._refresh_subcluster_view(self.today || new Date());
        };

        var injected_column_subcluster = [
          {
            description: {
              value: annotation + " network",
              help: "View subclusters with " + annotation + " data"
            },

            generator: function(cluster) {
              return {
                value: cluster,
                callback: function(element, payload) {
                  var this_cell = d3.select(element);
                  this_cell
                    .append("button")
                    .classed("btn btn-primary btn-xs pull-right", true)
                    .style("margin-left", "1em")
                    .text("Complete " + annotation)
                    .on(
                      "click",
                      _.partial(
                        _injected_column_subcluster_button_handler,
                        payload,
                        null,
                        null
                      )
                    );

                  var node_ids = {};

                  _.each(payload.children, function(n) {
                    node_ids[n.id] = 1;
                  });

                  this_cell
                    .append("button")
                    .classed("btn btn-primary btn-xs pull-right", true)
                    .text("Directly linked " + annotation)
                    .on(
                      "click",
                      _.partial(
                        _injected_column_subcluster_button_handler,
                        payload,
                        function(edge) {
                          return (
                            self.json.Nodes[edge.target].id in node_ids ||
                            self.json.Nodes[edge.source].id in node_ids
                          );
                        },
                        function(id) {
                          return (
                            "Subcluster " +
                            payload.cluster_id +
                            "[+ direct  " +
                            annotation +
                            "]"
                          );
                        }
                      )
                    );
                }
              };
            }
          }
        ];

        var injected_column = [
          {
            description: {
              value: annotation + " network",
              sort: function(c) {
                return c.value[0];
              },
              help: "Nodes added and clusters merged through " + annotation
            },
            generator: function(cluster) {
              return {
                value: [
                  cluster.injected[annotation],
                  cluster.linked_clusters,
                  cluster.cluster_id
                ],

                callback: function(element, payload) {
                  var this_cell = d3.select(element);
                  this_cell.text(+payload[0] + " " + annotation + " nodes. ");
                  var other_clusters = [];
                  if (payload[1]) {
                    other_clusters = _.without(_.keys(payload[1]), payload[2]);
                    if (other_clusters.length) {
                      other_clusters.sort();
                      this_cell
                        .append("span")
                        .classed("label label-info", true)
                        .text(
                          "Bridges to " + other_clusters.length + " clusters"
                        )
                        .attr("title", other_clusters.join(", "));
                    }
                  }

                  var labeled_links = _.clone(
                    edge_types_by_cluster_sorted[payload[2]]
                  );

                  if (
                    payload[0] > 0 ||
                    other_clusters.length ||
                    (edge_types_by_cluster_sorted[payload[2]] &&
                      labeled_links.length)
                  ) {
                    labeled_links.push("");

                    var shown_types = {};
                    _.each(labeled_links, function(t) {
                      shown_types[t] = 1;
                    });

                    this_cell
                      .append("button")
                      .classed("btn btn-primary btn-xs pull-right", true)
                      .text("Directly linked " + annotation)
                      .style("margin-left", "1em")
                      .on("click", function(e) {
                        var directly_linked_ids = {};
                        var node_ids = {};

                        _.each(cluster.children, function(n) {
                          node_ids[n.id] = 1;
                        });

                        var direct_links_only = hivtrace_cluster_depthwise_traversal(
                          self.json.Nodes,
                          self.json.Edges,
                          function(edge) {
                            return (
                              self.json.Nodes[edge.target].id in node_ids ||
                              self.json.Nodes[edge.source].id in node_ids
                            );
                          },
                          false,
                          cluster.children
                        );

                        _.each(direct_links_only[0], function(n) {
                          directly_linked_ids[n.id] = true;
                        });

                        //console.log (directly_linked_ids);

                        _social_view_handler(
                          payload[2],
                          function(n) {
                            return n.id in directly_linked_ids;
                          },
                          labeled_links,
                          shown_types,
                          function(id) {
                            return (
                              "Cluster " + id + "[+ direct " + annotation + "]"
                            );
                          },
                          e
                        );
                      });

                    this_cell
                      .append("button")
                      .classed("btn btn-primary btn-xs pull-right", true)
                      .text("Complete " + annotation)
                      .on(
                        "click",
                        _.partial(
                          _social_view_handler,
                          payload[2],
                          function(n) {
                            return (
                              n.extended_cluster &&
                              payload[2] in n.extended_cluster
                            );
                          },
                          labeled_links,
                          shown_types,
                          function(id) {
                            return "Cluster " + id + "[+ " + annotation + "]";
                          }
                        )
                      );
                  }
                }
              };
            }
          }
        ];

        if (self.extra_cluster_table_columns) {
          self.extra_cluster_table_columns = self.extra_cluster_table_columns.concat(
            injected_column
          );
        } else {
          self.extra_cluster_table_columns = injected_column;
        }

        self.draw_cluster_table(
          self.extra_cluster_table_columns,
          self.cluster_table
        );

        if (self.subcluster_table) {
          if (self.extra_subcluster_table_columns) {
            self.extra_subcluster_table_columns = self.extra_subcluster_table_columns.concat(
              injected_column_subcluster
            );
          } else {
            self.extra_subcluster_table_columns = injected_column_subcluster;
          }
          self.draw_cluster_table(
            self.extra_subcluster_table_columns,
            self.subcluster_table,
            { subclusters: true, "no-clusters": true }
          );
        }
      }
    } catch (e) {
      throw e;
    }

    return {
      nodes: new_nodes,
      existing_nodes: existing_nodes,
      edges: edge_types_dict
    };
  };

  self.update_clusters_with_injected_nodes = function(
    node_filter,
    edge_filter,
    annotation
  ) {
    var cluster_report = {};

    try {
      node_filter =
        node_filter ||
        function() {
          return true;
        };
      edge_filter =
        edge_filter ||
        function() {
          return true;
        };

      var split_clusters = {};
      var node_id_to_local_cluster = {};

      var recomputed_clusters = hivtrace_cluster_depthwise_traversal(
        _.filter(self.json.Nodes, node_filter),
        self.json.Edges,
        null,
        false
      );

      _.each(recomputed_clusters, function(c) {
        var cluster_ids = {};
        var injected_count = 0;

        _.each(c, function(n) {
          cluster_ids[n.cluster] = 1;
          injected_count += n.cluster ? 0 : 1;
        });

        //var cluster_ids = _.keys (cluster_ids);

        //console.log (cluster_ids.length);

        // count how many "injected" nodes are there in the new cluster

        if (injected_count) {
          delete cluster_ids[undefined];
        }

        var cluster_count = _.keys(cluster_ids).length;

        _.each(c, function(n) {
          if ("extended_cluster" in n) {
            _.extend(n["extended_cluster"], cluster_ids);
          } else {
            n["extended_cluster"] = cluster_ids;
          }
        });

        _.each(cluster_ids, function(c, k) {
          var existing_cluster = self.clusters[self.cluster_mapping[k]];
          if (!existing_cluster.injected) {
            existing_cluster.injected = {};
          }
          existing_cluster.injected[annotation] = injected_count;
          if ("linked_clusters" in existing_cluster) {
            _.extend(existing_cluster["linked_clusters"], cluster_ids);
          } else {
            existing_cluster["linked_clusters"] = cluster_ids;
          }
        });
      });
    } catch (err) {
      console.log(err);
      throw err;
    }

    return recomputed_clusters;
  };
  /*------------ Event Functions ---------------*/
  function toggle_tooltip(element, turn_on, title, tag, container) {
    //if (d3.event.defaultPrevented) return;
    if (!element) {
      return;
    }

    if (turn_on && !element.tooltip) {
      // check to see if there are any other tooltips shown
      $("[role='tooltip']").each(function(d) {
        $(this).remove();
      });

      var this_box = $(element);
      var this_data = d3.select(element).datum();
      element.tooltip = this_box.tooltip({
        title: title + "<br>" + tag,
        html: true,
        container: container ? container : "body"
      });

      //this_data.fixed = true;

      _.delay(_.bind(element.tooltip.tooltip, element.tooltip), 500, "show");
    } else {
      if (turn_on == false && element.tooltip) {
        element.tooltip.tooltip("destroy");
        element.tooltip = undefined;
      }
    }
  }

  /*------------ Init code ---------------*/

  var l_scale = 5000, // link scale
    graph_data = self.json, // the raw JSON network object
    max_points_to_render = 2048,
    singletons = 0,
    open_cluster_queue = [],
    currently_displayed_objects,
    gravity_scale = d3.scale
      .pow()
      .exponent(0.5)
      .domain([1, 100000])
      .range([0.1, 0.15]),
    link_scale = d3.scale
      .pow()
      .exponent(1.25)
      .clamp(true)
      .domain([0, 0.1]);

  /*------------ D3 globals and SVG elements ---------------*/

  var network_layout = d3.layout
    .force()
    .on("tick", tick)
    .charge(function(d) {
      if (self.showing_on_map) {
        return -60;
      }
      if (d.cluster_id)
        return (
          self.charge_correction * (-15 - 5 * Math.pow(d.children.length, 0.4))
        );
      return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
    })
    .linkDistance(function(d) {
      return link_scale(d.length) * l_scale * 0.2; //Math.max(d.length, 0.005) * l_scale * 10;
    })
    .linkStrength(function(d) {
      if (self.showing_on_map) {
        return 0.01;
      }
      if (d.support !== undefined) {
        return 0.75 - 0.5 * d.support;
      }
      return 1;
    })
    .chargeDistance(l_scale * 0.1)
    .gravity(self.showing_on_map ? 0 : gravity_scale(json.Nodes.length))
    .friction(0.25);

  d3.select(self.container)
    .selectAll(".my_progress")
    .style("display", "none");
  d3.select(self.container)
    .selectAll("svg")
    .remove();
  self.node_table.selectAll("*").remove();
  self.cluster_table.selectAll("*").remove();

  self.network_svg = d3
    .select(self.container)
    .append("svg:svg")
    //.style ("border", "solid black 1px")
    .attr("id", self.dom_prefix + "-network-svg")
    .attr("width", self.width + self.margin.left + self.margin.right)
    .attr("height", self.height + self.margin.top + self.margin.bottom);

  self.network_cluster_dynamics = null;

  //.append("g")
  // .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

  var legend_drag = d3.behavior
      .drag()
      .on("dragstart", function() {
        d3.event.sourceEvent.stopPropagation();
      })
      .on("drag", function(d) {
        d3.select(this).attr(
          "transform",
          "translate(" + [d3.event.x, d3.event.y] + ")"
        );
      }),
    legend_vertical_offset;

  self.showing_on_map
    ? (legend_vertical_offset = 100)
    : (legend_vertical_offset = 5);
  self.legend_svg = self.network_svg
    .append("g")
    .attr("transform", "translate(5," + legend_vertical_offset + ")")
    .call(legend_drag);

  /*
    self.network_svg
    .append("defs")
    .append("marker")
    .attr("id", self.dom_prefix + "_arrowhead")
    .attr("refX", 9)
    .attr("refY", 2)
    .attr("markerWidth", 6)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .attr("stroke", "#666666")
    //.attr("markerUnits", "userSpaceOnUse")
    .attr("fill", "#AAAAAA")
    .append("path")
    .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

*/
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
    .attr("d", "M 0,0 L 2,6 L 0,12 L14,6 Z"); //this is actual shape for arrowhead

  change_window_size();

  initial_json_load();

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
        _.filter(self.clusters, function(c) {
          return options["expand"].indexOf(c.cluster_id) >= 0;
        })
      );
    }

    if (self.showing_diff) {
      self.handle_attribute_categorical(
        self._is_CDC_ && self.has_network_attribute("recent_rapid")
          ? "recent_rapid"
          : "_newly_added"
      );
    } else {
    }
  }

  self.draw_attribute_labels();

  if (options && options["priority-sets-url"]) {
    self.load_priority_sets(options["priority-sets-url"]);
  }

  d3.select(self.container)
    .selectAll(".my_progress")
    .style("display", "none");
  network_layout.start();

  return self;
};

var hivtrace_cluster_graph_summary = function(graph, tag) {
  var summary_table = d3.select(tag);

  summary_table = d3.select(tag).select("tbody");
  if (summary_table.empty()) {
    summary_table = d3.select(tag).append("tbody");
  }

  var table_data = [];

  if (!summary_table.empty()) {
    _.each(graph["Network Summary"], function(value, key) {
      if (self._is_CDC_ && key == "Edges") {
        key = "Links";
      }
      if (_.isNumber(value)) {
        table_data.push([
          __("statistics")[key.replace(/ /g, "_").toLowerCase()],
          value
        ]);
      }
    });
  }

  var degrees = [];
  _.each(graph["Degrees"], function(value, index) {
    for (var k = 0; k < value; k++) {
      degrees.push(index + 1);
    }
  });
  degrees = helpers.describe_vector(degrees);
  table_data.push([__("statistics")["links_per_node"], ""]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
    _defaultFloatFormat(degrees["mean"])
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    _defaultFloatFormat(degrees["median"])
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
    degrees["min"] + " - " + degrees["max"]
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "</i>",
    degrees["Q1"] + " - " + degrees["Q3"]
  ]);

  degrees = helpers.describe_vector(graph["Cluster sizes"]);
  table_data.push([__("statistics")["cluster_sizes"], ""]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
    _defaultFloatFormat(degrees["mean"])
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
    _defaultFloatFormat(degrees["median"])
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
    degrees["min"] + " - " + degrees["max"]
  ]);
  table_data.push([
    "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "range</i>",
    degrees["Q1"] + " - " + degrees["Q3"]
  ]);

  if (self._is_CDC_) {
    degrees = helpers.describe_vector(
      _.map(graph["Edges"], function(e) {
        return e.length;
      })
    );
    table_data.push(["Genetic distances (links only)", ""]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["mean"] + "</i>",
      _defaultPercentFormat(degrees["mean"])
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["median"] + "</i>",
      _defaultPercentFormat(degrees["median"])
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["range"] + "</i>",
      _defaultPercentFormat(degrees["min"]) +
        " - " +
        _defaultPercentFormat(degrees["max"])
    ]);
    table_data.push([
      "&nbsp;&nbsp;<i>" + __("statistics")["interquartile_range"] + "range</i>",
      _defaultPercentFormat(degrees["Q1"]) +
        " - " +
        _defaultPercentFormat(degrees["Q3"])
    ]);
  }

  var rows = summary_table.selectAll("tr").data(table_data);
  rows.enter().append("tr");
  rows.exit().remove();
  var columns = rows.selectAll("td").data(function(d) {
    return d;
  });
  columns.enter().append("td");
  columns.exit();
  columns.html(function(d) {
    return d;
  });
};

module.exports.computeCluster = hivtrace_cluster_depthwise_traversal;
module.exports.clusterNetwork = hivtrace_cluster_network_graph;
module.exports.graphSummary = hivtrace_cluster_graph_summary;
