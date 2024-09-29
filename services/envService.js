const fs = require('fs').promises;
const path = require('path');

async function updateEnv(newValues) {
    const envPath = path.resolve(__dirname, '../.env');

    try {
        await fs.access(envPath);
        const fileContent = await fs.readFile(envPath, 'utf8');
        const envVariables = fileContent.split('\n').filter(line => line);

        const updatedVariables = envVariables.reduce((acc, line) => {
            const [key, value] = line.split('=');
            acc[key] = value;
            return acc;
        }, {});

        Object.assign(updatedVariables, newValues);

        const newFileContent = Object.entries(updatedVariables)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        await fs.writeFile(envPath, newFileContent);
        delete require.cache[require.resolve('dotenv')];
        
        require('dotenv').config();
    } catch (err) {
        console.error(`Erreur lors de la mise à jour du fichier .env : ${err.message}`);
    }
}

module.exports = { updateEnv };
