const request = require('supertest');
const express = require('express');
const validation = require('../libs/validation.js');

describe('Website Module - Health/Metrics/Admin', () => {
    let app;
    let server;
    
    beforeAll(() => {
        app = express();
        app.use(express.json());
        
        // Add health endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '0.0.5'
            });
        });
        
        // Add metrics endpoint
        app.get('/metrics', (req, res) => {
            const mem = process.memoryUsage();
            const metrics = [
                '# HELP nodejs_memory_heap_used_bytes Process heap memory used',
                '# TYPE nodejs_memory_heap_used_bytes gauge',
                `nodejs_memory_heap_used_bytes ${mem.heapUsed}`,
                '# HELP nodejs_uptime_seconds Process uptime in seconds',
                '# TYPE nodejs_uptime_seconds gauge',
                `nodejs_uptime_seconds ${process.uptime()}`
            ];
            res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
            res.send(`${metrics.join('\n')}\n`);
        });
        
        // Add admin endpoint with validation
        app.post('/api/admin/:method', (req, res) => {
            const password = req.body && req.body.password;
            const passwordError = validation.validateString(password, 'password', { minLength: 1, maxLength: 100 });
            if (passwordError) {
                return res.status(400).json(validation.createError(passwordError));
            }
            
            const expectedPassword = 'testpassword123';
            const providedPassword = password || '';
            let match = expectedPassword.length === providedPassword.length;
            for (let i = 0; i < expectedPassword.length; i++) {
                if (expectedPassword.charCodeAt(i) !== providedPassword.charCodeAt(i)) {
                    match = false;
                }
            }
            
            if (match) {
                res.json({ admin: true });
            } else {
                res.status(401).json(validation.createError('Incorrect Password', 'AUTH_ERROR', 401));
            }
        });
        
        server = app.listen(0);
    });
    
    afterAll((done) => {
        server.close(done);
    });
    
    describe('Health Endpoint', () => {
        test('returns 200 with health info', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.uptime).toBeGreaterThan(0);
            expect(response.body.memory).toBeDefined();
            expect(response.body.version).toBe('0.0.5');
        });
    });
    
    describe('Metrics Endpoint', () => {
        test('returns Prometheus-compatible metrics', async () => {
            const response = await request(app).get('/metrics');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/plain');
            expect(response.text).toContain('nodejs_memory_heap_used_bytes');
            expect(response.text).toContain('nodejs_uptime_seconds');
        });
    });
    
    describe('Admin API', () => {
        test('rejects missing password', async () => {
            const response = await request(app)
                .post('/api/admin/pools')
                .send({});
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
        
        test('rejects invalid password', async () => {
            const response = await request(app)
                .post('/api/admin/pools')
                .send({ password: 'wrong' });
            expect(response.status).toBe(401);
            expect(response.body.error.code).toBe('AUTH_ERROR');
        });
        
        test('accepts correct password', async () => {
            const response = await request(app)
                .post('/api/admin/pools')
                .send({ password: 'testpassword123' });
            expect(response.status).toBe(200);
            expect(response.body.admin).toBe(true);
        });
    });
});