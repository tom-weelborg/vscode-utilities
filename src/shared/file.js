const { execSync } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const home = os.homedir();
const platform = os.platform();

async function getExtensions(useCodium) {
    const extensionsFromHome = await getExtensionsFromHome(useCodium);
    const extensionsFromNixStore = await getExtensionsFromNixStore(useCodium);

    return [
        ...extensionsFromHome,
        ...extensionsFromNixStore,
    ];
}

async function getExtensionsFromHome(useCodium) {
    try {
        return JSON.parse(
            await getExtensionsFile(useCodium)
        );
    } catch {
        return [];
    }
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

async function getExtensionsFromNixStore(useCodium) {
    if (await isNixOS()) {
        try {
            const extensionsFromNixStore = await getExtensionsFileFromNixStore(useCodium);
            if (extensionsFromNixStore) {
                return JSON.parse(extensionsFromNixStore);
            }
        } catch {
        }
    }
    return [];
}

async function isNixOS() {
    try {
        const data = await fs.readFile('/etc/os-release', 'utf8');
        return data.includes('ID=nixos');
    } catch {
        return false;
    }
}

async function getExtensionsFileFromNixStore(useCodium) {
    const file = await getExtensionsFileFromNixStorePath(useCodium);
    if (file) {
        return await fs.readFile(file, 'utf8');
    } else {
        return null;
    }
}

async function getExtensionsFileFromNixStorePath(useCodium) {
    const vscodeFile = await getVscodeFileFromNixStore(useCodium);
    if (!vscodeFile) {
        return null;
    }

    const extensionsDir = vscodeFile.match(/--extensions-dir\s+([^\s"]+)/);
    if (extensionsDir && extensionsDir[1]) {
        return `${extensionsDir[1]}/extensions.json`;
    } else {
        return null;
    }
}

async function getVscodeFileFromNixStore(useCodium) {
    try {
        const vscodePath = execSync(`which ${getVscodeProgramName(useCodium)}`, {
            encoding: 'utf8'
        }).trim();
        return await fs.readFile(vscodePath, 'utf8');
    } catch {
        return null;
    }
}

function getVscodeProgramName(useCodium) {
    if (useCodium) {
        return 'codium';
    } else {
        return 'code';
    }
}

async function prefetch(url) {
    if (await isNixOS()) {
        const base32 = execSync(`nix-prefetch-url ${url}`, {
            encoding: 'utf8'
        }).trim();

        const sri = execSync(`nix hash to-sri --type sha256 ${base32}`, {
            encoding: 'utf8'
        }).trim();

        return sri.replace('sha256-', '');
    } else {
        return 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
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

async function readFiles(paths) {
    return await Promise.all(
        paths.map(async (p) => {
            const fullPath = path.resolve(p);
            return await fs.readFile(fullPath, 'utf8');
        })
    );
}

module.exports = {
    getExtensions,
    getWorkspacesInformation,
    prefetch,
    readFiles,
    writeToFileRelative,
    writeToFileAbsolute,
};
