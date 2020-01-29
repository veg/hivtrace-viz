var download = require("downloadjs");

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

var datamonkey_export_csv_button = function(data) {
  data = d3.csv.format(data);
  if (data !== null) {
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(data)
    );
    pom.setAttribute("download", "export.csv");
    pom.className = "btn btn-default btn-sm";
    pom.innerHTML =
      '<span class="glyphicon glyphicon-floppy-save"></span> Download CSV';
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

var datamonkey_export_json_button = function(data) {
  if (data !== null) {
    var pom = document.createElement("a");
    pom.setAttribute(
      "href",
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
    );
    pom.setAttribute("download", "export.json");
    pom.className = "btn btn-default btn-sm";
    pom.innerHTML =
      '<span class="glyphicon glyphicon-floppy-save"></span> Download JSON';
    $("body").append(pom);
    pom.click();
    pom.remove();
  }
};

var datamonkey_save_image = function(type, container) {
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
  } else if (type == "png") {
    b64toBlob(
      image_string,
      function(blob) {
        var url = window.URL.createObjectURL(blob);
        var pom = document.createElement("a");
        pom.setAttribute("download", "image.png");
        pom.setAttribute("href", url);
        $("body").append(pom);
        pom.click();
        pom.remove();
      },
      function(error) {
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

function datamonkey_describe_vector(vector, as_list) {
  var d = {};

  if (vector.length) {
    vector.sort(d3.ascending);

    d = {
      min: d3.min(vector),
      max: d3.max(vector),
      median: d3.median(vector),
      Q1: d3.quantile(vector, 0.25),
      Q3: d3.quantile(vector, 0.75),
      mean: d3.mean(vector)
    };
  } else {
    d = {
      min: null,
      max: null,
      median: null,
      Q1: null,
      Q3: null,
      mean: null
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
  var header_row = [];
  var extract_text = function(e) {
    var plain_text = d3.select(e).node().firstChild;
    if (plain_text) plain_text = plain_text.nodeValue;
    if (plain_text && plain_text.length) return plain_text;
    var first_element = d3.select(e).selectAll("p, span, button");
    if (!first_element.empty()) {
      return d3.select(first_element.node()).text();
    }
    return "";
  };

  d3.selectAll(table_id + " thead th").each(function() {
    header_row.push(extract_text(this));
  });
  var data_rows = [];
  d3.select(table_id + " tbody")
    .selectAll("tr")
    .each(function(d) {
      var this_row = d3.select(this);
      if (this_row.style("display") != "none") {
        var write_to = data_rows.length;
        data_rows.push([]);
        d3.select(this)
          .selectAll("td")
          .each(function() {
            data_rows[write_to].push(extract_text(this));
          });
      }
    });

  return (
    header_row.join(sep) +
    "\n" +
    data_rows
      .map(function(d) {
        return d.join(sep);
      })
      .join("\n")
  );
}

module.exports.export_csv_button = datamonkey_export_csv_button;
module.exports.export_json_button = datamonkey_export_json_button;
module.exports.save_image = datamonkey_save_image;
module.exports.describe_vector = datamonkey_describe_vector;
module.exports.table_to_text = datamonkey_table_to_text;
module.exports.export_handler = datamonkey_export_handler;
