const d3 = require("d3");
const _ = require("underscore");
const utils = require("./utils.js");
const timeDateUtil = require('./timeDateUtil.js');
const nodesTab = require('./nodesTab.js');

const _networkNodeIDField = "hivtrace_node_id";
const _networkNewNodeMarker = "[+]";

function add_a_sortable_table(
  container,
  headers,
  content,
  overwrite,
  caption,
  priority_set_editor
) {
  if (!container || !container.node()) {
    return;
  }

  var thead = container.selectAll("thead");
  var tbody = container.selectAll("tbody");

  const set_table_elements = (d, cell) => {
    if (d.width || d.text_wrap) {
      cell = d3.select(cell);
      if (d.width) cell.style("width", "" + d.width + "px");
      if (d.text_wrap) {
        cell
          .style("overflow", "hidden")
          .style("white-space", "nowrap")
          .style("text-overflow", "ellipsis");
      }
    }
  };

  if (tbody.empty() || overwrite) {
    tbody.remove();
    tbody = d3.select(document.createElement("tbody"));
    tbody
      .selectAll("tr")
      .data(content)
      .enter()
      .append("tr")
      .selectAll("td")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("td")
      .call(function (selection) {
        return selection.each(function (d, i) {
          set_table_elements(d, this);
          format_a_cell(d, i, this, priority_set_editor);
        });
      });
    container.node().appendChild(tbody.node());
  }

  // head AFTER rows, so we can handle pre-sorting
  if (thead.empty() || overwrite) {
    thead.remove();
    thead = container.insert("thead", ":first-child");
    thead
      .selectAll("tr")
      .data(headers)
      .enter()
      .append("tr")
      .selectAll("th")
      .data(function (d) {
        return d;
      })
      .enter()
      .append("th")
      .call(function (selection) {
        return selection.each(function (d, i) {
          set_table_elements(d, this);
          format_a_cell(d, i, this, priority_set_editor);
        });
      });
  }
  //'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network nodes');

  if (caption) {
    var table_caption = container.selectAll("caption").data([caption]);
    table_caption.enter().insert("caption", ":first-child");
    table_caption.html(function (d) {
      return d;
    });
    table_caption
      .select(utils.get_ui_element_selector_by_role("table-count-total", true))
      .text(content.length);
    table_caption
      .select(utils.get_ui_element_selector_by_role("table-count-shown", true))
      .text(content.length);
  }
}

function table_get_cell_value(data) {
  return _.isFunction(data.value) ? data.value() : data.value;
}

