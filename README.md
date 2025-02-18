# hivtrace-viz

This repository contains the visualization code for HIV-TRACE.

## Dependencies

- Yarn or NPM

## Development

```
git clone https://github.com/veg/hivtrace-viz.git
cd hivtrace-viz
yarn
yarn develop
```

Navigate your browser to localhost:8273

## Deployment

The HIV-Trace webpage was formerly hosted using github-pages at https://veg.github.io/hivtrace-viz/ but has been migrated to using a pm2 process at hivtrace-viz.hyphy.org (see veg/operations documentation for details).

The master branch of this repo should always be in sync with what is published to NPM and is live on the production website. With the exception of urgent bug fixes, all changes to veg/master should be done via pull requests from veg/develop.


## Documentation

A basic JSDoc documentation of hivtrace-viz can be found at `docs/` and can be viewed by cloning the repository and opening `docs/index.html` in a browser (or running a basic web server in the `docs/` directory, e.g. `python -m http.server`).

A PDF version of the documentation can be found at `docs/hivtrace-viz-doxygen-docs.pdf`.

This documentation is generated automatically using JSDoc and Doxygen and ran automatically as part of the CI/CD pipeline (see `.github/workflows/jsdoc-doxygen.yml`). 
