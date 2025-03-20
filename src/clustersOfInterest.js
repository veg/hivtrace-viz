const d3 = require("d3");
const _ = require("underscore");
const jsPanel = require("jspanel4").jsPanel;
const autocomplete = require("autocomplete.js");
const timeDateUtil = require("./timeDateUtil");

const utils = require("./utils");
const clusterNetwork = require("./clusternetwork");

var _defaultDateViewFormatMMDDYYY = d3.time.format("%m%d%Y");

function init(self) {
  if (self._is_CDC_ && self.isPrimaryGraph) {
    let new_set = utils.get_ui_element_selector_by_role(
      "new_priority_set",
      true
    );
    if (new_set) {
      window.addEventListener("beforeunload", function (e) {
        if (self.priority_groups_pending() > 0) {
          e.preventDefault();
          return "There are cluster of interest that have not been confirmed. Closing the window now will not finalize their creation.";
        }
      });

      d3.selectAll(new_set).on("click", function (e) {
        open_priority_set_editor(self, []);
        self.redraw_tables();
      });
    }

    let merge_sets = utils.get_ui_element_selector_by_role(
      "merge_priority_sets",
      true
    );

    if (merge_sets) {
      d3.selectAll(merge_sets).on("click", function (e) {
        $(
          utils.get_ui_element_selector_by_role("priority_set_merge", true)
        ).modal();
      });
    }
  }
}

