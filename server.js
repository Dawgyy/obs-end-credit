require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const NodeCache = require('node-cache');
const authRoutes = require('./routes/auth');
const subsRoutes = require('./routes/subs');
const followersRoutes = require('./routes/followers');
const authMiddleware = require('./middlewares/authMiddleware');
const { refreshAccessToken } = require('./services/tokenService');

const app = express();
const PORT = process.env.PORT || 3030;
const DOMAIN = process.env.DOMAIN || `localhost:${PORT}`;
const BASEURI = `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${DOMAIN}`;

// Utilisation globale de CORS
app.use(cors());
app.use(express.static('public'));

// Utilisation d'un cache avec NodeCache
const cache = new NodeCache({ stdTTL: 300 });
app.use((req, res, next) => {
    req.cache = cache;
    next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/subs', authMiddleware, subsRoutes);
app.use('/api/followers', authMiddleware, followersRoutes);

// Configuration du serveur
let server;
let cronTask;

if (require.main === module) {
    server = app.listen(PORT, () => {
        console.log(`Serveur lancé sur ${BASEURI}`);
    });

    // Tâche CRON pour rafraîchir le token toutes les 15 minutes
    cronTask = cron.schedule('*/15 * * * *', async () => {
        await refreshAccessToken();
    });
}

module.exports = {
    app,
    server,
    cronTask,
};
