// Karma is a test runner.

var paths = require('./paths.js');

module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    files: paths.vendorfiles
      .concat(paths.mockfiles)
      .concat(paths.appfiles)
      .concat(paths.testfiles),
    reporters: ['progress'],
    preprocessors: {
        'test/*_test.js': ['webpack'],
        'test/**/*_test.js': ['webpack']
    },

    webpack: {
        // karma watches the test entry points
        // (you don't need to specify the entry option)
        // webpack watches dependencies

        // webpack configuration
    },

    webpackMiddleware: {
        noInfo: true
    }
  });
};
