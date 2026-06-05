#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const networkUtils = require("../src/core/networkUtils");

function printUsage() {
  console.error("Usage: node scripts/unpack_json.js <path-to-json-file>");
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File does not exist at path: ${filePath}`);
    process.exit(1);
  }

  let data;
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing JSON file: ${error.message}`);
    process.exit(1);
  }

  let target = data;
  if (data && typeof data === "object") {
    if ("trace_results" in data) {
      target = data.trace_results;
    }
  }

  // Unpack if the target contains Nodes/Edges and is in compact form
  if (
    target &&
    typeof target === "object" &&
    target.Nodes &&
    !Array.isArray(target.Nodes)
  ) {
    try {
      networkUtils.unpack_compact_json(target);
      // Clean up the compact_json flag if it was set
      if (target.Settings && target.Settings.compact_json) {
        target.Settings.compact_json = false;
      }
    } catch (error) {
      console.error(`Error unpacking compact JSON: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  } catch (error) {
    console.error(`Error writing JSON to stdout: ${error.message}`);
    process.exit(1);
  }
}

main();
