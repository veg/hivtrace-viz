import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";
import { jsPanel } from "jspanel4";
import autocomplete from "autocomplete.js";
import { hivtrace_cluster_depthwise_traversal } from "./misc";

/**
 * Creates and opens the priority node set editor jsPanel.
 */
export function open_editor(
  self,
  node_set,
  name,
  description,
  cluster_kind,
  kind_options,
  validation_mode,
  existing_set,
  cluster_tracking,
  created_by,
  context
) {
  const {
    kGlobals,
    timeDateUtil,
    misc,
    helpers,
    priority_groups_check_name,
    priority_groups_add_set,
    priority_set_inject_node_attibutes,
    draw_priority_set_table,
    get_editor,
    set_priority_set_editor,
  } = context;

  if (get_editor() || !self.is_primary_graph) return;
  // only open one editor at a time
  // only primary network supports editor view

  if (self._is_CDC_executive_mode) {
    alert(kGlobals.network.WarnExecutiveMode);
    return;
  }

  created_by = existing_set
    ? existing_set.createdBy
    : created_by || kGlobals.CDCCOICreatedManually;

  let priority_set_editor = jsPanel.create({
    theme: "primary",
    headerTitle: "Priority node set editor",
    headerControls: { size: "lg", maximize: "remove" },
    headerToolbar:
      '<div id="coi-header-toolbar" class="d-flex flex-nowrap align-items-center gap-2 px-2 py-1" style="width: 100%;"></div>',
    panelSize: {
      width: "80vw",
      height: "35vh",
    },
    position: {
      my: "center-bottom",
      at: "center-bottom",
      offsetX: 0,
      offsetY: -20,
    },
    dragit: {
      containment: [70, 0, 0, 0], // Stay below navbar
    },
    resizeit: {
      minWidth: 400,
      minHeight: 200,
    },
    zIndex: 10000,
    content: "",
    contentOverflow: "scroll",
    callback: function () {
      var panel_object = this;
      panel_object.network_nodes = [];
      panel_object.saved = false;
      panel_object.prior_name =
        validation_mode && validation_mode.length && existing_set
          ? existing_set.name
          : null;

      panel_object.can_edit_kind = existing_set
        ? existing_set.createdBy !== "System"
        : true;

      panel_object.can_edit_name = existing_set
        ? existing_set.createdBy !== "System"
        : true;

      panel_object.can_edit_tracking = !existing_set;

      panel_object.can_add = function (id) {
        return !_.some(panel_object.network_nodes, (d) => d.id === id);
      };

      var panel_content = d3.select(panel_object.content);
      panel_content.selectAll("*").remove();

      var header_toolbar = d3.select(panel_object).select("#coi-header-toolbar");
      header_toolbar.selectAll("*").remove();

      var form = header_toolbar
        .append("form")
        .attr("action", "javascript:void(0);")
        .classed("d-flex flex-nowrap align-items-center gap-2 mb-0", true)
        .style("width", "100%");

      var add_node_grp = form
        .append("div")
        .classed("input-group input-group-sm flex-nowrap", true)
        .style("width", "auto")
        .style("flex-shrink", "0");

      var node_id_input = add_node_grp
        .append("input")
        .classed("form-control form-control-sm", true)
        .style("width", "150px")
        .attr("placeholder", "Add node by ID")
        .attr("data-hivtrace-ui-role", "priority-panel-nodeids");

      $(node_id_input.node()).on("keydown", (e) => {
        if (e.key === "Enter" || e.keyCode === 13) {
          panel_object.append_node();
          e.preventDefault();
        }
      });

      var submit_button = add_node_grp
        .append("button")
        .classed("btn btn-primary btn-sm", true)
        .attr("id", "priority-panel-add-node")
        .attr("disabled", "disabled");

      $(submit_button.node()).on("click", (e) => {
        panel_object.append_node();
      });

      submit_button.append("i").classed("fa-solid fa-plus", true);

      form
        .append("div")
        .classed("alert alert-warning py-1 px-2 mb-0 small", true)
        .style("font-size", "0.7rem")
        .style("line-height", "1.1")
        .style("flex-grow", "1")
        .style("white-space", "normal")
        .text(
          "At this time, only nodes that cluster in the network at the 1.5% or 0.5% genetic distance threshold level are available for selection."
        );
      //var preview_grp = form.append ("div").classed ("form-group", true);

      var form_save = panel_content
        .append("form")
        .classed("form", true)
        .attr("action", "javascript:void(0);")
        .style("display", "none");

      var grp_name = form_save.append("div").classed("form-group mb-3", true);

      var grp_name_button = grp_name
        .append("input")
        .classed("form-control form-control-sm", true)
        .attr("placeholder", "Name this cluster of interest")
        .attr("data-hivtrace-ui-role", "priority-panel-name")
        .attr("maxlength", 100);

      if (panel_object.prior_name) {
        grp_name_button.classed("is-valid", true);
      } else {
        grp_name_button.classed("is-invalid", true);
      }

      var grp_name_box_label = grp_name
        .append("p")
        .classed("form-text small", true)
        .text("Name this cluster of interest");

      var grp_kind = form_save.append("div").classed("form-group", true);

      var grp_kind_select = grp_kind
        .append("select")
        .classed("form-control input-sm", true)
        .attr("data-hivtrace-ui-role", "priority-panel-kind");

      if (!panel_object.can_edit_kind) {
        grp_kind_select.property("disabled", true);
        grp_kind_select.attr(
          "title",
          "The method of cluster identification cannot be changed for system generated cluster of interest. However, after confirming this cluster of interest, you can clone it and then change this field as needed"
        );
      } else {
        grp_kind_select.attr("title", null);
      }

      if (!panel_object.can_edit_name) {
        grp_name_button.property("disabled", true);
        grp_name_button.attr(
          "title",
          "The name cannot be changed for system generated cluster of interest. However, after confirming this cluster of interest, you can clone it and then change this field as needed"
        );
      } else {
        grp_name_button.attr("title", null);
      }

      grp_kind_select
        .selectAll("option")
        .data(kind_options || kGlobals.CDCCOIKind)
        .enter()
        .insert("option")
        .text((d) => d)
        .property("selected", (d) => d === cluster_kind);

      grp_kind
        .append("p")
        .classed("help-block", true)
        .text("Cluster identification method");

      var grp_tracking = form_save.append("div").classed("form-group", true);

      var grp_tracking_select = grp_tracking
        .append("select")
        .classed("form-control input-sm", true)
        .attr("data-hivtrace-ui-role", "priority-panel-tracking");

      if (!panel_object.can_edit_tracking) {
        grp_tracking_select.property("disabled", true);
        grp_tracking_select.attr(
          "title",
          "The method of tracking cannot be changed for existing clusters (system generated or manual). However, you can clone this cluster of interest and then change this field as needed"
        );
      } else {
        grp_tracking_select.attr("title", null);
      }

      cluster_tracking =
        cluster_tracking || kGlobals.CDCCOITrackingOptionsDefault;

      grp_tracking_select
        .selectAll("option")
        .data(kGlobals.CDCCOITrackingOptions)
        .enter()
        .insert("option")
        .text((d) => d)
        .property("selected", (d) => d === cluster_tracking);

      grp_tracking
        .append("p")
        .classed("help-block", true)
        .text("Method of tracking cluster of interest growth");

      var grp_desc = form_save.append("div").classed("form-group", true);

      grp_desc
        .append("textarea")
        .classed("form-control input-sm", true)
        .attr("placeholder", "Cluster of Interest Description")
        .attr("data-hivtrace-ui-role", "priority-panel-description")
        .text(description);
      grp_desc
        .append("p")
        .classed("help-block", true)
        .text("Describe this cluster of interest");

      panel_object.first_save = true;
      panel_object.cleanup_attributes = function () {
        _.each(self.nodes, (n) => {
          _.each(
            [
              "_priority_set_fixed",
              "_priority_set_date",
              "_priority_set_kind",
              "_priority_set_autoadded",
            ],
            (xtra) => {
              delete n[xtra];
            }
          );
        });
      };

      function is_node_editable(node) {
        return !node["_priority_set_fixed"];
      }

      function is_node_deletable(node, cm) {
        return (
          cm === kGlobals.CDCCOICreatedManually || !node["_priority_set_fixed"]
        );
      }

      let createdDate =
        existing_set && validation_mode && validation_mode.length
          ? existing_set.created
          : timeDateUtil.getCurrentDate();

      let modifiedDate =
        validation_mode === "validate" &&
        created_by === kGlobals.CDCCOICreatedBySystem
          ? self.today
          : timeDateUtil.getCurrentDate();

      function save_priority_set() {
        /**
          handler for priority set save requests
      */

        let res = true;

        // check if can save (name set etc)
        if (panel_object.network_nodes.length) {
          if (panel_object.first_save) {
            form_save.style("display", null);
            panel_object.first_save = false;
            return true;
          }

          let name, desc, kind, tracking;

          [name, desc, kind, tracking] = _.map(
            [
              "priority-panel-name",
              "priority-panel-description",
              "priority-panel-kind",
              "priority-panel-tracking",
            ],
            (k) =>
              $(misc.get_ui_element_selector_by_role(k)).val()
          );

          if (
            priority_groups_check_name(
              self.defined_priority_groups,
              name,
              panel_object.prior_name
            )
          ) {
            const entity_attributes = _.mapObject(
              self.unique_entity_object_list(panel_object.table_entities),
              (d) => d[0]
            );

            _.each(panel_object.network_nodes, (n) => {
              const ref_attr = entity_attributes[self.primary_key(n)];
              if (ref_attr) {
                _.each(
                  [
                    "_priority_set_date",
                    "_priority_set_kind",
                    "_priority_set_autoadded",
                  ],
                  (attr) => {
                    if (ref_attr[attr]) {
                      n[attr] = ref_attr[attr];
                    }
                  }
                );
              }
            });

            let set_description = {
              name: name,
              description: desc,
              nodes: _.map(panel_object.network_nodes, (d) => ({
                name: d.id,
                added: d["_priority_set_date"],
                kind: d["_priority_set_kind"],
                autoadded: d["_priority_set_autoadded"],
              })),
              created: timeDateUtil.DateFormats[0](createdDate),
              modified: timeDateUtil.DateFormats[0](modifiedDate),
              kind: kind,
              tracking: tracking,
              createdBy: created_by,
              expanded: false,
              autocreated: existing_set ? existing_set.autocreated : false,
              autoexpanded: existing_set ? existing_set.autoexpanded : false,
              pending: false,
              history: existing_set ? existing_set.history : [],
            };

            if (tracking !== kGlobals.CDCCOITrackingOptionsNone) {
              let added_nodes = self.auto_expand_pg_handler(set_description);
              if (added_nodes.size) {
                const added_node_objects = _.map([...added_nodes], (n) => {
                  return self.json.Nodes[n];
                });
                if (
                  confirm(
                    'This cluster of interest does not include all the nodes in the current network that are eligible for membership by growth criterion  "' +
                      tracking +
                      '". These ' +
                      self.unique_entity_list(added_node_objects).length +
                      " additional nodes will be automatically added to this cluster of interest when you save it. If you don’t want to add these nodes to the cluster of interest please select 'Cancel' and change the growth criterion."
                  )
                ) {
                  _.each(added_node_objects, (n) => {
                    set_description.nodes.push({
                      name: n.id,
                      added: modifiedDate || createdDate,
                      kind: kGlobals.CDCCOINodeKindDefault,
                    });
                  });
                } else {
                  return false;
                }
              }
            }

            let operation = null;
            if (panel_object.prior_name) {
              operation = existing_set.pending ? "insert" : "update";
            }
            res = priority_groups_add_set(
              self,
              set_description,
              true,
              true,
              panel_object.prior_name,
              operation
            );
            // clean up temporary flags from nodes
            panel_object.saved = true;
            panel_object.cleanup_attributes();
            panel_object.close();
            if (validation_mode === "validate") {
              if (self.priority_set_table_writeable) {
                let tab_pill = misc.get_ui_element_selector_by_role(
                    "priority_set_counts"
                  ),
                  tab_pill_select = d3.select(tab_pill),
                  remaining_sets = Number(tab_pill_select.text());
                tab_pill_select.text(remaining_sets - 1);
                d3.select("#banner_coi_counts").text(remaining_sets - 1);
              }
            }
          }
        }
        let panel_to_focus = document.querySelector(
          misc.get_ui_element_selector_by_role("priority-panel-name")
        );
        if (panel_to_focus) panel_to_focus.focus();
        return res;
      }

      var action_grp = form
        .append("div")
        .classed("btn-group btn-group-sm ms-auto", true)
        .style("flex-shrink", "0");

      var save_set_button = action_grp
        .append("button")
        .classed("btn btn-primary btn-sm", true)
        .text(validation_mode === "validate" ? "Review & Save" : "Save")
        .attr("disabled", "disabled")
        .attr("id", "priority-panel-save")
        .on("click", () => {
          save_priority_set();
        });

      action_grp
        .append("button")
        .classed("btn btn-info btn-sm text-white", true)
        .attr("id", "priority-panel-preview")
        .text("Preview @1.5%")
        .on("click", () => {
          priority_set_view(
            self,
            panel_object,
            {
              "priority-edge-length": 0.015,
              timestamp: createdDate,
            },
            context
          );
        });
      action_grp
        .append("button")
        .classed("btn btn-info btn-sm text-white", true)
        .attr("id", "priority-panel-preview-subcluster")
        .text("Preview @" + self.subcluster_threshold * 100 + "%")
        .on("click", () => {
          priority_set_view(
            self,
            panel_object,
            {
              "priority-edge-length": self.subcluster_threshold,
              timestamp: createdDate,
            },
            context
          );
        });

      $(grp_name_button.node()).on("input propertychange", function (e) {
        let current_text = $(this).val();
        if (
          priority_groups_check_name(
            self.defined_priority_groups,
            current_text,
            panel_object.prior_name
          )
        ) {
          grp_name_button.classed({
            "is-valid": true,
            "is-invalid": false,
          });
          grp_name_box_label
            .text("Name this cluster of interest")
            .classed("text-danger", false)
            .classed("text-success", true);
          if (panel_object.network_nodes.length) {
            save_set_button.attr("disabled", null);
          }
        } else {
          let too_long = current_text.length >= 36;
          grp_name_button.classed({
            "is-valid": false,
            "is-invalid": true,
          });
          let error_message = too_long
            ? "MUST be shorter than 36 characters"
            : "MUST be unique";
          grp_name_box_label
            .text("Name this cluster of interest (" + error_message + ")")
            .classed("text-danger", true)
            .classed("text-success", false);
          save_set_button.attr("disabled", "disabled");
        }
      });

      if (name) {
        grp_name_button.attr("value", name);
        $(grp_name_button.node()).trigger("input");
      }

      panel_object.selectable_entities = self.has_multiple_sequences
        ? _.map(self.primary_key_list, (n, k) => ({ id: k }))
        : self.json["Nodes"];

      //console.log (self.primary_key_list, selectable_entities);
      //debugger;

      var auto_object = autocomplete(
        misc.get_ui_element_selector_by_role("priority-panel-nodeids"),
        { hint: false },
        [
          {
            source: function (query, callback) {
              function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
              }
              var hits = [];
              const pattern = new RegExp(escapeRegExp(query), "i");
              for (
                var i = 0;
                hits.length < 10 && i < panel_object.selectable_entities.length;
                i++
              ) {
                if (pattern.test(panel_object.selectable_entities[i].id)) {
                  if (
                    panel_object.can_add(panel_object.selectable_entities[i].id)
                  ) {
                    hits.push(panel_object.selectable_entities[i].id);
                  }
                }
              }
              callback(hits);
            },
            templates: {
              suggestion: function (suggestion) {
                return suggestion;
              },
            },
          },
        ]
      );

      panel_object.validate_input = function (expression, skip_ui) {
        expression = expression || auto_object.autocomplete.getVal();
        const validator = _.filter(
          panel_object.selectable_entities,
          (n) => n.id === expression
        );
        if (validator.length === 1 && panel_object.can_add(validator[0].id)) {
          if (!skip_ui) {
            submit_button.attr("disabled", null);
          }
          return validator[0];
        } else if (!skip_ui) {
          submit_button.attr("disabled", "disabled");
        }
        return null;
      };

      panel_object._append_node = function (node) {
        if (!("_priority_set_date" in node)) {
          node["_priority_set_date"] = modifiedDate || createdDate;
        }
        if (!("_priority_set_kind" in node)) {
          node["_priority_set_kind"] = kGlobals.CDCCOINodeKindDefault;
        }

        const seqs_to_add = [];

        if (self.has_multiple_sequences) {
          if (node.id in self.primary_key_list) {
            seqs_to_add.push(...self.primary_key_list[node.id]);
          } else {
            seqs_to_add.push(node);
          }
        } else {
          seqs_to_add.push(node);
        }
        _.each(seqs_to_add, (node) => {
          if (!("_priority_set_date" in node)) {
            node["_priority_set_date"] = modifiedDate || createdDate;
          }
          if (!("_priority_set_kind" in node)) {
            node["_priority_set_kind"] = kGlobals.CDCCOINodeKindDefault;
          }
        });
        panel_object.network_nodes.push(...seqs_to_add);
      };

      panel_object.can_add_nodes = function () {
        if (created_by !== kGlobals.CDCCOICreatedManually) {
          alert(
            "Cannot add nodes to system generated clusters of interest. You may clone this cluster of interest and then add nodes to it manually if necessary."
          );
          return false;
        }
        return true;
      };

      panel_object.append_node = function (id, skip_ui) {
        if (!panel_object.can_add_nodes()) {
          return;
        }

        var node_to_add = panel_object.validate_input(id, skip_ui);

        if (node_to_add) {
          panel_object._append_node(node_to_add);
          panel_object.table_handler(panel_object);
          panel_object.validate_input();
        }
      };

      panel_object.append_nodes = function (
        nodes_to_add,
        existing_attributes,
        mspp_raw
      ) {
        if (!panel_object.can_add_nodes()) {
          return;
        }
        let existing_ids = {};

        _.each(panel_object.network_nodes, (n) => {
          existing_ids[n.id] = 1;
        });

        let need_update = false;
        let valid_ids = {};

        _.each(self.json["Nodes"], (n) => {
          if (!existing_ids[n.id]) {
            if (existing_attributes) {
              valid_ids[n.id] = _.extend(n, existing_attributes[n.id]);
            } else {
              valid_ids[n.id] = n;
            }
          }
        });

        if (!mspp_raw) {
          nodes_to_add = _.flatten(
            _.map(nodes_to_add, (d) => self.fetch_sequence_objects_for_pid(d))
          );
        } else {
          nodes_to_add = _.map(nodes_to_add, (d) => ({ id: d }));
        }

        _.each(nodes_to_add, (n) => {
          if (!(n.id in existing_ids) && n.id in valid_ids) {
            panel_object._append_node(valid_ids[n.id]);
            existing_ids[n.id] = 1;
            need_update = true;
          }
        });

        if (need_update) {
          panel_object.table_handler(panel_object);
        }
      };

      panel_object.append_node_objects = function (nodes_to_add) {
        if (!panel_object.can_add_nodes()) {
          return;
        }

        let existing_ids = {};

        _.each(panel_object.network_nodes, (n) => {
          existing_ids[n.id] = 1;
        });

        let need_update = false;

        _.each(nodes_to_add, (n) => {
          if (!(n.id in existing_ids)) {
            panel_object._append_node(n);
            existing_ids[n.id] = 1;
            need_update = true;
          }
        });

        if (need_update) {
          panel_object.table_handler(panel_object);
        }
      };

      panel_object.remove_node = function (n) {
        let entity_id = self.entity_id(n);
        panel_object.network_nodes = _.filter(
          panel_object.network_nodes,
          (nn) => self.entity_id(nn) !== entity_id
        );
        panel_object.table_handler(panel_object);
      };

      auto_object
        .on("autocomplete:selected", (event, suggestion, dataset, context) => {
          auto_object.autocomplete.setVal(suggestion);
          panel_object.validate_input();
        })
        .on("input propertychange", () => {
          panel_object.validate_input();
        });

      panel_object.table_handler = function (panel) {
        var table_container = panel_content.selectAll("table").data(["panel"]);
        table_container.enter().append("table");
        table_container
          .classed(
            "table table-striped table-condensed table-hover table-smaller",
            true
          )
          .attr("id", "priority-panel-node-table");

        const entities = self.aggregate_indvidual_level_records(
          panel.network_nodes
        );

        panel.setHeaderTitle(
          "clusterOI editor (" +
            entities.length +
            " persons)" +
            (validation_mode ? " [automatically created review] " : "")
        );

        save_set_button.attr(
          "disabled",
          panel.network_nodes.length ? null : "disabled"
        );

        var del_form_generator = function () {
          return `<form class="form">
  <div class="form-group mb-2">
    <div class="input-group"> <textarea class="form-control form-control-sm" data-hivtrace-ui-role="priority-description-form"
        cols="40" rows="3"></textarea> </div>
  </div> <button data-hivtrace-ui-role="priority-description-dismiss" class="btn btn-table-xs btn-outline-secondary">Cancel</button>
  <button data-hivtrace-ui-role="priority-description-save" class="btn btn-table-xs btn-danger">Delete</button>
</form>`;
        };

        let extra_columns = [
          {
            prepend: true,
            description: {
              value: "Added",
              help: "When was this person added to the cluster of interest?",
            },
            generator: function (node) {
              return {
                value: node,
                callback: function (element, payload) {
                  let this_cell = d3.select(element);
                  if (payload["_priority_set_date"]) {
                    if (payload["_priority_set_autoadded"]) {
                      this_cell.style("color", "darkred");
                    }
                    if (!is_node_editable(payload)) {
                      this_cell.text(
                        timeDateUtil.DateViewFormatMMDDYYY(
                          payload["_priority_set_date"]
                        )
                      );
                    } else {
                      this_cell
                        .append("input")
                        .attr("type", "date")
                        .attr(
                          "value",
                          timeDateUtil.DateViewFormatSlider(
                            payload["_priority_set_date"]
                          )
                        )
                        .on("change", (e, d) => {
                          try {
                            payload["_priority_set_date"] =
                              timeDateUtil.DateViewFormatSlider.parse(
                                $(d3.event.target).val()
                              );
                          } catch {
                            // do nothing
                          }
                        });
                    }
                  } else {
                    this_cell.text("N/A");
                  }
                },
              };
            },
          },
          {
            prepend: true,
            description: {
              value: "Person identification method",
              help: "How was this person identified as part of this cluster of interest?",
            },
            generator: function (node) {
              return {
                value: node,
                html: true,
                actions: function (item, value) {
                  if (is_node_editable(value)) {
                    return [
                      {
                        //icon: "fa-caret-down",
                        classed: { "btn-default": true },
                        text: value["_priority_set_kind"], //.split(" ")[0],
                        help: "How was this person identified?",
                        dropdown: kGlobals.CDCCOINodeKind,
                        action: function (button, menu_value) {
                          value["_priority_set_kind"] = menu_value;
                          button.text(
                            value["_priority_set_kind"] //.split(" ")[0]
                          );
                        },
                      },
                    ];
                  }
                  return [];
                },

                callback: function (element, payload) {
                  let this_cell = d3.select(element);
                  if (!is_node_editable(payload)) {
                    this_cell
                      .append("abbr")
                      .attr("title", payload["_priority_set_kind"])
                      .text(payload["_priority_set_kind"] /*.split(" ")[0]*/);
                  }
                  return this_cell;
                },
              };
            },
          },
          {
            // delete object option
            prepend: true,
            description: {
              value: "",
              actions: [
                {
                  icon: "fa-trash",
                  classed: { "btn-table-xs": true },
                  action: function (b, v) {
                    // iterate through the table and remove shown nodes one at a time
                    // checking that the row is shown to allow for filtering and such

                    let remaining_nodes = new Set(panel.network_nodes);

                    table_container
                      .selectAll("tr")
                      .filter(function (d) {
                        return d3.select(this).style("display") !== "none";
                      })
                      .each(function (d) {
                        d3.select(this)
                          .selectAll("td:first-child > button")
                          .each(function (d) {
                            let this_node = d3.select(this).datum();
                            if (is_node_editable(this_node)) {
                              remaining_nodes.delete(this_node);
                            }
                          });
                      });

                    const leftovers = remaining_nodes.values();
                    panel.network_nodes = [];
                    for (let entry of leftovers) {
                      panel.network_nodes.push(entry);
                    }
                    panel.table_handler(panel);
                  },
                },
              ],
            },
            generator: function (node) {
              return {
                value: node,
                callback: function (element, payload) {
                  var this_cell = d3.select(element);
                  if (!is_node_deletable(payload, created_by)) {
                    this_cell
                      .append("button")
                      .classed("btn btn-outline-secondary btn-table-xs float-end", true)
                      .style("margin-left", "1em")
                      .datum(payload)
                      .property("disabled", true)
                      .append("i")
                      .classed("fa fa-ban", true);
                  } else {
                    this_cell
                      .append("button")
                      .classed("btn btn-outline-secondary btn-table-xs float-end", true)
                      .style("margin-left", "1em")
                      .datum(payload)
                      .on("click", function () {
                        handle_inline_confirm(
                          d3.select(this),
                          del_form_generator,
                          "Are you sure you wish to permanently delete this node from the cluster of interest?",
                          (d) => {
                            panel_object.remove_node(payload);
                          },
                          true,
                          context
                        );
                        d3.event.preventDefault();
                        //panel_object.remove_node(payload);
                      })
                      .append("i")
                      .classed("fa fa-trash", true);
                  }
                },
              };
            },
          },
        ];
        if (!self._is_CDC_auto_mode) {
          extra_columns.splice(1, 1);
        }

        panel_object.table_entities = self.aggregate_indvidual_level_records(
          panel.network_nodes
        );
        self.draw_extended_node_table(
          panel_object.table_entities,
          table_container,
          extra_columns
        );
      };

      panel_object.content.style.padding = "5px";
      panel_object.network_nodes = node_set;
      // inject node attributes if available
      if (validation_mode) {
        // existing nodes cannot be deleted
        _.each(panel_object.network_nodes, (n) => {
          n["_priority_set_fixed"] = true;
        });
      }

      if (existing_set) {
        priority_set_inject_node_attibutes(
          self,
          panel_object.network_nodes,
          existing_set.nodes
        );
      }
      panel_object.table_handler(this);
    },
    onbeforeclose: function () {
      if (!this.saved) {
        if (
          confirm(
            "Close cluster of interest editor? Unsaved changes will be lost."
          )
        ) {
          if (existing_set) {
            const existing_nodes = new Set(
              _.map(existing_set.nodes, (n) => n.name)
            );
            existing_set.node_objects = _.filter(
              existing_set.node_objects,
              (n) => existing_nodes.has(n.id)
            );
          }
          this.cleanup_attributes();
          return true;
        }
        return false;
      }
      return true;
    },
    onclosed: function () {
      set_priority_set_editor(null);
      self.redraw_tables();
    },
  });

  set_priority_set_editor(priority_set_editor);
  return priority_set_editor;
}

