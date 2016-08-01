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

function uploadAssets (err, body) {
  if (err) { throw err }
  console.log('Created release, getting ready to upload assets')
  var ghrelease = client.release(pkg.repository.name, body.id);
  var archive = fs.readFileSync(fileName);

  var html_url = body.html_url;

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

    console.log('Created new release and uploaded assets at: \n' + html_url);
    rimraf('./tmp', function (rerr) {
      if (rerr) { throw rerr; }
      console.log('Succesfully cleaned up tmp folder');
    });
  });    
};

var client = github.client(require('./deploy/auth.json').token);
var ghrepo = client.repo(pkg.repository.name);
ghrepo.release({
  tag_name: version,
  draft: false
}, uploadAssets);

function findRelease () {
  ghrepo.releases(function (err, body) {
    return body.filter(function (release) {
      if (release.tag_name === require('./package.json').version) {
        var ghrelease = client.release(pkg.repository.name, release.id);
        uploadAssets(ghrelease);
      }
    });
  });
};
