import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

/**
 * @function node_table_draw_buttons
 * @description Draws buttons for node table rows, including hide/show and view cluster.
 * @param {HTMLElement} element - The HTML element for the table cell.
 * @param {Array} payload - The data payload for the cell, containing node information.
 * @param {Object} self - The network object.
 * @param {Object} nodesTab - The nodes tab module.
 * @returns {void}
 */
export function node_table_draw_buttons(element, payload, self, nodesTab) {
  var this_cell = d3.select(element);
  let labels;
  if (payload.length === 1) {
    if (_.isString(payload[0])) {
      labels = [[payload[0], 1, "btn-warning"]];
    } else {
      labels = ["can't be shown", 1];
    }
  } else {
    labels = [[payload[0] ? "hide" : "show", 0]];
  }

  if (payload.length === 2 && payload[1] >= 1) {
    labels.push([
      "view cluster",
      function () {
        self.open_exclusive_tab_view(payload[1]);
      },
    ]);
  }

  var buttons = this_cell.selectAll("button").data(labels);
  buttons.enter().append("button");
  buttons.exit().remove();
  buttons
    .classed("btn btn-table-xs btn-node-property float-end", true)
    .classed("btn-primary", true)
    .style("margin-left", "0.25em")
    .text((d) => d[0])
    .attr("disabled", (d) => (d[1] && !_.isFunction(d[1]) ? "disabled" : null))
    .on("click", (d) => {
      if (_.isFunction(d[1])) {
        d[1].call(d);
      } else if (d[1] === 0) {
        if (payload[0]) {
          self.collapse_cluster(self.clusters[payload[3] - 1], true);
        } else {
          self.expand_cluster(self.clusters[payload[3] - 1]);
        }
        self.update_volatile_elements(nodesTab.getNodeTable());
      }
    });
  buttons.each(function (d, e) {
    if (d.length >= 3) {
      d3.select(this).classed("btn-primary", false).classed(d[2], true);
    }
  });
  return this_cell;
}

/**
 * @function update_volatile_elements
 * @description Updates volatile elements in a table container.
 * @param {d3.selection} container - The D3 selection of the table container.
 * @param {boolean} suppress_editor - If true, suppresses the priority set editor.
 * @param {Object} clustersOfInterest - The COI module.
 * @param {Object} tables - The tables module.
 * @returns {void}
 */
export function update_volatile_elements(
  container,
  suppress_editor,
  clustersOfInterest,
  tables
) {
  if (!container) return;
  if (typeof container.selectAll !== "function") {
    container = d3.select(container.node ? container.node() : container);
  }

  const coe = !suppress_editor ? clustersOfInterest.get_editor() : null;

  container
    .selectAll("td, th")
    .filter((d) => "volatile" in d)
    .each(function (d, i) {
      tables.format_a_cell(d, i, this, coe);
    });
}

/**
 * @function redraw_tables
 * @description Redraws all network tables.
 * @param {Object} self - The network object.
 * @param {Object} nodesTab - The nodes tab module.
 * @param {Object} kGlobals - Global constants.
 * @returns {void}
 */
export function redraw_tables(self, nodesTab, kGlobals) {
  self.update_volatile_elements(self.cluster_table);
  if (self.subcluster_table) {
    self.update_volatile_elements(self.subcluster_table);
  }
  const nt = nodesTab.getNodeTable();
  self.update_volatile_elements(
    nt,
    nt.node_table_N > nt.node_table_DN || nt.node_table_DN > kGlobals.CoIAddLimit
  );
  if (self.priority_set_table) {
    self.update_volatile_elements(self.priority_set_table);
  }
}

/**
 * @function draw_node_table
 * @description Draws a table of nodes.
 * @param {Array} extra_columns - Extra columns to add to the table.
 * @param {Array} node_list - The list of nodes to display.
 * @param {Array} headers - Table headers.
 * @param {Array} rows - Table rows.
 * @param {HTMLElement} container - The container element for the table.
 * @param {string} table_caption - Table caption.
 * @param {number} ND - Total number of nodes.
 * @param {Object} self - The network object.
 * @param {Object} nodesTab - The nodes tab module.
 * @param {Object} clustersOfInterest - The COI module.
 * @param {Object} tables - The tables module.
 * @returns {void}
 */
