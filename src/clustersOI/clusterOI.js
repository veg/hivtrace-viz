// TODO: put in separate `clusterOI` folder for now, should refactor later to multiple files within this folder  
import * as d3 from "d3";
import _ from "underscore";
import { jsPanel } from "jspanel4";
import autocomplete from "autocomplete.js";
import * as timeDateUtil from "../timeDateUtil.js";
import * as utils from "../utils.js";
import * as clusterNetwork from "../clusternetwork.js";
import * as tables from "../tables.js";
import * as nodesTab from "../nodesTab.js";
import * as helpers from "../helpers.js";
import * as misc from "../misc.js";
import { hivtrace_cluster_depthwise_traversal } from "../misc.js";

let priority_set_editor = null;
let defined_priority_groups = [];
/**
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

function init(self) {
  if (self._is_CDC_ && self.isPrimaryGraph) {
    let new_set = utils.get_ui_element_selector_by_role("new_priority_set");
    if (new_set) {
      window.addEventListener("beforeunload", (e) => {
        if (defined_priority_groups.some(pg => pg.pending)) {
          e.preventDefault();
          return "There are cluster of interest that have not been confirmed. Closing the window now will not finalize their creation.";
        }
        return null;
      });

      d3.selectAll(new_set).on("click", (e) => {
        open_editor(self, []);
        redraw_tables(self);
      });
    }

    let merge_sets = utils.get_ui_element_selector_by_role("merge_priority_sets");

    if (merge_sets) {
      d3.selectAll(merge_sets).on("click", (e) => {
        $(
          utils.get_ui_element_selector_by_role("priority_set_merge")
        ).modal();
      });
    }
  }
}

function get_editor() {
  return priority_set_editor;
}

function get_pg() {
  return defined_priority_groups;
}

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
    alert(clusterNetwork._networkWarnExecutiveMode);
    return;
  }

  created_by = existing_set
    ? existing_set.createdBy
    : created_by || clusterNetwork._cdcCreatedByManual;

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
        .data(kind_options || clusterNetwork._cdcPrioritySetKind)
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

      cluster_tracking = cluster_tracking || clusterNetwork._cdcTrackingOptionsDefault;

      grp_tracking_select
        .selectAll("option")
        .data(clusterNetwork._cdcTrackingOptions)
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
      panel_object.cleanup_attributes =
        function () {
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
        return cm === clusterNetwork._cdcCreatedByManual || !node["_priority_set_fixed"];
      }

      let createdDate =
        existing_set && validation_mode && validation_mode.length
          ? existing_set.created
          : timeDateUtil.getCurrentDate();

      let modifiedDate =
        validation_mode === "validate" && created_by === clusterNetwork._cdcCreatedBySystem
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
              $(
                d3
                  .select(utils.get_ui_element_selector_by_role(k))
                  .node()
              ).val()
          );

          if (
            !panel_object.first_save &&
            priority_groups_check_name(defined_priority_groups, name, panel_object.prior_name)
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
              created: clusterNetwork._defaultDateFormats[0](createdDate),
              modified: clusterNetwork._defaultDateFormats[0](modifiedDate),
              kind: kind,
              tracking: tracking,
              createdBy: created_by,
              expanded: false,
              autocreated: existing_set ? existing_set.autocreated : false,
              autoexpanded: existing_set ? existing_set.autoexpanded : false,
              pending: false,
            };

            if (tracking !== clusterNetwork._cdcTrackingNone) {
              let added_nodes = auto_expand_pg(self, set_description);
              if (added_nodes.size) {
                if (
                  confirm(
                    'This cluster of interest does not include all the nodes in the current network that are eligible for membership by growth criterion  "' +
                    tracking +
                    '". These ' +
                    added_nodes.size +
                    " additional nodes will be automatically added to this cluster of interest when you save it. If you don’t want to add these nodes to the cluster of interest please select 'Cancel' and change the growth criterion."
                  )
                ) {
                  _.each([...added_nodes], (nid) => {
                    let n = self.json.Nodes[nid];
                    set_description.nodes.push({
                      name: n.id,
                      added: timeDateUtil.getCurrentDate(),
                      kind: clusterNetwork._cdcPrioritySetDefaultNodeKind,
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
                let tab_pill = utils.get_ui_element_selector_by_role("priority_set_counts"),
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
          utils.get_ui_element_selector_by_role("priority-panel-name")
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

      $(grp_name_button.node())
        .on("input propertychange", function (e) {
          let current_text = $(this).val();
          if (
            priority_groups_check_name(
              defined_priority_groups,
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

      var auto_object = autocomplete(
        utils.get_ui_element_selector_by_role("priority-panel-nodeids"),
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
                hits.length < 10 && i < self.json["Nodes"].length;
                i++
              ) {
                if (pattern.test(self.json["Nodes"][i].id)) {
                  if (panel_object.can_add(self.json["Nodes"][i].id)) {
                    hits.push(self.json["Nodes"][i].id);
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
        const validator = _.filter(self.json["Nodes"], (n) => n.id === expression);
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
          node["_priority_set_kind"] = clusterNetwork._cdcPrioritySetDefaultNodeKind;
        }
        panel_object.network_nodes.push(node);
      };

      panel_object.can_add_nodes = function () {
        if (created_by !== clusterNetwork._cdcCreatedByManual) {
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
        existing_attributes
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

        _.each(nodes_to_add, (n) => {
          if (!(n in existing_ids) && n in valid_ids) {
            panel_object._append_node(valid_ids[n]);
            existing_ids[n] = 1;
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
        panel_object.network_nodes = _.filter(
          panel_object.network_nodes,
          (nn) => nn !== n
        );
        panel_object.table_handler(panel_object);
      };

      auto_object
        .on(
          "autocomplete:selected",
          (event, suggestion, dataset, context) => {
            auto_object.autocomplete.setVal(suggestion);
            panel_object.validate_input();
          }
        )
        .on("input propertychange", () => {
          panel_object.validate_input();
        });

      panel_object.table_handler = function (panel) {
        var table_container = panel_content
          .selectAll("table")
          .data(["panel"]);
        table_container.enter().append("table");
        table_container
          .classed(
            "table table-striped table-condensed table-hover table-smaller",
            true
          )
          .attr("id", "priority-panel-node-table");


        panel.setHeaderTitle(
          "clusterOI editor (" +
          panel.network_nodes.length +
          " nodes)" +
          (validation_mode ? " [automatically created review] " : "")
        );

        save_set_button.attr(
          "disabled",
          panel.network_nodes.length ? null : "disabled"
        );

        var del_form_generator = function () {
          return (
            `<div class="form">
  <div class="form-group">
    <div class="input-group"> <textarea class="form-control input-sm" data-hivtrace-ui-role="priority-description-form"
        cols="40" rows="3"></textarea> </div>
  </div> <button data-hivtrace-ui-role="priority-description-dismiss" class="btn btn-sm btn-default">Cancel</button>
  <button data-hivtrace-ui-role="priority-description-save" class="btn btn-sm btn-default">Delete</button>
</div`);
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
                        clusterNetwork._defaultDateViewFormatMMDDYYY(
                          payload["_priority_set_date"]
                        )
                      );
                    } else {
                      this_cell
                        .append("input")
                        .attr("type", "date")
                        .attr(
                          "value",
                          clusterNetwork._defaultDateViewFormatSlider(
                            payload["_priority_set_date"]
                          )
                        )
                        .on("change", (e, d) => {
                          try {
                            payload["_priority_set_date"] =
                              clusterNetwork._defaultDateViewFormatSlider.parse(
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
                        dropdown: clusterNetwork._cdcPrioritySetNodeKind,
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
          panel.network_nodes,
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
        if (confirm("Close cluster of interest editor?")) {
          //console.log ("Closing...");
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
      redraw_tables(self);
    },
  });
}

function _generate_auto_id(self, subcluster_id) {
  const id =
    self.CDC_data["jurisdiction_code"] +
    "_" +
    clusterNetwork._defaultDateViewFormatClusterCreate(self.CDC_data["timestamp"]) +
    "_" +
    subcluster_id;
  let suffix = "";
  let k = 1;
  let found = self.auto_create_priority_sets.find((d) => d.name === id + suffix)
    || defined_priority_groups.find((d) => d.name === id + suffix);
  while (found !== undefined) {
    suffix = "_" + k;
    k++;
    found = self.auto_create_priority_sets.find((d) => d.name === id + suffix)
      || defined_priority_groups.find((d) => d.name === id + suffix);
  }
  return id + suffix;
}

function load_priority_sets(self, url, is_writeable) {
  d3.json(url, (error, results) => {
    if (error) {
      throw Error("Failed loading cluster of interest file " + error.responseURL);
    } else {
      let latest_date = new Date();
      latest_date.setFullYear(1900);
      defined_priority_groups = _.clone(results);
      _.each(defined_priority_groups, (pg) => {
        _.each(pg.nodes, (n) => {
          try {
            n.added = clusterNetwork._defaultDateFormats[0].parse(n.added);
            if (n.added > latest_date) {
              latest_date = n.added;
            }
          } catch {
            // do nothing
          }
        });
      });

      self.priority_set_table_writeable = is_writeable === "writeable";

      priority_groups_validate(
        defined_priority_groups,
        self._is_CDC_auto_mode
      );

      self.auto_create_priority_sets = [];
      // propose some
      const today_string = clusterNetwork._defaultDateFormats[0](self.today);
      const node_id_to_object = {};

      _.each(self.json.Nodes, (n, i) => {
        node_id_to_object[n.id] = n;
      });

      if (self._is_CDC_auto_mode) {
        _.each(self.clusters, (cluster_data, cluster_id) => {
          _.each(cluster_data.subclusters, (subcluster_data) => {
            _.each(subcluster_data.priority_score, (priority_score, i) => {
              if (
                priority_score.length >=
                self.CDC_data["autocreate-priority-set-size"]
              ) {
                // only generate a new set if it doesn't match what is already there
                const node_set = {};
                _.each(subcluster_data.recent_nodes[i], (n) => {
                  node_set[n] = 1;
                });

                const matched_groups = _.filter(
                  _.filter(
                    defined_priority_groups,
                    (pg) =>
                      pg.kind in clusterNetwork._cdcPrioritySetKindAutoExpand &&
                      pg.createdBy === clusterNetwork._cdcCreatedBySystem &&
                      pg.tracking === clusterNetwork._cdcTrackingOptionsDefault
                  ),
                  (pg) => {
                    const matched = _.countBy(
                      _.map(pg.nodes, (pn) => pn.name in node_set)
                    );
                    //if (pg.name === 'FL_201709_141.1') console.log (matched);
                    return (
                      //matched[true] === subcluster_data.recent_nodes[i].length
                      matched[true] >= 1
                    );
                  }
                );

                if (matched_groups.length >= 1) {
                  return;
                }

                const autoname = _generate_auto_id(subcluster_data.cluster_id);
                self.auto_create_priority_sets.push({
                  name: autoname,
                  description:
                    "Automatically created cluster of interest " + autoname,
                  nodes: _.map(subcluster_data.recent_nodes[i], (n) =>
                    priority_group_node_record(n, self.today)
                  ),
                  created: today_string,
                  kind: clusterNetwork._cdcPrioritySetKindAutomaticCreation,
                  tracking: clusterNetwork._cdcTrackingOptions[0],
                  createdBy: clusterNetwork._cdcCreatedBySystem,
                  autocreated: true,
                  autoexpanded: false,
                  pending: true,
                });
              }
            });
          });
        });
      }

      if (self.auto_create_priority_sets.length) {
        // SLKP 20200727 now check to see if any of the priority sets
        // need to be auto-generated
        //console.log (self.auto_create_priority_sets);
        defined_priority_groups.push(...self.auto_create_priority_sets);
      }
      const autocreated = defined_priority_groups.filter(
        (pg) => pg.autocreated
      ).length,
        autoexpanded = defined_priority_groups.filter(
          (pg) => pg.autoexpanded
        ).length,
        automatic_action_taken = autocreated + autoexpanded > 0,
        left_to_review = defined_priority_groups.filter(
          (pg) => pg.pending
        ).length;

      if (automatic_action_taken) {
        self.warning_string +=
          "<br/>Automatically created <b>" +
          autocreated +
          "</b> and expanded <b>" +
          autoexpanded +
          "</b> clusters of interest." +
          (left_to_review > 0
            ? " <b>Please review <span id='banner_coi_counts'></span> clusters in the <code>Clusters of Interest</code> tab.</b><br>"
            : "");
        self.display_warning(self.warning_string, true);
      }

      const tab_pill = utils.get_ui_element_selector_by_role("priority_set_counts")

      if (!self.priority_set_table_writeable) {
        const rationale =
          is_writeable === "old"
            ? "the network is <b>older</b> than some of the Clusters of Interest"
            : "the network was ran in <b>standalone</b> mode so no data is stored";
        self.warning_string += `<p class="alert alert-danger"class="alert alert-danger">READ-ONLY mode for Clusters of Interest is enabled because ${rationale}. None of the changes to clustersOI made during this session will be recorded.</p>`;
        self.display_warning(self.warning_string, true);
        if (tab_pill) {
          d3.select(tab_pill).text("Read-only");
        }
      } else if (tab_pill && left_to_review > 0) {
        d3.select(tab_pill).text(left_to_review);
        d3.select("#banner_coi_counts").text(left_to_review);
      }

      priority_groups_validate(defined_priority_groups);
      _.each(self.auto_create_priority_sets, (pg) =>
        priority_groups_update_node_sets(self, pg.name, "insert")
      );
      const groups_that_expanded = defined_priority_groups.filter(
        (pg) => pg.expanded
      );
      _.each(groups_that_expanded, (pg) =>
        priority_groups_update_node_sets(self, pg.name, "update")
      );

      draw_priority_set_table(self);
      if (
        self.showing_diff &&
        self.has_network_attribute("subcluster_or_priority_node")
      ) {
        self.handle_attribute_categorical("subcluster_or_priority_node");
      }
      //self.update();
    }
  });
};

function priority_group_node_record(node_id, date, kind) {
  return {
    name: node_id,
    added: date,
    kind: kind || clusterNetwork._cdcPrioritySetDefaultNodeKind,
    autoadded: true,
  };
};

function priority_groups_compute_overlap(self, groups) {
  /**
      compute the overlap between priority sets (PS)
      
      1. Populate self.priority_node_overlap dictionary which
         stores, for every node present in AT LEAST ONE PS, the set of all 
         PGs it belongs to, as in "node-id" => set ("PG1", "PG2"...)
         
      2. For each PS, create and populate a member field, .overlaps
         which is a dictionary that stores
         {
              sets : #of PS with which it shares nodes
              nodes: the # of nodes contained in overlaps
         }
  
  */
  self.priority_node_overlap = {};
  const size_by_pg = {};
  _.each(groups, (pg) => {
    size_by_pg[pg.name] = pg.nodes.length;
    _.each(pg.nodes, (n) => {
      if (!(n.name in self.priority_node_overlap)) {
        self.priority_node_overlap[n.name] = new Set();
      }
      self.priority_node_overlap[n.name].add(pg.name);
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
    _.each(pg.nodes, (n) => {
      if (self.priority_node_overlap[n.name].size > 1) {
        overlap.nodes++;
        self.priority_node_overlap[n.name].forEach((pgn) => {
          if (pgn !== pg.name) {
            if (!(pgn in by_set_count)) {
              by_set_count[pgn] = [];
            }
            by_set_count[pgn].push(n.name);
          }
          overlap.sets.add(pgn);
        });
      }
    });

    _.each(by_set_count, (nodes, name) => {
      if (nodes.length === pg.nodes.length) {
        if (size_by_pg[name] === pg.nodes.length) {
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

function priority_groups_update_node_sets(self, name, operation) {
  // name : the name of the priority group being added
  // operation: one of
  // "insert" , "delete", "update"

  const sets = priority_groups_export().filter((pg) => pg.name === name);
  const to_post = {
    operation: operation,
    name: name,
    url: window.location.href,
    sets: JSON.stringify(sets),
  };

  if (self.priority_set_table_write && self.priority_set_table_writeable) {
    d3.text(self.priority_set_table_write)
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
};

function priority_groups_compute_node_membership(self) {
  const pg_nodesets = [];

  _.each(defined_priority_groups, (g) => {
    pg_nodesets.push([
      g.name,
      g.createdBy === clusterNetwork._cdcCreatedBySystem,
      new Set(_.map(g.nodes, (n) => n.name)),
    ]);
  });

  const pg_enum = [
    "Yes (dx≤12 months)",
    "Yes (12<dx≤ 36 months)",
    "Yes (dx>36 months)",
    "No",
  ];

  _.each(
    {
      subcluster_or_priority_node: {
        depends: [timeDateUtil._networkCDCDateField],
        label: clusterNetwork._cdcPOImember,
        enum: pg_enum,
        type: "String",
        volatile: true,
        color_scale: function () {
          return d3.scale
            .ordinal()
            .domain(pg_enum.concat([clusterNetwork._networkMissing]))
            .range([
              "red",
              "orange",
              "yellow",
              "steelblue",
              clusterNetwork._networkMissingColor,
            ]);
        },
        map: function (node) {
          const npcoi = _.some(pg_nodesets, (d) => d[1] && d[2].has(node.id));
          if (npcoi) {
            const cutoffs = [
              timeDateUtil.getNMonthsAgo(self.get_reference_date(), 12),
              timeDateUtil.getNMonthsAgo(self.get_reference_date(), 36),
            ];

            //const ysd = self.attribute_node_value_by_id(
            //  node,
            //  "years_since_dx"
            //);

            if (
              self._filter_by_date(
                cutoffs[0],
                timeDateUtil._networkCDCDateField,
                self.get_reference_date(),
                node,
                false
              )
            )
              return pg_enum[0];
            if (
              self._filter_by_date(
                cutoffs[1],
                timeDateUtil._networkCDCDateField,
                self.get_reference_date(),
                node,
                false
              )
            )
              return pg_enum[1];
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
          const memberships = _.filter(pg_nodesets, (d) => d[2].has(node.id));
          if (memberships.length === 1) {
            return memberships[0][0];
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
          return clusterNetwork._networkMissing;
        },
      },
    },
    self._aux_populated_predefined_attribute
  );
  self._aux_populate_category_menus();
};

function priority_groups_export(group_set, include_unvalidated) {
  group_set = group_set || defined_priority_groups;

  return _.map(
    _.filter(group_set, (g) => include_unvalidated || g.validated),
    (g) => ({
      name: g.name,
      description: g.description,
      nodes: g.nodes,
      modified: clusterNetwork._defaultDateFormats[0](g.modified),
      kind: g.kind,
      created: clusterNetwork._defaultDateFormats[0](g.created),
      createdBy: g.createdBy,
      tracking: g.tracking,
      autocreated: g.autocreated,
      autoexpanded: g.autoexpanded,
      pending: g.pending,
    })
  );
};

function priority_groups_validate(self, groups, auto_extend) {
  /**
    groups is a list of priority groups

    name: unique string
    description: string,
    nodes: {
        {
            'id' : node id,
            'added' : date,
            'kind' : enum (one of _cdcPrioritySetNodeKind)
        }
    },
    created: date,
    kind: enum (one of _cdcPrioritySetKind),
    tracking: enum (one of _cdcTrackingOptions)
    createdBy : enum (on of [_cdcCreatedBySystem,_cdcCreatedByManual])
  */

  if (_.some(groups, (g) => !g.validated)) {
    const priority_subclusters = _.map(
      _.filter(
        _.flatten(
          _.map(
            _.flatten(
              _.map(self.clusters, (c) =>
                _.filter(
                  _.filter(c.subclusters, (sc) => sc.priority_score.length)
                )
              )
            ),
            (d) => d.priority_score
          ),
          1
        ),
        (d) => d.length >= self.CDC_data["autocreate-priority-set-size"]
      ),
      (d) => new Set(d)
    );

    const nodeset = {};
    const nodeID2idx = {};
    _.each(self.json.Nodes, (n, i) => {
      nodeset[n.id] = n;
      nodeID2idx[n.id] = i;
    });
    _.each(groups, (pg) => {
      if (!pg.validated) {
        pg.node_objects = [];
        pg.not_in_network = [];
        pg.validated = true;
        pg.created = _.isDate(pg.created)
          ? pg.created
          : clusterNetwork._defaultDateFormats[0].parse(pg.created);
        if (pg.modified) {
          pg.modified = _.isDate(pg.modified) ? pg.modified : clusterNetwork._defaultDateFormats[0].parse(pg.modified);
        } else {
          pg.modified = pg.created;
        }
        if (!pg.tracking) {
          if (pg.kind === clusterNetwork._cdcPrioritySetKind[0]) {
            pg.tracking = clusterNetwork._cdcTrackingOptions[0];
          } else {
            pg.tracking = clusterNetwork._cdcTrackingOptions[4];
          }
        }
        if (!pg.createdBy) {
          if (pg.kind === clusterNetwork._cdcPrioritySetKind[0]) {
            pg.createdBy = clusterNetwork._cdcCreatedBySystem;
          } else {
            pg.createdBy = clusterNetwork._cdcCreatedByManual;
          }
        }

        _.each(pg.nodes, (node) => {
          const nodeid = node.name;
          if (nodeid in nodeset) {
            pg.node_objects.push(nodeset[nodeid]);
          } else {
            pg.not_in_network.push(nodeid);
          }
        });

        /**     extract network data at 0.015 and subcluster thresholds
                          filter on dates subsequent to created date
                   **/

        const my_nodeset = new Set(_.map(pg.node_objects, (n) => n.id));

        const node_set15 = _.flatten(
          hivtrace_cluster_depthwise_traversal(
            self.json.Nodes,
            self.json.Edges,
            (e) => e.length <= 0.015,
            null,
            pg.node_objects
          )
        );

        const saved_traversal_edges = auto_extend ? [] : null;

        const node_set_subcluster = _.flatten(
          hivtrace_cluster_depthwise_traversal(
            self.json.Nodes,
            self.json.Edges,
            (e) => e.length <= self.subcluster_threshold,
            saved_traversal_edges,
            pg.node_objects
          )
        );

        const direct_at_15 = new Set();

        const json15 = self._extract_single_cluster(
          node_set15,
          (e) => (
            e.length <= 0.015 &&
            (my_nodeset.has(self.json.Nodes[e.target].id) ||
              my_nodeset.has(self.json.Nodes[e.source].id))
          ),
          //null,
          true
        );

        _.each(json15["Edges"], (e) => {
          _.each([e.source, e.target], (nid) => {
            if (!my_nodeset.has(json15["Nodes"][nid].id)) {
              direct_at_15.add(json15["Nodes"][nid].id);
            }
          });
        });

        const current_time = self.today;

        const json_subcluster = self._extract_single_cluster(
          node_set_subcluster,
          (e) => (
            e.length <= self.subcluster_threshold &&
            (my_nodeset.has(self.json.Nodes[e.target].id) ||
              my_nodeset.has(self.json.Nodes[e.source].id))
            /*|| (auto_extend && (self._filter_by_date(
                pg.modified || pg.created,
                timeDateUtil._networkCDCDateField,
                current_time,
                self.json.Nodes[e.target],
                true
              ) || self._filter_by_date(
                pg.modified || pg.created,
                timeDateUtil._networkCDCDateField,
                current_time,
                self.json.Nodes[e.source],
                true
              )))*/
          ),
          true
        );

        const direct_subcluster = new Set();
        const direct_subcluster_new = new Set();
        _.each(json_subcluster["Edges"], (e) => {
          _.each([e.source, e.target], (nid) => {
            if (!my_nodeset.has(json_subcluster["Nodes"][nid].id)) {
              direct_subcluster.add(json_subcluster["Nodes"][nid].id);

              if (
                self._filter_by_date(
                  pg.modified || pg.created,
                  timeDateUtil._networkCDCDateField,
                  current_time,
                  json_subcluster["Nodes"][nid],
                  true
                )
              )
                direct_subcluster_new.add(json_subcluster["Nodes"][nid].id);
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
                self._filter_by_date(
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

        if (auto_extend && pg.tracking !== clusterNetwork._cdcTrackingNone) {
          const added_nodes = auto_expand_pg(self, pg, nodeID2idx);

          if (added_nodes.size) {
            _.each([...added_nodes], (nid) => {
              const n = self.json.Nodes[nid];
              pg.nodes.push({
                name: n.id,
                added: current_time,
                kind: clusterNetwork._cdcPrioritySetDefaultNodeKind,
                autoadded: true,
              });
              pg.node_objects.push(n);
            });
            pg.validated = false;
            pg.autoexpanded = true;
            pg.pending = true;
            pg.expanded = added_nodes.size;
            pg.modified = self.today;
          }
        }

        const node_set = new Set(_.map(pg.nodes, (n) => n.name));
        pg.meets_priority_def = _.some(priority_subclusters, (ps) => (
          _.filter([...ps], (psi) => node_set.has(psi)).length === ps.size
        ));
        const cutoff12 = timeDateUtil.getNMonthsAgo(self.get_reference_date(), 12);
        pg.last12 = _.filter(pg.node_objects, (n) =>
          self._filter_by_date(
            cutoff12,
            timeDateUtil._networkCDCDateField,
            self.today,
            n,
            false
          )
        ).length;
      }
    });
  }
};

function auto_expand_pg(self, pg, nodeID2idx) {
  if (!nodeID2idx) {
    const nodeset = {};
    nodeID2idx = {};
    _.each(self.json.Nodes, (n, i) => {
      nodeset[n.id] = n;
      nodeID2idx[n.id] = i;
    });
  }

  const core_node_set = new Set(_.map(pg.nodes, (n) => nodeID2idx[n.name]));
  const added_nodes = new Set();
  const filter = clusterNetwork._cdcTrackingOptionsFilter[pg.tracking];

  if (filter) {
    const time_cutoff = timeDateUtil.getNMonthsAgo(
      self.get_reference_date(),
      clusterNetwork._cdcTrackingOptionsCutoff[pg.tracking]
    );
    const expansion_test = hivtrace_cluster_depthwise_traversal(
      self.json.Nodes,
      self.json.Edges,
      (e) => {
        let pass = filter(e);
        if (pass) {
          if (!(core_node_set.has(e.source) && core_node_set.has(e.target))) {
            pass =
              pass &&
              self._filter_by_date(
                time_cutoff,
                timeDateUtil._networkCDCDateField,
                self.get_reference_date(),
                self.json.Nodes[e.source]
              ) &&
              self._filter_by_date(
                time_cutoff,
                timeDateUtil._networkCDCDateField,
                self.get_reference_date(),
                self.json.Nodes[e.target]
              );
          }
        }
        return pass;
      },
      false,
      _.filter(
        _.map([...core_node_set], (d) => self.json.Nodes[d]),
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

function handle_inline_confirm(
  this_button,
  generator,
  text,
  action,
  disabled
) {
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
          utils.get_ui_element_selector_by_role("priority-description-form")
        );
        var button_element = popover_div.selectAll(
          utils.get_ui_element_selector_by_role("priority-description-save")
        );
        textarea_element.text(text);
        if (disabled) textarea_element.attr("disabled", true);
        button_element.on("click", (d) => {
          action($(textarea_element.node()).val());
          d3.event.preventDefault();
          this_button.click();
        });
        button_element = popover_div.selectAll(
          utils.get_ui_element_selector_by_role("priority-description-dismiss")
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
};

function _action_drop_down(self, pg) {
  let dropdown = _.flatten(
    [
      _.map([self.subcluster_threshold, 0.015], (threshold) => ({
        label:
          "View this cluster of interest at link distance of " +
          clusterNetwork._defaultPercentFormatShort(threshold),
        action: function (button, value) {
          priority_set_view(self,
            pg, {
            timestamp: pg.modified || pg.created,
            priority_set: pg,
            "priority-edge-length": threshold,
            title:
              pg.name + " @" + clusterNetwork._defaultPercentFormat(threshold),
          });
        },
      })),
    ],
    true
  );

  if (!self._is_CDC_executive_mode) {
    dropdown.push({
      label: "Clone this cluster of interest in a new editor panel",
      action: function (button, value) {
        let ref_set = priority_groups_find_by_name(self, pg.name);
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
        redraw_tables(self);
      },
    });
    if (pg.createdBy !== "System") {
      dropdown.push({
        label: "Delete this cluster of interest",
        action: function (button, value) {
          if (confirm("This action cannot be undone. Proceed?")) {
            priority_groups_remove_set(self, pg.name, true);
          }
        },
      });
    }
    dropdown.push({
      label: "View nodes in this cluster of interest",
      data: {
        toggle: "modal",
        target: utils.get_ui_element_selector_by_role("cluster_list"),
        priority_set: pg.name,
      },
    });
  }
  dropdown.push({
    label: "Modify this cluster of interest",
    action: function (button, value) {
      let ref_set = priority_groups_find_by_name(self, pg.name);

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
        redraw_tables(self);
      }
    },
  });

  dropdown.push({
    label: "View history over time",
    action: function (button, value) {
      let ref_set = priority_groups_find_by_name(self, pg.name);
      let report = generate_coi_temporal_report(self, ref_set);
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
  });

  return dropdown;
}

function draw_priority_set_table(self, container, priority_groups) {
  container = container || self.priority_set_table;
  if (container) {
    priority_groups = priority_groups || defined_priority_groups;
    priority_groups_compute_node_membership(self);
    priority_groups_compute_overlap(self, priority_groups);
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
          value: pg.createdBy,
          html: true,
          width: 50,
          format: (value) =>
            pg.createdBy === clusterNetwork._cdcCreatedBySystem
              ? '<i class="fa fa-2x fa-desktop" title="' +
              clusterNetwork._cdcCreatedBySystem +
              '" data-text-export=' +
              clusterNetwork._cdcCreatedBySystem +
              "></i>"
              : '<i class="fa fa-2x fa-user" title="' +
              clusterNetwork._cdcCreatedByManual +
              '" data-text-export=' +
              clusterNetwork._cdcCreatedByManual +
              "></i>",
        },
        {
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
          width: 180,
          value: [pg.modified, pg.created],
          format: function (value) {
            let vs = _.map(value, (v) => clusterNetwork._defaultDateViewFormat(v));

            if (vs[0] !== vs[1]) {
              return vs[0] + " / " + vs[1];
            }
            return vs[0];
          },
        },
        {
          width: 100,
          //text_wrap: true,
          value: pg.tracking,
          format: function (value) {
            return clusterNetwork._cdcConciseTrackingOptions[value];
          },
        },
        {
          value: [
            pg.node_objects.length,
            _.filter(pg.nodes, (g) => g.autoadded)
              .length,
            pg.createdBy === clusterNetwork._cdcCreatedBySystem && pg.pending,
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
          width: 60,
          value: pg.meets_priority_def ? "Yes" : "No",
        },
        {
          width: 50,
          value: pg.last12,
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
                  ? ' <span title="Number of nodes in the overlap" class="label label-default pull-right">' +
                  v[1] +
                  " nodes</span>"
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
                        target: utils.get_ui_element_selector_by_role("overlap_list"),
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
              let nodeset = priority_groups_find_by_name(self, value);
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
                  redraw_tables(self);
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
                  priority_groups_set_description(self, pg.name, d, true);
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
                  let nodeset = priority_groups_find_by_name(self, value);
                  if (nodeset) {
                    get_editor().append_node_objects(
                      nodeset.node_objects
                    );
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
              "Nodes removed from the network: " +
              pg.not_in_network.join(", "),
          },
        ];
      }
      rows.push(this_row);
    });


    let has_required_actions = "";
    /* let has_automatic = defined_priority_groups.some(pg => pg.pending);
    let has_expanded = defined_priority_groups.some(pg => pg.expanded);

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
      utils.get_ui_element_selector_by_role("priority-subclusters-export")
    ).on("click", (d) => {
      helpers.export_json_button(
        priority_groups_export(),
        clusterNetwork._defaultDateViewFormatSlider(self.today)
      );
    });
    d3.select(
      utils.get_ui_element_selector_by_role("priority-subclusters-export-csv")
    ).on("click", (d) => {
      helpers.export_csv_button(
        priority_groups_export_nodes(self),
        "clusters-of-interest"
      );
    });
    d3.select("#priority_set_table_download").on("click", (d) => {
      helpers.export_csv_button(
        priority_groups_export_sets(),
        "clusters_of_interest_table"
      );
    });
  }
}

function redraw_tables(self) {
  tables.update_volatile_elements(self.cluster_table);
  if (self.subcluster_table) {
    tables.update_volatile_elements(self.subcluster_table);
  }
  tables.update_volatile_elements(nodesTab.getNodeTable());
  if (self.priority_set_table) {
    tables.update_volatile_elements(self.priority_set_table);
  }
};

function priority_set_view(self, priority_set, options) {
  options = options || {};

  let nodes = priority_set.node_objects || priority_set.network_nodes;
  let current_time = timeDateUtil.getCurrentDate();
  let edge_length =
    options["priority-edge-length"] || self.subcluster_threshold;
  let reference_date = options["timestamp"] || self.today;
  let title = options["title"] || "clusterOI " + (priority_set.prior_name || priority_set.name || "unnamed");
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
    d._added_date =
      d.id in nodeDates ? nodeDates[d.id] : d._priority_set_date;
    if (d._added_date)
      d._added_date = clusterNetwork._defaultDateViewFormatSlider(d._added_date);
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

  let refDate = clusterNetwork._defaultDateViewFormat(reference_date);

  let dco = "fee8c8fdbb84e34a33";
  let defColorsOther = d3.scale
    .ordinal()
    .range(_.map(_.range(0, dco.length, 6), (d) => "#" + dco.substring(d, d + 6)));

  let maxColors = 4;
  let dcpg = "7b3294c2a5cfa6dba0008837";
  let defColorsPG = d3.scale
    .ordinal()
    .range(_.map(_.range(0, dcpg.length, 6), (d) => "#" + dcpg.substring(d, d + 6)));

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
  let viewEnumMissing = [...viewEnum, clusterNetwork._networkMissing];

  let viewEnumMissingColors = _.map(viewEnumMissing, (d, i) => {
    if (d !== clusterNetwork._networkMissing) {
      if (i < priorityColorOffset) {
        return defColorsPG(d);
      }
      return defColorsOther(d);
    }
    return "gray";
  });

  self.view_subcluster(
    -1,
    node_set,
    title,
    {
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
              : clusterNetwork._networkMissing;
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
              self._filter_by_date(
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

function priority_groups_set_description(
  self,
  name,
  description,
  update_table
) {
  if (defined_priority_groups) {
    var idx = _.findIndex(
      defined_priority_groups,
      (g) => g.name === name
    );
    if (idx >= 0) {
      defined_priority_groups[idx].description = description;
      priority_groups_update_node_sets(self, name, "update");
      if (update_table) {
        draw_priority_set_table(self);
      }
    }
  }
};

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
    return _.some(defined_priority_groups, (d) => {
      if (d.nodes.length === my_nodes.size) {
        const same_nodes = d.nodes.filter((x) => my_nodes.has(x.name)).length === d.nodes.length;
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
    priority_groups_validate(self, [nodeset]);
  }
  if (prior_name) {
    let prior_index = _.findIndex(
      defined_priority_groups,
      (d) => d.name === prior_name
    );
    if (prior_index >= 0) {
      if (prior_name !== nodeset.name) {
        priority_groups_update_node_sets(self, prior_name, "delete");
        op_code = "insert";
      }
      defined_priority_groups[prior_index] = nodeset;
    } else {
      if (check_dup()) return false;
      defined_priority_groups.push(nodeset);
    }
  } else {
    if (check_dup()) return false;
    defined_priority_groups.push(nodeset);
  }
  priority_groups_update_node_sets(self, nodeset.name, op_code);

  if (update_table) {
    draw_priority_set_table(self);
  }

  return true;
}

function priority_groups_remove_set(self, name, update_table) {
  if (defined_priority_groups) {
    var idx = _.findIndex(
      defined_priority_groups,
      (g) => g.name === name
    );
    if (idx >= 0) {
      defined_priority_groups.splice(idx, 1);
      priority_groups_update_node_sets(self, name, "delete");
      if (update_table) {
        draw_priority_set_table(self);
      }
    }
  }
};


function priority_set_inject_node_attibutes(self, nodes, node_attributes) {
  let attr_by_id = {};
  _.each(node_attributes, (n, i) => {
    attr_by_id[n.name] = {
      _priority_set_date: n.added || self.today,
      _priority_set_kind: n.kind || clusterNetwork._cdcPrioritySetDefaultNodeKind,
      _priority_set_autoadded: n.autoadded || false,
    };
  });
  _.each(nodes, (n) => {
    if (n.id in attr_by_id) {
      _.extend(n, attr_by_id[n.id]);
    }
  });
}

function priority_groups_check_name(defined_priority_groups, string, prior_name) {
  if (string.length) {
    if (string.length >= 36) return false;
    return !_.some(
      defined_priority_groups,
      (d) => d.name === string && d.name !== prior_name
    );
  }
  return false;
}

function priority_groups_find_by_name(self, name) {
  return defined_priority_groups?.find((pg) => pg.name === name);
};

function priority_group_get_all_events(self) {
  // generate a set of all unique temporal events (when new data were added to ANY PG)
  const events = new Set();
  if (defined_priority_groups) {
    _.each(defined_priority_groups, (g) => {
      _.each(g.nodes, (n) => {
        events.add(clusterNetwork._defaultDateViewFormatSlider(n.added));
      });
    });
  }
  return events;
};

function generate_coi_temporal_report(self, ref_set, D) {
  if (!ref_set) return {};
  D = D || 0.005;

  const nodesD = hivtrace_cluster_depthwise_traversal(
    self.json.Nodes,
    self.json.Edges,
    (e) => e.length <= D,
    null,
    ref_set.node_objects
  );

  const full_subclusters = _.map(nodesD, (cc) =>
    self._extract_single_cluster(cc, (e) => e.length <= D)
  );
  // the nodes in full_subclusters are now shallow clones
  // const nodeid2cc = _.chain(nodesD) // unused var
  //   .map((cc, i) => _.map(cc, (n) => [n.id, i]))
  //   .flatten(1)
  //   .object()
  //   .value();
  // node id => index of its connected component in the full_subclusters array
  const pg_nodes = new Set(_.map(ref_set.node_objects, (n) => n.id));
  // set of node IDs in the CoI
  const seed_nodes = _.map(full_subclusters, (fc) =>
    _.filter(fc["Nodes"], (n) => pg_nodes.has(n.id))
  );
  // for each connected component, store the list of nodes that are both in the CC and the CoI
  // these are shallow copies
  _.each(seed_nodes, (sn) => _.each(sn, (n) => (n.visited = false)));

  var beginning_of_time = timeDateUtil.getCurrentDate();
  beginning_of_time.setFullYear(1900);

  // unused var 
  // const nodesD2 = _.map(full_subclusters, (fc, i) => hivtrace_cluster_depthwise_traversal(
  //   fc["Nodes"],
  //   fc["Edges"],
  //   (e) => (e.length <= D),
  //   null,
  //   seed_nodes[i]
  // ));

  const network_events = _.sortBy([...priority_group_get_all_events(self)]);
  network_events.reverse();
  const info_by_event = {};

  _.each(network_events, (DT) => {
    const event_date = clusterNetwork._defaultDateViewFormatSlider.parse(DT);
    const event_date_m3y = clusterNetwork._defaultDateViewFormatSlider.parse(DT);
    event_date_m3y.setFullYear(event_date.getFullYear() - 3);
    const event_date_m1y = clusterNetwork._defaultDateViewFormatSlider.parse(DT);
    event_date_m1y.setFullYear(event_date.getFullYear() - 1);
    const n_filter = (n) =>
      self._filter_by_date(
        beginning_of_time,
        timeDateUtil._networkCDCDateField,
        event_date,
        n
      );
    const n_filter3 = (n) =>
      self._filter_by_date(
        event_date_m3y,
        timeDateUtil._networkCDCDateField,
        event_date,
        n
      );
    const n_filter1 = (n) =>
      self._filter_by_date(
        event_date_m1y,
        timeDateUtil._networkCDCDateField,
        event_date,
        n
      );

    let nodesD2 = _.map(full_subclusters, (fc, i) => {
      const white_list = new Set(
        _.map(_.filter(fc["Nodes"], n_filter), (n) => n.id)
      );
      const cc_nodes = fc["Nodes"];
      return hivtrace_cluster_depthwise_traversal(
        cc_nodes,
        fc["Edges"],
        (e) => (
          e.length <= D &&
          n_filter3(cc_nodes[e.source]) &&
          n_filter3(cc_nodes[e.target])
        ),
        null,
        _.filter(seed_nodes[i], n_filter),
        white_list
      );
    });

    nodesD2 = _.flatten(nodesD2, 1);
    //console.log (nodesD2);

    info_by_event[DT] = {
      connected_componets: _.map(nodesD2, (nd) => nd.length),
      priority_nodes: _.map(nodesD2, (nd) =>
        _.map(_.filter(nd, n_filter1), (n) => n.id)
      ),
    };

    info_by_event[DT]["national_priority"] = _.map(
      info_by_event[DT].priority_nodes,
      (m) => m.length >= self.CDC_data["autocreate-priority-set-size"]
    );
  });

  const report = {
    node_info: _.map(ref_set.node_objects, (n) => [
      n.id,
      clusterNetwork._defaultDateViewFormatSlider(
        self.attribute_node_value_by_id(n, timeDateUtil._networkCDCDateField)
      ),
    ]),
    event_info: info_by_event,
  };

  /*let options = ["0","1","2","3","4","5","6","7","8","9","10"];
        let rename = {};
        _.each (report.node_info, (n)=> {
              rename[n[0]] = "N" + _.sample (options, 9).join ("");
              n[0] = rename[n[0]];
        });
        _.each (report.event_info, (d)=> {
            d.priority_nodes = _.map (d.priority_nodes, (d)=>_.map (d, (n)=>rename[n]));
        });
        //console.log (report);
        */

  helpers.export_json_button(report);
  return report;
};

function priority_groups_export_nodes(
  self,
  group_set,
  include_unvalidated
) {
  group_set = group_set || defined_priority_groups;

  return _.flatten(
    _.map(
      _.filter(group_set, (g) => include_unvalidated || g.validated),
      (g) => {
        //const refTime = g.modified.getTime();
        //console.log ("GROUP: ",g.name, " = ", g.modified);

        const exclude_nodes = new Set(g.not_in_network);
        let cluster_detect_size = 0;
        g.nodes.forEach((node) => {
          if (node.added <= g.created) cluster_detect_size++;
        });
        return _.map(
          _.filter(g.nodes, (gn) => !exclude_nodes.has(gn.name)),
          (gn) => ({
            eHARS_uid: gn.name,
            cluster_uid: g.name,
            cluster_ident_method: g.kind,
            person_ident_method: gn.kind,
            person_ident_dt: timeDateUtil.hivtrace_date_or_na_if_missing(gn.added),
            new_linked_case: gn.autoadded
              ? 1
              : 0,
            cluster_created_dt: timeDateUtil.hivtrace_date_or_na_if_missing(g.created),
            network_date: timeDateUtil.hivtrace_date_or_na_if_missing(self.today),
            cluster_detect_size: cluster_detect_size,
            cluster_type: g.createdBy,
            cluster_modified_dt: timeDateUtil.hivtrace_date_or_na_if_missing(g.modified),
            cluster_growth: clusterNetwork._cdcConciseTrackingOptions[g.tracking],
            national_priority: g.meets_priority_def,
            cluster_current_size: g.nodes.length,
            cluster_dx_recent12_mo: g.last12,
            cluster_overlap: g.overlap.sets,
          })
        );
      }
    )
  );
};

function priority_groups_export_sets() {
  return _.flatten(
    _.map(
      _.filter(defined_priority_groups, (g) => g.validated),
      (g) => ({
        cluster_type: g.createdBy,
        cluster_uid: g.name,
        cluster_modified_dt: timeDateUtil.hivtrace_date_or_na_if_missing(g.modified),
        cluster_created_dt: timeDateUtil.hivtrace_date_or_na_if_missing(g.created),
        cluster_ident_method: g.kind,
        cluster_growth: clusterNetwork._cdcConciseTrackingOptions[g.tracking],
        cluster_current_size: g.nodes.length,
        national_priority: g.meets_priority_def,
        cluster_dx_recent12_mo: g.last12,
        cluster_overlap: g.overlap.sets,
      })
    )
  );
};

export {
  init,
  get_editor,
  get_pg,
  open_editor,
  load_priority_sets,
  priority_groups_compute_node_membership,
  priority_groups_validate,
  priority_set_view,
  draw_priority_set_table,
  priority_set_inject_node_attibutes,
  priority_groups_find_by_name,
};