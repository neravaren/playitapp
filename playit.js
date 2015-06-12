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
    _ = require('lodash');          //https://lodash.com/docs#trim

cmd.version('1.0.0')
   .option('-i, --init', 'Init current folder as playable', '')
   .option('-s, --set [command]', 'Set command used to play video', '')
   .option('-c, --current [num]', 'Change current series', '')
   .parse(process.argv);

var config = {
    data: {
        player: 'omxplayer',
        playerArgs: ['-r', '-b', '--align', 'center'],
        fileFormat: 'One Piece %s.mp4',
        position: 667,
        season: 1
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
    }
};

console.log(chalk.bold('PlayItApp!'));
console.log(chalk.bold('Args:'), cmd.args);

if (cmd.init) {
    console.log('Init..');
    //TODO
    //Read directory, find pattern
    //Save config
    //Maye ask settings in command-promt?
    config.save();
    return;
}

var configLoaded = config.load();
if (cmd.args.length < 1) {
    if (configLoaded) {
        console.log(chalk.bold('Settings:'), config.data);
        //Print founded files for pattern
    } else {
        console.warn('Folder not initialized, run with "--init"');
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

if (!config.validate()) {
    console.warn('Config file not valid, please recheck it');
    return;
} else {
    config.save();
}

var playerArgs = config.data.playerArgs;
playerArgs.push(util.format(config.data.fileFormat, config.data.position));

spawn(config.data.player, playerArgs, { 
    stdio: 'inherit' 
}).on('close', function (code) {
    console.log(_.capitalize(config.data.player) + ' has exited with code ' + code);
});