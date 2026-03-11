const _ = require("underscore");

/**
 * Represents the core HIV transmission network data model and analysis logic.
 * Decoupled from browser-specific UI/SVG logic.
 */
class HTXModel {
  constructor(json, primary_key_function, options) {
    this.json = json;
    this.options = options || {};
    this.is_primary_graph = _.isUndefined(this.options.is_primary_graph)
      ? true
      : this.options.is_primary_graph;

    this.today = this.lookup_option("today", null, options);
    if (!this.today) {
      if (json.Settings && json.Settings.created) {
        this.today = new Date(json.Settings.created);
      } else {
        this.today = new Date();
      }
    } else {
      this.today = new Date(this.today);
    }

    this.CDC_data = _.extend(
      {
        "autocreate-priority-set-size": 5,
        "autocreate-priority-set-span": 36,
        "autocreate-priority-set-recent": 12,
        timestamp: this.today,
        jurisdiction_code: this.options.jurisdiction_code || "NC",
      },
      json.CDC_data || {}
    );

    if (this.options.jurisdiction) {
      const jurisdiction_key = this.options.jurisdiction
        .toLowerCase()
        .replace(/\s/g, "");
      if (
        this.options.kGlobals &&
        jurisdiction_key in this.options.kGlobals.CDCJurisdictionCodes
      ) {
        this.CDC_data["jurisdiction_code"] =
          this.options.kGlobals.CDCJurisdictionCodes[
            jurisdiction_key
          ].toUpperCase();
      } else if (!this.CDC_data["jurisdiction_code"]) {
        this.CDC_data["jurisdiction_code"] = "PG";
      }

      if (
        this.options.kGlobals &&
        this.options.kGlobals.CDCJurisdictionLowMorbidity.has(jurisdiction_key)
      ) {
        this.CDC_data["autocreate-priority-set-size"] = 3;
      }
    }

    this.CDC_data["autocreate-priority-set-size"] = parseInt(
      this.CDC_data["autocreate-priority-set-size"]
    );
    this.clusters = [];
    this.warning_string = "";
    this.cluster_attributes = [];
    this.minimum_cluster_size = 0;
    this.defined_priority_groups = [];
    this.auto_create_priority_sets = [];
    this.node_id_to_object = null;
    this.priority_node_overlap = {};

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

    this.tabulate_multiple_sequences(options && options.kGlobals);
    this.map_ids_to_objects();
    this.using_time_filter = null;
    
    this.cluster_filtering_functions = {
      size: (cluster) => this.filter_by_size(cluster),
      singletons: (cluster) => this.filter_singletons(cluster),
    };
  }

  filter_by_size(cluster) {
    return cluster.children.length >= this.minimum_cluster_size;
  }

  filter_singletons(cluster) {
    return cluster.children.length > 1;
  }

  filter_if_added(cluster) {
    return this.cluster_attributes[cluster.cluster_id].type !== "existing";
  }

  filter_time_period(cluster, timeDateUtil, kGlobals) {
    return _.some(
      this.nodes_by_cluster[cluster.cluster_id],
      (n) =>
        this.attribute_node_value_by_id(
          n,
          timeDateUtil.getClusterTimeScale(),
          false,
          false,
          false,
          kGlobals
        ) >= this.using_time_filter
    );
  }

  cluster_display_filter(cluster) {
    return _.every(this.cluster_filtering_functions, (f) => f(cluster));
  }

  get_reference_date() {
    if (!this.is_primary_graph && this.parent_graph_object) {
      return this.parent_graph_object.today;
    }

    return this.today;
  }

  lookup_option(key, default_value, options) {
    if (this.json.Settings && this.json.Settings[key]) {
      return this.json.Settings[key];
    }
    if (options && options[key]) return options[key];
    return default_value;
  }

  priority_groups_pending() {
    return _.filter(this.defined_priority_groups, (pg) => pg.pending).length;
  }

  priority_groups_expanded() {
    return _.filter(this.defined_priority_groups, (pg) => pg.expanded).length;
  }

  /**
   * Process priority groups data: parse dates, validate, auto-create, and compute overlap.
   */
  priority_groups_process_data(
    raw_groups,
    auto_mode,
    kGlobals,
    timeDateUtil,
    misc
  ) {
    this.defined_priority_groups = _.clone(raw_groups);
    _.each(this.defined_priority_groups, (pg) => {
      _.each(pg.nodes, (n) => {
        try {
          if (n.added === "REDACTED") {
            return;
          }
          n.added = this.parse_dates(n.added, timeDateUtil);
        } catch {
          // do nothing
        }
      });
    });

    this.priority_groups_validate(
      this.defined_priority_groups,
      auto_mode,
      kGlobals,
      timeDateUtil,
      misc
    );

    let auto_created = [];
    if (auto_mode) {
      auto_created = this.priority_groups_automatic_creation(
        kGlobals,
        timeDateUtil
      );
      if (auto_created.length) {
        this.defined_priority_groups.push(...auto_created);
        this.priority_groups_validate(
          auto_created,
          false,
          kGlobals,
          timeDateUtil,
          misc
        );
      }
    }

    this.priority_groups_compute_overlap(this.defined_priority_groups, kGlobals);

    return {
      autocreated: auto_created.length,
      autoexpanded: _.filter(this.defined_priority_groups, (pg) => pg.autoexpanded)
        .length,
      pending: _.filter(this.defined_priority_groups, (pg) => pg.pending).length,
    };
  }

