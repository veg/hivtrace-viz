#!/usr/bin/env python3
"""
================================================================================
                     HIV-TRACE COLUMNAR COMPRESSION PIPELINE
================================================================================

This module implements an adaptive, recursive, columnar compression pipeline for 
HIV-TRACE visualization network JSON files. It allows full cross-conversion 
between:
1. Fully Expanded (Standard JSON array of objects)
2. Old Compact (Original compact format; no nested object/prefix/sparse support)
3. Optimized Compact (Adaptive recursive columnar compression with RLE/Delta/Front)

--------------------------------------------------------------------------------
1. COMPRESSION ALGORITHMS SUPPORTED
--------------------------------------------------------------------------------

* Flat (Flat Array)
  - The column is left unmodified as a raw JSON array.
  - Best for high-cardinality unique values (e.g. coordinates, unique lengths).

* Dict (Dictionary Indexing / Categorical Coding)
  - Extracts unique values into a 'keys' array and stores index mappings in 'values'.
  - Best for low-to-medium cardinality repeating categories (e.g. race, sex_trans).
  - Storage Shape:
    {
      "keys": ["White", "Black", "Hispanic"],
      "values": [0, 1, 0, 2, 1]
    }

* Sparse (Default Value / Informative Missingness)
  - Stores the mode (most common value) as 'default' and index-to-value overrides 
    as 'exceptions'.
  - Best for extremely low-entropy columns dominated by a single value (e.g. vital_status).
  - Storage Shape:
    {
      "default": "Alive",
      "exceptions": {
        "366": "Dead"
      }
    }

* Delta (Delta / Difference Encoding)
  - Stores the first value and subsequent cumulative offsets (arr[i] - arr[i-1]).
  - Best for sequential or sorted integer arrays (e.g. source/target edge indices).
  - Storage Shape:
    {
      "delta": true,
      "values": [24, 12, 0, -12, 29] // Diffs packed recursively (e.g. Rle/Dict/Flat)
    }

* Rle (Run-Length Encoding)
  - Groups sequential identical values into parallel 'values' and 'runs' arrays.
  - Best for grouped values (e.g. cluster IDs, or sorted properties).
  - Storage Shape:
    {
      "rle": true,
      "len": 3,
      "values": [1, 2, 3], // Values packed recursively
      "runs": [4, 3, 4]    // Run lengths packed recursively
    }

* Front (Front / Prefix Encoding)
  - Eliminates common prefixes in sorted/structured string arrays. Stores the 
    matching prefix length in 'lens' and the remainder in 'suffixes'.
  - Best for similar structured strings (e.g. Node IDs: "DummyID_123", "DummyID_124").
  - Storage Shape:
    {
      "front": true,
      "lens": [0, 9, 9],       // Prefix lengths packed recursively
      "suffixes": ["DummyID_123", "4", "5"] // Suffixes packed recursively
    }

* Nested Objects (Recursive Columnar Encoding)
  - Breaks nested object arrays (like patient_attributes) into recursive sub-columns.
  - Includes a '_null_mask' boolean column to preserve elements that were originally null.
  - Storage Shape:
    {
      "_null_mask": [false, false, true],
      "race_cat": { ... },
      "vital_status": { ... }
    }

--------------------------------------------------------------------------------
2. DECISION LOGIC: HOW ALGORITHMS ARE CHOSEN
--------------------------------------------------------------------------------

The packer uses an adaptive, byte-cost-based decision logic:
1. Candidate Evaluation: For any given primitive column, the packer calculates 
   the candidate representation formats (Flat, Dict, Sparse, Delta, Rle, Front).
2. Cost Calculation: Each candidate is converted into its minified JSON string 
   form (e.g., json.dumps(..., separators=(',', ':'))), and its exact byte 
   length is measured.
3. Selection: The candidate with the smallest byte size is selected.
4. Recursion: Delta, Rle, and Front columns recursively call the packer on 
   their sub-arrays (e.g., runs, suffixes, lens, diffs) with safety flags 
   (e.g., disable_rle=True) to prevent infinite loops.

--------------------------------------------------------------------------------
3. DOMAIN-SPECIFIC REDUNDANCY ELIMINATION
--------------------------------------------------------------------------------

* Edges.sequences Strip & Restore:
  - The packer checks if Edges sequences are redundant (always [source_node_id, target_node_id]).
  - If redundant, it deletes Edges.sequences during compression, saving ~30% of file size.
  - The decompressor automatically reconstructs Edges.sequences dynamically from Node IDs.
"""

