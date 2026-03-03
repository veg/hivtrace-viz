# HIV-TRACE Standalone COI Processor

This script (`compute_coi.js`) provides a standalone command-line interface for computing and validating **Clusters of Interest (COI)**. It utilizes the core refactored engine (`HTXModel.js`) used by the browser visualization, allowing for identical results between the web UI and automated backend pipelines.

## Capabilities
- **MSPP Handling**: Automatically aggregates multiple sequences per person.
- **Cluster/Subcluster Computation**: Re-computes network partitions at specified thresholds.
- **COI Validation**: Validates existing COI sets against new network data.
- **Auto-creation**: Detects new "Recent and Rapid" growth clusters based on CDC/Jurisdictional criteria.
- **Overlap Analysis**: Computes person-level overlaps between different COI groups.

## Usage

```bash
node scripts/compute_coi.js [options]
```

### Options

| Option | Description |
| :--- | :--- |
| `--network <path>` | **Required.** Path to the HIV-TRACE network JSON file. Supports both standard and compact JSON formats. |
| `--output <path>` | **Required.** Path where the resulting computed COI JSON will be saved. |
| `--coi <path>` | Path to a JSON file containing existing COIs to be validated/updated. |
| `--jurisdiction <name>`| Jurisdiction name (e.g., "North Carolina", "Montana"). Defaults to "unknown". |
| `--today <date>` | Override the reference date for "recency" calculations (ISO format: `YYYY-MM-DD`). Defaults to system clock. |
| `--threshold <num>` | Override the minimum size for auto-creating priority sets. |
| `--help` | Show the help message. |

## Input Data Format
The script expects a standard HIV-TRACE JSON output. If the JSON contains a top-level `trace_results` key (common in some pipeline outputs), it will automatically dive into that object to find the network data.

## Processing Workflow
1. **Network Loading**: Loads and unpacks compact JSON (if necessary). Normalizes node attributes.
2. **Model Initialization**: Sets up the jurisdictional defaults (e.g., North Carolina uses a different morbidity threshold than other jurisdictions).
3. **MSPP Processing**: Links multiple sequences to a single person based on primary keys.
4. **Partitioning**: Computes clusters and subclusters (default 0.5% threshold).
5. **COI Engine**: 
   - Validates existing COIs provided via `--coi`.
   - Auto-detects new "Recent and Rapid" clusters (36-month window for nodes, 12-month window for rapid growth).
   - Computes overlaps.
6. **Export**: Saves a JSON array of the finalized priority groups.

## Example

```bash
node scripts/compute_coi.js 
  --network ./test/data/network.json 
  --coi ./test/data/existing_cois.json 
  --jurisdiction Montana 
  --today 2024-01-01 
  --output ./results/computed_cois.json
```

## Dependencies
This script requires **Node.js** and the project dependencies installed (`npm install`). It uses `d3`, `underscore`, and the local `src/core` modules.
