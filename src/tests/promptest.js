// const inquirer = require('inquirer');


import ansicolors from 'ansi-colors';
const colors = ansicolors;

import enquirer from 'enquirer';
const { MultiSelect } = enquirer;

const prompt = new MultiSelect({
  name: 'example-groups',
  message: 'What are your favorite colors?',
  symbols: { indicator: { on: colors.green('o'), off: colors.gray('o') } },
  choices: ['Foo', 'Bar', 'Baz']
});

prompt.run()
  .then(answer => console.log('Answer:', answer))
  .catch(console.error);
