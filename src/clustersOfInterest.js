import * as d3 from "d3";
import _ from "underscore";
import { jsPanel } from "jspanel4";
import autocomplete from "autocomplete.js";
import * as timeDateUtil from "./timeDateUtil.js";
import * as tables from "./tables.js";
import * as helpers from "./helpers.js";
import * as misc from "./misc.js";
import { hivtrace_cluster_depthwise_traversal } from "./misc";
import * as kGlobals from "./globals.js";

let priority_set_editor = null;

/**
 * Initializes the component, setting up event listeners and UI elements.

 * @param {Object} self - The component object itself.

 * @returns {void}
 */

function init(self) {
  if (self._is_CDC_ && self.isPrimaryGraph) {
    let new_set = misc.get_ui_element_selector_by_role("new_priority_set");
    if (new_set) {
      window.addEventListener("beforeunload", (e) => {
        if (self.priority_groups_pending() > 0) {
          e.preventDefault();
          return "There are clusters of interest that have not been confirmed. Closing the window now will not finalize their creation.";
        }
        return null;
      });

      d3.selectAll(new_set).on("click", (e) => {
        open_editor(self, []);
        self.redraw_tables();
      });
    }

    let merge_sets = misc.get_ui_element_selector_by_role(
      "merge_priority_sets"
    );

    if (merge_sets) {
      d3.selectAll(merge_sets).on("click", (e) => {
        $(misc.get_ui_element_selector_by_role("priority_set_merge")).modal();
      });
    }
  }
}

/**
 * Checks if a provided name for a priority group is valid.

 * @param {Object[]} defined_priority_groups - An array of existing priority group objects.
 * @param {string} string - The name to be validated.
 * @param {string} [prior_name] (optional) - The previous name of the priority group (used for edit case).

 * @returns {boolean} True if the name is valid, false otherwise.

 * @description
 * A valid name must:
 *  - Have a length between 1 and 35 characters.
 *  - Not be a duplicate among existing priority groups (excluding itself if editing).
 */

function priority_groups_check_name(
  defined_priority_groups,
  string,
  prior_name
) {
  if (string.length) {
    if (string.length >= 36) return false;
    return !_.some(
      defined_priority_groups,
      (d) => d.name === string && d.name !== prior_name
    );
  }
  return false;
}

/**
 * Opens a priority node set editor.

 * @param {Object} self - The main network visualization object.
 * @param {Array} node_set - An existing priority node set (optional).
 * @param {string} name - Name of the priority node set (optional for new sets).
 * @param {string} description - Description of the priority node set (optional).
 * @param {string} cluster_kind - The method used to identify the cluster (optional).
 * @param {Array} kind_options - Available options for cluster identification methods.
 * @param {string} validation_mode - Indicates the mode (create, validate, revise).
 * @param {Object} existing_set - Reference to the existing priority node set (for revisions).
 * @param {string} cluster_tracking - Method for tracking cluster growth (optional).
 * @param {string} created_by - Who created the node set (system or manual).
 */

