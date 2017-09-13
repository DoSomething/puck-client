const webpack = require('webpack');
const configure = require('@dosomething/webpack-config');
const path = require('path');

module.exports = configure({
  entry: {
    app: './index.js'
  },
  output: {
    path: path.join(__dirname, '/dist'),
  },
});
