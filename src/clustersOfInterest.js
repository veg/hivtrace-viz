import * as d3 from "d3";
import _ from "underscore";
import $ from "jquery";
import * as timeDateUtil from "./timeDateUtil.js";
import * as tables from "./tables.js";
import * as helpers from "./helpers.js";
import * as misc from "./misc.js";
import { hivtrace_cluster_depthwise_traversal } from "./misc";
import * as kGlobals from "./globals.js";
import * as EditorUI from "./networkPriorityEditorUI.js";

let priority_set_editor = null;

/**
 * Initializes the component, setting up event listeners and UI elements.

 * @param {Object} self - The component object itself.

 * @returns {void}
 */

function init(self) {
  if (self._is_CDC_ && self.is_primary_graph) {
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
        bootstrap.Modal.getOrCreateInstance(
          $(misc.get_ui_element_selector_by_role("priority_set_merge")).get(0)
        ).show();
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
  const tab = document.querySelector("#priority-set-tab");
  if (tab) {
    bootstrap.Tab.getOrCreateInstance(tab).show();
  }
  const context = {
    kGlobals,
    timeDateUtil,
    misc,
    helpers,
    priority_groups_check_name,
    priority_groups_add_set,
    priority_set_inject_node_attibutes,
    draw_priority_set_table,
    get_editor: () => priority_set_editor,
    set_priority_set_editor: (editor) => {
      priority_set_editor = editor;
    },
    redraw_tables: () => self.redraw_tables(),
    open_editor,
    priority_set_view,
  };

  return EditorUI.open_editor(
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
  );
}

function handle_inline_confirm(this_button, generator, text, action, disabled) {
  const context = {
    misc,
  };
  return EditorUI.handle_inline_confirm(
    this_button,
    generator,
    text,
    action,
    disabled,
    context
  );
}

function _action_drop_down(self, pg) {
  const context = {
    kGlobals,
    priority_set_inject_node_attibutes,
    open_editor,
    redraw_tables: () => self.redraw_tables(),
    priority_set_view,
    misc,
    timeDateUtil,
  };
  return EditorUI._action_drop_down(self, pg, context);
}

/**
 * Draws a table of priority sets (clusters of interest for regular site views, MJ ClusterOI for MJC views). 
 * For the case of MJ ClusterOI, we assume that self.defined_priority_groups is the MJ ClusterOI and self.own_defined_priority_groups is the jurisdiction's ClusterOI.

 * @param {Object} self - The main network visualization object.
 * @param {HTMLElement} container - The HTML element where the table will be displayed (optional).
 * @param {Array} priority_groups - An array of objects representing the priority sets (optional).
*/

function draw_priority_set_table(self, container, priority_groups) {
  container = container || self.priority_set_table;
  if (container) {
    priority_groups = priority_groups || self.defined_priority_groups;
    self.priority_groups_compute_node_membership();
    if (self.isMJCNetwork) {
      // When computing overlap for MJ ClusterOI views, we need to compare the MJ ClusterOI (self.defined_priority_groups) against the jurisdiction's ClusterOI (self.own_defined_priority_groups)
      self.priority_groups_compute_overlap_mjc(
        self.defined_priority_groups,
        self.own_defined_priority_groups
      );
    } else {
      self.priority_groups_compute_overlap(priority_groups);
    }
    var headers = [
      [
        {
          value: "Type",
          sort: function (c) {
            return c.value;
          },
          help: "How was this cluster of interest created",
          width: 50,
          hidden: self.isMJCNetwork,
        },
        {
          value: "Name",
          sort: "value",
          filter: true,
          width: 325,
          text_wrap: true,
          help: "Cluster of interest name",
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcClusterIdEnabled === false,
        },
        {
          value: "Modified/created",
          width: 180,
          sort: function (c) {
            return c.value[0];
          },
          help: "When was the cluster of interest created/last modified",
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcModifiedDateEnabled === false,
        },
        {
          value: "Growth",
          sort: "value",
          help: "How growth is handled",
          width: 100,
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcGrowthCriteriaEnabled === false,
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
          hidden:
            self.isMJCNetwork &&
            self.MJCVariables.mjcCurrentSizeEnabled === false,
        },
        {
          value: "Size (mine)",
          width: 100,
          sort: "value",
          help: "Number of nodes from your jurisdiction in this cluster",
          hidden: (function () {
            console.log(
              "Size (mine) column - isMJCNetwork:",
              self.isMJCNetwork,
              "hidden:",
              !self.isMJCNetwork
            );
            return !self.isMJCNetwork;
          })(),
        },
        {
          value: "Priority",
          width: 60,
          sort: "value",
          help: "Does the cluster of interest continue to meet priority criteria?",
          hidden:
            self.isMJCNetwork &&
            self.MJCVariables.mjcCurrentPriorityEnabled === false,
        },
        {
          value: "DXs in last 12 mo.",
          width: 100,
          sort: "value",
          help: "The number of cases in the cluster of interest diagnosed in the past 12 months",
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcDiagnosesLast12MonthsEnabled === false,
        },
        {
          value: self.isMJCNetwork ? "My ClusterOI Overlap Count" : "Overlap",
          width: 140,
          sort: function (c) {
            c = c.value;
            if (c) {
              return c[1];
            }
            return 0;
          },
          help: self.isMJCNetwork
            ? "How many of my jurisdiction's ClusterOI have overlapping nodes with this MJ ClusterOI?"
            : "How many other ClusterOI have overlapping nodes with this ClusterOI, and (if overlapping ClusterOI exist) how many nodes in this ClusterOI overlap with ANY other ClusterOI?",
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
        value: `${
          self.isMJCNetwork ? "MJ " : ""
        }clusterOI identification method`,
        width: 100,
        sort: function (c) {
          return c.value;
        },
        help: "Method of cluster identification",
        // hidden: self.isMJCNetwork && self.MJCVariables.mjcIdMethodEnabled === false,
      });
    }

    var edit_form_generator = function () {
      return `<form class="form">
                      <div class="form-group mb-2">
                          <div class="input-group">
                          <textarea class="form-control form-control-sm" data-hivtrace-ui-role = "priority-description-form" cols = "40" rows = "3"></textarea>
                          </div>
                      </div>
                      <button data-hivtrace-ui-role = "priority-description-dismiss" class = "btn btn-table-xs btn-outline-secondary">Dismiss</button>
                      <button data-hivtrace-ui-role = "priority-description-save" class = "btn btn-table-xs btn-primary">Save</button>
                  </form>`;
    };
    var rows = [];
    _.each(priority_groups, (pg) => {
      // Ensure overlap object exists with default values
      if (!pg.overlap) {
        pg.overlap = { sets: 0, nodes: 0, duplicate: [], superset: [] };
      }
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
          hidden: self.isMJCNetwork,
        },
        {
          // name
          value: self.cleanRedacted(pg.name),
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
                  ? '<span class="badge bg-secondary">Grew</span>'
                  : '<span class="badge bg-danger">New</span>') +
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
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcClusterIdEnabled === false,
        },
        {
          // modification / creation date
          width: 180,
          value: [pg.modified, pg.created],
          format: function (value) {
            let vs = _.map(value, (v) =>
              v === "REDACTED" ? v : timeDateUtil.DateViewFormat(v)
            );

            if (vs[0] !== vs[1]) {
              return vs[0] + " / " + vs[1];
            }
            return vs[0];
          },
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcModifiedDateEnabled === false,
        },
        {
          // tracking mode
          width: 100,
          //text_wrap: true,
          value: pg.tracking,
          format: function (value) {
            if (value === "REDACTED") {
              return "REDACTED";
            }
            return kGlobals.CDCCOIConciseTrackingOptions[value];
          },
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcGrowthCriteriaEnabled === false,
        },
        {
          // size / new nodes
          // For MJC networks, use pg.nodes.length since node_objects only contains local nodes
          value: [
            self.isMJCNetwork
              ? pg.nodes.length
              : self.unique_entity_list(pg.node_objects).length,
            _.chain(pg.nodes)
              .groupBy((n) => self.entity_id_from_string(n.name))
              .mapObject((v) =>
                _.uniq(_.map(v, (n) => self.priority_groups_is_new_node(n)))
              )
              .filter((v) => v.length == 1 && v[0])
              .size()
              .value(),
            /*self.unique_entity_list_from_ids(
              _.map(
                _.filter(pg.nodes, (g) => self.priority_groups_is_new_node(g)),
                (d) => d.name
              )
            ).length,*/
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
                  ? ' <span title="Number of nodes added by the system since the last network update" class="badge bg-secondary">' +
                    v[1] +
                    " new</span>"
                  : "")
              );
            }
            return "N/A";
          },
          html: true,
          hidden:
            self.isMJCNetwork &&
            self.MJCVariables.mjcCurrentSizeEnabled === false,
        },
        {
          // size in my jurisdiction (MJC only)
          width: 100,
          value: pg.size_in_jurisdiction || 0,
          hidden: !self.isMJCNetwork,
        },
        {
          // meets priority definition
          width: 60,
          value: pg.meets_priority_def ? "Yes" : "No",
          hidden:
            self.isMJCNetwork &&
            self.MJCVariables.mjcCurrentPriorityEnabled === false,
        },
        {
          width: 100,
          // TODO: actually redact the data on the backend
          value:
            self.isMJCNetwork &&
            self.MJCVariables.mjcDiagnosesLast12MonthsEnabled === false
              ? "REDACTED"
              : pg.cluster_dx_recent12_mo,
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcDiagnosesLast12MonthsEnabled === false,
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
                  ? ' <span title="Number of persons in the overlap" class="badge bg-secondary float-end">' +
                    v[1] +
                    " persons</span>"
                  : "") +
                (v[2].length
                  ? ' <span title="clusterOIs which are exact duplicates of this clusterOI: ' +
                    v[2].join(", ") +
                    '" class="label label-danger float-end">' +
                    v[2].length +
                    " duplicate clusterOI</span>"
                  : "") +
                (v[3].length
                  ? ' <span title="clusterOIs which contain this clusterOI: ' +
                    v[3].join(", ") +
                    '" class="label label-warning float-end">Fully contained in ' +
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
                    icon: "fa-solid fa-eye",
                    dropdown: [
                      {
                        label: "List overlaps",
                        data: {
                          "bs-toggle": "modal",
                          "bs-target":
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
          // hidden: self.isMJCNetwork && self.MJCVariables.mjcIdMethodEnabled === false,
        });
      }

      if (pg.pending && !self.isMJCNetwork) {
        // pending user review
        this_row[1].actions = [
          {
            icon: "fa-solid fa-eye",
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
            icon: "fa-solid fa-circle-info",
            classed: { "view-edit-cluster": true },
            help: "View/edit this cluster of interest",
            dropdown: _action_drop_down(self, pg),
          },
          {
            icon: "fa-solid fa-pen-to-square",
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
                icon: "fa-solid fa-plus",
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
      if (pg.not_in_network && pg.not_in_network.length) {
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

    let element = container;
    if (container && typeof container.node === "function") {
      element = container.node();
    }
    const $container = $(element);
    $container.empty();
    $container.attr("id", "priority_set_table");
    $container.attr(
      "class",
      "table table-striped table-sm table-hover caption-top table-smaller"
    );
    $container.show().css("visibility", "visible").css("opacity", 1);

    tables.add_a_sortable_table(
      element,
      headers,
      rows,
      true,
      has_required_actions +
        `Showing <span class="badge bg-secondary" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge bg-secondary" data-hivtrace-ui-role="table-count-total">--</span> ${
          self.isMJCNetwork ? "MJ " : ""
        }clusters of interest.
          <div class="float-end ms-2 d-inline-block">
            <button class="btn btn-outline-secondary btn-table-xs" data-hivtrace-ui-role="priority-subclusters-export">Export to JSON</button>
          </div>
          <div class="float-end d-inline-block">
            <button class="btn btn-primary btn-table-xs" data-hivtrace-ui-role="priority-subclusters-export-csv" title="Export ClusterOI Node List to CSV"><i class="fa fa-download"></i> Export Nodes to CSV</button>
          </div>`,
      get_editor(),
      rows.length
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
    const tab = document.querySelector("#priority-set-tab");
    if (tab) {
      bootstrap.Tab.getOrCreateInstance(tab).show();
    }
    draw_priority_set_table(self);
  }

  return true;
}

function priority_set_view(self, priority_set, options) {
  const context = {
    kGlobals,
    timeDateUtil,
  };
  return EditorUI.priority_set_view(self, priority_set, options, context);
}

function priority_set_inject_node_attibutes(self, nodes, node_attributes) {
  const context = {
    kGlobals,
  };
  return EditorUI.priority_set_inject_node_attibutes(
    self,
    nodes,
    node_attributes,
    context
  );
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
