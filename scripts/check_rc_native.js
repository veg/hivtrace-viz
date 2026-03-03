const fs = require("fs");
const path = require("path");
const _ = require("underscore");

// Mock translation function
global.__ = (key) => ({
  missing: "Missing",
  other: "Other",
  general: { missing: "Missing", other: "Other" }
});

function main() {
  const networkPath = path.resolve(__dirname, "../test/COI/XV.json");
  const networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));
  
  const networkUtils = require("../src/network");
  networkUtils.unpack_compact_json(networkData);
  
  const HIVTxNetwork = require("../src/hiv_tx_network");
  
  // Create instance (this calls tabulate_multiple_sequences in constructor)
  const model = new HIVTxNetwork(networkData);
  console.log("has_multiple_sequences:", model.has_multiple_sequences);
  
  const entityCounts = _.countBy(networkData.Nodes, n => model.primary_key(n));
  const mult = _.filter(entityCounts, (c, k) => c > 1).length;
  console.log("Entities with multiple sequences:", mult);
}

main();
