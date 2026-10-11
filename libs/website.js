
var fs = require('fs');
var path = require('path');

var async = require('async');
var watch = require('node-watch');
var redis = require('redis');

var dot = require('dot');
var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');

var Stratum = require('merged-pooler');
var util = require('merged-pooler/lib/util.js');

var api = require('./api.js');
var validation = require('./validation.js');


module.exports = function(logger){

    dot.templateSettings.strip = false;

    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);

    var websiteConfig = portalConfig.website;

    var portalApi;
    var portalStats;

    var startPortalApi = function() {
        portalApi = new api(logger, portalConfig, poolConfigs);
        portalStats = portalApi.stats;
    }
    startPortalApi();

    var logSystem = 'Website';

    var pageFiles = {
        'index.html': 'index',
        'home.html': '',
        'getting_started.html': 'getting_started',
        'stats.html': 'stats',
        'workers.html': 'workers',
        'api.html': 'api',
        'miner.html': 'miner',
        'miner_stats.html': 'miner_stats',
        'admin.html': 'admin',
        'FAQ.html': 'FAQ',
        'about.html': 'about',
        'mining_key.html': 'mining_key'
    };

    var pageTemplates = {};

    var pageProcessed = {};
    var indexesProcessed = {};

    var keyScriptTemplate = '';
    var keyScriptProcessed = ''; 

    process.on('message', function(message) {
        switch(message.type){
            case 'reloadpool':
                if (message.coin) {
                    var messageCoin = message.coin.toLowerCase();
                    var poolTarget = Object.keys(poolConfigs).filter(function(p){
                        return p.toLowerCase() === messageCoin;
                    })[0];
                    poolConfigs  = JSON.parse(message.pools);
                    startPortalApi();
                }
                break;
        }
    });

    var processTemplates = function(){

        for (var pageName in pageTemplates){
            if (pageName === 'index') continue;
            pageProcessed[pageName] = pageTemplates[pageName]({
                poolsConfigs: poolConfigs,
                stats: portalStats.stats,
                portalConfig: portalConfig
            });
            indexesProcessed[pageName] = pageTemplates.index({
                page: pageProcessed[pageName],
                selected: pageName,
                stats: portalStats.stats,
                poolConfigs: poolConfigs,
                portalConfig: portalConfig
            });
        }

        //logger.debug(logSystem, 'Stats', 'Website updated to latest stats');
    };

    var readPageFiles = function(files){
        async.each(files, function(fileName, callback){
            var filePath = 'website/' + (fileName === 'index.html' ? '' : 'pages/') + fileName;
            fs.readFile(filePath, 'utf8', function(err, data){
                var pTemp = dot.template(data);
                pageTemplates[pageFiles[fileName]] = pTemp
                callback();
            });
        }, function(err){
            if (err){
                console.log('error reading files for creating dot templates: '+ JSON.stringify(err));
                return;
            }
            processTemplates();
        });
    };


    //If an html file was changed reload it
    watch('website', function(filename){
        var basename = path.basename(filename);
        if (basename in pageFiles){
            console.log(filename);
            readPageFiles([basename]);
            logger.debug(logSystem, 'Server', 'Reloaded file ' + basename);
        }
    });

    portalStats.getGlobalStats(function(){
        readPageFiles(Object.keys(pageFiles));
    });

    var buildUpdatedWebsite = function(){
        portalStats.getGlobalStats(function(){
            processTemplates();

            var statData = 'data: ' + JSON.stringify(portalStats.stats) + '\n\n';
            for (var uid in portalApi.liveStatConnections){
                var res = portalApi.liveStatConnections[uid];
                res.write(statData);
            }

        });
    };

    setInterval(buildUpdatedWebsite, websiteConfig.stats.updateInterval * 1000);


    var buildKeyScriptPage = function(){
        async.waterfall([
            function(callback){
                 var client = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
                 client.auth(portalConfig.redis.password);
                 client.select(portalConfig.redis.db);

                client.hgetall('coinVersionBytes', function(err, coinBytes){
                    if (err){
                        client.quit();
                        return callback('Failed grabbing coin version bytes from redis ' + JSON.stringify(err));
                    }
                    callback(null, client, coinBytes || {});
                });
            },
            function (client, coinBytes, callback){
                var enabledCoins = Object.keys(poolConfigs).map(function(c){return c.toLowerCase()});
                var missingCoins = [];
                enabledCoins.forEach(function(c){
                    if (!(c in coinBytes))
                        missingCoins.push(c);
                });
                callback(null, client, coinBytes, missingCoins);
            },
            function(client, coinBytes, missingCoins, callback){
                var coinsForRedis = {};
                async.each(missingCoins, function(c, cback){
                    var coinInfo = (function(){
                        for (var pName in poolConfigs){
                            if (pName.toLowerCase() === c)
                                return {
                                    daemon: poolConfigs[pName].paymentProcessing.daemon,
                                    address: poolConfigs[pName].address
                                }
                        }
                    })();
                    var daemon = new Stratum.daemon.interface([coinInfo.daemon], function(severity, message){
                        logger[severity](logSystem, c, message);
                    });
                    daemon.cmd('dumpprivkey', [coinInfo.address], function(result){
                        if (result[0].error){
                            logger.error(logSystem, c, 'Could not dumpprivkey for ' + c + ' ' + JSON.stringify(result[0].error));
                            cback();
                            return;
                        }

                        var vBytePub = util.getVersionByte(coinInfo.address)[0];
                        var vBytePriv = util.getVersionByte(result[0].response)[0];

                        coinBytes[c] = vBytePub.toString() + ',' + vBytePriv.toString();
                        coinsForRedis[c] = coinBytes[c];
                        cback();
                    });
                }, function(err){
                    callback(null, client, coinBytes, coinsForRedis);
                });
            },
            function(client, coinBytes, coinsForRedis, callback){
                if (Object.keys(coinsForRedis).length > 0){
                    client.hmset('coinVersionBytes', coinsForRedis, function(err){
                        if (err)
                            logger.error(logSystem, 'Init', 'Failed inserting coin byte version into redis ' + JSON.stringify(err));
                        client.quit();
                    });
                }
                else{
                    client.quit();
                }
                callback(null, coinBytes);
            }
        ], function(err, coinBytes){
            if (err){
                logger.error(logSystem, 'Init', err);
                return;
            }
            try{
                keyScriptTemplate = dot.template(fs.readFileSync('website/key.html', {encoding: 'utf8'}));
                keyScriptProcessed = keyScriptTemplate({coins: coinBytes});
            }
            catch(e){
                logger.error(logSystem, 'Init', 'Failed to read key.html file');
            }
        });

    };
    buildKeyScriptPage();

    var getPage = function(pageId){
        if (pageId in pageProcessed){
            var requestedPage = pageProcessed[pageId];
            return requestedPage;
        }
    };

    var route = function(req, res, next){
        var pageId = req.params.page || '';
        if (pageId in indexesProcessed){
            res.header('Content-Type', 'text/html');
            res.end(indexesProcessed[pageId]);
        }
        else
            next();

    };



    var app = express();


    app.use(bodyParser.json());

    app.get('/get_page', function(req, res, next){
        var requestedPage = getPage(req.query.id);
        if (requestedPage){
            res.end(requestedPage);
            return;
        }
        next();
    });

    app.get('/key.html', function(req, res, next){
        res.end(keyScriptProcessed);
    });

    app.get('/:page', route);
    app.get('/', route);

    app.get('/api/:method', function(req, res, next){
        // Validate method parameter
        var method = req.params.method;
        var methodError = validation.validateString(method, 'method', { 
            minLength: 1, 
            maxLength: 50, 
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/ 
        });
        if (methodError) {
            return res.status(400).json(validation.createError(methodError));
        }
        portalApi.handleApiRequest(req, res, next);
    });

    // Health check endpoint
    app.get('/health', function(req, res) {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: require('../package.json').version
        });
    });

    // Metrics endpoint (Prometheus-compatible)
    app.get('/metrics', function(req, res) {
        var mem = process.memoryUsage();
        var metrics = [
            '# HELP nodejs_memory_heap_used_bytes Process heap memory used',
            '# TYPE nodejs_memory_heap_used_bytes gauge',
            'nodejs_memory_heap_used_bytes ' + mem.heapUsed,
            '# HELP nodejs_memory_heap_total_bytes Process heap memory total',
            '# TYPE nodejs_memory_heap_total_bytes gauge',
            'nodejs_memory_heap_total_bytes ' + mem.heapTotal,
            '# HELP nodejs_uptime_seconds Process uptime in seconds',
            '# TYPE nodejs_uptime_seconds gauge',
            'nodejs_uptime_seconds ' + process.uptime(),
            '# HELP nodejs_version_info Node.js version info',
            '# TYPE nodejs_version_info gauge',
            'nodejs_version_info{version="' + process.version + '"} 1'
        ];
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics.join('\n') + '\n');
    });

    app.post('/api/admin/:method', function(req, res, next){
        if (portalConfig.website
            && portalConfig.website.adminCenter
            && portalConfig.website.adminCenter.enabled){
            
            // Validate password input
            var password = req.body && req.body.password;
            var passwordError = validation.validateString(password, 'password', { minLength: 1, maxLength: 100 });
            if (passwordError) {
                return res.status(400).json(validation.createError(passwordError));
            }
            
            // Constant-time comparison to prevent timing attacks
            var expectedPassword = portalConfig.website.adminCenter.password;
            var providedPassword = password || '';
            var match = expectedPassword.length === providedPassword.length;
            for (var i = 0; i < expectedPassword.length; i++) {
                if (expectedPassword.charCodeAt(i) !== providedPassword.charCodeAt(i)) {
                    match = false;
                }
            }
            
            if (match)
                portalApi.handleAdminApiRequest(req, res, next);
            else
                res.status(401).json(validation.createError('Incorrect Password', 'AUTH_ERROR', 401));

        }
        else
            next();

    });

    app.use(compress());
    app.use('/static', express.static('website/static'));

    app.use(function(err, req, res, next){
        console.error(err.stack);
        res.send(500, 'Something broke!');
    });

    try {
        app.listen(portalConfig.website.port, portalConfig.website.host, function () {
            logger.debug(logSystem, 'Server', 'Website started on ' + portalConfig.website.host + ':' + portalConfig.website.port);
        });
    }
    catch(e){
        logger.error(logSystem, 'Server', 'Could not start website on ' + portalConfig.website.host + ':' + portalConfig.website.port
            +  ' - its either in use or you do not have permission');
    }


};