import sys
import os
import json
from collections import Counter

def pack_column_optimized(arr, path="", stats=None, disable_delta=False, disable_rle=False):
    N = len(arr)
    if N == 0:
        return []

    # Check if elements are objects (nested structures represented as dicts in Python)
    is_object_array = any(item is not None and isinstance(item, dict) for item in arr)

    if is_object_array:
        if stats is not None:
            stats[path] = "Nested Object Array"
            print(f"    * {path}: Object array -> drilling down recursively", file=sys.stderr)

        keys = set()
        for item in arr:
            if isinstance(item, dict):
                keys.update(item.keys())

        packed_nested = {}
        has_nulls = any(item is None or not isinstance(item, dict) for item in arr)
        if has_nulls:
            null_mask = [item is None or not isinstance(item, dict) for item in arr]
            packed_nested["_null_mask"] = pack_column_optimized(null_mask, f"{path}._null_mask", stats, disable_delta, disable_rle)

        for k in keys:
            sub_col = [(item[k] if (isinstance(item, dict) and k in item) else None) for item in arr]
            packed_nested[k] = pack_column_optimized(sub_col, f"{path}.{k}", stats, disable_delta, disable_rle)
        return packed_nested

    # Check Front compression coding option (prefix compression for strings)
    is_str_array = all(isinstance(x, str) for x in arr)
    representation_front = None
    size_front = float('inf')

    if is_str_array and N > 1 and not disable_rle:
        suffixes = [arr[0]]
        lens = [0]
        for i in range(1, N):
            s1 = arr[i-1]
            s2 = arr[i]
            common_len = 0
            max_len = min(len(s1), len(s2))
            while common_len < max_len and s1[common_len] == s2[common_len]:
                common_len += 1
            lens.append(common_len)
            suffixes.append(s2[common_len:])
            
        packed_lens = pack_column_optimized(lens, f"{path}.front_lens", stats, disable_delta, disable_rle=True)
        packed_suffixes = pack_column_optimized(suffixes, f"{path}.front_suffixes", stats, disable_delta, disable_rle=True)
        representation_front = {
            "front": True,
            "lens": packed_lens,
            "suffixes": packed_suffixes
        }
        size_front = len(json.dumps(representation_front, separators=(',', ':')))

    # Check RLE coding option
    representation_rle = None
    size_rle = float('inf')

    if N > 1 and not disable_rle:
        rle_values = []
        rle_runs = []
        current_val = arr[0]
        current_run = 1

        for i in range(1, N):
            if arr[i] == current_val:
                current_run += 1
            else:
                rle_values.append(current_val)
                rle_runs.append(current_run)
                current_val = arr[i]
                current_run = 1
        rle_values.append(current_val)
        rle_runs.append(current_run)

        if len(rle_runs) < N:
            packed_values = pack_column_optimized(rle_values, f"{path}.rle_values", stats, disable_delta, disable_rle=True)
            packed_runs = pack_column_optimized(rle_runs, f"{path}.rle_runs", stats, disable_delta, disable_rle=True)
            representation_rle = {
                "rle": True,
                "len": len(rle_runs),
                "values": packed_values,
                "runs": packed_runs
            }
            size_rle = len(json.dumps(representation_rle, separators=(',', ':')))

    # Check Delta coding option
    is_int_array = all(isinstance(x, int) and not isinstance(x, bool) for x in arr)
    representation_delta = None
    size_delta = float('inf')

    if is_int_array and N > 1 and not disable_delta:
        diffs = [arr[0]]
        for i in range(1, N):
            diffs.append(arr[i] - arr[i-1])
        packed_diffs = pack_column_optimized(diffs, f"{path}.delta_diffs", stats, disable_delta=True, disable_rle=disable_rle)
        representation_delta = {
            "delta": True,
            "values": packed_diffs
        }
        size_delta = len(json.dumps(representation_delta, separators=(',', ':')))

    # Option 1: Flat Array
    flat_representation = arr
    size_flat = len(json.dumps(flat_representation, separators=(',', ':')))

    # Option 2: Dictionary Indexing
    unique_values = []
    val_to_idx = {}
    for val in arr:
        if isinstance(val, (dict, list)):
            key = json.dumps(val, sort_keys=True, separators=(',', ':'))
        else:
            key = val
        if key not in val_to_idx:
            val_to_idx[key] = len(unique_values)
            unique_values.append(val)

    indices = []
    for val in arr:
        if isinstance(val, (dict, list)):
            key = json.dumps(val, sort_keys=True, separators=(',', ':'))
        else:
            key = val
        indices.append(val_to_idx[key])

    dict_representation = {
        "keys": unique_values,
        "values": indices
    }
    size_dict = len(json.dumps(dict_representation, separators=(',', ':')))

    # Option 3: Sparse Default Value
    counts = Counter()
    for val in arr:
        if isinstance(val, (dict, list)):
            key = json.dumps(val, sort_keys=True, separators=(',', ':'))
        else:
            key = val
        counts[key] += 1

    mode_key, max_count = counts.most_common(1)[0]
    
    mode_val = None
    for val in arr:
        if isinstance(val, (dict, list)):
            key = json.dumps(val, sort_keys=True, separators=(',', ':'))
        else:
            key = val
        if key == mode_key:
            mode_val = val
            break

    exceptions = {}
    exception_count = 0
    for idx, val in enumerate(arr):
        if isinstance(val, (dict, list)):
            key = json.dumps(val, sort_keys=True, separators=(',', ':'))
        else:
            key = val
        if key != mode_key:
            exceptions[str(idx)] = val
            exception_count += 1

    sparse_representation = {
        "default": mode_val,
        "exceptions": exceptions
    }
    size_sparse = len(json.dumps(sparse_representation, separators=(',', ':')))

    # Choose the representation with the smallest JSON size
    chosen = flat_representation
    min_size = size_flat
    method = "Flat"

    if size_dict < min_size:
        chosen = dict_representation
        min_size = size_dict
        method = "Dict"
    if size_sparse < min_size and exception_count < N:
        chosen = sparse_representation
        min_size = size_sparse
        method = "Sparse"
    if size_delta < min_size:
        chosen = representation_delta
        min_size = size_delta
        method = "Delta"
    if size_rle < min_size:
        chosen = representation_rle
        min_size = size_rle
        method = "Rle"
    if size_front < min_size:
        chosen = representation_front
        min_size = size_front
        method = "Front"

    if stats is not None and not path.endswith(".delta_diffs") and not path.endswith(".rle_values") and not path.endswith(".rle_runs") and not path.endswith(".front_lens") and not path.endswith(".front_suffixes"):
        stats[path] = f"{method} (Size: {min_size} bytes)"
        print(f"    * {path}: Packed using {method} (size = {min_size} bytes)", file=sys.stderr)

    return chosen


