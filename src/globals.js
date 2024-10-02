/**
    Combined definitions and presets for various network components.
    
    
*/

var d3 = require("d3"),
  _ = require("underscore");

const CategoricalBase = [
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#ffff99",
  "#b15928",
];

/**
    CategoricalBase:
    The default set of colors used for displaying colors of categorical attributes
*/

const Categorical = [];

_.each([0, -0.8], (k) => {
  _.each(CategoricalBase, (s) => {
    Categorical.push(d3.rgb(s).darker(k).toString());
  });
});

/**
    Categorical:
    Expanded color range using darker shades based on `CategoricalBase`
*/

const MaximumValuesInCategories = Categorical.length;

/**
    MaximumValuesInCategories:
    Maximum # of distinct values that can be rendered for categorical variables
*/

const EdgeColorBase = ["#000000", "#aaaaaa"];
/**
    EdgeColorBase:
    The default color range for shading network EDGES
*/

const PresetColorSchemes = {
  sex_trans: {
    "MSM-Male": "#1f78b4",
    "MMSC-Male": "#FFBF00",
    "MSM-Unknown sex": "#1f78b4",
    "MMSC-Unknown sex": "#FFBF00",
    "Heterosexual Contact-Male": "#AAFF00",
    "Heterosexual Contact-Female": "#AAFF00",
    "Heterosexual Contact-Unknown sex": "#AAFF00",
    "IDU-Male": "#0096FF",
    "MSM & IDU-Male": "#33a02c",
    "MMSC & IDU-Unknown sex": "#0096FF",
    "MMSC & IDU-Male": "#FFBF00",
    "IDU-Female": "#0096FF",
    "IDU-Unknown sex": "#0096FF",
    "Other/Unknown-Male": "#636363",
    "Other/Unknown-Female": "#636363",
    "Other-Male": "#636363",
    "Other-Female": "#636363",
    Missing: "#636363",
    "": "#636363",
    "Other/Unknown-Unknown sex": "#636363",
    Perinatal: "#D2042D",
    "Other/Unknown-Child": "#D2042D",
    "Other-Child": "#D2042D",
  },

  race_cat: {
    Asian: "#1f77b4",
    "Black/African American": "#bcbd22",
    "Hispanic/Latino": "#9467bd",
    "American Indian/Alaska Native": "#2ca02c",
    "Native Hawaiian/Other Pacific Islander": "#17becf",
    "Multiple Races": "#e377c2",
    Multiracial: "#e377c2",
    "Multiple races": "#e377c2",
    "Unknown race": "#999",
    Missing: "#999",
    missing: "#999",
    White: "#d62728",
  },
  sex_birth: {
    Male: "#FF6700",
    Female: "#50c878",
    Unknown: "#999",
  },
  birth_sex: {
    Male: "#FF6700",
    Female: "#50c878",
    Unknown: "#999",
  },

  gender_identity: {
    Woman: "#AAFF00",
    "Transgender woman": "#228B22",
    Man: "#FFBF00",
    "Transgender man": "#FF5F1F",
    "Declined to answer": "#FAFA33",
    "Additional gender identity": "#D2042D",
    Missing: "#999",
    Unknown: "#999",
  },
};

/**
    PresetColorSchemes:
    Predefined (hard-coded) color schemes for specific attribute fields.
    Keys are exactly matched by categorical variable names
    These should be updated if a specific attribute needs to use a particular color scheme for value rendering 
*/

