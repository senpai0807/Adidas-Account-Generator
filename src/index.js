const inquirer = require('inquirer');
const adidasGenerator = require('../Modules/adidasBrowser');


const adidasQuestions = {
  type: 'list',
  name: 'adidas',
  message: 'Which tool would you like to use?',
  choices: ['Adidas Generator', 'Back'],
};

const mainQuestion = {
  type: 'list',
  name: 'mainMode',
  message: 'Which mode would you like to use?',
  choices: ['Adidas'],
};

async function mainMenu() {
  const answers = await inquirer.prompt(mainQuestion);

switch (answers.mainMode) {
  case 'Adidas':
    const adidasAnswers = await inquirer.prompt(adidasQuestions)

    switch (adidasAnswers.adidas) {
      case 'Adidas Generator':
        await adidasGenerator.run();
        break;

      case 'Back':
        await mainMenu();
        break;
    }
    await mainMenu();
    break;       
  }
}


  const generatorBot = async () => {
    mainMenu();
  }

module.exports = generatorBot;