import _ from "underscore";
/** Replace {{name}} placeholders in a locale string; unknown placeholders are left as they are. */
function fill(template, vars) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    _.has(vars || {}, k) ? String(vars[k]) : m
  );
}
/** labels[key] when count === 1, else labels[key + "_plural"] (or labels[key]); fills {{count}} and vars. Same rule as misc.results_notes. */
function plural(labels, key, count, vars) {
  const t = count === 1 ? labels[key] : labels[key + "_plural"] || labels[key];
  return fill(t, _.extend({ count: count }, vars));
}
export { fill, plural };
