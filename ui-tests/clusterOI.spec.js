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

  await page.goto('http://127.0.0.1:8080/html/priority-sets-args.html?network=../ui-tests/data/network.json');
});

test.afterEach(async ({ page }) => {
  expect(errors).toEqual([]);
});

/**
 * Returns a function that accepts a dialog and conditionally dismisses it
 * @param {*} message message that the dialog should contain to be dismissed
 * @returns function that accepts a dialog and dismisses it if the message matches
 */
const getAcceptDialogFunction = (message) => {
  return async (dialog) => {
    if (dialog.message().includes(message)) {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
  }
}

const openEditor = async (page) => {
  // go to clusterOI tab
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
}

const createCluster = async (page, nodes, editorOpen = false) => {
  if (!editorOpen) {
    await openEditor(page);
  }

  for (const node of nodes) {
    await page.locator('[data-hivtrace-ui-role="priority-panel-nodeids"]').fill(node);
    await page.locator("#priority-panel-add-node").click();
  }

  let nodeTable = await page.locator("#priority-panel-node-table");

  for (const node of nodes) {
    nodeTable = nodeTable.filter({ has: page.getByText(node) });
  }

  await expect(nodeTable).toBeVisible();
}

const previewClusterOI = async (page) => {
  await page.locator("#priority-panel-preview").click();
  await expect(page.locator(".subcluster-view")
    .filter({ has: page.getByText('Color: Cluster of Interest Status', { exact: true }) }))
    .toBeVisible();
}

/**
 * Assumes that the clusterOI editor is open
 * Assumes that the clusterOI editor has nodes
 * Assumes that a current clusterOI does not have the same name
 */
const saveClusterOI = async (page, name, expectDialog = false, newCluster = true) => {
  await page.locator("#priority-panel-save").click();
  if (newCluster) {
    // user gets prompted to enter cluster name
    await expect(page.locator(".has-error")).toBeVisible();
    await page.locator('[data-hivtrace-ui-role="priority-panel-name"]').fill(name);
  }

  if (expectDialog) {
    const acceptDialog = getAcceptDialogFunction("This cluster of interest does not include all the nodes in the current");
    await page.on('dialog', acceptDialog);
    await page.locator("#priority-panel-save").click();
    await page.off('dialog', acceptDialog);
  } else {
    await page.locator("#priority-panel-save").click();
  }

  await expect(page.locator(".has-error")).toHaveCount(0);

  // jspanel should not be visible
  let jsPanels = await page.locator(".jsPanel").all();
  await expect(jsPanels).toHaveLength(0);

  await page.locator("#priority-set-tab").click();

  await expect(page.locator("#priority_set_table")
    .filter({ has: page.getByText(name) }))
    .toBeVisible();
};

const deleteClusterOI = async (page, name) => {
  await page.locator("#priority_set_table")
    .filter({ has: page.getByText(name) })
    .first()
    .locator(".view-edit-cluster")
    .first()
    .click();

  const acceptDialog = getAcceptDialogFunction("This action cannot be undone. Proceed?")
  await page.on('dialog', acceptDialog);
  await page.getByText("Delete this cluster of interest", { exact: true }).first().click();
  await page.off('dialog', acceptDialog);

  await expect(await page.locator("#priority_set_table")
    .filter({ has: page.getByText(name) }))
    .toHaveCount(0);
}

test('clusterOI editor opens, can add nodes', async ({ page }) => {
  // these specific nodes cause a confirm to appear when trying to save the clusterOI  
  await createCluster(page, ["BMK384750US2015", "BMK385560US2007"]);
  await saveClusterOI(page, "Cluster 1", true);
});

test('preview cluster and then open clusterOI editor', async ({ page }) => {
  await page.locator(".cluster-group").first().click();
  await page.getByText("Show this cluster in separate tab", { exact: true }).click();
  await expect(page.locator("#top_level_tab_container")
    .filter({ has: page.getByText("Cluster 1") }))
    .toBeVisible();

  await createCluster(page, ["BMK384750US2015"]);

  await previewClusterOI(page)
});

test('add nodes via graph to clusterOI editor and save', async ({ page }) => {
  await openEditor(page);

  await page.locator("#trace-default-tab").click();
  await page.locator(".cluster-group").first().click();
  await page.getByText("Add this cluster to the cluster of interest", { exact: true }).click();

  // check that the nodes are added, empty clusterOI text shouldn't exist 
  await expect(page.getByText("clusterOI editor (0 nodes)")).toHaveCount(0);

  await previewClusterOI(page);

  await saveClusterOI(page, "Cluster 1");
});

test('add nodes via graph to clusterOI editor, save, clone clusterOI, save, and delete all', async ({ page }) => {
  // add nodes via graph to clusterOI editor and save
  await openEditor(page);

  await page.locator("#trace-default-tab").click();
  await page.locator(".cluster-group").first().click();
  await page.getByText("Add this cluster to the cluster of interest", { exact: true }).click();

  await previewClusterOI(page);

  await saveClusterOI(page, "Cluster 1");

  // clone clusterOI and save
  await page.locator(".view-edit-cluster").first().click();
  await page.getByText("Clone this cluster of interest in a new editor panel", { exact: true }).click();

  const jsPanels = await page.locator(".jsPanel").all();
  await expect(jsPanels).toHaveLength(1);

  await createCluster(page, ["01_AEMK272426TH2015"], true);

  await saveClusterOI(page, "Cluster 2", true);

  await expect(await page.locator("#priority_set_table")
    .filter({ has: page.getByText("Cluster 1") })
    .filter({ has: page.getByText("Cluster 2") }))
    .toBeVisible();

  // delete clusters, accept confirmation dialog
  await deleteClusterOI(page, "Cluster 1");

  await expect(await page.locator("#priority_set_table")
    .filter({ has: page.getByText("Cluster 2") }))
    .toHaveCount(1);

  // delete the last cluster
  await deleteClusterOI(page, "Cluster 2");

  await expect(await page.locator("#priority_set_table tbody tr"))
    .toHaveCount(0);
})

test('create clusterOI and save, then view history', async ({ page }) => {
  await openEditor(page);

  await page.locator("#trace-default-tab").click();
  await page.locator(".cluster-group").first().click();
  await page.getByText("Add this cluster to the cluster of interest", { exact: true }).click();

  // check that the nodes are added, empty clusterOI text shouldn't exist 
  await expect(page.getByText("clusterOI editor (0 nodes)")).toHaveCount(0);

  await previewClusterOI(page);

  await saveClusterOI(page, "Cluster 1");

  // view history
  await page.locator(".view-edit-cluster").first().click();
  await page.getByText("View history over time", { exact: true }).click();

  await expect(page.getByText("History of Cluster 1")).toBeVisible();

  await expect(page.locator("div.tab-pane.active")
    .filter({ has: page.locator("svg") }) // history over time graph
    .filter({ has: page.getByText("BMK383478US2007") })
    .filter({ has: page.getByText("BMK383725US2014") }))
    .toBeVisible();
})

test('create clusterOI, view nodes list, edit, and view nodes list again', async ({ page }) => {
  await openEditor(page);

  await page.locator("#trace-default-tab").click();
  await page.locator(".cluster-group").first().click();
  await page.getByText("Add this cluster to the cluster of interest", { exact: true }).click();

  // check that the nodes are added, empty clusterOI text shouldn't exist 
  await expect(page.getByText("clusterOI editor (0 nodes)")).toHaveCount(0);

  await previewClusterOI(page);

  await saveClusterOI(page, "Cluster 1");

  // view nodes list
  await page.locator(".view-edit-cluster").first().click();
  await page.getByText("View nodes in this cluster of interest", { exact: true }).click();

  await page.locator("[data-hivtrace-ui-role='cluster_list_view_toggle']").click();
  await expect(page.locator("[data-hivtrace-ui-role='cluster_list_body']")
    .filter({ has: page.getByText("BMK384750US2015") }))
    .toBeVisible();

  await expect(page.getByText("BMK384750US2015")).toHaveCount(3); // Two in the node view, one hidden in the nodes table

  // edit nodes
  await page.locator("[data-hivtrace-ui-role='cluster_list_body']").getByText("Dismiss", { exact: true }).click();
  await page.locator(".view-edit-cluster").first().click();
  await page.getByText("Modify this cluster of interest", { exact: true }).click();

  await page.locator("#priority-panel-node-table")
    .locator("tr")
    .filter({ has: page.getByText("BMK384750US2015") })
    .locator("i.fa.fa-trash")
    .click();

  // TODO: determine why the page is sometimes getting redirected (never happens during manual testing)
  // wait two seconds because of unpredictable delete button page redirection behavior  
  await page.waitForTimeout(2000);

  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.locator(".jsPanel")
    .first()
    .filter({ has: page.getByText("BMK384750US2015") }))
    .toHaveCount(0);

  await expect(page.locator(".jsPanel")
    .first()
    .filter({ has: page.getByText("BMK384168US2005") }))
    .toHaveCount(1);

  await saveClusterOI(page, "Cluster 1", false, false);

  // expect node size to be 42
  await expect(page.locator("#priority_set_table")
    .filter({ has: page.getByText("Cluster 1") })
    .filter({ has: page.getByText("42") }))
    .toBeVisible();

  // view nodes list again and check that the node is not there
  await page.locator(".view-edit-cluster").first().click();
  await page.getByText("View nodes in this cluster of interest", { exact: true }).click();

  await expect(page.locator("[data-hivtrace-ui-role='cluster_list_body']")
    .filter({ has: page.getByText("BMK384750US2015") }))
    .toHaveCount(0);

  await expect(page.getByText("BMK384750US2015")).toHaveCount(1); // Only the one hidden in the nodes table
  await expect(page.getByText("BMK384168US2005")).toHaveCount(3); // Two in the node view, one hidden in the nodes table
})