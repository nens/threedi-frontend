var fs = require('fs');
var pkg = require('./package.json');
var EasyZip = require('easy-zip').EasyZip;
var rimraf = require('rimraf');
var github = require('octonode');

var version = pkg.version;
var fileName = './tmp/' + version + '.zip';

var client = github.client(require('./deploy/auth.json').token);
var ghrelease = client.release(pkg.repository.name, version);

rimraf.sync('./tmp');
fs.mkdirSync('./tmp');
var files = fs.readdirSync('./dist').map(function (file) {
  return { source: './dist/' + file, target: file};
});

var zip = new EasyZip();
zip.batchAdd(files, function () {
  console.log('Compressing contents of ./dist/ to tmp/' + version + '.zip')
  zip.writeToFile(fileName);

  var archive = fs.readFileSync(fileName);

  ghrelease.uploadAssets(archive, function (err) {
    if (err) { throw err; }
    rimraf('./tmp', function (rerr) {
      if (rerr) { throw rerr; }
      console.log('succesfully cleaned up tmp folder');
    });
  });
});
