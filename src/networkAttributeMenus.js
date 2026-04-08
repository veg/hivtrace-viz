import _ from "underscore";
import * as d3 from "d3";
import $ from "jquery";

/**
 * @function aux_populate_category_menus
 * @description Populates categorical, shape, and continuous attribute menus.
 * @param {Set} subset - An optional subset of attributes to include.
 * @param {Object} self - The network object.
 * @param {Function} i18n - Translation function.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} HTX - HIVTxNetwork module.
 * @param {boolean} button_bar_ui - Controls menu population.
 * @returns {void}
 */
export function aux_populate_category_menus(
  subset,
  self,
  i18n,
  kGlobals,
  HTX,
  button_bar_ui
) {
  if (button_bar_ui) {
    const graph_data = self.json;
    // decide if the variable can be considered categorical by examining its range

    //console.log ("self._aux_populate_category_menus");
    var valid_cats = _.filter(
      _.map(
        graph_data[kGlobals.network.GraphAttrbuteID],
        self._aux_populate_category_fields
      ),
      (d, k) => {
        return (
          d.discrete &&
          "value_range" in d &&
          !d["_hidden_"] &&
          (!subset || subset.has(d["raw_attribute_key"]))
        );
      }
    );

    var valid_shapes = _.filter(
      valid_cats,
      (d) =>
        (!subset || subset.has(d["raw_attribute_key"])) &&
        ((d.discrete && d.dimension <= 7) ||
          (d["raw_attribute_key"] in self.networkShapeScheme && !d["_hidden_"]))
    );

    // sort values alphabetically for consistent coloring

    _.each([valid_cats, valid_shapes], (list) => {
      _.each(list, self._aux_process_category_values);
    });

    var valid_scales = _.filter(
      _.map(graph_data[kGlobals.network.GraphAttrbuteID], (d, k) => {
        let color_stops = _.get(
          self.json,
          [kGlobals.network.GraphAttrbuteID, k, "color_stops"],
          kGlobals.network.ContinuousColorStops
        );

        function determine_scaling(d, values, scales) {
          var low_var = Infinity;
          d["value_range"] = d3.extent(values);
          _.each(scales, (scl, i) => {
            var bins = _.map(_.range(color_stops), () => 0);
            scl.range([0, color_stops - 1]).domain(d["value_range"]);

            let N = values.length;
            while (N--) {
              bins[~~scl(values[N])]++; // truncate the value
            }

            var mean = values.length / color_stops;
            var vrnc = _.reduce(bins, (p, c) => p + (c - mean) * (c - mean));

            if (vrnc < low_var) {
              low_var = vrnc;
              d["scale"] = scl;
            }
          });
        }

        d["raw_attribute_key"] = k;

        if (d.type === "Number" || d.type === "Number-categories") {
          var values = [];

          let N = self.json.Nodes.length;
          while (N--) {
            const v = self.attribute_node_value_by_id(
              self.json.Nodes[N],
              k,
              d.type === "Number"
            );
            if (_.isNumber(v)) {
              values.push(v);
            }
          }
          // automatically determine the scale and see what spaces the values most evenly
          const range = d3.extent(values);

          const scales_to_consider = [d3.scale.linear()];

          if (!d.is_integer) {
            if (range[0] > 0) {
              scales_to_consider.push(d3.scale.log());
            }
            if (range[0] >= 0) {
              scales_to_consider.push(d3.scale.pow().exponent(1 / 3));
              scales_to_consider.push(d3.scale.pow().exponent(1 / 4));
              scales_to_consider.push(d3.scale.pow().exponent(1 / 2));
              scales_to_consider.push(d3.scale.pow().exponent(1 / 8));
              scales_to_consider.push(d3.scale.pow().exponent(1 / 16));
            }
          }
          determine_scaling(d, values, scales_to_consider);
        } else if (d.type === "Date") {
          values = _.filter(
            _.map(graph_data.Nodes, (nd) => {
              try {
                var a_date = self.attribute_node_value_by_id(nd, k);
                HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                  nd,
                  k,
                  self.parse_dates(a_date)
                );
              } catch (err) {
                if (a_date === "REDACTED" && self.isMJCNetwork) {
                  HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                    nd,
                    k,
                    "REDACTED"
                  );
                } else {
                  HTX.HIVTxNetwork.inject_attribute_node_value_by_id(
                    nd,
                    k,
                    kGlobals.missing.label
                  );
                }
              }
              return self.attribute_node_value_by_id(nd, k);
            }),
            (v) => (v === kGlobals.missing.label ? null : v)
          );
          // automatically determine the scale and see what spaces the values most evenly
          if (values.length === 0) {
            // invalid scale
            return {};
          }

          determine_scaling(d, values, [d3.time.scale()]);
        }
        return d;
      }),
      (d) =>
        (d.type === "Number" ||
          d.type === "Date" ||
          d.type === "Number-categories") &&
        !d["_hidden_"]
    );

    const _menu_label_gen = (d) =>
      (d["annotation"] ? "[" + d["annotation"] + "] " : "") + d["label"];

    [
      d3.select(self.get_ui_element_selector_by_role("attributes")),
      d3.select(self.get_ui_element_selector_by_role("attributes_cat")),
    ].forEach((m) => {
      if (!m || m.empty()) {
        return;
      }
      m.selectAll("li").remove();

      var menu_items = [
        [["None", null, _.partial(self.handle_attribute_categorical, null)]],
        [[i18n("network_tab")["categorical"], "heading", null]],
      ].concat(
        valid_cats.map((d, i) => [
          [
            _menu_label_gen(d),
            d["raw_attribute_key"],
            _.partial(self.handle_attribute_categorical, d["raw_attribute_key"]),
          ],
        ])
      );

      if (valid_scales.length) {
        menu_items = menu_items
          .concat([[[i18n("network_tab")["continuous"], "heading", null]]])
          .concat(
            valid_scales.map((d, i) => [
              [
                _menu_label_gen(d),
                d["raw_attribute_key"],
                _.partial(self.handle_attribute_continuous, d["raw_attribute_key"]),
              ],
            ])
          );
      }

      var menu_li = m.selectAll("li").data(menu_items);
      menu_li.enter().append("li");

      var menu_links = menu_li.selectAll("a").data((d) => d);
      menu_links.enter().append("a");
      menu_links.exit().remove();

      menu_links
        .each(function (d) {
          if (d[1] === "heading") {
            const $this = $(this);
            const parent = $this.parent();
            $this.remove();
            parent.append($("<h6 class='dropdown-header'></h6>").text(d[0]));
          }
        })
        .filter((d) => d[1] !== "heading")
        .classed("dropdown-item", true)
        .attr("href", "#")
        .attr(
          "style",
          "color: #212529 !important; text-decoration: none !important;"
        )
        .on("click", (d) => {
          if (d3.event) d3.event.preventDefault();
          if (d[2]) d[2].call();
        })
        .html((d, i, j) => {
          let htm = d[0];
          let type = "unknown";
          if (d[1] in self.schema) {
            type = self.schema[d[1]].type;
          }
          if (d[1] in self.uniqs && type === "String") {
            htm +=
              '<span title="Number of unique values" class="badge bg-secondary float-end">' +
              self.uniqs[d[1]] +
              "</span>";
          }
          return htm;
        })
        .style("font-weight", (d, i, j) => (j === 0 ? "bold" : null));
    });

    [d3.select(self.get_ui_element_selector_by_role("shapes"))].forEach((m) => {
      if (m.empty()) return;
      m.selectAll("li").remove();
      var menu_items = [
        [["None", null, _.partial(self.handle_shape_categorical, null)]],
      ].concat(
        valid_shapes.map((d, i) => [
          [
            _menu_label_gen(d),
            d["raw_attribute_key"],
            _.partial(self.handle_shape_categorical, d["raw_attribute_key"]),
          ],
        ])
      );

      var menu_li = m.selectAll("li").data(menu_items);
      menu_li.enter().append("li");

      var menu_links = menu_li.selectAll("a").data((d) => d);
      menu_links.enter().append("a");
      menu_links.exit().remove();

      menu_links
        .classed("dropdown-item", true)
        .attr("href", "#")
        .attr(
          "style",
          "color: #212529 !important; text-decoration: none !important;"
        )
        .on("click", (d) => {
          if (d3.event) d3.event.preventDefault();
          if (d[2]) d[2].call();
        })
        .html((d, i, j) => {
          let htm = d[0];
          let type = "unknown";
          if (_.contains(_.keys(self.schema), d[1])) {
            type = self.schema[d[1]].type;
          }
          if (_.contains(_.keys(self.uniqs), d[1]) && type === "String") {
            htm +=
              '<span title="Number of unique values" class="badge bg-secondary float-end">' +
              self.uniqs[d[1]] +
              "</span>";
          }
          return htm;
        })
        .style("font-weight", (d, i, j) => (j === 0 ? "bold" : null));
    });
    $(self.get_ui_element_selector_by_role("opacity_invert"))
      .off("click")
      .on("click", function (e) {
        if (self.colorizer["opacity_scale"]) {
          self.colorizer["opacity_scale"].range(
            self.colorizer["opacity_scale"].range().reverse()
          );
          self.update(true);
          self.draw_attribute_labels();
        }
        $(this).toggleClass("active");
      });

    $(self.get_ui_element_selector_by_role("attributes_invert"))
      .off("click")
      .on("click", function (e) {
        if (self.colorizer["category_id"]) {
          graph_data[kGlobals.network.GraphAttrbuteID][
            self.colorizer["category_id"]
          ]["scale"].range(
            graph_data[kGlobals.network.GraphAttrbuteID][
              self.colorizer["category_id"]
            ]["scale"]
              .range()
              .reverse()
          );
          self.clusters.forEach((the_cluster) => {
            the_cluster["gradient"] = self.compute_cluster_gradient(
              the_cluster,
              self.colorizer["category_id"]
            );
          });
          self.update(true);
          self.draw_attribute_labels();
        }
        $(this).toggleClass("active");
      });

    [d3.select(self.get_ui_element_selector_by_role("opacity"))].forEach((m) => {
      if (m.empty()) return;
      m.selectAll("li").remove();
      var menu_items = [
        [["None", null, _.partial(self.handle_attribute_opacity, null)]],
      ].concat(
        valid_scales.map((d, i) => [
          [
            d["label"],
            d["raw_attribute_key"],
            _.partial(self.handle_attribute_opacity, d["raw_attribute_key"]),
          ],
        ])
      );

      var menu_li = m.selectAll("li").data(menu_items);
      menu_li.enter().append("li");

      var menu_links = menu_li.selectAll("a").data((d) => d);
      menu_links.enter().append("a");
      menu_links.exit().remove();

      menu_links
        .classed("dropdown-item", true)
        .attr("href", "#")
        .attr(
          "style",
          "color: #212529 !important; text-decoration: none !important;"
        )
        .on("click", (d) => {
          if (d3.event) d3.event.preventDefault();
          if (d[2]) d[2].call();
        })
        .text((d) => d[0])
        .style("font-weight", (d, i, j) => (j === 0 ? "bold" : null));
    });
  }
}

