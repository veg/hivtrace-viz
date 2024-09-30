/**
    A collection of table column definitions 
*/

var d3 = require("d3"),
  _ = require("underscore"),
  clustersOfInterest = require("./clustersOfInterest.js"),
  HTX = require("./hiv_tx_network.js");

/**
    Column definitions for rendered tables
    Each column definition is object-based and has the following components
    
    description:  [this relates to the heading]   
        value (text): the displayed name of the column
        sort (function): a function which takes the value associated with the table cell, and returns a value upon which to sort the column
        help (text):  the text to display in a popover when the user hovers over the column name
    generator: 
        a function that returns a data-driven definition of a cell
        it takes as an argument the value that is associated with a cell
        and returns an object with the following values
            
            html (bool): whether or not the returned value should be rendered as HTML (default is no, i.e. text)
            value: what is the value associated with the cell
            volatile (bool): if set, this cell will be re-rendered under operations which could modify how its displayed (e.g. is a CoI editor open)
            format (function): how to render the cell value
            actions (function): generate context-specific menus for the cell
                                returns null (none) or a vector (definitions of actions)
                                
                    An action is an object with the following fields
                        icon (text): use this font awesome icon 
                        action (function): a function that takes the clicked button and the cell value and does something
                        help (text): the help message to display on hover over the button
                
        
*/

/**
    Secure HIV-TRACE subcluster table columns
*/
function secure_hiv_trace_subcluster_columns(self) {
  return [
    /** definition for the column which shows the #of cases dx'ed within 36 months
         the value is an array, which enumerates the number of connected components of the 0.5% subcluster, which are ALL within 36 month dx, 
         so can be more than one.
         
         The only action is to add the nodes in this subcluster to a CoI editor if open 
         
         Accepts a _self_ argument for transitive closure
         
       */
    {
      description: {
        value: "Cases dx within 36 months",
        sort: function (c) {
          return c.value.length ? c.value[0].length : 0;
        },
        help: "Number of cases diagnosed in the past 36 months connected only through cases diagnosed within the past 36 months",
      },
      generator: function (cluster) {
        return {
          html: true,
          value: cluster.recent_nodes,
          volatile: true,
          format: function (v) {
            v = v || [];
            if (v.length) {
              return _.map(v, (e) => e.length).join(", ");
            }
            return "";
          },
          actions: function (item, value) {
            if (
              !clustersOfInterest.get_editor() ||
              cluster.recent_nodes.length === 0
            ) {
              return null;
            }
            return _.map(cluster.recent_nodes, (c) => {
              const nodeset = new Set(c);
              return {
                icon: "fa-plus",
                action: function (button, v) {
                  if (clustersOfInterest.get_editor()) {
                    clustersOfInterest
                      .get_editor()
                      .append_node_objects(
                        _.filter(
                          cluster.children,
                          (n) => nodeset.has(n.id) && n.priority_flag > 0
                        )
                      );
                  }
                  return false;
                },
                help: "Add to cluster of interest",
              };
            });
          },
        };
      },
    },

    /** definition for the column which shows the #of cases dx'ed within 12 months
         the value is an array, which enumerates the number of connected components of the 0.5% subcluster, which connect through nodes dx'ed 36 month dx, so can be more than one.
         
         The actions are to add the nodes in this subcluster to a CoI editor if open, and to determine if the nodes in this set are already a part of the CoI.
         
       */

    {
      description: {
        value: "Cases dx within 12 months",
        //"value",
        sort: function (c) {
          const v = c.value || [];
          return v.length > 0 ? v[0].length : 0;
        },
        presort: "desc",
        help: "Number of cases diagnosed in the past 12 months connected only through cases diagnosed within the past 36 months",
      },
      generator: function (cluster) {
        const definition = {
          html: true,
          value: cluster.priority_score,
          volatile: true,
          format: function (v) {
            v = v || [];
            if (v.length) {
              var str = _.map(v, (c) => c.length).join(", ");
              if (
                v[0].length >= self.CDC_data["autocreate-priority-set-size"]
              ) {
                var color = "red";
                return "<span style='color:" + color + "'>" + str + "</span>";
              }
              return str;
            }
            return "";
          },
        };

        definition["actions"] = function (item, value) {
          let result = [];

          if (cluster.priority_score.length > 0) {
            result = result.concat(
              _.map(cluster.priority_score, (c) => ({
                icon: "fa-question",
                help:
                  "Do some of these " +
                  c.length +
                  " nodes belong to a cluster of interest?",
                action: function (this_button, cv) {
                  const nodeset = new Set(c);
                  this_button = $(this_button.node());
                  if (this_button.data("popover_shown") !== "shown") {
                    const popover = this_button
                      .popover({
                        sanitize: false,
                        placement: "right",
                        container: "body",
                        html: true,
                        content: HTX.HIVTxNetwork.lookup_form_generator,
                        trigger: "manual",
                      })
                      .on("shown.bs.popover", function (e) {
                        var clicked_object = d3.select(this);
                        var popover_div = d3.select(
                          "#" + clicked_object.attr("aria-describedby")
                        );
                        var list_element = popover_div.selectAll(
                          self.get_ui_element_selector_by_role(
                            "priority-membership-list",
                            true
                          )
                        );

                        list_element.selectAll("li").remove();
                        let check_membership = _.filter(
                          _.map(self.defined_priority_groups, (g) =>
                            //console.log(g);
                            [
                              g.name,
                              _.filter(g.nodes, (n) => nodeset.has(n.name))
                                .length,
                              _.filter(
                                g.partitioned_nodes[1]["new_direct"],
                                (n) => nodeset.has(n.id)
                              ).length,
                              _.filter(
                                g.partitioned_nodes[1]["new_indirect"],
                                (n) => nodeset.has(n.id)
                              ).length,
                            ]
                          ),
                          (gg) => gg[1] + gg[2] + gg[3] > 0
                        );

                        if (check_membership.length === 0) {
                          check_membership = [
                            [
                              "No nodes belong to any cluster of interest or are linked to any of the clusters of interest.",
                            ],
                          ];
                        } else {
                          check_membership = _.map(check_membership, (m) => {
                            let description = "";
                            if (m[1]) {
                              description += " " + m[1] + " nodes belong";
                            }
                            if (m[2]) {
                              description +=
                                (description.length ? ", " : " ") +
                                m[2] +
                                " nodes are directly linked @ " +
                                kGlobals.formats.PercentFormatShort(
                                  self.subcluster_threshold
                                );
                            }
                            if (m[3]) {
                              description +=
                                (description.length ? ", " : " ") +
                                m[3] +
                                " nodes are indirectly linked @ " +
                                kGlobals.formats.PercentFormatShort(
                                  self.subcluster_threshold
                                );
                            }

                            description +=
                              " to cluster of interest <code>" +
                              m[0] +
                              "</code>";
                            return description;
                          });
                        }
                        list_element = list_element
                          .selectAll("li")
                          .data(check_membership);
                        list_element.enter().insert("li");
                        list_element.html((d) => d);
                      });

                    popover.popover("show");
                    this_button.data("popover_shown", "shown");
                    this_button
                      .off("hidden.bs.popover")
                      .on("hidden.bs.popover", function () {
                        $(this).data("popover_shown", "hidden");
                      });
                  } else {
                    this_button.data("popover_shown", "hidden");
                    this_button.popover("destroy");
                  }
                },
              }))
            );
          }

          if (
            clustersOfInterest.get_editor() &&
            cluster.priority_score.length > 0
          ) {
            result = result.concat(
              _.map(cluster.priority_score, (c) => {
                const nodeset = new Set(c);
                return {
                  icon: "fa-plus",
                  action: function (button, v) {
                    if (clustersOfInterest.get_editor()) {
                      clustersOfInterest
                        .get_editor()
                        .append_node_objects(
                          _.filter(
                            cluster.children,
                            (n) =>
                              nodeset.has(n.id) &&
                              (n.priority_flag === 2 || n.priority_flag === 1)
                          )
                        );
                    }
                    return false;
                  },
                  help: "Add to cluster of interest",
                };
              })
            );
          }

          return result;
        };

        return definition;
      },
    },
  ];
}

