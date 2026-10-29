/**
 * Text that the system generates and PERSISTS (cluster of interest names and
 * descriptions saved to the server) is always written in one canonical form:
 * the English text below. It is never translated at creation time, so that
 * stored records, exports and other clients are not affected by the language
 * of the session that created them and no mixed-language data is stored.
 *
 * It is translated at DISPLAY time only, by `render`, which recognises the
 * canonical templates (anchored) and returns the localised text. Anything else
 * (user typed or edited text) is returned unchanged. Edit inputs must keep
 * showing the stored text, i.e. must not use `render`.
 *
 * `render` returns plain text; callers put it where the stored text was put
 * before (an attribute value, .text()), or _.escape() it for HTML.
 */

/** canonical (persisted) English fragments; do not change or translate */
const MERGED_FROM = "Merged from ";
const MERGED_JOINER = " and ";
const CLONE_OF = "Clone of ";
const AUTO_CREATED = "Automatically created cluster of interest ";
const MIGRATED_TAG = " Migrated to multiple sequences per person cluster";
const MIGRATED_USED = "; used the following sequences ";
const MIGRATED_IGNORED = "; ignored the following sequences ";

/** builders: the only way the canonical text is generated */
const merged_from_description = (names) =>
  MERGED_FROM + names.join(MERGED_JOINER);
const clone_of_description = (name) => CLONE_OF + name;
const auto_created_description = (name) => AUTO_CREATED + name;

function fill(template, vars) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(vars || {}, k) ? String(vars[k]) : m
  );
}

/** split "A and B and C" into names; known (existing) names containing the
 *  joiner are matched first so that they are not cut in the middle */
function split_names(list, known) {
  const names = (known || []).filter((n) => list.indexOf(n) >= 0);
  const walk = (rest) => {
    if (rest === "") return [];
    for (const n of names) {
      if (rest === n) return [n];
      if (rest.startsWith(n + MERGED_JOINER)) {
        const tail = walk(rest.slice(n.length + MERGED_JOINER.length));
        if (tail) return [n].concat(tail);
      }
    }
    return null;
  };
  return walk(list) || list.split(MERGED_JOINER);
}

const re_merged = new RegExp("^" + MERGED_FROM + "([\\s\\S]+)$");
const re_clone = new RegExp("^" + CLONE_OF + "([\\s\\S]+)$");
const re_auto = new RegExp("^" + AUTO_CREATED + "([\\S]+)$");

function render_base(text, known) {
  let m;
  const L = __("coi");
  if ((m = re_auto.exec(text))) {
    return fill(L["auto_created_description"], { name: m[1] });
  }
  if ((m = re_clone.exec(text))) {
    return fill(L["clone_of"], { name: m[1] });
  }
  if ((m = re_merged.exec(text))) {
    return fill(L["merged_from"], {
      names: split_names(m[1], known).join(L["merged_from_joiner"]),
    });
  }
  return text;
}

/**
 * Display form of a persisted, system generated description.
 * @param text  the stored description
 * @param known optional array of existing cluster of interest names (used to
 *              split "Merged from A and B" when a name contains " and ")
 */
function render(text, known) {
  if (typeof text !== "string" || text === "") return text;
  const L = __("coi");
  if (text.indexOf(MIGRATED_TAG) < 0) {
    return render_base(text, known);
  }
  // <base> Migrated to ...; used the following sequences ...; ignored ... [repeated]
  const parts = text.split(MIGRATED_TAG);
  const tail = (s) =>
    s
      .split(MIGRATED_USED)
      .join(L["migrated_used"])
      .split(MIGRATED_IGNORED)
      .join(L["migrated_ignored"]);
  return (
    render_base(parts[0], known) +
    parts
      .slice(1)
      .map((p) => L["migrated_tag"] + tail(p))
      .join("")
  );
}

module.exports = {
  merged_from_description,
  clone_of_description,
  auto_created_description,
  MIGRATED_TAG,
  MIGRATED_USED,
  MIGRATED_IGNORED,
  render,
};
