import * as d3 from "d3";
import _ from "underscore";
import * as kGlobals from "./globals.js";
import * as timeDateUtil from "./timeDateUtil.js";
import * as misc from "./misc.js";

/**
 * Checks for predefined shape schemes for a given category and returns the domain and range for the shape scale.
 * @param {Object} self - The HIVTxNetwork instance.
 * @param {string} cat_id - The category ID to check.
 * @returns {Object} An object containing the domain and range for the shape scale.
 */
export function check_for_predefined_shapes(self, cat_id) {
  const graph_data = self.json;
  if (cat_id in self.networkShapeScheme) {
    var domain = _.range(
      0,
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_range"].length
    );

    return {
      domain: domain,
      range: _.map(
        domain,
        (v) =>
          self.networkShapeScheme[cat_id][
            graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["value_range"][
              v
            ]
          ]
      ),
    };
  }
  return {
    domain: _.range(
      0,
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id].dimension
    ),
    range: kGlobals.ShapeOrdering,
  };
}

/**
 * Draws the legend for the current color, shape, and opacity attributes.
 * @param {Object} self - The HIVTxNetwork instance.
 * @returns {void}
 */
export function draw_attribute_labels(self) {
  const graph_data = self.json;

  var determine_label_format_cont = function (field_data) {
    if ("label_format" in field_data) {
      return field_data["label_format"];
    }
    if (field_data["type"] === "Date") {
      return timeDateUtil.DateViewFormatShort;
    }
    return d3.format(",.4r");
  };

  self.legend_svg.selectAll("g.hiv-trace-legend").remove();

  var offset = 10;

  if (self.legend_caption) {
    self.legend_svg
      .append("g")
      .attr("transform", "translate(0," + offset + ")")
      .classed("hiv-trace-legend", true)
      .append("text")
      .text(self.legend_caption)
      .style("font-weight", "bold");
    offset += 18;
  }

  if (
    self.legend_multiple_sequences &&
    self.rendered_object_counts &&
    self.rendered_object_counts["nodes"] > 0
  ) {
    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(3," + (offset + 5) + ")")
      .append("circle")
      .attr("cx", "6")
      .attr("cy", "-4")
      .attr("r", "6")
      .classed("multi_sequence", true)
      .style("fill", "none");
    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(20," + (offset + 5) + ")")
      .append("text")
      .text("Represents >1 sequence");
    offset += 24;
  }

  if (self.rendered_object_counts && self.rendered_object_counts.has_hatching) {
    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(0," + offset + ")")
      .append("circle")
      .attr("cx", "8")
      .attr("cy", "-4")
      .attr("r", "8")
      .classed("legend", true)
      .style("fill", "url(#" + self.generate_cross_hatch_pattern("#cab") + ")");
    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(20," + offset + ")")
      .append("text")
      .text("Contains sequences in >1 cluster/subcluster");
    offset += 24;
  }

  if (self.edge_legend) {
    self.legend_svg
      .append("g")
      .attr("transform", "translate(0," + offset + ")")
      .classed("hiv-trace-legend", true)
      .append("text")
      .text(self.edge_legend["caption"])
      .style("font-weight", "bold");
    offset += 18;

    _.each(self.edge_legend["types"], (value, key) => {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text(key);

      value.call(
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("line")
          .attr("x1", "0")
          .attr("y1", "-4")
          .attr("x2", "12")
          .attr("y2", "-4")
          .classed("legend", true)
      );

      offset += 18;
    });
  }

  if (self.colorizer["category_id"]) {
    self.legend_svg
      .append("g")
      .attr("transform", "translate(0," + offset + ")")
      .classed("hiv-trace-legend", true)
      .append("text")
      .text(
        "Color: " +
          self.json[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ].label
      )
      .style("font-weight", "bold");
    offset += 18;

    if (self.colorizer["continuous"]) {
      var anchor_format = determine_label_format_cont(
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]
      );

      var color_stops =
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]["color_stops"] || kGlobals.network.ContinuousColorStops;

      var scale =
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]["scale"];

      _.each(_.range(color_stops), (value) => {
        var x = scale.invert(value);
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(anchor_format(x));
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", self.colorizer["category"](x));
        offset += 18;
      });

      if (
        "category_values" in
        graph_data[kGlobals.network.GraphAttrbuteID][
          self.colorizer["category_id"]
        ]
      ) {
        _.each(
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]["category_values"],
          (value) => {
            self.legend_svg
              .append("g")
              .classed("hiv-trace-legend", true)
              .attr("transform", "translate(20," + offset + ")")
              .append("text")
              .text(value);
            self.legend_svg
              .append("g")
              .classed("hiv-trace-legend", true)
              .attr("transform", "translate(0," + offset + ")")
              .append("circle")
              .attr("cx", "8")
              .attr("cy", "-4")
              .attr("r", "8")
              .classed("legend", true)
              .style("fill", self.colorizer["category"](value));

            offset += 18;
          }
        );
      }

      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text("missing");
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("circle")
        .attr("cx", "8")
        .attr("cy", "-4")
        .attr("r", "8")
        .classed("legend", true)
        .style("fill", kGlobals.missing.color);

      offset += 18;
    } else {
      _.each(self.colorizer["category_map"](null, "map"), (value, key) => {
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(20," + offset + ")")
          .append("text")
          .text(key);
        self.legend_svg
          .append("g")
          .classed("hiv-trace-legend", true)
          .attr("transform", "translate(0," + offset + ")")
          .append("circle")
          .attr("cx", "8")
          .attr("cy", "-4")
          .attr("r", "8")
          .classed("legend", true)
          .style("fill", self.colorizer["category"](key));

        offset += 18;
      });
    }
  }

  if (self.node_shaper["id"]) {
    self.legend_svg
      .append("g")
      .attr("transform", "translate(0," + offset + ")")
      .classed("hiv-trace-legend", true)
      .append("text")
      .text(
        "Shape: " +
          self.json[kGlobals.network.GraphAttrbuteID][self.node_shaper["id"]]
            .label
      )
      .style("font-weight", "bold");
    offset += 18;

    var domain_range = check_for_predefined_shapes(
      self,
      self.node_shaper["id"]
    );
    var shape_mapper = d3.scale
      .ordinal()
      .domain(domain_range["domain"])
      .range(domain_range["range"]);

    _.each(self.node_shaper["category_map"](null, "map"), (value, key) => {
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text(key);

      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("path")
        .attr("transform", "translate(5,-5)")
        .attr("d", misc.symbol(shape_mapper(value)).size(128))
        .classed("legend", true)
        .style("fill", "none");

      offset += 18;
    });
  }

  if (self.colorizer["opacity_id"]) {
    self.legend_svg
      .append("g")
      .attr("transform", "translate(0," + offset + ")")
      .classed("hiv-trace-legend", true)
      .append("text")
      .text(
        __("network_tab")["opacity"] +
          ": " +
          self.json[kGlobals.network.GraphAttrbuteID][
            self.colorizer["opacity_id"]
          ].label
      )
      .style("font-weight", "bold");
    offset += 18;

    var anchor_format_opacity = determine_label_format_cont(
      graph_data[kGlobals.network.GraphAttrbuteID][self.colorizer["opacity_id"]]
    );

    var scale_opacity =
      graph_data[kGlobals.network.GraphAttrbuteID][
        self.colorizer["opacity_id"]
      ]["scale"];

    _.each(_.range(kGlobals.network.ContinuousColorStops), (value) => {
      var x = scale_opacity.invert(value);
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(20," + offset + ")")
        .append("text")
        .text(anchor_format_opacity(x));
      self.legend_svg
        .append("g")
        .classed("hiv-trace-legend", true)
        .attr("transform", "translate(0," + offset + ")")
        .append("circle")
        .attr("cx", "8")
        .attr("cy", "-4")
        .attr("r", "8")
        .classed("legend", true)
        .style("fill", "black")
        .style("opacity", self.colorizer["opacity"](x));

      offset += 18;
    });

    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(20," + offset + ")")
      .append("text")
      .text("missing");
    self.legend_svg
      .append("g")
      .classed("hiv-trace-legend", true)
      .attr("transform", "translate(0," + offset + ")")
      .append("circle")
      .attr("cx", "8")
      .attr("cy", "-4")
      .attr("r", "8")
      .classed("legend", true)
      .style("fill", "black")
      .style("opacity", kGlobals.missing.opacity);

    offset += 18;
  }
}
