const fs = require("fs");
const path = require("path");
const _ = require("underscore");

// Mock translation function
global.__ = (key) => ({
  missing: "Missing",
  other: "Other",
  general: { missing: "Missing", other: "Other" }
});

const d3 = require("d3");
const timeDateUtil = {
  DateFormats: [d3.time.format.iso, d3.time.format("%Y%m%d")],
  DateViewFormatClusterCreate: d3.time.format("%Y%m"),
  _networkCDCDateField: "hiv_aids_dx_dt",
  getClusterTimeScale: () => "hiv_aids_dx_dt",
  getCurrentDate: () => new Date(),
  n_months_ago: (reference_date, months) => {
    var past_date = new Date(reference_date);
    past_date.setMonth(past_date.getMonth() - months);
    return past_date;
  }
};

function main() {
  const networkPath = path.resolve(__dirname, "../test/COI/XV.json");
  const networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));
  
  const networkUtils = require("../src/network");
  networkUtils.unpack_compact_json(networkData);
  
  const HIVTxNetwork = require("../src/hiv_tx_network");
  const model = new HIVTxNetwork(networkData);
  
  // Replicate browser flow
  model.process_multiple_sequences();
  
  const pgPath = path.resolve(__dirname, "../test/COI/2023-12-30.json");
  const pgs = JSON.parse(fs.readFileSync(pgPath, "utf8"));
  
  const target = _.find(pgs, g => g.name === "MT_202312_171.1");
  console.log("Group 171.1 nodes in input:", target.nodes.length);
  
  model.priority_groups_validate([target], true);
  
  console.log("Group 171.1 not_in_network count:", target.not_in_network.length);
  console.log("Group 171.1 node_objects count:", target.node_objects.length);
  console.log("Group 171.1 description:", target.description);
}

main();
