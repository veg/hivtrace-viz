import * as d3 from "d3";
import _ from "underscore";

/**
 * Computes the adjacency list for each node in the network.
 * @param {Object} self - The HIVTxNetwork instance.
 */
export function compute_adjacency_list(self) {
  self.nodes.forEach((n) => {
    n.neighbors = d3.set();
  });

  self.edges.forEach((e) => {
    self.nodes[e.source].neighbors.add(e.target);
    self.nodes[e.target].neighbors.add(e.source);
  });
}

/**
 * Computes the local clustering coefficient for each node in the network.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} misc - Miscellaneous utility functions.
 */
export function compute_local_clustering_coefficients(self, misc) {
  compute_adjacency_list(self);

  self.nodes.forEach((n) => {
    _.defer((a_node) => {
      const neighborhood_size = a_node.neighbors.size();
      if (neighborhood_size < 2) {
        a_node.lcc = misc.undefined;
      } else if (neighborhood_size > 500) {
        a_node.lcc = misc.too_large;
      } else {
        // count triangles
        const neighborhood = a_node.neighbors.values();
        let counter = 0;
        for (let n1 = 0; n1 < neighborhood_size; n1 += 1) {
          for (let n2 = n1 + 1; n2 < neighborhood_size; n2 += 1) {
            if (self.nodes[neighborhood[n1]].neighbors.has(neighborhood[n2])) {
              counter++;
            }
          }
        }

        a_node.lcc = (2 * counter) / neighborhood_size / (neighborhood_size - 1);
      }
    }, n);
  });
}

/**
 * Retrieves a node object by its ID.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {string} id - The ID of the node to retrieve.
 * @returns {Object} The node object with the specified ID, or undefined if not found.
 */
export function get_node_by_id(self, id) {
  return self.nodes.filter((n) => n.id === id)[0];
}

/**
 * Computes local clustering coefficients using a web worker.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} misc - Miscellaneous utility functions.
 */
export function compute_local_clustering_coefficients_worker(self, misc) {
  var worker = new Worker("workers/lcc.js");

  worker.onmessage = function (event) {
    var nodes = event.data.Nodes;

    nodes.forEach((n) => {
      const node_to_update = get_node_by_id(self, n.id);
      node_to_update.lcc = n.lcc ? n.lcc : misc.undefined;
    });
  };

  var worker_obj = {};
  worker_obj["Nodes"] = self.nodes;
  worker_obj["Edges"] = self.edges;
  worker.postMessage(worker_obj);
}

/**
 * Estimates the cubic computational cost for a given cluster.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} c - The cluster object.
 * @returns {number} The estimated cubic computational cost.
 */
export function estimate_cubic_compute_cost(self, c) {
  compute_adjacency_list(self);
  return _.reduce(
    _.first(_.pluck(c.children, "degree").sort(d3.descending), 3),
    (memo, value) => memo * value,
    1
  );
}

/**
 * Computes the global clustering coefficient for each cluster in the network.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} misc - Miscellaneous utility functions.
 * @param {Function} cost_estimator - The cost estimator function.
 */
export function compute_global_clustering_coefficients(
  self,
  misc,
  cost_estimator
) {
  compute_adjacency_list(self);

  self.clusters.forEach((c) => {
    _.defer((a_cluster) => {
      const cluster_size = a_cluster.children.length;
      if (cluster_size < 3) {
        a_cluster.cc = misc.undefined;
      } else if (cost_estimator(a_cluster) >= 5000000) {
        a_cluster.cc = misc.too_large;
      } else {
        // pull out all the nodes that have this cluster id
        const member_nodes = [];

        var triads = 0;
        var triangles = 0;

        self.nodes.forEach((n, i) => {
          if (n.cluster === a_cluster.cluster_id) {
            member_nodes.push(i);
          }
        });
        member_nodes.forEach((node) => {
          const my_neighbors = self.nodes[node].neighbors
            .values()
            .map((d) => Number(d))
            .sort(d3.ascending);
          for (let n1 = 0; n1 < my_neighbors.length; n1 += 1) {
            for (let n2 = n1 + 1; n2 < my_neighbors.length; n2 += 1) {
              triads += 1;
              if (self.nodes[my_neighbors[n1]].neighbors.has(my_neighbors[n2])) {
                triangles += 1;
              }
            }
          }
        });

        a_cluster.cc = triangles / triads;
      }
    }, c);
  });
}

/**
 * Marks nodes with a specified property to indicate they are being processed.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {string} property - The property name to set on the nodes.
 * @param {Object} misc - Miscellaneous utility functions.
 */
export function mark_nodes_as_processing(self, property, misc) {
  self.nodes.forEach((n) => {
    n[property] = misc.processing;
  });
}

/**
 * Computes and displays various graph statistics.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} misc - Miscellaneous utility functions.
 * @param {Element} element - The DOM element that triggered the computation.
 */
export function compute_graph_stats(self, misc, element) {
  d3.select(element).classed("disabled", true).select("i").classed({
    "fa-calculator": false,
    "fa-cog": true,
    "fa-spin": true,
  });
  mark_nodes_as_processing(self, "lcc", misc);
  compute_local_clustering_coefficients_worker(self, misc);
  self.compute_global_clustering_coefficients();
  d3.select(element).remove();
}
