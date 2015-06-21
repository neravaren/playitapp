var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    async = require('async'),
    _ = require('lodash'),
    playlist = require('./playlistTools');

var config = {

    data: {
        player: 'omxplayer',
        playerArgs: ['-r', '-b', '--align', 'center'],
        pattern: '*.mp4',
        type: 'glob',
        position: 1,
        history: {}
    },

    env: {
        cwd: process.cwd(),
        localConfigName: '.playit',
        path: function() {
            return path.join(this.cwd, this.localConfigName);
        }
    },

    load: function() {
        if (fs.existsSync(this.env.path())) {
            this.data = JSON.parse(fs.readFileSync(this.env.path()));
            return true;
        }
        return false;
    },

    save: function() {
        this.data.dir = this.env.cwd;
        fs.writeFileSync(this.env.path(), JSON.stringify(this.data));
    },

    validate: function() {
        if (this.data.pattern.indexOf('%s') < 0 )
            return false;
        if (!fs.existsSync(util.format(this.data.pattern, this.data.position)))
            return false;
        return true;
    },

    init: function(target, cb) {
        var stats = null;
        var ctx = this;
        async.series([
            function(cb) {
                fs.exists(target, function(exists) {
                    cb(exists ? null : new Error('Target not exists'));
                });
            },
            function(cb) {
                fs.stat(target, function(e, r) {
                    stats = r;
                    cb(e);
                });
            },
            function(cb) {
                if (stats.isFile()) {
                    var newData = {
                        pattern: target,
                        type: 'file',
                        position: 1
                    };
                    ctx.data = _.extend(ctx.data, newData);
                }
                cb();
            },
            function(cb) {
                if (stats.isDirectory()) {
                    playlist.getMetrics(target, { ctx: ctx }, function(e, r) {
                        if (e) { cb(e); return; }
                        var nr = _.last(r);
                        console.log(util.format('Found %s items by pattern "%s"', nr.count, nr.pattern));
                        var newData = {
                            pattern: nr.pattern,
                            type: 'glob',
                            position: 1
                        };
                        ctx.data = _.extend(ctx.data, newData);
                        cb();
                    });
                } else {
                    cb();
                }
            }
        ], cb);
    }

};

module.exports = config;