import * as d3 from "d3";
import _ from "underscore";
import $ from "jquery";

/**
 * Processes a single search condition against a value.
 * @param {*} value - The value to check.
 * @param {Object} condition - The search condition.
 * @returns {boolean} True if the value meets the condition, false otherwise.
 */
export function process_search_field(value, condition) {
  switch (condition.type) {
    case "string": {
      if (!value) value = "";
      value = value.toLowerCase();
      switch (condition.operator) {
        case "equal":
          return value == condition.value;
        case "not equal":
          return value != condition.value;
        case "contains":
          return value.indexOf(condition.value) >= 0;
        case "begins_with":
          return value.indexOf(condition.value) == 0;
        case "ends_with":
          return (
            value.indexOf(condition.value) ==
            Math.max(0, value.length - condition.value.length)
          );
        case "is_not_empty":
          return value.length > 0;
        case "is_empty":
          return value.length == 0;
      }
      break;
    }
    case "date":
    case "integer":
    case "double": {
      if (!value) return false;
      switch (condition.operator) {
        case "equal":
          return value == condition.value;
        case "not equal":
          return value != condition.value;
        case "less":
          return value < condition.value;
        case "less_or_equal":
          return value <= condition.value;
        case "greater":
          return value > condition.value;
        case "greater_or_equal":
          return value >= condition.value;
        case "between":
          return value >= condition.value[0] && value <= condition.value[1];
      }
      break;
    }
  }
  return false;
}

/**
 * Processes a set of search rules against a data object.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} data - The data object to check.
 * @param {Object} rules - The search rules.
 * @returns {boolean} True if the data object meets the search criteria, false otherwise.
 */
export function process_search(self, data, rules) {
  let rule_results;
  if (rules.rules) {
    rule_results = _.map(rules.rules, (r) => {
      return process_search(self, data, r);
    });
  } else {
    return process_search_field(
      self.attribute_node_value_by_id(data, rules.id, rules.type == "number"),
      rules
    );
  }

  if (rules.condition == "AND") {
    rule_results = _.every(rule_results, (d) => d);
  } else if (rules.condition == "OR") {
    rule_results = _.some(rule_results, (d) => d);
  } else {
    rule_results = false;
  }

  return rules.not ? !rule_results : rule_results;
}

/**
 * Converts string values in search rules to lowercase.
 * @param {Object} rules - The search rules to process.
 * @param {Object} timeDateUtil - The time/date utility module.
 * @returns {void}
 */
export function rule_lc(rules, timeDateUtil) {
  if (rules.rules) {
    _.each(rules.rules, (r) => {
      rule_lc(r, timeDateUtil);
    });
  } else {
    if (rules.value) {
      if (rules.type == "string") {
        rules.value = rules.value.toLowerCase();
      } else if (rules.type == "date") {
        rules.value = timeDateUtil.DateViewNodeSearch.parse(rules.value);
      }
    }
  }
}

/**
 * Defines the node search table using jQuery QueryBuilder.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {Object} context - Contextual variables (kGlobals, timeDateUtil, tables).
 */
export function define_node_search_table(self, context) {
  if (self.isMJCNetwork) {
    return;
  }

  const { kGlobals, timeDateUtil, tables } = context;

  self.node_search_div = self.get_ui_element_selector_by_role(
    "node_search_div",
    true
  );

  if (self.node_search_div && self.is_primary_graph) {
    const compute_type = (t, d) => {
      if (t == "String") return "string";
      if (t == "Number") return d.is_integer ? "integer" : "double";
      if (t == "Date") return "date";
      return "string";
    };

    self.node_search_attributes = self._extract_exportable_attributes(false);

    self.qb_filter_def = _.sortBy(
      _.map(self.node_search_attributes, (d) => {
        let def = {
          id: d.raw_attribute_key,
          label: d.label,
          type: compute_type(d.type, d),
        };

        if (d.enum) {
          def.values = _.map(_.clone(d.enum), (d) => ({
            value: d,
            label: _.escape(d),
          }));
          def.input = "select";
        }

        if (def.type == "date") {
          def.plugin = "datepicker";
          def.plugin_config = {
            format: "yyyy/mm/dd",
            todayBtn: "linked",
            todayHighlight: true,
            autoclose: true,
          };
          def.operators = [
            "equal",
            "not equal",
            "less",
            "less_or_equal",
            "greater",
            "greater_or_equal",
          ];
        } else {
          if (def.type == "string") {
            def.operators = [
              "equal",
              "not equal",
              "contains",
              "begins_with",
              "ends_with",
              "is_empty",
              "is_not_empty",
            ];
          } else if (def.type == "integer" || def.type == "double") {
            def.operators = [
              "equal",
              "not equal",
              "less",
              "less_or_equal",
              "greater",
              "greater_or_equal",
              "between",
            ];
          }
        }
        return def;
      }),
      (d) => d.label
    );

    if (self.nodeFilterObject) {
      try {
        if (_.isEqual(self.nodeFilterObject, self.qb_filter_def)) {
          return;
        }
      } catch (err) {
        console.log(err);
      }
      $(self.node_search_div).queryBuilder("destroy");
      self.nodeFilterObject = null;
      self.aggregate_entity_data = null;
    }

    let query_buttons = d3
      .select(self.node_search_div)
      .selectAll('[data-hivtrace-ui-role="node-selector-search-buttonbar"]');

    if (query_buttons.empty()) {
      d3.select(self.node_search_div)
        .append("div")
        .classed("alert alert-info alert-dismissible fade show", true)
        .style("font-size", "100%")
        .text(
          "Please define some search criteria to find and display information on persons in the network. By default, no persons are displayed."
        )
        .append("button")
        .classed("btn-close", true)
        .attr("type", "button")
        .attr("data-bs-dismiss", "alert")
        .attr("aria-label", "Close");

      query_buttons = d3
        .select(self.node_search_div)
        .append("div")
        .classed("btn-group btn-group-sm", true)
        .attr("data-hivtrace-ui-role", "node-selector-search-buttonbar");
      self.node_query_button_reset = query_buttons
        .append("button")
        .text("Reset")
        .classed("btn btn-warning", true);
      self.node_query_button_search = query_buttons
        .append("button")
        .text("Search")
        .classed("btn btn-primary", true);
    }

    self.nodeFilterObject = _.clone(self.qb_filter_def);

    $(self.node_search_div).queryBuilder({
      plugins: {
        "filter-description": null,
        "bt-tooltip-errors": null,
        "not-group": null,
      },
      filters: self.qb_filter_def,
      allow_groups: true,
      allow_empty: true,
      conditions: ["AND", "OR"],
      display_errors: true,
    });

    d3.select($(self.node_search_div).get(0))
      .selectAll(".group-conditions")
      .selectAll("label")
      .classed("btn-primary", false)
      .classed("btn-outline-secondary", true)
      .classed("btn-sm", true);

    $(self.node_search_div).on(
      "afterInit.queryBuilder afterSetRules.queryBuilder afterAddGroup.queryBuilder",
      function () {
        d3.select($(self.node_search_div).get(0))
          .selectAll(".group-conditions")
          .selectAll("label")
          .classed("btn-primary", false)
          .classed("btn-outline-secondary", true)
          .classed("btn-sm", true);
      }
    );

    if (!self.aggregate_entity_data) {
      self.aggregate_entity_data = self.aggregate_indvidual_level_records();
    }

    self.node_query_button_reset.on("click", () => {
      $(self.node_search_div).queryBuilder("reset");
      self.draw_extended_node_table([], null, null, {
        "no-filter": true,
      });
    });

    self.node_query_button_search.on("click", () => {
      var result = $(self.node_search_div).queryBuilder("getRules");
      if (!$.isEmptyObject(result)) {
        rule_lc(result, timeDateUtil);
        self.draw_extended_node_table(
          _.filter(self.aggregate_entity_data, (d) =>
            process_search(self, d, result)
          ),
          null,
          null,
          { "no-filter": true }
        );
      } else {
        self.draw_extended_node_table([], null, null, {
          "no-filter": true,
        });
      }
    });
  }

  if (self.is_primary_graph) {
    self.draw_extended_node_table([], null, null, { "no-filter": true });
  }
}

