window.jQuery = window.$ = $;

require("font-awesome/css/font-awesome.css");
require("./hivtrace.css");
require("bootstrap");

var hivtrace = require("./hivtrace.js");

Math.log10 = Math.log10 || function(x) {
  return Math.log(x) / Math.LN10;
};

// Create new hyphy-vision export
window.hivtrace = hivtrace;
