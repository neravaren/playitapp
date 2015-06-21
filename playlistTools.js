var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    glob = require('glob'),
    async = require('async'),
    _ = require('lodash');

var escapePath = function(path) {
    return path.replace(/\[/g, '?').replace(/\]/g, '?');
};

var getFileMetric = function(dir, file, cb) {
    var extname = path.extname(file);
    var basename = path.basename(file, extname);
    
    var slice = 1;
    var pattern = basename.substr(0, basename.length-slice) + '*' + extname;
    var baseCount = glob.sync(escapePath(pattern), { cwd: dir }).length;
    var newCount = baseCount;
    
    async.whilst(function() {
        return newCount === baseCount;
    }, function(cb) {
        slice++;
        pattern = basename.substr(0, basename.length-slice) + '*' + extname;
        glob(escapePath(pattern), { cwd: dir }, function(e, r) {
            newCount = r.length;
            cb(e, r);
        });
    }, function(e) {
        cb(e, { pattern: pattern, count: newCount });
    });
};

var getMetrics = function(dir, params, cb) {
    var format = '+(*.avi|*.mp4|*.mkv)';
    async.waterfall([
        function(cb) {
            glob(format, { cwd: dir }, cb);
        }, 
        function(files, cb) {
            var patterns = [];
            async.eachSeries(files, function(file, cb) {
                getFileMetric(dir, file, function(e, r) {
                    if (e) { cb(e); return; }
                    patterns.push(r);
                    cb();
                });
            }, function(e) {
                var sPattern = _.uniq(_.sortBy(patterns, 
                    function(p) { return p.count; }), 
                    function(p) { return p.pattern; });
                cb(e, sPattern);
            });
        }
    ], function(e, r) {
        if (params.ctx) {
            cb.call(params.ctx, e, r);
        } else {
            cb(e, r);
        }
    });
};

var getPlaylist = function(params, cb) {
    var dir = params.dir;
    var type = params.type;
    var pattern = params.pattern;
    switch(type) {
        case 'glob':
            glob(escapePath(pattern), { cwd: dir }, cb);
            return;
        case 'file':
            fs.readFile(path.join(dir, pattern), function(e, r) {
                if (e) { cb(e); return; }
                var result = _.compact(_.map(r.toString().split('\n'), _.trim));
                cb(null, result);
            });
            return;
        default:
            cb(new Error('Invalid type'));
            return;
    };
};

var getPlaylistItem = function(params, cb) {
    var position = params.position;
    getPlaylist(params, function(e, r) {
        if (e) { cb(e); return; }
        if (r[position] === null) { cb(new Error('Invalid position')); return; }
        cb(null, r[position]);
    });
};

module.exports = {
    getMetrics: getMetrics,
    getPlaylist: getPlaylist,
    getPlaylistItem: getPlaylistItem
};