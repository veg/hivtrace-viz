const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

test("priority subclusters export to JSON matches reference", async ({ page }) => {
  const url = "http://127.0.0.1:8080/html/priority-sets-args.html?network=../test/COI/XV.json&pg=../test/COI/2023-12-30.json&jr=montana";
  await page.goto(url);

  // Wait for the priority set tab and click it
  await expect(page.locator("#priority-set-tab")).toBeVisible({ timeout: 30000 });
  await expect(page.locator("#priority-set-tab")).not.toHaveClass(/disabled/, { timeout: 30000 });
  await page.locator("#priority-set-tab").click();

  // Wait for the priority set table to have data
  const priorityTable = page.locator("#priority_set_table");
  await expect(priorityTable.locator("tbody tr")).not.toHaveCount(0, { timeout: 30000 });

  // Locate the export button
  const exportButton = page.locator('button[data-hivtrace-ui-role="priority-subclusters-export"]');
  await expect(exportButton).toBeVisible();

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  // Save the downloaded file to a temporary location
  const downloadPath = await download.path();
  
  // Read and parse the downloaded JSON data
  const downloadedData = JSON.parse(fs.readFileSync(downloadPath, "utf-8"));

  // Load reference data
  const referencePath = path.join(__dirname, "data", "priority_export_reference.json");
  
  if (!fs.existsSync(referencePath)) {
    fs.mkdirSync(path.dirname(referencePath), { recursive: true });
    fs.writeFileSync(referencePath, JSON.stringify(downloadedData, null, 2));
    console.log(`Reference file created at ${referencePath}. Please review it.`);
    return;
  }

  const referenceData = JSON.parse(fs.readFileSync(referencePath, "utf-8"));
  
  // Custom matcher to handle date field in history array
  const compareData = (actual, expected) => {
    if (Array.isArray(actual) && Array.isArray(expected)) {
        expect(actual.length).toEqual(expected.length);
        for (let i = 0; i < actual.length; i++) {
            compareData(actual[i], expected[i]);
        }
    } else if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
        for (const key in expected) {
            if (key === 'history' && Array.isArray(actual[key])) {
                expect(Array.isArray(expected[key])).toBeTruthy();
                expect(actual[key].length).toEqual(expected[key].length);
                actual[key].forEach((item, idx) => {
                    expect(item).toHaveProperty('date');
                    // Recursively compare other properties in history, excluding 'date'
                    const { date: actualDate, ...actualRest } = item;
                    const { date: expectedDate, ...expectedRest } = expected[key][idx];
                    expect(actualRest).toEqual(expectedRest);
                });
            } else {
                compareData(actual[key], expected[key]);
            }
        }
    } else {
        expect(actual).toEqual(expected);
    }
  };

  try {
    compareData(downloadedData, referenceData);
  } catch (e) {
    console.log("Actual Exported Data:", JSON.stringify(downloadedData, null, 2));
    throw e;
  } finally {
      // Cleanup
      if (fs.existsSync(downloadPath)) {
          fs.unlinkSync(downloadPath);
      }
  }
});
