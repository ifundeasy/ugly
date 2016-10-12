var fs = require('fs');
var path = require('path');
var ugly = {
    js : require('uglify-js'),
    css : require('uglifycss')
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
    fs.readdir(inDir, function (err, list) {
        if (!err) {
            list.forEach(function (file) {
                var el = inDir + file;
                //if ((file.indexOf('.') != 0) && (exceptions.indexOf(el) == -1)) { //todo : avoid hidden file
                var directory = isDir(el);
                var out = el.replace(baseIn, baseOut);
                //console.log(directory ? " " : "X", el);
                if (directory) {
                    mkdir(out);
                    readdir(directory);
                } else {
                    fs.unlink(out, function () {
                        var vile = out.substr(out.lastIndexOf('/') + 1, out.length - 1);
                        var splitter = vile.split(/\./g);
                        var ext = '', idx = vile.lastIndexOf('.');
                        var command = "copy";
                        if ((idx != 0) && (idx !== -1)) {
                            var check = exceptions.filter(function (ee) {
                                return el.indexOf(ee) == 0;
                            });
                            ext = splitter[splitter.length - 1].toLowerCase();
                            if (!check.length && (splitter[splitter.length - 2] !== "min") && (exts.indexOf(ext) !== -1)) {
                                command = "minify";
                            }
                        }
                        //
                        if (command == "copy") justcopy(el, out);
                        else minifying(ext, el, out);
                    });
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
    baseOut = baseIn.substr(0, baseIn.length - 1) + '.ugly';
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
        var e = fs.readFileSync(baseIn + '.ugly').toString() || '[]';
        exceptions = JSON.parse(e).map(function (el) {
            var r = el;
            if (r.substr(r.length - 2, 2) == '/*') r = r.substr(0, r.length - 2);
            if (r.substr(r.length - 1, 1) == '/') r = r.substr(0, r.length - 1);
            console.log('exception :', baseIn + r);
            return (baseIn + r);
        });
        readdir(baseIn, baseOut);
    } else console.log('Output directory is exist!');
} else console.log('Invalid input directory!');