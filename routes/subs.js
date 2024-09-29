const express = require('express');
const axios = require('axios');
const { ensureAccessToken } = require('../services/tokenService');

const router = express.Router();
const BROADCASTER_ID = process.env.BROADCASTER_ID;
const CLIENT_ID = process.env.CLIENT_ID;

router.get('/', async (req, res) => {
    try {
        await ensureAccessToken();
        const cachedData = req.cache.get('subs');
        if (cachedData) {
            return res.json(cachedData);
        }

        const response = await axios.get(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}`, {
            headers: {
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`,
                'Client-Id': CLIENT_ID
            }
        });

        req.cache.set('subs', response.data.data);
        res.json(response.data.data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ error: 'Unauthorized. Please authenticate.' });
        }
        res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
    }
});

module.exports = router;
