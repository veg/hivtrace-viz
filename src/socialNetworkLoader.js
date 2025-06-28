import _ from "underscore";
import * as d3 from "d3";
import * as HTX from "./hiv_tx_network.js";
import * as kGlobals from "./globals.js";
import * as misc from "./misc.js";
import * as clustersOfInterest from "./clustersOfInterest.js";
import * as tables from "./tables.js";
import * as timeDateUtil from "./timeDateUtil.js";
// import * as helpers from "./helpers.js"; // Not directly used in the moved functions, but good to keep if sub-functions might need it

/**
 * Injects attributes from a source object into a target node object.
 * Skips the attribute specified by `index_id`.
 * @param {Object} target - The node object to which attributes will be injected.
 * @param {Object} n_attr - An object containing attribute key-value pairs.
 * @param {string} index_id - The key in `n_attr` that represents the node's primary identifier and should be skipped.
 */
function handle_node_attributes_internal(target, n_attr, index_id) {
  _.each(n_attr, (attribute_value, attribute_key) => {
    if (attribute_key !== index_id) {
      HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
        target,
        attribute_key,
        attribute_value
      );
    }
  });
}

/**
 * Creates a new node, injects its attributes, and adds it to the network.
 * @param {Object} tx_network - The main HIVTrace network object.
 * @param {string} node_name - The ID/name of the new node.
 * @param {Object} n_attr - Attributes for the new node.
 * @param {string} index_id - The primary identifier key in `n_attr`.
 * @param {Object} node_name_2_id - A map from node name to its index in `tx_network.json.Nodes`.
 * @param {Array<Object>} new_nodes_array - An array to which the newly created node object will be pushed.
 * @param {string} annotation - Annotation string for the new node (e.g., "Social").
 */
function inject_new_node_internal(
  tx_network,
  node_name,
  n_attr,
  index_id,
  node_name_2_id,
  new_nodes_array,
  annotation,
  existing_entities
) {
  const new_node = {
    node_class: "injected",
    node_annotation: annotation,
    attributes: [],
    degree: 0,
  };
  new_node[kGlobals.network.NodeAttributeID] = {};
  new_node.id = node_name;
  handle_node_attributes_internal(new_node, n_attr, index_id);
  node_name_2_id[node_name] = tx_network.json.Nodes.length;
  tx_network.json.Nodes.push(new_node);
  new_nodes_array.push(new_node);

  // Record the primary ID of the added node in existing_entities
  const pk = tx_network.primary_key(new_node);
  if (pk in existing_entities) {
    existing_entities[pk].push(new_node);
  } else {
    existing_entities[pk] = [new_node];
  }
}

/**
 * Opens an exclusive tab view for a social network or a subset of it.
 * @param {Object} tx_network - The main HIVTrace network object.
 * @param {string|number} id - The cluster ID or identifier for the view.
 * @param {Function} node_filter - A function to filter nodes for this view.
 * @param {Array<string>} labeled_links - An array of link types to be labeled.
 * @param {Object<string, number>} shown_types - An object indicating which link types are shown (1 for shown).
 * @param {Function} title_fn - A function that takes `id` and returns the title string for the view.
 */
function social_view_handler_internal(
  tx_network,
  id,
  node_filter,
  labeled_links,
  shown_types,
  title_fn
) {
  tx_network.open_exclusive_tab_view(
    id,
    node_filter,
    title_fn, // title is a function here
    tx_network._social_view_options(labeled_links, shown_types),
    true
  );
}

/**
 * Handles the click event for buttons that display subclusters with injected (e.g., social) network data.
 * @param {Object} tx_network - The main HIVTrace network object.
 * @param {Object} payload - Data associated with the subcluster (e.g., a subcluster object from `tx_network.clusters[...].subclusters`).
 * @param {Function|null} edge_filter - An optional function to filter edges for the subcluster view.
 *                                      If null, a default filter for subclusters is used.
 * @param {Function|null} title_fn - An optional function to generate the title for the subcluster view.
 * @param {string} annotation - Annotation string (e.g., "Social").
 */
