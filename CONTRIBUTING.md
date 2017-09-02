# Contributing

## Development workflow

After cloning hivtrace-viz, run `npm install` to fetch its dependencies.

> Note that if you already have a `node_modules` directory present from a previous build, please delete it prior to running webpack to avoid version conflicts and other odd errors. 

While developing, use the command `webpack -w` to update `hivtrace-viz.js` and
`hivtrace-viz.css` with your code changes.

When generating a new release, we follow [Semantic
Versioning](http://semver.org/) and submit the latest releases to
[npm](https://www.npmjs.com/package/hivtrace-viz).
