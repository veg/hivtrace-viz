import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

/**
 * @function handle_attribute_categorical
 * @description Handles the selection of a categorical attribute to be used for node coloring.
 * @param {string} cat_id - The ID of the categorical attribute.
 * @param {boolean} skip_update - If true, skips updating the network visualization.
 * @param {Object} self - The network object.
 * @param {Function} i18n - Translation function.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} HTX - HIVTxNetwork module.
 * @param {Event} [event] - The event object.
 * @returns {void}
 */
export function handle_attribute_categorical(
  cat_id,
  skip_update,
  self,
  i18n,
  kGlobals,
  HTX,
  event
) {
  const graph_data = self.json;
  var set_attr = "None";

  $(self.get_ui_element_selector_by_role("attributes_invert")).hide();

  self.network_svg.selectAll("radialGradient").remove();
  

  [
    ["attributes", false],
    ["attributes_cat", false],
  ].forEach((lbl) => {
    const selector = self.get_ui_element_selector_by_role(lbl[0], lbl[1]);
    if (!selector) return;
    const $menu = $(selector);
    $menu.find("li a").each(function () {
      const $this = $(this);
      const d = d3.select(this).datum();
      if (d && d[1] === cat_id) {
        set_attr = d[0];
        $this.css("font-weight", "bold");
      } else {
        $this.css("font-weight", "");
      }
    });

    $(self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])).html(
      "Color: " + set_attr
    );
  });

  _.each(self.clusters, (the_cluster) => {
    delete the_cluster["gradient"];
    the_cluster["binned_attributes"] = self.stratify(
      self.attribute_cluster_distribution(the_cluster, cat_id)
    );
  });

  self.colorizer["continuous"] = false;

  if (cat_id) {
    if (cat_id in self.networkColorScheme) {
      let cat_data = graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["enum"];
      if (cat_data) {
        cat_data = new Set(_.map(cat_data, (d) => d.toLowerCase()));
      }
      var domain = [],
        range = [];
      _.each(self.networkColorScheme[cat_id], (value, key) => {
        if (cat_data) {
          if (!cat_data.has(key.toLowerCase())) {
            return;
          }
        }
        domain.push(key);
        range.push(value);
      });
      self.colorizer["category"] = d3.scale.ordinal().domain(domain).range(range);
    } else if (
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_scale"]
    ) {
      self.colorizer["category"] = graph_data[kGlobals.network.GraphAttrbuteID][
        cat_id
      ]["color_scale"](graph_data[kGlobals.network.GraphAttrbuteID][cat_id], self);
    } else {
      self.colorizer["category"] = d3.scale.ordinal().range(kGlobals.Categorical);

      var extended_range = _.clone(self.colorizer["category"].range());
      extended_range.push(kGlobals.missing.color);

      self.colorizer["category"].domain(
        _.range(kGlobals.MaximumValuesInCategories + 1)
      );

      self.colorizer["category"].range(extended_range);

      if (
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["stable-ish order"]
      ) {
        self.colorizer["category"] = _.wrap(
          self.colorizer["category"],
          (func, arg) => {
            if (arg === kGlobals.missing.label) {
              return func(kGlobals.MaximumValuesInCategories);
            }

            const ci = graph_data[kGlobals.network.GraphAttrbuteID][cat_id];

            if (ci["reduced_value_range"]) {
              if (!(arg in ci["reduced_value_range"])) {
                arg = kGlobals.network.ReducedValue;
              }
            }

            return func(ci["stable-ish order"][arg]);
          }
        );
      }
    }

    if (graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]) {
      self.colorizer["category"] = _.wrap(
        self.colorizer["category"],
        (func, arg) => {
          if (
            arg in
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
          ) {
            return graph_data[kGlobals.network.GraphAttrbuteID][cat_id][
              "user-defined"
            ][arg];
          }
          return func(arg);
        }
      );
    }

    self.colorizer["category_id"] = cat_id;
    self.colorizer["category_map"] =
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"];

    self.colorizer["category_pairwise"] = self.attribute_pairwise_distribution(
      cat_id,
      self._aux_get_attribute_dimension(cat_id),
      self.colorizer["category_map"]
    );

    self.render_chord_diagram(
      "aux_svg_holder",
      self.colorizer["category_map"],
      self.colorizer["category_pairwise"]
    );
    self.render_binned_table(
      "attribute_table",
      self.colorizer["category_map"],
      self.colorizer["category_pairwise"]
    );
  } else {
    self.colorizer["category"] = null;
    self.colorizer["category_id"] = null;
    self.colorizer["category_pairwise"] = null;
    self.colorizer["category_map"] = null;
    self.render_chord_diagram("aux_svg_holder", null, null);
    self.render_binned_table("attribute_table", null, null);
  }
  if (self.handle_inline_charts) {
    self.handle_inline_charts();
  }

  self.draw_attribute_labels();
  if (!skip_update) {
    self.update(true);
  }
  if (event) {
    event.preventDefault();
  } else if (d3.event) {
    d3.event.preventDefault();
  }

  // Draw color picker for manual override
  self.renderColorPicker(cat_id, "categorical");
}

