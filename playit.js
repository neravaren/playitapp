#!/usr/local/bin/node

var cmd = require('commander'),
    chalk = require('chalk'),
    async = require('async'),
    Player = require('./player');

cmd.version('1.0.0')
   .option('-i, --info', 'Show current configuration and playlist')
   .option('-d, --initdir', 'Init current folder as playable based on content', '')
   .option('-f, --initfile [srcfile]', 'Init current folder as playable based on url list file', '')
   .option('-g, --global', 'Save configuration to global storage', '')
   .option('-j, --jump [num]', 'Jump to series and play', '')
   .parse(process.argv);

console.log(chalk.bold('PlayItApp!'));

var player = new Player();

if (cmd.initdir || cmd.initfile) {
    player.configuration.Init(cmd.initdir || cmd.initfile, function(e) {
        if (e) { console.log(e); return; }
        console.log(chalk.bold('Inited!'));
        player.storage = cmd.global ? 'global' : 'local';
        player.Save(function(e) {
            if (e) { console.log(e); return; }
            console.log(chalk.bold('Configuration saved.'));
        });
    });
    return;
}

player.Load(function(e) {
    if (e) {
        console.log(e);
        return;
    }

    if (cmd.info) {
        console.log(player.configuration);
        return;
    }

    if (cmd.jump) {
        console.log(chalk.bold('Jump to:'), cmd.jump, 'position.');
        player.Jump(cmd.jump);
    }

    player.Play(function(e) {
        if (e) {
            console.log(e);
            return;
        }
        console.log(chalk.bold('Played well!'));
        player.Save(function(e) {
            if (e) { console.log(e); return; }
            console.log(chalk.bold('Configuration saved.'));
        });
    });
});