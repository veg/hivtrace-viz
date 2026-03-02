var _ = require("underscore");

/**
 * Represents the core HIV transmission network data model and analysis logic.
 * Decoupled from browser-specific UI/SVG logic.
 */
class HTXModel {
  constructor(json, primary_key_function, options) {
    this.json = json;
    this.options = options || {};
    this.CDC_data = json.CDC_data || {};
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

    this.tabulate_multiple_sequences();
    this.defined_priority_groups = [];
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
    if (!this.isPrimaryGraph && this.parent_graph_object) {
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

  priority_groups_automatic(kGlobals) {
    return _.filter(
      this.defined_priority_groups,
      (pg) => pg.createdBy === kGlobals.CDCCOICreatedBySystem
    ).length;
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
    return node.attributes.indexOf("new_node") >= 0;
  }

  map_ids_to_objects() {
    if (!this.node_id_to_object) {
      this.node_id_to_object = {};

      _.each(this.json.Nodes, (n, i) => {
        this.node_id_to_object[n.id] = n;
      });
    }
  }

  parse_dates(value, timeDateUtil) {
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
    var node_dx = this.attribute_node_value_by_id(
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

    var entities_by_pg = {};
    var size_by_pg = {};
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
  }

  priority_groups_compute_overlap_mjc(mjc_groups, own_groups, kGlobals) {
    this.priority_node_overlap = {};

    if (!mjc_groups || !own_groups) {
      return;
    }

    // Build a map of entity lists & sizes for mjc_groups (we will iterate mjc_groups later)
    var size_by_pg = {};

    // Also keep sizes for own_groups for superset/duplicate checks
    var size_by_own = {};

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
        if (nodes.length == size_by_pg[pg.name]) {
          if (size_by_own[own_name] == size_by_pg[pg.name]) {
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
          pg.validated = true;
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

          /** check for nodes that are in the CoI but may be missing from the network */

          let updated_pg_record = false;
          let inject_mspp_nodes = [];
          let mspp_ms_nodes = {};
          let existing_subclusters = new Set();
          let existing_clusters = new Set();

          let node_records_to_delete = new Set();
          let do_not_add_duplicates = new Set();

          _.each(pg.nodes, (node) => {
            const nodeid = node.name;
            if (nodeid in this.node_id_to_object) {
              const n = this.node_id_to_object[nodeid];
              existing_subclusters.add(n.subcluster_label);
              existing_clusters.add(n.cluster);
              pg.node_objects.push(n);
              do_not_add_duplicates.add(nodeid);
            } else {
              if (this.has_multiple_sequences) {
                let entities = this.primary_key_list[nodeid];
                if (entities) {
                  if (entities.length == 1) {
                    node.name = entities[0].id;
                    pg.node_objects.push(entities[0]);
                    existing_subclusters.add(entities[0].subcluster_label);
                    existing_clusters.add(entities[0].cluster);
                    do_not_add_duplicates.add(nodeid);
                    return;
                  } else {
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
              pg.createdBy == kGlobals.CDCCOICreatedBySystem ||
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
              node_records_to_delete.add(ref_node.name);

              _.each(n[0], (e) => {
                if (entity_tracker.has(e.subcluster_label)) {
                  pg.node_objects.push(e);
                  let node_entry = _.clone(ref_node);
                  node_entry.name = e.id;
                  node_entry.added = ref_node.added;
                  inject_mspp_nodes.push(node_entry);
                  pg.nodes.push(node_entry);
                } else {
                  discordant_node_record.push(e);
                }
              });
            });
          }

          /** spaghetti code to check for duplicates **/

          const check_for_ID_duplicates = _.groupBy(pg.nodes, (n) => n.name);
          const prune_duplicates = new Set();

          _.each(check_for_ID_duplicates, (grp, id) => {
            if (_.size(grp) > 1) {
              prune_duplicates.add(id);
            }
          });

          if (node_records_to_delete.size) {
            pg.nodes = _.filter(
              pg.nodes,
              (n) => !node_records_to_delete.has(n.name)
            );
          }

          if (prune_duplicates.size) {
            let already_processed = new Set();
            let filtered_nodes = [];
            _.each(pg.nodes, (n) => {
              if (prune_duplicates.has(n.name)) {
                if (already_processed.has(n.name)) {
                  return;
                } else {
                  already_processed.add(n.name);
                }
              }
              filtered_nodes.push(n);
            });
            pg.nodes = filtered_nodes;
            let filtered_node_objects = [];
            already_processed = new Set();
            _.each(pg.node_objects, (n) => {
              if (prune_duplicates.has(n.id)) {
                if (already_processed.has(n.id)) {
                  return;
                } else {
                  already_processed.add(n.id);
                }
              }
              filtered_node_objects.push(n);
            });
            pg.node_objects = filtered_node_objects;
          }

          const migration_tag =
            " Migrated to multiple sequences per person cluster";

          if (prune_duplicates.size || node_records_to_delete.size) {
            let notes_cleanup = pg.description.split(migration_tag);
            if (notes_cleanup.length > 1) {
              const bits = _.countBy(notes_cleanup.slice(1, -1));
              pg.description = notes_cleanup[0] + migration_tag;
              _.each(bits, (v, k) => {
                pg.description += k;
              });
            }
          }

          if (inject_mspp_nodes.length || discordant_node_record.length) {
            pg.description += migration_tag;

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

          const direct_at_15 = new Set();

          /** all the network nodes connected to the nodes in the CoI at 1.5%; only directly */

          const json15 = this.extract_single_cluster(
            node_set15,
            (e) =>
              e.length <= 0.015 &&
              (my_nodeset.has(this.json["Nodes"][e.target].id) ||
                my_nodeset.has(this.json["Nodes"][e.source].id)),
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
                    true,
                    timeDateUtil,
                    kGlobals
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
                    true,
                    timeDateUtil,
                    kGlobals
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
              edgesByNode,
              kGlobals,
              timeDateUtil,
              misc
            );

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
                  false,
                  timeDateUtil,
                  kGlobals
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