/**
 * @function handle_attribute_continuous
 * @description Handles the selection of a continuous attribute to be used for node coloring.
 * @param {string} cat_id - The ID of the continuous attribute.
 * @param {Object} self - The network object.
 * @param {Function} i18n - Translation function.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} scatterPlot - ScatterPlot module.
 * @param {Event} [event] - The event object.
 * @returns {void}
 */
export function handle_attribute_continuous(
  cat_id,
  self,
  i18n,
  kGlobals,
  scatterPlot,
  event
) {
  const graph_data = self.json;
  var set_attr = "None";

  self.render_chord_diagram("aux_svg_holder", null, null);
  self.render_binned_table("attribute_table", null, null);

  self.network_svg.selectAll("radialGradient").remove();

  _.each(self.clusters, (the_cluster) => {
    delete the_cluster["binned_attributes"];
    delete the_cluster["gradient"];
  });

  [
    ["attributes", false],
    ["attributes_cat", false],
  ].forEach((lbl) => {
    const selector = self.get_ui_element_selector_by_role(lbl[0], lbl[1]);
    if (!selector) return;
    const $menu = $(selector);
    $menu.find("li a").each(function () {
      const $this = $(this);
      const d = d3.select(this).datum();
      if (d && d[1] === cat_id) {
        set_attr = d[0];
        $this.css("font-weight", "bold");
      } else {
        $this.css("font-weight", "");
      }
    });

    $(self.get_ui_element_selector_by_role(lbl[0] + "_label", lbl[1])).html(
      "Color: " + set_attr
    );
  });

  $(self.get_ui_element_selector_by_role("attributes_invert"))
    .css("display", set_attr === "None" ? "none" : "inline")
    .removeClass("btn-active")
    .addClass("btn-default");

  self.colorizer["continuous"] = true;

  if (cat_id) {
    self.colorizer["category_id"] = cat_id;
    // map values to inverted scale
    const color_stops =
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_stops"] ||
      kGlobals.network.ContinuousColorStops;

    if (graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["color_scale"]) {
      self.colorizer["category"] = graph_data[
        kGlobals.network.GraphAttrbuteID
      ][cat_id]["color_scale"](
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id],
        self
      );

      self.uniqValues[cat_id]["min"] = self.colorizer["category"](color_stops);
      self.uniqValues[cat_id]["max"] = self.colorizer["category"](color_stops);
    } else {
      self.colorizer["category"] = _.wrap(
        d3.scale
          .linear()
          .domain(_.range(kGlobals.network.ContinuousColorStops))
          .range(["#fff7ec", "#7f0000"])
          .interpolate(d3.interpolateRgb),
        (func, arg) => {
          self.uniqValues[cat_id]["min"] = "#fff7ec";
          self.uniqValues[cat_id]["max"] = "#7f0000";

          return func(
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"](arg) *
              (1 / kGlobals.network.ContinuousColorStops)
          );
        }
      );
    }

    if (graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]) {
      // get min and max
      const min =
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
          "min"
        ] || self.uniqValues[cat_id]["min"];
      const max =
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
          "max"
        ] || self.uniqValues[cat_id]["max"];

      self.uniqValues[cat_id]["min"] = min;
      self.uniqValues[cat_id]["max"] = max;

      self.colorizer["category"] = _.wrap(
        d3.scale
          .linear()
          .domain([0, 1])
          .range([min, max])
          .interpolate(d3.interpolateRgb),
        (func, arg) => {
          return func(
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"](arg)
          );
        }
      );
    }

    self.colorizer["category_map"] = null;
    self.colorizer["category_pairwise"] = null;

    _.each(self.clusters, (the_cluster) => {
      the_cluster["gradient"] = self.compute_cluster_gradient(the_cluster, cat_id);
    });

    var points = [];

    _.each(self.edges, (e) => {
      var src = self.attribute_node_value_by_id(
          self.nodes[e.source],
          cat_id,
          true
        ),
        tgt = self.attribute_node_value_by_id(
          self.nodes[e.target],
          cat_id,
          true
        );

      if (src !== kGlobals.missing.label && tgt !== kGlobals.missing.label) {
        points.push({
          x: src,
          y: tgt,
          title:
            self.nodes[e.source].id +
            " (" +
            src +
            ") -- " +
            self.nodes[e.target].id +
            " (" +
            tgt +
            ")",
        });
      }
    });
    $(self.get_ui_element_selector_by_role("aux_svg_holder_enclosed", true)).show();

    scatterPlot.scatterPlot(
      points,
      400,
      400,
      self.get_ui_element_selector_by_role("aux_svg_holder", true),
      {
        x: "Source",
        y: "Target",
      },
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["type"] === "Date"
    );
  } else {
    self.colorizer["category"] = null;
    self.colorizer["category_id"] = null;
    self.colorizer["continuous"] = false;
    self.colorizer["category_pairwise"] = null;
    self.colorizer["category_map"] = null;
  }

  if (self.handle_inline_charts) {
    self.handle_inline_charts();
  }

  self.draw_attribute_labels();
  self.update(true);
  if (event) {
    event.preventDefault();
  } else if (d3.event) {
    d3.event.preventDefault();
  }

  // Draw color picker for manual override
  self.renderColorPicker(cat_id, "continuous");
}

