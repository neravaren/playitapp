#!/usr/local/bin/node

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    spawn = require('child_process').spawn,
    moment = require('moment'),
    glob = require('glob'),
    async = require('async'),
    cmd = require('commander'),     //https://github.com/tj/commander.js
    //keypress = require('keypress'), //https://github.com/TooTallNate/keypress
    chalk = require('chalk'),       //https://github.com/sindresorhus/chalk
    _ = require('lodash'),          //https://lodash.com/docs#trim
    playlist = require('./playlistTools'),
    config = require('./config');

cmd.version('1.0.0')
   .option('-i, --initdir', 'Init current folder as playable based on content', '')
   .option('-f, --initfile [srcfile]', 'Init current folder as playable based on url list file', '')
   .option('-s, --set [num]', 'Force to change current series', '')
   .parse(process.argv);

console.log(chalk.bold('PlayItApp!'));
console.log(chalk.bold('Args:'), cmd.args);

var configLoaded = false;
var playingItem = '';
async.series([
    function(cb) {
        if (cmd.initdir) {
            console.log('Init folder..');
            config.init('.', function(e) {
                config.save();
                playlist.getPlaylist(config.data, function(e, r) {
                    console.log(r);
                    cb(1);
                });
            });
            return;
        }
        cb();
    },

    function(cb) {
        configLoaded = config.load();
        if (configLoaded && cmd.set > 0) {
            console.log('Chaging current series to ' + cmd.set);
            config.data.position = cmd.set;
            config.save();
            cb(1);
            return;
        }
        cb();
    },

    function(cb) {
        if (cmd.args.length < 1) {
            if (configLoaded) {
                console.log(chalk.bold('Settings:'), config.data);
                playlist.getPlaylist(config.data, function(e, r) {
                    console.log(chalk.bold('Playlist:'), r);
                    cb(1);
                });
                return;
            } else {
                console.warn('Folder not initialized, run with "-i"');
            }
            cb(1);
            return;
        }
        cb();
    },

    function(cb) {
        if (_.contains(cmd.args, 'next')) {
            config.data.position = parseInt(config.data.position) + 1;
            console.log('New position:', config.data.position);
            config.save();
        }

        if (_.contains(cmd.args, 'prev')) {
            config.data.position = parseInt(config.data.position) - 1;
            console.log('New position:', config.data.position);
            config.save();
        }

        cb();
    },

    function(cb) {
        playlist.getPlaylistItem(config.data, function(e, r) {
            if (e) { cb(e); return; }
            playingItem = r;
            console.log(chalk.bold('Playing:'), playingItem);
            cb();
        });
    },
    function(cb) {
        var playerArgs = config.data.playerArgs;
        playerArgs.push(playingItem);

        spawn(config.data.player, playerArgs, { 
            stdio: 'inherit' 
        }).on('close', function (code) {
            console.log(_.capitalize(config.data.player) + ' has exited with code ' + code);
            cb();
        });
    }

],  function(e) {
    console.log('Done', e);
});