const { select } = require('@inquirer/prompts');

const { getWorkspacesInformation, writeToFileRelative } = require('../shared/file');
const { first } = require('../shared/sqlite');

module.exports = (program) => {
    program
        .command('tabs')
        .alias('t')
        .description('allows querying of opened editor tabs')
        .option('-e, --export-file <path>', 'exports the opened editor tabs to a file at the given relative path')
        .action(async ({ exportFile }) => {
            const { codium } = program.opts();
            const info = await getWorkspacesInformation(codium);

            const choices = info.map(i => ({
                name: i.project,
                value: i.state
            }));
            choices.sort((a, b) => a.name.localeCompare(b.name));

            const workspaceState = await select({
                message: 'Select a workspace',
                choices,
                loop: false
            });

            const editorState = JSON.parse(first(workspaceState, 'SELECT value FROM ItemTable WHERE key = \'memento/workbench.parts.editor\'').value);
            const editorsPerSplit = editorState['editorpart.state'].serializedGrid.root.data.map(d => d.data.editors);
            const paths = editorsPerSplit.map(editors => editors.map(editor => JSON.parse(editor.value).resourceJSON?.path).filter(Boolean));

            if (exportFile) {
                writeToFileRelative(exportFile, JSON.stringify(paths, null, 4));
            } else {
                console.log(paths);
            }
        });
};
