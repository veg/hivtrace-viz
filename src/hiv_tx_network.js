var _ = require("underscore"),
  timeDateUtil = require("./timeDateUtil.js"),
  kGlobals = require("./globals.js"),
  misc = require("./misc.js"),
  clustersOfInterest = require("./clustersOfInterest.js"),
  HTXModel = require("./core/HTXModel.js");

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

class HIVTxNetwork extends HTXModel {
  constructor(json, button_bar_ui, primary_key_function, secondaryGraph) {
    super(json, primary_key_function);
    this.button_bar_ui = button_bar_ui;
    this.subcluster_table = null;
    this.priority_set_table_write = null;
    this.priority_set_table_writeable = null;
    this.isPrimaryGraph = !secondaryGraph;
    this.nodeFilterObject = null;
    this.defined_priority_groups = [];
    this.using_time_filter = null;

    this.filter_by_size = this.filter_by_size.bind(this);
    this.filter_singletons = this.filter_singletons.bind(this);
    this.filter_if_added = this.filter_if_added.bind(this);
    this.filter_time_period = this.filter_time_period.bind(this);

    this.tabulate_multiple_sequences(kGlobals);

    /** initialize UI/UX elements */
    this.initialize_ui_ux_elements();
  }

  attribute_node_value_by_id(d, id, number, is_date, check_redacted) {
    return super.attribute_node_value_by_id(
      d,
      id,
      number,
      is_date,
      check_redacted,
      kGlobals
    );
  }

  static inject_attribute_node_value_by_id(node, id, value) {
    return HTXModel.inject_attribute_node_value_by_id(node, id, value, kGlobals);
  }

  filter_time_period(cluster) {
    return super.filter_time_period(cluster, timeDateUtil, kGlobals);
  }

  filter_if_added(cluster) {
    return super.filter_if_added(cluster);
  }

  filter_by_size(cluster) {
    return super.filter_by_size(cluster);
  }

  filter_singletons(cluster) {
    return super.filter_singletons(cluster);
  }

  priority_groups_pending() {
    return super.priority_groups_pending();
  }

  priority_groups_expanded() {
    return super.priority_groups_expanded();
  }

  priority_groups_automatic() {
    return super.priority_groups_automatic(kGlobals);
  }

  priority_groups_find_by_name(name) {
    return super.priority_groups_find_by_name(name);
  }

  priority_group_entity_count(pg) {
    return super.priority_group_entity_count(pg);
  }

  priority_groups_validate(groups, auto_extend) {
    return super.priority_groups_validate(
      groups,
      auto_extend,
      kGlobals,
      timeDateUtil,
      misc
    );
  }

  priority_groups_compute_overlap(groups) {
    return super.priority_groups_compute_overlap(groups, kGlobals);
  }

  priority_groups_compute_overlap_mjc(mjc_groups, own_groups) {
    return super.priority_groups_compute_overlap_mjc(
      mjc_groups,
      own_groups,
      kGlobals
    );
  }

  aggregate_indvidual_level_records(node_list) {
    return super.aggregate_indvidual_level_records(node_list, kGlobals);
  }

  apply_to_entities(cb) {
    return super.apply_to_entities(cb);
  }

  list_of_aliased_sequences(node) {
    return super.list_of_aliased_sequences(node, kGlobals);
  }

  generateClusterOfInterestID(subcluster_id) {
    return super.generateClusterOfInterestID(subcluster_id, timeDateUtil);
  }

  priority_group_node_record(node_id, date) {
    return super.priority_group_node_record(node_id, date, kGlobals);
  }

  static is_new_node(node) {
    return HTXModel.is_new_node(node);
  }

  map_ids_to_objects() {
    return super.map_ids_to_objects();
  }

  parse_dates(value) {
    return super.parse_dates(value, timeDateUtil);
  }

