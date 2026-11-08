/*
  Formula-safe cells for the CSV downloads built in the browser.

  Same rule as the server's CSV exports: a text cell that starts with
  = + - @ (or a tab or carriage return) is prefixed with an apostrophe so a
  spreadsheet does not run it as a formula. A cell that is a plain number
  (a distance, a degree, -1) is left as it is.
 */
var FORMULA_START = /^[=+\-@\t\r]/;
var PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

function safeCell(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (PLAIN_NUMBER.test(value)) {
    return value;
  }
  return FORMULA_START.test(value) ? "'" + value : value;
}

// rows: an array of objects or an array of arrays, as d3.csv.format takes.
// Returns a copy with every cell (and every object key, which is the header)
// made safe.
function safeRows(rows) {
  return rows.map(function (row) {
    if (Array.isArray(row)) {
      return row.map(safeCell);
    }
    if (row && typeof row === "object" && !(row instanceof Date)) {
      var out = {};
      Object.keys(row).forEach(function (k) {
        out[safeCell(k)] = safeCell(row[k]);
      });
      return out;
    }
    return safeCell(row);
  });
}

module.exports = { safeCell: safeCell, safeRows: safeRows };
