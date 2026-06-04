# HIV-TRACE Optimized Columnar Compression Guide

This guide documents the usage, design, and performance metrics of the optimized columnar compression pipeline for HIV-TRACE network JSON visualization files.

---

## 1. Supported Compression Algorithms

The compressor uses an adaptive, cost-benefit packer that evaluates multiple representations for each data column:

*   **Flat (Flat Array)**: Keeps values in their raw representation. Chosen for high-cardinality/random values.
*   **Dict (Dictionary Indexing)**: Extracts unique categorical strings/keys into a mapping table and encodes values as integer indexes.
*   **Sparse (Default Value)**: Automatically determines the mode (most common value) and stores only exceptions, mapping index offsets to outlier values.
*   **Delta (Delta / Difference Encoding)**: Encodes sequences of integers (like edge targets) as the initial value followed by consecutive difference offsets.
*   **RLE (Run-Length Encoding)**: Collapses consecutive duplicate elements (like sorted attributes or cluster IDs) into parallel `values` and `runs` arrays.
*   **Front (Prefix/Suffix Coding)**: Removes duplicate prefix segments of consecutive lexicographically sorted string IDs (e.g., node sequences), storing prefix match lengths and suffix remainders.
*   **Recursive Columns (Nested Objects)**: Shreds nested objects (like `patient_attributes`) into parallel arrays, keeping track of null values using a `_null_mask`.
*   **Domain-Specific Redundancy Elimination**: Completely strips `Edges.sequences` on-the-fly, as it is 100% redundant with the source and target node IDs. The decompressor automatically reconstructs this field during unpacking.

---

## 2. CLI Tool Usage

The scripts are located under the `scripts/` directory.

### A. Python Compressor Pipeline
Compress or cross-convert JSON files to any layout format:
```bash
python3 scripts/compressor.py <expanded|compact|optimized> <input_file> <output_file> [--strip]
```

*   `expanded`: Reconstructs files into standard fully-expanded arrays of objects.
*   `compact`: Converts to the legacy compact style (dictionary keys mapping, no nested/sparse/delta/front compression).
*   `optimized`: Compresses utilizing the new adaptive columnar pipeline.
*   `--strip` (or `-s`): Minifies the output JSON by removing whitespace.

#### Compression Example:
```bash
python3 scripts/compressor.py optimized test/COI/XV.json test/COI/XV_optimized.json --strip
```

### B. Standalone Node.js Decompressor
To unpack any compact format back to a fully expanded JSON matching the original trace schema:
```bash
node scripts/unpack_json.js <path-to-json-file> > expanded_output.json
```

---

## 3. Benchmarks: `htvz/test/COI/XV.json`

This dataset represents a large transmission network. The compressor achieved a compression ratio of **~27x** over the original file.

### Summary Metrics:
| Metric | Size | Percentage Saved |
| :--- | :--- | :--- |
| **Original File Size (Legacy Compact)** | 272.15 MB | - |
| **Fully Expanded Form Size** | 200.57 MB | - |
| **Compressed Size (Optimized Compact + Minified)** | **10.05 MB** | - |
| **Space Saved vs Original** | **-262.10 MB** | **96.31%** |
| **Space Saved vs Expanded** | **-190.52 MB** | **94.99%** |

### Column Packing Breakdown:
*   **`Nodes.id`**: Packed using **Front** (prefix) compression, reducing the large set of string identifiers to **3.12 MB**.
*   **`Edges.target`**: Packed using **Delta** coding, reducing target vertex indices to **1.66 MB**.
*   **`Edges.source`**: Grouped and compressed using **Rle** coding down to **318 KB**.
*   **`Edges.length`**: Packed using **Rle** down to **2.57 MB**.
*   **`Nodes.patient_attributes`**: Object hierarchy shredded into recursive sub-columns and packed via **Rle** (e.g. `ehars_uid` at 544 KB, `sex_trans` at 78 KB, `cur_city_name` at 183 KB).
*   **Static/Default Edge Attributes**: (`directed`, `removed`, `support`, `attributes`) mapped using **Sparse** exception tables, consuming only **~30 bytes** each.