/**
 * Handles inline confirmation popovers.
 */
export function handle_inline_confirm(
  this_button,
  generator,
  text,
  action,
  disabled,
  context
) {
  const { misc } = context;
  const button_sel = $(this_button.node());
  if (button_sel.data("popover_shown") !== "shown") {
    try {
      const popover = new bootstrap.Popover(button_sel.get(0), {
        sanitize: false,
        placement: "right",
        container: "body",
        html: true,
        content: generator,
        trigger: "manual",
      });

      button_sel.get(0).addEventListener("shown.bs.popover", function () {
        var clicked_object = d3.select(this);
        var popover_div = d3.select(
          "#" + button_sel.attr("aria-describedby")
        );
        var textarea_element = popover_div.selectAll(
          misc.get_ui_element_selector_by_role("priority-description-form")
        );
        var button_element = popover_div.selectAll(
          misc.get_ui_element_selector_by_role("priority-description-save")
        );
        textarea_element.text(text);
        if (disabled) textarea_element.attr("disabled", true);
        button_element.on("click", (d) => {
          action($(textarea_element.node()).val());
          if (d3.event) d3.event.preventDefault();
          button_sel.click();
        });
        button_element = popover_div.selectAll(
          misc.get_ui_element_selector_by_role("priority-description-dismiss")
        );
        button_element.on("click", (d) => {
          if (d3.event) d3.event.preventDefault();
          button_sel.click();
        });
      });

      popover.show();
      button_sel.data("popover_shown", "shown");

      button_sel.get(0).addEventListener("hidden.bs.popover", function () {
        $(this).data("popover_shown", "hidden");
        bootstrap.Popover.getInstance(this).dispose();
      });
    } catch (e) {
      console.error("Error creating/showing popover:", e);
    }
  } else {
    button_sel.data("popover_shown", "hidden");
    const popover = bootstrap.Popover.getInstance(button_sel.get(0));
    if (popover) {
      popover.dispose();
    }
  }
}