/**
 * @function aux_populate_category_fields
 * @description Populates category fields for a given attribute.
 * @param {Object} d - The attribute object.
 * @param {string} k - The key of the attribute.
 * @param {Object} self - The network object.
 * @param {Object} kGlobals - Global constants.
 * @returns {Object} The updated attribute object.
 */
export function aux_populate_category_fields(d, k, self, kGlobals) {
  const graph_data = self.json;
  d["raw_attribute_key"] = k;
  if (!("label" in d)) {
    d["label"] = k;
  }
  d.discrete = false;

  if ("enum" in d) {
    d.discrete = true;
    d["value_range"] = new Set(d["enum"]);
    d["value_range"].add(kGlobals.missing.label);

    if (
      _.every(graph_data.Nodes, (nd) =>
        d["value_range"].has(self.attribute_node_value_by_id(nd, k))
      )
    ) {
      d["value_range"] = _.clone(d["enum"]);
      if (!(kGlobals.missing.label in d["value_range"])) {
        d["value_range"].push(kGlobals.missing.label);
      }
      d["dimension"] = d["value_range"].length;
      d["no-sort"] = true;
      return d;
    }
  }

  if (d["type"] === "String") {
    d.discrete = true;
    d["value_range"] = new Set();

    graph_data.Nodes.forEach((nd) => {
      d["value_range"].add(self.attribute_node_value_by_id(nd, k));
    });

    d["value_range"] = [...d["value_range"]];
    d["dimension"] = d["value_range"].length;
  }
  return d;
}