function open_editor(
  self,
  node_set,
  name,
  description,
  cluster_kind,
  kind_options,
  validation_mode,
  existing_set,
  cluster_tracking,
  created_by
) {
  /*
      validation_mode could be
        - null (create new set)
        - "validate" (validate an automatically generated dataset)
        - "revise" (revise a dataset)
  */
  if (priority_set_editor || !self.isPrimaryGraph) return;
  // only open one editor at a time
  // only primary network supports editor view

  if (self._is_CDC_executive_mode) {
    alert(kGlobals.network.WarnExecutiveMode);
    return;
  }

  created_by = existing_set
    ? existing_set.createdBy
    : created_by || kGlobals.CDCCOICreatedManually;

  priority_set_editor = jsPanel.create({
    theme: "bootstrap-primary",
    headerTitle: "Priority node set editor",
    headerControls: { size: "lg", maximize: "remove" },
    position: {
      my: "center",
      at: "center",
      offsetX: 0,
      offsetY: 0,
    },
    contentSize: {
      width: function () {
        return window.innerWidth * 0.8;
      },
      height: function () {
        return window.innerHeight / 3;
      },
    },
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

      var form = panel_content
        .append("form")
        .attr("action", "javascript:void(0);")
        .classed("form-inline", true);

      var form_grp = form.append("div").classed("form-group", true);

      form_grp
        .append("input")
        .classed("form-control input-sm", true)
        .attr("placeholder", "Add node by ID")
        .attr("data-hivtrace-ui-role", "priority-panel-nodeids");

      var submit_button = form
        .append("button")
        .classed("btn btn-primary btn-sm", true)
        .attr("id", "priority-panel-add-node")
        .attr("disabled", "disabled")
        .on("click", (e) => {
          panel_object.append_node();
        });

      submit_button.append("i").classed("fa fa-plus", true);

      form
        .append("p")
        .classed("alert alert-warning", true)
        .style("display", "inline")
        .text(
          "At this time, only nodes that cluster in the network at the 1.5% or 0.5% genetic distance threshold level are available for selection."
        );
      //var preview_grp = form.append ("div").classed ("form-group", true);

      var form_save = panel_content
        .append("form")
        .classed("form", true)
        .attr("action", "javascript:void(0);")
        .style("display", "none");

      var grp_name = form_save.append("div");

      if (panel_object.prior_name) {
        grp_name.classed("form-group has-success", true);
      } else {
        grp_name.classed("form-group has-error", true);
      }

      var grp_name_button = grp_name
        .append("input")
        .classed("form-control input-sm", true)
        .attr("placeholder", "Name this cluster of interest")
        .attr("data-hivtrace-ui-role", "priority-panel-name")
        .attr("maxlength", 100);

      var grp_name_box_label = grp_name
        .append("p")
        .classed("help-block", true)
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
        form_save.style("display", null);

        let res = true;

        // check if can save (name set etc)
        if (panel_object.network_nodes.length) {
          let name, desc, kind, tracking;

          [name, desc, kind, tracking] = _.map(
            [
              "priority-panel-name",
              "priority-panel-description",
              "priority-panel-kind",
              "priority-panel-tracking",
            ],
            (k) =>
              $(d3.select(misc.get_ui_element_selector_by_role(k)).node()).val()
          );

          if (
            !panel_object.first_save &&
            priority_groups_check_name(
              self.defined_priority_groups,
              name,
              panel_object.prior_name
            )
          ) {
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
                      added: timeDateUtil.getCurrentDate(),
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
          panel_object.first_save = false;
        }
        let panel_to_focus = document.querySelector(
          misc.get_ui_element_selector_by_role("priority-panel-name")
        );
        if (panel_to_focus) panel_to_focus.focus();
        return res;
      }

      var save_set_button = form
        .append("button")
        .classed("btn btn-primary btn-sm pull-right", true)
        .text(validation_mode === "validate" ? "Review & Save" : "Save")
        .attr("disabled", "disabled")
        .attr("id", "priority-panel-save")
        .on("click", (e) => {
          save_priority_set();
        });

      form
        .append("button")
        .classed("btn btn-info btn-sm pull-right", true)
        .attr("id", "priority-panel-preview")
        .text("Preview @1.5%")
        .on("click", (e) => {
          priority_set_view(self, priority_set_editor, {
            "priority-edge-length": 0.015,
            timestamp: createdDate,
          });
        });
      form
        .append("button")
        .classed("btn btn-info btn-sm pull-right", true)
        .attr("id", "priority-panel-preview-subcluster")
        .text("Preview @" + self.subcluster_threshold * 100 + "%")
        .on("click", (e) => {
          priority_set_view(self, priority_set_editor, {
            "priority-edge-length": self.subcluster_threshold,
            timestamp: createdDate,
          });
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
          grp_name.classed({
            "has-success": true,
            "has-error": false,
            "has-warning": false,
          });
          grp_name_box_label.text("Name this cluster of interest");
          if (panel_object.network_nodes.length) {
            save_set_button.attr("disabled", null);
          }
        } else {
          let too_long = current_text.length >= 36;
          grp_name.classed({
            "has-success": false,
            "has-error": true,
          });
          let error_message = too_long
            ? "MUST be shorter than 36 characters"
            : "MUST be unique";
          grp_name_box_label.text(
            "Name this cluster of interest " + error_message
          );
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
          node["_priority_set_date"] = createdDate;
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
            node["_priority_set_date"] = createdDate;
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
          } else {
            console.log("***", n);
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
  <div class="form-group">
    <div class="input-group"> <textarea class="form-control input-sm" data-hivtrace-ui-role="priority-description-form"
        cols="40" rows="3"></textarea> </div>
  </div> <button data-hivtrace-ui-role="priority-description-dismiss" class="btn btn-sm btn-default">Cancel</button>
  <button data-hivtrace-ui-role="priority-description-save" class="btn btn-sm btn-default">Delete</button>
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
                      .classed("btn btn-default btn-xs", true)
                      .style("margin-left", "1em")
                      .datum(payload)
                      .property("disabled", true)
                      .append("i")
                      .classed("fa fa-ban", true);
                  } else {
                    this_cell
                      .append("button")
                      .classed("btn btn-default btn-xs", true)
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
                          true
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

        self.draw_extended_node_table(
          self.aggregate_indvidual_level_records(panel.network_nodes),
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
    dragit: {
      containment: [50, 50, 100, 50],
    },
    resizeit: {
      containment: [50, 50, 100, 50],
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
      priority_set_editor = null;
      self.redraw_tables();
    },
  });
}

/**
 * Handles inline confirmation popovers.

 * @param {HTMLElement} this_button - The button element that triggers the popover.
 * @param {Function} generator - A function that generates the HTML content for the popover body.
 * @param {string} text - The initial text to display in the popover's text area (optional).
 * @param {Function} action - A callback function to be executed when the user confirms the action. Takes the value from the text area as input.
 * @param {boolean} disabled - A flag indicating if the text area should be disabled (optional).
*/

function handle_inline_confirm(this_button, generator, text, action, disabled) {
  this_button = $(this_button.node());
  if (this_button.data("popover_shown") !== "shown") {
    const popover = this_button
      .popover({
        sanitize: false,
        placement: "right",
        container: "body",
        html: true,
        content: generator,
        trigger: "manual",
      })
      .on("shown.bs.popover", function (e) {
        var clicked_object = d3.select(this);
        var popover_div = d3.select(
          "#" + clicked_object.attr("aria-describedby")
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
          d3.event.preventDefault();
          this_button.click();
        });
        button_element = popover_div.selectAll(
          misc.get_ui_element_selector_by_role("priority-description-dismiss")
        );
        button_element.on("click", (d) => {
          d3.event.preventDefault();
          this_button.click();
        });
      });

    popover.popover("show");
    this_button.data("popover_shown", "shown");
    this_button.off("hidden.bs.popover").on("hidden.bs.popover", function () {
      $(this).data("popover_shown", "hidden");
    });
  } else {
    this_button.data("popover_shown", "hidden");
    this_button.popover("destroy");
  }
}

/**
 * Generates a dropdown menu for actions on a cluster of interest (COI).

 * @param {Object} self - The main network visualization object.
 * @param {Object} pg - The cluster of interest data.
 * @returns {Array} An array of dropdown menu options.
*/

function _action_drop_down(self, pg) {
  let dropdown = _.flatten([
    _.map([self.subcluster_threshold, 0.015], (threshold) => {
      let items = [
        {
          label:
            "View this cluster of interest at link distance of " +
            kGlobals.formats.PercentFormatShort(threshold),
          action: function (button, value) {
            priority_set_view(self, pg, {
              timestamp: pg.modified || pg.created,
              priority_set: pg,
              "priority-edge-length": threshold,
              title: pg.name + " @" + kGlobals.formats.PercentFormat(threshold),
            });
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
            priority_set_view(self, pg, {
              timestamp: pg.modified || pg.created,
              priority_set: pg,
              "priority-edge-length": threshold,
              title:
                pg.name +
                " @" +
                kGlobals.formats.PercentFormat(threshold) +
                " (sequence level)",
              raw_mspp: true,
            });
          },
        });
      }
      return items;
    }),
  ]);

  if (!self._is_CDC_executive_mode) {
    dropdown.push({
      label: "Clone this cluster of interest in a new editor panel",
      action: function (button, value) {
        let ref_set = self.priority_groups_find_by_name(pg.name);
        let copied_node_objects = _.clone(ref_set.node_objects);
        priority_set_inject_node_attibutes(self, copied_node_objects, pg.nodes);
        open_editor(
          self,
          copied_node_objects,
          "",
          "Clone of " + pg.name,
          ref_set.kind
        );
        self.redraw_tables();
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
    dropdown.push({
      label: "View nodes in this cluster of interest",
      data: {
        toggle: "modal",
        target: misc.get_ui_element_selector_by_role("cluster_list"),
        priority_set: pg.name,
      },
    });
  }
  dropdown.push({
    label: "Modify this cluster of interest",
    action: function (button, value) {
      let ref_set = self.priority_groups_find_by_name(pg.name);

      if (ref_set) {
        /*if (ref_set.modified.getTime() > self.today.getTime()) {
          if (
            !confirm(
              "Editing priority sets modified after the point at which this network was created is not recommended."
            )
          )
            return;
        }*/
        open_editor(
          self,
          ref_set.node_objects,
          ref_set.name,
          ref_set.description,
          ref_set.kind,
          null,
          "update",
          ref_set,
          ref_set.tracking
        );
        self.redraw_tables();
      }
    },
  });

  /**dropdown.push({
    label: "View history over time",
    action: function (button, value) {
      let ref_set = self.priority_groups_find_by_name(pg.name);
      let report = self.generate_coi_temporal_report(ref_set);
      let container = self.open_exclusive_tab_view_aux(
        null,
        "History of " + pg.name,
        {}
      );
      misc.coi_timeseries(
        report,
        d3.select("#" + container).style("padding", "20px"),
        1000
      );
    },
  });*/

  return dropdown;
}

/**
 * Draws a table of priority sets (clusters of interest).

 * @param {Object} self - The main network visualization object.
 * @param {HTMLElement} container - The HTML element where the table will be displayed (optional).
 * @param {Array} priority_groups - An array of objects representing the priority sets (optional).
*/

function draw_priority_set_table(self, container, priority_groups) {
  container = container || self.priority_set_table;
  if (container) {
    priority_groups = priority_groups || self.defined_priority_groups;
    self.priority_groups_compute_node_membership();
    self.priority_groups_compute_overlap(priority_groups);
    var headers = [
      [
        {
          value: "Type",
          sort: function (c) {
            return c.value;
          },
          help: "How was this cluster of interest created",
          width: 50,
        },
        {
          value: "Name",
          sort: "value",
          filter: true,
          width: 325,
          text_wrap: true,
          help: "Cluster of interest name",
        },
        {
          value: "Modified/created",
          width: 180,
          sort: function (c) {
            return c.value[0];
          },
          help: "When was the cluster of interest created/last modified",
        },
        {
          value: "Growth",
          sort: "value",
          help: "How growth is handled",
          width: 100,
          //text_wrap: true
        },
        {
          value: "Size",
          width: 100,
          presort: "desc",
          sort: function (c) {
            c = c.value;
            if (c) {
              return c[1] + (c[2] ? 1e10 : 0) + (c[3] ? 1e5 : 0);
            }
            return 0;
          },
          help: "Number of nodes in the cluster of interest",
        },
        {
          value: "Priority",
          width: 60,
          sort: "value",
          help: "Does the cluster of interest continue to meet priority criteria?",
        },
        {
          value: "DXs in last 12 mo.",
          width: 50,
          sort: "value",
          help: "The number of cases in the cluster of interest diagnosed in the past 12 months",
        },
        {
          value: "Overlap",
          width: 140,
          sort: function (c) {
            c = c.value;
            if (c) {
              return c[1];
            }
            return 0;
          },
          help: "How many other ClusterOI have overlapping nodes with this ClusterOI, and (if overlapping ClusterOI exist) how many nodes in this ClusterOI overlap with ANY other ClusterOI?",
        },
        /*,
          {
            value: "Cluster",
            sort: "value",
            help: "Which cluster does the node belong to"
          }*/
      ],
    ];

    if (self._is_CDC_auto_mode) {
      headers[0].splice(3, 0, {
        value: "clusterOI identification method",
        width: 100,
        sort: function (c) {
          return c.value;
        },
        help: "Method of cluster identification",
      });
    }

    var edit_form_generator = function () {
      return `<form class="form"> 
                      <div class="form-group"> 
                          <div class="input-group">
                          <textarea class="form-control input-sm" data-hivtrace-ui-role = "priority-description-form" cols = "40" rows = "3"></textarea>
                          </div>
                      </div>
                      <button data-hivtrace-ui-role = "priority-description-dismiss" class = "btn btn-sm btn-default">Dismiss</button>
                      <button data-hivtrace-ui-role = "priority-description-save" class = "btn btn-sm btn-default">Save</button>
                  </form>`;
    };

    var rows = [];
    _.each(priority_groups, (pg) => {
      var this_row = [
        {
          // created by icon
          value: pg.createdBy,
          html: true,
          width: 50,
          format: (value) =>
            pg.createdBy === kGlobals.CDCCOICreatedBySystem
              ? '<i class="fa fa-2x fa-desktop" title="' +
                kGlobals.CDCCOICreatedBySystem +
                '" data-text-export=' +
                kGlobals.CDCCOICreatedBySystem +
                "></i>"
              : '<i class="fa fa-2x fa-user" title="' +
                kGlobals.CDCCOICreatedManually +
                '" data-text-export=' +
                kGlobals.CDCCOICreatedManually +
                "></i>",
        },
        {
          // name
          value: pg.name,
          width: 325,
          help:
            pg.description +
            (pg.pending ? " (new, pending confirmation)" : "") +
            (pg.expanded
              ? " (" + pg.expanded + " new nodes; pending confirmation)"
              : ""),
          volatile: true,
          format: (value) =>
            "<div style = 'white-space: nowrap; overflow: hidden; text-overflow : ellipsis;'>" +
            (pg.autocreated || pg.autoexpanded
              ? (pg.autoexpanded
                  ? '<span class="label label-default">Grew</span>'
                  : '<span class="label label-danger">New</span>') +
                "&nbsp;<span style = 'font-weight: 900;' data-text-export = '" +
                value +
                "'>" +
                value +
                "</span>"
              : '<span data-text-export = "' +
                value +
                '">' +
                value +
                "</span>") +
            "</div>",
          html: true,
          actions: [],
        },
        {
          // modification / creation date
          width: 180,
          value: [pg.modified, pg.created],
          format: function (value) {
            let vs = _.map(value, (v) => timeDateUtil.DateViewFormat(v));

            if (vs[0] !== vs[1]) {
              return vs[0] + " / " + vs[1];
            }
            return vs[0];
          },
        },
        {
          // tracking mode
          width: 100,
          //text_wrap: true,
          value: pg.tracking,
          format: function (value) {
            return kGlobals.CDCCOIConciseTrackingOptions[value];
          },
        },
        {
          // size / new nodes
          value: [
            self.unique_entity_list(pg.node_objects).length,
            self.unique_entity_list_from_ids(
              _.map(
                _.filter(pg.nodes, (g) => self.priority_groups_is_new_node(g)),
                (d) => d.name
              )
            ).length,
            pg.createdBy === kGlobals.CDCCOICreatedBySystem && pg.pending,
            pg.meets_priority_def,
          ],
          width: 100,
          format: function (v) {
            //console.log (pg);
            if (v) {
              return (
                v[0] +
                (v[1]
                  ? ' <span title="Number of nodes added by the system since the last network update" class="label label-default">' +
                    v[1] +
                    " new</span>"
                  : "")
              );
            }
            return "N/A";
          },
          html: true,
        },
        {
          // meets priority definition
          width: 60,
          value: pg.meets_priority_def ? "Yes" : "No",
        },
        {
          width: 50,
          value: pg.cluster_dx_recent12_mo,
        },
        {
          width: 140,
          value: [
            pg.overlap.sets,
            pg.overlap.nodes,
            pg.overlap.duplicate,
            pg.overlap.superset,
          ],
          format: function (v) {
            if (v) {
              return (
                String(v[0]) +
                (v[1]
                  ? ' <span title="Number of persons in the overlap" class="label label-default pull-right">' +
                    v[1] +
                    " persons</span>"
                  : "") +
                (v[2].length
                  ? ' <span title="clusterOIs which are exact duplicates of this clusterOI: ' +
                    v[2].join(", ") +
                    '" class="label label-danger pull-right">' +
                    v[2].length +
                    " duplicate clusterOI</span>"
                  : "") +
                (v[3].length
                  ? ' <span title="clusterOIs which contain this clusterOI: ' +
                    v[3].join(", ") +
                    '" class="label label-warning pull-right">Fully contained in ' +
                    v[3].length +
                    " clusterOI</span>"
                  : "")
              );
            }
            return "N/A";
          },
          html: true,
          actions:
            pg.overlap.sets === 0
              ? []
              : [
                  {
                    icon: "fa-eye",
                    dropdown: [
                      {
                        label: "List overlaps",
                        data: {
                          toggle: "modal",
                          target:
                            misc.get_ui_element_selector_by_role(
                              "overlap_list"
                            ),
                          priority_set: pg.name,
                        },
                      },
                    ],
                  },
                ],
        },
      ];

      if (self._is_CDC_auto_mode) {
        this_row.splice(3, 0, {
          value: pg.kind,
          width: 100,
          format: function (v) {
            if (v) {
              return v;
              //"<abbr title = '" + v + "'>" + v.split(" ")[0] + "</abbr>"
            }
            return "N/A";
          },
          html: true,
        });
      }

      if (pg.pending) {
        // pending user review
        this_row[1].actions = [
          {
            icon: "fa-eye",
            help: "Review and adjust this cluster of interest",
            action: function (button, value) {
              let nodeset = self.priority_groups_find_by_name(value);
              if (nodeset) {
                if (get_editor()) {
                  alert(
                    "Cannot confirm a cluster of interest while an editor window is open"
                  );
                } else {
                  open_editor(
                    self,
                    nodeset.node_objects,
                    nodeset.name,
                    nodeset.description,
                    nodeset.kind,
                    null,
                    "validate",
                    nodeset,
                    pg.tracking,
                    pg.createdBy
                  );
                  self.redraw_tables();
                }
              }
            },
          },
        ];
      } else {
        this_row[1].actions = [_.clone(this_row[1].actions)];
        this_row[1].actions[this_row[1].actions.length - 1].splice(
          -1,
          0,
          {
            icon: "fa-info-circle",
            classed: { "view-edit-cluster": true },
            help: "View/edit this cluster of interest",
            dropdown: _action_drop_down(self, pg),
            /*action: function (button, menu_value) {
                console.log (menu_value);
            }*/
          },
          {
            icon: "fa-edit",
            classed: { "btn-info": true },
            help: "Edit description",
            action: function (this_button, cv) {
              handle_inline_confirm(
                this_button,
                edit_form_generator,
                pg.description,
                (d) => {
                  self.priority_groups_edit_set_description(pg.name, d, true);
                }
              );
            },
          }
        );
        this_row[1].actions[this_row[1].actions.length - 1].splice(
          -1,
          0,
          (button_group, value) => {
            if (get_editor()) {
              return {
                icon: "fa-plus",
                help: "Add nodes in this cluster of interest to the new cluster of interest",
                action: function (button, value) {
                  let nodeset = self.priority_groups_find_by_name(value);
                  if (nodeset) {
                    get_editor().append_node_objects(nodeset.node_objects);
                  }
                },
              };
            }
            return null;
          }
        );
      }
      this_row[1].actions = _.flatten(this_row[1].actions);
      //console.log (this_row[0]);
      if (pg.not_in_network.length) {
        this_row[2]["actions"] = [
          {
            text: String(pg.not_in_network.length) + " removed",
            classed: { "btn-danger": true, disabled: true },
            help:
              "Nodes removed from the network: " + pg.not_in_network.join(", "),
          },
        ];
      }
      rows.push(this_row);
    });

    let has_required_actions = "";
    /* let has_automatic = self.priority_groups_pending();
    let has_expanded = self.priority_groups_expanded();

    if (has_automatic + has_expanded) {
      let labeler = (c, description, c2) => {
        if (c) {
          c2 = c2 ? " and " : "";
          return c2 + c + " " + description;
        }
        return "";
      };

      has_required_actions =
        '<div class="alert alert-info">There are ' +
        "<span style = 'color: darkred'>" + labeler(has_automatic, "automatically created") + "</span>" +
        "<span style = 'color: orange'>" + labeler(has_expanded, "automatically expanded", has_automatic) + "</span>" +
        ' priority sets.</div>';
    } else {
      has_required_actions = "";
    }*/

    tables.add_a_sortable_table(
      container,
      headers,
      rows,
      true,
      has_required_actions +
        `Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> clusters of interest.
          <button class = "btn btn-sm btn-warning pull-right" data-hivtrace-ui-role="priority-subclusters-export">Export to JSON</button>
          <button class = "btn btn-sm btn-primary pull-right" data-hivtrace-ui-role="priority-subclusters-export-csv">Export to CSV</button>`,
      get_editor()
    );

    d3.select(
      misc.get_ui_element_selector_by_role("priority-subclusters-export")
    ).on("click", (d) => {
      helpers.export_json_button(
        self.priority_groups_export(),
        timeDateUtil.DateViewFormatSlider(self.today)
      );
    });
    d3.select(
      misc.get_ui_element_selector_by_role("priority-subclusters-export-csv")
    ).on("click", (d) => {
      helpers.export_csv_button(
        self.priority_groups_export_nodes(),
        "clusters-of-interest"
      );
    });
    d3.select("#priority_set_table_download").on("click", (d) => {
      helpers.export_csv_button(
        self.priority_groups_export_sets(),
        "clusters_of_interest_table"
      );
    });
  }
}

/**
 * Creates a subcluster view for a specific priority set.

 * @param {Object} self - The main network visualization object.
 * @param {Object} priority_set - The priority set object.
 * @param {Object} options - Optional configuration options for the view.
*/

function priority_set_view(self, priority_set, options) {
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
    //console.log (d);
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

  self
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
              //console.log ("PS", node.id, node.priority_set);
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
 * Adds a new priority set to the network visualization.

 * @param {Object} self - The main network visualization object.
 * @param {Object} nodeset - The object representing the new priority set.
 * @param {boolean} update_table - Flag indicating whether to update the priority set table. (optional)
 * @param {boolean} not_validated - Flag indicating whether to perform validation before adding. (optional)
 * @param {string} prior_name - Optional name of an existing priority set to replace.
 * @param {string} op_code - Optional operation code (defaults to "insert").

 * @returns {boolean} True if the set was added successfully, false otherwise.
*/

function priority_groups_add_set(
  self,
  nodeset,
  update_table,
  not_validated,
  prior_name,
  op_code
) {
  function check_dup() {
    if (
      nodeset.name[0] === " " ||
      nodeset.name[nodeset.name.length - 1] === " "
    ) {
      alert(
        "Cluster of interest '" +
          nodeset.name +
          "' has spaces either at the beginning or end of the name. Secure HIV-TRACE does not allow names that start or end with spaces."
      );
      return true;
    }
    let my_nodes = new Set(_.map(nodeset.nodes, (d) => d.name));
    return _.some(self.defined_priority_groups, (d) => {
      if (d.nodes.length === my_nodes.size) {
        const same_nodes =
          d.nodes.filter((x) => my_nodes.has(x.name)).length === d.nodes.length;
        if (same_nodes && d.tracking === nodeset.tracking) {
          alert(
            "Cluster of interest '" +
              d.name +
              "' has the same set of nodes and the same growth criterion as this new cluster of interest. Secure HIV-TRACE does not allow creating exact duplicates of clusters of interest."
          );
          return true;
        } else if (same_nodes) {
          let keep_duplicate = confirm(
            "Warning! Cluster of interest '" +
              d.name +
              "' has the same set of nodes as this cluster of interest, but a different growth criterion'. Click 'OK' to create, or 'Cancel' to abort."
          );
          let is_duplicate = !keep_duplicate;
          return is_duplicate;
        }
      }
      return false;
    });
  }

  op_code = op_code || "insert";
  if (not_validated) {
    self.priority_groups_validate([nodeset]);
  }
  if (prior_name) {
    let prior_index = _.findIndex(
      self.defined_priority_groups,
      (d) => d.name === prior_name
    );
    if (prior_index >= 0) {
      if (prior_name !== nodeset.name) {
        self.priority_groups_update_node_sets(prior_name, "delete");
        op_code = "insert";
      }
      self.defined_priority_groups[prior_index] = nodeset;
    } else {
      if (check_dup()) return false;
      self.defined_priority_groups.push(nodeset);
    }
  } else {
    if (check_dup()) return false;
    self.defined_priority_groups.push(nodeset);
  }
  self.priority_groups_update_node_sets(nodeset.name, op_code);

  if (update_table) {
    draw_priority_set_table(self);
  }

  return true;
}

/**
 * Injects priority set related attributes into network nodes.

 * @param {Object} self - The main network visualization object.
 * @param {Array} nodes - Array of network nodes.
 * @param {Array} node_attributes - Array of priority set attributes for specific nodes (identified by name).
*/

function priority_set_inject_node_attibutes(self, nodes, node_attributes) {
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

/**
 * Gets the current priority set editor object.

 * @returns {Object} The priority set editor object, or null if not open.
 */

function get_editor() {
  return priority_set_editor;
}

export {
  init,
  open_editor,
  priority_set_view,
  draw_priority_set_table,
  priority_set_inject_node_attibutes,
  get_editor,
};
