const download = require("downloadjs");
const $ = require("jquery");

const _OTHER = typeof __ !== "undefined" ? __("general")["other"] : "Other";
const CATEGORY_UNIQUE_VALUE_LIMIT = 12;

/**
 * Converts a base64-encoded string to a Blob object.
 */
function b64toBlob(b64, onsuccess, onerror) {
  const img = new Image();
  img.onerror = onerror;
  img.onload = function onload() {
    let canvas = document.getElementById("hyphy-chart-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "hyphy-chart-canvas";
      canvas.style.display = "none";
      document.body.appendChild(canvas);
    }
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(onsuccess);
  };
  img.src = b64;
}

/**
 * Creates a downloadable CSV file for the provided data and adds a button to trigger the download.
 */
function datamonkey_export_csv_button(data, name) {
  const csvData = d3.csv.format(data);
  if (csvData !== null) {
    const fileName = name ? `${name}.csv` : "export.csv";
    const pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvData)
    );
    pom.setAttribute("download", fileName);
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
 */
function datamonkey_export_json_button(data, title) {
  if (data !== null) {
    const fileName = `${title || "export"}.json`;
    const pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
    );
    pom.setAttribute("download", fileName);
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
 */
function datamonkey_save_image(type, container) {
  const prefix = {
    xmlns: "http://www.w3.org/2000/xmlns/",
    xlink: "http://www.w3.org/1999/xlink",
    svg: "http://www.w3.org/2000/svg",
  };

  function get_styles(doc) {
    function process_stylesheet(ss) {
      try {
        if (ss.cssRules) {
          for (let i = 0; i < ss.cssRules.length; i++) {
            const rule = ss.cssRules[i];
            if (rule.type === 3) {
              process_stylesheet(rule.styleSheet);
            } else if (
              rule.selectorText &&
              rule.selectorText.indexOf(">") === -1
            ) {
              styles += `\n${rule.cssText}`;
            }
          }
        }
      } catch (e) {
        console.log(`Could not process stylesheet : ${ss}`);
      }
    }

    let styles = "";
    const styleSheets = doc.styleSheets;

    if (styleSheets) {
      for (let i = 0; i < styleSheets.length; i++) {
        process_stylesheet(styleSheets[i]);
      }
    }

    return styles;
  }

  let svg = $(container).find("svg")[0];
  if (!svg) {
    svg = $(container)[0];
  }

  const styles = get_styles(window.document);

  svg.setAttribute("version", "1.1");

  const defsEl = document.createElement("defs");
  svg.insertBefore(defsEl, svg.firstChild);

  const styleEl = document.createElement("style");
  defsEl.appendChild(styleEl);
  styleEl.setAttribute("type", "text/css");

  svg.removeAttribute("xmlns");
  svg.removeAttribute("xlink");

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
  }

  if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
    svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
  }

  const source = new XMLSerializer()
    .serializeToString(svg)
    .replace("</style>", `<![CDATA[${styles}]]></style>`);
  const doctype =
    '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  const to_download = doctype + source;
  const image_string =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(to_download);

  if (type === "png") {
    b64toBlob(
      image_string,
      (blob) => {
        const url = window.URL.createObjectURL(blob);
        const pom = document.createElement("a");
        pom.setAttribute("download", "image.png");
        pom.setAttribute("href", url);
        $("body").append(pom);
        pom.click();
        pom.remove();
      },
      (err) => {
        console.log(err);
      }
    );
  } else {
    const pom = document.createElement("a");
    pom.setAttribute("download", "image.svg");
    pom.setAttribute("href", image_string);
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
}

/**
 * Calculates descriptive statistics for a numerical vector.
 */
