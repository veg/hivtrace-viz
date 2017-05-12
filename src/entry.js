window.jQuery = window.$ = $; 

require("font-awesome/css/font-awesome.css");
require('./hivtrace.css');
require('bootstrap');

var hyphyvision = require('hyphy-vision');
var hivtrace = require('./hivtrace.js');

// Create new hyphy-vision export
window.hivtrace = hivtrace;
window.hyphyvision = hyphyvision;
