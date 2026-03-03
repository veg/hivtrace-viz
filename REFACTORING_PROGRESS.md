# Refactoring Progress: viz-refactor-2026

This document tracks the staged refactoring of the `hivtrace-viz` codebase, focusing on decomposing the monolithic `src/clusternetwork.js`.

## General Strategy
1. **Identify** a cohesive block of logic in `clusternetwork.js` (e.g., helper functions, UI components, or specific rendering logic).
2. **Extract** the logic into a new, smaller module in `src/`.
3. **Verify** the change by running the Playwright test suite.
4. **Commit** the change if successful; **Revert** and report if it breaks.

## Refactoring Steps

### Phase 1: Decomposing `clusternetwork.js`

#### Step 1: Extract Option Handling and Initial Constants
- **Goal**: Move the initial configuration logic and static constants out of the main constructor/closure.
- **Result**: Extracted nearly 200 lines of initialization logic into `src/networkConfig.js`.
- **Status**: Completed (2026-02-24)

#### Step 2: Move Attribute Transformation Calls to Configuration
- **Goal**: Consolidate `_networkPredefinedAttributeTransforms` initialization into `initializeNetworkSettings`.
- **Result**: Moved ~60 lines of attribute transformation logic from `clusternetwork.js` to `networkConfig.js`.
- **Status**: Completed (2026-02-24)

#### Step 3: Remove Legacy Map Overlay Logic
- **Goal**: Remove unsupported/legacy topojson-based map rendering code.
- **Result**: 
    - Removed `topojson` dependency from `package.json`.
    - Removed map rendering and projection logic from `clusternetwork.js` and `hiv_tx_network.js`.
    - Retained `_get_node_country` helper as it is used for node attribute lookups.
    - Restored `assets/mapping/` to avoid 404 errors in legacy data.
- **Status**: Completed (2026-02-24)

#### Step 4: Extract Legend Rendering Logic
- **Goal**: Move legend rendering and shape helper logic to `src/networkLegend.js`.
- **Result**: 
    - Created `src/networkLegend.js`.
    - Extracted `draw_attribute_labels` and `check_for_predefined_shapes`.
    - Reduced `clusternetwork.js` by ~400 lines.
- **Status**: Completed (2026-02-24)

#### Step 5: Extract Tab Management Logic
- **Goal**: Move `open_exclusive_tab_...` functions to `src/networkTabs.js`.
- **Result**: 
    - Created `src/networkTabs.js`.
    - Extracted `open_exclusive_tab_close`, `open_exclusive_tab_view`, and `open_exclusive_tab_view_aux`.
    - Handled recursive dependencies by passing a shared context.
    - Reduced `clusternetwork.js` by ~250 lines.
- **Status**: Completed (2026-02-24)

#### Step 6: Extract Node and Link Stylers
- **Goal**: Move `node_size`, `node_color`, `node_opacity`, `cluster_color`, `link_path_generator`, and `compute_cluster_gradient` to `src/networkStylers.js`.
- **Result**: 
    - Created `src/networkStylers.js`.
    - Extracted core D3 mapping/styling logic.
    - Replaced internal implementations in `clusternetwork.js` with thin wrappers.
    - Reduced `clusternetwork.js` by ~300 lines.
- **Status**: Completed (2026-02-24)

#### Step 7: Extract Network Statistics Logic
- **Goal**: Move adjacency list and clustering coefficient calculations to `src/networkStatistics.js`.
- **Result**: 
    - Created `src/networkStatistics.js`.
    - Extracted `compute_adjacency_list`, `compute_local_clustering_coefficients`, `compute_local_clustering_coefficients_worker`, `compute_global_clustering_coefficients`, and `compute_graph_stats`.
    - Handled `_.once` and `_.memoize` patterns to maintain performance.
    - Reduced `clusternetwork.js` by ~200 lines.
- **Status**: Completed (2026-03-02)

#### Step 8: Extract Node Search Logic
- **Goal**: Move node search table definition and rule processing to `src/networkSearch.js`.
- **Result**: 
    - Created `src/networkSearch.js`.
    - Extracted `define_node_search_table`, `process_search`, `process_search_field`, and `rule_lc`.
    - Parameterized dependencies via a `search_context` object.
    - Reduced `clusternetwork.js` by ~300 lines.
- **Status**: Completed (2026-03-02)

#### Step 9: Extract Subcluster View and Node Interaction Logic
- **Goal**: Move `view_subcluster`, `oldest_nodes_first`, `handle_node_click`, and `get_initial_xy` to specialized modules.
- **Result**: 
    - Created `src/networkSubcluster.js` and `src/networkNodeInteraction.js`.
    - Extracted subcluster tab rendering and node context menu handling.
    - Promoted several internal helpers (`_compute_cluster_degrees`, `get_all_clusters`, `handle_node_label`, `collapse_cluster_handler`) to `self` methods for cross-module accessibility.
    - Reduced `clusternetwork.js` by ~300 lines.
- **Status**: Completed (2026-03-03)

