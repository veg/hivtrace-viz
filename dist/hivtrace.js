webpackJsonp([0],{

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ }),

/***/ 1:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';
	
	window.jQuery = window.$ = $;
	
	__webpack_require__(5);
	__webpack_require__(15);
	__webpack_require__(17);
	
	var hivtrace = __webpack_require__(30);
	
	// Create new hyphy-vision export
	window.hivtrace = hivtrace;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/***/ 5:
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),

/***/ 15:
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),

/***/ 30:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var _bootstrap = __webpack_require__(31);
	
	var _bootstrap2 = _interopRequireDefault(_bootstrap);
	
	var _clusternetwork = __webpack_require__(38);
	
	var _histogram = __webpack_require__(48);
	
	var _scatterplot = __webpack_require__(46);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var misc = __webpack_require__(43);
	var helpers = __webpack_require__(44);
	
	module.exports.clusterNetwork = _clusternetwork.clusterNetwork;
	module.exports.graphSummary = _clusternetwork.graphSummary;
	module.exports.histogram = _histogram.histogram;
	module.exports.histogramDistances = _histogram.histogramDistances;
	module.exports.helpers = helpers;
	module.exports.misc = misc;
	module.exports.scatterPlot = _scatterplot.scatterPlot;

/***/ }),

/***/ 31:
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),

