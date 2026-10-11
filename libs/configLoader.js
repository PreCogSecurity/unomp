/**
 * Configuration loader with environment variable substitution
 * Supports ${VAR_NAME} and ${VAR_NAME:-default} syntax
 */

function substituteEnvVars(obj) {
    if (typeof obj === 'string') {
        return obj.replace(/\$\{([^}:]+)(?::-([^}]*))?\}/g, (match, varName, defaultValue) => {
            const value = process.env[varName];
            if (value !== undefined) {
                return value;
            }
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            console.warn(`Environment variable ${varName} not set and no default provided`);
            return match; // Return original if not found
        });
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => substituteEnvVars(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substituteEnvVars(value);
        }
        return result;
    }
    
    return obj;
}

function loadConfig(configPath) {
    const fs = require('fs');
    const path = require('path');
    
    // Load .env file if it exists
    const envPath = path.join(path.dirname(configPath), '.env');
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
    }
    
    const configContent = fs.readFileSync(configPath, { encoding: 'utf8' });
    const JSONminify = require('node-json-minify');
    const config = JSON.parse(JSONminify(configContent));
    
    return substituteEnvVars(config);
}

module.exports = { loadConfig, substituteEnvVars };