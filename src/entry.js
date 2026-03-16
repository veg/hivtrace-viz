window.jQuery = $;
window.$ = $;

require("@fortawesome/fontawesome-free/css/all.css");
require("@fortawesome/fontawesome-free/css/solid.css");
require("@fortawesome/fontawesome-free/css/regular.css");
require("@fortawesome/fontawesome-free/css/brands.css");

//import "@fortawesome/fontawesome-free/js/all";
//import "@fortawesome/fontawesome-free/js/solid";
//import "@fortawesome/fontawesome-free/js/regular";
//import "@fortawesome/fontawesome-free/js/brands";

window.bootstrap = require("bootstrap");

// Bootstrap 5 does not automatically add jQuery plugins
// jQuery QueryBuilder depends on $.fn.popover and $.fn.tooltip
if (window.jQuery) {
  const jQuery = window.jQuery;
  ["popover", "tooltip"].forEach((name) => {
    const bootstrapName = name.charAt(0).toUpperCase() + name.slice(1);
    const bootstrapClass = bootstrap[bootstrapName] || bootstrap[name];

    if (bootstrapClass) {
      jQuery.fn[name] = function (config) {
        return this.each(function () {
          bootstrapClass.getOrCreateInstance(this, config);
        });
      };
      // Polyfill properties that QueryBuilder might check for (BS3 compatibility)
      jQuery.fn[name].Constructor = bootstrapClass;
      if (jQuery.fn[name].Constructor) {
        jQuery.fn[name].Constructor.VERSION = "3.4.1"; // Lie to satisfy some plugins
        jQuery.fn[name].Constructor.prototype.fixTitle = function () {};
      }
    }
  });
}

require("bootstrap/dist/css/bootstrap.min.css");
require("jQuery-QueryBuilder/dist/css/query-builder.default.css");
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
