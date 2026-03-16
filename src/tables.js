const d3 = require("d3");
const _ = require("underscore");
const $ = require("jquery");
const misc = require("./misc.js");
const timeDateUtil = require("./timeDateUtil.js");
const nodesTab = require("./nodesTab.js");

const _networkNodeIDField = "id";
const _networkNewNodeMarker = "*";

/**
 * Checks a network option.
 * @param {Object} options - Network options.
 * @param {string} key - Option key.
 * @param {*} defaultValue - Default value if option is missing.
 * @param {boolean} [as_is] - If true, returns value as is.
 * @returns {*} The option value or default.
 */
function check_network_option(options, key, defaultValue, as_is) {
  if (options && key in options) {
    return options[key];
  }
  return defaultValue;
}

/**
 * Adds a sortable table to a container.
 * @param {HTMLElement} container - The container element.
 * @param {Array} headers - Table headers.
 * @param {Array} rows - Table rows.
 * @param {boolean} [is_sortable] - If true, table is sortable.
 * @param {string} [table_caption] - Table caption.
 * @param {Object} [priority_set_editor] - Priority set editor.
 * @param {number} [ND] - Total number of nodes.
 * @returns {void}
 */
function add_a_sortable_table(
  container,
  headers,
  rows,
  is_sortable,
  table_caption,
  priority_set_editor,
  ND
) {
  try {
    let element = container;
    if (container && typeof container.node === "function") {
      element = container.node();
    }
    const $container = $(element);

    if (table_caption) {
      if ($container.find("caption").length === 0) {
        $container.prepend(`<caption>${table_caption}</caption>`);
      } else {
        $container.find("caption").html(table_caption);
      }
    }

    const $thead = $container.find("thead");
    const $tbody = $container.find("tbody");

    $thead.empty();
    $tbody.empty();

    if ($thead.length === 0) {
      $container.append("<thead></thead>");
    }
    if ($tbody.length === 0) {
      $container.append("<tbody></tbody>");
    }

    const thead = d3.select(element).select("thead");
    const tbody = d3.select(element).select("tbody");

    // D3 v3 compatible join for headers
    const header_rows = thead.selectAll("tr").data(headers);
    header_rows.enter().append("tr");
    
    thead.selectAll("tr").each(function(row_data) {
        const row_selection = d3.select(this);
        const header_cells = row_selection.selectAll("th").data(row_data);
        header_cells.enter().append("th");
        
        row_selection.selectAll("th").each(function (d, i) {
          format_a_cell(d, i, this, priority_set_editor);
        });
    });

    // D3 v3 compatible join for rows
    const table_rows = tbody.selectAll("tr").data(rows);
    table_rows.enter().append("tr");
    
    tbody.selectAll("tr").each(function (d) {
      const row_selection = d3.select(this);
      const cells = row_selection.selectAll("td").data(d);
      cells.enter().append("td");
      
      row_selection.selectAll("td").each(function (cd, ci) {
        format_a_cell(cd, ci, this, priority_set_editor);
      });
    });

    let presort_column = null;
    thead.selectAll("tr").each(function (row_data) {
      row_data.forEach((d, i) => {
        if (d.presort) {
          presort_column = { index: i, data: d };
        }
      });
    });

    if (presort_column) {
      sort_table_by_column(
        $(element).find("thead th").get(presort_column.index),
        presort_column.data,
        true
      );
    }

    if (ND) {
      $container
        .find(misc.get_ui_element_selector_by_role("table-count-total"))
        .text(ND);
      $container
        .find(misc.get_ui_element_selector_by_role("table-count-shown"))
        .text(rows.length);
      if (rows.length < ND) {
        $container
          .find(misc.get_ui_element_selector_by_role("table-count-warning"))
          .text(
            "(Only the first " +
              rows.length +
              " nodes are shown. Use search to find specific nodes.)"
          );
      }
    }
  } catch (e) {
    console.error("Error in add_a_sortable_table", e);
  }
}

function table_get_cell_value(data) {
  if (!data) return "";
  return _.isFunction(data.value) ? data.value() : data.value;
}