def pack_compact_json_optimized(data, stats=None):
    packed = json.loads(json.dumps(data))
    target = packed
    if "trace_results" in packed:
        target = packed["trace_results"]

    # Strip out Edges.sequences before packing
    if "Edges" in target and isinstance(target["Edges"], list):
        for e in target["Edges"]:
            if isinstance(e, dict) and "sequences" in e:
                del e["sequences"]

    if "Settings" not in target:
        target["Settings"] = {}
    if "Nodes" in target and isinstance(target["Nodes"], list):
        target["Settings"]["node_count"] = len(target["Nodes"])
    if "Edges" in target and isinstance(target["Edges"], list):
        target["Settings"]["edge_count"] = len(target["Edges"])

    for key in ["Nodes", "Edges"]:
        if key in target and isinstance(target[key], list):
            array = target[key]
            keys = set()
            for item in array:
                if isinstance(item, dict):
                    keys.update(item.keys())

            print(f"  - Packing {key} ({len(array)} items)...", file=sys.stderr)
            packed_obj = {}
            for k in keys:
                col = [(item[k] if (isinstance(item, dict) and k in item) else None) for item in array]
                packed_obj[k] = pack_column_optimized(col, f"{key}.{k}", stats, disable_delta=False, disable_rle=False)
            target[key] = packed_obj

    target["Settings"]["compact_json"] = "optimized"
    return packed


