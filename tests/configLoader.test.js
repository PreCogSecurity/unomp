const configLoader = require('../libs/configLoader.js');
const fs = require('fs');
const path = require('path');

describe('Config Loader', () => {
    const testConfigDir = path.join(__dirname, 'fixtures');
    
    beforeAll(() => {
        if (!fs.existsSync(testConfigDir)) {
            fs.mkdirSync(testConfigDir, { recursive: true });
        }
    });
    
    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(testConfigDir)) {
            fs.rmSync(testConfigDir, { recursive: true, force: true });
        }
    });
    
    describe('substituteEnvVars', () => {
        test('substitutes simple variable', () => {
            process.env.TEST_VAR = 'test_value';
            const result = configLoader.substituteEnvVars('${TEST_VAR}');
            expect(result).toBe('test_value');
            delete process.env.TEST_VAR;
        });
        
        test('uses default value when variable not set', () => {
            delete process.env.MISSING_VAR;
            const result = configLoader.substituteEnvVars('${MISSING_VAR:-default_value}');
            expect(result).toBe('default_value');
        });
        
        test('returns original when variable not set and no default', () => {
            delete process.env.MISSING_VAR;
            const result = configLoader.substituteEnvVars('${MISSING_VAR}');
            expect(result).toBe('${MISSING_VAR}');
        });
        
        test('substitutes in object', () => {
            process.env.DB_HOST = 'localhost';
            process.env.DB_PORT = '5432';
            const obj = {
                host: '${DB_HOST}',
                port: '${DB_PORT}',
                name: 'test'
            };
            const result = configLoader.substituteEnvVars(obj);
            expect(result.host).toBe('localhost');
            expect(result.port).toBe('5432');
            expect(result.name).toBe('test');
            delete process.env.DB_HOST;
            delete process.env.DB_PORT;
        });
        
        test('substitutes in array', () => {
            process.env.ITEM1 = 'value1';
            process.env.ITEM2 = 'value2';
            const arr = ['${ITEM1}', '${ITEM2}', 'static'];
            const result = configLoader.substituteEnvVars(arr);
            expect(result).toEqual(['value1', 'value2', 'static']);
            delete process.env.ITEM1;
            delete process.env.ITEM2;
        });
        
        test('handles nested objects', () => {
            process.env.NESTED_VAR = 'nested_value';
            const obj = {
                level1: {
                    level2: '${NESTED_VAR}'
                }
            };
            const result = configLoader.substituteEnvVars(obj);
            expect(result.level1.level2).toBe('nested_value');
            delete process.env.NESTED_VAR;
        });
    });
    
    describe('loadConfig', () => {
        test('loads and substitutes config file', () => {
            process.env.TEST_PORT = '3000';
            process.env.TEST_HOST = 'test.example.com';
            
            const configContent = JSON.stringify({
                port: '${TEST_PORT}',
                host: '${TEST_HOST}',
                static: 'value'
            });
            
            const configPath = path.join(testConfigDir, 'test.json');
            fs.writeFileSync(configPath, configContent);
            
            const config = configLoader.loadConfig(configPath);
            expect(config.port).toBe('3000');
            expect(config.host).toBe('test.example.com');
            expect(config.static).toBe('value');
            
            delete process.env.TEST_PORT;
            delete process.env.TEST_HOST;
        });
        
        test('handles missing config file', () => {
            expect(() => {
                configLoader.loadConfig('/nonexistent/path/config.json');
            }).toThrow();
        });
    });
});