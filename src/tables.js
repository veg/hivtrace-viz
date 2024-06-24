import jsConvert from "js-convert-case";
import * as clusterNetwork from "./clusternetwork.js";
import * as helpers from "./helpers.js";
import * as nodesTab from "./nodesTab.js";
import * as clustersOfInterest from "./clustersOI/clusterOI.js";

const _networkNodeIDField = "hivtrace_node_id";
const _networkNewNodeMarker = "[+]";
const _networkDotFormatPadder = d3.format("08d");

function add_a_sortable_table(
  self,
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
      if (d.width) cell.style("width", String(d.width) + "px");
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
      .data((d) => d)
      .enter()
      .append("td")
      .call((selection) => selection.each(function (d, i) {
        set_table_elements(d, this);
        format_a_cell(self, d, i, this, priority_set_editor);
      }));
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
      .data((d) => d)
      .enter()
      .append("th")
      .call((selection) => selection.each(function (d, i) {
        set_table_elements(d, this);
        format_a_cell(self, d, i, this, priority_set_editor);
      }));
  }
  //'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network nodes');

  if (caption) {
    var table_caption = container.selectAll("caption").data([caption]);
    table_caption.enter().insert("caption", ":first-child");
    table_caption.html((d) => d);
    table_caption
      .select(helpers.get_ui_element_selector_by_role("table-count-total"))
      .text(content.length);
    table_caption
      .select(helpers.get_ui_element_selector_by_role("table-count-shown"))
      .text(content.length);
  }
}

function table_get_cell_value(data) {
  return _.isFunction(data.value) ? data.value() : data.value;
}

