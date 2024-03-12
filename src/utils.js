// TODO: consolidate with other utility / helper function files
function get_ui_element_selector_by_role(role, not_nested) {
  if (not_nested && !self.primary_graph) {
    return undefined;
  }
  return (
    (not_nested ? "" : "#" + self.ui_container_selector) +
    " [data-hivtrace-ui-role='" +
    role +
    "']"
  );
};

module.exports = {
  get_ui_element_selector_by_role
};