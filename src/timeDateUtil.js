var d3 = require("d3"),
  _ = require("underscore");

const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = /([0-9]{8}):([0-9]{8})/i;

const DateViewFormatExport = d3.time.format("%m/%d/%Y");

const DateViewFormatMMDDYYY = d3.time.format("%m%d%Y");
/** this is currently used to display node addition dates to COI */

const DateViewFormatShort = d3.time.format("%B %Y");
/** Used to generate legend labels for date-valued attributes for network displayes*/

const DateViewFormat = d3.time.format("%b %d, %Y");
/** Used to generate pop-over labels for node displays, and COI views*/

const DateFormats = [d3.time.format.iso];
/** List of accepted time formats for attribute values*/

const DateViewFormatSlider = d3.time.format("%Y-%m-%d");
/** Used in many places where alpha-numerically sorted dates are desired*/

const DateUpperBoundYear = new Date().getFullYear();
/** Maximum year value (no future dates)*/

const DateViewFormatClusterCreate = d3.time.format("%Y%m");
/** used as a part of auto-named COI, e.g. NC_202105_44.1 */

let cluster_time_scale;

function init(options, isCDC) {
  cluster_time_scale = options?.["cluster-time"];

  if (isCDC && !cluster_time_scale) {
    cluster_time_scale = _networkCDCDateField;
  }
}

function getClusterTimeScale() {
  return cluster_time_scale;
}

function getCurrentDate() {
  return new Date();
}

function getAncientDate() {
  return new Date(1900, 0, 1);
}

function hivtrace_date_or_na_if_missing(date, formatter) {
  if (date) {
    formatter = formatter || DateViewFormatExport;
    return formatter(date);
  }
  return "N/A";
}

function n_months_ago(reference_date, months) {
  var past_date = new Date(reference_date);
  var past_months = past_date.getMonth();
  var diff_year = Math.floor(months / 12);
  var left_over = months - diff_year * 12;

  if (left_over > past_months) {
    past_date.setFullYear(past_date.getFullYear() - diff_year - 1);
    past_date.setMonth(12 - (left_over - past_months));
  } else {
    past_date.setFullYear(past_date.getFullYear() - diff_year);
    past_date.setMonth(past_months - left_over);
  }

  return past_date;
}

module.exports = {
  hivtrace_date_or_na_if_missing,
  _networkCDCDateField,
  _networkTimeQuery,
  getClusterTimeScale,
  getCurrentDate,
  getAncientDate,
  DateFormats,
  DateUpperBoundYear,
  DateViewFormat,
  DateViewFormatClusterCreate,
  DateViewFormatMMDDYYY,
  DateViewFormatShort,
  DateViewFormatSlider,
  n_months_ago,
  init,
};
