const express = require('express');
const axios = require('axios');
const logger = require('../services/logger');

const router = express.Router();
const BROADCASTER_ID = process.env.BROADCASTER_ID;
const CLIENT_ID = process.env.CLIENT_ID;

router.get('/', async (req, res) => {
    try {
        logger.info('Requête reçue sur /followers. Récupération des followers après authentification.');

        const cachedData = req.cache.get('followers');
        if (cachedData) {
            logger.info('Données des followers trouvées dans le cache.');
            return res.json(cachedData);
        }

        logger.info('Aucune donnée en cache. Envoi de la requête à l\'API Twitch pour les followers.');
        let followers = [];
        let cursor = '';
        const limit = 10000;
        const pageSize = 100;

        while (followers.length < limit) {
            let url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${BROADCASTER_ID}&first=${pageSize}`;
            if (cursor) url += `&after=${cursor}`;

            logger.info(`Requête à l'API Twitch : ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
                    'Client-Id': CLIENT_ID
                }
            });

            if (response && response.data && response.data.data) {
                const data = response.data;
                logger.info(`Page reçue avec ${data.data.length} followers.`);
                followers = followers.concat(data.data);

                if (data.pagination && data.pagination.cursor) {
                    cursor = data.pagination.cursor;
                } else {
                    break;
                }
            } else {
                logger.warn('La réponse reçue de l\'API Twitch ne contient pas de données valides.');
                break;
            }

            if (followers.length >= limit) break;
        }

        logger.info('Stockage des données des followers dans le cache.');
        req.cache.set('followers', followers.slice(0, limit));
        res.json(followers.slice(0, limit));
    } catch (error) {
        logger.error(`Erreur lors de la récupération des followers : ${error.message}`);
        res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
    }
});

module.exports = router;
