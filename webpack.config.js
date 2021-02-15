const path = require('path');

module.exports = {
  mode: 'development',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sdk.js',
    library: 'cyntelli-sdk-js',
    libraryTarget: 'umd',
  },
  node: {
    child_process: "empty",
    fs: "empty", // if unable to resolve "fs"
  },
};
