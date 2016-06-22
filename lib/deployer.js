var log = require('logger')('hub:lib:deployer');
var async = require('async');
var temp = require('temp');
var fs = require('fs');
var util = require('util');
var path = require('path');
var shell = require('shelljs');
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var Build = require('component-build');
var resolve = require('component-resolver');
var Config = require('../models/config');
var App = require('../models/app');
var Deployment = require('../models/deployment');
var Release = require('../models/release');

var s3;

var RELEASES_BUCKET = 'cdn.serandives.com';
var REGION = 'ap-southeast-1';

var SERAND = 'serand'

Config.findOne({
    name: 'amazon'
}).lean().exec(function (err, config) {
    if (err) {
        throw err;
    }
    var amazon = JSON.parse(config.value);
    AWS.config.update({
        accessKeyId: amazon.aws.key,
        secretAccessKey: amazon.aws.secret,
        region: REGION
    });
    s3 = new AWS.S3();
});

var name = function (repo) {
    return repo.substring(repo.lastIndexOf('/') + 1, repo.lastIndexOf('.'));
};

var clone = function (repo, done) {
    temp.mkdir(null, function (err, dir) {
        if (err) {
            return done(err);
        }
        // clone repo into dir
        log.info('repo: %s, dir: %s', repo, dir);
        shell.exec(util.format('cd %s; git clone %s; ls -alh; pwd', dir, repo), function (code, stdout, stderr) {
            if (stdout) {
                log.info(stdout);
            }
            if (stderr) {
                log.error(stderr);
            }
            if (code !== 0) {
                return done(new Error(util.format('exit with code %s', code)));
            }
            done(null, path.join(dir, name(repo)), function () {
                shell.exec(util.format('rm -rf %s', dir), function (code, stdout, stderr) {
                    if (code !== 0) {
                        log.error('error removing temp directory: %s, err: %s', dir, stderr);
                    }
                });
            });
        });
    });
};

var components = function (dir, done) {
    shell.exec(util.format('cd %s; component install', dir), function (code, stdout, stderr) {
        if (stdout) {
            log.info(stdout);
        }
        if (stderr) {
            log.error(stderr);
        }
        if (code !== 0) {
            return done(new Error(util.format('error installing components at %s', dir)));
        }
        done();
    });
};

var build = function (id, dir, done) {
    var options = {
        prefix: SERAND + '/' + id + '/',
        destination: path.join(dir, SERAND),
        install: true,
        verbose: true,
        copy: true
    };
    var dest = options.destination
    resolve(dir, options, function (err, tree) {
        if (err) {
            return done(err);
        }
        var build = Build(tree, options);
        var builds = [];
        shell.exec(util.format('pwd; mkdir %s', dest), function (code, stdout, stderr) {
            if (stdout) {
                log.info(stdout);
            }
            if (stderr) {
                log.error(stderr);
            }
            if (code !== 0) {
                return done(new Error(util.format('error creating destination dir %s', dest)));
            }
            builds.push(function (built) {
                build.scripts(function (err, js) {
                    if (err) {
                        return built(err);
                    }
                    fs.writeFile(path.join(dest, 'build.js'), js, built);
                });
            });
            builds.push(function (built) {
                build.styles(function (err, css) {
                    if (err) {
                        return built(err);
                    }
                    fs.writeFile(path.join(dest, 'build.css'), css, built);
                });
            });
            builds.push(function (built) {
                build.files(built);
            });
            async.parallel(builds, function (err) {
                done(err, dest);
            });
        });
    });
};

var upload = function (dir, parent, done) {
    fs.lstat(dir, function (err, stats) {
        if (err) {
            return done(err);
        }
        if (stats.isFile()) {
            // upload file
            log.info('uploading src: %s to: %s', dir, parent);
            s3.upload({
                Bucket: RELEASES_BUCKET,
                Key: parent,
                Body: fs.createReadStream(dir)
            }, done);
            return;
        }
        // create s3 directory
        fs.readdir(dir, function (err, files) {
            if (err) {
                return done(err);
            }
            async.each(files, function (file, uploaded) {
                upload(path.join(dir, file), parent + '/' + path.basename(file), uploaded);
            }, done);
        });
    });
};

var deployApp = function (o, done) {
    App.findOne({
        _id: o.id
    }).exec(function (err, app) {
        if (err) {
            return done(err);
        }
        if (!app) {
            return done(new Error('!app'));
        }
        Release.create({
            repo: app.repo,
            revision: o.revision
        }, function (err, release) {
            if (err) {
                return done(err);
            }
            clone(release.repo, function (err, dir, clean) {
                if (err) {
                    return done(err);
                }
                components(dir, function (err) {
                    if (err) {
                        return done(err);
                    }
                    build(release.id, dir, function (err, dir) {
                        log.info('build dir: %s', dir);
                        if (err) {
                            clean();
                            return done(err);
                        }
                        // upload to cdn
                        shell.exec('tree ' + dir);
                        upload(dir, SERAND + '/' + release.id, function (err) {
                            clean();
                            done(err);
                        });
                    });
                });
            });
        })
    })
}

module.exports.deploy = function (id, done) {
    Deployment.findOne({
        _id: id
    }).populate('apps').exec(function (err, deployment) {
        if (err) {
            return done(err);
        }
        var status = [];
        var apps = deployment.apps;
        async.each(apps, function (release, deployed) {
            deployApp(release, function (err) {
                if (err) {
                    status.push({
                        type: 'app',
                        release: release,
                        error: err
                    });
                    return deployed();
                }
                deployed();
            });
        }, function (err) {
            if (err) {
                return done(err);
            }
            var error = false;
            async.each(status, function (status, verified) {
                if (status.error) {
                    // rollback
                    error = true;
                    log.info('rolling back type: %s, release: %j due to error: %e', status.type, status.release, status.error);
                }
                verified();
            }, function (err) {
                done(err || error);
            });
        });
    });
};