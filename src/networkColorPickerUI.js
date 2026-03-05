import _ from "underscore";
import $ from "jquery";

/**
 * @function renderColorPicker
 * @description Renders a color picker for a given category, allowing users to override the default colors.
 */
export function renderColorPicker(cat_id, type, self, graph_data, kGlobals, colorPicker) {
  const renderColorPickerCategorical = function (cat_id) {
    // For each unique value, render item.
    let colorizer = self.colorizer;
    let items = _.map(_.filter(self.uniqValues[cat_id]), (d) =>
      colorPicker.colorPickerInput(d, colorizer)
    );

    $("#colorPickerRow").html(items.join(""));

    // Set onchange event for items
    $(".hivtrace-color-picker").change((e) => {
      let color = e.target.value;
      let name = e.target.name;

      // Set color in user-defined colorizer
      if (
        _.isUndefined(
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
        )
      ) {
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"] =
          {};
      }

      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
        name
      ] = color;
      self.handle_attribute_categorical(cat_id);
    });
  };

  const renderColorPickerContinuous = function (cat_id, color_stops) {
    // For each unique value, render item.
    // Min and max range for continuous values
    let items = [
      colorPicker.colorStops("Color Stops", color_stops),
      colorPicker.colorPickerInputContinuous(
        "Min",
        self.uniqValues[cat_id]["min"]
      ),
      colorPicker.colorPickerInputContinuous(
        "Max",
        self.uniqValues[cat_id]["max"]
      ),
    ];

    $("#colorPickerRow").html(items.join(""));

    // Set onchange event for items
    $(".hivtrace-color-picker").change((e) => {
      let color = e.target.value;
      let name = e.target.name;

      // Set color in user-defined colorizer
      if (
        _.isUndefined(
          graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"]
        )
      ) {
        graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"] =
          {};
      }

      // get both for user-defined
      graph_data[kGlobals.network.GraphAttrbuteID][cat_id]["user-defined"][
        name
      ] = color;
      self.handle_attribute_continuous(cat_id);
    });

    // Set onchange event for items
    $(".hivtrace-color-stops").change((e) => {
      let num = parseInt(e.target.value);
      graph_data[kGlobals.network.GraphAttrbuteID][
        self.colorizer["category_id"]
      ]["color_stops"] = num;

      self._aux_populate_category_menus();
      self.handle_attribute_continuous(cat_id);
      self.update();
    });
  };

  if (type === "categorical") {
    renderColorPickerCategorical(cat_id);
  } else if (type === "continuous") {
    renderColorPickerContinuous(
      cat_id,
      graph_data[kGlobals.network.GraphAttrbuteID][
        self.colorizer["category_id"]
      ]["color_stops"]
    );
  } else {
    console.log("Error: type not recognized");
  }

  if (cat_id !== null) {
    $("#colorPickerOption").show();
  } else {
    $("#colorPickerOption").hide();
  }
}