export function draw_node_table(
  extra_columns,
  node_list,
  headers,
  rows,
  container,
  table_caption,
  ND,
  self,
  nodesTab,
  clustersOfInterest,
  tables
) {
  container = container || nodesTab.getNodeTable();

  if (container) {
    node_list = node_list || self.nodes;

    ND = ND || node_list.length;

    if (!headers) {
      headers = [
        [
          {
            value: "ID",
            sort: "value",
            help: "Node ID",
          },
          {
            value: "Action",
            sort: "value",
          },
          {
            value: "# of links",
            sort: "value",
            help: "Number of links (Node degree)",
          },
          {
            value: "Cluster",
            sort: "value",
            help: "Which cluster does the node belong to",
          },
        ],
      ];

      if (extra_columns) {
        _.each(extra_columns, (d) => {
          if (d.prepend) {
            headers[0].splice(0, 0, d.description);
          } else {
            headers[0].push(d.description);
          }
        });
      }

      rows = node_list.map((n, i) => {
        var this_row = [
          {
            value: n.id,
            help: "Node ID",
          },
          {
            value: function () {
              if (n.node_class !== "injected") {
                try {
                  if (self.exclude_cluster_ids[n.cluster]) {
                    return [n.cluster];
                  }
                  return [
                    !self.clusters[self.cluster_mapping[n.cluster]].collapsed,
                    n.cluster,
                  ];
                } catch (err) {
                  return [-1];
                }
              } else {
                return [n.node_annotation];
              }
            },
            callback: self._node_table_draw_buttons,
            volatile: true,
          },
          {
            value: "degree" in n ? n.degree : "Not defined",
            help: "Node degree",
          },
          {
            value: "cluster" in n ? n.cluster : "Not defined",
            help: "Which cluster does the node belong to",
          },
        ];

        if (extra_columns) {
          _.each(extra_columns, (ed) => {
            if (ed.prepend) {
              this_row.splice(0, 0, ed.generator(n, self));
            } else {
              this_row.push(ed.generator(n, self));
            }
          });
        }
        return this_row;
      });
    }

    let element = container;
    if (container && typeof container.node === "function") {
      element = container.node();
    }
    const $container = $(element);
    $container.attr("class", "table table-striped table-sm table-hover caption-top table-smaller");

    tables.add_a_sortable_table(
      container,
      headers,
      rows,
      true,
      table_caption,
      clustersOfInterest.get_editor(),
      ND
    );
  }
}

/**
 * @function draw_extended_node_table
 * @description Draws an extended node table with selectable columns.
 * @param {Array} node_list - The list of nodes to display.
 * @param {HTMLElement} container - The container element for the table.
 * @param {Array} extra_columns - Extra columns to add to the table.
 * @param {Object} options - Table options.
 * @param {Object} self - The network object.
 * @param {Object} nodesTab - The nodes tab module.
 * @param {Object} clustersOfInterest - The COI module.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} tables - The tables module.
 * @param {Object} timeDateUtil - Time/date utility module.
 * @param {Object} jsConvert - js-convert-case module.
 * @returns {void}
 */
