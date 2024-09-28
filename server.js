require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3030;

const ENV = process.env.NODE_ENV || 'development'; // "development" ou "production"
const DOMAIN = ENV === 'development' ? `localhost:${PORT}` : process.env.DOMAIN;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BROADCASTER_ID = process.env.BROADCASTER_ID;

let accessToken = null;
let tokenExpirationTime = 0;

app.use(express.static('public'));

// Route pour démarrer l'authentification utilisateur
app.get('/auth', (req, res) => {
    const protocol = ENV === 'development' ? 'http' : 'https';
    const redirectUri = `${protocol}://${DOMAIN}/auth/callback`;

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=channel:read:subscriptions moderator:read:followers`;
    res.redirect(authUrl);
});

// Route pour gérer le callback après l'authentification Twitch
app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code d’autorisation manquant');
        return;
    }

    const protocol = ENV === 'development' ? 'http' : 'https';
    const redirectUri = `${protocol}://${DOMAIN}/auth/callback`;

    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

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

// Rafraîchissement du token d'accès utilisateur via cron (avant l'expiration)
cron.schedule('*/15 * * * *', async () => {
    console.log('Exécution du cron pour vérifier et rafraîchir le token...');
    if (Date.now() > tokenExpirationTime - 5 * 60 * 1000) {
        console.log('Rafraîchissement nécessaire, mais l’utilisateur doit être ré-authentifié.');
        // Ici, une solution serait de rediriger l'utilisateur vers la route d'authentification pour ré-authentifier
    }
});

// Middleware pour vérifier le token avant de faire des requêtes
async function ensureAccessToken() {
    if (!accessToken || Date.now() > tokenExpirationTime) {
        console.error('Token expiré ou non disponible, accès refusé.');
        throw new Error('Token expiré ou non disponible, veuillez vous ré-authentifier.');
    }
}

// Route pour récupérer les abonnés de la chaîne
app.get('/subs', async (req, res) => {
    try {
        await ensureAccessToken();
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

// Route pour récupérer les followers de la chaîne
app.get('/followers', async (req, res) => {
    try {
        await ensureAccessToken();
        let followers = [];
        let cursor = '';
        const limit = 10000;
        const pageSize = 100;

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

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Serveur lancé sur ${ENV === 'development' ? 'http' : 'https'}://${DOMAIN}`);
});
