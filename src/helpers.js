var download = require("downloadjs");

const _OTHER = __("general")["other"];
const CATEGORY_UNIQUE_VALUE_LIMIT = 12;

/**
 * Converts a base64-encoded string to a Blob object.

 * @param {string} b64 - The base64-encoded string.
 * @param {Function} onsuccess - A callback function to be called when the conversion is successful.
 * @param {Function} [onerror] - An optional callback function to be called if an error occurs.
 */

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

/**
 * Creates a downloadable CSV file for the provided data and adds a button to trigger the download.

 * @param {Array<Object>} data - An array of objects representing the data to be exported.
 * @param {string} [name] - An optional name for the exported CSV file. If not provided, defaults to "export.csv".

 * @returns {void}
 */

function datamonkey_export_csv_button(data, name) {
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
}

/**
 * Creates a downloadable JSON file for the provided data and adds a button to trigger the download.

 * @param {Object|Array<Object>} data - The data to be exported, either a single object or an array of objects.
 * @param {string} [title] - An optional title for the exported JSON file. If not provided, defaults to "export".

 * @returns {void}
 */

function datamonkey_export_json_button(data, title) {
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
}

/**
 * Saves the contents of an SVG element as an image file.

 * @param {string} type - The desired image format (either "svg" or "png").
 * @param {jQuery|HTMLElement} container - A jQuery selector or element reference containing the SVG element.

 * @returns {void}
 */

function datamonkey_save_image(type, container) {
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
            } else if (
              rule.selectorText &&
              rule.selectorText.indexOf(">") === -1
            ) {
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
}

/**
 * Calculates descriptive statistics for a numerical vector.

 * @param {number[]} vector - An array of numbers representing the data.
 * @param {boolean} [as_list] - An optional flag indicating whether to return the statistics as a formatted string.

 * @returns {Object|string}
 *   - If `as_list` is false, returns an object with the following properties:
 *     - `min`: The minimum value.
 *     - `max`: The maximum value.
 *     - `median`: The median value.
 *     - `Q1`: The first quartile.
 *     - `Q3`: The third quartile.
 *     - `mean`: The mean value.
 *   - If `as_list` is true, returns a formatted string representing the statistics.
 */

