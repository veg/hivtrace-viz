const fs = require("fs");
const path = require("path");
const _ = require("underscore");

// Mock translation function for globals.js
global.__ = (key) => ({
  missing: "Missing",
  other: "Other",
  general: { missing: "Missing", other: "Other" }
});

function main() {
  const networkPath = path.resolve(__dirname, "../test/COI/XV.json");
  const networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));
  
  const { unpack_compact_json } = require("../src/core/networkUtils");
  unpack_compact_json(networkData);
  
  const HTXModel = require("../src/core/HTXModel");
  const kGlobals = require("../src/globals");
  const misc = require("../src/misc");
  
  const model = new HTXModel(networkData, null, { is_primary_graph: true, kGlobals });
  console.log("has_multiple_sequences:", model.has_multiple_sequences);
  
  const entityCounts = _.countBy(networkData.Nodes, n => model.primary_key(n));
  const mult = _.filter(entityCounts, (c, k) => c > 1).length;
  console.log("Entities with multiple sequences:", mult);
}

main();