const PresetShapeSchemes = {
  birth_sex: {
    Male: "square",
    Female: "ellipse",
    Missing: "diamond",
    missing: "diamond",
    Unknown: "diamond",
  },
  sex_birth: {
    Male: "square",
    Female: "ellipse",
    Missing: "diamond",
    missing: "diamond",
    Unknown: "diamond",
  },
  gender_identity: {
    Man: "square",
    Woman: "ellipse",
    "Transgender man": "hexagon",
    "Transgender woman": "circle",
    "Additional gender identity": "pentagon",
    Unknown: "diamond",
    "Declined to answer": "diamond",
  },
  race_cat: {
    Asian: "hexagon",
    "Black/African American": "square",
    "Hispanic/Latino": "triangle",
    "American Indian/Alaska Native": "pentagon",
    "Native Hawaiian/Other Pacific Islander": "octagon",
    "Multiple Races": "diamond",
    "Unknown race": "diamond",
    Missing: "diamond",
    missing: "diamond",
    White: "ellipse",
  },
  current_gender: {
    Male: "square",
    Female: "ellipse",
    "Transgender-Male to Female": "hexagon",
    "Transgender-Female to Male": "pentagon",
    "Additional Gender Identity": "diamond",
    Unknown: "diamond",
    Missing: "diamond",
    missing: "diamond",
  },
};

/**
    PresetShapeSchemes:
    Predefined (hard-coded) shape schemes for specific attribute fields.
    Keys are exactly matched by categorical variable names
    These should be updated if a specific attribute needs to use a particular shape scheme for value rendering 
*/

const SequentialColor = {
  2: ["#feb24c", "#e31a1c"],
  3: ["#ffeda0", "#feb24c", "#f03b20"],
  4: ["#ffffb2", "#fecc5c", "#fd8d3c", "#e31a1c"],
  5: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
  6: ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#f03b20", "#bd0026"],
  7: [
    "#ffffb2",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#b10026",
  ],
  8: [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#b10026",
  ],
  9: [
    "#ffffcc",
    "#ffeda0",
    "#fed976",
    "#feb24c",
    "#fd8d3c",
    "#fc4e2a",
    "#e31a1c",
    "#bd0026",
    "#800026",
  ],
};

/**
    SequentialColor:
    The default color ranges for a fixed number of values
*/

const ShapeOrdering = [
  "circle",
  "square",
  "hexagon",
  "diamond",
  "cross",
  "octagon",
  "ellipse",
  "pentagon",
];

/**
    ShapeOrdering:
    The range to which values for categorical/ordinal variables will be mapped using 
    the "Shape" dropdown
*/

const CDCCOIKind = [
  "01 state/local molecular cluster analysis",
  "02 national molecular cluster analysis",
  "03 state/local time-space cluster analysis",
  "04 national time-space cluster analysis",
  "05 provider notification",
  "06 partner services notification",
  "07 other",
];

/**
    CDCCOIKind:
    Available creation options for Clusters of Interest
*/

const CDCCOITrackingOptions = [
  "01. Add cases diagnosed in the past 3 years and linked at 0.5% to a member in this cluster of interest",
  "02. Add cases (regardless of HIV diagnosis date) linked at 0.5% to a member in this cluster of interest",
  "03. Add cases diagnosed in the past 3 years and linked at 1.5% to a member in this cluster of interest",
  "04. Add cases (regardless of HIV diagnosis date) linked at 1.5% to a member in this cluster of interest",
  "05. Do not add cases to this cluster of interest. I do not want to monitor growth in this cluster of interest over time.",
];

/**
    CDCCOITrackingOptions:
    Available tracking options for Clusters of Interest
    Used as drop-downs for COI editors and automatic filling 
*/

const CDCCOICanAutoExpand = {};
CDCCOICanAutoExpand[CDCCOITrackingOptions[0]] = true;

/**
    CDCCOICanAutoExpand:
    The types of tracking modes which are subject to automatic growth tracking
*/

const CDCCOITrackingOptionsDefault = CDCCOITrackingOptions[0];

/**
    CDCCOITrackingOptionsDefault:
    The default tracking option assigned to COI
*/

const CDCCOITrackingOptionsNone = CDCCOITrackingOptions[4];

/**
    CDCCOITrackingOptionsNone:
    The "no-tracking" option assigned for COI
*/

