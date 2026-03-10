import * as NetworkNodeInteraction from "./networkNodeInteraction";
import * as Tooltips from "./networkTooltips";
import * as NetworkClusters from "./networkClusters";
import * as network from "./network";

/**
 * @function registerNetworkEvents
 * @description Registers event listeners on the network dispatcher.
 * @param {Object} self - The network object.
 * @param {Object} clustersOfInterest - The COI module.
 * @param {Function} i18n - Translation function.
 * @returns {void}
 */
export function registerNetworkEvents(self, clustersOfInterest, i18n) {
  self.dispatch.on("node_click", (node) => {
    NetworkNodeInteraction.handle_node_click(
      node,
      self,
      clustersOfInterest,
      i18n
    );
  });

  self.dispatch.on("cluster_click", (cluster) => {
    network.handle_cluster_click(self, cluster);
  });

  self.dispatch.on("node_pop_on", (node, element) => {
    NetworkNodeInteraction.node_pop_on(self, node, element);
  });

  self.dispatch.on("node_pop_off", (element) => {
    NetworkNodeInteraction.node_pop_off(element);
  });

  self.dispatch.on("edge_pop_on", (edge, element) => {
    NetworkNodeInteraction.edge_pop_on(self, edge, element);
  });

  self.dispatch.on("edge_pop_off", (element) => {
    NetworkNodeInteraction.edge_pop_off(element);
  });

  self.dispatch.on("cluster_expand", (d) => {
    if (d.collapsed) {
      var new_nodes = self.cluster_sizes[d.cluster_id - 1] - 1;

      if (new_nodes > self.max_points_to_render) {
        self.warning_string = "This cluster is too large to be displayed";
      } else {
        var leftover =
          new_nodes +
          self.currently_displayed_objects -
          self.max_points_to_render;
        if (leftover > 0) {
          var k = 0;
          for (; k < self.open_cluster_queue.length && leftover > 0; k++) {
            var cluster =
              self.clusters[self.cluster_mapping[self.open_cluster_queue[k]]];
            leftover -= cluster.children.length - 1;
            self.collapse_cluster(cluster, true);
          }
          if (k || self.open_cluster_queue.length) {
            self.open_cluster_queue.splice(0, k);
          }
        }

        if (leftover <= 0) {
          self.expand_cluster(d, true);
        }
      }

      self.update(false, 0.6);
    }
  });

  self.dispatch.on("cluster_collapse", (d) => {
    self.collapse_cluster(self.clusters[self.cluster_mapping[d.cluster]]);
    self.update(false, 0.4);
  });

  self.dispatch.on("cluster_pop_on", (cluster, element) => {
    NetworkNodeInteraction.cluster_pop_on(self, cluster, element);
  });

  self.dispatch.on("cluster_pop_off", (element) => {
    NetworkNodeInteraction.cluster_pop_off(element);
  });
}
