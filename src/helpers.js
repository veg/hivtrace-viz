var download = require("downloadjs");

var datamonkey_error_modal = function(msg) {
  $("#modal-error-msg").text(msg);
  $("#errorModal").modal();
};

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
        console.log("Could not process stylesheet : " + ss);
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

  var convert_svg_to_png = function(image_string) {
    var image = document.getElementById("hyphy-chart-image");

    image.onload = function() {
      var canvas = document.getElementById("hyphy-chart-canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, image.width, image.height);
      context.drawImage(image, 0, 0);
      var img = canvas.toDataURL("image/png");
      var pom = document.createElement("a");
      pom.setAttribute("download", "image.png");
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

  var source = new XMLSerializer()
    .serializeToString(svg)
    .replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var rect = svg.getBoundingClientRect();
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
        console.log(error);
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

var datamonkey_validate_date = function() {
  // Check that it is not empty
  if ($(this).val().length === 0) {
    $(this).next(".help-block").remove();
    $(this).parent().removeClass("has-success");
    $(this).parent().addClass("has-error");

    jQuery("<span/>", {
      class: "help-block",
      text: "Field is empty"
    }).insertAfter($(this));
  } else if (isNaN(Date.parse($(this).val()))) {
    $(this).next(".help-block").remove();
    $(this).parent().removeClass("has-success");
    $(this).parent().addClass("has-error");

    jQuery("<span/>", {
      class: "help-block",
      text: "Date format should be in the format YYYY-mm-dd"
    }).insertAfter($(this));
  } else {
    $(this).parent().removeClass("has-error");
    $(this).parent().addClass("has-success");
    $(this).next(".help-block").remove();
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
  var pom = document.createElement("a");
  pom.setAttribute(
    "href",
    "data:text/octet-stream;charset=utf-8," + encodeURIComponent(nwk)
  );
  pom.setAttribute("download", "nwk.txt");
  $("body").append(pom);
  pom.click();
  pom.remove();
}

function datamonkey_convert_svg_to_png(image_string) {
  var image = document.getElementById("image");
  image.src = image_string;

  image.onload = function() {
    var canvas = document.getElementById("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext("2d");
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0);
    var img = canvas.toDataURL("image/png");

    var pom = document.createElement("a");
    pom.setAttribute("download", "phylotree.png");
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

  var source = new XMLSerializer()
    .serializeToString(svg)
    .replace("</style>", "<![CDATA[" + styles + "]]></style>");
  var rect = svg.getBoundingClientRect();
  var doctype =
    '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
  var to_download = [doctype + source];
  var image_string =
    "data:image/svg+xml;base66," + encodeURIComponent(to_download);

  if (type == "png") {
    datamonkey_convert_svg_to_png(image_string);
  } else {
    var pom = document.createElement("a");
    pom.setAttribute("download", "phylotree.svg");
    pom.setAttribute("href", image_string);
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
      $(this).removeClass("has-error");
      $(this).addClass("has-success");
      $(this).next(".help-block").remove();
    } else {
      $(this).next(".help-block").remove();
      $(this).removeClass("has-error");
      $(this).removeClass("has-success");
      $(this).addClass("has-error");
      var span = jQuery("<span/>", {
        class: "help-block col-lg-9 pull-right",
        text: "Invalid Email"
      }).insertAfter($(this));
    }
  } else {
    $(this).removeClass("has-error");
    $(this).removeClass("has-success");
    $(this).next(".help-block").remove();
  }
}

function datamonkey_describe_vector(vector, as_list) {
  var d = {};

  if (vector.length) {
    vector.sort(d3.ascending);

    var d = {
      min: d3.min(vector),
      max: d3.max(vector),
      median: d3.median(vector),
      Q1: d3.quantile(vector, 0.25),
      Q3: d3.quantile(vector, 0.75),
      mean: d3.mean(vector)
    };
  } else {
    var d = {
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
  var extract_text = function (e) {
    var first_element = d3.select (e).selectAll ("p, span, button");
    if (!first_element.empty()) {
        return d3.select(first_element.node()).text();
    } else {
        return d3.select(e).text();
    }
  };

  d3.selectAll(table_id + " thead th").each(function() {
    header_row.push(extract_text(this));
  });
  var data_rows = [];
  d3.select(table_id + " tbody").selectAll ("tr").each(function(d, i) {
    data_rows.push([]);
    d3.select(this).selectAll("td").each(function() {
      data_rows[i].push(extract_text(this));
    });
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
  accessor =
    accessor ||
    function(value) {
      return value;
    };
  return _.reduce(
    object,
    function(sum, value, index) {
      return sum + accessor(value, index);
    },
    0
  );
}

function datamonkey_count_sites_from_partitions(json) {
  try {
    return datamonkey_sum(json["partitions"], function(value) {
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
  _.each(
    list,
    _.bind(function(value, key) {
      if (predicate(value, key)) {
        result[key] = value;
      }
    }, context)
  );
  return result;
}

function datamonkey_map_list(list, transform, context) {
  var result = {};
  transform = _.bind(transform, context);
  _.each(
    list,
    _.bind(function(value, key) {
      result[key] = transform(value, key);
    }, context)
  );
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
