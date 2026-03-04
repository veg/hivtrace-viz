import _ from "underscore";
import { hivtrace_cluster_depthwise_traversal } from "./misc";

/**
 * @function annotate_priority_clusters
 * @description Annotates clusters with priority flags based on date and membership criteria.
 * @param {string} date_field - The field in the node object representing the date.
 * @param {number} span_months - The number of months for the long cutoff.
 * @param {number} recent_months - The number of months for the short cutoff.
 * @param {Date} start_date - The starting date for the annotation.
 * @param {Object} self - The network object.
 * @param {Object} timeDateUtil - Time/date utility module.
 * @param {Object} kGlobals - Global constants.
 * @param {Object} helpers - Helper functions.
 * @returns {void}
 */
export function annotate_priority_clusters(
  date_field,
  span_months,
  recent_months,
  start_date,
  self,
  timeDateUtil,
  kGlobals,
  helpers
) {
  /*
        values for priority_flag
            0: 0.5% subcluster
            1: last 12 months NOT in a priority cluster
            2: last 12 month IN priority cluster
            3: in priority cluster but not in 12 months
            4-7 is only computed for start dates different from the network date
            4: date present but is in the FUTURE compared to start_date
            5: date present but is between 1900 and start_date
            6: date missing
            7: in 0.5% cluster 12<dx<36 months but not a CoI


        SLKP 20221128:
            Add a calculation for simple classification of priority clusters

            0: not in a national priority CoI
            1: IN a national priority CoI ≤12 months
            2: IN a national priority CoI 12 - 36 months
            3: IN a national priority CoI >36 months
    */

  try {
    start_date = start_date || self.get_reference_date();

    var cutoff_long = timeDateUtil.n_months_ago(start_date, span_months);
    var cutoff_short = timeDateUtil.n_months_ago(start_date, recent_months);

    var node_iterator;

    if (start_date === self.today) {
      node_iterator = self.nodes;
    } else {
      var beginning_of_time = timeDateUtil.getCurrentDate();
      beginning_of_time.setYear(1900);
      node_iterator = [];
      _.each(self.nodes, (node) => {
        var filter_result = self.filter_by_date(
          beginning_of_time,
          date_field,
          start_date,
          node
          //true
        );
        if (_.isUndefined(filter_result)) {
          node.priority_flag = 6;
        } else if (filter_result) {
          node.priority_flag = 5;
          node_iterator.push(node);
        } else {
          node.priority_flag = 4;
        }
      });
    }

    // extract all clusters at once to avoid inefficiencies of multiple edge-set traversals

    var split_clusters = {};
    var node_id_to_local_cluster = {};

    // reset all annotations

    _.each(node_iterator, (node) => {
      node.nationalCOI = 0;
      if (node.cluster) {
        if (!(node.cluster in split_clusters)) {
          split_clusters[node.cluster] = { Nodes: [], Edges: [] };
        }
        node_id_to_local_cluster[node.id] =
          split_clusters[node.cluster]["Nodes"].length;
        split_clusters[node.cluster]["Nodes"].push(node);
      }
    });

    _.each(self.edges, (edge) => {
      if (edge.length <= self.subcluster_threshold) {
        var edge_cluster = self.nodes[edge.source].cluster;

        var source_id = self.nodes[edge.source].id;
        var target_id = self.nodes[edge.target].id;

        if (
          source_id in node_id_to_local_cluster &&
          target_id in node_id_to_local_cluster
        ) {
          var copied_edge = _.clone(edge);

          copied_edge.source = node_id_to_local_cluster[source_id];
          copied_edge.target = node_id_to_local_cluster[target_id];

          split_clusters[edge_cluster]["Edges"].push(copied_edge);
        }
      }
    });

    const cluster_id_match =
      self.precomputed_subclusters &&
      self.subcluster_threshold in self.precomputed_subclusters
        ? self.precomputed_subclusters
        : null;

    _.each(split_clusters, (cluster_nodes, cluster_index) => {
      /** extract subclusters; all nodes at given threshold */
      /** Sub-Cluster: all nodes connected at 0.005 subs/site; there can be multiple sub-clusters per cluster */

      //var cluster_nodes       = self.extract_single_cluster (cluster.children, null, true);

      var array_index = self.cluster_mapping[cluster_index];

      self.clusters[array_index].priority_score = 0;

      var edges = [];

      /** all clusters with more than one member connected at 'threshold' edge length */
      /** 20241031 SLKP
            Here, if there's more than one sequence per entity,
            additional filtering will take place to NOT retain
            sub-clusters that are comprised entirely of sequences from the same entity
        **/

      let null_subcluster_filter = (cc) => {
        return cc.length > 1;
      };

      if (self.has_multiple_sequences) {
        null_subcluster_filter = (cc) => {
          return self.unique_entity_list(cc).length > 1;
        };
      }

      var subclusters = _.filter(
        hivtrace_cluster_depthwise_traversal(
          cluster_nodes.Nodes,
          cluster_nodes.Edges,
          null,
          edges
        ),
        null_subcluster_filter
      );

      /** all edge sets with more than one edge */
      edges = _.filter(edges, (es) => es.length > 1);

      /** sort subclusters by oldest node */
      _.each(subclusters, (c, i) => {
        c.sort((n1, n2) => self.oldest_nodes_first(n1, n2));
      });

      subclusters.sort((c1, c2) => self.oldest_nodes_first(c1[0], c2[0]));

      let next_id = subclusters.length + 1;

      subclusters = _.map(subclusters, (c, i) => {
        let subcluster_id = i + 1;

        if (cluster_id_match) {
          const precomputed_values = {};
          _.each(c, (n) => {
            if ("subcluster" in n) {
              var sub_at_k = _.find(
                n.subcluster,
                (t) => t[0] === self.subcluster_threshold
              );
              if (sub_at_k) {
                precomputed_values[
                  sub_at_k[1].split(kGlobals.SubclusterSeparator)[1]
                ] = 1;
                return;
              }
            }

            precomputed_values[null] = 1;
          });

          if (
            null in precomputed_values ||
            _.keys(precomputed_values).length !== 1
          ) {
            subcluster_id = next_id++;
          } else {
            subcluster_id = _.keys(precomputed_values)[0];
          }

          /*if ((i+1) !== 0 + subcluster_id) {
                console.log (self.clusters[array_index].cluster_id, i, "=>", subcluster_id, _.keys(precomputed_values));
             }*/
        }

        var label =
          self.clusters[array_index].cluster_id +
          kGlobals.SubclusterSeparator +
          subcluster_id;

        _.each(c, (n) => {
          //if (!("subcluster_label" in n)) {
          n.subcluster_label = label;
          //}
          n.priority_flag = 0;
        });

        return {
          children: _.clone(c),
          parent_cluster: self.clusters[array_index],
          cluster_id: label,
          distances: helpers.describe_vector(
            _.map(edges[i], (e) => e.length)
          ),
        };
      });

      _.each(subclusters, (c) => {
        self.compute_cluster_degrees(c);
      });

      self.clusters[array_index].subclusters = subclusters;

      /** now, for each subcluster, extract the recent and rapid part */

      /** Recent & Rapid (National Priority) Cluster: the part of the Sub-Cluster inferred using only cases diagnosed in the previous 36 months
                and at least two cases dx-ed in the previous 12 months; there is a path between all nodes in a National Priority Cluster

            20180406 SLKP: while unlikely, this definition could result in multiple National Priority clusters
            per subclusters; for now we will add up all the cases for prioritization, and
            display the largest National Priority cluster if there is more than one
        */

      _.each(subclusters, (sub) => {
        // extract nodes based on dates

        const date_filter = (n) =>
          self.filter_by_date(cutoff_long, date_field, start_date, n);

        var subcluster_json = self.extract_single_cluster(
          _.filter(sub.children, date_filter),
          null,
          true,
          cluster_nodes
        );

        var rr_cluster = _.filter(
          hivtrace_cluster_depthwise_traversal(
            subcluster_json.Nodes,
            _.filter(
              subcluster_json.Edges,
              (e) => e.length <= self.subcluster_threshold
            )
          ),
          (cc) => cc.length > 1
        );

        sub.rr_count = rr_cluster.length;

        rr_cluster.sort((a, b) => b.length - a.length);

        sub.priority_score = [];
        sub.recent_nodes = [];

        const future_date = new Date(start_date.getTime() + 1e13);

        _.each(rr_cluster, (recent_cluster) => {
          var priority_nodes = _.groupBy(recent_cluster, (n) =>
            self.filter_by_date(cutoff_short, date_field, start_date, n)
          );

          sub.recent_nodes.push(_.map(recent_cluster, (n) => n.id));
          const meets_priority_def =
            true in priority_nodes &&
            priority_nodes[true].length >=
              (self.CDC_data
                ? self.CDC_data["autocreate-priority-set-size"]
                : 3);

          if (true in priority_nodes) {
            // recent
            sub.priority_score.push(_.map(priority_nodes[true], (n) => n.id));
            _.each(priority_nodes[true], (n) => {
              n.priority_flag = self.filter_by_date(
                start_date,
                date_field,
                future_date,
                n
              )
                ? 4
                : 1;

              if (meets_priority_def) {
                if (n.priority_flag === 1) {
                  n.priority_flag = 2;
                }
                n.nationalCOI = 1;
              }
            });
          }

          if (false in priority_nodes) {
            // not recent
            _.each(priority_nodes[false], (n) => {
              n.priority_flag = 3;

              if (meets_priority_def) {
                if (
                  self.filter_by_date(cutoff_long, date_field, start_date, n)
                ) {
                  n.nationalCOI = 2;
                } else {
                  n.nationalCOI = 3;
                }
              } else {
                n.priority_flag = 7;
              }
            });
          }
        });

        //console.log (sub.recent_nodes);
        self.clusters[array_index].priority_score = sub.priority_score;
      });
    });
  } catch (err) {
    console.log(err);
  }
}
