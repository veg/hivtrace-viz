const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.browser,
        "$": 'readonly',
        "_": 'readonly',
        "__": 'readonly',
        "d3": 'readonly',
      },
      sourceType: "module",
    },
    rules: {
      // TODO: two rules turned off, but should be looked at
      // "block-scoped-var": 2,
      // "no-shadow": 2,
      strict: "off",
      "no-unused-vars": [
        1,
        {
          "vars": "all",
          "args": "none"
        }
      ],
      "no-console": 1,
      "camelcase": 0,
      "no-self-assign": 1,
      "no-unreachable": 1,
      "no-useless-catch": 1,
      "no-debugger": 2,
      "no-undef": 1,
      "no-module": 0,
      "key-spacing": 2,
      "no-mixed-spaces-and-tabs": 1,
      "no-redeclare": 1,
      "no-empty": 1,
      "no-constant-condition": 1,
      "no-cond-assign": 1,
      "no-fallthrough": 1,
      "no-useless-escape": 1,
      "no-inner-declarations": 1,
      "no-unsafe-negation": 1
    },
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "assets/",
    ],
  }
]