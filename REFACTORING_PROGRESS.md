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

---
*Note: This document will be updated after each step.*