function open_priority_set_editor(
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
  if (self.priority_set_editor || !self.isPrimaryGraph) return;
  // only open one editor at a time
  // only primary network supports editor view

  if (self._is_CDC_executive_mode) {
    alert(clusterNetwork._networkWarnExecutiveMode);
    return;
  }

  created_by = existing_set
    ? existing_set.createdBy
    : created_by || clusterNetwork._cdcCreatedByManual;

  self.priority_set_editor = jsPanel.create({
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
        ? existing_set.createdBy != "System"
        : true;

      panel_object.can_edit_name = existing_set
        ? existing_set.createdBy != "System"
        : true;

      panel_object.can_edit_tracking = !existing_set;

      panel_object.can_add = function (id) {
        return !_.some(panel_object.network_nodes, (d) => d.id == id);
      };

      var panel_content = d3.select(panel_object.content);
      panel_content.selectAll("*").remove();

      var form = panel_content
        .append("form")
        .attr("action", "javascript:void(0)")
        .classed("form-inline", true);

      var form_grp = form.append("div").classed("form-group", true);
      var node_ids_selector = form_grp
        .append("input")
        .classed("form-control input-sm", true)
        .attr("placeholder", "Add node by ID")
        .attr("data-hivtrace-ui-role", "priority-panel-nodeids");

      var submit_button = form
        .append("button")
        .classed("btn btn-primary btn-sm", true)
        .attr("disabled", "disabled")
        .on("click", function (e) {
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
        .attr("maxlength", 36);

      var grp_name_box_label = grp_name
        .append("p")
        .classed("help-block", true)
        .text("Name this cluster of interest");

      grp_name_button.on("input", function () {
        if (this.value.length == 35);
        {
          grp_name.classed("form-group has-error");
        }
      });

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
        .property("selected", (d) => d == cluster_kind);

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
        .property("selected", (d) => d == cluster_tracking);

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
      panel_object.cleanup_attributes = this.cleanup_attributes =
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
        return cm == clusterNetwork._cdcCreatedByManual || !node["_priority_set_fixed"];
      }

      let createdDate =
        existing_set && validation_mode && validation_mode.length
          ? existing_set.created
          : timeDateUtil.getCurrentDate();

      let modifiedDate =
        validation_mode == "validate" && created_by == clusterNetwork._cdcCreatedBySystem
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
                  .select(utils.get_ui_element_selector_by_role(k, true))
                  .node()
              ).val()
          );

          if (
            !panel_object.first_save &&
            self.priority_groups_check_name(name, panel_object.prior_name)
          ) {
            let set_description = {
              name: name,
              description: desc,
              nodes: _.map(panel_object.network_nodes, (d) => {
                return {
                  name: d.id,
                  added: d["_priority_set_date"],
                  kind: d["_priority_set_kind"],
                  autoadded: d["_priority_set_autoadded"],
                };
              }),
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

            if (tracking != clusterNetwork._cdcTrackingNone) {
              let added_nodes = self.auto_expand_pg_handler(set_description);
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

            res = self.priority_groups_add_set(
              set_description,
              true,
              true,
              panel_object.prior_name,
              panel_object.prior_name
                ? existing_set.pending
                  ? "insert"
                  : "update"
                : null
            );
            // clean up temporary flags from nodes
            panel_object.saved = true;
            panel_object.cleanup_attributes();
            panel_object.close();
            if (validation_mode == "validate") {
              if (self.priority_set_table_writeable) {
                let tab_pill = utils.get_ui_element_selector_by_role(
                  "priority_set_counts",
                  true
                ),
                  tab_pill_select = d3.select(tab_pill),
                  remaining_sets = +tab_pill_select.text();
                tab_pill_select.text(remaining_sets - 1);
                d3.select("#banner_coi_counts").text(remaining_sets - 1);
              }
            }
          }
          panel_object.first_save = false;
        }
        let panel_to_focus = document.querySelector(
          utils.get_ui_element_selector_by_role("priority-panel-name", true)
        );
        if (panel_to_focus) panel_to_focus.focus();
        return res;
      }

      var save_set_button = form
        .append("button")
        .classed("btn btn-primary btn-sm pull-right", true)
        .text(validation_mode == "validate" ? "Review & Save" : "Save")
        .attr("disabled", "disabled")
        .on("click", function (e) {
          save_priority_set();
        });

      form
        .append("button")
        .classed("btn btn-info btn-sm pull-right", true)
        .text("Preview @1.5%")
        .on("click", function (e) {
          self.priority_set_view(self.priority_set_editor, {
            "priority-edge-length": 0.015,
            timestamp: createdDate,
          });
        });
      form
        .append("button")
        .classed("btn btn-info btn-sm pull-right", true)
        .text("Preview @" + self.subcluster_threshold * 100 + "%")
        .on("click", function (e) {
          self.priority_set_view(self.priority_set_editor, {
            "priority-edge-length": self.subcluster_threshold,
            timestamp: createdDate,
          });
        });

      $(grp_name_button.node())
        .off("input propertychange")
        .on("input propertychange", function (e) {
          let current_text = $(this).val();
          if (
            self.priority_groups_check_name(
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
            let too_long = current_text.length == 36;
            grp_name.classed({
              "has-success": false,
              "has-error": !too_long,
              "has-warning": too_long,
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
        utils.get_ui_element_selector_by_role("priority-panel-nodeids", true),
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
        const validator = _.filter(self.json["Nodes"], (n) => n.id == expression);
        if (validator.length == 1 && panel_object.can_add(validator[0].id)) {
          if (!skip_ui) {
            submit_button.attr("disabled", null);
          }
          return validator[0];
        } else {
          if (!skip_ui) {
            submit_button.attr("disabled", "disabled");
          }
        }
        return null;
      };

      panel_object._append_node = function (node) {
        if (!("_priority_set_date" in node)) {
          node["_priority_set_date"] = createdDate;
        } else {
        }
        if (!("_priority_set_kind" in node)) {
          node["_priority_set_kind"] = clusterNetwork._cdcPrioritySetDefaultNodeKind;
        }
        panel_object.network_nodes.push(node);
      };

      panel_object.can_add_nodes = function () {
        if (created_by != clusterNetwork._cdcCreatedByManual) {
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
              valid_ids[n.id] = _.clone(n);
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
          function (nn) {
            return nn != n;
          }
        );
        panel_object.table_handler(panel_object);
      };

      auto_object
        .on(
          "autocomplete:selected",
          function (event, suggestion, dataset, context) {
            auto_object.autocomplete.setVal(suggestion);
            panel_object.validate_input();
          }
        )
        .on("input propertychange", function () {
          panel_object.validate_input();
        });

      panel_object.table_handler = function (panel) {
        var table_container = panel_content
          .selectAll("table")
          .data(["panel"]);
        table_container.enter().append("table");
        table_container.classed(
          "table table-striped table-condensed table-hover table-smaller",
          true
        );

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
          return '<form class="form"> \
                          <div class="form-group"> \
                              <div class="input-group">\
                              <textarea class="form-control input-sm" data-hivtrace-ui-role = "priority-description-form" cols = "40" rows = "3"></textarea>\
                              </div>\
                          </div>\
                          <button data-hivtrace-ui-role = "priority-description-dismiss" class = "btn btn-sm btn-default">Cancel</button>\
                          <button data-hivtrace-ui-role = "priority-description-save" class = "btn btn-sm btn-default">Delete</button>\
                      </form>';
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
                        _defaultDateViewFormatMMDDYYY(
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
                        .on("change", function (e, d) {
                          try {
                            payload["_priority_set_date"] =
                              clusterNetwork._defaultDateViewFormatSlider.parse(
                                $(d3.event.target).val()
                              );
                          } catch (err) { }
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
                        return d3.select(this).style("display") != "none";
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
                        self.handle_inline_confirm(
                          d3.select(this),
                          del_form_generator,
                          "Are you sure you wish to permanently delete this node from the cluster of interest?",
                          function (d) {
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
        self.priority_set_inject_node_attibutes(
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
      self.priority_set_editor = null;
      self.redraw_tables();
    },
  });
};

module.exports = {
  init,
  open_priority_set_editor
};