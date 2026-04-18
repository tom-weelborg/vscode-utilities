const { Option } = require('commander');

const { mapToId, mapToNix } = require('../shared/extensions');
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
                        result = mapToId(result);
                    } else if (nix) {
                        result = await mapToNix(result);
                    }
                    
                    if (exportFile) {
                        writeToFileRelative(exportFile, JSON.stringify(result, null, 4));
                    } else {
                        console.log(result);
                    }
                });
        });
};
