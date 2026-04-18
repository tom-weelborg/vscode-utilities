const { prefetch } = require('./file');

function mapToId(extensions) {
    return extensions.map(e => e.identifier.id);
}

async function mapToNix(extensions) {
    return await Promise.all(extensions.map(async e => {
        const id = e.identifier.id.split('.');
        const name = id[1];
        const publisher = id[0];
        const version = e.version;
        return {
            name,
            publisher,
            version,
            sha256: await prefetch(
                `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${publisher}/vsextensions/${name}/${version}/vspackage`
            )
        };
    }));
}

module.exports = {
    mapToId,
    mapToNix,
};
