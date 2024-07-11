import * as d3 from "d3";
import _ from "underscore";
import jsConvert from "js-convert-case";
import * as topojson from "topojson";
import * as helpers from "./helpers.js";
import * as colorPicker from "./colorPicker.js";
import * as scatterPlot from "./scatterplot.js";
import * as utils from "./utils.js";
import * as tables from "./tables.js";
import * as timeDateUtil from "./timeDateUtil.js";
import * as nodesTab from "./nodesTab.js";
import * as clustersOfInterest from "./clustersOfInterest.js";
import { hivtrace_cluster_depthwise_traversal } from "./misc";
import * as misc from "./misc";

const _networkSubclusterSeparator = ".";
const _networkGraphAttrbuteID = "patient_attribute_schema";
const _networkNodeAttributeID = "patient_attributes";
export const _networkMissing = __("general")["missing"];
const _networkReducedValue = "Different (other) value";
const _networkMissingOpacity = "0.1";
const _networkMissingColor = "#999";
const _networkContinuousColorStops = 9;
export const _networkWarnExecutiveMode =
  "This feature is not available in the executive mode.";

const _networkShapeOrdering = [
  "circle",
  "square",
  "hexagon",
  "diamond",
  "cross",
  "octagon",
  "ellipse",
  "pentagon",
];

const _defaultFloatFormat = d3.format(",.2r");
export const _defaultPercentFormat = d3.format(",.3p");
export const _defaultPercentFormatShort = d3.format(".2p");
export const _defaultDateFormats = [d3.time.format.iso];

export const _defaultDateViewFormatMMDDYYY = d3.time.format("%m%d%Y");
export const _defaultDateViewFormat = d3.time.format("%b %d, %Y");
const _defaultDateViewFormatShort = d3.time.format("%B %Y");
export const _defaultDateViewFormatSlider = d3.time.format("%Y-%m-%d");
const _networkDotFormatPadder = d3.format("08d");
const _defaultDateViewFormatExport = d3.time.format("%m/%d/%Y");
const _defaultDateViewFormatClusterCreate = d3.time.format("%Y%m");

const _networkCategoricalBase = [
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
  "#b15928",
];

const _networkEdgeColorBase = ["#000000", "#aaaaaa"];

const _networkCategorical = [];

_.each([0, -0.8], (k) => {
  _.each(_networkCategoricalBase, (s) => {
    _networkCategorical.push(d3.rgb(s).darker(k).toString());
  });
});

const _maximumValuesInCategories = _networkCategorical.length;

const _networkSequentialColor = {
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
    "#b10026",
  ],
  8: [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#b10026",
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
    "#800026",
  ],
};

/*
Sex/Transmission Risk

IDU= blue
Heterosexual= green
Perinatal, child= red
MMSC= orange
Other= grey (leave as-is)*/

const _networkPresetColorSchemes = {
  sex_trans: {
    "MSM-Male": "#1f78b4",
    "MMSC-Male": "#FFBF00",
    "MSM-Unknown sex": "#1f78b4",
    "MMSC-Unknown sex": "#FFBF00",
    "Heterosexual Contact-Male": "#AAFF00",
    "Heterosexual Contact-Female": "#AAFF00",
    "Heterosexual Contact-Unknown sex": "#AAFF00",
    "IDU-Male": "#0096FF",
    "MSM & IDU-Male": "#33a02c",
    "MMSC & IDU-Unknown sex": "#0096FF",
    "MMSC & IDU-Male": "#FFBF00",
    "IDU-Female": "#0096FF",
    "IDU-Unknown sex": "#0096FF",
    "Other/Unknown-Male": "#636363",
    "Other/Unknown-Female": "#636363",
    "Other-Male": "#636363",
    "Other-Female": "#636363",
    Missing: "#636363",
    "": "#636363",
    "Other/Unknown-Unknown sex": "#636363",
    Perinatal: "#D2042D",
    "Other/Unknown-Child": "#D2042D",
    "Other-Child": "#D2042D",
  },

  race_cat: {
    Asian: "#1f77b4",
    "Black/African American": "#bcbd22",
    "Hispanic/Latino": "#9467bd",
    "American Indian/Alaska Native": "#2ca02c",
    "Native Hawaiian/Other Pacific Islander": "#17becf",
    "Multiple Races": "#e377c2",
    Multiracial: "#e377c2",
    "Multiple races": "#e377c2",
    "Unknown race": "#999",
    Missing: "#999",
    missing: "#999",
    White: "#d62728",
  },
  sex_birth: {
    Male: "#FF6700",
    Female: "#50c878",
    Unknown: "#999",
  },
  birth_sex: {
    Male: "#FF6700",
    Female: "#50c878",
    Unknown: "#999",
  },

  gender_identity: {
    Woman: "#AAFF00",
    "Transgender woman": "#228B22",
    Man: "#FFBF00",
    "Transgender man": "#FF5F1F",
    "Declined to answer": "#FAFA33",
    "Additional gender identity": "#D2042D",
    Missing: "#999",
    Unknown: "#999",
  },
};

const _networkPresetShapeSchemes = {
  birth_sex: {
    Male: "square",
    Female: "ellipse",
    Missing: "diamond",
    missing: "diamond",
    Unknown: "diamond",
  },
  sex_birth: {
    Male: "square",
    Female: "ellipse",
    Missing: "diamond",
    missing: "diamond",
    Unknown: "diamond",
  },
  gender_identity: {
    Man: "square",
    Woman: "ellipse",
    "Transgender man": "hexagon",
    "Transgender woman": "circle",
    "Additional gender identity": "pentagon",
    Unknown: "diamond",
    "Declined to answer": "diamond",
  },
  race_cat: {
    Asian: "hexagon",
    "Black/African American": "square",
    "Hispanic/Latino": "triangle",
    "American Indian/Alaska Native": "pentagon",
    "Native Hawaiian/Other Pacific Islander": "octagon",
    "Multiple Races": "diamond",
    "Unknown race": "diamond",
    Missing: "diamond",
    missing: "diamond",
    White: "ellipse",
  },
  current_gender: {
    Male: "square",
    Female: "ellipse",
    "Transgender-Male to Female": "hexagon",
    "Transgender-Female to Male": "pentagon",
    "Additional Gender Identity": "diamond",
    Unknown: "diamond",
    Missing: "diamond",
    missing: "diamond",
  },
};

export const _cdcPrioritySetKind = [
  "01 state/local molecular cluster analysis",
  "02 national molecular cluster analysis",
  "03 state/local time-space cluster analysis",
  "04 national time-space cluster analysis",
  "05 provider notification",
  "06 partner services notification",
  "07 other",
];

export const _cdcTrackingOptions = [
  "01. Add cases diagnosed in the past 3 years and linked at 0.5% to a member in this cluster of interest",
  "02. Add cases (regardless of HIV diagnosis date) linked at 0.5% to a member in this cluster of interest",
  "03. Add cases diagnosed in the past 3 years and linked at 1.5% to a member in this cluster of interest",
  "04. Add cases (regardless of HIV diagnosis date) linked at 1.5% to a member in this cluster of interest",
  "05. Do not add cases to this cluster of interest. I do not want to monitor growth in this cluster of interest over time.",
];

export const _cdcConciseTrackingOptions = {};
_cdcConciseTrackingOptions[_cdcTrackingOptions[0]] = "3 years, 0.5% distance";
_cdcConciseTrackingOptions[_cdcTrackingOptions[1]] = "0.5% distance";
_cdcConciseTrackingOptions[_cdcTrackingOptions[2]] = "3 years, 1.5% distance";
_cdcConciseTrackingOptions[_cdcTrackingOptions[3]] = "1.5% distance";
_cdcConciseTrackingOptions[_cdcTrackingOptions[4]] = "None";

const _cdcTrackingOptionsFilter = {};
_cdcTrackingOptionsFilter[_cdcTrackingOptions[0]] = (e, d) => e.length < 0.005;
_cdcTrackingOptionsFilter[_cdcTrackingOptions[1]] = (e, d) => e.length < 0.005;
_cdcTrackingOptionsFilter[_cdcTrackingOptions[2]] = (e, d) => e.length < 0.015;
_cdcTrackingOptionsFilter[_cdcTrackingOptions[3]] = (e, d) => e.length < 0.015;

const _cdcTrackingOptionsCutoff = {};
_cdcTrackingOptionsCutoff[_cdcTrackingOptions[0]] = 36;
_cdcTrackingOptionsCutoff[_cdcTrackingOptions[1]] = 100000;
_cdcTrackingOptionsCutoff[_cdcTrackingOptions[2]] = 36;
_cdcTrackingOptionsCutoff[_cdcTrackingOptions[3]] = 100000;

export const _cdcTrackingOptionsDefault = _cdcTrackingOptions[0];
export const _cdcTrackingNone = _cdcTrackingOptions[4];

export const _cdcCreatedBySystem = "System";
export const _cdcCreatedByManual = "Manual";

const _cdcPrioritySetKindAutoExpand = {
  "01 state/local molecular cluster analysis": true,
};

export const _cdcPrioritySetNodeKind = [
  "01 through analysis/notification",
  "02 through investigation",
];

const _cdcPOImember = "Ever in national priority clusterOI?";

const _cdcJurisdictionCodes = {
  alabama: "al",
  alaska: "ak",
  americansamoa: "as",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  delaware: "de",
  districtofcolumbia: "dc",
  federatedstatesofmicronesia: "fm",
  florida: "fl",
  georgia: "ga",
  guam: "gu",
  hawaii: "hi",
  houston: "hx",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  marshallislands: "mh",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  newhampshire: "nh",
  newjersey: "nj",
  newmexico: "nm",
  newyorkstate: "ny",
  nyc: "nx",
  northcarolina: "nc",
  north_dakota: "nd",
  northernmarianaislands: "mp",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  palau: "pw",
  pennsylvania: "pa",
  puertorico: "pr",
  rhodeisland: "ri",
  southcarolina: "sc",
  southdakota: "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  virginislands: "vi",
  virginia: "va",
  washington: "wa",
  washingtondc: "dc",
  westvirginia: "wv",
  wisconsin: "wi",
  wyoming: "wy",
  chicago: "cx",
  philadelphia: "px",
  losangeles: "lx",
  sanfrancisco: "sx",
  republicofpalau: "pw",
  "u.s.virginislands": "vi",
};

const _cdcJurisdictionLowMorbidity = new Set([
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
  "wyoming",
]);

const _cdcPrioritySetKindAutomaticCreation = _cdcPrioritySetKind[0];
export const _cdcPrioritySetDefaultNodeKind = _cdcPrioritySetNodeKind[0];

// Constants for the map.

var hivtrace_date_or_na_if_missing = (date, formatter) => {
  formatter = formatter || _defaultDateViewFormatExport;
  if (date) {
    return formatter(date);
  }
  return "N/A";
};

const _networkUpperBoundOnDate = new Date().getFullYear();

