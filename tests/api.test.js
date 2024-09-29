const request = require('supertest');
const { app, close } = require('../server'); 

afterAll(async () => {
    await close();
});

describe('GET /api/followers', () => {
    it('should return list of followers or 467 error', async () => {
        const response = await request(app).get('/api/followers');
        if (! (response.statusCode === 467 || response.statusCode === 200)) {
            throw new Error(`Unexpected status code: ${response.statusCode}`);
        } 
    });
});

describe('GET /api/subs', () => {
    it('should return list of subscribers or 467 error', async () => {
        const response = await request(app).get('/api/subs');
        if (! (response.statusCode === 467 || response.statusCode === 200)) {
            throw new Error(`Unexpected status code: ${response.statusCode}`);
        } 
    });
});
