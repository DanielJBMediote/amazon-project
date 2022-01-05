const inquirer = require('inquirer');

const tabs = 8;

// console.log(Array.from({length: 8}, (_, i) => `Page ${i + 1}`));

inquirer.prompt([
  // {
  //   type: 'confirm',
  //   name: 'result',
  //   message: 'is it ok?',
  // },
  {
    type: 'list',
    name: 'page',
    message: 'What size do you need?',
    pageSize: 8,
    choices: [
      "This key is Apple",
      "This Key i dont know",
      "last key"
    ],
  },
]).then((answers) => {
  console.log(answers);
  // let num = answers.page.split(" ")[1]
  // if(num == 3){
  //   console.log(num);
  // }
})