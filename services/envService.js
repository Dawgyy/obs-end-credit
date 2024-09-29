const fs = require('fs');
const path = require('path');

function updateEnv(newValues) {
    const envPath = path.resolve(__dirname, '../.env');
    const envVariables = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8').split('\n').filter(line => line) : [];
    const updatedVariables = envVariables.reduce((acc, line) => {
        const [key, value] = line.split('=');
        acc[key] = value;
        return acc;
    }, {});

    Object.assign(updatedVariables, newValues);
    fs.writeFileSync(envPath, Object.entries(updatedVariables).map(([key, value]) => `${key}=${value}`).join('\n'));
}

module.exports = { updateEnv };
