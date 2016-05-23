/**
 * Gulp task definitions
 * Gulp is a task runner. This runs builds and initiates tests for us
 *
 * At the moment scripts are concatenated and compressed by django..
 * So we don't need that here.
 *
 */
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const wiredep = require('wiredep').stream;
const replace = require('gulp-replace');
const karma = require('karma').server;
const paths = require('./paths.js');

const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

gulp.task('scripts', function () {
  return gulp.src(paths.appfiles)
    .pipe(uglify())
    .pipe(concat('build.min.js'))
    .pipe(gulp.dest(paths.build + 'js'));
});


gulp.task('clean', function (cb) {
  del([paths.build], cb);
});

gulp.task('images', function () {
  return gulp.src(paths.images)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.build + 'img'));
});

gulp.task('bower', function () {
  const options = {
    ignorePath: /\.\.\/\.\.\/\.\./
  };
  gulp.src([paths.jsDeps, paths.cssDeps])
    .pipe(wiredep(options))
    .pipe(replace(/\/static\//g, '{{ STATIC_URL }}'))
    .pipe(gulp.dest(paths.depsFolder));

  gulp.src('./paths.js')
    .pipe(wiredep({
      devDependencies: true,
      fileTypes: {
        js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
          detect: {
            js: /'(.*\.js)'/gi
          },
          replace: {
            js: '\'{{filePath}}\','
          }
        }
      }
    }))
    .pipe(gulp.dest('./'))
});

gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('tdd', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    browsers: ['PhantomJS'],
    reporters: ['nyan']
  }, done);
});

gulp.task('default', [ 'bower', 'test']);