  priority_groups_automatic(kGlobals) {
    return _.filter(
      this.defined_priority_groups,
      (pg) => pg.createdBy === kGlobals.CDCCOICreatedBySystem
    ).length;
  }

  /**
   * Process the network to simplify multiple sequences per individual
   */
  process_multiple_sequences(
    kGlobals,
    misc,
    reduce_distance_within,
    reduce_distance_between
  ) {
    if (this.has_multiple_sequences && this.is_primary_graph) {
      reduce_distance_within = reduce_distance_within || 0.000001;
      reduce_distance_between = reduce_distance_between || 0.015;

      const clusters = misc.hivtrace_cluster_depthwise_traversal(
        this.json.Nodes,
        this.json.Edges
      );

      const complete_clusters = misc.hivtrace_cluster_depthwise_traversal(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= reduce_distance_within
      );

      const adjacency = misc.hivtrace_compute_adjacency(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= reduce_distance_between
      );

      const adjacency05 = misc.hivtrace_compute_adjacency(
        this.json.Nodes,
        this.json.Edges,
        (d) => d.length <= 0.005
      );
      const nodes_to_delete = new Set();

      _.each(clusters, (cluster) => {
        const entity_list = this.unique_entity_list(cluster);
        if (entity_list.length === 1) {
          _.each(cluster, (ncn) => {
            nodes_to_delete.add(ncn.id);
          });
        }
      });

      _.each(complete_clusters, (cluster) => {
        if (cluster.length > 1) {
          if (_.some(cluster, (n) => nodes_to_delete.has(n.id))) {
            return;
          }

          const uel = this.unique_entity_object_list(cluster);

          _.each(uel, (dup_seqs) => {
            if (dup_seqs.length > 1) {
              const dup_ids = new Set(_.map(dup_seqs, (d) => d.id));

              const neighborhood = new Set(
                _.map(
                  _.filter(
                    [...adjacency[dup_seqs[0].id]],
                    (d) => !dup_ids.has(d)
                  )
                )
              );
              const neighborhood05 = new Set(
                _.map(
                  _.filter(
                    [...adjacency05[dup_seqs[0].id]],
                    (d) => !dup_ids.has(d)
                  )
                )
              );
              let reduce = true;

              for (let idx = 1; idx < dup_seqs.length; idx += 1) {
                const other_nbhd = new Set(
                  _.map(
                    _.filter(
                      [...adjacency[dup_seqs[idx].id]],
                      (d) => !dup_ids.has(d)
                    )
                  )
                );
                const other_nbhd05 = new Set(
                  _.map(
                    _.filter(
                      [...adjacency05[dup_seqs[idx].id]],
                      (d) => !dup_ids.has(d)
                    )
                  )
                );

                if (
                  !HTXModel.are_sets_equal(other_nbhd, neighborhood) ||
                  !HTXModel.are_sets_equal(other_nbhd05, neighborhood05)
                ) {
                  reduce = false;
                  break;
                }
              }
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

      if (nodes_to_delete.size) {
        const new_node_list = [];
        const new_edge_set = [];
        const old_node_idx_to_new_node_idx = [];
        let new_counter = 0;

        _.each(this.json.Nodes, (n) => {
          if (nodes_to_delete.has(n.id)) {
            old_node_idx_to_new_node_idx.push(-1);
          } else {
            new_node_list.push(n);
            old_node_idx_to_new_node_idx.push(new_counter);
            new_counter++;
          }
        });

        _.each(this.json.Edges, (e) => {
          const new_source = old_node_idx_to_new_node_idx[e.source],
            new_target = old_node_idx_to_new_node_idx[e.target];

          if (new_source >= 0 && new_target >= 0) {
            e.source = new_source;
            e.target = new_target;
            new_edge_set.push(e);
          }
        });

        this.json.Nodes = new_node_list;
        this.json.Edges = new_edge_set;

        this.tabulate_multiple_sequences(kGlobals);
        this.map_ids_to_objects();
      }
    }
  }

  /**
   * Annotate node objects with fields that indicate membership in multiple clusters or subclusters.
   */
  annotate_multiple_clusters_on_nodes() {
    if (this.has_multiple_sequences) {
      const entities_in_multiple_clusters = {};
      _.each(this.primary_key_list, (nodes, key) => {
        if (nodes.length >= 2) {
          const cl = _.groupBy(nodes, (n) => n.cluster);
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
          const sub_cl = _.filter(
            _.map(
              _.groupBy(nodes, (n) => n.subcluster_label),
              (d, k) => k
            ),
            (d) => d !== "undefined"
          );
          if (_.size(sub_cl) > 1) {
            _.each(nodes, (n) => {
              n["multiple subclusters"] = sub_cl;
            });
          } else {
            _.each(nodes, (n) => {
              delete n["multiple subclusters"];
            });
          }
        }
      });
      this.entities_in_multiple_clusters = entities_in_multiple_clusters;
    }
  }

  /**
   * Reduces sequences representing the same entity into one node.
   */
  simplify_multisequence_cluster(filtered_json, kGlobals, misc) {
    const reduced_nodes = _.pairs(
      _.mapObject(this.unique_entity_object_list(filtered_json.Nodes), (v) =>
        this.aggregate_indvidual_level_records(v)[0]
      )
    );

    const uid_index = _.object(_.map(reduced_nodes, (d, i) => [d[0], i]));
    const oui_index = {};

    _.each(reduced_nodes, (d) => {
      const aliased = d[1][kGlobals.network.AliasedSequencesID] || [d[1].id];
      _.each(aliased, (nn) => {
        oui_index[nn] = uid_index[d[0]];
      });
    });

    const reduced_adjacency = _.map(uid_index, () =>
      _.map(uid_index, () => 0)
    );
    const reduced_lengths = _.map(uid_index, () => _.map(uid_index, () => 0));

    _.each(filtered_json.Edges, (e) => {
      const reduced_src = oui_index[filtered_json.Nodes[e.source].id],
        reduced_tgt = oui_index[filtered_json.Nodes[e.target].id];

      if (reduced_src !== reduced_tgt) {
        reduced_adjacency[reduced_src][reduced_tgt] += 1;
        reduced_adjacency[reduced_tgt][reduced_src] += 1;
        reduced_lengths[reduced_src][reduced_tgt] += e.length;
        reduced_lengths[reduced_tgt][reduced_src] += e.length;
      }
    });

    const reduced_edges = [];

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

  static are_sets_equal(set1, set2) {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  priority_groups_find_by_name(name) {
    if (this.defined_priority_groups) {
      const result = _.find(
        this.defined_priority_groups,
        (g) => g.name === name
      );
      if (result) return result;
    }
    if (this.options.isMJCNetwork && this.own_defined_priority_groups) {
      return _.find(this.own_defined_priority_groups, (g) => g.name === name);
    }
    return null;
  }

  static is_new_node(node) {
    return node.attributes && node.attributes.indexOf("new_node") >= 0;
  }

  map_ids_to_objects() {
    this.node_id_to_object = {};
    const kGlobals = this.options.kGlobals;
    const AliasedSequencesID = kGlobals
      ? kGlobals.network.AliasedSequencesID
      : "aliased_sequences";

    _.each(this.json.Nodes, (n) => {
      this.node_id_to_object[n.id] = n;
      if (n[AliasedSequencesID]) {
        _.each(n[AliasedSequencesID], (id) => {
          this.node_id_to_object[id] = n;
        });
      }
    });
  }

  parse_dates(value, timeDateUtil) {
    if (value instanceof Date) {
      return value;
    }
    let parsed_value = null;

    const passed = _.any(timeDateUtil.DateFormats, (f) => {
      parsed_value = f.parse(value);
      return parsed_value;
    });

    if (passed) {
      if (
        this.options._is_CDC_ &&
        (parsed_value.getFullYear() < 1970 ||
          parsed_value.getFullYear() > timeDateUtil.DateUpperBoundYear)
      ) {
        throw Error("Invalid date");
      }
      return parsed_value;
    }

    throw Error("Invalid date");
  }

  filter_by_date(
    cutoff,
    date_field,
    start_date,
    node,
    count_newly_added,
    timeDateUtil,
    kGlobals
  ) {
    if (count_newly_added && HTXModel.is_new_node(node)) {
      return true;
    }
    let node_dx = this.attribute_node_value_by_id(
      node,
      date_field,
      false,
      false,
      false,
      kGlobals
    );
    if (node_dx instanceof Date) {
      return node_dx >= cutoff && node_dx <= start_date;
    }
    try {
      node_dx = this.parse_dates(node_dx, timeDateUtil);
      if (node_dx instanceof Date) {
        return node_dx >= cutoff && node_dx <= start_date;
      }
    } catch (e) {
      return undefined;
    }
    return false;
  }

  priority_group_entity_count(pg) {
    return this.unique_entity_list_from_ids(_.map(pg.nodes, (n) => n.name))
      .length;
  }

  generateClusterOfInterestID(subcluster_id, timeDateUtil) {
    const id =
      `${this.CDC_data["jurisdiction_code"]}_${timeDateUtil.DateViewFormatClusterCreate(this.CDC_data["timestamp"])}_${subcluster_id}`;

    let suffix = "";
    let k = 1;
    let found =
      this.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
      this.defined_priority_groups.find((d) => d.name === id + suffix);
    while (found !== undefined) {
      suffix = `_${k}`;
      k++;
      found =
        this.auto_create_priority_sets.find((d) => d.name === id + suffix) ||
        this.defined_priority_groups.find((d) => d.name === id + suffix);
    }
    return id + suffix;
  }

  priority_group_node_record(node_id, date, kGlobals) {
    return {
      name: node_id,
      added: date || this.get_reference_date(),
      kind: kGlobals ? kGlobals.CDCCOINodeKindDefault : "Default",
      autoadded: true,
    };
  }

  auto_expand_pg_handler(
    pg,
    nodeID2idx,
    edgesByNode,
    kGlobals,
    timeDateUtil,
    misc
  ) {
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
        const node_list = [...core_node_set];
        const node_set = new Set(node_list);

        for (let i = 0; i < node_list.length; i++) {
          const d = node_list[i];
          if (d in this.json.Nodes) {
            _.each([...edgesByNode[d]], (e) => {
              const add_nodes = [];

              if (!node_set.has(e.source)) {
                add_nodes.push(e.source);
              }
              if (!node_set.has(e.target)) {
                add_nodes.push(e.target);
              }

              _.each(add_nodes, (n2a) => {
                node_list.push(n2a);
                node_set.add(n2a);
              });
            });
          }
        }

        const edge_set_temp = new Set();
        _.each(
          _.filter(node_list, (d) => d in this.json.Nodes),
          (d) => {
            for (const e of edgesByNode[d]) {
              edge_set_temp.add(e);
            }
          }
        );

        edge_set = [...edge_set_temp];
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
                  this.json.Nodes[e.source],
                  false,
                  timeDateUtil,
                  kGlobals
                ) &&
                this.filter_by_date(
                  time_cutoff,
                  timeDateUtil._networkCDCDateField,
                  ref_date,
                  this.json.Nodes[e.target],
                  false,
                  timeDateUtil,
                  kGlobals
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
  }

  priority_groups_compute_overlap(groups, kGlobals) {
    this.priority_node_overlap = {};

    const entities_by_pg = {};
    const size_by_pg = {};
    _.each(groups, (pg) => {
      entities_by_pg[pg.name] = this.aggregate_indvidual_level_records(
        pg.node_objects,
        kGlobals
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
        if (nodes.length === size_by_pg[pg.name]) {
          if (size_by_pg[name] === size_by_pg[pg.name]) {
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
  }

  priority_groups_compute_overlap_mjc(mjc_groups, own_groups, kGlobals) {
    this.priority_node_overlap = {};

    if (!mjc_groups || !own_groups) {
      return;
    }

    // Build a map of entity lists & sizes for mjc_groups (we will iterate mjc_groups later)
    const size_by_pg = {};

    // Also keep sizes for own_groups for superset/duplicate checks
    const size_by_own = {};

    // 1) Build priority_node_overlap from own_groups (entity => Set of own PG names)
    _.each(own_groups, (pg) => {
      const ents = this.aggregate_indvidual_level_records(pg.nodes, kGlobals);
      size_by_own[pg.name] = ents.length;

      _.each(ents, (n) => {
        const entity_id = this.entity_id(n);
        if (!(entity_id in this.priority_node_overlap)) {
          this.priority_node_overlap[entity_id] = new Set();
        }
        this.priority_node_overlap[entity_id].add(pg.name);
      });
    });

    // 3) For each mjc group, compute overlap only considering nodes that are present in own_groups
    _.each(mjc_groups, (pg) => {
      const overlap = {
        sets: new Set(),
        nodes: 0,
        supersets: [],
        duplicates: [],
      };

      const by_set_count = {};
      _.each(pg.nodes, (n) => {
        const entity_id = this.entity_id(n);

        // Only care about nodes in mjc_groups that are present in own_groups
        if (
          entity_id in this.priority_node_overlap &&
          this.priority_node_overlap[entity_id].size > 0
        ) {
          overlap.nodes++;
          this.priority_node_overlap[entity_id].forEach((own_pg_name) => {
            // Collect counts per owning PG (these are names from own_groups)
            if (!(own_pg_name in by_set_count)) {
              by_set_count[own_pg_name] = [];
            }
            by_set_count[own_pg_name].push(entity_id);

            overlap.sets.add(own_pg_name);
          });
        }
      });

      // Determine supersets/duplicates: if an own_group contains ALL entities of this mjc_group (within our intersection),
      // then it's either a superset or a duplicate (same size).
      _.each(by_set_count, (nodes, own_name) => {
        if (nodes.length === size_by_pg[pg.name]) {
          if (size_by_own[own_name] === size_by_pg[pg.name]) {
            overlap.duplicates.push(own_name);
          } else {
            overlap.supersets.push(own_name);
          }
        }
      });

      // assign overlap summary to the mjc group
      pg.overlap = {
        nodes: overlap.nodes,
        // sets = number of distinct own_groups that share nodes with this mjc_group
        sets: overlap.sets.size,
        superset: overlap.supersets,
        duplicate: overlap.duplicates,
      };
    });
  }

  aggregate_indvidual_level_records(node_list, kGlobals) {
    if (this.options.isMJCNetwork) {
      return _.uniq(node_list, (n) => n.id ?? n.name);
    }
    node_list = node_list || this.json.Nodes;

    const aggregator = (values, key, record, store_key) => {
      const unique_values = _.countBy(values, (dn) => dn[key]);

      delete unique_values["undefined"];

      if (_.size(unique_values) === 1) {
        record[store_key] = values[0][key];
      } else {
        if (_.size(unique_values) > 0) {
          record[store_key] = _.map(unique_values, (d3, k3) => k3).join(";");
        }
      }
    };

    if (this.has_multiple_sequences) {
      const binned = _.groupBy(node_list, (n) => this.primary_key(n));
      const new_list = [];
      _.each(binned, (values) => {
        if (values.length === 1) {
          new_list.push(_.clone(values[0]));
        } else {
          const new_record = _.clone(values[0]);
          new_record[kGlobals.network.NodeAttributeID] = _.object(
            _.map(new_record[kGlobals.network.NodeAttributeID], (d, k) => {
              const proto = this.json[kGlobals.network.GraphAttrbuteID][k];
              const unique_values = _.countBy(
                values,
                (dn) => dn[kGlobals.network.NodeAttributeID][k]
              );

              if (_.size(unique_values) === 1) {
                return [k, values[0][kGlobals.network.NodeAttributeID][k]];
              } else {
                if (proto.type === "Date") {
                  try {
                    return [
                      k,
                      new Date(
                        Date.parse(_.min(_.map(unique_values, (d3, k3) => k3)))
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

  entity_id_from_string(node_name) {
    return this.primary_key({ id: node_name });
  }

  entity_id(node) {
    return this.primary_key(node);
  }

  cleanRedacted(id) {
    if (id.startsWith("REDACTED_")) {
      return "REDACTED";
    }
    return id;
  }

  apply_to_entities(cb) {
    if (this.has_multiple_sequences) {
      _.each(this.primary_key_list, (d, k) => {
        cb(k, d);
      });
    }
  }

  list_of_aliased_sequences(node, kGlobals) {
    return node[kGlobals.network.AliasedSequencesID]
      ? node[kGlobals.network.AliasedSequencesID]
      : [node.id];
  }

  priority_groups_is_new_node(node) {
    return node.autoadded;
  }

  priority_groups_export(group_set, include_unvalidated, timeDateUtil) {
    group_set = group_set || this.defined_priority_groups;

    return _.map(
      _.filter(group_set, (g) => include_unvalidated || g.validated),
      (g) => ({
        name: g.name,
        description: g.description,
        nodes: g.nodes,
        modified:
          g.modified === "REDACTED"
            ? g.modified
            : timeDateUtil.DateFormats[0](g.modified),
        kind: g.kind,
        created:
          g.modified === "REDACTED"
            ? g.created
            : timeDateUtil.DateFormats[0](g.created),
        createdBy: g.createdBy,
        tracking: g.tracking,
        autocreated: g.autocreated,
        autoexpanded: g.autoexpanded,
        pending: g.pending,
        validated: g.validated,
        meets_priority_def: g.meets_priority_def,
        history: g.history,
      })
    );
  }

  priority_groups_export_nodes(
    group_set,
    include_unvalidated,
    kGlobals,
    timeDateUtil
  ) {
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

          const entities = this.aggregate_indvidual_level_records(
            g.node_objects,
            kGlobals
          );

          cluster_detect_size = this.unique_entity_list_from_ids(
            _.map(
              _.filter(g.nodes, (node) => {
                return node.added <= g.created;
              }),
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
                _.filter(
                  this.list_of_aliased_sequences(gn, kGlobals),
                  (s) => !exclude_nodes.has(s)
                ).length > 0
              );
            }),
            (gn) => {
              const eid = this.entity_id(gn);
              return {
                eHARS_uid: this.cleanRedacted(eid),
                cluster_uid: this.cleanRedacted(g.name),
                cluster_ident_method: g.kind,
                person_ident_method: entity_to_pg_records[eid][0].kind,
                person_ident_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
                  entity_to_pg_records[eid][0].added
                ),
                sample_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
                  _.min(
                    _.map(entity_to_g_records[eid], (g) =>
                      this.attribute_node_value_by_id(
                        g,
                        "sample_dt",
                        false,
                        false,
                        false,
                        kGlobals
                      )
                    )
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
                SequenceID: this.list_of_aliased_sequences(gn, kGlobals)
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
  }

  priority_groups_export_sets(kGlobals, timeDateUtil) {
    return _.flatten(
      _.map(
        _.filter(this.defined_priority_groups, (g) => g.validated),
        (g) => ({
          cluster_type: g.createdBy,
          cluster_uid: this.cleanRedacted(g.name),
          cluster_modified_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
            g.modified
          ),
          cluster_created_dt: timeDateUtil.hivtrace_date_or_na_if_missing(
            g.created
          ),
          cluster_ident_method: g.kind,
          cluster_growth: kGlobals.CDCCOIConciseTrackingOptions[g.tracking],
          cluster_current_size: this.aggregate_indvidual_level_records(
            g.node_objects,
            kGlobals
          ).length,
          national_priority: g.meets_priority_def,
          cluster_dx_recent12_mo: g.cluster_dx_recent12_mo,
          cluster_dx_recent36_mo: g.cluster_dx_recent36_mo,
          cluster_overlap: g.overlap.sets,
        })
      )
    );
  }

  priority_groups_automatic_creation(kGlobals, timeDateUtil) {
    const today_string = timeDateUtil.DateFormats[0](this.get_reference_date());
    this.auto_create_priority_sets = [];

    _.each(this.clusters, (cluster_data) => {
      _.each(cluster_data.subclusters, (subcluster_data) => {
        _.each(subcluster_data.priority_score, (priority_score, i) => {
          const priority_entities = this.unique_entity_list(
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
              subcluster_data.cluster_id,
              timeDateUtil
            );

            this.auto_create_priority_sets.push({
              name: autoname,
              description:
                `Automatically created cluster of interest ${autoname}`,
              nodes: _.map(subcluster_data.recent_nodes[i], (n) =>
                this.priority_group_node_record(n, this.get_reference_date())
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

    return this.auto_create_priority_sets;
  }

  priority_groups_validate(
    groups,
    auto_extend,
    kGlobals,
    timeDateUtil,
    misc
  ) {
    if (_.some(groups, (g) => !g.validated)) {
      /** extract the list of clusters meeting national priority criteria,
          these have been precomputed elsewhere (priority_score)
      */

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

      {
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

          if (pg.created !== "REDACTED") {
            pg.created = _.isDate(pg.created)
              ? pg.created
              : timeDateUtil.DateFormats[0].parse(pg.created);
          }
          if (pg.modified) {
            if (pg.modified !== "REDACTED") {
              pg.modified = _.isDate(pg.modified)
                ? pg.modified
                : timeDateUtil.DateFormats[0].parse(pg.modified);
            }
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

          /** Step 1: Normalization, Deduplication, and MSPP Migration */

          const seen_ids = new Set();
          const unique_nodes = [];
          const mspp_ms_nodes = {};
          const existing_subclusters = new Set();
          const existing_clusters = new Set();

          _.each(pg.nodes, (node) => {
            const nodeid = node.name;
            if (seen_ids.has(nodeid)) return;

            if (nodeid in this.node_id_to_object) {
              const n = this.node_id_to_object[nodeid];
              existing_subclusters.add(n.subcluster_label);
              existing_clusters.add(n.cluster);
              pg.node_objects.push(n);
              seen_ids.add(nodeid);
              unique_nodes.push(node);
            } else {
              // Not in network
              if (this.has_multiple_sequences) {
                const p_key = this.primary_key({ id: nodeid });
                const is_subject_only = nodeid === p_key;
                const entities = this.primary_key_list[p_key];

                if (is_subject_only && entities) {
                  // Trigger migration for subject-only record
                  if (!(p_key in mspp_ms_nodes)) {
                    mspp_ms_nodes[p_key] = [entities, node];
                  }
                  return;
                }
              }
              // It's a missing sequence (or a person not in network)
              pg.not_in_network.push(nodeid);
              seen_ids.add(nodeid);
              unique_nodes.push(node);
            }
          });

          pg.nodes = unique_nodes;

          const inject_mspp_nodes = [];
          const discordant_node_record = [];

          if (_.size(mspp_ms_nodes)) {
            let entity_tracker = null;

            if (
              pg.createdBy === kGlobals.CDCCOICreatedBySystem ||
              pg.tracking === kGlobals.CDCCOITrackingOptions[0] ||
              pg.tracking === kGlobals.CDCCOITrackingOptions[1]
            ) {
              entity_tracker = existing_subclusters;
            } else {
              if (
                pg.tracking === kGlobals.CDCCOITrackingOptions[2] ||
                pg.tracking === kGlobals.CDCCOITrackingOptions[3]
              ) {
                entity_tracker = existing_clusters;
              }
            }

            if (!entity_tracker || entity_tracker.size === 0) {
              entity_tracker = { has: () => true };
            }

            _.each(mspp_ms_nodes, (data) => {
              const entities = data[0];
              const ref_node = data[1];

              _.each(entities, (e) => {
                if (entity_tracker.has(e.subcluster_label)) {
                  if (!seen_ids.has(e.id)) {
                    pg.node_objects.push(e);
                    const node_entry = _.clone(ref_node);
                    node_entry.name = e.id;
                    node_entry.added = ref_node.added;
                    inject_mspp_nodes.push(node_entry);
                    pg.nodes.push(node_entry);
                    seen_ids.add(e.id);
                  }
                } else {
                  discordant_node_record.push(e);
                }
              });
            });
          }

          const migration_tag =
            " Migrated to multiple sequences per person cluster";

          if (inject_mspp_nodes.length || discordant_node_record.length) {
            const notes_cleanup = pg.description.split(migration_tag);
            pg.description = notes_cleanup[0] + migration_tag;

            _.each(
              [
                [inject_mspp_nodes, "used the following sequences "],
                [discordant_node_record, "ignored the following sequences "],
              ],
              (pair) => {
                if (pair[0].length) {
                  const desc = {};
                  _.each(pair[0], (n) => {
                    const k = this.primary_key("id" in n ? n : { id: n.name });
                    if (!(k in desc)) desc[k] = [];
                    desc[k].push(n);
                  });

                  pg.description +=
                    `; ${pair[1]}${_.map(desc, (k, n) => `${n} (${_.map(k, (no) => no.id || no.name).join(", ")})`).join("; ")}`;
                }
              }
            );
          }

          /** Step 2: Auto-expansion (BEFORE expensive traversals) */

          if (
            auto_extend &&
            pg.tracking !== kGlobals.CDCCOITrackingOptionsNone
          ) {
            const added_nodes = this.auto_expand_pg_handler(
              pg,
              nodeID2idx,
              edgesByNode,
              kGlobals,
              timeDateUtil,
              misc
            );

            if (added_nodes.size) {
              const current_time = this.get_reference_date();
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
              pg.autoexpanded = true;
              pg.pending = true;
              pg.expanded = added_nodes.size;
              pg.modified = current_time;
            }
          }

          /** Step 3: Expensive Network Traversals and Partitioning */

          const my_nodeset = new Set(_.map(pg.node_objects, (n) => n.id));

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

          const saved_traversal_edges = [];
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

          const saved_traversal_edges_sub = [];
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

          const current_time = this.get_reference_date();
          const direct_at_15 = new Set();
          const json15 = this.extract_single_cluster(
            node_set15,
            (e) =>
              e.length <= 0.015 &&
              (my_nodeset.has(this.json["Nodes"][e.target].id) ||
                my_nodeset.has(this.json["Nodes"][e.source].id)),
            true,
            saved_traversal_edges
          );

          _.each(json15["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json15["Nodes"][nid].id)) {
                direct_at_15.add(json15["Nodes"][nid].id);
              }
            });
          });

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
          _.each(json_subcluster["Edges"], (e) => {
            _.each([e.source, e.target], (nid) => {
              if (!my_nodeset.has(json_subcluster["Nodes"][nid].id)) {
                direct_subcluster.add(json_subcluster["Nodes"][nid].id);
              }
            });
          });

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
                    true,
                    timeDateUtil,
                    kGlobals
                  )
                ) {
                  key = "new";
                } else {
                  key = "existing";
                }
                key += ns[1].has(n.id) ? "_direct" : "_indirect";
                nodesets[key].push(n);
              });
              return nodesets;
            }
          );

          /** Step 4: Finalize Validation Metrics */

          const node_set = new Set(
            this.unique_entity_list_from_ids(_.map(pg.nodes, (n) => n.name))
          );
          pg.meets_priority_def = _.some(
            priority_subclusters,
            (ps) =>
              _.filter([...ps], (psi) => node_set.has(psi)).length === ps.size
          );

          const dx_cutoffs = [
            { name: "cluster_dx_recent12_mo", months: 12 },
            { name: "cluster_dx_recent36_mo", months: 36 },
          ];

          for (const dx of dx_cutoffs) {
            const cutoff = timeDateUtil.n_months_ago(
              this.get_reference_date(),
              dx.months
            );
            pg[dx.name] = this.unique_entity_list(
              _.filter(pg.node_objects, (n) =>
                this.filter_by_date(
                  cutoff,
                  timeDateUtil._networkCDCDateField,
                  current_time,
                  n,
                  false,
                  timeDateUtil,
                  kGlobals
                )
              )
            ).length;
          }

          pg.history = pg.history || [];
          const currDate = timeDateUtil.getCurrentDate();
          const history_entry = {
            date: currDate,
            size: this.priority_group_entity_count(pg),
            new_nodes: 0,
            national_priority: pg.meets_priority_def,
            cluster_dx_recent12_mo: pg.cluster_dx_recent12_mo,
            cluster_dx_recent36_mo: pg.cluster_dx_recent36_mo,
          };

          pg.history = pg.history.filter((h) => {
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
            return (
              new Date(h.date) <
              new Date(new Date(currDate) - 24 * 60 * 60 * 1000)
            );
          });

          pg.history.push(history_entry);
          pg.validated = true;
        }
      });
    }
  }

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

  compute_clusters() {
    this.nodes_by_cluster = _.groupBy(this.json.Nodes, "cluster");
    this.cluster_mapping = {};
    this.clusters = _.map(this.nodes_by_cluster, (value, key) => {
      const index = _.size(this.cluster_mapping);
      this.cluster_mapping[key] = index;
      return {
        cluster_id: key,
        children: value,
      };
    });
  }

  compute_node_degrees(nodes, edges) {
    _.each(nodes, (n) => {
      n.degree = 0;
    });
    _.each(edges, (e) => {
      nodes[e.source].degree++;
      nodes[e.target].degree++;
    });
  }

  parse_node_date_attributes(kGlobals, timeDateUtil) {
    const NodeAttributeID = kGlobals.network.NodeAttributeID;
    const GraphAttrbuteID = kGlobals.network.GraphAttrbuteID;

    _.each(this.json[GraphAttrbuteID], (d, k) => {
      if (d.type === "Date") {
        _.each(this.json.Nodes, (nd) => {
          try {
            const a_date = nd[NodeAttributeID][k];
            if (a_date && !_.isDate(a_date)) {
              nd[NodeAttributeID][k] = this.parse_dates(a_date, timeDateUtil);
            }
          } catch (err) {
            // ignore
          }
        });
      }
    });
  }

  compute_subclusters(kGlobals, timeDateUtil, misc) {
    this.parse_node_date_attributes(kGlobals, timeDateUtil);
    this.subcluster_threshold = this.lookup_option(
      "subcluster_threshold",
      0.005
    );
    const date_field = timeDateUtil._networkCDCDateField;
    const ref_date = this.get_reference_date();
    const cutoff_long = timeDateUtil.n_months_ago(ref_date, 36);
    const cutoff_short = timeDateUtil.n_months_ago(ref_date, 12);

    const split_clusters = {};
    const node_id_to_local_cluster = {};

    _.each(this.json.Nodes, (node) => {
      if (node.cluster) {
        if (!(node.cluster in split_clusters)) {
          split_clusters[node.cluster] = { Nodes: [], Edges: [] };
        }
        node_id_to_local_cluster[node.id] =
          split_clusters[node.cluster]["Nodes"].length;
        split_clusters[node.cluster]["Nodes"].push(node);
      }
    });

    _.each(this.json.Edges, (edge) => {
      if (edge.length <= this.subcluster_threshold) {
        const source_node = this.json.Nodes[edge.source];
        const target_node = this.json.Nodes[edge.target];

        if (source_node && target_node) {
          const edge_cluster = source_node.cluster;
          const source_id = source_node.id;
          const target_id = target_node.id;

          if (
            source_id in node_id_to_local_cluster &&
            target_id in node_id_to_local_cluster &&
            edge_cluster === target_node.cluster
          ) {
            const copied_edge = _.clone(edge);
            copied_edge.source = node_id_to_local_cluster[source_id];
            copied_edge.target = node_id_to_local_cluster[target_id];
            split_clusters[edge_cluster]["Edges"].push(copied_edge);
          }
        }
      }
    });

    _.each(split_clusters, (cluster_nodes, cluster_index) => {
      const array_index = this.cluster_mapping[cluster_index];
      if (_.isUndefined(array_index)) return;

      this.clusters[array_index].priority_score = 0;

      const edges = [];
      let null_subcluster_filter = (cc) => cc.length > 1;

      if (this.has_multiple_sequences) {
        null_subcluster_filter = (cc) => this.unique_entity_list(cc).length > 1;
      }

      const subclusters = _.filter(
        misc.hivtrace_cluster_depthwise_traversal(
          cluster_nodes.Nodes,
          cluster_nodes.Edges,
          (e) => e.length <= this.subcluster_threshold,
          edges
        ),
        null_subcluster_filter
      );

      const oldest_nodes_first = (n1, n2) => {
        const d1 = this.attribute_node_value_by_id(
          n1,
          date_field,
          false,
          false,
          false,
          kGlobals
        );
        const d2 = this.attribute_node_value_by_id(
          n2,
          date_field,
          false,
          false,
          false,
          kGlobals
        );

        if (d1 === d2) {
          return n1.id < n2.id ? -1 : 1;
        }
        return d1 < d2 ? -1 : 1;
      };

      _.each(subclusters, (c) => c.sort(oldest_nodes_first));
      subclusters.sort((c1, c2) => oldest_nodes_first(c1[0], c2[0]));

      this.clusters[array_index].subclusters = _.map(subclusters, (c, i) => {
        const subcluster_id = i + 1;
        const label =
          `${this.clusters[array_index].cluster_id}${kGlobals.SubclusterSeparator}${subcluster_id}`;

        _.each(c, (n) => {
          n.subcluster_label = label;
          n.priority_flag = 0;
        });

        return {
          children: _.clone(c),
          parent_cluster: this.clusters[array_index],
          cluster_id: label,
        };
      });

      _.each(this.clusters[array_index].subclusters, (sub) => {
        const date_filter = (n) =>
          this.filter_by_date(
            cutoff_long,
            date_field,
            ref_date,
            n,
            false,
            timeDateUtil,
            kGlobals
          );

        const subcluster_json = this.extract_single_cluster(
          _.filter(sub.children, date_filter),
          null,
          true,
          cluster_nodes
        );

        const components = _.filter(
          misc.hivtrace_cluster_depthwise_traversal(
            subcluster_json.Nodes,
            _.filter(
              subcluster_json.Edges,
              (e) => e.length <= this.subcluster_threshold
            )
          ),
          (cc) => this.unique_entity_list(cc).length >= 2
        );

        sub.priority_score = [];
        sub.recent_nodes = [];

        _.each(components, (cc) => {
          const dx12 = _.filter(cc, (n) =>
            this.filter_by_date(
              cutoff_short,
              date_field,
              ref_date,
              n,
              false,
              timeDateUtil,
              kGlobals
            )
          );

          sub.recent_nodes.push(_.map(cc, (n) => n.id));

          if (
            this.unique_entity_list(dx12).length >=
            this.CDC_data["autocreate-priority-set-size"]
          ) {
            sub.priority_score.push(_.map(cc, (n) => n.id));
          }
        });

        if (sub.priority_score.length) {
          _.each(sub.priority_score, (ps) => {
            _.each(ps, (nid) => {
              const n = _.find(sub.children, (cn) => cn.id === nid);
              if (n) {
                if (
                  this.filter_by_date(
                    cutoff_short,
                    date_field,
                    ref_date,
                    n,
                    false,
                    timeDateUtil,
                    kGlobals
                  )
                ) {
                  n.priority_flag = 2;
                } else {
                  n.priority_flag = 3;
                }
              }
            });
          });
        }
      });
    });
  }

  /**
   * Groups all edges in `this.json.Edges` by the primary key of their source and target nodes.
   */
  group_edges_by_primary_key() {
    const edges_by_primary_key = {};

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
      _.each(this.primary_key_list, (seqs) => {
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
            _.mapObject(consensus_attributes, (d) => {
              const freq = _.countBy(d, (i) => i);
              if (_.size(freq) === 1) {
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

  unique_entity_list(node_list) {
    return _.map(
      _.groupBy(node_list, (n) => this.primary_key(n)),
      (d, k) => k
    );
  }

  unique_entity_list_from_ids(node_list) {
    return this.unique_entity_list(
      _.map(node_list, (d) => ({ id: d }))
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
    const cluster_json = {};
    const map_to_id = {};

    cluster_json.Nodes = _.map(nodes, (c, i) => {
      map_to_id[c.id] = i;

      if (no_clone) {
        return c;
      }

      const cc = _.clone(c);
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
      const ne = _.clone(e);
      ne.source = map_to_id[given_json.Nodes[e.source].id];
      ne.target = map_to_id[given_json.Nodes[e.target].id];
      return ne;
    });

    return cluster_json;
  }
}

module.exports = HTXModel;
