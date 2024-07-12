/*------------------------------------------------------------
     define a barebones class for the network object
     mostly here to encapsulate function definitions 
     so they don't pollute the main function
     
------------------------------------------------------------*/

class HIVTxNetwork {
  constructor(json) {
    this.json = json;
  }

  get_reference_date() {
    /** 
        get the reference (creation) date for the network
        same as "today", unless this is not the primary network (cluster or subcluster view),
        in which case the reference date for the parent is used
    */
    if (!this.isPrimaryGraph && this.parent_graph_object)
      return this.parent_graph_object.today;

    return this.today;
  }

  lookup_option(key, default_value, options) {
    /** 
        retrieve an option associated with "key"
        if not found in Settings or options, return "default value"
    */
    if (this.json.Settings && this.json.Settings[key])
      return this.json.Settings[key];
    if (options && options[key]) return options[key];
    return default_value;
  }

  static lookup_form_generator() {
    return '<div><ul data-hivtrace-ui-role = "priority-membership-list"></ul></div>';
  }
}

module.exports = {
  HIVTxNetwork,
};
