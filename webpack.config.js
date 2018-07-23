const configure = require('@dosomething/webpack-config');
const path = require('path');

module.exports = configure({
  entry: {
    index: './lib/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
  },
  module: {
    rules: [
      { enforce: 'pre', test: /\.js$/, use: 'eslint-loader', exclude: /node_modules/ },
    ],
  },
});