def pack_compact_json_old(data, stats=None):
    packed = json.loads(json.dumps(data))
    target = packed
    if "trace_results" in packed:
        target = packed["trace_results"]

    # Strip out Edges.sequences before packing
    if "Edges" in target and isinstance(target["Edges"], list):
        for e in target["Edges"]:
            if isinstance(e, dict) and "sequences" in e:
                del e["sequences"]

    if "Settings" not in target:
        target["Settings"] = {}
    if "Nodes" in target and isinstance(target["Nodes"], list):
        target["Settings"]["node_count"] = len(target["Nodes"])
    if "Edges" in target and isinstance(target["Edges"], list):
        target["Settings"]["edge_count"] = len(target["Edges"])

    for key in ["Nodes", "Edges"]:
        if key in target and isinstance(target[key], list):
            array = target[key]
            keys = set()
            for item in array:
                if isinstance(item, dict):
                    keys.update(item.keys())

            print(f"  - Packing {key} ({len(array)} items)...", file=sys.stderr)
            packed_obj = {}
            for k in keys:
                path = f"{key}.{k}"
                col = [(item[k] if (isinstance(item, dict) and k in item) else None) for item in array]
                
                # Check if it contains nested dicts (like patient_attributes)
                contains_nested = any(isinstance(v, (dict, list)) and v is not None for v in col)
                
                if contains_nested:
                    packed_obj[k] = col
                    if stats is not None:
                        stats[path] = "Flat (Old format: nested objects not compressed)"
                        print(f"    * {path}: Nested objects -> kept flat (Old format limitation)", file=sys.stderr)
                else:
                    # Compress primitive array using dictionary indexing if smaller
                    size_flat = len(json.dumps(col, separators=(',', ':')))

                    unique_values = []
                    val_to_idx = {}
                    for val in col:
                        if val not in val_to_idx:
                            val_to_idx[val] = len(unique_values)
                            unique_values.append(val)

                    indices = [val_to_idx[val] for val in col]
                    keys_obj = {str(idx): v for idx, v in enumerate(unique_values)}
                    dict_rep = {
                        "keys": keys_obj,
                        "values": indices
                    }
                    size_dict = len(json.dumps(dict_rep, separators=(',', ':')))

                    if size_dict < size_flat:
                        packed_obj[k] = dict_rep
                        if stats is not None:
                            stats[path] = f"Dict (Size: {size_dict} bytes)"
                            print(f"    * {path}: Packed using Dict (size = {size_dict} bytes)", file=sys.stderr)
                    else:
                        packed_obj[k] = col
                        if stats is not None:
                            stats[path] = f"Flat (Size: {size_flat} bytes)"
                            print(f"    * {path}: Packed using Flat (size = {size_flat} bytes)", file=sys.stderr)
                        
            target[key] = packed_obj

    target["Settings"]["compact_json"] = True
    return packed


def unpack_column(col, length):
    if isinstance(col, list):
        return col

    if not isinstance(col, dict):
        return [col] * length

    # Handle Front coding
    if "front" in col:
        unpacked_lens = unpack_column(col["lens"], length)
        unpacked_suffixes = unpack_column(col["suffixes"], length)
        arr = [unpacked_suffixes[0]]
        for i in range(1, length):
            common_len = unpacked_lens[i]
            suffix = unpacked_suffixes[i]
            prev = arr[i-1]
            arr.append(prev[:common_len] + suffix)
        return arr

    # Handle RLE coding
    if "rle" in col:
        runs_len = col["len"]
        unpacked_values = unpack_column(col["values"], runs_len)
        unpacked_runs = unpack_column(col["runs"], runs_len)
        arr = []
        for val, run in zip(unpacked_values, unpacked_runs):
            arr.extend([val] * run)
        return arr

    # Handle Delta coding
    if "delta" in col:
        diffs = unpack_column(col["values"], length)
        arr = [0] * length
        arr[0] = diffs[0]
        for i in range(1, length):
            arr[i] = arr[i-1] + diffs[i]
        return arr

    if "default" in col:
        arr = [col["default"]] * length
        if "exceptions" in col and col["exceptions"]:
            for idx_str, val in col["exceptions"].items():
                arr[int(idx_str)] = val
        return arr

    if "keys" in col and "values" in col:
        keys_map = col["keys"]
        if isinstance(keys_map, list):
            return [keys_map[v] for v in col["values"]]
        else:
            return [keys_map[str(v)] if str(v) in keys_map else keys_map[v] for v in col["values"]]

    unpacked_sub_cols = {}
    for sub_key, sub_col in col.items():
        unpacked_sub_cols[sub_key] = unpack_column(sub_col, length)

    result = []
    for i in range(length):
        if "_null_mask" in unpacked_sub_cols and unpacked_sub_cols["_null_mask"][i]:
            result.append(None)
            continue
        row = {}
        for sub_key in col.keys():
            if sub_key == "_null_mask":
                continue
            row[sub_key] = unpacked_sub_cols[sub_key][i]
        result.append(row)
    return result


