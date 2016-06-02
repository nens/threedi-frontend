const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = {
  entry: {
    app: [
      './app/threedi.js'
    ]
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './dist'),
    chunkFilename: '[id].chunk.js'
  },
  module: {
    loaders: [
      {
        test: /\.scss$/,
        // loader: ExtractTextPlugin.extract('style-loader', sassLoaders.join('!'))
        loader: ExtractTextPlugin.extract('css!sass')
        // loaders: ["style", "css", "sass"]
      },
      { test: /\.html$/, loader: 'text' },
      { test: /.(png|jpg|gif|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/, loader: 'url-loader?limit=8192' }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css', {allChunks: true}),
    new HtmlWebpackPlugin({
      template: path.resolve('app', 'index.html'),
      inject: 'body'
    })
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions']
    })
  ],
  devtool: 'eval-source-map',
  devServer: {
    historyApiFallback: true,
    stats: {
      chunkModules: false,
      colors: true
    },
    contentBase: './app'
  }
};

module.exports = config;
