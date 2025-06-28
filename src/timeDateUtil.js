var d3 = require("d3");

const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = /([0-9]{8}):([0-9]{8})/i;

const DateViewFormatExport = d3.time.format.utc("%m/%d/%Y");

const DateViewFormatMMDDYYY = d3.time.format("%m%d%Y");
/** this is currently used to display node addition dates to COI */

const DateViewFormatShort = d3.time.format("%B %Y");
/** Used to generate legend labels for date-valued attributes for network displayes*/

const DateViewFormat = d3.time.format("%b %d, %Y");
/** Used to generate pop-over labels for node displays, and COI views*/

/** SLKP 20241029; add another acceptable data time format */

const DateFormats = [d3.time.format.iso, d3.time.format("%Y%m%d")];
/** List of accepted time formats for attribute values*/

const DateViewFormatSlider = d3.time.format("%Y-%m-%d");
/** Used in many places where alpha-numerically sorted dates are desired*/

const DateViewNodeSearch = d3.time.format("%Y/%m/%d");
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
  let cdate = new Date();
  return cdate;
}

function getAncientDate() {
  return new Date(1900, 0, 1);
}

/**
 * Formats a date using a specified formatter, or returns "N/A" if the date is missing.

 * @param {Date} date - The date object to be formatted.
 * @param {Function} [formatter] - An optional formatter function used to format the date. If not provided, `DateViewFormatExport` is used.

 * @returns {string} The formatted date string, or "N/A" if the date is missing.
 */

function hivtrace_date_or_na_if_missing(date, formatter) {
  if (date) {
    formatter = formatter || DateViewFormatExport;
    try {
      return formatter(date);
    } catch {
      console.log(date);
    }
  }
  return "N/A";
}

/**
 * Calculates a date that is `months` months ago from a given reference date.

 * @param {Date} reference_date - The reference date from which to calculate the past date.
 * @param {number} months - The number of months to go back.

 * @returns {Date} A new Date object representing the date `months` months ago from the reference date.
*/

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
  past_date.setDate(past_date.getDate() + 1); // exclusive
  past_date.setUTCHours(0, 0, 0);
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
  DateViewFormatExport,
  DateViewFormatClusterCreate,
  DateViewFormatMMDDYYY,
  DateViewFormatShort,
  DateViewFormatSlider,
  DateViewNodeSearch,
  n_months_ago,
  init,
};
