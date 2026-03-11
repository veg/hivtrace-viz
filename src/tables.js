const d3 = require("d3");
const _ = require("underscore");
const $ = require("jquery");
const misc = require("./misc.js");
const timeDateUtil = require("./timeDateUtil.js");
const nodesTab = require("./nodesTab.js");
const kGlobals = require("./globals.js");

const _networkNodeIDField = "hivtrace_node_id";
const _networkNewNodeMarker = "[+]";

/**
 * Adds a sortable table to a container.
 * @param {HTMLElement|jQuery|Object} container - The container element for the table.
 * @param {string[][]} headers - Array of row arrays representing table headers.
 * @param {Object[][]} content - Array of row arrays representing table content.
 * @param {boolean} [overwrite] - If true, overwrites existing table content.
 * @param {string} [caption] - Table caption.
 * @param {Object} [priority_set_editor] - Optional priority set editor.
 * @param {number} [N] - Total number of rows (if truncated).
 * @returns {void}
 */
function add_a_sortable_table(
  container,
  headers,
  content,
  overwrite,
  caption,
  priority_set_editor,
  N
) {
  let element = container;
  if (container && typeof container.node === "function") {
    element = container.node();
  }
  const $container = $(element);
  if (!$container.length) {
    return;
  }

  const set_table_elements = (d, cell) => {
    const $cell = $(cell);
    if (d.hidden) {
      $cell.hide();
    }
    if (d.width || d.text_wrap) {
      if (d.width) $cell.css("width", `${d.width}px`);
      if (d.text_wrap) {
        $cell.css({
          overflow: "hidden",
          "white-space": "nowrap",
          "text-overflow": "ellipsis",
        });
      }
    }
  };

  let $thead = $container.find("thead");
  let $tbody = $container.find("tbody");

  if ($tbody.length === 0 || $tbody.children().length === 0 || overwrite) {
    $tbody.remove();
    $tbody = $("<tbody></tbody>");
    content.forEach((row_data) => {
      const row = document.createElement("tr");
      row.__data__ = row_data;
      $tbody[0].appendChild(row);
      row_data.forEach((cell_data, i) => {
        const cell = document.createElement("td");
        cell.__data__ = cell_data;
        row.appendChild(cell);
        set_table_elements(cell_data, cell);
        format_a_cell(cell_data, i, cell, priority_set_editor);
      });
    });
    $container.append($tbody);
  }

  if ($thead.length === 0 || $thead.children().length === 0 || overwrite) {
    $thead.remove();
    $thead = $("<thead></thead>");
    const $caption = $container.find("caption");
    if ($caption.length) {
      $thead.insertAfter($caption);
    } else {
      $thead.prependTo($container);
    }

    headers.forEach((row_data) => {
      const row = document.createElement("tr");
      row.__data__ = row_data;
      $thead[0].appendChild(row);
      row_data.forEach((cell_data, i) => {
        const cell = document.createElement("th");
        cell.__data__ = cell_data;
        row.appendChild(cell);
        set_table_elements(cell_data, cell);
        format_a_cell(
          cell_data,
          i,
          cell,
          (N && N > content.length) || content.length > kGlobals.CoIAddLimit
            ? null
            : priority_set_editor
        );
      });
    });
  }

  if (caption) {
    let $table_caption = $container.find("caption");
    if ($table_caption.length === 0) {
      $table_caption = $("<caption></caption>").prependTo($container);
    }
    $table_caption.html(caption);
    $table_caption
      .find(misc.get_ui_element_selector_by_role("table-count-total"))
      .text(content.length);
    $table_caption
      .find(misc.get_ui_element_selector_by_role("table-count-shown"))
      .text(content.length);
    if (N && N > content.length) {
      $table_caption
        .find(misc.get_ui_element_selector_by_role("table-count-warning"))
        .css("color", "black")
        .text(`Truncated due to the large number of rows (${N})`);
    }
  }
}

function table_get_cell_value(data) {
  if (!data) return "";
  return _.isFunction(data.value) ? data.value() : data.value;
}

/**
 * Formats a cell in a table.
 * @param {Object} data - Cell data object.
 * @param {number} index - Column index.
 * @param {HTMLElement} item - Table cell element.
 * @param {Object} [priority_set_editor] - Priority set editor.
 * @returns {void}
 */