/**
 * @function aux_get_attribute_dimension
 * @description Gets the dimension of a categorical attribute.
 * @param {string} cat_id - The ID of the categorical attribute.
 * @param {Object} self - The network object.
 * @param {Object} kGlobals - Global constants.
 * @returns {number} The dimension of the attribute.
 */
export function aux_get_attribute_dimension(cat_id, self, kGlobals) {
  const graph_data = self.json;
  if (cat_id in graph_data[kGlobals.network.GraphAttrbuteID]) {
    const cinfo = graph_data[kGlobals.network.GraphAttrbuteID][cat_id];
    if ("reduced_value_range" in cinfo) {
      return _.size(cinfo["reduced_value_range"]);
    }
    return cinfo.dimension;
  }
  return 0;
}

/**
 * @function aux_process_category_values
 * @description Processes the values of a categorical attribute, creating a value map and a stable-ish order.
 * @param {Object} d - The attribute object.
 * @param {Object} self - The network object.
 * @param {Object} kGlobals - Global constants.
 * @returns {Object} The updated attribute object.
 */
export function aux_process_category_values(d, self, kGlobals) {
  var values,
    reduced_range = null;

  delete d["reduced_value_range"];
  if (d["no-sort"]) {
    values = d["value_range"];
  } else if (d["type"] === "String") {
    values = d["value_range"].sort();

    if (d.dimension > kGlobals.MaximumValuesInCategories) {
      const compressed_values = _.chain(self.nodes)
        .countBy((node) =>
          self.attribute_node_value_by_id(node, d["raw_attribute_key"])
        )
        .pairs()
        .sortBy((d) => -d[1])
        .value();

      reduced_range = [];
      let i = 0;
      while (
        reduced_range.length < kGlobals.MaximumValuesInCategories - 1 &&
        i < compressed_values.length
      ) {
        if (compressed_values[i][0] !== kGlobals.missing.label) {
          reduced_range.push(compressed_values[i][0]);
        }
        i++;
      }
      reduced_range = reduced_range.sort();
      reduced_range.push(kGlobals.network.ReducedValue);
    }

    var string_hash = function (str) {
      var hash = 5801;
      for (var ci = 0; ci < str.length; ci++) {
        var charCode = str.charCodeAt(ci);
        hash = (hash << (5 + hash)) + charCode;
      }
      return hash;
    };

    const use_these_values = reduced_range || values;

    var hashed = _.map(use_these_values, string_hash);
    var available_keys = {};
    var reindexed = {};

    for (var i = 0; i < kGlobals.MaximumValuesInCategories; i++) {
      available_keys[i] = true;
    }

    _.each(hashed, (value, index) => {
      if (value < 0) {
        value = -value;
      }

      var first_try = value % kGlobals.MaximumValuesInCategories;
      if (first_try in available_keys) {
        reindexed[use_these_values[index]] = first_try;
        delete available_keys[first_try];
        return;
      }

      var second_try =
        Math.floor(value / kGlobals.MaximumValuesInCategories) %
        kGlobals.MaximumValuesInCategories;
      if (second_try in available_keys) {
        reindexed[use_these_values[index]] = second_try;
        delete available_keys[second_try];
        return;
      }

      var last_resort = parseInt(_.keys(available_keys).sort()[0]);
      reindexed[use_these_values[index]] = last_resort;
      delete available_keys[last_resort];
    });

    d["stable-ish order"] = reindexed;
  } else {
    values = d["value_range"];
  }

  var map = {};

  if (reduced_range) {
    const rrl = _.object(_.map(_.pairs(reduced_range), (d) => [d[1], d[0]]));

    _.each(values, (d2, i) => {
      if (d2 in rrl) {
        map[d2] = rrl[d2];
      } else {
        map[d2] = rrl[kGlobals.network.ReducedValue];
      }
    });

    d["reduced_value_range"] = rrl;
    d["value_map"] = function (v, key) {
      if (key) {
        return key === "lookup" ? _.invert(rrl) : rrl;
      }
      return map[v];
    };
  } else {
    _.each(values, (d2, i) => {
      map[d2] = i;
    });

    d["value_map"] = function (v, key) {
      if (key) {
        return key === "lookup" ? _.invert(map) : map;
      }
      return map[v];
    };
  }

  return d;
}
