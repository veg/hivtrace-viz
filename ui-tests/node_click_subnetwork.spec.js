const { test, expect } = require("@playwright/test");

test("node click in subnetwork opens menu", async ({ page }) => {
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log("BROWSER ERROR:", msg.text());
      errors.push(msg.text());
    }
  });

  await page.goto("http://127.0.0.1:8080/html/priority-sets-args.html?network=../test/COI/XAB.json&pg=../test/COI/empty.json&jr=alaska");

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // 1. Open a subnetwork tab
  const priorityTable = page.locator("#priority_set_table");
  await expect(priorityTable.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });
  const firstRow = priorityTable.locator("tbody tr").first();
  const reviewButton = firstRow.locator("td").nth(1).locator("button[title='Review and adjust this cluster of interest']");
  await reviewButton.click();

  const openTabButton = page.locator("button", { hasText: "Preview @0.5%" });
  await expect(openTabButton).toBeVisible();
  await openTabButton.click();

  // 2. Wait for the SVG in the new tab
  const tabContainer = page.locator("ul#top_level_tab_container");
  const liElement = tabContainer.locator('li', { has: page.locator('a', { hasText: "clusterOI AK_202509_1.13" }) });
  let LID = await liElement.getAttribute("id");
  LID = LID.replace(/_tab$/, "");
  const svgId = `${LID}-network-svg`;
  const networkSvg = page.locator(`svg#${svgId}`);
  await expect(networkSvg).toBeVisible({ timeout: 30000 });

  // 3. Click a node in the subnetwork
  const firstNode = networkSvg.locator(".node").first();
  await expect(firstNode).toBeVisible();
  await firstNode.click();

  // 4. Check if the context menu appears
  const contextMenu = page.locator(".dropdown-menu#d3_context_menu_id");
  await expect(contextMenu).toBeVisible({ timeout: 5000 });
  
  expect(errors).toEqual([]);
});