export function draw_extended_node_table(
  node_list,
  container,
  extra_columns,
  options,
  self,
  nodesTab,
  clustersOfInterest,
  kGlobals,
  tables,
  timeDateUtil,
  jsConvert
) {
  container = container || nodesTab.getNodeTable();
  options = options || {};

  if (container) {
    node_list = node_list || self.aggregate_indvidual_level_records();

    const N = node_list.length;

    if (node_list.length > self.max_nodes_to_show) {
      node_list = node_list.slice(0, self.max_nodes_to_show);
    }

    container.node_table_N = N;
    container.node_table_DN = node_list.length;

    var column_ids = self._extract_exportable_attributes(true);

    self.displayed_node_subset = _.filter(
      _.map(self.displayed_node_subset, (n, i) => {
        if (_.isString(n)) {
          n = _.find(column_ids, (cd) => cd.raw_attribute_key === n);

          if (n) {
            return n;
          }
          return column_ids[i];
        }
        return n;
      }),
      (c) => c
    );

    var node_data = self._extract_attributes_for_nodes(
      node_list,
      self.displayed_node_subset
    );
    node_data.splice(0, 1);

    var table_headers = _.map(self.displayed_node_subset, (n, col_id) => ({
      value: n.raw_attribute_key,
      sort: "value",
      filter: options && options["no-filter"] ? false : true,
      volatile: true,
      help: "label" in n ? n.label : n.raw_attribute_key,
      callback: function (element, payload) {
        var dropdown = d3.select(element).append("div").classed("dropdown", true);
        var menu_id = "hivtrace_node_column_" + payload + "_" + col_id;
        var dropdown_button = dropdown
          .append("button")
          .attr("class", "btn btn-outline-secondary btn-table-xs dropdown-toggle")
          .attr("type", "button")
          .attr("data-bs-toggle", "dropdown")
          .attr("data-bs-popper-config", '{"strategy":"fixed"}')
          .attr("aria-haspopup", "true")
          .attr("aria-expanded", "false")
          .attr("id", menu_id);

        function format_key(key) {
          const formattedKey = jsConvert.toHeaderCase(key);
          const words = formattedKey.split(" ");
          const mappedWords = _.map(words, (word) => {
            if (word.toLowerCase() === "hivtrace") {
              return "HIV-TRACE";
            }
            if (word.toLowerCase() === "id") {
              return "ID";
            }

            return word;
          });
          return mappedWords.join(" ");
        }

        function get_text_label(key) {
          return key in self.json.patient_attribute_schema
            ? self.json.patient_attribute_schema[key].label
            : format_key(key);
        }

        dropdown_button.text(get_text_label(payload));

        //dropdown_button.append("i").attr("class", "fa-solid fa-caret-down ms-1");

        var dropdown_list = dropdown
          .append("ul")
          .classed("dropdown-menu", true)
          .attr("aria-labelledby", menu_id);

        var menu_items = _.filter(
          column_ids,
          (alt) => alt.raw_attribute_key !== n.raw_attribute_key
        );

        dropdown_list
          .selectAll("li")
          .data(menu_items)
          .enter()
          .append("li")
          .append("a")
          .classed("dropdown-item", true)
          .attr("href", "#")
          .text((data) => get_text_label(data.raw_attribute_key))
          .on("click", (d) => {
            if (d3.event) d3.event.preventDefault();
            self.displayed_node_subset[col_id] = d;
            self.draw_extended_node_table(
              node_list,
              container,
              extra_columns,
              options
            );
          });

        return dropdown;
      },
    }));

    if (extra_columns) {
      _.each(extra_columns, (d) => {
        if (d.prepend) {
          table_headers.splice(0, 0, d.description);
        } else {
          table_headers.push(d.description);
        }
      });
    }

    var table_rows = node_data.map((n, i) => {
      var this_row = _.map(n, (cell, c) => {
        let cell_definition = null;

        if (self.displayed_node_subset[c].type === "Date") {
          cell_definition = {
            value: cell,
            format: function (v) {
              if (v === kGlobals.missing.label) {
                return v;
              }
              return timeDateUtil.DateViewFormatSlider(v);
            },
          };
        } else if (self.displayed_node_subset[c].type === "Number") {
          cell_definition = { value: cell, format: d3.format(".2f") };
        }
        if (!cell_definition) {
          cell_definition = {
            value: cell,
          };
        }

        return cell_definition;
      });

      if (extra_columns) {
        _.each(extra_columns, (ed) => {
          if (ed.prepend) {
            this_row.splice(0, 0, ed.generator(node_list[i], self));
          } else {
            this_row.push(ed.generator(node_list[i], self));
          }
        });
      }

      return this_row;
    });

    self.draw_node_table(
      null,
      node_list,
      [table_headers],
      table_rows,
      container,
      'Showing <span class="badge bg-secondary" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge bg-secondary" data-hivtrace-ui-role="table-count-total">--</span> network entities <span class="badge bg-warning text-dark" data-hivtrace-ui-role="table-count-warning"></span>',
      N
    );
  }
}
