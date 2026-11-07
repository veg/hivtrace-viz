// Edge lengths are stored as fractions; the statistics tab shows percent.
function lengthsAsPercent(lengths) {
  return lengths.map(function (l) {
    return typeof l === "number" ? l * 100 : l;
  });
}

module.exports = { lengthsAsPercent: lengthsAsPercent };
