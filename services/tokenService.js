require('dotenv').config();
const axios = require('axios');
const { updateEnv } = require('./envService');


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function refreshAccessToken() {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: process.env.REFRESH_TOKEN
    });

    try {
        const response = await axios.post(url, params.toString(), {
            httpsAgent: new (require('https')).Agent({ keepAlive: false }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;

        await updateEnv({
            ACCESS_TOKEN: data.access_token,
            REFRESH_TOKEN: data.refresh_token,
            TOKEN_EXPIRATION_TIME: data.expires_in
        });


        return true;
    } catch (error) {
        return false;
    }
}

async function ensureAccessToken() {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
        const error = new Error('Unauthorized');
        error.statusCode = 401;
        throw error;
    }
}

module.exports = { refreshAccessToken, ensureAccessToken };
