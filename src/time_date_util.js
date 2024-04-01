const _networkCDCDateField = "hiv_aids_dx_dt";
const _networkTimeQuery = new RegExp("([0-9]{8}):([0-9]{8})", "i");

let cluster_time_scale;

function init(options, isCDC) {
  if (options && "cluster-time" in options) {
    cluster_time_scale = options["cluster-time"];
  }

  if (isCDC) {
    cluster_time_scale = cluster_time_scale || _networkCDCDateField;
  }
}

function getClusterTimeScale() {
  return cluster_time_scale;
}

function getCurrentDate() {
  return new Date();
};

function getAncientDate() {
  let d = new Date();
  d.setYear(1900);
  return d;
};


module.exports = {
  _networkCDCDateField,
  _networkTimeQuery,
  getClusterTimeScale,
  getCurrentDate,
  getAncientDate,
  init
}