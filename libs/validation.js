/**
 * Input validation utilities for UNOMP
 * Provides validation for common input types used in the mining pool
 */

const VALIDATION_ERRORS = {
    REQUIRED: 'Required field is missing',
    INVALID_TYPE: 'Invalid type for field',
    INVALID_FORMAT: 'Invalid format for field',
    OUT_OF_RANGE: 'Value out of allowed range',
    INVALID_ADDRESS: 'Invalid cryptocurrency address format',
    INVALID_PORT: 'Invalid port number',
    INVALID_IP: 'Invalid IP address',
    INVALID_ALGORITHM: 'Unsupported algorithm',
    INVALID_JSON: 'Invalid JSON format',
};

/**
 * Validates a required field exists
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field (for error messages)
 * @returns {string|null} - Error message or null if valid
 */
function validateRequired(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return `${fieldName}: ${VALIDATION_ERRORS.REQUIRED}`;
    }
    return null;
}

/**
 * Validates a string field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Regex pattern to match
 * @returns {string|null} - Error message or null if valid
 */
function validateString(value, fieldName, options = {}) {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    if (typeof value !== 'string') {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected string)`;
    }
    
    if (options.minLength !== undefined && value.length < options.minLength) {
        return `${fieldName}: ${VALIDATION_ERRORS.OUT_OF_RANGE} (min length: ${options.minLength})`;
    }
    
    if (options.maxLength !== undefined && value.length > options.maxLength) {
        return `${fieldName}: ${VALIDATION_ERRORS.OUT_OF_RANGE} (max length: ${options.maxLength})`;
    }
    
    if (options.pattern && !options.pattern.test(value)) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_FORMAT}`;
    }
    
    return null;
}

/**
 * Validates a numeric field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.integer - Whether value must be an integer
 * @returns {string|null} - Error message or null if valid
 */
function validateNumber(value, fieldName, options = {}) {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    const num = Number(value);
    if (isNaN(num)) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected number)`;
    }
    
    if (options.integer && !Number.isInteger(num)) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected integer)`;
    }
    
    if (options.min !== undefined && num < options.min) {
        return `${fieldName}: ${VALIDATION_ERRORS.OUT_OF_RANGE} (min: ${options.min})`;
    }
    
    if (options.max !== undefined && num > options.max) {
        return `${fieldName}: ${VALIDATION_ERRORS.OUT_OF_RANGE} (max: ${options.max})`;
    }
    
    return null;
}

/**
 * Validates a port number (1-65535)
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {string|null} - Error message or null if valid
 */
function validatePort(value, fieldName = 'port') {
    return validateNumber(value, fieldName, { min: 1, max: 65535, integer: true });
}

/**
 * Validates an IP address (IPv4 or IPv6)
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {string|null} - Error message or null if valid
 */
function validateIP(value, fieldName = 'ip') {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    if (typeof value !== 'string') {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected string)`;
    }
    
    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ipv4Regex.test(value)) {
        const parts = value.split('.');
        for (const part of parts) {
            if (parseInt(part, 10) > 255) {
                return `${fieldName}: ${VALIDATION_ERRORS.INVALID_IP} (IPv4 octet > 255)`;
            }
        }
        return null;
    }
    
    if (ipv6Regex.test(value) || value === '::1' || value === '::') {
        return null;
    }
    
    return `${fieldName}: ${VALIDATION_ERRORS.INVALID_IP}`;
}

/**
 * Validates a cryptocurrency address (basic validation)
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @param {string} currency - Currency type (for specific validation)
 * @returns {string|null} - Error message or null if valid
 */
function validateAddress(value, fieldName = 'address', currency = 'generic') {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    if (typeof value !== 'string') {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected string)`;
    }
    
    // Check for hex address first (Ethereum-style)
    const hexRegex = /^0x[a-fA-F0-9]{40}$/;
    if (hexRegex.test(value)) {
        return null;
    }
    
    // Basic validation - at least 26 chars, alphanumeric
    if (value.length < 26 || value.length > 100) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_ADDRESS} (invalid length)`;
    }
    
    // Check for valid characters (base58 or bech32)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    const bech32Regex = /^[a-z0-9]{1,83}$/;
    
    if (!base58Regex.test(value) && !bech32Regex.test(value)) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_ADDRESS} (invalid characters)`;
    }
    
    return null;
}

