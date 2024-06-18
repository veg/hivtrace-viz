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

test("node table sorting and filtering works", async ({ page }) => {
  // sorting
  await page.goto(
    "http://localhost:8080/html/priority-sets-args.html?network=../ui-tests/data/network.json"
  );
  await expect(page.locator("#nodes-tab")).toBeVisible();
  await page.locator("#nodes-tab").click();

  await page.locator("#hivtrace_node_column_hiv_aids_dx_dt_3").click();
  await page
    .locator("[aria-labelledby='hivtrace_node_column_hiv_aids_dx_dt_3']")
    .locator("li a")
    .getByText("age_dx")
    .click();
  await page
    .locator("#node_table")
    .locator("tbody tr")
    .nth(3)
    .filter({ has: page.getByText("BMK384244US2007") })
    .filter({ has: page.getByText("87") })
    .filter({ has: page.getByText("Asian") });

  await page
    .locator("[title='age_dx']")
    .locator("[data-column-id='3']")
    .click();
  await page
    .locator("#node_table")
    .locator("tbody tr")
    .nth(3)
    .filter({ has: page.getByText("BMK385331US2015") })
    .filter({ has: page.getByText("13-19") })
    .filter({ has: page.getByText("American Indian/Alaska Native") });

  await page
    .locator("[title='age_dx']")
    .locator("[data-column-id='3']")
    .click();
  await expect(
    page.locator("#trace-nodes").locator(".fa-sort-amount-desc")
  ).toHaveCount(1);
  await page
    .locator("#node_table")
    .locator("tbody tr")
    .nth(3)
    .filter({ has: page.getByText("BMN090524US2018") })
    .filter({ has: page.getByText("60") })
    .filter({ has: page.getByText("Hispanic/Latino") });

  await page.locator("#hivtrace_node_column_age_dx_3").click();
  await page
    .locator("[aria-labelledby='hivtrace_node_column_age_dx_3']")
    .locator("li a")
    .getByText("hiv_aids_dx_dt")
    .click();
  await page
    .locator("[title='Node ID']")
    .locator("[data-column-id='0']")
    .click();
  await page
    .locator("#node_table")
    .locator("tbody tr")
    .nth(3)
    .filter({ has: page.getByText("-MN467202US2016") })
    .filter({ has: page.getByText("Heterosexual Contact-Male") })
    .filter({ has: page.getByText("2022-04-15") });

  await expect(
    page.locator("#trace-nodes").locator(".fa-sort-amount-desc")
  ).toHaveCount(0);
  await expect(
    page.locator("#trace-nodes").locator(".fa-sort-amount-asc")
  ).toHaveCount(1);

  // filtering
  await page
    .locator("#trace-nodes thead")
    .locator("[title='hiv_aids_dx_dt']")
    .locator("a")
    .filter({
      has: page.locator(".fa-search"),
    })
    .click();
  // wait because fill doesn't work immediately
  await page.waitForTimeout(500);
  await page
    .locator("[data-hivtrace-ui-role='table-filter-term']")
    .fill("20220101:20220201");
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await expect(
    page
      .locator("#node_table")
      .locator("tbody tr")
      .locator("visible=true")
      .filter({
        has: page.getByText("2022-04-15"),
      })
  ).toHaveCount(0);

  await page.locator('[data-hivtrace-ui-role="table-filter-reset"]').click();
  await expect(
    await page
      .locator("#node_table")
      .locator("tbody tr")
      .locator("visible=true")
      .filter({
        has: page.getByText("2022-04-15"),
      })
      .count()
  ).toBeGreaterThan(0);
});