/**
 * @function filter
 * @description Filters the network based on a set of conditions, including regular expressions, distance, and date.
 * @param {Object} self - The network object.
 * @param {Array<Object>} conditions - An array of conditions to filter by.
 * @param {boolean} skip_update - If true, skips updating the network visualization after filtering.
 * @param {Object} timeDateUtil - The time/date utility module.
 * @param {Object} kGlobals - Global constants.
 * @returns {void}
 */
export function filter(self, conditions, skip_update, timeDateUtil, kGlobals) {
  var anything_changed = false;

  conditions = _.map(["re", "distance", "date"], (cnd) =>
    _.map(
      _.filter(conditions, (v) => v.type === cnd),
      (v) => (cnd === "distance" ? v : v.value)
    )
  );

  if (conditions[1].length) {
    self.nodes.forEach((n) => {
      n.length_filter = false;
    });

    _.each(self.edges, (e) => {
      var did_match = _.some(conditions[1], (d) =>
        d.greater_than ? e.length >= d.value : e.length < d.value
      );

      if (did_match) {
        self.nodes[e.source].length_filter = true;
        self.nodes[e.target].length_filter = true;
      }
      e.length_filter = did_match;
    });
  } else {
    self.nodes.forEach((n) => {
      n.length_filter = false;
    });
    self.edges.forEach((e) => {
      e.length_filter = false;
    });
  }

  if (conditions[2].length) {
    self.nodes.forEach((n) => {
      var node_T = self.attribute_node_value_by_id(
        n,
        timeDateUtil.getClusterTimeScale()
      );
      n.date_filter = _.some(
        conditions[2],
        (d) => node_T >= d[0] && node_T <= d[1]
      );
    });
  } else {
    self.nodes.forEach((n) => {
      n.date_filter = false;
    });
  }

  self.clusters.forEach((c) => {
    c.match_filter = 0;
  });

  self.edges.forEach((e) => {
    if (e.length_filter) {
      anything_changed = true;
    }
  });

  self.nodes.forEach((n) => {
    var did_match = _.some(
      conditions[0],
      (regexp) =>
        regexp.test(n.id) ||
        _.some(n[kGlobals.network.NodeAttributeID], (attr) =>
          regexp.test(attr)
        )
    );

    did_match = did_match || n.length_filter || n.date_filter;

    if (did_match !== n.match_filter) {
      n.match_filter = did_match;
      anything_changed = true;
    }

    if (n.match_filter && n.parent) {
      n.parent.match_filter += 1;
    }
  });

  if (anything_changed && self.handle_inline_charts) {
    self.handle_inline_charts((n) => n.match_filter);
  }

  if (anything_changed && !skip_update) {
    if (self.hide_unselected) {
      self.filter_visibility();
    }

    self.update(true);
  }
}

/**
 * @function filter_visibility
 * @description Filters the visibility of nodes and clusters based on whether they match the current filter.
 * @param {Object} self - The network object.
 * @returns {void}
 */
export function filter_visibility(self) {
  self.clusters.forEach((c) => {
    c.is_hidden = self.hide_unselected && !c.match_filter;
  });
  self.nodes.forEach((n) => {
    n.is_hidden = self.hide_unselected && !n.match_filter;
  });
}
