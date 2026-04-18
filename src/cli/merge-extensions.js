const { getExtensions, readFiles, writeToFileRelative } = require('../shared/file');

module.exports = (program) => {
    program
        .command('merge-extensions')
        .alias('me')
        .description('allows merging of extension files')
        .option('-s, --system', 'whether to use the system\'s `extensions.json` file')
        .option('-f, --files <paths...>', 'paths to extension files to merge')
        .option('-e, --export-file <path>', 'exports the extensions to a file at the given relative path')
        .action(async ({ system, files, exportFile }) => {
            const { codium } = program.opts();

            let systemExtensions = [];
            if (system) {
                systemExtensions = await getExtensions(codium);
            }

            const filesExtensions = (await readFiles(files ?? [])).flatMap(
                f => JSON.parse(f)
            );

            const extensions = [
                ...new Set([
                    ...systemExtensions,
                    ...filesExtensions,
                ].map(e => JSON.stringify(e)))
            ].sort().map(e => JSON.parse(e));

            if (exportFile) {
                writeToFileRelative(exportFile, JSON.stringify(extensions, null, 4));
            } else {
                console.log(extensions);
            }
        });
};
