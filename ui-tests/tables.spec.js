const { test, expect } = require("@playwright/test");

let errors = [];

test.beforeEach(({ page }) => {
  errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(msg.text());
      errors.push(msg.text());
    }
  });
});

test.afterEach(async ({ page }) => {
  expect(errors).toEqual([]);
});

test("cluster table loads and works", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/");

  await expect(page.locator("#clusters-tab")).toBeVisible();
  await page.locator("#clusters-tab").click();

  await expect(page.locator("#trace-clusters")).toBeVisible();
  await expect(
    page.getByText("Genotypes past 2 mo", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("0.0071 [0.0071, 0.0071 - 0.0071]")
  ).toBeVisible();

  await expect(page.locator('[data-cluster="5"]')).toBeVisible();
  await page.locator('[data-cluster="5"]').click();

  await expect(page.getByText("Listing nodes Cluster 5")).toBeVisible();
  await expect(page.getByText("GA00HHARS002054*").first()).toBeVisible();

  await expect(
    await page
      .locator(".dl-horizontal")
      .filter({ has: page.getByText("GA00HHARS002054*") })
      .count()
  ).toBeGreaterThan(1);

  await page
    .locator('[data-hivtrace-ui-role="cluster_list_view_toggle"]')
    .click();

  await expect(
    await page
      .locator(".dl-horizontal")
      .filter({ has: page.getByText("GA00HHARS002054*") })
      .count()
  ).toBe(1);
});

test("subclusters table loads and works", async ({ page }) => {
  await page.goto(
    "http://localhost:8080/html/priority-sets-args.html?network=../ui-tests/data/network.json"
  );

  await expect(page.locator("#subclusters-tab")).toBeVisible();
  await page.locator("#subclusters-tab").click();

  await expect(page.locator("#trace-subclusters")).toBeVisible();
  await expect(
    page.getByText("Cases dx within 12 months", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("109.1", { exact: true })).toBeVisible();

  await page.locator('[data-cluster="4.1"]').click();
  await expect(page.getByText("Listing nodes Cluster 4.1")).toBeVisible();
  await expect(page.getByText("BMN090749DE2018").first()).toBeVisible();
});

test("node table loads and works", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  await expect(page.locator("#nodes-tab")).toBeVisible();
  await page.locator("#nodes-tab").click();

  await expect(page.locator("#trace-nodes")).toBeVisible();
  await expect(page.getByText("# of links", { exact: true })).toBeVisible();
  await expect(page.getByText("GA01HAGUS002656*")).toBeVisible();

  await page.getByText("view cluster").first().click();
  await expect(page.getByText("Cluster 1")).toBeVisible();
  await expect(await page.locator("#hivtrace-export-image").count()).toBe(2);
  await expect(page.locator("#hivtrace-export-image").last()).toBeVisible();
});
