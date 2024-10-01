const { getTokenWithAuthCode, refreshAccessToken } = require('../services/tokenService');
const logger = require('../services/logger');

async function authMiddleware(req, res, next) {
    logger.info('Vérification de l\'authentification via middleware.');

    let tokensValid = false;

    try {
        if (process.env.ACCESS_TOKEN) {
            logger.info('Tentative de rafraîchissement automatique des tokens.');
            tokensValid = await refreshAccessToken();
            if (tokensValid) {
                logger.info('Token d\'accès rafraîchi avec succès.');
            } else {
                logger.warn('Impossible de rafraîchir le token d\'accès.');
            }
        }

        if (!tokensValid) {
            logger.warn('Utilisateur non authentifié, redirection nécessaire.');
            return res.status(401).json({ message: 'Utilisateur non authentifié, authentification requise.' });
        }

    } catch (error) {
        logger.error(`Erreur lors de la vérification de l'authentification : ${error.message}`);
        return res.status(401).json({ message: 'Erreur lors de la vérification de l\'authentification, authentification requise.' });
    }

    logger.info('Authentification réussie.');
    next();
}

module.exports = authMiddleware;
