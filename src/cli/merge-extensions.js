const { Option } = require('commander');

const { mapToId, mapToNix } = require('../shared/extensions');
const { getExtensions, readFiles, writeToFileRelative } = require('../shared/file');

module.exports = (program) => {
    program
        .command('merge-extensions')
        .alias('me')
        .description('allows merging of extension files')
        .option('-s, --system', 'whether to use the system\'s `extensions.json` file')
        .option('-f, --files <paths...>', 'paths to extension files to merge')
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
        .action(async ({ system, files, id, nix, exportFile }) => {
            const { codium } = program.opts();

            let systemExtensions = [];
            if (system) {
                systemExtensions = await getExtensions(codium);
            }

            const filesExtensions = (await readFiles(files ?? [])).flatMap(
                f => JSON.parse(f)
            );

            let extensions = [
                ...new Set([
                    ...systemExtensions,
                    ...filesExtensions,
                ].map(e => JSON.stringify(e)))
            ].sort().map(e => JSON.parse(e));
            
            if (id) {
                extensions = mapToId(extensions);
            } else if (nix) {
                extensions = await mapToNix(extensions);
            }

            if (exportFile) {
                writeToFileRelative(exportFile, JSON.stringify(extensions, null, 4));
            } else {
                console.log(extensions);
            }
        });
};