function injected_column_subcluster_button_handler_internal(
  tx_network,
  payload,
  edge_filter,
  title_fn,
  annotation
) {
  function edge_filter_for_subclusters(edge) {
    return (
      HTX.HIVTxNetwork.is_edge_injected(edge) ||
      edge.length <= tx_network.subcluster_threshold
    );
  }

  var subcluster_edges = [];

  var direct_links_only = misc.hivtrace_cluster_depthwise_traversal(
    tx_network.json.Nodes,
    tx_network.json.Edges,
    edge_filter || edge_filter_for_subclusters,
    subcluster_edges,
    payload.children
  );

  var labeled_links = {},
    shown_types = {};
  // Ensure subcluster_edges[0] exists and is an array before iterating
  if (subcluster_edges[0] && Array.isArray(subcluster_edges[0])) {
    _.each(subcluster_edges[0], (edge_event) => {
      if (edge_event.edge_type) {
        labeled_links[edge_event.edge_type] = 1;
        shown_types[edge_event.edge_type] = 1;
      }
    });
  }

  labeled_links = _.keys(labeled_links);
  labeled_links.sort();
  labeled_links.push("");
  shown_types[""] = 1;

  title_fn =
    title_fn ||
    function (id) {
      return "Subcluster " + payload.cluster_id + "[+ " + annotation + "]";
    };

  var cv = tx_network.view_subcluster(
    payload,
    direct_links_only[0],
    title_fn(payload.cluster_id), // Call title_fn to get the string title
    tx_network._social_view_options(labeled_links, shown_types),
    edge_filter_for_subclusters,
    true
  );
  cv._refresh_subcluster_view(
    tx_network.today || timeDateUtil.getCurrentDate()
  );
}

/**
 * Loads new nodes and edges (typically social network data) into the existing HIV transmission network.
 * It updates attributes of existing nodes, adds new nodes and edges, and refreshes UI components like tables.
 * @param {Object} tx_network - The main HIVTrace network object (`self` from clusternetwork.js).
 * @param {Array<Object>} nodes_and_attributes - An array of objects, where each object represents a node and its attributes.
 * @param {string} index_id - The attribute key in `nodes_and_attributes` that serves as the primary node identifier.
 * @param {Array<Object>} edges_and_attributes - An array of objects, where each object represents an edge and its attributes (e.g., "Index", "Partner", "Contact").
 * @param {string} [annotation_param="Social"] - An optional annotation string for the injected data.
 * @returns {{nodes: Array<Object>, existing_nodes: number, edges: Object<string, number>}}
 *           An object containing the list of newly added node objects, the count of existing nodes that were updated or involved, and a dictionary of edge types with their counts.
 */
