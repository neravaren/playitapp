#!/usr/local/bin/node

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    spawn = require('child_process').spawn,
    moment = require('moment'),
    glob = require('glob'),
    cmd = require('commander'),     //https://github.com/tj/commander.js
    //keypress = require('keypress'), //https://github.com/TooTallNate/keypress
    chalk = require('chalk'),       //https://github.com/sindresorhus/chalk
    _ = require('lodash'),          //https://lodash.com/docs#trim
    pattern = require('./patternSearch');

cmd.version('1.0.0')
   .option('-i, --initdir', 'Init current folder as playable based on content', '')
   .option('-f, --initfile [srcfile]', 'Init current folder as playable based on url list file', '')
   .option('-s, --set [command]', 'Set pattern of command used to play video', '')
   .option('-c, --current [num]', 'Force to change current series', '')
   .parse(process.argv);

var config = {
    data: {
        player: 'omxplayer',
        playerArgs: ['-r', '-b', '--align', 'center'],
        fileFormat: 'One Piece %s.mp4',
        playlistType: 'incremental',
        position: 667
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
        fs.writeFileSync(this.env.path(), JSON.stringify(this.data));
    },
    validate: function() {
        if (this.data.fileFormat.indexOf('%s') < 0 )
            return false;
        if (!fs.existsSync(util.format(this.data.fileFormat, this.data.position)))
            return false;
        return true;
    },
    init: function(dir, cb) {
        pattern.getMetrics(dir, { ctx: this }, function(e, r) {
            if (e) { cb(e); return; }
            var nr = _.last(r);
            console.log(util.format('Found %s items by pattern "%s"', nr.count, nr.pattern));
            var newData = {
                fileFormat: nr.pattern,
                playlistType: 'glob',
                position: 1
            };
            this.data = _.extend(this.data, newData);
            cb(null);
        });
    }
};

console.log(chalk.bold('PlayItApp!'));
console.log(chalk.bold('Args:'), cmd.args);

if (cmd.initdir) {
    console.log('Init folder..');
    config.init('.', function(e) {
        config.save();
    });
    return;
}

var configLoaded = config.load();

if (cmd.current > 0) {
    console.log('Chaging current series to ' + cmd.current);
    config.data.position = cmd.current;
    config.save();
    return;
}

if (cmd.args.length < 1) {
    if (configLoaded) {
        console.log(chalk.bold('Settings:'), config.data);
        //Print founded files for pattern
    } else {
        console.warn('Folder not initialized, run with "-i"');
    }
    return;
}

if (_.contains(cmd.args, 'next')) {
    config.data.position+=1;
    console.log('New position:', config.data.position);
}

if (_.contains(cmd.args, 'prev')) {
    config.data.position-=1;
    console.log('New position:', config.data.position);
}

/*if (!config.validate()) {
    console.warn('Config file not valid, please recheck it');
    return;
} else {
    config.save();
}*/

var playingItem = pattern.getPlaylistItemSync({
    dir: process.cwd(), 
    type: config.data.playlistType, 
    pattern: config.data.fileFormat, 
    position: config.data.position
});
console.log('Playing', playingItem);
//  util.format(config.data.fileFormat, config.data.position); //getPlaylistItem

var playerArgs = config.data.playerArgs;
playerArgs.push(playingItem);

spawn(config.data.player, playerArgs, { 
    stdio: 'inherit' 
}).on('close', function (code) {
    console.log(_.capitalize(config.data.player) + ' has exited with code ' + code);
});