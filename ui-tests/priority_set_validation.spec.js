const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

test("priority set table matches reference", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/html/priority-sets-args.html?network=../test/COI/XAB.json&pg=../test/COI/empty.json&jr=alaska");

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the table to be visible
  await expect(page.locator("#priority_set_table")).toBeVisible({
    timeout: 30000,
  });

  // Wait for the table to have rows.
  const table = page.locator("#priority_set_table");
  await expect(table.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });

  // Extract table headers
  const headers = await table.locator("thead th").all();
  const headerTexts = [];
  for (const header of headers) {
    headerTexts.push((await header.innerText()).trim());
  }

  // Extract table data
  const rows = await table.locator("tbody tr").all();
  const tableData = [];

  for (const row of rows) {
    const cells = await row.locator("td").all();
    const rowData = {
      Type: (await cells[0].innerText()).trim(),
      Name: (await cells[1].innerText()).trim(),
      Modified_created: (await cells[2].innerText()).trim(),
      Method: (await cells[3].innerText()).trim(),
      Growth: (await cells[4].innerText()).trim(),
      Size: (await cells[5].innerText()).trim(),
      "Size (mine)": (await cells[6].innerText()).trim(),
      Priority: (await cells[7].innerText()).trim(),
      "DXs in last 12 mo.": (await cells[8].innerText()).trim(),
      Overlap: (await cells[9].innerText()).trim()
    };
    tableData.push(rowData);
  }

  // Load reference data
  const referencePath = path.join(
    __dirname,
    "data",
    "priority_set_reference_XAB.json"
  );

  if (!fs.existsSync(referencePath)) {
    fs.mkdirSync(path.dirname(referencePath), { recursive: true });
    fs.writeFileSync(referencePath, JSON.stringify(tableData, null, 2));
    console.log(`Reference file created at ${referencePath}. Please review it.`);
    return;
  }

  const referenceData = JSON.parse(fs.readFileSync(referencePath, "utf8"));

  // Sort both by Name to ensure deterministic comparison
  tableData.sort((a, b) => a.Name.localeCompare(b.Name));
  referenceData.sort((a, b) => a.Name.localeCompare(b.Name));

  try {
    expect(tableData).toEqual(referenceData);
  } catch (e) {
    console.log(
      "Actual Priority Set Table Data:",
      JSON.stringify(tableData, null, 2)
    );
    throw e;
  }
});
