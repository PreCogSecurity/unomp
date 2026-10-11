/**
 * Structured logger for UNOMP
 * Supports both human-readable (development) and JSON (production) output
 */

var colors = require('colors');

var severityToColor = function(severity, text) {
    switch(severity) {
        case 'special':
            return text.cyan.underline;
        case 'debug':
            return text.green;
        case 'warning':
            return text.yellow;
        case 'error':
            return text.red;
        default:
            console.log("Unknown severity " + severity);
            return text.italic;
    }
};

var severityValues = {
    'debug': 1,
    'warning': 2,
    'error': 3,
    'special': 4
};

/**
 * Formats a date as ISO string
 * @returns {string} - ISO formatted date string
 */
function formatDate() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

/**
 * Creates a structured log entry
 * @param {string} severity - Log severity
 * @param {string} system - System component
 * @param {string} component - Sub-component
 * @param {string} message - Log message
 * @param {string} [subcat] - Sub-category
 * @param {Object} [meta] - Additional metadata
 * @returns {Object} - Structured log entry
 */
function createLogEntry(severity, system, component, message, subcat, meta) {
    return {
        timestamp: new Date().toISOString(),
        level: severity,
        system: system,
        component: component,
        subcat: subcat || null,
        message: message,
        meta: meta || {},
        pid: process.pid,
        hostname: require('os').hostname()
    };
}

/**
 * Formats a log entry for human-readable output
 * @param {Object} entry - Log entry
 * @param {boolean} useColors - Whether to use colors
 * @returns {string} - Formatted log string
 */
function formatHumanReadable(entry, useColors) {
    var entryDesc = formatDate() + ' [' + entry.system + ']\t';
    
    if (useColors) {
        entryDesc = severityToColor(entry.level, entryDesc);
        
        var logString =
                entryDesc +
                ('[' + entry.component + '] ').italic;
        
        if (entry.subcat)
            logString += ('(' + entry.subcat + ') ').bold.grey;
        
        logString += entry.message.grey;
        return logString;
    }
    else {
        var logString =
                entryDesc +
                '[' + entry.component + '] ';
        
        if (entry.subcat)
            logString += '(' + entry.subcat + ') ';
        
        logString += entry.message;
        return logString;
    }
}

/**
 * Formats a log entry as JSON
 * @param {Object} entry - Log entry
 * @returns {string} - JSON string
 */
function formatJSON(entry) {
    return JSON.stringify(entry);
}

var StructuredLogger = function (configuration) {
    var logLevelInt = severityValues[configuration.logLevel] || 1;
    var logColors = configuration.logColors;
    var jsonOutput = configuration.jsonOutput || false;
    var logFile = configuration.logFile || null;
    
    var fs = require('fs');
    var fileStream = null;
    
    if (logFile) {
        fileStream = fs.createWriteStream(logFile, { flags: 'a' });
    }

    var log = function(severity, system, component, message, subcat, meta) {
        if (severityValues[severity] < logLevelInt) return;

        // Handle the case where subcat and message are swapped (legacy API)
        if (subcat && typeof subcat === 'string' && meta === undefined && arguments.length === 5) {
            var realText = subcat;
            var realSubCat = message;
            message = realText;
            subcat = realSubCat;
            meta = null;
        }

        var entry = createLogEntry(severity, system, component, message, subcat, meta);
        
        // Output to console
        if (jsonOutput) {
            console.log(formatJSON(entry));
        } else {
            console.log(formatHumanReadable(entry, logColors));
        }
        
        // Output to file if configured
        if (fileStream) {
            fileStream.write(formatJSON(entry) + '\n');
        }
    };

    // public
    var _this = this;
    Object.keys(severityValues).forEach(function(logType){
        _this[logType] = function(){
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift(logType);
            log.apply(this, args);
        };
    });
    
    // Add structured logging methods
    _this.log = function(severity, system, component, message, meta) {
        log(severity, system, component, message, null, meta);
    };
    
    _this.audit = function(action, details) {
        log('special', 'AUDIT', action, 'Audit event', null, details);
    };
    
    _this.security = function(event, details) {
        log('warning', 'SECURITY', event, 'Security event', null, details);
    };
    
    _this.performance = function(operation, durationMs, details) {
        log('debug', 'PERF', operation, 'Performance metric', null, { durationMs: durationMs, ...details });
    };
    
    _this.close = function() {
        if (fileStream) {
            fileStream.end();
        }
    };
};

module.exports = StructuredLogger;