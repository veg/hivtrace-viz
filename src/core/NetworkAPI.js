const _ = require("underscore");
const $ = require("jquery");

/**
 * Handles remote sync and API interactions for network data.
 */

function priority_groups_update_node_sets(self, name, operation) {
  const coi_to_update = self.priority_groups_find_by_name(name);
  if (coi_to_update) {
    const sets = self.priority_groups_export([coi_to_update]);

    const to_post = {
      operation: operation,
      name: name,
      url: window.location.href,
      sets: JSON.stringify(sets),
    };

    if (self.priority_set_table_write && self.priority_set_table_writeable) {
      fetch(self.priority_set_table_write, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(to_post),
      }).catch((error) => {
        console.log("received fatal error:", error);
      });
    }
  }
}

function priority_groups_edit_set_description(
  self,
  clustersOfInterest,
  name,
  description,
  update_table
) {
  let pg_to_update = self.priority_groups_find_by_name(name);
  if (pg_to_update) {
    pg_to_update.description = description;

    // For MJC networks, use MJC-specific endpoint
    if (self.isMJCNetwork && self.mjcUUID) {
      const url = `/mjc/results/${
        self.mjcUUID
      }/clusteroi/${encodeURIComponent(name)}/description`;
      fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description }),
      }).catch((error) => {
        console.error("Error saving MJC ClusterOI description:", error);
      });
    } else {
      self.priority_groups_update_node_sets(name, "update");
    }

    if (update_table) {
      clustersOfInterest.draw_priority_set_table(self);
    }
  }
}

function priority_groups_remove_set(
  self,
  clustersOfInterest,
  name,
  update_table
) {
  if (self.defined_priority_groups) {
    const idx = _.findIndex(
      self.defined_priority_groups,
      (g) => g.name === name
    );

    if (idx >= 0) {
      self.priority_groups_update_node_sets(name, "delete");
      self.defined_priority_groups.splice(idx, 1);
      if (update_table) {
        clustersOfInterest.draw_priority_set_table(self);
      }
    }
  }
}

function fetch_priority_sets(url, callback) {
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw Error(`Failed loading cluster of interest file ${url}`);
      }
      return response.json();
    })
    .then((results) => callback(results))
    .catch((error) => {
      console.error(error);
    });
}

function load_priority_sets(
  self,
  clustersOfInterest,
  kGlobals,
  timeDateUtil,
  misc,
  url,
  is_writeable
) {
  fetch_priority_sets(url, (results) => {
    const stats = self.priority_groups_process_data(
      results,
      self._is_CDC_auto_mode,
      kGlobals,
      timeDateUtil,
      misc
    );

    self.priority_set_table_writeable = is_writeable === "writeable";

    const automatic_action_taken = stats.autocreated + stats.autoexpanded > 0;

    if (automatic_action_taken) {
      self.warning_string +=
        `<br/>Automatically created <b>${stats.autocreated}</b> and expanded <b>${stats.autoexpanded}</b> clusters of interest.` +
        (stats.pending > 0
          ? " <b>Please review <span id='banner_coi_counts'></span> clusters in the <code>Clusters of Interest</code> tab.</b><br>"
          : "");
      self.display_warning(self.warning_string, true);
    }

    const tab_pill = self.get_ui_element_selector_by_role(
      "priority_set_counts",
      true
    );

    if (!self.priority_set_table_writeable && !self.isMJCNetwork) {
      const rationale =
        is_writeable === "old"
          ? "the network is <b>older</b> than some of the Clusters of Interest"
          : "the network was ran in <b>standalone</b> mode so no data is stored";
      self.warning_string += `<p class="alert alert-danger"class="alert alert-danger">READ-ONLY mode for Clusters of Interest is enabled because ${rationale}. None of the changes to clustersOI made during this session will be recorded.</p>`;
      self.display_warning(self.warning_string, true);
      if (tab_pill) {
        $(tab_pill).text("Read-only");
      }
    } else if (tab_pill && stats.pending > 0) {
      $(tab_pill).text(stats.pending);
      $("#banner_coi_counts").text(stats.pending);
    }

    _.each(self.defined_priority_groups, (pg) => {
      if (pg.autocreated) {
        self.priority_groups_update_node_sets(pg.name, "insert");
      } else {
        self.priority_groups_update_node_sets(pg.name, "update");
      }
    });

    clustersOfInterest.draw_priority_set_table(self);
    if (
      self.showing_diff &&
      self.has_network_attribute("subcluster_or_priority_node")
    ) {
      self.handle_attribute_categorical("subcluster_or_priority_node");
    }
  });
}

function MJCloadOwnPrioritySets(self, options) {
  if (self.isMJCNetwork && options["own-priority-sets-url"]) {
    self.own_priority_set_url = options["own-priority-sets-url"];
    fetch_priority_sets(self.own_priority_set_url, (results) => {
      self.own_defined_priority_groups = results;
    });
  }
}

module.exports = {
  priority_groups_update_node_sets,
  priority_groups_edit_set_description,
  priority_groups_remove_set,
  fetch_priority_sets,
  load_priority_sets,
  MJCloadOwnPrioritySets,
};
