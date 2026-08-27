const { test, expect } = require("@playwright/test");

test("unlinked node statistics with/without sequences display correctly", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the Statistics tab and click it
  await expect(page.locator("#graph-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#graph-tab").click();

  // Wait for the graph summary table to be visible
  await expect(page.locator("#graph_summary_table")).toBeVisible({ timeout: 30000 });

  // Get table rows
  const tableRows = page.locator("#graph_summary_table tbody tr");
  await expect(tableRows).not.toHaveCount(0, { timeout: 30000 });

  // Check that the unlinked statistics rows exist and have correct values
  const withSeqRow = page.locator("#graph_summary_table tbody tr", { hasText: "Unlinked nodes (with sequences)" });
  await expect(withSeqRow).toBeVisible();
  await expect(withSeqRow.locator("td").last()).toHaveText("10");

  const withoutSeqRow = page.locator("#graph_summary_table tbody tr", { hasText: "Unlinked nodes (without sequences)" });
  await expect(withoutSeqRow).toBeVisible();
  await expect(withoutSeqRow.locator("td").last()).toHaveText("10");
});

test("unlinked nodes without sequences are rendered as hollow dashed squares in COI view", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the table to be visible
  await expect(page.locator("#priority_set_table")).toBeVisible({ timeout: 30000 });

  // Locate the row for MT_202312_32.1
  const row = page.locator("#priority_set_table tbody tr").filter({ hasText: "MT_202312_32.1" });
  await expect(row).toBeVisible();

  // Click the view dropdown action button
  await row.locator(".view-edit-cluster").click();

  // Click "View this cluster of interest at link distance of 0.50%"
  const viewOption = page.locator("a:has-text('View this cluster of interest at link distance of 0.50%')").first();
  await expect(viewOption).toBeVisible();
  await viewOption.click();

  // Wait for the new active tab pane to be visible
  const activePane = page.locator(".tab-pane.active");
  await expect(activePane.locator(".node")).not.toHaveCount(0, { timeout: 30000 });

  // Find how many nodes have hollow styling (transparent fill and dashed stroke-dasharray)
  const hollowCount = await activePane.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll(".tab-pane.active .node path"));
    return nodes.filter(path => {
      const style = window.getComputedStyle(path);
      // It should be hollow (transparent or none fill) and dashed
      // It should be hollow (transparent, none fill, or low fill opacity) and dashed
      const isHollow = style.fill === "none" || 
                       style.fill === "transparent" || 
                       style.fill.includes("rgba(0, 0, 0, 0)") || 
                       (style.fillOpacity && parseFloat(style.fillOpacity) < 0.5) ||
                       (style.fill && style.fill.includes("rgba(") && parseFloat(style.fill.split(",")[3]) < 0.5);
      const isDashed = style.strokeDasharray !== "none";
      return isHollow && isDashed;
    }).length;
  });

  // Verify that exactly 10 nodes are rendered with hollow dashed square styling
  expect(hollowCount).toBe(10);
});

test("legend items are rendered on first load of a COI subnetwork view", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the table to be visible
  await expect(page.locator("#priority_set_table")).toBeVisible({ timeout: 30000 });

  // Locate the row for MT_202312_32.1
  const row = page.locator("#priority_set_table tbody tr").filter({ hasText: "MT_202312_32.1" });
  await expect(row).toBeVisible();

  // Click the view dropdown action button
  await row.locator(".view-edit-cluster").click();

  // Click "View this cluster of interest at link distance of 0.50%"
  const viewOption = page.locator("a:has-text('View this cluster of interest at link distance of 0.50%')").first();
  await expect(viewOption).toBeVisible();
  await viewOption.click();

  // Wait for the new active tab pane to be visible
  const activePane = page.locator(".tab-pane.active");
  await expect(activePane.locator(".node")).not.toHaveCount(0, { timeout: 30000 });

  // Wait for layout simulation to complete (so that rendering/styling steps finish)
  await page.waitForTimeout(2000);

  // Check that the legend SVG in the active tab contains "Represents >1 sequence" and "Unlinked node without sequence data"
  const legendTexts = await activePane.evaluate(() => {
    const texts = Array.from(document.querySelectorAll(".tab-pane.active svg text"));
    return texts.map(t => t.textContent.trim());
  });

  console.log("Found legend texts on first load:", legendTexts);

  expect(legendTexts).toContain("Represents >1 sequence");
  expect(legendTexts).toContain("Unlinked node without sequence data");
});

