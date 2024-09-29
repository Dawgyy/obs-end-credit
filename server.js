require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const NodeCache = require('node-cache');
const { refreshAccessToken } = require('./services/tokenService');
const authRoutes = require('./routes/auth');
const subsRoutes = require('./routes/subs');
const followersRoutes = require('./routes/followers');

const app = express();
const PORT = process.env.PORT || 3030;

const cache = new NodeCache({ stdTTL: 300 });

app.use(express.static('public'));

app.use((req, res, next) => {
    req.cache = cache; 
    next();
});

app.use('/auth', authRoutes);
app.use('/api/subs', subsRoutes);
app.use('/api/followers', followersRoutes);

let server;
let cronTask;

if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Serveur lancé sur ${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${process.env.DOMAIN || `localhost:${PORT}`}`);
    });

    cronTask = cron.schedule('*/15 * * * *', async () => {
        if (Date.now() > parseInt(process.env.TOKEN_EXPIRATION_TIME) - 5 * 60 * 1000) {
            await refreshAccessToken();
        }
    });
}

module.exports = {
    app,
    close: () => {
        if (server) {
            server.close();
        }
        if (cronTask) {
            cronTask.stop();
        }
    }
};
