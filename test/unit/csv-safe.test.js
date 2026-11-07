const test = require("node:test");
const assert = require("node:assert");
const { safeCell, safeRows } = require("../../src/csvSafe.js");
const { lengthsAsPercent } = require("../../src/distanceUnits.js");

test("formula starts get an apostrophe", () => {
  ["=1+1", "+cmd", "-cmd", "@SUM(1)", "\t=1", "\r=1", "+34 600 000 000"].forEach(
    (v) => assert.strictEqual(safeCell(v), "'" + v)
  );
});

test("plain numbers and ordinary text are unchanged", () => {
  ["-1", "0.012", "-0.5", "+3", "1e-3", "abc", "", "a=b"].forEach((v) =>
    assert.strictEqual(safeCell(v), v)
  );
  assert.strictEqual(safeCell(-1), -1);
  assert.strictEqual(safeCell(null), null);
});

test("rows of objects and arrays are made safe, headers too", () => {
  const out = safeRows([{ id: "=A1", d: "-1", "@x": "ok" }, ["=1", "b", -2]]);
  assert.deepStrictEqual(out[0], { id: "'=A1", d: "-1", "'@x": "ok" });
  assert.deepStrictEqual(out[1], ["'=1", "b", -2]);
});

test("distances are scaled to percent", () => {
  const out = lengthsAsPercent([0.004, 0.012, undefined]);
  assert.ok(Math.abs(out[0] - 0.4) < 1e-9);
  assert.ok(Math.abs(out[1] - 1.2) < 1e-9);
  assert.strictEqual(out[2], undefined);
});
