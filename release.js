var fs = require('fs');
var pkg = require('./package.json');
var EasyZip = require('easy-zip').EasyZip;
var rimraf = require('rimraf');
var GHApi = require('github');

var version = pkg.version;
var fileName = './tmp/' + version + '.zip';

var github = new GHApi({
  debug: true,
  version: '3.0.0'
});

github.authenticate({
  type: 'oauth',
  token: require('./deploy/auth.json').token
});

rimraf.sync('./tmp');
fs.mkdirSync('./tmp');
var files = fs.readdirSync('./dist').map(function (file) {
  return { source: './dist/' + file, target: file};
});

var zip = new EasyZip();
zip.batchAdd(files, function () {
  console.log('Compressing contents of ./dist/ to tmp/' + version + '.zip')
  zip.writeToFile(fileName);
});

// github.repos.uploadAsset({
//   user: 'nens',
//   repo: pkg.name,
//   id: version,
//   filePath: fileName,
//   headers: {
//     'Content-Type': 'application/zip'
//   },
//   name: version + '.zip'
// }, function (err) {
//   if (err) { throw err; }
//   rimraf('./tmp', function (rerr) {
//     if (rerr) { throw rerr; }
//     console.log('succesfully cleaned up tmp folder');
//   });
// });
