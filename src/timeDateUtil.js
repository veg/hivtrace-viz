var d3 = require("d3");

const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = /([0-9]{8}):([0-9]{8})/i;

const DateViewFormatExport = d3.time.format.utc("%m/%d/%Y");

const DateViewFormatMMDDYYY = d3.time.format("%m%d%Y");
/** this is currently used to display node addition dates to COI */

/** d3 v3 time locales for the formats that show month names; __("lang")
    is replaced at build time, so each bundle picks its own language */
const kTimeLocales = {
  es: {
    format: d3.locale({
      decimal: ".",
      thousands: ",",
      grouping: [3],
      currency: ["$", ""],
      dateTime: "%A, %e de %B de %Y, %X",
      date: "%d/%m/%Y",
      time: "%H:%M:%S",
      periods: ["AM", "PM"],
      days: [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ],
      shortDays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      months: [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ],
      shortMonths: [
        "ene",
        "feb",
        "mar",
        "abr",
        "may",
        "jun",
        "jul",
        "ago",
        "sep",
        "oct",
        "nov",
        "dic",
      ],
    }).timeFormat,
    view: "%d %b %Y",
  },
  en: { format: d3.time.format, view: "%b %d, %Y" },
};
const kTimeLocale = kTimeLocales[__("lang")] || kTimeLocales.en;

const DateViewFormatShort = kTimeLocale.format("%B %Y");
/** Used to generate legend labels for date-valued attributes for network displayes*/

const DateViewFormat = kTimeLocale.format(kTimeLocale.view);
/** Used to generate pop-over labels for node displays, and COI views*/

/** SLKP 20241029; add another acceptable data time format */

/** d/m/yyyy and dd/mm/yyyy, day first (Mexican sites): 03/04/2023 is 3 April 2023.
    Impossible dates such as 31/02/2023 do not parse (null), like an invalid ISO date.
    Parsed in local time, as the %Y%m%d format is. */
const DayFirstRE = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/;

const DateFormatDayFirst = (function () {
  const out = d3.time.format("%d/%m/%Y");
  const f = (date) => out(date);
  f.parse = (str) => {
    const m = DayFirstRE.exec(str);
    if (!m) {
      return null;
    }
    const y = +m[3],
      mo = +m[2],
      d = +m[1];
    const date = new Date(2000, 0, 1);
    date.setFullYear(y, mo - 1, d);
    return date.getFullYear() === y &&
      date.getMonth() === mo - 1 &&
      date.getDate() === d
      ? date
      : null;
  };
  return f;
})();

/** d3's ISO parser falls back to the browser's Date parser, which reads
    03/04/2023 month first; leave strings of the day-first shape to DateFormatDayFirst */
const DateFormatISO = (function () {
  const f = (date) => d3.time.format.iso(date);
  f.parse = (str) =>
    typeof str === "string" && DayFirstRE.test(str)
      ? null
      : d3.time.format.iso.parse(str);
  return f;
})();

const DateFormats = [
  DateFormatISO,
  d3.time.format("%Y%m%d"),
  DateFormatDayFirst,
];
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
  DateFormatDayFirst,
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
