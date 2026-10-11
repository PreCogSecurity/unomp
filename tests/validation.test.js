const validation = require('../libs/validation.js');

describe('Validation Utilities', () => {
    describe('validateRequired', () => {
        test('returns error for undefined', () => {
            expect(validation.validateRequired(undefined, 'field')).toBe('field: Required field is missing');
        });
        
        test('returns error for null', () => {
            expect(validation.validateRequired(null, 'field')).toBe('field: Required field is missing');
        });
        
        test('returns error for empty string', () => {
            expect(validation.validateRequired('', 'field')).toBe('field: Required field is missing');
        });
        
        test('returns null for valid value', () => {
            expect(validation.validateRequired('value', 'field')).toBeNull();
            expect(validation.validateRequired(0, 'field')).toBeNull();
            expect(validation.validateRequired(false, 'field')).toBeNull();
        });
    });
    
    describe('validateString', () => {
        test('returns error for non-string', () => {
            expect(validation.validateString(123, 'field')).toBe('field: Invalid type for field (expected string)');
        });
        
        test('validates minLength', () => {
            expect(validation.validateString('ab', 'field', { minLength: 3 })).toBe('field: Value out of allowed range (min length: 3)');
            expect(validation.validateString('abc', 'field', { minLength: 3 })).toBeNull();
        });
        
        test('validates maxLength', () => {
            expect(validation.validateString('abcd', 'field', { maxLength: 3 })).toBe('field: Value out of allowed range (max length: 3)');
            expect(validation.validateString('abc', 'field', { maxLength: 3 })).toBeNull();
        });
        
        test('validates pattern', () => {
            expect(validation.validateString('abc', 'field', { pattern: /^\d+$/ })).toBe('field: Invalid format for field');
            expect(validation.validateString('123', 'field', { pattern: /^\d+$/ })).toBeNull();
        });
    });
    
    describe('validateNumber', () => {
        test('returns error for non-number', () => {
            expect(validation.validateNumber('abc', 'field')).toBe('field: Invalid type for field (expected number)');
        });
        
        test('validates min/max', () => {
            expect(validation.validateNumber(5, 'field', { min: 10 })).toBe('field: Value out of allowed range (min: 10)');
            expect(validation.validateNumber(15, 'field', { max: 10 })).toBe('field: Value out of allowed range (max: 10)');
            expect(validation.validateNumber(10, 'field', { min: 5, max: 15 })).toBeNull();
        });
        
        test('validates integer', () => {
            expect(validation.validateNumber(1.5, 'field', { integer: true })).toBe('field: Invalid type for field (expected integer)');
            expect(validation.validateNumber(2, 'field', { integer: true })).toBeNull();
        });
    });
    
    describe('validatePort', () => {
        test('validates port range', () => {
            expect(validation.validatePort(0)).toBe('port: Value out of allowed range (min: 1)');
            expect(validation.validatePort(65536)).toBe('port: Value out of allowed range (max: 65535)');
            expect(validation.validatePort(80)).toBeNull();
            expect(validation.validatePort(443)).toBeNull();
            expect(validation.validatePort(3000)).toBeNull();
        });
        
        test('rejects non-integer', () => {
            expect(validation.validatePort(80.5)).toBe('port: Invalid type for field (expected integer)');
        });
    });
    
    describe('validateIP', () => {
        test('validates IPv4', () => {
            expect(validation.validateIP('127.0.0.1')).toBeNull();
            expect(validation.validateIP('192.168.1.1')).toBeNull();
            expect(validation.validateIP('0.0.0.0')).toBeNull();
            expect(validation.validateIP('255.255.255.255')).toBeNull();
        });
        
        test('rejects invalid IPv4', () => {
            expect(validation.validateIP('256.0.0.1')).toBe('ip: Invalid IP address (IPv4 octet > 255)');
            expect(validation.validateIP('192.168.1')).toBe('ip: Invalid IP address');
            expect(validation.validateIP('not.an.ip')).toBe('ip: Invalid IP address');
        });
        
        test('validates IPv6', () => {
            expect(validation.validateIP('::1')).toBeNull();
            expect(validation.validateIP('::')).toBeNull();
            expect(validation.validateIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBeNull();
        });
    });
    
    describe('validateAddress', () => {
        test('validates base58 address', () => {
            expect(validation.validateAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeNull();
            expect(validation.validateAddress('ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBeNull();
        });
        
        test('validates hex address', () => {
            // 0x + 40 hex chars = 42 total
            expect(validation.validateAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBeNull();
            expect(validation.validateAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')).toBeNull();
        });
        
        test('rejects invalid address', () => {
            // 'invalid' is 7 chars < 26, so fails length check first
            expect(validation.validateAddress('invalid')).toBe('address: Invalid cryptocurrency address format (invalid length)');
            expect(validation.validateAddress('short')).toBe('address: Invalid cryptocurrency address format (invalid length)');
            expect(validation.validateAddress('')).toBe('address: Required field is missing');
            // Test invalid characters with valid length
            expect(validation.validateAddress('invalidaddresswithinvalidchars!@#')).toBe('address: Invalid cryptocurrency address format (invalid characters)');
        });
    });
    
    describe('validateAlgorithm', () => {
        test('validates supported algorithms', () => {
            expect(validation.validateAlgorithm('sha256')).toBeNull();
            expect(validation.validateAlgorithm('scrypt')).toBeNull();
            expect(validation.validateAlgorithm('x11')).toBeNull();
            expect(validation.validateAlgorithm('ethash')).toBeNull();
        });
        
        test('rejects unsupported algorithm', () => {
            expect(validation.validateAlgorithm('unknown')).toBe('algorithm: Unsupported algorithm (got: unknown)');
        });
    });
    
    describe('validateJSON', () => {
        test('validates valid JSON', () => {
            expect(validation.validateJSON('{"key": "value"}')).toBeNull();
            expect(validation.validateJSON('[1, 2, 3]')).toBeNull();
        });
        
        test('rejects invalid JSON', () => {
            expect(validation.validateJSON('{invalid}')).toContain('Invalid JSON format');
        });
    });
    
    describe('validateObject', () => {
        test('validates object against schema', () => {
            const schema = {
                name: { type: 'string', required: true, minLength: 1 },
                port: { type: 'port', required: true },
                enabled: { type: 'boolean' }
            };
            
            const validObj = { name: 'test', port: 80, enabled: true };
            expect(validation.validateObject(validObj, schema)).toEqual([]);
            
            const invalidObj = { name: '', port: 99999 };
            const errors = validation.validateObject(invalidObj, schema);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    
    describe('sanitizeForLog', () => {
        test('removes control characters', () => {
            expect(validation.sanitizeForLog('test\x00\x1F\x7Fstring')).toBe('teststring');
        });
        
        test('truncates long strings', () => {
            const longStr = 'a'.repeat(1500);
            expect(validation.sanitizeForLog(longStr).length).toBe(1000);
        });
    });
    
    describe('createError', () => {
        test('creates standardized error', () => {
            const error = validation.createError('Test error', 'TEST_CODE', 400);
            expect(error).toEqual({
                error: {
                    message: 'Test error',
                    code: 'TEST_CODE',
                    statusCode: 400,
                    timestamp: expect.any(String)
                }
            });
        });
    });
});