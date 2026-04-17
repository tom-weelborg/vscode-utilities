const { Option } = require('commander');

const { getExtensions, prefetch, writeToFileRelative } = require('../shared/file');

module.exports = (program) => {
    program
        .command('extensions')
        .alias('e')
        .description('allows querying of extensions')
        .addOption(
            new Option(
                '-i, --id',
                'reduces the list of extensions to a list of their ids'
            ).conflicts('nix')
        )
        .addOption(
            new Option(
                '-n, --nix',
                'maps the list of extensions to a format usable by `vscode-utils.extensionsFromVscodeMarketplace` in nix'
            ).conflicts('id')
        )
        .option('-e, --export-file <path>', 'exports the extensions to a file at the given relative path')
        .action(({ id, nix, exportFile }) => {
            const { codium } = program.opts();
            getExtensions(codium)
                .then(async extensions => {
                    let result = extensions;
                    if (id) {
                        result = result.map(e => e.identifier.id);
                    } else if (nix) {
                        result = await Promise.all(result.map(async e => {
                            const id = e.identifier.id.split('.');
                            return {
                                name: id[1],
                                publisher: id[0],
                                version: e.version,
                                sha256: await prefetch(
                                    `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${id[0]}/vsextensions/${id[1]}/${e.version}/vspackage`
                                )
                            };
                        }));
                    }
                    
                    if (exportFile) {
                        writeToFileRelative(exportFile, JSON.stringify(result, null, 4));
                    } else {
                        console.log(result);
                    }
                });
        });
};