/***/ 38:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($, jQuery) {"use strict";
	
	var d3 = __webpack_require__(39),
	    _ = __webpack_require__(42),
	    misc = __webpack_require__(43),
	    helpers = __webpack_require__(44),
	    scatterPlot = __webpack_require__(46),
	    prevalence = __webpack_require__(47);
	
	var _networkGraphAttrbuteID = "patient_attribute_schema";
	var _networkNodeAttributeID = "patient_attributes";
	var _networkMissing = "missing";
	var _networkMissingOpacity = "0.1";
	var _networkMissingColor = "#999";
	var _networkContinuousColorStops = 9;
	var _networkShapeOrdering = ["circle", "square", "hexagon", "diamond", "cross", "octagon", "ellipse", "pentagon"];
	var _defaultFloatFormat = d3.format(",.2r");
	var _defaultPercentFormat = d3.format(",.3p");
	var _defaultDateFormats = [d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ"), d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ")];
	var _defaultDateViewFormat = d3.time.format("%B %d, %Y");
	var _defaultDateViewFormatShort = d3.time.format("%B %Y");
	var _defaultDateViewFormatSlider = d3.time.format("%Y-%m-%d");
	var _networkDotFormatPadder = d3.format("08d");
	
	var _networkCategoricalBase = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
	
	var _networkCategorical = [];
	
	_.each([0, -0.5, 0.5], function (k) {
	  _.each(_networkCategoricalBase, function (s) {
	    _networkCategorical.push(d3.rgb(s).darker(k).toString());
	  });
	});
	
	var _maximumValuesInCategories = _networkCategorical.length;
	
	var _networkSequentialColor = {
	  2: ["#feb24c", "#e31a1c"],
	  3: ["#ffeda0", "#feb24c", "#f03b20"],
	  4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
	  5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
	  6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
	  7: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
	  8: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
	  9: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"]
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
	
	var hivtrace_cluster_depthwise_traversal = function hivtrace_cluster_depthwise_traversal(nodes, edges, edge_filter, save_edges) {
	
	  var clusters = [],
	      adjacency = {},
	      by_node = {};
	
	  _.each(nodes, function (n) {
	    n.visited = false;
	    adjacency[n.id] = [];
	  });
	
	  if (edge_filter) {
	    edges = _.filter(edges, edge_filter);
	  }
	
	  _.each(edges, function (e) {
	    try {
	      adjacency[nodes[e.source].id].push([nodes[e.target], e]);
	      adjacency[nodes[e.target].id].push([nodes[e.source], e]);
	    } catch (err) {
	      console.log("Edge does not map to an existing node " + e.source + " to " + e.target);
	      throw "Edge does not map to an existing node " + e.source + " to " + e.target;
	    }
	  });
	
	  var traverse = function traverse(node) {
	    if (!(node.id in by_node)) {
	      clusters.push([node]);
	      by_node[node.id] = clusters.length - 1;
	      if (save_edges) {
	        save_edges.push([]);
	      }
	    }
	    node.visited = true;
	
	    _.each(adjacency[node.id], function (neighbor) {
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
	
	  _.each(nodes, function (n) {
	    if (!n.visited) {
	      traverse(n);
	    }
	  });
	
	  return clusters;
	};
	
	var _networkUpperBoundOnDate = new Date().getFullYear();
	var _networkCDCDateField = "hiv_aids_dx_dt";
	
	var hivtrace_cluster_network_graph = function hivtrace_cluster_network_graph(json, network_container, network_status_string, network_warning_tag, button_bar_ui, attributes, filter_edges_toggle, clusters_table, nodes_table, parent_container, options) {
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
	
	  var self = {};
	
	  self._is_CDC_ = options && options["no_cdc"] ? false : true;
	  self.ww = options && options["width"] ? options["width"] : d3.select(parent_container).property("clientWidth");
	  self.container = network_container;
	  self.nodes = [];
	  self.edges = [];
	  self.clusters = [];
	  self.cluster_sizes = [];
	  self.cluster_mapping = {};
	  self.percent_format = _defaultPercentFormat;
	  self.missing = _networkMissing;
	
	  if (options && _.isFunction(options["init_code"])) {
	    options["init_code"].call(null, self, options);
	  }
	  self.dom_prefix = options && options['prefix'] ? options['prefix'] : "hiv-trace";
	  self.extra_cluster_table_columns = options && options['cluster-table-columns'] ? options['cluster-table-columns'] : null;
	  self.subcluster_table = null;
	
	  if (self._is_CDC_) {
	    self.subcluster_table = options && options['subcluster-table'] ? d3.select(options['subcluster-table']) : null;
	    self.extra_subcluster_table_columns = null;
	    var cdc_extra = [{ 'description': {
	        value: "Recent",
	        sort: "value",
	        help: "Number of linked cases diagnosed in the past 36 months"
	      },
	      'generator': function generator(cluster) {
	        return {
	          'value': cluster.recent_nodes
	        };
	      }
	    }, { 'description': {
	        value: "Rapid",
	        sort: "value",
	        help: "Number of cluster members diagnosed in past 12 months"
	      },
	      'generator': function generator(cluster) {
	        return {
	          'html': true,
	          'value': cluster.priority_score,
	          'format': function format(v) {
	            if (v >= 3) {
	              return "<span style='color:red'>" + v + " <span class = 'fa fa-exclamation-circle'></span></span>";
	            }
	            return v;
	          }
	        };
	      }
	    }];
	
	    if (self.subcluster_table) {
	      self.extra_subcluster_table_columns = cdc_extra;
	    } else {
	      if (self.extra_cluster_table_columns) {
	        self.extra_cluster_table_columns = self.extra_cluster_table_columns.concat(cdc_extra);
	      } else {
	        self.extra_cluster_table_columns = cdc_extra;
	      }
	    }
	  }
	
	  self.extra_node_table_columns = options && options['node-table-columns'] ? options['node-table-columns'] : self._is_CDC_ ? [{ 'description': {
	      value: "Recent and Rapid",
	      sort: "value",
	      help: "Is the node a member of a regular or recent & rapid subcluster?"
	    },
	    'generator': function generator(node) {
	      return {
	        'callback': function callback(element, payload) {
	          //payload = _.filter (payload, function (d) {return d});
	          var this_cell = d3.select(element);
	
	          var data_to_use = [[payload[0][0], payload[0][1]], [payload[1][0] ? "36 months" : "", payload[1][1]], [payload[2][0] ? "12 months" : "", payload[2][1]]];
	
	          var buttons = this_cell.selectAll("span").remove();
	
	          _.each(data_to_use, function (button_text) {
	
	            if (button_text[0].length) {
	              this_cell.append("span").classed("btn btn-xs btn-node-property", true).classed(button_text[1], true).attr("disabled", true).text(button_text[0]);
	            }
	          });
	        },
	        'value': function value() {
	          return [[node.subcluster ? "Subcluster " + node.subcluster : "", "btn-primary"], [node.priority_flag == 1, "btn-warning"], [node.priority_flag == 2, "btn-danger"]];
	        }
	      };
	    }
	  }] : null;
	
	  self.colorizer = {
	    selected: function selected(d) {
	      return d == "selected" ? d3.rgb(51, 122, 183) : "#FFF";
	    }
	  };
	
	  self.subcluster_threshold = options && options['subcluster-thershold'] ? options['subcluster-thershold'] : 0.005;
	  self.today = options && options['today'] ? options['today'] : new Date();
	
	  self.node_shaper = {
	    id: null,
	    shaper: function shaper() {
	      return "circle";
	    }
	  };
	  self.filter_edges = true, self.hide_hxb2 = false, self.charge_correction = 5, self.margin = {
	    top: 20,
	    right: 10,
	    bottom: 30,
	    left: 10
	  }, self.width = self.ww - self.margin.left - self.margin.right, self.height = self.width * 9 / 16, self.cluster_table = d3.select(clusters_table), self.node_table = d3.select(nodes_table), self.needs_an_update = false, self.json = json, self.hide_unselected = false, self.show_percent_in_pairwise_table = false, self.gradient_id = 0;
	
	  self._additional_node_pop_fields = [];
	  /** this array contains fields that will be appended to node pop-overs in the network tab
	      they will precede all the fields that are shown based on selected labeling */
	
	  if (options && "minimum size" in options) {
	    self.minimum_cluster_size = options["minimum size"];
	  } else {
	    if (self._is_CDC_) {
	      self.minimum_cluster_size = 5;
	    } else {
	      self.minimum_cluster_size = 0;
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
	    self.core_link_length = -1.;
	  }
	
	  if (options && "edge-styler" in options) {
	    self.additional_edge_styler = options["edge-styler"];
	  } else {
	    self.additional_edge_styler = null;
	  }
	
	  self.filter_by_size = function (cluster) {
	    return cluster.children.length >= self.minimum_cluster_size;
	  };
	
	  self.cluster_filtering_functions = { 'size': self.filter_by_size };
	  self.cluster_display_filter = function (cluster) {
	    return _.every(self.cluster_filtering_functions, function (filter) {
	      return filter(cluster);
	    });
	  };
	
	  self.primary_graph = options && "secondary" in options ? false : true;
	  self.initial_packed = options && options["initial_layout"] == "tiled" ? false : true;
	
	  self.recent_rapid_definition = function (network, date) {
	    date = date || self.today;
	    var subcluster_enum = ["Subcluster", "12 months (on ar after " + _defaultDateViewFormat(_n_months_ago(date, 12)) + ")", "36 months (on ar after " + _defaultDateViewFormat(_n_months_ago(date, 36)) + ")", "Future node (after " + _defaultDateViewFormat(date) + ")", "Not a member of subcluster (as of " + _defaultDateViewFormat(date) + ")", "Not in a subcluster"];
	
	    return {
	      depends: _networkCDCDateField,
	      label: "Subcluster or Priority Node",
	      enum: subcluster_enum,
	      type: "String",
	      volatile: true,
	      color_scale: function color_scale() {
	        return d3.scale.ordinal().domain(subcluster_enum.concat([_networkMissing])).range(_.union(["#CCCCCC", "red", "blue", "#9A4EAE", "yellow", "#FFFFFF"], [_networkMissingColor]));
	      },
	
	      map: function map(node) {
	        if (node.subcluster) {
	          if (node.priority_flag > 0) {
	            return subcluster_enum[node.priority_flag];
	          }
	          return subcluster_enum[0];
	        }
	        return subcluster_enum[5];
	      }
	    };
	  };
	
	  self._networkPredefinedAttributeTransforms = {
	    /** runtime computed node attributes, e.g. transforms of existing attributes */
	
	    binned_vl_recent_value: {
	      depends: "vl_recent_value",
	      label: "binned_vl_recent_value",
	      enum: ["≤200", "200-10000", ">10000"],
	      type: "String",
	      color_scale: function color_scale() {
	        return d3.scale.ordinal().domain(["≤200", "200-10000", ">10000", _networkMissing]).range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
	      },
	
	      map: function map(node) {
	        var vl_value = self.attribute_node_value_by_id(node, "vl_recent_value", true);
	        if (vl_value != _networkMissing) {
	          if (vl_value <= 200) {
	            return "≤200";
	          }
	          if (vl_value <= 10000) {
	            return "200-10000";
	          }
	          return ">10000";
	        }
	        return _networkMissing;
	      }
	    },
	
	    recent_rapid: self.recent_rapid_definition,
	
	    subcluster_index: {
	      depends: _networkCDCDateField,
	      label: "Subcluster ID",
	      type: "String",
	
	      map: function map(node) {
	        return node.subcluster;
	      }
	    },
	
	    age_dx: {
	      depends: "age",
	      label: "age_dx",
	      enum: ["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "≥60"],
	      type: "String",
	      color_scale: function color_scale() {
	        return d3.scale.ordinal().domain(["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "≥60", _networkMissing]).range(["#b10026", "#e31a1c", "#fc4e2a", "#fd8d3c", "#feb24c", "#fed976", "#ffffb2", "#636363"]);
	      },
	      map: function map(node) {
	        var vl_value = self.attribute_node_value_by_id(node, "age");
	        if (vl_value == ">=60") {
	          return "≥60";
	        }
	        return vl_value;
	      }
	    },
	
	    hiv_aids_dx_dt_year: {
	      depends: _networkCDCDateField,
	      label: "hiv_aids_dx_dt_year",
	      type: "Number",
	      map: function map(node) {
	        try {
	          var value = self._parse_dates(self.attribute_node_value_by_id(node, _networkCDCDateField));
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
	      color_scale: function color_scale(attr) {
	        var range_without_missing = _.without(attr.value_range, _networkMissing);
	        var color_scale = _.compose(d3.interpolateRgb("#ffffcc", "#800026"), d3.scale.linear().domain([range_without_missing[0], range_without_missing[range_without_missing.length - 1]]).range([0, 1]));
	        return function (v) {
	          if (v == _networkMissing) {
	            return _networkMissingColor;
	          }
	          return color_scale(v);
	        };
	      }
	    }
	  };
	
	  if (options && options["computed-attributes"]) {
	    _.extend(self._networkPredefinedAttributeTransforms, options["computed-attributes"]);
	  }
	
	  self._parse_dates = function (value) {
	
	    if (value instanceof Date) {
	      return value;
	    }
	    var parsed_value = null;
	
	    var passed = _.any(_defaultDateFormats, function (f) {
	      parsed_value = f.parse(value);
	      return parsed_value;
	    });
	
	    //console.log (value + " mapped to " + parsed_value);
	
	    if (passed) {
	      if (self._is_CDC_ && (parsed_value.getFullYear() < 1970 || parsed_value.getFullYear() > _networkUpperBoundOnDate)) {
	        throw "Invalid date";
	      }
	      return parsed_value;
	    }
	
	    throw "Invalid date";
	  };
	
	  /*------------ Network layout code ---------------*/
	  var handle_cluster_click = function handle_cluster_click(cluster, release) {
	
	    var container = d3.select(self.container);
	    var id = "d3_context_menu_id";
	    var menu_object = container.select("#" + id);
	
	    if (menu_object.empty()) {
	      menu_object = container.append("ul").attr("id", id).attr("class", "dropdown-menu").attr("role", "menu");
	    }
	
	    menu_object.selectAll("li").remove();
	
	    var already_fixed = cluster && cluster.fixed == 1;
	
	    if (cluster) {
	      menu_object.append("li").append("a").attr("tabindex", "-1").text("Expand cluster").on("click", function (d) {
	        cluster.fixed = 0;
	        self.expand_cluster_handler(cluster, true);
	        menu_object.style("display", "none");
	      });
	
	      menu_object.append("li").append("a").attr("tabindex", "-1").text("Center on screen").on("click", function (d) {
	        cluster.fixed = 0;
	        center_cluster_handler(cluster);
	        menu_object.style("display", "none");
	      });
	
	      menu_object.append("li").append("a").attr("tabindex", "-1").text(function (d) {
	        if (cluster.fixed) return "Allow cluster to float";
	        return "Hold cluster at current position";
	      }).on("click", function (d) {
	        cluster.fixed = !cluster.fixed;
	        menu_object.style("display", "none");
	      });
	
	      menu_object.append("li").append("a").attr("tabindex", "-1").text(function (d) {
	        return "Show this cluster in separate tab";
	      }).on("click", function (d) {
	        self.open_exclusive_tab_view(cluster.cluster_id);
	        menu_object.style("display", "none");
	      });
	
	      cluster.fixed = 1;
	
	      menu_object.style("position", "absolute").style("left", "" + d3.event.offsetX + "px").style("top", "" + d3.event.offsetY + "px").style("display", "block");
	    } else {
	      if (release) {
	        release.fixed = 0;
	      }
	      menu_object.style("display", "none");
	    }
	
	    container.on("click", function (d) {
	      handle_cluster_click(null, already_fixed ? null : cluster);
	    }, true);
	  };
	
	  self._check_for_time_series = function (export_items) {
	    if (self.cluster_time_scale) {
	      export_items.push(["Show time-course plots", function (network, e) {
	        e = d3.select(e);
	
	        if (!network.network_cluster_dynamics) {
	          network.network_cluster_dynamics = network.network_svg.append("g").attr("id", self.dom_prefix + "-dynamics-svg").attr("transform", "translate (" + network.width * 0.45 + ",0)");
	
	          network.handle_inline_charts = function () {
	            var attr = null;
	            var color = null;
	            if (network.colorizer["category_id"] && !network.colorizer["continuous"]) {
	              var attr_desc = network.json[_networkGraphAttrbuteID][network.colorizer["category_id"]];
	              attr = {};
	              attr[network.colorizer["category_id"]] = attr_desc["label"];
	              color = {};
	              color[attr_desc["label"]] = network.colorizer["category"];
	            }
	
	            misc.cluster_dynamics(network.extract_network_time_series(self.cluster_time_scale, attr), network.network_cluster_dynamics, "Time", "Cluster Members", null, null, {
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
	              drag: { x: network.width * 0.45,
	                y: 0 }
	            });
	          };
	          network.handle_inline_charts();
	          e.text("Hide time-course plots");
	        } else {
	          e.text("Show time-course plots");
	          network.network_cluster_dynamics.remove();
	          network.network_cluster_dynamics = null;
	          network.handle_inline_charts = null;
	        }
	      }]);
	    }
	  };
	
	  self.open_exclusive_tab_close = function (tab_element, tab_content, restore_to_tag) {
	    $('#' + restore_to_tag).tab('show');
	    $('#' + tab_element).remove();
	    $('#' + tab_content).remove();
	  };
	
	  self.open_exclusive_tab_view = function (cluster_id, custom_filter, custom_name, additional_options) {
	    var cluster = _.find(self.clusters, function (c) {
	      return c.cluster_id == cluster_id;
	    });
	
	    if (!cluster) {
	      return;
	    }
	
	    additional_options = additional_options || {};
	
	    var filtered_json = _extract_single_cluster(custom_filter ? _.filter(self.json.Nodes, custom_filter) : cluster.children);
	
	    if (_networkGraphAttrbuteID in json) {
	      filtered_json[_networkGraphAttrbuteID] = {};
	      jQuery.extend(true, filtered_json[_networkGraphAttrbuteID], json[_networkGraphAttrbuteID]);
	    }
	
	    var export_items = [["Export cluster to .CSV", function (network) {
	      helpers.export_csv_button(self._extract_attributes_for_nodes(self._extract_nodes_by_id(cluster_id), self._extract_exportable_attributes()));
	    }]];
	
	    self._check_for_time_series(export_items);
	
	    if ("extra_menu" in additional_options) {
	      _.each(export_items, function (item) {
	        additional_options["extra_menu"]["items"].push(item);
	      });
	    } else {
	      _.extend(additional_options, { "extra_menu": { "title": "Action",
	          "items": export_items
	        } });
	    }
	
	    return self.open_exclusive_tab_view_aux(filtered_json, custom_name ? custom_name(cluster_id) : "Cluster " + cluster_id, additional_options);
	  };
	
	  self.open_exclusive_tab_view_aux = function (filtered_json, title, option_extras) {
	
	    var random_id = function random_id(alphabet, length) {
	      var s = "";
	      for (var i = 0; i < length; i++) {
	        s += _.sample(alphabet);
	      }
	      return s;
	    };
	
	    var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
	
	    var random_prefix = random_id(letters, 32);
	    var random_tab_id = random_prefix + "_tab";
	    var random_content_id = random_prefix + "_div";
	    var random_button_bar = random_prefix + "_ui";
	
	    while ($("#" + random_tab_id).length || $("#" + random_content_id).length || $("#" + random_button_bar).length) {
	      random_prefix = random_id(letters, 32);
	      random_tab_id = random_prefix + "_tab";
	      random_content_id = random_prefix + "_div";
	      random_button_bar = random_prefix + "_ui";
	    }
	
	    var tab_container = "top_level_tab_container";
	    var content_container = "top_level_tab_content";
	    var go_here_when_closed = "trace-default-tab";
	
	    // add new tab to the menu bar and switch to it
	    var new_tab_header = $("<li></li>").attr("id", random_tab_id);
	    var new_link = $("<a></a>").attr("href", "#" + random_content_id).attr("data-toggle", "tab").text(title);
	    $('<button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>').appendTo(new_link).on('click', function () {
	      self.open_exclusive_tab_close(random_tab_id, random_content_id, go_here_when_closed);
	    });
	
	    new_link.appendTo(new_tab_header);
	    $("#" + tab_container).append(new_tab_header);
	
	    var new_tab_content = $("<div></div>").addClass("tab-pane").attr("id", random_content_id);
	    //     <li class='disabled' id="attributes-tab"><a href="#trace-attributes" data-toggle="tab">Attributes</a></li>
	    var new_button_bar = $('[data-hivtrace="cluster-clone"]').clone().attr('data-hivtrace', null);
	    new_button_bar.find("[data-hivtrace-button-bar='yes']").attr("id", random_button_bar).attr('data-hivtrace-button-bar', null);
	
	    new_button_bar.appendTo(new_tab_content);
	    new_tab_content.appendTo("#" + content_container);
	
	    // show the new tab
	    $(new_link).tab('show');
	
	    var cluster_options = { "no_cdc": options && options["no_cdc"], "minimum size": 0, "secondary": true, "prefix": random_prefix,
	      "extra_menu": options && "extra_menu" in options ? options["extra_menu"] : null,
	      "edge-styler": options && "edge-styler" in options ? options["edge-styler"] : null,
	      "no-subclusters": true };
	
	    if (option_extras) {
	      _.extend(cluster_options, option_extras);
	    }
	
	    var cluster_view = hivtrace.clusterNetwork(filtered_json, '#' + random_content_id, null, null, random_button_bar, attributes, null, null, null, parent_container, cluster_options);
	
	    //console.log (cluster_view.clusters[0]);
	    cluster_view.expand_cluster_handler(cluster_view.clusters[0], true);
	    if (self.colorizer["category_id"]) {
	      if (self.colorizer["continuous"]) {
	        cluster_view.handle_attribute_continuous(self.colorizer["category_id"]);
	      } else {
	        cluster_view.handle_attribute_categorical(self.colorizer["category_id"]);
	      }
	    }
	
	    if (self.node_shaper["id"]) {
	      cluster_view.handle_shape_categorical(self.node_shaper["id"]);
	    }
	
	    if (self.colorizer["opacity_id"]) {
	      cluster_view.handle_attribute_opacity(self.colorizer["opacity_id"]);
	    }
	
	    return cluster_view;
	
	    // copy all the divs other than the one matching the network tab ID
	    /*var cloned_empty_tab  = $('#trace-results').clone();
	    cloned_empty_tab.attr ("id", random_content_id);
	    console.log (cloned_empty_tab);
	     cloned_empty_tab.appendTo (".tab-content");    */
	
	    /*self.cluster_filtering_functions ['cluster_id'] = function (c) {return c.cluster_id == cluster.cluster_id;};
	    cluster.exclusive = 1;
	    self.has_exclusive_view = cluster.cluster_id;
	    self.draw_attribute_labels();
	    self.update(false);*/
	  };
	
	  self.get_ui_element_selector_by_role = function (role, not_nested) {
	    if (not_nested && !self.primary_graph) {
	      return undefined;
	    }
	    return (not_nested ? "" : "#" + self.ui_container_selector) + " [data-hivtrace-ui-role='" + role + "']";
	  };
	
	  var handle_node_click = function handle_node_click(node) {
	    var container = d3.select(self.container);
	    var id = "d3_context_menu_id";
	    var menu_object = container.select("#" + id);
	
	    if (menu_object.empty()) {
	      menu_object = container.append("ul").attr("id", id).attr("class", "dropdown-menu").attr("role", "menu");
	    }
	
	    menu_object.selectAll("li").remove();
	
	    if (node) {
	      node.fixed = 1;
	      menu_object.append("li").append("a").attr("tabindex", "-1").text("Collapse cluster").on("click", function (d) {
	        node.fixed = 0;
	        collapse_cluster_handler(node, true);
	        menu_object.style("display", "none");
	      });
	
	      menu_object.append("li").append("a").attr("tabindex", "-1").text("Show sequences used to make cluster").on("click", function (d) {
	        node.fixed = 0;
	        show_sequences_in_cluster(node, true);
	        menu_object.style("display", "none");
	      });
	
	      menu_object.style("position", "absolute").style("left", "" + d3.event.offsetX + "px").style("top", "" + d3.event.offsetY + "px").style("display", "block");
	    } else {
	      menu_object.style("display", "none");
	    }
	
	    container.on("click", function (d) {
	      handle_node_click(null);
	    }, true);
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
	
	    d_clusters.children = _.map(mapped_clusters, function (value, key) {
	      return {
	        cluster_id: key,
	        children: value
	      };
	    });
	
	    var treemap = packed ? d3.layout.pack().size([self.width, self.height])
	    //.sticky(true)
	    .children(function (d) {
	      return d.children;
	    }).value(function (d) {
	      return Math.pow(d.parent.children.length, 1.5);
	    }).sort(function (a, b) {
	      return b.value - a.value;
	    }).padding(5) : d3.layout.treemap().size([self.width, self.height])
	    //.sticky(true)
	    .children(function (d) {
	      return d.children;
	    }).value(function (d) {
	      return Math.pow(d.parent.children.length, 1.0);
	    }).sort(function (a, b) {
	      return a.value - b.value;
	    }).ratio(1.);
	
	    var clusters = treemap.nodes(d_clusters);
	    _.each(clusters, function (c) {
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
	
	    self.clusters.forEach(function (x) {
	      if (self.cluster_display_filter(x)) {
	        // Check if hxb2_linked is in a child
	        var hxb2_exists = x.children.some(function (c) {
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
	
	    self.nodes.forEach(function (x, i) {
	      if (expandedClusters[x.cluster]) {
	        drawnNodes[i] = graphMe.nodes.length + graphMe.clusters.length;
	        graphMe.nodes.push(x);
	        graphMe.all.push(x);
	      }
	    });
	
	    self.edges.forEach(function (x) {
	      if (!(x.removed && self.filter_edges)) {
	        if (drawnNodes[x.source] !== undefined && drawnNodes[x.target] !== undefined) {
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
	
	  self.view_subcluster = function (cluster) {
	
	    var filtered_json = _extract_single_cluster(cluster.children, function (e) {
	      return e.length < self.subcluster_threshold;
	    });
	
	    _.each(filtered_json.Nodes, function (n) {
	      n.subcluster = "1.1";
	    });
	
	    if (_networkGraphAttrbuteID in json) {
	      filtered_json[_networkGraphAttrbuteID] = {};
	      jQuery.extend(true, filtered_json[_networkGraphAttrbuteID], json[_networkGraphAttrbuteID]);
	    }
	
	    var extra_menu_items = [[function (network, item) {
	      var enclosure = item.append("div").classed("form-group", true);
	      var label = enclosure.append("label").text("Recalculate R&R from ").classed("control-label", true);
	      var date = enclosure.append("input").attr('type', 'date').classed("form-control", true).attr('value', _defaultDateViewFormatSlider(self.today)).attr('max', _defaultDateViewFormatSlider(self.today)).attr('min', _defaultDateViewFormatSlider(d3.min(network.nodes, function (node) {
	        return network.attribute_node_value_by_id(node, _networkCDCDateField);
	      }))).on("input", function (e) {
	        //d3.event.preventDefault();
	        var set_date = _defaultDateViewFormatSlider.parse(this.value);
	        if (this.value) {
	          network.annotate_priority_clusters(_networkCDCDateField, 36, 12, set_date);
	          var field_def = network.recent_rapid_definition(network, set_date);
	          network.inject_attribute_description("recent_rapid", field_def);
	          network._aux_process_category_values(network._aux_populate_category_fields(field_def, "recent_rapid"));
	          network.handle_attribute_categorical("recent_rapid");
	          enclosure.classed('has-success', true).classed('has-error', false);
	        } else {
	          enclosure.classed('has-success', false).classed('has-error', true);
	        }
	      });
	    }, null], ["Export cluster to .CSV", function (network) {
	      helpers.export_csv_button(network._extract_attributes_for_nodes(network._extract_nodes_by_id("1.1"), network._extract_exportable_attributes()));
	    }]];
	
	    self._check_for_time_series(extra_menu_items);
	    self.open_exclusive_tab_view_aux(filtered_json, "Subcluster " + cluster.cluster_id, { //"core-link" : self.subcluster_threshold,
	      "extra_menu": { "title": "Action",
	        "items": extra_menu_items
	      }
	    }).handle_attribute_categorical("recent_rapid");
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
	
	  self.annotate_priority_clusters = function (date_field, span_months, recent_months, start_date) {
	
	    try {
	
	      start_date = start_date || self.today;
	
	      var filter_by_date = function filter_by_date(cutoff, node) {
	        var node_dx = self.attribute_node_value_by_id(node, date_field);
	        if (node_dx instanceof Date) {
	          return node_dx >= cutoff && node_dx <= start_date;
	        } else {
	          node_dx = self._parse_dates(self.attribute_node_value_by_id(node, date_field));
	          if (node_dx instanceof Date) {
	            return node_dx >= cutoff && node_dx <= start_date;
	          }
	        }
	        return false;
	      };
	
	      var cutoff_long = _n_months_ago(start_date, span_months);
	      var cutoff_short = _n_months_ago(start_date, recent_months);
	
	      var node_iterator;
	
	      if (start_date == self.today) {
	        node_iterator = self.nodes;
	      } else {
	        var beginning_of_time = new Date();
	        beginning_of_time.setYear(1900);
	        node_iterator = [];
	        _.each(self.nodes, function (node) {
	          if (filter_by_date(beginning_of_time, node)) {
	            node.priority_flag = 4;
	            node_iterator.push(node);
	          } else {
	            node.priority_flag = 3;
	          }
	        });
	      }
	
	      var oldest_nodes_first = function oldest_nodes_first(n1, n2) {
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
	
	      // extract all clusters at once to avoid inefficiencies of multiple edge-set traverals
	
	      var split_clusters = {};
	      var node_id_to_local_cluster = {};
	
	      // reset all annotations 
	
	
	      _.each(node_iterator, function (node) {
	        if (node.cluster) {
	          if (!(node.cluster in split_clusters)) {
	            split_clusters[node.cluster] = { 'Nodes': [], 'Edges': [] };
	          }
	          node_id_to_local_cluster[node.id] = split_clusters[node.cluster]["Nodes"].length;
	          split_clusters[node.cluster]["Nodes"].push(node);
	        }
	      });
	
	      _.each(self.edges, function (edge) {
	        if (edge.length <= self.subcluster_threshold) {
	          var edge_cluster = json.Nodes[edge.source].cluster;
	
	          var source_id = json.Nodes[edge.source].id,
	              target_id = json.Nodes[edge.target].id;
	
	          if (source_id in node_id_to_local_cluster && target_id in node_id_to_local_cluster) {
	            var copied_edge = _.clone(edge);
	
	            copied_edge.source = node_id_to_local_cluster[source_id];
	            copied_edge.target = node_id_to_local_cluster[target_id];
	
	            split_clusters[edge_cluster]["Edges"].push(copied_edge);
	          }
	        }
	      });
	
	      _.each(split_clusters, function (cluster_nodes, cluster_index) {
	
	        /** extract subclusters; all nodes at given threshold */
	        /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */
	
	        //var cluster_nodes       = _extract_single_cluster (cluster.children, null, true);
	
	        var array_index = self.cluster_mapping[cluster_index];
	
	        self.clusters[array_index].priority_score = 0;
	
	        /** all clusters with more than one member connected at 'threshold' edge length */
	        var edges = [];
	
	        var subclusters = _.filter(hivtrace_cluster_depthwise_traversal(cluster_nodes.Nodes, cluster_nodes.Edges, null, edges), function (cc) {
	          return cc.length > 1;
	        });
	
	        edges = _.filter(edges, function (es) {
	          return es.length > 1;
	        });
	
	        /** sort subclusters by oldest node */
	
	        _.each(subclusters, function (c, i) {
	          c.sort(oldest_nodes_first);
	        });
	
	        subclusters.sort(function (c1, c2) {
	          return oldest_nodes_first(c1[0], c2[0]);
	        });
	
	        subclusters = _.map(subclusters, function (c, i) {
	          var label = self.clusters[array_index].cluster_id + "." + (i + 1);
	
	          _.each(c, function (n) {
	            n.subcluster = label;
	            n.priority_flag = 0;
	          });
	
	          return {
	            'children': _.clone(c),
	            'parent_cluster': self.clusters[array_index],
	            'cluster_id': label,
	            'distances': helpers.describe_vector(_.map(edges[i], function (e) {
	              return e.length;
	            }))
	          };
	        });
	
	        _.each(subclusters, function (c) {
	          _compute_cluster_degrees(c);
	        });
	
	        self.clusters[array_index].subclusters = subclusters;
	
	        /** now, for each subcluster, extract the recent and rapid part */
	
	        /** Recent & Rapid (R&R) Cluster: the part of the Sub-Cluster inferred using only cases dx’d in the previous 36 months 
	            and at least two cases dx’d in the previous 12 months; there is a path between all nodes in an R&R Cluster
	            
	            20180406 SLKP: while unlikely, this definition could result in multiple R&R clusters 
	            per subclusters; for now we will add up all the cases for prioritization, and 
	            display the largest R&R cluster if there is more than one
	        */
	
	        _.each(subclusters, function (sub) {
	          // extract nodes based on dates
	          var subcluster_json = _extract_single_cluster(_.filter(sub.children, _.partial(filter_by_date, cutoff_long)), null, true, cluster_nodes);
	          var rr_cluster = _.filter(hivtrace_cluster_depthwise_traversal(subcluster_json.Nodes, _.filter(subcluster_json.Edges, function (e) {
	            return e.length <= self.subcluster_threshold;
	          })), function (cc) {
	            return cc.length > 1;
	          });
	
	          sub.rr_count = rr_cluster.length;
	          sub.priority_score = 0;
	          sub.recent_nodes = 0;
	
	          _.each(rr_cluster, function (recent_cluster) {
	            var priority_nodes = _.groupBy(recent_cluster, _.partial(filter_by_date, cutoff_short));
	            sub.recent_nodes += recent_cluster.length;
	            if (true in priority_nodes) {
	              sub.priority_score += priority_nodes[true].length;
	              _.each(priority_nodes[true], function (n) {
	                n.priority_flag = filter_by_date(start_date, n) ? 3 : 1;
	              });
	            }
	            if (false in priority_nodes) {
	              _.each(priority_nodes[false], function (n) {
	                n.priority_flag = 2;
	              });
	            }
	          });
	
	          self.clusters[array_index].priority_score += sub.priority_score;
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
	      self.clusters = init_layout.filter(function (v, i, obj) {
	        return !(typeof v.cluster_id === "undefined");
	      });
	    } else {
	      var coordinate_update = {};
	      _.each(self.clusters, function (c) {
	        coordinate_update[c.cluster_id] = c;
	      });
	      _.each(init_layout, function (c) {
	        if ("cluster_id" in c) {
	          _.extendOwn(coordinate_update[c.cluster_id], c);
	        }
	      });
	    }
	
	    //var sizes = network_layout.size();
	
	    var set_init_coords = packed ? function (n) {
	      n.x += n.r * 0.5;n.y += n.r * 0.5;
	    } : function (n) {
	      n.x += n.dx * 0.5;n.y += n.dy * 0.5;
	    };
	
	    _.each([self.nodes, self.clusters], function (list) {
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
	
	      var rescale_x = d3.scale.linear().domain(d3.extent(network_layout.nodes(), function (node) {
	        return node.x;
	      }));
	      rescale_x.range(_.map(rescale_x.domain(), function (v) {
	        return v * x_scale;
	      }));
	      //.range ([50,self.width-50]),
	      var rescale_y = d3.scale.linear().domain(d3.extent(network_layout.nodes(), function (node) {
	        return node.y;
	      }));
	      rescale_y.range(_.map(rescale_y.domain(), function (v) {
	        return v * y_scale;
	      }));
	
	      _.each(network_layout.nodes(), function (node) {
	        node.x = rescale_x(node.x);
	        node.y = rescale_y(node.y);
	      });
	    }
	
	    self.width = Math.min(Math.max(self.width, 200), 4000);
	    self.height = Math.min(Math.max(self.height, 200), 4000);
	
	    network_layout.size([self.width, self.height]);
	    self.network_svg.attr("width", self.width).attr("height", self.height);
	
	    if (trigger) {
	      network_layout.start();
	    } else {
	      if (delta) {
	        self.update(true);
	      }
	    }
	  }
	
	  self.compute_adjacency_list = _.once(function () {
	    self.nodes.forEach(function (n) {
	      n.neighbors = d3.set();
	    });
	
	    self.edges.forEach(function (e) {
	      self.nodes[e.source].neighbors.add(e.target);
	      self.nodes[e.target].neighbors.add(e.source);
	    });
	  });
	
	  self.compute_local_clustering_coefficients = _.once(function () {
	    self.compute_adjacency_list();
	
	    self.nodes.forEach(function (n) {
	      _.defer(function (a_node) {
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
	                if (self.nodes[neighborhood[n1]].neighbors.has(neighborhood[n2])) {
	                  counter++;
	                }
	              }
	            }
	
	            a_node.lcc = 2 * counter / neighborhood_size / (neighborhood_size - 1);
	          }
	        }
	      }, n);
	    });
	  });
	
	  self.get_node_by_id = function (id) {
	    return self.nodes.filter(function (n) {
	      return n.id == id;
	    })[0];
	  };
	
	  self.compute_local_clustering_coefficients_worker = _.once(function () {
	    var worker = new Worker("workers/lcc.js");
	
	    worker.onmessage = function (event) {
	      var nodes = event.data.Nodes;
	
	      nodes.forEach(function (n) {
	        node_to_update = self.get_node_by_id(n.id);
	        node_to_update.lcc = n.lcc ? n.lcc : misc.undefined;
	      });
	    };
	
	    var worker_obj = {};
	    worker_obj["Nodes"] = self.nodes;
	    worker_obj["Edges"] = self.edges;
	    worker.postMessage(worker_obj);
	  });
	
	  var estimate_cubic_compute_cost = _.memoize(function (c) {
	    self.compute_adjacency_list();
	    return _.reduce(_.first(_.pluck(c.children, "degree").sort(d3.descending), 3), function (memo, value) {
	      return memo * value;
	    }, 1);
	  }, function (c) {
	    return c.cluster_id;
	  });
	
	  self.compute_global_clustering_coefficients = _.once(function () {
	    self.compute_adjacency_list();
	
	    self.clusters.forEach(function (c) {
	      _.defer(function (a_cluster) {
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
	
	            self.nodes.forEach(function (n, i) {
	              if (n.cluster == a_cluster.cluster_id) {
	                member_nodes.push(i);
	              }
	            });
	            member_nodes.forEach(function (node) {
	              my_neighbors = self.nodes[node].neighbors.values().map(function (d) {
	                return +d;
	              }).sort(d3.ascending);
	              for (n1 = 0; n1 < my_neighbors.length; n1 += 1) {
	                for (n2 = n1 + 1; n2 < my_neighbors.length; n2 += 1) {
	                  triads += 1;
	                  if (self.nodes[my_neighbors[n1]].neighbors.has(my_neighbors[n2])) {
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
	
	  self.mark_nodes_as_processing = function (property) {
	    self.nodes.forEach(function (n) {
	      n[property] = misc.processing;
	    });
	  };
	
	  self.compute_graph_stats = function () {
	    d3.select(this).classed("disabled", true).select("i").classed({
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
	    var connected_links = [];
	    var total = 0;
	    self.exclude_cluster_ids = {};
	    self.has_hxb2_links = false;
	    self.cluster_sizes = [];
	
	    graph_data.Nodes.forEach(function (d) {
	      if (typeof self.cluster_sizes[d.cluster - 1] === "undefined") {
	        self.cluster_sizes[d.cluster - 1] = 1;
	      } else {
	        self.cluster_sizes[d.cluster - 1]++;
	      }
	      if ("is_lanl" in d) {
	        d.is_lanl = d.is_lanl == "true";
	      }
	
	      if (d.attributes.indexOf("problematic") >= 0) {
	        self.has_hxb2_links = d.hxb2_linked = true;
	      }
	    });
	
	    /* add buttons and handlers */
	    /* clusters first */
	
	    self.ui_container_selector = button_bar_ui;
	
	    self._extract_attributes_for_nodes = function (nodes, column_names) {
	      var result = [_.map(column_names, function (c) {
	        return c.raw_attribute_key;
	      })];
	      _.each(nodes, function (n) {
	        result.push(_.map(column_names, function (c) {
	          return self.attribute_node_value_by_id(n, c.raw_attribute_key);
	        }));
	      });
	      return result;
	    };
	
	    self._extract_exportable_attributes = function () {
	      var allowed_types = {
	        String: 1,
	        Date: 1,
	        Number: 1
	      };
	
	      return _.filter(self.json[_networkGraphAttrbuteID], function (d) {
	        return d.type in allowed_types;
	      });
	    };
	
	    self._extract_nodes_by_id = function (id) {
	
	      var string_id = id.toString();
	      return _.filter(self.nodes, function (n) {
	        return n.cluster == id || n.subcluster == string_id;
	      });
	    };
	
	    self._cluster_list_view_render = function (cluster_id, group_by_attribute, the_list) {
	
	      the_list.selectAll("*").remove();
	      var column_ids = self._extract_exportable_attributes();
	      var cluster_nodes = self._extract_nodes_by_id(cluster_id);
	
	      d3.select(self.get_ui_element_selector_by_role("cluster_list_data_export", true)).on("click", function (d) {
	        helpers.export_csv_button(self._extract_attributes_for_nodes(cluster_nodes, column_ids));
	      });
	
	      if (group_by_attribute) {
	        _.each(column_ids, function (column) {
	          var binned = _.groupBy(cluster_nodes, function (n) {
	            return self.attribute_node_value_by_id(n, column.raw_attribute_key);
	          });
	          var sorted_keys = _.keys(binned).sort();
	          var attribute_record = the_list.append("li");
	          attribute_record.append("code").text(column.raw_attribute_key);
	          var attribute_list = attribute_record.append("dl").classed("dl-horizontal", true);
	          _.each(sorted_keys, function (key) {
	            attribute_list.append("dt").text(key);
	            attribute_list.append("dd").text(_.map(binned[key], function (n) {
	              return n.id;
	            }).join(", "));
	          });
	        });
	      } else {
	        _.each(cluster_nodes, function (node) {
	          var patient_record = the_list.append("li");
	          patient_record.append("code").text(node.id);
	          var patient_list = patient_record.append("dl").classed("dl-horizontal", true);
	          _.each(column_ids, function (column) {
	            patient_list.append("dt").text(column.raw_attribute_key);
	            patient_list.append("dd").text(self.attribute_node_value_by_id(node, column.raw_attribute_key));
	          });
	        });
	      }
	    };
	
	    self._setup_cluster_list_view = function () {
	      d3.select(self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)).on("click", function () {
	        d3.event.preventDefault();
	        var group_by_id = false;
	
	        var button_clicked = $(this);
	        if (button_clicked.data("view") == "id") {
	          button_clicked.data("view", "attribute");
	          button_clicked.text("Group by ID");
	          group_by_id = false;
	        } else {
	          button_clicked.data("view", "id");
	          button_clicked.text("Group by attribute");
	          group_by_id = true;
	        }
	        self._cluster_list_view_render(button_clicked.data("cluster").toString(), !group_by_id, d3.select(self.get_ui_element_selector_by_role("cluster_list_payload", true)));
	      });
	
	      $(self.get_ui_element_selector_by_role("cluster_list", true)).on("show.bs.modal", function (event) {
	        var link_clicked = $(event.relatedTarget);
	        var cluster_id = link_clicked.data("cluster");
	        var modal = d3.select(self.get_ui_element_selector_by_role("cluster_list", true));
	        modal.selectAll(".modal-title").text("Listing nodes in cluster " + cluster_id);
	        $(self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)).data("cluster", cluster_id);
	
	        self._cluster_list_view_render(cluster_id, $(self.get_ui_element_selector_by_role("cluster_list_view_toggle", true)).data("view") != "id", modal.select(self.get_ui_element_selector_by_role("cluster_list_payload", true)));
	      });
	    };
	
	    if (button_bar_ui) {
	
	      self._setup_cluster_list_view();
	
	      var cluster_ui_container = d3.select(self.get_ui_element_selector_by_role("cluster_operations_container"));
	
	      cluster_ui_container.selectAll("li").remove();
	
	      var fix_handler = function fix_handler(do_fix) {
	        _.each([self.clusters, self.nodes], function (list) {
	          _.each(list, function (obj) {
	            obj.fixed = do_fix;
	          });
	        });
	      };
	
	      var layout_reset_handler = function layout_reset_handler(packed) {
	        var fixed = [];
	        _.each(self.clusters, function (obj) {
	          if (obj.fixed) {
	            fixed.push(obj);
	          }
	          obj.fixed = false;
	        });
	        default_layout(packed);
	        network_layout.tick();
	        self.update();
	        _.each(fixed, function (obj) {
	          obj.fixed = true;
	        });
	      };
	
	      var cluster_commands = [["Expand All", function () {
	        return self.expand_some_clusters();
	      }, true, "hivtrace-expand-all"], ["Collapse All", function () {
	        return self.collapse_some_clusters();
	      }, true, "hivtrace-collapse-all"], ["Expand Filtered", function () {
	        return self.expand_some_clusters(self.select_some_clusters(function (n) {
	          return n.match_filter;
	        }));
	      }, true, "hivtrace-expand-filtered"], ["Collapse Filtered", function () {
	        return self.collapse_some_clusters(self.select_some_clusters(function (n) {
	          return n.match_filter;
	        }));
	      }, true, "hivtrace-collapse-filtered"], ["Fix all objects in place", _.partial(fix_handler, true), true, "hivtrace-fix-in-place"], ["Allow all objects to float", _.partial(fix_handler, false), true, "hivtrace-allow-to-float"], ["Reset layout [packed]", _.partial(layout_reset_handler, true), true, "hivtrace-reset-layout"], ["Reset layout [tiled]", _.partial(layout_reset_handler, false), true, "hivtrace-reset-layout"], ["Hide problematic clusters", function (item) {
	        d3.select(item).text(self.hide_hxb2 ? "Hide problematic clusters" : "Show problematic clusters");
	        self.toggle_hxb2();
	      }, self.has_hxb2_links, "hivtrace-hide-problematic-clusters"]];
	
	      if (!self._is_CDC_) {
	        cluster_commands.push(["Show removed edges", function (item) {
	          self.filter_edges = !self.filter_edges;
	          d3.select(item).text(self.filter_edges ? "Show removed edges" : "Hide removed edges");
	          self.update(false);
	        }, function () {
	          return _.some(self.edges, function (d) {
	            return d.removed;
	          });
	        }, "hivtrace-show-removed-edges"]);
	      }
	
	      cluster_commands.forEach(function (item, index) {
	        var handler_callback = item[1];
	        if (item[2]) {
	          this.append("li").append("a").text(item[0]).attr("href", "#")
	          //.attr("id", item[3])
	          .on("click", function (e) {
	            handler_callback(this);
	            d3.event.preventDefault();
	          });
	        }
	      }, cluster_ui_container);
	
	      var button_group = d3.select(self.get_ui_element_selector_by_role("button_group"));
	
	      if (!button_group.empty()) {
	        button_group.selectAll("button").remove();
	        button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Expand spacing").on("click", function (d) {
	          change_spacing(5 / 4);
	        }).append("i").classed("fa fa-plus", true);
	        button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Compress spacing").on("click", function (d) {
	          change_spacing(4 / 5);
	        }).append("i").classed("fa fa-minus", true);
	        button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Enlarge window").on("click", function (d) {
	          change_window_size(100, true);
	        }).append("i").classed("fa fa-expand", true);
	        button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Shrink window").on("click", function (d) {
	          change_window_size(-100, true);
	        }).append("i").classed("fa fa-compress", true);
	
	        if (!self._is_CDC_) {
	          button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Compute graph statistics").attr("id", "hivtrace-compute-graph-statistics").on("click", function (d) {
	            _.bind(self.compute_graph_stats, this)();
	          }).append("i").classed("fa fa-calculator", true);
	        }
	
	        button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Save Image")
	        //.attr("id", "hivtrace-export-image")
	        .on("click", function (d) {
	          helpers.save_image("png", "#" + self.dom_prefix + "-network-svg");
	        }).append("i").classed("fa fa-image", true);
	      }
	
	      $(self.get_ui_element_selector_by_role("filter")).on("input propertychange", _.throttle(function (e) {
	        var filter_value = $(this).val();
	        self.filter(filter_value.split(" ").filter(function (d) {
	          return d.length > 0;
	        }).map(function (d) {
	          if (d.length > 2) {
	            if (d[0] == '"' && d[d.length - 1] == '"') {
	              return {
	                type: "re",
	                value: new RegExp("^" + d.substr(1, d.length - 2) + "$", "i")
	              };
	            }
	            if (d[0] == "<") {
	              var distance_threshold = parseFloat(d.substr(1));
	              if (distance_threshold > 0) {
	                return {
	                  type: "distance",
	                  value: distance_threshold
	                };
	              }
	            }
	          }
	          return {
	            type: "re",
	            value: new RegExp(d, "i")
	          };
	        }));
	      }, 250));
	
	      $(self.get_ui_element_selector_by_role("hide_filter")).on("change", _.throttle(function (e) {
	        self.hide_unselected = !self.hide_unselected;
	        self.filter_visibility();
	        self.update(true);
	      }, 250));
	
	      $(self.get_ui_element_selector_by_role("show_small_clusters")).on("change", _.throttle(function (e) {
	
	        if ('size' in self.cluster_filtering_functions) {
	          delete self.cluster_filtering_functions['size'];
	        } else {
	          self.cluster_filtering_functions['size'] = self.filter_by_size;
	        }
	
	        self.update(false);
	      }, 250));
	
	      $(self.get_ui_element_selector_by_role("pairwise_table_pecentage", true)).on("change", _.throttle(function (e) {
	        self.show_percent_in_pairwise_table = !self.show_percent_in_pairwise_table;
	        render_binned_table("attribute_table", self.colorizer["category_map"], self.colorizer["category_pairwise"]);
	      }, 250));
	    }
	
	    if (_networkGraphAttrbuteID in json) {
	      attributes = json[_networkGraphAttrbuteID];
	    } else {
	      if (attributes && "hivtrace" in attributes) {
	        attributes = attributes["hivtrace"];
	      }
	    }
	
	    // Initialize class attributes
	    singletons = graph_data.Nodes.filter(function (v, i) {
	      return v.cluster === null;
	    }).length;
	    self.nodes = graph_data.Nodes.filter(function (v, i) {
	      if (v.cluster && typeof self.exclude_cluster_ids[v.cluster] === "undefined") {
	        connected_links[i] = total++;
	        return true;
	      }
	      return false;
	    });
	    self.edges = graph_data.Edges.filter(function (v, i) {
	      return connected_links[v.source] != undefined && connected_links[v.target] != undefined;
	    });
	    self.edges = self.edges.map(function (v, i) {
	      v.source = connected_links[v.source];
	      v.target = connected_links[v.target];
	      v.id = i;
	      return v;
	    });
	
	    compute_node_degrees(self.nodes, self.edges);
	
	    default_layout(self.initial_packed);
	    self.clusters.forEach(function (d, i) {
	      self.cluster_mapping[d.cluster_id] = i;
	      d.hxb2_linked = d.children.some(function (c) {
	        return c.hxb2_linked;
	      });
	      _compute_cluster_degrees(d);
	      d.distances = [];
	    });
	
	    if (self._is_CDC_ && !(options && options["no-subclusters"])) {
	      self.annotate_priority_clusters(_networkCDCDateField, 36, 12);
	    }
	    try {
	      if (options && options["extra_menu"]) {
	        var extra_ui_container = d3.select(self.get_ui_element_selector_by_role("extra_operations_container"));
	
	        d3.select(self.get_ui_element_selector_by_role("extra_operations_enclosure")).selectAll("button").text(options["extra_menu"]["title"]).append("span").classed("caret", "true");
	        //extra_ui_container
	        extra_ui_container.selectAll("li").remove();
	
	        options["extra_menu"]["items"].forEach(function (item, index) {
	          //console.log (item);
	          var handler_callback = item[1];
	          if (_.isFunction(item[0])) {
	            item[0](self, this.append("li"));
	          } else {
	            this.append("li").append("a").text(item[0]).attr("href", "#").on("click", function (e) {
	              handler_callback(self, this);
	              d3.event.preventDefault();
	            });
	          }
	        }, extra_ui_container);
	
	        d3.select(self.get_ui_element_selector_by_role("extra_operations_enclosure")).style("display", null);
	      }
	    } catch (err) {
	      console.log(err);
	    }
	
	    self._aux_populate_category_menus = function () {
	      if (button_bar_ui) {
	        var _menu_label_gen = function _menu_label_gen(d) {
	          return (d["annotation"] ? "[" + d["annotation"] + "] " : "") + d["label"];
	        };
	
	        //console.log (valid_scales);
	        //valid_cats.splice (0,0, {'label' : 'None', 'index' : -1});
	
	        // decide if the variable can be considered categorical by examining its range
	
	        //console.log ("self._aux_populate_category_menus");
	        var valid_cats = _.filter(_.map(graph_data[_networkGraphAttrbuteID], self._aux_populate_category_fields), function (d) {
	          //console.log (d);
	          return d.discrete && "value_range" in d && d["value_range"].length <= _maximumValuesInCategories;
	        });
	
	        var valid_shapes = _.filter(valid_cats, function (d) {
	          return d.discrete && d.dimension <= 7 || d["raw_attribute_key"] in _networkPresetShapeSchemes;
	        });
	
	        // sort values alphabetically for consistent coloring
	
	        _.each([valid_cats, valid_shapes], function (list) {
	          _.each(list, self._aux_process_category_values);
	        });
	
	        var valid_scales = _.filter(_.map(graph_data[_networkGraphAttrbuteID], function (d, k) {
	          function determine_scaling(d, values, scales) {
	            var low_var = Infinity;
	
	            _.each(scales, function (scl) {
	              d["value_range"] = d3.extent(values);
	              var bins = _.map(_.range(_networkContinuousColorStops), function () {
	                return 0;
	              });
	              scl.range([0, _networkContinuousColorStops - 1]).domain(d["value_range"]);
	              _.each(values, function (v) {
	                bins[Math.floor(scl(v))]++;
	              });
	
	              var mean = values.length / _networkContinuousColorStops;
	              var vrnc = _.reduce(bins, function (p, c) {
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
	          if (d.type == "Number") {
	            var values = _.filter(_.map(graph_data.Nodes, function (nd) {
	              return self.attribute_node_value_by_id(nd, k, true);
	            }), function (v) {
	              return v != _networkMissing;
	            });
	            // automatically determine the scale and see what spaces the values most evenly
	            determine_scaling(d, values, [d3.scale.linear(), d3.scale.log(), d3.scale.pow().exponent(1 / 3), d3.scale.pow().exponent(0.25), d3.scale.pow().exponent(0.5), d3.scale.pow().exponent(1 / 8), d3.scale.pow().exponent(1 / 16)]);
	          } else {
	            if (d.type == "Date") {
	              var values = _.filter(_.map(graph_data.Nodes, function (nd) {
	                try {
	                  var a_date = self.attribute_node_value_by_id(nd, k);
	                  //console.log (k, a_date);
	                  inject_attribute_node_value_by_id(nd, k, self._parse_dates(a_date));
	                } catch (err) {
	                  inject_attribute_node_value_by_id(nd, k, _networkMissing);
	                }
	                return self.attribute_node_value_by_id(nd, k);
	              }), function (v) {
	                return v == _networkMissing ? null : v;
	              });
	              // automatically determine the scale and see what spaces the values most evenly
	              if (values.length == 0) {
	                // invalid scale 
	                return {};
	              }
	              determine_scaling(d, values, [d3.time.scale()]);
	            }
	          }
	          return d;
	        }), function (d) {
	          return d.type == "Number" || d.type == "Date";
	        });
	
	        [d3.select(self.get_ui_element_selector_by_role("attributes")), d3.select(self.get_ui_element_selector_by_role("attributes_cat", true))].forEach(function (m) {
	
	          //console.log (m);  
	
	          if (m.empty()) {
	            return;
	          }
	          m.selectAll("li").remove();
	
	          var menu_items = [[["None", null, _.partial(self.handle_attribute_categorical, null)]], [["Categorical", "heading", null]]].concat(valid_cats.map(function (d, i) {
	            return [[_menu_label_gen(d), d["raw_attribute_key"], _.partial(self.handle_attribute_categorical, d["raw_attribute_key"])]];
	          }));
	
	          if (valid_scales.length) {
	            menu_items = menu_items.concat([[["Continuous", "heading", null]]]).concat(valid_scales.map(function (d, i) {
	              return [[_menu_label_gen(d), d["raw_attribute_key"], _.partial(self.handle_attribute_continuous, d["raw_attribute_key"])]];
	            }));
	          }
	
	          var cat_menu = m.selectAll("li").data(menu_items);
	
	          cat_menu.enter().append("li").classed("disabled", function (d) {
	            return d[0][1] == "heading";
	          }).style("font-variant", function (d) {
	            return d[0][1] < -1 ? "small-caps" : "normal";
	          });
	
	          cat_menu.selectAll("a").data(function (d) {
	            return d;
	          }).enter().append("a").text(function (d, i, j) {
	            return d[0];
	          }).attr("style", function (d, i, j) {
	            if (d[1] == "heading") return "font-style: italic";
	            if (j == 0) {
	              return " font-weight: bold;";
	            }
	            return null;
	          }).attr("href", "#").on("click", function (d) {
	            if (d[2]) {
	              d[2].call();
	            }
	          });
	        });
	
	        [d3.select(self.get_ui_element_selector_by_role("shapes"))].forEach(function (m) {
	          m.selectAll("li").remove();
	          var cat_menu = m.selectAll("li").data([[["None", null, _.partial(self.handle_shape_categorical, null)]]].concat(valid_shapes.map(function (d, i) {
	            return [[_menu_label_gen(d), d["raw_attribute_key"], _.partial(self.handle_shape_categorical, d["raw_attribute_key"])]];
	          })));
	
	          cat_menu.enter().append("li").style("font-variant", function (d) {
	            return d[0][1] < -1 ? "small-caps" : "normal";
	          });
	
	          cat_menu.selectAll("a").data(function (d) {
	            return d;
	          }).enter().append("a").text(function (d, i, j) {
	            return d[0];
	          }).attr("style", function (d, i, j) {
	            if (j == 0) {
	              return " font-weight: bold;";
	            }
	            return null;
	          }).attr("href", "#").on("click", function (d) {
	            if (d[2]) {
	              d[2].call();
	            }
	          });
	        });
	
	        $(self.get_ui_element_selector_by_role("opacity_invert")).on("click", function (e) {
	          if (self.colorizer["opacity_scale"]) {
	            self.colorizer["opacity_scale"].range(self.colorizer["opacity_scale"].range().reverse());
	            self.update(true);
	            self.draw_attribute_labels();
	          }
	          $(this).toggleClass("btn-active btn-default");
	        });
	
	        $(self.get_ui_element_selector_by_role("attributes_invert")).on("click", function (e) {
	          if (self.colorizer["category_id"]) {
	            graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]["scale"].range(graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]["scale"].range().reverse());
	            self.clusters.forEach(function (the_cluster) {
	              the_cluster["gradient"] = compute_cluster_gradient(the_cluster, self.colorizer["category_id"]);
	            });
	            self.update(true);
	            self.draw_attribute_labels();
	          }
	          $(this).toggleClass("btn-active btn-default");
	        });
	
	        [d3.select(self.get_ui_element_selector_by_role("opacity"))].forEach(function (m) {
	          m.selectAll("li").remove();
	          var cat_menu = m.selectAll("li").data([[["None", null, _.partial(self.handle_attribute_opacity, null)]]].concat(valid_scales.map(function (d, i) {
	            return [[d["label"], d["raw_attribute_key"], _.partial(self.handle_attribute_opacity, d["raw_attribute_key"])]];
	          })));
	
	          cat_menu.enter().append("li").style("font-variant", function (d) {
	            return d[0][1] < -1 ? "small-caps" : "normal";
	          });
	          cat_menu.selectAll("a").data(function (d) {
	            return d;
	          }).enter().append("a").text(function (d, i, j) {
	            return d[0];
	          }).attr("style", function (d, i, j) {
	            if (j == 0) {
	              return " font-weight: bold;";
	            }
	            return null;
	          }).attr("href", "#").on("click", function (d) {
	            if (d[2]) {
	              d[2].call();
	            }
	          });
	        });
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
	          graph_data[_networkGraphAttrbuteID] = attribute_map["map"].map(function (a, i) {
	            return {
	              label: a,
	              type: null,
	              values: {},
	              index: i,
	              range: 0
	            };
	          });
	
	          graph_data.Nodes.forEach(function (n) {
	            n[_networkGraphAttrbuteID] = n.id.split(attribute_map["delimiter"]);
	            n[_networkGraphAttrbuteID].forEach(function (v, i) {
	              if (i < graph_data[_networkGraphAttrbuteID].length) {
	                if (!(v in graph_data[_networkGraphAttrbuteID][i]["values"])) {
	                  graph_data[_networkGraphAttrbuteID][i]["values"][v] = graph_data[_networkGraphAttrbuteID][i]["range"];
	                  graph_data[_networkGraphAttrbuteID][i]["range"] += 1;
	                }
	              }
	              //graph_data [_networkGraphAttrbuteID][i]["values"][v] = 1 + (graph_data [_networkGraphAttrbuteID][i]["values"][v] ? graph_data [_networkGraphAttrbuteID][i]["values"][v] : 0);
	            });
	          });
	
	          graph_data[_networkGraphAttrbuteID].forEach(function (d) {
	            if (d["range"] < graph_data.Nodes.length && d["range"] > 1 && d["range"] <= 20) {
	              d["type"] = "category";
	            }
	          });
	        }
	      }
	
	      _.each(self._networkPredefinedAttributeTransforms, function (computed, key) {
	
	        if (_.isFunction(computed)) {
	          computed = computed(self);
	        }
	
	        if (!computed["depends"] || _.has(graph_data[_networkGraphAttrbuteID], computed["depends"])) {
	          var extension = {};
	          extension[key] = computed;
	          _.extend(graph_data[_networkGraphAttrbuteID], extension);
	          self.inject_attribute_description(key, computed);
	          _.each(graph_data.Nodes, function (node) {
	            inject_attribute_node_value_by_id(node, key, computed["map"](node, self));
	          });
	        }
	      });
	
	      self._aux_populate_category_menus();
	
	      // populate the UI elements
	    }
	
	    if (self.cluster_sizes.length > max_points_to_render) {
	      var sorted_array = self.cluster_sizes.map(function (d, i) {
	        return [d, i + 1];
	      }).sort(function (a, b) {
	        return a[0] - b[0];
	      });
	
	      for (var k = 0; k < sorted_array.length - max_points_to_render; k++) {
	        self.exclude_cluster_ids[sorted_array[k][1]] = 1;
	      }
	
	      warning_string = "Excluded " + (sorted_array.length - max_points_to_render) + " clusters (maximum size " + sorted_array[k - 1][0] + " nodes) because only " + max_points_to_render + " objects can be shown at once.";
	    }
	
	    self.edges.forEach(function (e, i) {
	      self.clusters[self.cluster_mapping[self.nodes[e.target].cluster]].distances.push(e.length);
	    });
	
	    self.clusters.forEach(function (d, i) {
	      d.distances = helpers.describe_vector(d.distances);
	    });
	    //self.clusters
	
	    self.update();
	  }
	
	  function sort_table_toggle_icon(element, value) {
	    if (value) {
	      $(element).data("sorted", value);
	      d3.select(element).selectAll("i").classed("fa-sort-amount-desc", value == "desc").classed("fa-sort-amount-asc", value == "asc").classed("fa-sort", value == "unsorted");
	    } else {
	      var sorted_state = $(element).data("sorted");
	      sort_table_toggle_icon(element, sorted_state == "asc" ? "desc" : "asc");
	      return sorted_state == "asc" ? d3.descending : d3.ascending;
	    }
	  }
	
	  function sort_table_by_column(element, datum) {
	    d3.event.preventDefault();
	    var table_element = $(element).closest("table");
	    if (table_element.length) {
	
	      var sort_on = parseInt($(element).data("column-id"));
	      var sort_key = datum.sort;
	      var sorted_state = $(element).data("sorted");
	      var sorted_function = sort_table_toggle_icon(element);
	
	      var sort_accessor;
	
	      if (sort_key) {
	        if (_.isFunction(sort_key)) {
	          sort_accessor = function sort_accessor(x) {
	            return sort_key(x);
	          };
	        } else {
	          sort_accessor = function sort_accessor(x) {
	            var val = x[sort_key];
	            if (_.isFunction(val)) return val();
	            return val;
	          };
	        }
	      } else {
	        sort_accessor = function sort_accessor(x) {
	          return x;
	        };
	      }
	
	      d3.select(table_element[0]).select("tbody").selectAll("tr").sort(function (a, b) {
	        return sorted_function(sort_accessor(a[sort_on]), sort_accessor(b[sort_on]));
	      });
	
	      // select all other elements from thead and toggle their icons
	
	      $(table_element).find("thead [data-column-id]").filter(function () {
	        return parseInt($(this).data("column-id")) != sort_on;
	      }).each(function () {
	        sort_table_toggle_icon(this, "unsorted");
	      });
	    }
	  }
	
	  function format_a_cell(data, index, item) {
	    var this_sel = d3.select(item);
	    var current_value = typeof data.value === "function" ? data.value() : data.value;
	
	    if ("callback" in data) {
	      data.callback(item, current_value);
	    } else {
	      var repr = "format" in data ? data.format(current_value) : current_value;
	      if ("html" in data) this_sel.html(repr);else this_sel.text(repr);
	      if ("sort" in data) {
	        var clicker = this_sel.append("a").property("href", "#").on("click", function (d) {
	          sort_table_by_column(this, d);
	        }).attr("data-sorted", "unsorted").attr("data-column-id", index);
	        clicker.append("i").classed("fa fa-sort", true).style("margin-left", "0.2em");
	      }
	    }
	    if ("help" in data) {
	      this_sel.attr("title", data.help);
	    }
	  }
	
	  function add_a_sortable_table(container, headers, content, overwrite) {
	    var thead = container.selectAll("thead");
	    if (thead.empty() || overwrite) {
	      thead.remove();
	      thead = container.append("thead");
	      thead.selectAll("tr").data(headers).enter().append("tr").selectAll("th").data(function (d) {
	        return d;
	      }).enter().append("th").call(function (selection) {
	        return selection.each(function (d, i) {
	          format_a_cell(d, i, this);
	        });
	      });
	    }
	
	    var tbody = container.selectAll("tbody");
	    if (tbody.empty() || overwrite) {
	      tbody.remove();
	      tbody = container.append("tbody");
	      tbody.selectAll("tr").data(content).enter().append("tr").selectAll("td").data(function (d) {
	        return d;
	      }).enter().append("td").call(function (selection) {
	        return selection.each(function (d, i) {
	          handle_cluster_click;
	          format_a_cell(d, i, this);
	        });
	      });
	    }
	  }
	
	  function _cluster_table_draw_id(element, payload) {
	    var this_cell = d3.select(element);
	    this_cell.selectAll("*").remove();
	    var _is_subcluster = payload[1];
	    var cluster_id = payload[0];
	
	    if (_is_subcluster) {
	      //this_cell.append("i")
	      //      .classed("fa fa-arrow-circle-o-right", true).style("padding-right", "0.25em");  
	
	      if (payload[2].rr_count) {
	        this_cell.append("i").classed("fa fa-exclamation-triangle", true).attr("title", "Subcluster has recent/rapid nodes");
	      }
	      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
	
	      this_cell.append("button").classed("btn btn-primary btn-xs pull-right", true).text("View").on("click", function (e) {
	        self.view_subcluster(payload[2]);
	      });
	    } else {
	      this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
	      this_cell.append("button").classed("btn btn-primary btn-xs pull-right", true).text("View").on("click", function (e) {
	        self.open_exclusive_tab_view(cluster_id);
	      });
	    }
	    this_cell.append("button").classed("btn btn-xs pull-right", true).text("List").attr("data-toggle", "modal").attr("data-target", self.get_ui_element_selector_by_role("cluster_list", true)).attr("data-cluster", cluster_id);
	  }
	
	  function _cluster_table_draw_buttons(element, payload) {
	    var this_cell = d3.select(element);
	    var labels = [[payload[0] ? "expand" : "collapse", 0]];
	    if (payload[1]) {
	      labels.push(["problematic", 1]);
	    }
	    if (payload[2]) {
	      labels.push(["match", 1]);
	    }
	    var buttons = this_cell.selectAll("button").data(labels);
	    buttons.enter().append("button");
	    buttons.exit().remove();
	    buttons.classed("btn btn-primary btn-xs", true).text(function (d) {
	      return d[0];
	    }).attr("disabled", function (d) {
	      return d[1] ? "disabled" : null;
	    }).on("click", function (d) {
	      if (d[1] == 0) {
	        if (payload[0]) {
	          expand_cluster(self.clusters[payload[payload.length - 1] - 1], true);
	        } else {
	          collapse_cluster(self.clusters[payload[payload.length - 1] - 1]);
	        }
	        self.update_volatile_elements(self.cluster_table);
	        if (self.subcluster_table) {
	          self.update_volatile_elements(self.subcluster_table);
	        }
	      }
	    });
	  }
	
	  function _extract_single_cluster(nodes, filter, no_clone, given_json) {
	    /** 
	        Extract the nodes and edges between them into a separate objects 
	        @param nodes [array]  the list of nodes to extract
	        @param filter [function, optional] (edge) -> bool filtering function for deciding which edges will be used to define clusters
	        @param no_clone [bool] if set to T, node objects are not shallow cloned in the return object
	        
	        @return [dict] the object representing "Nodes" and "Edges" in the extracted cluster
	        
	    */
	
	    var cluster_json = {};
	    var map_to_id = {};
	
	    cluster_json.Nodes = _.map(nodes, function (c, i) {
	      map_to_id[c.id] = i;
	      if (no_clone) {
	        return c;
	      }
	      var cc = _.clone(c);
	      cc.cluster = 1;
	      return cc;
	    });
	
	    given_json = given_json || json;
	
	    cluster_json.Edges = _.filter(given_json.Edges, function (e) {
	      return given_json.Nodes[e.source].id in map_to_id && given_json.Nodes[e.target].id in map_to_id;
	    });
	
	    if (filter) {
	      cluster_json.Edges = _.filter(cluster_json.Edges, filter);
	    }
	
	    cluster_json.Edges = _.map(cluster_json.Edges, function (e) {
	      var ne = _.clone(e);
	      ne.source = map_to_id[given_json.Nodes[e.source].id];
	      ne.target = map_to_id[given_json.Nodes[e.target].id];
	      return ne;
	    });
	
	    return cluster_json;
	  }
	
	  function _node_table_draw_buttons(element, payload) {
	    var this_cell = d3.select(element);
	    var labels = [payload.length == 1 ? _.isString(payload[0]) ? [payload[0], 1, "btn-warning"] : ["can't be shown", 1] : [payload[0] ? "hide" : "show", 0]];
	
	    if (payload.length == 2 && payload[1] >= 1) {
	      labels.push(["View cluster", function () {
	        self.open_exclusive_tab_view(payload[1]);
	      }]);
	    }
	
	    var buttons = this_cell.selectAll("button").data(labels);
	    buttons.enter().append("button");
	    buttons.exit().remove();
	    buttons.classed("btn btn-xs btn-node-property", true).classed("btn-primary", true)
	    //.classed(function (d) {return d.length >=3 ? d[2] : "";}, function (d) {return d.length >= 3;})
	    .text(function (d) {
	      return d[0];
	    }).attr("disabled", function (d) {
	      return d[1] && !_.isFunction(d[1]) ? "disabled" : null;
	    }).on("click", function (d) {
	      if (_.isFunction(d[1])) {
	        d[1].call(d);
	      } else {
	        if (d[1] == 0) {
	          if (payload[0]) {
	            collapse_cluster(self.clusters[payload[payload.length - 1] - 1], true);
	          } else {
	            expand_cluster(self.clusters[payload[payload.length - 1] - 1]);
	          }
	          //format_a_cell(d3.select(element).datum(), null, element);
	          self.update_volatile_elements(self.node_table);
	        }
	      }
	    });
	    buttons.each(function (d, e) {
	      if (d.length >= 3) {
	        d3.select(this).classed("btn-primary", false).classed(d[2], true);
	      }
	    });
	  }
	
	  self.update_volatile_elements = function (container) {
	    container.selectAll("td").filter(function (d, i) {
	      return "volatile" in d;
	    }).each(function (d, i) {
	      format_a_cell(d, i, this);
	    });
	  };
	
	  self.draw_node_table = function (extra_columns, node_list) {
	    if (self.node_table) {
	
	      node_list = node_list || self.nodes;
	
	      var headers = [[{
	        value: "ID",
	        sort: "value",
	        help: "Node ID"
	      }, {
	        value: "Status",
	        sort: "value"
	      }, {
	        value: "# of links",
	        sort: "value",
	        help: "Number of links (Node degree)"
	      }, {
	        value: "Cluster",
	        sort: "value",
	        help: "Which cluster does the node belong to"
	      }]];
	
	      if (extra_columns) {
	        _.each(extra_columns, function (d) {
	          headers[0].push(d.description);
	        });
	      }
	
	      var rows = node_list.map(function (n, i) {
	        var this_row = [{
	          value: n.id,
	          help: "Node ID"
	        }, {
	          value: function value() {
	            if (n.node_class != "injected") {
	              try {
	                if (self.exclude_cluster_ids[n.cluster]) {
	                  // parent cluster can't be rendered
	                  // because of size restrictions
	                  return [n.cluster];
	                }
	                return [!self.clusters[self.cluster_mapping[n.cluster]].collapsed, n.cluster];
	              } catch (err) {
	                return [-1];
	              }
	            } else {
	              return [n.node_annotation];
	            }
	          },
	          callback: _node_table_draw_buttons,
	          volatile: true
	        }, {
	          value: "degree" in n ? n.degree : "Not defined",
	          help: "Node degree"
	        }, {
	          value: "cluster" in n ? n.cluster : "Not defined",
	          help: "Which cluster does the node belong to"
	        }];
	
	        if (extra_columns) {
	          _.each(extra_columns, function (ed) {
	            this_row.push(ed.generator(n, self));
	          });
	        }
	        return this_row;
	      });
	
	      add_a_sortable_table(self.node_table, headers, rows, true
	      // rows
	      );
	    }
	  };
	
	  self.draw_cluster_table = function (extra_columns, element, skip_clusters, skip_subclusters) {
	    element = element || self.cluster_table;
	    if (element) {
	
	      var headers = [[{
	        value: "Cluster ID",
	        sort: function sort(c) {
	          return _.map(c.value[0].split('.'), function (ss) {
	            return _networkDotFormatPadder(+ss);
	          }).join("|");
	        },
	        help: "Unique cluster ID"
	      }, {
	        value: "Visibility",
	        sort: "value",
	        help: "Visibility in the network tab"
	      }, {
	        value: "Size",
	        sort: "value",
	        help: "Number of nodes in the cluster"
	      }]];
	
	      if (!self._is_CDC) {
	        headers.push({
	          value: "# links/node<br>Mean [Median, IQR]",
	          html: true
	        });
	
	        headers.push({
	          value: "Genetic distance<br>Mean [Median, IQR]",
	          help: "Genetic distance among nodes in the cluster",
	          html: true
	        });
	      }
	
	      if (extra_columns) {
	        _.each(extra_columns, function (d) {
	          headers[0].push(d.description);
	        });
	      }
	
	      var rows = [];
	
	      _.each(self.clusters, function (cluster) {
	        var make_row = function make_row(d, is_subcluster) {
	          var this_row = [{
	            value: [d.cluster_id, is_subcluster, d], //.cluster_id,
	            callback: _cluster_table_draw_id
	          }, {
	            value: function value() {
	              var actual_cluster = is_subcluster ? d.parent_cluster : d;
	
	              return [actual_cluster.collapsed, actual_cluster.hxb2_linked, actual_cluster.match_filter, actual_cluster.cluster_id];
	            },
	            callback: _cluster_table_draw_buttons,
	            volatile: true
	          }, {
	            value: d.children.length
	          }];
	
	          if (!self._is_CDC_) {
	            this_row.push({
	              value: d.degrees,
	              format: function format(d) {
	                try {
	                  return _defaultFloatFormat(d["mean"]) + " [" + _defaultFloatFormat(d["median"]) + ", " + _defaultFloatFormat(d["Q1"]) + " - " + _defaultFloatFormat(d["Q3"]) + "]";
	                } catch (e) {
	                  return "";
	                }
	              }
	            });
	            this_row.push({
	              value: d.distances,
	              format: function format(d) {
	                try {
	                  return _defaultFloatFormat(d["mean"]) + " [" + _defaultFloatFormat(d["median"]) + ", " + _defaultFloatFormat(d["Q1"]) + " - " + _defaultFloatFormat(d["Q3"]) + "]";
	                } catch (e) {
	                  return "";
	                }
	              }
	            });
	          }
	          if (extra_columns) {
	            _.each(extra_columns, function (ed) {
	              this_row.push(ed.generator(d, self));
	            });
	          }
	
	          return this_row;
	        };
	
	        if (!skip_clusters) {
	          rows.push(make_row(cluster, false));
	        }
	
	        if (!skip_subclusters) {
	          _.each(cluster.subclusters, function (sub_cluster) {
	            rows.push(make_row(sub_cluster, true));
	          });
	        }
	      });
	
	      add_a_sortable_table(element, headers, rows, true);
	    }
	  };
	
	  /*------------ Update layout code ---------------*/
	  function update_network_string(node_count, edge_count) {
	    if (network_status_string) {
	      var clusters_shown = _.filter(self.clusters, function (c) {
	        return !c.collapsed;
	      }).length,
	          clusters_removed = self.cluster_sizes.length - self.clusters.length,
	          nodes_removed = graph_data.Nodes.length - singletons - self.nodes.length;
	
	      var clusters_selected = _.filter(self.clusters, function (c) {
	        return !c.is_hidden && c.match_filter !== undefined && c.match_filter > 0;
	      }).length;
	
	      var nodes_selected = _.filter(self.nodes, function (n) {
	        return n.match_filter && !n.is_hidden;
	      }).length;
	
	      /*var s = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
	              + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
	              + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
	      if (singletons > 0) {
	          s += "<strong>" +singletons + "</strong> singleton nodes are not shown. ";
	      }*/
	
	      var s = "<span class = 'badge'>" + self.clusters.length + "</span> clusters <span class = 'label label-primary'>" + clusters_shown + " expanded / " + clusters_selected + " match </span> <span class = 'badge'> " + self.nodes.length + "</span> nodes <span class = 'label label-primary'>" + node_count + " shown / " + nodes_selected + " match </span> <span class = 'badge'> " + self.edges.length + "</span> " + (self._is_CDC_ ? "links" : "edges") + " <span class = 'label label-primary'>" + edge_count + " shown</span>";
	
	      d3.select(network_status_string).html(s);
	    }
	  }
	
	  function draw_a_node(container, node) {
	
	    if (node) {
	      container = d3.select(container);
	
	      var symbol_type = node.hxb2_linked && !node.is_lanl ? "cross" : node.is_lanl ? "triangle-down" : self.node_shaper["shaper"](node);
	
	      node.rendered_size = Math.sqrt(node_size(node)) / 2 + 2;
	
	      container.attr("d", misc.symbol(symbol_type).size(node_size(node))).attr("class", "node").classed("selected_object", function (d) {
	        return d.match_filter;
	      }).classed("injected_object", function (d) {
	        return d.node_class == "injected";
	      }).attr("transform", function (d) {
	        return "translate(" + d.x + "," + d.y + ")";
	      }).style("fill", function (d) {
	        return node_color(d);
	      }).style("opacity", function (d) {
	        return node_opacity(d);
	      }).style("display", function (d) {
	        if (d.is_hidden) return "none";
	        return null;
	      }).on("click", handle_node_click).on("mouseover", node_pop_on).on("mouseout", node_pop_off).call(network_layout.drag().on("dragstart", node_pop_off));
	    }
	  }
	
	  function draw_a_cluster(container, the_cluster) {
	    var container_group = d3.select(container);
	
	    var draw_from = the_cluster["binned_attributes"] ? the_cluster["binned_attributes"].map(function (d) {
	      return d.concat([0]);
	    }) : [[null, 1, 0]];
	
	    if (the_cluster.match_filter) {
	      draw_from = draw_from.concat([["selected", the_cluster.match_filter, 1], ["not selected", the_cluster.children.length - the_cluster.match_filter, 1]]);
	    }
	
	    var sums = [d3.sum(draw_from.filter(function (d) {
	      return d[2] == 0;
	    }), function (d) {
	      return d[1];
	    }), d3.sum(draw_from.filter(function (d) {
	      return d[2] != 0;
	    }), function (d) {
	      return d[1];
	    })];
	
	    var running_totals = [0, 0];
	
	    draw_from = draw_from.map(function (d) {
	      var index = d[2];
	      var v = {
	        container: container,
	        cluster: the_cluster,
	        startAngle: running_totals[index] / sums[index] * 2 * Math.PI,
	        endAngle: (running_totals[index] + d[1]) / sums[index] * 2 * Math.PI,
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
	
	    paths.classed("cluster", true).classed("hiv-trace-problematic", function (d) {
	      return the_cluster.hxb2_linked && !d.rim;
	    }).classed("hiv-trace-selected", function (d) {
	      return d.rim;
	    }).attr("d", function (d) {
	      return (d.rim ? d3.svg.arc().innerRadius(arc_radius + 2).outerRadius(arc_radius + 5) : d3.svg.arc().innerRadius(0).outerRadius(arc_radius))(d);
	    }).style("fill", function (d, i) {
	      return d.rim ? self.colorizer["selected"](d.name) : the_cluster["gradient"] ? "url(#" + the_cluster["gradient"] + ")" : cluster_color(the_cluster, d.name);
	    }).style("stroke-linejoin", function (d, i) {
	      return draw_from.length > 1 ? "round" : "";
	    }).style("display", function (d) {
	      if (the_cluster.is_hidden) return "none";
	      return null;
	    });
	  }
	
	  function check_for_predefined_shapes(cat_id) {
	    //console.log (cat_id);
	
	    if (cat_id in _networkPresetShapeSchemes) {
	      var domain = _.range(0, graph_data[_networkGraphAttrbuteID][cat_id]["value_range"].length);
	
	      return {
	        domain: domain,
	        range: _.map(domain, function (v) {
	          return _networkPresetShapeSchemes[cat_id][graph_data[_networkGraphAttrbuteID][cat_id]["value_range"][v]];
	        })
	      };
	    } else {
	      return {
	        domain: _.range(0, graph_data[_networkGraphAttrbuteID][cat_id].dimension),
	        range: _networkShapeOrdering
	      };
	    }
	  }
	
	  self.handle_shape_categorical = function (cat_id) {
	    var set_attr = "None";
	
	    ["shapes"].forEach(function (lbl) {
	      d3.select(self.get_ui_element_selector_by_role(lbl)).selectAll("li").selectAll("a").attr("style", function (d, i) {
	        if (d[1] == cat_id) {
	          set_attr = d[0];
	          return " font-weight: bold;";
	        }
	        return null;
	      });
	      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html("Shape: " + set_attr + ' <span class="caret"></span>');
	    });
	
	    if (cat_id) {
	      var domain_range = check_for_predefined_shapes(cat_id);
	
	      var shape_mapper = d3.scale.ordinal().domain(domain_range["domain"]).range(domain_range["range"]);
	      self.node_shaper["id"] = cat_id;
	      self.node_shaper["shaper"] = function (d) {
	        return shape_mapper(graph_data[_networkGraphAttrbuteID][cat_id]["value_map"](self.attribute_node_value_by_id(d, cat_id)));
	      };
	      self.node_shaper["category_map"] = graph_data[_networkGraphAttrbuteID][cat_id]["value_map"];
	    } else {
	      self.node_shaper.id = null;
	      self.node_shaper.shaper = function () {
	        return "circle";
	      };
	      self.node_shaper["category_map"] = null;
	    }
	    //console.log (graph_data [_networkGraphAttrbuteID][cat_id]['value_map'], self.node_shaper.domain(), self.node_shaper.range());
	    self.draw_attribute_labels();
	    self.update(true);
	    d3.event.preventDefault();
	  };
	
	  self.draw_attribute_labels = function () {
	
	    self.legend_svg.selectAll("g.hiv-trace-legend").remove();
	
	    var offset = 10;
	
	    if (self.legend_caption) {
	      self.legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed("hiv-trace-legend", true).append("text").text(self.legend_caption).style("font-weight", "bold");
	      offset += 18;
	    }
	
	    if (self.edge_legend) {
	      self.legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed("hiv-trace-legend", true).append("text").text(self.edge_legend["caption"]).style("font-weight", "bold");
	      offset += 18;
	
	      _.each(self.edge_legend["types"], function (value, key) {
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text(key);
	
	        value.call(self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("line").attr("x1", "0").attr("y1", "-4").attr("x2", "12").attr("y2", "-4").classed("legend", true));
	
	        offset += 18;
	      });
	    }
	
	    if (self.colorizer["category_id"]) {
	
	      //console.log (self.colorizer);
	      //_.each (self.colorizer["category_map"](null, "map"), function (v){ console.log (v); });
	
	
	      self.legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed("hiv-trace-legend", true).append("text").text("Color: " + self.colorizer["category_id"]).style("font-weight", "bold");
	      offset += 18;
	
	      if (self.colorizer["continuous"]) {
	        var anchor_format = graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]["type"] == "Date" ? _defaultDateViewFormatShort : d3.format(",.4r");
	        var scale = graph_data[_networkGraphAttrbuteID][self.colorizer["category_id"]]["scale"];
	
	        _.each(_.range(_networkContinuousColorStops), function (value) {
	          var x = scale.invert(value);
	          self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text(anchor_format(x));
	          self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", self.colorizer["category"](x));
	
	          offset += 18;
	        });
	
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text("missing");
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", _networkMissingColor);
	
	        offset += 18;
	      } else {
	        _.each(self.colorizer["category_map"](null, "map"), function (value, key) {
	          self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text(key);
	          self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", self.colorizer["category"](key));
	
	          offset += 18;
	        });
	      }
	    }
	
	    if (self.node_shaper["id"]) {
	      self.legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed("hiv-trace-legend", true).append("text").text("Shape: " + self.node_shaper["id"]).style("font-weight", "bold");
	      offset += 18;
	
	      var domain_range = check_for_predefined_shapes(self.node_shaper["id"]);
	      var shape_mapper = d3.scale.ordinal().domain(domain_range["domain"]).range(domain_range["range"]);
	
	      _.each(self.node_shaper["category_map"](null, "map"), function (value, key) {
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text(key);
	
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("path").attr("transform", "translate(5,-5)").attr("d", misc.symbol(shape_mapper(value)).size(128)).classed("legend", true).style("fill", "none");
	
	        offset += 18;
	      });
	    }
	
	    if (self.colorizer["opacity_id"]) {
	      self.legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed("hiv-trace-legend", true).append("text").text("Opacity: " + self.colorizer["opacity_id"]).style("font-weight", "bold");
	      offset += 18;
	
	      var anchor_format = graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]]["type"] == "Date" ? _defaultDateViewFormatShort : d3.format(",.4r");
	      var scale = graph_data[_networkGraphAttrbuteID][self.colorizer["opacity_id"]]["scale"];
	
	      _.each(_.range(_networkContinuousColorStops), function (value) {
	        var x = scale.invert(value);
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text(anchor_format(x));
	        self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", "black").style("opacity", self.colorizer["opacity"](x));
	
	        offset += 18;
	      });
	
	      self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(20," + offset + ")").append("text").text("missing");
	      self.legend_svg.append("g").classed("hiv-trace-legend", true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", "black").style("opacity", _networkMissingOpacity);
	
	      offset += 18;
	    }
	  };
	
	  function compute_cluster_gradient(cluster, cat_id) {
	    if (cat_id) {
	      var id = self.dom_prefix + "-cluster-gradient-" + self.gradient_id++;
	      var gradient = self.network_svg.selectAll("defs").append("radialGradient").attr("id", id);
	      var values = _.map(cluster.children, function (node) {
	        var value = self.attribute_node_value_by_id(node, cat_id);
	        return value == _networkMissing ? Infinity : value;
	      }).sort(function (a, b) {
	        return 0 + a - (0 + b);
	      });
	      var finite = _.filter(values, function (d) {
	        return d < Infinity;
	      });
	      var infinite = values.length - finite.length;
	
	      if (infinite) {
	        gradient.append("stop").attr("offset", "0%").attr("stop-color", _networkMissingColor);
	        gradient.append("stop").attr("offset", "" + infinite / values.length * 100 + "%").attr("stop-color", _networkMissingColor);
	      }
	
	      _.each(finite, function (value, index) {
	        gradient.append("stop").attr("offset", "" + (1 + index + infinite) * 100 / values.length + "%").attr("stop-color", self.colorizer["category"](value));
	      });
	      //gradient.append ("stop").attr ("offset", "100%").attr ("stop-color", self.colorizer['category'] (dom[1]));
	
	      return id;
	    }
	    return null;
	  }
	
	  self.handle_attribute_opacity = function (cat_id) {
	    var set_attr = "None";
	
	    ["opacity"].forEach(function (lbl) {
	      d3.select(self.get_ui_element_selector_by_role(lbl)).selectAll("li").selectAll("a").attr("style", function (d, i) {
	        if (d[1] == cat_id) {
	          set_attr = d[0];
	          return " font-weight: bold;";
	        }
	        return null;
	      });
	      d3.select(self.get_ui_element_selector_by_role(lbl + "_label")).html("Opacity: " + set_attr + ' <span class="caret"></span>');
	    });
	
	    d3.select(self.get_ui_element_selector_by_role("opacity_invert")).style("display", set_attr == "None" ? "none" : "inline").classed("btn-active", false).classed("btn-default", true);
	
	    self.colorizer["opacity_id"] = cat_id;
	    if (cat_id) {
	      var scale = graph_data[_networkGraphAttrbuteID][cat_id]["scale"];
	      self.colorizer["opacity_scale"] = d3.scale.linear().domain([0, _networkContinuousColorStops - 1]).range([0.25, 1]);
	      self.colorizer["opacity"] = function (v) {
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
	
	  self.handle_attribute_continuous = function (cat_id) {
	
	    var set_attr = "None";
	
	    render_chord_diagram("aux_svg_holder", null, null);
	    render_binned_table("attribute_table", null, null);
	
	    self.network_svg.selectAll("radialGradient").remove();
	
	    self.clusters.forEach(function (the_cluster) {
	      delete the_cluster["binned_attributes"];
	      delete the_cluster["gradient"];
	    });
	
	    [["attributes", false], ["attributes_cat", true]].forEach(function (lbl) {
	      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1])).selectAll("li").selectAll("a").attr("style", function (d, i) {
	        if (d[1] == cat_id) {
	          set_attr = d[0];
	          return " font-weight: bold;";
	        }
	        return null;
	      });
	      d3.select(self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])).html("Color: " + set_attr + ' <span class="caret"></span>');
	    });
	
	    d3.select(self.get_ui_element_selector_by_role("attributes_invert")).style("display", set_attr == "None" ? "none" : "inline").classed("btn-active", false).classed("btn-default", true);
	
	    if (cat_id) {
	      //console.log (graph_data [_networkGraphAttrbuteID][cat_id]);
	
	      self.colorizer["category"] = _.wrap(d3.scale.linear().range(["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]).domain(_.range(_networkContinuousColorStops)), function (func, arg) {
	        return func(graph_data[_networkGraphAttrbuteID][cat_id]["scale"](arg));
	      }); //console.log (self.colorizer['category'].exponent ());
	
	      //console.log (self.colorizer['category'] (graph_data [_networkGraphAttrbuteID][cat_id]['value_range'][0]), self.colorizer['category'] (d['value_range'][1]));
	
	      self.colorizer["category_id"] = cat_id;
	      self.colorizer["continuous"] = true;
	      self.clusters.forEach(function (the_cluster) {
	        the_cluster["gradient"] = compute_cluster_gradient(the_cluster, cat_id);
	      });
	
	      var points = [];
	
	      _.each(self.edges, function (e) {
	        var src = self.attribute_node_value_by_id(self.nodes[e.source], cat_id, true),
	            tgt = self.attribute_node_value_by_id(self.nodes[e.target], cat_id, true);
	
	        if (src != _networkMissing && tgt != _networkMissing) {
	          points.push({
	            x: src,
	            y: tgt,
	            title: self.nodes[e.source].id + " (" + src + ") -- " + self.nodes[e.target].id + " (" + tgt + ")"
	          });
	        }
	      });
	      d3.select(self.get_ui_element_selector_by_role("aux_svg_holder_enclosed", true)).style("display", null);
	
	      scatterPlot.scatterPlot(points, 400, 400, self.get_ui_element_selector_by_role("aux_svg_holder", true), {
	        x: "Source",
	        y: "Target"
	      }, graph_data[_networkGraphAttrbuteID][cat_id]["type"] == "Date");
	    } else {
	      self.colorizer["category"] = null;
	      self.colorizer["category_id"] = null;
	      self.colorizer["continuous"] = false;
	      self.colorizer["category_pairwise"] = null;
	      self.colorizer["category_map"] = null;
	    }
	
	    self.draw_attribute_labels();
	    self.update(true);
	    d3.event.preventDefault();
	  };
	
	  self.handle_attribute_categorical = function (cat_id) {
	
	    var set_attr = "None";
	    d3.select(self.get_ui_element_selector_by_role("attributes_invert")).style("display", "none");
	
	    self.network_svg.selectAll("radialGradient").remove();
	
	    [["attributes", false], ["attributes_cat", true]].forEach(function (lbl) {
	
	      d3.select(self.get_ui_element_selector_by_role(lbl[0], lbl[1])).selectAll("li").selectAll("a").attr("style", function (d, i) {
	        if (d[1] == cat_id) {
	          set_attr = d[0];
	          return " font-weight: bold;";
	        }
	        return null;
	      });
	      d3.select(self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])).html("Color: " + set_attr + ' <span class="caret"></span>');
	    });
	
	    self.clusters.forEach(function (the_cluster) {
	      delete the_cluster["gradient"];
	      the_cluster["binned_attributes"] = stratify(attribute_cluster_distribution(the_cluster, cat_id));
	    });
	
	    self.colorizer["continuous"] = false;
	
	    if (cat_id) {
	
	      if (cat_id in _networkPresetColorSchemes) {
	        var domain = [],
	            range = [];
	        _.each(_networkPresetColorSchemes[cat_id], function (value, key) {
	          domain.push(key);
	          range.push(value);
	        });
	        self.colorizer["category"] = d3.scale.ordinal().domain(domain).range(range);
	      } else {
	        if (graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"]) {
	          self.colorizer["category"] = graph_data[_networkGraphAttrbuteID][cat_id]["color_scale"](graph_data[_networkGraphAttrbuteID][cat_id], self);
	        } else {
	          self.colorizer["category"] = d3.scale.ordinal().range(_networkCategorical);
	          var extended_range = _.clone(self.colorizer["category"].range());
	          extended_range.push(_networkMissingColor);
	
	          self.colorizer["category"].domain(_.range(_maximumValuesInCategories + 1));
	          self.colorizer["category"].range(extended_range);
	
	          if (graph_data[_networkGraphAttrbuteID][cat_id]["stable-ish order"]) {
	            self.colorizer["category"] = _.wrap(self.colorizer["category"], function (func, arg) {
	              if (arg == _networkMissing) {
	                return func(_maximumValuesInCategories);
	              }
	              return func(graph_data[_networkGraphAttrbuteID][cat_id]["stable-ish order"][arg]);
	            });
	            //console.log (graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order']);
	          }
	        }
	      }
	      self.colorizer["category_id"] = cat_id;
	      self.colorizer["category_map"] = graph_data[_networkGraphAttrbuteID][cat_id]["value_map"];
	
	      //console.log (cat_id, self.json[_networkGraphAttrbuteID][cat_id], graph_data[_networkGraphAttrbuteID][cat_id]["value_map"] (null, "lookup"));
	      //self.colorizer['category_map'][null] =  graph_data [_networkGraphAttrbuteID][cat_id]['range'];
	
	      //try {
	      self.colorizer["category_pairwise"] = attribute_pairwise_distribution(cat_id, graph_data[_networkGraphAttrbuteID][cat_id].dimension, self.colorizer["category_map"]);
	      //} catch (err) {
	      // TODO: there are still lingering issues with this "category_map"
	      //}
	
	      render_chord_diagram("aux_svg_holder", self.colorizer["category_map"], self.colorizer["category_pairwise"]);
	      render_binned_table("attribute_table", self.colorizer["category_map"], self.colorizer["category_pairwise"]);
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
	    d3.event.preventDefault();
	  };
	
	  self.filter_visibility = function () {
	    self.clusters.forEach(function (c) {
	      c.is_hidden = self.hide_unselected && !c.match_filter;
	    });
	    self.nodes.forEach(function (n) {
	      n.is_hidden = self.hide_unselected && !n.match_filter;
	    });
	  };
	
	  self.filter = function (conditions, skip_update) {
	    var anything_changed = false;
	
	    conditions = _.map(["re", "distance"], function (cnd) {
	      return _.map(_.filter(conditions, function (v) {
	        return v.type == cnd;
	      }), function (v) {
	        return v.value;
	      });
	    });
	
	    if (conditions[1].length) {
	      self.nodes.forEach(function (n) {
	        n.length_filter = false;
	      });
	
	      _.each(self.edges, function (e) {
	        var did_match = _.some(conditions[1], function (d) {
	          return e.length <= d;
	        });
	
	        if (did_match) {
	          self.nodes[e.source].length_filter = true;
	          self.nodes[e.target].length_filter = true;
	        }
	      });
	    } else {
	      self.nodes.forEach(function (n) {
	        n.length_filter = false;
	      });
	    }
	
	    self.clusters.forEach(function (c) {
	      c.match_filter = 0;
	    });
	
	    self.nodes.forEach(function (n) {
	      var did_match = _.some(conditions[0], function (regexp) {
	        return regexp.test(n.id) || _.some(n[_networkNodeAttributeID], function (attr) {
	          return regexp.test(attr);
	        });
	      });
	
	      did_match = did_match || n.length_filter;
	
	      if (did_match != n.match_filter) {
	        n.match_filter = did_match;
	        anything_changed = true;
	      }
	
	      if (n.match_filter) {
	        n.parent.match_filter += 1;
	      }
	    });
	
	    if (anything_changed && !skip_update) {
	      if (self.hide_unselected) {
	        self.filter_visibility();
	      }
	
	      self.update(true);
	    }
	  };
	
	  self.is_empty = function () {
	    return self.cluster_sizes.length == 0;
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
	        warning_string = "";
	      } else {
	        d3.select(network_warning_tag).style("display", "none");
	      }
	    }
	  };
	
	  self.link_generator_function = function (d) {
	
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
	
	      path = "M" + d.source.x + " " + d.source.y + " C " + (d.source.x + s1[0]) + " " + (d.source.y + s1[1]) + ", " + (d.target.x + s2[0]) + " " + (d.target.y + s2[1]) + ", " + d.target.x + " " + d.target.y;
	    } else {
	      path = "M" + d.source.x + " " + d.source.y + " L " + d.target.x + " " + d.target.y;
	    }
	
	    d3.select(this).attr("d", path);
	  };
	
	  self.update = function (soft, friction) {
	    self.needs_an_update = false;
	
	    if (friction) {
	      network_layout.friction(friction);
	    }
	    self.display_warning(warning_string);
	
	    var rendered_nodes, rendered_clusters, link;
	
	    if (!soft) {
	      var draw_me = prepare_data_to_graph();
	
	      network_layout.nodes(draw_me.all).links(draw_me.edges);
	      update_network_string(draw_me.nodes.length, draw_me.edges.length);
	
	      var edge_set = {};
	
	      _.each(draw_me.edges, function (d) {
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
	
	      _.each(edge_set, function (v) {
	        if (v.length > 1) {
	          var step = 1 / (v.length - 1);
	          _.each(v, function (edge, index) {
	            edge.pull = -0.5 + index * step;
	          });
	        }
	      });
	
	      link = self.network_svg.selectAll(".link").data(draw_me.edges, function (d) {
	        return d.id;
	      });
	
	      //link.enter().append("line").classed("link", true);
	      link.enter().append("path").classed("link", true);
	      link.exit().remove();
	
	      link.classed("removed", function (d) {
	        return d.removed;
	      }).classed("unsupported", function (d) {
	        return "support" in d && d["support"] > 0.05;
	      }).classed("core-link", function (d) {
	        //console.log (d["length"] <= self.core_link_length);
	        return d["length"] <= self.core_link_length;
	        //return false;
	      });
	
	      link.on("mouseover", edge_pop_on).on("mouseout", edge_pop_off).filter(function (d) {
	        return d.directed;
	      }).attr("marker-end", "url(#" + self.dom_prefix + "_arrowhead)");
	
	      rendered_nodes = self.network_svg.selectAll(".node").data(draw_me.nodes, function (d) {
	        return d.id;
	      });
	
	      rendered_nodes.exit().remove();
	      rendered_nodes.enter().append("path");
	
	      rendered_clusters = self.network_svg.selectAll(".cluster-group").data(draw_me.clusters.map(function (d) {
	        return d;
	      }), function (d) {
	        return d.cluster_id;
	      });
	
	      rendered_clusters.exit().remove();
	      rendered_clusters.enter().append("g").attr("class", "cluster-group").attr("transform", function (d) {
	        return "translate(" + d.x + "," + d.y + ")";
	      }).on("click", handle_cluster_click).on("mouseover", cluster_pop_on).on("mouseout", cluster_pop_off).call(network_layout.drag().on("dragstart", cluster_pop_off));
	
	      self.draw_cluster_table(self.extra_cluster_table_columns, self.cluster_table, false, self.subcluster_table);
	
	      if (self._is_CDC_ && !(options && options["no-subclusters"])) {
	        self.annotate_priority_clusters(_networkCDCDateField, 36, 12);
	      }
	
	      if (self.subcluster_table) {
	        self.draw_cluster_table(self.extra_subcluster_table_columns, self.subcluster_table, true, false);
	      }
	      self.draw_node_table(self.extra_node_table_columns);
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
	
	    link.style("opacity", function (d) {
	      return Math.max(node_opacity(d.target), node_opacity(d.source));
	    });
	
	    if (self.additional_edge_styler) {
	      link.each(function (d) {
	        self.additional_edge_styler(this, d, self);
	      });
	    }
	
	    link.style("display", function (d) {
	
	      if (d.target.is_hidden || d.source.is_hidden || d.is_hidden) {
	        return "none";
	      }
	      return null;
	    });
	
	    if (!soft) {
	      currently_displayed_objects = rendered_clusters[0].length + rendered_nodes[0].length;
	
	      network_layout.on("tick", function () {
	        var sizes = network_layout.size();
	
	        rendered_nodes.attr("transform", function (d) {
	
	          return "translate(" + (d.x = Math.max(d.rendered_size, Math.min(sizes[0] - d.rendered_size, d.x))) + "," + (d.y = Math.max(d.rendered_size, Math.min(sizes[1] - d.rendered_size, d.y))) + ")";
	        });
	        rendered_clusters.attr("transform", function (d) {
	          return "translate(" + (d.x = Math.max(d.rendered_size, Math.min(sizes[0] - d.rendered_size, d.x))) + "," + (d.y = Math.max(d.rendered_size, Math.min(sizes[1] - d.rendered_size, d.y))) + ")";
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
	
	    node.attr("cx", function (d) {
	      return d.x = Math.max(10, Math.min(sizes[0] - 10, d.x));
	    }).attr("cy", function (d) {
	      return d.y = Math.max(10, Math.min(sizes[1] - 10, d.y));
	    });
	
	    link.attr("x1", function (d) {
	      return d.source.x;
	    }).attr("y1", function (d) {
	      return d.source.y;
	    }).attr("x2", function (d) {
	      return d.target.x;
	    }).attr("y2", function (d) {
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
	
	  self.attribute_node_value_by_id = function (d, id, number) {
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
	
	  self.inject_attribute_description = function (key, d) {
	    if (_networkGraphAttrbuteID in self.json) {
	      var new_attr = {};
	      new_attr[key] = d;
	      _.extend(self.json[_networkGraphAttrbuteID], new_attr);
	      //self.json[_networkGraphAttrbuteID][key] = _.clone (d);
	    }
	  };
	  function node_size(d) {
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
	      return self.colorizer["opacity"](self.attribute_node_value_by_id(d, self.colorizer["opacity_id"], true));
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
	      str = "Degree <em>" + n.degree + "</em><br>Clustering coefficient <em> " + misc.format_value(n.lcc, _defaultFloatFormat) + "</em>";
	    } else {
	      str = "# links <em>" + n.degree + "</em>";
	    }
	
	    _.each(_.union(self._additional_node_pop_fields, [self.colorizer["category_id"], self.node_shaper["id"], self.colorizer["opacity_id"]]), function (key) {
	      if (key) {
	        if (key in graph_data[_networkGraphAttrbuteID]) {
	          var attribute = self.attribute_node_value_by_id(n, key);
	
	          if (graph_data[_networkGraphAttrbuteID][key]["type"] == "Date") {
	            try {
	              attribute = _defaultDateViewFormat(attribute);
	            } catch (err) {}
	          }
	          if (attribute) {
	            str += "<br>" + key + " <em>" + attribute + "</em>";
	          }
	        }
	      }
	    });
	
	    return str;
	  }
	
	  function edge_info_string(n) {
	    var str = "Length <em>" + _defaultFloatFormat(n.length) + "</em>";
	    if ("support" in n) {
	      str += "<br>Worst triangle-based support (p): <em>" + _defaultFloatFormat(n.support) + "</em>";
	    }
	
	    var attribute = self.attribute_node_value_by_id(n, self.colorizer["category_id"]);
	
	    return str;
	  }
	
	  function node_pop_on(d) {
	    toggle_tooltip(this, true, (self._is_CDC_ ? "Individual " : "Node ") + d.id, node_info_string(d), self.container);
	  }
	
	  function node_pop_off(d) {
	    toggle_tooltip(this, false);
	  }
	
	  function edge_pop_on(e) {
	    toggle_tooltip(this, true, e.source.id + " - " + e.target.id, edge_info_string(e), self.container);
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
	        cls.children.forEach(function (x) {
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
	      x.children.forEach(function (n) {
	        n.x = x.x + (Math.random() - 0.5) * x.children.length;
	        n.y = x.y + (Math.random() - 0.5) * x.children.length;
	      });
	    } else {
	      x.children.forEach(function (n) {
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
	
	    d3.select(self.get_ui_element_selector_by_role(id + "_enclosed", true)).style("display", matrix ? null : "none");
	
	    if (matrix) {
	      var fill = self.colorizer["category"];
	      var lookup = the_map(null, "lookup");
	
	      var headers = the_table.append("thead").append("tr").selectAll("th").data([""].concat(matrix[0].map(function (d, i) {
	        return lookup[i];
	      })));
	
	      headers.enter().append("th");
	      headers.html(function (d) {
	        return "<span>&nbsp;" + d + "</span>";
	      }).each(function (d, i) {
	        if (i) {
	          d3.select(this).insert("i", ":first-child").classed("fa fa-circle", true).style("color", function () {
	            return fill(d);
	          });
	        }
	      });
	
	      if (self.show_percent_in_pairwise_table) {
	        var sum = _.map(matrix, function (row) {
	          return _.reduce(row, function (p, c) {
	            return p + c;
	          }, 0);
	        });
	
	        matrix = _.map(matrix, function (row, row_index) {
	          return _.map(row, function (c) {
	            return c / sum[row_index];
	          });
	        });
	      }
	
	      var rows = the_table.append("tbody").selectAll("tr").data(matrix.map(function (d, i) {
	        return [lookup[i]].concat(d);
	      }));
	
	      rows.enter().append("tr");
	      rows.selectAll("td").data(function (d) {
	        return d;
	      }).enter().append("td").html(function (d, i) {
	        return i == 0 ? "<span>&nbsp;" + d + "</span>" : self.show_percent_in_pairwise_table ? _defaultPercentFormat(d) : d;
	      }).each(function (d, i) {
	        if (i == 0) {
	          d3.select(this).insert("i", ":first-child").classed("fa fa-circle", true).style("color", function () {
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
	
	    d3.select(self.get_ui_element_selector_by_role(id + "_enclosed", true)).style("display", matrix ? null : "none");
	
	    if (matrix) {
	
	      // Returns an event handler for fading a given chord group.
	      var fade = function fade(opacity, t) {
	        return function (g, i) {
	          text_label.text(t ? lookup[i] : "");
	          svg.selectAll(".chord path").filter(function (d) {
	            return d.source.index != i && d.target.index != i;
	          }).transition().style("opacity", opacity);
	        };
	      };
	
	      var lookup = the_map(null, "lookup");
	
	      var svg = container.append("svg");
	
	      var chord = d3.layout.chord().padding(0.05).sortSubgroups(d3.descending).matrix(matrix);
	
	      var text_offset = 20,
	          width = 450,
	          height = 450,
	          innerRadius = Math.min(width, height - text_offset) * 0.41,
	          outerRadius = innerRadius * 1.1;
	
	      var fill = self.colorizer["category"],
	          font_size = 12;
	
	      var text_label = svg.append("g").attr("transform", "translate(" + width / 2 + "," + (height - text_offset) + ")").append("text").attr("text-anchor", "middle").attr("font-size", font_size).text("");
	
	      svg = svg.attr("width", width).attr("height", height - text_offset).append("g").attr("transform", "translate(" + width / 2 + "," + (height - text_offset) / 2 + ")");
	
	      svg.append("g").selectAll("path").data(chord.groups).enter().append("path").style("fill", function (d) {
	        return fill(lookup[d.index]);
	      }).style("stroke", function (d) {
	        return fill(lookup[d.index]);
	      }).attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius)).on("mouseover", fade(0.1, true)).on("mouseout", fade(1, false));
	
	      svg.append("g").attr("class", "chord").selectAll("path").data(chord.chords).enter().append("path").attr("d", d3.svg.chord().radius(innerRadius)).style("fill", function (d) {
	        return fill(d.target.index);
	      }).style("opacity", 1);
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
	
	    _.each(scan_from, function (edge) {
	      //console.log (self.attribute_node_value_by_id(self.nodes[edge.source], id), self.attribute_node_value_by_id(self.nodes[edge.target], id));
	      the_matrix[the_map(self.attribute_node_value_by_id(self.nodes[edge.source], id))][the_map(self.attribute_node_value_by_id(self.nodes[edge.target], id))] += 1;
	    });
	    // check if there are null values
	
	
	    var haz_null = the_matrix.some(function (d, i) {
	      if (i == dim - 1) {
	        return d.some(function (d2) {
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
	
	  self._aux_populate_category_fields = function (d, k) {
	    d["raw_attribute_key"] = k;
	    d.discrete = false;
	    if (d["type"] == "String") {
	      d.discrete = true;
	      d["value_range"] = _.keys(_.countBy(graph_data.Nodes, function (nd) {
	        return self.attribute_node_value_by_id(nd, k);
	      }));
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
	
	  self._aux_process_category_values = function (d) {
	    var values;
	    if (d["no-sort"]) {
	      values = d["value_range"];
	    } else {
	      if (d["type"] == "String") {
	        values = d["value_range"].sort();
	
	        if (d.dimension <= _maximumValuesInCategories) {
	          var string_hash = function string_hash(str) {
	            var hash = 5801;
	            for (var ci = 0; ci < str.length; ci++) {
	              var charCode = str.charCodeAt(ci);
	              hash = (hash << 5 + hash) + charCode;
	            }
	            return hash;
	          };
	
	          var hashed = _.map(values, string_hash);
	          var available_keys = {};
	          var reindexed = {};
	
	          for (var i = 0; i < _maximumValuesInCategories; i++) {
	            available_keys[i] = true;
	          }
	
	          _.each(hashed, function (value, index) {
	            if (value < 0) {
	              value = -value;
	            }
	
	            var first_try = value % _maximumValuesInCategories;
	            if (first_try in available_keys) {
	              reindexed[values[index]] = first_try;
	              delete available_keys[first_try];
	              return;
	            }
	
	            var second_try = Math.floor(value / _maximumValuesInCategories) % _maximumValuesInCategories;
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
	
	    _.each(values, function (d2, i) {
	      map[d2] = i;
	    });
	
	    d["value_map"] = function (v, key) {
	      return key ? key == "lookup" ? _.invert(map) : map : map[v];
	    };
	    return d;
	  };
	
	  function attribute_cluster_distribution(the_cluster, attribute_id) {
	    if (attribute_id && the_cluster) {
	      return the_cluster.children.map(function (d) {
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
	      str = "<strong>" + self.cluster_sizes[id - 1] + "</strong> individuals." + "<br>Mean links/individual <em> = " + _defaultFloatFormat(the_cluster.degrees["mean"]) + "</em>" + "<br>Max links/individual <em> = " + the_cluster.degrees["max"] + "</em>";
	    } else {
	      str = "<strong>" + self.cluster_sizes[id - 1] + "</strong> nodes." + "<br>Mean degree <em>" + _defaultFloatFormat(the_cluster.degrees["mean"]) + "</em>" + "<br>Max degree <em>" + the_cluster.degrees["max"] + "</em>" + "<br>Clustering coefficient <em> " + misc.format_value(the_cluster.cc, _defaultFloatFormat) + "</em>";
	    }
	
	    if (attr_info) {
	      attr_info.forEach(function (d) {
	        str += "<br>" + d[0] + " <em>" + d[1] + "</em>";
	      });
	    }
	
	    return str;
	  }
	
	  function cluster_pop_on(d) {
	    toggle_tooltip(this, true, "Cluster " + d.cluster_id, cluster_info_string(d.cluster_id), self.container);
	  }
	
	  function cluster_pop_off(d) {
	    toggle_tooltip(this, false);
	  }
	
	  self.expand_cluster_handler = function (d, do_update, move_out) {
	    if (d.collapsed) {
	      var new_nodes = self.cluster_sizes[d.cluster_id - 1] - 1;
	
	      if (new_nodes > max_points_to_render) {
	        warning_string = "This cluster is too large to be displayed";
	      } else {
	        var leftover = new_nodes + currently_displayed_objects - max_points_to_render;
	        if (leftover > 0) {
	          var k = 0;
	          for (; k < open_cluster_queue.length && leftover > 0; k++) {
	            var cluster = self.clusters[self.cluster_mapping[open_cluster_queue[k]]];
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
	    _.each(_extract_single_cluster(self.clusters[self.cluster_mapping[d.cluster]].children, null, true).Edges, function (e) {
	      _.each(e.sequences, function (s) {
	        if (!(s in sequences)) {
	          sequences[s] = 1;
	        }
	      });
	    });
	    //console.log (_.keys(sequences));
	  }
	
	  function _compute_cluster_degrees(d) {
	    var degrees = d.children.map(function (c) {
	      return c.degree;
	    });
	    degrees.sort(d3.ascending);
	    d.degrees = helpers.describe_vector(degrees);
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
	
	  self.extract_network_time_series = function (time_attr, other_attributes, node_filter) {
	    var use_these_nodes = node_filter ? _.filter(self.nodes, node_filter) : self.nodes;
	
	    var result = _.map(use_these_nodes, function (node) {
	      var series = {
	        "time": self.attribute_node_value_by_id(node, time_attr)
	      };
	      if (other_attributes) {
	        _.each(other_attributes, function (attr, key) {
	          series[attr] = self.attribute_node_value_by_id(node, key);
	        });
	      }
	      return series;
	    });
	
	    result.sort(function (a, b) {
	      if (a.time < b.time) return -1;
	      if (a.time == b.time) return 0;
	      return 1;
	    });
	
	    return result;
	  };
	
	  self.expand_some_clusters = function (subset) {
	    subset = subset || self.clusters;
	    subset.forEach(function (x) {
	      if (!x.is_hidden) {
	        self.expand_cluster_handler(x, false);
	      }
	    });
	    self.update();
	  };
	
	  self.select_some_clusters = function (condition) {
	    return self.clusters.filter(function (c, i) {
	      return _.some(c.children, function (n) {
	        return condition(n);
	      });
	    });
	  };
	
	  self.collapse_some_clusters = function (subset) {
	    subset = subset || self.clusters;
	    subset.forEach(function (x) {
	      if (!x.collapsed) collapse_cluster(x);
	    });
	    self.update();
	  };
	
	  self.toggle_hxb2 = function () {
	    self.hide_hxb2 = !self.hide_hxb2;
	    self.update();
	  };
	
	  function stratify(array) {
	    if (array) {
	      var dict = {},
	          stratified = [];
	
	      array.forEach(function (d) {
	        if (d in dict) {
	          dict[d] += 1;
	        } else {
	          dict[d] = 1;
	        }
	      });
	      for (var uv in dict) {
	        stratified.push([uv, dict[uv]]);
	      }
	      return stratified.sort(function (a, b) {
	        return a[0] - b[0];
	      });
	    }
	    return array;
	  }
	
	  /*------------ Node injection (social network) ---------------*/
	
	  self.load_nodes_edges = function (nodes_and_attributes, index_id, edges_and_attributes, annotation) {
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
	      if (nodes_and_attributes && nodes_and_attributes.length) {
	
	        var injected_nodes = {};
	        var node_attributes = {};
	
	        if (!(index_id in nodes_and_attributes[0])) {
	          throw index_id + " is not one of the attributes in the imported node records";
	        }
	
	        _.each(nodes_and_attributes[0], function (r, i) {
	          if (i != index_id) {
	            var attribute_definition = {
	              label: i,
	              type: "String",
	              annotation: annotation
	            };
	            self.inject_attribute_description(i, attribute_definition);
	          }
	        });
	
	        var existing_network_nodes = {},
	            node_name_2_id = {};
	
	        _.each(self.json.Nodes, function (n, i) {
	          existing_network_nodes[n.id] = n;
	          node_name_2_id[n.id] = i;
	        });
	
	        _.each(nodes_and_attributes, function (n) {
	          function handle_node_attributes(target) {
	            _.each(n, function (attribute_value, attribute_key) {
	              if (attribute_key != index_id) {
	                inject_attribute_node_value_by_id(target, attribute_key, attribute_value);
	              }
	            });
	          }
	
	          if (n[index_id] in existing_network_nodes) {
	            handle_node_attributes(existing_network_nodes[n[index_id]]);
	            existing_nodes++;
	          } else {
	            var new_node = { _networkNodeAttributeID: {}, node_class: "injected", node_annotation: annotation, attributes: [], degree: 0 };
	            new_node.id = n[index_id];
	            handle_node_attributes(new_node);
	            node_name_2_id[new_node.id] = self.json.Nodes.length;
	            self.json.Nodes.push(new_node);
	            new_nodes.push(new_node);
	          }
	        });
	
	        _.each(edges_and_attributes, function (e) {
	          try {
	            if ("Index" in e && "Partner" in e && "Contact" in e) {
	              if (!e["Index"] in node_name_2_id) {
	                throw "Invalid index node";
	              }
	              if (!e["Partner"] in node_name_2_id) {
	                throw "Invalid partner node";
	              }
	
	              edge_types_dict[e["Contact"]] = (edge_types_dict[e["Contact"]] ? edge_types_dict[e["Contact"]] : 0) + 1;
	
	              var new_edge = { 'source': node_name_2_id[e["Index"]],
	                'target': node_name_2_id[e["Partner"]],
	                'edge_type': e["Contact"],
	                'length': 0.005,
	                'directed': true };
	
	              self.json.Edges.push(new_edge);
	            } else {
	              throw "Missing required attribute";
	            }
	          } catch (err) {
	            throw "Invalid edge specification ( " + err + ") " + JSON.stringify(e);
	          }
	        });
	
	        self._aux_populate_category_menus();
	        self.update_clusters_with_injected_nodes(null, null, annotation);
	        self.draw_node_table(self.extra_node_table_columns, self.json.Nodes);
	        if (!self.extra_cluster_table_columns) {
	          self.extra_cluster_table_columns = [];
	        }
	        if (!self.extra_subcluster_table_columns) {
	          self.extra_subcluster_table_columns = [];
	        }
	
	        var edge_types_by_cluster = {};
	        _.each(self.json.Edges, function (e) {
	          var edge_clusters = _.union(_.keys(self.json.Nodes[e.source].extended_cluster), _.keys(self.json.Nodes[e.target].extended_cluster));
	          _.each(edge_clusters, function (c) {
	            if (!(c in edge_types_by_cluster)) {
	              edge_types_by_cluster[c] = {};
	            }
	            if (e.edge_type) {
	              edge_types_by_cluster[c][e.edge_type] = 1;
	            }
	          });
	        });
	
	        var edge_types_by_cluster_sorted = {};
	        _.each(edge_types_by_cluster, function (v, c) {
	          var my_keys = _.keys(v);
	          my_keys.sort();
	          edge_types_by_cluster_sorted[c] = my_keys;
	        });
	
	        var edge_types = _.keys(edge_types_dict);
	        edge_types.sort();
	        var _edge_colorizer = d3.scale.ordinal().range(_networkCategoricalBase).domain(edge_types);
	
	        var injected_column = [{ 'description': {
	            value: annotation + " network",
	            sort: function sort(c) {
	              return c.value[0];
	            },
	            help: "Nodes added and clusters merged through " + annotation
	          },
	          'generator': function generator(cluster) {
	
	            return {
	              value: [cluster.injected[annotation], cluster.linked_clusters, cluster.cluster_id],
	
	              callback: function callback(element, payload) {
	
	                var this_cell = d3.select(element);
	                this_cell.text(+payload[0] + " " + annotation + " nodes. ");
	                var other_clusters = [];
	                if (payload[1]) {
	                  other_clusters = _.without(_.keys(payload[1]), payload[2]);
	                  if (other_clusters.length) {
	                    other_clusters.sort();
	                    this_cell.append("span").classed("label label-info", true).text("Bridges to " + other_clusters.length + " clusters").attr("title", other_clusters.join(", "));
	                  }
	                }
	
	                var labeled_links = _.clone(edge_types_by_cluster_sorted[payload[2]]);
	
	                if (payload[0] > 0 || other_clusters.length || edge_types_by_cluster_sorted[payload[2]] && labeled_links.length) {
	
	                  labeled_links.push("");
	
	                  var shown_types = {};
	                  _.each(labeled_links, function (t) {
	                    shown_types[t] = 1;
	                  });
	
	                  this_cell.append("button").classed("btn btn-primary btn-xs pull-right", true).text("View " + annotation).on("click", function (e) {
	                    self.open_exclusive_tab_view(payload[2], function (n) {
	                      return n.extended_cluster && payload[2] in n.extended_cluster;
	                    }, function (id) {
	                      return "Cluster " + id + " with " + annotation;
	                    }, {
	                      "edge-styler": function edgeStyler(element, d, network) {
	                        if (_.has(d, "edge_type")) {
	                          d3.select(element).style("stroke", network._edge_colorizer(d["edge_type"]));
	                          d.is_hidden = !network.shown_types[d["edge_type"]];
	                        } else {
	                          d.is_hidden = !network.shown_types[""];
	                        }
	                      },
	
	                      "init_code": function init_code(network) {
	                        function style_edge(type) {
	
	                          this.style("stroke-width", "5px");
	                          if (type.length) {
	                            this.style("stroke", network._edge_colorizer(type));
	                          } else {
	                            this.classed("link", true);
	                            var def_color = this.style("stroke");
	                            this.classed("link", null);
	                            this.style("stroke", def_color);
	                          }
	                        };
	                        network._edge_colorizer = _edge_colorizer;
	                        network.shown_types = _.clone(shown_types);
	                        network.edge_legend = { "caption": "Network links",
	                          "types": {} };
	
	                        _.each(network.shown_types, function (ignore, t) {
	                          if (t.length) {
	                            network.edge_legend.types[t] = _.partial(style_edge, t);
	                          } else {
	                            network.edge_legend.types["Molecular links"] = _.partial(style_edge, t);
	                          }
	                        });
	                      },
	
	                      "extra_menu": {
	                        "title": "Additional options",
	                        "items": _.map(labeled_links, function (edge_class) {
	                          return [function (network, element) {
	                            function toggle_element() {
	                              network.shown_types[edge_class] = !network.shown_types[edge_class];
	                              checkbox.attr("checked", network.shown_types[edge_class] ? "" : null);
	                              network.update(true);
	                            }
	
	                            var link;
	
	                            if (edge_class.length) {
	                              link = element.append("a").text(edge_class + " links").style("color", network._edge_colorizer(edge_class)).on("click", toggle_element);
	                            } else {
	                              link = element.append("a").text("Molecular links").on("click", toggle_element);
	                            }
	                            var checkbox = link.append("input").attr("type", "checkbox").attr("checked", "");
	                          }];
	                        })
	                      }
	                    });
	                  });
	                }
	              }
	            };
	          }
	        }];
	
	        self.extra_cluster_table_columns = self.extra_cluster_table_columns.concat(injected_column);
	        self.draw_cluster_table(self.extra_cluster_table_columns, self.cluster_table, false, self.subcluster_table);
	      }
	    } catch (e) {
	      throw e;
	    }
	
	    return { 'nodes': new_nodes, 'existing_nodes': existing_nodes, 'edges': edge_types_dict };
	  };
	
	  self.update_clusters_with_injected_nodes = function (node_filter, edge_filter, annotation) {
	
	    var cluster_report = {};
	
	    try {
	
	      node_filter = node_filter || function () {
	        return true;
	      };
	      edge_filter = edge_filter || function () {
	        return true;
	      };
	
	      var split_clusters = {};
	      var node_id_to_local_cluster = {};
	
	      var recomputed_clusters = hivtrace_cluster_depthwise_traversal(_.filter(self.json.Nodes, node_filter), self.json.Edges, null, false);
	
	      _.each(recomputed_clusters, function (c) {
	        var cluster_ids = {};
	        var injected_count = 0;
	
	        _.each(c, function (n) {
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
	
	        _.each(c, function (n) {
	          if ('extended_cluster' in n) {
	            _.extend(n['extended_cluster'], cluster_ids);
	          } else {
	            n['extended_cluster'] = cluster_ids;
	          }
	        });
	
	        _.each(cluster_ids, function (c, k) {
	          //console.log (k);
	          var existing_cluster = self.clusters[k - 1];
	          if (!existing_cluster.injected) {
	            existing_cluster.injected = {};
	          }
	          existing_cluster.injected[annotation] = injected_count;
	          if ('linked_clusters' in existing_cluster) {
	            _.extend(existing_cluster['linked_clusters'], cluster_ids);
	          } else {
	            existing_cluster['linked_clusters'] = cluster_ids;
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
	
	    if (turn_on && !element.tooltip) {
	      // check to see if there are any other tooltips shown
	      $("[role='tooltip']").each(function (d) {
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
	
	  var l_scale = 5000,
	
	  // link scale
	  graph_data = self.json,
	
	  // the raw JSON network object
	  max_points_to_render = 2048,
	      warning_string = "",
	      singletons = 0,
	      open_cluster_queue = [],
	      currently_displayed_objects,
	      gravity_scale = d3.scale.pow().exponent(0.5).domain([1, 100000]).range([0.1, 0.15]);
	
	  /*------------ D3 globals and SVG elements ---------------*/
	
	  var network_layout = d3.layout.force().on("tick", tick).charge(function (d) {
	    if (d.cluster_id) return self.charge_correction * (-20 - 5 * Math.pow(d.children.length, 0.7));
	    return self.charge_correction * (-5 - 20 * Math.sqrt(d.degree));
	  }).linkDistance(function (d) {
	    return Math.max(d.length, 0.005) * l_scale;
	  }).linkStrength(function (d) {
	    if (d.support !== undefined) {
	      return 2 * (0.5 - d.support);
	    }
	    return 1;
	  }).chargeDistance(l_scale * 0.25).gravity(gravity_scale(json.Nodes.length)).friction(0.25);
	
	  d3.select(self.container).selectAll(".my_progress").style("display", "none");
	  d3.select(self.container).selectAll("svg").remove();
	  self.node_table.selectAll("*").remove();
	  self.cluster_table.selectAll("*").remove();
	
	  self.network_svg = d3.select(self.container).append("svg:svg")
	  //.style ("border", "solid black 1px")
	  .attr("id", self.dom_prefix + "-network-svg").attr("width", self.width + self.margin.left + self.margin.right).attr("height", self.height + self.margin.top + self.margin.bottom);
	
	  self.network_cluster_dynamics = null;
	
	  //.append("g")
	  // .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
	
	  self.legend_svg = self.network_svg.append("g").attr("transform", "translate(5,5)");
	
	  self.network_svg.append("defs").append("marker").attr("id", self.dom_prefix + "_arrowhead").attr("refX", 9) /* there must be a smarter way to calculate shift*/
	  .attr("refY", 2).attr("markerWidth", 6).attr("markerHeight", 4).attr("orient", "auto").attr("stroke", "#666666").attr("fill", "#AAAAAA").append("path").attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead
	
	  change_window_size();
	
	  initial_json_load();
	
	  d3.select(self.container).selectAll(".my_progress").style("display", "none");
	
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
	
	    self.draw_attribute_labels();
	    network_layout.start();
	
	    if (_.isArray(options["expand"])) {
	      self.expand_some_clusters(_.filter(self.clusters, function (c) {
	        return options["expand"].indexOf(c.cluster_id) >= 0;
	      }));
	    }
	  }
	  return self;
	};
	
	var hivtrace_cluster_graph_summary = function hivtrace_cluster_graph_summary(graph, tag) {
	  var summary_table = d3.select(tag);
	
	  summary_table = d3.select(tag).select("tbody");
	  if (summary_table.empty()) {
	    summary_table = d3.select(tag).append("tbody");
	  }
	
	  var table_data = [];
	
	  if (!summary_table.empty()) {
	    _.each(graph["Network Summary"], function (value, key) {
	      if (self._is_CDC_ && key == "Edges") {
	        key = "Links";
	      }
	      if (_.isNumber(value)) {
	        table_data.push([key, value]);
	      }
	    });
	  }
	
	  var degrees = [];
	  _.each(graph["Degrees"]["Distribution"], function (value, index) {
	    for (var k = 0; k < value; k++) {
	      degrees.push(index + 1);
	    }
	  });
	  degrees = helpers.describe_vector(degrees);
	  table_data.push(["Links/node", ""]);
	  table_data.push(["&nbsp;&nbsp;<i>Mean</i>", _defaultFloatFormat(degrees["mean"])]);
	  table_data.push(["&nbsp;&nbsp;<i>Median</i>", _defaultFloatFormat(degrees["median"])]);
	  table_data.push(["&nbsp;&nbsp;<i>Range</i>", degrees["min"] + " - " + degrees["max"]]);
	  table_data.push(["&nbsp;&nbsp;<i>Interquartile range</i>", degrees["Q1"] + " - " + degrees["Q3"]]);
	
	  degrees = helpers.describe_vector(graph["Cluster sizes"]);
	  table_data.push(["Cluster sizes", ""]);
	  table_data.push(["&nbsp;&nbsp;<i>Mean</i>", _defaultFloatFormat(degrees["mean"])]);
	  table_data.push(["&nbsp;&nbsp;<i>Median</i>", _defaultFloatFormat(degrees["median"])]);
	  table_data.push(["&nbsp;&nbsp;<i>Range</i>", degrees["min"] + " - " + degrees["max"]]);
	  table_data.push(["&nbsp;&nbsp;<i>Interquartile range</i>", degrees["Q1"] + " - " + degrees["Q3"]]);
	
	  if (self._is_CDC_) {
	    degrees = helpers.describe_vector(_.map(graph["Edges"], function (e) {
	      return e.length;
	    }));
	    table_data.push(["Genetic distances (links only)", ""]);
	    table_data.push(["&nbsp;&nbsp;<i>Mean</i>", _defaultPercentFormat(degrees["mean"])]);
	    table_data.push(["&nbsp;&nbsp;<i>Median</i>", _defaultPercentFormat(degrees["median"])]);
	    table_data.push(["&nbsp;&nbsp;<i>Range</i>", _defaultPercentFormat(degrees["min"]) + " - " + _defaultPercentFormat(degrees["max"])]);
	    table_data.push(["&nbsp;&nbsp;<i>Interquartile range</i>", _defaultPercentFormat(degrees["Q1"]) + " - " + _defaultPercentFormat(degrees["Q3"])]);
	  }
	
	  var rows = summary_table.selectAll("tr").data(table_data);
	  rows.enter().append("tr");
	  rows.exit().remove();
	  var columns = rows.selectAll("td").data(function (d) {
	    return d;
	  });
	  columns.enter().append("td");
	  columns.exit();
	  columns.html(function (d) {
	    return d;
	  });
	};
	
	module.exports.computeCluster = hivtrace_cluster_depthwise_traversal;
	module.exports.clusterNetwork = hivtrace_cluster_network_graph;
	module.exports.graphSummary = hivtrace_cluster_graph_summary;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2), __webpack_require__(2)))

/***/ }),

/***/ 43:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';
	
	var d3 = __webpack_require__(39),
	    _ = __webpack_require__(42),
	    helpers = __webpack_require__(44);
	
	function hivtrace_cluster_adjacency_list(obj) {
	
	  var nodes = obj.Nodes,
	      edges = obj.Edges;
	
	  var adjacency_list = {};
	
	  edges.forEach(function (e, i) {
	
	    function in_nodes(n, id) {
	      return n.id == id;
	    }
	
	    var seq_ids = e["sequences"];
	
	    var n1 = nodes.filter(function (n) {
	      return in_nodes(n, seq_ids[0]);
	    })[0],
	        n2 = nodes.filter(function (n) {
	      return in_nodes(n, seq_ids[1]);
	    })[0];
	
	    adjacency_list[n1.id] ? adjacency_list[n1.id].push(n2) : adjacency_list[n1.id] = [n2];
	    adjacency_list[n2.id] ? adjacency_list[n2.id].push(n1) : adjacency_list[n2.id] = [n1];
	  });
	
	  return adjacency_list;
	}
	
	var hivtrace_generate_svg_polygon_lookup = {};
	
	_.each(_.range(3, 20), function (d) {
	  var angle_step = Math.PI * 2 / d;
	  hivtrace_generate_svg_polygon_lookup[d] = _.map(_.range(1, d), function (i) {
	    return [Math.cos(angle_step * i), Math.sin(angle_step * i)];
	  });
	});
	
	function hivtrace_generate_svg_symbol(type) {
	
	  switch (type) {
	    case 'circle':
	    case 'cross':
	    case 'diamond':
	    case 'square':
	    case 'triangle-down':
	    case 'triangle-up':
	      return d3.svg.symbol().type(type);
	    case 'triangle':
	      return new hivtrace_generate_svg_polygon().sides(3);
	    case 'pentagon':
	      return new hivtrace_generate_svg_polygon().sides(5);
	    case 'hexagon':
	      return new hivtrace_generate_svg_polygon().sides(6);
	    case 'septagon':
	      return new hivtrace_generate_svg_polygon().sides(7);
	    case 'octagon':
	      return new hivtrace_generate_svg_polygon().sides(8);
	    case 'ellipse':
	      return new hivtrace_generate_svg_ellipse();
	  }
	  //console.log (type);
	  return d3.svg.symbol().type('circle');
	}
	
	var hivtrace_generate_svg_ellipse = function hivtrace_generate_svg_ellipse() {
	
	  var self = this;
	
	  self.ellipse = function () {
	
	    var path = "M " + self.radius + " 0 A " + self.radius * 1 + " " + self.radius * 0.75 + " 0 1 0 " + self.radius + " 0.00001";
	    return path;
	  };
	
	  self.ellipse.type = function () {
	    return self.ellipse;
	  };
	
	  self.ellipse.size = function (attr) {
	
	    if (_.isNumber(attr)) {
	      self.size = attr;
	      self.radius = Math.sqrt(1.25 * attr / Math.PI);
	      return self.ellipse;
	    }
	
	    return self.size;
	  };
	
	  self.ellipse.size(64);
	
	  return self.ellipse;
	};
	
	var hivtrace_generate_svg_polygon = function hivtrace_generate_svg_polygon() {
	
	  var self = this;
	
	  self.polygon = function () {
	
	    var path = " M" + self.radius + " 0";
	
	    if (self.sides in hivtrace_generate_svg_polygon_lookup) {
	      path += hivtrace_generate_svg_polygon_lookup[self.sides].map(function (value) {
	        return " L" + self.radius * value[0] + " " + self.radius * value[1];
	      }).join(" ");
	    } else {
	      var angle_step = Math.PI * 2 / self.sides,
	          current_angle = 0;
	      for (i = 0; i < self.sides - 1; i++) {
	        current_angle += angle_step;
	        path += " L" + self.radius * Math.cos(current_angle) + " " + self.radius * Math.sin(current_angle);
	      }
	    }
	
	    path += " Z";
	    return path;
	  };
	
	  self.polygon.sides = function (attr) {
	
	    if (_.isNumber(attr) && attr > 2) {
	      self.sides = attr;
	      return self.polygon;
	    }
	
	    return self.sides;
	  };
	
	  self.polygon.type = function () {
	    return self.polygon;
	  };
	
	  self.polygon.size = function (attr) {
	
	    if (_.isNumber(attr)) {
	      self.size = attr;
	      self.radius = Math.sqrt(attr / Math.PI);
	      return self.polygon;
	    }
	
	    return self.size;
	  };
	
	  self.polygon.size(64);
	  self.sides = 6;
	
	  return self.polygon;
	};
	
	function hivtrace_new_cluster_adjacency_list(obj) {
	
	  var nodes = obj.Nodes,
	      edges = obj.Edges;
	
	  nodes.forEach(function (n) {
	    n.neighbors = d3.set();
	  });
	
	  edges.forEach(function (e) {
	    nodes[e.source].neighbors.add(e.target);
	    nodes[e.target].neighbors.add(e.source);
	  });
	}
	
	// Reconstructs path from floyd-warshall algorithm
	function hivtrace_get_path(next, i, j) {
	
	  var all_paths = [];
	  i = parseInt(i);
	  j = parseInt(j);
	
	  for (var c = 0; c < next[i][j].length; c++) {
	
	    var k = next[i][j][c];
	    var intermediate = k;
	
	    if (intermediate === null || intermediate == i) {
	      return [[parseInt(i), parseInt(j)]];
	    } else {
	
	      var paths_i_k = hivtrace_get_path(next, i, intermediate);
	      var paths_k_j = hivtrace_get_path(next, intermediate, j);
	
	      for (var i_k_index = 0; i_k_index < paths_i_k.length; i_k_index++) {
	        var i_k = paths_i_k[i_k_index];
	        for (var k_j_index = 0; k_j_index < paths_k_j.length; k_j_index++) {
	          var k_j = paths_k_j[k_j_index];
	          if (i_k.length) {
	            if (i_k[0] == i && i_k[i_k.length - 1] == k && k_j[0] == k && k_j[k_j.length - 1] == j) {
	              i_k.pop();
	              all_paths.push(i_k.concat(k_j));
	            }
	          }
	        }
	      }
	    }
	  }
	
	  return all_paths;
	}
	
	function hivtrace_paths_with_node(node, next, i, j) {
	
	  var paths = hivtrace_get_path(next, i, j);
	
	  // Retrieve intermediary paths
	  paths = paths.map(function (sublist) {
	    return sublist.slice(1, -1);
	  });
	
	  if (!paths) {
	    return 0;
	  }
	
	  var num_nodes = [];
	
	  for (var k = 0; i < paths.length; k++) {
	    sublist = paths[k];
	    num_nodes.push(d3.sum(sublist.map(function (n) {
	      return n == node;
	    })));
	  }
	
	  var mean = d3.mean(num_nodes);
	
	  if (mean === undefined) {
	    mean = 0;
	  }
	
	  return mean;
	}
	
	// Same as compute shortest paths, but with an additional next parameter for reconstruction
	function hivtrace_compute_shortest_paths_with_reconstruction(obj, subset, use_actual_distances) {
	
	  // Floyd-Warshall implementation
	  var distances = [];
	  var next = [];
	  var nodes = obj.Nodes;
	  var edges = obj.Edges;
	  var node_ids = [];
	
	  var adjacency_list = hivtrace_cluster_adjacency_list(obj);
	
	  if (!subset) {
	    subset = Object.keys(adjacency_list);
	  }
	
	  var node_count = subset.length;
	
	  for (var i = 0; i < subset.length; i++) {
	    var a_node = subset[i];
	    var empty_arr = _.range(node_count).map(function (d) {
	      return null;
	    });
	    var zeroes = _.range(node_count).map(function (d) {
	      return null;
	    });
	    distances.push(zeroes);
	    next.push(empty_arr);
	  }
	
	  for (var index = 0; index < subset.length; index++) {
	    var a_node = subset[index];
	    for (var index2 = 0; index2 < subset.length; index2++) {
	      var second_node = subset[index2];
	      if (second_node != a_node) {
	        if (adjacency_list[a_node].map(function (n) {
	          return n.id;
	        }).indexOf(second_node) != -1) {
	          distances[index][index2] = 1;
	          distances[index2][index] = 1;
	        }
	      }
	    }
	  }
	
	  for (var index_i = 0; index_i < subset.length; index_i++) {
	    var n_i = subset[index_i];
	    for (var index_j = 0; index_j < subset.length; index_j++) {
	      var n_j = subset[index_j];
	      if (index_i == index_j) {
	        next[index_i][index_j] = [];
	      } else {
	        next[index_i][index_j] = [index_i];
	      }
	    }
	  }
	
	  // clone distances
	  var distances2 = _.map(distances, _.clone);
	  var c = 0;
	
	  for (var index_k = 0; index_k < subset.length; index_k++) {
	    var n_k = subset[index_k];
	    for (var index_i = 0; index_i < subset.length; index_i++) {
	      var n_i = subset[index_i];
	      for (var index_j = 0; index_j < subset.length; index_j++) {
	        var n_j = subset[index_j];
	
	        if (n_i != n_j) {
	
	          d_ik = distances[index_k][index_i];
	          d_jk = distances[index_k][index_j];
	          d_ij = distances[index_i][index_j];
	
	          if (d_ik !== null && d_jk !== null) {
	            d_ik += d_jk;
	            if (d_ij === null || d_ij > d_ik) {
	              distances2[index_i][index_j] = d_ik;
	              distances2[index_j][index_i] = d_ik;
	              next[index_i][index_j] = [];
	              next[index_i][index_j] = next[index_i][index_j].concat(next[index_k][index_j]);
	              continue;
	            } else if (d_ij == d_ik) {
	              next[index_i][index_j] = next[index_i][index_j].concat(next[index_k][index_j]);
	            }
	          }
	          c++;
	          distances2[index_j][index_i] = distances[index_j][index_i];
	          distances2[index_i][index_j] = distances[index_i][index_j];
	        }
	      }
	    }
	
	    var t = distances2;
	    distances2 = distances;
	    distances = t;
	  }
	
	  return {
	    'ordering': subset,
	    'distances': distances,
	    'next': next
	  };
	}
	
	function hivtrace_filter_to_node_in_cluster(node, obj) {
	
	  var nodes = obj.Nodes,
	      edges = obj.Edges,
	      cluster_id = null;
	
	  // Retrieve nodes that are part of the cluster
	  var node_obj = nodes.filter(function (n) {
	    return node == n.id;
	  });
	
	  if (node_obj) {
	    cluster_id = node_obj[0].cluster;
	  } else {
	    console.log('could not find node');
	    return null;
	  }
	
	  // Filter out all edges and nodes that belong to the cluster
	  var nodes_in_cluster = nodes.filter(function (n) {
	    return cluster_id == n.cluster;
	  });
	  var node_ids = nodes_in_cluster.map(function (n) {
	    return n.id;
	  });
	  var edges_in_cluster = edges.filter(function (e) {
	    return node_ids.indexOf(e.sequences[0]) != -1;
	  });
	
	  var filtered_obj = {};
	  filtered_obj["Nodes"] = nodes_in_cluster;
	  filtered_obj["Edges"] = edges_in_cluster;
	  return filtered_obj;
	}
	
	function hivtrace_compute_betweenness_centrality_all_nodes_in_cluster(cluster, obj, cb) {
	
	  var nodes = obj.Nodes,
	      edges = obj.Edges;
	
	  var nodes_in_cluster = nodes.filter(function (n) {
	    return cluster == n.cluster;
	  });
	  var node_ids = nodes_in_cluster.map(function (n) {
	    return n.id;
	  });
	  var edges_in_cluster = edges.filter(function (e) {
	    return node_ids.indexOf(e.sequences[0]) != -1;
	  });
	
	  var filtered_obj = {};
	  filtered_obj["Nodes"] = nodes_in_cluster;
	  filtered_obj["Edges"] = edges_in_cluster;
	
	  // get length of cluster
	  if (nodes_in_cluster.length > 70) {
	    cb('cluster too large', null);
	    return;
	  }
	
	  // get paths
	  var paths = hivtrace_compute_shortest_paths_with_reconstruction(filtered_obj);
	  var node_ids = nodes_in_cluster.map(function (n) {
	    return n.id;
	  });
	
	  var betweenness = {};
	  nodes_in_cluster.forEach(function (n) {
	    betweenness[n.id] = hivtrace_compute_betweenness_centrality(n.id, filtered_obj, paths);
	  });
	
	  cb(null, betweenness);
	  return;
	}
	
	// Returns dictionary of nodes' betweenness centrality
	// Utilizes the Floyd-Warshall Algorithm with reconstruction
	function hivtrace_compute_betweenness_centrality(node, obj, paths) {
	
	  if (!paths) {
	    var filtered_obj = hivtrace_filter_to_node_in_cluster(node, obj);
	    paths = hivtrace_compute_shortest_paths_with_reconstruction(filtered_obj);
	  }
	
	  // find index of id
	  var index = paths.ordering.indexOf(node);
	
	  if (index == -1) {
	    return null;
	  }
	
	  var length = paths.distances.length;
	
	  if (length != 2) {
	    scale = 1 / ((length - 1) * (length - 2));
	  } else {
	    scale = 1;
	  }
	
	  // If s->t goes through 1, add to sum
	  // Reconstruct each shortest path and check if node is in it
	  var paths_with_node = [];
	  for (var i in _.range(length)) {
	    for (var j in _.range(length)) {
	      paths_with_node.push(hivtrace_paths_with_node(index, paths.next, i, j));
	    }
	  }
	
	  return d3.sum(paths_with_node) * scale;
	}
	
	function hivtrace_compute_node_degrees(obj) {
	
	  var nodes = obj.Nodes,
	      edges = obj.Edges;
	
	  for (var n in nodes) {
	    nodes[n].degree = 0;
	  }
	
	  for (var e in edges) {
	    nodes[edges[e].source].degree++;
	    nodes[edges[e].target].degree++;
	  }
	}
	
	function hivtrace_get_node_by_id(id, obj) {
	  return obj.Nodes.filter(function (n) {
	    return id == n.id;
	  })[0] || undefined;
	}
	
	function hivtrace_compute_cluster_betweenness(obj, callback) {
	
	  var nodes = obj.Nodes;
	
	  function onlyUnique(value, index, self) {
	    return self.indexOf(value) === index;
	  }
	
	  // Get all unique clusters
	  var clusters = nodes.map(function (n) {
	    return n.cluster;
	  });
	  var unique_clusters = clusters.filter(onlyUnique);
	
	  var cb_count = 0;
	
	  function cb(err, results) {
	
	    cb_count++;
	
	    for (var node in results) {
	      hivtrace_get_node_by_id(node, obj)['betweenness'] = results[node];
	    }
	
	    if (cb_count >= unique_clusters.length) {
	      callback('done');
	    }
	  }
	
	  // Compute betweenness in parallel
	  unique_clusters.forEach(function (cluster_id) {
	    hivtrace_betweenness_centrality_all_nodes_in_cluster(cluster_id, obj, cb);
	  });
	
	  // once all settled callback
	}
	
	function hivtrace_is_contaminant(node) {
	  return node.attributes.indexOf('problematic') != -1;
	}
	
	function hivtrace_convert_to_csv(obj, callback) {
	  //Translate nodes to rows, and then use d3.format
	  hivtrace_compute_node_degrees(obj);
	
	  hivtrace_compute_cluster_betweenness(obj, function (err) {
	    var node_array = obj.Nodes.map(function (d) {
	      return [d.id, d.cluster, d.degree, d.betweenness, hivtrace_is_contaminant(d), d.attributes.join(';')];
	    });
	    node_array.unshift(['seqid', 'cluster', 'degree', 'betweenness', 'is_contaminant', 'attributes']);
	    node_csv = d3.csv.format(node_array);
	    callback(null, node_csv);
	  });
	}
	
	function hivtrace_export_csv_button(graph, tag) {
	
	  var data = hivtrace_convert_to_csv(graph, function (err, data) {
	    if (data !== null) {
	      var pom = document.createElement('a');
	      pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
	      pom.setAttribute('download', 'export.csv');
	      pom.className = 'btn btn-default btn-sm';
	      pom.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span> Export Results';
	      $(tag).append(pom);
	    }
	  });
	}
	
	function hiv_trace_export_table_to_text(parent_id, table_id, sep) {
	
	  var the_button = d3.select(parent_id);
	  the_button.selectAll("[data-type='download-button']").remove();
	
	  the_button = the_button.append("a").attr("target", "_blank").attr("data-type", "download-button").on("click", function (data, element) {
	    d3.event.preventDefault();
	    var table_tag = d3.select(this).attr("data-table");
	    var table_text = helpers.table_to_text(table_tag);
	    helpers.export_handler(table_text, table_tag.substring(1) + ".tsv", "text/tab-separated-values");
	  }).attr("data-table", table_id);
	
	  the_button.append("i").classed("fa fa-download fa-2x", true);
	  return the_button;
	}
	
	var hivtrace_compute_local_clustering_coefficients = _.once(function (obj) {
	
	  hivtrace_new_cluster_adjacency_list(obj);
	
	  var nodes = obj.Nodes;
	
	  nodes.forEach(function (n) {
	
	    var a_node = n;
	    var neighborhood_size = a_node.neighbors.size();
	
	    if (neighborhood_size < 2) {
	      a_node.lcc = undefined;
	    } else {
	
	      if (neighborhood_size > 500) {
	        a_node.lcc = hivtrace_too_large;
	      } else {
	        // count triangles
	        neighborhood = a_node.neighbors.values();
	        counter = 0;
	        for (n1 = 0; n1 < neighborhood_size; n1 += 1) {
	          for (n2 = n1 + 1; n2 < neighborhood_size; n2 += 1) {
	            if (nodes[neighborhood[n1]].neighbors.has(neighborhood[n2])) {
	              counter++;
	            }
	          }
	        }
	        a_node.lcc = 2 * counter / neighborhood_size / (neighborhood_size - 1);
	      }
	    }
	  });
	});
	
	function hivtrace_render_settings(settings, explanations) {
	  // TODO:
	  //d3.json (explanations, function (error, expl) {
	  //    //console.log (settings);
	  //});
	}
	
	function hivtrace_format_value(value, formatter) {
	
	  if (typeof value === 'undefined') {
	    return "Not computed";
	  }
	  if (value === hivtrace_undefined) {
	    return "Undefined";
	  }
	  if (value === hivtrace_too_large) {
	    return "Size limit";
	  }
	
	  if (value === hivtrace_processing) {
	    return '<span class="fa fa-spin fa-spinner"></span>';
	  }
	
	  return formatter ? formatter(value) : value;
	}
	
	function hivtrace_plot_cluster_dynamics(time_series, container, x_title, y_title, y_scale, bin_by, options) {
	
	  options = options || {
	    base_line: 20,
	    top: 40,
	    right: 30,
	    bottom: 3 * 20,
	    left: 5 * 20,
	    font_size: 18,
	    rect_size: 22,
	    width: 1024,
	    height: 600
	  };
	
	  var skip_cumulative = options && options["skip_cumulative"];
	
	  var width = options.width - options.left - options.right;
	  var height = options.height - options.top - options.bottom;
	
	  bin_by = bin_by || function (date) {
	    var year = date.getFullYear(),
	        nearest_quarter = new Date(),
	        mid_point = new Date();
	
	    nearest_quarter.setDate(1);
	    nearest_quarter.setFullYear(year);
	    mid_point.setFullYear(year);
	
	    var quarter = Math.floor(date.getMonth() / 3) + 1;
	    nearest_quarter.setMonth(quarter * 3);
	    nearest_quarter.setHours(0, 0, 0);
	    mid_point.setHours(0, 0, 0);
	
	    nearest_quarter.setFullYear(year + (quarter == 4 ? 1 : 0));
	    mid_point.setMonth(quarter * 3 + 1);
	    mid_point.setDate(15);
	
	    return ["Q" + quarter + " " + year, nearest_quarter, mid_point];
	  };
	
	  /** plot_data is an array with entries like 
	      {
	          "time": DATE,
	          "sex_trans":"IDU-Male"
	      }
	      
	      "time" is required, everything else are optional attributes
	      
	      1. First, we bin everything into ranges (like years or quarters, this is returned by the mapper callback)
	      2. Second, we compute growth dynamics of total counts and individual attributes
	      3. Third, if additional attributes are present, one that's tagged for display is stratified by values and 
	         converted into time series
	      
	  */
	
	  var x = d3.time.scale().range([0, width]);
	
	  var y = y_scale ? y_scale : d3.scale.linear();
	
	  y.range([height, 0]);
	
	  var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(8).tickFormat(d3.time.format("%m/%Y"));
	
	  var yAxis = d3.svg.axis().scale(y).orient("left").ticks(8, "f");
	
	  var binned = {};
	  var values_by_attribute = {};
	  var total_id = "total";
	  var total_color = "#555555";
	  var prefix = options && options["prefix"] ? options["prefix"] : null;
	  var max_bin = 0;
	
	  _.each(time_series, function (point, index) {
	    var bin_tag = bin_by(point["time"]);
	    if (!(bin_tag[0] in binned)) {
	      binned[bin_tag[0]] = { "time": bin_tag[1], "x": bin_tag[2] };
	      binned[bin_tag[0]][total_id] = 0;
	      _.each(point, function (v, k) {
	        if (k != "time") {
	          binned[bin_tag[0]][k] = {};
	        }
	      });
	    }
	
	    binned[bin_tag[0]][total_id] += 1;
	    max_bin = Math.max(max_bin, binned[bin_tag[0]][total_id]);
	
	    var y = {};
	    y[total_id] = index + 1;
	    _.each(point, function (v, k) {
	      if (k != "time") {
	        binned[bin_tag[0]][k][v] = binned[bin_tag[0]][k][v] ? binned[bin_tag[0]][k][v] + 1 : 1;
	        if (!(k in values_by_attribute)) {
	          values_by_attribute[k] = {};
	        }
	        if (v in values_by_attribute[k]) {
	          values_by_attribute[k][v]++;
	        } else {
	          values_by_attribute[k][v] = 1;
	        }
	        max_bin = Math.max(max_bin, binned[bin_tag[0]][k][v]);
	        y[k] = _.clone(values_by_attribute[k]);
	      }
	    });
	
	    point["y"] = y;
	    point["_bin"] = bin_tag[1];
	  });
	
	  var binned_array = [];
	  _.each(binned, function (v, k) {
	    v["id"] = k;
	    binned_array.push(v);
	  });
	
	  binned_array.sort(function (a, b) {
	    return b['time'] > a['time'] ? 1 : b['time'] == a['time'] ? 0 : -1;
	  });
	
	  var min_x = d3.min(time_series, function (d) {
	    return d["time"] < d["_bin"] ? d["time"] : d["_bin"];
	  });
	  var max_x = d3.max(time_series, function (d) {
	    return d["time"] > d["_bin"] ? d["time"] : d["_bin"];
	  });
	
	  x.domain([min_x, max_x]).clamp(true);
	  y.domain([0.0, Math.round(skip_cumulative ? max_bin + 1 : time_series.length * 1.2)]).clamp(true);
	
	  /* step-plot generator*/
	
	  /*var svg = container.append("svg")//.style("display", "table-cell")
	      .attr("width", width + options.left + options.right)
	      .attr("height", height + options.top + options.bottom);*/
	
	  container.selectAll("*").remove(); // clean up previous plots
	
	  var legend_area = container.append("g").attr("transform", "translate(" + (options.left + options.font_size * 2.5) + "," + (options.top + options.font_size) + ")");
	
	  var svg = container.append("g").attr("transform", "translate(" + options.left + "," + options.top + ")");
	
	  /* set the domain for the codons */
	
	  var y_key = _.keys(values_by_attribute)[0];
	
	  var color_scale = "colorizer" in options && options["colorizer"] && y_key in options["colorizer"] ? options["colorizer"][y_key] : d3.scale.category10();
	
	  color_scale = _.wrap(color_scale, function (func, arg) {
	    if (arg == total_id) return total_color;
	    return func(arg);
	  });
	
	  var plot_types = _.keys(values_by_attribute[y_key]);
	  plot_types.push(total_id);
	  plot_types.sort();
	
	  if (options && options["drag"]) {
	    var drag = d3.behavior.drag();
	    drag.on("drag", function () {
	      options["drag"].x += d3.event.dx;
	      options["drag"].y += d3.event.dy;
	      d3.select(this).attr("transform", "translate(" + options["drag"].x + ',' + options["drag"].y + ")");
	    });
	    container.call(drag);
	  }
	
	  var legend_lines = legend_area.selectAll("g").data(plot_types);
	
	  legend_lines.enter().append("g").attr("class", "annotation-text");
	
	  function opacity_toggle(tag, on_off) {
	    d3.select('[data-plotid="' + tag + '"]').style("fill-opacity", on_off ? 0.5 : 0.1);
	    d3.select('[data-curveid="' + tag + '"]').style("stroke-width", on_off ? 3 : 1);
	  }
	
	  legend_lines.selectAll("text").data(function (d) {
	    return [d];
	  }).enter().append("text").attr("transform", function (d, i, j) {
	    return "translate(" + options.rect_size + "," + (options.rect_size * (plot_types.length - 1 - j) - (options.rect_size - options.font_size)) + ")";
	  }).attr("dx", "0.2em").style("font-size", options.font_size).text(function (d) {
	    return d;
	  }).on("mouseover", function (d) {
	    opacity_toggle(prefix + d, true);
	  }).on("mouseout", function (d) {
	    opacity_toggle(prefix + d, false);
	  });
	
	  legend_lines.selectAll("rect").data(function (d) {
	    return [d];
	  }).enter().append("rect").attr("x", 0).attr("y", function (d, i, j) {
	    return options.rect_size * (plot_types.length - 2 - j);
	  }).attr("width", options.rect_size).attr("height", options.rect_size).attr("class", "area").style("fill", function (d, i, j) {
	    return color_scale(d);
	  }).on("mouseover", function (d) {
	    opacity_toggle(prefix + d, true);
	  }).on("mouseout", function (d) {
	    opacity_toggle(prefix + d, false);
	  });
	
	  var last = _.clone(time_series[time_series.length - 1]);
	  last['time'] = x.domain()[1];
	  time_series.push(last);
	
	  _.each(plot_types, function (plot_key, idx) {
	
	    var plot_color = color_scale(plot_key);
	    var y_accessor = function y_accessor(d) {
	      //console.log ((plot_key in d['y']) ? d['y'][plot_key] : 0);
	      if (plot_key in d['y']) {
	        return d['y'][plot_key];
	      }
	      if (y_key in d['y']) {
	        if (plot_key in d['y'][y_key]) {
	          return d['y'][y_key][plot_key];
	        }
	      }
	      return 0.0;
	    };
	
	    var bin_accessor = function bin_accessor(d) {
	      if (y_key && plot_key in d[y_key]) {
	        return d[y_key][plot_key];
	      } else {
	        if (plot_key in d) {
	          return d[plot_key];
	        }
	      }
	      return 0.0;
	    };
	
	    if (!skip_cumulative) {
	      var curve = d3.svg.area().x(function (d) {
	        return x(d['time']);
	      }).y1(function (d) {
	        return y(y_accessor(d));
	      }).y0(function (d) {
	        return y(0);
	      }).interpolate("step");
	
	      svg.append("path").datum(time_series).classed("trend", true).style("fill", plot_color).style("stroke", plot_color).attr("d", curve).attr("data-plotid", prefix + plot_key);
	    }
	
	    binned_array.forEach(function (d) {
	      svg.append("circle").attr("cx", x(d['time'])).attr("cy", y(bin_accessor(d))).attr("r", "5").classed("node", true).style("fill", plot_color).style("stroke", plot_color).attr("title", plot_key + " : " + bin_accessor(d));
	    });
	
	    var curve_year = d3.svg.line().x(function (d) {
	      return x(d['time']);
	    }).y(function (d) {
	      return y(bin_accessor(d));
	    }).interpolate("cardinal");
	
	    svg.append("path").datum(binned_array).classed("tracer", true).style("stroke", plot_color).attr("d", curve_year).attr("data-curveid", prefix + plot_key);
	  });
	
	  /* x-axis */
	  var x_axis = svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").style("font-size", options.font_size).call(xAxis);
	
	  x_axis.selectAll("text").attr("transform", "rotate(45)").attr("dy", "1em").attr("dx", "1em");
	
	  x_axis.append("text").attr("x", width).attr("dy", "-.5em").style("text-anchor", "end").style("font-size", options.font_size).text(x_title);
	
	  /* y-axis*/
	  svg.append("g").attr("class", "y axis").style("font-size", options.font_size).call(yAxis).append("text").style("font-size", options.font_size).attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(y_title); // beta - alpha
	}
	
	module.exports.compute_node_degrees = hivtrace_compute_node_degrees;
	module.exports.export_csv_button = hivtrace_export_csv_button;
	module.exports.convert_to_csv = hivtrace_convert_to_csv;
	module.exports.betweenness_centrality = hivtrace_compute_betweenness_centrality;
	module.exports.betweenness_centrality_all_nodes_in_cluster = hivtrace_compute_betweenness_centrality_all_nodes_in_cluster;
	module.exports.cluster_adjacency_list = hivtrace_cluster_adjacency_list;
	module.exports.new_cluster_adjacency_list = hivtrace_new_cluster_adjacency_list;
	module.exports.analysis_settings = hivtrace_render_settings;
	module.exports.export_table_to_text = hiv_trace_export_table_to_text;
	module.exports.compute_local_clustering = hivtrace_compute_local_clustering_coefficients;
	module.exports.undefined = {};
	module.exports.too_large = {};
	module.exports.processing = {};
	module.exports.format_value = hivtrace_format_value;
	module.exports.polygon = hivtrace_generate_svg_polygon;
	module.exports.symbol = hivtrace_generate_svg_symbol;
	module.exports.cluster_dynamics = hivtrace_plot_cluster_dynamics;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/***/ 44:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($, d3, jQuery, _) {'use strict';
	
	var download = __webpack_require__(45);
	
	var datamonkey_error_modal = function datamonkey_error_modal(msg) {
	  $('#modal-error-msg').text(msg);
	  $('#errorModal').modal();
	};
	
	function b64toBlob(b64, onsuccess, onerror) {
	  var img = new Image();
	
	  img.onerror = onerror;
	
	  img.onload = function onload() {
	    var canvas = document.getElementById("hyphy-chart-canvas");
	    canvas.width = img.width;
	    canvas.height = img.height;
	
	    var ctx = canvas.getContext('2d');
	    ctx.fillStyle = "#FFFFFF";
	    ctx.fillRect(0, 0, canvas.width, canvas.height);
	    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
	
	    if (canvas.msToBlob) {
	      var blob = canvas.msToBlob(onsuccess);
	      onsuccess(blob);
	      window.navigator.msSaveBlob(blob, 'image.png');
	    } else {
	      canvas.toBlob(onsuccess);
	    }
	  };
	
	  img.src = b64;
	}
	
	var datamonkey_export_csv_button = function datamonkey_export_csv_button(data) {
	  data = d3.csv.format(data);
	  if (data !== null) {
	    var pom = document.createElement('a');
	    pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(data));
	    pom.setAttribute('download', 'export.csv');
	    pom.className = 'btn btn-default btn-sm';
	    pom.innerHTML = '<span class="glyphicon glyphicon-floppy-save"></span> Download CSV';
	    $("body").append(pom);
	    pom.click();
	    pom.remove();
	  }
	};
	
	var datamonkey_save_image = function datamonkey_save_image(type, container) {
	
	  var prefix = {
	    xmlns: "http://www.w3.org/2000/xmlns/",
	    xlink: "http://www.w3.org/1999/xlink",
	    svg: "http://www.w3.org/2000/svg"
	  };
	
	  function get_styles(doc) {
	
	    function process_stylesheet(ss) {
	      try {
	        if (ss.cssRules) {
	          for (var i = 0; i < ss.cssRules.length; i++) {
	            var rule = ss.cssRules[i];
	            if (rule.type === 3) {
	              // Import Rule
	              process_stylesheet(rule.styleSheet);
	            } else {
	              // hack for illustrator crashing on descendent selectors
	              if (rule.selectorText) {
	                if (rule.selectorText.indexOf(">") === -1) {
	                  styles += "\n" + rule.cssText;
	                }
	              }
	            }
	          }
	        }
	      } catch (e) {
	        console.log('Could not process stylesheet : ' + ss);
	      }
	    }
	
	    var styles = "",
	        styleSheets = doc.styleSheets;
	
	    if (styleSheets) {
	      for (var i = 0; i < styleSheets.length; i++) {
	        process_stylesheet(styleSheets[i]);
	      }
	    }
	
	    return styles;
	  }
	
	  var convert_svg_to_png = function convert_svg_to_png(image_string) {
	
	    var image = document.getElementById("hyphy-chart-image");
	
	    image.onload = function () {
	
	      var canvas = document.getElementById("hyphy-chart-canvas");
	      canvas.width = image.width;
	      canvas.height = image.height;
	      var context = canvas.getContext("2d");
	      context.fillStyle = "#FFFFFF";
	      context.fillRect(0, 0, image.width, image.height);
	      context.drawImage(image, 0, 0);
	      var img = canvas.toDataURL("image/png");
	      var pom = document.createElement('a');
	      pom.setAttribute('download', 'image.png');
	      pom.href = canvas.toDataURL("image/png");
	      $("body").append(pom);
	      pom.click();
	      pom.remove();
	    };
	
	    image.src = image_string;
	  };
	
	  var svg = $(container).find("svg")[0];
	  if (!svg) {
	    svg = $(container)[0];
	  }
	
	  var styles = get_styles(window.document);
	
	  svg.setAttribute("version", "1.1");
	
	  var defsEl = document.createElement("defs");
	  svg.insertBefore(defsEl, svg.firstChild);
	
	  var styleEl = document.createElement("style");
	  defsEl.appendChild(styleEl);
	  styleEl.setAttribute("type", "text/css");
	
	  // removing attributes so they aren't doubled up
	  svg.removeAttribute("xmlns");
	  svg.removeAttribute("xlink");
	
	  // These are needed for the svg
	  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
	    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
	  }
	
	  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
	    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
	  }
	
	  var source = new XMLSerializer().serializeToString(svg).replace('</style>', '<![CDATA[' + styles + ']]></style>');
	  var rect = svg.getBoundingClientRect();
	  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
	  var to_download = [doctype + source];
	  var image_string = 'data:image/svg+xml;base66,' + encodeURIComponent(to_download);
	
	  if (navigator.msSaveBlob) {
	    // IE10
	    download(image_string, "image.svg", "image/svg+xml");
	  } else if (type == "png") {
	    b64toBlob(image_string, function (blob) {
	      var url = window.URL.createObjectURL(blob);
	      var pom = document.createElement('a');
	      pom.setAttribute('download', 'image.png');
	      pom.setAttribute('href', url);
	      $("body").append(pom);
	      pom.click();
	      pom.remove();
	    }, function (error) {
	      console.log(error);
	    });
	  } else {
	    var pom = document.createElement('a');
	    pom.setAttribute('download', 'image.svg');
	    pom.setAttribute('href', image_string);
	    $("body").append(pom);
	    pom.click();
	    pom.remove();
	  }
	};
	
	var datamonkey_validate_date = function datamonkey_validate_date() {
	
	  // Check that it is not empty
	  if ($(this).val().length === 0) {
	    $(this).next('.help-block').remove();
	    $(this).parent().removeClass('has-success');
	    $(this).parent().addClass('has-error');
	
	    jQuery('<span/>', {
	      class: 'help-block',
	      text: 'Field is empty'
	    }).insertAfter($(this));
	  } else if (isNaN(Date.parse($(this).val()))) {
	    $(this).next('.help-block').remove();
	    $(this).parent().removeClass('has-success');
	    $(this).parent().addClass('has-error');
	
	    jQuery('<span/>', {
	      class: 'help-block',
	      text: 'Date format should be in the format YYYY-mm-dd'
	    }).insertAfter($(this));
	  } else {
	    $(this).parent().removeClass('has-error');
	    $(this).parent().addClass('has-success');
	    $(this).next('.help-block').remove();
	  }
	};
	
	function datamonkey_get_styles(doc) {
	  var styles = "",
	      styleSheets = doc.styleSheets;
	
	  if (styleSheets) {
	    for (var i = 0; i < styleSheets.length; i++) {
	      processStyleSheet(styleSheets[i]);
	    }
	  }
	
	  function processStyleSheet(ss) {
	    if (ss.cssRules) {
	      for (var i = 0; i < ss.cssRules.length; i++) {
	        var rule = ss.cssRules[i];
	        if (rule.type === 3) {
	          // Import Rule
	          processStyleSheet(rule.styleSheet);
	        } else {
	          // hack for illustrator crashing on descendent selectors
	          if (rule.selectorText) {
	            if (rule.selectorText.indexOf(">") === -1) {
	              styles += "\n" + rule.cssText;
	            }
	          }
	        }
	      }
	    }
	  }
	  return styles;
	}
	
	function datamonkey_save_newick_to_file() {
	  var top_modal_container = "#neighbor-tree-modal";
	  var nwk = $(top_modal_container).data("tree");
	  var pom = document.createElement('a');
	  pom.setAttribute('href', 'data:text/octet-stream;charset=utf-8,' + encodeURIComponent(nwk));
	  pom.setAttribute('download', 'nwk.txt');
	  $("body").append(pom);
	  pom.click();
	  pom.remove();
	}
	
	function datamonkey_convert_svg_to_png(image_string) {
	  var image = document.getElementById("image");
	  image.src = image_string;
	
	  image.onload = function () {
	    var canvas = document.getElementById("canvas");
	    canvas.width = image.width;
	    canvas.height = image.height;
	    var context = canvas.getContext("2d");
	    context.fillStyle = "#FFFFFF";
	    context.fillRect(0, 0, image.width, image.height);
	    context.drawImage(image, 0, 0);
	    var img = canvas.toDataURL("image/png");
	
	    var pom = document.createElement('a');
	    pom.setAttribute('download', 'phylotree.png');
	    pom.href = canvas.toDataURL("image/png");
	    $("body").append(pom);
	    pom.click();
	    pom.remove();
	  };
	}
	
	function datamonkey_save_newick_tree(type) {
	
	  var prefix = {
	    xmlns: "http://www.w3.org/2000/xmlns/",
	    xlink: "http://www.w3.org/1999/xlink",
	    svg: "http://www.w3.org/2000/svg"
	  };
	
	  var tree_container = "#tree_container";
	  var svg = $("#tree_container").find("svg")[0];
	  var styles = datamonkey_get_styles(window.document);
	
	  svg.setAttribute("version", "1.1");
	
	  var defsEl = document.createElement("defs");
	  svg.insertBefore(defsEl, svg.firstChild);
	
	  var styleEl = document.createElement("style");
	  defsEl.appendChild(styleEl);
	  styleEl.setAttribute("type", "text/css");
	
	  // removing attributes so they aren't doubled up
	  svg.removeAttribute("xmlns");
	  svg.removeAttribute("xlink");
	
	  // These are needed for the svg
	  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
	    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
	  }
	
	  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
	    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
	  }
	
	  var source = new XMLSerializer().serializeToString(svg).replace('</style>', '<![CDATA[' + styles + ']]></style>');
	  var rect = svg.getBoundingClientRect();
	  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
	  var to_download = [doctype + source];
	  var image_string = 'data:image/svg+xml;base66,' + encodeURIComponent(to_download);
	
	  if (type == "png") {
	    datamonkey_convert_svg_to_png(image_string);
	  } else {
	    var pom = document.createElement('a');
	    pom.setAttribute('download', 'phylotree.svg');
	    pom.setAttribute('href', image_string);
	    $("body").append(pom);
	    pom.click();
	    pom.remove();
	  }
	}
	
	function datamonkey_validate_email(email) {
	  if ($(this).find("input[name='receive_mail']")[0].checked) {
	    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	    if (regex.test($(this).find("input[name='mail']").val())) {
	      // Give them green. They like that.
	      $(this).removeClass('has-error');
	      $(this).addClass('has-success');
	      $(this).next('.help-block').remove();
	    } else {
	      $(this).next('.help-block').remove();
	      $(this).removeClass('has-error');
	      $(this).removeClass('has-success');
	      $(this).addClass('has-error');
	      var span = jQuery('<span/>', {
	        class: 'help-block col-lg-9 pull-right',
	        text: 'Invalid Email'
	      }).insertAfter($(this));
	    }
	  } else {
	    $(this).removeClass('has-error');
	    $(this).removeClass('has-success');
	    $(this).next('.help-block').remove();
	  }
	}
	
	function datamonkey_describe_vector(vector, as_list) {
	
	  var d = {};
	
	  if (vector.length) {
	
	    vector.sort(d3.ascending);
	
	    var d = {
	      'min': d3.min(vector),
	      'max': d3.max(vector),
	      'median': d3.median(vector),
	      'Q1': d3.quantile(vector, 0.25),
	      'Q3': d3.quantile(vector, 0.75),
	      'mean': d3.mean(vector)
	    };
	  } else {
	    var d = {
	      'min': null,
	      'max': null,
	      'median': null,
	      'Q1': null,
	      'Q3': null,
	      'mean': null
	    };
	  }
	
	  if (as_list) {
	
	    d = "<pre>Range  :" + d['min'] + "-" + d['max'] + "\n" + "IQR    :" + d['Q1'] + "-" + d['Q3'] + "\n" + "Mean   :" + d['mean'] + "\n" + "Median :" + d['median'] + "\n" + "</pre>";
	
	    /*d =
	    "<dl class = 'dl-horizontal'>" +
	    "<dt>Range</dt><dd>" + d['min'] + "-" + d['max'] + "</dd>" +
	    "<dt>IQR</dt><dd>" + d['Q1'] + "-" + d['Q3'] +  "</dd>" +
	    "<dt>Mean</dt><dd>" + d['mean'] +  "</dd>" +
	    "<dt>Median</dt><dd>" + d['median'] + "</dd></dl>";*/
	  }
	
	  return d;
	}
	
	function datamonkey_export_handler(data, filename, mimeType) {
	
	  function msieversion() {
	    var ua = window.navigator.userAgent;
	    var msie = ua.indexOf("MSIE ");
	    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
	      return true;
	    }
	    return false;
	  }
	
	  if (msieversion()) {
	    var IEwindow = window.open();
	    IEwindow.document.write(data);
	    IEwindow.document.close();
	    IEwindow.document.execCommand('SaveAs', true, filename + ".csv");
	    IEwindow.close();
	  } else {
	    var pom = document.createElement('a');
	    pom.setAttribute('href', 'data:' + (mimeType || 'text/plain') + ';charset=utf-8,' + encodeURIComponent(data));
	    pom.setAttribute('download', filename || "download.tsv");
	    pom.click();
	    pom.remove();
	  }
	}
	
	function datamonkey_table_to_text(table_id, sep) {
	  sep = sep || "\t";
	  var header_row = [];
	  d3.select(table_id + " thead").selectAll("th").each(function () {
	    header_row.push(d3.select(this).text());
	  });
	  var data_rows = [];
	  d3.select(table_id + " tbody").selectAll("tr").each(function (d, i) {
	    data_rows.push([]);
	    d3.select(this).selectAll("td").each(function () {
	      data_rows[i].push(d3.select(this).text());
	    });
	  });
	
	  return header_row.join(sep) + "\n" + data_rows.map(function (d) {
	    return d.join(sep);
	  }).join("\n");
	}
	
	function datamonkey_capitalize(s) {
	  if (s.length > 0) {
	    return s[0].toUpperCase() + s.slice(1);
	  } else {
	    return s;
	  }
	}
	
	function datamonkey_count_partitions(json) {
	  try {
	    return _.keys(json).length;
	  } catch (e) {
	    // ignore errors
	  }
	  return 0;
	}
	
	function datamonkey_sum(object, accessor) {
	  accessor = accessor || function (value) {
	    return value;
	  };
	  return _.reduce(object, function (sum, value, index) {
	    return sum + accessor(value, index);
	  }, 0);
	}
	
	function datamonkey_count_sites_from_partitions(json) {
	  try {
	    return datamonkey_sum(json["partitions"], function (value) {
	      return value["coverage"][0].length;
	    });
	  } catch (e) {
	    // ignore errors
	  }
	  return 0;
	}
	
	function datamonkey_filter_list(list, predicate, context) {
	  var result = {};
	  predicate = _.bind(predicate, context);
	  _.each(list, _.bind(function (value, key) {
	    if (predicate(value, key)) {
	      result[key] = value;
	    }
	  }, context));
	  return result;
	}
	
	function datamonkey_map_list(list, transform, context) {
	  var result = {};
	  transform = _.bind(transform, context);
	  _.each(list, _.bind(function (value, key) {
	    result[key] = transform(value, key);
	  }, context));
	  return result;
	}
	
	module.exports.errorModal = datamonkey_error_modal;
	module.exports.export_csv_button = datamonkey_export_csv_button;
	module.exports.save_image = datamonkey_save_image;
	module.exports.validate_date = datamonkey_validate_date;
	
	module.exports.save_newick_to_file = datamonkey_save_newick_to_file;
	module.exports.convert_svg_to_png = datamonkey_convert_svg_to_png;
	module.exports.save_newick_tree = datamonkey_save_newick_tree;
	module.exports.validate_email = datamonkey_validate_email;
	module.exports.describe_vector = datamonkey_describe_vector;
	module.exports.table_to_text = datamonkey_table_to_text;
	module.exports.export_handler = datamonkey_export_handler;
	module.exports.capitalize = datamonkey_capitalize;
	module.exports.countPartitionsJSON = datamonkey_count_partitions;
	module.exports.countSitesFromPartitionsJSON = datamonkey_count_sites_from_partitions;
	module.exports.sum = datamonkey_sum;
	module.exports.filter = datamonkey_filter_list;
	module.exports.map = datamonkey_map_list;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2), __webpack_require__(39), __webpack_require__(2), __webpack_require__(42)))

/***/ }),

/***/ 45:
/***/ (function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;//download.js v4.2, by dandavis; 2008-2016. [MIT] see http://danml.com/download.html for tests/usage
	// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
	// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
	// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
	// v4 adds AMD/UMD, commonJS, and plain browser support
	// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
	// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
	// https://github.com/rndme/download
	
	(function (root, factory) {
		if (true) {
			// AMD. Register as an anonymous module.
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (typeof exports === 'object') {
			// Node. Does not work with strict CommonJS, but
			// only CommonJS-like environments that support module.exports,
			// like Node.
			module.exports = factory();
		} else {
			// Browser globals (root is window)
			root.download = factory();
	  }
	}(this, function () {
	
		return function download(data, strFileName, strMimeType) {
	
			var self = window, // this script is only for browsers anyway...
				defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
				mimeType = strMimeType || defaultMime,
				payload = data,
				url = !strFileName && !strMimeType && payload,
				anchor = document.createElement("a"),
				toString = function(a){return String(a);},
				myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
				fileName = strFileName || "download",
				blob,
				reader;
				myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
		  
			if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
				payload=[payload, mimeType];
				mimeType=payload[0];
				payload=payload[1];
			}
	
	
			if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
				fileName = url.split("/").pop().split("?")[0];
				anchor.href = url; // assign href prop to temp anchor
			  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
	        		var ajax=new XMLHttpRequest();
	        		ajax.open( "GET", url, true);
	        		ajax.responseType = 'blob';
	        		ajax.onload= function(e){ 
					  download(e.target.response, fileName, defaultMime);
					};
	        		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
				    return ajax;
				} // end if valid url?
			} // end if url?
	
	
			//go ahead and download dataURLs right away
			if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)){
			
				if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
					payload=dataUrlToBlob(payload);
					mimeType=payload.type || defaultMime;
				}else{			
					return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
						navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
						saver(payload) ; // everyone else can save dataURLs un-processed
				}
				
			}else{//not data url, is it a string with special needs?
				if(/([\x80-\xff])/.test(payload)){			  
					var i=0, tempUiArr= new Uint8Array(payload.length), mx=tempUiArr.length;
					for(i;i<mx;++i) tempUiArr[i]= payload.charCodeAt(i);
				 	payload=new myBlob([tempUiArr], {type: mimeType});
				}		  
			}
			blob = payload instanceof myBlob ?
				payload :
				new myBlob([payload], {type: mimeType}) ;
	
	
			function dataUrlToBlob(strUrl) {
				var parts= strUrl.split(/[:;,]/),
				type= parts[1],
				decoder= parts[2] == "base64" ? atob : decodeURIComponent,
				binData= decoder( parts.pop() ),
				mx= binData.length,
				i= 0,
				uiArr= new Uint8Array(mx);
	
				for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);
	
				return new myBlob([uiArr], {type: type});
			 }
	
			function saver(url, winMode){
	
				if ('download' in anchor) { //html5 A[download]
					anchor.href = url;
					anchor.setAttribute("download", fileName);
					anchor.className = "download-js-link";
					anchor.innerHTML = "downloading...";
					anchor.style.display = "none";
					document.body.appendChild(anchor);
					setTimeout(function() {
						anchor.click();
						document.body.removeChild(anchor);
						if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
					}, 66);
					return true;
				}
	
				// handle non-a[download] safari as best we can:
				if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
					if(/^data:/.test(url))	url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
					if(!window.open(url)){ // popup blocked, offer direct download:
						if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
					}
					return true;
				}
	
				//do iframe dataURL download (old ch+FF):
				var f = document.createElement("iframe");
				document.body.appendChild(f);
	
				if(!winMode && /^data:/.test(url)){ // force a mime that will download:
					url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
				}
				f.src=url;
				setTimeout(function(){ document.body.removeChild(f); }, 333);
	
			}//end saver
	
	
	
	
			if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
				return navigator.msSaveBlob(blob, fileName);
			}
	
			if(self.URL){ // simple fast and modern way using Blob and URL:
				saver(self.URL.createObjectURL(blob), true);
			}else{
				// handle non-Blob()+non-URL browsers:
				if(typeof blob === "string" || blob.constructor===toString ){
					try{
						return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
					}catch(y){
						return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
					}
				}
	
				// Blob but not URL support:
				reader=new FileReader();
				reader.onload=function(e){
					saver(this.result);
				};
				reader.readAsDataURL(blob);
			}
			return true;
		}; /* end download() */
	}));


/***/ }),

/***/ 46:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(39),
	    _ = __webpack_require__(42);
	
	function hivtrace_render_scatterplot(points, w, h, id, labels, dates) {
	  var _defaultDateViewFormat = d3.time.format("%B %d, %Y");
	  var _defaultFloatFormat = d3.format(",.2r");
	  var _defaultDateViewFormatShort = d3.time.format("%B %Y");
	
	  var margin = {
	    top: 10,
	    right: 10,
	    bottom: 100,
	    left: 100
	  },
	      width = w - margin.left - margin.right,
	      height = h - margin.top - margin.bottom;
	
	  var x = (dates ? d3.time.scale() : d3.scale.linear()).domain(d3.extent(points, function (p) {
	    return p.x;
	  })).range([0, width]);
	
	  var y = (dates ? d3.time.scale() : d3.scale.linear()).domain(d3.extent(points, function (p) {
	    return p.y;
	  })).range([height, 0]);
	
	  var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(dates ? _defaultDateViewFormatShort : _defaultFloatFormat);
	
	  var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(dates ? _defaultDateViewFormatShort : _defaultFloatFormat);
	
	  var histogram_svg = d3.select(id).selectAll("svg");
	
	  if (!histogram_svg.empty()) {
	    histogram_svg.remove();
	  }
	
	  histogram_svg = d3.select(id).append("svg").attr("width", w).attr("height", h).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	  points = histogram_svg.selectAll("circle").data(points);
	  points.enter().append("circle");
	
	  points.attr("cx", function (d) {
	    return x(d.x);
	  }).attr("cy", function (d) {
	    return y(d.y);
	  }).attr("r", 3).classed("node scatter", true);
	
	  points.each(function (d) {
	    if ("title" in d) {
	      d3.select(this).append("title").text(d.title);
	    }
	  });
	
	  var x_axis = histogram_svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
	
	  x_axis.selectAll("text").attr("transform", "rotate(-45)").attr("dx", "-.5em").attr("dy", ".25em").style("text-anchor", "end");
	  x_axis.append("text").text(labels.x).attr("transform", "translate(" + width + ",0)").attr("dy", "-1em").attr("text-anchor", "end");
	
	  var y_axis = histogram_svg.append("g").attr("class", "y axis").attr("transform", "translate(0," + 0 + ")").call(yAxis);
	
	  y_axis.selectAll("text").attr("transform", "rotate(-45)").attr("dx", "-.5em").attr("dy", ".25em").style("text-anchor", "end");
	  y_axis.append("text").text(labels.y).attr("transform", "rotate(-90)").attr("dy", "1em").attr("text-anchor", "end");
	}
	
	module.exports.scatterPlot = hivtrace_render_scatterplot;

/***/ }),

/***/ 47:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(39),
	    _ = __webpack_require__(42);
	
	function hivtrace_render_prevalence(data, w, h, id, x_title, y_title, y_scale, fractions, baseline) {
	
	    var base_line = baseline || 14;
	
	    var container = d3.select(id);
	
	    var margin = {
	        top: base_line * 2,
	        right: base_line * 1.5,
	        bottom: 3 * base_line,
	        left: 5 * base_line
	    },
	        width = w - margin.left - margin.right,
	        height = h - margin.top - margin.bottom,
	        font_size = baseline * 1.25,
	        rect_size = font_size * 1.25;
	
	    var x = d3.time.scale().range([0, width]);
	
	    var y = y_scale ? y_scale : d3.scale.linear();
	
	    y.range([height, 0]);
	
	    var xAxis = d3.svg.axis().scale(x).orient("bottom"); //.ticks (5, y.tickFormat(5, ".0f"));
	
	    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(8, fractions ? "p" : "f");
	
	    x.domain(d3.extent(plot_data, function (d) {
	        return d['x'];
	    })).clamp(true);
	
	    var extents = d3.extent(plot_data, function (d) {
	        return _.max(d['y']);
	    });
	
	    var year_range = [plot_data[0]['x'].getFullYear(), plot_data[plot_data.length - 1]['x'].getFullYear()];
	
	    _.each(annual, function (v, year) {
	        if (year >= year_range[0] && year <= year_range[1]) {
	            var my_f = _.max(v, function (f) {
	                return f[1] / (fractions ? 1 : f[0]);
	            });
	            extents[1] = Math.max(extents[1], my_f[1]);
	        }
	    });
	
	    y.domain([0.0, extents[1] * 1.2]);
	
	    var svg = container.append("svg") //.style("display", "table-cell")
	    .attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
	
	    var legend_area = svg.append("g").attr("transform", "translate(" + (margin.left + font_size * 2.5) + "," + (margin.top + font_size) + ")");
	
	    svg = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	    /* set the domain for the codons */
	
	    var color_scale = d3.scale.category10();
	
	    var plot_types = _.map(plot_data[0]['y'], function (v, k) {
	        return k;
	    });
	
	    plot_types.sort();
	
	    var legend_lines = legend_area.selectAll("g").data(plot_types);
	
	    legend_lines.enter().append("g").attr("class", "annotation-text");
	
	    legend_lines.selectAll("text").data(function (d) {
	        return [d];
	    }).enter().append("text").attr("transform", function (d, i, j) {
	        return "translate(" + rect_size + "," + (rect_size * (plot_types.length - 1 - j) - (rect_size - font_size)) + ")";
	    }).attr("dx", "0.2em").text(function (d) {
	        return d;
	    });
	
	    //console.log (plot_data);
	
	    legend_lines.selectAll("rect").data(function (d) {
	        return [d];
	    }).enter().append("rect").attr("x", 0).attr("y", function (d, i, j) {
	        return rect_size * (plot_types.length - 2 - j);
	    }).attr("width", rect_size).attr("height", rect_size).attr("class", "area").style("fill", function (d, i, j) {
	        return color_scale(d);
	    });
	
	    _.each(plot_types, function (plot_key, idx) {
	
	        var plot_color = color_scale(plot_key);
	
	        var y_accessor = function y_accessor(d) {
	            return d['y'][plot_key];
	        };
	        var year_points = [];
	
	        for (k = year_range[0]; k <= year_range[1]; k++) {
	            if (k in annual) {
	                fraction = annual[k][plot_key];
	                fraction = fraction[1];
	                year_points.push({ 'x': new Date(k, 7, 1), 'y': fraction });
	            }
	        }
	
	        var scaler_per_year = 1000 * 60 * 60 * 24 * 365;
	
	        var lf = linear_fit(year_points.map(function (d) {
	            return [(d['x'] - x.domain()[0]) / scaler_per_year, d['y']];
	        }));
	
	        /*var line = d3.svg.line()
	            .x(function(d) { return x(d['x']); })
	            .y(function(d) { return y(
	            Math.max (0,(d['x'] - x.domain ()[0] )*lf["slope"]/scaler_per_year+lf["intercept"]))
	            ; })
	            .interpolate ("linear");*/
	
	        var line = d3.svg.line().x(function (d) {
	            return x(d['x']);
	        }).y(function (d) {
	            return y(d['y']);
	        }).interpolate("basis");
	
	        svg.append("path").datum(year_points).classed("line", true).style("stroke", plot_color).attr("d", line);
	
	        /*var curve_year = d3.svg.line()
	            .x(function(d) { return x(d['x']); })
	            .y(function(d) { return y(d['y']); })
	            .interpolate ("basis");
	                    svg.append("path")
	              .datum(year_points)
	              .classed ("tracer", true)
	              .style ("stroke", plot_color)
	              .attr("d", curve_year); */
	
	        year_points.forEach(function (d) {
	            svg.append("circle").attr("cx", x(d['x'])).attr("cy", y(d['y'])).attr("r", "5").classed("node", true).style("fill", plot_color).style("stroke", plot_color);
	        });
	
	        year_points.forEach(function (d) {
	            svg.append("text").attr("x", x(d['x']) + 5).attr("y", y(d['y']) + 5).text(d['y']) //.attr ("transform", "rotate (" + 30*(1 - 2*idx) + " " + x(d['x']) + " " + y(d['y']) + ")")
	            .attr("dy", "" + (0.5 - idx) + "em");
	        });
	
	        var curve = d3.svg.area().x(function (d) {
	            return x(d['x']);
	        }).y1(function (d) {
	            return y(y_accessor(d));
	        }).y0(function (d) {
	            return y(0);
	        }).interpolate("line");
	
	        svg.append("path").datum(plot_data).classed("trend", true).style("fill", plot_color).style("stroke", plot_color).attr("d", curve);
	    });
	
	    /* x-axis */
	    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width).attr("dy", "+2.5em").style("text-anchor", "end").text(x_title);
	
	    /* y-axis*/
	    svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text(y_title); // beta - alpha
	
	    /* plot title */
	    /*if (title) {
	        svg.append("text").text(title).style("font-size", "24px").attr("dx", "2em").attr("dy", "-0.1em");
	    }*/
	}
	
	exports.prevalence = hivtrace_render_prevalence;

/***/ }),

/***/ 48:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(39),
	    _ = __webpack_require__(42);
	
	function hivtrace_histogram(graph, histogram_tag, histogram_label) {
	
	  var defaultFloatFormat = d3.format(",.2f");
	  var histogram_w = 300,
	      histogram_h = 300;
	
	  hivtrace_render_histogram(graph["Degrees"]["Distribution"], graph["Degrees"]["fitted"], histogram_w, histogram_h, histogram_tag);
	
	  var label = "Network degree distribution is best described by the <strong>" + graph["Degrees"]["Model"] + "</strong> model, with &rho; of " + defaultFloatFormat(graph["Degrees"]["rho"]);
	
	  if (graph["Degrees"]["rho CI"] != undefined) {
	    label += " (95% CI " + defaultFloatFormat(graph["Degrees"]["rho CI"][0]) + " - " + defaultFloatFormat(graph["Degrees"]["rho CI"][1]) + ")";
	  }
	
	  d3.select(histogram_label).html(label);
	}
	
	function hivtrace_histogram_distances(graph, histogram_tag, histogram_label) {
	
	  var defaultFloatFormat = d3.format(",.3p");
	  var histogram_w = 300,
	      histogram_h = 300;
	
	  var edge_lengths = _.map(graph["Edges"], function (edge) {
	    return edge.length;
	  });
	
	  hivtrace_render_histogram_continuous(edge_lengths, histogram_w, histogram_h, histogram_tag);
	
	  var label = "Genetic distances among linked nodes.";
	  d3.select(histogram_label).html(label);
	}
	
	function hivtrace_render_histogram_continuous(data, w, h, id) {
	
	  var margin = {
	    top: 10,
	    right: 30,
	    bottom: 50,
	    left: 10
	  },
	      width = w - margin.right,
	      height = h - margin.top - margin.bottom;
	
	  var histogram_svg = d3.select(id).selectAll("svg");
	
	  if (histogram_svg) {
	    histogram_svg.remove();
	  }
	
	  if (data.length > 0) {
	
	    var histogram_data = d3.layout.histogram()(data);
	
	    var x = d3.scale.linear().domain(d3.extent(data));
	
	    var y = d3.scale.linear().domain([0, d3.max(_.map(histogram_data, function (b) {
	      return b.y;
	    }))]).range([height, 0]);
	
	    margin.left += 10 * Math.ceil(Math.log10(y.domain()[1]));
	    width -= margin.left;
	    x.range([0, width]);
	
	    var xAxis = d3.svg.axis().scale(x).orient("bottom");
	
	    var yAxis = d3.svg.axis().scale(y).orient("left");
	
	    histogram_data.splice(0, 0, {
	      'x': x.domain()[0],
	      'y': 0,
	      'dx': 0
	    });
	    histogram_data.splice(histogram_data.length, 0, {
	      'x': x.domain()[1],
	      'y': 0,
	      'dx': 0
	    });
	
	    histogram_svg = d3.select(id).insert("svg", ".histogram-label").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").datum(histogram_data);
	
	    var histogram_line = d3.svg.line().x(function (d) {
	      return x(d.x + d.dx);
	    }).y(function (d) {
	      return y(d.y);
	    }).interpolate("step-before");
	
	    histogram_svg.selectAll("path").remove();
	    histogram_svg.append("path").attr("d", function (d) {
	      return histogram_line(d) + "Z";
	    }).attr("class", "histogram");
	
	    var x_axis = histogram_svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
	
	    x_axis.selectAll("text").attr("transform", "rotate(45)").attr("dx", "1em").attr("dy", "0.5em");
	
	    var y_axis = histogram_svg.append("g").attr("class", "y axis")
	    //.attr("transform", "translate(0," + height + ")")
	    .call(yAxis);
	  }
	}
	
	function hivtrace_render_histogram(counts, fit, w, h, id) {
	
	  var margin = {
	    top: 10,
	    right: 30,
	    bottom: 50,
	    left: 30
	  },
	      width = w - margin.left - margin.right,
	      height = h - margin.top - margin.bottom;
	
	  var x = d3.scale.linear().domain([0, counts.length + 1]).range([0, width]);
	
	  var y = d3.scale.log().domain([1, d3.max(counts)]).range([height, 0]);
	
	  var total = d3.sum(counts);
	
	  var xAxis = d3.svg.axis().scale(x).orient("bottom");
	
	  var histogram_svg = d3.select(id).selectAll("svg");
	
	  if (histogram_svg) {
	    histogram_svg.remove();
	  }
	
	  var data_to_plot = counts.map(function (d, i) {
	    return {
	      'x': i + 1,
	      'y': d + 1
	    };
	  });
	  data_to_plot.push({
	    'x': counts.length + 1,
	    'y': 1
	  });
	  data_to_plot.push({
	    'x': 0,
	    'y': 1
	  });
	  data_to_plot.push({
	    'x': 0,
	    'y': counts[0] + 1
	  });
	
	  histogram_svg = d3.select(id).insert("svg", ".histogram-label").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").datum(data_to_plot);
	
	  var histogram_line = d3.svg.line().x(function (d) {
	    return x(d.x);
	  }).y(function (d) {
	    return y(d.y);
	  }).interpolate("step-before");
	
	  histogram_svg.selectAll("path").remove();
	  histogram_svg.append("path").attr("d", function (d) {
	    return histogram_line(d) + "Z";
	  }).attr("class", "histogram");
	
	  if (fit) {
	    var fit_line = d3.svg.line().interpolate("linear").x(function (d, i) {
	      return x(i + 1) + (x(i + 1) - x(i)) / 2;
	    }).y(function (d) {
	      return y(1 + d * total);
	    });
	    histogram_svg.append("path").datum(fit).attr("class", "line").attr("d", function (d) {
	      return fit_line(d);
	    });
	  }
	
	  var x_axis = histogram_svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
	
	  x_axis.selectAll("text").attr("transform", "rotate(45)").attr("dx", "1em").attr("dy", "0.5em");
	}
	
	exports.histogram = hivtrace_histogram;
	exports.histogramDistances = hivtrace_histogram_distances;

/***/ })

});
//# sourceMappingURL=hivtrace.js.map