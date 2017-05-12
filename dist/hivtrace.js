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
	
	var hyphyvision = __webpack_require__(30);
	var hivtrace = __webpack_require__(31);
	
	// Create new hyphy-vision export
	window.hivtrace = hivtrace;
	window.hyphyvision = hyphyvision;
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
/***/ (function(module, exports) {

	webpackJsonp([0],{
	
	/***/ 0:
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = __webpack_require__(1);
	
	
	/***/ },
	
	/***/ 1:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function($) {'use strict';
		
		var _bootstrap = __webpack_require__(5);
		
		var _bootstrap2 = _interopRequireDefault(_bootstrap);
		
		function _interopRequireDefault(obj) {
		  return obj && obj.__esModule ? obj : { default: obj };
		}
		
		window.$ = window.JQuery = $;
		
		__webpack_require__(14);
		__webpack_require__(22);
		
		__webpack_require__(24);
		__webpack_require__(37);
		
		// Bundle exports under hyphyvision
		__webpack_require__(42);
		
		var absrel = __webpack_require__(203);
		var busted = __webpack_require__(221);
		var relax = __webpack_require__(222);
		
		// Create new hyphy-vision export
		window.absrel = absrel;
		window.busted = busted;
		window.relax = relax;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))
	
	/***/ },
	
	/***/ 5:
	/***/ function(module, exports) {
	
		// removed by extract-text-webpack-plugin
	
	/***/ },
	
	/***/ 14:
	/***/ function(module, exports) {
	
		// removed by extract-text-webpack-plugin
	
	/***/ },
	
	/***/ 22:
	/***/ function(module, exports) {
	
		// removed by extract-text-webpack-plugin
	
	/***/ },
	
	/***/ 37:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function($, d3, _, jQuery) {'use strict';
		
		var root = undefined;
		var datamonkey = function datamonkey() {};
		
		if (true) {
		  if (typeof module !== 'undefined' && module.exports) {
		    exports = module.exports = datamonkey;
		  }
		  exports.datamonkey = datamonkey;
		} else {
		  root.datamonkey = datamonkey;
		}
		
		datamonkey.errorModal = function (msg) {
		  $('#modal-error-msg').text(msg);
		  $('#errorModal').modal();
		};
		
		datamonkey.export_csv_button = function (data) {
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
		
		datamonkey.save_image = function (type, container) {
		
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
		
		  if (type == "png") {
		    convert_svg_to_png(image_string);
		  } else {
		    var pom = document.createElement('a');
		    pom.setAttribute('download', 'image.svg');
		    pom.setAttribute('href', image_string);
		    $("body").append(pom);
		    pom.click();
		    pom.remove();
		  }
		};
		
		datamonkey.jobQueue = function (container) {
		
		  // Load template
		  _.templateSettings = {
		    evaluate: /\{\%(.+?)\%\}/g,
		    interpolate: /\{\{(.+?)\}\}/g,
		    variable: "rc"
		  };
		
		  d3.json('/jobqueue', function (data) {
		
		    var job_queue = _.template($("script.job-queue").html());
		
		    var job_queue_html = job_queue(data);
		    $("#job-queue-panel").find('table').remove();
		    $(container).append(job_queue_html);
		  });
		};
		
		datamonkey.status_check = function () {
		
		  // Check if there are any status checkers on the page
		  if ($(".status-checker").length) {
		    // Check health status and report back to element
		    var url = "/clusterhealth";
		    d3.json(url, function (data) {
		      // Add appropriate class based on result
		      if (data.successful_connection) {
		        d3.select('.status-checker').classed({ 'status-healthy': true, 'status-troubled': false });
		        $(".status-checker").attr("title", 'Cluster Status : Healthy');
		      } else {
		        d3.select('.status-checker').classed({ 'status-healthy': false, 'status-troubled': true });
		        $(".status-checker").attr("title", 'Cluster Status : Troubled; ' + data.msg.description);
		      }
		    });
		  }
		};
		
		datamonkey.validate_date = function () {
		
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
		
		$(document).ready(function () {
		  $(function () {
		    $('[data-toggle="tooltip"]').tooltip();
		  });
		  $('#datamonkey-header').collapse();
		
		  var initial_padding = $("body").css("padding-top");
		
		  $("#collapse_nav_bar").on("click", function (e) {
		    $('#datamonkey-header').collapse('toggle');
		    $(this).find("i").toggleClass("fa-times-circle fa-eye");
		    var new_padding = $("body").css("padding-top") == initial_padding ? "5px" : initial_padding;
		    d3.select("body").transition().style("padding-top", new_padding);
		  });
		});
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2), __webpack_require__(38), __webpack_require__(41), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 42:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, $, _) {"use strict";
		
		__webpack_require__(43);
		__webpack_require__(201);
		__webpack_require__(202);
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		
		var SLAC = React.createClass({
		    displayName: "SLAC",
		
		
		    float_format: d3.format(".2f"),
		
		    dm_loadFromServer: function dm_loadFromServer() {
		        /* 20160721 SLKP: prefixing all custom (i.e. not defined by REACT) with dm_
		           to make it easier to recognize scoping immediately */
		
		        var self = this;
		
		        d3.json(self.props.url, function (request_error, data) {
		
		            if (!data) {
		                var error_message_text = request_error.status == 404 ? self.props.url + " could not be loaded" : request_error.statusText;
		                self.setState({ error_message: error_message_text });
		            } else {
		                self.dm_initializeFromJSON(data);
		            }
		        });
		    },
		
		    dm_initializeFromJSON: function dm_initializeFromJSON(data) {
		        this.setState({ analysis_results: data });
		    },
		
		    getDefaultProps: function getDefaultProps() {
		        /* default properties for the component */
		
		        return {
		            url: "#"
		        };
		    },
		
		    getInitialState: function getInitialState() {
		
		        return {
		            analysis_results: null,
		            error_message: null,
		            pValue: 0.1
		        };
		    },
		
		    componentWillMount: function componentWillMount() {
		        this.dm_loadFromServer();
		        this.dm_setEvents();
		    },
		
		    dm_setEvents: function dm_setEvents() {
		
		        var self = this;
		
		        $("#datamonkey-json-file").on("change", function (e) {
		
		            var files = e.target.files; // FileList object
		
		            if (files.length == 1) {
		                var f = files[0];
		                var reader = new FileReader();
		
		                reader.onload = function (theFile) {
		                    return function (e) {
		                        try {
		                            self.dm_initializeFromJSON(JSON.parse(this.result));
		                        } catch (error) {
		                            self.setState({ error_message: error.toString() });
		                        }
		                    };
		                }(f);
		
		                reader.readAsText(f);
		            }
		
		            $("#datamonkey-json-file-toggle").dropdown("toggle");
		        });
		    },
		
		    dm_adjustPvalue: function dm_adjustPvalue(event) {
		        this.setState({ pValue: parseFloat(event.target.value) });
		    },
		
		    render: function render() {
		
		        var self = this;
		
		        if (self.state.error_message) {
		            return React.createElement(
		                "div",
		                { id: "datamonkey-error", className: "alert alert-danger alert-dismissible", role: "alert" },
		                React.createElement(
		                    "button",
		                    { type: "button", className: "close", "data-dismiss": "alert", "aria-label": "Close" },
		                    React.createElement(
		                        "span",
		                        { "aria-hidden": "true" },
		                        "\xD7"
		                    )
		                ),
		                React.createElement(
		                    "strong",
		                    null,
		                    self.state.error_message
		                ),
		                " ",
		                React.createElement("span", { id: "datamonkey-error-text" })
		            );
		        }
		
		        if (self.state.analysis_results) {
		
		            return React.createElement(
		                "div",
		                { className: "tab-content" },
		                React.createElement(
		                    "div",
		                    { className: "tab-pane", id: "summary_tab" },
		                    React.createElement(
		                        "div",
		                        { className: "row" },
		                        React.createElement(
		                            "div",
		                            { id: "summary-div", className: "col-md-12" },
		                            React.createElement(SLACBanner, { analysis_results: self.state.analysis_results, pValue: self.state.pValue, pAdjuster: _.bind(self.dm_adjustPvalue, self) })
		                        )
		                    ),
		                    React.createElement(
		                        "div",
		                        { className: "row hidden-print" },
		                        React.createElement(
		                            "div",
		                            { id: "datamonkey-slac-tree-summary", className: "col-lg-4 col-md-6 col-sm-12" },
		                            React.createElement(
		                                "div",
		                                { className: "panel panel-default" },
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-heading" },
		                                    React.createElement(
		                                        "h3",
		                                        { className: "panel-title" },
		                                        React.createElement("i", { className: "fa fa-puzzle-piece" }),
		                                        " Partition information"
		                                    )
		                                ),
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-body" },
		                                    React.createElement(
		                                        "small",
		                                        null,
		                                        React.createElement(DatamonkeyPartitionTable, {
		                                            pValue: self.state.pValue,
		                                            trees: self.state.analysis_results.trees,
		                                            partitions: self.state.analysis_results.partitions,
		                                            branchAttributes: self.state.analysis_results['branch attributes'],
		                                            siteResults: self.state.analysis_results.MLE,
		                                            accessorPositive: function accessorPositive(json, partition) {
		                                                return _.map(json["content"][partition]["by-site"]["AVERAGED"], function (v) {
		                                                    return v[8];
		                                                });
		                                            },
		                                            accessorNegative: function accessorNegative(json, partition) {
		                                                return _.map(json["content"][partition]["by-site"]["AVERAGED"], function (v) {
		                                                    return v[9];
		                                                });
		                                            }
		                                        })
		                                    )
		                                )
		                            )
		                        ),
		                        React.createElement(
		                            "div",
		                            { id: "datamonkey-slac-model-fits", className: "col-lg-5 col-md-6 col-sm-12" },
		                            React.createElement(
		                                "div",
		                                { className: "panel panel-default" },
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-heading" },
		                                    React.createElement(
		                                        "h3",
		                                        { className: "panel-title" },
		                                        React.createElement("i", { className: "fa fa-table" }),
		                                        " Model fits"
		                                    )
		                                ),
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-body" },
		                                    React.createElement(
		                                        "small",
		                                        null,
		                                        React.createElement(DatamonkeyModelTable, { fits: self.state.analysis_results.fits })
		                                    )
		                                )
		                            )
		                        ),
		                        React.createElement(
		                            "div",
		                            { id: "datamonkey-slac-timers", className: "col-lg-3 col-md-3 col-sm-12" },
		                            React.createElement(
		                                "div",
		                                { className: "panel panel-default" },
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-heading" },
		                                    React.createElement(
		                                        "h3",
		                                        { className: "panel-title" },
		                                        React.createElement("i", { className: "fa fa-clock-o" }),
		                                        " Execution time"
		                                    )
		                                ),
		                                React.createElement(
		                                    "div",
		                                    { className: "panel-body" },
		                                    React.createElement(
		                                        "small",
		                                        null,
		                                        React.createElement(DatamonkeyTimersTable, { timers: self.state.analysis_results.timers, totalTime: "Total time" })
		                                    )
		                                )
		                            )
		                        )
		                    )
		                ),
		                React.createElement(
		                    "div",
		                    { className: "tab-pane active", id: "sites_tab" },
		                    React.createElement(
		                        "div",
		                        { className: "row" },
		                        React.createElement(
		                            "div",
		                            { id: "summary-div", className: "col-md-12" },
		                            React.createElement(SLACSites, {
		                                headers: self.state.analysis_results.MLE.headers,
		                                mle: datamonkey.helpers.map(datamonkey.helpers.filter(self.state.analysis_results.MLE.content, function (value, key) {
		                                    return _.has(value, "by-site");
		                                }), function (value, key) {
		                                    return value["by-site"];
		                                }),
		                                sample25: self.state.analysis_results["sample-2.5"],
		                                sampleMedian: self.state.analysis_results["sample-median"],
		                                sample975: self.state.analysis_results["sample-97.5"],
		                                partitionSites: self.state.analysis_results.partitions
		                            })
		                        )
		                    )
		                ),
		                React.createElement("div", { className: "tab-pane", id: "tree_tab" })
		            );
		        }
		        return null;
		    }
		
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_slac(url, element) {
		    ReactDOM.render(React.createElement(SLAC, { url: url }), document.getElementById(element));
		}
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(2), __webpack_require__(41)))
	
	/***/ },
	
	/***/ 43:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(_, d3) {'use strict';
		
		var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		
		var DatamonkeyTableRow = React.createClass({
		    displayName: 'DatamonkeyTableRow',
		
		    /**
		        A single table row
		    
		        *rowData* is an array of cells
		            each cell can be one of
		                1. string: simply render the text as shown
		                2. object: a polymorphic case; can be rendered directly (if the object is a valid react.js element)
		                   or via a transformation of the value associated with the key 'value'
		    
		                   supported keys
		                    2.1. 'value' : the value to use to generate cell context
		                    2.2. 'format' : the function (returning something react.js can render directly) that will be called
		                    to transform 'value' into the object to be rendered
		                    2.3. 'span' : colSpan attribute
		                    2.4. 'style': CSS style attributes (JSX specification, i.e. {margin-top: '1em'} and not a string)
		                    2.5. 'classes': CSS classes to apply to the cell
		                    2.6. 'abbr': wrap cell value in <abbr> tags
		    
		                3. array: directly render array elements in the cell (must be renderable to react.js; note that plain
		                text elements will be wrapped in "span" which is not allowed to nest in <th/td>
		    
		    
		        *header* is a bool indicating whether the header is a header row (th cells) or a regular row (td cells)
		    */
		
		    /*propTypes: {
		     rowData: React.PropTypes.arrayOf (React.PropTypes.oneOfType ([React.PropTypes.string,React.PropTypes.number,React.PropTypes.object,React.PropTypes.array])).isRequired,
		     header:  React.PropTypes.bool,
		    },*/
		
		    dm_compareTwoValues: function dm_compareTwoValues(a, b) {
		        /**
		            compare objects by iterating over keys
		        */
		
		        var myType = typeof a === 'undefined' ? 'undefined' : _typeof(a),
		            self = this;
		
		        if (myType == (typeof b === 'undefined' ? 'undefined' : _typeof(b))) {
		            if (myType == "string" || myType == "number") {
		                return a == b ? 1 : 0;
		            }
		
		            if (_.isArray(a) && _.isArray(b)) {
		
		                if (a.length != b.length) {
		                    return 0;
		                }
		
		                var not_compared = 0;
		                var result = _.every(a, function (c, i) {
		                    var comp = self.dm_compareTwoValues(c, b[i]);if (comp < 0) {
		                        not_compared = comp;return false;
		                    }return comp == 1;
		                });
		
		                if (not_compared < 0) {
		                    return not_compared;
		                }
		
		                return result ? 1 : 0;
		            }
		
		            return -2;
		        }
		        return -1;
		    },
		
		    dm_log100times: _.before(100, function (v) {
		        console.log(v);
		        return 0;
		    }),
		
		    shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
		
		        var self = this;
		
		        if (this.props.header !== nextProps.header) {
		            return true;
		        }
		
		        var result = _.some(this.props.rowData, function (value, index) {
		            /** TO DO
		                check for format and other field equality
		            */
		            if (value === nextProps.rowData[index]) {
		                return false;
		            }
		
		            var compare = self.dm_compareTwoValues(value, nextProps.rowData[index]);
		            if (compare >= 0) {
		                return compare == 0;
		            }
		
		            if (compare == -2) {
		                if (_.has(value, "value") && _.has(nextProps.rowData[index], "value")) {
		                    return self.dm_compareTwoValues(value.value, nextProps.rowData[index].value) != 1;
		                }
		            }
		
		            return true;
		        });
		
		        if (result) {
		            this.dm_log100times(["Old", this.props.rowData, "New", nextProps.rowData]);
		        }
		
		        return result;
		    },
		
		    render: function render() {
		        return React.createElement(
		            'tr',
		            null,
		            this.props.rowData.map(_.bind(function (cell, index) {
		
		                var value = _.has(cell, "value") ? cell.value : cell;
		
		                if (_.isArray(value)) {
		                    if (!_.has(cell, "format")) {
		                        return value;
		                    }
		                } else {
		                    if (_.isObject(value)) {
		                        if (!React.isValidElement(value)) {
		                            return null;
		                        }
		                    }
		                }
		
		                if (_.has(cell, "format")) {
		                    value = cell.format(value);
		                }
		
		                if (_.has(cell, "abbr")) {
		                    value = React.createElement(
		                        'abbr',
		                        { title: cell.abbr },
		                        value
		                    );
		                }
		
		                var cellProps = { key: index };
		
		                if (_.has(cell, "span")) {
		                    cellProps["colSpan"] = cell.span;
		                }
		
		                if (_.has(cell, "style")) {
		                    cellProps["style"] = cell.style;
		                }
		
		                if (_.has(cell, "classes")) {
		                    cellProps["className"] = cell.classes;
		                }
		
		                return React.createElement(this.props.header ? "th" : "td", cellProps, value);
		            }, this))
		        );
		    }
		});
		
		var DatamonkeyTable = React.createClass({
		    displayName: 'DatamonkeyTable',
		
		    /**
		        A table composed of rows
		            *headerData* -- an array of cells (see DatamonkeyTableRow) to render as the header
		            *bodyData* -- an array of arrays of cells (rows) to render
		            *classes* -- CSS classes to apply to the table element
		    */
		
		    /*propTypes: {
		        headerData: React.PropTypes.array,
		        bodyData: React.PropTypes.arrayOf (React.PropTypes.array),
		    },*/
		
		    getDefaultProps: function getDefaultProps() {
		        return { classes: "table table-condensed table-hover",
		            rowHash: null,
		            sortableColumns: new Object(null),
		            initialSort: null
		        };
		    },
		
		    getInitialState: function getInitialState() {
		        return { sortedOn: this.props.initialSort };
		    },
		
		    render: function render() {
		        var children = [];
		
		        if (this.props.headerData) {
		            if (_.isArray(this.props.headerData[0])) {
		                // multiple rows
		                children.push(React.createElement(
		                    'thead',
		                    { key: 0 },
		                    _.map(this.props.headerData, function (row, index) {
		                        return React.createElement(DatamonkeyTableRow, { rowData: row, header: true, key: index });
		                    })
		                ));
		            } else {
		                children.push(React.createElement(
		                    'thead',
		                    { key: 0 },
		                    React.createElement(DatamonkeyTableRow, { rowData: this.props.headerData, header: true })
		                ));
		            }
		        }
		
		        children.push(React.createElement("tbody", { key: 1 }, _.map(this.props.bodyData, _.bind(function (componentData, index) {
		            return React.createElement(DatamonkeyTableRow, { rowData: componentData, key: this.props.rowHash ? this.props.rowHash(componentData) : index, header: false });
		        }, this))));
		
		        return React.createElement("table", { className: this.props.classes }, children);
		    }
		});
		
		var DatamonkeyRateDistributionTable = React.createClass({
		    displayName: 'DatamonkeyRateDistributionTable',
		
		
		    /** render a rate distribution table from JSON formatted like this
		    {
		         "non-synonymous/synonymous rate ratio for *background*":[ // name of distribution
		          [0.1701428265961598, 1] // distribution points (rate, weight)
		          ],
		         "non-synonymous/synonymous rate ratio for *test*":[
		          [0.1452686330406915, 1]
		          ]
		    }
		     */
		
		    propTypes: {
		        distribution: React.PropTypes.object.isRequired
		    },
		
		    dm_formatterRate: d3.format(".3r"),
		    dm_formatterProp: d3.format(".3p"),
		
		    dm_createDistributionTable: function dm_createDistributionTable(jsonRates) {
		        var rowData = [];
		        var self = this;
		        _.each(jsonRates, function (value, key) {
		            rowData.push([{ value: key, span: 3, classes: "info" }]);
		            _.each(value, function (rate, index) {
		                rowData.push([{ value: rate[1], format: self.dm_formatterProp }, '@', { value: rate[0], format: self.dm_formatterRate }]);
		            });
		        });
		        return rowData;
		    },
		
		    render: function render() {
		        return React.createElement(DatamonkeyTable, { bodyData: this.dm_createDistributionTable(this.props.distribution), classes: "table table-condensed" });
		    }
		
		});
		
		var DatamonkeyPartitionTable = React.createClass({
		    displayName: 'DatamonkeyPartitionTable',
		
		
		    dm_formatterFloat: d3.format(".3r"),
		    dm_formatterProp: d3.format(".3p"),
		
		    propTypes: {
		        trees: React.PropTypes.object.isRequired,
		        partitions: React.PropTypes.object.isRequired,
		        branchAttributes: React.PropTypes.object.isRequired,
		        siteResults: React.PropTypes.object.isRequired,
		        accessorNegative: React.PropTypes.func.isRequired,
		        accessorPositive: React.PropTypes.func.isRequired,
		        pValue: React.PropTypes.number.isRequired
		    },
		
		    dm_computePartitionInformation: function dm_computePartitionInformation(trees, partitions, attributes, pValue) {
		
		        var partitionKeys = _.sortBy(_.keys(partitions), function (v) {
		            return v;
		        }),
		            matchingKey = null,
		            self = this;
		
		        var extractBranchLength = this.props.extractOn || _.find(attributes.attributes, function (value, key) {
		            matchingKey = key;return value["attribute type"] == "branch length";
		        });
		        if (matchingKey) {
		            extractBranchLength = matchingKey;
		        }
		
		        return _.map(partitionKeys, function (key, index) {
		            var treeBranches = trees.tested[key],
		                tested = {};
		
		            _.each(treeBranches, function (value, key) {
		                if (value == "test") tested[key] = 1;
		            });
		
		            var testedLength = extractBranchLength ? datamonkey.helpers.sum(attributes[key], function (v, k) {
		                if (tested[k.toUpperCase()]) {
		                    return v[extractBranchLength];
		                }return 0;
		            }) : 0;
		            var totalLength = extractBranchLength ? datamonkey.helpers.sum(attributes[key], function (v) {
		                return v[extractBranchLength] || 0;
		            }) : 0; // || 0 is to resolve root node missing length
		
		
		            return _.map([index + 1, // 1-based partition index
		            partitions[key].coverage[0].length, // number of sites in the partition
		            _.size(tested), // tested branches
		            _.keys(treeBranches).length, // total branches
		            testedLength, testedLength / totalLength, totalLength, _.filter(self.props.accessorPositive(self.props.siteResults, key), function (p) {
		                return p <= pValue;
		            }).length, _.filter(self.props.accessorNegative(self.props.siteResults, key), function (p) {
		                return p <= pValue;
		            }).length], function (cell, index) {
		                if (index > 1) {
		                    var attributedCell = { value: cell,
		                        style: { textAlign: 'center' } };
		
		                    if (index == 4 || index == 6) {
		                        _.extend(attributedCell, { 'format': self.dm_formatterFloat });
		                    }
		                    if (index == 5) {
		                        _.extend(attributedCell, { 'format': self.dm_formatterProp });
		                    }
		
		                    return attributedCell;
		                }
		                return cell;
		            });
		        });
		    },
		
		    dm_makeHeaderRow: function dm_makeHeaderRow(pValue) {
		        return [_.map(["Partition", "Sites", "Branches", "Branch Length", "Selected at p" + String.fromCharCode(parseInt("2264", 16)) + pValue], function (d, i) {
		            return _.extend({ value: d, style: { borderBottom: 0, textAlign: i > 1 ? 'center' : 'left' } }, i > 1 ? { 'span': i == 3 ? 3 : 2 } : {});
		        }), _.map(["", "", "Tested", "Total", "Tested", "% of total", "Total", "Positive", "Negative"], function (d, i) {
		            return { value: d, style: { borderTop: 0, textAlign: i > 1 ? 'center' : 'left' } };
		        })];
		    },
		
		    getInitialState: function getInitialState() {
		        return {
		            header: this.dm_makeHeaderRow(this.props.pValue),
		            rows: this.dm_computePartitionInformation(this.props.trees, this.props.partitions, this.props.branchAttributes, this.props.pValue)
		        };
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		        this.setState({
		            header: this.dm_makeHeaderRow(nextProps.pValue),
		            rows: this.dm_computePartitionInformation(nextProps.trees, nextProps.partitions, nextProps.branchAttributes, nextProps.pValue)
		        });
		    },
		
		    render: function render() {
		        return React.createElement(
		            'div',
		            { className: 'table-responsive' },
		            React.createElement(DatamonkeyTable, { headerData: this.state.header, bodyData: this.state.rows })
		        );
		    }
		});
		
		var DatamonkeyModelTable = React.createClass({
		    displayName: 'DatamonkeyModelTable',
		
		
		    /** render a model fit table from a JSON object with entries like this
		            "Global MG94xREV":{ // model name
		               "log likelihood":-5453.527975908821,
		               "parameters":131,
		               "AIC-c":11172.05569160427,
		               "rate distributions":{
		                 "non-synonymous/synonymous rate ratio for *background*":[
		                  [0.1701428265961598, 1]
		                  ],
		                 "non-synonymous/synonymous rate ratio for *test*":[
		                  [0.1452686330406915, 1]
		                  ]
		                },
		               "display order":0
		              }
		       dm_supportedColumns controls which keys from model specification will be consumed;
		          * 'value' is the cell specification to be consumed by DatamonkeyTableRow
		          * 'order' is the column order in the resulting table (relative; doesn't have to be sequential)
		          * 'display_format' is a formatting function for cell entries
		          * 'transform' is a data trasformation function for cell entries
		     */
		
		    dm_numberFormatter: d3.format(".2f"),
		
		    dm_supportedColumns: { 'log likelihood': { order: 2,
		            value: { "value": "log L", "abbr": "log likelihood" },
		            display_format: d3.format(".2f") },
		        'parameters': { order: 3,
		            value: "Parameters" },
		        'AIC-c': { order: 1,
		            value: { value: React.createElement('span', null, ['AIC', React.createElement(
		                    'sub',
		                    { key: '0' },
		                    'C'
		                )]),
		                abbr: "Small-sample corrected Akaike Information Score" },
		            display_format: d3.format(".2f") },
		        'rate distributions': { order: 4,
		            value: "Rate distributions",
		            transform: function transform(value) {
		                return React.createElement(DatamonkeyRateDistributionTable, { distribution: value });
		            } }
		    },
		
		    propTypes: {
		        fits: React.PropTypes.object.isRequired
		    },
		
		    getDefaultProps: function getDefaultProps() {
		        return {
		            orderOn: "display order"
		        };
		    },
		
		    dm_extractFitsTable: function dm_extractFitsTable(jsonTable) {
		        var modelList = [];
		        var columnMap = null;
		        var columnMapIterator = [];
		        var valueFormat = {};
		        var valueTransform = {};
		        var rowData = [];
		        var self = this;
		
		        _.each(jsonTable, function (value, key) {
		            if (!columnMap) {
		                columnMap = {};
		                _.each(value, function (cellValue, cellName) {
		                    if (self.dm_supportedColumns[cellName]) {
		                        columnMap[cellName] = self.dm_supportedColumns[cellName];
		                        columnMapIterator[columnMap[cellName].order] = cellName;
		                        valueFormat[cellName] = self.dm_supportedColumns[cellName]["display_format"];
		                        if (_.isFunction(self.dm_supportedColumns[cellName]["transform"])) {
		                            valueTransform[cellName] = self.dm_supportedColumns[cellName]["transform"];
		                        }
		                    }
		                });
		                columnMapIterator = _.filter(columnMapIterator, function (v) {
		                    return v;
		                });
		            }
		
		            var thisRow = [{ value: key, style: { fontVariant: "small-caps" } }];
		
		            _.each(columnMapIterator, function (tag) {
		
		                var myValue = valueTransform[tag] ? valueTransform[tag](value[tag]) : value[tag];
		
		                if (valueFormat[tag]) {
		                    thisRow.push({ 'value': myValue, 'format': valueFormat[tag] });
		                } else {
		                    thisRow.push(myValue);
		                }
		            });
		
		            rowData.push([thisRow, _.isNumber(value[self.props.orderOn]) ? value[self.props.orderOn] : rowData.length]);
		        });
		
		        return { 'data': _.map(_.sortBy(rowData, function (value) {
		                return value[1];
		            }), function (r) {
		                return r[0];
		            }),
		            'columns': _.map(columnMapIterator, function (tag) {
		                return columnMap[tag].value;
		            }) };
		    },
		
		    dm_makeHeaderRow: function dm_makeHeaderRow(columnMap) {
		        var headerRow = ['Model'];
		        _.each(columnMap, function (v) {
		            headerRow.push(v);
		        });
		        return headerRow;
		    },
		
		    getInitialState: function getInitialState() {
		
		        var tableInfo = this.dm_extractFitsTable(this.props.fits);
		
		        return {
		            header: this.dm_makeHeaderRow(tableInfo.columns),
		            rows: tableInfo.data,
		            caption: null
		        };
		    },
		
		    render: function render() {
		        return React.createElement(
		            'div',
		            { className: 'table-responsive' },
		            React.createElement(DatamonkeyTable, { headerData: this.state.header, bodyData: this.state.rows })
		        );
		    }
		});
		
		var DatamonkeyTimersTable = React.createClass({
		    displayName: 'DatamonkeyTimersTable',
		
		
		    dm_percentageFormatter: d3.format(".2%"),
		
		    propTypes: {
		        timers: React.PropTypes.object.isRequired
		    },
		
		    dm_formatSeconds: function dm_formatSeconds(seconds) {
		
		        var fields = [~~(seconds / 3600), ~~(seconds % 3600 / 60), seconds % 60];
		
		        return _.map(fields, function (d) {
		            return d < 10 ? "0" + d : "" + d;
		        }).join(':');
		    },
		
		    dm_extractTimerTable: function dm_extractTimerTable(jsonTable) {
		        var totalTime = 0.,
		            formattedRows = _.map(jsonTable, _.bind(function (value, key) {
		            if (this.props.totalTime) {
		                if (key == this.props.totalTime) {
		                    totalTime = value['timer'];
		                }
		            } else {
		                totalTime += value['timer'];
		            }
		            return [key, value['timer'], value['order']];
		        }, this));
		
		        formattedRows = _.sortBy(formattedRows, function (row) {
		            return row[2];
		        });
		
		        formattedRows = _.map(formattedRows, _.bind(function (row) {
		            var fraction = null;
		            if (this.props.totalTime === null || this.props.totalTime != row[0]) {
		                row[2] = { "value": row[1] / totalTime, "format": this.dm_percentageFormatter };
		            } else {
		                row[2] = "";
		            }
		            row[1] = this.dm_formatSeconds(row[1]);
		            return row;
		        }, this));
		
		        return formattedRows;
		    },
		
		    dm_makeHeaderRow: function dm_makeHeaderRow() {
		        return ['Task', 'Time', '%'];
		    },
		
		    getInitialState: function getInitialState() {
		
		        return {
		            header: this.dm_makeHeaderRow(),
		            rows: this.dm_extractTimerTable(this.props.timers),
		            caption: null
		        };
		    },
		
		    render: function render() {
		        return React.createElement(DatamonkeyTable, { headerData: this.state.header, bodyData: this.state.rows });
		    }
		});
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(41), __webpack_require__(38)))
	
	/***/ },
	
	/***/ 201:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _) {'use strict';
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		
		var SLACSites = React.createClass({
		    displayName: 'SLACSites',
		
		    propTypes: {
		        headers: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string)).isRequired,
		        mle: React.PropTypes.object.isRequired,
		        sample25: React.PropTypes.object,
		        sampleMedian: React.PropTypes.object,
		        sample975: React.PropTypes.object,
		        initialAmbigHandling: React.PropTypes.string.isRequired,
		        partitionSites: React.PropTypes.object.isRequired
		    },
		
		    getInitialState: function getInitialState() {
		        var canDoCI = this.props.sample25 && this.props.sampleMedian && this.props.sample975;
		
		        return {
		
		            ambigOptions: this.dm_AmbigOptions(this.props),
		            ambigHandling: this.props.initialAmbigHandling,
		            filters: new Object(null),
		            showIntervals: canDoCI,
		            hasCI: canDoCI
		        };
		    },
		
		    getDefaultProps: function getDefaultProps() {
		
		        return {
		            sample25: null,
		            sampleMedian: null,
		            sample975: null,
		            initialAmbigHandling: "RESOLVED"
		        };
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		        this.setState({
		
		            ambigOptions: this.dm_AmbigOptions(nextProps),
		            ambigHandling: nextProps.initialAmbigHandling
		        });
		    },
		
		    dm_formatNumber: d3.format(".3r"),
		    dm_formatNumberShort: d3.format(".2r"),
		
		    dm_log10times: _.before(10, function (v) {
		        console.log(v);
		        return 0;
		    }),
		
		    dm_formatInterval: function dm_formatInterval(values) {
		        //this.dm_log10times (values);
		
		        return this.dm_formatNumber(values[0]) + " / " + this.dm_formatNumber(values[2]) + " [" + this.dm_formatNumber(values[1]) + " : " + this.dm_formatNumber(values[3]) + "]";
		    },
		
		    dm_AmbigOptions: function dm_AmbigOptions(theseProps) {
		        return _.keys(theseProps.mle[0]);
		    },
		
		    dm_changeAmbig: function dm_changeAmbig(event) {
		
		        this.setState({
		            ambigHandling: event.target.value
		        });
		    },
		
		    dm_toggleIntervals: function dm_toggleIntervals(event) {
		        this.setState({
		            showIntervals: !this.state.showIntervals
		        });
		    },
		
		    dm_toggleVariableFilter: function dm_toggleVariableFilter(event) {
		
		        var filterState = new Object(null);
		        _.extend(filterState, this.state.filters);
		        filterState["variable"] = this.state.filters["variable"] == "on" ? "off" : "on";
		        this.setState({ filters: filterState });
		    },
		
		    dm_makeFilterFunction: function dm_makeFilterFunction() {
		
		        var filterFunction = null;
		
		        _.each(this.state.filters, function (value, key) {
		            var composeFunction = null;
		
		            switch (key) {
		                case "variable":
		                    {
		                        if (value == "on") {
		                            composeFunction = function composeFunction(f, partitionIndex, index, site, siteData) {
		                                return (!f || f(partitionIndex, index, site, siteData)) && siteData[2] + siteData[3] > 0;
		                            };
		                        }
		                        break;
		                    }
		            }
		
		            if (composeFunction) {
		                filterFunction = _.wrap(filterFunction, composeFunction);
		            }
		        });
		
		        return filterFunction;
		    },
		
		    dm_makeHeaderRow: function dm_makeHeaderRow() {
		
		        var headers = ['Partition', 'Site'],
		            doCI = this.state.showIntervals;
		
		        if (doCI) {
		            var secondRow = ['', ''];
		
		            _.each(this.props.headers, function (value) {
		                headers.push({ value: value[0], abbr: value[1], span: 4, style: { textAlign: 'center' } });
		                secondRow.push('MLE');
		                secondRow.push('Med');
		                secondRow.push('2.5%');
		                secondRow.push('97.5%');
		            });
		            return [headers, secondRow];
		        } else {
		
		            _.each(this.props.headers, function (value) {
		                headers.push({ value: value[0], abbr: value[1] });
		            });
		        }
		        return headers;
		    },
		
		    dm_makeDataRows: function dm_makeDataRows(filter) {
		
		        var rows = [],
		            partitionCount = datamonkey.helpers.countPartitionsJSON(this.props.partitionSites),
		            partitionIndex = 0,
		            self = this,
		            doCI = this.state.showIntervals;
		
		        while (partitionIndex < partitionCount) {
		
		            _.each(self.props.partitionSites[partitionIndex].coverage[0], function (site, index) {
		                var siteData = self.props.mle[partitionIndex][self.state.ambigHandling][index];
		                if (!filter || filter(partitionIndex, index, site, siteData)) {
		                    var thisRow = [partitionIndex + 1, site + 1];
		                    //secondRow = doCI ? ['',''] : null;
		
		                    _.each(siteData, function (estimate, colIndex) {
		
		                        if (doCI) {
		                            thisRow.push({ value: estimate, format: self.dm_formatNumber });
		                            thisRow.push({ value: self.props.sample25[partitionIndex][self.state.ambigHandling][index][colIndex], format: self.dm_formatNumberShort });
		                            thisRow.push({ value: self.props.sampleMedian[partitionIndex][self.state.ambigHandling][index][colIndex], format: self.dm_formatNumberShort });
		                            thisRow.push({ value: self.props.sample975[partitionIndex][self.state.ambigHandling][index][colIndex], format: self.dm_formatNumberShort });
		
		                            /*thisRow.push ({value: [estimate, self.props.sample25[partitionIndex][self.state.ambigHandling][index][colIndex],
		                                                             self.props.sampleMedian[partitionIndex][self.state.ambigHandling][index][colIndex],
		                                                             self.props.sample975[partitionIndex][self.state.ambigHandling][index][colIndex]],
		                                           format: self.dm_formatInterval,
		                                            }); */
		                        } else {
		                            thisRow.push({ value: estimate, format: self.dm_formatNumber });
		                        }
		                    });
		                    rows.push(thisRow);
		                    //if (secondRow) {
		                    //    rows.push (secondRow);
		                    //}
		                }
		            });
		
		            partitionIndex++;
		        }
		
		        return rows;
		    },
		
		    render: function render() {
		
		        var self = this;
		
		        var result = React.createElement(
		            'div',
		            { className: 'table-responsive' },
		            React.createElement(
		                'form',
		                { className: 'form-inline navbar-form navbar-left' },
		                React.createElement(
		                    'div',
		                    { className: 'form-group' },
		                    React.createElement(
		                        'div',
		                        { className: 'btn-group' },
		                        React.createElement(
		                            'button',
		                            { className: 'btn btn-default btn-sm dropdown-toggle', type: 'button', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
		                            'Display Options ',
		                            React.createElement('span', { className: 'caret' })
		                        ),
		                        React.createElement(
		                            'ul',
		                            { className: 'dropdown-menu' },
		                            React.createElement(
		                                'li',
		                                { key: 'variable' },
		                                React.createElement(
		                                    'div',
		                                    { className: 'checkbox' },
		                                    React.createElement('input', { type: 'checkbox', checked: self.state.filters["variable"] == "on" ? true : false, defaultChecked: self.state.filters["variable"] == "on" ? true : false, onChange: self.dm_toggleVariableFilter }),
		                                    ' Variable sites only'
		                                )
		                            ),
		                            self.state.hasCI ? React.createElement(
		                                'li',
		                                { key: 'intervals' },
		                                React.createElement(
		                                    'div',
		                                    { className: 'checkbox' },
		                                    React.createElement('input', { type: 'checkbox', checked: self.state.showIntervals, defaultChecked: self.state.showIntervals, onChange: self.dm_toggleIntervals }),
		                                    ' Show sampling confidence intervals'
		                                )
		                            ) : null
		                        )
		                    ),
		                    React.createElement(
		                        'div',
		                        { className: 'input-group' },
		                        React.createElement(
		                            'div',
		                            { className: 'input-group-addon' },
		                            'Ambiguities are '
		                        ),
		                        React.createElement(
		                            'select',
		                            { className: 'form-control input-sm', defaultValue: self.state.ambigHandling, onChange: self.dm_changeAmbig },
		                            _.map(this.state.ambigOptions, function (value, index) {
		                                return React.createElement(
		                                    'option',
		                                    { key: index, value: value },
		                                    value
		                                );
		                            })
		                        )
		                    )
		                )
		            ),
		            React.createElement(DatamonkeyTable, { headerData: this.dm_makeHeaderRow(), bodyData: this.dm_makeDataRows(this.dm_makeFilterFunction()) })
		        );
		
		        return result;
		    }
		});
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41)))
	
	/***/ },
	
	/***/ 202:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(_, d3) {'use strict';
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		
		var SLACBanner = React.createClass({
		  displayName: 'SLACBanner',
		
		
		  dm_countSites: function dm_countSites(json, cutoff) {
		
		    var result = { all: 0,
		      positive: 0,
		      negative: 0 };
		
		    result.all = datamonkey.helpers.countSitesFromPartitionsJSON(json);
		
		    result.positive = datamonkey.helpers.sum(json["MLE"]["content"], function (partition) {
		      return _.reduce(partition["by-site"]["RESOLVED"], function (sum, row) {
		        return sum + (row[8] <= cutoff ? 1 : 0);
		      }, 0);
		    });
		
		    result.negative = datamonkey.helpers.sum(json["MLE"]["content"], function (partition) {
		      return _.reduce(partition["by-site"]["RESOLVED"], function (sum, row) {
		        return sum + (row[9] <= cutoff ? 1 : 0);
		      }, 0);
		    });
		
		    return result;
		  },
		
		  dm_computeState: function dm_computeState(state, pvalue) {
		    return {
		      sites: this.dm_countSites(state, pvalue)
		    };
		  },
		
		  dm_formatP: d3.format(".3f"),
		
		  getInitialState: function getInitialState() {
		    return this.dm_computeState(this.props.analysis_results, this.props.pValue);
		  },
		
		  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		    this.setState(this.dm_computeState(nextProps.analysis_results, nextProps.pValue));
		  },
		
		  render: function render() {
		
		    return React.createElement(
		      'div',
		      { className: 'panel panel-primary' },
		      React.createElement(
		        'div',
		        { className: 'panel-heading' },
		        React.createElement(
		          'h3',
		          { className: 'panel-title' },
		          React.createElement(
		            'abbr',
		            { title: 'Single Likelihood Ancestor Counting' },
		            'SLAC'
		          ),
		          ' analysis summary'
		        )
		      ),
		      React.createElement(
		        'div',
		        { className: 'panel-body' },
		        React.createElement(
		          'span',
		          { className: 'lead' },
		          'Evidence',
		          React.createElement(
		            'sup',
		            null,
		            '\u2020'
		          ),
		          ' of pervasive ',
		          React.createElement(
		            'span',
		            { className: 'hyphy-red' },
		            'diversifying'
		          ),
		          ' / ',
		          React.createElement(
		            'span',
		            { className: 'hyphy-navy' },
		            'purifying'
		          ),
		          ' selection was found at',
		          React.createElement(
		            'strong',
		            { className: 'hyphy-red' },
		            ' ',
		            this.state.sites.positive
		          ),
		          ' / ',
		          React.createElement(
		            'strong',
		            { className: 'hyphy-navy' },
		            this.state.sites.negative
		          ),
		          ' sites among ',
		          this.state.sites.all,
		          ' tested sites'
		        ),
		        React.createElement(
		          'div',
		          { style: { marginBottom: '0em' } },
		          React.createElement(
		            'small',
		            null,
		            React.createElement(
		              'sup',
		              null,
		              '\u2020'
		            ),
		            'Extended binomial test, p \u2264 ',
		            this.dm_formatP(this.props.pValue),
		            React.createElement(
		              'div',
		              { className: 'dropdown hidden-print', style: { display: 'inline', marginLeft: '0.25em' } },
		              React.createElement(
		                'button',
		                { id: 'dm.pvalue.slider', type: 'button', className: 'btn btn-primary btn-xs dropdown-toggle', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
		                React.createElement('span', { className: 'caret' })
		              ),
		              React.createElement(
		                'ul',
		                { className: 'dropdown-menu', 'aria-labelledby': 'dm.pvalue.slider' },
		                React.createElement(
		                  'li',
		                  null,
		                  React.createElement(
		                    'a',
		                    { href: '#' },
		                    React.createElement('input', { type: 'range', min: '0', max: '1', value: this.props.pValue, step: '0.01', onChange: this.props.pAdjuster })
		                  )
		                )
		              )
		            ),
		            React.createElement(
		              'emph',
		              null,
		              ' not'
		            ),
		            ' corrected for multiple testing; ambiguous characters resolved to minimize substitution counts.',
		            React.createElement('br', null),
		            React.createElement('i', { className: 'fa fa-exclamation-circle' }),
		            ' Please cite ',
		            React.createElement(
		              'a',
		              { href: 'http://www.ncbi.nlm.nih.gov/pubmed/15703242', target: '_blank' },
		              'PMID 15703242'
		            ),
		            ' if you use this result in a publication, presentation, or other scientific work.'
		          )
		        )
		      )
		    );
		  }
		});
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(41), __webpack_require__(38)))
	
	/***/ },
	
	/***/ 203:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, $) {'use strict';
		
		var _absrel_summary = __webpack_require__(204);
		
		var _model_fits = __webpack_require__(205);
		
		var _tree_summary = __webpack_require__(206);
		
		var _tree = __webpack_require__(207);
		
		var _branch_table = __webpack_require__(209);
		
		var React = __webpack_require__(44),
		    ReactDOM = __webpack_require__(211);
		
		var datamonkey = __webpack_require__(37),
		    _ = __webpack_require__(41),
		    busted = __webpack_require__(212);
		
		__webpack_require__(208);
		__webpack_require__(219);
		
		
		var React = __webpack_require__(44);
		
		var BSREL = React.createClass({
		  displayName: 'BSREL',
		
		
		  float_format: d3.format(".2f"),
		
		  loadFromServer: function loadFromServer() {
		
		    var self = this;
		    d3.json(this.props.url, function (data) {
		
		      data["fits"]["MG94"]["branch-annotations"] = self.formatBranchAnnotations(data, "MG94");
		      data["fits"]["Full model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Full model");
		
		      // GH-#18 Add omega annotation tag
		      data["fits"]["MG94"]["annotation-tag"] = "ω";
		      data["fits"]["Full model"]["annotation-tag"] = "ω";
		
		      var annotations = data["fits"]["Full model"]["branch-annotations"],
		          json = data,
		          pmid = data["PMID"],
		          test_results = data["test results"];
		
		      self.setState({
		        annotations: annotations,
		        json: json,
		        pmid: pmid,
		        test_results: test_results
		      });
		    });
		  },
		
		  getDefaultProps: function getDefaultProps() {
		
		    var edgeColorizer = function edgeColorizer(element, data) {
		
		      var self = this;
		
		      var svg = d3.select("#tree_container svg"),
		          svg_defs = d3.select(".phylotree-definitions");
		
		      if (svg_defs.empty()) {
		        svg_defs = svg.append("defs").attr("class", "phylotree-definitions");
		      }
		
		      // clear existing linearGradients
		
		      var scaling_exponent = 1.0 / 3,
		          omega_format = d3.format(".3r"),
		          prop_format = d3.format(".2p"),
		          fit_format = d3.format(".2f"),
		          p_value_format = d3.format(".4f");
		
		      self.omega_color = d3.scale.pow().exponent(scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(self.options()["color-fill"] ? ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"] : ["#6e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"]).clamp(true);
		
		      var createBranchGradient = function createBranchGradient(node) {
		
		        function generateGradient(svg_defs, grad_id, annotations, already_cumulative) {
		
		          var current_weight = 0;
		          var this_grad = svg_defs.append("linearGradient").attr("id", grad_id);
		
		          annotations.forEach(function (d, i) {
		
		            if (d.prop) {
		              var new_weight = current_weight + d.prop;
		              this_grad.append("stop").attr("offset", "" + current_weight * 100 + "%").style("stop-color", self.omega_color(d.omega));
		              this_grad.append("stop").attr("offset", "" + new_weight * 100 + "%").style("stop-color", self.omega_color(d.omega));
		              current_weight = new_weight;
		            }
		          });
		        }
		
		        // Create svg definitions
		        if (self.gradient_count == undefined) {
		          self.gradient_count = 0;
		        }
		
		        if (node.annotations) {
		
		          if (node.annotations.length == 1) {
		            node['color'] = self.omega_color(node.annotations[0]["omega"]);
		          } else {
		            self.gradient_count++;
		            var grad_id = "branch_gradient_" + self.gradient_count;
		            generateGradient(svg_defs, grad_id, node.annotations.omegas);
		            node['grad'] = grad_id;
		          }
		        }
		      };
		
		      var annotations = data.target.annotations,
		          alpha_level = 0.05,
		          tooltip = "<b>" + data.target.name + "</b>",
		          reference_omega_weight = prop_format(0),
		          distro = '';
		
		      if (annotations) {
		
		        reference_omega_weight = annotations.omegas[0].prop;
		
		        annotations.omegas.forEach(function (d, i) {
		
		          var omega_value = d.omega > 1e20 ? "&infin;" : omega_format(d.omega),
		              omega_weight = prop_format(d.prop);
		
		          tooltip += "<br/>&omega;<sub>" + (i + 1) + "</sub> = " + omega_value + " (" + omega_weight + ")";
		
		          if (i) {
		            distro += "<br/>";
		          }
		
		          distro += "&omega;<sub>" + (i + 1) + "</sub> = " + omega_value + " (" + omega_weight + ")";
		        });
		
		        tooltip += "<br/><i>p = " + omega_format(annotations["p"]) + "</i>";
		
		        $(element[0][0]).tooltip({
		          'title': tooltip,
		          'html': true,
		          'trigger': 'hover',
		          'container': 'body',
		          'placement': 'auto'
		        });
		
		        createBranchGradient(data.target);
		
		        if (data.target.grad) {
		          element.style('stroke', 'url(#' + data.target.grad + ')');
		        } else {
		          element.style('stroke', data.target.color);
		        }
		
		        element.style('stroke-width', annotations["p"] <= alpha_level ? '12' : '5').style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
		      }
		    };
		
		    return {
		      edgeColorizer: edgeColorizer
		    };
		  },
		
		  getInitialState: function getInitialState() {
		
		    var tree_settings = {
		      'omegaPlot': {},
		      'tree-options': {
		        /* value arrays have the following meaning
		            [0] - the value of the attribute
		            [1] - does the change in attribute value trigger tree re-layout?
		        */
		        'hyphy-tree-model': ['Full model', true],
		        'hyphy-tree-highlight': [null, false],
		        'hyphy-tree-branch-lengths': [true, true],
		        'hyphy-tree-hide-legend': [false, true],
		        'hyphy-tree-fill-color': [false, true]
		      },
		      'suppress-tree-render': false,
		      'chart-append-html': true,
		      'edgeColorizer': this.props.edgeColorizer
		    };
		
		    return {
		      annotations: null,
		      json: null,
		      pmid: null,
		      settings: tree_settings,
		      test_results: null,
		      tree: null
		    };
		  },
		
		  componentWillMount: function componentWillMount() {
		    this.loadFromServer();
		    this.setEvents();
		  },
		
		  setEvents: function setEvents() {
		
		    var self = this;
		
		    $("#datamonkey-absrel-json-file").on("change", function (e) {
		      var files = e.target.files; // FileList object
		
		      if (files.length == 1) {
		        var f = files[0];
		        var reader = new FileReader();
		
		        reader.onload = function (theFile) {
		          return function (e) {
		            var data = JSON.parse(this.result);
		            data["fits"]["MG94"]["branch-annotations"] = self.formatBranchAnnotations(data, "MG94");
		            data["fits"]["Full model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Full model");
		
		            var annotations = data["fits"]["Full model"]["branch-annotations"],
		                json = data,
		                pmid = data["PMID"],
		                test_results = data["test results"];
		
		            self.setState({
		              annotations: annotations,
		              json: json,
		              pmid: pmid,
		              test_results: test_results
		            });
		          };
		        }(f);
		        reader.readAsText(f);
		      }
		
		      $("#datamonkey-absrel-toggle-here").dropdown("toggle");
		      e.preventDefault();
		    });
		  },
		
		  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
		
		    var initial_branch_annotations = json["fits"][key]["branch-annotations"];
		
		    if (!initial_branch_annotations) {
		      initial_branch_annotations = json["fits"][key]["rate distributions"];
		    }
		
		    // Iterate over objects
		    var branch_annotations = _.mapObject(initial_branch_annotations, function (val, key) {
		
		      var vals = [];
		      try {
		        vals = JSON.parse(val);
		      } catch (e) {
		        vals = val;
		      }
		
		      var omegas = { "omegas": _.map(vals, function (d) {
		          return _.object(["omega", "prop"], d);
		        }) };
		      var test_results = _.clone(json["test results"][key]);
		      _.extend(test_results, omegas);
		      return test_results;
		    });
		
		    return branch_annotations;
		  },
		
		  initialize: function initialize() {
		
		    var model_fits_id = "#hyphy-model-fits",
		        omega_plots_id = "#hyphy-omega-plots",
		        summary_id = "#hyphy-relax-summary",
		        tree_id = "#tree-tab";
		  },
		
		  render: function render() {
		
		    var self = this;
		
		    return React.createElement(
		      'div',
		      { className: 'tab-content' },
		      React.createElement(
		        'div',
		        { className: 'tab-pane active', id: 'summary-tab' },
		        React.createElement(
		          'div',
		          { className: 'row' },
		          React.createElement(
		            'div',
		            { id: 'summary-div', className: 'col-md-12' },
		            React.createElement(_absrel_summary.BSRELSummary, { test_results: self.state.test_results,
		              pmid: self.state.pmid })
		          )
		        ),
		        React.createElement(
		          'div',
		          { className: 'row' },
		          React.createElement(
		            'div',
		            { id: 'hyphy-tree-summary', className: 'col-md-6' },
		            React.createElement(_tree_summary.TreeSummary, { json: self.state.json })
		          ),
		          React.createElement(
		            'div',
		            { id: 'hyphy-model-fits', className: 'col-md-6' },
		            React.createElement(_model_fits.ModelFits, { json: self.state.json })
		          )
		        )
		      ),
		      React.createElement(
		        'div',
		        { className: 'tab-pane', id: 'tree-tab' },
		        React.createElement(_tree.Tree, { json: self.state.json,
		          settings: self.state.settings })
		      ),
		      React.createElement(
		        'div',
		        { className: 'tab-pane', id: 'table_tab' },
		        React.createElement(_branch_table.BranchTable, { tree: self.state.tree,
		          test_results: self.state.test_results,
		          annotations: self.state.annotations })
		      )
		    );
		  }
		
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_absrel(url, element) {
		  React.render(React.createElement(BSREL, { url: url }), document.getElementById(element));
		}
		
		module.exports = render_absrel;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 204:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _) {'use strict';
		
		var React = __webpack_require__(44);
		
		var BSRELSummary = React.createClass({
		  displayName: 'BSRELSummary',
		
		
		  float_format: d3.format(".2f"),
		
		  countBranchesTested: function countBranchesTested(branches_tested) {
		
		    if (branches_tested) {
		      return branches_tested.split(';').length;
		    } else {
		      return 0;
		    }
		  },
		
		  getBranchesWithEvidence: function getBranchesWithEvidence(test_results) {
		
		    var self = this;
		    return _.filter(test_results, function (d) {
		      return d.p <= 0.05;
		    }).length;
		  },
		
		  getTestBranches: function getTestBranches(test_results) {
		
		    var self = this;
		    return _.filter(test_results, function (d) {
		      return d.tested > 0;
		    }).length;
		  },
		
		  getTotalBranches: function getTotalBranches(test_results) {
		
		    var self = this;
		    return _.keys(test_results).length;
		  },
		
		  getInitialState: function getInitialState() {
		
		    var self = this;
		
		    return {
		      branches_with_evidence: this.getBranchesWithEvidence(self.props.test_results),
		      test_branches: this.getTestBranches(self.props.test_results),
		      total_branches: this.getTotalBranches(self.props.test_results)
		    };
		  },
		
		  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		    this.setState({
		      branches_with_evidence: this.getBranchesWithEvidence(nextProps.test_results),
		      test_branches: this.getTestBranches(nextProps.test_results),
		      total_branches: this.getTotalBranches(nextProps.test_results)
		    });
		  },
		
		  render: function render() {
		
		    var self = this;
		
		    return React.createElement(
		      'ul',
		      { className: 'list-group' },
		      React.createElement(
		        'li',
		        { className: 'list-group-item list-group-item-info' },
		        React.createElement(
		          'h3',
		          { className: 'list-group-item-heading' },
		          React.createElement('i', { className: 'fa fa-list' }),
		          React.createElement(
		            'span',
		            { id: 'summary-method-name' },
		            'Adaptive branch site REL'
		          ),
		          ' summary'
		        ),
		        React.createElement(
		          'p',
		          { className: 'list-group-item-text lead' },
		          'Evidence',
		          React.createElement(
		            'sup',
		            null,
		            '\u2020'
		          ),
		          ' of episodic diversifying selection was found on',
		          React.createElement(
		            'strong',
		            null,
		            ' ',
		            self.state.branches_with_evidence
		          ),
		          ' out of',
		          React.createElement(
		            'span',
		            null,
		            ' ',
		            self.state.test_branches
		          ),
		          ' tested branches (',
		          React.createElement(
		            'span',
		            null,
		            self.state.total_branches
		          ),
		          ' total branches).'
		        ),
		        React.createElement(
		          'p',
		          null,
		          React.createElement(
		            'small',
		            null,
		            React.createElement(
		              'sup',
		              null,
		              '\u2020'
		            ),
		            React.createElement(
		              'abbr',
		              { title: 'Likelihood Ratio Test' },
		              'LRT'
		            ),
		            ' p \u2264 0.05, corrected for multiple testing.'
		          )
		        ),
		        React.createElement(
		          'p',
		          null,
		          React.createElement(
		            'small',
		            null,
		            'Please cite ',
		            React.createElement(
		              'a',
		              { href: 'http://www.ncbi.nlm.nih.gov/pubmed/25697341', id: 'summary-pmid', target: '_blank' },
		              'PMID 25697341'
		            ),
		            ' if you use this result in a publication, presentation, or other scientific work.'
		          )
		        )
		      )
		    );
		  }
		
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_absrel_summary(test_results, pmid, element) {
		  React.render(React.createElement(BSRELSummary, { test_results: test_results, pmid: pmid }), document.getElementById(element));
		}
		
		module.exports.BSRELSummary = BSRELSummary;
		module.exports.render_absrel_summary = render_absrel_summary;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41)))
	
	/***/ },
	
	/***/ 205:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _, $) {"use strict";
		
		var React = __webpack_require__(44);
		
		var ModelFits = React.createClass({
		  displayName: "ModelFits",
		
		
		  getInitialState: function getInitialState() {
		    var table_row_data = this.getModelRows(this.props.json),
		        table_columns = this.getModelColumns(table_row_data);
		
		    return {
		      table_row_data: table_row_data,
		      table_columns: table_columns
		    };
		  },
		
		  formatRuntime: function formatRuntime(seconds) {
		    var duration_string = "",
		        seconds = parseFloat(seconds);
		
		    var split_array = [Math.floor(seconds / (24 * 3600)), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60],
		        quals = ["d.", "hrs.", "min.", "sec."];
		
		    split_array.forEach(function (d, i) {
		      if (d) {
		        duration_string += " " + d + " " + quals[i];
		      }
		    });
		
		    return duration_string;
		  },
		
		  getLogLikelihood: function getLogLikelihood(this_model) {
		    return d3.format(".2f")(this_model['log-likelihood']);
		  },
		
		  getAIC: function getAIC(this_model) {
		    return d3.format(".2f")(this_model['AIC-c']);
		  },
		
		  getNumParameters: function getNumParameters(this_model) {
		    return this_model['parameters'];
		  },
		
		  getBranchLengths: function getBranchLengths(this_model) {
		
		    if (this_model["tree length"]) {
		      return d3.format(".2f")(this_model["tree length"]);
		    } else {
		      return d3.format(".2f")(d3.values(this_model["branch-lengths"]).reduce(function (p, c) {
		        return p + c;
		      }, 0));
		    }
		  },
		
		  getRuntime: function getRuntime(this_model) {
		    //return this.formatRuntime(this_model['runtime']);
		    return this.formatRuntime(this_model['runtime']);
		  },
		
		  getDistributions: function getDistributions(m, this_model) {
		
		    var omega_distributions = {};
		    omega_distributions[m] = {};
		
		    var omega_format = d3.format(".3r"),
		        prop_format = d3.format(".2p"),
		        p_value_format = d3.format(".4f");
		
		    var distributions = [];
		
		    for (var d in this_model["rate-distributions"]) {
		
		      var this_distro = this_model["rate-distributions"][d];
		      var this_distro_entry = [d, "", "", ""];
		
		      omega_distributions[m][d] = this_distro.map(function (d) {
		        return {
		          'omega': d[0],
		          'weight': d[1]
		        };
		      });
		
		      for (var k = 0; k < this_distro.length; k++) {
		        this_distro_entry[k + 1] = omega_format(this_distro[k][0]) + " (" + prop_format(this_distro[k][1]) + ")";
		      }
		
		      distributions.push(this_distro_entry);
		    }
		
		    distributions.sort(function (a, b) {
		      return a[0] < b[0] ? -1 : a[0] == b[0] ? 0 : 1;
		    });
		
		    return distributions;
		  },
		
		  getModelRows: function getModelRows(json) {
		
		    if (!json) {
		      return [];
		    }
		
		    var table_row_data = [];
		    var omega_format = d3.format(".3r");
		    var prop_format = d3.format(".2p");
		    var p_value_format = d3.format(".4f");
		
		    for (var m in json["fits"]) {
		
		      var this_model_row = [],
		          this_model = json["fits"][m];
		
		      this_model_row = [this_model['display-order'], "", m, this.getLogLikelihood(this_model), this.getNumParameters(this_model), this.getAIC(this_model), this.getRuntime(this_model), this.getBranchLengths(this_model)];
		
		      var distributions = this.getDistributions(m, this_model);
		
		      if (distributions.length) {
		
		        this_model_row = this_model_row.concat(distributions[0]);
		        this_model_row[1] = distributions[0][0];
		
		        table_row_data.push(this_model_row);
		
		        for (var d = 1; d < distributions.length; d++) {
		
		          var this_distro_entry = this_model_row.map(function (d, i) {
		            if (i) return "";
		            return d;
		          });
		
		          this_distro_entry[1] = distributions[d][0];
		
		          for (var k = this_distro_entry.length - 4; k < this_distro_entry.length; k++) {
		            this_distro_entry[k] = distributions[d][k - this_distro_entry.length + 4];
		          }
		
		          table_row_data.push(this_distro_entry);
		        }
		      } else {
		        table_row_data.push(this_model_row);
		      }
		    }
		
		    table_row_data.sort(function (a, b) {
		      if (a[0] == b[0]) {
		        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
		      }
		      return a[0] - b[0];
		    });
		
		    table_row_data = table_row_data.map(function (r) {
		      return r.slice(2);
		    });
		
		    return table_row_data;
		  },
		
		  getModelColumns: function getModelColumns(table_row_data) {
		
		    var model_header = '<th>Model</th>',
		        logl_header = '<th><em> log </em>L</th>',
		        num_params_header = '<th><abbr title="Number of estimated model parameters"># par.</abbr></th>',
		        aic_header = '<th><abbr title="Small Sample AIC">AIC<sub>c</sub></abbr></th>',
		        runtime_header = '<th>Time to fit</th>',
		        branch_lengths_header = '<th><abbr title="Total tree length, expected substitutions/site">L<sub>tree</sub></abbr></th>',
		        branch_set_header = '<th>Branch set</th>',
		        omega_1_header = '<th>&omega;<sub>1</sub></th>',
		        omega_2_header = '<th>&omega;<sub>2</sub></th>',
		        omega_3_header = '<th>&omega;<sub>3</sub></th>';
		
		    // inspect table_row_data and return header
		    var all_columns = [model_header, logl_header, num_params_header, aic_header, runtime_header, branch_lengths_header, branch_set_header, omega_1_header, omega_2_header, omega_3_header];
		
		    // validate each table row with its associated header
		    if (table_row_data.length == 0) {
		      return [];
		    }
		
		    // trim columns to length of table_row_data
		    var column_headers = _.take(all_columns, table_row_data[0].length);
		
		    // remove all columns that have 0, null, or undefined rows
		    var items = d3.transpose(table_row_data);
		
		    return column_headers;
		  },
		
		  componentDidUpdate: function componentDidUpdate() {
		
		    var model_columns = d3.select('#summary-model-header1');
		    model_columns = model_columns.selectAll("th").data(this.state.table_columns);
		    model_columns.enter().append("th");
		    model_columns.html(function (d) {
		      return d;
		    });
		
		    var model_rows = d3.select('#summary-model-table').selectAll("tr").data(this.state.table_row_data);
		    model_rows.enter().append('tr');
		    model_rows.exit().remove();
		    model_rows = model_rows.selectAll("td").data(function (d) {
		      return d;
		    });
		    model_rows.enter().append("td");
		    model_rows.html(function (d) {
		      return d;
		    });
		  },
		
		  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		    var table_row_data = this.getModelRows(nextProps.json),
		        table_columns = this.getModelColumns(table_row_data);
		
		    this.setState({
		      table_row_data: table_row_data,
		      table_columns: table_columns
		    });
		  },
		
		  render: function render() {
		
		    return React.createElement(
		      "div",
		      { className: "col-lg-12" },
		      React.createElement(
		        "ul",
		        { className: "list-group" },
		        React.createElement(
		          "li",
		          { className: "list-group-item" },
		          React.createElement(
		            "h4",
		            { className: "list-group-item-heading" },
		            React.createElement("i", { className: "fa fa-cubes", styleFormat: "margin-right: 10px" }),
		            "Model fits"
		          ),
		          React.createElement(
		            "table",
		            { className: "table table-hover table-condensed list-group-item-text", styleFormat: "margin-top:0.5em;" },
		            React.createElement("thead", { id: "summary-model-header1" }),
		            React.createElement("tbody", { id: "summary-model-table" })
		          )
		        )
		      )
		    );
		  }
		
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_model_fits(json, element) {
		  React.render(React.createElement(ModelFits, { json: json }), $(element)[0]);
		}
		
		// Will need to make a call to this
		// omega distributions
		function rerender_model_fits(json, element) {
		  $(element).empty();
		  render_model_fits(json, element);
		}
		
		module.exports.ModelFits = ModelFits;
		module.exports.render_model_fits = render_model_fits;
		module.exports.rerender_model_fits = rerender_model_fits;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 206:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, $) {'use strict';
		
		var React = __webpack_require__(44),
		    _ = __webpack_require__(41);
		
		var TreeSummary = React.createClass({
		  displayName: 'TreeSummary',
		
		
		  getInitialState: function getInitialState() {
		
		    var table_row_data = this.getSummaryRows(this.props.json),
		        table_columns = this.getTreeSummaryColumns(table_row_data);
		
		    return {
		      table_row_data: table_row_data,
		      table_columns: table_columns
		    };
		  },
		
		  getRateClasses: function getRateClasses(branch_annotations) {
		
		    // Get count of all rate classes
		    var all_branches = _.values(branch_annotations);
		
		    return _.countBy(all_branches, function (branch) {
		      return branch.omegas.length;
		    });
		  },
		
		  getBranchProportion: function getBranchProportion(rate_classes) {
		    var sum = _.reduce(_.values(rate_classes), function (memo, num) {
		      return memo + num;
		    });
		    return _.mapObject(rate_classes, function (val, key) {
		      return d3.format(".2p")(val / sum);
		    });
		  },
		
		  getBranchLengthProportion: function getBranchLengthProportion(rate_classes, branch_annotations, total_branch_length) {
		
		    var self = this;
		
		    // get branch lengths of each rate distribution
		    //return prop_format(d[2] / total_tree_length
		
		    // Get count of all rate classes
		    var branch_lengths = _.mapObject(rate_classes, function (d) {
		      return 0;
		    });
		
		    for (var key in branch_annotations) {
		      var node = self.tree.get_node_by_name(key);
		      branch_lengths[branch_annotations[key].omegas.length] += self.tree.branch_length()(node);
		    };
		
		    return _.mapObject(branch_lengths, function (val, key) {
		      return d3.format(".2p")(val / total_branch_length);
		    });
		  },
		
		  getNumUnderSelection: function getNumUnderSelection(rate_classes, branch_annotations, test_results) {
		
		    var num_under_selection = _.mapObject(rate_classes, function (d) {
		      return 0;
		    });
		
		    for (var key in branch_annotations) {
		      num_under_selection[branch_annotations[key].omegas.length] += test_results[key]["p"] <= 0.05;
		    };
		
		    return num_under_selection;
		  },
		
		  getSummaryRows: function getSummaryRows(json) {
		
		    var self = this;
		
		    // Will need to create a tree for each fits
		    var analysis_data = json;
		
		    if (!analysis_data) {
		      return [];
		    }
		
		    // Create an array of phylotrees from fits
		    var trees = _.map(analysis_data["fits"], function (d) {
		      return d3.layout.phylotree("body")(d["tree string"]);
		    });
		    var tree = trees[0];
		
		    self.tree = tree;
		
		    //TODO : Do not hard code model here
		    var tree_length = analysis_data["fits"]["Full model"]["tree length"];
		    var branch_annotations = analysis_data["fits"]["Full model"]["branch-annotations"];
		    var test_results = analysis_data["test results"];
		
		    var rate_classes = this.getRateClasses(branch_annotations),
		        proportions = this.getBranchProportion(rate_classes),
		        length_proportions = this.getBranchLengthProportion(rate_classes, branch_annotations, tree_length),
		        num_under_selection = this.getNumUnderSelection(rate_classes, branch_annotations, test_results);
		
		    // zip objects into matrix
		    var keys = _.keys(rate_classes);
		
		    var summary_rows = _.zip(keys, _.values(rate_classes), _.values(proportions), _.values(length_proportions), _.values(num_under_selection));
		
		    summary_rows.sort(function (a, b) {
		      if (a[0] == b[0]) {
		        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
		      }
		      return a[0] - b[0];
		    });
		
		    return summary_rows;
		  },
		
		  getTreeSummaryColumns: function getTreeSummaryColumns(table_row_data) {
		
		    var omega_header = '<th>ω rate<br>classes</th>',
		        branch_num_header = '<th># of <br>branches</th>',
		        branch_prop_header = '<th>% of <br>branches</th>',
		        branch_prop_length_header = '<th>% of tree <br>length</th>',
		        under_selection_header = '<th># under <br>selection</th>';
		
		    // inspect table_row_data and return header
		    var all_columns = [omega_header, branch_num_header, branch_prop_header, branch_prop_length_header, under_selection_header];
		
		    // validate each table row with its associated header
		    if (table_row_data.length == 0) {
		      return [];
		    }
		
		    // trim columns to length of table_row_data
		    var column_headers = _.take(all_columns, table_row_data[0].length);
		
		    return column_headers;
		  },
		
		  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		    var table_row_data = this.getSummaryRows(nextProps.json),
		        table_columns = this.getTreeSummaryColumns(table_row_data);
		
		    this.setState({
		      table_row_data: table_row_data,
		      table_columns: table_columns
		    });
		  },
		
		  componentDidUpdate: function componentDidUpdate() {
		
		    d3.select('#summary-tree-header').empty();
		
		    var tree_summary_columns = d3.select('#summary-tree-header');
		
		    tree_summary_columns = tree_summary_columns.selectAll("th").data(this.state.table_columns);
		    tree_summary_columns.enter().append("th");
		    tree_summary_columns.html(function (d) {
		      return d;
		    });
		
		    var tree_summary_rows = d3.select('#summary-tree-table').selectAll("tr").data(this.state.table_row_data);
		    tree_summary_rows.enter().append('tr');
		    tree_summary_rows.exit().remove();
		    tree_summary_rows = tree_summary_rows.selectAll("td").data(function (d) {
		      return d;
		    });
		
		    tree_summary_rows.enter().append("td");
		    tree_summary_rows.html(function (d) {
		      return d;
		    });
		  },
		
		  render: function render() {
		
		    return React.createElement(
		      'ul',
		      { className: 'list-group' },
		      React.createElement(
		        'li',
		        { className: 'list-group-item' },
		        React.createElement(
		          'h4',
		          { className: 'list-group-item-heading' },
		          React.createElement('i', { className: 'fa fa-tree' }),
		          'Tree'
		        ),
		        React.createElement(
		          'table',
		          { className: 'table table-hover table-condensed list-group-item-text' },
		          React.createElement('thead', { id: 'summary-tree-header' }),
		          React.createElement('tbody', { id: 'summary-tree-table' })
		        )
		      )
		    );
		  }
		
		});
		
		//TODO
		//<caption>
		//<p className="list-group-item-text text-muted">
		//    Total tree length under the branch-site model is <strong id="summary-tree-length">2.30</strong> expected substitutions per nucleotide site, and <strong id="summary-tree-length-mg94">1.74</strong> under the MG94 model.
		//</p>
		//</caption>
		
		
		// Will need to make a call to this
		// omega distributions
		function render_tree_summary(json, element) {
		  React.render(React.createElement(TreeSummary, { json: json }), $(element)[0]);
		}
		
		// Will need to make a call to this
		// omega distributions
		function rerender_tree_summary(tree, element) {
		  $(element).empty();
		  render_tree_summary(tree, element);
		}
		
		module.exports.TreeSummary = TreeSummary;
		module.exports.render_tree_summary = render_tree_summary;
		module.exports.rerender_tree_summary = rerender_tree_summary;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 207:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _, $) {'use strict';
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		__webpack_require__(208);
		
		var Tree = React.createClass({
		    displayName: 'Tree',
		
		
		    getInitialState: function getInitialState() {
		        return {
		            json: this.props.json,
		            settings: this.props.settings
		        };
		    },
		
		    sortNodes: function sortNodes(asc) {
		
		        var self = this;
		
		        self.tree.traverse_and_compute(function (n) {
		            var d = 1;
		            if (n.children && n.children.length) {
		                d += d3.max(n.children, function (d) {
		                    return d["count_depth"];
		                });
		            }
		            n["count_depth"] = d;
		        });
		
		        self.tree.resort_children(function (a, b) {
		            return (a["count_depth"] - b["count_depth"]) * (asc ? 1 : -1);
		        });
		    },
		
		    getBranchLengths: function getBranchLengths() {
		
		        var self = this;
		
		        if (!this.state.json) {
		            return [];
		        }
		
		        var branch_lengths = self.settings["tree-options"]["hyphy-tree-branch-lengths"][0] ? this.state.json["fits"][this.which_model]["branch-lengths"] : null;
		
		        if (!branch_lengths) {
		
		            var nodes = _.filter(self.tree.get_nodes(), function (d) {
		                return d.parent;
		            });
		
		            branch_lengths = _.object(_.map(nodes, function (d) {
		                return d.name;
		            }), _.map(nodes, function (d) {
		                return parseFloat(d.attribute);
		            }));
		        }
		
		        return branch_lengths;
		    },
		
		    assignBranchAnnotations: function assignBranchAnnotations() {
		        if (this.state.json && this.state.json["fits"][this.which_model]) {
		            this.tree.assign_attributes(this.state.json["fits"][this.which_model]["branch-annotations"]);
		        }
		    },
		
		    renderDiscreteLegendColorScheme: function renderDiscreteLegendColorScheme(svg_container) {
		
		        var self = this,
		            svg = self.svg;
		
		        var color_fill = self.settings["tree-options"]["hyphy-tree-fill-color"][0] ? "black" : "red";
		
		        var margins = {
		            'bottom': 30,
		            'top': 15,
		            'left': 40,
		            'right': 2
		        };
		
		        d3.selectAll("#color-legend").remove();
		
		        var dc_legend = svg.append("g").attr("id", "color-legend").attr("class", "dc-legend").attr("transform", "translate(" + margins["left"] + "," + margins["top"] + ")");
		
		        var fg_item = dc_legend.append("g").attr("class", "dc-legend-item").attr("transform", "translate(0,0)");
		
		        fg_item.append("rect").attr("width", "13").attr("height", "13").attr("fill", color_fill);
		
		        fg_item.append("text").attr("x", "15").attr("y", "11").text("Foreground");
		
		        var bg_item = dc_legend.append("g").attr("class", "dc-legend-item").attr("transform", "translate(0,18)");
		
		        bg_item.append("rect").attr("width", "13").attr("height", "13").attr("fill", "gray");
		
		        bg_item.append("text").attr("x", "15").attr("y", "11").text("Background");
		    },
		
		    renderLegendColorScheme: function renderLegendColorScheme(svg_container, attr_name, do_not_render) {
		
		        var self = this;
		
		        var branch_annotations = this.state.json["fits"][this.which_model]["branch-annotations"];
		
		        var svg = self.svg;
		
		        // clear existing linearGradients
		        d3.selectAll(".legend-definitions").selectAll("linearGradient").remove();
		        d3.selectAll("#color-legend").remove();
		
		        if (branch_annotations && !do_not_render) {
		            var bar_width = 70,
		                bar_height = 300,
		                margins = {
		                'bottom': 30,
		                'top': 15,
		                'left': 40,
		                'right': 2
		            };
		
		            var this_grad = svg.append("defs").attr("class", "legend-definitions").append("linearGradient").attr("id", "_omega_bar").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
		
		            var omega_scale = d3.scale.pow().exponent(this.scaling_exponent).domain(d3.extent(self.omega_color.domain())).range([0, 1]),
		                axis_scale = d3.scale.pow().exponent(this.scaling_exponent).domain(d3.extent(self.omega_color.domain())).range([0, bar_height - margins['top'] - margins['bottom']]);
		
		            self.omega_color.domain().forEach(function (d) {
		                this_grad.append("stop").attr("offset", "" + omega_scale(d) * 100 + "%").style("stop-color", self.omega_color(d));
		            });
		
		            var g_container = svg.append("g").attr("id", "color-legend").attr("transform", "translate(" + margins["left"] + "," + margins["top"] + ")");
		
		            g_container.append("rect").attr("x", 0).attr("width", bar_width - margins['left'] - margins['right']).attr("y", 0).attr("height", bar_height - margins['top'] - margins['bottom']).style("fill", "url(#_omega_bar)");
		
		            var draw_omega_bar = d3.svg.axis().scale(axis_scale).orient("left").tickFormat(d3.format(".1r")).tickValues([0, 0.01, 0.1, 0.5, 1, 2, 5, 10]);
		
		            var scale_bar = g_container.append("g");
		
		            scale_bar.style("font-size", "14").attr("class", "hyphy-omega-bar").call(draw_omega_bar);
		
		            scale_bar.selectAll("text").style("text-anchor", "right");
		
		            var _label = '';
		            var x_label = _label = scale_bar.append("g").attr("class", "hyphy-omega-bar");
		            x_label = x_label.selectAll("text").data([attr_name]);
		            x_label.enter().append("text");
		            x_label.text(function (d) {
		                return $('<textarea />').html(d).text();
		            }).attr("transform", "translate(" + (bar_width - margins['left'] - margins['right']) * 0.5 + "," + (bar_height - margins['bottom']) + ")").style("text-anchor", "middle").style("font-size", "18").attr("dx", "0.0em").attr("dy", "0.1em");
		        }
		    },
		
		    setHandlers: function setHandlers() {
		
		        var self = this;
		
		        $("#hyphy-error-hide").on("click", function (e) {
		            d3.select("#hyphy-error").style("display", "none");
		            e.preventDefault();
		        });
		
		        $(".hyphy-tree-trigger").on("click", function (e) {
		
		            self.renderTree();
		        });
		
		        $(".tree-tab-btn").on('click', function (e) {
		            self.tree.placenodes().update();
		        });
		
		        $("#export-phylo-svg").on('click', function (e) {
		            datamonkey.save_image("svg", "#tree_container");
		        });
		
		        $("#export-phylo-png").on('click', function (e) {
		            datamonkey.save_image("png", "#tree_container");
		        });
		
		        $("#export-phylo-nwk").on('click', function (e) {
		            var nwk = self.tree.get_newick(function () {});
		            var pom = document.createElement('a');
		            pom.setAttribute('href', 'data:text/octet-stream;charset=utf-8,' + encodeURIComponent(nwk));
		            pom.setAttribute('download', 'nwk.txt');
		            $("body").append(pom);
		            pom.click();
		            pom.remove();
		        });
		    },
		
		    setTreeHandlers: function setTreeHandlers() {
		
		        var self = this;
		        var tree_object = self.tree;
		
		        $("[data-direction]").on("click", function (e) {
		            var which_function = $(this).data("direction") == 'vertical' ? tree_object.spacing_x : tree_object.spacing_y;
		            which_function(which_function() + +$(this).data("amount")).update();
		        });
		
		        $(".phylotree-layout-mode").on("change", function (e) {
		            if ($(this).is(':checked')) {
		                if (tree_object.radial() != ($(this).data("mode") == "radial")) {
		                    tree_object.radial(!tree_object.radial()).placenodes().update();
		                }
		            }
		        });
		
		        $(".phylotree-align-toggler").on("change", function (e) {
		            if ($(this).is(':checked')) {
		                if (tree_object.align_tips($(this).data("align") == "right")) {
		                    tree_object.placenodes().update();
		                }
		            }
		        });
		
		        $("#sort_original").on("click", function (e) {
		            tree_object.resort_children(function (a, b) {
		                return a["original_child_order"] - b["original_child_order"];
		            });
		
		            e.preventDefault();
		        });
		
		        $("#sort_ascending").on("click", function (e) {
		            self.sortNodes(true);
		            e.preventDefault();
		        });
		
		        $("#sort_descending").on("click", function (e) {
		            self.sortNodes(false);
		            e.preventDefault();
		        });
		    },
		
		    setPartitionList: function setPartitionList() {
		
		        var self = this;
		
		        // Check if partition list exists
		        if (!self.props.json["partition"]) {
		            d3.select("#hyphy-tree-highlight-div").style("display", "none");
		            d3.select("#hyphy-tree-highlight").style("display", "none");
		            return;
		        }
		
		        // set tree partitions
		        self.tree.set_partitions(self.props.json["partition"]);
		
		        var partition_list = d3.select("#hyphy-tree-highlight-branches").selectAll("li").data([['None']].concat(d3.keys(self.props.json["partition"]).map(function (d) {
		            return [d];
		        }).sort()));
		
		        partition_list.enter().append("li");
		        partition_list.exit().remove();
		        partition_list = partition_list.selectAll("a").data(function (d) {
		            return d;
		        });
		
		        partition_list.enter().append("a");
		        partition_list.attr("href", "#").on("click", function (d, i) {
		            d3.select("#hyphy-tree-highlight").attr("value", d);
		            self.renderTree();
		        });
		
		        // set default to passed setting
		        partition_list.text(function (d) {
		            if (d == "RELAX.test") {
		                this.click();
		            }
		            return d;
		        });
		    },
		
		    setModelList: function setModelList() {
		
		        var self = this;
		
		        if (!this.state.json) {
		            return [];
		        }
		
		        this.state.settings['suppress-tree-render'] = true;
		
		        var def_displayed = false;
		
		        var model_list = d3.select("#hyphy-tree-model-list").selectAll("li").data(d3.keys(this.state.json["fits"]).map(function (d) {
		            return [d];
		        }).sort());
		
		        model_list.enter().append("li");
		        model_list.exit().remove();
		        model_list = model_list.selectAll("a").data(function (d) {
		            return d;
		        });
		
		        model_list.enter().append("a");
		
		        model_list.attr("href", "#").on("click", function (d, i) {
		            d3.select("#hyphy-tree-model").attr("value", d);
		            self.renderTree();
		        });
		
		        model_list.text(function (d) {
		
		            if (d == "General Descriptive") {
		                def_displayed = true;
		                this.click();
		            }
		
		            if (!def_displayed && d == "Alternative") {
		                def_displayed = true;
		                this.click();
		            }
		
		            if (!def_displayed && d == "Partitioned MG94xREV") {
		                def_displayed = true;
		                this.click();
		            }
		
		            if (!def_displayed && d == "MG94") {
		                def_displayed = true;
		                this.click();
		            }
		
		            if (!def_displayed && d == "Full model") {
		                def_displayed = true;
		                this.click();
		            }
		
		            return d;
		        });
		
		        this.settings['suppress-tree-render'] = false;
		    },
		
		    initialize: function initialize() {
		
		        var self = this;
		
		        this.settings = this.state.settings;
		
		        if (!this.settings) {
		            return null;
		        }
		
		        if (!this.state.json) {
		            return null;
		        }
		
		        $("#hyphy-tree-branch-lengths").click();
		
		        this.scaling_exponent = 0.33;
		        this.omega_format = d3.format(".3r");
		        this.prop_format = d3.format(".2p");
		        this.fit_format = d3.format(".2f");
		        this.p_value_format = d3.format(".4f");
		
		        var json = this.state.json;
		        var analysis_data = json;
		
		        this.width = 800;
		        this.height = 600;
		
		        this.which_model = this.settings["tree-options"]["hyphy-tree-model"][0];
		        this.legend_type = this.settings["hyphy-tree-legend-type"];
		
		        this.setHandlers();
		        this.setModelList();
		        this.initializeTree();
		        this.setPartitionList();
		    },
		
		    initializeTree: function initializeTree() {
		
		        var self = this;
		
		        var analysis_data = self.state.json;
		
		        var width = this.width,
		            height = this.height,
		            alpha_level = 0.05,
		            branch_lengths = [];
		
		        if (!this.tree) {
		            this.tree = d3.layout.phylotree("body").size([height, width]).separation(function (a, b) {
		                return 0;
		            });
		        }
		
		        this.setTreeHandlers();
		
		        // clear any existing svg
		        d3.select("#tree_container").html("");
		
		        this.svg = d3.select("#tree_container").append("svg").attr("width", width).attr("height", height);
		
		        this.tree.branch_name(null);
		        this.tree.node_span('equal');
		        this.tree.options({
		            'draw-size-bubbles': false,
		            'selectable': false,
		            'left-right-spacing': 'fit-to-size',
		            'left-offset': 100,
		            'color-fill': this.settings["tree-options"]["hyphy-tree-fill-color"][0]
		        }, false);
		
		        this.assignBranchAnnotations();
		
		        self.omega_color = d3.scale.pow().exponent(this.scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(this.settings["tree-options"]["hyphy-tree-fill-color"][0] ? ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"] : ["#5e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"]).clamp(true);
		
		        self.renderTree();
		
		        if (self.legend_type == 'discrete') {
		            self.renderDiscreteLegendColorScheme("tree_container");
		        } else {
		            self.renderLegendColorScheme("tree_container", analysis_data["fits"][this.which_model]["annotation-tag"]);
		        }
		
		        if (this.settings.edgeColorizer) {
		            this.edgeColorizer = this.settings.edgeColorizer;
		        }
		
		        this.tree.style_edges(this.edgeColorizer);
		        this.tree.style_nodes(this.nodeColorizer);
		
		        this.tree.spacing_x(30, true);
		        this.tree.layout();
		        this.tree.placenodes().update();
		        this.tree.layout();
		    },
		
		    renderTree: function renderTree(skip_render) {
		
		        var self = this;
		        var analysis_data = this.state.json;
		        var svg = self.svg;
		
		        if (!this.settings['suppress-tree-render']) {
		
		            var do_layout = false;
		
		            for (var k in this.settings["tree-options"]) {
		
		                //TODO : Check to make sure settings has a matching field
		                if (k == 'hyphy-tree-model') {
		
		                    var controller = d3.select("#" + k),
		                        controller_value = controller.attr("value") || controller.property("checked");
		
		                    if (controller_value != this.settings["tree-options"][k][0] && controller_value != false) {
		                        this.settings["tree-options"][k][0] = controller_value;
		                        do_layout = do_layout || this.settings["tree-options"][k][1];
		                    }
		                } else {
		                    var controller = d3.select("#" + k),
		                        controller_value = controller.attr("value") || controller.property("checked");
		
		                    if (controller_value != this.settings["tree-options"][k][0]) {
		                        this.settings["tree-options"][k][0] = controller_value;
		                        do_layout = do_layout || this.settings["tree-options"][k][1];
		                    }
		                }
		            }
		
		            // Update which_model
		            if (self.which_model != this.settings["tree-options"]["hyphy-tree-model"][0]) {
		                self.which_model = this.settings["tree-options"]["hyphy-tree-model"][0];
		                self.initializeTree();
		                return;
		            }
		
		            if (_.indexOf(_.keys(analysis_data), "tree") > -1) {
		                this.tree(analysis_data["tree"]).svg(svg);
		            } else {
		                this.tree(analysis_data["fits"][self.which_model]["tree string"]).svg(svg);
		            }
		
		            this.branch_lengths = this.getBranchLengths();
		
		            this.tree.font_size(18);
		            this.tree.scale_bar_font_size(14);
		            this.tree.node_circle_size(0);
		
		            this.tree.branch_length(function (n) {
		                if (self.branch_lengths) {
		                    return self.branch_lengths[n.name] || 0;
		                }
		                return undefined;
		            });
		
		            this.assignBranchAnnotations();
		
		            if (_.findKey(analysis_data, "partition")) {
		                this.partition = (this.settings["tree-options"]["hyphy-tree-highlight"] ? analysis_data["partition"][this.settings["tree-options"]["hyphy-tree-highlight"][0]] : null) || null;
		            } else {
		                this.partition = null;
		            }
		
		            self.omega_color = d3.scale.pow().exponent(self.scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(self.settings["tree-options"]["hyphy-tree-fill-color"][0] ? ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"] : ["#5e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"]).clamp(true);
		
		            self.tree.options({
		                'color-fill': self.settings["tree-options"]["hyphy-tree-fill-color"][0]
		            }, false);
		
		            d3.select(".phylotree-definitions").selectAll("linearGradient").remove();
		
		            // TODO: Should be a prop. Hide or show legend.
		            if (!this.settings["tree-options"]["hyphy-tree-hide-legend"][0]) {
		                d3.select("#color-legend").style("visibility", "visible");
		
		                if (self.legend_type) {
		                    self.renderDiscreteLegendColorScheme("tree_container");
		                } else {
		                    self.renderLegendColorScheme("tree_container", self.state.json["fits"][self.which_model]["annotation-tag"]);
		                }
		            } else {
		                d3.select("#color-legend").style("visibility", "hidden");
		            }
		
		            if (!skip_render) {
		                if (do_layout) {
		                    this.tree.update_layout();
		                }
		                //d3_phylotree_trigger_refresh(this.tree);
		                //this.tree.trigger_refresh();
		            }
		        }
		    },
		
		    componentDidMount: function componentDidMount() {
		        this.initialize();
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		        this.setState({
		            json: nextProps.json,
		            settings: nextProps.settings
		        });
		    },
		
		    componentDidUpdate: function componentDidUpdate() {
		        this.initialize();
		    },
		
		    render: function render() {
		
		        return React.createElement(
		            'div',
		            null,
		            React.createElement(
		                'div',
		                { className: 'row' },
		                React.createElement(
		                    'div',
		                    { className: 'cold-md-12' },
		                    React.createElement(
		                        'div',
		                        { className: 'input-group input-group-sm' },
		                        React.createElement(
		                            'div',
		                            { className: 'input-group-btn' },
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown' },
		                                'Export',
		                                React.createElement('span', { className: 'caret' })
		                            ),
		                            React.createElement(
		                                'ul',
		                                { className: 'dropdown-menu' },
		                                React.createElement(
		                                    'li',
		                                    { id: 'export-phylo-png' },
		                                    React.createElement(
		                                        'a',
		                                        { href: '#' },
		                                        React.createElement('i', { className: 'fa fa-image' }),
		                                        ' Image'
		                                    )
		                                ),
		                                React.createElement(
		                                    'li',
		                                    { id: 'export-phylo-nwk' },
		                                    React.createElement(
		                                        'a',
		                                        { href: '#' },
		                                        React.createElement('i', { className: 'fa fa-file-o' }),
		                                        ' Newick File'
		                                    )
		                                )
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', 'data-direction': 'vertical', 'data-amount': '1', title: 'Expand vertical spacing' },
		                                React.createElement('i', { className: 'fa fa-arrows-v' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', 'data-direction': 'vertical', 'data-amount': '-1', title: 'Compress vertical spacing' },
		                                React.createElement('i', { className: 'fa  fa-compress fa-rotate-135' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', 'data-direction': 'horizontal', 'data-amount': '1', title: 'Expand horizonal spacing' },
		                                React.createElement('i', { className: 'fa fa-arrows-h' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', 'data-direction': 'horizontal', 'data-amount': '-1', title: 'Compress horizonal spacing' },
		                                React.createElement('i', { className: 'fa  fa-compress fa-rotate-45' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', id: 'sort_ascending', title: 'Sort deepest clades to the bototm' },
		                                React.createElement('i', { className: 'fa fa-sort-amount-asc' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', id: 'sort_descending', title: 'Sort deepsest clades to the top' },
		                                React.createElement('i', { className: 'fa fa-sort-amount-desc' })
		                            ),
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default btn-sm', id: 'sort_original', title: 'Restore original order' },
		                                React.createElement('i', { className: 'fa fa-sort' })
		                            )
		                        ),
		                        React.createElement(
		                            'div',
		                            { className: 'input-group-btn', 'data-toggle': 'buttons' },
		                            React.createElement(
		                                'label',
		                                { className: 'btn btn-default active btn-sm' },
		                                React.createElement('input', { type: 'radio', name: 'options', className: 'phylotree-layout-mode', 'data-mode': 'linear', autoComplete: 'off', checked: '', title: 'Layout left-to-right' }),
		                                'Linear'
		                            ),
		                            React.createElement(
		                                'label',
		                                { className: 'btn btn-default  btn-sm' },
		                                React.createElement('input', { type: 'radio', name: 'options', className: 'phylotree-layout-mode', 'data-mode': 'radial', autoComplete: 'off', title: 'Layout radially' }),
		                                ' Radial'
		                            )
		                        ),
		                        React.createElement(
		                            'div',
		                            { className: 'input-group-btn', 'data-toggle': 'buttons' },
		                            React.createElement(
		                                'label',
		                                { className: 'btn btn-default active btn-sm' },
		                                React.createElement('input', { type: 'radio', className: 'phylotree-align-toggler', 'data-align': 'left', name: 'options-align', autoComplete: 'off', checked: '', title: 'Align tips labels to branches' }),
		                                React.createElement('i', { className: 'fa fa-align-left' })
		                            ),
		                            React.createElement(
		                                'label',
		                                { className: 'btn btn-default btn-sm' },
		                                React.createElement('input', { type: 'radio', className: 'phylotree-align-toggler', 'data-align': 'right', name: 'options-align', autoComplete: 'off', title: 'Align tips labels to the edge of the plot' }),
		                                React.createElement('i', { className: 'fa fa-align-right' })
		                            )
		                        ),
		                        React.createElement(
		                            'div',
		                            { className: 'input-group-btn' },
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown' },
		                                'Model',
		                                React.createElement('span', { className: 'caret' })
		                            ),
		                            React.createElement('ul', { className: 'dropdown-menu', id: 'hyphy-tree-model-list' })
		                        ),
		                        React.createElement('input', { type: 'text', className: 'form-control disabled', id: 'hyphy-tree-model', disabled: true }),
		                        React.createElement(
		                            'div',
		                            { id: 'hyphy-tree-highlight-div', className: 'input-group-btn' },
		                            React.createElement(
		                                'button',
		                                { type: 'button', className: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown' },
		                                'Highlight branch set',
		                                React.createElement('span', { className: 'caret' })
		                            ),
		                            React.createElement('ul', { className: 'dropdown-menu', id: 'hyphy-tree-highlight-branches' })
		                        ),
		                        React.createElement('input', { type: 'text', className: 'form-control disabled', id: 'hyphy-tree-highlight', disabled: true }),
		                        React.createElement(
		                            'span',
		                            { className: 'input-group-addon' },
		                            'Use model branch lengths',
		                            React.createElement('input', { type: 'checkbox', id: 'hyphy-tree-branch-lengths', className: 'hyphy-tree-trigger' })
		                        ),
		                        React.createElement(
		                            'span',
		                            { className: 'input-group-addon' },
		                            'Hide legend',
		                            React.createElement('input', { type: 'checkbox', id: 'hyphy-tree-hide-legend', className: 'hyphy-tree-trigger' })
		                        ),
		                        React.createElement(
		                            'span',
		                            { className: 'input-group-addon' },
		                            'Grayscale',
		                            React.createElement('input', { type: 'checkbox', id: 'hyphy-tree-fill-color', className: 'hyphy-tree-trigger' })
		                        )
		                    )
		                )
		            ),
		            React.createElement(
		                'div',
		                { className: 'row' },
		                React.createElement(
		                    'div',
		                    { className: 'col-md-12' },
		                    React.createElement(
		                        'div',
		                        { className: 'row' },
		                        React.createElement('div', { id: 'tree_container', className: 'tree-widget' })
		                    )
		                )
		            )
		        );
		    }
		
		});
		
		function render_tree(json, element, settings) {
		    return React.render(React.createElement(Tree, { json: json, settings: settings }), $(element)[0]);
		}
		
		function rerender_tree(json, element, settings) {
		    $(element).empty();
		    return render_tree(json, settings);
		}
		
		module.exports.Tree = Tree;
		module.exports.render_tree = render_tree;
		module.exports.rerender_tree = rerender_tree;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 209:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(_, d3, $) {'use strict';
		
		var _prop_chart = __webpack_require__(210);
		
		var React = __webpack_require__(44);
		
		
		var BranchTable = React.createClass({
		  displayName: 'BranchTable',
		
		
		  getInitialState: function getInitialState() {
		
		    // add the following
		    var table_row_data = this.getBranchRows(this.props.tree, this.props.test_results, this.props.annotations),
		        table_columns = this.getBranchColumns(table_row_data),
		        initial_model_name = _.take(_.keys(this.props.annotations)),
		        initial_omegas = this.props.annotations ? this.props.annotations[initial_model_name]["omegas"] : null;
		
		    var distro_settings = {
		      dimensions: { width: 600, height: 400 },
		      margins: { 'left': 50, 'right': 15, 'bottom': 15, 'top': 35 },
		      legend: false,
		      domain: [0.00001, 10000],
		      do_log_plot: true,
		      k_p: null,
		      plot: null,
		      svg_id: "prop-chart"
		    };
		
		    return {
		      tree: this.props.tree,
		      test_results: this.props.test_results,
		      annotations: this.props.annotations,
		      table_row_data: table_row_data,
		      table_columns: table_columns,
		      current_model_name: initial_model_name,
		      current_omegas: initial_omegas,
		      distro_settings: distro_settings
		    };
		  },
		
		  getBranchLength: function getBranchLength(m) {
		
		    if (!this.state.tree) {
		      return '';
		    }
		
		    return d3.format(".4f")(this.state.tree.get_node_by_name(m).attribute);
		  },
		
		  getLRT: function getLRT(branch) {
		    var formatted = d3.format(".4f")(branch["LRT"]);
		    if (formatted == "NaN") {
		      return branch["LRT"];
		    } else {
		      return formatted;
		    }
		  },
		
		  getPVal: function getPVal(branch) {
		    return d3.format(".4f")(branch["p"]);
		  },
		
		  getUncorrectedPVal: function getUncorrectedPVal(branch) {
		    return d3.format(".4f")(branch["uncorrected p"]);
		  },
		
		  getOmegaDistribution: function getOmegaDistribution(m, annotations) {
		
		    if (!annotations) {
		      return '';
		    }
		
		    var omega_string = "";
		
		    for (var i in annotations[m]["omegas"]) {
		      var omega = parseFloat(annotations[m]["omegas"][i]["omega"]);
		      var formatted_omega = "∞";
		      if (omega < 1e+20) {
		        formatted_omega = d3.format(".3r")(omega);
		      }
		      omega_string += "&omega;<sub>" + (parseInt(i) + 1) + "</sub> = " + formatted_omega + " (" + d3.format(".2p")(annotations[m]["omegas"][i]["prop"]) + ")<br/>";
		    }
		
		    return omega_string;
		  },
		
		  getBranchRows: function getBranchRows(tree, test_results, annotations) {
		
		    var self = this;
		
		    var table_row_data = [],
		        omega_format = d3.format(".3r"),
		        prop_format = d3.format(".2p");
		
		    for (var m in test_results) {
		
		      var branch_row = [];
		      var branch = test_results[m];
		
		      branch_row = [m, this.getBranchLength(m), this.getLRT(branch), this.getPVal(branch), this.getUncorrectedPVal(branch), this.getOmegaDistribution(m, annotations)];
		
		      table_row_data.push(branch_row);
		    }
		
		    table_row_data.sort(function (a, b) {
		
		      if (a[0] == b[0]) {
		        return a[1] < b[1] ? -1 : a[1] == b[1] ? 0 : 1;
		      }
		
		      return a[3] - b[3];
		    });
		
		    return table_row_data;
		  },
		
		  setEvents: function setEvents() {
		
		    var self = this;
		
		    if (self.state.annotations) {
		      var branch_table = d3.select('#table-branch-table').selectAll("tr");
		
		      branch_table.on("click", function (d) {
		        var label = d[0];
		        self.setState({
		          current_model_name: label,
		          current_omegas: self.state.annotations[label]["omegas"]
		        });
		      });
		    }
		  },
		
		  createDistroChart: function createDistroChart() {
		
		    var self = this;
		
		    this.settings = {
		      dimensions: { width: 600, height: 400 },
		      margins: { 'left': 50, 'right': 15, 'bottom': 15, 'top': 15 },
		      has_zeros: true,
		      legend_id: null,
		      do_log_plot: true,
		      k_p: null,
		      plot: null,
		      svg_id: "prop-chart"
		    };
		  },
		
		  getBranchColumns: function getBranchColumns(table_row_data) {
		
		    if (table_row_data.length <= 0) {
		      return null;
		    }
		
		    var name_header = '<th>Name</th>',
		        length_header = '<th><abbr title="Branch Length">B</abbr></th>',
		        lrt_header = '<th><abbr title="Likelihood ratio test statistic">LRT</abbr></th>',
		        pvalue_header = '<th>Test p-value</th>',
		        uncorrected_pvalue_header = '<th>Uncorrected p-value</th>',
		        omega_header = '<th>ω distribution over sites</th>';
		
		    // inspect table_row_data and return header
		    var all_columns = [name_header, length_header, lrt_header, pvalue_header, uncorrected_pvalue_header, omega_header];
		
		    // validate each table row with its associated header
		
		    // trim columns to length of table_row_data
		    var column_headers = _.take(all_columns, table_row_data[0].length);
		
		    // remove all columns that have 0, null, or undefined rows
		    var items = d3.transpose(table_row_data);
		
		    return column_headers;
		  },
		
		  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		    var table_row_data = this.getBranchRows(nextProps.tree, nextProps.test_results, nextProps.annotations),
		        table_columns = this.getBranchColumns(table_row_data),
		        initial_model_name = _.take(_.keys(nextProps.annotations)),
		        initial_omegas = nextProps.annotations ? nextProps.annotations[initial_model_name]["omegas"] : null;
		
		    var distro_settings = {
		      dimensions: { width: 600, height: 400 },
		      margins: { 'left': 50, 'right': 15, 'bottom': 15, 'top': 15 },
		      legend: false,
		      domain: [0.00001, 10000],
		      do_log_plot: true,
		      k_p: null,
		      plot: null,
		      svg_id: "prop-chart"
		    };
		
		    if (nextProps.test_results && nextProps.annotations) {
		      this.setState({
		        tree: nextProps.tree,
		        test_results: nextProps.test_results,
		        annotations: nextProps.annotations,
		        table_row_data: table_row_data,
		        table_columns: table_columns,
		        current_model_name: initial_model_name,
		        current_omegas: initial_omegas,
		        distro_settings: distro_settings
		      });
		    }
		  },
		
		  componentDidUpdate: function componentDidUpdate() {
		
		    var branch_columns = d3.select('#table-branch-header');
		    branch_columns = branch_columns.selectAll("th").data(this.state.table_columns);
		    branch_columns.enter().append("th");
		
		    branch_columns.html(function (d) {
		      return d;
		    });
		
		    var branch_rows = d3.select('#table-branch-table').selectAll("tr").data(this.state.table_row_data);
		
		    branch_rows.enter().append('tr');
		    branch_rows.exit().remove();
		    branch_rows.style('font-weight', function (d) {
		      return d[3] <= 0.05 ? 'bold' : 'normal';
		    });
		
		    branch_rows = branch_rows.selectAll("td").data(function (d) {
		      return d;
		    });
		
		    branch_rows.enter().append("td");
		    branch_rows.html(function (d) {
		      return d;
		    });
		
		    this.createDistroChart();
		    this.setEvents();
		  },
		
		  render: function render() {
		
		    var self = this;
		
		    return React.createElement(
		      'div',
		      { className: 'row' },
		      React.createElement(
		        'div',
		        { id: 'hyphy-branch-table', className: 'col-md-7' },
		        React.createElement(
		          'table',
		          { className: 'table table-hover table-condensed' },
		          React.createElement('thead', { id: 'table-branch-header' }),
		          React.createElement('tbody', { id: 'table-branch-table' })
		        )
		      ),
		      React.createElement(
		        'div',
		        { id: 'primary-omega-tag', className: 'col-md-5' },
		        React.createElement(_prop_chart.PropChart, { name: self.state.current_model_name, omegas: self.state.current_omegas,
		          settings: self.state.distro_settings })
		      )
		    );
		  }
		
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_branch_table(tree, test_results, annotations, element) {
		  React.render(React.createElement(BranchTable, { tree: tree, test_results: test_results, annotations: annotations }), $(element)[0]);
		}
		
		// Will need to make a call to this
		// omega distributions
		function rerender_branch_table(tree, test_results, annotations, element) {
		  $(element).empty();
		  render_branch_table(tree, test_results, annotations, element);
		}
		
		module.exports.BranchTable = BranchTable;
		module.exports.render_branch_table = render_branch_table;
		module.exports.rerender_branch_table = rerender_branch_table;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(41), __webpack_require__(38), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 210:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _, $) {'use strict';
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		
		var PropChart = React.createClass({
		    displayName: 'PropChart',
		
		
		    getDefaultProps: function getDefaultProps() {
		        return {
		            svg_id: null,
		            dimensions: { width: 600, height: 400 },
		            margins: { 'left': 50, 'right': 15, 'bottom': 25, 'top': 35 },
		            has_zeros: false,
		            legend_id: null,
		            do_log_plot: true,
		            k_p: null,
		            plot: null
		        };
		    },
		
		    getInitialState: function getInitialState() {
		        return {
		            model_name: this.props.name,
		            omegas: this.props.omegas,
		            settings: this.props.settings
		        };
		    },
		
		    setEvents: function setEvents() {
		        var self = this;
		
		        d3.select("#" + this.save_svg_id).on('click', function (e) {
		            datamonkey.save_image("svg", "#" + self.svg_id);
		        });
		
		        d3.select("#" + this.save_png_id).on('click', function (e) {
		            datamonkey.save_image("png", "#" + self.svg_id);
		        });
		    },
		
		    initialize: function initialize() {
		
		        // clear svg
		        d3.select("#prop-chart").html("");
		
		        this.data_to_plot = this.state.omegas;
		
		        // Set props from settings
		        this.svg_id = this.props.settings.svg_id;
		        this.dimensions = this.props.settings.dimensions || this.props.dimensions;
		        this.margins = this.props.settings.margins || this.props.margins;
		        this.legend_id = this.props.settings.legend || this.props.legend_id;
		        this.do_log_plot = this.props.settings.log || this.props.do_log_plot;
		        this.k_p = this.props.settings.k || this.props.k_p;
		
		        var dimensions = this.props.dimensions;
		        var margins = this.props.margins;
		
		        if (this.props.do_log_plot) {
		            this.has_zeros = this.data_to_plot.some(function (d) {
		                return d.omega <= 0;
		            });
		        }
		
		        this.plot_width = dimensions["width"] - margins['left'] - margins['right'], this.plot_height = dimensions["height"] - margins['top'] - margins['bottom'];
		
		        var domain = this.state.settings["domain"];
		
		        this.omega_scale = (this.do_log_plot ? this.has_zeros ? d3.scale.pow().exponent(0.2) : d3.scale.log() : d3.scale.linear()).range([0, this.plot_width]).domain(domain).nice();
		
		        this.proportion_scale = d3.scale.linear().range([this.plot_height, 0]).domain([-0.05, 1]).clamp(true);
		
		        // compute margins -- circle AREA is proportional to the relative weight
		        // maximum diameter is (height - text margin)
		        this.svg = d3.select("#" + this.svg_id).attr("width", dimensions.width + margins['left'] + margins['right']).attr("height", dimensions.height + margins['top'] + margins['bottom']);
		
		        this.plot = this.svg.selectAll(".container");
		
		        this.svg.selectAll("defs").remove();
		
		        this.svg.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 10) /*must be smarter way to calculate shift*/
		        .attr("refY", 4).attr("markerWidth", 10).attr("markerHeight", 8).attr("orient", "auto").attr("stroke", "#000").attr("fill", "#000").append("path").attr("d", "M 0,0 V8 L10,4 Z");
		
		        if (this.plot.empty()) {
		            this.plot = this.svg.append("g").attr("class", "container");
		        }
		
		        this.plot.attr("transform", "translate(" + this.margins["left"] + " , " + this.margins["top"] + ")");
		        this.reference_omega_lines = this.plot.selectAll(".hyphy-omega-line-reference"), this.displacement_lines = this.plot.selectAll(".hyphy-displacement-line");
		
		        this.createNeutralLine();
		        this.createXAxis();
		        this.createYAxis();
		        this.setEvents();
		        this.createOmegaLine(this.state.omegas);
		        console.log('initialized everything');
		        //_.map(this.props.omegas, function(d) { return this.createOmegaLine(d["omega"],d["prop"]); });
		
		        console.log(this.svg);
		    },
		
		    createOmegaLine: function createOmegaLine(omegas) {
		
		        var self = this;
		        var data_to_plot = this.data_to_plot;
		
		        // generate color wheel from omegas
		        self.colores_g = _.shuffle(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);
		
		        // ** Omega Line (Red) ** //
		        var omega_lines = this.plot.selectAll(".hyphy-omega-line").data(omegas);
		        omega_lines.enter().append("line");
		        omega_lines.exit().remove();
		
		        omega_lines.transition().attr("x1", function (d) {
		            return self.omega_scale(d.omega);
		        }).attr("x2", function (d) {
		            return self.omega_scale(d.omega);
		        }).attr("y1", function (d) {
		            return self.proportion_scale(-0.05);
		        }).attr("y2", function (d) {
		            return self.proportion_scale(d.prop);
		        }).style("stroke", function (d) {
		            var color = _.take(self.colores_g);
		            self.colores_g = _.rest(self.colores_g);
		            return color;
		        }).attr("class", "hyphy-omega-line");
		    },
		
		    createNeutralLine: function createNeutralLine() {
		        var self = this;
		
		        // ** Neutral Line (Blue) ** //
		        var neutral_line = this.plot.selectAll(".hyphy-neutral-line").data([1]);
		        neutral_line.enter().append("line").attr("class", "hyphy-neutral-line");
		        neutral_line.exit().remove();
		        neutral_line.transition().attr("x1", function (d) {
		            return self.omega_scale(d);
		        }).attr("x2", function (d) {
		            return self.omega_scale(d);
		        }).attr("y1", 0).attr("y2", this.plot_height);
		    },
		    createXAxis: function createXAxis() {
		
		        // *** X-AXIS *** //
		        var xAxis = d3.svg.axis().scale(this.omega_scale).orient("bottom");
		
		        if (this.do_log_plot) {
		            xAxis.ticks(10, this.has_zeros ? ".2r" : ".1r");
		        }
		
		        var x_axis = this.svg.selectAll(".x.axis");
		        var x_label;
		
		        if (x_axis.empty()) {
		            x_axis = this.svg.append("g").attr("class", "x hyphy-axis");
		
		            x_label = x_axis.append("g").attr("class", "hyphy-axis-label x-label");
		        } else {
		            x_label = x_axis.select(".axis-label.x-label");
		        }
		
		        x_axis.attr("transform", "translate(" + this.margins["left"] + "," + (this.plot_height + this.margins["top"]) + ")").call(xAxis);
		        x_label = x_label.attr("transform", "translate(" + this.plot_width + "," + this.margins["bottom"] + ")").selectAll("text").data(['\u03C9']);
		        x_label.enter().append("text");
		        x_label.text(function (d) {
		            return d;
		        }).style("text-anchor", "end").attr("dy", "0.0em");
		    },
		    createYAxis: function createYAxis() {
		
		        // *** Y-AXIS *** //
		        var yAxis = d3.svg.axis().scale(this.proportion_scale).orient("left").ticks(10, ".1p");
		
		        var y_axis = this.svg.selectAll(".y.hyphy-axis");
		        var y_label;
		
		        if (y_axis.empty()) {
		            y_axis = this.svg.append("g").attr("class", "y hyphy-axis");
		            y_label = y_axis.append("g").attr("class", "hyphy-axis-label y-label");
		        } else {
		            y_label = y_axis.select(".hyphy-axis-label.y-label");
		        }
		        y_axis.attr("transform", "translate(" + this.margins["left"] + "," + this.margins["top"] + ")").call(yAxis);
		        y_label = y_label.attr("transform", "translate(" + -this.margins["left"] + "," + 0 + ")").selectAll("text").data(["Proportion of sites"]);
		        y_label.enter().append("text");
		        y_label.text(function (d) {
		            return d;
		        }).style("text-anchor", "start").attr("dy", "-1em");
		    },
		
		    componentDidMount: function componentDidMount() {
		        try {
		            this.initialize();
		        } catch (e) {};
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		        this.setState({
		            model_name: nextProps.name,
		            omegas: nextProps.omegas
		        });
		    },
		
		    componentDidUpdate: function componentDidUpdate() {
		        try {
		            this.initialize();
		        } catch (e) {};
		    },
		
		    render: function render() {
		
		        this.save_svg_id = "export-" + this.svg_id + "-svg";
		        this.save_png_id = "export-" + this.svg_id + "-png";
		
		        return React.createElement(
		            'div',
		            { className: 'panel panel-default', id: this.state.model_name },
		            React.createElement(
		                'div',
		                { className: 'panel-heading' },
		                React.createElement(
		                    'h3',
		                    { className: 'panel-title' },
		                    React.createElement(
		                        'strong',
		                        null,
		                        this.state.model_name
		                    )
		                ),
		                React.createElement(
		                    'p',
		                    null,
		                    '\u03C9 distribution'
		                ),
		                React.createElement(
		                    'div',
		                    { className: 'btn-group' },
		                    React.createElement(
		                        'button',
		                        { id: this.save_svg_id, type: 'button', className: 'btn btn-default btn-sm' },
		                        React.createElement('span', { className: 'glyphicon glyphicon-floppy-save' }),
		                        ' SVG'
		                    ),
		                    React.createElement(
		                        'button',
		                        { id: this.save_png_id, type: 'button', className: 'btn btn-default btn-sm' },
		                        React.createElement('span', { className: 'glyphicon glyphicon-floppy-save' }),
		                        ' PNG'
		                    )
		                )
		            ),
		            React.createElement(
		                'div',
		                { className: 'panel-body' },
		                React.createElement('svg', { id: this.svg_id })
		            )
		        );
		    }
		});
		
		function render_prop_chart(model_name, omegas, settings) {
		    return React.render(React.createElement(PropChart, { name: model_name, omegas: omegas, settings: settings }), document.getElementById("primary-omega-tag"));
		}
		
		function rerender_prop_chart(model_name, omeags, settings) {
		
		    $("#primary-omega-tag").empty();
		    return render_prop_chart(model_name, omeags, settings);
		}
		
		module.exports.render_prop_chart = render_prop_chart;
		module.exports.rerender_prop_chart = rerender_prop_chart;
		module.exports.PropChart = PropChart;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 211:
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		
		module.exports = __webpack_require__(46);
	
	
	/***/ },
	
	/***/ 212:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, $) {'use strict';
		
		__webpack_require__(213);
		
		var crossfilter = __webpack_require__(215),
		    dc = __webpack_require__(218),
		    datamonkey = __webpack_require__(37);
		
		function busted_render_summary(json) {
		
		    var fit_format = d3.format(".2f"),
		        prop_format = d3.format(".2p"),
		        omega_format = d3.format(".3r");
		
		    var format_run_time = function format_run_time(seconds) {
		
		        var duration_string = "";
		        seconds = parseFloat(seconds);
		        var split_array = [Math.floor(seconds / (24 * 3600)), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60],
		            quals = ["d.", "hrs.", "min.", "sec."];
		
		        split_array.forEach(function (d, i) {
		            if (d) {
		                duration_string += " " + d + " " + quals[i];
		            }
		        });
		
		        return duration_string;
		    };
		
		    var branch_p_values = {};
		
		    var rate_distro_by_branch = {},
		        branch_count = 1,
		        selected_count = 0,
		        tested_count = 0;
		
		    var for_branch_table = [];
		
		    //var tree_info = render_bs_rel_tree (json, "Unconstrained model");
		
		    //var branch_lengths   = tree_info[0],
		    //    tested_branches  = {};
		
		    for (var p in json["test results"]) {
		        branch_p_values[p] = json["test results"]["p"];
		        if (branch_p_values[p] <= 0.05) {
		            selected_count++;
		        }
		    }
		
		    var fitted_distributions = json["fits"]["Unconstrained model"]["rate distributions"];
		
		    for (var b in fitted_distributions) {
		        //for_branch_table.push ([b + (tested_branches[b] ? "" : ""),branch_lengths[b],0,0,0]);
		        try {
		            for_branch_table[branch_count][2] = json["test results"][b]["LRT"];
		            for_branch_table[branch_count][3] = json["test results"][b]["p"];
		            for_branch_table[branch_count][4] = json["test results"][b]["uncorrected p"];
		        } catch (e) {}
		
		        var rateD = fitted_distributions[b];
		        rate_distro_by_branch[b] = rateD;
		        //for_branch_table[branch_count].push (branch_omegas[b]['distro']);
		        branch_count += 1;
		    }
		
		    // render summary data
		    var total_tree_length = d3.format("g")(json["fits"]["Unconstrained model"]["tree length"]);
		
		    for_branch_table = for_branch_table.sort(function (a, b) {
		        return a[4] - b[4];
		    });
		
		    d3.select('#summary-test-result').text(json['test results']['p'] <= 0.05 ? "evidence" : "no evidence");
		    d3.select('#summary-test-pvalue').text(d3.format(".3f")(json['test results']['p']));
		    d3.select('#summary-pmid').text("PubMed ID " + json['PMID']).attr("href", "http://www.ncbi.nlm.nih.gov/pubmed/" + json['PMID']);
		    d3.select('#summary-total-runtime').text(format_run_time(json['timers']['overall']));
		    d3.select('#summary-total-branches').text(branch_count);
		    d3.select('#summary-tested-branches').text(tested_count);
		    d3.select('#summary-selected-branches').text(selected_count);
		
		    has_background = json['background'];
		
		    var model_rows = [[], []];
		
		    if (has_background) {
		        model_rows.push([]);
		    }
		
		    for (k = 0; k < 2 + has_background; k++) {
		
		        var access_key,
		            secondary_key,
		            only_distro = 0;
		
		        if (k === 0) {
		
		            access_key = 'Unconstrained model';
		            secondary_key = 'FG';
		            model_rows[k].push('Unconstrained Model');
		            only_distro = 0;
		        } else {
		
		            if (has_background && k == 1) {
		                model_rows[k].push('(background branches)');
		                secondary_key = 'BG';
		                only_distro = 1;
		            } else {
		                access_key = 'Constrained model';
		                if (!(access_key in json['fits'])) {
		                    break;
		                }
		                model_rows[k].push('Constrained Model');
		                secondary_key = 'FG';
		                only_distro = 0;
		            }
		        }
		
		        try {
		            model_rows[k].push(only_distro ? '' : fit_format(json['fits'][access_key]['log-likelihood']));
		            model_rows[k].push(only_distro ? '' : json['fits'][access_key]['parameters']);
		            model_rows[k].push(only_distro ? '' : fit_format(json['fits'][access_key]['AIC-c']));
		            model_rows[k].push(only_distro ? '' : format_run_time(json['fits'][access_key]['runtime']));
		            model_rows[k].push(only_distro ? '' : fit_format(json['fits'][access_key]['tree length']));
		
		            for (j = 0; j < 3; j++) {
		                model_rows[k].push(omega_format(json['fits'][access_key]['rate distributions'][secondary_key][j][0]) + " (" + prop_format(json['fits'][access_key]['rate distributions'][secondary_key][j][1]) + ")");
		            }
		        } catch (e) {
		            datamonkey.errorModal(e);
		        }
		    }
		
		    model_rows = d3.select('#summary-model-table').selectAll("tr").data(model_rows);
		    model_rows.enter().append('tr');
		    model_rows.exit().remove();
		    model_rows = model_rows.selectAll("td").data(function (d) {
		        return d;
		    });
		    model_rows.enter().append("td");
		    model_rows.html(function (d) {
		        return d;
		    });
		}
		
		function busted_render_histogram(c, json) {
		
		    var self = this;
		
		    // Massage data for use with crossfilter
		    if (d3.keys(json["evidence ratios"]).length === 0) {
		        // no evidence ratios computed
		        d3.selectAll(c).style("display", "none");
		        d3.selectAll(".dc-data-table").style("display", "none");
		        //d3.selectAll ('[id^="export"]').style ("display", "none");
		        d3.selectAll("#er-thresholds").style("display", "none");
		        d3.selectAll("#apply-thresholds").style("display", "none");
		        return;
		    } else {
		        d3.selectAll(c).style("display", "block");
		        d3.selectAll(".dc-data-table").style("display", "table");
		        //d3.selectAll ('[id^="export"]').style ("display", "block");
		        d3.selectAll("#er-thresholds").style("display", "block");
		        d3.selectAll("#apply-thresholds").style("display", "block");
		    }
		
		    var erc = json["evidence ratios"]["constrained"][0];
		    erc = erc.map(function (d) {
		        return Math.log(d);
		    });
		
		    var test_set = json["test set"].split(",");
		    var model_results = [];
		
		    erc.forEach(function (elem, i) {
		        model_results.push({
		            "site_index": i + 1,
		            "unconstrained": json["profiles"]["unconstrained"][0][i],
		            "constrained": json["profiles"]["constrained"][0][i],
		            "optimized_null": json["profiles"]["optimized null"][0][i],
		            "er_constrained": Math.log(json["evidence ratios"]["constrained"][0][i]),
		            "er_optimized_null": Math.log(json["evidence ratios"]["optimized null"][0][i])
		        });
		    });
		
		    var data = crossfilter(model_results);
		    var site_index = data.dimension(function (d) {
		        return d["site_index"];
		    });
		
		    var sitesByConstrained = site_index.group().reduce(function (p, v) {
		        p.constrained_evidence += +v["er_constrained"];
		        p.optimized_null_evidence += +v["er_optimized_null"];
		        return p;
		    }, function (p, v) {
		        p.constrained_evidence -= +v["er_constrained"];
		        p.optimized_null_evidence -= +v["er_optimized_null"];
		        return p;
		    }, function () {
		        return { constrained_evidence: 0, optimized_null_evidence: 0 };
		    });
		
		    var sitesByON = site_index.group().reduce(function (p, v) {
		        p.optimized_null_evidence += +v["er_optimized_null"];
		        return p;
		    }, function (p, v) {
		        p.optimized_null_evidence -= +v["er_optimized_null"];
		        return p;
		    }, function () {
		        return { optimized_null_evidence: 0 };
		    });
		
		    // Set up new crossfilter dimensions to slice the table by constrained or ON evidence ratio.
		    var er_constrained = data.dimension(function (d) {
		        return d["er_constrained"];
		    });
		    var er_optimized_null = data.dimension(function (d) {
		        return d["er_optimized_null"];
		    });
		    self.er_constrained = er_constrained;
		    self.er_optimized_null = er_optimized_null;
		
		    var composite = dc.compositeChart(c);
		
		    composite.width($(window).width()).height(300).dimension(site_index).x(d3.scale.linear().domain([1, erc.length])).yAxisLabel("2 * Ln Evidence Ratio").xAxisLabel("Site Location").legend(dc.legend().x($(window).width() - 150).y(20).itemHeight(13).gap(5)).renderHorizontalGridLines(true).compose([dc.lineChart(composite).group(sitesByConstrained, "Constrained").colors(d3.scale.ordinal().range(['green'])).valueAccessor(function (d) {
		        return 2 * d.value.constrained_evidence;
		    }).keyAccessor(function (d) {
		        return d.key;
		    }), dc.lineChart(composite).group(sitesByON, "Optimized Null").valueAccessor(function (d) {
		        return 2 * d.value.optimized_null_evidence;
		    }).keyAccessor(function (d) {
		        return d.key;
		    }).colors(d3.scale.ordinal().range(['red']))]);
		
		    composite.xAxis().ticks(50);
		
		    var numberFormat = d3.format(".4f");
		
		    // Render the table
		    dc.dataTable(".dc-data-table").dimension(site_index)
		    // data table does not use crossfilter group but rather a closure
		    // as a grouping function
		    .group(function (d) {
		        return site_index.bottom(1)[0].site_index + " - " + site_index.top(1)[0].site_index;
		    }).size(site_index.groupAll().reduceCount().value()) // (optional) max number of records to be shown, :default = 25
		    // dynamic columns creation using an array of closures
		    .columns([function (d) {
		        return d.site_index;
		    }, function (d) {
		        return numberFormat(d["unconstrained"]);
		    }, function (d) {
		        return numberFormat(d["constrained"]);
		    }, function (d) {
		        return numberFormat(d["optimized_null"]);
		    }, function (d) {
		        return numberFormat(d["er_constrained"]);
		    }, function (d) {
		        return numberFormat(d["er_optimized_null"]);
		    }])
		
		    // (optional) sort using the given field, :default = function(d){return d;}
		    .sortBy(function (d) {
		        return d.site_index;
		    })
		
		    // (optional) sort order, :default ascending
		    .order(d3.ascending)
		
		    // (optional) custom renderlet to post-process chart using D3
		    .renderlet(function (table) {
		        table.selectAll(".dc-table-group").classed("info", true);
		    });
		
		    $("#export-csv").on('click', function (e) {
		        datamonkey.export_csv_button(site_index.top(Infinity));
		    });
		
		    $("#export-chart-svg").on('click', function (e) {
		        // class manipulation for the image to display correctly
		        $("#chart-id").find("svg")[0].setAttribute("class", "dc-chart");
		        datamonkey.save_image("svg", "#chart-id");
		        $("#chart-id").find("svg")[0].setAttribute("class", "");
		    });
		
		    $("#export-chart-png").on('click', function (e) {
		        // class manipulation for the image to display correctly
		        $("#chart-id").find("svg")[0].setAttribute("class", "dc-chart");
		        datamonkey.save_image("png", "#chart-id");
		        $("#chart-id").find("svg")[0].setAttribute("class", "");
		    });
		    $("#apply-thresholds").on('click', function (e) {
		        var erConstrainedThreshold = document.getElementById("er-constrained-threshold").value;
		        var erOptimizedNullThreshold = document.getElementById("er-optimized-null-threshold").value;
		        self.er_constrained.filter(function (d) {
		            return d >= erConstrainedThreshold;
		        });
		        self.er_optimized_null.filter(function (d) {
		            return d >= erOptimizedNullThreshold;
		        });
		        dc.renderAll();
		    });
		
		    dc.renderAll();
		}
		
		module.exports.render_summary = busted_render_summary;
		module.exports.render_histogram = busted_render_histogram;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 213:
	/***/ function(module, exports) {
	
		// removed by extract-text-webpack-plugin
	
	/***/ },
	
	/***/ 219:
	/***/ function(module, exports) {
	
		// removed by extract-text-webpack-plugin
	
	/***/ },
	
	/***/ 221:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, _, $) {"use strict";
		
		var _tree = __webpack_require__(207);
		
		var _model_fits = __webpack_require__(205);
		
		var _tree_summary = __webpack_require__(206);
		
		var _prop_chart = __webpack_require__(210);
		
		__webpack_require__(208);
		__webpack_require__(219);
		
		var React = __webpack_require__(44),
		    ReactDOM = __webpack_require__(211);
		
		var datamonkey = __webpack_require__(37),
		    busted = __webpack_require__(212);
		
		var BUSTED = React.createClass({
		  displayName: "BUSTED",
		
		
		  float_format: d3.format(".2f"),
		  p_value_format: d3.format(".4f"),
		  fit_format: d3.format(".2f"),
		
		  loadFromServer: function loadFromServer() {
		
		    var self = this;
		
		    d3.json(this.props.url, function (data) {
		
		      data["fits"]["Unconstrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Unconstrained model");
		      data["fits"]["Constrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Constrained model");
		
		      // rename rate distributions
		      data["fits"]["Unconstrained model"]["rate-distributions"] = data["fits"]["Unconstrained model"]["rate distributions"];
		      data["fits"]["Constrained model"]["rate-distributions"] = data["fits"]["Constrained model"]["rate distributions"];
		
		      // set display order
		      data["fits"]["Unconstrained model"]["display-order"] = 0;
		      data["fits"]["Constrained model"]["display-order"] = 1;
		
		      var json = data,
		          pmid = "25701167",
		          pmid_text = "PubMed ID " + pmid,
		          pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid,
		          p = json["test results"]["p"],
		          test_result = p <= 0.05 ? "evidence" : "no evidence";
		
		      var fg_rate = json["fits"]["Unconstrained model"]["rate distributions"]["FG"];
		      var mapped_omegas = { "omegas": _.map(fg_rate, function (d) {
		          return _.object(["omega", "prop"], d);
		        }) };
		
		      self.setState({
		        p: p,
		        test_result: test_result,
		        json: json,
		        omegas: mapped_omegas["omegas"],
		        pmid_text: pmid_text,
		        pmid_href: pmid_href
		      });
		    });
		  },
		
		  getDefaultProps: function getDefaultProps() {
		
		    var edgeColorizer = function edgeColorizer(element, data) {
		
		      var is_foreground = data.target.annotations.is_foreground,
		          color_fill = this.options()["color-fill"] ? "black" : "red";
		
		      element.style('stroke', is_foreground ? color_fill : 'gray').style('stroke-linejoin', 'round').style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
		    };
		
		    var tree_settings = {
		      'omegaPlot': {},
		      'tree-options': {
		        /* value arrays have the following meaning
		            [0] - the value of the attribute
		            [1] - does the change in attribute value trigger tree re-layout?
		        */
		        'hyphy-tree-model': ["Unconstrained model", true],
		        'hyphy-tree-highlight': ["RELAX.test", false],
		        'hyphy-tree-branch-lengths': [true, true],
		        'hyphy-tree-hide-legend': [true, false],
		        'hyphy-tree-fill-color': [true, false]
		      },
		      'hyphy-tree-legend-type': 'discrete',
		      'suppress-tree-render': false,
		      'chart-append-html': true,
		      'edgeColorizer': edgeColorizer
		    };
		
		    var distro_settings = {
		      dimensions: { width: 600, height: 400 },
		      margins: { 'left': 50, 'right': 15, 'bottom': 35, 'top': 35 },
		      legend: false,
		      domain: [0.00001, 100],
		      do_log_plot: true,
		      k_p: null,
		      plot: null,
		      svg_id: "prop-chart"
		    };
		
		    return {
		      distro_settings: distro_settings,
		      tree_settings: tree_settings,
		      constrained_threshold: "Infinity",
		      null_threshold: "-Infinity",
		      model_name: "FG"
		    };
		  },
		
		  getInitialState: function getInitialState() {
		    return {
		      p: null,
		      test_result: null,
		      json: null,
		      omegas: null,
		      pmid_text: null,
		      pmid_href: null
		    };
		  },
		
		  setEvents: function setEvents() {
		
		    var self = this;
		
		    $("#json_file").on("change", function (e) {
		      var files = e.target.files; // FileList object
		      if (files.length == 1) {
		        var f = files[0];
		        var reader = new FileReader();
		        reader.onload = function (theFile) {
		          return function (e) {
		
		            var data = JSON.parse(this.result);
		            data["fits"]["Unconstrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Unconstrained model");
		            data["fits"]["Constrained model"]["branch-annotations"] = self.formatBranchAnnotations(data, "Constrained model");
		
		            // rename rate distributions
		            data["fits"]["Unconstrained model"]["rate-distributions"] = data["fits"]["Unconstrained model"]["rate distributions"];
		            data["fits"]["Constrained model"]["rate-distributions"] = data["fits"]["Constrained model"]["rate distributions"];
		
		            var json = data,
		                pmid = "25701167",
		                pmid_text = "PubMed ID " + pmid,
		                pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid,
		                p = json["test results"]["p"],
		                test_result = p <= 0.05 ? "evidence" : "no evidence";
		
		            var fg_rate = json["fits"]["Unconstrained model"]["rate distributions"]["FG"];
		            var mapped_omegas = { "omegas": _.map(fg_rate, function (d) {
		                return _.object(["omega", "prop"], d);
		              }) };
		
		            self.setState({
		              p: p,
		              test_result: test_result,
		              json: json,
		              omegas: mapped_omegas["omegas"],
		              pmid_text: pmid_text,
		              pmid_href: pmid_href
		            });
		          };
		        }(f);
		        reader.readAsText(f);
		      }
		      $("#datamonkey-absrel-toggle-here").dropdown("toggle");
		      e.preventDefault();
		    });
		  },
		
		  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
		
		    // attach is_foreground to branch annotations
		    var foreground = json["test set"].split(",");
		
		    var tree = d3.layout.phylotree(),
		        nodes = tree(json["fits"][key]["tree string"]).get_nodes(),
		        node_names = _.map(nodes, function (d) {
		      return d.name;
		    });
		
		    // Iterate over objects
		    var branch_annotations = _.object(node_names, _.map(node_names, function (d) {
		      return { is_foreground: _.indexOf(foreground, d) > -1 };
		    }));
		
		    return branch_annotations;
		  },
		
		  initialize: function initialize() {
		
		    var json = this.state.json;
		
		    if (!json) {
		      return;
		    }
		
		    busted.render_histogram("#chart-id", json);
		
		    // delete existing tree
		    d3.select('#tree_container').select("svg").remove();
		
		    var fg_rate = json["fits"]["Unconstrained model"]["rate distributions"]["FG"],
		        omegas = fg_rate.map(function (r) {
		      return r[0];
		    }),
		        weights = fg_rate.map(function (r) {
		      return r[1];
		    });
		
		    var dsettings = {
		      'log': true,
		      'legend': false,
		      'domain': [0.00001, 20],
		      'dimensions': { 'width': 325, 'height': 300 }
		    };
		
		    $("#export-dist-svg").on('click', function (e) {
		      datamonkey.save_image("svg", "#primary-omega-dist");
		    });
		
		    $("#export-dist-png").on('click', function (e) {
		      datamonkey.save_image("png", "#primary-omega-dist");
		    });
		  },
		
		  componentWillMount: function componentWillMount() {
		    this.loadFromServer();
		    this.setEvents();
		  },
		
		  render: function render() {
		
		    var self = this;
		    self.initialize();
		
		    return React.createElement(
		      "div",
		      { className: "tab-content" },
		      React.createElement(
		        "div",
		        { className: "tab-pane active", id: "summary_tab" },
		        React.createElement(
		          "div",
		          { className: "row", styleName: "margin-top: 5px" },
		          React.createElement(
		            "div",
		            { className: "col-md-12" },
		            React.createElement(
		              "ul",
		              { className: "list-group" },
		              React.createElement(
		                "li",
		                { className: "list-group-item list-group-item-info" },
		                React.createElement(
		                  "h3",
		                  { className: "list-group-item-heading" },
		                  React.createElement("i", { className: "fa fa-list", styleName: "margin-right: 10px" }),
		                  React.createElement(
		                    "span",
		                    { id: "summary-method-name" },
		                    "BUSTED"
		                  ),
		                  " summary"
		                ),
		                "There is ",
		                React.createElement(
		                  "strong",
		                  null,
		                  this.state.test_result
		                ),
		                " of episodic diversifying selection, with LRT p-value of ",
		                this.state.p,
		                ".",
		                React.createElement(
		                  "p",
		                  null,
		                  React.createElement(
		                    "small",
		                    null,
		                    "Please cite ",
		                    React.createElement(
		                      "a",
		                      { href: this.state.pmid_href, id: "summary-pmid" },
		                      this.state.pmid_text
		                    ),
		                    " if you use this result in a publication, presentation, or other scientific work."
		                  )
		                )
		              )
		            )
		          )
		        ),
		        React.createElement(
		          "div",
		          { className: "row" },
		          React.createElement(
		            "div",
		            { id: "hyphy-model-fits", className: "col-lg-12" },
		            React.createElement(_model_fits.ModelFits, { json: self.state.json })
		          )
		        ),
		        React.createElement(
		          "button",
		          { id: "export-chart-svg", type: "button", className: "btn btn-default btn-sm pull-right btn-export" },
		          React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
		          " Export Chart to SVG"
		        ),
		        React.createElement(
		          "button",
		          { id: "export-chart-png", type: "button", className: "btn btn-default btn-sm pull-right btn-export" },
		          React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
		          " Export Chart to PNG"
		        ),
		        React.createElement(
		          "div",
		          { className: "row hyphy-busted-site-table" },
		          React.createElement(
		            "div",
		            { id: "chart-id", className: "col-lg-8" },
		            React.createElement(
		              "strong",
		              null,
		              "Model Evidence Ratios Per Site"
		            ),
		            React.createElement("div", { className: "clearfix" })
		          )
		        ),
		        React.createElement(
		          "div",
		          { className: "row site-table" },
		          React.createElement(
		            "div",
		            { className: "col-lg-12" },
		            React.createElement(
		              "form",
		              { id: "er-thresholds" },
		              React.createElement(
		                "div",
		                { className: "form-group" },
		                React.createElement(
		                  "label",
		                  { "for": "er-constrained-threshold" },
		                  "Constrained Evidence Ratio Threshold:"
		                ),
		                React.createElement("input", { type: "text", className: "form-control", id: "er-constrained-threshold", defaultValue: this.props.constrained_threshold })
		              ),
		              React.createElement(
		                "div",
		                { className: "form-group" },
		                React.createElement(
		                  "label",
		                  { "for": "er-optimized-null-threshold" },
		                  "Optimized Null Evidence Ratio Threshold:"
		                ),
		                React.createElement("input", { type: "text", className: "form-control", id: "er-optimized-null-threshold", defaultValue: this.props.null_threshold })
		              )
		            ),
		            React.createElement(
		              "button",
		              { id: "export-csv", type: "button", className: "btn btn-default btn-sm pull-right hyphy-busted-btn-export" },
		              React.createElement("span", { className: "glyphicon glyphicon-floppy-save" }),
		              " Export Table to CSV"
		            ),
		            React.createElement(
		              "button",
		              { id: "apply-thresholds", type: "button", className: "btn btn-default btn-sm pull-right hyphy-busted-btn-export" },
		              "Apply Thresholds"
		            ),
		            React.createElement(
		              "table",
		              { id: "sites", className: "table sites dc-data-table" },
		              React.createElement(
		                "thead",
		                null,
		                React.createElement(
		                  "tr",
		                  { className: "header" },
		                  React.createElement(
		                    "th",
		                    null,
		                    "Site Index"
		                  ),
		                  React.createElement(
		                    "th",
		                    null,
		                    "Unconstrained Likelihood"
		                  ),
		                  React.createElement(
		                    "th",
		                    null,
		                    "Constrained Likelihood"
		                  ),
		                  React.createElement(
		                    "th",
		                    null,
		                    "Optimized Null Likelihood"
		                  ),
		                  React.createElement(
		                    "th",
		                    null,
		                    "Constrained Evidence Ratio"
		                  ),
		                  React.createElement(
		                    "th",
		                    null,
		                    "Optimized Null Evidence Ratio"
		                  )
		                )
		              )
		            )
		          )
		        )
		      ),
		      React.createElement(
		        "div",
		        { className: "tab-pane", id: "tree_tab" },
		        React.createElement(
		          "div",
		          { className: "col-md-12" },
		          React.createElement(_tree.Tree, { json: self.state.json,
		            settings: self.props.tree_settings })
		        ),
		        React.createElement(
		          "div",
		          { className: "col-md-12" },
		          React.createElement(
		            "div",
		            { id: "primary-omega-dist", className: "panel-body" },
		            React.createElement(_prop_chart.PropChart, { name: self.props.model_name, omegas: self.state.omegas,
		              settings: self.props.distro_settings })
		          )
		        )
		      )
		    );
		  }
		});
		
		// Will need to make a call to this
		// omega distributions
		var render_busted = function render_busted(url, element) {
		  ReactDOM.render(React.createElement(BUSTED, { url: url }), document.getElementById(element));
		};
		
		module.exports = render_busted;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(41), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 222:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3, $) {"use strict";
		
		var _model_fits = __webpack_require__(205);
		
		var _tree_summary = __webpack_require__(206);
		
		var _tree = __webpack_require__(207);
		
		var _omega_plots = __webpack_require__(223);
		
		var React = __webpack_require__(44);
		var _ = __webpack_require__(41);
		var RELAX = React.createClass({
		  displayName: "RELAX",
		
		
		  float_format: d3.format(".2f"),
		  p_value_format: d3.format(".4f"),
		  fit_format: d3.format(".2f"),
		
		  loadFromServer: function loadFromServer() {
		
		    var self = this;
		
		    d3.json(this.props.url, function (data) {
		
		      data["fits"]["Partitioned MG94xREV"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned MG94xREV");
		      data["fits"]["General Descriptive"]["branch-annotations"] = self.formatBranchAnnotations(data, "General Descriptive");
		      data["fits"]["Null"]["branch-annotations"] = self.formatBranchAnnotations(data, "Null");
		      data["fits"]["Alternative"]["branch-annotations"] = self.formatBranchAnnotations(data, "Alternative");
		      data["fits"]["Partitioned Exploratory"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned Exploratory");
		
		      var annotations = data["fits"]["Partitioned MG94xREV"]["branch-annotations"],
		          json = data,
		          pmid = data["PMID"],
		          test_results = data["relaxation_test"];
		
		      var p = data["relaxation-test"]["p"],
		          direction = data["fits"]["Alternative"]["K"] > 1 ? 'intensification' : 'relaxation',
		          evidence = p <= self.props.alpha_level ? 'significant' : 'not significant',
		          pvalue = self.p_value_format(p),
		          lrt = self.fit_format(data["relaxation-test"]["LR"]),
		          summary_k = self.fit_format(data["fits"]["Alternative"]["K"]),
		          pmid_text = "PubMed ID " + pmid,
		          pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid;
		
		      self.setState({
		        annotations: annotations,
		        json: json,
		        pmid: pmid,
		        test_results: test_results,
		        p: p,
		        direction: direction,
		        evidence: evidence,
		        pvalue: pvalue,
		        lrt: lrt,
		        summary_k: summary_k,
		        pmid_text: pmid_text,
		        pmid_href: pmid_href
		      });
		    });
		  },
		
		  getDefaultProps: function getDefaultProps() {
		
		    var edgeColorizer = function edgeColorizer(element, data) {
		
		      var self = this,
		          scaling_exponent = 0.33,
		          omega_format = d3.format(".3r");
		
		      var omega_color = d3.scale.pow().exponent(scaling_exponent).domain([0, 0.25, 1, 5, 10]).range(self.options()["color-fill"] ? ["#DDDDDD", "#AAAAAA", "#888888", "#444444", "#000000"] : ["#6e4fa2", "#3288bd", "#e6f598", "#f46d43", "#9e0142"]).clamp(true);
		
		      if (data.target.annotations) {
		        element.style('stroke', omega_color(data.target.annotations.length) || null);
		        $(element[0][0]).tooltip('destroy');
		        $(element[0][0]).tooltip({
		          'title': omega_format(data.target.annotations.length),
		          'html': true,
		          'trigger': 'hover',
		          'container': 'body',
		          'placement': 'auto'
		        });
		      } else {
		        element.style('stroke', null);
		        $(element[0][0]).tooltip('destroy');
		      }
		
		      var selected_partition = $("#hyphy-tree-highlight").attr("value");
		
		      if (selected_partition && this.get_partitions()) {
		        var partitions = this.get_partitions()[selected_partition];
		
		        element.style('stroke-width', partitions && partitions[data.target.name] ? '8' : '4').style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
		      }
		    };
		
		    return {
		      edgeColorizer: edgeColorizer,
		      alpha_level: 0.05
		    };
		  },
		
		  getInitialState: function getInitialState() {
		
		    var model_fits_id = "#hyphy-model-fits",
		        omega_plots_id = "#hyphy-omega-plots",
		        summary_id = "#hyphy-relax-summary",
		        tree_id = "#tree-tab";
		
		    var tree_settings = {
		      'omegaPlot': {},
		      'tree-options': {
		        /* value arrays have the following meaning
		            [0] - the value of the attribute
		            [1] - does the change in attribute value trigger tree re-layout?
		        */
		        'hyphy-tree-model': ["Partitioned MG94xREV", true],
		        'hyphy-tree-highlight': ["RELAX.test", false],
		        'hyphy-tree-branch-lengths': [true, true],
		        'hyphy-tree-hide-legend': [true, false],
		        'hyphy-tree-fill-color': [true, false]
		      },
		      'suppress-tree-render': false,
		      'chart-append-html': true,
		      'edgeColorizer': this.props.edgeColorizer
		    };
		
		    return {
		      annotations: null,
		      json: null,
		      pmid: null,
		      settings: tree_settings,
		      test_results: null,
		      tree: null,
		      p: null,
		      direction: 'unknown',
		      evidence: 'unknown',
		      pvalue: null,
		      lrt: null,
		      summary_k: 'unknown',
		      pmid_text: "PubMed ID : Unknown",
		      pmid_href: "#",
		      relaxation_K: "unknown"
		    };
		  },
		
		  componentWillMount: function componentWillMount() {
		    this.loadFromServer();
		    this.setEvents();
		  },
		
		  setEvents: function setEvents() {
		
		    var self = this;
		
		    $("#datamonkey-relax-load-json").on("change", function (e) {
		      var files = e.target.files; // FileList object
		
		      if (files.length == 1) {
		        var f = files[0];
		        var reader = new FileReader();
		
		        reader.onload = function (theFile) {
		          return function (e) {
		
		            var data = JSON.parse(this.result);
		            data["fits"]["Partitioned MG94xREV"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned MG94xREV");
		            data["fits"]["General Descriptive"]["branch-annotations"] = self.formatBranchAnnotations(data, "General Descriptive");
		            data["fits"]["Null"]["branch-annotations"] = self.formatBranchAnnotations(data, "Null");
		            data["fits"]["Alternative"]["branch-annotations"] = self.formatBranchAnnotations(data, "Alternative");
		            data["fits"]["Partitioned Exploratory"]["branch-annotations"] = self.formatBranchAnnotations(data, "Partitioned Exploratory");
		
		            var annotations = data["fits"]["Partitioned MG94xREV"]["branch-annotations"],
		                json = data,
		                pmid = data["PMID"],
		                test_results = data["relaxation_test"];
		
		            var p = data["relaxation-test"]["p"],
		                direction = data["fits"]["Alternative"]["K"] > 1 ? 'intensification' : 'relaxation',
		                evidence = p <= self.props.alpha_level ? 'significant' : 'not significant',
		                pvalue = self.p_value_format(p),
		                lrt = self.fit_format(data["relaxation-test"]["LR"]),
		                summary_k = self.fit_format(data["fits"]["Alternative"]["K"]),
		                pmid_text = "PubMed ID " + pmid,
		                pmid_href = "http://www.ncbi.nlm.nih.gov/pubmed/" + pmid;
		
		            self.setState({
		              annotations: annotations,
		              json: json,
		              pmid: pmid,
		              test_results: test_results,
		              p: p,
		              direction: direction,
		              evidence: evidence,
		              pvalue: pvalue,
		              lrt: lrt,
		              summary_k: summary_k,
		              pmid_text: pmid_text,
		              pmid_href: pmid_href
		            });
		          };
		        }(f);
		        reader.readAsText(f);
		      }
		
		      $("#datamonkey-absrel-toggle-here").dropdown("toggle");
		      e.preventDefault();
		    });
		  },
		
		  formatBranchAnnotations: function formatBranchAnnotations(json, key) {
		
		    var initial_branch_annotations = json["fits"][key]["branch-annotations"];
		
		    if (!initial_branch_annotations) {
		      initial_branch_annotations = json["fits"][key]["rate distributions"];
		    }
		
		    // Iterate over objects
		    var branch_annotations = _.mapObject(initial_branch_annotations, function (val, key) {
		      return { "length": val };
		    });
		
		    return branch_annotations;
		  },
		
		  initialize: function initialize() {},
		
		  render: function render() {
		
		    var self = this;
		
		    return React.createElement(
		      "div",
		      { className: "tab-content" },
		      React.createElement(
		        "div",
		        { className: "tab-pane active", id: "datamonkey-relax-summary-tab" },
		        React.createElement(
		          "div",
		          { id: "hyphy-relax-summary", className: "row" },
		          React.createElement(
		            "div",
		            { className: "col-md-12" },
		            React.createElement(
		              "ul",
		              { className: "list-group" },
		              React.createElement(
		                "li",
		                { className: "list-group-item list-group-item-info" },
		                React.createElement(
		                  "h3",
		                  { className: "list-group-item-heading" },
		                  React.createElement("i", { className: "fa fa-list", styleFormat: "margin-right: 10px" }),
		                  React.createElement(
		                    "span",
		                    { id: "summary-method-name" },
		                    "RELAX(ed selection test)"
		                  ),
		                  " summary"
		                ),
		                React.createElement(
		                  "p",
		                  { className: "list-group-item-text lead", styleFormat: "margin-top:0.5em; " },
		                  "Test for selection ",
		                  React.createElement(
		                    "strong",
		                    { id: "summary-direction" },
		                    this.state.direction
		                  ),
		                  "(",
		                  React.createElement(
		                    "abbr",
		                    { title: "Relaxation coefficient" },
		                    "K"
		                  ),
		                  " = ",
		                  React.createElement(
		                    "strong",
		                    { id: "summary-K" },
		                    this.state.summary_k
		                  ),
		                  ") was ",
		                  React.createElement(
		                    "strong",
		                    { id: "summary-evidence" },
		                    this.state.evidence
		                  ),
		                  "(p = ",
		                  React.createElement(
		                    "strong",
		                    { id: "summary-pvalue" },
		                    this.state.p
		                  ),
		                  ", ",
		                  React.createElement(
		                    "abbr",
		                    { title: "Likelihood ratio statistic" },
		                    "LR"
		                  ),
		                  " = ",
		                  React.createElement(
		                    "strong",
		                    { id: "summary-LRT" },
		                    this.state.lrt
		                  ),
		                  ")"
		                ),
		                React.createElement(
		                  "p",
		                  null,
		                  React.createElement(
		                    "small",
		                    null,
		                    "Please cite ",
		                    React.createElement(
		                      "a",
		                      { href: this.state.pmid_href, id: "summary-pmid" },
		                      this.state.pmid_text
		                    ),
		                    " if you use this result in a publication, presentation, or other scientific work."
		                  )
		                )
		              )
		            )
		          )
		        ),
		        React.createElement(
		          "div",
		          { id: "hyphy-model-fits", className: "row" },
		          React.createElement(_model_fits.ModelFits, { json: self.state.json })
		        ),
		        React.createElement(
		          "div",
		          { id: "hyphy-omega-plots", className: "row" },
		          React.createElement(_omega_plots.OmegaPlotGrid, { json: self.state.json })
		        )
		      ),
		      React.createElement(
		        "div",
		        { className: "tab-pane", id: "tree-tab" },
		        React.createElement(_tree.Tree, { json: self.state.json,
		          settings: self.state.settings })
		      )
		    );
		  }
		});
		
		// Will need to make a call to this
		// omega distributions
		function render_relax(url, element) {
		  React.render(React.createElement(RELAX, { url: url }), document.getElementById(element));
		}
		
		module.exports = render_relax;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38), __webpack_require__(2)))
	
	/***/ },
	
	/***/ 223:
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(d3) {'use strict';
		
		var React = __webpack_require__(44);
		var datamonkey = __webpack_require__(37);
		var _ = __webpack_require__(41);
		
		var OmegaPlot = React.createClass({
		    displayName: 'OmegaPlot',
		
		
		    getDefaultProps: function getDefaultProps() {
		        return {
		            svg_id: null,
		            dimensions: { width: 600, height: 400 },
		            margins: { 'left': 50, 'right': 15, 'bottom': 35, 'top': 35 },
		            has_zeros: false,
		            legend_id: null,
		            do_log_plot: true,
		            k_p: null,
		            plot: null
		        };
		    },
		
		    setEvents: function setEvents() {
		        var self = this;
		
		        d3.select("#" + this.save_svg_id).on('click', function (e) {
		            datamonkey.save_image("svg", "#" + self.svg_id);
		        });
		
		        d3.select("#" + this.save_png_id).on('click', function (e) {
		            datamonkey.save_image("png", "#" + self.svg_id);
		        });
		    },
		
		    initialize: function initialize() {
		
		        if (!this.state.omegas || !this.state.omegas["Reference"]) {
		            return;
		        }
		
		        var data_to_plot = this.state.omegas["Reference"];
		        var secondary_data = this.state.omegas["Test"];
		
		        // Set props from settings
		        this.svg_id = this.props.settings.svg_id;
		        this.dimensions = this.props.settings.dimensions || this.props.dimensions;
		        this.legend_id = this.props.settings.legend || this.props.legend_id;
		        this.do_log_plot = this.props.settings.log || this.props.do_log_plot;
		        this.k_p = this.props.settings.k || this.props.k_p;
		
		        var dimensions = this.props.dimensions;
		        var margins = this.props.margins;
		
		        this.margins = margins;
		
		        if (this.do_log_plot) {
		            this.has_zeros = data_to_plot.some(function (d) {
		                return d.omega <= 0;
		            });
		            if (secondary_data) {
		                this.has_zeros = this.has_zeros || data_to_plot.some(function (d) {
		                    return d.omega <= 0;
		                });
		            }
		        }
		
		        this.plot_width = dimensions["width"] - margins['left'] - margins['right'], this.plot_height = dimensions["height"] - margins['top'] - margins['bottom'];
		
		        var domain = this.state.settings["domain"] || d3.extent(secondary_data ? secondary_data.map(function (d) {
		            return d.omega;
		        }).concat(data_to_plot.map(function (d) {
		            return d.omega;
		        })) : data_to_plot.map(function (d) {
		            return d.omega;
		        }));
		
		        domain[0] *= 0.5;
		
		        this.omega_scale = (this.do_log_plot ? this.has_zeros ? d3.scale.pow().exponent(0.2) : d3.scale.log() : d3.scale.linear()).range([0, this.plot_width]).domain(domain).nice();
		
		        this.proportion_scale = d3.scale.linear().range([this.plot_height, 0]).domain([-0.05, 1]).clamp(true);
		
		        // compute margins -- circle AREA is proportional to the relative weight
		        // maximum diameter is (height - text margin)
		        this.svg = d3.select("#" + this.svg_id).attr("width", dimensions.width).attr("height", dimensions.height);
		        this.plot = this.svg.selectAll(".container");
		
		        this.svg.selectAll("defs").remove();
		        this.svg.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 10) /*must be smarter way to calculate shift*/
		        .attr("refY", 4).attr("markerWidth", 10).attr("markerHeight", 8).attr("orient", "auto").attr("stroke", "#000").attr("fill", "#000").append("path").attr("d", "M 0,0 V8 L10,4 Z");
		
		        if (this.plot.empty()) {
		            this.plot = this.svg.append("g").attr("class", "container");
		        }
		
		        this.plot.attr("transform", "translate(" + this.margins["left"] + " , " + this.margins["top"] + ")");
		        this.reference_omega_lines = this.plot.selectAll(".hyphy-omega-line-reference"), this.displacement_lines = this.plot.selectAll(".hyphy-displacement-line");
		
		        this.createDisplacementLine();
		        this.createNeutralLine();
		        this.createOmegaLine();
		        this.createReferenceLine();
		        this.createXAxis();
		        this.createYAxis();
		        this.setEvents();
		    },
		    makeSpring: function makeSpring(x1, x2, y1, y2, step, displacement) {
		
		        if (x1 == x2) {
		            y1 = Math.min(y1, y2);
		            return "M" + x1 + "," + (y1 - 40) + "v20";
		        }
		
		        var spring_data = [],
		            point = [x1, y1],
		            angle = Math.atan2(y2 - y1, x2 - x1);
		
		        var step = [step * Math.cos(angle), step * Math.sin(angle)];
		        var k = 0;
		
		        if (Math.abs(x1 - x2) < 15) {
		            spring_data.push(point);
		        } else {
		            while (x1 < x2 && point[0] < x2 - 15 || x1 > x2 && point[0] > x2 + 15) {
		                point = point.map(function (d, i) {
		                    return d + step[i];
		                });
		                if (k % 2) {
		                    spring_data.push([point[0], point[1] + displacement]);
		                } else {
		                    spring_data.push([point[0], point[1] - displacement]);
		                }
		                k++;
		                if (k > 100) {
		                    break;
		                }
		            }
		        }
		
		        if (spring_data.length > 1) {
		            spring_data.pop();
		        }
		
		        spring_data.push([x2, y2]);
		        var line = d3.svg.line().interpolate("monotone");
		        return line(spring_data);
		    },
		    createDisplacementLine: function createDisplacementLine() {
		
		        var self = this;
		        var data_to_plot = this.state.omegas["Reference"];
		        var secondary_data = this.state.omegas["Test"];
		
		        if (secondary_data) {
		            var diffs = data_to_plot.map(function (d, i) {
		                return {
		                    'x1': d.omega,
		                    'x2': secondary_data[i].omega,
		                    'y1': d.weight * 0.98,
		                    'y2': secondary_data[i].weight * 0.98
		                };
		            });
		
		            this.displacement_lines = this.displacement_lines.data(diffs);
		            this.displacement_lines.enter().append("path");
		            this.displacement_lines.exit().remove();
		            this.displacement_lines.transition().attr("d", function (d) {
		                return self.makeSpring(self.omega_scale(d.x1), self.omega_scale(d.x2), self.proportion_scale(d.y1 * 0.5), self.proportion_scale(d.y2 * 0.5), 5, 5);
		            }).attr("marker-end", "url(#arrowhead)").attr("class", "hyphy-displacement-line");
		        }
		    },
		    createReferenceLine: function createReferenceLine() {
		
		        var data_to_plot = this.state.omegas["Reference"];
		        var secondary_data = this.state.omegas["Test"];
		        var self = this;
		
		        if (secondary_data) {
		            this.reference_omega_lines = this.reference_omega_lines.data(data_to_plot);
		            this.reference_omega_lines.enter().append("line");
		            this.reference_omega_lines.exit().remove();
		
		            this.reference_omega_lines.transition().attr("x1", function (d) {
		                return self.omega_scale(d.omega);
		            }).attr("x2", function (d) {
		                return self.omega_scale(d.omega);
		            }).attr("y1", function (d) {
		                return self.proportion_scale(-0.05);
		            }).attr("y2", function (d) {
		                return self.proportion_scale(d.weight);
		            }).style("stroke", function (d) {
		                return "#d62728";
		            }).attr("class", "hyphy-omega-line-reference");
		        } else {
		            this.reference_omega_lines.remove();
		            this.displacement_lines.remove();
		        }
		    },
		    createOmegaLine: function createOmegaLine() {
		
		        var data_to_plot = this.state.omegas["Reference"];
		        var secondary_data = this.state.omegas["Test"];
		        var self = this;
		
		        // ** Omega Line (Red) ** //
		        var omega_lines = this.plot.selectAll(".hyphy-omega-line").data(secondary_data ? secondary_data : data_to_plot);
		        omega_lines.enter().append("line");
		        omega_lines.exit().remove();
		        omega_lines.transition().attr("x1", function (d) {
		            return self.omega_scale(d.omega);
		        }).attr("x2", function (d) {
		            return self.omega_scale(d.omega);
		        }).attr("y1", function (d) {
		            return self.proportion_scale(-0.05);
		        }).attr("y2", function (d) {
		            return self.proportion_scale(d.weight);
		        }).style("stroke", function (d) {
		            return "#1f77b4";
		        }).attr("class", "hyphy-omega-line");
		    },
		    createNeutralLine: function createNeutralLine() {
		        var self = this;
		
		        // ** Neutral Line (Blue) ** //
		        var neutral_line = this.plot.selectAll(".hyphy-neutral-line").data([1]);
		        neutral_line.enter().append("line").attr("class", "hyphy-neutral-line");
		        neutral_line.exit().remove();
		        neutral_line.transition().attr("x1", function (d) {
		            return self.omega_scale(d);
		        }).attr("x2", function (d) {
		            return self.omega_scale(d);
		        }).attr("y1", 0).attr("y2", this.plot_height);
		    },
		    createXAxis: function createXAxis() {
		
		        // *** X-AXIS *** //
		        var xAxis = d3.svg.axis().scale(this.omega_scale).orient("bottom");
		
		        if (this.do_log_plot) {
		            xAxis.ticks(10, this.has_zeros ? ".2r" : ".1r");
		        }
		
		        var x_axis = this.svg.selectAll(".x.axis");
		        var x_label;
		
		        if (x_axis.empty()) {
		            x_axis = this.svg.append("g").attr("class", "x hyphy-axis");
		
		            x_label = x_axis.append("g").attr("class", "hyphy-axis-label x-label");
		        } else {
		            x_label = x_axis.select(".axis-label.x-label");
		        }
		
		        x_axis.attr("transform", "translate(" + this.margins["left"] + "," + (this.plot_height + this.margins["top"]) + ")").call(xAxis);
		        x_label = x_label.attr("transform", "translate(" + this.plot_width + "," + this.margins["bottom"] + ")").selectAll("text").data(['\u03C9']);
		        x_label.enter().append("text");
		        x_label.text(function (d) {
		            return d;
		        }).style("text-anchor", "end").attr("dy", "0.0em");
		    },
		    createYAxis: function createYAxis() {
		
		        // *** Y-AXIS *** //
		        var yAxis = d3.svg.axis().scale(this.proportion_scale).orient("left").ticks(10, ".1p");
		
		        var y_axis = this.svg.selectAll(".y.hyphy-axis");
		        var y_label;
		
		        if (y_axis.empty()) {
		            y_axis = this.svg.append("g").attr("class", "y hyphy-axis");
		            y_label = y_axis.append("g").attr("class", "hyphy-axis-label y-label");
		        } else {
		            y_label = y_axis.select(".hyphy-axis-label.y-label");
		        }
		        y_axis.attr("transform", "translate(" + this.margins["left"] + "," + this.margins["top"] + ")").call(yAxis);
		        y_label = y_label.attr("transform", "translate(" + -this.margins["left"] + "," + 0 + ")").selectAll("text").data(["Proportion of sites"]);
		        y_label.enter().append("text");
		        y_label.text(function (d) {
		            return d;
		        }).style("text-anchor", "start").attr("dy", "-1em");
		    },
		
		    getInitialState: function getInitialState() {
		        return {
		            omegas: this.props.omegas,
		            settings: this.props.settings
		        };
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		        this.setState({
		            omegas: nextProps.omegas
		        });
		    },
		
		    componentDidUpdate: function componentDidUpdate() {
		        this.initialize();
		    },
		
		    componentDidMount: function componentDidMount() {
		        this.initialize();
		    },
		
		    render: function render() {
		
		        var key = this.props.omegas.key,
		            label = this.props.omegas.label;
		
		        this.svg_id = key + "-svg";
		        this.save_svg_id = "export-" + key + "-svg";
		        this.save_png_id = "export-" + key + "-png";
		
		        return React.createElement(
		            'div',
		            { className: 'col-lg-6' },
		            React.createElement(
		                'div',
		                { className: 'panel panel-default', id: key },
		                React.createElement(
		                    'div',
		                    { className: 'panel-heading' },
		                    React.createElement(
		                        'h3',
		                        { className: 'panel-title' },
		                        '\u03C9 distributions under the ',
		                        React.createElement(
		                            'strong',
		                            null,
		                            label
		                        ),
		                        ' model'
		                    ),
		                    React.createElement(
		                        'p',
		                        null,
		                        React.createElement(
		                            'small',
		                            null,
		                            'Test branches are shown in ',
		                            React.createElement(
		                                'span',
		                                { className: 'hyphy-blue' },
		                                'blue'
		                            ),
		                            ' and reference branches are shown in ',
		                            React.createElement(
		                                'span',
		                                { className: 'hyphy-red' },
		                                'red'
		                            )
		                        )
		                    ),
		                    React.createElement(
		                        'div',
		                        { className: 'btn-group' },
		                        React.createElement(
		                            'button',
		                            { id: this.save_svg_id, type: 'button', className: 'btn btn-default btn-sm' },
		                            React.createElement('span', { className: 'glyphicon glyphicon-floppy-save' }),
		                            ' SVG'
		                        ),
		                        React.createElement(
		                            'button',
		                            { id: this.save_png_id, type: 'button', className: 'btn btn-default btn-sm' },
		                            React.createElement('span', { className: 'glyphicon glyphicon-floppy-save' }),
		                            ' PNG'
		                        )
		                    )
		                ),
		                React.createElement(
		                    'div',
		                    { className: 'panel-body' },
		                    React.createElement('svg', { id: this.svg_id })
		                )
		            )
		        );
		    }
		});
		
		var OmegaPlotGrid = React.createClass({
		    displayName: 'OmegaPlotGrid',
		
		
		    getInitialState: function getInitialState() {
		        return { omega_distributions: this.getDistributions(this.props.json) };
		    },
		
		    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		
		        this.setState({
		            omega_distributions: this.getDistributions(nextProps.json)
		        });
		    },
		
		    getDistributions: function getDistributions(json) {
		
		        var omega_distributions = {};
		
		        if (!json) {
		            return [];
		        }
		
		        for (var m in json["fits"]) {
		            var this_model = json["fits"][m];
		            omega_distributions[m] = {};
		            var distributions = [];
		            for (var d in this_model["rate-distributions"]) {
		                var this_distro = this_model["rate-distributions"][d];
		                var this_distro_entry = [d, "", "", ""];
		                omega_distributions[m][d] = this_distro.map(function (d) {
		                    return {
		                        'omega': d[0],
		                        'weight': d[1]
		                    };
		                });
		            }
		        }
		
		        _.each(omega_distributions, function (item, key) {
		            item.key = key.toLowerCase().replace(/ /g, '-');
		            item.label = key;
		        });
		
		        var omega_distributions = _.filter(omega_distributions, function (item) {
		            return _.isObject(item["Reference"]);
		        });
		
		        return omega_distributions;
		    },
		
		    render: function render() {
		
		        var OmegaPlots = _.map(this.state.omega_distributions, function (item, key) {
		
		            var model_name = key;
		            var omegas = item;
		
		            var settings = {
		                svg_id: omegas.key + '-svg',
		                dimensions: { width: 600, height: 400 },
		                margins: { 'left': 50, 'right': 15, 'bottom': 35, 'top': 35 },
		                has_zeros: false,
		                legend_id: null,
		                do_log_plot: true,
		                k_p: null,
		                plot: null
		            };
		
		            return React.createElement(OmegaPlot, { name: model_name, omegas: omegas, settings: settings });
		        });
		
		        return React.createElement(
		            'div',
		            null,
		            OmegaPlots
		        );
		    }
		
		});
		
		module.exports.OmegaPlot = OmegaPlot;
		module.exports.OmegaPlotGrid = OmegaPlotGrid;
		/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(38)))
	
	/***/ }
	
	});
	//# sourceMappingURL=hyphyvision.js.map

/***/ }),

/***/ 31:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var _bootstrap = __webpack_require__(32);
	
	var _bootstrap2 = _interopRequireDefault(_bootstrap);
	
	var _clusternetwork = __webpack_require__(39);
	
	var _histogram = __webpack_require__(45);
	
	var _scatterplot = __webpack_require__(46);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var misc = __webpack_require__(44);
	var helpers = __webpack_require__(47);
	
	module.exports.clusterNetwork = _clusternetwork.clusterNetwork;
	module.exports.graphSummary = _clusternetwork.graphSummary;
	module.exports.histogram = _histogram.histogram;
	module.exports.histogramDistances = _histogram.histogramDistances;
	module.exports.helpers = helpers;
	module.exports.misc = misc;
	module.exports.scatterPlot = _scatterplot.scatterPlot;

/***/ }),

/***/ 32:
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),

