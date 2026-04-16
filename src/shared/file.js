const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const home = os.homedir();

async function getExtensionsFile(useCodium) {
    const file = path.join(home, getVscodeDirectoryName(useCodium), 'extensions/extensions.json');
    return await fs.readFile(file, 'utf8');
}

function getVscodeDirectoryName(useCodium) {
    if (useCodium) {
        return '.vscode-oss';
    } else {
        return '.vscode';
    }
}

async function writeToFileRelative(filePath, data) {
    const file = path.resolve(process.cwd(), filePath);
    await writeToFileAbsolute(file, data);
}

async function writeToFileAbsolute(filePath, data) {
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data, 'utf8');
}

module.exports = {
    getExtensionsFile,
    writeToFileRelative,
    writeToFileAbsolute,
};
