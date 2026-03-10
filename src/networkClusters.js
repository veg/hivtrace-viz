import _ from "underscore";
import { hivtrace_cluster_depthwise_traversal } from "./misc";

/**
 * @function get_all_clusters
 * @description Groups nodes by their cluster ID.
 * @param {Array<Object>} nodes - An array of node objects.
 * @returns {Object} An object where keys are cluster IDs and values are arrays of nodes.
 */
export function get_all_clusters(nodes) {
  var by_cluster = _.groupBy(nodes, "cluster");
  return by_cluster;
}

/**
 * @function compute_cluster_centroids
 * @description Computes the centroids of clusters based on the positions of their children nodes.
 * @param {Object} clusters - An array or object containing cluster data.
 * @returns {void}
 */
export function compute_cluster_centroids(clusters) {
  for (var c in clusters) {
    var cls = clusters[c];
    cls.x = 0;
    cls.y = 0;
    if (_.has(cls, "children")) {
      cls.children.forEach((x) => {
        cls.x += x.x;
        cls.y += x.y;
      });
      cls.x /= cls.children.length;
      cls.y /= cls.children.length;
    }
  }
}

/**
 * @function collapse_cluster
 * @description Collapses a cluster, hiding its children nodes.
 * @param {Object} self - The network object.
 * @param {Object} x - The cluster object to collapse.
 * @param {boolean} keep_in_q - If true, keeps the cluster in the open cluster queue.
 * @returns {number} The number of children in the collapsed cluster.
 */
export function collapse_cluster(self, x, keep_in_q) {
  self.needs_an_update = true;
  x.collapsed = true;
  self.currently_displayed_objects -= self.cluster_sizes[x.cluster_id - 1] - 1;
  if (!keep_in_q) {
    var idx = self.open_cluster_queue.indexOf(x.cluster_id);
    if (idx >= 0) {
      self.open_cluster_queue.splice(idx, 1);
    }
  }
  compute_cluster_centroids([x]);
  return x.children.length;
}

/**
 * @function expand_cluster
 * @description Expands a cluster, showing its children nodes.
 * @param {Object} self - The network object.
 * @param {Object} x - The cluster object to expand.
 * @param {boolean} copy_coord - If true, copies coordinates from the parent cluster to the children.
 * @returns {void}
 */
export function expand_cluster(self, x, copy_coord) {
  self.needs_an_update = true;
  x.collapsed = false;
  self.currently_displayed_objects += self.cluster_sizes[x.cluster_id - 1] - 1;
  self.open_cluster_queue.push(x.cluster_id);

  if (copy_coord) {
    x.children.forEach((n) => {
      n.x = x.x + (Math.random() - 0.5) * x.children.length;
      n.y = x.y + (Math.random() - 0.5) * x.children.length;
    });
  } else {
    x.children.forEach((n) => {
      n.x = self.width * 0.25 + (Math.random() - 0.5) * x.children.length;
      n.y = 0.25 * self.height + (Math.random() - 0.5) * x.children.length;
    });
  }
}

/**
 * @function expand_some_clusters
 * @description Expands a given subset of clusters, or all clusters if no subset is provided.
 * @param {Object} self - The network object.
 * @param {Array<Object>} [subset] - An array of cluster objects to expand.
 * @returns {void}
 */
export function expand_some_clusters(self, subset) {
  subset = subset || self.clusters;
  subset.forEach((x) => {
    if (!x.is_hidden) {
      self.dispatch["cluster:expand"](x);
    }
  });
  self.update();
}

/**
 * @function select_some_clusters
 * @description Selects a subset of clusters based on a given condition.
 * @param {Object} self - The network object.
 * @param {Function} condition - A function that returns true for clusters that should be selected.
 * @returns {Array<Object>} An array of selected cluster objects.
 */
export function select_some_clusters(self, condition) {
  return self.clusters.filter((c, i) =>
    _.some(c.children, (n) => condition(n))
  );
}

/**
 * @function collapse_some_clusters
 * @description Collapses a given subset of clusters, or all clusters if no subset is provided.
 * @param {Object} self - The network object.
 * @param {Array<Object>} [subset] - An array of cluster objects to collapse.
 * @returns {void}
 */
export function collapse_some_clusters(self, subset) {
  subset = subset || self.clusters;
  subset.forEach((x) => {
    if (!x.collapsed) self.collapse_cluster(x);
  });
  self.update();
}

/**
 * @function update_clusters_with_injected_nodes
 * @description Updates clusters with injected nodes from a social network.
 * @param {Object} self - The network object.
 * @param {Function} node_filter - A function to filter nodes.
 * @param {Function} edge_filter - A function to filter edges.
 * @param {string} annotation - An annotation for the injected nodes.
 * @returns {Array<Object>} An array of recomputed clusters.
 */
export function update_clusters_with_injected_nodes(
  self,
  node_filter,
  edge_filter,
  annotation
) {
  let recomputed_clusters;

  try {
    node_filter =
      node_filter ||
      function () {
        return true;
      };
    edge_filter =
      edge_filter ||
      function () {
        return true;
      };

    recomputed_clusters = hivtrace_cluster_depthwise_traversal(
      _.filter(self.json.Nodes, node_filter),
      self.json.Edges,
      null,
      false
    );

    _.each(recomputed_clusters, (c) => {
      var cluster_ids = {};
      var injected_count = 0;

      _.each(c, (n) => {
        cluster_ids[n.cluster] = 1;
        injected_count += n.cluster ? 0 : 1;
      });

      // count how many "injected" nodes are there in the new cluster

      if (injected_count) {
        delete cluster_ids[undefined];
      }

      _.each(c, (n) => {
        if ("extended_cluster" in n) {
          _.extend(n["extended_cluster"], cluster_ids);
        } else {
          n["extended_cluster"] = cluster_ids;
        }
      });

      _.each(cluster_ids, (c, k) => {
        var existing_cluster = self.clusters[self.cluster_mapping[k]];
        if (existing_cluster) {
          if (!existing_cluster.injected) {
            existing_cluster.injected = {};
          }
          existing_cluster.injected[annotation] = injected_count;
          if ("linked_clusters" in existing_cluster) {
            _.extend(existing_cluster["linked_clusters"], cluster_ids);
          } else {
            existing_cluster["linked_clusters"] = cluster_ids;
          }
        }
      });
    });
  } catch (err) {
    console.log(err);
    throw err;
  }

  return recomputed_clusters;
}
