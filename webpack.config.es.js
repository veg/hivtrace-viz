var path = require("path"),
  webpack = require("webpack"),
  I18nPlugin = require("i18n-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

var languages = {
  en: require("./locales/en.json"),
  es: require("./locales/es.json")
};

var language = "es";
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
    //library: '',
    //libraryTarget: 'commonjs'
  },
  externals: {
    jsdom: "window"
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
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
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader?limit=10000&mimetype=application/font-woff"
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader?limit=10000&mimetype=application/octet-stream"
      },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url-loader?limit=10000&mimetype=image/svg+xml"
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
    //new ExtractTextPlugin("[name].css")
  ],
  resolve: {
    //modulesDirectories: ["src", "node_modules"],
    //extensions: ["", ".json", ".js", ".jsx"]
  }
};

// Hot mode
if (process.env.HOT) {
  config.devtool = "eval";
  config.entry.bundle.unshift("react-native-webpack-server/hot/entry");
  config.entry.bundle.unshift("webpack/hot/only-dev-server");
  config.entry.bundle.unshift(
    "webpack-dev-server/client?http://localhost:8082"
  );
  config.output.publicPath = "http://localhost:8082/";
  config.plugins.unshift(new webpack.HotModuleReplacementPlugin());

  // Note: enabling React Transform and React Transform HMR:

  config.module.rules[0].query.plugins.push("react-transform");
  config.module.rules[0].query.extra = {
    "react-transform": [
      {
        target: "react-transform-hmr",
        imports: ["react-native"],
        locals: ["module"]
      }
    ]
  };
}

if (process.env.NODE_ENV === "production") {
  config.devtool = false;
  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
}

module.exports = [config];