test("nodes with no sequences can be searched and displayed in the nodes table as having 0 sequences", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the primary graph/tabs to load
  await expect(page.locator("a[href='#trace-nodes']")).toBeVisible({ timeout: 30000 });
  
  // Go to the Nodes tab
  await page.locator("a[href='#trace-nodes']").click();

  // Locate the node table
  const nodeTable = page.locator("#node_table");
  await expect(nodeTable).toBeVisible({ timeout: 30000 });

  // Switch the second column to display "Number of sequences"
  const secondColHeader = nodeTable.locator("thead th").nth(1);
  await secondColHeader.locator("button.dropdown-toggle").click();
  await secondColHeader.locator("ul.dropdown-menu a:has-text('Number of sequences')").click();

  // Wait for the header text to update to "Number of sequences"
  await expect(secondColHeader.locator("button.dropdown-toggle")).toContainText("Number of sequences");

  // Locate the query builder div
  const searchDiv = page.locator("[data-hivtrace-ui-role='node_search_div']");
  await expect(searchDiv).toBeVisible();

  // Wait for the query builder to be initialized
  await expect(searchDiv.locator(".rules-group-container")).toBeVisible({ timeout: 30000 });

  // Set the QueryBuilder rule to search for sequence_count = 0
  await searchDiv.evaluate((el) => {
    $(el).queryBuilder("setRules", {
      condition: "AND",
      rules: [
        {
          id: "sequence_count",
          operator: "equal",
          value: 0
        }
      ]
    });
  });

  // Click the search button
  await searchDiv.locator("button:has-text('Search')").click();

  // Wait for the node table to update and show search results
  const rows = nodeTable.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 30000 });
  
  // Verify that exactly 10 nodes are returned/listed in the table
  await expect(rows).toHaveCount(10);

  // Verify that the second column (index 1) in the first row is "0"
  const secondColCellText = await rows.first().locator("td").nth(1).innerText();
  expect(secondColCellText.trim()).toBe("0");
});

test("COI table shows breakdown of nodes with and without sequences in the Size column", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the table to be visible
  await expect(page.locator("#priority_set_table")).toBeVisible({ timeout: 30000 });

  // Locate the row for MT_202312_32.1
  const row = page.locator("#priority_set_table tbody tr").filter({ hasText: "MT_202312_32.1" });
  await expect(row).toBeVisible();

  // Find the Size column index
  const headers = await page.locator("#priority_set_table thead th").allTextContents();
  const sizeColIndex = headers.findIndex(h => h.includes("Size"));
  expect(sizeColIndex).toBeGreaterThan(-1);

  // Check the inner text of the Size column in the matched row
  const sizeCellText = await row.locator("td").nth(sizeColIndex).innerText();
  console.log("Size cell text for MT_202312_32.1:", sizeCellText);

  // The size text should include the total count (44) and the breakdown "34 + 10 (no seq)"
  expect(sizeCellText).toContain("44");
  expect(sizeCellText).toContain("34 + 10 (no seq)");
});

test("nodes matching search term are highlighted with thick outer edges", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Locate the row for MT_202312_32.1 and click view to open the subnetwork view
  const row = page.locator("#priority_set_table tbody tr").filter({ hasText: "MT_202312_32.1" });
  await expect(row).toBeVisible();
  await row.locator(".view-edit-cluster").click();
  const viewOption = page.locator("a:has-text('View this cluster of interest at link distance of 0.50%')").first();
  await expect(viewOption).toBeVisible();
  await viewOption.click();

  // Wait for the new active tab pane to be visible
  const activePane = page.locator(".tab-pane.active");
  await expect(activePane.locator(".node")).not.toHaveCount(0, { timeout: 30000 });

  // Locate the filter input field
  const filterInput = activePane.locator("[data-hivtrace-ui-role='filter']").first();
  await expect(filterInput).toBeVisible();

  // Fill in search term for XV_UNLINKED_SEQ_0
  await filterInput.fill("XV_UNLINKED_SEQ_0");
  // Wait 500ms to allow throttling and layout update
  await page.waitForTimeout(500);

  // Check the stroke-width style of the matching node and a non-matching node
  const strokeWidths = await activePane.evaluate(() => {
    const nodeElements = Array.from(document.querySelectorAll(".tab-pane.active .node"));
    const matchedNode = nodeElements.find(el => {
      const d = el.__data__;
      return d && d.id === "XV_UNLINKED_SEQ_0";
    });
    const unmatchedNode = nodeElements.find(el => {
      const d = el.__data__;
      return d && d.id === "XV_UNLINKED_SEQ_1";
    });
    
    return {
      matched: matchedNode ? window.getComputedStyle(matchedNode.querySelector("path")).strokeWidth : null,
      unmatched: unmatchedNode ? window.getComputedStyle(unmatchedNode.querySelector("path")).strokeWidth : null
    };
  });

  expect(strokeWidths.matched).toBe("5px");
  expect(strokeWidths.unmatched).not.toBe("5px");
});