#### Step 10: Extract Attribute Extraction and Cluster List View Logic
- **Goal**: Move `_extract_attributes_for_nodes`, `_extract_exportable_attributes`, `_extract_mjc_attributes`, `_extract_nodes_by_id`, `_cluster_list_view_render`, and `_setup_cluster_list_view` to a specialized module.
- **Result**: 
    - Created `src/networkUIHelpers.js`.
    - Extracted attribute extraction, node subsetting, and cluster list modal rendering.
    - Resolved global dependency issues (`__`, `$`, `tables`) by parameterization.
    - Reduced `clusternetwork.js` by ~400 lines.
- **Status**: Completed (2026-03-03)

#### Step 11: Extract Network Control Bar Logic
- **Goal**: Move network operations menu and action button group setup to a specialized module.
- **Result**: 
    - Created `src/networkControls.js`.
    - Extracted `cluster_commands`, various UI handlers (fix, labels, layout), and action button groups (spacing, window size, export).
    - Promoted several internal helpers (`change_spacing`, `change_window_size`, `default_layout`, `render_binned_table`, `render_chord_diagram`) to `self` methods for cross-module accessibility.
    - Reduced `clusternetwork.js` by ~250 lines.
- **Status**: Completed (2026-03-03)

#### Step 12: Extract Cluster Table UI Logic
- **Goal**: Move `draw_cluster_table` and its specific cell drawing helpers to a specialized module.
- **Result**: 
    - Created `src/networkTablesUI.js`.
    - Extracted `draw_cluster_table`, `_cluster_table_draw_id`, and `_cluster_table_draw_buttons`.
    - Promoted `expand_cluster` and `collapse_cluster` to `self` methods to support table interactions from the new module.
    - Resolved a test-side "undefined" attribute reporting issue by making table cell cleaning more robust.
    - Reduced `clusternetwork.js` by ~300 lines.
- **Status**: Completed (2026-03-03)

#### Step 13: Extract Category and Attribute Menu Logic
- **Goal**: Move categorical, shape, and continuous attribute menu population logic to a specialized module.
- **Result**: 
    - Created `src/networkAttributeMenus.js` and `src/networkAttributeHandlers.js`.
    - Extracted attribute menu population and handler logic.
    - Promoted several internal helpers (`attribute_cluster_distribution`, `attribute_pairwise_distribution`, `stratify`, `compute_cluster_gradient`) to `self` methods.
    - Resolved `ReferenceError: stratify is not defined` by ensuring all internal calls use the `self.` prefix.
    - Handled complex "stable-ish" attribute ordering and compressed value range logic.
    - Reduced `clusternetwork.js` by ~400 lines.
- **Status**: Completed (2026-03-03)

#### Step 14: Extract Node Table UI Logic
- **Goal**: Move node table rendering and volatile element update logic to a specialized module.
- **Result**: 
    - Created `src/networkNodeTableUI.js`.
    - Extracted `draw_node_table`, `draw_extended_node_table`, `node_table_draw_buttons`, `update_volatile_elements`, and `redraw_tables`.
    - Integrated with `js-convert-case` for header formatting.
    - Reduced `clusternetwork.js` by ~350 lines.
- **Status**: Completed (2026-03-03)

#### Step 15: Extract Graph Data Preparation
- **Goal**: Move `prepare_data_to_graph` to a specialized module.
- **Result**: 
    - Created `src/networkGraphData.js`.
    - Extracted core filtering and mapping logic for graph preparation.
    - Reduced `clusternetwork.js` by ~100 lines.
- **Status**: Completed (2026-03-03)

#### Step 16: Extract Node, Edge, and Cluster Pop-over Handlers
- **Goal**: Move mouseover and mouseout logic for network elements to a specialized module.
- **Result**: 
    - Moved wrappers for `node_pop_on/off`, `edge_pop_on/off`, and `cluster_pop_on/off` to `src/networkNodeInteraction.js`.
    - Cleaned up event listener registrations in `clusternetwork.js`.
    - Reduced `clusternetwork.js` by ~50 lines.
- **Status**: Completed (2026-03-03)

### Phase 2: Extract Core Engine for Standalone Package

- **Goal**: Isolate network loading, cluster definition, and COI logic into `src/core/` to support CLI/Back-end usage.

#### Step 1: Extract `unpack_compact_json` to core
- **Goal**: Move `unpack_compact_json` to `src/core/networkUtils.js`.
- **Result**: 
    - Created `src/core/networkUtils.js` (CommonJS compatible).
    - Updated `src/network.js` to use the core version.
- **Status**: Completed (2026-02-24)

#### Step 2: Extract `normalize_node_attributes` to core
- **Goal**: Move `normalize_node_attributes` to `src/core/networkUtils.js`.
- **Result**: 
    - Moved logic to core utility module.
    - Updated browser wrapper to pass `kGlobals`.
- **Status**: Completed (2026-02-24)

#### Step 3: Extract `ensure_node_attributes_exist` and `check_network_option` to core
- **Goal**: Move remaining non-D3 utility functions to `src/core/networkUtils.js`.
- **Result**: 
    - Moved logic to core utility module.
    - Simplified `network.js` to a clean delegator.
- **Status**: Completed (2026-02-24)