const CDCCOITrackingOptionsDistanceFilter = {};
CDCCOITrackingOptionsDistanceFilter[CDCCOITrackingOptions[0]] = (e, d) =>
  e.length < 0.005;
CDCCOITrackingOptionsDistanceFilter[CDCCOITrackingOptions[1]] = (e, d) =>
  e.length < 0.005;
CDCCOITrackingOptionsDistanceFilter[CDCCOITrackingOptions[2]] = (e, d) =>
  e.length < 0.015;
CDCCOITrackingOptionsDistanceFilter[CDCCOITrackingOptions[3]] = (e, d) =>
  e.length < 0.015;

/**
    CDCCOITrackingOptionsFilter:
    A filtering option is applied to cluster edges when computing COI membership under different tracking options
    Selects edges of different lengths (0.5% vs 1.5%)
*/

const CDCCOITrackingOptionsDateFilter = {};
CDCCOITrackingOptionsDateFilter[CDCCOITrackingOptions[0]] = 36;
CDCCOITrackingOptionsDateFilter[CDCCOITrackingOptions[1]] = 100000;
CDCCOITrackingOptionsDateFilter[CDCCOITrackingOptions[2]] = 36;
CDCCOITrackingOptionsDateFilter[CDCCOITrackingOptions[3]] = 100000;

/**
    CDCCOITrackingOptionsDateFilter:
    A filtering option applied to cluster nodes when computing COI membership under different tracking options
    Specifies the maximum number of MONTHS (relative to the reference data) that a node age must fall into
*/

const CDCCOIConciseTrackingOptions = {};
CDCCOIConciseTrackingOptions[CDCCOITrackingOptions[0]] =
  "3 years, 0.5% distance";
CDCCOIConciseTrackingOptions[CDCCOITrackingOptions[1]] = "0.5% distance";
CDCCOIConciseTrackingOptions[CDCCOITrackingOptions[2]] =
  "3 years, 1.5% distance";
CDCCOIConciseTrackingOptions[CDCCOITrackingOptions[3]] = "1.5% distance";
CDCCOIConciseTrackingOptions[CDCCOITrackingOptions[4]] = "None";

/**
    CDCCOIConciseTrackingOptions:
    Available shorter tracking options for Clusters of Interest
    Used for COI exports
*/

const CDCCOINodeKind = [
  "01 through analysis/notification",
  "02 through investigation",
];

/**
    CDCCOINodeKind:
    Available options for how a COI member was identified
    Used as drop-downs for COI editors and automatic filling 
*/

const CDCCOICreatedBySystem = "System";
/**
    CDCCOICreatedBySystem:
    The value of "createdBy" in a COI record when the COI was created by the system (automatically)
*/

const CDCCOICreatedManually = "Manual";

/**
    CDCCOICreatedManually:
    The value of "createdBy" in a COI record when the COI was created manually
*/

const CDCJurisdictionCodes = {
  alabama: "al",
  alaska: "ak",
  americansamoa: "as",
  arizona: "az",
  arkansas: "ar",
  california: "ca",
  colorado: "co",
  connecticut: "ct",
  delaware: "de",
  districtofcolumbia: "dc",
  federatedstatesofmicronesia: "fm",
  florida: "fl",
  georgia: "ga",
  guam: "gu",
  hawaii: "hi",
  houston: "hx",
  idaho: "id",
  illinois: "il",
  indiana: "in",
  iowa: "ia",
  kansas: "ks",
  kentucky: "ky",
  louisiana: "la",
  maine: "me",
  marshallislands: "mh",
  maryland: "md",
  massachusetts: "ma",
  michigan: "mi",
  minnesota: "mn",
  mississippi: "ms",
  missouri: "mo",
  montana: "mt",
  nebraska: "ne",
  nevada: "nv",
  newhampshire: "nh",
  newjersey: "nj",
  newmexico: "nm",
  newyorkstate: "ny",
  nyc: "nx",
  northcarolina: "nc",
  north_dakota: "nd",
  northernmarianaislands: "mp",
  ohio: "oh",
  oklahoma: "ok",
  oregon: "or",
  palau: "pw",
  pennsylvania: "pa",
  puertorico: "pr",
  rhodeisland: "ri",
  southcarolina: "sc",
  southdakota: "sd",
  tennessee: "tn",
  texas: "tx",
  utah: "ut",
  vermont: "vt",
  virginislands: "vi",
  virginia: "va",
  washington: "wa",
  washingtondc: "dc",
  westvirginia: "wv",
  wisconsin: "wi",
  wyoming: "wy",
  chicago: "cx",
  philadelphia: "px",
  losangeles: "lx",
  sanfrancisco: "sx",
  republicofpalau: "pw",
  "u.s.virginislands": "vi",
};

