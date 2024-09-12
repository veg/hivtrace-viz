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

## Running E2E Tests

```
yarn playwright test
```