/**
    Secure HIV-TRACE node table columns
    SLKP: note that this seems to be fully deprecated.
*/

function secure_hiv_trace_node_columns(self) {
  return [
    {
      description: {
        value: "Recent and Rapid",
        sort: "value",
        help: "Is the node a member of a regular or recent & rapid subcluster?",
      },
      generator: function (node) {
        return {
          callback: function (element, payload) {
            //payload = _.filter (payload, function (d) {return d});
            var this_cell = d3.select(element);

            var data_to_use = [
              [payload[0][0], payload[0][1], payload[0][2]],
              [payload[1][0] ? "36 months" : "", payload[1][1]],
              [payload[2][0] ? "12 months" : "", payload[2][1]],
              [
                payload.length > 3 && payload[3][0]
                  ? "Recent cluster >= 3"
                  : "",
                payload.length > 3 ? payload[3][1] : null,
              ],
            ];

            this_cell.selectAll("span").remove();

            _.each(data_to_use, (button_text) => {
              //self.open_exclusive_tab_view (cluster_id)
              if (button_text[0].length) {
                var button_obj = this_cell
                  .append("span")
                  .classed("btn btn-xs btn-node-property", true)
                  .classed(button_text[1], true)
                  .text(button_text[0]);

                if (_.isFunction(button_text[2])) {
                  button_obj.on("click", button_text[2]);
                } else {
                  button_obj.attr("disabled", true);
                }
              }
            });
          },
          value: function () {
            return [
              [
                node.subcluster_label
                  ? "Subcluster " + node.subcluster_label
                  : "",
                "btn-primary",
                node.subcluster_label
                  ? function () {
                      self.view_subcluster(
                        node.subcluster_label,
                        (n) => n.subcluster_label === node.subcluster_label,
                        "Subcluster " + node.subcluster_label
                      );
                    }
                  : null,
              ],

              [node.priority_flag === 3, "btn-warning"],
              [node.priority_flag === 1, "btn-danger"],
              [node.priority_flag === 2, "btn-danger"],
            ];
          },
        };
      },
    },
  ];
}

module.exports = {
  secure_hiv_trace_subcluster_columns,
  secure_hiv_trace_node_columns,
};
