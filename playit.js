#!/usr/local/bin/node
var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    spawn = require('child_process').spawn,
    moment = require('moment'),
    glob = require('glob'),
    cmd = require('commander'),     //https://github.com/tj/commander.js
    keypress = require('keypress'), //https://github.com/TooTallNate/keypress
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
console.log('Args:', cmd.args);

if (cmd.init) {
    console.log('Init..');
    //TODO
    //Read directory, find pattern
    //Save config
    //Maye ask settings in command-promt?
    config.save();
    return;
}

if (cmd.args.length < 1) {
    if (config.load()) {
        console.log(config.data);
        //Print founded files for pattern
    } else {
        console.warn('Folder not initialized, run with "--init"');
    }
    return;
}

if (_.contains(cmd.args, 'next')) {
    config.data.position++;
}

if (_.contains(cmd.args, 'prev')) {
    config.data.position--;
}

if (!config.validate()) {
    console.warn('Config file not valid, please recheck it');
    return;
}

if (_.contains(cmd.args, 'play')) {
    var playerArgs = config.data.playerArgs;
    playerArgs.push(util.format(config.data.fileFormat, config.data.position));

    omx = spawn(config.data.player, playerArgs, { 
        stdio: 'inherit' 
    });

    omx.on('close', function (code) {
        console.log(_.capitalize(config.data.player) + ' has exited with code ' + code);
    });
}

/*
keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
    console.log(key);
    if (key && key.ctrl && key.name == 'c') {
        process.stdin.pause();
    }
});
process.stdin.setRawMode(true);
process.stdin.resume();*/
