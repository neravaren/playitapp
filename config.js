var fs = require('fs'),
    path = require('path'),
    util = require('util'),
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
    init: function(dir, cb) {
        playlist.getMetrics(dir, { ctx: this }, function(e, r) {
            if (e) { cb(e); return; }
            var nr = _.last(r);
            console.log(util.format('Found %s items by pattern "%s"', nr.count, nr.pattern));
            var newData = {
                pattern: nr.pattern,
                type: 'glob',
                position: 1
            };
            this.data = _.extend(this.data, newData);
            cb(null);
        });
    }
};

module.exports = config;