/**
 * Creates a subcluster view for a specific priority set.
 */
export function priority_set_view(self, priority_set, options, context) {
  const { kGlobals, timeDateUtil } = context;
  options = options || {};

  let nodes = priority_set.node_objects || priority_set.network_nodes;
  let current_time = timeDateUtil.getCurrentDate();
  let edge_length =
    options["priority-edge-length"] || self.subcluster_threshold;
  let reference_date = options["timestamp"] || self.today;
  let title =
    options["title"] ||
    "clusterOI " + (priority_set.prior_name || priority_set.name || "unnamed");
  let node_dates = {};

  if (priority_set.nodes) {
    _.each(priority_set.nodes, (nd) => {
      node_dates[nd.name] = nd.added;
    });
  } else {
    _.each(priority_set.network_nodes, (nd) => {
      node_dates[nd.id] = nd["_priority_set_date"];
    });
  }

  let nodeDates = {};
  if (options.priority_set && options.priority_set.nodes) {
    _.each(options.priority_set.nodes, (d) => {
      nodeDates[d.name] = d.added;
    });
  }

  _.each(nodes, (d) => {
    d.priority_set = 1;
    d._added_date = d.id in nodeDates ? nodeDates[d.id] : d._priority_set_date;
    if (d._added_date)
      d._added_date = timeDateUtil.DateViewFormatSlider(d._added_date);
    else d._added_date = null;
  });

  let pgDates = _.sortBy(_.keys(_.groupBy(nodes, (d) => d._added_date)));

  let node_set = _.flatten(
    hivtrace_cluster_depthwise_traversal(
      self.json["Nodes"],
      self.json["Edges"],
      (e) => e.length <= edge_length,
      null,
      nodes
    )
  );

  let refDate = timeDateUtil.DateViewFormat(reference_date);

  let dco = "fee8c8fdbb84e34a33";
  let defColorsOther = d3.scale
    .ordinal()
    .range(_.map(_.range(0, dco.length, 6), (d) => "#" + dco.substr(d, 6)));

  let maxColors = 4;
  let dcpg = "7b3294c2a5cfa6dba0008837";
  let defColorsPG = d3.scale
    .ordinal()
    .range(_.map(_.range(0, dcpg.length, 6), (d) => "#" + dcpg.substr(d, 6)));

  let viewEnum = [];
  let dateID = {};

  _.each(pgDates, (d, i) => {
    if (d) {
      if (pgDates.length > maxColors) {
        if (i < pgDates.length - maxColors) {
          dateID[d] = 0;
          return;
        } else if (i === pgDates.length - maxColors) {
          dateID[d] = viewEnum.length;
          viewEnum.push(
            "In cluster of interest (added on or before " + d + ")"
          );
          return;
        }
      }
      dateID[d] = viewEnum.length;
      viewEnum.push("In cluster of interest (added " + d + ")");
    }
  });

  let priorityColorOffset = viewEnum.length;

  viewEnum.push("Diagnosed and in network before " + refDate);
  viewEnum.push(
    "Diagnosed or in network on or after " +
      refDate +
      " [directly linked to cluster of interest]"
  );
  viewEnum.push(
    "Diagnosed or in network on or after " +
      refDate +
      " [indirectly linked to cluster of interest]"
  );
  let viewEnumMissing = [...viewEnum, kGlobals.missing.label];

  let viewEnumMissingColors = _.map(viewEnumMissing, (d, i) => {
    if (d !== kGlobals.missing.label) {
      if (i < priorityColorOffset) {
        return defColorsPG(d);
      }
      return defColorsOther(d);
    }
    return "gray";
  });

  // 20250807: reduce node information for priority set attributes

  _.each(
    _.groupBy(node_set, (n) => self.primary_key(n)),
    (mspp, id) => {
      if (mspp.length > 1) {
        _.each(["_added_date", "priority_set"], (attr) => {
          const min_attr = d3.min(_.map(mspp, (m) => m[attr]));
          _.each(mspp, (n) => {
            n[attr] = min_attr;
          });
        });
      }
    }
  );

  return self
    .view_subcluster(
      -1,
      node_set,
      title,
      {
        "simplified-mspp": options["raw_mspp"] ? false : true,
        skip_recent_rapid: true,
        init_code: function (network) {
          _.each(network.json.Edges, (e) => {
            let other_node = null;
            if (network.json.Nodes[e.target].priority_set === 1) {
              other_node = network.json.Nodes[e.source];
            } else if (network.json.Nodes[e.source].priority_set === 1) {
              other_node = network.json.Nodes[e.target];
            }
            if (other_node && other_node.priority_set !== 1) {
              other_node.priority_set = 2; // directly linked to a priority set node
            }
          });
        },
        "computed-attributes": {
          date_added: {
            depends: [timeDateUtil._networkCDCDateField],
            label: "Date added to cluster of interest",
            type: "Date",
            map: function (node) {
              return node.id in node_dates
                ? node_dates[node.id]
                : kGlobals.missing.label;
            },
          },
          priority_set: {
            depends: [timeDateUtil._networkCDCDateField],
            label: "Cluster of Interest Status",
            enum: viewEnum,
            type: "String",
            map: function (node) {
              if (node.priority_set === 1) {
                if (node._added_date) {
                  return viewEnum[dateID[node._added_date]];
                }
                return viewEnum[0];
              }
              if (
                self.filter_by_date(
                  reference_date,
                  timeDateUtil._networkCDCDateField,
                  current_time,
                  node,
                  true
                )
              ) {
                if (node.priority_set === 2) {
                  return viewEnum[priorityColorOffset + 1];
                }
                return viewEnum[priorityColorOffset + 2];
              }
              return viewEnum[priorityColorOffset];
            },
            color_scale: function () {
              return d3.scale
                .ordinal()
                .domain(viewEnumMissing)
                .range(viewEnumMissingColors);
            },
          },
        },
      },
      null,
      null,
      edge_length
    )
    .handle_attribute_categorical("priority_set");

  _.each(nodes, (d) => {
    delete d.priority_set;
  });
}

