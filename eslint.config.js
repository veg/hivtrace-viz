const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  // For more extensive testing, with some rules turned off (see below)
  // js.configs.all,
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
      strict: "off",
      "no-unused-vars": [
        1,
        {
          "vars": "all",
          "args": "none"
        }
      ],
      // For more extensive testing (with js.configs.all)
      // "sort-keys": 0,
      // "no-magic-numbers": 0,
      // "no-ternary": 0,
      // "no-undefined": 0,
      // "sort-vars": 0,
      // "max-lines-per-function": 0,
      // "one-var": 0,
      // "require-unicode-regexp": 0,
      // "id-length": 0,
      // "no-underscore-dangle": 0,
      // "prefer-destructuring": 0,
      // "max-lines": 0,
      // "max-params": 0,
      // "max-statements": 0,
      // "sort-imports": 0,
      // "dot-notation": 0,
      // "complexity": 0,
      // "no-unneeded-ternary": 0,
      // "logical-assignment-operators": 0,
      // "no-param-reassign": 0,
      // "multiline-comment-style": 0,
      // "vars-on-top": 0,
      // "func-names": 0,
      // "capitalized-comments": 0,
      // "curly": 0,
      // "prefer-template": 0,
      // "object-shorthand": 0,
      // "no-var": 0,
      // "line-comment-position": 0,
      // "no-inline-comments": 0,
      // "no-plusplus": 0,
      // "init-declarations": 0,
      // "no-use-before-define": 0,
      // "prefer-const": 0,
      // "func-style": 0,
      // "max-depth": 0,
      // "no-loop-func": 0,
      // "no-await-in-loop": 0,
      // "no-invalid-this": 0,
      // "no-negated-condition": 0,
      // "guard-for-in": 0,
      // "radix": 0,
      // "no-warning-comments": 0,
      // "no-alert": 0,
      // "no-script-url": 0,
      // "new-cap": 0,

      "block-scoped-var": 0,
      "no-shadow": 0,

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