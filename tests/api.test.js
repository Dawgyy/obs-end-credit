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
    it('should return list of subscribers or unauthorized error', async () => {
        const response = await request(server).get('/api/subs'); 

        if (response.statusCode === 401) {
            console.log('Unauthorized. Make sure the application is authenticated.');
            expect(response.statusCode).toBe(401);
        } else {
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        }
    });
});

describe('GET /api/followers', () => {
    it('should return list of followers or unauthorized error', async () => {
        const response = await request(server).get('/api/followers');

        if (response.statusCode === 401) {
            console.log('Unauthorized. Make sure the application is authenticated.');
            expect(response.statusCode).toBe(401);
        } else {
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        }
    });
});
