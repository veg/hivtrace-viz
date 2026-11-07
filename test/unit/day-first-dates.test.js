const test = require("node:test");
const assert = require("node:assert");

// timeDateUtil reads the language through the build-time __() helper
global.__ = () => "en";
const { DateFormats } = require("../../src/timeDateUtil.js");

const parse = (s) => {
  for (const f of DateFormats) {
    const d = f.parse(s);
    if (d) return d;
  }
  return null;
};
const ymd = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");

test("d/m/yyyy and dd/mm/yyyy are read day first", () => {
  assert.strictEqual(ymd(parse("03/04/2023")), "2023-4-3");
  assert.strictEqual(ymd(parse("3/4/2023")), "2023-4-3");
  assert.strictEqual(ymd(parse("13/01/2023")), "2023-1-13");
  assert.strictEqual(ymd(parse("01/12/2023")), "2023-12-1");
  assert.strictEqual(ymd(parse("31/12/2022")), "2022-12-31");
  assert.strictEqual(ymd(parse("29/02/2024")), "2024-2-29");
});

test("impossible day-first dates do not parse", () => {
  ["31/02/2023", "29/02/2023", "00/01/2023", "12/13/2023", "32/01/2023"].forEach(
    (s) => assert.strictEqual(parse(s), null, s)
  );
});

test("ISO and YYYYMMDD still parse, junk still does not", () => {
  assert.strictEqual(parse("2023-04-03").toISOString(), "2023-04-03T00:00:00.000Z");
  assert.strictEqual(ymd(parse("20230403")), "2023-4-3");
  assert.strictEqual(parse("notadate"), null);
});
