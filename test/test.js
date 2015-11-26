var fs = require('fs'),
    assert = require('assert'),
    mock = require('mock-fs'),
    should = require('should'),
    morph = require('mock-env').morph,
    crypto = require('crypto'),
    Player = require('../player.js'),
    Configuration = require('../config.js');

describe('Configuration', function() {
    describe('init', function() {
        it('should work with Ex.ua urls list format files', function(done) {
            mock({
                '/some/fake/dir': {
                    'playlist.txt': 'http://www.ex.ua/get/204588863\n'
                                  + 'http://www.ex.ua/get/204590870\n'
                                  + 'http://www.ex.ua/get/204611306\n'
                                  + 'http://www.ex.ua/get/204621641\n'
                                  + 'http://www.ex.ua/get/204638479'
                }
            });
            var conf = new Configuration();
            conf.Init('/some/fake/dir/playlist.txt', function() {
                conf.playlist.data.length.should.be.equal(5);
                done();
            });
        });

        it('should work with NameXX.avi format folders', function(done) {
            mock({
                '/some/fake/dir2': {
                    '61534165554555.jpg': '1',
                    'TheWitcher.S01E02.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E05.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E08.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E11.DvdRip.S01Enakepit.avi': '1',
                    '7428724.url': '1',
                    'TheWitcher.S01E03.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E06.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E09.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E12.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E01.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E04.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E07.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E10.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E13.DvdRip.S01Enakepit.avi': '1'
                }
            });
            var conf = new Configuration();
            conf.Init('/some/fake/dir2', function(e) {
                conf.playlist.data.length.should.be.equal(13);
                done();
            });
        });
    });

    describe('constructor', function() {
        it('should load data correctly', function(done) {
            var conf = new Configuration();
            conf.playlist.position = 2;
            var sdata = JSON.stringify(conf);
            var conf2 = new Configuration(sdata);
            conf2.playlist.position.should.be.equal(conf.playlist.position);
            done();
        });
    });
});

describe('Playlist', function() {
    describe('selecting', function() {
        it('should work fine after switching episode', function(done) {
            mock({
                '/some/fake/dir2': {
                    '61534165554555.jpg': '1',
                    'TheWitcher.S01E02.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E05.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E08.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E11.DvdRip.S01Enakepit.avi': '1',
                    '7428724.url': '1',
                    'TheWitcher.S01E03.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E06.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E09.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E12.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E01.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E04.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E07.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E10.DvdRip.S01Enakepit.avi': '1',
                    'TheWitcher.S01E13.DvdRip.S01Enakepit.avi': '1'
                }
            });

            var conf = new Configuration();
            conf.Init('/some/fake/dir2', function(e) {
                conf.playlist.data.length.should.be.equal(13);
                conf.playlist.position = 1;
                conf.GetPlaylistItem(function(e, item) {
                    (e == null).should.be.exactly(true, e ? e.message : '');
                    item.should.be.equal('TheWitcher.S01E01.DvdRip.S01Enakepit.avi');
                    conf.playlist.position = 5;
                    conf.GetPlaylistItem(function(e, item) {
                        item.should.be.equal('TheWitcher.S01E05.DvdRip.S01Enakepit.avi');
                        done();
                    });
                });
                
            });
        });
    });
});

describe('Player', function() {
    describe('load', function() {
        it('should find local config file and load it correctly', function(done) {
            mock({
                '/some/fake/dir': {
                    'playlist.txt': 'http://www.ex.ua/get/204588863\n'
                                  + 'http://www.ex.ua/get/204590870\n'
                                  + 'http://www.ex.ua/get/204611306\n'
                                  + 'http://www.ex.ua/get/204621641\n'
                                  + 'http://www.ex.ua/get/204638479'
                }
            });
            var conf = new Configuration();
            conf.Init('/some/fake/dir/playlist.txt', function() {
                conf.playlist.position = 2;
                var serializedConfig = JSON.stringify(conf);
                mock({
                    '/some/fake/dir': {
                        '.playit': serializedConfig
                    }
                });
                var player = new Player('/some/fake/dir');
                player.Load(function(e) {
                    player.configuration.playlist.data.length.should.be.exactly(5);
                    player.configuration.playlist.position.should.be.exactly(2);
                    done();
                });
            });
        });
    });

    describe('local save', function() {
        it('should successfully create configuration', function(done) {
            mock({
                '/some/fake/dir': {
                    'playlist.txt': 'http://www.ex.ua/get/204588863\n'
                                  + 'http://www.ex.ua/get/204590870\n'
                                  + 'http://www.ex.ua/get/204611306\n'
                                  + 'http://www.ex.ua/get/204621641\n'
                                  + 'http://www.ex.ua/get/204638479'
                }
            });
            var player = new Player('/some/fake/dir');
            player.configuration.Init('/some/fake/dir/playlist.txt', function() {
                var serializedConfig = JSON.stringify(player.configuration);
                player.Save(function(e) {
                    (e == null).should.be.exactly(true, e ? e.message : '');
                    fs.readFile('/some/fake/dir/.playit', function(e, data) {
                        (e == null).should.be.exactly(true, e ? e.message : '');
                        data.toString().should.be.equal(serializedConfig);
                        done();
                    });
                });
            });
        });
    });

    describe('global save', function() {
        it('should successfully create configuration', function(done) {
            mock({
                '/home/user/.playit': {},
                '/some/fake/dir': {
                    'playlist.txt': 'http://www.ex.ua/get/204588863\n'
                                  + 'http://www.ex.ua/get/204590870\n'
                                  + 'http://www.ex.ua/get/204611306\n'
                                  + 'http://www.ex.ua/get/204621641\n'
                                  + 'http://www.ex.ua/get/204638479'
                }
            });
            morph(function() {
                var player = new Player('/some/fake/dir');
                player.configuration.Init('/some/fake/dir/playlist.txt', function() {
                    var serializedConfig = JSON.stringify(player.configuration);
                    player.storage = 'global';
                    player.Save(function(e) {
                        (e == null).should.be.exactly(true, e ? e.message : '');
                        var currentDirHash = crypto.createHash('md5').update('/some/fake/dir').digest('hex');
                        fs.readFile('/home/user/.playit/' + currentDirHash, function(e, data) {
                            (e == null).should.be.exactly(true, e ? e.message : '');
                            data.toString().should.be.equal(serializedConfig);
                            done();
                        });
                    });
                });
            }, {
                HOME: '/home/user',
                USERPROFILE: '/home/user'
            });
        });
    });
});