test("cluster selection arcs render correctly on filter match in main graph", async ({ page }) => {
  const url =
    "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV-with-unlinked-compressed.json&pg=../test/COI/2023-12-30-with-unlinked.json";
  await page.goto(url);

  // Wait for clusters to render in the main network
  await expect(page.locator(".cluster-group")).not.toHaveCount(0, {
    timeout: 30000,
  });

  // Locate the filter input field in the main page
  const filterInput = page.locator("[data-hivtrace-ui-role='filter']").first();
  await expect(filterInput).toBeVisible();

  // Fill in search term that matches a portion of cluster 1 (XV[0-2])
  await filterInput.fill("XV[0-2]");
  // Wait 1000ms to allow layout update
  await page.waitForTimeout(1000);

  // Check the match_filter and arc angles in cluster 1
  const clusterData = await page.evaluate(() => {
    const g = window.user_graph;
    const cluster1 = g.clusters.find((c) => c.cluster_id === "1");

    // Find the paths for selection rim in the SVG DOM
    const clusterGroups = Array.from(
      document.querySelectorAll(".cluster-group")
    );
    const cluster1El = clusterGroups.find((el) => {
      const d = el.__data__;
      return d && d.cluster_id === "1";
    });

    if (!cluster1El) return null;

    const paths = Array.from(
      cluster1El.querySelectorAll("path.hiv-trace-selected")
    );
    const pathData = paths.map((path) => {
      const d = path.__data__;
      return {
        name: d.name,
        rim: d.rim,
        startAngle: d.startAngle,
        endAngle: d.endAngle,
      };
    });

    return {
      match_filter: cluster1.match_filter,
      children_count: cluster1.children.length,
      paths: pathData,
    };
  });

  expect(clusterData).not.toBeNull();
  expect(clusterData.match_filter).toBe(520);
  expect(clusterData.paths.length).toBe(2);

  const selectedPath = clusterData.paths.find((p) => p.name === "selected");
  const notSelectedPath = clusterData.paths.find(
    (p) => p.name === "not selected"
  );

  expect(selectedPath).toBeDefined();
  expect(notSelectedPath).toBeDefined();

  // Angle for 520 / 954 should span approximately 54.5% of 2*PI (approx 3.4246 radians)
  const expectedAngleSpan = (520 / 954) * 2 * Math.PI;
  expect(
    Math.abs(selectedPath.endAngle - selectedPath.startAngle - expectedAngleSpan)
  ).toBeLessThan(1e-5);
});

test("distinguishes between unlinked nodes without sequence and with poor sequence in XI network", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/XI.network.json&pg=../test/COI/empty.json";
  await page.goto(url);

  // Wait for the Statistics tab and click it
  await expect(page.locator("#graph-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#graph-tab").click();

  // Wait for the graph summary table to be visible
  await expect(page.locator("#graph_summary_table")).toBeVisible({ timeout: 30000 });

  // Get table rows
  const tableRows = page.locator("#graph_summary_table tbody tr");
  await expect(tableRows).not.toHaveCount(0, { timeout: 30000 });

  // Check unlinked nodes (with poor quality sequences)
  const poorSeqRow = page.locator("#graph_summary_table tbody tr", { hasText: "Unlinked nodes (with poor quality sequences)" });
  await expect(poorSeqRow).toBeVisible();
  await expect(poorSeqRow.locator("td").last()).toHaveText("65");

  // Check unlinked nodes (without sequences)
  const withoutSeqRow = page.locator("#graph_summary_table tbody tr", { hasText: "Unlinked nodes (without sequences)" });
  await expect(withoutSeqRow).toBeVisible();
  await expect(withoutSeqRow.locator("td").last()).toHaveText("6");
});

