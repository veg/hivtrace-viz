var _ = require("underscore"),
  timeDateUtil = require("./timeDateUtil.js"),
  kGlobals = require("./globals.js"),
  misc = require("./misc.js"),
  clustersOfInterest = require("./clustersOfInterest.js");

/*------------------------------------------------------------
     define a barebones class for the network object
     mostly here to encapsulate function definitions
     so they don't pollute the main function

------------------------------------------------------------*/

/**
 * Represents an HIV transmission network with annotations
 *
 * @class HIVTxNetwork
 * @param {Object} json - A JSON object containing the network data.
 * @param {HTMLElement} button_bar_ui - A UI element for interacting with the network.
 * @param {Object} cluster_attributes - Attributes related to clusters within the network.
 */

class HIVTxNetwork {
  constructor(json, button_bar_ui, primary_key_function, secondaryGraph) {
    this.json = json;
    this.button_bar_ui = button_bar_ui;
    this.warning_string = "";
    this.subcluster_table = null;
    this.priority_set_table_write = null;
    this.priority_set_table_writeable = null;
    this.cluster_attributes = [];
    this.minimum_cluster_size = 0;
    this.isPrimaryGraph = !secondaryGraph;
    /** SLKP 20241029
        this function is used to identify which nodes are duplicates
        it converts the name of the node (sequence) into a primary key ID (by default, taking the .id string up to the first pipe)
        all sequences/nodes that map to the same primary key are assumed to represent the same entity / individual
    **/
    this.primary_key = _.isFunction(primary_key_function)
      ? primary_key_function
      : (node) => {
          const i = node.id.indexOf("|");
          if (i >= 0) {
            return node.id.substr(0, i);
          }
          return node.id;
        };
    this.tabulate_multiple_sequences();

    /** initialize UI/UX elements */
    this.initialize_ui_ux_elements();

    /** the list of defined clusters of interest,
      format as follows (SLKP, 20240715: may need updating)
      {
         'name'  : 'unique name',
         'nodes' : [
          {
              'node_id' : text,
              'added' : date,
              'kind' : text
          }],
         'created' : date,
         'description' : 'text',
         'modified' : date,
         'kind' : 'text'
     }
    */
    this.defined_priority_groups = [];

    /**
       time filter element for various displays
    */
    this.using_time_filter = null;
  }