function format_a_cell(data, index, item, priority_set_editor) {
  var this_sel = d3.select(item);
  var current_value = table_get_cell_value(data);
  var handle_sort = this_sel;

  handle_sort.selectAll("*").remove();

  if ("callback" in data) {
    handle_sort = data.callback(item, current_value);
  } else {
    var repr = "format" in data ? data.format(current_value) : current_value;
    if ("html" in data && data.html) this_sel.html(repr);
    else this_sel.text(repr);
  }

  if ("filter" in data) {
    data.filter_term = "";
    data.column_id = index;

    if (data.value == _networkNodeIDField) {
      // this is an ugly hardcode.
      if (priority_set_editor) {
        //console.log ("Here");
        var add_to_ps = handle_sort.append("a").property("href", "#");
        add_to_ps
          .append("i")
          .classed("fa fa-plus-square fa-lg", true)
          .style("margin-left", "0.2em")
          .attr(
            "title",
            "Add currently visible nodes to the Cluster of Interest"
          );

        add_to_ps.on("click", function (d) {
          let node_ids = [];
          nodesTab.getNodeTable().selectAll("tr").each(function (d, i) {
            let this_row = d3.select(this);
            if (this_row.style("display") != "none") {
              this_row.selectAll("td").each(function (d, j) {
                if (j == data.column_id) {
                  let marker_index = d.value.indexOf(_networkNewNodeMarker);
                  if (marker_index > 0) {
                    node_ids.push(d.value.substring(0, marker_index));
                  } else {
                    node_ids.push(d.value);
                  }
                }
              });
            }
          });
          priority_set_editor.append_nodes(node_ids);
        });
      }
    }

    var clicker = handle_sort.append("a").property("href", "#");

    clicker
      .append("i")
      .classed("fa fa-search", true)
      .style("margin-left", "0.2em");

    var search_form_generator = function () {
      return (
        '<form class="form-inline"> \
                        <div class="form-group"> \
                            <div class="input-group">\
                            <input type="text" class="form-control input-sm" data-hivtrace-ui-role = "table-filter-term" placeholder="Filter On" style = "min-width: 100px">\
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-reset"><i class="fa fa-times-circle"></i></a> </div>\
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-apply"><i class="fa fa-filter"></i></a> </div> \
                            <div class="input-group-addon">\
                                <i class="fa fa-question" data-toggle="collapse" data-target="#filter-help-column' +
        index +
        '"  aria-expanded="false" aria-controls="collapseExample"></i>\
                            </div> \
                        </div>\
                        </div>\
                    </form>\
                    <div class="collapse" id="filter-help-column' +
        index +
        '">\
                      <div class="well">\
                        Type in text to select columns which \
                        <em>contain the term</em>. <br />\
                        For example, typing in <code>MSM</code> will select rows\
                        that have "MSM" as a part of the column value.\
                        <p />\
                        Type in space separated terms (<code>MSM IDU</code>) to\
                        search for <b>either</b> term. <p/>\
                        Type in terms in quotes (<code>"male"</code>) to search\
                        for this <b>exact</b> term. <p/>\
                        If columns have date information you can use\
                        <code>YYYYMMDD:YYYYMMDD</code> to search for date ranges.<p/>\
                        Use <code>&lt;value</code> or <code>&gt;value</code>\
                        to search numerical columns<p/>\
                      </div>\
                    </div>\
                    '
      );
    };

    var search_popover = $(clicker.node())
      .popover({
        html: true,
        sanitize: false,
        content: search_form_generator,
        placement: "bottom",
      })
      .on("shown.bs.popover", function (e) {
        var search_icon = d3.select(this);

        const update_term = function (v) {
          data.filter_term = v;
          search_icon
            .selectAll("i")
            .classed("fa-search", !v.length)
            .classed("fa-search-plus", v.length);
        };

        var popover_div = d3.select(
          "#" + d3.select(this).attr("aria-describedby")
        );
        var search_click = popover_div.selectAll(
          utils.get_ui_element_selector_by_role("table-filter-apply", true)
        );
        var reset_click = popover_div.selectAll(
          utils.get_ui_element_selector_by_role("table-filter-reset", true)
        );
        var search_box = popover_div.selectAll(
          utils.get_ui_element_selector_by_role("table-filter-term", true)
        );

        search_box.property("value", data.filter_term);

        search_click.on("click", function (d) {
          update_term(search_box.property("value"));
          filter_table(clicker.node());
        });

        reset_click.on("click", function (d) {
          search_box.property("value", "");
          update_term("");
          filter_table(clicker.node());
        });
      });
  }

  if (handle_sort && "sort" in data) {
    var clicker = handle_sort
      .append("a")
      .property("href", "#")
      .on("click", function (d) {
        sort_table_by_column(this, d);
      })
      .attr("data-sorted", "unsorted")
      .attr("data-column-id", index);
    clicker
      .append("i")
      .classed("fa fa-sort", true)
      .style("margin-left", "0.2em");

    if ("presort" in data) {
      if (data["presort"] == "desc") {
        clicker.attr("data-sorted", "asc");
      }
      sort_table_by_column(clicker.node(), data);
    }
  }

  if ("actions" in data) {
    let by_group = data.actions;

    if (!(_.isArray(data.actions) && _.isArray(data.actions[0]))) {
      by_group = [data.actions];
    }

    _.each(by_group, (bgrp) => {
      let button_group = handle_sort
        .append("div")
        .classed("btn-group btn-group-xs", true)
        .attr("style", "padding-left:0.5em");
      _.each(
        _.isFunction(bgrp) ? bgrp(button_group, current_value) : bgrp,
        (b) => {
          if (_.isFunction(b)) {
            b = b(button_group, current_value);
          }
          if (b) {
            let this_button = null;
            if (_.isArray(b.dropdown)) {
              let button_group_dropdown = button_group
                .append("div")
                .classed("btn-group btn-group-xs", true);

              this_button = button_group_dropdown
                .append("button")
                .classed("btn btn-default btn-xs dropdown-toggle", true)
                .attr("data-toggle", "dropdown");

              var dropdown_list = button_group_dropdown
                .append("ul")
                .classed("dropdown-menu", true);
              //.attr("aria-labelledby", menu_id);

              let is_option_array = _.isObject(b.dropdown[0]);
              let items = b.dropdown;

              function get_item_text(item) {
                if (_.has(item, "label")) {
                  return item["label"];
                }
                return item;
              }

              dropdown_list = dropdown_list.selectAll("li").data(items);
              dropdown_list.enter().append("li");
              dropdown_list.each(function (data, i) {
                var handle_change = d3
                  .select(this)
                  .append("a")
                  .attr("href", "#")
                  .text(function (data) {
                    return get_item_text(data);
                  });
                if (_.has(data, "data") && data["data"]) {
                  //let element = $(this_button.node());
                  _.each(data.data, (v, k) => {
                    handle_change.attr("data-" + k, v);
                  });
                }
                handle_change.on("click", function (d) {
                  if (_.has(d, "action") && d["action"]) {
                    d["action"](this_button, d["label"]);
                  } else {
                    if (b.action) b.action(this_button, get_item_text(d));
                  }
                });
              });
            } else {
              this_button = button_group
                .append("button")
                .classed("btn btn-default btn-xs", true);
              if (b.action)
                this_button.on("click", function (e) {
                  d3.event.preventDefault();
                  b.action(this_button, current_value);
                });
            }
            if (b.icon) {
              this_button.append("i").classed("fa " + b.icon, true);
            } else {
              this_button.text(b.text).style("font-size", "12px");
            }

            if (b.data) {
              //let element = $(this_button.node());
              _.each(b.data, (v, k) => {
                this_button.attr("data-" + k, v);
              });
            }

            if (b.classed) {
              _.each(b.classed, (v, k) => {
                this_button.classed(k, v);
              });
            }

            if (b.help) {
              this_button.attr("title", b.help);
            }
          }
        }
      );
    });
  }

  if ("help" in data) {
    this_sel.attr("title", data.help);
  }
}

