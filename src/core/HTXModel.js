var _ = require("underscore");

/**
 * Represents the core HIV transmission network data model and analysis logic.
 * Decoupled from browser-specific UI/SVG logic.
 */
class HTXModel {
  constructor(json, primary_key_function, options) {
    this.json = json;
    this.options = options || {};
    this.warning_string = "";
    this.cluster_attributes = [];
    this.minimum_cluster_size = 0;
    
    /** 
     * Identify which nodes are duplicates
     */
    this.primary_key = _.isFunction(primary_key_function)
      ? primary_key_function
      : (node) => {
          if (this.options.isMJCNetwork && !node.id) {
            return node.name;
          }
          const i = node.id.indexOf("|");
          if (i >= 0) {
            return node.id.substr(0, i);
          }
          return node.id;
        };

    this.tabulate_multiple_sequences();
    this.defined_priority_groups = [];
    this.using_time_filter = null;
    
    this.cluster_filtering_functions = {
      size: (cluster) => cluster.children.length >= this.minimum_cluster_size,
      singletons: (cluster) => cluster.children.length > 1,
    };
  }

  /**
   * Groups all edges in `this.json.Edges` by the primary key of their source and target nodes.
   */
  group_edges_by_primary_key() {
    let edges_by_primary_key = {};

    _.each(this.json.Edges, (edge) => {
      const source_pk = this.primary_key(this.json.Nodes[edge.source]);
      const target_pk = this.primary_key(this.json.Nodes[edge.target]);

      if (!edges_by_primary_key[source_pk]) {
        edges_by_primary_key[source_pk] = [];
      }
      edges_by_primary_key[source_pk].push(edge);

      if (source_pk !== target_pk) {
        if (!edges_by_primary_key[target_pk]) {
          edges_by_primary_key[target_pk] = [];
        }
        edges_by_primary_key[target_pk].push(edge);
      }
    });

    return edges_by_primary_key;
  }

  /**
   * Collate node attributes for nodes sharing the same primary key.
   */
  tabulate_multiple_sequences(kGlobals) {
    this.primary_key_list = {};
    this.has_multiple_sequences = false;
    this.legend_multiple_sequences = false;

    const NodeAttributeID = kGlobals ? kGlobals.network.NodeAttributeID : "patient_attributes";
    const AliasedSequencesID = kGlobals ? kGlobals.network.AliasedSequencesID : "aliased_sequences";

    _.each(this.json.Nodes, (n) => {
      const p_key = this.primary_key(n);
      if (!(p_key in this.primary_key_list)) {
        this.primary_key_list[p_key] = [n];
      } else {
        this.primary_key_list[p_key].push(n);
        this.has_multiple_sequences = true;
        this.legend_multiple_sequences = true;
      }
      if (!this.legend_multiple_sequences) {
        if (n[AliasedSequencesID]) {
          this.legend_multiple_sequences = true;
        }
      }
    });

    if (this.has_multiple_sequences) {
      _.each(this.primary_key_list, (seqs, primary_id) => {
        if (seqs.length > 1) {
          let consensus_attributes = {};

          _.each(seqs, (seq_record) => {
            _.each(seq_record[NodeAttributeID], (v, k) => {
              if (!(k in consensus_attributes)) {
                consensus_attributes[k] = [v];
              } else {
                consensus_attributes[k].push(v);
              }
            });
          });

          consensus_attributes = _.omit(
            _.mapObject(consensus_attributes, (d, k) => {
              let freq = _.countBy(d, (i) => i);
              if (_.size(freq) == 1) {
                return _.keys(freq)[0];
              }
              return null;
            }),
            (d) => !d
          );

          _.each(seqs, (seq_record) => {
            _.extend(seq_record[NodeAttributeID], consensus_attributes);
          });
        }
      });
    }
  }

  cluster_display_filter(cluster) {
    return _.every(this.cluster_filtering_functions, (f) => f(cluster));
  }

  unique_entity_list(node_list) {
    return _.map(
      _.groupBy(node_list, (n) => this.primary_key(n)),
      (d, k) => k
    );
  }

  unique_entity_list_from_ids(node_list) {
    return this.unique_entity_list(
      _.map(node_list, (d) => {
        return { id: d };
      })
    );
  }

  unique_entity_object_list(node_list) {
    return _.groupBy(node_list, (n) => this.primary_key(n));
  }

  attribute_node_value_by_id(d, id, number, is_date, check_redacted, kGlobals) {
    try {
      if (kGlobals.network.NodeAttributeID in d && id) {
        if (id in d[kGlobals.network.NodeAttributeID]) {
          let v;

          if (this.json[kGlobals.network.GraphAttrbuteID][id].volatile) {
            v = this.json[kGlobals.network.GraphAttrbuteID][id].map(d, this);
          } else {
            v = d[kGlobals.network.NodeAttributeID][id];
          }

          if (_.isString(v)) {
            if (check_redacted && v === "REDACTED") {
              return "REDACTED";
            } else if (v.length === 0) {
              return kGlobals.missing.label;
            } else if (number) {
              v = Number(v);
              return _.isNaN(v) ? kGlobals.missing.label : v;
            } else if (is_date) {
              return v.getTime();
            }
          }
          return v;
        }
      }
    } catch (e) {
      console.log("attribute_node_value_by_id", e, d, id, number);
    }
    return kGlobals.missing.label;
  }

  static inject_attribute_node_value_by_id(node, id, value, kGlobals) {
    node[kGlobals.network.NodeAttributeID][id] = value;
  }

  static is_edge_injected(e) {
    return "edge_type" in e;
  }

  extract_single_cluster(
    nodes,
    filter,
    no_clone,
    given_json,
    include_extra_edges,
    edge_subset
  ) {
    var cluster_json = {};
    var map_to_id = {};

    cluster_json.Nodes = _.map(nodes, (c, i) => {
      map_to_id[c.id] = i;

      if (no_clone) {
        return c;
      }

      var cc = _.clone(c);
      cc.cluster = 1;
      return cc;
    });

    given_json = given_json || this.json;

    cluster_json.Edges = _.filter(
      edge_subset ? edge_subset : given_json.Edges,
      (e) => {
        if (_.isUndefined(e.source) || _.isUndefined(e.target)) {
          return false;
        }

        return (
          given_json.Nodes[e.source].id in map_to_id &&
          given_json.Nodes[e.target].id in map_to_id &&
          (include_extra_edges || !HTXModel.is_edge_injected(e))
        );
      }
    );

    if (filter) {
      cluster_json.Edges = _.filter(cluster_json.Edges, filter);
    }

    cluster_json.Edges = _.map(cluster_json.Edges, (e) => {
      var ne = _.clone(e);
      ne.source = map_to_id[given_json.Nodes[e.source].id];
      ne.target = map_to_id[given_json.Nodes[e.target].id];
      return ne;
    });

    return cluster_json;
  }
}

module.exports = HTXModel;
