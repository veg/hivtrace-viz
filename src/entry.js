window.jQuery = window.$ = $;

require("font-awesome/css/font-awesome.css");
require("bootstrap");
require("jspanel4/dist/jspanel.min.css");
require("./hivtrace.css");

var hivtrace = require("./hivtrace.js");

Math.log10 =
  Math.log10 ||
  function(x) {
    return Math.log(x) / Math.LN10;
  };

// Create new hyphy-vision export
window.hivtrace = hivtrace;
