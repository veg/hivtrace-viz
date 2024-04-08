let node_table;

function init(node_table_arg) {
  node_table = node_table_arg;
}

function getNodeTable() {
  return node_table;
}

module.exports = {
  init,
  getNodeTable,
};