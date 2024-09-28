require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3030;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BROADCASTER_ID = process.env.BROADCASTER_ID;

let accessToken = null;
let tokenExpirationTime = 0;

app.use(express.static('public'));

app.get('/auth', (req, res) => {
    const redirectUri = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=http://localhost:${PORT}/auth/callback&response_type=code&scope=channel:read:subscriptions moderator:read:followers`;
    res.redirect(redirectUri);
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code d’autorisation manquant');
        return;
    }

    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', `http://localhost:${PORT}/auth/callback`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!response.ok) {
            console.error(`Erreur lors de l'échange du code : ${response.status} - ${response.statusText}`);
            const errorText = await response.text();
            console.error('Détails de l’erreur :', errorText);
            return res.status(response.status).send('Erreur lors de l\'échange du code');
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpirationTime = Date.now() + (data.expires_in * 1000);
        console.log('Token d’accès utilisateur obtenu avec succès:', accessToken);
        res.send('Authentification réussie. Retournez à l’application.');
    } catch (error) {
        console.error('Erreur lors de l’échange du code :', error);
        res.status(500).send('Erreur interne lors de l’échange du code');
    }
});

async function ensureAccessToken() {
    if (!accessToken || Date.now() > tokenExpirationTime) {
        console.log('Token d\'accès expiré ou manquant, veuillez vous authentifier à nouveau via /auth');
    }
}

app.get('/subs', async (req, res) => {
    await ensureAccessToken();

    if (!accessToken) {
        return res.status(401).send('Authentification requise. Veuillez accéder à /auth pour authentifier.');
    }

    try {
        const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': CLIENT_ID
            }
        });

        if (!response.ok) {
            console.error(`Erreur API Twitch : ${response.status} - ${response.statusText}`);
            const errorText = await response.text();
            console.error('Détails de l’erreur :', errorText);
            return res.status(response.status).json({ error: 'Erreur lors de la récupération des abonnés' });
        }

        const data = await response.json();
        console.log('Données d’abonnés récupérées:', data);
        res.json(data.data);
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnés :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des abonnés' });
    }
});

app.get('/followers', async (req, res) => {
    await ensureAccessToken();

    if (!accessToken) {
        return res.status(401).send('Authentification requise. Veuillez accéder à /auth pour authentifier.');
    }

    let followers = [];
    let cursor = '';
    const limit = 10000;
    const pageSize = 100;

    try {
        while (followers.length < limit) {
            let url = `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${BROADCASTER_ID}&first=${pageSize}`;
            if (cursor) {
                url += `&after=${cursor}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CLIENT_ID
                }
            });

            if (!response.ok) {
                console.error(`Erreur API Twitch : ${response.status} - ${response.statusText}`);
                const errorText = await response.text();
                console.error('Détails de l’erreur :', errorText);
                return res.status(response.status).json({ error: 'Erreur lors de la récupération des followers' });
            }

            const data = await response.json();
            console.log('Données des followers récupérées:', data);

            followers = followers.concat(data.data);

            if (data.pagination && data.pagination.cursor) {
                cursor = data.pagination.cursor;
            } else {
                break;
            }

            if (followers.length >= limit) {
                break;
            }
        }

        followers = followers.slice(0, limit);
        res.json(followers);
    } catch (error) {
        console.error('Erreur lors de la récupération des followers :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des followers' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
