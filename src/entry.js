window.jQuery = window.$ = $;

require("@fortawesome/fontawesome-free/css/all.css");

import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/solid";
import "@fortawesome/fontawesome-free/js/regular";
import "@fortawesome/fontawesome-free/js/brands";

require("bootstrap");
require("jspanel4/dist/jspanel.min.css");
require("./hivtrace.css");

var hivtrace = require("./hivtrace.js");

Math.log10 =
  Math.log10 ||
  function (x) {
    return Math.log(x) / Math.LN10;
  };

// Create new hyphy-vision export
window.hivtrace = hivtrace;