/**
 * Formats a cell in a table using D3.
 * @param {Object} data - Cell data object.
 * @param {number} index - Column index.
 * @param {HTMLElement} item - Table cell element.
 * @param {Object} [priority_set_editor] - Priority set editor.
 * @returns {void}
 */
function format_a_cell(data, index, item, priority_set_editor) {
  const this_sel = d3.select(item);
  this_sel.selectAll("*").remove();
  this_sel.text("");
  this_sel.datum(data);
  this_sel.attr("data-column-id", index);

  const current_value = table_get_cell_value(data);

  if (data) {
    if (data.hidden) {
      this_sel.style("display", "none");
    }
    if (data.width) {
      this_sel.style("width", String(data.width) + "px");
    }
    if (data.text_wrap) {
      this_sel.style("overflow", "hidden")
              .style("white-space", "nowrap")
              .style("text-overflow", "ellipsis");
    }
    if (data.classed) {
      _.each(data.classed, (v, k) => {
        this_sel.classed(k, !!v);
      });
    }
    if (data.style) {
      _.each(data.style, (v, k) => {
        this_sel.style(k, v);
      });
    }
  }

  let handle_sort = this_sel;

  if (data && "callback" in data) {
    const callback_result = data.callback(item, current_value);
    if (callback_result) {
      const callback_node = callback_result.node
        ? callback_result.node()
        : callback_result instanceof $
        ? callback_result[0]
        : callback_result;

      if (callback_node !== item && !item.contains(callback_node)) {
        item.appendChild(callback_node);
      }
      // If callback result is a selection/element, handle_sort should point to it or its D3 selection
      handle_sort = d3.select(callback_node);
    }
  } else if (data) {
    var repr = "format" in data ? data.format(current_value) : current_value;
    if ("html" in data && data.html) this_sel.html(repr);
    else this_sel.text(repr);
  }

  if (data && "filter" in data) {
    data.filter_term = "";
    data.column_id = index;

    if (data.value === _networkNodeIDField) {
      if (priority_set_editor) {
        const add_to_ps = handle_sort.append("a").attr("href", "#");

        add_to_ps.append("i")
          .attr("class", "fa-solid fa-square-plus fa-lg")
          .style("margin-left", "0.2em");
          
        add_to_ps.attr("title", "Add currently visible nodes to the Cluster of Interest");

        $(add_to_ps.node()).on("click", (e) => {
          e.preventDefault();
          let node_ids = [];
          const node_table_raw = nodesTab.getNodeTable();
          const $node_table = $(
            node_table_raw.node ? node_table_raw.node() : node_table_raw
          );
          $node_table.find("tr").each(function () {
            const $row = $(this);
            if ($row.css("display") !== "none") {
              $row.find("td").each(function (j) {
                if (j === data.column_id) {
                  const cell_data = d3.select(this).datum();
                  if (cell_data) {
                    const val = table_get_cell_value(cell_data);
                    let marker_index = val.indexOf(_networkNewNodeMarker);
                    if (marker_index > 0) {
                      node_ids.push(val.substring(0, marker_index));
                    } else {
                      node_ids.push(val);
                    }
                  }
                }
              });
            }
          });
          priority_set_editor.append_nodes(node_ids);
        });
      }
    }

    if (data["filter"]) {
      const clicker = handle_sort.append("a").attr("href", "#");

      clicker.append("i")
        .attr("class", "fa-solid fa-magnifying-glass")
        .style("margin-left", "0.2em");

      const search_form_generator = function () {
        return `<form class="form-inline" data-hivtrace-ui-role = "table-filter-form"> 
                            <div class="form-group"> 
                                <div class="input-group">
                                <input type="text" class="form-control input-sm" data-hivtrace-ui-role = "table-filter-term" placeholder="Filter On" style = "min-width: 100px">
                                <div class="input-group-addon"><a data-hivtrace-ui-role = "table-filter-reset"><i class="fa-solid fa-circle-xmark"></i></a> </div>
                                <div class="input-group-addon"><a data-hivtrace-ui-role = "table-filter-apply"><i class="fa-solid fa-filter"></i></a> </div> 
                                <div class="input-group-text">
                                    <i class="fa-solid fa-circle-question" data-bs-toggle="collapse" data-bs-target="#filter-help-column${index}"  aria-expanded="false" aria-controls="collapseExample"></i>
                                </div> 
                            </div>
                            </div>
                        </form>
                        <div class="collapse" id="filter-help-column${index}">
                          <div class="card card-body">
                            Type in text to select columns which 
                            <em>contain the term</em>. <br />
                            For example, typing in <code>MSM</code> will select rows
                            that have "MSM" as a part of the column value.
                            <p />
                            Type in space separated terms (<code>MSM IDU</code>) to
                            search for <b>either</b> term. <p/>
                            Type in terms in quotes (<code>"male"</code>) to search
                            for this <b>exact</b> term. <p/>
                            If columns have date information you can use
                            <code>YYYYMMDD:YYYYMMDD</code> to search for date ranges.<p/>
                            Use <code>&lt;value</code> or <code>&gt;value</code>
                            to search numerical columns<p/>
                          </div>
                        </div>
                        `;
      };

      new bootstrap.Popover(clicker.node(), {
        html: true,
        sanitize: false,
        content: search_form_generator,
        placement: "bottom",
        trigger: "click",
      });

      $(clicker.node()).on("shown.bs.popover", function () {
        const $search_icon = $(this);

        const update_term = function (v) {
          data.filter_term = v;
          $search_icon
            .find("i")
            .toggleClass("fa-magnifying-glass", !v.length)
            .toggleClass("fa-magnifying-glass-plus", !!v.length);
        };

        const $popover_div = $("#" + $search_icon.attr("aria-describedby"));
        const $search_click = $popover_div.find(
          misc.get_ui_element_selector_by_role("table-filter-apply")
        );
        const $reset_click = $popover_div.find(
          misc.get_ui_element_selector_by_role("table-filter-reset")
        );
        const $search_box = $popover_div.find(
          misc.get_ui_element_selector_by_role("table-filter-term")
        );

        $search_box.val(data.filter_term);

        $search_box.on("keydown", function (event) {
          if (event.key == "Enter") {
            update_term($search_box.val());
            filter_table(clicker.node(), event);
            event.preventDefault();
          }
        });

        $search_click.on("click", (e) => {
          e.preventDefault();
          update_term($search_box.val());
          filter_table(clicker.node(), e);
        });

        $reset_click.on("click", (e) => {
          e.preventDefault();
          $search_box.val("");
          update_term("");
          filter_table(clicker.node(), e);
        });
      });
    }
  }

  if (handle_sort && data && "sort" in data) {
    const clicker = handle_sort.append("a").attr("href", "#");

    $(clicker.node()).on("click", function (e) {
      e.preventDefault();
      sort_table_by_column(this, data);
    });
    clicker.attr("data-sorted", "unsorted");
    clicker.attr("data-column-id", index);

    clicker.append("i")
      .attr("class", "fa-solid fa-sort")
      .style("margin-left", "0.2em");

    if ("presort" in data) {
      if (data["presort"] === "desc") {
        clicker.attr("data-sorted", "asc");
      }
      sort_table_by_column(clicker.node(), data);
    }
  }

  if (data && "actions" in data) {
    let by_group = data.actions;
    if (_.isFunction(by_group)) {
      by_group = [by_group];
    }

    if (by_group && by_group.length) {
      for (let g = 0; g < by_group.length; g++) {
        const bgrp = by_group[g];
        const is_group_by_definition = _.isArray(bgrp);

        const button_group = handle_sort.append("div")
          .attr("class", "btn-group btn-group-sm d-inline-flex align-items-center flex-nowrap")
          .style("padding-left", "0.25em");

        button_group.node().node = function () {
          return this;
        };

        let buttons = _.isFunction(bgrp)
          ? bgrp($(button_group.node()), current_value)
          : bgrp;

        if (buttons && !_.isArray(buttons)) {
          buttons = [buttons];
        }

        if (buttons && _.isArray(buttons)) {
          if (buttons.length > 1 || is_group_by_definition) {
            button_group.classed("float-end", true);
          }
          for (let b_idx = 0; b_idx < buttons.length; b_idx++) {
            let b = buttons[b_idx];
            if (_.isFunction(b)) {
              b = b($(button_group.node()), current_value);
            }
            if (b) {
              let this_button;
              if (b.dropdown) {
                const button_group_dropdown = button_group.append("div")
                  .attr("class", "btn-group btn-group-sm");

                this_button = button_group_dropdown.append("button")
                  .attr("class", "btn btn-outline-secondary btn-table-xs dropdown-toggle")
                  .attr("data-bs-toggle", "dropdown")
                  .attr("data-bs-popper-config", '{"strategy":"fixed"}');

                this_button.node().node = function () {
                  return this;
                };

                const dropdown_list = button_group_dropdown.append("ul")
                  .attr("class", "dropdown-menu");

                let items = b.dropdown;

                function get_item_text(item) {
                  if (item && _.has(item, "label")) {
                    return item["label"];
                  }
                  return item;
                }

                if (items && items.length) {
                  for (let i_idx = 0; i_idx < items.length; i_idx++) {
                    const item_data = items[i_idx];
                    const li = dropdown_list.append("li");
                    
                    const handle_change = li.append("a")
                      .attr("class", "dropdown-item")
                      .attr("href", "#")
                      .text(get_item_text(item_data));

                    if (
                      item_data &&
                      _.has(item_data, "data") &&
                      item_data["data"]
                    ) {
                      _.each(item_data.data, (v, k) => {
                        handle_change.attr("data-" + k, v);
                      });
                    }

                    $(handle_change.node()).on("click", (e) => {
                      if (
                        item_data &&
                        ((_.has(item_data, "action") && item_data["action"]) ||
                          b.action)
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (_.has(item_data, "action") && item_data["action"]) {
                          item_data["action"](this_button, item_data["label"]);
                        } else if (b.action) {
                          b.action(this_button, get_item_text(item_data));
                        }
                      }
                    });
                  }
                }
              } else {
                this_button = button_group.append("button")
                  .attr("class", "btn btn-outline-secondary btn-table-xs");

                if (b.action) {
                  $(this_button.node()).on("click", (e) => {
                    e.preventDefault();
                    b.action(this_button, current_value);
                  });
                }
              }

              if (b.icon) {
                const icon_class = b.icon.startsWith("fa-") ? "fa-solid " + b.icon : b.icon;
                this_button.append("i").attr("class", icon_class);
              } else {
                this_button.text(b.text).style("font-size", "12px");
              }

              if (b.data) {
                _.each(b.data, (v, k) => {
                  this_button.attr("data-" + k, v);
                });
              }

              if (b.classed) {
                _.each(b.classed, (v, k) => {
                  this_button.classed(k, !!v);
                });
              }

              if (b.help) {
                this_button.attr("title", b.help);
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Filters a table based on a search event.
 * @param {HTMLElement} element - The search icon element.
 * @param {Event} event - The search event.
 * @returns {void}
 */
function filter_table(element, event) {
  const $search_icon = $(element);
  const table_id = "#" + $(element).closest("table").attr("id");
  const column_id = $search_icon.parent().attr("data-column-id");
  const $table = $(table_id);

  $table.trigger("hivtrace.filter", [column_id]);
}

/**
 * Sorts a table by a specific column.
 * @param {HTMLElement} element - The sort icon element.
 * @param {Object} data - Column data.
 * @returns {void}
 */
function sort_table_by_column(element, data, is_presort) {
  const $sort_icon = $(element);
  let column_id = parseInt($sort_icon.attr("data-column-id"));
  if (isNaN(column_id)) {
      column_id = parseInt($sort_icon.closest("th, td").attr("data-column-id"));
  }
  if (isNaN(column_id)) {
      column_id = parseInt($sort_icon.find("[data-column-id]").first().attr("data-column-id"));
  }

  if (isNaN(column_id)) {
      console.warn("Could not find column-id for sort", element);
      return;
  }

  const table = $sort_icon.closest("table")[0];
  const tbody = table.querySelector("tbody");
  
  let current_state = $sort_icon.attr("data-sorted");
  let next_state;
  
  if (is_presort) {
      next_state = data.presort;
  } else {
      next_state = current_state === "asc" ? "desc" : "asc";
  }

  // Reset other headers
  $(table).find("thead [data-sorted]").attr("data-sorted", "unsorted");
  $sort_icon.attr("data-sorted", next_state);
  sort_table_toggle_icon($sort_icon, next_state);

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const sort_key = data.sort;
  
  let sort_accessor;
  if (_.isFunction(sort_key)) {
    sort_accessor = (row) => {
        const cell = row.cells[column_id];
        if (!cell) return null;
        const cell_data = d3.select(cell).datum();
        return sort_key(cell_data);
    };
  } else {
    sort_accessor = (row) => {
        const cell = row.cells[column_id];
        if (!cell) return null;
        const cell_data = d3.select(cell).datum();
        return table_get_cell_value(cell_data);
    };
  }

  rows.sort((a, b) => {
      const va = sort_accessor(a);
      const vb = sort_accessor(b);
      
      if (column_id === 4) {
          // console.log(`Comparing col 4 (Size): va=${va}, vb=${vb}, a_name="${a.cells[1].innerText}", b_name="${b.cells[1].innerText}"`);
      }

      if (va === vb) return 0;
      
      const multiplier = next_state === "asc" ? 1 : -1;
      
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;

      if (va < vb) return -1 * multiplier;
      if (va > vb) return 1 * multiplier;
      return 0;
  });
  
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  rows.forEach(row => tbody.appendChild(row));

  $(table).trigger("hivtrace.sort", [column_id, next_state]);
}

/**
 * Toggles the sort icon based on the sort state.
 * @param {jQuery} $icon_parent - The jQuery object for the icon parent.
 * @param {string} state - The sort state ("asc", "desc", or "unsorted").
 * @returns {void}
 */
function sort_table_toggle_icon($icon_parent, state) {
  $icon_parent.find("i").removeClass("fa-sort fa-sort-asc fa-sort-desc fa-solid fa-sort-up fa-sort-down");

  if (state === "asc") {
    $icon_parent.find("i").addClass("fa-solid fa-sort-up");
  } else if (state === "desc") {
    $icon_parent.find("i").addClass("fa-solid fa-sort-down");
  } else {
    $icon_parent.find("i").addClass("fa-solid fa-sort");
  }
}

/**
 * Parses a filter string into a function.
 * @param {string} filter_str - The filter string.
 * @returns {Function} A function that takes a value and returns true if it matches.
 */
function filter_parse(filter_str) {
  if (!filter_str || filter_str.length === 0) {
    return (d) => true;
  }

  const terms = filter_str.split(/\s+/);
  const funcs = terms.map((term) => {
    if (term.startsWith(">")) {
      const val = parseFloat(term.substring(1));
      return (d) => parseFloat(d) > val;
    }
    if (term.startsWith("<")) {
      const val = parseFloat(term.substring(1));
      return (d) => parseFloat(d) < val;
    }
    if (term.includes(":")) {
      const parts = term.split(":");
      return (d) => d >= parts[0] && d <= parts[1];
    }
    const lower_term = term.toLowerCase();
    return (d) => (d + "").toLowerCase().includes(lower_term);
  });

  return (d) => funcs.some((f) => f(d));
}

function table_sort_comparator(state) {
  if (state === "unsorted") {
    return null;
  }
  return state === "asc" ? d3.ascending : d3.descending;
}

module.exports = {
  _networkNodeIDField,
  _networkNewNodeMarker,
  add_a_sortable_table,
  format_a_cell,
  sort_table_by_column,
  sort_table_toggle_icon,
  filter_parse,
};
