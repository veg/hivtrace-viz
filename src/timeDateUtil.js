const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = /([0-9]{8}):([0-9]{8})/i;
const _defaultDateViewFormatExport = d3.time.format("%m/%d/%Y");

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
};

function getAncientDate() {
  return new Date(1900, 0, 1);
};

function getNMonthsAgo(reference_date, months) {
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

  //past_date.setTime (past_date.getTime () - months * 30 * 24 * 3600000);
  return past_date;
}

function hivtrace_date_or_na_if_missing(date, formatter) {
  formatter = formatter || _defaultDateViewFormatExport;
  if (date) {
    return formatter(date);
  }
  return "N/A";
};

module.exports = {
  _networkCDCDateField,
  _networkTimeQuery,
  getClusterTimeScale,
  getCurrentDate,
  getAncientDate,
  getNMonthsAgo,
  hivtrace_date_or_na_if_missing,
  init
}