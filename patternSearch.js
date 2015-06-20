var path = require('path'),
    util = require('util'),
    glob = require('glob'),
    async = require('async'),
    _ = require('lodash');

var escapePath = function(path) {
    return path.replace(/\[/g, '?').replace(/\]/g, '?');
};

var getMetric = function(dir, file, cb) {
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
                getMetric(dir, file, function(e, r) {
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

var getPlaylistItem = function(params, cb) {
    var dir = params.dir;
    var type = params.type;
    var pattern = params.pattern;
    var position = params.position;

    switch(type) {
        case 'incremental':
            var targetFile = util.format(pattern, position)
            cb(null, targetFile);
            return;
        case 'glob':
            glob(escapePath(pattern), { cwd: dir }, function(e, r) {
                if (e) { cb(e); return; }
                var targetFile = r[position];
                cb(null, targerFile);
            });
            return;
        case 'file':
            return;
        default:
            cb(new Error('Invalid type'));
            return;
    };
};

var getPlaylistItemSync = function(params) {
    console.log(params);
    var dir = params.dir;
    var type = params.type;
    var pattern = params.pattern;
    var position = params.position;

    switch(type) {
        case 'incremental':
            var targetFile = util.format(pattern, position)
            return targetFile;
        case 'glob':
            var r = glob.sync(escapePath(pattern), { cwd: dir });
            var targetFile = r[position-1];
            return targetFile;
        case 'file':
            return;
        default:
            return new Error('Invalid type');
    };
};

module.exports = {
    getMetrics: getMetrics,
    getPlaylistItemSync: getPlaylistItemSync
};