/***/ 39:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';
	
	var d3 = __webpack_require__(40),
	    _ = __webpack_require__(43),
	    misc = __webpack_require__(44),
	    helpers = __webpack_require__(47);
	
	var _networkGraphAttrbuteID = "patient_attribute_schema";
	var _networkNodeAttributeID = "patient_attributes";
	var _networkMissing = 'missing';
	var _networkMissingOpacity = '0.1';
	var _networkMissingColor = '#999';
	var _networkContinuousColorStops = 9;
	var _networkShapeOrdering = ['circle', 'square', 'hexagon', 'diamond', 'cross', 'octagon'];
	var _defaultFloatFormat = d3.format(",.2r");
	var _defaultPercentFormat = d3.format(",.3p");
	var _defaultDateFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
	var _defaultDateViewFormat = d3.time.format("%B %d, %Y");
	var _defaultDateViewFormatShort = d3.time.format("%B %Y");
	var _networkCategorical = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"];
	var _maximumValuesInCategories = _networkCategorical.length;
	
	var _networkSequentialColor = {
	    3: ["#ffeda0", "#feb24c", "#f03b20"],
	    4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
	    5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
	    6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
	    7: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
	    8: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"],
	    9: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"]
	};
	
	var _networkPresetColorSchemes = { 'trans_categ': {
	        'Other-Male': '#999999',
	        'Heterosexual Contact-Male': '#e31a1c',
	        'Other-Child': '#ff7f00',
	        'Perinatal': '#ff7f00',
	        'MSM': '#1f78b4',
	        'IDU-Male': '#33a02c',
	        'Other-Female': '#999999',
	        'IDU-Female': '#33a02c',
	        'MSM & IDU': '#33a02c',
	        'Missing': '#999999',
	        'Heterosexual Contact-Female': '#e31a1c'
	    } };
	
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
	
	    self._is_CDC_ = options && options['no_cdc'] ? false : true;
	    self.ww = options && options["width"] ? options["width"] : d3.select(parent_container).property("clientWidth");
	    self.container = network_container;
	    self.nodes = [];
	    self.edges = [];
	    self.clusters = [];
	    self.cluster_sizes = [];
	    self.colorizer = { 'selected': function selected(d) {
	            return d == 'selected' ? d3.rgb(51, 122, 183) : '#FFF';
	        } };
	    self.node_shaper = { 'id': null, 'shaper': function shaper() {
	            return 'circle';
	        } };
	    self.filter_edges = true, self.hide_hxb2 = false, self.charge_correction = 5, self.margin = { top: 20, right: 10, bottom: 30, left: 10 }, self.width = self.ww - self.margin.left - self.margin.right, self.height = self.width * 9 / 16, self.cluster_table = d3.select(clusters_table), self.node_table = d3.select(nodes_table), self.needs_an_update = false, self.json = json, self.hide_unselected = false, self.show_percent_in_pairwise_table = false, self.gradient_id = 0;
	
	    self._additional_node_pop_fields = [];
	    /** this array contains fields that will be appended to node pop-overs in the network tab
	        they will precede all the fields that are shown based on selected labeling */
	
	    if (self._is_CDC_) {
	        self._additional_node_pop_fields.push('hiv_aids_dx_dt');
	    }
	
	    self._networkPredefinedAttributeTransforms = {
	        /** runtime computed node attributes, e.g. transforms of existing attributes */
	
	        'binned_vl_recent_value': {
	            'depends': 'vl_recent_value',
	            'label': 'binned_vl_recent_value',
	            'enum': ["≤200", "200-10000", ">10000"],
	            'color_scale': function color_scale() {
	                return d3.scale.ordinal().domain(["≤200", "200-10000", ">10000", _networkMissing]).range(_.union(_networkSequentialColor[3], [_networkMissingColor]));
	            },
	
	            'map': function map(node) {
	                var vl_value = attribute_node_value_by_id(node, 'vl_recent_value');
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
	        'hiv_aids_dx_dt_year': {
	            'depends': 'hiv_aids_dx_dt',
	            'label': 'hiv_aids_dx_dt_year',
	            'type': "String",
	            'map': function map(node) {
	                try {
	                    var value = _defaultDateFormat.parse(attribute_node_value_by_id(node, 'hiv_aids_dx_dt'));
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
	            'color_scale': function color_scale(attr) {
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
	
	    var cluster_mapping = {},
	        l_scale = 5000,
	
	    // link scale
	    graph_data = self.json,
	
	    // the raw JSON network object
	    max_points_to_render = 1024,
	        warning_string = "",
	        singletons = 0,
	        open_cluster_queue = [],
	        currently_displayed_objects,
	        gravity_scale = d3.scale.pow().exponent(0.5).domain([1, 100000]).range([0.1, 0.15]);
	
	    /*------------ D3 globals and SVG elements ---------------*/
	
	    var network_layout = d3.layout.force().on("tick", tick).charge(function (d) {
	        if (d.cluster_id) return self.charge_correction * (-20 - 5 * Math.pow(d.children.length, 0.7));return self.charge_correction * (-5 - 20 * Math.sqrt(d.degree));
	    }).linkDistance(function (d) {
	        return Math.max(d.length, 0.005) * l_scale;
	    }).linkStrength(function (d) {
	        if (d.support !== undefined) {
	            return 2 * (0.5 - d.support);
	        }return 1;
	    }).chargeDistance(l_scale * 0.25).gravity(gravity_scale(json.Nodes.length)).friction(0.25);
	
	    d3.select(self.container).selectAll(".my_progress").remove();
	
	    d3.select(self.container).selectAll("svg").remove();
	    self.node_table.selectAll("*").remove();
	    self.cluster_table.selectAll("*").remove();
	
	    var network_svg = d3.select(self.container).append("svg:svg")
	    //.style ("border", "solid black 1px")
	    .attr("id", "network-svg").attr("width", self.width + self.margin.left + self.margin.right).attr("height", self.height + self.margin.top + self.margin.bottom);
	
	    //.append("g")
	    // .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");
	
	    var legend_svg = network_svg.append("g").attr("transform", "translate(5,5)");
	
	    network_svg.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 9) /* there must be a smarter way to calculate shift*/
	    .attr("refY", 2).attr("markerWidth", 6).attr("markerHeight", 4).attr("orient", "auto").attr("stroke", "#666666").attr("fill", "#AAAAAA").append("path").attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead
	
	
	    change_window_size();
	
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
	                expand_cluster_handler(cluster, true);
	                menu_object.style("display", "none");
	            });
	
	            menu_object.append("li").append("a").attr("tabindex", "-1").text("Center on screen").on("click", function (d) {
	                cluster.fixed = 0;
	                center_cluster_handler(cluster);
	                menu_object.style("display", "none");
	            });
	
	            menu_object.append("li").append("a").attr("tabindex", "-1").text(function (d) {
	                if (cluster.fixed) return "Allow cluster to float";return "Hold cluster at current position";
	            }).on("click", function (d) {
	                cluster.fixed = !cluster.fixed;
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
	
	            menu_object.style("position", "absolute").style("left", "" + d3.event.offsetX + "px").style("top", "" + d3.event.offsetY + "px").style("display", "block");
	        } else {
	            menu_object.style("display", "none");
	        }
	
	        container.on("click", function (d) {
	            handle_node_click(null);
	        }, true);
	    };
	
	    function get_initial_xy(nodes, cluster_count, exclude) {
	        var d_clusters = { 'id': 'root', 'children': [] };
	        for (var k = 0; k < cluster_count; k += 1) {
	            if (exclude !== undefined && exclude[k + 1] !== undefined) {
	                continue;
	            }
	            d_clusters.children.push({ 'cluster_id': k + 1, 'children': nodes.filter(function (v) {
	                    return v.cluster == k + 1;
	                }) });
	        }
	
	        var treemap = d3.layout.pack().size([self.width, self.height])
	        //.sticky(true)
	        .children(function (d) {
	            return d.children;
	        }).value(function (d) {
	            return 1;
	        });
	
	        return treemap.nodes(d_clusters);
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
	
	    function default_layout(clusters, nodes, exclude_cluster_ids) {
	        var init_layout = get_initial_xy(nodes, self.cluster_sizes.length, exclude_cluster_ids);
	        clusters = init_layout.filter(function (v, i, obj) {
	            return !(typeof v.cluster_id === "undefined");
	        });
	
	        var sizes = network_layout.size();
	
	        _.each(nodes, function (n) {
	            n.x += n.dx / 2;n.y += n.dy / 2;
	        });
	        clusters.forEach(collapse_cluster);
	        return [clusters, nodes];
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
	        network_svg.attr("width", self.width).attr("height", self.height);
	
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
	
	        var worker = new Worker('workers/lcc.js');
	
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
	
	        d3.select(this).classed("disabled", true).select("i").classed({ "fa-calculator": false, "fa-cog": true, "fa-spin": true });
	        self.mark_nodes_as_processing('lcc');
	        self.compute_local_clustering_coefficients_worker();
	        self.compute_global_clustering_coefficients();
	        d3.select(this).remove();
	    };
	
	    /*------------ Constructor ---------------*/
	    function initial_json_load() {
	        var connected_links = [];
	        var total = 0;
	        var exclude_cluster_ids = {};
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
	
	        if (button_bar_ui) {
	            var _cluster_list_view_render = function _cluster_list_view_render(cluster_id, group_by_attribute, the_list) {
	                the_list.selectAll('*').remove();
	                var allowed_types = { "String": 1, "Date": 1, "Number": 1 };
	
	                var column_ids = _.filter(self.json[_networkGraphAttrbuteID], function (d) {
	                    return d.type in allowed_types;
	                });
	
	                var cluster_nodes = _.filter(self.nodes, function (n) {
	                    return n.cluster == cluster_id;
	                });
	
	                if (group_by_attribute) {
	                    _.each(column_ids, function (column) {
	                        var binned = _.groupBy(cluster_nodes, function (n) {
	                            return attribute_node_value_by_id(n, column.raw_attribute_key);
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
	                    _.each(_.filter(self.nodes, function (n) {
	                        return n.cluster == cluster_id;
	                    }), function (node) {
	                        var patient_record = the_list.append("li");
	                        patient_record.append("code").text(node.id);
	                        var patient_list = patient_record.append("dl").classed("dl-horizontal", true);
	                        _.each(column_ids, function (column) {
	                            patient_list.append("dt").text(column.raw_attribute_key);
	                            patient_list.append("dd").text(attribute_node_value_by_id(node, column.raw_attribute_key));
	                        });
	                    });
	                }
	            };
	
	            $('#' + button_bar_ui + '_cluster_zoom').on('show.bs.modal', function (event) {
	                var link_clicked = $(event.relatedTarget);
	                var cluster_id = link_clicked.data("cluster");
	                var modal = d3.select('#' + button_bar_ui + '_cluster_zoom');
	                modal.selectAll(".modal-title").text("Cluster " + cluster_id);
	
	                $("#" + button_bar_ui + "_cluster_zoom_svg_export").on("click", function (e) {
	                    helpers.save_image("png", "#" + button_bar_ui + "_cluster_zoom_svg");
	                });
	
	                var node_indices = {};
	                var used_index = 0;
	
	                var only_this_cluster = {
	                    "Nodes": _.map(_.filter(self.nodes, function (n, i) {
	                        if (n.cluster == cluster_id) {
	                            node_indices[i] = used_index++;return true;
	                        }return false;
	                    }), function (n) {
	                        var nn = _.clone(n);nn.cluster = 1;delete nn["parent"];return nn;
	                    }),
	                    "Edges": _.map(_.filter(self.edges, function (e) {
	                        if (e.source in node_indices && e.target in node_indices) {
	                            return true;
	                        }
	                        return false;
	                    }), function (e) {
	                        var ne = _.clone(e);ne.target = node_indices[ne.target];ne.source = node_indices[ne.source];return ne;
	                    })
	
	                };
	
	                only_this_cluster[_networkGraphAttrbuteID] = self.json[_networkGraphAttrbuteID];
	
	                hivtrace_cluster_network_graph(only_this_cluster, "#" + button_bar_ui + "_cluster_zoom_svg", null, null, null, null, null, null, null, "#" + button_bar_ui + "_cluster_zoom_body", { "expand": [1], "charge": 10, "colorizer": self.colorizer, "node_shaper": self.node_shaper, "width": 600 });
	            });
	
	            d3.select('#' + button_bar_ui + '_cluster_list_view_toggle').on('click', function () {
	                d3.event.preventDefault();
	                var group_by_id = false;
	
	                var button_clicked = $(this);
	                if (button_clicked.data('view') == 'id') {
	                    button_clicked.data('view', 'attribute');
	                    button_clicked.text("Group by ID");
	                    group_by_id = false;
	                } else {
	                    button_clicked.data('view', 'id');
	                    button_clicked.text("Group by attribute");
	                    group_by_id = true;
	                }
	                _cluster_list_view_render(button_clicked.data('cluster'), !group_by_id, d3.select('#' + button_bar_ui + '_cluster_list_payload'));
	            });
	
	            $('#' + button_bar_ui + '_cluster_list').on('show.bs.modal', function (event) {
	                var link_clicked = $(event.relatedTarget);
	                var cluster_id = link_clicked.data("cluster");
	                var modal = d3.select('#' + button_bar_ui + '_cluster_list');
	                modal.selectAll(".modal-title").text("Listing nodes in cluster " + cluster_id);
	                $('#' + button_bar_ui + '_cluster_list_view_toggle').data('cluster', cluster_id);
	
	                _cluster_list_view_render(cluster_id, $('#' + button_bar_ui + '_cluster_list_view_toggle').data("view") != "id", modal.select('#' + button_bar_ui + '_cluster_list_payload'));
	            });
	
	            var cluster_ui_container = d3.select("#" + button_bar_ui + "_cluster_operations_container");
	
	            cluster_ui_container.selectAll("li").remove();
	
	            var cluster_commands = [["Expand All", function () {
	                return self.expand_some_clusters();
	            }, true, 'hivtrace-expand-all'], ["Collapse All", function () {
	                return self.collapse_some_clusters();
	            }, true, 'hivtrace-collapse-all'], ["Expand Filtered", function () {
	                return self.expand_some_clusters(self.select_some_clusters(function (n) {
	                    return n.match_filter;
	                }));
	            }, true, 'hivtrace-expand-filtered'], ["Collapse Filtered", function () {
	                return self.collapse_some_clusters(self.select_some_clusters(function (n) {
	                    return n.match_filter;
	                }));
	            }, true, 'hivtrace-collapse-filtered'], ["Hide problematic clusters", function (item) {
	                d3.select(item).text(self.hide_hxb2 ? "Hide problematic clusters" : "Show problematic clusters");
	                self.toggle_hxb2();
	            }, self.has_hxb2_links, 'hivtrace-hide-problematic-clusters']];
	
	            if (!self._is_CDC_) {
	                cluster_commands.push(["Show removed edges", function (item) {
	                    self.filter_edges = !self.filter_edges;
	                    d3.select(item).text(self.filter_edges ? "Show removed edges" : "Hide removed edges");
	                    self.update(false);
	                }, function () {
	                    return _.some(self.edges, function (d) {
	                        return d.removed;
	                    });
	                }, 'hivtrace-show-removed-edges']);
	            }
	
	            cluster_commands.forEach(function (item, index) {
	                var handler_callback = item[1];
	                if (item[2]) {
	                    this.append("li").append("a").text(item[0]).attr("href", "#").attr("id", item[3]).on("click", function (e) {
	                        handler_callback(this);
	                        d3.event.preventDefault();
	                    });
	                }
	            }, cluster_ui_container);
	
	            var button_group = d3.select("#" + button_bar_ui + "_button_group");
	
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
	
	                button_group.append("button").classed("btn btn-default btn-sm", true).attr("title", "Save Image").attr("id", "hivtrace-export-image").on("click", function (d) {
	                    helpers.save_image("png", "#network-svg");
	                }).append("i").classed("fa fa-image", true);
	            }
	
	            $("#" + button_bar_ui + "_filter").on("input propertychange", _.throttle(function (e) {
	                var filter_value = $(this).val();
	                self.filter(filter_value.split(" ").filter(function (d) {
	                    return d.length > 0;
	                }).map(function (d) {
	                    if (d.length > 2) {
	                        if (d[0] == '"' && d[d.length - 1] == '"') {
	                            return { type: 're', value: new RegExp("^" + d.substr(1, d.length - 2) + "$", "i") };
	                        }
	                        if (d[0] == '<') {
	                            var distance_threshold = parseFloat(d.substr(1));
	                            if (distance_threshold > 0) {
	                                return { type: 'distance', value: distance_threshold };
	                            }
	                        }
	                    }
	                    return { type: 're', value: new RegExp(d, "i") };
	                }));
	            }, 250));
	
	            $("#" + button_bar_ui + "_hide_filter").on("change", _.throttle(function (e) {
	                self.hide_unselected = !self.hide_unselected;
	                self.filter_visibility();
	                self.update(true);
	            }, 250));
	
	            $("#" + button_bar_ui + "_pairwise_table_pecentage").on("change", _.throttle(function (e) {
	                self.show_percent_in_pairwise_table = !self.show_percent_in_pairwise_table;
	                render_binned_table("#" + button_bar_ui + "_attribute_table", self.colorizer['category_map'], self.colorizer['category_pairwise']);
	            }, 250));
	        }
	
	        if (_networkGraphAttrbuteID in json) {
	            attributes = json[_networkGraphAttrbuteID];
	        } else {
	            if (attributes && "hivtrace" in attributes) {
	                attributes = attributes["hivtrace"];
	            }
	        }
	
	        if (attributes) {
	            /*
	               map attributes into nodes and into the graph object itself using
	               _networkGraphAttrbuteID as the key
	            */
	
	            if ("attribute_map" in attributes) {
	                var attribute_map = attributes["attribute_map"];
	
	                if ("map" in attribute_map && attribute_map["map"].length > 0) {
	                    graph_data[_networkGraphAttrbuteID] = attribute_map["map"].map(function (a, i) {
	                        return { 'label': a, 'type': null, 'values': {}, 'index': i, 'range': 0 };
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
	                        if (d['range'] < graph_data.Nodes.length && d['range'] > 1 && d['range'] <= 20) {
	                            d['type'] = 'category';
	                        }
	                    });
	                }
	            }
	
	            _.each(self._networkPredefinedAttributeTransforms, function (computed, key) {
	                if (!computed['depends'] || _.has(graph_data[_networkGraphAttrbuteID], computed['depends'])) {
	                    var extension = {};
	                    extension[key] = computed;
	                    _.extend(graph_data[_networkGraphAttrbuteID], extension);
	                    _.each(graph_data.Nodes, function (node) {
	                        inject_attribute_node_value_by_id(node, key, computed['map'](node));
	                    });
	                }
	            });
	
	            // populate the UI elements
	            if (button_bar_ui) {
	                // decide if the variable can be considered categorical by examining its range
	
	
	                var valid_cats = _.filter(_.map(graph_data[_networkGraphAttrbuteID], function (d, k) {
	                    d['raw_attribute_key'] = k;
	                    if (d['type'] == "String") {
	                        d['value_range'] = _.keys(_.countBy(graph_data.Nodes, function (nd) {
	                            return attribute_node_value_by_id(nd, k);
	                        }));
	                        d['dimension'] = d["value_range"].length;
	                    } else {
	                        if ('enum' in d) {
	                            d["value_range"] = _.clone(d["enum"]);
	                            d["value_range"].push(_networkMissing);
	                            d['dimension'] = d["value_range"].length;
	                            d['no-sort'] = true;
	                        }
	                    }
	                    return d;
	                }), function (d) {
	                    return 'value_range' in d && d['value_range'].length <= _maximumValuesInCategories;
	                });
	
	                var valid_shapes = _.filter(valid_cats, function (d) {
	                    return d.dimension <= 5;
	                });
	
	                // sort values alphabetically for consistent coloring
	
	                _.each([valid_cats, valid_shapes], function (list) {
	                    _.each(list, function (d) {
	                        var values;
	                        if (d['no-sort']) {
	                            values = d['value_range'];
	                        } else {
	
	                            if (d['type'] == "String") {
	
	                                values = d['value_range'].sort();
	
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
	
	                                    d['stable-ish order'] = reindexed;
	                                }
	                                //values = _.unzip(_.zip (d['value_range'], ordering_map).sort (function (a,b) { if (a[1] < b[1]) return -1; if (a[1] > b[1]) return 1; return 0}))[0]; //d['value_range'].sort ();
	                            } else {
	                                values = d['value_range'].sort();
	                            }
	                        }
	
	                        var map = new Object();
	
	                        _.each(values, function (d2, i) {
	                            map[d2] = i;
	                        });
	
	                        d['value_map'] = function (v, key) {
	                            return key ? key == 'lookup' ? _.invert(map) : map : map[v];
	                        };
	                    });
	                });
	
	                var valid_scales = _.filter(_.map(graph_data[_networkGraphAttrbuteID], function (d, k) {
	
	                    function determine_scaling(d, values, scales) {
	                        var low_var = Infinity;
	
	                        _.each(scales, function (scl) {
	                            d['value_range'] = d3.extent(values);
	                            var bins = _.map(_.range(_networkContinuousColorStops), function () {
	                                return 0.;
	                            });
	                            scl.range([0, _networkContinuousColorStops - 1]).domain(d['value_range']);
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
	                                d['scale'] = scl;
	                            }
	                        });
	                    }
	
	                    d['raw_attribute_key'] = k;
	                    if (d.type == "Number") {
	                        var values = _.filter(_.map(graph_data.Nodes, function (nd) {
	                            return attribute_node_value_by_id(nd, k);
	                        }), function (v) {
	                            return v == _networkMissing ? null : v;
	                        });
	                        // automatically determine the scale and see what spaces the values most evenly
	                        determine_scaling(d, values, [d3.scale.linear(), d3.scale.log(), d3.scale.pow().exponent(1 / 3), d3.scale.pow().exponent(0.25), d3.scale.pow().exponent(0.5), d3.scale.pow().exponent(1 / 8), d3.scale.pow().exponent(1 / 16)]);
	                    } else {
	                        if (d.type == "Date") {
	                            var values = _.filter(_.map(graph_data.Nodes, function (nd) {
	                                try {
	                                    var a_date = attribute_node_value_by_id(nd, k);
	                                    //console.log (k, a_date, _defaultDateFormat.parse (a_date));
	                                    inject_attribute_node_value_by_id(nd, k, _defaultDateFormat.parse(a_date));
	                                } catch (err) {
	                                    inject_attribute_node_value_by_id(nd, k, _networkMissing);
	                                }
	                                return attribute_node_value_by_id(nd, k);
	                            }), function (v) {
	                                return v == _networkMissing ? null : v;
	                            });
	                            // automatically determine the scale and see what spaces the values most evenly
	                            determine_scaling(d, values, [d3.time.scale()]);
	                        }
	                    }
	                    return d;
	                }), function (d) {
	                    return d.type == "Number" || d.type == "Date";
	                });
	
	                //valid_cats.splice (0,0, {'label' : 'None', 'index' : -1});
	
	                [d3.select("#" + button_bar_ui + "_attributes"), d3.select("#" + button_bar_ui + "_attributes_cat")].forEach(function (m) {
	
	                    m.selectAll("li").remove();
	
	                    var menu_items = [[['None', null, _.partial(handle_attribute_categorical, null)]], [['Categorical', 'heading', null]]].concat(valid_cats.map(function (d, i) {
	                        return [[d['label'], d['raw_attribute_key'], _.partial(handle_attribute_categorical, d['raw_attribute_key'])]];
	                    }));
	
	                    if (valid_scales.length) {
	                        menu_items = menu_items.concat([[['Continuous', 'heading', null]]]).concat(valid_scales.map(function (d, i) {
	                            return [[d['label'], d['raw_attribute_key'], _.partial(handle_attribute_continuous, d['raw_attribute_key'])]];
	                        }));
	                    }
	
	                    var cat_menu = m.selectAll("li").data(menu_items);
	
	                    cat_menu.enter().append("li").classed("disabled", function (d) {
	                        return d[0][1] == 'heading';
	                    }).style("font-variant", function (d) {
	                        return d[0][1] < -1 ? "small-caps" : "normal";
	                    });
	
	                    cat_menu.selectAll("a").data(function (d) {
	                        return d;
	                    }).enter().append("a").text(function (d, i, j) {
	                        return d[0];
	                    }).attr("style", function (d, i, j) {
	                        if (d[1] == 'heading') return 'font-style: italic';if (j == 0) {
	                            return ' font-weight: bold;';
	                        };return null;
	                    }).attr('href', '#').on("click", function (d) {
	                        if (d[2]) {
	                            d[2].call();
	                        }
	                    });
	                });
	
	                [d3.select("#" + button_bar_ui + "_shapes")].forEach(function (m) {
	
	                    m.selectAll("li").remove();
	                    var cat_menu = m.selectAll("li").data([[['None', null, _.partial(handle_shape_categorical, null)]]].concat(valid_shapes.map(function (d, i) {
	                        return [[d['label'], d['raw_attribute_key'], _.partial(handle_shape_categorical, d['raw_attribute_key'])]];
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
	                            return ' font-weight: bold;';
	                        };return null;
	                    }).attr('href', '#').on("click", function (d) {
	                        if (d[2]) {
	                            d[2].call();
	                        }
	                    });
	                });
	
	                $("#" + button_bar_ui + "_opacity_invert").on("click", function (e) {
	                    if (self.colorizer['opacity_scale']) {
	                        self.colorizer['opacity_scale'].range(self.colorizer['opacity_scale'].range().reverse());
	                        self.update(true);
	                        draw_attribute_labels();
	                    }
	                    $(this).toggleClass("btn-active btn-default");
	                });
	
	                $("#" + button_bar_ui + "_attributes_invert").on("click", function (e) {
	                    if (self.colorizer['category_id']) {
	                        graph_data[_networkGraphAttrbuteID][self.colorizer['category_id']]['scale'].range(graph_data[_networkGraphAttrbuteID][self.colorizer['category_id']]['scale'].range().reverse());
	                        self.clusters.forEach(function (the_cluster) {
	                            the_cluster["gradient"] = compute_cluster_gradient(the_cluster, self.colorizer['category_id']);
	                        });
	                        self.update(true);
	                        draw_attribute_labels();
	                    }
	                    $(this).toggleClass("btn-active btn-default");
	                });
	
	                [d3.select("#" + button_bar_ui + "_opacity")].forEach(function (m) {
	
	                    m.selectAll("li").remove();
	                    var cat_menu = m.selectAll("li").data([[['None', null, _.partial(handle_attribute_opacity, null)]]].concat(valid_scales.map(function (d, i) {
	                        return [[d['label'], d['raw_attribute_key'], _.partial(handle_attribute_opacity, d['raw_attribute_key'])]];
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
	                            return ' font-weight: bold;';
	                        };return null;
	                    }).attr('href', '#').on("click", function (d) {
	                        if (d[2]) {
	                            d[2].call();
	                        }
	                    });
	                });
	            }
	        }
	
	        if (self.cluster_sizes.length > max_points_to_render) {
	            var sorted_array = self.cluster_sizes.map(function (d, i) {
	                return [d, i + 1];
	            }).sort(function (a, b) {
	                return a[0] - b[0];
	            });
	
	            for (var k = 0; k < sorted_array.length - max_points_to_render; k++) {
	                exclude_cluster_ids[sorted_array[k][1]] = 1;
	            }
	            warning_string = "Excluded " + (sorted_array.length - max_points_to_render) + " clusters (maximum size " + sorted_array[k - 1][0] + " nodes) because only " + max_points_to_render + " points can be shown at once.";
	        }
	
	        // Initialize class attributes
	        singletons = graph_data.Nodes.filter(function (v, i) {
	            return v.cluster === null;
	        }).length;self.nodes = graph_data.Nodes.filter(function (v, i) {
	            if (v.cluster && typeof exclude_cluster_ids[v.cluster] === "undefined") {
	                connected_links[i] = total++;return true;
	            }return false;
	        });
	        self.edges = graph_data.Edges.filter(function (v, i) {
	            return connected_links[v.source] != undefined && connected_links[v.target] != undefined;
	        });
	        self.edges = self.edges.map(function (v, i) {
	            v.source = connected_links[v.source];v.target = connected_links[v.target];v.id = i;return v;
	        });
	
	        compute_node_degrees(self.nodes, self.edges);
	
	        var r = default_layout(self.clusters, self.nodes, exclude_cluster_ids);
	        self.clusters = r[0];
	        self.nodes = r[1];
	        self.clusters.forEach(function (d, i) {
	            cluster_mapping[d.cluster_id] = i;
	            d.hxb2_linked = d.children.some(function (c) {
	                return c.hxb2_linked;
	            });
	            var degrees = d.children.map(function (c) {
	                return c.degree;
	            });
	            degrees.sort(d3.ascending);
	            d.degrees = helpers.describe_vector(degrees);
	            d.distances = [];
	        });
	
	        self.edges.forEach(function (e, i) {
	            self.clusters[cluster_mapping[self.nodes[e.target].cluster]].distances.push(e.length);
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
	            var sort_key = $(element).data("sort-on");
	            var sorted_state = $(element).data("sorted");
	            var sorted_function = sort_table_toggle_icon(element);
	
	            var sort_accessor = sort_key ? function (x) {
	                var val = x[sort_key];if (typeof val === "function") return val();return val;
	            } : function (x) {
	                return x;
	            };
	
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
	                }).attr("data-sorted", "unsorted").attr("data-column-id", index).attr("data-sort-on", data.sort);
	                clicker.append("i").classed("fa fa-sort", true).style("margin-left", "0.2em");
	            }
	        }
	        if ("help" in data) {
	            this_sel.attr("title", data.help);
	        }
	    }
	
	    function add_a_sortable_table(container, headers, content) {
	
	        var thead = container.selectAll("thead");
	        if (thead.empty()) {
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
	        if (tbody.empty()) {
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
	        this_cell.append("span").text(payload).style("padding-right", "0.5em");
	        this_cell.append("button").classed("btn btn-primary btn-xs pull-right", true).text("Zoom").attr("data-toggle", "modal").attr("data-target", "#" + button_bar_ui + "_cluster_zoom").attr("data-cluster", payload);
	        this_cell.append("button").classed("btn btn-xs pull-right", true).text("List").attr("data-toggle", "modal").attr("data-target", "#" + button_bar_ui + "_cluster_list").attr("data-cluster", payload);
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
	                format_a_cell(d3.select(element).datum(), null, element);
	            }
	        });
	    };
	
	    function _node_table_draw_buttons(element, payload) {
	        var this_cell = d3.select(element);
	        var labels = [[payload[0] ? "hide" : "show", 0]];
	
	        var buttons = this_cell.selectAll("button").data(labels);
	        buttons.enter().append("button");
	        buttons.exit().remove();
	        buttons.classed("btn btn-primary btn-xs btn-node-property", true).text(function (d) {
	            return d[0];
	        }).attr("disabled", function (d) {
	            return d[1] ? "disabled" : null;
	        }).on("click", function (d) {
	            if (d[1] == 0) {
	                if (payload[0]) {
	                    collapse_cluster(self.clusters[payload[payload.length - 1] - 1], true);
	                } else {
	                    expand_cluster(self.clusters[payload[payload.length - 1] - 1]);
	                }
	                format_a_cell(d3.select(element).datum(), null, element);
	            }
	        });
	    };
	
	    self.update_volatile_elements = function (container) {
	        container.selectAll("td").filter(function (d, i) {
	            return "volatile" in d;
	        }).each(function (d, i) {
	            format_a_cell(d, i, this);
	        });
	    };
	
	    function draw_node_table() {
	
	        if (self.node_table) {
	            add_a_sortable_table(self.node_table,
	            // headers
	            [[{ value: "ID", sort: "value", help: "Node ID" }, { value: "Status", sort: "value" }, { value: "# of links", sort: "value", help: "Number of links (Node degree)" }, { value: "Cluster", sort: "value", help: "Which cluster does the node belong to" }]],
	            // rows
	            self.nodes.map(function (n, i) {
	                return [{ "value": n.id, help: "Node ID" }, { "value": function value() {
	                        return [!self.clusters[n.cluster - 1].collapsed, n.cluster];
	                    },
	                    "callback": _node_table_draw_buttons,
	                    "volatile": true
	                }, { "value": n.degree, help: "Node degree" }, { "value": n.cluster, help: "Which cluster does the node belong to" }];
	            }));
	        }
	    }
	
	    function draw_cluster_table() {
	        if (self.cluster_table) {
	            add_a_sortable_table(self.cluster_table,
	            // headers
	            [[{ value: "Cluster ID", sort: "value", help: "Unique cluster ID" }, { value: "Visibility", sort: "value", help: "Visibility in the network tab" }, { value: "Size", sort: "value", help: "Number of nodes in the cluster" }, { value: "# links/node<br>Mean [Median, IQR]", html: true }, { value: "Genetic distance<br>Mean [Median, IQR]", help: "Genetic distance among nodes in the cluster", html: true }]], self.clusters.map(function (d, i) {
	                // rows
	                return [{ value: d.cluster_id,
	                    callback: _cluster_table_draw_id }, { value: function value() {
	                        return [d.collapsed, d.hxb2_linked, d.match_filter, d.cluster_id];
	                    },
	                    callback: _cluster_table_draw_buttons,
	                    volatile: true
	                }, { value: d.children.length }, { value: d.degrees, format: function format(d) {
	                        return _defaultFloatFormat(d['mean']) + " [" + _defaultFloatFormat(d['median']) + ", " + _defaultFloatFormat(d['Q1']) + " - " + _defaultFloatFormat(d['Q3']) + "]";
	                    } }, { value: d.distances, format: function format(d) {
	                        return _defaultFloatFormat(d['mean']) + " [" + _defaultFloatFormat(d['median']) + ", " + _defaultFloatFormat(d['Q1']) + " - " + _defaultFloatFormat(d['Q3']) + "]";
	                    } }];
	            }));
	        }
	    }
	
	    /*------------ Update layout code ---------------*/
	    function update_network_string(draw_me) {
	        if (network_status_string) {
	            var clusters_shown = self.clusters.length - draw_me.clusters.length,
	                clusters_removed = self.cluster_sizes.length - self.clusters.length,
	                nodes_removed = graph_data.Nodes.length - singletons - self.nodes.length;
	
	            /*var s = "Displaying a network on <strong>" + self.nodes.length + "</strong> nodes, <strong>" + self.clusters.length + "</strong> clusters"
	                    + (clusters_removed > 0 ? " (an additional " + clusters_removed + " clusters and " + nodes_removed + " nodes have been removed due to network size constraints)" : "") + ". <strong>"
	                    + clusters_shown +"</strong> clusters are expanded. Of <strong>" + self.edges.length + "</strong> edges, <strong>" + draw_me.edges.length + "</strong>, and of  <strong>" + self.nodes.length  + " </strong> nodes,  <strong>" + draw_me.nodes.length + " </strong> are displayed. ";
	            if (singletons > 0) {
	                s += "<strong>" +singletons + "</strong> singleton nodes are not shown. ";
	            }*/
	
	            var s = "<span class = 'badge'>" + self.clusters.length + "</span> clusters <span class = 'label label-primary'>" + clusters_shown + " expanded</span> <span class = 'badge'> " + self.nodes.length + "</span> nodes <span class = 'label label-primary'>" + draw_me.nodes.length + " shown</span> " + "<span class = 'badge'>" + self.edges.length + "</span> " + (self._is_CDC_ ? "links" : "edges") + " <span class = 'label label-primary'>" + draw_me.edges.length + " shown</span>";
	
	            d3.select(network_status_string).html(s);
	        }
	    }
	
	    function draw_a_node(container, node) {
	        container = d3.select(container);
	
	        var symbol_type = node.hxb2_linked && !node.is_lanl ? "cross" : node.is_lanl ? "triangle-down" : self.node_shaper['shaper'](node);
	
	        container.attr("d", misc.symbol(symbol_type).size(node_size(node))).attr('class', 'node').classed('selected_object', function (d) {
	            return d.match_filter;
	        }).attr("transform", function (d) {
	            return "translate(" + d.x + "," + d.y + ")";
	        }).style('fill', function (d) {
	            return node_color(d);
	        }).style('opacity', function (d) {
	            return node_opacity(d);
	        }).style('display', function (d) {
	            if (d.is_hidden) return 'none';return null;
	        }).on('click', handle_node_click).on('mouseover', node_pop_on).on('mouseout', node_pop_off).call(network_layout.drag().on('dragstart', node_pop_off));
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
	            var v = { 'container': container,
	                'cluster': the_cluster,
	                'startAngle': running_totals[index] / sums[index] * 2 * Math.PI,
	                'endAngle': (running_totals[index] + d[1]) / sums[index] * 2 * Math.PI,
	                'name': d[0],
	                'rim': index > 0 };
	            running_totals[index] += d[1];
	            return v;
	        });
	
	        var arc_radius = cluster_box_size(the_cluster) * 0.5;
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
	            return d.rim ? self.colorizer['selected'](d.name) : the_cluster["gradient"] ? 'url(#' + the_cluster["gradient"] + ')' : cluster_color(the_cluster, d.name);
	        }).style('display', function (d) {
	            if (the_cluster.is_hidden) return 'none';return null;
	        });
	    }
	
	    function handle_shape_categorical(cat_id) {
	        var set_attr = "None";
	
	        ["#" + button_bar_ui + "_shapes"].forEach(function (m) {
	            d3.select(m).selectAll("li").selectAll("a").attr("style", function (d, i) {
	                if (d[1] == cat_id) {
	                    set_attr = d[0];return ' font-weight: bold;';
	                };return null;
	            });
	            d3.select(m + "_label").html("Shape: " + set_attr + ' <span class="caret"></span>');
	        });
	
	        if (cat_id) {
	            var shape_mapper = d3.scale.ordinal().domain(_.range(0, graph_data[_networkGraphAttrbuteID][cat_id].dimension)).range(_networkShapeOrdering);
	            self.node_shaper['id'] = cat_id;
	            self.node_shaper['shaper'] = function (d) {
	                return shape_mapper(graph_data[_networkGraphAttrbuteID][cat_id]['value_map'](attribute_node_value_by_id(d, cat_id)));
	            };
	            self.node_shaper['category_map'] = graph_data[_networkGraphAttrbuteID][cat_id]['value_map'];
	        } else {
	            self.node_shaper.id = null;
	            self.node_shaper.shaper = function () {
	                return 'circle';
	            };
	            self.node_shaper['category_map'] = null;
	        }
	        //console.log (graph_data [_networkGraphAttrbuteID][cat_id]['value_map'], self.node_shaper.domain(), self.node_shaper.range());
	        draw_attribute_labels();
	        self.update(true);
	        d3.event.preventDefault();
	    }
	
	    function draw_attribute_labels() {
	
	        legend_svg.selectAll("g.hiv-trace-legend").remove();
	        var offset = 10;
	
	        if (self.colorizer['category_id']) {
	            legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed('hiv-trace-legend', true).append("text").text("Color: " + self.colorizer['category_id']).style("font-weight", "bold");
	            offset += 18;
	
	            if (self.colorizer["continuous"]) {
	                var anchor_format = graph_data[_networkGraphAttrbuteID][self.colorizer['category_id']]['type'] == "Date" ? _defaultDateViewFormatShort : d3.format(",.4r");
	                var scale = graph_data[_networkGraphAttrbuteID][self.colorizer['category_id']]['scale'];
	
	                _.each(_.range(_networkContinuousColorStops), function (value) {
	                    var x = scale.invert(value);
	                    legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text(anchor_format(x));
	                    legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", self.colorizer['category'](x));
	
	                    offset += 18;
	                });
	
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text("missing");
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", _networkMissingColor);
	
	                offset += 18;
	            } else {
	                _.each(self.colorizer['category_map'](null, 'map'), function (value, key) {
	                    legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text(key);
	                    legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", self.colorizer['category'](key));
	
	                    offset += 18;
	                });
	            }
	        }
	
	        if (self.node_shaper['id']) {
	            legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed('hiv-trace-legend', true).append("text").text("Shape: " + self.node_shaper['id']).style("font-weight", "bold");
	            offset += 18;
	
	            var shape_mapper = d3.scale.ordinal().domain(_.range(0, graph_data[_networkGraphAttrbuteID][self.node_shaper['id']].dimension)).range(_networkShapeOrdering);
	
	            _.each(self.node_shaper['category_map'](null, 'map'), function (value, key) {
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text(key);
	
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("path").attr("transform", "translate(5,-5)").attr("d", misc.symbol(shape_mapper(value)).size(128)).classed('legend', true).style('fill', 'none');
	
	                offset += 18;
	            });
	        }
	
	        if (self.colorizer['opacity_id']) {
	            legend_svg.append("g").attr("transform", "translate(0," + offset + ")").classed('hiv-trace-legend', true).append("text").text("Opacity: " + self.colorizer['opacity_id']).style("font-weight", "bold");
	            offset += 18;
	
	            var anchor_format = graph_data[_networkGraphAttrbuteID][self.colorizer['opacity_id']]['type'] == "Date" ? _defaultDateViewFormatShort : d3.format(",.4r");
	            var scale = graph_data[_networkGraphAttrbuteID][self.colorizer['opacity_id']]['scale'];
	
	            _.each(_.range(_networkContinuousColorStops), function (value) {
	                var x = scale.invert(value);
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text(anchor_format(x));
	                legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", "black").style("opacity", self.colorizer['opacity'](x));
	
	                offset += 18;
	            });
	
	            legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(20," + offset + ")").append("text").text("missing");
	            legend_svg.append("g").classed('hiv-trace-legend', true).attr("transform", "translate(0," + offset + ")").append("circle").attr("cx", "8").attr("cy", "-4").attr("r", "8").classed("legend", true).style("fill", "black").style("opacity", _networkMissingOpacity);
	
	            offset += 18;
	        }
	    }
	
	    function compute_cluster_gradient(cluster, cat_id) {
	        if (cat_id) {
	            var id = "hivtrace-cluster-gradient-" + self.gradient_id++;
	            var gradient = network_svg.selectAll("defs").append("radialGradient").attr("id", id);
	            var values = _.map(cluster.children, function (node) {
	                var value = attribute_node_value_by_id(node, cat_id);return value == _networkMissing ? Infinity : value;
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
	                gradient.append("stop").attr("offset", "" + (1 + index + infinite) * 100 / values.length + "%").attr("stop-color", self.colorizer['category'](value));
	            });
	            //gradient.append ("stop").attr ("offset", "100%").attr ("stop-color", self.colorizer['category'] (dom[1]));
	
	
	            return id;
	        }
	        return null;
	    }
	
	    function handle_attribute_opacity(cat_id) {
	        var set_attr = "None";
	
	        ["#" + button_bar_ui + "_opacity"].forEach(function (m) {
	            d3.select(m).selectAll("li").selectAll("a").attr("style", function (d, i) {
	                if (d[1] == cat_id) {
	                    set_attr = d[0];return ' font-weight: bold;';
	                };return null;
	            });
	            d3.select(m + "_label").html("Opacity: " + set_attr + ' <span class="caret"></span>');
	        });
	
	        d3.select("#" + button_bar_ui + "_opacity_invert").style("display", set_attr == "None" ? "none" : "inline").classed("btn-active", false).classed("btn-default", true);
	
	        self.colorizer['opacity_id'] = cat_id;
	        if (cat_id) {
	            var scale = graph_data[_networkGraphAttrbuteID][cat_id]['scale'];
	            self.colorizer['opacity_scale'] = d3.scale.linear().domain([0, _networkContinuousColorStops - 1]).range([0.25, 1]);
	            self.colorizer['opacity'] = function (v) {
	                if (v == _networkMissing) {
	                    return _networkMissingOpacity;
	                }
	                return self.colorizer['opacity_scale'](scale(v));
	            };
	        } else {
	            self.colorizer['opacity'] = null;
	            self.colorizer['opacity_scale'] = null;
	        }
	
	        draw_attribute_labels();
	        self.update(true);
	        d3.event.preventDefault();
	    }
	
	    function handle_attribute_continuous(cat_id) {
	        var set_attr = "None";
	
	        render_chord_diagram("#" + button_bar_ui + "_aux_svg_holder", null, null);
	        render_binned_table("#" + button_bar_ui + "_attribute_table", null, null);
	
	        network_svg.selectAll("radialGradient").remove();
	
	        self.clusters.forEach(function (the_cluster) {
	            delete the_cluster['binned_attributes'];delete the_cluster["gradient"];
	        });
	
	        ["#" + button_bar_ui + "_attributes", "#" + button_bar_ui + "_attributes_cat"].forEach(function (m) {
	            d3.select(m).selectAll("li").selectAll("a").attr("style", function (d, i) {
	                if (d[1] == cat_id) {
	                    set_attr = d[0];return ' font-weight: bold;';
	                };return null;
	            });
	            d3.select(m + "_label").html("Color: " + set_attr + ' <span class="caret"></span>');
	        });
	
	        d3.select("#" + button_bar_ui + "_attributes_invert").style("display", set_attr == "None" ? "none" : "inline").classed("btn-active", false).classed("btn-default", true);
	
	        if (cat_id) {
	            //console.log (graph_data [_networkGraphAttrbuteID][cat_id]);
	
	
	            self.colorizer['category'] = _.wrap(d3.scale.linear().range(["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]).domain(_.range(_networkContinuousColorStops)), function (func, arg) {
	                return func(graph_data[_networkGraphAttrbuteID][cat_id]['scale'](arg));
	            }); //console.log (self.colorizer['category'].exponent ());
	
	            //console.log (self.colorizer['category'] (graph_data [_networkGraphAttrbuteID][cat_id]['value_range'][0]), self.colorizer['category'] (d['value_range'][1]));
	
	            self.colorizer['category_id'] = cat_id;
	            self.colorizer['continuous'] = true;
	            self.clusters.forEach(function (the_cluster) {
	                the_cluster["gradient"] = compute_cluster_gradient(the_cluster, cat_id);
	            });
	
	            var points = [];
	
	            _.each(self.edges, function (e) {
	
	                var src = attribute_node_value_by_id(self.nodes[e.source], cat_id),
	                    tgt = attribute_node_value_by_id(self.nodes[e.target], cat_id);
	
	                if (src != _networkMissing && tgt != _networkMissing) {
	                    points.push({ x: src, y: tgt, title: self.nodes[e.source].id + " (" + src + ") -- " + self.nodes[e.target].id + " (" + tgt + ")" });
	                }
	            });
	            d3.select("#" + button_bar_ui + "_aux_svg_holder_enclosed").style("display", null);
	
	            scatterPlot(points, 400, 400, "#" + button_bar_ui + "_aux_svg_holder", { x: "Source", y: "Target" }, graph_data[_networkGraphAttrbuteID][cat_id]['type'] == "Date");
	        } else {
	            self.colorizer['category'] = null;
	            self.colorizer['category_id'] = null;
	            self.colorizer['continuous'] = false;
	            self.colorizer['category_pairwise'] = null;
	            self.colorizer['category_map'] = null;
	        }
	
	        draw_attribute_labels();
	        self.update(true);
	        d3.event.preventDefault();
	    }
	
	    function handle_attribute_categorical(cat_id) {
	
	        //console.log (cat_id, graph_data [_networkGraphAttrbuteID]);
	
	        var set_attr = "None";
	        d3.select("#" + button_bar_ui + "_attributes_invert").style("display", "none");
	
	        network_svg.selectAll("radialGradient").remove();
	
	        ["#" + button_bar_ui + "_attributes", "#" + button_bar_ui + "_attributes_cat"].forEach(function (m) {
	            d3.select(m).selectAll("li").selectAll("a").attr("style", function (d, i) {
	                if (d[1] == cat_id) {
	                    set_attr = d[0];return ' font-weight: bold;';
	                };return null;
	            });
	            d3.select(m + "_label").html("Color: " + set_attr + ' <span class="caret"></span>');
	        });
	
	        self.clusters.forEach(function (the_cluster) {
	            delete the_cluster["gradient"];the_cluster['binned_attributes'] = stratify(attribute_cluster_distribution(the_cluster, cat_id));
	        });
	
	        self.colorizer['continuous'] = false;
	
	        if (cat_id) {
	            if (cat_id in _networkPresetColorSchemes) {
	                var domain = [],
	                    range = [];
	                _.each(_networkPresetColorSchemes[cat_id], function (value, key) {
	                    domain.push(key);
	                    range.push(value);
	                });
	                self.colorizer['category'] = d3.scale.ordinal().domain(domain).range(range);
	            } else {
	                if (graph_data[_networkGraphAttrbuteID][cat_id]['color_scale']) {
	                    self.colorizer['category'] = graph_data[_networkGraphAttrbuteID][cat_id]['color_scale'](graph_data[_networkGraphAttrbuteID][cat_id]);
	                } else {
	
	                    self.colorizer['category'] = d3.scale.ordinal().range(_networkCategorical);
	                    var extended_range = _.clone(self.colorizer['category'].range());
	                    extended_range.push(_networkMissingColor);
	
	                    self.colorizer['category'].domain(_.range(_maximumValuesInCategories + 1));
	                    self.colorizer['category'].range(extended_range);
	
	                    if (graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order']) {
	                        self.colorizer['category'] = _.wrap(self.colorizer['category'], function (func, arg) {
	                            if (arg == _networkMissing) {
	                                return func(_maximumValuesInCategories);
	                            }
	                            return func(graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order'][arg]);
	                        });
	                        //console.log (graph_data[_networkGraphAttrbuteID][cat_id]['stable-ish order']);
	                    }
	                }
	            }
	            self.colorizer['category_id'] = cat_id;
	            self.colorizer['category_map'] = graph_data[_networkGraphAttrbuteID][cat_id]['value_map'];
	            //self.colorizer['category_map'][null] =  graph_data [_networkGraphAttrbuteID][cat_id]['range'];
	            self.colorizer['category_pairwise'] = attribute_pairwise_distribution(cat_id, graph_data[_networkGraphAttrbuteID][cat_id].dimension, self.colorizer['category_map']);
	
	            render_chord_diagram("#" + button_bar_ui + "_aux_svg_holder", self.colorizer['category_map'], self.colorizer['category_pairwise']);
	            render_binned_table("#" + button_bar_ui + "_attribute_table", self.colorizer['category_map'], self.colorizer['category_pairwise']);
	        } else {
	            self.colorizer['category'] = null;
	            self.colorizer['category_id'] = null;
	            self.colorizer['category_pairwise'] = null;
	            self.colorizer['category_map'] = null;
	            render_chord_diagram("#" + button_bar_ui + "_aux_svg_holder", null, null);
	            render_binned_table("#" + button_bar_ui + "_attribute_table", null, null);
	        }
	
	        draw_attribute_labels();
	        self.update(true);
	        d3.event.preventDefault();
	    }
	
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
	
	        conditions = _.map(['re', 'distance'], function (cnd) {
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
	
	    self.update = function (soft, friction) {
	
	        self.needs_an_update = false;
	
	        if (friction) {
	            network_layout.friction(friction);
	        }
	        if (network_warning_tag) {
	            if (warning_string.length) {
	                d3.select(network_warning_tag).text(warning_string).style("display", "block");
	                warning_string = "";
	            } else {
	                d3.select(network_warning_tag).style("display", "none");
	            }
	        }
	
	        var rendered_nodes, rendered_clusters, link;
	
	        if (!soft) {
	
	            var draw_me = prepare_data_to_graph();
	
	            network_layout.nodes(draw_me.all).links(draw_me.edges).start();
	
	            update_network_string(draw_me);
	
	            link = network_svg.selectAll(".link").data(draw_me.edges, function (d) {
	                return d.id;
	            });
	
	            link.enter().append("line").classed("link", true);
	            link.exit().remove();
	
	            link.classed("removed", function (d) {
	                return d.removed;
	            }).classed("unsupported", function (d) {
	                return "support" in d && d["support"] > 0.05;
	            }).on("mouseover", edge_pop_on).on("mouseout", edge_pop_off).filter(function (d) {
	                return d.directed;
	            }).attr("marker-end", "url(#arrowhead)");
	
	            rendered_nodes = network_svg.selectAll('.node').data(draw_me.nodes, function (d) {
	                return d.id;
	            });
	            rendered_nodes.exit().remove();
	            rendered_nodes.enter().append("path");
	
	            rendered_clusters = network_svg.selectAll(".cluster-group").data(draw_me.clusters.map(function (d) {
	                return d;
	            }), function (d) {
	                return d.cluster_id;
	            });
	
	            rendered_clusters.exit().remove();
	            rendered_clusters.enter().append("g").attr("class", "cluster-group").attr("transform", function (d) {
	                return "translate(" + d.x + "," + d.y + ")";
	            }).on("click", handle_cluster_click).on("mouseover", cluster_pop_on).on("mouseout", cluster_pop_off).call(network_layout.drag().on("dragstart", cluster_pop_off));
	
	            draw_cluster_table();
	            draw_node_table();
	        } else {
	            rendered_nodes = network_svg.selectAll('.node');
	            rendered_clusters = network_svg.selectAll(".cluster-group");
	            link = network_svg.selectAll(".link");
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
	        link.style("display", function (d) {
	            if (d.target.is_hidden || d.source.is_hidden) {
	                return 'none';
	            };return null;
	        });
	
	        if (!soft) {
	            currently_displayed_objects = rendered_clusters[0].length + rendered_nodes[0].length;
	
	            network_layout.on("tick", function () {
	                var sizes = network_layout.size();
	
	                rendered_nodes.attr("transform", function (d) {
	                    return "translate(" + (d.x = Math.max(10, Math.min(sizes[0] - 10, d.x))) + "," + (d.y = Math.max(10, Math.min(sizes[1] - 10, d.y))) + ")";
	                });
	                rendered_clusters.attr("transform", function (d) {
	                    return "translate(" + (d.x = Math.max(10, Math.min(sizes[0] - 10, d.x))) + "," + (d.y = Math.max(10, Math.min(sizes[1] - 10, d.y))) + ")";
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
	            });
	        } else {
	            link.each(function (d) {
	                d3.select(this).attr("x1", function (d) {
	                    return d.source.x;
	                }).attr("y1", function (d) {
	                    return d.source.y;
	                }).attr("x2", function (d) {
	                    return d.target.x;
	                }).attr("y2", function (d) {
	                    return d.target.y;
	                });
	            });
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
	
	    function attribute_node_value_by_id(d, id) {
	        if (_networkNodeAttributeID in d && id) {
	            if (id in d[_networkNodeAttributeID]) {
	                var v = d[_networkNodeAttributeID][id];
	
	                if (_.isString(v) && v.length == 0) {
	                    return _networkMissing;
	                }
	                return v;
	            }
	        }
	        return _networkMissing;
	    }
	
	    function inject_attribute_node_value_by_id(d, id, value) {
	        if (_networkNodeAttributeID in d && id) {
	            d[_networkNodeAttributeID][id] = value;
	        }
	    }
	
	    function node_size(d) {
	        var r = 5 + Math.sqrt(d.degree); //return (d.match_filter ? 10 : 4)*r*r;
	        return 4 * r * r;
	    }
	
	    function node_color(d) {
	
	        /*if (d.match_filter) {
	            return "white";
	        }*/
	
	        if (self.colorizer['category_id']) {
	            var v = attribute_node_value_by_id(d, self.colorizer['category_id']);
	            if (self.colorizer['continuous']) {
	                if (v == _networkMissing) {
	                    return _networkMissingColor;
	                }
	                //console.log (v, self.colorizer['category'](v));
	            }
	            return self.colorizer['category'](v);
	        }
	        return d.hxb2_linked ? "black" : d.is_lanl ? "red" : "gray";
	    }
	
	    function node_opacity(d) {
	        if (self.colorizer['opacity']) {
	            return self.colorizer['opacity'](attribute_node_value_by_id(d, self.colorizer['opacity_id']));
	        }
	        return 1.;
	    }
	
	    function cluster_color(d, type) {
	        if (d["binned_attributes"]) {
	            return self.colorizer['category'](type);
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
	
	        _.each(_.union(self._additional_node_pop_fields, [self.colorizer['category_id'], self.node_shaper['id'], self.colorizer['opacity_id']]), function (key) {
	            if (key) {
	                if (key in graph_data[_networkGraphAttrbuteID]) {
	                    var attribute = attribute_node_value_by_id(n, key);
	
	                    if (graph_data[_networkGraphAttrbuteID][key]['type'] == "Date") {
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
	
	        var attribute = attribute_node_value_by_id(n, self.colorizer['category_id']);
	
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
	
	    function compute_cluster_centroids(clusters) {
	        for (var c in clusters) {
	            var cls = clusters[c];
	            cls.x = 0.;
	            cls.y = 0.;
	            cls.children.forEach(function (x) {
	                cls.x += x.x;cls.y += x.y;
	            });
	            cls.x /= cls.children.length;
	            cls.y /= cls.children.length;
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
	                n.x = x.x + (Math.random() - 0.5) * x.children.length;n.y = x.y + (Math.random() - 0.5) * x.children.length;
	            });
	        } else {
	            x.children.forEach(function (n) {
	                n.x = self.width * 0.25 + (Math.random() - 0.5) * x.children.length;n.y = 0.25 * self.height + (Math.random() - 0.5) * x.children.length;
	            });
	        }
	    }
	
	    function render_binned_table(id, the_map, matrix) {
	
	        var the_table = d3.select(id);
	
	        the_table.selectAll("thead").remove();
	        the_table.selectAll("tbody").remove();
	
	        d3.select(id + "_enclosed").style("display", matrix ? null : "none");
	
	        if (matrix) {
	
	            var fill = self.colorizer['category'];
	            var lookup = the_map(null, 'lookup');
	
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
	
	        d3.select(id).selectAll("svg").remove();
	
	        d3.select(id + "_enclosed").style("display", matrix ? null : "none");
	
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
	
	            var lookup = the_map(null, 'lookup');
	
	            var svg = d3.select(id).append("svg");
	
	            var chord = d3.layout.chord().padding(.05).sortSubgroups(d3.descending).matrix(matrix);
	
	            var text_offset = 20,
	                width = 450,
	                height = 450,
	                innerRadius = Math.min(width, height - text_offset) * .41,
	                outerRadius = innerRadius * 1.1;
	
	            var fill = self.colorizer['category'],
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
	            //console.log (attribute_node_value_by_id(self.nodes[edge.source], id), attribute_node_value_by_id(self.nodes[edge.target], id));
	            the_matrix[the_map(attribute_node_value_by_id(self.nodes[edge.source], id))][the_map(attribute_node_value_by_id(self.nodes[edge.target], id))] += 1;
	        });
	        // check if there are null values
	
	        var haz_null = the_matrix.some(function (d, i) {
	            if (i == dim - 1) {
	                return d.some(function (d2) {
	                    return d2 > 0;
	                });
	            }return d[dim - 1] > 0;
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
	
	    function attribute_cluster_distribution(the_cluster, attribute_id) {
	        if (attribute_id && the_cluster) {
	            return the_cluster.children.map(function (d) {
	                return attribute_node_value_by_id(d, attribute_id);
	            });
	        }
	        return null;
	    }
	
	    function cluster_info_string(id) {
	        var the_cluster = self.clusters[id - 1],
	            attr_info = the_cluster["binned_attributes"];
	
	        var str;
	
	        if (self._is_CDC_) {
	            str = "<strong>" + self.cluster_sizes[id - 1] + "</strong> individuals." + "<br>Mean links/individual <em> = " + _defaultFloatFormat(the_cluster.degrees['mean']) + "</em>" + "<br>Max links/individual <em> = " + the_cluster.degrees['max'] + "</em>";
	        } else {
	            str = "<strong>" + self.cluster_sizes[id - 1] + "</strong> nodes." + "<br>Mean degree <em>" + _defaultFloatFormat(the_cluster.degrees['mean']) + "</em>" + "<br>Max degree <em>" + the_cluster.degrees['max'] + "</em>" + "<br>Clustering coefficient <em> " + misc.format_value(the_cluster.cc, _defaultFloatFormat) + "</em>";
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
	
	    function expand_cluster_handler(d, do_update, move_out) {
	        if (d.collapsed) {
	            var new_nodes = self.cluster_sizes[d.cluster_id - 1] - 1;
	
	            if (new_nodes > max_points_to_render) {
	                warning_string = "This cluster is too large to be displayed";
	            } else {
	                var leftover = new_nodes + currently_displayed_objects - max_points_to_render;
	                if (leftover > 0) {
	                    for (k = 0; k < open_cluster_queue.length && leftover > 0; k++) {
	                        var cluster = self.clusters[cluster_mapping[open_cluster_queue[k]]];
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
	    }
	
	    function collapse_cluster_handler(d, do_update) {
	        collapse_cluster(self.clusters[cluster_mapping[d.cluster]]);
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
	
	    self.expand_some_clusters = function (subset) {
	        subset = subset || self.clusters;
	        subset.forEach(function (x) {
	            expand_cluster_handler(x, false);
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
	
	    $('#reset_layout').click(function (e) {
	        default_layout(clusters, nodes);
	        self.update();
	        e.preventDefault(); // prevent the default anchor functionality
	    });
	
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
	                container: container ? container : 'body'
	            });
	
	            //this_data.fixed = true;
	
	            _.delay(_.bind(element.tooltip.tooltip, element.tooltip), 500, 'show');
	        } else {
	            if (turn_on == false && element.tooltip) {
	                element.tooltip.tooltip('destroy');
	                element.tooltip = undefined;
	            }
	        }
	    }
	
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
	
	        draw_attribute_labels();
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
	            table_data.push([key, value]);
	        });
	    }
	
	    var degrees = [];
	    _.each(graph["Degrees"]["Distribution"], function (value, index) {
	        for (var k = 0; k < value; k++) {
	            degrees.push(index + 1);
	        }
	    });
	    degrees = helpers.describe_vector(degrees);
	    table_data.push(['Links/node', '']);
	    table_data.push(['&nbsp;&nbsp;<i>Mean</i>', _defaultFloatFormat(degrees['mean'])]);
	    table_data.push(['&nbsp;&nbsp;<i>Median</i>', _defaultFloatFormat(degrees['median'])]);
	    table_data.push(['&nbsp;&nbsp;<i>Range</i>', degrees['min'] + " - " + degrees['max']]);
	    table_data.push(['&nbsp;&nbsp;<i>Interquartile range</i>', degrees['Q1'] + " - " + degrees['Q3']]);
	
	    degrees = helpers.describe_vector(graph["Cluster sizes"]);
	    table_data.push(['Cluster sizes', '']);
	    table_data.push(['&nbsp;&nbsp;<i>Mean</i>', _defaultFloatFormat(degrees['mean'])]);
	    table_data.push(['&nbsp;&nbsp;<i>Median</i>', _defaultFloatFormat(degrees['median'])]);
	    table_data.push(['&nbsp;&nbsp;<i>Range</i>', degrees['min'] + " - " + degrees['max']]);
	    table_data.push(['&nbsp;&nbsp;<i>Interquartile range</i>', degrees['Q1'] + " - " + degrees['Q3']]);
	
	    if (self._is_CDC_) {
	        degrees = helpers.describe_vector(_.map(graph["Edges"], function (e) {
	            return e.length;
	        }));
	        table_data.push(['Genetic distances (links only)', '']);
	        table_data.push(['&nbsp;&nbsp;<i>Mean</i>', _defaultPercentFormat(degrees['mean'])]);
	        table_data.push(['&nbsp;&nbsp;<i>Median</i>', _defaultPercentFormat(degrees['median'])]);
	        table_data.push(['&nbsp;&nbsp;<i>Range</i>', _defaultPercentFormat(degrees['min']) + " - " + _defaultPercentFormat(degrees['max'])]);
	        table_data.push(['&nbsp;&nbsp;<i>Interquartile range</i>', _defaultPercentFormat(degrees['Q1']) + " - " + _defaultPercentFormat(degrees['Q3'])]);
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
	
	module.exports.clusterNetwork = hivtrace_cluster_network_graph;
	module.exports.graphSummary = hivtrace_cluster_graph_summary;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/***/ 44:
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';
	
	var d3 = __webpack_require__(40),
	    _ = __webpack_require__(43),
	    helpers = __webpack_require__(47);
	
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
	        case 'pentagon':
	            return new hivtrace_generate_svg_polygon().sides(5);
	        case 'hexagon':
	            return new hivtrace_generate_svg_polygon().sides(6);
	        case 'septagon':
	            return new hivtrace_generate_svg_polygon().sides(7);
	        case 'octagon':
	            return new hivtrace_generate_svg_polygon().sides(8);
	    }
	    return node;
	}
	
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/***/ 45:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(40),
	    _ = __webpack_require__(43);
	
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
	
		var margin = { top: 10, right: 30, bottom: 50, left: 30 },
		    width = w - margin.left - margin.right,
		    height = h - margin.top - margin.bottom;
	
		var histogram_data = d3.layout.histogram()(data);
	
		var x = d3.scale.linear().domain(d3.extent(data)).range([0, width]);
	
		var y = d3.scale.linear().domain([0, d3.max(_.map(histogram_data, function (b) {
			return b.y;
		}))]).range([height, 0]);
	
		var xAxis = d3.svg.axis().scale(x).orient("bottom");
	
		var yAxis = d3.svg.axis().scale(y).orient("left");
	
		var histogram_svg = d3.select(id).selectAll("svg");
	
		if (histogram_svg) {
			histogram_svg.remove();
		}
	
		histogram_data.splice(0, 0, { 'x': x.domain()[0], 'y': 0, 'dx': 0 });
		histogram_data.splice(histogram_data.length, 0, { 'x': x.domain()[1], 'y': 0, 'dx': 0 });
	
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
	
	function hivtrace_render_histogram(counts, fit, w, h, id) {
	
		var margin = { top: 10, right: 30, bottom: 50, left: 30 },
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
			return { 'x': i + 1, 'y': d + 1 };
		});
		data_to_plot.push({ 'x': counts.length + 1, 'y': 1 });
		data_to_plot.push({ 'x': 0, 'y': 1 });
		data_to_plot.push({ 'x': 0, 'y': counts[0] + 1 });
	
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

/***/ }),

/***/ 46:
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var d3 = __webpack_require__(40),
	    _ = __webpack_require__(43);
	
	function hivtrace_render_scatterplot(points, w, h, id, labels, dates) {
	
	    var margin = { top: 10, right: 10, bottom: 100, left: 100 },
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

	/* WEBPACK VAR INJECTION */(function($, d3, jQuery, _) {'use strict';
	
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
	
	    canvas.toBlob(onsuccess);
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
	
	  if (type == "png") {
	    b64toBlob(image_string, function (blob) {
	
	      var url = window.URL.createObjectURL(blob);
	      var pom = document.createElement('a');
	      pom.setAttribute('download', 'image.png');
	      pom.setAttribute('href', url);
	      $("body").append(pom);
	      pom.click();
	      pom.remove();
	    }, function (error) {
	      // handle error
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
	
	  vector.sort(d3.ascending);
	
	  var d = { 'min': d3.min(vector),
	    'max': d3.max(vector),
	    'median': d3.median(vector),
	    'Q1': d3.quantile(vector, 0.25),
	    'Q3': d3.quantile(vector, 0.75),
	    'mean': d3.mean(vector) };
	
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
	    data_rows.push([]);d3.select(this).selectAll("td").each(function () {
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
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2), __webpack_require__(40), __webpack_require__(2), __webpack_require__(43)))

/***/ })

});
//# sourceMappingURL=hivtrace.js.map