const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

test("priority set table for Montana matches reference", async ({ page }) => {
  const url = "http://localhost:8080/html/priority-sets-args.html?network=../test/COI/XV.json&pg=../test/COI/2023-12-30.json&jr=montana";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#priority-set-tab")).not.toHaveClass(/disabled/, { timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the table to be visible
  await expect(page.locator("#priority_set_table")).toBeVisible({ timeout: 30000 });
  
  // Wait for the table to have rows. 
  const table = page.locator("#priority_set_table");
  await expect(table.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });

  const tableData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#priority_set_table tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      // Helper to clean text: normalize whitespace and replace non-breaking spaces (\u00a0)
      const clean = (el) => el ? el.innerText.replace(/\s+/g, ' ').trim() : "";
      
      // Using MJC (Montana) mapping based on your previous XAB feedback
      return {
          type: clean(cells[0]),
          name: clean(cells[1]),
          modifiedCreated: clean(cells[2]),
          method: clean(cells[3]),
          growth: clean(cells[4]),
          sizeTotal: clean(cells[5]),
          sizeMine: clean(cells[6]),
          priority: clean(cells[7]),
          dxLast12Mo: clean(cells[8]),
          overlap: clean(cells[9])
      };
    });
  });

  const referencePath = path.join(__dirname, "data", "priority_set_reference_XV_Montana.json");
  
  if (!fs.existsSync(referencePath)) {
    fs.mkdirSync(path.dirname(referencePath), { recursive: true });
    fs.writeFileSync(referencePath, JSON.stringify(tableData, null, 2));
    console.log(`Reference file created at ${referencePath}. Please review it.`);
    return;
  }

  const referenceData = JSON.parse(fs.readFileSync(referencePath, "utf-8"));
  
  try {
    expect(tableData).toEqual(referenceData);
  } catch (e) {
    console.log("Actual Table Data (Montana):", JSON.stringify(tableData, null, 2));
    throw e;
  }
});
