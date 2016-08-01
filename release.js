var fs = require('fs');
var pkg = require('./package.json');
var EasyZip = require('easy-zip').EasyZip;
var rimraf = require('rimraf');
var github = require('octonode');

var version = pkg.version;
var fileName = __dirname + '/tmp/' + version + '.zip';

rimraf.sync('./tmp');
fs.mkdirSync('./tmp');
var files = fs.readdirSync('./dist').map(function (file) {
  return { source: './dist/' + file, target: file};
});

var zip = new EasyZip();
zip.batchAdd(files, function () {
  console.log('Compressing contents of ./dist/ to ' + fileName)
  zip.writeToFileSycn(fileName);
});

function uploadAssets (ghrelease) {
  var archive = fs.readFileSync(fileName);

  ghrelease.uploadAssets(archive, {
    contentType: 'application/zip',
    name: version + '.zip',
    size: archive.length
  }, function (requesterr, status, body, headers) {
    if (requesterr) {
      var bodyerrors = requesterr.body.errors.map(function (err) {
        return ['Field:', err.field, 'Code:', err.code, err.message].join(' ');
      });
      var message = [requesterr.message].concat(bodyerrors);
      throw new Error(message.join('\n'));
    }
    // if (err) { throw err; }
    // rimraf('./tmp', function (rerr) {
    //   if (rerr) { throw rerr; }
    //   console.log('succesfully cleaned up tmp folder');
    // });
  });    
};

var client = github.client(require('./deploy/auth.json').token);
var ghrepo = client.repo(pkg.repository.name);
ghrepo.releases(function (err, body) {
  return body.filter(function (release) {
    if (release.tag_name === require('./package.json').version) {
      var ghrelease = client.release(pkg.repository.name, release.id);
      uploadAssets(ghrelease);
    }
  });
});