  /**
   * Groups all edges in `this.json.Edges` by the primary key of their source and target nodes.
   * The result is returned
   * An edge will appear in the list for its source's primary key and its target's primary key.
   */
  group_edges_by_primary_key() {
    let edges_by_primary_key = {};

    _.each(this.json.Edges, (edge) => {
      try {
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
          // Add only if it's not already there (to avoid duplicates if an edge is within the same PK group but processed twice)
          // However, the current logic adds it once for source and once for target if different, which is fine.
          // If an edge is between two nodes of the same PK, it's added only once via the source_pk.
          edges_by_primary_key[target_pk].push(edge);
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    });

    return edges_by_primary_key;
  }

  /** initialize UI/UX elements */
  initialize_ui_ux_elements() {
    /** define a D3 behavior to make node labels draggable */
    this.node_label_drag = d3.behavior
      .drag()
      .on("drag", function (d) {
        d.label_x += d3.event.dx;
        d.label_y += d3.event.dy;
        d3.select(this).attr(
          "transform",
          "translate(" +
            (d.label_x + d.rendered_size * 1.25) +
            "," +
            (d.label_y + d.rendered_size * 0.5) +
            ")"
        );
      })
      .on("dragstart", () => {
        d3.event.sourceEvent.stopPropagation();
      })
      .on("dragend", () => {
        d3.event.sourceEvent.stopPropagation();
      });

    /** default node colorizer */
    this.colorizer = {
      selected: function (d) {
        return d === "selected" ? d3.rgb(51, 122, 183) : "#FFF";
      },
    };

    /** if there is computed support for network edges, use it to highlight
        possible spurious edges **/

    this.highlight_unsuppored_edges = true;

    /** default node shaper */
    this.node_shaper = {
      id: null,
      shaper: function () {
        return "circle";
      },
    };

    /** d3 layout option setting */
    this.charge_correction = 5;

    /**
        filters which control which clusters get rendered
    */

    this.cluster_filtering_functions = {
      size: this.filter_by_size,
      singletons: this.filter_singletons,
    };
  }

  /**
    Iterate over nodes in the network, identify all those which share the same
    primary key (i.e., the same individual), tabulate them, and collate node attributes
  */

  tabulate_multiple_sequences() {
    /**
        generate a primary key to node ID map
        [primary key] => [array of IDs]
    */
    this.primary_key_list = {};
    this.has_multiple_sequences = false;
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
        if (n[kGlobals.network.AliasedSequencesID]) {
          this.legend_multiple_sequences = true;
        }
      }
    });

    /**
        iterate over all duplicate sequences, synchronize node attributes
    */
    if (this.has_multiple_sequences) {
      _.each(this.primary_key_list, (seqs, primary_id) => {
        if (seqs.length > 1) {
          let consensus_attributes = {};

          _.each(seqs, (seq_record) => {
            _.each(seq_record[kGlobals.network.NodeAttributeID], (v, k) => {
              if (!(k in consensus_attributes)) {
                consensus_attributes[k] = [v];
              } else {
                consensus_attributes[k].push(v);
              }
            });
          });

          // only copy values if there's strict consensus

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
            _.extend(
              seq_record[kGlobals.network.NodeAttributeID],
              consensus_attributes
            );
          });
        }
      });
    }
  }

  /**
      this is a function which calculates country node centers
      for the (experimental) option of rendering networks with
      topo maps
   */

  _calc_country_nodes = (calc_options) => {
    if (calc_options && "country-centers" in calc_options) {
      this.mapProjection = d3.geo
        .mercator()
        .translate([
          this.margin.left + this.width / 2,
          this.margin.top + this.height / 2,
        ])
        .scale((150 * this.width) / 960);
      _.each(this.countryCentersObject, (value) => {
        value.countryXY = this.mapProjection([value.longt, value.lat]);
      });
    }
  };

  /**
        @cluster [dict] : cluster object

        return true if the cluster passes all the currently defined filters
        see this.cluster_filtering_functions
  */

  cluster_display_filter(cluster) {
    return _.every(this.cluster_filtering_functions, (f) => f(cluster));
  }

  /**
        @cluster [dict] : cluster object

        return true if cluster size is at least this.minimum_cluster_size
  */

  filter_by_size = (cluster) => {
    return cluster.children.length >= this.minimum_cluster_size;
  };

  /**
        @node_list [array] : list of nodes

        returns the list of unique "individuals", collapsing nodes representing
        multiple sequences from the same entity into a single blob
  */

  unique_entity_list = (node_list) => {
    return _.map(
      _.groupBy(node_list, (n) => this.primary_key(n)),
      (d, k) => k
    );
  };

  /**
        @node_list [array] : list of node IDs

        returns the list of unique "individuals", collapsing nodes representing
        multiple sequences from the same entity into a single blob
  */

  unique_entity_list_from_ids = (node_list) => {
    return this.unique_entity_list(
      _.map(node_list, (d) => {
        return { id: d };
      })
    );
  };

  /**
        @node_list [array] : list of nodes

        returns [primary key] => [objects] dict
  */

  unique_entity_object_list = (node_list) => {
    return _.groupBy(node_list, (n) => this.primary_key(n));
  };

  /**
        @cluster [dict] : cluster object

        return true if cluster size is at least 2
  */

  filter_singletons = (cluster) => {
    return cluster.children.length > 1;
  };

  /**
        @cluster [dict] : cluster object

        return true if the cluster is new compared to the previous network
  */

  filter_if_added = (cluster) => {
    return this.cluster_attributes[cluster.cluster_id].type !== "existing";
  };

  /**
        @cluster [dict] : cluster object

        return true if the cluster has nodes newer than this.using_time_filter
  */

  filter_time_period = (cluster) => {
    return _.some(
      this.nodes_by_cluster[cluster.cluster_id],
      (n) =>
        this.attribute_node_value_by_id(
          n,
          timeDateUtil.getClusterTimeScale()
        ) >= this.using_time_filter
    );
  };

  get_reference_date() {
    /**
        get the reference (creation) date for the network
        same as "today", unless this is not the primary network (cluster or subcluster view),
        in which case the reference date for the parent is used
    */
    if (!this.isPrimaryGraph && this.parent_graph_object) {
      return this.parent_graph_object.today;
    }

    return this.today;
  }

  lookup_option(key, default_value, options) {
    /**
        retrieve an option associated with "key"
        if not found in Settings or options, return "default value"
    */
    if (this.json.Settings && this.json.Settings[key]) {
      return this.json.Settings[key];
    }
    if (options && options[key]) return options[key];
    return default_value;
  }

  static lookup_form_generator() {
    return '<div><ul data-hivtrace-ui-role = "priority-membership-list"></ul></div>';
  }

  /** retrive the DOM ID for an element given its data-hivtrace-ui-role
      @param role: data-hivtrace-ui-role
      @param nested: true if this is being called from a secondary network or element (dialog, cluster view etc),
                     which does not have primary button_ui elements
 */
  get_ui_element_selector_by_role(role, not_nested) {
    if (not_nested && !this.isPrimaryGraph) {
      return undefined;
    }
    return (
      (not_nested ? "" : "#" + this.button_bar_ui) +
      misc.get_ui_element_selector_by_role(role)
    );
  }

  /**
    Process the network to simplify multiple sequences per individual

    1. Identify null clusters, i.e., clusters that consist only of sequences with the same primary key (individual)
        Delete ALL null clusters; remove all nodes and edges associated with them

    2. Identify identical sequence sets, i.e., sequences with the same individual that have the same connection patterns,
        (a) All sequences in the set have the same primary key
        (b) All sequences in the set are connected to each other (at length <= reduce_distance_within)
        (c) All sequences in the set are connected to the same set of OTHER sequences (at length <= reduce_distance_between)

        All identical sequence sets are collapsed to a


  */
  process_multiple_sequences(reduce_distance_within, reduce_distance_between) {
    if (this.has_multiple_sequences && this.isPrimaryGraph) {
      reduce_distance_within = reduce_distance_within || 0.000001;
      reduce_distance_between = reduce_distance_between || 0.015;

      let clusters = misc.hivtrace_cluster_depthwise_traversal(
        this.json.Nodes,
        this.json.Edges
      );

      let complete_clusters = misc.hivtrace_cluster_depthwise_traversal(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= reduce_distance_within
      );

      let adjacency = misc.hivtrace_compute_adjacency(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= reduce_distance_between
      );

      let adjacency05 = misc.hivtrace_compute_adjacency(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= 0.005
      );
      let nodes_to_delete = new Set();

      _.each(clusters, (cluster, cluster_index) => {
        let entity_list = this.unique_entity_list(cluster);
        if (entity_list.length == 1) {
          _.each(cluster, (ncn) => {
            nodes_to_delete.add(ncn.id);
            // these are all null nodes (clusters made of single individual sequences)
          });
        }
      });

      //let c95 = this.extract_single_cluster (clusters[95]);
      //console.log (misc.hivtrace_cluster_depthwise_traversal (c95.Nodes, c95.Edges, (d)=>d.length <= reduce_distance_within));

      let null_size = nodes_to_delete.size;
      console.log("Marked ", null_size, " nodes in null clusters");

      _.each(complete_clusters, (cluster, cluster_index) => {
        if (cluster.length > 1) {
          if (_.some(cluster, (n) => nodes_to_delete.has(n.id))) {
            return;
          }

          let uel = this.unique_entity_object_list(cluster);

          _.each(uel, (dup_seqs, uid) => {
            if (dup_seqs.length > 1) {
              let dup_ids = new Set(_.map(dup_seqs, (d) => d.id));

              let neighborhood = new Set(
                _.map(
                  _.filter(
                    [...adjacency[dup_seqs[0].id]],
                    (d) => !dup_ids.has(d)
                  )
                )
              );
              let neighborhood05 = new Set(
                _.map(
                  _.filter(
                    [...adjacency05[dup_seqs[0].id]],
                    (d) => !dup_ids.has(d)
                  )
                )
              );
              let reduce = true;

              //if (neighborhood.size > 0) {
              for (let idx = 1; idx < dup_seqs.length; idx += 1) {
                let other_nbhd = new Set(
                  _.map(
                    _.filter(
                      [...adjacency[dup_seqs[idx].id]],
                      (d) => !dup_ids.has(d)
                    )
                  )
                );
                let other_nbhd05 = new Set(
                  _.map(
                    _.filter(
                      [...adjacency05[dup_seqs[idx].id]],
                      (d) => !dup_ids.has(d)
                    )
                  )
                );

                if (
                  !(
                    other_nbhd.isSubsetOf(neighborhood) &&
                    neighborhood.isSubsetOf(other_nbhd)
                  ) ||
                  !(
                    other_nbhd.isSubsetOf(neighborhood05) &&
                    neighborhood.isSubsetOf(other_nbhd05)
                  )
                ) {
                  reduce = false;
                  break;
                }
              }
              //}
              if (reduce) {
                dup_seqs[0][kGlobals.network.AliasedSequencesID] = _.map(
                  dup_seqs,
                  (d) => d.id
                );
                _.each(dup_seqs, (d, i) => {
                  if (i > 0) {
                    nodes_to_delete.add(d.id);
                  }
                });
              }
            }
          });
        }
      });

      console.log(
        "Marked ",
        nodes_to_delete.size - null_size,
        " collapsible nodes"
      );

      /** now iterate over non-trivial clusters, and see if any nodes are collapsible **/

      // delete designated nodes and update network structures
      if (nodes_to_delete.size) {
        let new_node_list = [];
        let new_edge_set = [];
        let old_node_idx_to_new_node_idx = [];
        let new_counter = 0;

        _.each(this.json.Nodes, (n, i) => {
          if (nodes_to_delete.has(n.id)) {
            old_node_idx_to_new_node_idx.push(-1);
          } else {
            new_node_list.push(n);
            old_node_idx_to_new_node_idx.push(new_counter);
            new_counter++;
          }
        });

        _.each(this.json.Edges, (e, i) => {
          let new_source = old_node_idx_to_new_node_idx[e.source],
            new_target = old_node_idx_to_new_node_idx[e.target];

          if (new_source >= 0 && new_target >= 0) {
            e.source = new_source;
            e.target = new_target;
            new_edge_set.push(e);
          }
        });

        //console.log (new_edge_set);

        this.json.Nodes = new_node_list;
        this.json.Edges = new_edge_set;

        this.tabulate_multiple_sequences();
      }
    }
  }

  /**
        When MSPP are present, this function will annotate node objects with fields
        that indicate whether or not the nodes belong to multiple clusters or subclusters
  */

  annotate_multiple_clusters_on_nodes() {
    if (this.has_multiple_sequences) {
      let entities_in_multiple_clusters = {};
      _.each(this.primary_key_list, (nodes, key) => {
        if (nodes.length >= 2) {
          let cl = _.groupBy(nodes, (n) => n.cluster);
          if (_.size(cl) > 1) {
            entities_in_multiple_clusters[key] = _.keys(cl);
            _.each(nodes, (n) => {
              n["multiple clusters"] = _.keys(cl);
            });
          } else {
            _.each(nodes, (n) => {
              delete n["multiple clusters"];
            });
          }
          cl = _.filter(
            _.map(
              _.groupBy(nodes, (n) => n.subcluster_label),
              (d, k) => k
            ),
            (d) => d != "undefined"
          );
          if (_.size(cl) > 1) {
            _.each(nodes, (n) => {
              n["multiple subclusters"] = cl;
            });
          } else {
            _.each(nodes, (n) => {
              delete n["multiple subclusters"];
            });
          }
        }
      });
      this.entities_in_multiple_clusters = entities_in_multiple_clusters;
      /*let by_cluster = {};
      _.each (this.entities_in_multiple_clusters, (c,n)=> {
        _.each (c, (ci)=> {
            if (ci in by_cluster) {
                by_cluster[ci].push (n);
            } else {
                by_cluster[ci] = [n];
            }
        });
      });*/
    }
  }

  /**
        When MSPP are present, this function will reduce the network
        encoded by .Nodes and .Edges in filtered_json, and
        reduce all sequences that represent the same entity into one node.
        Such nodes inherit the union of their links (so at least of the sequences being
        collapsed link to X, the "joint" node will link to X).

        The joint nodes will also receive aggregated attributes;
        if the nodes being merged have different attributes values for a given key, the
        merged node will have a ';' separated list of attributes for the same key.

  */

  simplify_multisequence_cluster(filtered_json) {
    /**
            20241030 SLKP
            Perform a greedy collapse of all the sequences that map to the same primary key
            For a reduced cluster view
        */

    let reduced_nodes = _.pairs(
      _.mapObject(
        this.unique_entity_object_list(filtered_json.Nodes),
        (v) => this.aggregate_indvidual_level_records(v)[0]
      )
    );

    let uid_index = _.object(_.map(reduced_nodes, (d, i) => [d[0], i]));
    let oui_index = {};

    _.each(reduced_nodes, (d) => {
      let aliased = d[1][kGlobals.network.AliasedSequencesID] || [d[1].id];
      _.each(aliased, (nn) => {
        oui_index[nn] = uid_index[d[0]];
      });
    });

    let adjacency = misc.hivtrace_compute_adjacency(
      filtered_json.Nodes,
      filtered_json.Edges
    );
    let reduced_adjacency = _.map(uid_index, (d) =>
      _.map(uid_index, (d2) => 0)
    );
    let reduced_lengths = _.map(uid_index, (d) => _.map(uid_index, (d2) => 0));

    _.each(filtered_json.Edges, (e) => {
      let reduced_src = oui_index[filtered_json.Nodes[e.source].id],
        reduced_tgt = oui_index[filtered_json.Nodes[e.target].id];

      if (reduced_src != reduced_tgt) {
        reduced_adjacency[reduced_src][reduced_tgt] += 1;
        reduced_adjacency[reduced_tgt][reduced_src] += 1;
        reduced_lengths[reduced_src][reduced_tgt] += e.length;
        reduced_lengths[reduced_tgt][reduced_src] += e.length;
      }
    });

    let reduced_edges = [];

    _.each(reduced_adjacency, (row, i) => {
      for (let j = i + 1; j < row.length; j++) {
        if (row[j] > 0) {
          reduced_edges.push({
            source: i,
            target: j,
            attributes: [],
            length: reduced_lengths[i][j] / row[j],
            weight: row[j],
          });
        }
      }
    });

    filtered_json.Edges = reduced_edges;
    filtered_json.Nodes = _.map(reduced_nodes, (d) => d[1]);

    return filtered_json;
  }

  /**
      generate a cross-hatch pattern for filling nodes with a specific color
      and add it as a definition to the network SVG
  */

  generate_cross_hatch_pattern(color) {
    let id = "id" + this.dom_prefix + "_diagonalHatch_" + color.substr(1, 10);
    if (this.network_svg.select("#" + id).empty()) {
      function getComplementaryColor(backgroundColor) {
        const color = d3.rgb(backgroundColor);
        const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
        return luminance > 128 ? "#000000" : "#ffffff";
      }

      let defs = this.network_svg.append("defs");

      /*defs.append("pattern")
        .attr("id", id)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", "2")
        .attr("height", "4")
        .attr("patternTransform", "rotate(30 2 2)")
        .append("path")
        .attr("d", "M -1,2 l 6,0")
        .attr("stroke", color)
        .attr("stroke-width", "3"); //this is actual shape for arrowhead
        */

      let pattern = defs
        .append("pattern")
        .attr("id", id)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", "6")
        .attr("height", "6")
        .attr("patternTransform", "rotate(45)");

      pattern
        .append("rect")
        .attr("width", "3")
        .attr("height", "6")
        .attr("fill", color)
        .attr("transform", "translate(0,0)");

      pattern
        .append("rect")
        .attr("width", "3")
        .attr("height", "6")
        .attr("fill", getComplementaryColor(color))
        .attr("transform", "translate(3,0)");
    }
    return id;
  }

  /** filter the list of CoI to return those which have not been reviewed/validated */
  priority_groups_pending() {
    return _.filter(this.defined_priority_groups, (pg) => pg.pending).length;
  }

  /** filter the list of CoI to return those which have been automatically expanded */
  priority_groups_expanded() {
    return _.filter(this.defined_priority_groups, (pg) => pg.expanded).length;
  }

  /** filter the list of CoI to return those which have been created by the system */
  priority_groups_automatic() {
    return _.filter(
      this.defined_priority_groups,
      (pg) => pg.createdBy === kGlobals.CDCCOICreatedBySystem
    ).length;
  }

  /** lookup a CoI by name; null if not found */
  priority_groups_find_by_name = function (name) {
    if (this.defined_priority_groups) {
      return _.find(this.defined_priority_groups, (g) => g.name === name);
    }
    return null;
  };

  /** generate a set of all unique temporal events (when new data were added to ANY CoI)
     return a Set of date strings formatted with timeDateUtil.DateViewFormatSlider */

  priority_groups_all_events = function () {
    const events = new Set();
    if (this.defined_priority_groups) {
      _.each(this.defined_priority_groups, (g) => {
        _.each(g.nodes, (n) => {
          events.add(timeDateUtil.DateViewFormatSlider(n.added));
        });
      });
    }
    return events;
  };

  /**
        compute the overlap between CoI

        @groups: an array with CoI objects

        1. Populate this.priority_node_overlap dictionary which
           stores, for every node present in AT LEAST ONE CoI, the set of all
           PGs it belongs to, as in "node-id" => set ("PG1", "PG2"...)

        2. For each CoI, create and populate a member field, .overlaps
           which is a dictionary that stores
           {
                sets : #of CoI with which it shares nodes
                nodes: the # of nodes contained in overlaps
           }

   */

  priority_groups_compute_overlap = function (groups) {
    this.priority_node_overlap = {};

    var entities_by_pg = {};
    var size_by_pg = {};
    _.each(groups, (pg) => {
      entities_by_pg[pg.name] = this.aggregate_indvidual_level_records(
        pg.node_objects
      );
      size_by_pg[pg.name] = entities_by_pg[pg.name].length;
      _.each(entities_by_pg[pg.name], (n) => {
        const entity_id = this.entity_id(n);
        if (!(entity_id in this.priority_node_overlap)) {
          this.priority_node_overlap[entity_id] = new Set();
        }
        this.priority_node_overlap[entity_id].add(pg.name);
      });
    });

    _.each(groups, (pg) => {
      const overlap = {
        sets: new Set(),
        nodes: 0,
        supersets: [],
        duplicates: [],
      };

      const by_set_count = {};
      _.each(entities_by_pg[pg.name], (n) => {
        const entity_id = this.entity_id(n);
        if (this.priority_node_overlap[entity_id].size > 1) {
          overlap.nodes++;
          this.priority_node_overlap[entity_id].forEach((pgn) => {
            if (pgn !== pg.name) {
              if (!(pgn in by_set_count)) {
                by_set_count[pgn] = [];
              }
              by_set_count[pgn].push(entity_id);
            }
            overlap.sets.add(pgn);
          });
        }
      });

      _.each(by_set_count, (nodes, name) => {
        if (nodes.length == size_by_pg[pg.name]) {
          if (size_by_pg[name] == size_by_pg[pg.name]) {
            overlap.duplicates.push(name);
          } else {
            overlap.supersets.push(name);
          }
        }
      });

      pg.overlap = {
        nodes: overlap.nodes,
        sets: Math.max(0, overlap.sets.size - 1),
        superset: overlap.supersets,
        duplicate: overlap.duplicates,
      };
    });
  };

  /** generate the name for a cluster of interest */
  generateClusterOfInterestID(subcluster_id) {
    const id =
      this.CDC_data["jurisdiction_code"] +
      "_" +
      timeDateUtil.DateViewFormatClusterCreate(this.CDC_data["timestamp"]) +
      "_" +
      subcluster_id;

    let suffix = "";
    let k = 1;
    let found =
      this.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
      this.defined_priority_groups.find((d) => d.name === id + suffix);
    while (found !== undefined) {
      suffix = "_" + k;
      k++;
      found =
        this.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
        this.defined_priority_groups.find((d) => d.name === id + suffix);
    }
    return id + suffix;
  }

  /** does the node have "new node" attribute */

  static is_new_node(node) {
    return node.attributes.indexOf("new_node") >= 0;
  }

  /** create a map between node IDs and node objects */
  map_ids_to_objects() {
    if (!this.node_id_to_object) {
      this.node_id_to_object = {};

      _.each(this.json.Nodes, (n, i) => {
        this.node_id_to_object[n.id] = n;
      });
    }
  }

  /** Fetch the value of an attribute from the node
    @param d: node object
    @param id: [string] the attribute whose value should be fetched
    @param number: [bool] if true, only return numerical values

 */

  attribute_node_value_by_id(d, id, number, is_date) {
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
            if (v.length === 0) {
              return kGlobals.missing.label;
            } else if (number) {
              v = Number(v);
              return _.isNaN(v) ? kGlobals.missing.label : v;
            } else if (date) {
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

  /**
        Is this node NOT genetic, i.e. added to the network via social or other means
  */
  static is_edge_injected(e) {
    return "edge_type" in e;
  }

  /**
        Extract the nodes and edges between them into a separate object
        @param nodes [array]  the list of nodes to extract
        @param filter [function, optional] (edge) -> bool filtering function for deciding which edges will be used to define clusters
        @param no_clone [bool] if set to T, node objects are **not** shallow cloned in the return object
        @return [dict] the object representing "Nodes" and "Edges" in the extracted cluster

  */

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
          (include_extra_edges || !HIVTxNetwork.is_edge_injected(e))
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

  /**
        Grow a CoI defined in @pg based on its growth mode
        @return the set of added nodes (by numeric ID)
        @nodeID2idx : if provided, maps the name of the node to its index
                      in the `nodes` array; avoids repeated traversal if provided
        @edgesByNode : if provided, maps the INDEX of the node to the list of edges in the entire network

  */

  auto_expand_pg_handler = function (pg, nodeID2idx, edgesByNode) {
    if (!nodeID2idx) {
      nodeID2idx = {};
      _.each(this.json.Nodes, (n, i) => {
        nodeID2idx[n.id] = i;
      });
    }

    const core_node_set = new Set(_.map(pg.nodes, (n) => nodeID2idx[n.name]));
    const added_nodes = new Set();
    const filter = kGlobals.CDCCOITrackingOptionsDistanceFilter[pg.tracking];

    const ref_date = this.get_reference_date();

    if (filter) {
      const time_cutoff = timeDateUtil.n_months_ago(
        ref_date,
        kGlobals.CDCCOITrackingOptionsDateFilter[pg.tracking]
      );

      let edge_set;

      if (edgesByNode) {
        let node_list = [...core_node_set];
        let node_set = new Set(node_list);

        for (let i = 0; i < node_list.length; i++) {
          let d = node_list[i];
          if (d in this.json.Nodes) {
            _.each([...edgesByNode[d]], (e) => {
              let add_nodes = [];

              if (!node_set.has(e.source)) {
                add_nodes.push(e.source);
              }
              if (!node_set.has(e.target)) {
                add_nodes.push(e.target);
              }
              /*if (this.has_multiple_sequences) {
                let extra_nodes = [];
                _.each (add_nodes, n2a=> {
                    let node_object = this.json.Nodes[n2a];
                    _.each (this.primary_key_list [this.primary_key(node_object)], (no)=> {
                        let nidx = nodeID2idx[no.id];
                        if (!node_set.has(nidx)) {
                            extra_nodes.push (nidx);
                            node_set.add (nidx);
                        }
                    });
                });
                if (extra_nodes.length) {
                    add_nodes.push (...extra_nodes);
                }
              }*/

              _.each(add_nodes, (n2a) => {
                node_list.push(n2a);
                node_set.add(n2a);
              });
            });
          }
        }

        edge_set = new Set();
        _.each(
          _.filter(node_list, (d) => d in this.json.Nodes),
          (d) => {
            for (const e of edgesByNode[d]) {
              edge_set.add(e);
            }
          }
        );

        edge_set = [...edge_set];

        /*edge_set = [
          ...existing_nodes.reduce((acc, set) => {
            return new Set([...acc, ...set]);
          }, new Set()),
        ];*/
      } else {
        edge_set = this.json.Edges;
      }

      const expansion_test = misc.hivtrace_cluster_depthwise_traversal(
        this.json.Nodes,
        edge_set,
        (e) => {
          let pass = filter(e);
          if (pass) {
            if (!(core_node_set.has(e.source) && core_node_set.has(e.target))) {
              pass =
                pass &&
                this.filter_by_date(
                  time_cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  this.json.Nodes[e.source]
                ) &&
                this.filter_by_date(
                  time_cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  this.json.Nodes[e.target]
                );
            }
          }
          return pass;
        },
        false,
        _.filter(
          _.map([...core_node_set], (d) => this.json.Nodes[d]),
          (d) => d
        )
      );

      _.each(expansion_test, (c) => {
        _.each(c, (n) => {
          if (!core_node_set.has(nodeID2idx[n.id])) {
            added_nodes.add(nodeID2idx[n.id]);
          }
        });
      });
    }
    return added_nodes;
  };

  /**
        export CoI records for interactions with the external DB
        @group_set : custom set or all (if null)
        @include_unvalidated: if true will include CoI which did not undergo/pass validation
  */

  priority_groups_export = function (group_set, include_unvalidated) {
    group_set = group_set || this.defined_priority_groups;

    return _.map(
      _.filter(group_set, (g) => include_unvalidated || g.validated),
      (g) => ({
        name: g.name,
        description: g.description,
        nodes: g.nodes,
        modified: timeDateUtil.DateFormats[0](g.modified),
        kind: g.kind,
        created: timeDateUtil.DateFormats[0](g.created),
        createdBy: g.createdBy,
        tracking: g.tracking,
        autocreated: g.autocreated,
        autoexpanded: g.autoexpanded,
        pending: g.pending,
        history: g.history,
      })
    );
  };

  /** interact with the remote DB to send updates of CoI operations
        @name: the name of the CoI
        @operation: what happened ("insert", "delete", "update")
  */

  priority_groups_update_node_sets = function (name, operation) {
    const coi_to_update = this.priority_groups_find_by_name(name);
    if (coi_to_update) {
      const sets = this.priority_groups_export([coi_to_update]);

      const to_post = {
        operation: operation,
        name: name,
        url: window.location.href,
        sets: JSON.stringify(sets),
      };

      if (this.priority_set_table_write && this.priority_set_table_writeable) {
        d3.text(this.priority_set_table_write)
          .header("Content-Type", "application/json")
          .post(JSON.stringify(to_post), (error, data) => {
            if (error) {
              console.log("received fatal error:", error);
              /*
                $(".container").html(
                  '<div class="alert alert-danger">FATAL ERROR. Please reload the page and contact help desk.</div>'
                );
                */
            }
          });
      }
    }
  };

  /**
        A function that updates the "freehand" description
        of a specific CoI

        @param name [string] : the name of the CoI
        @param description [string] :  the actual description
        @param update_table [bool] : if true, trigger CoI table update in UI/UX

        @return N/A
  */

  priority_groups_edit_set_description = function (
    name,
    description,
    update_table
  ) {
    let pg_to_update = this.priority_groups_find_by_name(name);
    if (pg_to_update) {
      pg_to_update.description = description;
      this.priority_groups_update_node_sets(name, "update");
      if (update_table) {
        clustersOfInterest.draw_priority_set_table(this);
      }
    }
  };

  /**
        Remove a CoI from the list of defined CoI

        @param name [string] : the name of the CoI
        @param update_table [bool] : if true, trigger CoI table update in UI/UX

        @return N/A
  */

  priority_groups_remove_set = function (name, update_table) {
    if (this.defined_priority_groups) {
      var idx = _.findIndex(
        this.defined_priority_groups,
        (g) => g.name === name
      );

      if (idx >= 0) {
        this.priority_groups_update_node_sets(name, "delete");
        this.defined_priority_groups.splice(idx, 1);
        if (update_table) {
          clustersOfInterest.draw_priority_set_table(this);
        }
      }
    }
  };

  /**
        Export nodes that are members of CoI

        @param name [array] : set of CoI OBJECTS, by default this is `defined_priority_groups`
        @param include_unvalidated [bool] : if true, include all CoI (validated/not) in the export

        @return an array of node records
  */

  priority_groups_export_nodes = function (group_set, include_unvalidated) {
    group_set = group_set || this.defined_priority_groups;

    return _.flatten(
      _.map(
        _.filter(group_set, (g) => include_unvalidated || g.validated),
        (g) => {
          const exclude_nodes = new Set(g.not_in_network);
          let cluster_detect_size = 0;
          /** 20241101 MSPP
                added some sloppy code to handle MSPP
          **/

          let entities = this.aggregate_indvidual_level_records(g.node_objects);

          cluster_detect_size = this.unique_entity_list_from_ids(
            _.map(
              _.filter(g.nodes, (node) => node.added <= g.created),
              (node) => node.name
            )
          ).length;

          const entity_to_pg_records = _.groupBy(
            _.filter(g.nodes, (nr) => !exclude_nodes.has(nr.name)),
            (nr) => this.entity_id_from_string(nr.name)
          );

          const entity_to_g_records = _.groupBy(
            _.filter(g.node_objects, (nr) => !exclude_nodes.has(nr.id)),
            (nr) => this.entity_id_from_string(nr.id)
          );

          return _.map(
            _.filter(entities, (gn) => {
              return (
                new Set(this.list_of_aliased_sequences(gn)).difference(
                  exclude_nodes
                ).size > 0
              );
            }),
            (gn) => {
              const eid = this.entity_id(gn);
              return {
                eHARS_uid: eid,
                cluster_uid: g.name,
                cluster_ident_method: g.kind,
                person_ident_method: entity_to_pg_records[eid][0].kind,
                person_ident_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
                  entity_to_pg_records[eid][0].added
                ),
                sample_dt: d3.min(entity_to_g_records[eid], (g) =>
                  timeDateUtil.hivtrace_date_or_na_if_missing(
                    this.attribute_node_value_by_id(g, "sample_dt")
                  )
                ),
                new_linked_case: this.priority_groups_is_new_node(
                  entity_to_pg_records[eid][0]
                )
                  ? 1
                  : 0,
                cluster_created_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
                  g.created
                ),
                network_date: timeDateUtil.hivtrace_date_or_na_if_missing(
                  this.today
                ),
                cluster_detect_size: cluster_detect_size,
                cluster_type: g.createdBy,
                cluster_modified_dt:
                  timeDateUtil.hivtrace_date_or_na_if_missing(g.modified),
                cluster_growth:
                  kGlobals.CDCCOIConciseTrackingOptions[g.tracking],
                national_priority: g.meets_priority_def,
                cluster_current_size: entities.length,
                cluster_dx_recent12_mo: g.cluster_dx_recent12_mo,
                cluster_overlap: g.overlap.sets,
                SequenceID: this.list_of_aliased_sequences(gn)
                  .map((seq) => {
                    return seq.split("|")[1];
                  })
                  .join(";"),
              };
            }
          );
        }
      )
    );
  };

  /**
        Export CoI summary info
  
        @return an array of CoI records
  */
  priority_groups_export_sets = function () {
    return _.flatten(
      _.map(
        _.filter(this.defined_priority_groups, (g) => g.validated),
        (g) => ({
          cluster_type: g.createdBy,
          cluster_uid: g.name,
          cluster_modified_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
            g.modified
          ),
          cluster_created_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
            g.created
          ),
          cluster_ident_method: g.kind,
          cluster_growth: kGlobals.CDCCOIConciseTrackingOptions[g.tracking],
          cluster_current_size: this.aggregate_indvidual_level_records(
            g.node_objects
          ).length,
          national_priority: g.meets_priority_def,
          cluster_dx_recent12_mo: g.cluster_dx_recent12_mo,
          cluster_dx_recent36_mo: g.cluster_dx_recent36_mo,
          cluster_overlap: g.overlap.sets,
        })
      )
    );
  };

  /**
        returns true is the node was added by the system during CoI definition/expansion
  */
  priority_groups_is_new_node = function (node) {
    return node.autoadded;
  };

  /** parse a date record
        @param value (date object or string)
        @return date object
  */

  parse_dates(value) {
    if (value instanceof Date) {
      return value;
    }
    var parsed_value = null;

    var passed = _.any(timeDateUtil.DateFormats, (f) => {
      parsed_value = f.parse(value);
      return parsed_value;
    });

    if (passed) {
      if (
        this._is_CDC_ &&
        (parsed_value.getFullYear() < 1970 ||
          parsed_value.getFullYear() > timeDateUtil.DateUpperBoundYear)
      ) {
        throw Error("Invalid date");
      }
      return parsed_value;
    }

    throw Error("Invalid date");
  }

  /**
        Check if the date attribute of a node falls within a pre-specified range
        @param cutoff
        @param date_file
        @param start_date
        @param node
        @param count_newly_add [bool]; if true, then a "new node" attribute overrides date checks,
                                       so all new (compared to the previous network) nodes pass the check
   */

  filter_by_date(cutoff, date_field, start_date, node, count_newly_added) {
    if (count_newly_added && HIVTxNetwork.is_new_node(node)) {
      return true;
    }
    var node_dx = this.attribute_node_value_by_id(node, date_field);
    if (node_dx instanceof Date) {
      return node_dx >= cutoff && node_dx <= start_date;
    }
    try {
      node_dx = this.parse_dates(
        this.attribute_node_value_by_id(node, date_field)
      );
      if (node_dx instanceof Date) {
        return node_dx >= cutoff && node_dx <= start_date;
      }
    } catch {
      return undefined;
    }
    return false;
  }

  priority_group_entity_count(pg) {
    return this.unique_entity_list_from_ids(_.map(pg.nodes, (n) => n.name))
      .length;
  }
  /**
  
      validate the list of CoI
  
      @param groups {array} is a list of CoI
              name: unique string
              description: string,
              nodes: {
                  {
                      'id' : node id,
                      'added' : date,
                      'kind' :  _cdcPrioritySetNodeKind
                  }
              },
              created: date,
              kind:  kGlobals.CDCCOIKind,
              tracking: kGlobals.CDCCOITrackingOptions
              createdBy : kGlobals.CDCCOICreatedBySystem,kGlobals.CDCCOICreatedManually
  
      @param auto_extend {bool} : if true, automatically expand existing CoI
  
    */
  priority_groups_validate(groups, auto_extend) {
    if (_.some(groups, (g) => !g.validated)) {
      /** extract the list of clusters meeting national priority criteria,
          these have been precomputed elsewhere (priority_score)
      */

      /*const priority_subclusters = _.map(
        _.filter(
          _.flatten(
            _.map(
              _.flatten(
                _.map(this.clusters, (c) =>
                  _.filter(
                    _.filter(c.subclusters, (sc) => sc.priority_score.length)
                  )
                )
              ),
              (d) => d.priority_score
            ),
            1
          ),
          (d) => d.length >= this.CDC_data["autocreate-priority-set-size"]
        ),
        (d) => new Set(d)
      );*/

      const priority_subclusters = _.chain(this.clusters)
        .map("subclusters")
        .flatten()
        .filter((sc) => sc.priority_score.length)
        .map("priority_score")
        .flatten(1)
        .map((d) => this.unique_entity_list_from_ids(d))
        .filter(
          (d) => d.length >= this.CDC_data["autocreate-priority-set-size"]
        )
        .map((d) => new Set(d))
        .value();

      this.map_ids_to_objects();

      const nodeID2idx = {};
      const edgesByNode = {};

      /** the following code will expand CoI via MSPP links
          by eliding all edges connecting multiple sequences from the same person
          it is disabled as per CDC request of 03/10/2025
      */
      /*if (this.has_multiple_sequences) {
        const blobs = {};
        _.each(this.json.Nodes, (n, i) => {
          nodeID2idx[n.id] = i;
          edgesByNode[i] = new Set();
          blobs[i] = new Set();
        });

        _.each(this.primary_key_list, (list, id) => {
          let ids = _.map(list, (n) => nodeID2idx[n.id]);
          _.each(ids, (id) => {
            _.each(ids, (iid) => blobs[id].add(iid));
          });
        });

        _.each(this.json.Edges, (e) => {
          _.each([...blobs[e.source]], (id) => {
            let ee = _.clone(e);
            ee.source = id;
            edgesByNode[id].add(ee);
          });
          _.each([...blobs[e.target]], (id) => {
            let ee = _.clone(e);
            ee.target = id;
            edgesByNode[id].add(ee);
          });
        });
      } else*/ {
        _.each(this.json.Nodes, (n, i) => {
          nodeID2idx[n.id] = i;
          edgesByNode[i] = new Set();
        });

        _.each(this.json.Edges, (e) => {
          edgesByNode[e.source].add(e);
          edgesByNode[e.target].add(e);
        });
      }

      let traversal_cache = null;

      _.each(groups, (pg) => {
        if (!pg.validated) {
          pg.node_objects = [];
          pg.not_in_network = [];
          pg.validated = true;
          pg.created = _.isDate(pg.created)
            ? pg.created
            : timeDateUtil.DateFormats[0].parse(pg.created);
          if (pg.modified) {
            pg.modified = _.isDate(pg.modified)
              ? pg.modified
              : timeDateUtil.DateFormats[0].parse(pg.modified);
          } else {
            pg.modified = pg.created;
          }
          if (!pg.tracking) {
            if (pg.kind === kGlobals.CDCCOIKind[0]) {
              pg.tracking = kGlobals.CDCCOITrackingOptions[0];
            } else {
              pg.tracking = kGlobals.CDCCOITrackingOptions[4];
            }
          }
          if (!pg.createdBy) {
            if (pg.kind === kGlobals.CDCCOIKind[0]) {
              pg.createdBy = kGlobals.CDCCOICreatedBySystem;
            } else {
              pg.createdBy = kGlobals.CDCCOICreatedManually;
            }
          }

          /** check for nodes that are in the CoI but may be missing from the network */

          let updated_pg_record = false;
          let inject_mspp_nodes = [];
          let mspp_ms_nodes = {};
          let existing_subclusters = new Set();
          let existing_clusters = new Set();

          _.each(pg.nodes, (node) => {
            const nodeid = node.name;
            if (nodeid in this.node_id_to_object) {
              const n = this.node_id_to_object[nodeid];
              existing_subclusters.add(n.subcluster_label);
              existing_clusters.add(n.cluster);
              pg.node_objects.push(n);
            } else {
              /* 20241125
                    check to see if this might be an eHARS only CoI, i.e., 
                    migrating SSPP to MSPP
                    
                20250314
                    the logic will be as follows 
                    (1) if there's a unique sequence in the MSPP network for the same eHARS ID
                        we introduce it to the CoI
                    (2) all entities with multiple sequences are processed to see which subclusters and clusters
                        the sequences belong
                    (3) they will be handled in the next step
              */
              if (this.has_multiple_sequences) {
                const entities = this.primary_key_list[nodeid];
                if (entities) {
                  if (entities.length == 1) {
                    node.name = entities[0].id;
                    pg.node_objects.push(entities[0]);
                    existing_subclusters.add(entities[0].subcluster_label);
                    existing_clusters.add(entities[0].cluster);
                    return;
                  } else {
                    /*node.name = entities[0].id;
                    pg.node_objects.push(entities[0]);
                    for (let i = 1; i < entities.length; i++) {
                      pg.node_objects.push(entities[i]);
                      let node_entry = _.clone(node);
                      node_entry.name = entities[i].id;
                      node_entry.added = node.added;
                      inject_mspp_nodes.push(node_entry);
                    }*/

                    mspp_ms_nodes[nodeid] = {
                      subclusters: new Set(),
                      clusters: new Set(),
                    };
                    mspp_ms_nodes[nodeid] = [entities, _.clone(node)];

                    return;
                  }
                }
              }
              pg.not_in_network.push(nodeid);
            }
          });

          let discordant_node_record = [];

          if (_.size(mspp_ms_nodes)) {
            let entity_tracker = null;

            if (
              pg.createdBy == kGlobals.CDCCOICreatedBySyste ||
              pg.tracking == kGlobals.CDCCOITrackingOptions[0] ||
              pg.tracking == kGlobals.CDCCOITrackingOptions[1]
            ) {
              entity_tracker = existing_subclusters;
            } else {
              if (
                pg.tracking == kGlobals.CDCCOITrackingOptions[2] ||
                pg.tracking == kGlobals.CDCCOITrackingOptions[3]
              ) {
                entity_tracker = existing_clusters;
              }
            }

            if (!entity_tracker || entity_tracker.size == 0) {
              entity_tracker = {};
              entity_tracker.has = (n) => true;
            }

            _.each(mspp_ms_nodes, (n) => {
              const ref_node = n[1];
              _.each(n[0], (e) => {
                if (entity_tracker.has(e.subcluster_label)) {
                  pg.node_objects.push(e);
                  let node_entry = _.clone(ref_node);
                  node_entry.name = e.id;
                  node_entry.added = ref_node.added;
                  inject_mspp_nodes.push(node_entry);
                  //console.log ("Adding ", e);
                } else {
                  /*if (e.subcluster_label) {
                            console.log (pg.name, e);
                        }*/
                  discordant_node_record.push(e);
                }
              });
            });
          }

          _.each(inject_mspp_nodes, (n) => {
            pg.nodes.push(n);
          });

          /*if (discordant_node_record.length) {
            console.log (pg.name, discordant_node_record);
          }*/

          if (inject_mspp_nodes.length || discordant_node_record.length) {
            //console.log (pg.name, discordant_node_record);

            pg.description +=
              " Migrated to multiple sequences per person cluster";

            _.each(
              [
                [inject_mspp_nodes, "used the following sequences "],
                [discordant_node_record, "ignored the following sequences "],
              ],
              (pair, i) => {
                if (pair[0].length) {
                  let desc = {};

                  _.each(pair[0], (n) => {
                    let k = this.primary_key("id" in n ? n : { id: n.name });
                    if (!(k in desc)) {
                      desc[k] = [];
                    }
                    desc[k].push(n);
                    if (i == 0) {
                      pg.nodes.push(n);
                    }
                  });

                  pg.description +=
                    "; " +
                    pair[1] +
                    _.map(desc, (k, n) => {
                      return (
                        n +
                        " (" +
                        _.map(k, (no) => no.id || no.name).join(", ") +
                        ")"
                      );
                    }).join("; ");
                }
              }
            );
          }

          /**     extract network data at 0.015 and subcluster thresholds
                            filter on dates subsequent to the created date
          */

          const my_nodeset = new Set(_.map(pg.node_objects, (n) => n.id));

          /** all the network nodes connected to the nodes in the CoI at 1.5%; directly or indirectly*/

          if (!traversal_cache) {
            traversal_cache = [
              misc.hivtrace_compute_adjacency_with_edges(
                this.json["Nodes"],
                this.json["Edges"],
                (e) => e.length <= 0.015
              ),
              misc.hivtrace_compute_adjacency_with_edges(
                this.json["Nodes"],
                this.json["Edges"],
                (e) => e.length <= this.subcluster_threshold
              ),
            ];
          }

          let saved_traversal_edges = [];
          const node_set15 = _.flatten(
            misc.hivtrace_cluster_depthwise_traversal(
              this.json["Nodes"],
              this.json["Edges"],
              (e) => e.length <= 0.015,
              saved_traversal_edges,
              pg.node_objects,
              null,
              traversal_cache[0]
            )
          );

          let saved_traversal_edges_sub = [];

          /** all the network nodes connected to the nodes in the subcluster threshold (0.5%);
              also saves all the edges that have been taken if auto_extend is true  */

          const node_set_subcluster = _.flatten(
            misc.hivtrace_cluster_depthwise_traversal(
              this.json["Nodes"],
              this.json["Edges"],
              (e) => e.length <= this.subcluster_threshold,
              saved_traversal_edges_sub,
              pg.node_objects,
              null,
              traversal_cache[1]
            )
          );

          //console.log (saved_traversal_edges)

          const direct_at_15 = new Set();

          /** all the network nodes connected to the nodes in the CoI at 1.5%; only directly */

          const json15 = this.extract_single_cluster(
            node_set15,
            (e) =>
              e.length <= 0.015 &&
              (my_nodeset.has(this.json["Nodes"][e.target].id) ||
                my_nodeset.has(this.json["Nodes"][e.source].id)),
            //null,
            true,
            saved_traversal_edges
          );

          /** all the network nodes connected to the nodes in the CoI at 1.5%; only directly */

          _.each(json15["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json15["Nodes"][nid].id)) {
                direct_at_15.add(json15["Nodes"][nid].id);
              }
            });
          });

          const current_time = this.get_reference_date();

          /**  extract the 1.5% cluster network object */
          const json_subcluster = this.extract_single_cluster(
            node_set_subcluster,
            (e) =>
              e.length <= this.subcluster_threshold &&
              (my_nodeset.has(this.json["Nodes"][e.target].id) ||
                my_nodeset.has(this.json["Nodes"][e.source].id)),
            true,
            saved_traversal_edges_sub
          );

          const direct_subcluster = new Set();
          const direct_subcluster_new = new Set();

          /** process the cluster object to extract directly connected
              subcluster nodes and new nodes */

          _.each(json_subcluster["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json_subcluster["Nodes"][nid].id)) {
                direct_subcluster.add(json_subcluster["Nodes"][nid].id);

                if (
                  this.filter_by_date(
                    pg.modified || pg.created,
                    timeDateUtil._networkCDCDateField,
                    current_time,
                    json_subcluster["Nodes"][nid],
                    true
                  )
                ) {
                  direct_subcluster_new.add(json_subcluster["Nodes"][nid].id);
                }
              }
            });
          });

          /** partition all the CoI nodes into groups */
          pg.partitioned_nodes = _.map(
            [
              [node_set15, direct_at_15],
              [node_set_subcluster, direct_subcluster],
            ],
            (ns) => {
              const nodesets = {
                existing_direct: [],
                new_direct: [],
                existing_indirect: [],
                new_indirect: [],
              };

              _.each(ns[0], (n) => {
                if (my_nodeset.has(n.id)) return;
                let key;
                if (
                  this.filter_by_date(
                    pg.modified || pg.created,
                    timeDateUtil._networkCDCDateField,
                    current_time,
                    n,
                    true
                  )
                ) {
                  key = "new";
                } else {
                  key = "existing";
                }

                if (ns[1].has(n.id)) {
                  key += "_direct";
                } else {
                  key += "_indirect";
                }

                nodesets[key].push(n);
              });

              return nodesets;
            }
          );

          if (
            auto_extend &&
            pg.tracking !== kGlobals.CDCCOITrackingOptionsNone
          ) {
            const added_nodes = this.auto_expand_pg_handler(
              pg,
              nodeID2idx,
              edgesByNode
            );

            //console.log (pg.name, _.map ([...added_nodes], (n)=>this.json.Nodes[n]));

            if (added_nodes.size) {
              _.each([...added_nodes], (nid) => {
                const n = this.json.Nodes[nid];
                pg.nodes.push({
                  name: n.id,
                  added: current_time,
                  kind: kGlobals.CDCCOINodeKindDefault,
                  autoadded: true,
                });
                pg.node_objects.push(n);
              });
              pg.validated = false;
              pg.autoexpanded = true;
              pg.pending = true;
              pg.expanded = added_nodes.size;
              pg.modified = this.get_reference_date();
            }
          }

          /** check to see the CoI meets priority definitions */

          const node_set = new Set(
            this.unique_entity_list_from_ids(_.map(pg.nodes, (n) => n.name))
          );
          pg.meets_priority_def = _.some(
            priority_subclusters,
            (ps) =>
              _.filter([...ps], (psi) => node_set.has(psi)).length === ps.size
          );

          const recent_dx_cutoffs = [
            {
              field_name: "cluster_dx_recent12_mo",
              months: 12,
            },
            {
              field_name: "cluster_dx_recent36_mo",
              months: 36,
            },
          ];

          const ref_date = this.get_reference_date();

          for (let dx of recent_dx_cutoffs) {
            const cutoff = timeDateUtil.n_months_ago(
              this.get_reference_date(),
              dx.months
            );

            pg[dx.field_name] = this.unique_entity_list(
              _.filter(pg.node_objects, (n) =>
                this.filter_by_date(
                  cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  n,
                  false
                )
              )
            ).length;
          }

          // create / update history field of priority group
          pg.history = pg.history || [];

          const currDate = timeDateUtil.getCurrentDate();

          const history_entry = {
            date: currDate,
            size: this.priority_group_entity_count(pg),
            // TODO determine new nodes
            new_nodes: 0,
            national_priority: pg.meets_priority_def,
            cluster_dx_recent12_mo: pg.cluster_dx_recent12_mo,
            cluster_dx_recent36_mo: pg.cluster_dx_recent36_mo,
          };

          // remove any duplicate history entries from last 24 hours
          // (retain entries within 24 hours only if they differ from the current entry)
          pg.history = pg.history.filter(function (h) {
            if (
              h.size !== history_entry.size ||
              h.national_priority !== history_entry.national_priority ||
              h.cluster_dx_recent12_mo !==
                history_entry.cluster_dx_recent12_mo ||
              h.cluster_dx_recent36_mo !==
                history_entry.cluster_dx_recent36_mo ||
              h.new_nodes !== history_entry.new_nodes
            ) {
              return true;
            }
            if (
              new Date(h.date) <
              new Date(new Date(currDate) - 24 * 60 * 60 * 1000)
            ) {
              return true;
            }
            return false;
          });

          pg.history.push(history_entry);
        }
      });
    }
  }

  /** display a warning string */

  display_warning(warning_string, is_html) {
    if (this.network_warning_tag) {
      if (warning_string.length) {
        var warning_box = d3.select(this.network_warning_tag);
        warning_box.selectAll("div").remove();
        if (is_html) {
          warning_box.append("div").html(warning_string);
        } else {
          warning_box.append("div").text(warning_string);
        }
        warning_box.style("display", "block");
      } else {
        d3.select(this.network_warning_tag).style("display", "none");
      }
    }
  }

  /**
        Compute which CoI do various nodes belong to, and
        define additional attributes for each node
   */

  priority_groups_compute_node_membership() {
    const pg_nodesets = [];

    let node2set = {};

    _.each(this.defined_priority_groups, (g) => {
      pg_nodesets.push([
        g.name,
        g.createdBy === kGlobals.CDCCOICreatedBySystem,
      ]);

      _.each(g.nodes, (n) => {
        if (n.name in node2set) {
          node2set[n.name].push(pg_nodesets.length - 1);
        } else {
          node2set[n.name] = [pg_nodesets.length - 1];
        }
      });
    });

    const pg_enum = [
      "Yes (dx≤12 months)",
      "Yes (12<dx≤36 months)",
      "Yes (dx>36 months)",
      "No",
    ];

    /** define and populate categorical node attributes */

    const ref_date = this.get_reference_date();
    const object_ref = this;

    const attrib_defs = {
      subcluster_or_priority_node: {
        depends: [timeDateUtil._networkCDCDateField],
        label: kGlobals.CDCNPMember,
        enum: pg_enum,
        type: "String",
        volatile: true,
        color_scale: function () {
          return d3.scale
            .ordinal()
            .domain(pg_enum.concat([kGlobals.missing.label]))
            .range([
              "red",
              "orange",
              "yellow",
              "steelblue",
              kGlobals.missing.color,
            ]);
        },
        map: function (node) {
          const npcoi =
            node.id in node2set
              ? _.some(node2set[node.id], (d) => pg_nodesets[d][1])
              : false;
          if (npcoi) {
            const cutoffs = [
              timeDateUtil.n_months_ago(ref_date, 12),
              timeDateUtil.n_months_ago(ref_date, 36),
            ];

            if (
              object_ref.filter_by_date(
                cutoffs[0],
                timeDateUtil._networkCDCDateField,
                ref_date,
                node,
                false
              )
            ) {
              return pg_enum[0];
            }
            if (
              object_ref.filter_by_date(
                cutoffs[1],
                timeDateUtil._networkCDCDateField,
                ref_date,
                node,
                false
              )
            ) {
              return pg_enum[1];
            }

            return pg_enum[2];
          }
          return pg_enum[3];
        },
      },
      cluster_uid: {
        depends: [timeDateUtil._networkCDCDateField],
        label: "Clusters of Interest",
        type: "String",
        volatile: true,
        map: function (node) {
          const memberships = node2set[node.id] || [];
          if (memberships.length === 1) {
            return pg_nodesets[memberships[0]][0];
          } else if (memberships.length > 1) {
            return "Multiple";
          }
          return "None";
        },
      },
      subcluster_id: {
        depends: [timeDateUtil._networkCDCDateField],
        label: "Subcluster ID",
        type: "String",
        //label_format: d3.format(".2f"),
        map: function (node) {
          if (node) {
            return node.subcluster_label || "None";
          }
          return kGlobals.missing.label;
        },
      },
    };

    let subset = new Set();

    for (const [key, def] of Object.entries(attrib_defs)) {
      subset.add(key);
      this.populate_predefined_attribute(def, key);
    }

    //console.time ("SUBS");
    this._aux_populate_category_menus();
    //console.timeEnd ("SUBS");
  }

  /** Add an attribute value to the node object
      @param node [object] : node,
      @param id [string] : attribute id
      @param value : attribute value
  */

  static inject_attribute_node_value_by_id(node, id, value) {
    if (kGlobals.network.NodeAttributeID in node && id) {
      node[kGlobals.network.NodeAttributeID][id] = value;
    }
  }

  /** Generate a CoI node record
      @param node_id [string] : node name,
      @param date (optional) : creation date
      @param kind (optional) : node creation mode
  */

  priority_group_node_record(node_id, date, kind) {
    return {
      name: node_id,
      added: date || this.get_reference_date(),
      kind: kind || kGlobals.CDCCOINodeKindDefault,
      autoadded: true,
    };
  }

  /** read and process JSON files defining COI
        @param url [string]: load the data from here
        @param is_writeable [string]: if "writeable", changes to COI lists will be pushed back to the server
  
        This needs to be called AFTER the clusters/subclusters have been annotated
  */

  load_priority_sets(url, is_writeable) {
    d3.json(url, (error, results) => {
      if (error) {
        throw Error(
          "Failed loading cluster of interest file " + error.responseURL
        );
      } else {
        let latest_date = new Date();
        latest_date.setFullYear(1900);
        this.defined_priority_groups = _.clone(results);
        _.each(this.defined_priority_groups, (pg) => {
          _.each(pg.nodes, (n) => {
            try {
              n.added = timeDateUtil.DateFormats[0].parse(n.added);
              if (n.added > latest_date) {
                latest_date = n.added;
              }
            } catch {
              // do nothing
            }
          });
        });

        this.priority_set_table_writeable = is_writeable === "writeable";

        this.priority_groups_validate(
          this.defined_priority_groups,
          this._is_CDC_auto_mode
        );

        this.auto_create_priority_sets = [];
        /**
            check if the system needs to create/expand CoI
        */
        const today_string = timeDateUtil.DateFormats[0](
          this.get_reference_date()
        );
        this.map_ids_to_objects();

        if (this._is_CDC_auto_mode) {
          _.each(this.clusters, (cluster_data, cluster_id) => {
            _.each(cluster_data.subclusters, (subcluster_data) => {
              _.each(subcluster_data.priority_score, (priority_score, i) => {
                let priority_entities = this.unique_entity_list(
                  _.map(priority_score, (d) => ({ id: d }))
                );
                if (
                  priority_entities.length >=
                  this.CDC_data["autocreate-priority-set-size"]
                ) {
                  // only generate a new set if it doesn't match what is already there
                  const node_set = {};
                  _.each(subcluster_data.recent_nodes[i], (n) => {
                    node_set[n] = 1;
                  });

                  const matched_groups = _.filter(
                    _.filter(
                      this.defined_priority_groups,
                      (pg) =>
                        pg.kind in kGlobals.CDCCOICanAutoExpand &&
                        pg.createdBy === kGlobals.CDCCOICreatedBySystem &&
                        pg.tracking === kGlobals.CDCCOITrackingOptionsDefault
                    ),
                    (pg) => {
                      const matched = _.countBy(
                        _.map(pg.nodes, (pn) => pn.name in node_set)
                      );
                      return matched[true] >= 1;
                    }
                  );

                  if (matched_groups.length >= 1) {
                    return;
                  }

                  const autoname = this.generateClusterOfInterestID(
                    subcluster_data.cluster_id
                  );

                  this.auto_create_priority_sets.push({
                    name: autoname,
                    description:
                      "Automatically created cluster of interest " + autoname,
                    nodes: _.map(subcluster_data.recent_nodes[i], (n) =>
                      this.priority_group_node_record(
                        n,
                        this.get_reference_date()
                      )
                    ),
                    created: today_string,
                    kind: kGlobals.CDCCOIKindAutomaticCreation,
                    tracking: kGlobals.CDCCOITrackingOptions[0],
                    createdBy: kGlobals.CDCCOICreatedBySystem,
                    autocreated: true,
                    autoexpanded: false,
                    pending: true,
                  });
                }
              });
            });
          });
        }

        if (this.auto_create_priority_sets.length) {
          // SLKP 20200727 now check to see if any of the priority sets
          // need to be auto-generated
          //console.log (this.auto_create_priority_sets);
          this.defined_priority_groups.push(...this.auto_create_priority_sets);
        }
        const autocreated = this.defined_priority_groups.filter(
            (pg) => pg.autocreated
          ).length,
          autoexpanded = this.defined_priority_groups.filter(
            (pg) => pg.autoexpanded
          ).length,
          automatic_action_taken = autocreated + autoexpanded > 0,
          left_to_review = this.defined_priority_groups.filter(
            (pg) => pg.pending
          ).length;

        if (automatic_action_taken) {
          this.warning_string +=
            "<br/>Automatically created <b>" +
            autocreated +
            "</b> and expanded <b>" +
            autoexpanded +
            "</b> clusters of interest." +
            (left_to_review > 0
              ? " <b>Please review <span id='banner_coi_counts'></span> clusters in the <code>Clusters of Interest</code> tab.</b><br>"
              : "");
          this.display_warning(this.warning_string, true);
        }

        const tab_pill = this.get_ui_element_selector_by_role(
          "priority_set_counts",
          true
        );

        if (!this.priority_set_table_writeable) {
          const rationale =
            is_writeable === "old"
              ? "the network is <b>older</b> than some of the Clusters of Interest"
              : "the network was ran in <b>standalone</b> mode so no data is stored";
          this.warning_string += `<p class="alert alert-danger"class="alert alert-danger">READ-ONLY mode for Clusters of Interest is enabled because ${rationale}. None of the changes to clustersOI made during this session will be recorded.</p>`;
          this.display_warning(this.warning_string, true);
          if (tab_pill) {
            d3.select(tab_pill).text("Read-only");
          }
        } else if (tab_pill && left_to_review > 0) {
          d3.select(tab_pill).text(left_to_review);
          d3.select("#banner_coi_counts").text(left_to_review);
        }

        this.priority_groups_validate(this.defined_priority_groups);
        // Update the DB with the new ClusterOI
        const auto_create_priority_sets_names =
          this.auto_create_priority_sets.map((pg) => pg.name);
        _.each(this.defined_priority_groups, (pg) => {
          if (pg.name in auto_create_priority_sets_names) {
            this.priority_groups_update_node_sets(pg.name, "insert");
          } else {
            // update all ClusterOI (not only just expanded ones, since we need to update ClusterOI history)
            this.priority_groups_update_node_sets(pg.name, "update");
          }
        });

        clustersOfInterest.draw_priority_set_table(this);
        if (
          this.showing_diff &&
          this.has_network_attribute("subcluster_or_priority_node")
        ) {
          this.handle_attribute_categorical("subcluster_or_priority_node");
        }
        //this.update();
      }
    });
  }

  /**  add an attribute description
  
       Given an attribute definition (see comments elsewhere), and a key to associate it with
       do
  
  */

  inject_attribute_description(key, d) {
    if (kGlobals.network.GraphAttrbuteID in this.json) {
      var new_attr = {};
      new_attr[key] = d;
      _.extend(this.json[kGlobals.network.GraphAttrbuteID], new_attr);
      //this.json[kGlobals.network.GraphAttrbuteID][key] = _.clone (d);
    }
  }

  /**  populate_predefined_attribute
  
       Given an attribute definition (see comments elsewhere), and a key to associate it with
       do
  
       0. Inject the definition of the attribute into the network dictionary
       1. Compute the value of the attribute for all nodes
       2. Compute unique values
  
       @param computed (dict) : attribute definition
       @param key (string) : the key to associate with the attribute
  */

  populate_predefined_attribute(computed, key) {
    if (_.isFunction(computed)) {
      computed = computed(this);
    }

    if (
      !computed["depends"] ||
      _.every(computed["depends"], (d) =>
        _.has(this.json[kGlobals.network.GraphAttrbuteID], d)
      )
    ) {
      this.inject_attribute_description(key, computed);
      _.each(this.json.Nodes, (node) => {
        HIVTxNetwork.inject_attribute_node_value_by_id(
          node,
          key,
          computed["map"](node, this)
        );
      });

      // add unique values
      if (computed.enum) {
        this.uniqValues[key] = computed.enum;
      } else {
        var uniq_value_set = new Set();

        if (computed.type === "Date") {
          _.each(this.json.Nodes, (n) => {
            try {
              uniq_value_set.add(
                this.attribute_node_value_by_id(n, key).getTime()
              );
            } catch {}
          });
        } else {
          _.each(this.json.Nodes, (n) =>
            uniq_value_set.add(
              this.attribute_node_value_by_id(
                n,
                key,
                computed.type === "Number"
              )
            )
          );
        }

        this.uniqValues[key] = [...uniq_value_set];
        if (computed.type === "Number" || computed.type == "Date") {
          var color_stops =
            computed["color_stops"] || kGlobals.network.ContinuousColorStops;

          if (color_stops > this.uniqValues[key].length) {
            computed["color_stops"] = this.uniqValues[key].length;
          }

          if (computed.type === "Number") {
            computed.is_integer = _.every(this.uniqValues[key], (d) =>
              Number.isInteger(d)
            );
          }
        }
      }
      this.uniqs[key] = this.uniqValues[key].length;

      var extension = {};
      extension[key] = computed;

      _.extend(this.json[kGlobals.network.GraphAttrbuteID], extension);

      if (computed["overwrites"]) {
        if (
          _.has(
            this.json[kGlobals.network.GraphAttrbuteID],
            computed["overwrites"]
          )
        ) {
          this.json[kGlobals.network.GraphAttrbuteID][computed["overwrites"]][
            "_hidden_"
          ] = true;
        }
      }
    }
  }

  /**===================================================**/
  /** attribute callback definitions
  
        The following functions are generators for attribute callbacks.
        They return dict-like objects that contain fields used to populate
        and display network node and cluster attributes
  
        The fields in the attribute definition are as follows
  
        depends [optional]   : the list of node fields that must be defined in order for
                              this attribute to be computed; null = none
  
        label [required]     : the attribute label to display in the dropdown other locations
        enum  [optional]     : if provided as an array, specifies the set of allowed values
        volatile [optional]  : if non-null, tag this attribute for re-computation when certain
                               events take place
        color_scale[required]: value=>color map for rendering
        map[required]        : a function to compute attribute value from node data
        color_stops[optional]: # of color stops for a continuous variable that's binned
  
    */
  /**===================================================**/

  /**
        define an attribute generator for subcluster membership attribute
  
        @param network : the network / cluster object to ise
        @param data: reference date to use
  
        @return attribute definition
    */

  define_attribute_COI_membership(network, date) {
    date = date || this.get_reference_date();

    const subcluster_enum = [
      "No, dx>36 months", // 0
      "No, but dx�12 months",
      "Yes (dx�12 months)",
      "Yes (12<dx� 36 months)",
      "Future node", // 4
      "Not a member of subcluster", // 5
      "Not in a subcluster",
      "No, but 12<dx� 36 months",
    ];

    return {
      depends: [timeDateUtil._networkCDCDateField],
      label: "ClusterOI membership as of " + timeDateUtil.DateViewFormat(date),
      enum: subcluster_enum,
      //type: "String",
      volatile: true,
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(subcluster_enum.concat([kGlobals.missing.label]))
          .range(
            _.union(
              [
                "steelblue",
                "pink",
                "red",
                "#FF8C00",
                "#9A4EAE",
                "yellow",
                "#FFFFFF",
                "#FFD580",
              ],
              [kGlobals.missing.color]
            )
          );
      },

      map: function (node) {
        if (node.subcluster_label) {
          if (node.priority_flag > 0) {
            return subcluster_enum[node.priority_flag];
          }
          return subcluster_enum[0];
        }
        return subcluster_enum[6];
      },
    };
  }

  /**
        define an attribute generator for binned viral loads
  
        @param field: the node attribute field to use
        @param title: display this title for the attribute
  
        @return attribute definition dict
    */
  define_attribute_binned_vl(field, title) {
    const vl_bins = ["<200", "200-10000", ">10000"];

    return {
      depends: [field],
      label: title,
      enum: vl_bins,
      type: "String",
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(vl_bins.concat([kGlobals.missing.label]))
          .range(
            _.union(kGlobals.SequentialColor[3], [kGlobals.missing.color])
          );
      },

      map: (node) => {
        var vl_value = this.attribute_node_value_by_id(node, field, true);

        if (vl_value !== kGlobals.missing.label) {
          if (vl_value <= 200) {
            return vl_bins[0];
          }
          if (vl_value <= 10000) {
            return vl_bins[1];
          }
          return vl_bins[2];
        }

        return kGlobals.missing.label;
      },
    };
  }

  /**
        define an attribute generator for Viral load result interpretatio
  
        @return attribute definition dict
    */
  define_attribute_vl_interpretaion() {
    return {
      depends: ["vl_recent_value", "result_interpretation"],
      label: "Viral load result interpretation",
      color_stops: 6,
      scale: d3.scale.log(10).domain([10, 1e6]).range([0, 5]),
      category_values: ["Suppressed", "Viremic (above assay limit)"],
      type: "Number-categories",
      color_scale: (attr) => {
        var color_scale_d3 = d3.scale
          .linear()
          .range([
            "#d53e4f",
            "#fc8d59",
            "#fee08b",
            "#e6f598",
            "#99d594",
            "#3288bd",
          ])
          .domain(_.range(kGlobals.network.ContinuousColorStops, -1, -1));

        return function (v) {
          if (_.isNumber(v)) {
            return color_scale_d3(attr.scale(v));
          }
          switch (v) {
            case attr.category_values[0]:
              return color_scale_d3(0);
            case attr.category_values[1]:
              return color_scale_d3(5);
            default:
              return kGlobals.missing.color;
          }
        };
      },
      label_format: d3.format(",.0f"),
      map: (node) => {
        var vl_value = this.attribute_node_value_by_id(
          node,
          "vl_recent_value",
          true
        );
        var result_interpretation = this.attribute_node_value_by_id(
          node,
          "result_interpretation"
        );

        if (
          vl_value !== kGlobals.missing.label ||
          result_interpretation !== kGlobals.missing.label
        ) {
          if (result_interpretation !== kGlobals.missing.label) {
            if (result_interpretation === "<") {
              return "Suppressed";
            }
            if (result_interpretation === ">") {
              return "Viremic (above assay limit)";
            }
            if (vl_value !== kGlobals.missing.label) {
              return vl_value;
            }
          } else {
            return vl_value;
          }
        }

        return kGlobals.missing.label;
      },
    };
  }

  /**
        define an attribute generator for new network nodes/clusters
        @return attribute definition dict
    */

  define_attribute_network_update() {
    return {
      label: "Sequence updates compared to previous network",
      enum: ["Existing", "New", "Moved clusters"],
      type: "String",
      map: function (node) {
        if (HIVTxNetwork.is_new_node(node)) {
          return "New";
        }
        if (node.attributes.indexOf("moved_clusters") >= 0) {
          return "Moved clusters";
        }
        return "Existing";
      },
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain(["Existing", "New", "Moved clusters", kGlobals.missing.label])
          .range(["#7570b3", "#d95f02", "#1b9e77", "gray"]);
      },
    };
  }

  /**
        define an attribute generator for dx year
  
        @param relative: if T, compute dx date relative to the network date in years
        @param label: use this label
  
        @return attribute definition dict
    */

  define_attribute_dx_years(relative, label) {
    return {
      depends: [timeDateUtil._networkCDCDateField],
      label: label,
      type: "Number",
      label_format: relative ? d3.format(".2f") : d3.format(".0f"),
      map: (node) => {
        try {
          var value = this.parse_dates(
            this.attribute_node_value_by_id(
              node,
              timeDateUtil._networkCDCDateField
            )
          );

          if (value) {
            if (relative) {
              value = (this.get_reference_date() - value) / 31536000000;
            } else value = String(value.getFullYear());
          } else {
            value = kGlobals.missing.label;
          }

          return value;
        } catch {
          return kGlobals.missing.label;
        }
      },
      color_scale: function (attr) {
        const range_without_missing = _.without(
          attr.value_range,
          kGlobals.missing.label
        );
        const color_scale = _.compose(
          d3.interpolateRgb("#ffffcc", "#800026"),
          d3.scale
            .linear()
            .domain([
              range_without_missing[0],
              range_without_missing[range_without_missing.length - 1],
            ])
            .range([0, 1])
        );
        return function (v) {
          if (v === kGlobals.missing.label) {
            return kGlobals.missing.color;
          }
          return color_scale(v);
        };
      },
    };
  }

  /**
        Retrieve the list of sequences associated with a node
        @param pid: use this entity id
  
        @return list of sequence_ids
    */

  fetch_sequence_objects_for_pid(pid) {
    return this.primary_key_list[pid];
  }

  /**
        Retrieve the list of sequences associated with a node
        @param pid: use this entity id
  
        @return list of sequence_ids
    */

  fetch_sequences_for_pid(pid) {
    if (this.has_multiple_sequences) {
      return _.flatten(
        _.map(this.primary_key_list[pid], (d) =>
          d[kGlobals.network.AliasedSequencesID]
            ? d[kGlobals.network.AliasedSequencesID]
            : d.id
        )
      );
    }
    return this.primary_key_list[pid];
  }

  /**
        define an attribute generator for the number of sequences associated with this node
        @param label: use this label
        @return attribute definition dict
    */

  define_attribute_sequence_count(label) {
    return {
      depends: [],
      label: label,
      type: "Number",
      label_format: d3.format("d"),
      map: (node) => {
        if (node[kGlobals.network.AliasedSequencesID]) {
          return node[kGlobals.network.AliasedSequencesID].length;
        }
        if (this.has_multiple_sequences) {
          return this.fetch_sequences_for_pid(this.primary_key(node)).length;
        }
        return 1;
      },
      color_scale: function (attr) {
        const range_without_missing = _.without(
          attr.value_range,
          kGlobals.missing.label
        );
        const color_scale = _.compose(
          d3.interpolateRgb("#ffffcc", "#800026"),
          d3.scale
            .linear()
            .domain([
              range_without_missing[0],
              range_without_missing[range_without_missing.length - 1],
            ])
            .range([0, 1])
        );
        return function (v) {
          if (v === kGlobals.missing.label) {
            return kGlobals.missing.color;
          }
          return color_scale(v);
        };
      },
    };
  }

  define_attribute_age_dx() {
    return {
      depends: ["age_dx"],
      overwrites: "age_dx",
      label: "Age at Diagnosis",
      enum: ["<13", "13-19", "20-29", "30-39", "40-49", "50-59", "�60"],
      type: "String",
      color_scale: function () {
        return d3.scale
          .ordinal()
          .domain([
            "<13",
            "13-19",
            "20-29",
            "30-39",
            "40-49",
            "50-59",
            "�60",
            kGlobals.missing.label,
          ])
          .range([
            "#b10026",
            "#e31a1c",
            "#fc4e2a",
            "#fd8d3c",
            "#feb24c",
            "#fed976",
            "#ffffb2",
            "#636363",
          ]);
      },
      map: (node) => {
        var vl_value = this.attribute_node_value_by_id(node, "age_dx");
        if (vl_value === ">=60") {
          return "�60";
        }
        if (vl_value === "\ufffd60") {
          return "�60";
        }
        if (Number(vl_value) >= 60) {
          return "�60";
        }
        return vl_value;
      },
    };
  }

  /**
        Generate a function callback for attribute time series data
  
        @param export_items
            if set (and is an array), the function will add the callback to the array
            otherwise the callback will be invoked on this
  
        @return noting
    */

  check_for_time_series = function (export_items) {
    var event_handler = (network, e) => {
      if (e) {
        e = d3.select(e);
      }
      if (!network.network_cluster_dynamics) {
        network.network_cluster_dynamics = network.network_svg
          .append("g")
          .attr("id", this.dom_prefix + "-dynamics-svg")
          .attr("transform", "translate (" + network.width * 0.45 + ",0)");

        network.handle_inline_charts = function (plot_filter) {
          var attr = null;
          var color = null;
          if (
            network.colorizer["category_id"] &&
            !network.colorizer["continuous"]
          ) {
            var attr_desc =
              network.json[kGlobals.network.GraphAttrbuteID][
                network.colorizer["category_id"]
              ];
            attr = {};
            attr[network.colorizer["category_id"]] = attr_desc["label"];
            color = {};
            color[attr_desc["label"]] = network.colorizer["category"];
          }

          misc.cluster_dynamics(
            network.extract_network_time_series(
              timeDateUtil.getClusterTimeScale(),
              attr,
              plot_filter
            ),
            network.network_cluster_dynamics,
            "Quarter of Diagnosis",
            "Number of Cases",
            null,
            null,
            {
              base_line: 20,
              top: network.margin.top,
              right: network.margin.right,
              bottom: 3 * 20,
              left: 5 * 20,
              font_size: 12,
              rect_size: 14,
              width: network.width / 2,
              height: network.height / 2,
              colorizer: color,
              prefix: network.dom_prefix,
              barchart: true,
              drag: {
                x: network.width * 0.45,
                y: 0,
              },
            }
          );
        };
        network.handle_inline_charts();
        if (e) {
          e.text("Hide time-course plots");
        }
      } else {
        if (e) {
          e.text("Show time-course plots");
        }
        network.network_cluster_dynamics.remove();
        network.network_cluster_dynamics = null;
        network.handle_inline_charts = null;
      }
    };

    if (timeDateUtil.getClusterTimeScale()) {
      if (export_items) {
        export_items.push(["Show time-course plots", event_handler]);
      } else {
        event_handler(this);
      }
    }
  };

  /**
    annotate_cluster_changes
  
    If the network contains information about cluster changes (new/moved/deleted nodes, etc),
    this function will annotate cluster objects (in place) with various attributes
        "delta" : change in the size of the cluster
        "flag"  : a status flag to be used in the cluster display table
            if set to 2 then TBD
            if set to 3 then TBD
  
  */

  annotate_cluster_changes() {
    if (this.cluster_attributes) {
      _.each(this.cluster_attributes, (cluster) => {
        if ("old_size" in cluster && "size" in cluster) {
          cluster["delta"] = cluster["size"] - cluster["old_size"];
          cluster["deleted"] =
            cluster["old_size"] +
            (cluster["new_nodes"] ? cluster["new_nodes"] : 0) -
            cluster["size"];
        } else if (cluster["type"] === "new") {
          cluster["delta"] = cluster["size"];
          if ("moved" in cluster) {
            cluster["delta"] -= cluster["moved"];
          }
        } else {
          cluster["delta"] = 0;
        }
        cluster["flag"] = cluster["moved"] || cluster["deleted"] ? 2 : 3;
      });
    }
  }

  /**
    extract_individual_level_records
  
    for networks that have multiple sequences per individual, this function
    will reduce the list of node records to only include those that have
    attribute data. If more than one node has attribute data, the first one
    (chosen based on the sorting order when this.primary_key_list was initialized)
    is returned.
  
  */

  extract_individual_level_records() {
    if (this.has_multiple_sequences && this.primary_key_list) {
      let patient_records = [];
      _.each(this.primary_key_list, (records, pkey) => {
        if (records.length > 1) {
          //console.log (_.find (records, (r)=> !r['missing_attributes']));
          patient_records.push(
            _.find(records, (r) => !r["missing_attributes"]) || records[0]
          );
        } else {
          patient_records.push(records[0]);
        }
      });
      return patient_records;
    }
    return this.json.Nodes;
  }

  /**
    aggregate_indvidual_level_records
  
    for networks that have multiple sequences per individual, this function
    will reduce the list of node records to only have one per primary key
    all attributes where more than one value is present will be shown as ';' separated
  
  */

  aggregate_indvidual_level_records(node_list) {
    node_list = node_list || this.json.Nodes;

    const aggregator = (values, key, record, store_key) => {
      let unique_values = _.countBy(values, (dn) => dn[key]);

      delete unique_values["undefined"];

      if (_.size(unique_values) == 1) {
        record[store_key] = values[0][key];
      } else {
        if (_.size(unique_values) > 0) {
          record[store_key] = _.map(unique_values, (d3, k3) => k3).join(";");
        }
      }
    };

    if (this.has_multiple_sequences) {
      let binned = _.groupBy(node_list, (n) => this.primary_key(n));
      let new_list = [];
      _.each(binned, (values, key) => {
        if (values.length == 1) {
          new_list.push(_.clone(values[0]));
        } else {
          let new_record = _.clone(values[0]);
          new_record[kGlobals.network.NodeAttributeID] = _.object(
            _.map(new_record[kGlobals.network.NodeAttributeID], (d, k) => {
              const proto = this.json[kGlobals.network.GraphAttrbuteID][k];

              let unique_values = _.countBy(
                values,
                (dn) => dn[kGlobals.network.NodeAttributeID][k]
              );

              if (_.size(unique_values) == 1) {
                return [k, values[0][kGlobals.network.NodeAttributeID][k]];
              } else {
                if (proto.type == "Date") {
                  try {
                    return [
                      k,
                      new Date(
                        Date.parse(d3.min(_.map(unique_values, (d3, k3) => k3)))
                      ),
                    ];
                  } catch {
                    return [k, null];
                  }
                } else {
                  return [
                    k,
                    _.sortBy(_.map(unique_values, (d3, k3) => k3)).join(";"),
                  ];
                }
              }
            })
          );

          aggregator(values, "cluster", new_record, "cluster");
          aggregator(
            values,
            "subcluster_label",
            new_record,
            "subcluster_label"
          );

          new_record[kGlobals.network.AliasedSequencesID] = _.flatten(
            _.map(values, (d) =>
              d[kGlobals.network.AliasedSequencesID]
                ? d[kGlobals.network.AliasedSequencesID]
                : d.id
            )
          );
          new_record[kGlobals.network.NodeAttributeID]["sequence_count"] =
            new_record[kGlobals.network.AliasedSequencesID].length;
          new_list.push(new_record);
        }
      });
      return new_list;
    }
    return node_list;
  }

  /**
    generate an entity (primary key) id from string
  
    @param node_name (string)
  
    returns [String] entity id
  */

  entity_id_from_string(node_name) {
    return this.primary_key({ id: node_name });
  }

  /**
    generate an entity (primary key) id from node
  
    @param node (Object)
  
    returns [String] entity id
  */

  entity_id(node) {
    return this.primary_key(node);
  }

  apply_to_entities(cb) {
    if (this.has_multiple_sequences) {
      _.each(this.primary_key_list, (d, k) => {
        cb(k, d);
      });
    }
  }

  /**
    generate a list of sequence IDs represented by a node
  
    @param node (Object)
  
    returns [array] list of sequence ids
  */
  list_of_aliased_sequences(node) {
    return node[kGlobals.network.AliasedSequencesID]
      ? node[kGlobals.network.AliasedSequencesID]
      : [node.id];
  }
}

module.exports = {
  HIVTxNetwork,
};
