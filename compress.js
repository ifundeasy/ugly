var fs = require('fs');
var path = require('path');
var ncp = require('ncp').ncp;
var ugly = {
    js: require('uglify-js'),
    css: require('uglifycss')
};

var baseOut, baseIn = path.normalize(process.argv[2]);
var force = process.argv[3] || false;
var exceptions, exts = Object.keys(ugly).map(function (key) {
    return key.toString().toLowerCase()
});

var mkdir = function (dir) {
    try {
        if (dir && dir.indexOf(dir.length - 1) != '/') dir += '/';
        fs.mkdirSync(dir);
        return dir
    } catch (e) {
    }
};
var isDir = function (dir) {
    var d = fs.lstatSync(dir).isDirectory();
    if (d) {
        d = dir;
        if (dir[dir.length - 1] !== '/') d += '/';
    }
    return d;
};

function justcopy(input, output) {
    fs.createReadStream(input).pipe(fs.createWriteStream(output));
}
function minifying(ext, input, output) {
    var uglify, result;
    switch (ext) {
        case 'css' :
            var opts = undefined; //{ maxLineLen: 500, expandVars: true };
            uglify = ugly.css;
            result = uglify.processFiles([input], (opts || {}));
            break;
        case 'js' :
            uglify = ugly.js;
            result = uglify.minify(input).code;
            break;
    }

    console.log(ext, output);
    fs.appendFile(output, result, function (err) {
        if (err) console.log(err);
    });
}
function readdir(inDir, outDir) {
    fs.readdir(inDir, function (err, msg) {
        if (!err) {
            msg.forEach(function (file) {
                var el = inDir + file;
                //if ((file.indexOf('.') != 0) && (exceptions.indexOf(el) == -1)) { //todo : avoid hidden file
                if ((exceptions.indexOf(el) == -1)) {
                    var directory = isDir(el);
                    var out = el.replace(baseIn, baseOut);

                    if (directory) {
                        mkdir(out);
                        readdir(directory);
                    } else {
                        fs.unlink(out, function () {
                            var vile = out.substr(out.lastIndexOf('/') + 1, out.length - 1);
                            var ext = '', idx = vile.lastIndexOf('.');
                            if ((idx != 0) && (idx !== -1)) {
                                ext = vile.substr(idx + 1, vile.length - 1).toLowerCase();
                                if (exts.indexOf(ext) !== -1) {
                                    minifying(ext, el, out);
                                } else {
                                    justcopy(el, out);
                                }
                            } else {
                                justcopy(el, out);
                            }
                        });
                    }
                }
            })
        } else {
            console.log(err)
        }
    })
}

baseIn = isDir(baseIn);
if (baseIn) {
    var okay = false;

    baseOut = baseIn.substr(0, baseIn.length - 1) + '-loluglify';
    try {
        if (fs.lstatSync(baseOut) && force == 'true') {
            okay = true;
        }
    } catch (e) {
        mkdir(baseOut);
        okay = true;
    }

    if (okay) {
        baseOut = isDir(baseOut);
        var e = fs.readFileSync(baseIn + '.loluglify').toString() || '[]';
        exceptions = JSON.parse(e).map(function (el) {
            var r = el;
            if (r.substr(r.length - 2, 2) == '/*') r = r.substr(0, r.length - 2);
            if (r.substr(r.length - 1, 1) == '/') r = r.substr(0, r.length - 1);
            //console.log('execption :', baseIn + r);
            return (baseIn + r);
        });
        (function copy() {
            copy.i = copy.i || 0;
            if (copy.i < exceptions.length) {
                var _ = exceptions[copy.i].replace(baseIn, '');
                var _in = exceptions[copy.i];
                var _out = baseOut + _;
                if (_.split('/').length > 1) {
                    var l = _.split('/').length;
                    (function loop () {
                        loop.i = loop.i || 0;
                        var pp = _.split('/').slice(0, loop.i+1).join('/');
                        if (loop.i < l) {
                            mkdir(baseOut + pp);
                            loop.i += 1;
                            loop();
                        } else {
                            ncp(_in, _out, function (err) {
                                if (err) {
                                    return console.error(err);
                                } else {
                                    copy.i += 1;
                                    copy();
                                }
                            });
                        }
                    })();
                } else {
                    ncp(_in, _out, function (err) {
                        if (err) {
                            return console.error(err);
                        } else {
                            copy.i += 1;
                            copy();
                        }
                    });
                }
            } else {
                readdir(baseIn, baseOut);
            }

        })();
    } else console.log('Output directory is exist!');

} else console.log('Invalid input directory!');
