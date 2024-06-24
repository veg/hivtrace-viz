// ==============================
// UI & HTML
// ==============================
const download = require("downloadjs");
const _OTHER = __("general")["other"];
const CATEGORY_UNIQUE_VALUE_LIMIT = 12;

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => {
      console.log("Copying to clipboard was successful!");
    },
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
}

function get_ui_element_selector_by_role(role) {
  return ` [data-hivtrace-ui-role='${role}']`;
};

// TODO: consolidate export functions
function export_csv_button(data, name) {
  data = d3.csv.format(data);
  if (data !== null) {
    name = name ? name + ".csv" : "export.csv";
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(data)
    );
    pom.setAttribute("download", name);
    pom.className = "btn btn-default btn-sm";
    pom.innerHTML =
      '<span class="glyphicon glyphicon-floppy-save"></span> Download CSV';
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

function export_json_button(data, title) {
  if (data !== null) {
    title = title || "export";
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
    );
    pom.setAttribute("download", title + ".json");
    pom.className = "btn btn-default btn-sm";
    pom.innerHTML =
      '<span class="glyphicon glyphicon-floppy-save"></span> Download JSON';
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

function export_handler(data, filename, mimeType) {
  function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    // eslint-disable-next-line
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      return true;
    }
    return false;
  }

  if (msieversion()) {
    var IEwindow = window.open();
    IEwindow.document.write(data);
    IEwindow.document.close();
    IEwindow.document.execCommand("SaveAs", true, filename + ".csv");
    IEwindow.close();
  } else {
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:" +
      (mimeType || "text/plain") +
      ";charset=utf-8," +
      encodeURIComponent(data)
    );
    pom.setAttribute("download", filename || "download.tsv");
    pom.click();
    pom.remove();
  }
}

function b64toBlob(b64, onsuccess, onerror) {
  var img = new Image();

  img.onerror = onerror;

  img.onload = function onload() {
    var canvas = document.getElementById("hyphy-chart-canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (canvas.msToBlob) {
      var blob = canvas.msToBlob(onsuccess);
      onsuccess(blob);
      window.navigator.msSaveBlob(blob, "image.png");
    } else {
      canvas.toBlob(onsuccess);
    }
  };

  img.src = b64;
}

