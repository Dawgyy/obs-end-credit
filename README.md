
# OBS End Credit

Ce projet est un script de crédits finaux dynamique conçu pour être utilisé avec OBS Studio. Il affiche les noms des abonnés et des followers récents de manière attrayante, en présentant des crédits déroulants avec une vidéo de fond personnalisée. Le projet est alimenté par JavaScript, Node.js, Tailwind CSS, et un serveur personnalisé qui interagit avec l'API Twitch pour récupérer les informations sur les followers et abonnés.

## Features

- **Mises à jour en direct** : Récupère et affiche automatiquement les derniers followers et abonnés de Twitch.
- **Crédits déroulants** : Les crédits défilent en douceur à l'écran, parfaits pour les séquences de fin de stream dans OBS.
- **Vidéo de fond personnalisée** : La vidéo de fond crée une expérience visuelle dynamique et engageante pour les spectateurs.
- **Attribution des utilisateurs** : Différencie les followers des abonnés pour montrer une appréciation au public.
- **Aucune dépendance externe** : Tous les actifs, y compris le CSS, sont gérés localement pour assurer des performances rapides et fiables.

## Setup Instructions

### Requirements

- Node.js (v14 ou supérieur recommandé)
- npm ou yarn
- OBS Studio

### Getting Started

1. **Clonez le repository** :
   ```sh
   git clone git@github.com:Dawgyy/obs-end-credit.git
   cd obs-end-credit
   ```

2. **Installez les dépendances** :
   ```sh
   npm install
   ```

3. **Configurez les variables d'environnement** :
   Créez un fichier `.env` à la racine avec les variables suivantes :
   ```sh
   CLIENT_ID=your_twitch_client_id
   CLIENT_SECRET=your_twitch_client_secret
   BROADCASTER_ID=your_twitch_broadcaster_id
   PORT=3030 # Optional, default is 3030
   DOMAIN=your.domain.com #if you reverse proxy this app
   NODE_ENV= #production|development
   ACCESS_TOKEN=your_access_token # (optional) will be updated automatically
   REFRESH_TOKEN=your_refresh_token # (optional) will be updated automatically
   TOKEN_EXPIRATION_TIME=your_token_expiration_time # (optional) will be updated automatically
   ```

4. **Lancez le serveur** :
   ```sh
   npm start
   ```

5. **Utilisez dans OBS** :
   - Ajoutez une "Source Navigateur" à votre scène dans OBS Studio.
   - Définissez l'URL sur `http://localhost:3030`.
   - Ajustez la largeur et la hauteur pour l'adapter à votre layout de stream.

### File Structure

```
.
├── eslint.config.mjs
├── LICENSE
├── package.json
├── package-lock.json
├── postcss.config.js
├── public
│   ├── index.html
│   ├── script.js
│   ├── script.min.js
│   ├── styles.css
│   ├── styles.min.css
│   ├── tailwind.css
│   └── vid.mp4
├── README.md
├── routes
│   ├── auth.js
│   ├── followers.js
│   └── subs.js
├── server.js
├── services
│   ├── envService.js
│   └── tokenService.js
├── tailwind.config.js
└── tests
    └── api.test.js
```

### Minification des Fichiers

Pour optimiser le chargement des fichiers CSS et JavaScript, le projet utilise des outils de minification.

- **Minification du CSS** : Utilisez PostCSS et cssnano.
  - Créez un fichier `postcss.config.js` :
    ```js
    module.exports = {
      plugins: [
        require('cssnano')({
          preset: 'default',
        }),
      ],
    };
    ```
  - Commande de minification :
    ```sh
    npx postcss public/styles.css -o public/styles.min.css
    ```

- **Minification du JavaScript** : Utilisez Terser.
  - Commande de minification :
    ```sh
    npx terser public/script.js -o public/script.min.js
    ```

### Modularisation du Serveur Node.js

Le serveur Node.js a été modularisé pour améliorer la maintenabilité. Les différentes fonctionnalités ont été séparées en modules.

- **Routes** : Les routes ont été divisées dans des fichiers distincts (`auth.js`, `subs.js`, `followers.js`) situés dans le dossier `routes/`.
- **Fichier Principal** (`server.js`) : Le fichier principal utilise ces modules, ce qui rend le code plus organisé et facile à maintenir.

### Tests des Endpoints d'API

Le projet utilise **Jest** et **Supertest** pour tester les endpoints d'API.

- **Installation** :
  ```sh
  npm install jest supertest --save-dev
  ```

- **Exemple de Test** (`tests/api.test.js`) :
  ```js
  const request = require('supertest');
  const { app } = require('../server');

  describe('GET /subs', () => {
      it('should return list of subscribers', async () => {
          const response = await request(app).get('/api/subs');
          expect(response.statusCode).toBe(200);
      });
  });
  ```

- **Script de Test** : Ajoutez `"test": "jest --detectOpenHandles"` dans le `package.json`.

### ESLint

**ESLint** est utilisé pour maintenir un code propre et éviter les erreurs.

- **Installation** :
  ```sh
  npm install eslint --save-dev
  ```

- **Initialisation** :
  ```sh
  npx eslint --init
  ```

- **Script ESLint** : Ajoutez `"lint": "eslint ."` dans le `package.json`.
- **Exécution** :
  ```sh
  npm run lint
  ```

### Caching avec Node-Cache

Pour éviter des appels répétitifs à l'API Twitch, **Node-Cache** est utilisé pour stocker temporairement les données.

- **Installation** :
  ```sh
  npm install node-cache
  ```

- **Utilisation** : Le cache est mis en place pour les routes `/api/subs` et `/api/followers` pour stocker les données pendant 5 minutes, réduisant ainsi les requêtes répétées à l'API Twitch.

### Utilisation de PM2 pour la Production

**PM2** est utilisé pour gérer l'application en production, la redémarrer en cas de crash, et garantir sa disponibilité continue.

- **Installation** :
  ```sh
  npm install pm2 -g
  ```

- **Lancer l'Application** :
  ```sh
  pm2 start npm --name "obs-end-credit" -- run start
  ```

- **Redémarrage Automatique** :
  ```sh
  pm2 startup
  pm2 save
  ```

### Automatisation avec GitHub Actions

**GitHub Actions** est utilisé pour automatiser les tests et les déploiements.

- **Fichier de Workflow** (`.github/workflows/ci.yml`) :
  ```yaml
  name: Node.js CI

  on:
    push:
      branches:
        - main
    pull_request:
      branches:
        - main

  jobs:
    build:
      runs-on: ubuntu-latest

      steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: Install dependencies
        run: npm install

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test
  ```

### Conclusion

Ces améliorations rendent le projet plus robuste, performant, et maintenable :
- **Minification** des fichiers CSS et JavaScript pour des temps de chargement optimisés.
- **Modularisation** du serveur Node.js pour une meilleure organisation.
- **Tests automatisés** pour assurer la fiabilité des endpoints.
- **ESLint** pour garantir la qualité et la cohérence du code.
- **Caching** pour améliorer les performances des requêtes.
- **PM2** pour gérer l'application en production et assurer sa disponibilité.
- **GitHub Actions** pour automatiser les tests et les déploiements.