def unpack_compact_json_optimized(data):
    target = data
    if isinstance(data, dict) and "trace_results" in data:
        target = data["trace_results"]

    for key in ["Nodes", "Edges"]:
        if key in target and isinstance(target[key], dict):
            length = 0
            if key == "Nodes" and "Settings" in target and isinstance(target["Settings"], dict) and "node_count" in target["Settings"]:
                length = target["Settings"]["node_count"]
            elif key == "Edges" and "Settings" in target and isinstance(target["Settings"], dict) and "edge_count" in target["Settings"]:
                length = target["Settings"]["edge_count"]
            else:
                for k, col in target[key].items():
                    if isinstance(col, list):
                        length = len(col)
                        break
                    elif isinstance(col, dict):
                        if "values" in col and isinstance(col["values"], list):
                            length = len(col["values"])
                            break

                if length == 0:
                    for k, col in target[key].items():
                        if isinstance(col, dict) and "values" in col:
                            length = max(length, len(col["values"]))

            expanded = []
            keys = list(target[key].keys())
            unpacked_cols = {}
            for k in keys:
                unpacked_cols[k] = unpack_column(target[key][k], length)

            for i in range(length):
                row = {}
                for k in keys:
                    if k == "_null_mask":
                        continue
                    row[k] = unpacked_cols[k][i]
                expanded.append(row)
            target[key] = expanded

    reconstruct_edge_sequences(data)


def unpack_compact_json_old(data):
    target = data
    if isinstance(data, dict) and "trace_results" in data:
        target = data["trace_results"]

    for key in ["Nodes", "Edges"]:
        if key in target and isinstance(target[key], dict):
            fields = list(target[key].keys())
            length = 0
            if key == "Nodes" and "Settings" in target and isinstance(target["Settings"], dict) and "node_count" in target["Settings"]:
                length = target["Settings"]["node_count"]
            elif key == "Edges" and "Settings" in target and isinstance(target["Settings"], dict) and "edge_count" in target["Settings"]:
                length = target["Settings"]["edge_count"]
            else:
                for f in fields:
                    col = target[key][f]
                    if isinstance(col, list):
                        length = len(col)
                        break
                    elif isinstance(col, dict) and "values" in col:
                        length = len(col["values"])
                        break
            
            expanded = [{} for _ in range(length)]
            for f in fields:
                col = target[key][f]
                if isinstance(col, dict) and "values" in col and "keys" in col:
                    keys_map = col["keys"]
                    col_expanded = [keys_map[str(v)] if str(v) in keys_map else keys_map[v] for v in col["values"]]
                else:
                    col_expanded = col
                
                for idx in range(min(length, len(col_expanded))):
                    expanded[idx][f] = col_expanded[idx]
            target[key] = expanded

    reconstruct_edge_sequences(data)


def reconstruct_edge_sequences(data):
    target = data
    if isinstance(data, dict) and "trace_results" in data:
        target = data["trace_results"]
    
    if "Edges" in target and "Nodes" in target:
        edges = target["Edges"]
        nodes = target["Nodes"]
        if isinstance(edges, list) and isinstance(nodes, list):
            for e in edges:
                if isinstance(e, dict) and "sequences" not in e and "source" in e and "target" in e:
                    s_idx = e["source"]
                    t_idx = e["target"]
                    if 0 <= s_idx < len(nodes) and 0 <= t_idx < len(nodes):
                        s_node = nodes[s_idx]
                        t_node = nodes[t_idx]
                        if isinstance(s_node, dict) and isinstance(t_node, dict) and "id" in s_node and "id" in t_node:
                            e["sequences"] = [s_node["id"], t_node["id"]]


def unpack_to_expanded(data):
    unpacked = json.loads(json.dumps(data))
    target = unpacked
    if "trace_results" in unpacked:
        target = unpacked["trace_results"]

    compact_type = False
    if "Settings" in target and isinstance(target["Settings"], dict):
        compact_type = target["Settings"].get("compact_json", False)

    if not compact_type:
        for key in ["Nodes", "Edges"]:
            if key in target and isinstance(target[key], dict):
                is_optimized = False
                for col_name, col in target[key].items():
                    if isinstance(col, dict) and "default" in col:
                        is_optimized = True
                        break
                    if col_name == "_null_mask":
                        is_optimized = True
                        break
                compact_type = "optimized" if is_optimized else True
                break

    if compact_type == "optimized":
        print("  - Input detected as: Optimized Compact Format. Unpacking...", file=sys.stderr)
        unpack_compact_json_optimized(unpacked)
    elif compact_type is True or compact_type == "true" or compact_type == "True":
        print("  - Input detected as: Old Compact Format. Unpacking...", file=sys.stderr)
        unpack_compact_json_old(unpacked)
    else:
        print("  - Input detected as: Fully Expanded Format. No unpack needed.", file=sys.stderr)
    
    if "Settings" in target and isinstance(target["Settings"], dict):
        target["Settings"]["compact_json"] = False
        if "node_count" in target["Settings"]:
            del target["Settings"]["node_count"]
        if "edge_count" in target["Settings"]:
            del target["Settings"]["edge_count"]
        
    return unpacked


