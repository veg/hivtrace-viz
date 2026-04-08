const { test, expect } = require("@playwright/test");
const path = require("path");

test("review cluster interaction and network svg generation", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/html/priority-sets-args.html?network=../test/COI/XAB.json&pg=../test/COI/empty.json&jr=alaska");

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#priority-set-tab")).not.toHaveClass(/disabled/, { timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the priority set table to have data
  const priorityTable = page.locator("#priority_set_table");
  await expect(priorityTable.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });

  const firstRow = priorityTable.locator("tbody tr").first();
  const reviewButton = firstRow.locator("td").nth(1).locator("button[title='Review and adjust this cluster of interest']");
  await reviewButton.click();

  // 2. Click the link containing the text "Open in a new tab"
  const openTabLink = page.locator("button", { hasText: "Preview @0.5%" });
  await expect(openTabLink).toBeVisible();
  await openTabLink.click();

  // 3. Find ul with id "network-ui-bar-nav-tabs"
  const tabContainer = page.locator("ul#top_level_tab_container");

  // 4. Check for an li element containing an a element with text "clusterOI AK_202509_1.13"
  // 5. Get the ID of this li element (LID)
  const liElement = tabContainer.locator('li', { has: page.locator('a', { hasText: "clusterOI AK_202509_1.13" }) });
  let LID = await liElement.getAttribute("id");
  expect(LID).toBeTruthy();
  
  // Strip '_tab' suffix if present
  LID = LID.replace(/_tab$/, "");

  // 6. Check for an svg with the id of LID+"-network-svg"
  const svgId = `${LID}-network-svg`;
  const networkSvg = page.locator(`svg#${svgId}`);
  await expect(networkSvg).toBeAttached({ timeout: 30000 });
  await expect(networkSvg).toBeVisible({ timeout: 30000 });

  // 7. Click a node in the subnetwork and check if the context menu appears
  const firstNode = networkSvg.locator(".node").first();
  await expect(firstNode).toBeVisible();
  await firstNode.click();

  const contextMenu = page.locator(`.dropdown-menu#${LID}-context-menu`);
  await expect(contextMenu).toBeVisible({ timeout: 5000 });
});