function datamonkey_describe_vector(vector, as_list) {
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

/**
 * Handles exporting data to a file based on browser capabilities.

 * @param {string} data - The data to be exported.
 * @param {string} [filename] - The desired filename for the downloaded file. Defaults to "download.tsv".
 * @param {string} [mimeType] - The MIME type of the data. Defaults to "text/plain" if not provided.

 * @returns {void}
 */

function datamonkey_export_handler(data, filename, mimeType) {
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

function datamonkey_table_to_text(table_id, sep) {
  sep = sep || "\t";
  var table = d3.select(table_id);
  if (!table.empty()) {
    var tableEl = table.node();
    if (tableEl && tableEl._full_content) {
      const current_limit = tableEl._rendered_limit || 200;
      if (current_limit < tableEl._full_content.length) {
        const next_limit = tableEl._full_content.length;
        tableEl._rendered_limit = next_limit;

        const tbody = table.select("tbody");
        const next_data = tableEl._full_content.slice(current_limit, next_limit);

        tbody
          .selectAll("tr.extra-row-dummy") // dummy selector to force append
          .data(next_data)
          .enter()
          .append("tr")
          .selectAll("td")
          .data((d) => d)
          .enter()
          .append("td")
          .call((selection) =>
            selection.each(function (d, i) {
              tableEl._set_table_elements(d, this);
              tableEl._format_a_cell(d, i, this, tableEl._priority_set_editor);
            })
          );

        // Update count shown
        if (tableEl._table_caption) {
          tableEl._table_caption
            .select("[data-hivtrace-ui-role='table-count-shown']")
            .text(next_limit);
        }

        // Clean up scroll listener
        if (tableEl._onScroll && tableEl._scrollParent) {
          tableEl._scrollParent.removeEventListener("scroll", tableEl._onScroll);
          tableEl._onScroll = null;
          tableEl._scrollParent = null;
        }
      }
    }
  }

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

/**
 * Retrieves unique values for each attribute in a given dataset.

 * @param {Object[]} nodes - An array of node objects, each containing patient attributes.
 * @param {Object} schema - An object defining the schema for the patient attributes.

 * @returns {Object} An object where each key represents an attribute name and the corresponding value is an array of unique values for that attribute.
*/

function getUniqueValues(nodes, schema) {
  const schema_keys = Object.keys(schema);
  const num_keys = schema_keys.length;

  const new_obj = {};
  const sets = [];
  for (let j = 0; j < num_keys; j++) {
    const key = schema_keys[j];
    const s = new Set();
    new_obj[key] = s;
    sets.push(s);
  }

  const num_nodes = nodes.length;
  for (let i = 0; i < num_nodes; i++) {
    const p = nodes[i].patient_attributes || {};
    for (let j = 0; j < num_keys; j++) {
      sets[j].add(p[schema_keys[j]]);
    }
  }

  const result = {};
  for (let j = 0; j < num_keys; j++) {
    const sk = schema_keys[j];
    result[sk] = Array.from(new_obj[sk]);
  }
  return result;
}

/**
 * Exports a color scheme based on unique values and a colorizer function.

 * @param {Object} uniqValues - An object containing unique values for each attribute, as returned by `getUniqueValues`.
 * @param {Function} colorizer - A colorizer function that maps values to colors.

 * @returns {Object} An object where the keys are unique values and the values are the corresponding colors.
*/

function exportColorScheme(uniqValues, colorizer) {
  let colors = _.map(uniqValues[colorizer.category_id], (d) =>
    colorizer.category(d)
  );
  return _.object(uniqValues[colorizer.category_id], colors);
}

/**
 * Copies the given text to the clipboard.

 * @param {string} text - The text to be copied.

 * @returns {void}
 */

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(
    () => {},
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
}

/**
 * Collapses rare categories to "Other" category if there are >CATEGORY_UNIQUE_VALUE_LIMIT categories

 * @param {Object[]} nodes - An array of node objects, each containing patient attributes.
 * @param {Object} schema - An object defining the schema for the patient attributes.

 * @returns {boolean} True if any categories were collapsed, false otherwise.
 */

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

  // Sort and place everything after 15 entries in 'Other'
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

let pollId = null;
let statusPollId = null;

if (typeof window !== "undefined") {
  window.updateNetworkLoadingStatus = function (msg) {
    d3.selectAll(".placeholder-status-msg").text(msg);
  };

  window.finalizeNetworkLoading = function () {
    if (pollId) {
      clearInterval(pollId);
      pollId = null;
    }
    if (statusPollId) {
      clearInterval(statusPollId);
      statusPollId = null;
    }
    d3.selectAll(".tab-pane").each(function () {
      const pane = d3.select(this);
      pane.selectAll(".loading-placeholder").remove();
      pane.selectAll(function () {
        return this.children;
      }).style("display", null);
    });
  };

  // Intercept window.init definition to mark loading completion automatically
  let realInit = null;
  Object.defineProperty(window, "init", {
    get: () => realInit,
    set: (val) => {
      realInit = function (...args) {
        const selfContext = this;
        const data = args[0];

        async function runInit() {
          try {
            const { HIVTxNetwork, network } = window.hivtrace;

            const graph = "trace_results" in data ? data.trace_results : data;

            console.time("[PERF] Parsing network structure");
            window.updateNetworkLoadingStatus("Parsing network structure...");
            await new Promise((resolve) => setTimeout(resolve, 40));
            console.timeEnd("[PERF] Parsing network structure");

            if (graph.Settings && graph.Settings.compact_json) {
              console.time("[PERF] Unpacking compact JSON data");
              window.updateNetworkLoadingStatus("Unpacking compact JSON data...");
              await new Promise((resolve) => setTimeout(resolve, 40));
              network.unpack_compact_json(graph);
              console.timeEnd("[PERF] Unpacking compact JSON data");
            }

            console.time("[PERF] Extracting clusters and nodes");
            window.updateNetworkLoadingStatus("Extracting clusters and nodes...");
            await new Promise((resolve) => setTimeout(resolve, 40));

            // Set up a temporary HIVTxNetwork to do collapsing
            const tempNetwork = new HIVTxNetwork(graph, null, null, true);
            console.timeEnd("[PERF] Extracting clusters and nodes");

            if (tempNetwork.has_multiple_sequences) {
              console.time("[PERF] Processing multiple sequences async");
              await tempNetwork.process_multiple_sequences_async((msg) => {
                window.updateNetworkLoadingStatus(msg);
              });

              // Pre-compute aggregated records in the background so they are cached on the graph
              window.updateNetworkLoadingStatus("Aggregating individual level records...");
              await new Promise((resolve) => setTimeout(resolve, 40));
              tempNetwork._cached_aggregated_nodes = tempNetwork.aggregate_indvidual_level_records();

              // Save stats on graph for the final constructor
              graph._has_multiple_sequences = true;
              graph._primary_key_list = tempNetwork.primary_key_list;
              graph._primary_key_list_values = tempNetwork.primary_key_list_values;
              graph._cached_aggregated_nodes = tempNetwork._cached_aggregated_nodes;
              graph._entities_in_multiple_clusters = tempNetwork.entities_in_multiple_clusters;
              console.timeEnd("[PERF] Processing multiple sequences async");
            }

            window.updateNetworkLoadingStatus("Generating layout & SVG...");
            await new Promise((resolve) => setTimeout(resolve, 40));

            try {
              console.time("[PERF] Synchronous clusterNetwork Constructor");
              const result = val.apply(selfContext, args);
              console.timeEnd("[PERF] Synchronous clusterNetwork Constructor");

              // If the graph is empty, or layout did not initialize/finish, finalize immediately.
              const isGraphEmpty = window.user_graph && (typeof window.user_graph.is_empty === "function" && window.user_graph.is_empty());
              if (isGraphEmpty || !window.perfMeasurements || window.perfMeasurements.done) {
                window.perfMeasurements = window.perfMeasurements || {};
                window.perfMeasurements.done = true;
                if (window.finalizeNetworkLoading) {
                  window.finalizeNetworkLoading();
                }
              }
              return result;
            } catch (e) {
              console.timeEnd("[PERF] Synchronous clusterNetwork Constructor");
              console.error(e);
              if (window.finalizeNetworkLoading) {
                window.finalizeNetworkLoading();
              }
            }
          } catch (err) {
            console.error("Error during async network preprocessing:", err);
            // Fallback: run synchronous init anyway
            try {
              const result = val.apply(selfContext, args);
              if (window.finalizeNetworkLoading) {
                window.finalizeNetworkLoading();
              }
              return result;
            } catch (e) {
              console.error(e);
              if (window.finalizeNetworkLoading) {
                window.finalizeNetworkLoading();
              }
            }
          }
        }

        runInit();
      };
    },
    configurable: true,
  });
}

function initializeLoadingScreen() {
  if (typeof document === "undefined") {
    return;
  }
  // Guardrail: Only initialize the loading screen if a network container is present in the document
  if (!document.getElementById("network_tag") && !document.getElementById("lanl-network_tag")) {
    return;
  }

  if (
    typeof window !== "undefined" &&
    window.perfMeasurements &&
    window.perfMeasurements.done
  ) {
    return;
  }

  // Hide the progress bar immediately on load
  d3.selectAll(".my_progress").style("display", "none");

  // Enable all tabs so they are clickable
  d3.selectAll(".nav-tabs li")
    .classed("disabled", false)
    .selectAll("a")
    .attr("data-toggle", "tab");

  // Set up loading placeholders in each tab panel
  d3.selectAll(".tab-pane").each(function () {
    const pane = d3.select(this);
    if (pane.select(".loading-placeholder").empty()) {
      pane.selectAll(function () {
        return this.children;
      }).style("display", "none");
      pane.append("div")
        .classed("loading-placeholder", true)
        .html(`
          <div style="padding: 80px 20px; text-align: center; background: #fafafa; border: 1px dashed #ddd; border-radius: 6px; margin: 20px 0;">
            <div style="margin-bottom: 20px;">
              <i class="fa fa-spinner fa-spin fa-3x" style="color: #337ab7;"></i>
            </div>
            <h4 style="font-weight: 300; margin-bottom: 10px; color: #333;">Analyzing Network Data</h4>
            <p class="placeholder-status-msg" style="color: #777; font-size: 14px;">Loading data files...</p>
          </div>
        `);
    }
  });

  // Poll for template performance measurements completion
  if (!pollId) {
    pollId = setInterval(() => {
      if (window.perfMeasurements && window.perfMeasurements.done) {
        window.finalizeNetworkLoading();
      }
    }, 50);
  }

  // Poll for progress status label text changes
  if (!statusPollId) {
    statusPollId = setInterval(() => {
      const statusEl = document.querySelector(".my_progress_status");
      if (statusEl && statusEl.textContent) {
        window.updateNetworkLoadingStatus(statusEl.textContent);
      }
    }, 50);
  }
}

function track_progress(request) {
  initializeLoadingScreen();

  request.on("progress", function (event) {
    var e = event || d3.event;
    if (e && e.lengthComputable && e.total) {
      var percent = Math.round((e.loaded / e.total) * 100);
      window.updateNetworkLoadingStatus(
        "Downloading network data... (" + percent + "%)"
      );
    } else if (e) {
      var loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
      window.updateNetworkLoadingStatus(
        "Downloading network data... (" + loadedMB + " MB loaded)"
      );
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLoadingScreen);
  } else {
    initializeLoadingScreen();
  }
}

module.exports.export_csv_button = datamonkey_export_csv_button;
module.exports.export_json_button = datamonkey_export_json_button;
module.exports.save_image = datamonkey_save_image;
module.exports.describe_vector = datamonkey_describe_vector;
module.exports.table_to_text = datamonkey_table_to_text;
module.exports.export_handler = datamonkey_export_handler;
module.exports.getUniqueValues = getUniqueValues;
module.exports.exportColorScheme = exportColorScheme;
module.exports.copyToClipboard = copyToClipboard;
module.exports.collapseLargeCategories = collapseLargeCategories;
module.exports.track_progress = track_progress;