/** element is the sortable clicker **/

function filter_table_by_column_handler(datum, conditions) {
  if (conditions.length) {
    return _.some(conditions, (c) => {
      if (c.type == "re") {
        return c.value.test(datum);
      } else if (c.type == "date") {
        return datum >= c.value[0] && datum <= c.value[1];
      } else if (c.type == "distance") {
        if (c.greater_than) return datum > c.value;

        return datum <= c.value;
      }
      return false;
    });
  }

  return true;
}

function filter_table(element) {
  if (d3.event) {
    d3.event.preventDefault();
  }

  var table_element = $(element).closest("table");

  if (table_element.length) {
    // construct compound filters over all columns

    var filter_array = [];
    var filter_handlers = [];

    d3.select(table_element[0])
      .selectAll("thead th")
      .each(function (d, i) {
        if (d.filter) {
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

    var shown_rows = 0;

    d3.select(table_element[0])
      .select("tbody")
      .selectAll("tr")
      .each(function (d, r) {
        var this_row = d3.select(this);
        var hide_me = false;

        this_row.selectAll("td").each(function (d, i) {
          if (!hide_me) {
            if (filter_array[i]) {
              if (
                !filter_handlers[i](table_get_cell_value(d), filter_array[i])
              ) {
                hide_me = true;
              }
            }
          }
        });

        if (hide_me) {
          this_row.style("display", "none");
        } else {
          shown_rows += 1;
          this_row.style("display", null);
        }
      });
    d3.select(table_element[0])
      .select("caption")
      .select(utils.get_ui_element_selector_by_role("table-count-shown", true))
      .text(shown_rows);

    /*.selectAll("td").each (function (d, i) {
          if (i == filter_on) {
              var this_cell = d3.select (this);
              d3.select (this).style ("display", filter_handler ())
          }
      });*/

    // select all other elements from thead and toggle their icons

    /*$(table_element)
      .find("thead [data-column-id]")
      .filter(function() {
        return parseInt($(this).data("column-id")) != sort_on;
      })
      .each(function() {
        sort_table_toggle_icon(this, "unsorted");
      });*/
  }
}

function filter_parse(filter_value) {
  let search_terms = [];
  let quote_state = 0;
  let current_term = [];
  _.each(filter_value, (c) => {
    if (c == " ") {
      if (quote_state == 0) {
        if (current_term.length) {
          search_terms.push(current_term.join(""));
          current_term = [];
        }
      } else {
        current_term.push(c);
      }
    } else {
      if (c == '"') {
        quote_state = 1 - quote_state;
      }
      current_term.push(c);
    }
  });

  if (quote_state == 0) {
    search_terms.push(current_term.join(""));
  }

  return search_terms
    .filter(function (d) {
      return d.length > 0;
    })
    .map(function (d) {
      if (d.length >= 2) {
        if (d[0] == '"' && d[d.length - 1] == '"' && d.length > 2) {
          return {
            type: "re",
            value: new RegExp("^" + d.substr(1, d.length - 2) + "$", "i"),
          };
        }
        if (d[0] == "<" || d[0] == ">") {
          var distance_threshold = parseFloat(d.substr(1));
          if (distance_threshold > 0) {
            return {
              type: "distance",
              greater_than: d[0] == ">",
              value: distance_threshold,
            };
          }
        }
        if (timeDateUtil.getClusterTimeScale()) {
          var is_range = timeDateUtil._networkTimeQuery.exec(d);
          if (is_range) {
            return {
              type: "date",
              value: _.map([is_range[1], is_range[2]], function (d) {
                return new Date(
                  d.substring(0, 4) +
                  "-" +
                  d.substring(4, 6) +
                  "-" +
                  d.substring(6, 8)
                );
              }),
            };
          }
        }
      }
      return {
        type: "re",
        value: new RegExp(d, "i"),
      };
    });
};

/** element is the sortable clicker **/
function sort_table_by_column(element, datum) {
  if (d3.event) {
    d3.event.preventDefault();
  }
  var table_element = $(element).closest("table");
  if (table_element.length) {
    var sort_on = parseInt($(element).data("column-id"));
    var sort_key = datum.sort;

    var sorted_state = $(element).data("sorted");
    var sorted_function = sort_table_toggle_icon(element);

    var sort_accessor;

    if (sort_key) {
      if (_.isFunction(sort_key)) {
        sort_accessor = function (x) {
          return sort_key(x);
        };
      } else {
        sort_accessor = function (x) {
          var val = x[sort_key];
          if (_.isFunction(val)) return val();
          return val;
        };
      }
    } else {
      sort_accessor = function (x) {
        return x;
      };
    }

    d3.select(table_element[0])
      .select("tbody")
      .selectAll("tr")
      .sort(function (a, b) {
        return sorted_function(
          sort_accessor(a[sort_on]),
          sort_accessor(b[sort_on])
        );
      });

    // select all other elements from thead and toggle their icons

    $(table_element)
      .find("thead [data-column-id]")
      .filter(function () {
        return parseInt($(this).data("column-id")) != sort_on;
      })
      .each(function () {
        sort_table_toggle_icon(this, "unsorted");
      });
  }
}

function sort_table_toggle_icon(element, value) {
  //console.log (value);
  if (value) {
    $(element).data("sorted", value);
    d3.select(element)
      .selectAll("i")
      .classed("fa-sort-amount-desc", value == "desc")
      .classed("fa-sort-amount-asc", value == "asc")
      .classed("fa-sort", value == "unsorted");
  } else {
    var sorted_state = $(element).data("sorted");
    sort_table_toggle_icon(element, sorted_state == "asc" ? "desc" : "asc");
    return sorted_state == "asc" ? d3.descending : d3.ascending;
  }
}

module.exports = {
  _networkNodeIDField,
  _networkNewNodeMarker,
  add_a_sortable_table,
  format_a_cell,
  sort_table_by_column,
  sort_table_toggle_icon,
}

