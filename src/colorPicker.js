/**
 * Creates a color picker input element with a label.

 * @param {string} id - The ID for the color picker input element.
 * @param {Function} colorizer - A colorizer function that maps values to colors.

 * @returns {string} The HTML markup for the color picker input element with the label.
 */

function colorPickerInput(id, colorizer) {
  // set onchange event after template is rendered and returned from this function.
  let colorPicker = `<div class="col-lg-2 hivtrace-color-picker">
    <input type="color" name="${id}" value="${colorizer.category(id)}">
    <label for="${id}">${id}</label>
  </div>`;

  return colorPicker;
}

/**
 * Creates a color picker input element with a label for continuous values.

 * @param {string} id - The ID for the color picker input element.
 * @param {string} color - The initial color value for the color picker.

 * @returns {string} The HTML markup for the color picker input element with the label.
*/

function colorPickerInputContinuous(id, color) {
  // set onchange event after template is rendered and returned from this function.
  let colorPicker = `<div class="col-lg-2 hivtrace-color-picker">
    <input type="color" name="${id.toLowerCase()}" value="${color}">
    <label for="${id.toLowerCase()}">${id}</label>
  </div>`;

  return colorPicker;
}

/**
 * Creates a color stop input element with a label.

 * @param {string} id - The ID for the color stop input element.
 * @param {number} number - The initial value for the color stop.

 * @returns {string} The HTML markup for the color stop input element with the label.
*/

function colorStops(id, number) {
  // set onchange event after template is rendered and returned from this function.
  let colorStops = `<div class="col-lg-2 hivtrace-color-stops">
    <label for="color-stop">${id}</label>
    <input type="number" name="color-stop" value="${number}" min="0" max="20"">
  </div>`;

  return colorStops;
}

export { colorPickerInput, colorPickerInputContinuous, colorStops };
