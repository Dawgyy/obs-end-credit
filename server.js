require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3030;

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const BROADCASTER_ID = process.env.BROADCASTER_ID

let accessToken = '2c4f9doolevt91tp1n2luyntu5pf3p';

console.log('CLIENT_ID:', CLIENT_ID);
console.log('CLIENT_SECRET:', CLIENT_SECRET);
app.use(express.static('public'));


let tokenExpirationTime = 0;

async function getAccessToken() {
    try {
        const url = 'https://id.twitch.tv/oauth2/token';
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'channel:read:subscriptions channel:manage:read moderator:read:followers');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        if (!response.ok) {
            console.error(`Erreur lors de l'obtention du token : ${response.status} - ${response.statusText}`);
            const errorText = await response.text();
            console.error('Détails de l’erreur :', errorText);
            throw new Error('Erreur lors de l’obtention du token d’accès');
        }

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpirationTime = Date.now() + (data.expires_in * 1000);
        console.log('Token d’accès obtenu avec succès:', accessToken);
    } catch (error) {
        console.error('Erreur lors de l’obtention du token d’accès :', error);
    }
}



app.get('/subs', async (req, res) => {
    if (!accessToken) {
        await getAccessToken();
    }

    try {
        const response = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': CLIENT_ID
            }
        });

        if (response.status === 401) {
            console.warn('Le token est expiré, récupération d\'un nouveau token...');
            await getAccessToken();

            const retryResponse = await fetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${BROADCASTER_ID}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CLIENT_ID
                }
            });

            if (!retryResponse.ok) {
                console.error(`Erreur API Twitch après renouvellement du token : ${retryResponse.status} - ${retryResponse.statusText}`);
                const retryErrorText = await retryResponse.text();
                console.error('Détails de l’erreur :', retryErrorText);
                return res.status(retryResponse.status).json({ error: 'Erreur lors de la récupération des abonnés après renouvellement du token' });
            }

            const data = await retryResponse.json();
            console.log('Données d’abonnés récupérées après renouvellement du token:', data);
            return res.json(data.data);
        }

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

async function exchangeCodeForToken(code) {
    const url = 'https://id.twitch.tv/oauth2/token';
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', 'http://localhost:3030/auth/callback');
    params.append('scope', 'channel:read:subscriptions channel:manage:read moderator:read:followers');


    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        console.error(`Erreur lors de l'échange du code : ${response.status} - ${response.statusText}`);
        const errorText = await response.text();
        console.error('Détails de l’erreur :', errorText);
        return;
    }

    const data = await response.json();
    accessToken = data.access_token;
    console.log('Token d’accès obtenu avec succès:', accessToken);
}


app.get('/followers', async (req, res) => {
    if (!accessToken || Date.now() > tokenExpirationTime) {
        await getAccessToken();
    }

    let followers = [];
    let cursor = '';
    const limit = 10000;
    const pageSize = 100;

    try {
        while (followers.length < limit) {
            let url = `https://api.twitch.tv/helix/channels/followers?user_id{BROADCASTER_ID}&broadcaster_id=${BROADCASTER_ID}&first=${pageSize}`;
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


app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send('Code d’autorisation manquant');
        return;
    }

    await exchangeCodeForToken(code);
    res.send('Authentification réussie. Retournez à l’application.');
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
