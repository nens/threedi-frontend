const webpack = require('webpack');
const config = require('./webpack.config.js');
const WDS = require('webpack-dev-server');

const PORT = process.env.PORT || 3000;

const devserver = new WDS(webpack(config), {
  hot: true,
  inline: true,
  progress: true,
  reload: true,
  stats: { colors: true },
  proxy: [
    {
      path: '*',
      target: 'http://localhost:9000' // <- backend
    }
  ]
});

devserver.listen(PORT, 'localhost');


// this config is the equivalent too
// webpack-dev-server --progress --colors --hot --inline --port 3000 --host 127.0.0.1 -v
// With this setup it allows for hooking up a backend on another port
