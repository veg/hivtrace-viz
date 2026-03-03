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
        .classed("alert alert-info alert-dismissible", true)
        .style("font-size", "150%")
        .text(
          "Please define some search criteria to find and display information on persons in the network. By default, no persons are displayed."
        )
        .append("button")
        .classed("close", true)
        .attr("data-dismiss", "alert")
        .append("span")
        .html("&times;");

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
    });

    d3.select($(self.node_search_div).get(0))
      .selectAll(".group-conditions")
      .selectAll("label")
      .classed("btn-primary", false)
      .classed("btn-default", true);

    $(self.node_search_div).on(
      "afterInit.queryBuilder afterSetRules.queryBuilder afterAddGroup.queryBuilder",
      function () {
        d3.select($(self.node_search_div).get(0))
          .selectAll(".group-conditions")
          .selectAll("label")
          .classed("btn-primary", false)
          .classed("btn-default", true);
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
