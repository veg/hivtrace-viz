let is_primary_graph;
let ui_container_selector;

function init(is_primary_graph_arg, ui_container_selector_arg) {
  is_primary_graph = is_primary_graph_arg;
  ui_container_selector = ui_container_selector_arg;
}

function get_ui_element_selector_by_role(role) {
  return " [data-hivtrace-ui-role='" + role + "']";
};

module.exports = {
  init,
  get_ui_element_selector_by_role,
};