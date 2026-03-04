import _ from "underscore";

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