function datamonkey_describe_vector(vector, as_list) {
  let d;

  if (vector && vector.length) {
    const sorted = [...vector].sort((a, b) => a - b);
    const n = sorted.length;

    const get_quantile = (p) => {
      const i = (n - 1) * p;
      const i0 = Math.floor(i);
      const v0 = sorted[i0];
      if (i0 + 1 < n) {
        const v1 = sorted[i0 + 1];
        return v0 + (v1 - v0) * (i - i0);
      }
      return v0;
    };

    const sum = sorted.reduce((a, b) => a + b, 0);

    d = {
      min: sorted[0],
      max: sorted[n - 1],
      median: get_quantile(0.5),
      Q1: get_quantile(0.25),
      Q3: get_quantile(0.75),
      mean: sum / n,
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
    return `<pre>Range  :${d.min}-${d.max}\nIQR    :${d.Q1}-${d.Q3}\nMean   :${d.mean}\nMedian :${d.median}\n</pre>`;
  }

  return d;
}

/**
 * Handles exporting data to a file.
 */
function datamonkey_export_handler(data, filename, mimeType) {
  const pom = document.createElement("a");
  pom.setAttribute(
    "href",
    "data:" +
      (mimeType || "text/plain") +
      ";charset=utf-8," +
      encodeURIComponent(data)
  );
  pom.setAttribute("download", filename || "download.tsv");
  pom.style.display = "none";
  document.body.appendChild(pom);
  pom.click();
  document.body.removeChild(pom);
}

function datamonkey_table_to_text(table_id, sep = "\t") {
  const header_row = [];
  const extract_text = function (e) {
    const node = d3.select(e).node();
    let plain_text = node.firstChild;
    if (plain_text) plain_text = plain_text.nodeValue;
    if (plain_text && plain_text.trim().length) return plain_text.trim();

    const first_element = d3.select(e).selectAll("[data-text-export]");
    if (!first_element.empty()) {
      return d3.select(first_element.node()).attr("data-text-export");
    }

    const interactive_element = d3.select(e).selectAll("p, span, button, abbr, select");
    if (!interactive_element.empty()) {
      return d3.select(interactive_element.node()).text().trim();
    }
    return "";
  };

  d3.selectAll(`${table_id} thead th`).each(function () {
    header_row.push(extract_text(this));
  });
  const data_rows = [];
  d3.select(`${table_id} tbody`)
    .selectAll("tr")
    .each(function () {
      const this_row = d3.select(this);
      if (this_row.style("display") !== "none") {
        const row_data = [];
        d3.select(this)
          .selectAll("td")
          .each(function () {
            row_data.push(extract_text(this));
          });
        data_rows.push(row_data);
      }
    });

  return (
    (sep === "," ? d3.csv.format([header_row]) : d3.tsv.format([header_row])) +
    "\n" +
    (sep === "," ? d3.csv.format(data_rows) : d3.tsv.format(data_rows))
  );
}

/**
 * Retrieves unique values for each attribute in a given dataset.
*/
function getUniqueValues(nodes, schema) {
  const schema_keys = _.keys(schema);

  const new_obj = {};
  _.each(schema_keys, (sk) => (new_obj[sk] = new Set()));

  const pa = _.map(nodes, (n) => _.omit(n.patient_attributes, "_id"));

  _.each(pa, (p) => {
    _.each(schema_keys, (sk) => {
      new_obj[sk].add(p[sk]);
    });
  });

  return _.mapObject(new_obj, (val) => [...val]);
}

/**
 * Exports a color scheme based on unique values and a colorizer function.
*/
function exportColorScheme(uniqValues, colorizer) {
  const colors = _.map(uniqValues[colorizer.category_id], (d) =>
    colorizer.category(d)
  );
  return _.object(uniqValues[colorizer.category_id], colors);
}

/**
 * Copies the given text to the clipboard.
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
 * Collapses rare categories to "Other" category.
 */
function collapseLargeCategories(nodes, schema) {
  const schema_keys = _.keys(schema);
  const new_obj = {};
  _.each(schema_keys, (sk) => (new_obj[sk] = []));

  const pa = _.map(nodes, (n) => _.omit(n.patient_attributes, "_id"));

  _.each(pa, (p) => {
    _.each(schema_keys, (sk) => {
      new_obj[sk].push(p[sk]);
    });
  });

  const counts = _.mapObject(new_obj, (d) => _.countBy(d));

  _.each(schema_keys, (sk) => {
    const entries = Object.entries(counts[sk]);
    const sorted = _.sortBy(entries, (d) => -d[1]);

    if (sorted.length > CATEGORY_UNIQUE_VALUE_LIMIT) {
      const count = sorted[CATEGORY_UNIQUE_VALUE_LIMIT][1];
      const others = _.map(_.partition(sorted, (d) => d[1] <= count)[0], _.first);

      _.each(nodes, (n) => {
        if (_.contains(others, n["patient_attributes"][sk])) {
          n["patient_attributes"][sk] = _OTHER;
        }
      });
    }
  });

  return true;
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