/**
 * @function handle_shape_categorical
 * @description Handles the selection of a categorical attribute to be used for node shapes.
 * @param {string} cat_id - The ID of the categorical attribute.
 * @param {Object} self - The network object.
 * @param {Function} i18n - Translation function.
 * @param {Object} kGlobals - Global constants.
 * @param {Event} [event] - The event object.
 * @returns {void}
 */
export function handle_shape_categorical(cat_id, self, i18n, kGlobals, event) {
  const graph_data = self.json;
  var set_attr = "None";

  ["shapes"].forEach((lbl) => {
    const $menu = $(self.get_ui_element_selector_by_role(lbl));
    $menu.find("li a").each(function () {
      const $this = $(this);
      const d = d3.select(this).datum();
      if (d && d[1] === cat_id) {
        set_attr = d[0];
        $this.css("font-weight", "bold");
      } else {
        $this.css("font-weight", "");
      }
    });

    $(self.get_ui_element_selector_by_role(lbl + "_label")).html(
      i18n("network_tab")["shape"] + ": " + set_attr + ' <span class="caret"></span>'
    );
  });

  if (cat_id) {
    var domain_range = self.check_for_predefined_shapes(self, cat_id);

    var shape_mapper = d3.scale
      .ordinal()
      .domain(domain_range["domain"])
      .range(domain_range["range"]);
    self.node_shaper["id"] = cat_id;
    self.node_shaper["shaper"] = function (d) {
      return shape_mapper(
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"](
          self.attribute_node_value_by_id(d, cat_id)
        )
      );
    };
    self.node_shaper["category_map"] =
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_map"];
  } else {
    self.node_shaper.id = null;
    self.node_shaper.shaper = () => "circle";
    self.node_shaper["category_map"] = null;
  }

  self.draw_attribute_labels();
  self.update(true);
  if (event) {
    event.preventDefault();
  } else if (d3.event) {
    d3.event.preventDefault();
  }
}

/**
 * @function handle_attribute_opacity
 * @description Handles the selection of a continuous attribute to be used for node opacity.
 * @param {string} cat_id - The ID of the continuous attribute.
 * @param {Object} self - The network object.
 * @param {Function} i18n - Translation function.
 * @param {Object} kGlobals - Global constants.
 * @param {Event} [event] - The event object.
 * @returns {void}
 */
export function handle_attribute_opacity(cat_id, self, i18n, kGlobals, event) {
  const graph_data = self.json;
  var set_attr = "None";

  ["opacity"].forEach((lbl) => {
    const $menu = $(self.get_ui_element_selector_by_role(lbl));
    $menu.find("li a").each(function () {
      const $this = $(this);
      const d = d3.select(this).datum();
      if (d && d[1] === cat_id) {
        set_attr = d[0];
        $this.css("font-weight", "bold");
      } else {
        $this.css("font-weight", "");
      }
    });

    $(self.get_ui_element_selector_by_role(lbl + "_label")).html(
      i18n("network_tab")["opacity"] +
        ": " +
        set_attr +
        ' <span class="caret"></span>'
    );
  });

  $(self.get_ui_element_selector_by_role("opacity_invert"))
    .css("display", set_attr === "None" ? "none" : "inline")
    .removeClass("btn-active")
    .addClass("btn-default");

  self.colorizer["opacity_id"] = cat_id;
  if (cat_id) {
    var scale = graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["scale"];
    self.colorizer["opacity_scale"] = d3.scale
      .linear()
      .domain([0, kGlobals.network.ContinuousColorStops - 1])
      .range([0.25, 1]);
    self.colorizer["opacity"] = function (v) {
      if (v === kGlobals.missing.label) {
        return kGlobals.missing.opacity;
      }
      return self.colorizer["opacity_scale"](scale(v));
    };
  } else {
    self.colorizer["opacity"] = null;
    self.colorizer["opacity_scale"] = null;
  }

  self.draw_attribute_labels();
  self.update(true);
  if (event) {
    event.preventDefault();
  } else if (d3.event) {
    d3.event.preventDefault();
  }
}
