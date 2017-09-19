const webpack = require('webpack');
const configure = require('@dosomething/webpack-config');
const path = require('path');

module.exports = configure({
  entry: {
    app: './index.js'
  },
  module: {
    loaders: [
      { enforce: 'pre', test: /\.js$/, use: 'eslint-loader', exclude: /node_modules/ },
    ],
  },
  output: {
    path: path.join(__dirname, '/dist'),
  },
});
