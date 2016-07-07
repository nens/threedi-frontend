const webpack = require('webpack');
const config = require('./webpack.config.js');
const WDS = require('webpack-dev-server');

const PORT = process.env.PORT || 3000;

const devserver = new WDS(webpack(config), {
  hot: true,
  inline: true,
  progress: true,
  stats: { colors: true },
  proxy: [
    {
      path: '/active_simulations/',
      target: 'http://localhost:9000' // <- backend
    },
    {
      path: '/socket.io',
      target: 'http://localhost:9000' // <- backend
    },
    {
      path: '/hand-crank.js',
      target: 'http://localhost:9000' // <- backend
    },
    {
      path: '/api/v1/*',
      target: 'http://localhost:9000' // <- backend
    },
    {
      path: '/onedee/*',
      target: 'http://localhost:9000' // <- backend
    }
  ]
});

devserver.listen(PORT, '127.0.0.1');


// this config is the equivalent too
// webpack-dev-server --progress --colors --hot --inline --port 3000 --host 127.0.0.1 -v
// With this setup it allows for hooking up a backend on another port
