const _ = require("underscore");
const $ = require("jquery");
const d3 = require("d3");
const timeDateUtil = require("./timeDateUtil.js");
const kGlobals = require("./globals.js");
const misc = require("./misc.js");
const clustersOfInterest = require("./clustersOfInterest.js");
const HTXModel = require("./core/HTXModel.js");
const NetworkAPI = require("./core/NetworkAPI.js");
const CDCPriorityLogic = require("./core/CDCPriorityLogic.js");

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
    super(json, primary_key_function, {
      is_primary_graph: !secondaryGraph,
      kGlobals: kGlobals,
    });
    this.button_bar_ui = button_bar_ui;
    this.subcluster_table = null;
    this.priority_set_table_write = null;
    this.priority_set_table_writeable = null;
    this.is_primary_graph = !secondaryGraph;
    this.nodeFilterObject = null;
    this.defined_priority_groups = [];
    this.using_time_filter = null;

    this.dispatch = d3.dispatch(
      "node_click",
      "node_pop_on",
      "node_pop_off",
      "edge_pop_on",
      "edge_pop_off",
      "cluster_click",
      "cluster_expand",
      "cluster_collapse",
      "cluster_pop_on",
      "cluster_pop_off",
      "attribute_change",
      "layout_start",
      "layout_end"
    );

    this.filter_by_size = this.filter_by_size.bind(this);
    this.filter_singletons = this.filter_singletons.bind(this);
    this.filter_if_added = this.filter_if_added.bind(this);
    this.filter_time_period = this.filter_time_period.bind(this);

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
    return HTXModel.inject_attribute_node_value_by_id(
      node,
      id,
      value,
      kGlobals
    );
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

  priority_groups_is_new_node(node) {
    return super.priority_groups_is_new_node(node);
  }

  priority_groups_export(group_set, include_unvalidated) {
    return super.priority_groups_export(
      group_set,
      include_unvalidated,
      timeDateUtil
    );
  }

  priority_groups_export_nodes(group_set, include_unvalidated) {
    return super.priority_groups_export_nodes(
      group_set,
      include_unvalidated,
      kGlobals,
      timeDateUtil
    );
  }

  priority_groups_export_sets() {
    return super.priority_groups_export_sets(kGlobals, timeDateUtil);
  }

  priority_groups_automatic_creation() {
    return super.priority_groups_automatic_creation(kGlobals, timeDateUtil);
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
        if (d3.event) {
          d3.event.sourceEvent.stopPropagation();
          d.label_x += d3.event.dx;
          d.label_y += d3.event.dy;
          d3.select(this).attr(
            "transform",
            `translate(${d.label_x + d.rendered_size * 1.25},${d.label_y + d.rendered_size * 0.5})`
          );
        }
      })
      .on("dragstart", () => {
        if (d3.event && d3.event.sourceEvent)
          d3.event.sourceEvent.stopPropagation();
      })
      .on("dragend", () => {
        if (d3.event && d3.event.sourceEvent)
          d3.event.sourceEvent.stopPropagation();
      });

    /** default node colorizer */
    this.colorizer = {
      selected: (d) => (d === "selected" ? d3.rgb(51, 122, 183) : "#FFF"),
    };

    /** if there is computed support for network edges, use it to highlight
        possible spurious edges **/

    this.highlight_unsuppored_edges = true;

    /** default node shaper */
    this.node_shaper = {
      id: null,
      shaper: () => "circle",
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
    if (not_nested && !this.is_primary_graph) {
      return undefined;
    }
    return (
      (not_nested ? "" : `#${this.button_bar_ui}`) +
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
    super.process_multiple_sequences(
      kGlobals,
      misc,
      reduce_distance_within,
      reduce_distance_between
    );
  }

  /**
        When MSPP are present, this function will annotate node objects with fields
        that indicate whether or not the nodes belong to multiple clusters or subclusters
  */

  annotate_multiple_clusters_on_nodes() {
    super.annotate_multiple_clusters_on_nodes();
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
    return super.simplify_multisequence_cluster(filtered_json, kGlobals, misc);
  }

  /**
      generate a cross-hatch pattern for filling nodes with a specific color
      and add it as a definition to the network SVG
  */

  generate_cross_hatch_pattern(color) {
    const id = `id${this.dom_prefix}_diagonalHatch_${color.substr(1, 10)}`;
    if (this.network_svg.select(`#${id}`).empty()) {
      function getComplementaryColor(backgroundColor) {
        const bg_color = d3.rgb(backgroundColor);
        const luminance = bg_color.r * 0.299 + bg_color.g * 0.587 + bg_color.b * 0.114;
        return luminance > 128 ? "#000000" : "#ffffff";
      }

      const defs = this.network_svg.append("defs");

      const pattern = defs
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
    return super.priority_groups_automatic(kGlobals);
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
    return CDCPriorityLogic.priority_groups_all_events(this, timeDateUtil);
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

  /** interact with the remote DB to send updates of CoI operations
        @name: the name of the CoI
        @operation: what happened ("insert", "delete", "update")
  */

  priority_groups_update_node_sets = function (name, operation) {
    return NetworkAPI.priority_groups_update_node_sets(this, name, operation);
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
    return NetworkAPI.priority_groups_edit_set_description(
      this,
      clustersOfInterest,
      name,
      description,
      update_table
    );
  };

  /**
        Remove a CoI from the list of defined CoI

        @param name [string] : the name of the CoI
        @param update_table [bool] : if true, trigger CoI table update in UI/UX

        @return N/A
  */

  priority_groups_remove_set = function (name, update_table) {
    return NetworkAPI.priority_groups_remove_set(
      this,
      clustersOfInterest,
      name,
      update_table
    );
  };

  /**
        Export nodes that are members of CoI

        @param name [array] : set of CoI OBJECTS, by default this is `defined_priority_groups`
        @param include_unvalidated [bool] : if true, include all CoI (validated/not) in the export

        @return an array of node records
  */

  /** parse a date record
        @param value (date object or string)
        @return date object
  */

  parse_dates(value) {
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
    let node_dx = this.attribute_node_value_by_id(node, date_field);
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
        const warning_box = d3.select(this.network_warning_tag);
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
    return CDCPriorityLogic.priority_groups_compute_node_membership(
      this,
      kGlobals,
      timeDateUtil
    );
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
    return NetworkAPI.fetch_priority_sets(url, callback);
  }

  load_priority_sets(url, is_writeable) {
    return NetworkAPI.load_priority_sets(
      this,
      clustersOfInterest,
      kGlobals,
      timeDateUtil,
      misc,
      url,
      is_writeable
    );
  }

  MJCloadOwnPrioritySets(options) {
    return NetworkAPI.MJCloadOwnPrioritySets(this, options);
  }

  /**  add an attribute description
    
         Given an attribute definition (see comments elsewhere), and a key to associate it with
         do
    
    */

  inject_attribute_description(key, d) {
    if (kGlobals.network.GraphAttrbuteID in this.json) {
      const new_attr = {};
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
        const uniq_value_set = new Set();

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
        if (computed.type === "Number" || computed.type === "Date") {
          let color_stops =
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

      const extension = {};
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
    return CDCPriorityLogic.define_attribute_COI_membership(
      this,
      kGlobals,
      timeDateUtil,
      date
    );
  }

  /**
          define an attribute generator for binned viral loads
    
          @param field: the node attribute field to use
          @param title: display this title for the attribute
    
          @return attribute definition dict
      */
  define_attribute_binned_vl(field, title) {
    return CDCPriorityLogic.define_attribute_binned_vl(
      this,
      kGlobals,
      field,
      title
    );
  }

  /**
          define an attribute generator for Viral load result interpretatio
    
          @return attribute definition dict
      */
  define_attribute_vl_interpretaion() {
    return CDCPriorityLogic.define_attribute_vl_interpretaion(this, kGlobals);
  }

  /**
          define an attribute generator for new network nodes/clusters
          @return attribute definition dict
      */

  define_attribute_network_update() {
    return CDCPriorityLogic.define_attribute_network_update(HIVTxNetwork);
  }

  define_attribute_mjc_date_added(label) {
    return CDCPriorityLogic.define_attribute_mjc_date_added(kGlobals, label);
  }

  /**
          define an attribute generator for dx year
    
          @param relative: if T, compute dx date relative to the network date in years
          @param label: use this label
    
          @return attribute definition dict
      */

  define_attribute_dx_years(relative, label) {
    return CDCPriorityLogic.define_attribute_dx_years(
      this,
      kGlobals,
      timeDateUtil,
      relative,
      label
    );
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
    return CDCPriorityLogic.define_attribute_sequence_count(
      this,
      kGlobals,
      label
    );
  }

  /**
          define an attribute generator for binned age at diagnosis
          @return attribute definition dict
      */
  define_attribute_age_dx() {
    return CDCPriorityLogic.define_attribute_age_dx(this, kGlobals);
  }

  /**
          Generate a function callback for attribute time series data
    
          @param export_items
              if set (and is an array), the function will add the callback to the array
              otherwise the callback will be invoked on this
    
          @return noting
      */

  check_for_time_series = function (export_items) {
    return CDCPriorityLogic.check_for_time_series(
      this,
      kGlobals,
      timeDateUtil,
      misc,
      export_items
    );
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
    return super.annotate_cluster_changes();
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
      const patient_records = [];
      _.each(this.primary_key_list, (records) => {
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
