let is_primary_graph;
let ui_container_selector;

function init(is_primary_graph_arg, ui_container_selector_arg) {
  is_primary_graph = is_primary_graph_arg;
  ui_container_selector = ui_container_selector_arg;
}

// TODO: consolidate with other utility / helper function files
function get_ui_element_selector_by_role(role, not_nested) {
  if (not_nested && !is_primary_graph) {
    return undefined;
  }
  return (
    (not_nested ? "" : "#" + ui_container_selector) +
    " [data-hivtrace-ui-role='" +
    role +
    "']"
  );
};

module.exports = {
  init,
  get_ui_element_selector_by_role,
};