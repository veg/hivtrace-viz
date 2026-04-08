import _ from "underscore";
import * as d3 from "d3";

/**
 * @function render_binned_table
 * @description Renders a table with binned data.
 */
export function render_binned_table(id, the_map, matrix, self, kGlobals, misc) {
  var the_table = d3.select(self.get_ui_element_selector_by_role(id, true));
  if (the_table.empty()) {
    return;
  }

  the_table.selectAll("thead").remove();
  the_table.selectAll("tbody").remove();

  d3.select(
    self.get_ui_element_selector_by_role(id + "_enclosed", true)
  ).style("display", matrix ? null : "none");

  if (matrix) {
    var fill = self.colorizer["category"];
    var lookup = the_map(null, "lookup");

    var headers = the_table
      .append("thead")
      .append("tr")
      .selectAll("th")
      .data([""].concat(matrix[0].map((d, i) => lookup[i])));

    headers.enter().append("th");
    headers
      .html((d) => "<span>&nbsp;" + d + "</span>")
      .each(function (d, i) {
        if (i) {
          d3.select(this)
            .insert("i", ":first-child")
            .classed("fa fa-circle", true)
            .style("color", () => fill(d));
        }
      });

    if (self.show_percent_in_pairwise_table) {
      var sum = _.map(matrix, (row) => _.reduce(row, (p, c) => p + c, 0));

      matrix = _.map(matrix, (row, row_index) =>
        _.map(row, (c) => c / sum[row_index])
      );
    }

    var rows = the_table
      .append("tbody")
      .selectAll("tr")
      .data(matrix.map((d, i) => [lookup[i]].concat(d)));

    rows.enter().append("tr");
    rows
      .selectAll("td")
      .data((d) => d)
      .enter()
      .append("td")
      .html((d, i) => {
        if (i === 0) {
          return "<span>&nbsp;" + d + "</span>";
        } else if (self.show_percent_in_pairwise_table) {
          return kGlobals.formats.PercentFormat(d);
        }

        return d;
      })
      .each(function (d, i) {
        if (i === 0) {
          d3.select(this)
            .insert("i", ":first-child")
            .classed("fa fa-circle", true)
            .style("color", () => fill(d));
        }
      });
  }
}

/**
 * @function render_chord_diagram
 * @description Renders a chord diagram to visualize relationships between categories.
 */
export function render_chord_diagram(id, the_map, matrix, self) {
  var container = d3.select(self.get_ui_element_selector_by_role(id, true));

  if (container.empty()) {
    return;
  }

  container.selectAll("svg").remove();

  d3.select(
    self.get_ui_element_selector_by_role(id + "_enclosed", true)
  ).style("display", matrix ? null : "none");

  if (matrix) {
    var lookup = the_map(null, "lookup");

    var svg = container.append("svg");

    var chord = d3.layout
      .chord()
      .padding(0.05)
      .sortSubgroups(d3.descending)
      .matrix(matrix);

    var text_offset = 20,
      width = 450,
      height = 450,
      innerRadius = Math.min(width, height - text_offset) * 0.41,
      outerRadius = innerRadius * 1.1;

    var fill = self.colorizer["category"],
      font_size = 12;

    var text_label = svg
      .append("g")
      .attr(
        "transform",
        "translate(" + width / 2 + "," + (height - text_offset) + ")"
      )
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", font_size)
      .text("");

    svg = svg
      .attr("width", width)
      .attr("height", height - text_offset)
      .append("g")
      .attr(
        "transform",
        "translate(" + width / 2 + "," + (height - text_offset) / 2 + ")"
      );

    // Returns an event handler for fading a given chord group.
    const fade = function (opacity, t) {
      return function (g, i) {
        text_label.text(t ? lookup[i] : "");
        svg
          .selectAll(".chord path")
          .filter((d) => d.source.index !== i && d.target.index !== i)
          .transition()
          .style("opacity", opacity);
      };
    };

    svg
      .append("g")
      .selectAll("path")
      .data(chord.groups)
      .enter()
      .append("path")
      .style("fill", (d) => fill(lookup[d.index]))
      .style("stroke", (d) => fill(lookup[d.index]))
      .attr(
        "d",
        d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius)
      )
      .on("mouseover", fade(0.1, true))
      .on("mouseout", fade(1, false));

    svg
      .append("g")
      .attr("class", "chord")
      .selectAll("path")
      .data(chord.chords)
      .enter()
      .append("path")
      .attr("d", d3.svg.chord().radius(innerRadius))
      .style("fill", (d) => fill(d.target.index))
      .style("opacity", 1);
  }
}

/**
 * @function attribute_pairwise_distribution
 * @description Computes the pairwise distribution of an attribute for the edges in the network.
 */
export function attribute_pairwise_distribution(
  id,
  dim,
  the_map,
  only_expanded,
  draw_me,
  self
) {
  var scan_from = only_expanded ? draw_me.edges : self.edges;
  var the_matrix = [];
  for (var i = 0; i < dim; i += 1) {
    the_matrix.push([]);
    for (var j = 0; j < dim; j += 1) {
      the_matrix[i].push(0);
    }
  }

  _.each(scan_from, (edge) => {
    //console.log (self.attribute_node_value_by_id(self.nodes[edge.source], id), self.attribute_node_value_by_id(self.nodes[edge.target], id));
    the_matrix[
      the_map(self.attribute_node_value_by_id(self.nodes[edge.source], id))
    ][
      the_map(self.attribute_node_value_by_id(self.nodes[edge.target], id))
    ] += 1;
  });
  // check if there are null values

  var haz_null = the_matrix.some((d, i) => {
    if (i === dim - 1) {
      return d.some((d2) => d2 > 0);
    }
    return d[dim - 1] > 0;
  });
  if (!haz_null) {
    the_matrix.pop();
    for (let i = 0; i < dim - 1; i += 1) {
      the_matrix[i].pop();
    }
  }

  // symmetrize the matrix

  dim = the_matrix.length;

  for (let i = 0; i < dim; i += 1) {
    for (let j = i; j < dim; j += 1) {
      the_matrix[i][j] += the_matrix[j][i];
      the_matrix[j][i] = the_matrix[i][j];
    }
  }

  return the_matrix;
}

/**
 * @function extract_network_time_series
 * @description Extracts a time series from the network data based on a given time attribute.
 */
export function extract_network_time_series(
  time_attr,
  other_attributes,
  node_filter,
  self
) {
  var use_these_nodes = node_filter
    ? _.filter(self.nodes, node_filter)
    : self.nodes;

  var result = _.map(use_these_nodes, (node) => {
    var series = {
      time: self.attribute_node_value_by_id(node, time_attr),
    };
    if (other_attributes) {
      _.each(other_attributes, (attr, key) => {
        series[attr] = self.attribute_node_value_by_id(node, key);
      });
    }
    return series;
  });

  result.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time === b.time) return 0;
    return 1;
  });

  return result;
}

/**
 * @function stratify
 * @description Stratifies an array of values into a sorted array of unique values and their counts.
 */
export function stratify(array) {
  if (array) {
    var dict = {},
      stratified = [];

    array.forEach((d) => {
      if (d in dict) {
        dict[d] += 1;
      } else {
        dict[d] = 1;
      }
    });
    for (var uv in dict) {
      stratified.push([uv, dict[uv]]);
    }
    return stratified.sort((a, b) => a[0] - b[0]);
  }
  return array;
}
