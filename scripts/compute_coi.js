const fs = require("fs");
const path = require("path");
const _ = require("underscore");
const d3 = require("d3");

// Mock translation function for globals.js
global.__ = (key) => ({
  missing: "Missing",
  other: "Other",
  general: { missing: "Missing", other: "Other" }
});

const HTXModel = require("../src/core/HTXModel");
const networkUtils = require("../src/core/networkUtils");
const kGlobals = require("../src/globals");
const misc = require("../src/misc");
const timeDateUtil = require("../src/timeDateUtil");

/**
 * HIV-TRACE Standalone COI Processor
 */

function printUsage() {
  console.log(`
Usage: node scripts/compute_coi.js [options]

Options:
  --network <path>      Path to network JSON file (required)
  --coi <path>          Path to existing COI JSON file (optional)
  --jurisdiction <code> Jurisdiction code (e.g. Montana, NC, etc.)
  --output <path>       Path to save computed COI JSON (required)
  --today <date>        Override reference date (ISO format)
  --threshold <num>     Override autocreate threshold (default: jurisdiction-based)
  --help                Show this help
`);
}

async function main() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) {
      const key = process.argv[i].substring(2);
      const value = process.argv[i + 1];
      if (value && !value.startsWith("--")) {
        args[key] = value;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  if (args.help || !args.network || !args.output) {
    printUsage();
    return;
  }

  // 1. Load Network
  console.log(`[1/7] Loading network from ${args.network}...`);
  let networkData = JSON.parse(fs.readFileSync(args.network, "utf8"));

  if ("trace_results" in networkData) {
    networkData = networkData["trace_results"];
  }

  if (networkData.Settings && networkData.Settings.compact_json) {
    networkUtils.unpack_compact_json(networkData);
  }
  networkUtils.normalize_node_attributes(networkData, kGlobals);
  networkUtils.ensure_node_attributes_exist(networkData, kGlobals);

  // 2. Initialize Model
  const modelOptions = {
    _is_CDC_: true,
    kGlobals: kGlobals,
    is_primary_graph: true,
    jurisdiction: args.jurisdiction || "unknown",
    jurisdiction_code: "MT"
  };
  if (args.today) modelOptions.today = new Date(args.today);

  const model = new HTXModel(networkData, null, modelOptions);
  if (args.threshold) model.CDC_data["autocreate-priority-set-size"] = parseInt(args.threshold);

  console.log(`      Jurisdiction: ${model.options.jurisdiction} -> ${model.CDC_data.jurisdiction_code}`);
  console.log(`      Reference Date: ${model.today.toISOString()}`);
  console.log(`      Autocreate Threshold: ${model.CDC_data["autocreate-priority-set-size"]}`);

  // 3. MSPP Processing
  console.log("[2/7] Processing multiple sequences (MSPP)...");
  model.process_multiple_sequences(kGlobals, misc);

  // 4. Cluster/Subcluster Computation
  console.log("[3/7] Computing clusters and subclusters...");
  model.compute_clusters();
  model.compute_subclusters(kGlobals, timeDateUtil, misc);
  model.annotate_cluster_changes();

  const subclusterCount = _.reduce(
    model.clusters,
    (memo, c) => memo + (c.subclusters ? c.subclusters.length : 0),
    0
  );

  console.log(`      Nodes: ${model.json.Nodes.length}`);
  console.log(`      Edges: ${model.json.Edges.length}`);
  console.log(`      Clusters: ${model.clusters.length}`);
  console.log(`      Subclusters: ${subclusterCount}`);

  // 5. Load COIs
  let rawCOIs = [];
  if (args.coi) {
    console.log(`[4/7] Loading existing COIs from ${args.coi}...`);
    rawCOIs = JSON.parse(fs.readFileSync(args.coi, "utf8"));
  }

  // 6. Process COIs (Validate, Auto-create, Overlap)
  console.log("[5/7] Processing priority group data...");
  const stats = model.priority_groups_process_data(
    rawCOIs,
    true, // auto_mode
    kGlobals,
    timeDateUtil,
    misc
  );

  // 7. Export and Save
  console.log(`[6/7] Exporting results...`);
  // Replicating spec test behavior: export all groups including unvalidated
  const exported = model.priority_groups_export(null, true, timeDateUtil);
  
  console.log(`[7/7] Saving to ${args.output}...`);
  fs.writeFileSync(args.output, JSON.stringify(exported, null, 2));
  console.log(`Done. Exported ${exported.length} groups.`);
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
