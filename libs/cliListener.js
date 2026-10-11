var events = require('events');
var net = require('net');
var validation = require('./validation.js');

var listener = module.exports = function listener(port){

    var _this = this;

    var emitLog = function(text){
        _this.emit('log', text);
    };


    this.start = function(){
        net.createServer(function(c) {

            var data = '';
            try {
                c.on('data', function (d) {
                    data += d;
                    if (data.slice(-1) === '\n') {
                        var message;
                        try {
                            message = JSON.parse(data);
                        } catch (e) {
                            emitLog('CLI listener failed to parse JSON: ' + validation.sanitizeForLog(data));
                            c.end(JSON.stringify(validation.createError('Invalid JSON format')));
                            data = '';
                            return;
                        }
                        
                        // Validate message structure
                        if (!message.command || typeof message.command !== 'string') {
                            c.end(JSON.stringify(validation.createError('Missing or invalid command')));
                            data = '';
                            return;
                        }
                        
                        // Sanitize command
                        var command = validation.sanitizeForLog(message.command);
                        var params = Array.isArray(message.params) ? message.params : [];
                        var options = message.options && typeof message.options === 'object' ? message.options : {};
                        
                        _this.emit('command', command, params, options, function(response){
                            c.end(typeof response === 'string' ? response : JSON.stringify(response));
                        });
                        data = '';
                    }
                });
                c.on('end', function () {

                });
                c.on('error', function (err) {
                    emitLog('CLI listener socket error: ' + err.message);
                });
            }
            catch(e){
                emitLog('CLI listener failed: ' + e.message);
            }

        }).listen(port, '127.0.0.1', function() {
            emitLog('CLI listening on port ' + port + ' (localhost only)')
        });
    }

};

listener.prototype.__proto__ = events.EventEmitter.prototype;
