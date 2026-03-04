import * as d3 from "d3";

/**
 * Initializes network scales and constants.
 * @param {Object} self - The HIVTxNetwork instance.
 */
export function initializeNetworkScales(self) {
  self.l_scale = 5000; // link scale
  self.max_points_to_render = 1536;
  self.max_nodes_to_show = 4096;
  self.singletons = 0;
  self.gravity_scale = d3.scale
    .pow()
    .exponent(0.5)
    .domain([1, 100000])
    .range([0.1, 0.15]);
  self.link_scale = d3.scale.pow().exponent(1.25).clamp(true).domain([0, 0.1]);
}
