import _ from "underscore";
import * as d3 from "d3";

/**
 * @function distance_gate_options
 * @description Returns an options object for the distance gate view, including edge styling and an extra menu.
 * @param {number} threshold - The genetic distance threshold.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} misc - Miscellaneous utility functions.
 * @returns {Object} The options object.
 */
export function distance_gate_options(threshold, kGlobals, misc) {
  threshold = threshold || 0.005;

  return {
    "edge-styler": function (element, d, network) {
      var e_type = misc.edge_typer(
        d,
        network.edge_types,
        network.edge_cluster_threshold
      );
      if (e_type !== "") {
        d3.select(element).style(
          "stroke",
          network._edge_colorizer(
            misc.edge_typer(
              d,
              network.edge_types,
              network.edge_cluster_threshold
            )
          )
        ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));
      }
      d.is_hidden = !network.shown_types[e_type];
      d3.select(element).style("stroke-width", "4px");
    },

    init_code: function (network) {
      function style_edge(type) {
        this.style("stroke-width", "5px");
        if (type.length) {
          this.style("stroke", network._edge_colorizer(type)); //.style ("stroke-dasharray", network._edge_dasher (type));
        } else {
          this.classed("link", true);
          var def_color = this.style("stroke");
          this.classed("link", null);
          this.style("stroke", def_color);
        }
      }

      network.update_cluster_threshold_display = (T) => {
        network.edge_cluster_threshold = T;
        network.edge_types = [
          "≤" + network.edge_cluster_threshold,
          ">" + network.edge_cluster_threshold,
        ];

        network._edge_colorizer = d3.scale
          .ordinal()
          .range(kGlobals.EdgeColorBase)
          .domain(network.edge_types);
        //network._edge_dasher   = _edge_dasher;
        network.shown_types = _.object(
          _.map(network.edge_types, (d) => [d, 1])
        );
        network.edge_legend = {
          caption: "Links by distance",
          types: {},
        };

        _.each(network.shown_types, (ignore, t) => {
          if (t.length) {
            network.edge_legend.types[t] = _.partial(style_edge, t);
          }
        });
      };

      network.update_cluster_threshold_display(threshold);
    },

    extra_menu: {
      title: "Additional options",
      items: [
        [
          function (network, item) {
            //console.log(network.edge_cluster_threshold);
            var enclosure = item.append("div").classed("form-group", true);
            enclosure
              .append("label")
              .text("Genetic distance threshold ")
              .classed("control-label", true);
            enclosure
              .append("input")
              .classed("form-control", true)
              .attr("value", String(network.edge_cluster_threshold))
              .on("change", function (e) {
                //d3.event.preventDefault();
                if (this.value) {
                  const newT = parseFloat(this.value);
                  if (_.isNumber(newT) && newT > 0.0 && newT < 1) {
                    network.update_cluster_threshold_display(newT);
                    network.draw_attribute_labels();
                    network.update(true);
                    enclosure
                      .classed("has-success", true)
                      .classed("has-error", false);
                    return;
                  }
                }

                enclosure
                  .classed("has-success", false)
                  .classed("has-error", true);
              })
              .on("click", (e) => {
                d3.event.stopPropagation();
              });
          },
          null,
        ],
      ],
    },
  };
}

/**
 * @function social_view_options
 * @description Returns an options object for the social network view, including edge styling and an extra menu.
 * @param {Array<string>} labeled_links - An array of labels for the links.
 * @param {Object} shown_types - An object specifying which edge types are shown.
 * @param {Function} edge_typer - A function that returns the type of an edge.
 * @param {Object} kGlobals - Global constants.
 * @returns {Object} The options object.
 */
export function social_view_options(
  labeled_links,
  shown_types,
  edge_typer,
  kGlobals
) {
  edge_typer =
    edge_typer ||
    function (e) {
      return _.has(e, "edge_type") ? e["edge_type"] : "";
    };

  return {
    //"simplified-mspp" : self.has_multiple_sequences,
    "edge-styler": function (element, d, network) {
      var e_type = edge_typer(d);
      if (e_type !== "") {
        d3.select(element).style(
          "stroke",
          network._edge_colorizer(edge_typer(d))
        ); //.style ("stroke-dasharray", network._edge_dasher (d["edge_type"]));

        d.is_hidden = !network.shown_types[e_type];
      } else {
        d.is_hidden = !network.shown_types[""];
      }
      d3.select(element).style("stroke-width", "5px");
    },

    init_code: function (network) {
      function style_edge(type) {
        this.style("stroke-width", "5px");
        if (type.length) {
          this.style("stroke", network._edge_colorizer(type)); //.style ("stroke-dasharray", network._edge_dasher (type));
        } else {
          this.classed("link", true);
          var def_color = this.style("stroke");
          this.classed("link", null);
          this.style("stroke", def_color);
        }
      }

      var edge_types = _.keys(shown_types);
      edge_types.sort();

      network._edge_colorizer = d3.scale
        .ordinal()
        .range(kGlobals.CategoricalBase)
        .domain(edge_types);
      //network._edge_dasher   = _edge_dasher;
      network.shown_types = _.clone(shown_types);
      network.edge_legend = {
        caption: "Network links",
        types: {},
      };

      _.each(network.shown_types, (ignore, t) => {
        if (t.length) {
          network.edge_legend.types[t] = _.partial(style_edge, t);
        } else {
          network.edge_legend.types["Molecular links"] = _.partial(
            style_edge,
            t
          );
        }
      });
    },

    extra_menu: {
      title: "Additional options",
      items: _.map(labeled_links, (edge_class) => [
        function (network, element) {
          function toggle_element() {
            network.shown_types[edge_class] = !network.shown_types[edge_class];
            checkbox.attr(
              "checked",
              network.shown_types[edge_class] ? "" : null
            );
            network.update(true);
          }

          var link;

          if (edge_class.length) {
            link = element
              .append("a")
              .text(edge_class + " links")
              .style("color", network._edge_colorizer(edge_class))
              .on("click", toggle_element);
          } else {
            link = element
              .append("a")
              .text("Molecular links")
              .on("click", toggle_element);
          }
          var checkbox = link
            .append("input")
            .attr("type", "checkbox")
            .attr("checked", "");
        },
      ]),
    },
  };
}
