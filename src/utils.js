function get_ui_element_selector_by_role(role) {
  return ` [data-hivtrace-ui-role='${role}']`;
};

module.exports = {
  get_ui_element_selector_by_role,
};