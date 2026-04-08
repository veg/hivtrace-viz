const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('subcluster table matches reference', async ({ page }) => {
  // Load the network with specific parameters to ensure subcluster table is populated
  await page.goto("http://127.0.0.1:8080/html/priority-sets-args.html?network=../test/COI/XAB.json&pg=../test/COI/empty.json&jr=alaska");
  
  // Wait for the subclusters tab and click it
  await expect(page.locator("#subclusters-tab")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#subclusters-tab")).not.toHaveClass(/disabled/, { timeout: 30000 });
  await page.locator("#subclusters-tab").click();
  
  // Wait for the table to have rows. 
  const table = page.locator("#subcluster_table");
  await expect(table.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });

  // Extract table data in one go
  const tableData = await table.evaluate((node) => {
    const rows = Array.from(node.querySelectorAll("tbody tr"));
    return rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const clean = (el) => {
        if (!el) return "";
        let text = el.innerText || el.textContent;
        if (!text || text.trim() === "undefined") return "";
        return text.replace(/\s+/g, " ").trim();
      };
      return {
        "Subcluster ID": clean (cells[0]),
        "Attributes": clean (cells[1]),
        "Size": clean (cells[2]),
        "Cases dx within 36 months": clean (cells[3]),
        "Cases dx within 12 months": clean (cells[4])
      };
    });
  });

  // Load reference data
  const referencePath = path.join(__dirname, 'data', 'subcluster_reference_XAB.json');

  if (!fs.existsSync(referencePath)) {
    fs.mkdirSync(path.dirname(referencePath), { recursive: true });
    fs.writeFileSync(referencePath, JSON.stringify(tableData, null, 2));
    console.log(`Reference file created at ${referencePath}. Please review it.`);
    return;
  }

  const referenceData = JSON.parse(fs.readFileSync(referencePath, 'utf8'));

  // Sort both by Subcluster ID to ensure deterministic comparison
  tableData.sort((a, b) => a["Subcluster ID"].localeCompare(b["Subcluster ID"], undefined, {numeric: true}));
  referenceData.sort((a, b) => a["Subcluster ID"].localeCompare(b["Subcluster ID"], undefined, {numeric: true}));
  
  try {
    expect(tableData).toEqual(referenceData);
  } catch (e) {
    console.log("Actual Subcluster Table Data:", JSON.stringify(tableData, null, 2));
    throw e;
  }
});
