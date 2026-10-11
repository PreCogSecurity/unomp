const StructuredLogger = require('../libs/structuredLogger.js');

describe('Structured Logger', () => {
    let logger;
    let consoleSpy;
    
    beforeEach(() => {
        logger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: false,
            logFile: null
        });
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
        consoleSpy.mockRestore();
        logger.close();
    });
    
    test('logs debug message', () => {
        logger.debug('TestSystem', 'TestComponent', 'Debug message');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });
    
    test('logs warning message', () => {
        logger.warning('TestSystem', 'TestComponent', 'Warning message');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });
    
    test('logs error message', () => {
        logger.error('TestSystem', 'TestComponent', 'Error message');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });
    
    test('logs special message', () => {
        logger.special('TestSystem', 'TestComponent', 'Special message');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Special message'));
    });
    
    test('respects log level', () => {
        const warnLogger = new StructuredLogger({
            logLevel: 'warning',
            logColors: false,
            jsonOutput: false,
            logFile: null
        });
        
        const warnSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        warnLogger.debug('TestSystem', 'TestComponent', 'Debug message');
        expect(warnSpy).not.toHaveBeenCalled();
        
        warnLogger.warning('TestSystem', 'TestComponent', 'Warning message');
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
        
        warnSpy.mockRestore();
        warnLogger.close();
    });
    
    test('outputs JSON when configured', () => {
        const jsonLogger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: true,
            logFile: null
        });
        
        const jsonSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        jsonLogger.debug('TestSystem', 'TestComponent', 'JSON message');
        
        const logged = jsonSpy.mock.calls[0][0];
        const parsed = JSON.parse(logged);
        
        expect(parsed.level).toBe('debug');
        expect(parsed.system).toBe('TestSystem');
        expect(parsed.component).toBe('TestComponent');
        expect(parsed.message).toBe('JSON message');
        expect(parsed.timestamp).toBeDefined();
        expect(parsed.pid).toBe(process.pid);
        
        jsonSpy.mockRestore();
        jsonLogger.close();
    });
    
    test('includes metadata in structured log', () => {
        const jsonLogger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: true,
            logFile: null
        });
        
        const jsonSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        jsonLogger.log('debug', 'TestSystem', 'TestComponent', 'Message with meta', { key: 'value', count: 42 });
        
        const logged = jsonSpy.mock.calls[0][0];
        const parsed = JSON.parse(logged);
        
        expect(parsed.meta).toEqual({ key: 'value', count: 42 });
        
        jsonSpy.mockRestore();
        jsonLogger.close();
    });
    
    test('audit method creates audit log', () => {
        const jsonLogger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: true,
            logFile: null
        });
        
        const jsonSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        jsonLogger.audit('user_login', { userId: 123, ip: '127.0.0.1' });
        
        const logged = jsonSpy.mock.calls[0][0];
        const parsed = JSON.parse(logged);
        
        expect(parsed.level).toBe('special');
        expect(parsed.system).toBe('AUDIT');
        expect(parsed.component).toBe('user_login');
        expect(parsed.meta).toEqual({ userId: 123, ip: '127.0.0.1' });
        
        jsonSpy.mockRestore();
        jsonLogger.close();
    });
    
    test('security method creates security log', () => {
        const jsonLogger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: true,
            logFile: null
        });
        
        const jsonSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        jsonLogger.security('failed_login', { ip: '127.0.0.1', attempts: 5 });
        
        const logged = jsonSpy.mock.calls[0][0];
        const parsed = JSON.parse(logged);
        
        expect(parsed.level).toBe('warning');
        expect(parsed.system).toBe('SECURITY');
        expect(parsed.component).toBe('failed_login');
        expect(parsed.meta).toEqual({ ip: '127.0.0.1', attempts: 5 });
        
        jsonSpy.mockRestore();
        jsonLogger.close();
    });
    
    test('performance method creates perf log', () => {
        const jsonLogger = new StructuredLogger({
            logLevel: 'debug',
            logColors: false,
            jsonOutput: true,
            logFile: null
        });
        
        const jsonSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        jsonLogger.performance('database_query', 150, { query: 'SELECT * FROM users' });
        
        const logged = jsonSpy.mock.calls[0][0];
        const parsed = JSON.parse(logged);
        
        expect(parsed.level).toBe('debug');
        expect(parsed.system).toBe('PERF');
        expect(parsed.component).toBe('database_query');
        expect(parsed.meta.durationMs).toBe(150);
        expect(parsed.meta.query).toBe('SELECT * FROM users');
        
        jsonSpy.mockRestore();
        jsonLogger.close();
    });
});