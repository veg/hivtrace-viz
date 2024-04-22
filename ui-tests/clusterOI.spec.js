const { test, expect } = require('@playwright/test');

let errors = [];

test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(msg.text());
      errors.push(msg.text());
    }
  })
});

test.afterEach(async ({ page }) => {
	expect(errors).toEqual([]);
});

test('clusterOI editor opens, can add nodes', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/priority-sets-args.html?network=ui-tests/data/network.json');

  await expect(page.locator("#priority-set-tab")).toBeVisible();
  await page.locator("#priority-set-tab").click();

  // jspanel should not be visible
  let jsPanels = await page.locator(".jsPanel").all();
  await expect(jsPanels).toHaveLength(0);

  await expect(page.locator("#trace-priority-sets")).toBeVisible();
  await expect(page.getByText("Create A Cluster of Interest", { exact: true })).toBeVisible();
  await page.getByText("Create A Cluster of Interest", { exact: true }).click();

  jsPanels = await page.locator(".jsPanel").all();
  await expect(jsPanels).toHaveLength(1);

  await page.locator('[data-hivtrace-ui-role="priority-panel-nodeids"]').fill("BMK384750US2015");
  await page.locator("#priority-panel-add-node").click();
  await page.locator('[data-hivtrace-ui-role="priority-panel-nodeids"]').fill("BMK385560US2007");
  await page.locator("#priority-panel-add-node").click();
  await expect(page.locator("#priority-panel-node-table")
    .filter({ has: page.getByText("BMK384750US2015") })
    .filter({ has: page.getByText("BMK385560US2007") }))
    .toBeVisible();
});