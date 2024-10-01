const express = require('express');
const axios = require('axios');
const logger = require('../services/logger');
const { updateEnv } = require('../services/envService');

const router = express.Router();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENV = process.env.NODE_ENV || 'development';
const DOMAIN = ENV === 'development' ? `localhost:${process.env.PORT || 3030}` : process.env.DOMAIN;
const REDIRECTURI = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/auth/callback`;

// Redirection vers Twitch pour s'authentifier
router.get('/login', (req, res) => {
    const scope = "channel:read:subscriptions moderator:read:followers";
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECTURI}&response_type=code&scope=${scope}`;
    logger.info(`Redirection vers Twitch pour l'authentification : ${authUrl}`);
    res.redirect(authUrl);
});

// Callback de Twitch après authentification
router.get('/callback', async (req, res) => {
    const code = req.query.code;
    logger.info(`Callback reçu avec la requête suivante : ${req.query}`);

    if (!code) {
        logger.error('Code d’autorisation manquant dans la requête de callback.');
        return res.status(400).send('Code d’autorisation manquant');
    }

    try {
        const tokenUrl = 'https://id.twitch.tv/oauth2/token';
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECTURI
        });

        const response = await axios.post(tokenUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.status === 200 && response.data.access_token && response.data.refresh_token) {
            logger.info('Tokens reçus avec succès.');

            // Stocker les tokens dans les variables d'environnement
            await updateEnv({
                ACCESS_TOKEN: response.data.access_token,
                REFRESH_TOKEN: response.data.refresh_token,
                TOKEN_EXPIRATION_TIME: response.data.expires_in
            });

            res.redirect('/'); // Rediriger vers la page principale après authentification
        } else {
            logger.warn(`Erreur lors de l'échange du code d'autorisation. Statut reçu : ${response.status}`);
            res.status(500).send('Erreur lors de l\'authentification');
        }
    } catch (error) {
        logger.error(`Erreur lors de l'authentification : ${error.message}`);
        res.status(500).send('Erreur interne lors de l\'authentification');
    }
});

module.exports = router;
