const express = require('express');
const axios = require('axios');
const logger = require('../services/logger');

const router = express.Router();
const BROADCASTER_ID = process.env.BROADCASTER_ID;
const CLIENT_ID = process.env.CLIENT_ID;

router.get('/', async (req, res) => {
    try {
        logger.info('Requête reçue sur /subscriptions. Récupération des abonnés après authentification.');

        const cachedData = req.cache.get('subs');
        if (cachedData) {
            logger.info('Données des abonnés trouvées dans le cache.');
            return res.json(cachedData);
        }

        logger.info('Aucune donnée en cache. Envoi de la requête à l\'API Twitch pour les abonnés.');
        const response = await axios.get(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
                'Client-Id': CLIENT_ID
            }
        });

        if (response && response.data && response.data.data) {
            logger.info('Réponse reçue de l\'API Twitch. Stockage des données dans le cache.');
            req.cache.set('subs', response.data.data);
            return res.json(response.data.data);
        } else {
            logger.warn('La réponse reçue de l\'API Twitch ne contient pas de données d\'abonnés valides.');
            return res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
        }
    } catch (error) {
        logger.error(`Erreur lors de la récupération des abonnés : ${error.message}`);
        res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
    }
});

module.exports = router;