  filter_by_date(cutoff, date_field, start_date, node, count_newly_added) {
    return super.filter_by_date(
      cutoff,
      date_field,
      start_date,
      node,
      count_newly_added,
      timeDateUtil,
      kGlobals
    );
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
        Generates the HTML for a priority membership list form.
    */
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
      const result = _.find(
        this.defined_priority_groups,
        (g) => g.name === name
      );
      if (result) return result;
    }
    // For MJC networks, also check own_defined_priority_groups
    if (this.isMJCNetwork && this.own_defined_priority_groups) {
      return _.find(this.own_defined_priority_groups, (g) => g.name === name);
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

  /** generate the name for a cluster of interest */
  generateClusterOfInterestID(subcluster_id) {
    return super.generateClusterOfInterestID(subcluster_id, timeDateUtil);
  }

  /** Fetch the value of an attribute from the node
    @param d: node object
    @param id: [string] the attribute whose value should be fetched
    @param number: [bool] if true, only return numerical values
    @param is_date: [bool] if true, parse the value as a date
    @param check_redacted: [bool] if true, check if the attribute is redacted and return "REDACTED" label

 */

  /**
        Grow a CoI defined in @pg based on its growth mode
        @return the set of added nodes (by numeric ID)
        @nodeID2idx : if provided, maps the name of the node to its index
                      in the `nodes` array; avoids repeated traversal if provided
        @edgesByNode : if provided, maps the INDEX of the node to the list of edges in the entire network

  */

  auto_expand_pg_handler(pg, nodeID2idx, edgesByNode) {
    return super.auto_expand_pg_handler(
      pg,
      nodeID2idx,
      edgesByNode,
      kGlobals,
      timeDateUtil,
      misc
    );
  }

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

      // For MJC networks, use MJC-specific endpoint
      if (this.isMJCNetwork && this.mjcUUID) {
        const url = `/mjc/results/${
          this.mjcUUID
        }/clusteroi/${encodeURIComponent(name)}/description`;
        d3.text(url)
          .header("Content-Type", "application/json")
          .send(
            "PUT",
            JSON.stringify({ description: description }),
            (error, data) => {
              if (error) {
                console.error("Error saving MJC ClusterOI description:", error);
              }
            }
          );
      } else {
        this.priority_groups_update_node_sets(name, "update");
      }

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
                new Set(this.list_of_aliased_sequences(gn)).difference(
                  exclude_nodes
                ).size > 0
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

  /**
        Counts the number of unique entities in a priority group.
        @param pg: The priority group object.
    */
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

    //console.log (node2set);

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
          /*if (node && node.subcluster_label && node.subcluster_label == "10.2") {
             console.log (node);
          }*/
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
    if (this._is_CDC_ && !this.isMJCNetwork) {
      this.define_node_search_table();
    }

    //console.timeEnd ("SUBS");
  }

  /** Add an attribute value to the node object
      @param node [object] : node,
      @param id [string] : attribute id
      @param value : attribute value
  */

  /** Generate a CoI node record
      @param node_id [string] : node name,
      @param date (optional) : creation date
      @param kind (optional) : node creation mode
  */

  /** read and process JSON files defining COI
        @param url [string]: load the data from here
        @param is_writeable [string]: if "writeable", changes to COI lists will be pushed back to the server
  
        This needs to be called AFTER the clusters/subclusters have been annotated
  */

  fetch_priority_sets(url, callback) {
    d3.json(url, (error, results) => {
      if (error) {
        throw Error(
          "Failed loading cluster of interest file " + error.responseURL
        );
      } else {
        callback(results);
      }
    });
  }

  load_priority_sets(url, is_writeable) {
    this.fetch_priority_sets(url, (results) => {
      let latest_date = new Date();
      latest_date.setFullYear(1900);
      this.defined_priority_groups = _.clone(results);
      _.each(this.defined_priority_groups, (pg) => {
        _.each(pg.nodes, (n) => {
          try {
            if (n.added === "REDACTED") {
              return;
            }
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

      // Skip read-only warning for MJC networks (they are read-only by design)
      if (!this.priority_set_table_writeable && !this.isMJCNetwork) {
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
    });
  }

  MJCloadOwnPrioritySets(options) {
    if (this.isMJCNetwork && options["own-priority-sets-url"]) {
      this.own_priority_set_url = options["own-priority-sets-url"];
      this.fetch_priority_sets(this.own_priority_set_url, (results) => {
        this.own_defined_priority_groups = results;
      });
    }
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
        const attr_value = computed["map"](node, this);

        //if (key == "priority_set") {
        //    console.log (node.id, node.priority_set, node._added_date, attr_value);
        //}
        HIVTxNetwork.inject_attribute_node_value_by_id(node, key, attr_value);
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

  define_attribute_mjc_date_added(label) {
    return {
      depends: [],
      label: label,
      type: "Date",
      map: (node) => {
        // will be dynamically injected into node every time a MJ ClusterOI is viewed
        return kGlobals.missing.label;
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
              timeDateUtil._networkCDCDateField,
              false,
              true,
              true
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
   * Define an attribute generator for month/year at diagnosis
   *
   * @param {*} label : use this label
   * @returns attribute definition dict
   */
  define_attribute_dx_month_year(label) {
    return {
      depends: [timeDateUtil._networkCDCMonthYearField],
      label: label,
      type: "String",
      map: (node) => {
        try {
          return this.attribute_node_value_by_id(
            node,
            timeDateUtil._networkCDCMonthYearField,
            false,
            false,
            true
          );
        } catch {
          return kGlobals.missing.label;
        }
      },
    };
  }

  /**
   * Define an attribute generator for boolean value of dx in last year
   * @param {*} label : use this label
   * @returns attribute definition dict
   */
  define_attribute_dx_last_year(label) {
    return {
      depends: [timeDateUtil._networkCDCLastYearField],
      label: label,
      type: "String",
      enum: ["Yes", "No"],
      map: (node) => {
        try {
          return this.attribute_node_value_by_id(
            node,
            timeDateUtil._networkCDCLastYearField,
            false,
            false,
            true
          );
        } catch {
          return kGlobals.missing.label;
        }
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

  /**
          define an attribute generator for binned age at diagnosis
          @return attribute definition dict
      */
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

  cleanRedacted(id) {
    return super.cleanRedacted(id);
  }
}

module.exports = {
  HIVTxNetwork,
};
