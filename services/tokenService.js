require('dotenv').config();
const axios = require('axios');
const { updateEnv } = require('./envService');
const logger = require('./logger');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENV = process.env.NODE_ENV || 'development';
const DOMAIN = ENV === 'development' ? `localhost:${process.env.PORT || 3030}` : process.env.DOMAIN;
const BASEURI = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/`;
const REDIRECTURI = `${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}/auth/callback`;

async function getTokenWithAuthCode() {
    if (!process.env.AUTH_CODE) {
        logger.warn('AUTH_CODE manquant. Impossible de récupérer un token sans AUTH_CODE.');
        return false;
    }

    const url = 'https://id.twitch.tv/oauth2/token';
    const params = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: process.env.AUTH_CODE,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECTURI
    };

    logger.info(`Tentative d'échange du code d'autorisation contre des tokens avec AUTH_CODE : ${process.env.AUTH_CODE}`);
    try {
        const response = await axios.post(url, new URLSearchParams(params).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.status === 200 && response.data.access_token && response.data.refresh_token) {
            logger.info('Tokens reçus avec succès :', JSON.stringify(response.data, null, 2));

            await updateEnv({
                ACCESS_TOKEN: response.data.access_token,
                REFRESH_TOKEN: response.data.refresh_token,
                TOKEN_EXPIRATION_TIME: response.data.expires_in
            });

            return true;
        } else {
            logger.warn(`Échec de l'échange du code d'autorisation. Statut reçu : ${response.status}`);
            return false;
        }
    } catch (error) {
        handleAxiosError(error);
        return false;
    }
}

async function refreshAccessToken() {
    if (!process.env.REFRESH_TOKEN) {
        logger.warn("Refresh token manquant. Impossible de rafraîchir l'access token.");
        return false;
    }

    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: process.env.REFRESH_TOKEN
    });

    logger.info('Tentative de rafraîchissement du token d’accès avec le refresh token.');

    try {
        const response = await axios.post(url, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.status === 200 && response.data.access_token && response.data.refresh_token) {
            logger.info('Nouveaux tokens reçus avec succès :', JSON.stringify(response.data, null, 2));

            await updateEnv({
                ACCESS_TOKEN: response.data.access_token,
                REFRESH_TOKEN: response.data.refresh_token,
                TOKEN_EXPIRATION_TIME: response.data.expires_in
            });

            return true;
        } else {
            logger.warn(`Échec du rafraîchissement du token d’accès. Statut reçu : ${response.status}`);
            return false;
        }
    } catch (error) {
        handleAxiosError(error);
        return false;
    }
}

async function ensureValidTokens() {
    logger.warn('Forçage de la tentative de réauthentification.');
    return await getTokenWithAuthCode() || await refreshAccessToken();
}

function handleAxiosError(error) {
    if (error.response) {
        logger.error(`Erreur : ${error.message}`);
        logger.error(`Code de statut : ${error.response.status}`);
        logger.error(`Données de la réponse : ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
        logger.error(`Aucune réponse reçue : ${error.message}`);
    } else {
        logger.error(`Erreur lors de la configuration de la requête : ${error.message}`);
    }
}

module.exports = { getTokenWithAuthCode, refreshAccessToken, ensureValidTokens };