#### Step 4: Extract `HTXModel` base class
- **Goal**: Create `src/core/HTXModel.js` and move core data model logic (tabulation, grouping) from `HIVTxNetwork`.
- **Result**: 
    - Created `HTXModel.js` with `group_edges_by_primary_key`, `tabulate_multiple_sequences`, and entity list helpers.
    - Updated `HIVTxNetwork` to extend `HTXModel`.
- **Status**: Completed (2026-02-24)

#### Step 5: Move attribute and extraction helpers to `HTXModel`
- **Goal**: Move `attribute_node_value_by_id`, `inject_attribute_node_value_by_id`, `is_edge_injected`, and `extract_single_cluster` to core model.
- **Result**: 
    - Core logic isolated in `HTXModel`.
    - Browser wrappers in `HIVTxNetwork` handle `kGlobals` injection.
- **Status**: Completed (2026-02-24)

#### Step 6: Move cluster filtering and helpers to `HTXModel`
- **Goal**: Move `cluster_display_filter`, `filter_by_size`, `filter_singletons`, `filter_if_added`, `filter_time_period`, `get_reference_date`, and `lookup_option` to core model.
- **Result**: 
    - Logic moved to `HTXModel`.
    - Methods bound in `HIVTxNetwork` constructor to maintain `this` context for callbacks.
- **Status**: Completed (2026-02-24)

#### Step 7: Move priority group helpers and date utilities to `HTXModel`
- **Goal**: Move `generateClusterOfInterestID`, `priority_group_node_record`, `parse_dates`, `filter_by_date`, and status helpers to `HTXModel`.
- **Result**: 
    - Moved core COI and date parsing logic to `HTXModel`.
    - Added state properties (`CDC_data`, `clusters`, `defined_priority_groups`) to `HTXModel` constructor.
    - Updated `HIVTxNetwork` with thin wrappers.
- **Status**: Completed (2026-02-24)

#### Step 8: Move `auto_expand_pg_handler` to `HTXModel`
- **Goal**: Move COI growth logic to core model.
- **Result**: 
    - Moved `auto_expand_pg_handler` to `HTXModel`.
    - Parameterized with `kGlobals`, `timeDateUtil`, and `misc`.
    - Updated `HIVTxNetwork` with a thin wrapper.
- **Status**: Completed (2026-02-24)

#### Step 9: Move entity aggregation and overlap logic to `HTXModel`
- **Goal**: Move `aggregate_indvidual_level_records` and `priority_groups_compute_overlap` to core model.
- **Result**: 
    - Moved aggregation, entity identification, and overlap computation logic to `HTXModel`.
    - Removed D3 dependency from aggregator (replaced `d3.min` with `_.min`).
    - Fixed typo in `priority_groups_compute_overlap_mjc`.
- **Status**: Completed (2026-03-02)

#### Step 10: Move `priority_groups_validate` to `HTXModel`
- **Goal**: Move the primary COI validation logic to core model.
- **Result**: 
    - Migrated the massive `priority_groups_validate` method to `HTXModel`.
    - Parameterized all browser-specific globals (`kGlobals`, `timeDateUtil`, `misc`).
    - Simplified redundant logic and fixed typos during migration.
- **Status**: Completed (2026-03-02)

#### Step 11: Move MSPP processing logic to `HTXModel`
- **Goal**: Move `process_multiple_sequences`, `annotate_multiple_clusters_on_nodes`, and `simplify_multisequence_cluster` to core model.
- **Result**: 
    - Migrated MSPP (Multiple Sequences Per Person) core logic to `HTXModel`.
    - Added `is_primary_graph` state to `HTXModel` to control deletion logic.
    - Replaced implementations in `HIVTxNetwork` with thin wrappers.
    - Verified identical cluster counts and sizes using server-side analysis script on large jurisdictional data.
- **Status**: Completed (2026-03-02)

#### Step 12: Consolidated Priority Group Processing in `HTXModel`
- **Goal**: Move the core logic of `load_priority_sets` to the model, separating it from UI/DOM manipulation.
- **Result**: 
    - Created `priority_groups_process_data` in `HTXModel` to encapsulate date parsing, validation, auto-creation, and overlap computation.
    - Updated `HIVTxNetwork.load_priority_sets` to use this new method, reducing its size and complexity.
    - Enhanced `HTXModel` constructor to handle jurisdiction-based defaults (e.g., low-morbidity threshold settings) and reference dates (`today`).
    - Verified **perfect match** (25/25 CoI groups and names) between server-side script and browser reference data.
- **Status**: Completed (2026-03-02)

#### Step 13: Enhanced Standalone COI Processing Script
- **Goal**: Improve `scripts/compute_coi.js` for pipeline integration and document its usage.
- **Result**: 
    - Updated `compute_coi.js` to handle nested `trace_results` JSON structure.
    - Added reporting of network statistics (nodes, edges, clusters, subclusters).
    - Added comprehensive CLI documentation in `scripts/README.md`.
    - Synchronized `debug_rc_171.js` with the new data loading logic.
- **Status**: Completed (2026-03-03)

---
*Note: This document will be updated after each step.*