function format_a_cell(data, index, item, priority_set_editor) {
  const $this = $(item);
  $this.node = function () {
    return this[0];
  };
  const current_value = table_get_cell_value(data);
  let $handle_sort = $this;

  $this.empty();

  if (data && "callback" in data) {
    const callback_result = data.callback(item, current_value);
    if (callback_result) {
      $handle_sort = $(
        callback_result.node ? callback_result.node() : callback_result
      );
      if (!$handle_sort.node) {
        $handle_sort.node = function () {
          return this[0];
        };
      }
    }
  } else if (data) {
    var repr = "format" in data ? data.format(current_value) : current_value;
    if ("html" in data && data.html) $this.html(repr);
    else $this.text(repr);
  }

  if (data && "filter" in data) {
    data.filter_term = "";
    data.column_id = index;

    if (data.value === _networkNodeIDField) {
      if (priority_set_editor) {
        const $add_to_ps = $("<a></a>")
          .attr("href", "#")
          .appendTo($handle_sort);
        $add_to_ps
          .append(
            $("<i></i>")
              .addClass("fa fa-plus-square fa-lg")
              .css("margin-left", "0.2em")
          )
          .attr("title", "Add currently visible nodes to the Cluster of Interest")
          .on("click", (e) => {
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
                    const cell_data = this.__data__;
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
      const $clicker = $("<a></a>")
        .attr("href", "#")
        .appendTo($handle_sort);

      $clicker.append(
        $("<i></i>").addClass("fa fa-search").css("margin-left", "0.2em")
      );

      const search_form_generator = function () {
        return `<form class="form-inline" data-hivtrace-ui-role = "table-filter-form"> 
                            <div class="form-group"> 
                                <div class="input-group">
                                <input type="text" class="form-control input-sm" data-hivtrace-ui-role = "table-filter-term" placeholder="Filter On" style = "min-width: 100px">
                                <div class="input-group-addon"><a data-hivtrace-ui-role = "table-filter-reset"><i class="fa fa-times-circle"></i></a> </div>
                                <div class="input-group-addon"><a data-hivtrace-ui-role = "table-filter-apply"><i class="fa fa-filter"></i></a> </div> 
                                <div class="input-group-addon">
                                    <i class="fa fa-question" data-toggle="collapse" data-target="#filter-help-column${index}"  aria-expanded="false" aria-controls="collapseExample"></i>
                                </div> 
                            </div>
                            </div>
                        </form>
                        <div class="collapse" id="filter-help-column${index}">
                          <div class="well">
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

      $clicker
        .popover({
          html: true,
          sanitize: false,
          content: search_form_generator,
          placement: "bottom",
        })
        .on("shown.bs.popover", function () {
          const $search_icon = $(this);

          const update_term = function (v) {
            data.filter_term = v;
            $search_icon
              .find("i")
              .toggleClass("fa-search", !v.length)
              .toggleClass("fa-search-plus", !!v.length);
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
              filter_table($clicker[0], event);
              event.preventDefault();
            }
          });

          $search_click.on("click", (e) => {
            e.preventDefault();
            update_term($search_box.val());
            filter_table($clicker[0], e);
          });

          $reset_click.on("click", (e) => {
            e.preventDefault();
            $search_box.val("");
            update_term("");
            filter_table($clicker[0], e);
          });
        });
    }
  }

  if ($handle_sort && data && "sort" in data) {
    const $clicker = $("<a></a>")
      .attr("href", "#")
      .appendTo($handle_sort)
      .on("click", function (e) {
        e.preventDefault();
        sort_table_by_column(this, data);
      })
      .attr("data-sorted", "unsorted")
      .data("sorted", "unsorted")
      .attr("data-column-id", index)
      .data("column-id", index);

    $clicker.append(
      $("<i></i>").addClass("fa fa-sort").css("margin-left", "0.2em")
    );

    if ("presort" in data) {
      if (data["presort"] === "desc") {
        $clicker.attr("data-sorted", "asc").data("sorted", "asc");
      }
      sort_table_by_column($clicker[0], data);
    }
  }

  if (data && "actions" in data) {
    let by_group = data.actions;

    if (!(_.isArray(data.actions) && _.isArray(data.actions[0]))) {
      by_group = [data.actions];
    }

    by_group.forEach((bgrp) => {
      const $button_group = $("<div></div>")
        .addClass("btn-group btn-group-xs")
        .css("padding-left", "0.5em")
        .appendTo($handle_sort);
      $button_group.node = function () {
        return this[0];
      };

      const buttons = _.isFunction(bgrp) ? bgrp($button_group, current_value) : bgrp;

      if (buttons && _.isArray(buttons)) {
        buttons.forEach((b) => {
          if (_.isFunction(b)) {
            b = b($button_group, current_value);
          }
          if (b) {
            let $this_button = null;
            if (_.isArray(b.dropdown)) {
              const $button_group_dropdown = $("<div></div>")
                .addClass("btn-group btn-group-xs")
                .appendTo($button_group);

              $this_button = $("<button></button>")
                .addClass("btn btn-default btn-xs dropdown-toggle")
                .attr("data-toggle", "dropdown")
                .appendTo($button_group_dropdown);
              $this_button.node = function () {
                return this[0];
              };

              const $dropdown_list = $("<ul></ul>")
                .addClass("dropdown-menu")
                .appendTo($button_group_dropdown);

              let items = b.dropdown;

              function get_item_text(item) {
                if (item && _.has(item, "label")) {
                  return item["label"];
                }
                return item;
              }

              items.forEach((item_data, i) => {
                const $li = $("<li></li>").appendTo($dropdown_list);
                const $handle_change = $("<a></a>")
                  .attr("href", "#")
                  .text(get_item_text(item_data))
                  .appendTo($li);

                if (item_data && _.has(item_data, "data") && item_data["data"]) {
                  _.each(item_data.data, (v, k) => {
                    $handle_change.attr("data-" + k, v);
                  });
                }

                $handle_change.on("click", (e) => {
                  if (item_data && ((_.has(item_data, "action") && item_data["action"]) || b.action)) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (_.has(item_data, "action") && item_data["action"]) {
                      item_data["action"]($this_button, item_data["label"]);
                    } else if (b.action) {
                      b.action($this_button, get_item_text(item_data));
                    }
                  }
                });
              });
            } else {
              $this_button = $("<button></button>")
                .addClass("btn btn-default btn-xs")
                .appendTo($button_group);
              $this_button.node = function () {
                return this[0];
              };
              if (b.action) {
                $this_button.on("click", (e) => {
                  e.preventDefault();
                  b.action($this_button, current_value);
                });
              }
            }

            if (b.icon) {
              $this_button.append($("<i></i>").addClass("fa " + b.icon));
            } else {
              $this_button.text(b.text).css("font-size", "12px");
            }

            if (b.data) {
              _.each(b.data, (v, k) => {
                $this_button.attr("data-" + k, v);
              });
            }

            if (b.classed) {
              _.each(b.classed, (v, k) => {
                $this_button.toggleClass(k, !!v);
              });
            }

            if (b.help) {
              $this_button.attr("title", b.help);
            }
          }
        });
      }
    });
  }

  if (data && "help" in data) {
    $this.attr("title", data.help);
  }
}

function filter_table_by_column_handler(datum, conditions) {
  if (conditions.length) {
    return _.some(conditions, (c) => {
      if (c.type === "re") {
        return c.value.test(datum);
      } else if (c.type === "date") {
        return datum >= c.value[0] && datum <= c.value[1];
      } else if (c.type === "distance") {
        if (c.greater_than) return datum > c.value;
        return datum <= c.value;
      }
      return false;
    });
  }
  return true;
}

/**
 * Filters a table based on user-defined filters.
 * @param {HTMLElement} element - The element that triggered the filter.
 * @param {Event} [event] - The event object.
 * @returns {void}
 */
function filter_table(element, event) {
  if (event) {
    event.preventDefault();
  }

  const $table = $(element).closest("table");
  if ($table.length) {
    const filter_array = [];
    const filter_handlers = [];

    $table.find("thead th").each(function () {
      const d = this.__data__;
      if (d && d.filter) {
        if (_.isString(d.filter_term) && d.filter_term.length) {
          filter_array[d.column_id] = filter_parse(d.filter_term);
          filter_handlers[d.column_id] = _.isFunction(d.filter)
            ? d.filter
            : filter_table_by_column_handler;
        } else {
          filter_array[d.column_id] = null;
          filter_handlers[d.column_id] = null;
        }
      }
    });

    let shown_rows = 0;
    $table.find("tbody tr").each(function () {
      const $row = $(this);
      let hide_me = false;

      $row.find("td").each(function (i) {
        if (!hide_me) {
          if (filter_array[i]) {
            const cell_data = this.__data__;
            if (
              !filter_handlers[i](
                table_get_cell_value(cell_data),
                filter_array[i]
              )
            ) {
              hide_me = true;
            }
          }
        }
      });

      if (hide_me) {
        $row.hide();
      } else {
        shown_rows += 1;
        $row.show();
      }
    });

    $table
      .find("caption")
      .find(misc.get_ui_element_selector_by_role("table-count-shown"))
      .text(shown_rows);
  }
}

function filter_parse(filter_value) {
  let search_terms = [];
  let quote_state = 0;
  let current_term = [];
  _.each(filter_value, (c) => {
    if (c === " ") {
      if (quote_state === 0) {
        if (current_term.length) {
          search_terms.push(current_term.join(""));
          current_term = [];
        }
      } else {
        current_term.push(c);
      }
    } else {
      if (c === '"') {
        quote_state = 1 - quote_state;
      }
      current_term.push(c);
    }
  });

  if (quote_state === 0) {
    search_terms.push(current_term.join(""));
  }

  return search_terms
    .filter((d) => d.length > 0)
    .map((d) => {
      if (d.length >= 2) {
        if (d[0] === '"' && d[d.length - 1] === '"' && d.length > 2) {
          return {
            type: "re",
            value: new RegExp("^" + d.substr(1, d.length - 2) + "$", "i"),
          };
        }
        if (d[0] === "<" || d[0] === ">") {
          var distance_threshold = parseFloat(d.substr(1));
          if (distance_threshold > 0) {
            return {
              type: "distance",
              greater_than: d[0] === ">",
              value: distance_threshold,
            };
          }
        }
        if (timeDateUtil.getClusterTimeScale()) {
          var is_range = timeDateUtil._networkTimeQuery.exec(d);
          if (is_range) {
            return {
              type: "date",
              value: _.map(
                [is_range[1], is_range[2]],
                (d) =>
                  new Date(
                    d.substring(0, 4) +
                      "-" +
                      d.substring(4, 6) +
                      "-" +
                      d.substring(6, 8)
                  )
              ),
            };
          }
        }
      }
      return {
        type: "re",
        value: new RegExp(d, "i"),
      };
    });
}

/**
 * Sorts a table based on the clicked column header.
 * @param {HTMLElement} element - The column header element.
 * @param {Object} datum - The data object for the header.
 * @returns {void}
 */
function sort_table_by_column(element, datum) {
  const $element = $(element);
  const $table = $element.closest("table");
  if ($table.length) {
    const sort_on = parseInt($element.attr("data-column-id") || $element.data("column-id"));
    const sort_key = datum.sort;

    const sorted_function = sort_table_toggle_icon(element);

    let sort_accessor;
    if (sort_key) {
      if (_.isFunction(sort_key)) {
        sort_accessor = (x) => sort_key(x);
      } else {
        sort_accessor = (x) => {
          if (!x) return "";
          const val = x[sort_key];
          return _.isFunction(val) ? val() : val;
        };
      }
    } else {
      sort_accessor = (x) => x;
    }

    const $tbody = $table.find("tbody");
    const $rows = $tbody.find("tr").detach().get();

    $rows.sort((a, b) => {
      const data_a = a.__data__;
      const data_b = b.__data__;
      if (!data_a || !data_b) return 0;
      return sorted_function(
        sort_accessor(data_a[sort_on]),
        sort_accessor(data_b[sort_on])
      );
    });

    $tbody.append($rows);

    $table
      .find("thead [data-column-id]")
      .filter(function () {
        return parseInt($(this).attr("data-column-id") || $(this).data("column-id")) !== sort_on;
      })
      .each(function () {
        sort_table_toggle_icon(this, "unsorted");
      });
  }
}

/**
 * Toggles the sort icon and returns a sorting function.
 * @param {HTMLElement} element - The header element.
 * @param {string} [value] - Sort direction ("asc", "desc", "unsorted").
 * @returns {Function|void}
 */
function sort_table_toggle_icon(element, value) {
  const $element = $(element);
  if (value) {
    $element.data("sorted", value);
    $element.attr("data-sorted", value);
    $element
      .find("i")
      .toggleClass("fa-sort-amount-desc", value === "desc")
      .toggleClass("fa-sort-amount-asc", value === "asc")
      .toggleClass("fa-sort", value === "unsorted");
  } else {
    const sorted_state = $element.data("sorted");
    const new_state = sorted_state === "asc" ? "desc" : "asc";
    sort_table_toggle_icon(element, new_state);
    return sorted_state === "asc" ? d3.descending : d3.ascending;
  }
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
