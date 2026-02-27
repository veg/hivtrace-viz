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
}

module.exports = HTXModel;
