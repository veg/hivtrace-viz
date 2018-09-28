window.jQuery = window.$ = $;

require("font-awesome/css/font-awesome.css");
require("bootstrap");
require("./hivtrace.css");

var hivtrace = require("./hivtrace.js");

// Create new hyphy-vision export
window.hivtrace = hivtrace;
