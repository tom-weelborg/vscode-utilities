#!/usr/bin/env node

const { Command } = require('commander');

const program = new Command();

program
	.name('vscode-utilities')
	.description('CLI to some Visual Studio Code utilities')
	.version('1.0.0')
	.option('-c, --codium');

require('./cli/extensions')(program);

program.parse();
