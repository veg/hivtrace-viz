const path = require("path");
const webpack = require("webpack");
const _ = require("underscore");
const I18nPlugin = require("@zainulbr/i18n-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin"),

  languages = {
    en: require(path.join(
      __dirname,
      "node_modules",
      "hivtrace-locales",
      "en.json"
    )),
    es: require(path.join(
      __dirname,
      "node_modules",
      "hivtrace-locales",
      "es.json"
    )),
  };

module.exports = (env) => {
  let language = "en";

  if (!_.isUndefined(env)) {
    if (!_.isUndefined(env.lang)) {
      language = env.lang;
    }
  }

  let filename = "hivtrace.js";

  if (language !== "en") {
    filename = `hivtrace.${language}.js`;
  }

  const config = {
    devtool: "source-map",
    mode: "development",
    entry: {
      hivtrace: ["./src/entry.js"],
    },
    optimization: {
      splitChunks: {
        chunks: "async",
        minSize: 30000,
        maxSize: 0,
        minChunks: 2,
        maxAsyncRequests: 6,
        maxInitialRequests: 4,
        automaticNameDelimiter: "~",
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      filename,
    },
    externals: {
      jsdom: "window",
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
          //Options: { publicPath: "/dist/", minimize: false }
        },
        {
          test: /\.(js|jsx)?$/,
          include: [path.resolve(__dirname, "src")],
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: require.resolve("jquery"),
          loader: "expose-loader",
          options: {
            exposes: {
              globalName: ["jQuery", "$"],
              override: false,
            },
          },
        },
        {
          test: require.resolve("d3"),
          loader: "expose-loader",
          options: {
            exposes: {
              globalName: "d3",
              override: true,
            },
          },
        },
        {
          test: require.resolve("underscore"),
          loader: "expose-loader",
          options: {
            exposes: {
              globalName: "_",
              override: true,
            },
          },
        },
        {
          test: require.resolve("jspanel4"),
          loader: "expose-loader",
          options: {
            exposes: {
              globalName: "jsPanel",
              override: true,
            },
          },
        },
        {
          test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
      new MiniCssExtractPlugin({
        /*
         * Options similar to the same options in webpackOptions.output
         * both options are optional
         */
        filename: "[name].css",
        chunkFilename: "[id].css",
      }),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        d3: "d3",
        _: "underscore",
      }),
      new I18nPlugin(languages[language]),
      new webpack.IgnorePlugin({ resourceRegExp: /jsdom$/ }),
    ],
  };

  return config;
};
