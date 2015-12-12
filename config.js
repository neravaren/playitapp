var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    async = require('async'),
    crypto = require('crypto'),
    _ = require('lodash');

function Configuration(data) {
    if (data == null) {
        data = { player:{}, playlist:{} };
    } else {
        data = JSON.parse(data);
    }

    this.inited = data.inited || false;
    this.directory = data.directory || '';
    this.player = {
        app: data.player.app || 'omxplayer',
        args: data.player.args || [ '--refresh', '--blank', '--align', 'center', '--adev', 'local' ]
    }
    this.playlist = {
        data: data.playlist.data || [],
        type: data.playlist.type || '',
        pattern: data.playlist.pattern || '',
        position: data.playlist.position || 1
    };
};

Configuration.prototype.Init = function(source, cb) {
    var cObj = this;
    if (source === true) { source = process.cwd(); }
    source = path.resolve(source);
    async.waterfall([
        function(cb) {
            fs.stat(source, function(e, stats) {
                if (e) {
                    cb(new Error('Target not exists', e));
                } else {
                    cb(null, stats);
                }
            });
        },
        function(stats, cb) {
            if (stats.isFile()) {
                cObj.directory = path.resolve(path.dirname(source));
                cObj.playlist.type = 'file';
                cObj.playlist.pattern = path.basename(source);
                cObj.playlist.position = 1;
            }
            cb(null, stats);
        },
        function(stats, cb) {
            if (stats.isDirectory()) {
                cObj.directory = path.resolve(source);
                cObj.playlist.type = 'glob';
                cObj.playlist.pattern = '+(*.avi|*.mp4|*.mkv)';
                cObj.playlist.position = 1;
            }
            cb();
        },
        function(cb) {
            cObj.GetPlaylist(function(e, list) {
                if (e) { cb(e); return; }
                cObj.playlist.data = list;
                cb();
            });
        },
        function(cb) {
            cObj.inited = true;
            cb();
        }
    ], cb);
};

Configuration.prototype.GetPlaylist = function(cb) {
    switch(this.playlist.type) {
        case 'glob':
            glob(this.EscapePath(this.playlist.pattern), { cwd: this.directory }, cb);
            return;
        case 'file':
            fs.readFile(path.join(this.directory, this.playlist.pattern), function(e, r) {
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

Configuration.prototype.GetPlaylistItem = function(cb) {
    var position = this.playlist.position;
    this.GetPlaylist(function(e, r) {
        if (e) { cb(e); return; }
        if (r[position] === null) { cb(new Error('Invalid position')); return; }
        cb(null, r[position - 1]);
    });
};

Configuration.prototype.EscapePath = function(path) {
    return path.replace(/\[/g, '?').replace(/\]/g, '?');
};

module.exports = Configuration;