function format_a_cell(self, data, index, item, priority_set_editor) {
  var this_sel = d3.select(item);
  var current_value = table_get_cell_value(data);
  var handle_sort = this_sel;

  handle_sort.selectAll("*").remove();

  if ("callback" in data) {
    handle_sort = data.callback(self, item, current_value);
  } else {
    var repr = "format" in data ? data.format(current_value) : current_value;
    if ("html" in data && data.html) this_sel.html(repr);
    else this_sel.text(repr);
  }

  if ("filter" in data) {
    data.filter_term = "";
    data.column_id = index;

    if (data.value === _networkNodeIDField) {
      // this is an ugly hardcode.
      if (priority_set_editor) {
        var add_to_ps = handle_sort.append("a").property("href", "#");
        add_to_ps
          .append("i")
          .classed("fa fa-plus-square fa-lg", true)
          .style("margin-left", "0.2em")
          .attr(
            "title",
            "Add currently visible nodes to the Cluster of Interest"
          );

        add_to_ps.on("click", (d) => {
          let node_ids = [];
          nodesTab.getNodeTable().selectAll("tr").each(function (d, i) {
            let this_row = d3.select(this);
            if (this_row.style("display") !== "none") {
              this_row.selectAll("td").each((d, j) => {
                if (j === data.column_id) {
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
        `<div class="form-inline"> 
                        <div class="form-group"> 
                            <div class="input-group">
                            <input type="text" class="form-control input-sm" data-hivtrace-ui-role = "table-filter-term" placeholder="Filter On" style = "min-width: 100px">
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-reset"><i class="fa fa-times-circle"></i></a> </div>
                            <div class="input-group-addon"><a href = "#" data-hivtrace-ui-role = "table-filter-apply"><i class="fa fa-filter"></i></a> </div> 
                            <div class="input-group-addon">
                                <i class="fa fa-question" data-toggle="collapse" data-target="#filter-help-column-${index}"  aria-expanded="false" aria-controls="collapseExample"></i>
                            </div> 
                        </div>
                        </div>
                    </div>
                    <div class="collapse" id="#filter-help-column-${index}">
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
                    `
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
          helpers.get_ui_element_selector_by_role("table-filter-apply")
        );
        var reset_click = popover_div.selectAll(
          helpers.get_ui_element_selector_by_role("table-filter-reset")
        );
        var search_box_element = helpers.get_ui_element_selector_by_role("table-filter-term");
        var search_box = popover_div.selectAll(search_box_element);

        search_box.property("value", data.filter_term);

        // search by hitting enter
        $(search_box_element).on("keyup", (e) => {
          if (e.key === "Enter") {
            update_term(search_box.property("value"));
            filter_table(clicker.node());
          }
        })

        // search by clicking the search icon
        search_click.on("click", (d) => {
          update_term(search_box.property("value"));
          filter_table(clicker.node());
        });

        reset_click.on("click", (d) => {
          search_box.property("value", "");
          update_term("");
          filter_table(clicker.node());
        });
      });
  }

  if (handle_sort && "sort" in data) {
    clicker = handle_sort
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
      if (data["presort"] === "desc") {
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
                  .text((data) => get_item_text(data));
                if (_.has(data, "data") && data["data"]) {
                  //let element = $(this_button.node());
                  _.each(data.data, (v, k) => {
                    handle_change.attr("data-" + k, v);
                  });
                }
                handle_change.on("click", (d) => {
                  if (_.has(d, "action") && d["action"]) {
                    d["action"](this_button, d["label"]);
                  } else if (b.action) {
                    b.action(this_button, get_item_text(d))
                  }
                });
              });
            } else {
              this_button = button_group
                .append("button")
                .classed("btn btn-default btn-xs", true);
              if (b.action)
                this_button.on("click", (e) => {
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
      .each((d, i) => {
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

        this_row.selectAll("td").each((d, i) => {
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
      .select(helpers.get_ui_element_selector_by_role("table-count-shown"))
      .text(shown_rows);

    /*.selectAll("td").each (function (d, i) {
          if (i === filter_on) {
              var this_cell = d3.select (this);
              d3.select (this).style ("display", filter_handler ())
          }
      });*/

    // select all other elements from thead and toggle their icons

    /*$(table_element)
      .find("thead [data-column-id]")
      .filter(function() {
        return parseInt($(this).data("column-id")) !== sort_on;
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
            value: new RegExp("^" + d.substring(1, d.length - 1) + "$", "i"),
          };
        }
        if (d[0] === "<" || d[0] === ">") {
          var distance_threshold = parseFloat(d.substring(1));
          if (distance_threshold > 0) {
            return {
              type: "distance",
              greater_than: d[0] === ">",
              value: distance_threshold,
            };
          }
        }
        if (helpers.getClusterTimeScale()) {
          var is_range = helpers._networkTimeQuery.exec(d);
          if (is_range) {
            return {
              type: "date",
              value: _.map([is_range[1], is_range[2]], (d) => new Date(
                d.substring(0, 4) +
                "-" +
                d.substring(4, 6) +
                "-" +
                d.substring(6, 8)
              )),
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
      .sort((a, b) => sorted_function(
        sort_accessor(a[sort_on]),
        sort_accessor(b[sort_on])
      ));

    // select all other elements from thead and toggle their icons

    $(table_element)
      .find("thead [data-column-id]")
      .filter(function () {
        return parseInt($(this).data("column-id")) !== sort_on;
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
      .classed("fa-sort-amount-desc", value === "desc")
      .classed("fa-sort-amount-asc", value === "asc")
      .classed("fa-sort", value === "unsorted");
  } else {
    var sorted_state = $(element).data("sorted");
    sort_table_toggle_icon(element, sorted_state === "asc" ? "desc" : "asc");
    return sorted_state === "asc" ? d3.descending : d3.ascending;
  }
}

function update_volatile_elements(self, container) {
  //var event = new CustomEvent('hiv-trace-viz-volatile-update', { detail: container });
  //container.node().dispatchEvent (event);

  container
    .selectAll("td, th")
    .filter((d) => "volatile" in d)
    .each(function (d, i) {
      // TODO: QUESTION: Should this have priority_set_editor arg passed in as well? 
      format_a_cell(self, d, i, this);
    });
};

function _node_table_draw_buttons(self, element, payload) {
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
    // TODO: deprecated? remove if not needed (5/22/2024 meeting with @spond, @daniel-ji, @stevenweaver)
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
    .classed("btn btn-xs btn-node-property", true)
    .classed("btn-primary", true)
    //.classed(function (d) {return d.length >=3 ? d[2] : "";}, function (d) {return d.length >= 3;})
    .text((d) => d[0])
    .attr("disabled", (d) => d[1] && !_.isFunction(d[1]) ? "disabled" : null)
    .on("click", (d) => {
      if (_.isFunction(d[1])) {
        d[1].call(d);
      } else if (d[1] === 0) {
        if (payload[0]) {
          self.collapse_cluster(self.clusters[payload[3] - 1], true);
        } else {
          self.expand_cluster(self.clusters[payload[3] - 1]);
        }
        //format_a_cell(self, d3.select(element).datum(), null, element);
        update_volatile_elements(self, nodesTab.getNodeTable());
      }
    });
  buttons.each(function (d, e) {
    if (d.length >= 3) {
      d3.select(this).classed("btn-primary", false).classed(d[2], true);
    }
  });
}

function _cluster_table_draw_id(self, element, payload) {
  var this_cell = d3.select(element);
  this_cell.selectAll("*").remove();
  const _is_subcluster = payload[1];
  var cluster_id = payload[0];

  if (_is_subcluster) {
    //console.log (payload);

    //this_cell.append("i")
    //      .classed("fa fa-arrow-circle-o-right", true).style("padding-right", "0.25em");

    /*if (payload[2].rr_count) {
      this_cell
        .append("i")
        .classed("fa fa-exclamation-triangle", true)
        .attr("title", "Subcluster has recent/rapid nodes");
    }*/
    this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");

    this_cell
      .append("button")
      .classed("btn btn-sm pull-right", true)
      //.text(__("clusters_tab")["view"])
      .on("click", (e) => {
        self.view_subcluster(payload[2]);
      })
      .append("i")
      .classed("fa fa-eye", true)
      .attr("title", __("clusters_tab")["view"]);
  } else {
    this_cell.append("span").text(cluster_id).style("padding-right", "0.5em");
    this_cell
      .append("button")
      .classed("btn btn-sm pull-right", true)
      .style("margin-right", "0.25em")
      .on("click", (e) => {
        self.open_exclusive_tab_view(cluster_id);
      })
      .append("i")
      .classed("fa fa-eye", true)
      .attr("title", __("clusters_tab")["view"]);
  }
  this_cell
    .append("button")
    .classed("btn btn-sm pull-right", true)
    .style("margin-right", "0.25em")
    //.text(__("clusters_tab")["list"])
    .attr("data-toggle", "modal")
    .attr(
      "data-target",
      self.get_ui_element_selector_by_role("cluster_list", true)
    )
    .attr("data-cluster", cluster_id)
    .append("i")
    .classed("fa fa-list", true)
    .attr("title", __("clusters_tab")["list"]);
}

function _cluster_table_draw_buttons(self, element, payload) {
  var this_cell = d3.select(element);
  const label_diff = function (c_info) {
    const d = c_info["delta"];
    const moved = c_info["moved"];
    const deleted = c_info["deleted"];
    const new_count = c_info["new_nodes"] ? c_info["new_nodes"] : 0;

    /*if (moved) {
          if (d > 0) {
              return "" + moved + " nodes moved +" + d + " new";
          } else {
              if (d === 0) {
                  return "" + moved + " nodes moved";
              } else {
                  return "" + moved + " nodes moved " + (-d) + " removed";
              }
          }

      } else {
          if (d > 0) {
              return "+" + d + " nodes";
          } else {
              if (d === 0) {
                  return "no size change";
              } else {
                  return "" + (-d) + " nodes removed";
              }
          }
      }*/

    let label_str = "";
    if (moved) label_str = " " + moved + " moved ";
    if (new_count) label_str += "+" + new_count + " new ";
    if (deleted) label_str += "-" + deleted + " previous ";
    return label_str;
  };

  var labels = [];

  if (payload[4]) {
    if (payload[4]["type"] === "new") {
      if (payload[4]["moved"]) {
        labels.push(["renamed " + label_diff(payload[4]), 2]);
      } else {
        labels.push(["new", 3]);
      }
    } else if (payload[4]["type"] === "extended") {
      labels.push([label_diff(payload[4]), payload["4"]["flag"]]);
    } else if (payload[4]["type"] === "merged") {
      labels.push([
        "Merged " +
        payload[4]["old_clusters"].join(", ") +
        " " +
        label_diff(payload[4]),
        payload["4"]["flag"],
      ]);
    }
  }

  labels.push([
    [
      payload[0]
        ? __("clusters_tab")["expand"]
        : __("clusters_tab")["collapse"],
      payload[0] ? "fa-expand" : "fa-compress",
    ],
    0,
  ]);
  if (payload[1]) {
    labels.push([["problematic", "fa-exclamation-circle"], 1]);
  }
  if (payload[2]) {
    labels.push([["match", "fa-check-square"], 1]);
  }
  var buttons = this_cell.selectAll("button").data(labels);
  buttons.enter().append("button");
  buttons.exit().remove();
  buttons
    .classed("btn btn-xs", true)
    .classed("btn-default", (d) => d[1] !== 1 && d[1] !== 2)
    .classed("btn-danger", (d) => d[1] === 2)
    .classed("btn-success", (d) => d[1] === 3)
    /*.text(function(d) {
      return d[0];
    })*/
    .style("margin-right", "0.25em")
    .attr("disabled", (d) => d[1] === 1 ? "disabled" : null)
    .on("click", (d) => {
      if (d[1] === 0) {
        if (payload[0]) {
          self.expand_cluster(self.clusters[payload[3] - 1], true);
        } else {
          self.collapse_cluster(self.clusters[payload[3] - 1]);
        }
        update_volatile_elements(self, self.cluster_table);
        if (self.subcluster_table) {
          update_volatile_elements(self, self.subcluster_table);
        }
      } else if (d[1] === 2 || d[1] === 3) {
        //_social_view_options (labeled_links, shown_types),

        var shown_types = { Existing: 1, "Newly added": 1 },
          link_class = ["Existing", "Newly added"];

        self
          .open_exclusive_tab_view(
            payload[3],
            null,
            (cluster_id) => "Cluster " + cluster_id + " [changes view]",
            self._social_view_options(link_class, shown_types, (e) => {
              if (_.isObject(e.source) && self._is_new_node(e.source))
                return "Newly added";
              if (_.isObject(e.target) && self._is_new_node(e.target))
                return "Newly added";

              return e.attributes.indexOf("added-to-prior") >= 0
                ? "Newly added"
                : "Existing";
            })
          )
          .handle_attribute_categorical("_newly_added");
      }
    });
  buttons.each(function (d, i) {
    var this_e = d3.select(this);
    if (_.isString(d[0])) {
      this_e.selectAll("i").remove();
      this_e.text(d[0]);
    } else {
      var i_span = this_e.selectAll("i").data([d[0]]);
      i_span.enter().append("i");
      i_span
        .attr(
          "class",
          (d) => "fa " + d[1],
          true
        )
        .attr("title", (d) => d[0]);
    }
  });
}

function draw_extended_node_table(
  self,
  node_list,
  container,
  extra_columns
) {
  container = container || nodesTab.getNodeTable();

  if (container) {
    node_list = node_list || self.nodes;
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
    var table_headers = _.map(
      self.displayed_node_subset,
      (n, col_id) => ({
        value: n.raw_attribute_key,
        sort: "value",
        filter: true,
        volatile: true,
        help: "label" in n ? n.label : n.raw_attribute_key,
        //format: (d) => "label" in d ? d.label : d.raw_attribute_key,
        callback: function (self, element, payload) {
          var dropdown = d3
            .select(element)
            .append("div")
            .classed("dropdown", true);
          // add col_id to ensure that the dropdowns are unique
          var menu_id = "hivtrace_node_column_" + payload + "_" + col_id;
          var dropdown_button = dropdown
            .append("button")
            .classed({
              btn: true,
              "btn-default": true,
              "btn-xs": true,
              "dropdown-toggle": true,
            })
            .attr("type", "button")
            .attr("data-toggle", "dropdown")
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

          dropdown_button.append("i").classed({
            fa: true,
            "fa-caret-down": true,
            "fa-lg": true,
          });
          var dropdown_list = dropdown
            .append("ul")
            .classed("dropdown-menu", true)
            .attr("aria-labelledby", menu_id);

          dropdown_list = dropdown_list.selectAll("li").data(
            _.filter(column_ids, (alt) => alt.raw_attribute_key !== n.raw_attribute_key)
          );
          dropdown_list.enter().append("li");
          dropdown_list.each(function (data, i) {
            var handle_change = d3
              .select(this)
              .append("a")
              .attr("href", "#")
              .text((data) => get_text_label(data.raw_attribute_key));
            handle_change.on("click", (d) => {
              self.displayed_node_subset[col_id] = d;
              draw_extended_node_table(
                self,
                node_list,
                container,
                extra_columns
              );
            });
          });
          return dropdown;
        },
      })
    );

    if (extra_columns) {
      _.each(extra_columns, (d) => {
        if (d.prepend) {
          table_headers.splice(0, 0, d.description);
        } else {
          table_headers.push(d.description);
        }
      });
    }
    //console.log (self.displayed_node_subset);

    var table_rows = node_data.map((n, i) => {
      var this_row = _.map(n, (cell, c) => {
        let cell_definition = null;

        if (self.displayed_node_subset[c].type === "Date") {
          cell_definition = {
            value: cell,
            format: function (v) {
              if (v === clusterNetwork._networkMissing) {
                return v;
              }
              return clusterNetwork._defaultDateViewFormatSlider(v);
            },
          };
        } else if (self.displayed_node_subset[c].type === "Number") {
          cell_definition = { value: cell, format: d3.format(".2f") };
        }
        if (!cell_definition) {
          cell_definition = { value: cell };
        }

        // this makes the table rendering too slow

        /*if (c === 0 && self._is_CDC_) {
           cell_definition.volatile = true;
           cell_definition.actions = function (item, value) {
            if (!clustersOfInterest.get_editor()) {
                  return null;
            } else {
                  return [
                      {
                          "icon"   : "fa-plus-square",
                          "action" : function (button,v) {
                              if (clustersOfInterest.get_editor()) {
                                  clustersOfInterest.get_editor().append_node_objects (d.children);
                              }
                              return false;
                          },
                          "help"   : "Add to priority set"
                      }
                  ];
              }
          };
        }*/

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

    draw_node_table(
      self,
      null,
      null,
      [table_headers],
      table_rows,
      container,
      'Showing <span class="badge" data-hivtrace-ui-role="table-count-shown">--</span>/<span class="badge" data-hivtrace-ui-role="table-count-total">--</span> network nodes'
    );
  }
};

function draw_node_table(
  self,
  extra_columns,
  node_list,
  headers,
  rows,
  container,
  table_caption
) {
  container = container || nodesTab.getNodeTable();

  if (container) {
    node_list = node_list || self.nodes;

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
                    // parent cluster can't be rendered
                    // because of size restrictions
                    return [n.cluster];
                  }
                  return [
                    !self.clusters[self.cluster_mapping[n.cluster]].collapsed,
                    n.cluster,
                  ];
                } catch {
                  return [-1];
                }
              } else {
                return [n.node_annotation];
              }
            },
            callback: _node_table_draw_buttons,
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

    add_a_sortable_table(
      self,
      container,
      headers,
      rows,
      true,
      table_caption,
      clustersOfInterest.get_editor()
      // rows
    );
  }
};

function draw_cluster_table(self, extra_columns, element, options) {
  var skip_clusters = options && options["no-clusters"];
  var skip_subclusters = !(options && options["subclusters"]);

  element = element || self.cluster_table;

  if (element) {
    var headers = [
      [
        {
          value: __("general")["cluster"] + " ID",
          sort: function (c) {
            return _.map(
              c.value[0].split(clusterNetwork._networkSubclusterSeparator),
              (ss) => _networkDotFormatPadder(Number(ss))
            ).join("|");
          },
          help: "Unique cluster ID",
        },
        {
          value: __("general")["attributes"],
          sort: function (c) {
            c = c.value();
            if (c[4]) {
              // has attributes
              return c[4]["delta"];
            }
            return c[0];
          },
          help: "Visibility in the network tab and other attributes",
        },
        {
          value: __("clusters_tab")["size"],
          sort: "value",
          help: "Number of nodes in the cluster",
        },
      ],
    ];

    if (self.cluster_attributes) {
      headers[0][1]["presort"] = "desc";
    }

    if (self._is_seguro) {
      headers[0].push({
        value: __("clusters_tab")["number_of_genotypes_in_past_2_months"],
        sort: "value",
        help: "# of cases in cluster genotyped in the last 2 months",
      });

      headers[0].push({
        value:
          __("clusters_tab")["scaled_number_of_genotypes_in_past_2_months"],
        sort: "value",
        help: "# of cases in cluster genotyped in the last 2 months divided by the square-root of the cluster size",
      });
    }

    if (!self._is_CDC_) {
      headers[0].push({
        value:
          __("statistics")["links_per_node"] +
          "<br>" +
          __("statistics")["mean"] +
          "[" +
          __("statistics")["median"] +
          ", IQR]",
        html: true,
      });

      headers[0].push({
        value:
          __("statistics")["genetic_distances_among_linked_nodes"] +
          "<br>" +
          __("statistics")["mean"] +
          "[" +
          __("statistics")["median"] +
          ", IQR]",
        help: "Genetic distance among nodes in the cluster",
        html: true,
      });
    }

    if (extra_columns) {
      _.each(extra_columns, (d) => {
        headers[0].push(d.description);
      });
    }

    if (options && options["headers"]) {
      options["headers"](headers);
    }

    var rows = [];

    _.each(self.clusters, (cluster) => {
      function make_row(d, is_subcluster) {
        var this_row = [
          {
            value: [d.cluster_id, is_subcluster, d], //.cluster_id,
            callback: _cluster_table_draw_id,
          },
          {
            value: function () {
              var actual_cluster = is_subcluster ? d.parent_cluster : d;

              return [
                actual_cluster.collapsed,
                actual_cluster.hxb2_linked,
                actual_cluster.match_filter,
                actual_cluster.cluster_id,
                is_subcluster
                  ? null
                  : self.cluster_attributes
                    ? self.cluster_attributes[actual_cluster.cluster_id]
                    : null,
              ];
            },
            callback: _cluster_table_draw_buttons,
            volatile: true,
          },
          {
            value: d.children.length,
          },
        ];

        if (self._is_CDC_) {
          this_row[2].volatile = true;
          this_row[2].actions = function (item, value) {
            if (!clustersOfInterest.get_editor()) {
              return null;
            }
            return [
              {
                icon: "fa-plus",
                action: function (button, v) {
                  if (clustersOfInterest.get_editor()) {
                    clustersOfInterest.get_editor().append_node_objects(
                      d.children
                    );
                  }
                  return false;
                },
                help: "Add to cluster of interest",
              },
            ];
          };
        }

        if (self._is_seguro) {
          this_row.push({
            value: d,
            format: function (d) {
              return _.filter(
                d.children,
                (child) =>
                  d3.time.months(
                    child.patient_attributes["sample_dt"],
                    helpers.getCurrentDate()
                  ).length <= 2
              ).length;
            },
          });

          this_row.push({
            value: d,
            format: function (d) {
              const recent = _.filter(
                d.children,
                (child) =>
                  d3.time.months(
                    child.patient_attributes["sample_dt"],
                    helpers.getCurrentDate()
                  ).length <= 2
              ).length;
              return recent / Math.sqrt(d.children.length);
            },
          });
        }

        if (!self._is_CDC_) {
          this_row.push({
            value: d.degrees,
            format: function (d) {
              try {
                return (
                  clusterNetwork._defaultFloatFormat(d["mean"]) +
                  " [" +
                  clusterNetwork._defaultFloatFormat(d["median"]) +
                  ", " +
                  clusterNetwork._defaultFloatFormat(d["Q1"]) +
                  " - " +
                  clusterNetwork._defaultFloatFormat(d["Q3"]) +
                  "]"
                );
              } catch {
                return "";
              }
            },
          });
          this_row.push({
            value: d.distances,
            format: function (d) {
              try {
                return (
                  clusterNetwork._defaultFloatFormat(d["mean"]) +
                  " [" +
                  clusterNetwork._defaultFloatFormat(d["median"]) +
                  ", " +
                  clusterNetwork._defaultFloatFormat(d["Q1"]) +
                  " - " +
                  clusterNetwork._defaultFloatFormat(d["Q3"]) +
                  "]"
                );
              } catch {
                return "";
              }
            },
          });
        }
        if (extra_columns) {
          _.each(extra_columns, (ed) => {
            this_row.push(ed.generator(d, self));
          });
        }

        return this_row;
      };

      if (!skip_clusters) {
        rows.push(make_row(cluster, false));
      }

      if (!skip_subclusters) {
        _.each(cluster.subclusters, (sub_cluster) => {
          rows.push(make_row(sub_cluster, true));
        });
      }
    });

    add_a_sortable_table(
      self,
      element,
      headers,
      rows,
      true,
      options && options["caption"] ? options["caption"] : null,
      clustersOfInterest.get_editor()
    );
  }
};

export {
  _networkNodeIDField,
  _networkNewNodeMarker,
  add_a_sortable_table,
  filter_parse,
  update_volatile_elements,
  draw_extended_node_table,
  draw_node_table,
  draw_cluster_table,
};