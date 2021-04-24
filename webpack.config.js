const path = require('path');

module.exports = {
  mode: 'development',
  entry: './analytics.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'analytics.js',
    library: 'cyntelli-sdk-js',
    libraryTarget: 'umd',
  },
  node: {
    child_process: "empty",
    fs: "empty", // if unable to resolve "fs"
  },
};
