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
  
  console.log("Primary Key List keys (first 5):", _.keys(model.primary_key_list).slice(0, 5));
  
  const pgPath = path.resolve(__dirname, "../test/COI/2023-12-30.json");
  const pgs = JSON.parse(fs.readFileSync(pgPath, "utf8"));
  const target = _.find(pgs, g => g.name === "MT_202312_171.1");
  
  const nodeName = target.nodes[0].name;
  console.log("Node name from CoI:", nodeName);
  console.log("Primary key of that node:", model.primary_key({id: nodeName}));
  console.log("Is node name in primary_key_list?", nodeName in model.primary_key_list);
  console.log("Is primary key in primary_key_list?", model.primary_key({id: nodeName}) in model.primary_key_list);
}

main();
