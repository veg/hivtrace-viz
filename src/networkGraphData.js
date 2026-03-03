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

  return graphMe;
}
