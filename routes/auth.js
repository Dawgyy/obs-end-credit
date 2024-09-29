const express = require('express');
const axios = require('axios');
const { updateEnv } = require('../services/envService');

const router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENV = process.env.NODE_ENV || 'development';
const DOMAIN = ENV === 'development' ? `localhost:${process.env.PORT || 3030}` : process.env.DOMAIN;

router.get('/', (req, res) => {
    const redirectUri = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/auth/callback`;
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=channel:read:subscriptions moderator:read:followers`;
    res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code d’autorisation manquant');
        return;
    }

    const redirectUri = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/auth/callback`;
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    });

    try {
        const response = await axios.post(url, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;
        updateEnv({
            ACCESS_TOKEN: data.access_token,
            REFRESH_TOKEN: data.refresh_token,
            TOKEN_EXPIRATION_TIME: (Date.now() + (data.expires_in * 1000)).toString()
        });

        res.send('Authentification réussie. Retournez à l’application.');
    } catch (error) {
        console.error('Erreur interne lors de l’échange du code :', error);
        res.status(500).send('Erreur interne lors de l’échange du code');
    }
});

module.exports = router;