/**
    CDCJurisdictionCodes:
    Mapping from full names to two-letter codes for various Secure HIV-TRACE jurisdictions
*/

const CDCJurisdictionLowMorbidity = new Set([
  "alaska",
  "delaware",
  "hawaii",
  "idaho",
  "iowa",
  "kansas",
  "maine",
  "montana",
  "nebraska",
  "new hampshire",
  "new mexico",
  "north dakota",
  "rhode island",
  "south dakota",
  "utah",
  "vermont",
  "virgin islands",
  "west virginia",
  "wyoming",
]);

/**
    CDCJurisdictionLowMorbidity:
    The set of low-morbidity jurisdictions for Secure HIV TRACE
*/

const CDCCOIKindAutomaticCreation = CDCCOIKind[0];

/**
    CDCCOIKindAutomaticCreation:
    The kind of COI that is automatically created by the system
*/

const CDCCOINodeKindDefault = CDCCOINodeKind[0];

/**
    CDCCOINodeKindDefault:
    The method of node identification used by default (and it automatically created COI)
*/

const CDCNPMember = "Ever in national priority clusterOI?";

/**
    CDCNPMember:
    The label for the auto-generated node attribute (ever in NP CoI)
*/

const missing = {
  color: "#999",
  opacity: "0.1",
  label: __("general")["missing"],
};

/**
    missing:
    Values to use when displaying missing values
*/

const formats = {
  FloatFormat: d3.format(",.2r"),
  PercentFormat: d3.format(",.3p"),
  PercentFormatShort: d3.format(".2p"),
  DotFormatPadder: d3.format("08d"),
};

/**
    formats:
    Various formatters for numerical values
*/

const network = {
  GraphAttrbuteID: "patient_attribute_schema",
  NodeAttributeID: "patient_attributes",
  ReducedValue: "Different (other) value",
  ContinuousColorStops: 9,
  WarnExecutiveMode: "This feature is not available in the executive mode.",
};

/**
    network:
    Attributes and string constants for the network object
*/

const SubclusterSeparator = ".";
/**
    the character used to define subclusters, e.g. the '.' in 2.13
*/

module.exports = {
  Categorical,
  CategoricalBase,
  CDCCOICanAutoExpand,
  CDCCOIConciseTrackingOptions,
  CDCCOICreatedBySystem,
  CDCCOICreatedManually,
  CDCCOIKind,
  CDCCOIKindAutomaticCreation,
  CDCCOINodeKind,
  CDCCOINodeKindDefault,
  CDCCOITrackingOptions,
  CDCCOITrackingOptionsDateFilter,
  CDCCOITrackingOptionsDefault,
  CDCCOITrackingOptionsDistanceFilter,
  CDCCOITrackingOptionsNone,
  CDCJurisdictionCodes,
  CDCJurisdictionLowMorbidity,
  CDCNPMember,
  EdgeColorBase,
  formats,
  MaximumValuesInCategories,
  missing,
  network,
  PresetColorSchemes,
  PresetShapeSchemes,
  SequentialColor,
  ShapeOrdering,
  SubclusterSeparator,
};
