const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './analytics.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'analytics.js',
    library: 'cyntelli-sdk-js',
    libraryTarget: 'umd',
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        extractComments: 'all',
      }),
    ],
  },
};
