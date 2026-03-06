import _ from "underscore";

/**
 * @function compute_edge_pull
 * @description Computes the pull (curvature) for multiple edges between the same nodes.
 * @param {Array<Object>} edges - The edges to process.
 * @returns {void}
 */
export function compute_edge_pull(edges) {
  var edge_set = {};

  _.each(edges, (d) => {
    d.pull = 0.0;
    var tag;

    if (d.source < d.target) {
      tag = String(d.source) + "|" + d.target;
    } else {
      tag = String(d.target) + "|" + d.source;
    }
    if (tag in edge_set) {
      edge_set[tag].push(d);
    } else {
      edge_set[tag] = [d];
    }
  });

  _.each(edge_set, (v) => {
    if (v.length > 1) {
      var step = 1 / (v.length - 1);
      _.each(v, (edge, index) => {
        edge.pull = -0.5 + index * step;
      });
    }
  });
}

/**
 * @function prepare_data_to_graph
 * @description Prepares the graph data for rendering, filtering clusters and nodes.
 * @param {Object} self - The network object.
 * @returns {Object} An object containing prepared graph data (all, edges, nodes, clusters).
 */
export function prepare_data_to_graph(self) {
  var graphMe = {};
  graphMe.all = [];
  graphMe.edges = [];
  graphMe.nodes = [];
  graphMe.clusters = [];

  var expandedClusters = [];
  var drawnNodes = [];

  self.clusters.forEach((x) => {
    if (self.cluster_display_filter(x)) {
      // Check if hxb2_linked is in a child
      var hxb2_exists = x.children.some((c) => c.hxb2_linked) && self.hide_hxb2;
      if (!hxb2_exists) {
        if (x.collapsed) {
          graphMe.clusters.push(x);
          graphMe.all.push(x);
        } else {
          expandedClusters[x.cluster_id] = true;
        }
      }
    }
  });

  self.nodes.forEach((x, i) => {
    if (expandedClusters[x.cluster]) {
      drawnNodes[i] = graphMe.nodes.length + graphMe.clusters.length;
      graphMe.nodes.push(x);
      graphMe.all.push(x);
    }
  });

  self.edges.forEach((x) => {
    if (!(x.removed && self.filter_edges)) {
      if (
        drawnNodes[x.source] !== undefined &&
        drawnNodes[x.target] !== undefined
      ) {
        var y = {};
        for (var prop in x) {
          y[prop] = x[prop];
        }

        y.source = drawnNodes[x.source];
        y.target = drawnNodes[x.target];
        y.ref = x;
        graphMe.edges.push(y);
      }
    }
  });

  compute_edge_pull(graphMe.edges);

  return graphMe;
}