test("sequence status column is NOT displayed by default, is selectable, and is searchable in nodes tab for XI network", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/XI.network.json&pg=../test/COI/empty.json";
  await page.goto(url);

  // Go to the Nodes tab
  await expect(page.locator("a[href='#trace-nodes']")).toBeVisible({ timeout: 30000 });
  await page.locator("a[href='#trace-nodes']").click();

  // Locate the node table
  const nodeTable = page.locator("#node_table");
  await expect(nodeTable).toBeVisible({ timeout: 30000 });

  // Get table header text
  const buttonTexts = await nodeTable.locator("thead th button.dropdown-toggle").allTextContents();
  console.log("Default dropdown buttons found:", buttonTexts);

  // "Sequence Status" should NOT be in the default buttonTexts
  expect(buttonTexts.some(h => h.includes("Sequence Status"))).toBe(false);

  // Open the dropdown for the fifth column (index 4)
  const dropdownToggle = nodeTable.locator("thead th button.dropdown-toggle").nth(4);
  await dropdownToggle.click();

  // Find the dropdown menu item for 'Sequence Status' and click it
  const dropdownMenuItem = nodeTable.locator("thead th").nth(4).locator("ul.dropdown-menu a", { hasText: "Sequence Status" });
  await dropdownMenuItem.click();

  // Get updated table headers
  const updatedButtonTexts = await nodeTable.locator("thead th button.dropdown-toggle").allTextContents();
  console.log("Updated dropdown buttons:", updatedButtonTexts);

  // "Sequence Status" should be in the updatedButtonTexts at index 4
  expect(updatedButtonTexts[4].includes("Sequence Status")).toBe(true);

  const statusColIndex = 4;

  // Locate the query builder div
  const searchDiv = page.locator("[data-hivtrace-ui-role='node_search_div']");
  await expect(searchDiv).toBeVisible();

  // Set the QueryBuilder rule to search for sequence_status = 'Poor Quality'
  await searchDiv.evaluate((el) => {
    $(el).queryBuilder("setRules", {
      condition: "AND",
      rules: [
        {
          id: "sequence_status",
          operator: "equal",
          value: "Poor Quality"
        }
      ]
    });
  });

  // Click the search button
  await searchDiv.locator("button:has-text('Search')").click();

  // Wait for the node table to update and show search results
  const rows = nodeTable.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 30000 });
  
  // Verify that exactly 71 nodes are returned (since 71 unlinked/clustered patient entities have poor/unusable quality sequences)
  await expect(rows).toHaveCount(71);

  // Verify that the Sequence Status column in the first row has text "Poor Quality"
  const cellText = await rows.first().locator("td").nth(statusColIndex).innerText();
  expect(cellText.trim()).toBe("Poor Quality");
});

test("loads test social network and verifies custom unlinked, unsequenced, and cluster node connections", async ({ page }) => {
  const fs = require("fs");
  const path = require("path");

  // Catch console logs from browser
  page.on("console", (msg) => {
    console.log("PAGE LOG:", msg.text());
  });

  // Read CSV contents from disk
  const nodesCSV = fs.readFileSync(path.join(__dirname, "../test/SocialNetworkTestAttributes.csv"), "utf8");
  const edgesCSV = fs.readFileSync(path.join(__dirname, "../test/SocialNetworkTestEdges.csv"), "utf8");

  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/XS.network.json&pg=../test/COI/empty.json";
  await page.goto(url);

  // Wait for clusters to render in the main network
  await expect(page.locator(".cluster-group")).not.toHaveCount(0, { timeout: 30000 });

  // Load the social network data via the user_graph API inside the browser context
  const importResult = await page.evaluate(({ nodesCSV, edgesCSV }) => {
    const nodes = d3.csv.parse(nodesCSV);
    const edges = d3.csv.parse(edgesCSV);
    const res = window.user_graph.load_nodes_edges(nodes, "Index", edges, "TestSocial");
    
    // Inspect specific clusters
    const check_clusters = ["173", "111", "523", "228"];
    check_clusters.forEach(cid => {
      const idx = window.user_graph.cluster_mapping[cid];
      if (idx !== undefined) {
        const cluster = window.user_graph.clusters[idx];
        console.log(`Cluster ${cid} injected:`, JSON.stringify(cluster.injected));
        console.log(`Cluster ${cid} linked_clusters:`, JSON.stringify(cluster.linked_clusters));
      }
    });

    return res;
  }, { nodesCSV, edgesCSV });

  console.log("Import Result:", importResult);

  // Verify that all 9 nodes were matched as existing nodes, and 5 edges were loaded
  expect(importResult.existing_nodes).toBe(9);
  expect(importResult.nodes.length).toBe(0);
  expect(importResult.edges).toEqual({ "Social": 5 });
});

