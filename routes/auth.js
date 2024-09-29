const express = require('express');
const axios = require('axios');
const { updateEnv } = require('../services/envService');

const router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENV = process.env.NODE_ENV || 'development';
const DOMAIN = ENV === 'development' ? `localhost:${process.env.PORT || 3030}` : process.env.DOMAIN;
const BASEURI = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/`;
const REDIRECTURI = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/auth/callback`;


router.get('/', async (req, res) => {
    if (!process.env.ACCESS_TOKEN) {
        const scope = "channel:read:subscriptions moderator:read:followers"
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECTURI}&response_type=code&scope=${scope}`;
        return res.redirect(authUrl);
    }

    res.json({ message: 'Vous êtes déjà authentifié.' });
});

router.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code d’autorisation manquant');
        return;
    }

    const url = 'https://id.twitch.tv/oauth2/token';
    const params = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECTURI
    };

    try {
        const response = await axios.post(url, params, {
            httpsAgent: new (require('https')).Agent({ keepAlive: false }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = response.data;
        await updateEnv({
            ACCESS_TOKEN: data.access_token,
            REFRESH_TOKEN: data.refresh_token,
            TOKEN_EXPIRATION_TIME: data.expires_in
        });
        await res.redirect(BASEURI);
    } catch (error) {
        res.status(500).send('Erreur interne lors de l’échange du code');
    }
});

module.exports = router;
