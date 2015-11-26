var spawn = require('child_process').spawn,
    chalk = require('chalk'),
    crypto = require('crypto'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    _ = require('lodash'),
    Configuration = require('./config');

function Player(cwd) {
    this.configuration = new Configuration();
    this.storage = 'local';
    
    var filename = '.playit',
        homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
        currentDir = cwd || process.cwd(),
        currentDirHash = crypto.createHash('md5').update(currentDir).digest('hex');

    this.storages = { 
        'local': { path: path.join(currentDir, filename), storage: 'local' },
        'global' : { path: path.join(homeDir, filename, currentDirHash), storage: 'global' }
    };
};

Player.prototype.Play = function(cb) {
    var playerApp = this.configuration.player.app;
    var playerArgs = this.configuration.player.args;
    this.configuration.GetPlaylistItem(function(e, playingItem) {
        if (e) { cb(e); return; }
        console.log(chalk.bold('Playing:'), playingItem);
        playerArgs.push(playingItem);
        spawn(playerApp, playerArgs, {
            stdio: 'inherit' 
        }).on('close', function (code) {
            console.log(_.capitalize(playerApp) + ' has exited with code ' + code);
            cb();
        });
    });
};

Player.prototype.Jump = function(position) {
    this.configuration.playlist.position = position;
};

Player.prototype.Load = function(cb) {
    var cObj = this;
    var files = _.values(this.storages);
    async.eachSeries(files, 
        function(file, cb) {
            fs.stat(file.path, function(e, stat) {
                if (e) {cb(); return;}
                fs.readFile(file.path, function(e, data) {
                    cObj.configuration = new Configuration(data.toString());
                    cObj.storage = file.storage;
                    cb(new Error('Loaded'));
                });
            });
    }, function(e) {
        if (e && e.message === 'Loaded') { cb(); return; }
        if (e) { cb(e); return; }
        cb(new Error('Failed to load any configuration'));
    });
};

Player.prototype.Save = function(cb) {
    cb = cb || function(){};
    var targetPath = this.storages[this.storage].path;
    if (!this.configuration.inited) {
        cb(new Error('Configuration not initialized'));
        return;
    }
    fs.writeFile(targetPath, JSON.stringify(this.configuration), cb);
};

module.exports = Player;
