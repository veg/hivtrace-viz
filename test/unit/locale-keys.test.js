const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "..");
const srcDir = path.join(root, "src");
const localesDir = path.join(root, "node_modules", "hivtrace-locales");

function sourceFiles(dir) {
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory()
      ? sourceFiles(p)
      : p.endsWith(".js")
      ? [p]
      : [];
  });
}

// Literal keys used as __("statistics")["key"] anywhere in src
function usedStatisticsKeys() {
  const keys = new Set();
  const re = /__\(\s*["']statistics["']\s*\)\s*\[\s*["']([A-Za-z0-9_]+)["']\s*\]/g;
  sourceFiles(srcDir).forEach((f) => {
    const text = fs.readFileSync(f, "utf8");
    let m;
    while ((m = re.exec(text))) keys.add(m[1]);
  });
  return [...keys].sort();
}

const used = usedStatisticsKeys();

test("the viz uses some statistics keys", () => {
  assert.ok(used.length > 5);
  assert.ok(used.includes("genetic_distance_percent"));
});

["en", "es"].forEach((lang) => {
  test("locales (" + lang + ") define every statistics key the viz uses", () => {
    const locale = JSON.parse(
      fs.readFileSync(path.join(localesDir, lang + ".json"), "utf8")
    );
    const stats = locale.statistics || {};
    const missing = used.filter(
      (k) => typeof stats[k] !== "string" || stats[k].trim() === ""
    );
    assert.deepStrictEqual(missing, [], "missing in " + lang + ": " + missing);
  });
});

// Every literal __("section")["key"] in src
function usedKeys() {
  const keys = new Set();
  const re = /__\(\s*["']([A-Za-z0-9_]+)["']\s*\)\s*\[\s*["']([A-Za-z0-9_]+)["']\s*\]/g;
  sourceFiles(srcDir).forEach((f) => {
    const text = fs.readFileSync(f, "utf8");
    let m;
    while ((m = re.exec(text))) keys.add(m[1] + "." + m[2]);
  });
  return [...keys].sort();
}

// Added in this branch; the code has English fallbacks until hivtrace-locales
// ships them. Remove from this list when the locales are bumped.
const PENDING = new Set(["clusters_tab.collapse", "coi.overlap_cluster"]);

const usedAll = usedKeys();

["en", "es"].forEach((lang) => {
  test("locales (" + lang + ") define every key the viz uses", () => {
    const locale = JSON.parse(
      fs.readFileSync(path.join(localesDir, lang + ".json"), "utf8")
    );
    const missing = usedAll.filter((k) => {
      if (PENDING.has(k)) return false;
      const [sec, key] = k.split(".");
      const v = (locale[sec] || {})[key];
      return typeof v !== "string" || v.trim() === "";
    });
    assert.deepStrictEqual(missing, [], "missing in " + lang + ": " + missing);
  });
});