/**
 * Validates a mining algorithm
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {string|null} - Error message or null if valid
 */
function validateAlgorithm(value, fieldName = 'algorithm') {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    const supportedAlgorithms = [
        'sha256', 'scrypt', 'scrypt-n', 'x11', 'x13', 'x15', 'x17',
        'neoscrypt', 'lyra2re', 'lyra2rev2', 'lyra2z', 'quark', 'qubit',
        'groestl', 'keccak', 'blake', 'blake2s', 'skein', 'cryptonight',
        'cryptonight-light', 'cryptonight-heavy', 'equihash', 'ethash',
        'sha256d', 'sha256q', 'sha256t', 'sha3', 'sha3-256', 'sha3-512'
    ];
    
    if (typeof value !== 'string') {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected string)`;
    }
    
    if (!supportedAlgorithms.includes(value.toLowerCase())) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_ALGORITHM} (got: ${value})`;
    }
    
    return null;
}

/**
 * Validates a JSON string
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {string|null} - Error message or null if valid
 */
function validateJSON(value, fieldName = 'json') {
    const requiredError = validateRequired(value, fieldName);
    if (requiredError) return requiredError;
    
    if (typeof value !== 'string') {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected string)`;
    }
    
    try {
        JSON.parse(value);
        return null;
    } catch (e) {
        return `${fieldName}: ${VALIDATION_ERRORS.INVALID_JSON} (${e.message})`;
    }
}

/**
 * Validates an object against a schema
 * @param {Object} obj - Object to validate
 * @param {Object} schema - Validation schema
 * @returns {Array<string>} - Array of error messages (empty if valid)
 */
function validateObject(obj, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = obj[field];
        
        if (rules.required && (value === undefined || value === null)) {
            errors.push(`${field}: ${VALIDATION_ERRORS.REQUIRED}`);
            continue;
        }
        
        if (value === undefined || value === null) {
            continue; // Skip optional fields
        }
        
        let error = null;
        switch (rules.type) {
            case 'string':
                error = validateString(value, field, rules);
                break;
            case 'number':
                error = validateNumber(value, field, rules);
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    error = `${field}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected boolean)`;
                }
                break;
            case 'object':
                if (typeof value !== 'object' || Array.isArray(value)) {
                    error = `${field}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected object)`;
                } else if (rules.schema) {
                    const nestedErrors = validateObject(value, rules.schema);
                    errors.push(...nestedErrors.map(e => `${field}.${e}`));
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    error = `${field}: ${VALIDATION_ERRORS.INVALID_TYPE} (expected array)`;
                } else if (rules.items) {
                    value.forEach((item, index) => {
                        const itemErrors = validateObject({ item }, { item: rules.items });
                        errors.push(...itemErrors.map(e => `${field}[${index}].${e}`));
                    });
                }
                break;
            case 'port':
                error = validatePort(value, field);
                break;
            case 'ip':
                error = validateIP(value, field);
                break;
            case 'address':
                error = validateAddress(value, field, rules.currency);
                break;
            case 'algorithm':
                error = validateAlgorithm(value, field);
                break;
            case 'json':
                error = validateJSON(value, field);
                break;
            default:
                if (rules.validate && typeof rules.validate === 'function') {
                    error = rules.validate(value, field);
                }
        }
        
        if (error) {
            errors.push(error);
        }
    }
    
    return errors;
}

/**
 * Sanitizes a string for safe logging (removes control characters)
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeForLog(str) {
    if (typeof str !== 'string') {
        return String(str);
    }
    return str.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 1000);
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @returns {Object} - Standardized error object
 */
function createError(message, code = 'VALIDATION_ERROR', statusCode = 400) {
    return {
        error: {
            message,
            code,
            statusCode,
            timestamp: new Date().toISOString()
        }
    };
}

module.exports = {
    validateRequired,
    validateString,
    validateNumber,
    validatePort,
    validateIP,
    validateAddress,
    validateAlgorithm,
    validateJSON,
    validateObject,
    sanitizeForLog,
    createError,
    VALIDATION_ERRORS
};