const express = require('express');
const axios = require('axios');
const { ensureAccessToken } = require('../services/tokenService');

const router = express.Router();
const BROADCASTER_ID = process.env.BROADCASTER_ID;
const CLIENT_ID = process.env.CLIENT_ID;

router.get('/', async (req, res) => {
    try {
        await ensureAccessToken();

        const cachedData = req.cache.get('followers');
        if (cachedData) {
            return res.json(cachedData);
        }

        let followers = [];
        let cursor = '';
        const limit = 10000;
        const pageSize = 100;

        let accessToken = process.env.ACCESS_TOKEN || null;

        while (followers.length < limit) {
            let url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${BROADCASTER_ID}&first=${pageSize}`;
            if (cursor) url += `&after=${cursor}`;

            const response = await axios.get(url, {
                httpsAgent: new (require('https')).Agent({ keepAlive: false }),
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CLIENT_ID
                }
            });

            const data = response.data;
            followers = followers.concat(data.data);

            if (data.pagination && data.pagination.cursor) {
                cursor = data.pagination.cursor;
            } else {
                break;
            }

            if (followers.length >= limit) break;
        }

        req.cache.set('followers', followers.slice(0, limit));
        res.json(followers.slice(0, limit));
    } catch (error) {
        if (error.statusCode === 401) {
            return res.status(467).json({ error: 'Unauthorized. Please authenticate.' });
        }
        res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
    }
});

module.exports = router;
