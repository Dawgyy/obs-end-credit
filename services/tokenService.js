require('dotenv').config();
const axios = require('axios');
const { updateEnv } = require('./envService');

let accessToken = process.env.ACCESS_TOKEN || null;
let refreshToken = process.env.REFRESH_TOKEN || null;
let tokenExpirationTime = parseInt(process.env.TOKEN_EXPIRATION_TIME) || 0;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function refreshAccessToken() {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    try {
        const response = await axios.post(url, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        tokenExpirationTime = Date.now() + (data.expires_in * 1000);

        updateEnv({
            ACCESS_TOKEN: accessToken,
            REFRESH_TOKEN: refreshToken,
            TOKEN_EXPIRATION_TIME: tokenExpirationTime.toString()
        });

        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token :', error);
        return false;
    }
}

async function ensureAccessToken() {
    if (!accessToken || Date.now() > tokenExpirationTime) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) throw new Error('Impossible de rafraîchir le token, veuillez vous ré-authentifier.');
    }
}

module.exports = { refreshAccessToken, ensureAccessToken };
