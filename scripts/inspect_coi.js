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
  const pgPath = path.resolve(__dirname, "../test/COI/2023-12-30.json");
  const pgs = JSON.parse(fs.readFileSync(pgPath, "utf8"));
  
  const target = _.find(pgs, g => g.name === "MT_202312_171.1");
  if (!target) {
    console.log("Group not found");
    return;
  }
  
  console.log(`Group: ${target.name}`);
  console.log(`Nodes in CoI: ${target.nodes.length}`);
  
  const networkPath = path.resolve(__dirname, "../test/COI/XV.json");
  const networkData = JSON.parse(fs.readFileSync(networkPath, "utf8"));
  
  const { unpack_compact_json } = require("../src/core/networkUtils");
  unpack_compact_json(networkData);
  
  const nodeIds = new Set(networkData.Nodes.map(n => n.id));
  console.log(`Total nodes in raw network: ${nodeIds.size}`);
  
  const missingInRaw = target.nodes.filter(n => !nodeIds.has(n.name));
  console.log(`Missing in raw network: ${missingInRaw.length}`);
  
  // Replicate MSPP deletion
  const HTXModel = require("../src/core/HTXModel");
  const kGlobals = require("../src/globals");
  const misc = require("../src/misc");
  
  const model = new HTXModel(networkData, null, { is_primary_graph: true, kGlobals });
  model.process_multiple_sequences(kGlobals, misc);
  
  const postMsppNodeIds = new Set(networkData.Nodes.map(n => n.id));
  console.log(`Total nodes after MSPP: ${postMsppNodeIds.size}`);
  
  const missingPostMspp = target.nodes.filter(n => !postMsppNodeIds.has(n.name));
  console.log(`Missing after MSPP: ${missingPostMspp.length}`);
}

main();
