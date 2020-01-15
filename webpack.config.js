var path = require("path"),
  webpack = require("webpack"),
  _ = require("underscore"),
  I18nPlugin = require("i18n-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

var languages = {
  en: require("./locales/en.json"),
  es: require("./locales/es.json")
};

module.exports = env => {
  var language = "en";

  if (!_.isUndefined(env)) {
    if (!_.isUndefined(env.lang)) {
      language = env.lang;
    }
  }

  var filename = "hivtrace.js";

  if (language != "en") {
    filename = "hivtrace." + language + ".js";
  }

  var config = {
    devtool: "source-map",
    mode: "development",
    entry: {
      hivtrace: ["./src/entry.js"]
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
        automaticNameMaxLength: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    },
    output: {
      path: path.resolve(__dirname, "dist/"),
      filename: "[name].js"
    },
    externals: {
      jsdom: "window"
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            "style-loader",
            {
              loader: MiniCssExtractPlugin.loader,
              options: { publicPath: "/dist/", minimize: false }
            },

            "css-loader"
          ]
        },
        {
          test: /\.js?$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          query: {
            presets: ["@babel/preset-env"]
          }
        },
        {
          test: require.resolve("jquery"),
          use: [
            {
              loader: "expose-loader",
              query: "jQuery"
            },
            {
              loader: "expose-loader",
              query: "$"
            }
          ]
        },
        {
          test: require.resolve("d3"),
          use: [
            {
              loader: "expose-loader",
              query: "d3"
            }
          ]
        },
        {
          test: require.resolve("underscore"),
          use: [
            {
              loader: "expose-loader",
              query: "_"
            }
          ]
        },
        {
          test: require.resolve("jspanel4"),
          use: [
            {
              loader: "expose-loader",
              query: "jsPanel"
            }
          ]
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: "url-loader?limit=10000&mimetype=application/font-woff"
        },
        {
          test: /\.(eot|woff|woff2|ttf|svg)(\?\S*)?$/,
          use: [
            {
              loader: "file-loader"
            }
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].css",
        chunkFilename: "[id].css"
      }),
      new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        d3: "d3",
        _: "underscore"
      }),
      new I18nPlugin(languages[language]),
      new webpack.IgnorePlugin(/jsdom$/)
    ]
  };

  return config;
};