var hivtrace_cluster_network_graph = function (
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
    _.each(["Nodes", "Edges"], (key) => {
      var fields = _.keys(json[key]);
      var expanded = [];
      _.each(fields, (f, idx) => {
        var field_values = json[key][f];
        if (!_.isArray(field_values) && "values" in field_values) {
          //console.log ('COMPRESSED');
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

  // if schema is not set, set to empty dictionary
  if (!json[_networkGraphAttrbuteID]) {
    json[_networkGraphAttrbuteID] = {};
  }

  // Make attributes case-insensitive by LowerCasing all keys in schema
  const new_schema = Object.fromEntries(
    Object.entries(json[_networkGraphAttrbuteID]).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ])
  );

  json[_networkGraphAttrbuteID] = new_schema;

  // Attempt Translations
  $("#filter_input")
    .val("")
    .attr("placeholder", __("network_tab")["text_in_attributes"]);
  $("#show_as").html(__("attributes_tab")["show_as"]);

  // Make attributes case-insensitive by LowerCasing all keys in node attributes
  const label_key_map = _.object(
    _.map(json.patient_attribute_schema, (d, k) => [d.label, k])
  );

  _.each(json.Nodes, (n) => {
    if ("patient_attributes" in n) {
      let new_attrs = {};
      if (n["patient_attributes"] !== null) {
        new_attrs = Object.fromEntries(
          Object.entries(n.patient_attributes).map(([k, v]) => [
            k.toLowerCase(),
            v,
          ])
        );
      }

      // Map attributes from patient_schema labels to keys, if necessary
      const unrecognizedKeys = _.difference(
        _.keys(new_attrs),
        _.keys(json.patient_attribute_schema)
      );

      if (unrecognizedKeys.length) {
        _.each(unrecognizedKeys, (k) => {
          if (_.contains(_.keys(label_key_map), k)) {
            new_attrs[label_key_map[k]] = new_attrs[k];
            delete new_attrs[k];
          }
        });
      }

      n.patient_attributes = new_attrs;
    }
  });

  // annotate each node with patient_attributes if does not exist
  json.Nodes.forEach((n) => {
    if (!n["attributes"]) {
      n["attributes"] = [];
    }

    if (!n[_networkNodeAttributeID]) {
      n[_networkNodeAttributeID] = [];
    }
  });

  /** SLKP 20190902: somehow our networks have malformed edges! This will remove them */
  json.Edges = _.filter(json.Edges, (e) => "source" in e && "target" in e);

  var self = {};

  self._is_CDC_ = options && options["no_cdc"] ? false : true;
  self._is_seguro = options && options["seguro"] ? true : false;
  self._is_CDC_executive_mode =
    options && options["cdc-executive-mode"] ? true : false;

  self.json = json;

  self.uniqValues = helpers.getUniqueValues(json.Nodes, new_schema);
  self.uniqs = _.mapObject(self.uniqValues, (d) => d.length);

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
  self.isPrimaryGraph = options && "secondary" in options ? false : true;
  self.parent_graph_object =
    options && "parent_graph" in options ? options["parent_graph"] : null;

  if (json.Settings && json.Settings.created) {
    self.today = new Date(json.Settings.created);
  } else {
    self.today =
      options && options["today"]
        ? options["today"]
        : timeDateUtil.getCurrentDate();
  }

  self.get_reference_date = function () {
    if (!self.isPrimaryGraph && self.parent_graph_object)
      return self.parent_graph_object.today;

    return self.today;
  };

  if (self._is_CDC_) {
    // define various CDC settings

    self._is_CDC_auto_mode =
      options && options["cdc-no-auto-priority-set-mode"] ? false : true;

    self._lookup_option = function (key, default_value) {
      if (self.json.Settings && self.json.Settings[key])
        return self.json.Settings[key];
      if (options && options[key]) return options[key];
      return default_value;
    };

    self.displayed_node_subset =
      options && options["node-attributes"]
        ? options["node-attributes"]
        : [
            tables._networkNodeIDField,
            "sex_trans",
            "race_cat",
            "hiv_aids_dx_dt",
            "cur_city_name",
          ];

    self.subcluster_table =
      options && options["subcluster-table"]
        ? d3.select(options["subcluster-table"])
        : null;

    self.extra_subcluster_table_columns = null;

    var lookup_form_generator = function () {
      return '<div><ul data-hivtrace-ui-role = "priority-membership-list"></ul></div>';
    };

    // SLKP 20200727 issues

    self.CDC_data = {
      jurisdiction: self
        ._lookup_option("jurisdiction", "unknown")
        .toLowerCase()
        .replace(/\s/g, ""),
      timestamp: self.today,
      "autocreate-priority-set-size": 5,
    };

    if (self.CDC_data.jurisdiction in _cdcJurisdictionCodes) {
      self.CDC_data["jurisdiction_code"] =
        _cdcJurisdictionCodes[self.CDC_data.jurisdiction].toUpperCase();
    } else {
      self.CDC_data["jurisdiction_code"] = "PG";
    }

    if (_cdcJurisdictionLowMorbidity.has(self.CDC_data["jurisdiction"])) {
      self.CDC_data["autocreate-priority-set-size"] = 3;
    }

    const cdc_extra = [
      {
        description: {
          value: "Cases dx within 36 months",
          sort: function (c) {
            return c.value.length ? c.value[0].length : 0;
          },
          help: "Number of cases diagnosed in the past 36 months connected only through cases diagnosed within the past 36 months",
        },
        generator: function (cluster) {
          return {
            html: true,
            value: cluster.recent_nodes,
            volatile: true,
            format: function (v) {
              v = v || [];
              if (v.length) {
                return _.map(v, (e) => e.length).join(", ");
              }
              return "";
            },
            actions: function (item, value) {
              if (
                !clustersOfInterest.get_editor() ||
                cluster.recent_nodes.length === 0
              ) {
                return null;
              }
              return _.map(cluster.recent_nodes, (c) => {
                const nodeset = new Set(c);
                return {
                  icon: "fa-plus",
                  action: function (button, v) {
                    if (clustersOfInterest.get_editor()) {
                      clustersOfInterest
                        .get_editor()
                        .append_node_objects(
                          _.filter(
                            cluster.children,
                            (n) => nodeset.has(n.id) && n.priority_flag > 0
                          )
                        );
                    }
                    return false;
                  },
                  help: "Add to cluster of interest",
                };
              });
            },
          };
        },
      },
      {
        description: {
          value: "Cases dx within 12 months",
          //"value",
          sort: function (c) {
            const v = c.value || [];
            return v.length > 0 ? v[0].length : 0;
          },
          presort: "desc",
          help: "Number of cases diagnosed in the past 12 months connected only through cases diagnosed within the past 36 months",
        },
        generator: function (cluster) {
          const definition = {
            html: true,
            value: cluster.priority_score,
            volatile: true,
            format: function (v) {
              v = v || [];
              if (v.length) {
                var str = _.map(v, (c) => c.length).join(", ");
                if (
                  v[0].length >= self.CDC_data["autocreate-priority-set-size"]
                ) {
                  var color = "red";
                  return "<span style='color:" + color + "'>" + str + "</span>";
                }
                return str;
              }
              return "";
            },
          };

          definition["actions"] = function (item, value) {
            let result = [];

            if (cluster.priority_score.length > 0) {
              result = result.concat(
                _.map(cluster.priority_score, (c) => ({
                  icon: "fa-question",
                  help:
                    "Do some of these " +
                    c.length +
                    " nodes belong to a cluster of interest?",
                  action: function (this_button, cv) {
                    const nodeset = new Set(c);
                    this_button = $(this_button.node());
                    if (this_button.data("popover_shown") !== "shown") {
                      const popover = this_button
                        .popover({
                          sanitize: false,
                          placement: "right",
                          container: "body",
                          html: true,
                          content: lookup_form_generator,
                          trigger: "manual",
                        })
                        .on("shown.bs.popover", function (e) {
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
                            _.map(self.defined_priority_groups, (g) =>
                              //console.log(g);
                              [
                                g.name,
                                _.filter(g.nodes, (n) => nodeset.has(n.name))
                                  .length,
                                _.filter(
                                  g.partitioned_nodes[1]["new_direct"],
                                  (n) => nodeset.has(n.id)
                                ).length,
                                _.filter(
                                  g.partitioned_nodes[1]["new_indirect"],
                                  (n) => nodeset.has(n.id)
                                ).length,
                              ]
                            ),
                            (gg) => gg[1] + gg[2] + gg[3] > 0
                          );

                          if (check_membership.length === 0) {
                            check_membership = [
                              [
                                "No nodes belong to any cluster of interest or are linked to any of the clusters of interest.",
                              ],
                            ];
                          } else {
                            check_membership = _.map(check_membership, (m) => {
                              let description = "";
                              if (m[1]) {
                                description += " " + m[1] + " nodes belong";
                              }
                              if (m[2]) {
                                description +=
                                  (description.length ? ", " : " ") +
                                  m[2] +
                                  " nodes are directly linked @ " +
                                  _defaultPercentFormatShort(
                                    self.subcluster_threshold
                                  );
                              }
                              if (m[3]) {
                                description +=
                                  (description.length ? ", " : " ") +
                                  m[3] +
                                  " nodes are indirectly linked @ " +
                                  _defaultPercentFormatShort(
                                    self.subcluster_threshold
                                  );
                              }

                              description +=
                                " to cluster of interest <code>" +
                                m[0] +
                                "</code>";
                              return description;
                            });
                          }
                          list_element = list_element
                            .selectAll("li")
                            .data(check_membership);
                          list_element.enter().insert("li");
                          list_element.html((d) => d);
                        });

                      popover.popover("show");
                      this_button.data("popover_shown", "shown");
                      this_button
                        .off("hidden.bs.popover")
                        .on("hidden.bs.popover", function () {
                          $(this).data("popover_shown", "hidden");
                        });
                    } else {
                      this_button.data("popover_shown", "hidden");
                      this_button.popover("destroy");
                    }
                  },
                }))
              );
            }

            if (
              clustersOfInterest.get_editor() &&
              cluster.priority_score.length > 0
            ) {
              result = result.concat(
                _.map(cluster.priority_score, (c) => {
                  const nodeset = new Set(c);
                  return {
                    icon: "fa-plus",
                    action: function (button, v) {
                      if (clustersOfInterest.get_editor()) {
                        clustersOfInterest
                          .get_editor()
                          .append_node_objects(
                            _.filter(
                              cluster.children,
                              (n) =>
                                nodeset.has(n.id) &&
                                (n.priority_flag === 2 || n.priority_flag === 1)
                            )
                          );
                      }
                      return false;
                    },
                    help: "Add to cluster of interest",
                  };
                })
              );
            }

            return result;
          };

          return definition;
        },
      },
    ];

    if (self.subcluster_table) {
      self.extra_subcluster_table_columns = cdc_extra;
    } else if (self.extra_cluster_table_columns) {
      self.extra_cluster_table_columns =
        self.extra_cluster_table_columns.concat(cdc_extra);
    } else {
      self.extra_cluster_table_columns = cdc_extra;
    }
  } // end self._is_CDC_

  self.node_label_drag = d3.behavior
    .drag()
    .on("drag", function (d) {
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
    .on("dragstart", () => {
      d3.event.sourceEvent.stopPropagation();
    })
    .on("dragend", () => {
      d3.event.sourceEvent.stopPropagation();
    });

  self.extra_node_table_columns = null;
  if (options && options["node-table-columns"]) {
    self.extra_node_table_columns = options["node-table-columns"];
  } else if (self._is_CDC_) {
    self.extra_node_table_columns = [
      {
        description: {
          value: "Recent and Rapid",
          sort: "value",
          help: "Is the node a member of a regular or recent & rapid subcluster?",
        },
        generator: function (node) {
          return {
            callback: function (element, payload) {
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
                  payload.length > 3 ? payload[3][1] : null,
                ],
              ];

              this_cell.selectAll("span").remove();

              _.each(data_to_use, (button_text) => {
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
            value: function () {
              return [
                [
                  node.subcluster_label
                    ? "Subcluster " + node.subcluster_label
                    : "",
                  "btn-primary",
                  node.subcluster_label
                    ? function () {
                        self.view_subcluster(
                          node.subcluster_label,
                          (n) => n.subcluster_label === node.subcluster_label,
                          "Subcluster " + node.subcluster_label
                        );
                      }
                    : null,
                ],

                [node.priority_flag === 3, "btn-warning"],
                [node.priority_flag === 1, "btn-danger"],
                [node.priority_flag === 2, "btn-danger"],
              ];
            },
          };
        },
      },
    ];
  }

  self.colorizer = {
    selected: function (d) {
      return d === "selected" ? d3.rgb(51, 122, 183) : "#FFF";
    },
  };

  self.subcluster_threshold =
    options && options["subcluster-thershold"]
      ? options["subcluster-thershold"]
      : 0.005;

  self.highlight_unsuppored_edges = true;

  self.get_ui_element_selector_by_role = function (role, not_nested) {
    if (not_nested && !this.isPrimaryGraph) {
      return undefined;
    }
    return (
      (not_nested ? "" : "#" + button_bar_ui) +
      utils.get_ui_element_selector_by_role(role)
    );
  };

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

  self.priority_groups_pending = function () {
    return _.filter(self.defined_priority_groups, (pg) => pg.pending).length;
  };
  self.priority_groups_expanded = function () {
    return _.filter(self.defined_priority_groups, (pg) => pg.expanded).length;
  };
  self.priority_groups_automatic = function () {
    return _.filter(
      self.defined_priority_groups,
      (pg) => pg.createdBy === _cdcCreatedBySystem
    ).length;
  };

  self._generate_auto_id = function (subcluster_id) {
    const id =
      self.CDC_data["jurisdiction_code"] +
      "_" +
      _defaultDateViewFormatClusterCreate(self.CDC_data["timestamp"]) +
      "_" +
      subcluster_id;
    let suffix = "";
    let k = 1;
    let found =
      self.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
      self.defined_priority_groups.find((d) => d.name === id + suffix);
    while (found !== undefined) {
      suffix = "_" + k;
      k++;
      found =
        self.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
        self.defined_priority_groups.find((d) => d.name === id + suffix);
    }
    return id + suffix;
  };

  self.load_priority_sets = function (url, is_writeable) {
    d3.json(url, (error, results) => {
      if (error) {
        throw Error(
          "Failed loading cluster of interest file " + error.responseURL
        );
      } else {
        let latest_date = new Date();
        latest_date.setFullYear(1900);
        self.defined_priority_groups = _.clone(results);
        _.each(self.defined_priority_groups, (pg) => {
          _.each(pg.nodes, (n) => {
            try {
              n.added = _defaultDateFormats[0].parse(n.added);
              if (n.added > latest_date) {
                latest_date = n.added;
              }
            } catch (e) {
              // do nothing
            }
          });
        });

        self.priority_set_table_writeable = is_writeable === "writeable";

        self.priority_groups_validate(
          self.defined_priority_groups,
          self._is_CDC_auto_mode
        );

        self.auto_create_priority_sets = [];
        // propose some
        const today_string = _defaultDateFormats[0](self.today);
        const node_id_to_object = {};

        _.each(self.json.Nodes, (n, i) => {
          node_id_to_object[n.id] = n;
        });

        if (self._is_CDC_auto_mode) {
          _.each(self.clusters, (cluster_data, cluster_id) => {
            _.each(cluster_data.subclusters, (subcluster_data) => {
              _.each(subcluster_data.priority_score, (priority_score, i) => {
                if (
                  priority_score.length >=
                  self.CDC_data["autocreate-priority-set-size"]
                ) {
                  // only generate a new set if it doesn't match what is already there
                  const node_set = {};
                  _.each(subcluster_data.recent_nodes[i], (n) => {
                    node_set[n] = 1;
                  });

                  const matched_groups = _.filter(
                    _.filter(
                      self.defined_priority_groups,
                      (pg) =>
                        pg.kind in _cdcPrioritySetKindAutoExpand &&
                        pg.createdBy === _cdcCreatedBySystem &&
                        pg.tracking === _cdcTrackingOptionsDefault
                    ),
                    (pg) => {
                      const matched = _.countBy(
                        _.map(pg.nodes, (pn) => pn.name in node_set)
                      );
                      //if (pg.name === 'FL_201709_141.1') console.log (matched);
                      return (
                        //matched[true] === subcluster_data.recent_nodes[i].length
                        matched[true] >= 1
                      );
                    }
                  );

                  if (matched_groups.length >= 1) {
                    return;
                  }

                  const autoname = self._generate_auto_id(
                    subcluster_data.cluster_id
                  );
                  self.auto_create_priority_sets.push({
                    name: autoname,
                    description:
                      "Automatically created cluster of interest " + autoname,
                    nodes: _.map(subcluster_data.recent_nodes[i], (n) =>
                      self.priority_group_node_record(n, self.today)
                    ),
                    created: today_string,
                    kind: _cdcPrioritySetKindAutomaticCreation,
                    tracking: _cdcTrackingOptions[0],
                    createdBy: _cdcCreatedBySystem,
                    autocreated: true,
                    autoexpanded: false,
                    pending: true,
                  });
                }
              });
            });
          });
        }

        if (self.auto_create_priority_sets.length) {
          // SLKP 20200727 now check to see if any of the priority sets
          // need to be auto-generated
          //console.log (self.auto_create_priority_sets);
          self.defined_priority_groups.push(...self.auto_create_priority_sets);
        }
        const autocreated = self.defined_priority_groups.filter(
            (pg) => pg.autocreated
          ).length,
          autoexpanded = self.defined_priority_groups.filter(
            (pg) => pg.autoexpanded
          ).length,
          automatic_action_taken = autocreated + autoexpanded > 0,
          left_to_review = self.defined_priority_groups.filter(
            (pg) => pg.pending
          ).length;

        if (automatic_action_taken) {
          self.warning_string +=
            "<br/>Automatically created <b>" +
            autocreated +
            "</b> and expanded <b>" +
            autoexpanded +
            "</b> clusters of interest." +
            (left_to_review > 0
              ? " <b>Please review <span id='banner_coi_counts'></span> clusters in the <code>Clusters of Interest</code> tab.</b><br>"
              : "");
          self.display_warning(self.warning_string, true);
        }

        const tab_pill = self.get_ui_element_selector_by_role(
          "priority_set_counts",
          true
        );

        if (!self.priority_set_table_writeable) {
          const rationale =
            is_writeable === "old"
              ? "the network is <b>older</b> than some of the Clusters of Interest"
              : "the network was ran in <b>standalone</b> mode so no data is stored";
          self.warning_string += `<p class="alert alert-danger"class="alert alert-danger">READ-ONLY mode for Clusters of Interest is enabled because ${rationale}. None of the changes to clustersOI made during this session will be recorded.</p>`;
          self.display_warning(self.warning_string, true);
          if (tab_pill) {
            d3.select(tab_pill).text("Read-only");
          }
        } else if (tab_pill && left_to_review > 0) {
          d3.select(tab_pill).text(left_to_review);
          d3.select("#banner_coi_counts").text(left_to_review);
        }

        self.priority_groups_validate(self.defined_priority_groups);
        _.each(self.auto_create_priority_sets, (pg) =>
          self.priority_groups_update_node_sets(pg.name, "insert")
        );
        const groups_that_expanded = self.defined_priority_groups.filter(
          (pg) => pg.expanded
        );
        _.each(groups_that_expanded, (pg) =>
          self.priority_groups_update_node_sets(pg.name, "update")
        );

        clustersOfInterest.draw_priority_set_table(self);
        if (
          self.showing_diff &&
          self.has_network_attribute("subcluster_or_priority_node")
        ) {
          self.handle_attribute_categorical("subcluster_or_priority_node");
        }
        //self.update();
      }
    });
  };

  self.priority_groups_find_by_name = function (name) {
    if (self.defined_priority_groups) {
      return _.find(self.defined_priority_groups, (g) => g.name === name);
    }
    return null;
  };

  self.priority_groups_all_events = function () {
    // generate a set of all unique temporal events (when new data were added to ANY PG)
    const events = new Set();
    if (self.defined_priority_groups) {
      _.each(self.defined_priority_groups, (g) => {
        _.each(g.nodes, (n) => {
          events.add(_defaultDateViewFormatSlider(n.added));
        });
      });
    }
    return events;
  };

  self.priority_group_node_record = function (node_id, date, kind) {
    return {
      name: node_id,
      added: date || self.today,
      kind: kind || _cdcPrioritySetDefaultNodeKind,
      autoadded: true,
    };
  };

  self.priority_groups_compute_overlap = function (groups) {
    /**
        compute the overlap between priority sets (PS)
        
        1. Populate self.priority_node_overlap dictionary which
           stores, for every node present in AT LEAST ONE PS, the set of all 
           PGs it belongs to, as in "node-id" => set ("PG1", "PG2"...)
           
        2. For each PS, create and populate a member field, .overlaps
           which is a dictionary that stores
           {
                sets : #of PS with which it shares nodes
                nodes: the # of nodes contained in overlaps
           }
    
    */
    self.priority_node_overlap = {};
    const size_by_pg = {};
    _.each(groups, (pg) => {
      size_by_pg[pg.name] = pg.nodes.length;
      _.each(pg.nodes, (n) => {
        if (!(n.name in self.priority_node_overlap)) {
          self.priority_node_overlap[n.name] = new Set();
        }
        self.priority_node_overlap[n.name].add(pg.name);
      });
    });

    _.each(groups, (pg) => {
      const overlap = {
        sets: new Set(),
        nodes: 0,
        supersets: [],
        duplicates: [],
      };

      const by_set_count = {};
      _.each(pg.nodes, (n) => {
        if (self.priority_node_overlap[n.name].size > 1) {
          overlap.nodes++;
          self.priority_node_overlap[n.name].forEach((pgn) => {
            if (pgn !== pg.name) {
              if (!(pgn in by_set_count)) {
                by_set_count[pgn] = [];
              }
              by_set_count[pgn].push(n.name);
            }
            overlap.sets.add(pgn);
          });
        }
      });

      _.each(by_set_count, (nodes, name) => {
        if (nodes.length === pg.nodes.length) {
          if (size_by_pg[name] === pg.nodes.length) {
            overlap.duplicates.push(name);
          } else {
            overlap.supersets.push(name);
          }
        }
      });

      pg.overlap = {
        nodes: overlap.nodes,
        sets: Math.max(0, overlap.sets.size - 1),
        superset: overlap.supersets,
        duplicate: overlap.duplicates,
      };
    });
  };

  self.auto_expand_pg_handler = function (pg, nodeID2idx) {
    if (!nodeID2idx) {
      const nodeset = {};
      nodeID2idx = {};
      _.each(self.json.Nodes, (n, i) => {
        nodeset[n.id] = n;
        nodeID2idx[n.id] = i;
      });
    }

    const core_node_set = new Set(_.map(pg.nodes, (n) => nodeID2idx[n.name]));
    const added_nodes = new Set();
    const filter = _cdcTrackingOptionsFilter[pg.tracking];

    if (filter) {
      const time_cutoff = _n_months_ago(
        self.get_reference_date(),
        _cdcTrackingOptionsCutoff[pg.tracking]
      );
      const expansion_test = hivtrace_cluster_depthwise_traversal(
        self.json.Nodes,
        self.json.Edges,
        (e) => {
          let pass = filter(e);
          if (pass) {
            if (!(core_node_set.has(e.source) && core_node_set.has(e.target))) {
              pass =
                pass &&
                self._filter_by_date(
                  time_cutoff,
                  timeDateUtil._networkCDCDateField,
                  self.get_reference_date(),
                  self.json.Nodes[e.source]
                ) &&
                self._filter_by_date(
                  time_cutoff,
                  timeDateUtil._networkCDCDateField,
                  self.get_reference_date(),
                  self.json.Nodes[e.target]
                );
            }
          }
          return pass;
        },
        false,
        _.filter(
          _.map([...core_node_set], (d) => self.json.Nodes[d]),
          (d) => d
        )
      );

      _.each(expansion_test, (c) => {
        _.each(c, (n) => {
          if (!core_node_set.has(nodeID2idx[n.id])) {
            added_nodes.add(nodeID2idx[n.id]);
          }
        });
      });
    }
    return added_nodes;
  };

  self.priority_groups_validate = function (groups, auto_extend) {
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
      kind: enum (one of _cdcPrioritySetKind),
      tracking: enum (one of _cdcTrackingOptions)
      createdBy : enum (on of [_cdcCreatedBySystem,_cdcCreatedByManual])


    */

    if (_.some(groups, (g) => !g.validated)) {
      const priority_subclusters = _.map(
        _.filter(
          _.flatten(
            _.map(
              _.flatten(
                _.map(self.clusters, (c) =>
                  _.filter(
                    _.filter(c.subclusters, (sc) => sc.priority_score.length)
                  )
                )
              ),
              (d) => d.priority_score
            ),
            1
          ),
          (d) => d.length >= self.CDC_data["autocreate-priority-set-size"]
        ),
        (d) => new Set(d)
      );

      const nodeset = {};
      const nodeID2idx = {};
      _.each(self.json.Nodes, (n, i) => {
        nodeset[n.id] = n;
        nodeID2idx[n.id] = i;
      });
      _.each(groups, (pg) => {
        if (!pg.validated) {
          pg.node_objects = [];
          pg.not_in_network = [];
          pg.validated = true;
          pg.created = _.isDate(pg.created)
            ? pg.created
            : _defaultDateFormats[0].parse(pg.created);
          if (pg.modified) {
            pg.modified = _.isDate(pg.modified)
              ? pg.modified
              : _defaultDateFormats[0].parse(pg.modified);
          } else {
            pg.modified = pg.created;
          }
          if (!pg.tracking) {
            if (pg.kind === _cdcPrioritySetKind[0]) {
              pg.tracking = _cdcTrackingOptions[0];
            } else {
              pg.tracking = _cdcTrackingOptions[4];
            }
          }
          if (!pg.createdBy) {
            if (pg.kind === _cdcPrioritySetKind[0]) {
              pg.createdBy = _cdcCreatedBySystem;
            } else {
              pg.createdBy = _cdcCreatedByManual;
            }
          }

          _.each(pg.nodes, (node) => {
            const nodeid = node.name;
            if (nodeid in nodeset) {
              pg.node_objects.push(nodeset[nodeid]);
            } else {
              pg.not_in_network.push(nodeid);
            }
          });

          /**     extract network data at 0.015 and subcluster thresholds
                            filter on dates subsequent to created date
                     **/

          const my_nodeset = new Set(_.map(pg.node_objects, (n) => n.id));

          const node_set15 = _.flatten(
            hivtrace_cluster_depthwise_traversal(
              json["Nodes"],
              json["Edges"],
              (e) => e.length <= 0.015,
              null,
              pg.node_objects
            )
          );

          const saved_traversal_edges = auto_extend ? [] : null;

          const node_set_subcluster = _.flatten(
            hivtrace_cluster_depthwise_traversal(
              json["Nodes"],
              json["Edges"],
              (e) => e.length <= self.subcluster_threshold,
              saved_traversal_edges,
              pg.node_objects
            )
          );

          const direct_at_15 = new Set();

          const json15 = _extract_single_cluster(
            node_set15,
            (e) =>
              e.length <= 0.015 &&
              (my_nodeset.has(json["Nodes"][e.target].id) ||
                my_nodeset.has(json["Nodes"][e.source].id)),
            //null,
            true
          );

          _.each(json15["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json15["Nodes"][nid].id)) {
                direct_at_15.add(json15["Nodes"][nid].id);
              }
            });
          });

          const current_time = self.today;

          const json_subcluster = _extract_single_cluster(
            node_set_subcluster,
            (e) =>
              e.length <= self.subcluster_threshold &&
              (my_nodeset.has(json["Nodes"][e.target].id) ||
                my_nodeset.has(json["Nodes"][e.source].id)),
              /*|| (auto_extend && (self._filter_by_date(
                  pg.modified || pg.created,
                  timeDateUtil._networkCDCDateField,
                  current_time,
                  json["Nodes"][e.target],
                  true
                ) || self._filter_by_date(
                  pg.modified || pg.created,
                  timeDateUtil._networkCDCDateField,
                  current_time,
                  json["Nodes"][e.source],
                  true
                )))*/
            true
          );

          const direct_subcluster = new Set();
          const direct_subcluster_new = new Set();
          _.each(json_subcluster["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json_subcluster["Nodes"][nid].id)) {
                direct_subcluster.add(json_subcluster["Nodes"][nid].id);

                if (
                  self._filter_by_date(
                    pg.modified || pg.created,
                    timeDateUtil._networkCDCDateField,
                    current_time,
                    json_subcluster["Nodes"][nid],
                    true
                  )
                )
                  direct_subcluster_new.add(json_subcluster["Nodes"][nid].id);
              }
            });
          });

          pg.partitioned_nodes = _.map(
            [
              [node_set15, direct_at_15],
              [node_set_subcluster, direct_subcluster],
            ],
            (ns) => {
              const nodesets = {
                existing_direct: [],
                new_direct: [],
                existing_indirect: [],
                new_indirect: [],
              };

              _.each(ns[0], (n) => {
                if (my_nodeset.has(n.id)) return;
                let key;
                if (
                  self._filter_by_date(
                    pg.modified || pg.created,
                    timeDateUtil._networkCDCDateField,
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

              return nodesets;
            }
          );

          if (auto_extend && pg.tracking !== _cdcTrackingNone) {
            const added_nodes = self.auto_expand_pg_handler(pg, nodeID2idx);

            if (added_nodes.size) {
              _.each([...added_nodes], (nid) => {
                const n = self.json.Nodes[nid];
                pg.nodes.push({
                  name: n.id,
                  added: current_time,
                  kind: _cdcPrioritySetDefaultNodeKind,
                  autoadded: true,
                });
                pg.node_objects.push(n);
              });
              pg.validated = false;
              pg.autoexpanded = true;
              pg.pending = true;
              pg.expanded = added_nodes.size;
              pg.modified = self.today;
            }
          }

          const node_set = new Set(_.map(pg.nodes, (n) => n.name));
          pg.meets_priority_def = _.some(
            priority_subclusters,
            (ps) =>
              _.filter([...ps], (psi) => node_set.has(psi)).length === ps.size
          );
          const cutoff12 = _n_months_ago(self.get_reference_date(), 12);
          pg.last12 = _.filter(pg.node_objects, (n) =>
            self._filter_by_date(
              cutoff12,
              timeDateUtil._networkCDCDateField,
              self.today,
              n,
              false
            )
          ).length;
        }
      });
    }
  };

  self.priority_groups_update_node_sets = function (name, operation) {
    // name : the name of the priority group being added
    // operation: one of
    // "insert" , "delete", "update"

    const sets = self.priority_groups_export().filter((pg) => pg.name === name);
    const to_post = {
      operation: operation,
      name: name,
      url: window.location.href,
      sets: JSON.stringify(sets),
    };

    if (self.priority_set_table_write && self.priority_set_table_writeable) {
      d3.text(self.priority_set_table_write)
        .header("Content-Type", "application/json")
        .post(JSON.stringify(to_post), (error, data) => {
          if (error) {
            console.log("received fatal error:", error);
            /*
            $(".container").html(
              '<div class="alert alert-danger">FATAL ERROR. Please reload the page and contact help desk.</div>'
            );
            */
          }
        });
    }
  };

  self.priority_groups_compute_node_membership = function () {
    const pg_nodesets = [];

    _.each(self.defined_priority_groups, (g) => {
      pg_nodesets.push([
        g.name,
        g.createdBy === _cdcCreatedBySystem,
        new Set(_.map(g.nodes, (n) => n.name)),
      ]);
    });

    const pg_enum = [
      "Yes (dx≤12 months)",
      "Yes (12<dx≤ 36 months)",
      "Yes (dx>36 months)",
      "No",
    ];

    _.each(
      {
        subcluster_or_priority_node: {
          depends: [timeDateUtil._networkCDCDateField],
          label: _cdcPOImember,
          enum: pg_enum,
          type: "String",
          volatile: true,
          color_scale: function () {
            return d3.scale
              .ordinal()
              .domain(pg_enum.concat([_networkMissing]))
              .range([
                "red",
                "orange",
                "yellow",
                "steelblue",
                _networkMissingColor,
              ]);
          },
          map: function (node) {
            const npcoi = _.some(pg_nodesets, (d) => d[1] && d[2].has(node.id));
            if (npcoi) {
              const cutoffs = [
                _n_months_ago(self.get_reference_date(), 12),
                _n_months_ago(self.get_reference_date(), 36),
              ];

              //const ysd = self.attribute_node_value_by_id(
              //  node,
              //  "years_since_dx"
              //);

              if (
                self._filter_by_date(
                  cutoffs[0],
                  timeDateUtil._networkCDCDateField,
                  self.get_reference_date(),
                  node,
                  false
                )
              )
                return pg_enum[0];
              if (
                self._filter_by_date(
                  cutoffs[1],
                  timeDateUtil._networkCDCDateField,
                  self.get_reference_date(),
                  node,
                  false
                )
              )
                return pg_enum[1];
              return pg_enum[2];
            }
            return pg_enum[3];
          },
        },
        cluster_uid: {
          depends: [timeDateUtil._networkCDCDateField],
          label: "Clusters of Interest",
          type: "String",
          volatile: true,
          map: function (node) {
            const memberships = _.filter(pg_nodesets, (d) => d[2].has(node.id));
            if (memberships.length === 1) {
              return memberships[0][0];
            } else if (memberships.length > 1) {
              return "Multiple";
            }
            return "None";
          },
        },
        subcluster_id: {
          depends: [timeDateUtil._networkCDCDateField],
          label: "Subcluster ID",
          type: "String",
          //label_format: d3.format(".2f"),
          map: function (node) {
            if (node) {
              return node.subcluster_label || "None";
            }
            return _networkMissing;
          },
        },
      },
      self._aux_populated_predefined_attribute
    );
    self._aux_populate_category_menus();
  };

  self.priority_groups_edit_set_description = function (
    name,
    description,
    update_table
  ) {
    if (self.defined_priority_groups) {
      var idx = _.findIndex(
        self.defined_priority_groups,
        (g) => g.name === name
      );
      if (idx >= 0) {
        self.defined_priority_groups[idx].description = description;
        self.priority_groups_update_node_sets(name, "update");
        if (update_table) {
          clustersOfInterest.draw_priority_set_table(self);
        }
      }
    }
  };

  self.priority_groups_remove_set = function (name, update_table) {
    if (self.defined_priority_groups) {
      var idx = _.findIndex(
        self.defined_priority_groups,
        (g) => g.name === name
      );
      if (idx >= 0) {
        self.defined_priority_groups.splice(idx, 1);
        self.priority_groups_update_node_sets(name, "delete");
        if (update_table) {
          clustersOfInterest.draw_priority_set_table(self);
        }
      }
    }
  };

  self.priority_groups_export = function (group_set, include_unvalidated) {
    group_set = group_set || self.defined_priority_groups;

    return _.map(
      _.filter(group_set, (g) => include_unvalidated || g.validated),
      (g) => ({
        name: g.name,
        description: g.description,
        nodes: g.nodes,
        modified: _defaultDateFormats[0](g.modified),
        kind: g.kind,
        created: _defaultDateFormats[0](g.created),
        createdBy: g.createdBy,
        tracking: g.tracking,
        autocreated: g.autocreated,
        autoexpanded: g.autoexpanded,
        pending: g.pending,
      })
    );
  };

  self.priority_groups_is_new_node = function (group_set, node) {
    return node.autoadded;
  };

  self.priority_groups_export_nodes = function (
    group_set,
    include_unvalidated
  ) {
    group_set = group_set || self.defined_priority_groups;

    return _.flatten(
      _.map(
        _.filter(group_set, (g) => include_unvalidated || g.validated),
        (g) => {
          //const refTime = g.modified.getTime();
          //console.log ("GROUP: ",g.name, " = ", g.modified);

          const exclude_nodes = new Set(g.not_in_network);
          let cluster_detect_size = 0;
          g.nodes.forEach((node) => {
            if (node.added <= g.created) cluster_detect_size++;
          });
          return _.map(
            _.filter(g.nodes, (gn) => !exclude_nodes.has(gn.name)),
            (gn) => ({
              eHARS_uid: gn.name,
              cluster_uid: g.name,
              cluster_ident_method: g.kind,
              person_ident_method: gn.kind,
              person_ident_dt: hivtrace_date_or_na_if_missing(gn.added),
              new_linked_case: self.priority_groups_is_new_node(g, gn) ? 1 : 0,
              cluster_created_dt: hivtrace_date_or_na_if_missing(g.created),
              network_date: hivtrace_date_or_na_if_missing(self.today),
              cluster_detect_size: cluster_detect_size,
              cluster_type: g.createdBy,
              cluster_modified_dt: hivtrace_date_or_na_if_missing(g.modified),
              cluster_growth: _cdcConciseTrackingOptions[g.tracking],
              national_priority: g.meets_priority_def,
              cluster_current_size: g.nodes.length,
              cluster_dx_recent12_mo: g.last12,
              cluster_overlap: g.overlap.sets,
            })
          );
        }
      )
    );
  };

  self.priority_groups_export_sets = function () {
    return _.flatten(
      _.map(
        _.filter(self.defined_priority_groups, (g) => g.validated),
        (g) => ({
          cluster_type: g.createdBy,
          cluster_uid: g.name,
          cluster_modified_dt: hivtrace_date_or_na_if_missing(g.modified),
          cluster_created_dt: hivtrace_date_or_na_if_missing(g.created),
          cluster_ident_method: g.kind,
          cluster_growth: _cdcConciseTrackingOptions[g.tracking],
          cluster_current_size: g.nodes.length,
          national_priority: g.meets_priority_def,
          cluster_dx_recent12_mo: g.last12,
          cluster_overlap: g.overlap.sets,
        })
      )
    );
  };

  //---------------------------------------------------------------------------------------------------
  // END: NODE SET GROUPS
  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------
  // BEGIN: NODE SET EDITOR
  //---------------------------------------------------------------------------------------------------

  clustersOfInterest.init(self);

  //---------------------------------------------------------------------------------------------------
  // END: NODE SET EDITOR
  //---------------------------------------------------------------------------------------------------

  //---------------------------------------------------------------------------------------------------

  self.node_shaper = {
    id: null,
    shaper: function () {
      return "circle";
    },
  };

  nodesTab.init(d3.select(nodes_table));

  self.filter_edges = true;
  self.hide_hxb2 = false;
  self.charge_correction = 5;
  self.margin = {
    top: 20,
    right: 10,
    bottom: 30,
    left: 10,
  };
  self.width = self.ww - self.margin.left - self.margin.right;
  self.height = (self.width * 9) / 16;
  self.cluster_table = d3.select(clusters_table);
  self.priority_set_table =
    self._is_CDC_ && options && options["priority-table"]
      ? d3.select(options["priority-table"])
      : null;
  self.priority_set_table_write =
    self._is_CDC_ && options && options["priority-table-writeback"]
      ? options["priority-table-writeback"]
      : null;
  self.needs_an_update = false;
  self.hide_unselected = false;
  self.show_percent_in_pairwise_table = false;
  self.gradient_id = 0;

  self.priority_set_table_writeable = true;

  self._calc_country_nodes = function (calc_options) {
    if (calc_options && "country-centers" in calc_options) {
      self.mapProjection = d3.geo
        .mercator()
        .translate([
          self.margin.left + self.width / 2,
          self.margin.top + self.height / 2,
        ])
        .scale((150 * self.width) / 960);
      _.each(self.countryCentersObject, (value) => {
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
  } else if (self._is_CDC_) {
    self.minimum_cluster_size = 5;
  } else {
    self.minimum_cluster_size = 5;
  }

  timeDateUtil.init(options, self._is_CDC_, timeDateUtil._networkCDCDateField);

  if (self._is_CDC_) {
    self._additional_node_pop_fields.push(timeDateUtil._networkCDCDateField);
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

  self.filter_by_size = function (cluster, value) {
    return cluster.children.length >= self.minimum_cluster_size;
  };

  self.filter_singletons = function (cluster, value) {
    return cluster.children.length > 1;
  };

  self.filter_if_added = function (cluster) {
    return self.cluster_attributes[cluster.cluster_id].type !== "existing";
  };

  self.filter_time_period = function (cluster) {
    return _.some(
      self.nodes_by_cluster[cluster.cluster_id],
      (n) =>
        self.attribute_node_value_by_id(
          n,
          timeDateUtil.getClusterTimeScale()
        ) >= self.using_time_filter
    );
  };

  self.cluster_filtering_functions = {
    size: self.filter_by_size,
    singletons: self.filter_singletons,
  };

  self.using_time_filter = null;

  if (self.json.Notes) {
    _.each(self.json.Notes, (s) => (self.warning_string += s + "<br>"));
  }

  if (self.cluster_attributes) {
    self.warning_string += __("network_tab")["cluster_display_info"];
    self.showing_diff = true;
    self.cluster_filtering_functions["new"] = self.filter_if_added;
  } else {
    self.showing_diff = false;
    if (
      timeDateUtil.getClusterTimeScale() &&
      "Cluster sizes" in self.json &&
      self.json["Cluster sizes"].length > 250
    ) {
      self.using_time_filter = timeDateUtil.getCurrentDate();
      self.warning_string += __("network_tab")["cluster_display_info"];
      self.using_time_filter.setFullYear(
        self.using_time_filter.getFullYear() - 1
      );
      self.cluster_filtering_functions["recent"] = self.filter_time_period;
    }
  }

  self.cluster_display_filter = function (cluster) {
    return _.every(self.cluster_filtering_functions, (filter) =>
      filter(cluster)
    );
  };

  self.initial_packed =
    options && options["initial_layout"] === "tiled" ? false : true;

  self.recent_rapid_definition_simple = function (network, date) {
    // date = date || self.get_reference_date(); // not used

    var subcluster_enum_simple = [
      "Not a member of national priority clusterOI", // 1,4,5,6
      "12 months and in national priority clusterOI", // 2
      "36 months and in national priority clusterOI", // 3
      ">36 months and in national priority clusterOI", // 0
    ];

    return {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Subcluster or Priority Node",
      enum: subcluster_enum_simple,
      type: "String",
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(subcluster_enum_simple.concat([_networkMissing]))
          .range(
            _.union(
              ["#CCCCCC", "red", "blue", "#9A4EAE"],
              [_networkMissingColor]
            )
          );
      },

      map: function (node) {
        if (node.subcluster_label) {
          if (node.nationalCOI) {
            return subcluster_enum_simple[node.nationalCOI];
          }
        }
        return subcluster_enum_simple[0];
      },
    };
  };

  self.recent_rapid_definition = function (network, date) {
    date = date || self.get_reference_date();
    var subcluster_enum = [
      "No, dx>36 months", // 0
      "No, but dx≤12 months",
      "Yes (dx≤12 months)",
      "Yes (12<dx≤ 36 months)",
      "Future node", // 4
      "Not a member of subcluster", // 5
      "Not in a subcluster",
      "No, but 12<dx≤ 36 months",
    ];

    return {
      depends: [timeDateUtil._networkCDCDateField],
      label: "ClusterOI membership as of " + _defaultDateViewFormat(date),
      enum: subcluster_enum,
      //type: "String",
      volatile: true,
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(subcluster_enum.concat([_networkMissing]))
          .range(
            _.union(
              [
                "steelblue",
                "pink",
                "red",
                "#FF8C00",
                "#9A4EAE",
                "yellow",
                "#FFFFFF",
                "#FFD580",
              ],
              [_networkMissingColor]
            )
          );
      },

      map: function (node) {
        if (node.subcluster_label) {
          if (node.priority_flag > 0) {
            return subcluster_enum[node.priority_flag];
          }
          return subcluster_enum[0];
        }
        return subcluster_enum[6];
      },
    };
  };

  self._networkPredefinedAttributeTransforms = {
    /** runtime computed node attributes, e.g. transforms of existing attributes */

    binned_vl_recent_value: {
      depends: ["vl_recent_value"],
      label: "binned_vl_recent_value",
      enum: ["<200", "200-10000", ">10000"],
      type: "String",
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(["<200", "200-10000", ">10000", _networkMissing])
          .range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
      },

      map: function (node) {
        var vl_value = self.attribute_node_value_by_id(
          node,
          "vl_recent_value",
          true
        );
        if (vl_value !== _networkMissing) {
          if (vl_value <= 200) {
            return "<200";
          }
          if (vl_value <= 10000) {
            return "200-10000";
          }
          return ">10000";
        }
        return _networkMissing;
      },
    },

    binned_vl_recent_value_adj: {
      depends: ["vl_recent_value_adj"],
      label: "Most Recent Viral Load Category Binned",
      enum: ["<200", "200-10000", ">10000"],
      type: "String",
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(["<200", "200-10000", ">10000", _networkMissing])
          .range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
      },

      map: function (node) {
        var vl_value = self.attribute_node_value_by_id(
          node,
          "vl_recent_value_adj",
          true
        );
        if (vl_value !== _networkMissing) {
          if (vl_value <= 200) {
            return "<200";
          }
          if (vl_value <= 10000) {
            return "200-10000";
          }
          return ">10000";
        }
        return _networkMissing;
      },
    },

    vl_result_interpretation: {
      depends: ["vl_recent_value", "result_interpretation"],
      label: "vl_result_interpretation",
      color_stops: 6,
      scale: d3.scale.log(10).domain([10, 1e6]).range([0, 5]),
      category_values: ["Suppressed", "Viremic (above assay limit)"],
      type: "Number-categories",
      color_scale: function (attr) {
        var color_scale_d3 = d3.scale
          .linear()
          .range([
            "#d53e4f",
            "#fc8d59",
            "#fee08b",
            "#e6f598",
            "#99d594",
            "#3288bd",
          ])
          .domain(_.range(_networkContinuousColorStops, -1, -1));

        return function (v) {
          if (_.isNumber(v)) {
            return color_scale_d3(attr.scale(v));
          }
          switch (v) {
            case attr.category_values[0]:
              return color_scale_d3(0);
            case attr.category_values[1]:
              return color_scale_d3(5);
            default:
              return _networkMissingColor;
          }
        };
      },
      label_format: d3.format(",.0f"),
      map: function (node) {
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
          vl_value !== _networkMissing ||
          result_interpretation !== _networkMissing
        ) {
          if (result_interpretation !== _networkMissing) {
            if (result_interpretation === "<") {
              return "Suppressed";
            }
            if (result_interpretation === ">") {
              return "Viremic (above assay limit)";
            }
            if (vl_value !== _networkMissing) {
              return vl_value;
            }
          } else {
            return vl_value;
          }
        }

        return _networkMissing;
      },
    },

    //subcluster_or_priority_node_simple: self.recent_rapid_definition_simple,
    //subcluster_or_priority_node: self.recent_rapid_definition,

    /*subcluster_index: {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Subcluster ID",
      type: "String",

      map: function (node) {
        return node.subcluster_label;
      },
    },*/

    age_dx_normalized: {
      depends: ["age_dx"],
      overwrites: "age_dx",
      label: "Age at Diagnosis",
      enum: ["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "≥60"],
      type: "String",
      color_scale: function () {
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
            _networkMissing,
          ])
          .range([
            "#b10026",
            "#e31a1c",
            "#fc4e2a",
            "#fd8d3c",
            "#feb24c",
            "#fed976",
            "#ffffb2",
            "#636363",
          ]);
      },
      map: function (node) {
        var vl_value = self.attribute_node_value_by_id(node, "age_dx");
        if (vl_value === ">=60") {
          return "≥60";
        }
        if (vl_value === "\ufffd60") {
          return "≥60";
        }
        if (Number(vl_value) >= 60) {
          return "≥60";
        }
        return vl_value;
      },
    },

    years_since_dx: {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Years since diagnosis",
      type: "Number",
      label_format: d3.format(".2f"),
      map: function (node) {
        try {
          var value = self._parse_dates(
            self.attribute_node_value_by_id(
              node,
              timeDateUtil._networkCDCDateField
            )
          );

          if (value) {
            value = (self.today - value) / 31536000000;
          } else {
            value = _networkMissing;
          }

          return value;
        } catch (err) {
          return _networkMissing;
        }
      },
      color_scale: function (attr) {
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
              range_without_missing[range_without_missing.length - 1],
            ])
            .range([0, 1])
        );
        return function (v) {
          if (v === _networkMissing) {
            return _networkMissingColor;
          }
          return color_scale(v);
        };
      },
    },

    hiv_aids_dx_dt_year: {
      depends: [timeDateUtil._networkCDCDateField],
      label: "Diagnosis Year",
      type: "Number",
      label_format: d3.format(".0f"),
      map: function (node) {
        try {
          var value = self._parse_dates(
            self.attribute_node_value_by_id(
              node,
              timeDateUtil._networkCDCDateField
            )
          );
          if (value) {
            value = String(value.getFullYear());
          } else {
            value = _networkMissing;
          }
          return value;
        } catch (err) {
          return _networkMissing;
        }
      },
      color_scale: function (attr) {
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
              range_without_missing[range_without_missing.length - 1],
            ])
            .range([0, 1])
        );
        return function (v) {
          if (v === _networkMissing) {
            return _networkMissingColor;
          }
          return color_scale(v);
        };
      },
    },
  };

  if (self.cluster_attributes) {
    self._networkPredefinedAttributeTransforms["_newly_added"] = {
      label: "Compared to previous network",
      enum: ["Existing", "New", "Moved clusters"],
      type: "String",
      map: function (node) {
        if (node.attributes.indexOf("new_node") >= 0) {
          return "New";
        }
        if (node.attributes.indexOf("moved_clusters") >= 0) {
          return "Moved clusters";
        }
        return "Existing";
      },
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(["Existing", "New", "Moved clusters", _networkMissing])
          .range(["#7570b3", "#d95f02", "#1b9e77", "gray"]);
      },
    };
  }

  if (self.precomputed_subclusters) {
    _.each(self.precomputed_subclusters, (v, k) => {
      self._networkPredefinedAttributeTransforms["_subcluster" + k] = {
        label: "Subcluster @" + d3.format("p")(Number(k)),
        type: "String",
        map: function (node) {
          if ("subcluster" in node) {
            var sub_at_k = _.find(node.subcluster, (t) => t[0] === k);
            if (sub_at_k) {
              return sub_at_k[1];
            }
          }
          return "Not in a subcluster";
        },
      };
    });
  }

  if (options && options["computed-attributes"]) {
    _.extend(
      self._networkPredefinedAttributeTransforms,
      options["computed-attributes"]
    );
  }

  self._parse_dates = function (value) {
    if (value instanceof Date) {
      return value;
    }
    var parsed_value = null;

    var passed = _.any(_defaultDateFormats, (f) => {
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
        throw Error("Invalid date");
      }
      return parsed_value;
    }

    throw Error("Invalid date");
  };

  /*------------ Network layout code ---------------*/
  var handle_cluster_click = function (cluster, release) {
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

    var already_fixed = cluster && cluster.fixed === 1;

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
          center_cluster_handler(cluster);
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

      cluster.fixed = 1;

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
        handle_cluster_click(null, already_fixed ? null : cluster);
      },
      true
    );
  };

  /*self._handle_inline_charts = function (e) {

  }*/

  self._get_node_country = function (node) {
    var countryCodeAlpha2 = self.attribute_node_value_by_id(node, "country");
    if (countryCodeAlpha2 === _networkMissing) {
      countryCodeAlpha2 = self.attribute_node_value_by_id(node, "Country");
    }
    return countryCodeAlpha2;
  };

  self._draw_topomap = function (no_redraw) {
    if (options && "showing_on_map" in options) {
      var countries = topojson.feature(
        self.countryOutlines,
        self.countryOutlines.objects.countries
      ).features;
      var mapsvg = d3.select("#" + self.dom_prefix + "-network-svg");
      var path = d3.geo.path().projection(self.mapProjection);
      countries = mapsvg.selectAll(".country").data(countries);

      countries.enter().append("path");
      countries.exit().remove();

      self.countries_in_cluster = {};

      _.each(self.nodes, (node) => {
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
        .attr("fill", (d) => {
          if (d.id in self.countries_in_cluster) {
            return "navajowhite";
          }
          return "bisque";
        })
        .attr("stroke-width", (d) => {
          if (d.id in self.countries_in_cluster) {
            return 1.5;
          }
          return 0.5;
        });
    }
    return self;
  };

  self._check_for_time_series = function (export_items) {
    var event_handler = function (network, e) {
      if (e) {
        e = d3.select(e);
      }
      if (!network.network_cluster_dynamics) {
        network.network_cluster_dynamics = network.network_svg
          .append("g")
          .attr("id", self.dom_prefix + "-dynamics-svg")
          .attr("transform", "translate (" + network.width * 0.45 + ",0)");

        network.handle_inline_charts = function (plot_filter) {
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
              timeDateUtil.getClusterTimeScale(),
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
                y: 0,
              },
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

    if (timeDateUtil.getClusterTimeScale()) {
      if (export_items) {
        export_items.push(["Show time-course plots", event_handler]);
      } else {
        event_handler(self);
      }
    }
  };

  self.open_exclusive_tab_close = function (
    tab_element,
    tab_content,
    restore_to_tag
  ) {
    //console.log (restore_to_tag);
    $(restore_to_tag).tab("show");
    $("#" + tab_element).remove();
    $("#" + tab_content).remove();
  };

  self.open_exclusive_tab_view = function (
    cluster_id,
    custom_filter,
    custom_name,
    additional_options,
    include_injected_edges
  ) {
    var cluster = _.find(
      self.clusters,
      (c) => String(c.cluster_id) === String(cluster_id)
    );

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
      $.extend(
        true,
        filtered_json[_networkGraphAttrbuteID],
        json[_networkGraphAttrbuteID]
      );
    }

    var export_items = [];
    if (!self._is_CDC_executive_mode) {
      export_items.push([
        "Export cluster to .CSV",
        function (network) {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(
              self._extract_nodes_by_id(cluster_id),
              self._extract_exportable_attributes()
            )
          );
        },
      ]);
    }

    //self._check_for_time_series(export_items);

    if ("extra_menu" in additional_options) {
      _.each(export_items, (item) => {
        additional_options["extra_menu"]["items"].push(item);
      });
    } else {
      _.extend(additional_options, {
        extra_menu: {
          title: "Action",
          items: export_items,
        },
      });
    }

    return self.open_exclusive_tab_view_aux(
      filtered_json,
      custom_name ? custom_name(cluster_id) : "Cluster " + cluster_id,
      additional_options
    );
  };

  self._random_id = function (alphabet, length) {
    alphabet = alphabet || ["a", "b", "c", "d", "e", "f", "g"];
    length = length || 32;
    var s = "";
    for (var i = 0; i < length; i++) {
      s += _.sample(alphabet);
    }
    return s;
  };

  self.open_exclusive_tab_view_aux = function (
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
      .on("click", () => {
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

    if (option_extras.type === "subcluster") {
      new_tab_content
        .addClass("subcluster-view")
        .addClass("subcluster-" + option_extras.cluster_id.replace(".", "_"));
    }

    //     <li class='disabled' id="attributes-tab"><a href="#trace-attributes" data-toggle="tab">Attributes</a></li>
    var new_button_bar;
    if (filtered_json) {
      new_button_bar = $('[data-hivtrace="cluster-clone"]')
        .clone()
        .attr("data-hivtrace", null);
      new_button_bar
        .find("[data-hivtrace-button-bar='yes']")
        .attr("id", random_button_bar)
        .addClass("cloned-cluster-tab")
        .attr("data-hivtrace-button-bar", null);

      new_button_bar.appendTo(new_tab_content);
    }
    new_tab_content.appendTo("#" + content_container);

    $(new_link).on("show.bs.tab", (e) => {
      //console.log (e);
      if (e.relatedTarget) {
        //console.log (e.relatedTarget);
        go_here_when_closed = e.relatedTarget;
      }
    });

    // show the new tab
    $(new_link).tab("show");

    var cluster_view;

    if (filtered_json) {
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
        "no-subcluster-compute": false,
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
          var draw_map = function (other_code, network) {
            other_code(network);
            return network._draw_topomap();
          };

          cluster_options["extra-graphics"] = _.wrap(
            draw_map,
            cluster_options["extra-graphics"]
          );
        } else {
          cluster_options["extra-graphics"] = function (network) {
            return network._draw_topomap();
          };
        }
      }

      cluster_options["today"] = self.today;

      cluster_view = hivtrace_cluster_network_graph(
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
          cluster_view.handle_attribute_continuous(
            self.colorizer["category_id"]
          );
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
    } else {
      return new_tab_content.attr("id");
    }
    return cluster_view;
  };

  // ensure all checkboxes are unchecked at initialization
  $('input[type="checkbox"]').prop("checked", false);

  var handle_node_click = function (node) {
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
        .on("click", (d) => {
          node.fixed = 0;
          collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      menu_object
        .append("li")
        .append("a")
        .attr("tabindex", "-1")
        .text((d) => (node.show_label ? "Hide text label" : "Show text label"))
        .on("click", (d) => {
          node.fixed = 0;
          //node.show_label = !node.show_label;
          handle_node_label(container, node);
          //collapse_cluster_handler(node, true);
          menu_object.style("display", "none");
        });

      if (clustersOfInterest.get_editor()) {
        menu_object
          .append("li")
          .append("a")
          .attr("tabindex", "-1")
          .text((d) => "Add this node to the cluster of interest")
          .on("click", (d) => {
            clustersOfInterest.get_editor().append_node(node.id, true);
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
        .style("left", String(d3.event.offsetX) + "px")
        .style("top", String(d3.event.offsetY) + "px")
        .style("display", "block");
    } else {
      menu_object.style("display", "none");
    }

    container.on(
      "click",
      (d) => {
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
      children: [],
    };

    // filter out clusters that are to be excluded
    if (self.exclude_cluster_ids) {
      mapped_clusters = _.omit(mapped_clusters, self.exclude_cluster_ids);
    }

    d_clusters.children = _.map(mapped_clusters, (value, key) => ({
      cluster_id: key,
      children: value,
    }));

    var treemap = packed
      ? d3.layout
          .pack()
          .size([self.width, self.height])
          //.sticky(true)
          .children((d) => d.children)
          .value((d) => d.parent.children.length ** 1.5)
          .sort((a, b) => b.value - a.value)
          .padding(5)
      : d3.layout
          .treemap()
          .size([self.width, self.height])
          //.sticky(true)
          .children((d) => d.children)
          .value((d) => d.parent.children.length ** 1.0)
          .sort((a, b) => a.value - b.value)
          .ratio(1);

    var clusters = treemap.nodes(d_clusters);
    _.each(clusters, (c) => {
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

    self.clusters.forEach((x) => {
      if (self.cluster_display_filter(x)) {
        // Check if hxb2_linked is in a child
        var hxb2_exists =
          x.children.some((c) => c.hxb2_linked) && self.hide_hxb2;
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

    self.nodes.forEach((x, i) => {
      if (expandedClusters[x.cluster]) {
        drawnNodes[i] = graphMe.nodes.length + graphMe.clusters.length;
        graphMe.nodes.push(x);
        graphMe.all.push(x);
      }
    });

    self.edges.forEach((x) => {
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
          y.ref = x;
          graphMe.edges.push(y);
        }
      }
    });

    return graphMe;
  }

  self._refresh_subcluster_view = function (set_date) {
    self.annotate_priority_clusters(
      timeDateUtil._networkCDCDateField,
      36,
      12,
      set_date
    );

    var field_def = self.recent_rapid_definition(self, set_date);

    //console.log (field_def.dimension);

    if (field_def) {
      _.each(self.nodes, (node) => {
        const attr_v = field_def["map"](node, self);
        inject_attribute_node_value_by_id(
          node,
          "subcluster_temporal_view",
          attr_v
        );
      });

      self.inject_attribute_description("subcluster_temporal_view", field_def);
      self._aux_process_category_values(
        self._aux_populate_category_fields(
          field_def,
          "subcluster_temporal_view"
        )
      );
      self.handle_attribute_categorical("subcluster_temporal_view");
    }
  };

  self.view_subcluster = function (
    cluster,
    custom_filter,
    custom_name,
    view_sub_options,
    custom_edge_filter,
    include_injected_edges,
    length_threshold
  ) {
    length_threshold = length_threshold || self.subcluster_threshold;
    let nodes = cluster.children;
    if (custom_filter) {
      if (_.isArray(custom_filter)) {
        nodes = custom_filter;
      } else {
        nodes = _.filter(self.json.Nodes, custom_filter);
      }
    }
    var filtered_json = _extract_single_cluster(
      nodes,
      custom_edge_filter || ((e) => e.length <= length_threshold),
      false,
      null,
      include_injected_edges
    );

    _.each(filtered_json.Nodes, (n) => {
      n.subcluster_label = "1.1";
    });

    if (_networkGraphAttrbuteID in json) {
      filtered_json[_networkGraphAttrbuteID] = {};
      $.extend(
        true,
        filtered_json[_networkGraphAttrbuteID],
        json[_networkGraphAttrbuteID]
      );
    }

    view_sub_options = view_sub_options || {};

    view_sub_options["parent_graph"] = self;

    var extra_menu_items = [
      [
        function (network, item) {
          var enclosure = item.append("div").classed("form-group", true);
          enclosure
            .append("label")
            .text("Recalculate National Priority from ")
            .classed("control-label", true);
          enclosure
            .append("input")
            .attr("type", "date")
            .classed("form-control", true)
            .attr("value", _defaultDateViewFormatSlider(self.today))
            .attr("max", _defaultDateViewFormatSlider(self.today))
            .attr(
              "min",
              _defaultDateViewFormatSlider(
                d3.min(network.nodes, (node) =>
                  network.attribute_node_value_by_id(
                    node,
                    timeDateUtil._networkCDCDateField
                  )
                )
              )
            )
            .on("change", function (e) {
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
            .on("click", (e) => {
              d3.event.stopPropagation();
            });
        },
        null,
      ],
    ];
    if (!self._is_CDC_executive_mode) {
      extra_menu_items.push([
        "Export cluster to .CSV",
        function (network) {
          helpers.export_csv_button(
            network._extract_attributes_for_nodes(
              network._extract_nodes_by_id("1.1"),
              network._extract_exportable_attributes()
            )
          );
        },
      ]);
    }

    view_sub_options["type"] = "subcluster";
    view_sub_options["cluster_id"] = cluster.cluster_id || "N/A";
    if ("extra_menu" in view_sub_options) {
      view_sub_options["extra_menu"]["items"] =
        view_sub_options["extra_menu"]["items"].concat(extra_menu_items);
    } else {
      view_sub_options["extra_menu"] = {
        title: "Action",
        items: extra_menu_items,
      };
    }

    //self._check_for_time_series(extra_menu_items);
    var cluster_view = self.open_exclusive_tab_view_aux(
      filtered_json,
      custom_name || "Subcluster " + cluster.cluster_id,
      view_sub_options
    );
    if (!view_sub_options.skip_recent_rapid)
      cluster_view.handle_attribute_categorical("subcluster_or_priority_node");
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

  var oldest_nodes_first = function (n1, n2) {
    const date_field = date_field || timeDateUtil._networkCDCDateField;

    // consistent node sorting, older nodes first
    var node1_dx = self.attribute_node_value_by_id(n1, date_field);
    var node2_dx = self.attribute_node_value_by_id(n2, date_field);

    if (node1_dx === node2_dx) {
      return n1.id < n2.id ? -1 : 1;
    }
    return node1_dx < node2_dx ? -1 : 1;
  };

  self._filter_by_date = function (
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
    }
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
    return false;
  };

  self.annotate_priority_clusters = function (
    date_field,
    span_months,
    recent_months,
    start_date
  ) {
    /* 
        values for priority_flag
            0: 0.5% subcluster
            1: last 12 months NOT in a priority cluster
            2: last 12 month IN priority cluster
            3: in priority cluster but not in 12 months
            4-7 is only computed for start dates different from the network date
            4: date present but is in the FUTURE compared to start_date
            5: date present but is between 1900 and start_date
            6: date missing
            7: in 0.5% cluster 12<dx<36 months but not a CoI
            
            
        SLKP 20221128:
            Add a calculation for simple classification of priority clusters
            
            0: not in a national priority CoI
            1: IN a national priority CoI ≤12 months
            2: IN a national priority CoI 12 - 36 months
            3: IN a national priority CoI >36 months
    */

    try {
      start_date = start_date || self.get_reference_date();

      var cutoff_long = _n_months_ago(start_date, span_months);
      var cutoff_short = _n_months_ago(start_date, recent_months);

      var node_iterator;

      if (start_date === self.today) {
        node_iterator = self.nodes;
      } else {
        var beginning_of_time = timeDateUtil.getCurrentDate();
        beginning_of_time.setYear(1900);
        node_iterator = [];
        _.each(self.nodes, (node) => {
          var filter_result = self._filter_by_date(
            beginning_of_time,
            date_field,
            start_date,
            node
            //true
          );
          if (_.isUndefined(filter_result)) {
            node.priority_flag = 6;
          } else if (filter_result) {
            node.priority_flag = 5;
            node_iterator.push(node);
          } else {
            node.priority_flag = 4;
          }
        });
      }

      // extract all clusters at once to avoid inefficiencies of multiple edge-set traversals

      var split_clusters = {};
      var node_id_to_local_cluster = {};

      // reset all annotations

      _.each(node_iterator, (node) => {
        node.nationalCOI = 0;
        if (node.cluster) {
          if (!(node.cluster in split_clusters)) {
            split_clusters[node.cluster] = { Nodes: [], Edges: [] };
          }
          node_id_to_local_cluster[node.id] =
            split_clusters[node.cluster]["Nodes"].length;
          split_clusters[node.cluster]["Nodes"].push(node);
        }
      });

      _.each(self.edges, (edge) => {
        if (edge.length <= self.subcluster_threshold) {
          var edge_cluster = self.nodes[edge.source].cluster;

          var source_id = self.nodes[edge.source].id;
          var target_id = self.nodes[edge.target].id;

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

      const cluster_id_match =
        self.precomputed_subclusters &&
        self.subcluster_threshold in self.precomputed_subclusters
          ? self.precomputed_subclusters
          : null;

      _.each(split_clusters, (cluster_nodes, cluster_index) => {
        /** extract subclusters; all nodes at given threshold */
        /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */

        //var cluster_nodes       = _extract_single_cluster (cluster.children, null, true);

        var array_index = self.cluster_mapping[cluster_index];

        self.clusters[array_index].priority_score = 0;

        var edges = [];

        /** all clusters with more than one member connected at 'threshold' edge length */
        var subclusters = _.filter(
          hivtrace_cluster_depthwise_traversal(
            cluster_nodes.Nodes,
            cluster_nodes.Edges,
            null,
            edges
          ),
          (cc) => cc.length > 1
        );

        /** all edge sets with more than one edge */
        edges = _.filter(edges, (es) => es.length > 1);

        /** sort subclusters by oldest node */
        _.each(subclusters, (c, i) => {
          c.sort(oldest_nodes_first);
        });

        subclusters.sort((c1, c2) => oldest_nodes_first(c1[0], c2[0]));

        let next_id = subclusters.length + 1;

        subclusters = _.map(subclusters, (c, i) => {
          let subcluster_id = i + 1;

          if (cluster_id_match) {
            const precomputed_values = {};
            _.each(c, (n) => {
              if ("subcluster" in n) {
                var sub_at_k = _.find(
                  n.subcluster,
                  (t) => t[0] === self.subcluster_threshold
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
              _.keys(precomputed_values).length !== 1
            ) {
              subcluster_id = next_id++;
            } else {
              subcluster_id = _.keys(precomputed_values)[0];
            }

            /*if ((i+1) !== 0 + subcluster_id) {
                console.log (self.clusters[array_index].cluster_id, i, "=>", subcluster_id, _.keys(precomputed_values));
             }*/
          }

          var label =
            self.clusters[array_index].cluster_id +
            _networkSubclusterSeparator +
            subcluster_id;

          _.each(c, (n) => {
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
              _.map(edges[i], (e) => e.length)
            ),
          };
        });

        _.each(subclusters, (c) => {
          _compute_cluster_degrees(c);
        });

        self.clusters[array_index].subclusters = subclusters;

        /** now, for each subcluster, extract the recent and rapid part */

        /** Recent & Rapid (National Priority) Cluster: the part of the Sub-Cluster inferred using only cases diagnosed in the previous 36 months
                and at least two cases dx-ed in the previous 12 months; there is a path between all nodes in a National Priority Cluster

            20180406 SLKP: while unlikely, this definition could result in multiple National Priority clusters
            per subclusters; for now we will add up all the cases for prioritization, and
            display the largest National Priority cluster if there is more than one
        */

        _.each(subclusters, (sub) => {
          // extract nodes based on dates

          const date_filter = (n) =>
            self._filter_by_date(cutoff_long, date_field, start_date, n);

          var subcluster_json = _extract_single_cluster(
            _.filter(sub.children, date_filter),
            null,
            true,
            cluster_nodes
          );

          var rr_cluster = _.filter(
            hivtrace_cluster_depthwise_traversal(
              subcluster_json.Nodes,
              _.filter(
                subcluster_json.Edges,
                (e) => e.length <= self.subcluster_threshold
              )
            ),
            (cc) => cc.length > 1
          );

          sub.rr_count = rr_cluster.length;

          rr_cluster.sort((a, b) => b.length - a.length);

          sub.priority_score = [];
          sub.recent_nodes = [];

          const future_date = new Date(start_date.getTime() + 1e13);

          _.each(rr_cluster, (recent_cluster) => {
            var priority_nodes = _.groupBy(recent_cluster, (n) =>
              self._filter_by_date(cutoff_short, date_field, start_date, n)
            );

            sub.recent_nodes.push(_.map(recent_cluster, (n) => n.id));
            const meets_priority_def =
              true in priority_nodes &&
              priority_nodes[true].length >=
                (self.CDC_data
                  ? self.CDC_data["autocreate-priority-set-size"]
                  : 3);

            if (true in priority_nodes) {
              // recent
              sub.priority_score.push(_.map(priority_nodes[true], (n) => n.id));
              _.each(priority_nodes[true], (n) => {
                n.priority_flag = self._filter_by_date(
                  start_date,
                  date_field,
                  future_date,
                  n
                )
                  ? 4
                  : 1;

                if (meets_priority_def) {
                  if (n.priority_flag === 1) {
                    n.priority_flag = 2;
                  }
                  n.nationalCOI = 1;
                }
              });
            }

            if (false in priority_nodes) {
              // not recent
              _.each(priority_nodes[false], (n) => {
                n.priority_flag = 3;

                if (meets_priority_def) {
                  if (
                    self._filter_by_date(cutoff_long, date_field, start_date, n)
                  ) {
                    n.nationalCOI = 2;
                  } else {
                    n.nationalCOI = 3;
                  }
                } else {
                  n.priority_flag = 7;
                }
              });
            }
          });

          //console.log (sub.recent_nodes);
          self.clusters[array_index].priority_score = sub.priority_score;
        });
      });
    } catch (err) {
      console.log(err);
    }
  };

  function default_layout(packed) {
    // let's create an array of clusters from the json

    var init_layout = get_initial_xy(packed);

    if (self.clusters.length === 0) {
      self.clusters = init_layout.filter(
        (v, i, obj) => !(typeof v.cluster_id === "undefined")
      );
    } else {
      var coordinate_update = {};
      _.each(self.clusters, (c) => {
        coordinate_update[c.cluster_id] = c;
      });
      _.each(init_layout, (c) => {
        if ("cluster_id" in c) {
          _.extendOwn(coordinate_update[c.cluster_id], c);
        }
      });
    }

    //var sizes = network_layout.size();

    var set_init_coords = packed
      ? function (n) {
          n.x += n.r * 0.5;
          n.y += n.r * 0.5;
        }
      : function (n) {
          n.x += n.dx * 0.5;
          n.y += n.dy * 0.5;
        };

    _.each([self.nodes, self.clusters], (list) => {
      _.each(list, set_init_coords);
    });

    self.clusters.forEach(collapse_cluster);
  }

  function change_spacing(delta) {
    self.charge_correction *= delta;
    network_layout.start();
  }

  function change_window_size(delta, trigger) {
    if (delta) {
      var x_scale = (self.width + delta / 2) / self.width;
      var y_scale = (self.height + delta / 2) / self.height;

      self.width += delta;
      self.height += delta;

      var rescale_x = d3.scale
        .linear()
        .domain(d3.extent(network_layout.nodes(), (node) => node.x));
      rescale_x.range(_.map(rescale_x.domain(), (v) => v * x_scale));
      //.range ([50,self.width-50]),
      var rescale_y = d3.scale
        .linear()
        .domain(d3.extent(network_layout.nodes(), (node) => node.y));
      rescale_y.range(_.map(rescale_y.domain(), (v) => v * y_scale));

      _.each(network_layout.nodes(), (node) => {
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
    } else if (delta) {
      self.update(true);
    }
  }

  self.compute_adjacency_list = _.once(() => {
    self.nodes.forEach((n) => {
      n.neighbors = d3.set();
    });

    self.edges.forEach((e) => {
      self.nodes[e.source].neighbors.add(e.target);
      self.nodes[e.target].neighbors.add(e.source);
    });
  });

  self.compute_local_clustering_coefficients = _.once(() => {
    self.compute_adjacency_list();

    self.nodes.forEach((n) => {
      _.defer((a_node) => {
        const neighborhood_size = a_node.neighbors.size();
        if (neighborhood_size < 2) {
          a_node.lcc = misc.undefined;
        } else if (neighborhood_size > 500) {
          a_node.lcc = misc.too_large;
        } else {
          // count triangles
          const neighborhood = a_node.neighbors.values();
          let counter = 0;
          for (let n1 = 0; n1 < neighborhood_size; n1 += 1) {
            for (let n2 = n1 + 1; n2 < neighborhood_size; n2 += 1) {
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
      }, n);
    });
  });

  self.get_node_by_id = function (id) {
    return self.nodes.filter((n) => n.id === id)[0];
  };

  self.compute_local_clustering_coefficients_worker = _.once(() => {
    var worker = new Worker("workers/lcc.js");

    worker.onmessage = function (event) {
      var nodes = event.data.Nodes;

      nodes.forEach((n) => {
        const node_to_update = self.get_node_by_id(n.id);
        node_to_update.lcc = n.lcc ? n.lcc : misc.undefined;
      });
    };

    var worker_obj = {};
    worker_obj["Nodes"] = self.nodes;
    worker_obj["Edges"] = self.edges;
    worker.postMessage(worker_obj);
  });

  var estimate_cubic_compute_cost = _.memoize(
    (c) => {
      self.compute_adjacency_list();
      return _.reduce(
        _.first(_.pluck(c.children, "degree").sort(d3.descending), 3),
        (memo, value) => memo * value,
        1
      );
    },
    (c) => c.cluster_id
  );

  self.compute_global_clustering_coefficients = _.once(() => {
    self.compute_adjacency_list();

    self.clusters.forEach((c) => {
      _.defer((a_cluster) => {
        const cluster_size = a_cluster.children.length;
        if (cluster_size < 3) {
          a_cluster.cc = misc.undefined;
        } else if (estimate_cubic_compute_cost(a_cluster, true) >= 5000000) {
          a_cluster.cc = misc.too_large;
        } else {
          // pull out all the nodes that have this cluster id
          const member_nodes = [];

          var triads = 0;
          var triangles = 0;

          self.nodes.forEach((n, i) => {
            if (n.cluster === a_cluster.cluster_id) {
              member_nodes.push(i);
            }
          });
          member_nodes.forEach((node) => {
            const my_neighbors = self.nodes[node].neighbors
              .values()
              .map((d) => Number(d))
              .sort(d3.ascending);
            for (let n1 = 0; n1 < my_neighbors.length; n1 += 1) {
              for (let n2 = n1 + 1; n2 < my_neighbors.length; n2 += 1) {
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
      }, c);
    });
  });

  self.mark_nodes_as_processing = function (property) {
    self.nodes.forEach((n) => {
      n[property] = misc.processing;
    });
  };

  self.compute_graph_stats = function () {
    d3.select(this).classed("disabled", true).select("i").classed({
      "fa-calculator": false,
      "fa-cog": true,
      "fa-spin": true,
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

    graph_data.Nodes.forEach((d) => {
      if (typeof self.cluster_sizes[d.cluster - 1] === "undefined") {
        self.cluster_sizes[d.cluster - 1] = 1;
      } else {
        self.cluster_sizes[d.cluster - 1]++;
      }
      if ("is_lanl" in d) {
        d.is_lanl = d.is_lanl === "true";
      }

      if (!("attributes" in d)) {
        d.attributes = [];
      }

      if (d.attributes.indexOf("problematic") >= 0) {
        self.has_hxb2_links = true;
        d.hxb2_linked = true;
      }
    });

    /* add buttons and handlers */
    /* clusters first */
    self._is_new_node = function (n) {
      return n.attributes.indexOf("new_node") >= 0;
    };

    self._extract_attributes_for_nodes = function (nodes, column_names) {
      var result = [_.map(column_names, (c) => c.raw_attribute_key)];

      _.each(nodes, (n) => {
        result.push(
          _.map(column_names, (c) => {
            if (c.raw_attribute_key === tables._networkNodeIDField) {
              if (self._is_new_node(n)) {
                return n.id + tables._networkNewNodeMarker;
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

    self._extract_exportable_attributes = function (extended) {
      var allowed_types = {
        String: 1,
        Date: 1,
        Number: 1,
      };

      var return_array = [];

      if (extended) {
        return_array = [
          {
            raw_attribute_key: tables._networkNodeIDField,
            type: "String",
            label: "Node ID",
            format: function () {
              return "Node ID";
            },
          },
          {
            raw_attribute_key: "cluster",
            type: "String",
            label: "Which cluster the individual belongs to",
            format: function () {
              return __("clusters_tab")["cluster_id"];
            },
          },
        ];
      }

      return_array.push(
        _.filter(
          self.json[_networkGraphAttrbuteID],
          (d) => d.type in allowed_types
        )
      );

      return _.flatten(return_array, true);
    };

    self._extract_nodes_by_id = function (id) {
      return _.filter(
        self.nodes,
        (n) =>
          n.cluster.toString() === id.toString() ||
          n.subcluster_label === id.toString()
      );
    };

    self._cluster_list_view_render = function (
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
      ).on("click", (d) => {
        if (self._is_CDC_executive_mode) {
          alert(_networkWarnExecutiveMode);
        } else {
          helpers.export_csv_button(
            self._extract_attributes_for_nodes(cluster_nodes, column_ids)
          );
        }
      });

      if (group_by_attribute) {
        _.each(column_ids, (column) => {
          var binned = _.groupBy(cluster_nodes, (n) =>
            self.attribute_node_value_by_id(n, column.raw_attribute_key)
          );
          var sorted_keys = _.keys(binned).sort();
          var attribute_record = the_list.append("li");
          attribute_record
            .append("code")
            .text(column.label || column.raw_attribute_key);
          var attribute_list = attribute_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(sorted_keys, (key) => {
            attribute_list.append("dt").text(key);
            attribute_list
              .append("dd")
              .text(_.map(binned[key], (n) => n.id).join(", "));
          });
        });
      } else {
        _.each(cluster_nodes, (node) => {
          var patient_record = the_list.append("li");
          patient_record.append("code").text(node.id);
          var patient_list = patient_record
            .append("dl")
            .classed("dl-horizontal", true);
          _.each(column_ids, (column) => {
            patient_list
              .append("dt")
              .text(column.label || column.raw_attribute_key);
            patient_list
              .append("dd")
              .text(
                self.attribute_node_value_by_id(node, column.raw_attribute_key)
              );
          });
        });
      }
    };

    self._setup_cluster_list_view = function () {
      d3.select(
        self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)
      ).on("click", function () {
        d3.event.preventDefault();
        var group_by_id;

        var button_clicked = $(this);
        if (button_clicked.data(__("clusters_tab")["view"]) === "id") {
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
        (event) => {
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
                  ? " in cluster of interest " + priority_list
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
            ).data(__("clusters_tab")["view"]) !== "id",
            modal.select(
              self.get_ui_element_selector_by_role("cluster_list_payload", true)
            ),
            priority_list
          );
        }
      );

      $(self.get_ui_element_selector_by_role("overlap_list", true)).on(
        "show.bs.modal",
        (event) => {
          var link_clicked = $(event.relatedTarget);
          var priority_list = link_clicked.data("priority_set");

          var modal = d3.select(
            self.get_ui_element_selector_by_role("overlap_list", true)
          );
          modal
            .selectAll(".modal-title")
            .text(
              "View how nodes in cluster of interest " +
                priority_list +
                " overlap with other clusterOI"
            );

          const ps = self.priority_groups_find_by_name(priority_list);
          if (!(ps && self.priority_node_overlap)) return;

          var headers = [
            [
              {
                value: "Node",
                help: "EHARS_ID of the node that overlaps with other clusterOI",
                sort: "value",
              },
              {
                value: "Other Cluster(s) of Interest",
                help: "Names of other clusterOI where this node is included",
                sort: "value",
              },
            ],
          ];

          var rows = [];
          var rows_for_export = [
            ["Overlapping Cluster of Interest", "Node", "Other clusterOI"],
          ];
          _.each(ps.nodes, (n) => {
            const overlap = self.priority_node_overlap[n.name];
            let other_sets = "None";
            if (overlap.size > 1) {
              other_sets = _.sortBy(
                _.filter([...overlap], (d) => d !== priority_list)
              ).join("; ");
            }
            rows.push([{ value: n.name }, { value: other_sets }]);
            rows_for_export.push([ps.name, n.name, other_sets]);
          });

          d3.select(
            self.get_ui_element_selector_by_role(
              "overlap_list_data_export",
              true
            )
          ).on("click", (d) => {
            helpers.export_csv_button(rows_for_export, "overlap");
          });

          tables.add_a_sortable_table(
            modal.select(
              self.get_ui_element_selector_by_role(
                "overlap_list_data_table",
                true
              )
            ),
            headers,
            rows,
            true,
            null,
            clustersOfInterest.get_editor()
          );
        }
      );
    };

    $(self.get_ui_element_selector_by_role("priority_set_merge", true)).on(
      "show.bs.modal",
      (event) => {
        var modal = d3.select(
          self.get_ui_element_selector_by_role("priority_set_merge", true)
        );

        const desc = modal.selectAll(".modal-desc");

        const proceed_btn = d3.select(
          self.get_ui_element_selector_by_role(
            "priority_set_merge_table_proceed",
            true
          )
        );

        if (
          self.defined_priority_groups &&
          self.defined_priority_groups.length > 1
        ) {
          desc.text("Select two or more clusters of interest to merge");

          var headers = [
            [
              {
                value: "Select",
              },
              {
                value: "Cluster of interest",
                help: "Cluster of interest Name",
                sort: "value",
              },
              {
                value: "Nodes",
                help: "How many nodes are in this cluster of interest",
                sort: "value",
              },
              {
                value: "Overlaps",
                help: "Overlaps with",
                sort: "value",
              },
            ],
          ];

          const current_selection = new Set();
          let current_node_set = null;
          let current_node_objects = null;

          const handle_selection = (name, selected) => {
            if (selected) {
              current_selection.add(name);
            } else {
              current_selection.delete(name);
            }
            if (current_selection.size > 1) {
              let clusterOITotalNOdes = 0;
              current_node_set = new Set();
              current_node_objects = {};
              _.each(self.defined_priority_groups, (pg) => {
                if (current_selection.has(pg.name)) {
                  clusterOITotalNOdes += pg.nodes.length;
                  _.each(pg.nodes, (n) => {
                    current_node_set.add(n.name);
                    current_node_objects[n.name] = {
                      _priority_set_date: n.added,
                      _priority_set_kind: n.kind,
                    };
                  });
                }
              });
              desc.html(
                "Merge " +
                  current_selection.size +
                  " clusterOI with " +
                  clusterOITotalNOdes +
                  " nodes, creating a new clusterOI with " +
                  current_node_set.size +
                  " nodes. <br><small>Note that the clusters of interest being merged will <b>not</b> be automatically deleted</small>"
              );
              proceed_btn.attr("disabled", null);
            } else {
              desc.text("Select two or more clusters of interest to merge");
              proceed_btn.attr("disabled", "disabled");
            }
          };

          const handle_merge = () => {
            if (current_node_set) {
              clustersOfInterest.open_editor(
                self,
                [],
                "",
                "Merged from " + [...current_selection].join(" and ")
              );
              clustersOfInterest
                .get_editor()
                .append_nodes([...current_node_set], current_node_objects);
            }
            $(modal.node()).modal("hide");
          };

          proceed_btn.attr("disabled", "disabled").on("click", handle_merge);

          var rows = [];
          _.each(self.defined_priority_groups, (pg) => {
            const my_overlaps = new Set();
            _.each(pg.nodes, (n) => {
              _.each([...self.priority_node_overlap[n.name]], (ps) => {
                if (ps !== pg.name) {
                  my_overlaps.add(ps);
                }
              });
            });

            rows.push([
              {
                value: pg,
                callback: function (element, payload) {
                  var this_cell = d3.select(element);
                  this_cell
                    .append("input")
                    .attr("type", "checkbox")
                    .style("margin-left", "1em")
                    .on("click", function (e) {
                      handle_selection(payload.name, $(this).prop("checked"));
                    });
                },
              },
              { value: pg.name },
              { value: pg.nodes.length },
              {
                value: [...my_overlaps],
                format: (d) => d.join("<br>"),
                html: true,
              },
            ]);
          });

          tables.add_a_sortable_table(
            modal.select(
              self.get_ui_element_selector_by_role(
                "priority_set_merge_table",
                true
              )
            ),
            headers,
            rows,
            true,
            null,
            clustersOfInterest.get_editor()
          );
        }
      }
    );

    if (button_bar_ui) {
      self._setup_cluster_list_view();

      var cluster_ui_container = d3.select(
        self.get_ui_element_selector_by_role("cluster_operations_container")
      );

      cluster_ui_container.selectAll("li").remove();

      var fix_handler = function (do_fix) {
        _.each([self.clusters, self.nodes], (list) => {
          _.each(list, (obj) => {
            obj.fixed = do_fix;
          });
        });
      };

      var node_label_handler = function (do_show) {
        var shown_nodes = self.network_svg.selectAll(".node");
        if (!shown_nodes.empty()) {
          shown_nodes.each((node) => {
            node.show_label = do_show;
          });
          self.update(true);
        }
      };

      var layout_reset_handler = function (packed) {
        var fixed = [];
        _.each(self.clusters, (obj) => {
          if (obj.fixed) {
            fixed.push(obj);
          }
          obj.fixed = false;
        });
        default_layout(packed);
        network_layout.tick();
        self.update();
        _.each(fixed, (obj) => {
          obj.fixed = true;
        });
      };

      var cluster_commands = [
        [
          __("clusters_main")["export_colors"],
          () => {
            const colorScheme = helpers.exportColorScheme(
              self.uniqValues,
              self.colorizer
            );

            //TODO: If using database backend, use api instead
            helpers.copyToClipboard(JSON.stringify(colorScheme));
          },
          true,
          "hivtrace-export-color-scheme",
        ],
        [
          __("clusters_main")["expand_all"],
          function () {
            return self.expand_some_clusters();
          },
          true,
          "hivtrace-expand-all",
        ],
        [
          __("clusters_main")["collapse_all"],
          function () {
            return self.collapse_some_clusters();
          },
          true,
          "hivtrace-collapse-all",
        ],
        [
          __("clusters_main")["expand_filtered"],
          function () {
            return self.expand_some_clusters(
              self.select_some_clusters((n) => n.match_filter)
            );
          },
          true,
          "hivtrace-expand-filtered",
        ],
        [
          __("clusters_main")["collapse_filtered"],
          function () {
            return self.collapse_some_clusters(
              self.select_some_clusters((n) => n.match_filter)
            );
          },
          true,
          "hivtrace-collapse-filtered",
        ],
        [
          __("clusters_main")["fix_all_objects_in_place"],
          _.partial(fix_handler, true),
          true,
          "hivtrace-fix-in-place",
        ],
        [
          __("clusters_main")["allow_all_objects_to_float"],
          _.partial(fix_handler, false),
          true,
          "hivtrace-allow-to-float",
        ],
        [
          __("clusters_main")["reset_layout"] + " [packed]",
          _.partial(layout_reset_handler, true),
          true,
          "hivtrace-reset-layout",
        ],
        [
          __("clusters_main")["reset_layout"] + " [tiled]",
          _.partial(layout_reset_handler, false),
          true,
          "hivtrace-reset-layout",
        ],
        [
          __("network_tab")["show_labels_for_all"],
          _.partial(node_label_handler, true),
          true,
          "hivtrace-node-labels-on",
        ],
        [
          __("network_tab")["hide_labels_for_all"],
          _.partial(node_label_handler, false),
          true,
          "hivtrace-node-labels-off",
        ],
        [
          "Hide problematic clusters",
          function (item) {
            d3.select(item).text(
              self.hide_hxb2
                ? "Hide problematic clusters"
                : "Show problematic clusters"
            );
            self.toggle_hxb2();
          },
          self.has_hxb2_links,
          "hivtrace-hide-problematic-clusters",
        ],
        [
          __("network_tab")["highlight_unsupported_edges"],
          function (item) {
            if (self.highlight_unsuppored_edges) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_highlight_unsupported_edges();
          },
          true,
          "hivtrace-highlight-unsuppored_edges",
          self.highlight_unsuppored_edges,
        ],
      ];

      if (self.cluster_attributes) {
        cluster_commands.push([
          "Show only changes since last network update",
          function (item) {
            if (self.showing_diff) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_diff();
          },
          true,
          "hivtrace-show-network-diff",
          self.showing_diff,
        ]);
      }

      if (timeDateUtil.getClusterTimeScale()) {
        cluster_commands.push([
          __("network_tab")["only_recent_clusters"],
          function (item) {
            if (self.using_time_filter) {
              d3.select(item).selectAll(".fa-check-square").remove();
            } else {
              d3.select(item)
                .insert("i", ":first-child")
                .classed("fa fa-check-square", true);
            }
            self.toggle_time_filter();
          },
          true,
          "hivtrace-show-using-time-filter",
          self.using_time_filter,
        ]);
      }

      if (!self._is_CDC_) {
        cluster_commands.push([
          "Show removed edges",
          function (item) {
            self.filter_edges = !self.filter_edges;
            d3.select(item).text(
              self.filter_edges ? "Show removed edges" : "Hide removed edges"
            );
            self.update(false);
          },
          function () {
            return _.some(self.edges, (d) => d.removed);
          },
          "hivtrace-show-removed-edges",
        ]);
      } else {
        cluster_commands.push([
          "Add filtered objects to cluster of interest",
          function (item) {
            if (clustersOfInterest.get_editor())
              clustersOfInterest
                .get_editor()
                .append_node_objects(
                  _.filter(json["Nodes"], (n) => n.match_filter)
                );
          },
          clustersOfInterest.get_editor,
          "hivtrace-add-filtered-to-panel",
        ]);
      }

      cluster_commands.forEach(function (item, index) {
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
            .on("click", function (e) {
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
          .on("click", (d) => {
            change_spacing(5 / 4);
          })
          .append("i")
          .classed("fa fa-plus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["compress_spacing"])
          .on("click", (d) => {
            change_spacing(4 / 5);
          })
          .append("i")
          .classed("fa fa-minus", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["enlarge_window"])
          .on("click", (d) => {
            change_window_size(100, true);
          })
          .append("i")
          .classed("fa fa-expand", true);
        button_group
          .append("button")
          .classed("btn btn-default btn-sm", true)
          .attr("title", __("network_tab")["shrink_window"])
          .on("click", (d) => {
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
            .on("click", function (d) {
              _.bind(self.compute_graph_stats, this)();
            })
            .append("i")
            .classed("fa fa-calculator", true);
        } else {
          button_group
            .append("button")
            .classed("btn btn-default btn-sm", true)
            .attr("title", __("network_tab")["toggle_epicurve"])
            .attr("id", "hivtrace-toggle-epi-curve")
            .on("click", (d) => {
              self._check_for_time_series();
            })
            .append("i")
            .classed("fa fa-line-chart", true);
        }

        var export_image = d3.select(
          self.get_ui_element_selector_by_role("export_image")
        );

        if (!export_image.empty()) {
          export_image.selectAll("div").remove();

          const buttonGroupDropdown = export_image
            .insert("div", ":first-child")
            .classed("input-group-btn dropdown-img", true);

          const dropdownList = buttonGroupDropdown
            .append("ul")
            .classed("dropdown-menu", true)
            .attr("aria-labelledby", "dropdownImg");

          dropdownList
            .append("li")
            .classed("dropdown-item export-img-item", true)
            .append("a")
            .attr("href", "#")
            .text("SVG")
            .on("click", (d) => {
              helpers.save_image("svg", "#" + self.dom_prefix + "-network-svg");
            });

          dropdownList
            .append("li")
            .classed("dropdown-item export-img-item", true)
            .append("a")
            .attr("href", "#")
            .text("PNG")
            .on("click", (d) => {
              helpers.save_image("png", "#" + self.dom_prefix + "-network-svg");
            });

          const imgBtn = buttonGroupDropdown
            .append("button")
            .attr("id", "dropdownImg")
            .attr("data-toggle", "dropdown")
            .classed("btn btn-default btn-sm dropdown-toggle", true)
            .attr("title", __("network_tab")["save_image"])
            .attr("id", "hivtrace-export-image");

          imgBtn.append("i").classed("fa fa-image", true);

          imgBtn.append("span").classed("caret", true);
        }
      }

      $(self.get_ui_element_selector_by_role("filter"))
        .off("input propertychange")
        .on(
          "input propertychange",
          _.throttle(function (e) {
            var filter_value = $(this).val();
            self.filter(self.filter_parse(filter_value));
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("hide_filter"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.hide_unselected = !self.hide_unselected;
            self.filter_visibility();
            self.update(true);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("show_small_clusters"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            if ("size" in self.cluster_filtering_functions) {
              delete self.cluster_filtering_functions["size"];
            } else {
              self.cluster_filtering_functions["size"] = self.filter_by_size;
            }

            self.update(false);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("set_min_cluster_size"))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.minimum_cluster_size = e.target.value;
            self.update(false);
          }, 250)
        );

      $(self.get_ui_element_selector_by_role("pairwise_table_pecentage", true))
        .off("change")
        .on(
          "change",
          _.throttle((e) => {
            self.show_percent_in_pairwise_table =
              !self.show_percent_in_pairwise_table;
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
    } else if (attributes && "hivtrace" in attributes) {
      attributes = attributes["hivtrace"];
    }

    // Initialize class attributes
    singletons = graph_data.Nodes.filter((v, i) => v.cluster === null).length;

    self.nodes_by_cluster = {};

    self.nodes = graph_data.Nodes.filter((v, i) => {
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

    self.edges = graph_data.Edges.filter(
      (v, i) => v.source in connected_links && v.target in connected_links
    );

    self.edges = self.edges.map((v, i) => {
      var cp_v = _.clone(v);
      cp_v.source = connected_links[v.source];
      cp_v.target = connected_links[v.target];
      cp_v.id = i;
      return cp_v;
    });

    compute_node_degrees(self.nodes, self.edges);

    default_layout(self.initial_packed);
    self.clusters.forEach((d, i) => {
      self.cluster_mapping[d.cluster_id] = i;
      d.hxb2_linked = d.children.some((c) => c.hxb2_linked);
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

        options["extra_menu"]["items"].forEach(function (item, index) {
          //console.log (item);
          var handler_callback = item[1];
          if (_.isFunction(item[0])) {
            item[0](self, this.append("li"));
          } else {
            this.append("li")
              .append("a")
              .text(item[0])
              .attr("href", "#")
              .on("click", function (e) {
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

    self._aux_populate_category_menus = function () {
      if (button_bar_ui) {
        // decide if the variable can be considered categorical by examining its range

        //console.log ("self._aux_populate_category_menus");
        var valid_cats = _.filter(
          _.map(
            graph_data[_networkGraphAttrbuteID],
            self._aux_populate_category_fields
          ),
          (d) =>
            /*if (d.discrete) {
              console.log (d["value_range"].length);
          }*/
            d.discrete &&
            "value_range" in d &&
            /*d["value_range"].length <= _maximumValuesInCategories &&*/
            !d["_hidden_"]
        );

        var valid_shapes = _.filter(
          valid_cats,
          (d) =>
            (d.discrete && d.dimension <= 7) ||
            (d["raw_attribute_key"] in _networkPresetShapeSchemes &&
              !d["_hidden_"])
        );

        // sort values alphabetically for consistent coloring

        _.each([valid_cats, valid_shapes], (list) => {
          _.each(list, self._aux_process_category_values);
        });

        const colorStopsPath = [
          _networkGraphAttrbuteID,
          self.colorizer["category_id"],
          "color_stops",
        ];

        const color_stops = _.get(
          graph_data,
          colorStopsPath,
          _networkContinuousColorStops
        );

        var valid_scales = _.filter(
          _.map(graph_data[_networkGraphAttrbuteID], (d, k) => {
            function determine_scaling(d, values, scales) {
              var low_var = Infinity;
              _.each(scales, (scl, i) => {
                d["value_range"] = d3.extent(values);
                var bins = _.map(_.range(color_stops), () => 0);
                scl.range([0, color_stops - 1]).domain(d["value_range"]);
                _.each(values, (v) => {
                  bins[Math.floor(scl(v))]++;
                });

                var mean = values.length / color_stops;
                var vrnc = _.reduce(
                  bins,
                  (p, c) => p + (c - mean) * (c - mean)
                );

                if (vrnc < low_var) {
                  low_var = vrnc;
                  d["scale"] = scl;
                }
              });
            }

            d["raw_attribute_key"] = k;

            if (d.type === "Number" || d.type === "Number-categories") {
              var values = _.filter(
                _.map(graph_data.Nodes, (nd) =>
                  self.attribute_node_value_by_id(nd, k, d.type === "Number")
                ),
                (v) => _.isNumber(v)
              );
              // automatically determine the scale and see what spaces the values most evenly
              const range = d3.extent(values);
              const scales_to_consider = [d3.scale.linear()];
              if (range[0] > 0) {
                scales_to_consider.push(d3.scale.log());
              }
              if (range[0] >= 0) {
                scales_to_consider.push(d3.scale.pow().exponent(1 / 3));
                scales_to_consider.push(d3.scale.pow().exponent(1 / 4));
                scales_to_consider.push(d3.scale.pow().exponent(1 / 2));
                scales_to_consider.push(d3.scale.pow().exponent(1 / 8));
                scales_to_consider.push(d3.scale.pow().exponent(1 / 16));
              }
              determine_scaling(d, values, scales_to_consider);
            } else if (d.type === "Date") {
              values = _.filter(
                _.map(graph_data.Nodes, (nd) => {
                  try {
                    var a_date = self.attribute_node_value_by_id(nd, k);
                    if (d.raw_attribute_key === "hiv_aids_dx_dt") {
                      //console.log (nd, k, a_date);
                    }
                    inject_attribute_node_value_by_id(
                      nd,
                      k,
                      self._parse_dates(a_date)
                    );
                  } catch (err) {
                    inject_attribute_node_value_by_id(nd, k, _networkMissing);
                  }
                  return self.attribute_node_value_by_id(nd, k);
                }),
                (v) => (v === _networkMissing ? null : v)
              );
              // automatically determine the scale and see what spaces the values most evenly
              if (values.length === 0) {
                // invalid scale
                return {};
              }

              determine_scaling(d, values, [d3.time.scale()]);
            }
            return d;
          }),
          (d) =>
            (d.type === "Number" ||
              d.type === "Date" ||
              d.type === "Number-categories") &&
            !d["_hidden_"]
        );

        const _menu_label_gen = (d) =>
          (d["annotation"] ? "[" + d["annotation"] + "] " : "") + d["label"];

        //console.log (valid_scales);
        //valid_cats.splice (0,0, {'label' : 'None', 'index' : -1});

        [
          d3.select(self.get_ui_element_selector_by_role("attributes")),
          d3.select(
            self.get_ui_element_selector_by_role("attributes_cat", true)
          ),
        ].forEach((m) => {
          //console.log (m);

          if (m.empty()) {
            return;
          }
          m.selectAll("li").remove();

          var menu_items = [
            [
              [
                "None",
                null,
                _.partial(self.handle_attribute_categorical, null),
              ],
            ],
            [[__("network_tab")["categorical"], "heading", null]],
          ].concat(
            valid_cats.map((d, i) => [
              [
                _menu_label_gen(d),
                d["raw_attribute_key"],
                _.partial(
                  self.handle_attribute_categorical,
                  d["raw_attribute_key"]
                ),
              ],
            ])
          );

          if (valid_scales.length) {
            menu_items = menu_items
              .concat([[[__("network_tab")["continuous"], "heading", null]]])
              .concat(
                valid_scales.map((d, i) => [
                  [
                    _menu_label_gen(d),
                    d["raw_attribute_key"],
                    _.partial(
                      self.handle_attribute_continuous,
                      d["raw_attribute_key"]
                    ),
                  ],
                ])
              );
          }

          var cat_menu = m.selectAll("li").data(menu_items);

          cat_menu
            .enter()
            .append("li")
            .classed("disabled", (d) => d[0][1] === "heading")
            .style("font-variant", (d) =>
              d[0][1] < -1 ? "small-caps" : "normal"
            );

          cat_menu
            .selectAll("a")
            .data((d) => d)
            .enter()
            .append("a")
            .html((d, i, j) => {
              let htm = d[0];
              let type = "unknown";

              if (d[1] in self.schema) {
                type = self.schema[d[1]].type;
              }

              if (d[1] in self.uniqs && type === "String") {
                htm =
                  htm +
                  '<span title="Number of unique values" class="badge pull-right">' +
                  self.uniqs[d[1]] +
                  "</span>";
              }

              return htm;
            })
            .attr("style", (d, i, j) => {
              if (d[1] === "heading") return "font-style: italic";
              if (j === 0) {
                return " font-weight: bold;";
              }
              return null;
            })
            .attr("href", "#")
            .on("click", (d) => {
              if (d[2]) {
                d[2].call();
              }
            });
        });

        [d3.select(self.get_ui_element_selector_by_role("shapes"))].forEach(
          (m) => {
            m.selectAll("li").remove();
            var cat_menu = m
              .selectAll("li")
              .data(
                [
                  [
                    [
                      "None",
                      null,
                      _.partial(self.handle_shape_categorical, null),
                    ],
                  ],
                ].concat(
                  valid_shapes.map((d, i) => [
                    [
                      _menu_label_gen(d),
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_shape_categorical,
                        d["raw_attribute_key"]
                      ),
                    ],
                  ])
                )
              );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", (d) =>
                d[0][1] < -1 ? "small-caps" : "normal"
              );

            cat_menu
              .selectAll("a")
              .data((d) => d)
              .enter()
              .append("a")
              .html((d, i, j) => {
                let htm = d[0];
                let type = "unknown";

                if (_.contains(_.keys(self.schema), d[1])) {
                  type = self.schema[d[1]].type;
                }

                if (_.contains(_.keys(self.uniqs), d[1]) && type === "String") {
                  htm =
                    htm +
                    '<span title="Number of unique values" class="badge pull-right">' +
                    self.uniqs[d[1]] +
                    "</span>";
                }

                return htm;
              })
              .attr("style", (d, i, j) => {
                if (j === 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", (d) => {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );

        $(self.get_ui_element_selector_by_role("opacity_invert"))
          .off("click")
          .on("click", function (e) {
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
          .on("click", function (e) {
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
              self.clusters.forEach((the_cluster) => {
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
          (m) => {
            m.selectAll("li").remove();
            var cat_menu = m
              .selectAll("li")
              .data(
                [
                  [
                    [
                      "None",
                      null,
                      _.partial(self.handle_attribute_opacity, null),
                    ],
                  ],
                ].concat(
                  valid_scales.map((d, i) => [
                    [
                      d["label"],
                      d["raw_attribute_key"],
                      _.partial(
                        self.handle_attribute_opacity,
                        d["raw_attribute_key"]
                      ),
                    ],
                  ])
                )
              );

            cat_menu
              .enter()
              .append("li")
              .style("font-variant", (d) =>
                d[0][1] < -1 ? "small-caps" : "normal"
              );
            cat_menu
              .selectAll("a")
              .data((d) => d)
              .enter()
              .append("a")
              .text((d, i, j) => d[0])
              .attr("style", (d, i, j) => {
                if (j === 0) {
                  return " font-weight: bold;";
                }
                return null;
              })
              .attr("href", "#")
              .on("click", (d) => {
                if (d[2]) {
                  d[2].call();
                }
              });
          }
        );
      }
    };

    self._aux_populated_predefined_attribute = function (computed, key) {
      if (_.isFunction(computed)) {
        computed = computed(self);
      }

      if (
        !computed["depends"] ||
        _.every(computed["depends"], (d) =>
          _.has(graph_data[_networkGraphAttrbuteID], d)
        )
      ) {
        var extension = {};
        extension[key] = computed;
        _.extend(graph_data[_networkGraphAttrbuteID], extension);
        self.inject_attribute_description(key, computed);
        _.each(graph_data.Nodes, (node) => {
          inject_attribute_node_value_by_id(
            node,
            key,
            computed["map"](node, self)
          );
        });

        // add unique values
        if (computed.enum) {
          self.uniqValues[key] = computed.enum;
        } else {
          /*self.uniqValues[key] = _.uniq(
            _.map(graph_data.Nodes, (n) =>
              self.attribute_node_value_by_id(n, key, computed.Type === "Number")
            )
          );*/

          var uniq_value_set = new Set();
          _.each(graph_data.Nodes, (n) =>
            uniq_value_set.add(
              self.attribute_node_value_by_id(
                n,
                key,
                computed.Type === "Number"
              )
            )
          );
          self.uniqValues[key] = [...uniq_value_set];
        }
        self.uniqs[key] = self.uniqValues[key].length;

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
            (a, i) => ({
              label: a,
              type: null,
              values: {},
              index: i,
              range: 0,
            })
          );

          graph_data.Nodes.forEach((n) => {
            n[_networkGraphAttrbuteID] = n.id.split(attribute_map["delimiter"]);
            n[_networkGraphAttrbuteID].forEach((v, i) => {
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

          graph_data[_networkGraphAttrbuteID].forEach((d) => {
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

      _.each(
        self._networkPredefinedAttributeTransforms,
        self._aux_populated_predefined_attribute
      );

      self._aux_populate_category_menus();

      // populate the UI elements
    }

    if (self.cluster_sizes.length > max_points_to_render) {
      var sorted_array = self.cluster_sizes
        .map((d, i) => [d, i + 1])
        .sort((a, b) => a[0] - b[0]);

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

    self.edges.forEach((e, i) => {
      self.clusters[
        self.cluster_mapping[self.nodes[e.target].cluster]
      ].distances.push(e.length);
    });

    self.clusters.forEach((d, i) => {
      d.distances = helpers.describe_vector(d.distances);
    });
    //self.clusters

    self.update();
  }

  function _cluster_table_draw_id(element, payload) {
    var this_cell = d3.select(element);
    this_cell.selectAll("*").remove();
    const _is_subcluster = payload[1];
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
      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");

      this_cell
        .append("button")
        .classed("btn btn-sm pull-right", true)
        //.text(__("clusters_tab")["view"])
        .on("click", (e) => {
          self.view_subcluster(payload[2]);
        })
        .append("i")
        .classed("fa fa-eye", true)
        .attr("title", __("clusters_tab")["view"]);
    } else {
      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
      this_cell
        .append("button")
        .classed("btn btn-sm pull-right", true)
        .style("margin-right", "0.25em")
        .on("click", (e) => {
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
    const label_diff = function (c_info) {
      const d = c_info["delta"];
      const moved = c_info["moved"];
      const deleted = c_info["deleted"];
      const new_count = c_info["new_nodes"] ? c_info["new_nodes"] : 0;

      /*if (moved) {
            if (d > 0) {
                return "" + moved + " nodes moved +" + d + " new";
            } else {
                if (d === 0) {
                    return "" + moved + " nodes moved";
                } else {
                    return "" + moved + " nodes moved " + (-d) + " removed";
                }
            }

        } else {
            if (d > 0) {
                return "+" + d + " nodes";
            } else {
                if (d === 0) {
                    return "no size change";
                } else {
                    return "" + (-d) + " nodes removed";
                }
            }
        }*/

      let label_str = "";
      if (moved) label_str = " " + moved + " moved ";
      if (new_count) label_str += "+" + new_count + " new ";
      if (deleted) label_str += "-" + deleted + " previous ";
      return label_str;
    };

    var labels = [];

    if (payload[4]) {
      if (payload[4]["type"] === "new") {
        if (payload[4]["moved"]) {
          labels.push(["renamed " + label_diff(payload[4]), 2]);
        } else {
          labels.push(["new", 3]);
        }
      } else if (payload[4]["type"] === "extended") {
        labels.push([label_diff(payload[4]), payload["4"]["flag"]]);
      } else if (payload[4]["type"] === "merged") {
        labels.push([
          "Merged " +
            payload[4]["old_clusters"].join(", ") +
            " " +
            label_diff(payload[4]),
          payload["4"]["flag"],
        ]);
      }
    }

    labels.push([
      [
        payload[0]
          ? __("clusters_tab")["expand"]
          : __("clusters_tab")["collapse"],
        payload[0] ? "fa-expand" : "fa-compress",
      ],
      0,
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
      .classed("btn-default", (d) => d[1] !== 1 && d[1] !== 2)
      .classed("btn-danger", (d) => d[1] === 2)
      .classed("btn-success", (d) => d[1] === 3)
      /*.text(function(d) {
        return d[0];
      })*/
      .style("margin-right", "0.25em")
      .attr("disabled", (d) => (d[1] === 1 ? "disabled" : null))
      .on("click", (d) => {
        if (d[1] === 0) {
          if (payload[0]) {
            expand_cluster(self.clusters[payload[3] - 1], true);
          } else {
            collapse_cluster(self.clusters[payload[3] - 1]);
          }
          self.update_volatile_elements(self.cluster_table);
          if (self.subcluster_table) {
            self.update_volatile_elements(self.subcluster_table);
          }
        } else if (d[1] === 2 || d[1] === 3) {
          //_social_view_options (labeled_links, shown_types),

          var shown_types = { Existing: 1, "Newly added": 1 },
            link_class = ["Existing", "Newly added"];

          self
            .open_exclusive_tab_view(
              payload[3],
              null,
              (cluster_id) => "Cluster " + cluster_id + " [changes view]",
              self._social_view_options(link_class, shown_types, (e) => {
                if (_.isObject(e.source) && self._is_new_node(e.source))
                  return "Newly added";
                if (_.isObject(e.target) && self._is_new_node(e.target))
                  return "Newly added";

                return e.attributes.indexOf("added-to-prior") >= 0
                  ? "Newly added"
                  : "Existing";
              })
            )
            .handle_attribute_categorical("_newly_added");
        }
      });
    buttons.each(function (d, i) {
      var this_e = d3.select(this);
      if (_.isString(d[0])) {
        this_e.selectAll("i").remove();
        this_e.text(d[0]);
      } else {
        var i_span = this_e.selectAll("i").data([d[0]]);
        i_span.enter().append("i");
        i_span
          .attr("class", (d) => "fa " + d[1], true)
          .attr("title", (d) => d[0]);
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

    cluster_json.Nodes = _.map(nodes, (c, i) => {
      map_to_id[c.id] = i;

      if (no_clone) {
        return c;
      }
      var cc = _.clone(c);
      cc.cluster = 1;
      return cc;
    });

    given_json = given_json || json;

    cluster_json.Edges = _.filter(given_json.Edges, (e) => {
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

    cluster_json.Edges = _.map(cluster_json.Edges, (e) => {
      var ne = _.clone(e);
      ne.source = map_to_id[given_json.Nodes[e.source].id];
      ne.target = map_to_id[given_json.Nodes[e.target].id];
      return ne;
    });

    return cluster_json;
  }

  function _node_table_draw_buttons(element, payload) {
    var this_cell = d3.select(element);
    let labels;
    if (payload.length === 1) {
      if (_.isString(payload[0])) {
        labels = [[payload[0], 1, "btn-warning"]];
      } else {
        labels = ["can't be shown", 1];
      }
    } else {
      labels = [[payload[0] ? "hide" : "show", 0]];
      // TODO: deprecated? remove if not needed (5/22/2024 meeting with @spond, @daniel-ji, @stevenweaver)
    }

    if (payload.length === 2 && payload[1] >= 1) {
      labels.push([
        "view cluster",
        function () {
          self.open_exclusive_tab_view(payload[1]);
        },
      ]);
    }

    var buttons = this_cell.selectAll("button").data(labels);
    buttons.enter().append("button");
    buttons.exit().remove();
    buttons
      .classed("btn btn-xs btn-node-property", true)
      .classed("btn-primary", true)
      //.classed(function (d) {return d.length >=3 ? d[2] : "";}, function (d) {return d.length >= 3;})
      .text((d) => d[0])
      .attr("disabled", (d) =>
        d[1] && !_.isFunction(d[1]) ? "disabled" : null
      )
      .on("click", (d) => {
        if (_.isFunction(d[1])) {
          d[1].call(d);
        } else if (d[1] === 0) {
          if (payload[0]) {
            collapse_cluster(self.clusters[payload[3] - 1], true);
          } else {
            expand_cluster(self.clusters[payload[3] - 1]);
          }
          //format_a_cell(d3.select(element).datum(), null, element);
          self.update_volatile_elements(nodesTab.getNodeTable());
        }
      });
    buttons.each(function (d, e) {
      if (d.length >= 3) {
        d3.select(this).classed("btn-primary", false).classed(d[2], true);
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

  self.update_volatile_elements = function (container) {
    //var event = new CustomEvent('hiv-trace-viz-volatile-update', { detail: container });
    //container.node().dispatchEvent (event);

    container
      .selectAll("td, th")
      .filter((d) => "volatile" in d)
      .each(function (d, i) {
        // TODO: QUESTION: Should this have priority_set_editor arg passed in as well?
        tables.format_a_cell(d, i, this);
      });
  };

  self.redraw_tables = function () {
    self.update_volatile_elements(self.cluster_table);
    if (self.subcluster_table) {
      self.update_volatile_elements(self.subcluster_table);
    }
    self.update_volatile_elements(nodesTab.getNodeTable());
    if (self.priority_set_table) {
      self.update_volatile_elements(self.priority_set_table);
    }
  };

  self.draw_extended_node_table = function (
    node_list,
    container,
    extra_columns
  ) {
    container = container || nodesTab.getNodeTable();

    if (container) {
      node_list = node_list || self.nodes;
      var column_ids = self._extract_exportable_attributes(true);

      self.displayed_node_subset = _.filter(
        _.map(self.displayed_node_subset, (n, i) => {
          if (_.isString(n)) {
            n = _.find(column_ids, (cd) => cd.raw_attribute_key === n);

            if (n) {
              return n;
            }
            return column_ids[i];
          }
          return n;
        }),
        (c) => c
      );

      var node_data = self._extract_attributes_for_nodes(
        node_list,
        self.displayed_node_subset
      );
      node_data.splice(0, 1);
      var table_headers = _.map(self.displayed_node_subset, (n, col_id) => ({
        value: n.raw_attribute_key,
        sort: "value",
        filter: true,
        volatile: true,
        help: "label" in n ? n.label : n.raw_attribute_key,
        //format: (d) => "label" in d ? d.label : d.raw_attribute_key,
        callback: function (element, payload) {
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
              "dropdown-toggle": true,
            })
            .attr("type", "button")
            .attr("data-toggle", "dropdown")
            .attr("aria-haspopup", "true")
            .attr("aria-expanded", "false")
            .attr("id", menu_id);

          function format_key(key) {
            const formattedKey = jsConvert.toHeaderCase(key);
            const words = formattedKey.split(" ");
            const mappedWords = _.map(words, (word) => {
              if (word.toLowerCase() === "hivtrace") {
                return "HIV-TRACE";
              }
              if (word.toLowerCase() === "id") {
                return "ID";
              }

              return word;
            });
            return mappedWords.join(" ");
          }

          function get_text_label(key) {
            return key in json.patient_attribute_schema
              ? json.patient_attribute_schema[key].label
              : format_key(key);
          }

          dropdown_button.text(get_text_label(payload));

          dropdown_button.append("i").classed({
            fa: true,
            "fa-caret-down": true,
            "fa-lg": true,
          });
          var dropdown_list = dropdown
            .append("ul")
            .classed("dropdown-menu", true)
            .attr("aria-labelledby", menu_id);

          dropdown_list = dropdown_list
            .selectAll("li")
            .data(
              _.filter(
                column_ids,
                (alt) => alt.raw_attribute_key !== n.raw_attribute_key
              )
            );
          dropdown_list.enter().append("li");
          dropdown_list.each(function (data, i) {
            var handle_change = d3
              .select(this)
              .append("a")
              .attr("href", "#")
              .text((data) => get_text_label(data.raw_attribute_key));
            handle_change.on("click", (d) => {
              self.displayed_node_subset[col_id] = d;
              self.draw_extended_node_table(
                node_list,
                container,
                extra_columns
              );
            });
          });
          return dropdown;
        },
      }));

      if (extra_columns) {
        _.each(extra_columns, (d) => {
          if (d.prepend) {
            table_headers.splice(0, 0, d.description);
          } else {
            table_headers.push(d.description);
          }
        });
      }
      //console.log (self.displayed_node_subset);

      var table_rows = node_data.map((n, i) => {
        var this_row = _.map(n, (cell, c) => {
          let cell_definition = null;

          if (self.displayed_node_subset[c].type === "Date") {
            cell_definition = {
              value: cell,
              format: function (v) {
                if (v === _networkMissing) {
                  return v;
                }
                return _defaultDateViewFormatSlider(v);
              },
            };
          } else if (self.displayed_node_subset[c].type === "Number") {
            cell_definition = { value: cell, format: d3.format(".2f") };
          }
          if (!cell_definition) {
            cell_definition = { value: cell };
          }

          // this makes the table rendering too slow

          /*if (c === 0 && self._is_CDC_) {
             cell_definition.volatile = true;
             cell_definition.actions = function (item, value) {
              if (!clustersOfInterest.get_editor()) {
                    return null;
              } else {
                    return [
                        {
                            "icon"   : "fa-plus-square",
                            "action" : function (button,v) {
                                if (clustersOfInterest.get_editor()) {
                                    clustersOfInterest.get_editor().append_node_objects (d.children);
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
          _.each(extra_columns, (ed) => {
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

  self.generate_coi_temporal_report = function (ref_set, D) {
    if (!ref_set) return {};
    D = D || 0.005;

    const nodesD = hivtrace_cluster_depthwise_traversal(
      json["Nodes"],
      json["Edges"],
      (e) => e.length <= D,
      null,
      ref_set.node_objects
    );

    const full_subclusters = _.map(nodesD, (cc) =>
      _extract_single_cluster(cc, (e) => e.length <= D)
    );
    // the nodes in full_subclusters are now shallow clones
    // const nodeid2cc = _.chain(nodesD) // unused var
    //   .map((cc, i) => _.map(cc, (n) => [n.id, i]))
    //   .flatten(1)
    //   .object()
    //   .value();
    // node id => index of its connected component in the full_subclusters array
    const pg_nodes = new Set(_.map(ref_set.node_objects, (n) => n.id));
    // set of node IDs in the CoI
    const seed_nodes = _.map(full_subclusters, (fc) =>
      _.filter(fc["Nodes"], (n) => pg_nodes.has(n.id))
    );
    // for each connected component, store the list of nodes that are both in the CC and the CoI
    // these are shallow copies
    _.each(seed_nodes, (sn) => _.each(sn, (n) => (n.visited = false)));

    var beginning_of_time = timeDateUtil.getCurrentDate();
    beginning_of_time.setFullYear(1900);

    // unused var
    // const nodesD2 = _.map(full_subclusters, (fc, i) => hivtrace_cluster_depthwise_traversal(
    //   fc["Nodes"],
    //   fc["Edges"],
    //   (e) => (e.length <= D),
    //   null,
    //   seed_nodes[i]
    // ));

    const network_events = _.sortBy([...self.priority_groups_all_events()]);
    network_events.reverse();
    const info_by_event = {};

    _.each(network_events, (DT) => {
      const event_date = _defaultDateViewFormatSlider.parse(DT);
      const event_date_m3y = _defaultDateViewFormatSlider.parse(DT);
      event_date_m3y.setFullYear(event_date.getFullYear() - 3);
      const event_date_m1y = _defaultDateViewFormatSlider.parse(DT);
      event_date_m1y.setFullYear(event_date.getFullYear() - 1);
      const n_filter = (n) =>
        self._filter_by_date(
          beginning_of_time,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );
      const n_filter3 = (n) =>
        self._filter_by_date(
          event_date_m3y,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );
      const n_filter1 = (n) =>
        self._filter_by_date(
          event_date_m1y,
          timeDateUtil._networkCDCDateField,
          event_date,
          n
        );

      let nodesD2 = _.map(full_subclusters, (fc, i) => {
        const white_list = new Set(
          _.map(_.filter(fc["Nodes"], n_filter), (n) => n.id)
        );
        const cc_nodes = fc["Nodes"];
        return hivtrace_cluster_depthwise_traversal(
          cc_nodes,
          fc["Edges"],
          (e) =>
            e.length <= D &&
            n_filter3(cc_nodes[e.source]) &&
            n_filter3(cc_nodes[e.target]),
          null,
          _.filter(seed_nodes[i], n_filter),
          white_list
        );
      });

      nodesD2 = _.flatten(nodesD2, 1);
      //console.log (nodesD2);

      info_by_event[DT] = {
        connected_componets: _.map(nodesD2, (nd) => nd.length),
        priority_nodes: _.map(nodesD2, (nd) =>
          _.map(_.filter(nd, n_filter1), (n) => n.id)
        ),
      };

      info_by_event[DT]["national_priority"] = _.map(
        info_by_event[DT].priority_nodes,
        (m) => m.length >= self.CDC_data["autocreate-priority-set-size"]
      );
    });

    const report = {
      node_info: _.map(ref_set.node_objects, (n) => [
        n.id,
        _defaultDateViewFormatSlider(
          self.attribute_node_value_by_id(n, timeDateUtil._networkCDCDateField)
        ),
      ]),
      event_info: info_by_event,
    };

    /*let options = ["0","1","2","3","4","5","6","7","8","9","10"];
          let rename = {};
          _.each (report.node_info, (n)=> {
                rename[n[0]] = "N" + _.sample (options, 9).join ("");
                n[0] = rename[n[0]];
          });
          _.each (report.event_info, (d)=> {
              d.priority_nodes = _.map (d.priority_nodes, (d)=>_.map (d, (n)=>rename[n]));
          });
          //console.log (report);
          */

    helpers.export_json_button(report);
    return report;
  };

  self.draw_node_table = function (
    extra_columns,
    node_list,
    headers,
    rows,
    container,
    table_caption
  ) {
    container = container || nodesTab.getNodeTable();

    if (container) {
      node_list = node_list || self.nodes;

      if (!headers) {
        headers = [
          [
            {
              value: "ID",
              sort: "value",
              help: "Node ID",
            },
            {
              value: "Action",
              sort: "value",
            },
            {
              value: "# of links",
              sort: "value",
              help: "Number of links (Node degree)",
            },
            {
              value: "Cluster",
              sort: "value",
              help: "Which cluster does the node belong to",
            },
          ],
        ];

        if (extra_columns) {
          _.each(extra_columns, (d) => {
            if (d.prepend) {
              headers[0].splice(0, 0, d.description);
            } else {
              headers[0].push(d.description);
            }
          });
        }

        rows = node_list.map((n, i) => {
          var this_row = [
            {
              value: n.id,
              help: "Node ID",
            },
            {
              value: function () {
                if (n.node_class !== "injected") {
                  try {
                    if (self.exclude_cluster_ids[n.cluster]) {
                      // parent cluster can't be rendered
                      // because of size restrictions
                      return [n.cluster];
                    }
                    return [
                      !self.clusters[self.cluster_mapping[n.cluster]].collapsed,
                      n.cluster,
                    ];
                  } catch (err) {
                    return [-1];
                  }
                } else {
                  return [n.node_annotation];
                }
              },
              callback: _node_table_draw_buttons,
              volatile: true,
            },
            {
              value: "degree" in n ? n.degree : "Not defined",
              help: "Node degree",
            },
            {
              value: "cluster" in n ? n.cluster : "Not defined",
              help: "Which cluster does the node belong to",
            },
          ];

          if (extra_columns) {
            _.each(extra_columns, (ed) => {
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

      tables.add_a_sortable_table(
        container,
        headers,
        rows,
        true,
        table_caption,
        clustersOfInterest.get_editor()
        // rows
      );
    }
  };

  self.draw_cluster_table = function (extra_columns, element, options) {
    var skip_clusters = options && options["no-clusters"];
    var skip_subclusters = !(options && options["subclusters"]);

    element = element || self.cluster_table;

    if (element) {
      var headers = [
        [
          {
            value: __("general")["cluster"] + " ID",
            sort: function (c) {
              return _.map(
                c.value[0].split(_networkSubclusterSeparator),
                (ss) => _networkDotFormatPadder(Number(ss))
              ).join("|");
            },
            help: "Unique cluster ID",
          },
          {
            value: __("general")["attributes"],
            sort: function (c) {
              c = c.value();
              if (c[4]) {
                // has attributes
                return c[4]["delta"];
              }
              return c[0];
            },
            help: "Visibility in the network tab and other attributes",
          },
          {
            value: __("clusters_tab")["size"],
            sort: "value",
            help: "Number of nodes in the cluster",
          },
        ],
      ];

      if (self.cluster_attributes) {
        headers[0][1]["presort"] = "desc";
      }

      if (self._is_seguro) {
        headers[0].push({
          value: __("clusters_tab")["number_of_genotypes_in_past_2_months"],
          sort: "value",
          help: "# of cases in cluster genotyped in the last 2 months",
        });

        headers[0].push({
          value:
            __("clusters_tab")["scaled_number_of_genotypes_in_past_2_months"],
          sort: "value",
          help: "# of cases in cluster genotyped in the last 2 months divided by the square-root of the cluster size",
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
          html: true,
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
          html: true,
        });
      }

      if (extra_columns) {
        _.each(extra_columns, (d) => {
          headers[0].push(d.description);
        });
      }

      if (options && options["headers"]) {
        options["headers"](headers);
      }

      var rows = [];

      _.each(self.clusters, (cluster) => {
        var make_row = function (d, is_subcluster) {
          var this_row = [
            {
              value: [d.cluster_id, is_subcluster, d], //.cluster_id,
              callback: _cluster_table_draw_id,
            },
            {
              value: function () {
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
                    : null,
                ];
              },
              callback: _cluster_table_draw_buttons,
              volatile: true,
            },
            {
              value: d.children.length,
            },
          ];

          if (self._is_CDC_) {
            this_row[2].volatile = true;
            this_row[2].actions = function (item, value) {
              if (!clustersOfInterest.get_editor()) {
                return null;
              }
              return [
                {
                  icon: "fa-plus",
                  action: function (button, v) {
                    if (clustersOfInterest.get_editor()) {
                      clustersOfInterest
                        .get_editor()
                        .append_node_objects(d.children);
                    }
                    return false;
                  },
                  help: "Add to cluster of interest",
                },
              ];
            };
          }

          if (self._is_seguro) {
            this_row.push({
              value: d,
              format: function (d) {
                return _.filter(
                  d.children,
                  (child) =>
                    d3.time.months(
                      child.patient_attributes["sample_dt"],
                      timeDateUtil.getCurrentDate()
                    ).length <= 2
                ).length;
              },
            });

            this_row.push({
              value: d,
              format: function (d) {
                const recent = _.filter(
                  d.children,
                  (child) =>
                    d3.time.months(
                      child.patient_attributes["sample_dt"],
                      timeDateUtil.getCurrentDate()
                    ).length <= 2
                ).length;
                return recent / Math.sqrt(d.children.length);
              },
            });
          }

          if (!self._is_CDC_) {
            this_row.push({
              value: d.degrees,
              format: function (d) {
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
              },
            });
            this_row.push({
              value: d.distances,
              format: function (d) {
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
              },
            });
          }
          if (extra_columns) {
            _.each(extra_columns, (ed) => {
              this_row.push(ed.generator(d, self));
            });
          }

          return this_row;
        };

        if (!skip_clusters) {
          rows.push(make_row(cluster, false));
        }

        if (!skip_subclusters) {
          _.each(cluster.subclusters, (sub_cluster) => {
            rows.push(make_row(sub_cluster, true));
          });
        }
      });

      tables.add_a_sortable_table(
        element,
        headers,
        rows,
        true,
        options && options["caption"] ? options["caption"] : null,
        clustersOfInterest.get_editor()
      );
    }
  };

  /*------------ Update layout code ---------------*/
  function update_network_string(node_count, edge_count) {
    if (network_status_string) {
      const clusters_shown = _.filter(
        self.clusters,
        (c) => !c.collapsed
      ).length;

      const clusters_selected = _.filter(
        self.clusters,
        (c) =>
          !c.is_hidden && c.match_filter !== undefined && c.match_filter > 0
      ).length;

      const nodes_selected = _.filter(
        self.nodes,
        (n) => n.match_filter && !n.is_hidden
      ).length;

      // const clusters_removed = self.cluster_sizes.length - self.clusters.length;
      // const nodes_removed = graph_data.Nodes.length - singletons - self.nodes.length;
      // const networkString = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
      //         + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
      //         + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
      // if (singletons > 0) {
      //   networkString += "<strong>" +singletons + "</strong> singleton nodes are not shown. ";
      // }

      const networkString =
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

      d3.select(network_status_string).html(networkString);
    }
  }

  function draw_a_node(container, node) {
    if (node) {
      container = d3.select(container);
      //console.log (container.selectAll ("path"));
      //var path_component = containter.selectAll ("path");

      let symbol_type;

      if (node.hxb2_linked && !node.is_lanl) {
        symbol_type = "cross";
      } else if (node.is_lanl) {
        symbol_type = "triangle-down";
      } else {
        symbol_type = self.node_shaper["shaper"](node);
      }

      node.rendered_size = Math.sqrt(node_size(node)) / 2 + 2;

      container
        .selectAll("path")
        .attr("d", misc.symbol(symbol_type).size(node_size(node)))
        .style("fill", (d) => node_color(d));

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
        .classed(
          "selected_object",
          (d) => d.match_filter && !self.hide_unselected
        )
        .classed("injected_object", (d) => d.node_class === "injected")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .style("opacity", (d) => node_opacity(d))
        .style("display", (d) => {
          if (d.is_hidden) return "none";
          return null;
        })
        .call(
          network_layout.drag().on("dragstart", (d) => {
            d3.event.sourceEvent.stopPropagation();
            node_pop_off();
          })
        )
        .on("dragend", (d) => {
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

    var arc_radius = cluster_box_size(the_cluster) * 0.5;
    the_cluster.rendered_size = arc_radius + 2;
    var paths = container_group.selectAll("path").data(draw_from);
    paths.enter().append("path");
    paths.exit().remove();

    paths
      .classed("cluster", true)
      .classed(
        "hiv-trace-problematic",
        (d) => the_cluster.hxb2_linked && !d.rim
      )
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

        return cluster_color(the_cluster, d.name);
      })
      .style("stroke-linejoin", (d, i) => (draw_from.length > 1 ? "round" : ""))
      .style("display", (d) => {
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
        range: _.map(
          domain,
          (v) =>
            _networkPresetShapeSchemes[cat_id][
              graph_data[_networkGraphAttrbuteID][cat_id]["value_range"][v]
            ]
        ),
      };
    }
    return {
      domain: _.range(0, graph_data[_networkGraphAttrbuteID][cat_id].dimension),
      range: _networkShapeOrdering,
    };
  }

  self.handle_shape_categorical = function (cat_id) {
    var set_attr = "None";

    ["shapes"].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d[1] === cat_id) {
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
      self.node_shaper["shaper"] = function (d) {
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
      self.node_shaper.shaper = () => "circle";
      self.node_shaper["category_map"] = null;
    }
    //console.log (graph_data [_networkGraphAttrbuteID][cat_id]['value_map'], self.node_shaper.domain(), self.node_shaper.range());
    self.draw_attribute_labels();
    self.update(true);
    d3.event.preventDefault();
  };

  self.renderColorPicker = function (cat_id, type) {
    const renderColorPickerCategorical = function (cat_id) {
      // For each unique value, render item.
      let colorizer = self.colorizer;
      let items = _.map(_.filter(self.uniqValues[cat_id]), (d) =>
        colorPicker.colorPickerInput(d, colorizer)
      );

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change((e) => {
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

        graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"][name] =
          color;
        self.handle_attribute_categorical(cat_id);
      });
    };

    const renderColorPickerContinuous = function (cat_id, color_stops) {
      // For each unique value, render item.
      // Min and max range for continuous values
      let items = [
        colorPicker.colorStops("Color Stops", color_stops),
        colorPicker.colorPickerInputContinuous(
          "Min",
          self.uniqValues[cat_id]["min"]
        ),
        colorPicker.colorPickerInputContinuous(
          "Max",
          self.uniqValues[cat_id]["max"]
        ),
      ];

      $("#colorPickerRow").html(items.join(""));

      // Set onchange event for items
      $(".hivtrace-color-picker").change((e) => {
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
        graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"][name] =
          color;
        self.handle_attribute_continuous(cat_id);
      });

      // Set onchange event for items
      $(".hivtrace-color-stops").change((e) => {
        let num = parseInt(e.target.value);
        graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
          "color_stops"
        ] = num;

        self._aux_populate_category_menus();
        self.handle_attribute_continuous(cat_id);
        self.update();
      });
    };

    if (type === "categorical") {
      renderColorPickerCategorical(cat_id);
    } else if (type === "continuous") {
      renderColorPickerContinuous(
        cat_id,
        graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]][
          "color_stops"
        ]
      );
    } else {
      console.log("Error: type not recognized");
    }

    if (cat_id !== null) {
      $("#colorPickerOption").show();
    } else {
      $("#colorPickerOption").hide();
    }
  };

  self.draw_attribute_labels = function () {
    // draw color legend in the network SVG

    var determine_label_format_cont = function (field_data) {
      if ("label_format" in field_data) {
        return field_data["label_format"];
      }
      if (field_data["type"] === "Date") {
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

      _.each(self.edge_legend["types"], (value, key) => {
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

        _.each(_.range(color_stops), (value) => {
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
            (value) => {
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
        _.each(self.colorizer["category_map"](null, "map"), (value, key) => {
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

      _.each(self.node_shaper["category_map"](null, "map"), (value, key) => {
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

      anchor_format = determine_label_format_cont(
        graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]]
      );

      scale =
        graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]][
          "scale"
        ];

      _.each(_.range(_networkContinuousColorStops), (value) => {
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
      var values = _.map(cluster.children, (node) => {
        var value = self.attribute_node_value_by_id(node, cat_id);
        return value === _networkMissing ? Infinity : value;
      }).sort((a, b) => 0 + a - (0 + b));
      var finite = _.filter(values, (d) => d < Infinity);
      var infinite = values.length - finite.length;

      if (infinite) {
        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", _networkMissingColor);
        gradient
          .append("stop")
          .attr("offset", String((infinite / values.length) * 100) + "%")
          .attr("stop-color", _networkMissingColor);
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
      //gradient.append ("stop").attr ("offset", "100%").attr ("stop-color", self.colorizer['category'] (dom[1]));

      return id;
    }
    return null;
  }

  self.handle_attribute_opacity = function (cat_id) {
    var set_attr = "None";

    ["opacity"].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d[1] === cat_id) {
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
      .style("display", set_attr === "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    self.colorizer["opacity_id"] = cat_id;
    if (cat_id) {
      var scale = graph_data[_networkGraphAttrbuteID][cat_id]["scale"];
      self.colorizer["opacity_scale"] = d3.scale
        .linear()
        .domain([0, _networkContinuousColorStops - 1])
        .range([0.25, 1]);
      self.colorizer["opacity"] = function (v) {
        if (v === _networkMissing) {
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

  self.handle_attribute_continuous = function (cat_id) {
    var set_attr = "None";

    render_chord_diagram("aux_svg_holder", null, null);
    render_binned_table("attribute_table", null, null);

    self.network_svg.selectAll("radialGradient").remove();

    self.clusters.forEach((the_cluster) => {
      delete the_cluster["binned_attributes"];
      delete the_cluster["gradient"];
    });

    [
      ["attributes", false],
      ["attributes_cat", true],
    ].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d[1] === cat_id) {
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
      .style("display", set_attr === "None" ? "none" : "inline")
      .classed("btn-active", false)
      .classed("btn-default", true);

    if (cat_id) {
      // map values to inverted scale
      const color_stops =
        graph_data[_networkGraphAttrbuteID][cat_id]["color_stops"] ||
        _networkContinuousColorStops;

      if (graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"]) {
        self.colorizer["category"] = graph_data[_networkGraphAttrbuteID][
          cat_id
        ]["color_scale"](graph_data[_networkGraphAttrbuteID][cat_id], self);

        self.uniqValues[cat_id]["min"] =
          self.colorizer["category"](color_stops);
        self.uniqValues[cat_id]["max"] =
          self.colorizer["category"](color_stops);
      } else {
        self.colorizer["category"] = _.wrap(
          d3.scale
            .linear()
            .domain(_.range(_networkContinuousColorStops))
            .range(["#fff7ec", "#7f0000"])
            .interpolate(d3.interpolateRgb),
          (func, arg) => {
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
        const min =
          graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]["min"] ||
          self.uniqValues[cat_id]["min"];
        const max =
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
          (func, arg) =>
            func(
              graph_data[_networkGraphAttrbuteID][cat_id]["scale"](arg) *
                (1 / color_stops)
            )
        );
      }

      self.colorizer["category_id"] = cat_id;
      self.colorizer["continuous"] = true;
      self.clusters.forEach((the_cluster) => {
        the_cluster["gradient"] = compute_cluster_gradient(the_cluster, cat_id);
      });

      var points = [];

      _.each(self.edges, (e) => {
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

        if (src !== _networkMissing && tgt !== _networkMissing) {
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
              ")",
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
          y: "Target",
        },
        graph_data[_networkGraphAttrbuteID][cat_id]["type"] === "Date"
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

  self.handle_attribute_categorical = function (cat_id, skip_update) {
    var set_attr = "None";

    d3.select(self.get_ui_element_selector_by_role("attributes_invert")).style(
      "display",
      "none"
    );

    self.network_svg.selectAll("radialGradient").remove();

    [
      ["attributes", false],
      ["attributes_cat", true],
    ].forEach((lbl) => {
      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1]))
        .selectAll("li")
        .selectAll("a")
        .attr("style", (d, i) => {
          if (d[1] === cat_id) {
            set_attr = d[0];
            return " font-weight: bold;";
          }
          return null;
        });
      d3.select(
        self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])
      ).html("Color: " + set_attr + ' <span class="caret"></span>');
    });

    self.clusters.forEach((the_cluster) => {
      delete the_cluster["gradient"];
      the_cluster["binned_attributes"] = stratify(
        attribute_cluster_distribution(the_cluster, cat_id)
      );
    });

    self.colorizer["continuous"] = false;

    //TODO -- if preset color scheme does not exist, create one and always use the logic here.

    if (cat_id) {
      if (cat_id in self.networkColorScheme) {
        let cat_data = graph_data[_networkGraphAttrbuteID][cat_id]["enum"];
        if (cat_data) {
          cat_data = new Set(_.map(cat_data, (d) => d.toLowerCase()));
        }
        var domain = [],
          range = [];
        _.each(self.networkColorScheme[cat_id], (value, key) => {
          if (cat_data) {
            if (!cat_data.has(key.toLowerCase())) {
              return;
            }
          }
          domain.push(key);
          range.push(value);
        });
        self.colorizer["category"] = d3.scale
          .ordinal()
          .domain(domain)
          .range(range);
      } else if (graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"]) {
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
            (func, arg) => {
              if (arg === _networkMissing) {
                return func(_maximumValuesInCategories);
              }

              const ci = graph_data[_networkGraphAttrbuteID][cat_id];

              if (ci["reduced_value_range"]) {
                if (!(arg in ci["reduced_value_range"])) {
                  arg = _networkReducedValue;
                }
              }

              return func(ci["stable-ish order"][arg]);
            }
          );
          //console.log (graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order']);
        }
      }

      if (graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]) {
        self.colorizer["category"] = _.wrap(
          self.colorizer["category"],
          (func, arg) => {
            if (
              arg in graph_data[_networkGraphAttrbuteID][cat_id]["user-defined"]
            ) {
              return graph_data[_networkGraphAttrbuteID][cat_id][
                "user-defined"
              ][arg];
            }
            return func(arg);
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
        self._aux_get_attribute_dimension(cat_id),
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

  self.filter_visibility = function () {
    self.clusters.forEach((c) => {
      c.is_hidden = self.hide_unselected && !c.match_filter;
    });
    self.nodes.forEach((n) => {
      n.is_hidden = self.hide_unselected && !n.match_filter;
    });
  };

  self.filter = function (conditions, skip_update) {
    var anything_changed = false;

    conditions = _.map(["re", "distance", "date"], (cnd) =>
      _.map(
        _.filter(conditions, (v) => v.type === cnd),
        (v) => (cnd === "distance" ? v : v.value)
      )
    );

    if (conditions[1].length) {
      self.nodes.forEach((n) => {
        n.length_filter = false;
      });

      _.each(self.edges, (e) => {
        var did_match = _.some(conditions[1], (d) =>
          d.greater_than ? e.length >= d.value : e.length < d.value
        );

        if (did_match) {
          self.nodes[e.source].length_filter = true;
          self.nodes[e.target].length_filter = true;
        }
        e.length_filter = did_match;
      });
    } else {
      self.nodes.forEach((n) => {
        n.length_filter = false;
      });
      self.edges.forEach((e) => {
        e.length_filter = false;
      });
    }

    if (conditions[2].length) {
      self.nodes.forEach((n) => {
        var node_T = self.attribute_node_value_by_id(
          n,
          timeDateUtil.getClusterTimeScale()
        );
        n.date_filter = _.some(
          conditions[2],
          (d) => node_T >= d[0] && node_T <= d[1]
        );
      });
    } else {
      self.nodes.forEach((n) => {
        n.date_filter = false;
      });
    }

    self.clusters.forEach((c) => {
      c.match_filter = 0;
    });

    self.edges.forEach((e) => {
      if (e.length_filter) {
        anything_changed = true;
      }
    });

    self.nodes.forEach((n) => {
      var did_match = _.some(
        conditions[0],
        (regexp) =>
          regexp.test(n.id) ||
          _.some(n[_networkNodeAttributeID], (attr) => regexp.test(attr))
      );

      did_match = did_match || n.length_filter || n.date_filter;

      if (did_match !== n.match_filter) {
        n.match_filter = did_match;
        anything_changed = true;
      }

      if (n.match_filter) {
        n.parent.match_filter += 1;
      }
    });

    if (anything_changed && self.handle_inline_charts) {
      self.handle_inline_charts((n) => n.match_filter);
    }

    if (anything_changed && !skip_update) {
      if (self.hide_unselected) {
        self.filter_visibility();
      }

      self.update(true);
    }
  };

  self.is_empty = function () {
    return self.cluster_sizes.length === 0;
  };

  self.display_warning = function (warning_string, is_html) {
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
      } else {
        d3.select(network_warning_tag).style("display", "none");
      }
    }
  };

  self.link_generator_function = function (d) {
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

    d3.select(this).attr("d", path);
  };

  self.update = function (soft, friction) {
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

      _.each(draw_me.edges, (d) => {
        d.pull = 0.0;
        var tag;

        if (d.source < d.target) {
          tag = String(d.source) + "|" + d.target;
        } else {
          tag = String(d.target) + "|" + d.source;
        }
        if (tag in edge_set) {
          edge_set[tag].push(d);
        } else {
          edge_set[tag] = [d];
        }
      });

      _.each(edge_set, (v) => {
        if (v.length > 1) {
          var step = 1 / (v.length - 1);
          _.each(v, (edge, index) => {
            edge.pull = -0.5 + index * step;
          });
        }
      });

      link = self.network_svg
        .selectAll(".link")
        .data(draw_me.edges, (d) => d.id);

      //link.enter().append("line").classed("link", true);
      link.enter().append("path").classed("link", true);
      link.exit().remove();

      link
        .classed("removed", (d) => self.highlight_unsuppored_edges && d.removed)
        .classed(
          "unsupported",
          (d) =>
            self.highlight_unsuppored_edges &&
            "support" in d &&
            d["support"] > 0.05
        )
        .classed(
          "core-link",
          (d) =>
            //console.log (d["length"] <= self.core_link_length);
            d["length"] <= self.core_link_length
          //return false;
        );

      link
        .on("mouseover", edge_pop_on)
        .on("mouseout", edge_pop_off)
        .filter((d) => d.directed)
        .attr("marker-end", "url(#" + self.dom_prefix + "_arrowhead)");

      rendered_nodes = self.network_svg
        .selectAll(".node")
        .data(draw_me.nodes, (d) => d.id);

      rendered_nodes.exit().remove();

      /*rendered_nodes.enter().each (function (d) {
        this.append ("path");
      });*/

      rendered_nodes.enter().append("g").append("path");

      rendered_clusters = self.network_svg.selectAll(".cluster-group").data(
        draw_me.clusters.map((d) => d),
        (d) => d.cluster_id
      );

      rendered_clusters.exit().remove();
      rendered_clusters
        .enter()
        .append("g")
        .attr("class", "cluster-group")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
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
        self.annotate_priority_clusters(
          timeDateUtil._networkCDCDateField,
          36,
          12
        );

        try {
          if (self.isPrimaryGraph) {
            self.priority_groups_compute_node_membership();
          }
        } catch (err) {
          console.log(err);
        }
      }

      if (
        self._is_CDC_ &&
        !(options && options["no-subclusters"]) &&
        options &&
        options["no-subcluster-compute"]
      ) {
        // use precomputed subclusters

        _.each(self.clusters, (cluster_nodes, cluster_index) => {
          /** extract subclusters; all nodes at given threshold */
          /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */
          let subclusters = _.groupBy(
            cluster_nodes.children,
            (n) => n.subcluster_id
          );
          subclusters = _.values(
            _.reject(subclusters, (v, k) => k === "undefined")
          );

          /** sort subclusters by oldest node */
          _.each(subclusters, (c, i) => {
            c.sort(oldest_nodes_first);
          });

          subclusters.sort((c1, c2) => oldest_nodes_first(c1[0], c2[0]));

          subclusters = _.map(subclusters, (c, i) => {
            const parent_cluster_id = c[0].parent_cluster_id;
            const subcluster_id = c[0].subcluster_id;
            const label = c[0].subcluster_label;

            var edges = [];

            // unused var
            // var meta_data = _.filter(
            //   hivtrace_cluster_depthwise_traversal(
            //     cluster_nodes.Nodes,
            //     cluster_nodes.Edges,
            //     null,
            //     edges
            //   ),
            //   (cc) => {
            //     return cc.length > 1;
            //   }
            // );

            edges = _.filter(edges, (es) => es.length > 1);

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
                _.map(edges[i], (e) => e.length)
              ),
            };
          });

          _.each(subclusters, (c) => {
            _compute_cluster_degrees(c);
          });

          cluster_nodes.subclusters = subclusters || [];

          // add additional information
          const stats =
            self.json.subcluster_summary_stats[cluster_nodes.cluster_id];
          cluster_nodes.recent_nodes = _.map(
            _.values(stats),
            (d) => d.recent_nodes[0] || 0
          );
          cluster_nodes.priority_score = _.map(
            _.values(stats),
            (d) => d.priority_score[0] || 0
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
            headers: function (headers) {
              headers[0][0].value = "Subcluster ID";
              headers[0][0].help = "Unique subcluster ID";
              headers[0][2].help = "Number of total cases in the subcluster";
            },
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

    rendered_nodes.each(function (d) {
      draw_a_node(this, d);
    });

    rendered_clusters.each(function (d) {
      draw_a_cluster(this, d);
    });

    link.style("opacity", (d) =>
      Math.max(node_opacity(d.target), node_opacity(d.source))
    );

    if (self.additional_edge_styler) {
      link.each(function (d) {
        self.additional_edge_styler(this, d, self);
      });
    }

    link
      .style("display", (d) => {
        if (d.target.is_hidden || d.source.is_hidden || d.is_hidden) {
          return "none";
        }
        return null;
      })
      .classed(
        "selected_object",
        (d) => d.ref.length_filter && !self.hide_unselected
      );

    if (!soft) {
      currently_displayed_objects =
        rendered_clusters[0].length + rendered_nodes[0].length;

      network_layout.on("tick", () => {
        var sizes = network_layout.size();

        rendered_nodes.attr("transform", (d) => {
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
              const center = self.countryCentersObject[country_code].countryXY;

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
        rendered_clusters.attr(
          "transform",
          (d) =>
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
      .attr("cx", (d) => (d.x = Math.max(10, Math.min(sizes[0] - 10, d.x))))
      .attr("cy", (d) => (d.y = Math.max(10, Math.min(sizes[1] - 10, d.y))));

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
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

  self.attribute_node_value_by_id = function (d, id, number) {
    try {
      if (_networkNodeAttributeID in d && id) {
        if (id in d[_networkNodeAttributeID]) {
          let v;

          if (self.json[_networkGraphAttrbuteID][id].volatile) {
            v = self.json[_networkGraphAttrbuteID][id].map(d, self);
          } else {
            v = d[_networkNodeAttributeID][id];
          }

          if (_.isString(v)) {
            if (v.length === 0) {
              return _networkMissing;
            } else if (number) {
              v = Number(v);
              return _.isNaN(v) ? _networkMissing : v;
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
    if (_networkNodeAttributeID in d && id) {
      d[_networkNodeAttributeID][id] = value;
    }
  }

  self.has_network_attribute = function (key) {
    if (_networkGraphAttrbuteID in self.json) {
      return key in self.json[_networkGraphAttrbuteID];
    }
    return false;
  };

  self.inject_attribute_description = function (key, d) {
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
        if (v === _networkMissing) {
          return _networkMissingColor;
        }
        //console.log (v, self.colorizer['category'](v));
      }
      return self.colorizer["category"](v);
    }

    if (d.hxb2_linked) {
      return "black";
    }

    if (d.is_lanl) {
      return "red";
    }

    return "gray";
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
        self.colorizer["opacity_id"],
      ]),
      (key) => {
        if (key) {
          if (key in graph_data[_networkGraphAttrbuteID]) {
            var attribute = self.attribute_node_value_by_id(n, key);

            if (graph_data[_networkGraphAttrbuteID][key]["type"] === "Date") {
              try {
                attribute = _defaultDateViewFormat(attribute);
              } catch (err) {
                // do nothing
              }
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
        cls.children.forEach((x) => {
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
      x.children.forEach((n) => {
        n.x = x.x + (Math.random() - 0.5) * x.children.length;
        n.y = x.y + (Math.random() - 0.5) * x.children.length;
      });
    } else {
      x.children.forEach((n) => {
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
        .data([""].concat(matrix[0].map((d, i) => lookup[i])));

      headers.enter().append("th");
      headers
        .html((d) => "<span>&nbsp;" + d + "</span>")
        .each(function (d, i) {
          if (i) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", () => fill(d));
          }
        });

      if (self.show_percent_in_pairwise_table) {
        var sum = _.map(matrix, (row) => _.reduce(row, (p, c) => p + c, 0));

        matrix = _.map(matrix, (row, row_index) =>
          _.map(row, (c) => c / sum[row_index])
        );
      }

      var rows = the_table
        .append("tbody")
        .selectAll("tr")
        .data(matrix.map((d, i) => [lookup[i]].concat(d)));

      rows.enter().append("tr");
      rows
        .selectAll("td")
        .data((d) => d)
        .enter()
        .append("td")
        .html((d, i) => {
          if (i === 0) {
            return "<span>&nbsp;" + d + "</span>";
          } else if (self.show_percent_in_pairwise_table) {
            return _defaultPercentFormat(d);
          }

          return d;
        })
        .each(function (d, i) {
          if (i === 0) {
            d3.select(this)
              .insert("i", ":first-child")
              .classed("fa fa-circle", true)
              .style("color", () => fill(d));
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

      // Returns an event handler for fading a given chord group.
      const fade = function (opacity, t) {
        return function (g, i) {
          text_label.text(t ? lookup[i] : "");
          svg
            .selectAll(".chord path")
            .filter((d) => d.source.index !== i && d.target.index !== i)
            .transition()
            .style("opacity", opacity);
        };
      };

      svg
        .append("g")
        .selectAll("path")
        .data(chord.groups)
        .enter()
        .append("path")
        .style("fill", (d) => fill(lookup[d.index]))
        .style("stroke", (d) => fill(lookup[d.index]))
        .attr(
          "d",
          d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius)
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
        .style("fill", (d) => fill(d.target.index))
        .style("opacity", 1);
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

    _.each(scan_from, (edge) => {
      //console.log (self.attribute_node_value_by_id(self.nodes[edge.source], id), self.attribute_node_value_by_id(self.nodes[edge.target], id));
      the_matrix[
        the_map(self.attribute_node_value_by_id(self.nodes[edge.source], id))
      ][
        the_map(self.attribute_node_value_by_id(self.nodes[edge.target], id))
      ] += 1;
    });
    // check if there are null values

    var haz_null = the_matrix.some((d, i) => {
      if (i === dim - 1) {
        return d.some((d2) => d2 > 0);
      }
      return d[dim - 1] > 0;
    });
    if (!haz_null) {
      the_matrix.pop();
      for (let i = 0; i < dim - 1; i += 1) {
        the_matrix[i].pop();
      }
    }

    // symmetrize the matrix

    dim = the_matrix.length;

    for (let i = 0; i < dim; i += 1) {
      for (let j = i; j < dim; j += 1) {
        the_matrix[i][j] += the_matrix[j][i];
        the_matrix[j][i] = the_matrix[i][j];
      }
    }

    return the_matrix;
  }

  self._aux_populate_category_fields = function (d, k) {
    d["raw_attribute_key"] = k;
    if (!("label" in d)) {
      d["label"] = k;
    }
    d.discrete = false;
    if (d["type"] === "String") {
      d.discrete = true;
      d["value_range"] = _.keys(
        _.countBy(graph_data.Nodes, (nd) =>
          self.attribute_node_value_by_id(nd, k)
        )
      );
      d["dimension"] = d["value_range"].length;
    } else if ("enum" in d) {
      d.discrete = true;
      d["value_range"] = _.clone(d["enum"]);
      if (!(_networkMissing in d["value_range"])) {
        d["value_range"].push(_networkMissing);
      }
      d["dimension"] = d["value_range"].length;
      d["no-sort"] = true;
    }
    return d;
  };

  self._aux_get_attribute_dimension = function (cat_id) {
    if (cat_id in graph_data[_networkGraphAttrbuteID]) {
      const cinfo = graph_data[_networkGraphAttrbuteID][cat_id];
      if ("reduced_value_range" in cinfo) {
        return _.size(cinfo["reduced_value_range"]);
      }
      return cinfo.dimension;
    }
    return 0;
  };

  self._aux_process_category_values = function (d) {
    var values,
      reduced_range = null;

    delete d["reduced_value_range"];
    if (d["no-sort"]) {
      values = d["value_range"];
    } else if (d["type"] === "String") {
      values = d["value_range"].sort();

      if (d.dimension > _maximumValuesInCategories) {
        const compressed_values = _.chain(self.nodes)
          .countBy((node) =>
            self.attribute_node_value_by_id(node, d["raw_attribute_key"])
          )
          .pairs()
          .sortBy((d) => -d[1])
          .value();

        reduced_range = [];
        let i = 0;
        while (
          reduced_range.length < _maximumValuesInCategories - 1 &&
          i < compressed_values.length
        ) {
          if (compressed_values[i][0] !== _networkMissing) {
            reduced_range.push(compressed_values[i][0]);
          }
          i++;
        }
        reduced_range = reduced_range.sort();
        reduced_range.push(_networkReducedValue);
      }

      var string_hash = function (str) {
        var hash = 5801;
        for (var ci = 0; ci < str.length; ci++) {
          var charCode = str.charCodeAt(ci);
          hash = (hash << (5 + hash)) + charCode;
        }
        return hash;
      };

      const use_these_values = reduced_range || values;

      var hashed = _.map(use_these_values, string_hash);
      var available_keys = {};
      var reindexed = {};

      for (var i = 0; i < _maximumValuesInCategories; i++) {
        available_keys[i] = true;
      }

      _.each(hashed, (value, index) => {
        if (value < 0) {
          value = -value;
        }

        var first_try = value % _maximumValuesInCategories;
        if (first_try in available_keys) {
          reindexed[use_these_values[index]] = first_try;
          delete available_keys[first_try];
          return;
        }

        var second_try =
          Math.floor(value / _maximumValuesInCategories) %
          _maximumValuesInCategories;
        if (second_try in available_keys) {
          reindexed[use_these_values[index]] = second_try;
          delete available_keys[second_try];
          return;
        }

        var last_resort = parseInt(_.keys(available_keys).sort()[0]);
        reindexed[use_these_values[index]] = last_resort;
        delete available_keys[last_resort];
      });

      d["stable-ish order"] = reindexed;
    }

    var map = {};

    if (reduced_range) {
      const rrl = _.object(_.map(_.pairs(reduced_range), (d) => [d[1], d[0]]));

      _.each(values, (d2, i) => {
        if (d2 in rrl) {
          map[d2] = rrl[d2];
        } else {
          map[d2] = rrl[_networkReducedValue];
        }
      });

      d["reduced_value_range"] = rrl;
      //console.log (rrl, map);
      d["value_map"] = function (v, key) {
        if (key) {
          //console.log (key, map);
          return key === "lookup" ? _.invert(rrl) : rrl;
        }
        return map[v];
      };
    } else {
      _.each(values, (d2, i) => {
        map[d2] = i;
      });
      d["value_map"] = function (v, key) {
        if (key) {
          //console.log (key, map);
          return key === "lookup" ? _.invert(map) : map;
        }
        return map[v];
      };
    }

    return d;
  };

  function attribute_cluster_distribution(the_cluster, attribute_id) {
    if (attribute_id && the_cluster) {
      return the_cluster.children.map((d) =>
        self.attribute_node_value_by_id(d, attribute_id)
      );
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
      attr_info.forEach((d) => {
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

  self.expand_cluster_handler = function (d, do_update, move_out) {
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
    var sequences = {};
    _.each(
      _extract_single_cluster(
        self.clusters[self.cluster_mapping[d.cluster]].children,
        null,
        true
      ).Edges,
      (e) => {
        _.each(e.sequences, (s) => {
          if (!(s in sequences)) {
            sequences[s] = 1;
          }
        });
      }
    );
    //console.log (_.keys(sequences));
  }

  function _compute_cluster_degrees(d) {
    var degrees = d.children.map((c) => c.degree);
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

  self.extract_network_time_series = function (
    time_attr,
    other_attributes,
    node_filter
  ) {
    var use_these_nodes = node_filter
      ? _.filter(self.nodes, node_filter)
      : self.nodes;

    var result = _.map(use_these_nodes, (node) => {
      var series = {
        time: self.attribute_node_value_by_id(node, time_attr),
      };
      if (other_attributes) {
        _.each(other_attributes, (attr, key) => {
          series[attr] = self.attribute_node_value_by_id(node, key);
        });
      }
      return series;
    });

    result.sort((a, b) => {
      if (a.time < b.time) return -1;
      if (a.time === b.time) return 0;
      return 1;
    });

    return result;
  };

  self.expand_some_clusters = function (subset) {
    subset = subset || self.clusters;
    subset.forEach((x) => {
      if (!x.is_hidden) {
        self.expand_cluster_handler(x, false);
      }
    });
    self.update();
  };

  self.select_some_clusters = function (condition) {
    return self.clusters.filter((c, i) =>
      _.some(c.children, (n) => condition(n))
    );
  };

  self.collapse_some_clusters = function (subset) {
    subset = subset || self.clusters;
    subset.forEach((x) => {
      if (!x.collapsed) collapse_cluster(x);
    });
    self.update();
  };

  self.toggle_hxb2 = function () {
    self.hide_hxb2 = !self.hide_hxb2;
    self.update();
  };

  self.toggle_diff = function () {
    self.showing_diff = !self.showing_diff;
    if (self.showing_diff) {
      self.cluster_filtering_functions["new"] = self.filter_if_added;
    } else {
      delete self.cluster_filtering_functions["new"];
    }
    self.update();
  };

  self.toggle_highlight_unsupported_edges = function () {
    self.highlight_unsuppored_edges = !self.highlight_unsuppored_edges;
    self.update();
  };

  self.toggle_time_filter = function () {
    if (self.using_time_filter) {
      self.using_time_filter = null;
    } else {
      self.using_time_filter = timeDateUtil.getCurrentDate();
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

      array.forEach((d) => {
        if (d in dict) {
          dict[d] += 1;
        } else {
          dict[d] = 1;
        }
      });
      for (var uv in dict) {
        stratified.push([uv, dict[uv]]);
      }
      return stratified.sort((a, b) => a[0] - b[0]);
    }
    return array;
  }

  self.is_edge_injected = function (e) {
    //console.log (e, "edge_type" in e);
    return "edge_type" in e;
  };

  self._distance_gate_options = function (threshold) {
    threshold = threshold || 0.005;

    return {
      "edge-styler": function (element, d, network) {
        var e_type = misc.edge_typer(
          d,
          network.edge_types,
          network.edge_cluster_threshold
        );
        if (e_type !== "") {
          d3.select(element).style(
            "stroke",
            network._edge_colorizer(
              misc.edge_typer(
                d,
                network.edge_types,
                network.edge_cluster_threshold
              )
            )
          ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));
        }
        d.is_hidden = !network.shown_types[e_type];
        d3.select(element).style("stroke-width", "4px");
      },

      init_code: function (network) {
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

        network.update_cluster_threshold_display = (T) => {
          network.edge_cluster_threshold = T;
          network.edge_types = [
            "≤" + network.edge_cluster_threshold,
            ">" + network.edge_cluster_threshold,
          ];

          network._edge_colorizer = d3.scale
            .ordinal()
            .range(_networkEdgeColorBase)
            .domain(network.edge_types);
          //network._edge_dasher   = _edge_dasher;
          network.shown_types = _.object(
            _.map(network.edge_types, (d) => [d, 1])
          );
          network.edge_legend = {
            caption: "Links by distance",
            types: {},
          };

          _.each(network.shown_types, (ignore, t) => {
            if (t.length) {
              network.edge_legend.types[t] = _.partial(style_edge, t);
            }
          });
        };

        network.update_cluster_threshold_display(threshold);
      },

      extra_menu: {
        title: "Additional options",
        items: [
          [
            function (network, item) {
              //console.log(network.edge_cluster_threshold);
              var enclosure = item.append("div").classed("form-group", true);
              enclosure
                .append("label")
                .text("Genetic distance threshold ")
                .classed("control-label", true);
              enclosure
                .append("input")
                .classed("form-control", true)
                .attr("value", String(network.edge_cluster_threshold))
                .on("change", function (e) {
                  //d3.event.preventDefault();
                  if (this.value) {
                    const newT = parseFloat(this.value);
                    if (_.isNumber(newT) && newT > 0.0 && newT < 1) {
                      network.update_cluster_threshold_display(newT);
                      network.draw_attribute_labels();
                      network.update(true);
                      enclosure
                        .classed("has-success", true)
                        .classed("has-error", false);
                      return;
                    }
                  }

                  enclosure
                    .classed("has-success", false)
                    .classed("has-error", true);
                })
                .on("click", (e) => {
                  d3.event.stopPropagation();
                });
            },
            null,
          ],
        ],
      },
    };
  };

  self._social_view_options = function (
    labeled_links,
    shown_types,
    edge_typer
  ) {
    edge_typer =
      edge_typer ||
      function (e) {
        return _.has(e, "edge_type") ? e["edge_type"] : "";
      };

    return {
      "edge-styler": function (element, d, network) {
        var e_type = misc.edge_typer(d);
        if (e_type !== "") {
          d3.select(element).style(
            "stroke",
            network._edge_colorizer(misc.edge_typer(d))
          ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));

          d.is_hidden = !network.shown_types[e_type];
        } else {
          d.is_hidden = !network.shown_types[""];
        }
        d3.select(element).style("stroke-width", "5px");
      },

      init_code: function (network) {
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
          types: {},
        };

        _.each(network.shown_types, (ignore, t) => {
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
        items: _.map(labeled_links, (edge_class) => [
          function (network, element) {
            function toggle_element() {
              network.shown_types[edge_class] =
                !network.shown_types[edge_class];
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
          },
        ]),
      },
    };
  };

  /*------------ Node injection (social network) ---------------*/

  self.load_nodes_edges = function (
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
    var injected_nodes = {};
    var node_attributes = {};
    var existing_network_nodes = {};
    var node_name_2_id = {};

    _.each(self.json.Nodes, (n, i) => {
      existing_network_nodes[n.id] = n;
      node_name_2_id[n.id] = i;
    });

    const handle_node_attributes = (target, n) => {
      _.each(n, (attribute_value, attribute_key) => {
        if (attribute_key !== index_id) {
          inject_attribute_node_value_by_id(
            target,
            attribute_key,
            attribute_value
          );
        }
      });
    };

    const inject_new_node = (node_name, n) => {
      const new_node = {
        node_class: "injected",
        node_annotation: annotation,
        attributes: [],
        degree: 0,
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
        throw Error(
          index_id +
            " is not one of the attributes in the imported node records"
        );
      }

      _.each(nodes_and_attributes[0], (r, i) => {
        if (i !== index_id) {
          var attribute_definition = {
            label: i,
            type: "String",
            annotation: annotation,
          };
          self.inject_attribute_description(i, attribute_definition);
        }
      });

      _.each(nodes_and_attributes, (n) => {
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
        _.map(existing_network_nodes, (e) => false);
      }

      _.each(edges_and_attributes, (e) => {
        try {
          if ("Index" in e && "Partner" in e && "Contact" in e) {
            if (!(e["Index"] in node_name_2_id)) {
              if (auto_inject) {
                inject_new_node(e["Index"], []);
              } else {
                throw Error("Invalid index node");
              }
            } else if (auto_inject) {
              existing_network_nodes[e["Index"]] = true;
            }

            if (!(e["Partner"] in node_name_2_id)) {
              if (auto_inject) {
                inject_new_node(e["Partner"], []);
              } else {
                throw Error("Invalid partner node");
              }
            } else if (auto_inject) {
              existing_network_nodes[e["Partner"]] = true;
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
              directed: true,
            };

            self.json.Edges.push(new_edge);
          } else {
            throw Error("Missing required attribute");
          }
        } catch (err) {
          throw Error(
            "Invalid edge specification ( " + err + ") " + JSON.stringify(e)
          );
        }
      });

      if (auto_inject) {
        existing_nodes = _.size(_.filter(existing_network_nodes, (e) => e));
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
      _.each(self.json.Edges, (e) => {
        try {
          var edge_clusters = _.union(
            _.keys(self.json.Nodes[e.source].extended_cluster),
            _.keys(self.json.Nodes[e.target].extended_cluster)
          );
          _.each(edge_clusters, (c) => {
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
      _.each(edge_types_by_cluster, (v, c) => {
        var my_keys = _.keys(v);
        my_keys.sort();
        edge_types_by_cluster_sorted[c] = my_keys;
      });

      /*var _edge_dasher = d3.scale
        .ordinal()
        .range(_networkCategoricalDashPatterns)
        .domain(edge_types);
      */

      var _social_view_handler = function (
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

      var _injected_column_subcluster_button_handler = function (
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
        _.each(subcluster_edges[0], (e) => {
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
          function (id) {
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
        //cv.annotate_priority_clusters(timeDateUtil._networkCDCDateField, 36, 12);
        //cv.handle_attribute_categorical("recent_rapid");
        cv._refresh_subcluster_view(
          self.today || timeDateUtil.getCurrentDate()
        );
      };

      var injected_column_subcluster = [
        {
          description: {
            value: annotation + " network",
            help: "View subclusters with " + annotation + " data",
          },

          generator: function (cluster) {
            return {
              value: cluster,
              callback: function (element, payload) {
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

                _.each(payload.children, (n) => {
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
                      (edge) =>
                        self.json.Nodes[edge.target].id in node_ids ||
                        self.json.Nodes[edge.source].id in node_ids,
                      (id) =>
                        "Subcluster " +
                        payload.cluster_id +
                        "[+ direct  " +
                        annotation +
                        "]"
                    )
                  );
              },
            };
          },
        },
      ];

      var injected_column = [
        {
          description: {
            value: annotation + " network",
            sort: function (c) {
              return c.value[0];
            },
            help: "Nodes added and clusters merged through " + annotation,
          },
          generator: function (cluster) {
            return {
              value: [
                cluster.injected[annotation],
                cluster.linked_clusters,
                cluster.cluster_id,
              ],

              callback: function (element, payload) {
                var this_cell = d3.select(element);
                this_cell.text(
                  Number(payload[0]) + " " + annotation + " nodes. "
                );
                var other_clusters = [];
                if (payload[1]) {
                  other_clusters = _.without(_.keys(payload[1]), payload[2]);
                  if (other_clusters.length) {
                    other_clusters.sort();
                    this_cell
                      .append("span")
                      .classed("label label-info", true)
                      .text("Bridges to " + other_clusters.length + " clusters")
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
                  _.each(labeled_links, (t) => {
                    shown_types[t] = 1;
                  });

                  this_cell
                    .append("button")
                    .classed("btn btn-primary btn-xs pull-right", true)
                    .text("Directly linked " + annotation)
                    .style("margin-left", "1em")
                    .on("click", (e) => {
                      var directly_linked_ids = {};
                      var node_ids = {};

                      _.each(cluster.children, (n) => {
                        node_ids[n.id] = 1;
                      });

                      var direct_links_only =
                        hivtrace_cluster_depthwise_traversal(
                          self.json.Nodes,
                          self.json.Edges,
                          (edge) =>
                            self.json.Nodes[edge.target].id in node_ids ||
                            self.json.Nodes[edge.source].id in node_ids,
                          false,
                          cluster.children
                        );

                      _.each(direct_links_only[0], (n) => {
                        directly_linked_ids[n.id] = true;
                      });

                      //console.log (directly_linked_ids);

                      _social_view_handler(
                        payload[2],
                        (n) => n.id in directly_linked_ids,
                        labeled_links,
                        shown_types,
                        (id) =>
                          "Cluster " + id + "[+ direct " + annotation + "]",
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
                        (n) =>
                          n.extended_cluster &&
                          payload[2] in n.extended_cluster,
                        labeled_links,
                        shown_types,
                        (id) => "Cluster " + id + "[+ " + annotation + "]"
                      )
                    );
                }
              },
            };
          },
        },
      ];

      if (self.extra_cluster_table_columns) {
        self.extra_cluster_table_columns =
          self.extra_cluster_table_columns.concat(injected_column);
      } else {
        self.extra_cluster_table_columns = injected_column;
      }

      self.draw_cluster_table(
        self.extra_cluster_table_columns,
        self.cluster_table
      );

      if (self.subcluster_table) {
        if (self.extra_subcluster_table_columns) {
          self.extra_subcluster_table_columns =
            self.extra_subcluster_table_columns.concat(
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

    return {
      nodes: new_nodes,
      existing_nodes: existing_nodes,
      edges: edge_types_dict,
    };
  };

  self.update_clusters_with_injected_nodes = function (
    node_filter,
    edge_filter,
    annotation
  ) {
    let recomputed_clusters;

    try {
      node_filter =
        node_filter ||
        function () {
          return true;
        };
      edge_filter =
        edge_filter ||
        function () {
          return true;
        };

      recomputed_clusters = hivtrace_cluster_depthwise_traversal(
        _.filter(self.json.Nodes, node_filter),
        self.json.Edges,
        null,
        false
      );

      _.each(recomputed_clusters, (c) => {
        var cluster_ids = {};
        var injected_count = 0;

        _.each(c, (n) => {
          cluster_ids[n.cluster] = 1;
          injected_count += n.cluster ? 0 : 1;
        });

        //var cluster_ids = _.keys (cluster_ids);

        //console.log (cluster_ids.length);

        // count how many "injected" nodes are there in the new cluster

        if (injected_count) {
          delete cluster_ids[undefined];
        }

        _.each(c, (n) => {
          if ("extended_cluster" in n) {
            _.extend(n["extended_cluster"], cluster_ids);
          } else {
            n["extended_cluster"] = cluster_ids;
          }
        });

        _.each(cluster_ids, (c, k) => {
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
      $("[role='tooltip']").each(function (d) {
        $(this).remove();
      });

      var this_box = $(element);

      // var this_data = d3.select(element).datum();
      //this_data.fixed = true;

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
    link_scale = d3.scale.pow().exponent(1.25).clamp(true).domain([0, 0.1]);

  /*------------ D3 globals and SVG elements ---------------*/

  var network_layout = d3.layout
    .force()
    .on("tick", tick)
    .charge((d) => {
      if (self.showing_on_map) {
        return -60;
      }
      if (d.cluster_id) {
        return self.charge_correction * (-15 - 5 * d.children.length ** 0.4);
      }
      return self.charge_correction * (-10 - 5 * Math.sqrt(d.degree));
    })
    .linkDistance(
      (d) => link_scale(d.length) * l_scale * 0.2 //Math.max(d.length, 0.005) * l_scale * 10;
    )
    .linkStrength((d) => {
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

  d3.select(self.container).selectAll(".my_progress").style("display", "none");
  d3.select(self.container).selectAll("svg").remove();
  nodesTab.getNodeTable().selectAll("*").remove();
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
    .on("dragstart", () => {
      d3.event.sourceEvent.stopPropagation();
    })
    .on("drag", function (d) {
      d3.select(this).attr(
        "transform",
        "translate(" + [d3.event.x, d3.event.y] + ")"
      );
    });
  const legend_vertical_offset = self.showing_on_map ? 100 : 5;
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
        _.filter(
          self.clusters,
          (c) => options["expand"].indexOf(c.cluster_id) >= 0
        )
      );
    }

    if (options["priority-sets-url"]) {
      const is_writeable = options["is-writeable"];
      self.load_priority_sets(options["priority-sets-url"], is_writeable);
    }

    if (self.showing_diff) {
      self.handle_attribute_categorical("_newly_added");
    }
  }

  self.draw_attribute_labels();
  d3.select(self.container).selectAll(".my_progress").style("display", "none");
  network_layout.start();

  return self;
};

export {
  hivtrace_cluster_network_graph as clusterNetwork,
  hivtrace_cluster_depthwise_traversal as computeCluster,
};