test("CLUSTER_ID is a computed, searchable attribute for nodes and displays in nodes table for XS network", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/XS.network.json&pg=../test/COI/empty.json";
  await page.goto(url);

  // Go to the Nodes tab
  await expect(page.locator("a[href='#trace-nodes']")).toBeVisible({ timeout: 30000 });
  await page.locator("a[href='#trace-nodes']").click();

  // Locate the node table
  const nodeTable = page.locator("#node_table");
  await expect(nodeTable).toBeVisible({ timeout: 30000 });

  // Open the dropdown for the fifth column (index 4) to select Cluster ID
  const dropdownToggle = nodeTable.locator("thead th button.dropdown-toggle").nth(4);
  await dropdownToggle.click();

  // Find the dropdown menu item for 'Cluster ID' and click it
  const dropdownMenuItem = nodeTable.locator("thead th").nth(4).locator("ul.dropdown-menu a").filter({ hasText: /^Cluster ID$/ });
  await dropdownMenuItem.click();

  // Get updated table headers
  const updatedButtonTexts = await nodeTable.locator("thead th button.dropdown-toggle").allTextContents();
  expect(updatedButtonTexts[4].includes("Cluster ID")).toBe(true);

  // Search for nodes with CLUSTER_ID = '173'
  const searchDiv = page.locator("[data-hivtrace-ui-role='node_search_div']");
  await expect(searchDiv).toBeVisible();

  await searchDiv.evaluate((el) => {
    $(el).queryBuilder("setRules", {
      condition: "AND",
      rules: [
        {
          id: "CLUSTER_ID",
          operator: "equal",
          value: "173"
        }
      ]
    });
  });

  // Click search button
  await searchDiv.locator("button:has-text('Search')").click();

  // Wait for the table to update
  const rows = nodeTable.locator("tbody tr");
  await expect(rows.first()).toBeVisible({ timeout: 30000 });

  // Verify that exactly 5 nodes are returned (since Cluster 173 has size 5)
  await expect(rows).toHaveCount(5);

  // Verify that the Cluster ID column in the first row has text "173"
  const cellText = await rows.first().locator("td").nth(4).innerText();
  expect(cellText.trim()).toBe("173");
});

test("sorting on social network column in the clusters table works correctly", async ({ page }) => {
  const fs = require("fs");
  const path = require("path");

  // Read CSV contents from disk
  const nodesCSV = fs.readFileSync(path.join(__dirname, "../test/SocialNetworkTestAttributes.csv"), "utf8");
  const edgesCSV = fs.readFileSync(path.join(__dirname, "../test/SocialNetworkTestEdges.csv"), "utf8");

  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/XS.network.json&pg=../test/COI/empty.json";
  await page.goto(url);

  // Wait for clusters to render in the main network
  await expect(page.locator(".cluster-group")).not.toHaveCount(0, { timeout: 30000 });

  // Load the social network data
  await page.evaluate(({ nodesCSV, edgesCSV }) => {
    const nodes = d3.csv.parse(nodesCSV);
    const edges = d3.csv.parse(edgesCSV);
    window.user_graph.load_nodes_edges(nodes, "Index", edges, "TestSocial");
  }, { nodesCSV, edgesCSV });

  // Go to Clusters tab
  await expect(page.locator("a[href='#trace-clusters']")).toBeVisible({ timeout: 30000 });
  await page.locator("a[href='#trace-clusters']").click();

  // Wait for cluster_table to be visible
  const clusterTable = page.locator("#cluster_table");
  await expect(clusterTable).toBeVisible({ timeout: 30000 });

  // Find the column header for "TestSocial network" and click it to sort descending
  const socialHeader = clusterTable.locator("thead th", { hasText: "TestSocial network" });
  await expect(socialHeader).toBeVisible();
  await socialHeader.click();

  // Wait 500ms
  await page.waitForTimeout(500);

  // Toggle sorting order
  await socialHeader.click();
  await page.waitForTimeout(500);
});