def main():
    args = sys.argv[1:]
    strip_whitespace = False
    if "--strip" in args:
        strip_whitespace = True
        args.remove("--strip")
    if "-s" in args:
        strip_whitespace = True
        args.remove("-s")

    if len(args) < 3:
        print("Usage: python3 compressor.py <expanded|compact|optimized> <input_file> <output_file> [--strip]")
        print("Formats:")
        print("  expanded  - Fully expanded arrays of objects (uncompressed)")
        print("  compact   - Original compact style (dictionary mapping on flat arrays, no nested compression)")
        print("  optimized - New optimized style (recursive columns, sparse default-value optimizations)")
        sys.exit(1)

    target_format = args[0].lower()
    input_file = args[1]
    output_file = args[2]

    if target_format not in ["expanded", "compact", "optimized"]:
        print(f"Error: Unknown target format '{target_format}'. Choose 'expanded', 'compact', or 'optimized'.")
        sys.exit(1)

    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)

    input_file_size = os.path.getsize(input_file)

    print("Step 1: Loading input file...", file=sys.stderr)
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading/parsing input JSON: {e}")
        sys.exit(1)

    print("Step 2: Unpacking input to fully expanded intermediate form...", file=sys.stderr)
    try:
        expanded_data = unpack_to_expanded(data)
        expanded_size = len(json.dumps(expanded_data, separators=(',', ':')))
    except Exception as e:
        print(f"Error expanding input JSON: {e}")
        sys.exit(1)

    print(f"Step 3: Re-packing to target format '{target_format}'...", file=sys.stderr)
    column_stats = {}
    if target_format == "expanded":
        final_data = expanded_data
    elif target_format == "compact":
        final_data = pack_compact_json_old(expanded_data, column_stats)
    elif target_format == "optimized":
        final_data = pack_compact_json_optimized(expanded_data, column_stats)

    print("Step 4: Writing output JSON...", file=sys.stderr)
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            if strip_whitespace:
                json.dump(final_data, f, separators=(',', ':'))
            else:
                json.dump(final_data, f, indent=2)
    except Exception as e:
        print(f"Error writing output JSON: {e}")
        sys.exit(1)

    output_file_size = os.path.getsize(output_file)

    def format_size(size_in_bytes):
        if size_in_bytes >= 1024 * 1024:
            return f"{size_in_bytes / (1024 * 1024):.2f} MB"
        elif size_in_bytes >= 1024:
            return f"{size_in_bytes / 1024:.2f} KB"
        else:
            return f"{size_in_bytes} Bytes"

    print("\n" + "="*50)
    print("                COMPRESSION REPORT                ")
    print("="*50)
    
    print(f"Input File:        {input_file}")
    print(f"Output File:       {output_file}")
    print(f"Target Format:     {target_format}")
    print(f"Minified Output:   {strip_whitespace}")
    print("-"*50)
    
    print(f"Original File Size: {format_size(input_file_size)}")
    print(f"Expanded Form Size: {format_size(expanded_size)}")
    print(f"Compressed Size:    {format_size(output_file_size)}")
    
    saved_vs_orig = (1.0 - (output_file_size / input_file_size)) * 100
    saved_vs_exp  = (1.0 - (output_file_size / expanded_size)) * 100
    print(f"Space Saved vs Original: {saved_vs_orig:.2f}%")
    print(f"Space Saved vs Expanded: {saved_vs_exp:.2f}%")
    print("-"*50)
    
    if column_stats:
        print("Column Packing Statistics:")
        sorted_cols = sorted(column_stats.items())
        max_col_len = max(len(col) for col, _ in sorted_cols)
        
        for col, method in sorted_cols:
            padding = " " * (max_col_len - len(col) + 2)
            print(f"  {col}{padding}: {method}")
    else:
        print("No columns were packed (output format is fully expanded).")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
