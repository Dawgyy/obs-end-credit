const request = require('supertest');
const { app, close } = require('../server');

let server;

beforeAll((done) => {
    server = app.listen(4000, () => {
        console.log('Test server running on port 4000');
        done();
    });
});

afterAll((done) => {
    close();
    server.close(done);
});

describe('GET /api/subs', () => {
    it('should return list of subscribers', async () => {
        const response = await request(server).get('/api/subs'); 
        expect(response.statusCode).toBe(200);
    });
});

describe('GET /api/followers', () => {
    it('should return list of followers', async () => {
        const response = await request(server).get('/api/followers');
        expect(response.statusCode).toBe(200);
    });
});