/**
 * Generates a dropdown menu for actions on a cluster of interest (COI).
 */
export function _action_drop_down(self, pg, context) {
  const {
    kGlobals,
    priority_set_inject_node_attibutes,
    open_editor,
    redraw_tables,
    priority_set_view,
    misc,
  } = context;
  let dropdown = [];

  if (!self.isMJCNetwork) {
    const viewClusterOptions = _.flatten([
      _.map([self.subcluster_threshold, 0.015], (threshold) => {
        let items = [
          {
            label:
              "View this cluster of interest at link distance of " +
              kGlobals.formats.PercentFormatShort(threshold),
            action: function (button, value) {
              priority_set_view(
                self,
                pg,
                {
                  timestamp: pg.modified || pg.created,
                  priority_set: pg,
                  "priority-edge-length": threshold,
                  title:
                    pg.name + " @" + kGlobals.formats.PercentFormat(threshold),
                },
                context
              );
            },
          },
        ];
        if (self.has_multiple_sequences) {
          items.push({
            label:
              "View this cluster of interest at link distance of " +
              kGlobals.formats.PercentFormatShort(threshold) +
              " (sequence level)",
            action: function (button, value) {
              priority_set_view(
                self,
                pg,
                {
                  timestamp: pg.modified || pg.created,
                  priority_set: pg,
                  "priority-edge-length": threshold,
                  title:
                    pg.name +
                    " @" +
                    kGlobals.formats.PercentFormat(threshold) +
                    " (sequence level)",
                  raw_mspp: true,
                },
                context
              );
            },
          });
        }
        return items;
      }),
    ]);

    dropdown.push(...viewClusterOptions);
  }

  if (!self._is_CDC_executive_mode) {
    if (!self.isMJCNetwork) {
      dropdown.push({
        label: "Clone this cluster of interest in a new editor panel",
        action: function (button, value) {
          let ref_set = self.priority_groups_find_by_name(pg.name);
          let copied_node_objects = _.clone(ref_set.node_objects);
          priority_set_inject_node_attibutes(
            self,
            copied_node_objects,
            pg.nodes
          );
          open_editor(
            self,
            copied_node_objects,
            "",
            "Clone of " + pg.name,
            ref_set.kind
          );
          redraw_tables();
        },
      });
      if (pg.createdBy !== "System") {
        dropdown.push({
          label: "Delete this cluster of interest",
          action: function (button, value) {
            if (confirm("This action cannot be undone. Proceed?")) {
              self.priority_groups_remove_set(pg.name, true);
            }
          },
        });
      }
    }
    dropdown.push({
      label: "View nodes in this cluster of interest",
      action: function (button, value) {
        const { misc } = context;
        const modalSelector = misc.get_ui_element_selector_by_role(
          "cluster_list",
          true
        );
        const $modal = $(modalSelector);

        // Store priority set name for the modal handler to use
        $modal.data("priority_set_trigger", pg.name);

        bootstrap.Modal.getOrCreateInstance($modal.get(0)).show();
      },
    });
  }

  if (!self.isMJCNetwork) {
    dropdown.push({
      label: "Modify this cluster of interest",
      action: function (button, value) {
        let ref_set = self.priority_groups_find_by_name(pg.name);

        if (ref_set) {
          open_editor(
            self,
            ref_set.node_objects,
            ref_set.name,
            ref_set.description,
            ref_set.kind,
            null,
            "update",
            ref_set,
            ref_set.tracking,
            ref_set.createdBy
          );
          redraw_tables();
        }
      },
    });
  }

  return dropdown;
}

/**
 * Injects priority set related attributes into network nodes.
 */
export function priority_set_inject_node_attibutes(
  self,
  nodes,
  node_attributes,
  context
) {
  const { kGlobals } = context;
  let attr_by_id = {};
  _.each(node_attributes, (n, i) => {
    attr_by_id[n.name] = {
      _priority_set_date: n.added || self.today,
      _priority_set_kind: n.kind || kGlobals.CDCCOINodeKindDefault,
      _priority_set_autoadded: n.autoadded || false,
    };
  });
  _.each(nodes, (n) => {
    if (n.id in attr_by_id) {
      _.extend(n, attr_by_id[n.id]);
    }
  });
}