function save_image(type, container) {
  var prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg",
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
              // hack for illustrator crashing on descendent selectors
            } else if (rule.selectorText && rule.selectorText.indexOf(">") === -1) {
              styles += "\n" + rule.cssText;
            }
          }
        }
      } catch {
        console.log("Could not process stylesheet : " + ss); // eslint-disable-line
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

  var source = new XMLSerializer()
    .serializeToString(svg)
    .replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var doctype =
    '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var to_download = [doctype + source];
  var image_string =
    "data:image/svg+xml;base66," + encodeURIComponent(to_download);

  if (navigator.msSaveBlob) {
    // IE10
    download(image_string, "image.svg", "image/svg+xml");
  } else if (type === "png") {
    b64toBlob(
      image_string,
      (blob) => {
        var url = window.URL.createObjectURL(blob);
        var pom = document.createElement("a");
        pom.setAttribute("download", "image.png");
        pom.setAttribute("href", url);
        $("body").append(pom);
        pom.click();
        pom.remove();
      },
      (e) => {
        console.log(error); // eslint-disable-line
      }
    );
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("download", "image.svg");
    pom.setAttribute("href", image_string);
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

function table_to_text(table_id, sep) {
  sep = sep || "\t";
  var header_row = [];
  var extract_text = function (e) {
    const node = d3.select(e).node();
    var plain_text = node.firstChild;
    if (plain_text) plain_text = plain_text.nodeValue;
    if (plain_text && plain_text.length) return plain_text;

    var first_element = d3.select(e).selectAll("[data-text-export]");
    if (!first_element.empty()) {
      return d3.select(first_element.node()).attr("data-text-export");
    }

    /*if (table_id === "#priority_set_table") {
      if (node.firstChild.tagName === "I") {
        return node.firstChild.getAttribute("title");
      } else if (node.firstChild.tagName === "SPAN") {
        return node.children[1].innerHTML;
      }
    }*/

    first_element = d3.select(e).selectAll("p, span, button, abbr, select");
    if (!first_element.empty()) {
      return d3.select(first_element.node()).text();
    }
    return "";
  };

  d3.selectAll(table_id + " thead th").each(function () {
    header_row.push(extract_text(this));
  });
  var data_rows = [];
  d3.select(table_id + " tbody")
    .selectAll("tr")
    .each(function (d) {
      var this_row = d3.select(this);
      if (this_row.style("display") !== "none") {
        var write_to = data_rows.length;
        data_rows.push([]);
        d3.select(this)
          .selectAll("td")
          .each(function () {
            data_rows[write_to].push(extract_text(this));
          });
      }
    });

  return (
    (sep === "," ? d3.csv.format([header_row]) : d3.tsv.format([header_row])) +
    "\n" +
    (sep === "," ? d3.csv.format(data_rows) : d3.tsv.format(data_rows))
    /*data_rows
      .map(function(d) {
        return d.join(sep);
      })
      .join("\n")
      */
  );
}

function hivtrace_render_button_export_table_to_text(
  parent_id,
  table_id,
  csv,
  file_name_placeholder
) {
  var the_button = d3.select(parent_id);
  the_button.selectAll("[data-type='download-button']").remove();

  the_button = the_button
    .append("a")
    .attr("target", "_blank")
    .attr("data-type", "download-button")
    .on("click", function (data, element) {
      d3.event.preventDefault();
      var table_tag = d3.select(this).attr("data-table");
      var table_text = table_to_text(table_tag, csv ? "," : "\t");
      file_name_placeholder = file_name_placeholder || table_tag.substring(1);
      if (!csv) {
        export_handler(
          table_text,
          file_name_placeholder + ".tsv",
          "text/tab-separated-values"
        );
      } else {
        export_handler(
          table_text,
          file_name_placeholder + ".csv",
          "text/comma-separated-values"
        );
      }
    })
    .attr("data-table", table_id);

  the_button.append("i").classed("fa fa-download fa-2x", true);
  return the_button;
}

// ==============================
// Graph & Data
// ==============================
function collapseLargeCategories(nodes, schema) {
  let schema_keys = _.keys(schema);
  let new_obj = {};
  _.each(schema_keys, (sk) => (new_obj[sk] = []));

  // get attribute diversity to sort on later
  let pa = _.map(nodes, (n) => _.omit(n.patient_attributes, "_id"));

  _.each(pa, (p) => {
    _.each(schema_keys, (sk) => {
      new_obj[sk].push(p[sk]);
    });
  });

  let counts = _.mapObject(new_obj, (d) => _.countBy(d));

  // Sort and place everything after CATEGORY_UNIQUE_VALUE_LIMIT entries in 'Other'
  // map object to counts
  _.each(schema_keys, (sk) => {
    let entries = Object.entries(counts[sk]);
    let sorted = _.sortBy(entries, (d) => -d[1]);

    if (sorted.length > CATEGORY_UNIQUE_VALUE_LIMIT) {
      let count = sorted[CATEGORY_UNIQUE_VALUE_LIMIT][1];

      // drop entries until we reach that value in sorted
      let others = _.map(_.partition(sorted, (d) => d[1] <= count)[0], _.first);

      // Remap all entries to "Other"
      // Now take the entries in others and map to "Other"
      _.each(nodes, (n) => {
        if (_.contains(others, n["patient_attributes"][sk])) {
          n["patient_attributes"][sk] = _OTHER;
        }
      });
    }
  });

  return true;
}

/**
 * @param {Object} uniqValues object consisting of all node categories (attributes), with key as the category_id and value as the set of unique values
 * @param {*} colorizer maps current category to the displayed colors 
 * @returns {Object} value-color mapping of the currently selected "color by" node category (as selected by the graph UI bar)
 */
function getCurrentCategoryColorMapping(uniqValues, colorizer) {
  const currentCategoryUniqueValues = uniqValues[colorizer.category_id];
  const currentCategoryCorrespondingColors = _.map(currentCategoryUniqueValues, (d) =>
    colorizer.category(d)
  );
  return _.object(currentCategoryUniqueValues, currentCategoryCorrespondingColors);
}

function describe_vector(vector, as_list) {
  let d;

  if (vector.length) {
    vector.sort(d3.ascending);

    d = {
      min: d3.min(vector),
      max: d3.max(vector),
      median: d3.median(vector),
      Q1: d3.quantile(vector, 0.25),
      Q3: d3.quantile(vector, 0.75),
      mean: d3.mean(vector),
    };
  } else {
    d = {
      min: null,
      max: null,
      median: null,
      Q1: null,
      Q3: null,
      mean: null,
    };
  }

  if (as_list) {
    d =
      "<pre>Range  :" +
      d["min"] +
      "-" +
      d["max"] +
      "\n" +
      "IQR    :" +
      d["Q1"] +
      "-" +
      d["Q3"] +
      "\n" +
      "Mean   :" +
      d["mean"] +
      "\n" +
      "Median :" +
      d["median"] +
      "\n" +
      "</pre>";

    /*d =
    "<dl class = 'dl-horizontal'>" +
    "<dt>Range</dt><dd>" + d['min'] + "-" + d['max'] + "</dd>" +
    "<dt>IQR</dt><dd>" + d['Q1'] + "-" + d['Q3'] +  "</dd>" +
    "<dt>Mean</dt><dd>" + d['mean'] +  "</dd>" +
    "<dt>Median</dt><dd>" + d['median'] + "</dd></dl>";*/
  }

  return d;
}

// hacky enums
const HIVTRACE_UNDEFINED = {};
const HIVTRACE_TOO_LARGE = {};
const HIVTRACE_PROCESSING = {};
function format_value(value, formatter) {
  if (typeof value === "undefined") {
    return "Not computed";
  }
  if (value === HIVTRACE_UNDEFINED) {
    return "Undefined";
  }
  if (value === HIVTRACE_TOO_LARGE) {
    return "Size limit";
  }

  if (value === HIVTRACE_PROCESSING) {
    return '<span class="fa fa-spin fa-spinner"></span>';
  }

  return formatter ? formatter(value) : value;
}

/**
 * Categorize an edge by its edge length (pairwise distance) and whether or not it is below a threshold. 
 * @param {*} edge
 * @param {Array} edge_types an array representing two edge types 
 * @param {Number} threshold
 * @returns an element of edge_types
 */
function get_edge_type(edge, edge_types, threshold) {
  return edge.length <= threshold ? edge_types[0] : edge_types[1];
};

function get_unique_values(nodes, schema) {
  let schema_keys = _.keys(schema);

  let new_obj = {};
  _.each(schema_keys, (sk) => (new_obj[sk] = []));

  // get attribute diversity to sort on later
  let pa = _.map(nodes, (n) => _.omit(n.patient_attributes, "_id"));

  _.each(pa, (p) => {
    _.each(schema_keys, (sk) => {
      new_obj[sk].push(p[sk]);
    });
  });

  // Get uniques across all keys
  return _.mapObject(new_obj, (val) => _.uniq(val));
}

// TODO: review if is this right? 
function get_unique_count(nodes, schema) {
  return _.mapObject(get_unique_values(nodes, schema), (val) => val.length);
}

// TODO: convert and save this data rather than do it each time.
function hivtrace_cluster_depthwise_traversal(
  nodes,
  edges,
  edge_filter,
  save_edges,
  seed_nodes,
  white_list
  // an optional set of node IDs (a subset of 'nodes') that will be considered for traversal
  // it is further assumed that seed_nodes are a subset of white_list, if the latter is specified
) {
  var clusters = [],
    adjacency = {},
    by_node = {};

  seed_nodes = seed_nodes || nodes;

  _.each(nodes, (n) => {
    n.visited = false;
    adjacency[n.id] = [];
  });

  if (edge_filter) {
    edges = _.filter(edges, edge_filter);
  }

  if (white_list) {
    edges = _.filter(edges, (e) => (
      white_list.has(nodes[e.source].id) && white_list.has(nodes[e.target].id)
    ));
  }

  _.each(edges, (e) => {
    try {
      adjacency[nodes[e.source].id].push([nodes[e.target], e]);
      adjacency[nodes[e.target].id].push([nodes[e.source], e]);
    } catch {
      throw Error("Edge does not map to an existing node " + e.source + " to " + e.target);
    }
  });

  var traverse = function (node) {
    if (!(node.id in by_node)) {
      clusters.push([node]);
      by_node[node.id] = clusters.length - 1;
      if (save_edges) {
        save_edges.push([]);
      }
    }
    node.visited = true;

    _.each(adjacency[node.id], (neighbor) => {
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

  _.each(seed_nodes, (n) => {
    if (!n.visited) {
      traverse(n);
    }
  });

  return clusters;
};

// ==============================
// Date & Time 
// ==============================
const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = /([0-9]{8}):([0-9]{8})/i;
const _defaultDateViewFormatExport = d3.time.format("%m/%d/%Y");

let cluster_time_scale;

function dateTimeInit(options, isCDC) {
  cluster_time_scale = options?.["cluster-time"];

  if (isCDC && !cluster_time_scale) {
    cluster_time_scale = _networkCDCDateField;
  }
}

function getClusterTimeScale() {
  return cluster_time_scale;
}

function getCurrentDate() {
  return new Date();
};

function getAncientDate() {
  return new Date(1900, 0, 1);
};

function getNMonthsAgo(reference_date, months) {
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

function hivtrace_date_or_na_if_missing(date, formatter) {
  formatter = formatter || _defaultDateViewFormatExport;
  if (date) {
    return formatter(date);
  }
  return "N/A";
};

module.exports = {
  // UI & HTML
  copyToClipboard,
  get_ui_element_selector_by_role,
  export_csv_button,
  export_json_button,
  export_handler,
  save_image,
  table_to_text,
  render_button_export_table_to_text: hivtrace_render_button_export_table_to_text,

  // Graph & Data
  collapseLargeCategories,
  getCurrentCategoryColorMapping,
  describe_vector,
  format_value,
  get_edge_type,
  get_unique_values,
  get_unique_count,
  hivtrace_cluster_depthwise_traversal,
  HIVTRACE_UNDEFINED,
  HIVTRACE_TOO_LARGE,
  HIVTRACE_PROCESSING,

  // Date & Time
  _networkCDCDateField,
  _networkTimeQuery,
  dateTimeInit,
  getClusterTimeScale,
  getCurrentDate,
  getAncientDate,
  getNMonthsAgo,
  hivtrace_date_or_na_if_missing,
}