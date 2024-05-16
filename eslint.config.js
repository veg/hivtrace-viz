const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.all,
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
      strict: "off",
      "no-unused-vars": [
        1,
        {
          "vars": "all",
          "args": "none"
        }
      ],
      "sort-keys": 0,
      "no-magic-numbers": 0,
      "no-ternary": 0,
      "no-undefined": 0,
      "sort-vars": 0,
      "max-lines-per-function": 0,
      "one-var": 0,
      "require-unicode-regexp": 0,
      "id-length": 0,
      "no-underscore-dangle": 0,
      "prefer-destructuring": 0,
      "max-lines": 0,
      "max-params": 0,
      "max-statements": 0,
      "sort-imports": 0,
      "dot-notation": 0,
      "complexity": 0,
      "no-unneeded-ternary": 0,
      "logical-assignment-operators": 0,
      "no-param-reassign": 0,

      "no-console": 1,
      "camelcase": 0,
      /*
       * "no-self-assign": 1,
       * "no-unreachable": 1,
       * "no-useless-catch": 1,
       * "no-debugger": 2,
       * "no-undef": 1,
       * "no-module": 0,
       * "key-spacing": 2,
       * "no-mixed-spaces-and-tabs": 1,
       * "no-redeclare": 1,
       * "no-empty": 1,
       * "no-constant-condition": 1,
       * "no-cond-assign": 1,
       * "no-fallthrough": 1,
       * "no-useless-escape": 1,
       * "no-inner-declarations": 1,
       * "no-unsafe-negation": 1
       */
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