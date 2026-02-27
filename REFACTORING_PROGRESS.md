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

---
*Note: This document will be updated after each step.*
