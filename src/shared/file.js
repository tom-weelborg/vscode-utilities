const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const home = os.homedir();
const platform = os.platform();

async function getExtensions(useCodium) {
    let extensionsFromHome;
    try {
        extensionsFromHome = await getExtensionsFile(useCodium);
    } catch {
        extensionsFromHome = '[]';
    }
    return JSON.parse(extensionsFromHome);
}

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

async function getWorkspacesInformation(useCodium) {
    const workspacesDir = getWorkspacesDirectoryName(useCodium);

    const entries = await fs.readdir(workspacesDir, { withFileTypes: true });

    const dirs = entries.filter(e => e.isDirectory());

    const results = await Promise.all(
        dirs.map(async (dir) => {
            const dirPath = path.join(workspacesDir, dir.name);

            const files = await fs.readdir(dirPath);

            const targetFile = files.find(f => f === 'workspace.json');
            if (!targetFile) return null;

            const filePath = path.join(dirPath, targetFile);

            const [raw, stat] = await Promise.all([
                fs.readFile(filePath, 'utf8'),
                fs.stat(filePath)
            ]);

            const json = JSON.parse(raw);

            return {
                project: `${json.folder} (${stat.birthtime.toISOString()})`,
                state: path.join(dirPath, 'state.vscdb')
            };
        })
    );

    return results.filter(Boolean);
}

function getWorkspacesDirectoryName(useCodium) {
    return path.join(getUserDirectoryName(useCodium), 'workspaceStorage');
}

function getUserDirectoryName(useCodium) {
    return path.join(getCodeDirectoryPath(useCodium), 'User');
}

function getCodeDirectoryPath(useCodium) {
    const configDirectoryName = getConfigDirectoryNameForOperatingSystem();
    const codeDirectoryName = getCodeDirectoryName(useCodium);
    return path.join(home, configDirectoryName, codeDirectoryName);
}

function getConfigDirectoryNameForOperatingSystem() {
    if (platform === 'win32') {
        return 'AppData/Roaming';
    } else if (platform === 'darwin') {
        return 'Library/Application Support';
    } else if (platform === 'linux') {
        return '.config';
    } else {
        throw new Error('Unsupported operating system');
    }
}

function getCodeDirectoryName(useCodium) {
    if (useCodium) {
        return 'VSCodium';
    } else {
        return 'Code';
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
    getExtensions,
    getWorkspacesInformation,
    writeToFileRelative,
    writeToFileAbsolute,
};