export function load_nodes_edges(
  tx_network,
  nodes_and_attributes,
  index_id,
  edges_and_attributes,
  annotation_param
) {
  let annotation = annotation_param || "Social";

  var new_nodes = [];
  var edge_types_dict = {};
  var existing_nodes = 0;
  var existing_network_nodes = {};
  var node_name_2_id = {};
  var existing_entities = {};

  _.each(tx_network.json.Nodes, (n, i) => {
    existing_network_nodes[n.id] = n;
    const pk = tx_network.primary_key(n);
    if (pk in existing_entities) {
      existing_entities[pk].push(n);
    } else {
      existing_entities[pk] = [n];
    }
    node_name_2_id[n.id] = i;
  });

  if (nodes_and_attributes && nodes_and_attributes.length) {
    if (!(index_id in nodes_and_attributes[0])) {
      throw Error(
        index_id + " is not one of the attributes in the imported node records"
      );
    }

    _.each(nodes_and_attributes[0], (r, i) => {
      if (i !== index_id) {
        const attribute_definition = {
          label: i,
          type: "String",
          annotation: annotation,
        };
        tx_network.inject_attribute_description(i, attribute_definition);
      }
    });

    _.each(nodes_and_attributes, (n_attr) => {
      if (n_attr[index_id] in existing_network_nodes) {
        handle_node_attributes_internal(
          existing_network_nodes[n_attr[index_id]],
          n_attr,
          index_id
        );
        existing_nodes++;
      } else {
        const nk = tx_network.primary_key({ id: n_attr[index_id] });
        if (nk in existing_entities) {
          existing_nodes++;
        }
        inject_new_node_internal(
          tx_network,
          n_attr[index_id],
          n_attr,
          index_id,
          node_name_2_id,
          new_nodes,
          annotation,
          existing_entities
        );
      }
    });
  }

  if (edges_and_attributes && edges_and_attributes.length) {
    const auto_inject = !(nodes_and_attributes && nodes_and_attributes.length);

    let involved_existing_nodes = {};
    /**  Track existing nodes involved in new edges for auto_inject count
           For MSPP networks this will track sequence level entities
      */
    _.each(edges_and_attributes, (e_attr) => {
      try {
        if ("Index" in e_attr && "Partner" in e_attr && "Contact" in e_attr) {
          let attached_nodes = _.map(["Index", "Partner"], (d) => ({
            type: d,
            node: e_attr[d],
          }));

          _.each(attached_nodes, (n_info) => {
            if (n_info.node in node_name_2_id) {
              involved_existing_nodes[n_info.node] = true;
            } else if (auto_inject) {
              // node is not in node_name_2_id (i.e. not in the network yet)
              inject_new_node_internal(
                tx_network,
                n_info.node,
                [],
                index_id,
                node_name_2_id,
                new_nodes,
                annotation,
                existing_entities
              );
            } else {
              throw Error("Invalid node: " + n_info.node);
            }
          });

          edge_types_dict[e_attr["Contact"]] =
            (edge_types_dict[e_attr["Contact"]] || 0) + 1;

          if (tx_network.has_multiple_sequences) {
            // for MSPP sequences there we need to create edges between ALL existing sequences associated with a particular ID, which may not be in the existing network
            const pk_idx = tx_network.entity_id_from_string(e_attr["Index"]);
            const pk_partner = tx_network.entity_id_from_string(
              e_attr["Partner"]
            );

            _.each(existing_entities[pk_idx], (n_idx) => {
              _.each(existing_entities[pk_partner], (n_partner) => {
                var new_edge = {
                  source: node_name_2_id[n_idx.id],
                  target: node_name_2_id[n_partner.id],
                  edge_type: e_attr["Contact"],
                  length: 0.005,
                  directed: true,
                };
                tx_network.json.Edges.push(new_edge);
              });
            });
          } else {
            var new_edge = {
              source: node_name_2_id[e_attr["Index"]],
              target: node_name_2_id[e_attr["Partner"]],
              edge_type: e_attr["Contact"],
              length: 0.005,
              directed: true,
            };

            tx_network.json.Edges.push(new_edge);
          }
        } else {
          throw Error(
            "Missing required attribute (Index, Partner, or Contact)"
          );
        }
      } catch (err) {
        throw Error(
          "Invalid edge specification ( " + err + ") " + JSON.stringify(e_attr)
        );
      }
    });

    if (auto_inject) {
      existing_nodes = _.size(involved_existing_nodes);
    }

    tx_network._aux_populate_category_menus();

    tx_network.tabulate_multiple_sequences();

    tx_network.update_clusters_with_injected_nodes(null, null, annotation);

    if (!tx_network.extra_cluster_table_columns) {
      tx_network.extra_cluster_table_columns = [];
    }
    if (!tx_network.extra_subcluster_table_columns) {
      tx_network.extra_subcluster_table_columns = [];
    }

    var edge_types_by_cluster = {};
    _.each(tx_network.json.Edges, (e_edge) => {
      try {
        if (
          tx_network.json.Nodes[e_edge.source] &&
          tx_network.json.Nodes[e_edge.target]
        ) {
          var edge_clusters = _.union(
            _.keys(tx_network.json.Nodes[e_edge.source].extended_cluster),
            _.keys(tx_network.json.Nodes[e_edge.target].extended_cluster)
          );
          _.each(edge_clusters, (c) => {
            if (!(c in edge_types_by_cluster)) {
              edge_types_by_cluster[c] = {};
            }
            if (e_edge.edge_type) {
              edge_types_by_cluster[c][e_edge.edge_type] = 1;
            }
          });
        }
      } catch (err) {
        console.log("Error processing edge for cluster types:", err, e_edge);
      }
    });

    var edge_types_by_cluster_sorted = {};
    _.each(edge_types_by_cluster, (v, c) => {
      var my_keys = _.keys(v);
      my_keys.sort();
      edge_types_by_cluster_sorted[c] = my_keys;
    });

    var injected_column_subcluster = [
      {
        description: {
          value: annotation + " network",
          help: "View subclusters with " + annotation + " data",
        },
        generator: function (cluster) {
          // cluster here is a subcluster object from tx_network.clusters[...].subclusters
          return {
            value: cluster, // payload for the callback will be this subcluster object
            callback: function (element, payload) {
              var this_cell = d3.select(element);
              this_cell
                .append("button")
                .classed("btn btn-primary btn-xs pull-right", true)
                .style("margin-left", "1em")
                .text("Complete " + annotation)
                .on("click", (e_event) =>
                  injected_column_subcluster_button_handler_internal(
                    tx_network,
                    payload,
                    null,
                    null,
                    annotation
                  )
                );

              var node_ids = {};
              _.each(payload.children, (n) => {
                node_ids[n.id] = 1;
              });

              this_cell
                .append("button")
                .classed("btn btn-primary btn-xs pull-right", true)
                .text("Directly linked " + annotation)
                .on("click", (e_event) =>
                  injected_column_subcluster_button_handler_internal(
                    tx_network,
                    payload,
                    (edge) =>
                      tx_network.json.Nodes[edge.target].id in node_ids ||
                      tx_network.json.Nodes[edge.source].id in node_ids,
                    (id) =>
                      "Subcluster " +
                      payload.cluster_id +
                      "[+ direct  " +
                      annotation +
                      "]"
                  )
                );
            },
          };
        },
      },
    ];

    var injected_column = [
      {
        description: {
          value: annotation + " network",
          sort: function (c) {
            return c.value[0];
          },
          help: "Nodes added and clusters merged through " + annotation,
        },
        generator: function (cluster) {
          // cluster here is a main cluster object from tx_network.clusters
          return {
            value: [
              cluster.injected ? cluster.injected[annotation] : 0,
              cluster.linked_clusters,
              cluster.cluster_id,
            ],
            callback: function (element, payload) {
              var this_cell = d3.select(element);
              this_cell.text(
                Number(payload[0]) + " " + annotation + " nodes. "
              );
              var other_clusters = [];
              if (payload[1]) {
                other_clusters = _.without(_.keys(payload[1]), payload[2]);
                if (other_clusters.length) {
                  other_clusters.sort();
                  this_cell
                    .append("span")
                    .classed("label label-info", true)
                    .text("Bridges to " + other_clusters.length + " clusters")
                    .attr("title", other_clusters.join(", "));
                }
              }

              var labeled_links = _.clone(
                edge_types_by_cluster_sorted[payload[2]] || []
              );

              if (
                payload[0] > 0 ||
                other_clusters.length ||
                (edge_types_by_cluster_sorted[payload[2]] &&
                  labeled_links.length)
              ) {
                labeled_links.push("");

                var shown_types = {};
                _.each(labeled_links, (t) => {
                  shown_types[t] = 1;
                });

                this_cell
                  .append("button")
                  .classed("btn btn-primary btn-xs pull-right", true)
                  .text("Directly linked " + annotation)
                  .style("margin-left", "1em")
                  .on("click", (e_event) => {
                    var directly_linked_ids = {};
                    var node_ids = {};

                    _.each(cluster.children, (n) => {
                      // Use the 'cluster' from the generator's scope
                      node_ids[n.id] = 1;
                    });

                    var direct_links_only =
                      misc.hivtrace_cluster_depthwise_traversal(
                        tx_network.json.Nodes,
                        tx_network.json.Edges,
                        (edge) =>
                          tx_network.json.Nodes[edge.target].id in node_ids ||
                          tx_network.json.Nodes[edge.source].id in node_ids,
                        false,
                        cluster.children // Use the 'cluster' from the generator's scope
                      );

                    _.each(direct_links_only[0], (n) => {
                      directly_linked_ids[n.id] = true;
                    });

                    social_view_handler_internal(
                      tx_network,
                      payload[2], // cluster_id
                      (n) => n.id in directly_linked_ids,
                      labeled_links,
                      shown_types,
                      (id) => "Cluster " + id + "[+ direct " + annotation + "]"
                    );
                  });

                this_cell
                  .append("button")
                  .classed("btn btn-primary btn-xs pull-right", true)
                  .text("Complete " + annotation)
                  .on("click", (e_event) =>
                    social_view_handler_internal(
                      tx_network,
                      payload[2], // cluster_id
                      (n) =>
                        n.extended_cluster && payload[2] in n.extended_cluster,
                      labeled_links,
                      shown_types,
                      (id) => "Cluster " + id + "[+ " + annotation + "]",
                      annotation
                    )
                  );
              }
            },
          };
        },
      },
    ];

    if (tx_network.extra_cluster_table_columns) {
      tx_network.extra_cluster_table_columns =
        tx_network.extra_cluster_table_columns.concat(injected_column);
    } else {
      tx_network.extra_cluster_table_columns = injected_column;
    }

    if (tx_network.subcluster_table) {
      if (tx_network.extra_subcluster_table_columns) {
        tx_network.extra_subcluster_table_columns =
          tx_network.extra_subcluster_table_columns.concat(
            injected_column_subcluster
          );
      } else {
        tx_network.extra_subcluster_table_columns = injected_column_subcluster;
      }
    }
  }

  if (
    tx_network.isPrimaryGraph &&
    (nodes_and_attributes || edges_and_attributes)
  ) {
    tx_network.draw_cluster_table(
      tx_network.extra_cluster_table_columns,
      tx_network.cluster_table
    );
    if (tx_network.subcluster_table) {
      tx_network.draw_cluster_table(
        tx_network.extra_subcluster_table_columns,
        tx_network.subcluster_table,
        { subclusters: true, "no-clusters": true }
      );
    }
    if (tx_network._is_CDC_) {
      //tx_network.draw_extended_node_table(tx_network.aggregate_indvidual_level_records(), null, null, { "no-filter": !tx_network.node_search_div });
    } else {
      self.draw_node_table(self.extra_node_table_columns, self.json.Nodes);
    }
  }

  return {
    nodes: new_nodes,
    existing_nodes: existing_nodes,
    edges: edge_types_dict,
  };
}
