// @ts-check
const { test, expect } = require('@playwright/test');

let errors = [];

test.beforeEach(({ page }) => {
  errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {

      errors.push(msg.text());
    }
  })
  page.on("pageerror", (err) => {
    errors.push(err.message);
  })
});

test.afterEach(({ page }) => {
  expect(errors).toEqual([]);
});

test('network graph loaded', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/');

  await expect(page).toHaveTitle('HIV-TRACE');
  await expect(page.locator("#hiv-trace-network-svg")).toBeVisible();
});

test('network statistics loaded', async ({ page }) => {
  await page.goto('http://127.0.0.1:8080/');

  await expect(page.locator("#graph-tab")).toBeVisible();
  await page.locator("#graph-tab").click();
  await expect(page.locator("#trace-graph")).toBeVisible();
  await expect(page.getByText("Sequences used to make links")).toBeVisible();
  await expect(page.getByText("0.891%")).toBeVisible();
});