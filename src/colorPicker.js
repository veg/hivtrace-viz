function colorPickerInput(id, colorizer) {
  // set onchange event after template is rendered and returned from this function.
  let colorPicker = `<div class="col-lg-2 hivtrace-color-picker">
    <input type="color" name="${id}" value="${colorizer.category(id)}">
    <label for="${id}">${id}</label>
  </div>`;

  return colorPicker;
}

function colorPickerInputContinuous(id, color) {
  // set onchange event after template is rendered and returned from this function.
  let colorPicker = `<div class="col-lg-2 hivtrace-color-picker">
    <input type="color" name="${id.toLowerCase()}" value="${color}">
    <label for="${id.toLowerCase()}">${id}</label>
  </div>`;

  return colorPicker;
}

function colorStops(id, number) {
  // set onchange event after template is rendered and returned from this function.
  let colorStops = `<div class="col-lg-2 hivtrace-color-stops">
    <label for="color-stop">${id}</label>
    <input type="number" name="color-stop" value="${number}" min="0" max="20"">
  </div>`;

  return colorStops;
}

exports.colorPickerInput = colorPickerInput;
exports.colorPickerInputContinuous = colorPickerInputContinuous;
exports.colorStops = colorStops;
