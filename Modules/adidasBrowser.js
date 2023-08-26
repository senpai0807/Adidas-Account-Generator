const fs = require('fs');
const path = require('path')
const inquirer = require('inquirer');
const { v4: uuidv4 } = require('uuid');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();
const { firefox, chromium } = require('playwright');
var random_name = require('node-random-name');
const { Webhook, MessageBuilder } = require('discord-webhook-node');


const appendToFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    lock.acquire(filePath, () => {
      fs.appendFileSync(filePath, data);
      resolve();
    }, (err) => {
      reject(err);
    });
  });
};


const settingsPath = path.join(__dirname, '../Dependencies/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const fileType = settings.fileType.toLowerCase();




async function clickButtonAndWaitForIframe(page, context) {
  while (true) {
      await page.click('button[data-auto-id="login-auto-flow-form-button"]');
      try {
          await page.waitForSelector('iframe[id="sec-text-if"]', { timeout: 5000 });
          try {
              console.log(`Task ${taskid}: Handling Challenge...`);
              await page.waitForSelector('iframe[id="sec-text-if"]', { state: 'hidden', timeout: 30000 });
              break;
          } catch (error) {
              await challengeCheck(context);
          }
      } catch (error) {
          break;
      }
  }
}

const launchBrowser = async (browserName, ip, port, username, passwordProxy) => {
  let browser;
  let options = {
      args: ['--disable-blink-features=AutomationControlled'],
      headless: false,
      proxy: {
          server: `http://${ip}:${port}`,
          username: username,
          password: passwordProxy,
      },
  };

  switch (browserName) {
      case 'Google Chrome':
          options.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
          browser = await chromium.launch(options);
          break;
      case 'Brave':
          options.executablePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
          browser = await chromium.launch(options);
          break;
      case 'Microsoft Edge':
          options.executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
          browser = await chromium.launch(options);
          break;
      case 'Firefox':
          browser = await firefox.launch(options);
          break;
      default:
          throw new Error(`Unsupported browser: ${browserName}`);
  }

  return browser;
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generatePassword(length) {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%&';
  const allChars = upperChars + lowerChars + numberChars + symbolChars;
  
  let password = 
    upperChars[Math.floor(Math.random()*upperChars.length)] +
    lowerChars[Math.floor(Math.random()*lowerChars.length)] +
    numberChars[Math.floor(Math.random()*numberChars.length)] +
    symbolChars[Math.floor(Math.random()*symbolChars.length)];
  
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random()*allChars.length)];
  }

  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
}

class PromisePool {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.currentConcurrent = 0;
    this.waiting = [];
  }

  async add(promiseFunction) {
    if (this.currentConcurrent >= this.maxConcurrent) {
      await new Promise(resolve => this.waiting.push(resolve));
    }
    this.currentConcurrent++;
    try {
      return await promiseFunction();
    } finally {
      this.currentConcurrent--;
      if (this.waiting.length > 0) {
        const next = this.waiting.shift();
        next();
      }
    }
  }
}

async function randomClicks(page) {
  const viewport = await page.viewportSize();

  for (let i = 0; i < 2; i++) {
    const randomX = Math.floor(Math.random() * viewport.width);
    const randomY = Math.floor(Math.random() * viewport.height);

    await page.mouse.click(randomX, randomY);
    
    await page.waitForTimeout(500);
  }
}

let allPromises = [];
const run = async () => {
  const answer = await inquirer.prompt({
    type: 'input',
    name: 'accountsCount',
    message: 'How many accounts do you want to generate?',
    validate: function (value) {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  });

  const answerBrowsers = await inquirer.prompt({
    type: 'input',
    name: 'browsersCount',
    message: 'How many browsers do you want to open?',
    validate: function (value) {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  });

  const answerMode = await inquirer.prompt({
    type: 'list',
    name: 'emailMode',
    message: 'Select the mode for email generation:',
    choices: ['Catchall', 'Email List', 'Fake Email'],
  });

const accountsCount = answer.accountsCount; 
const browsersCount = answerBrowsers.browsersCount;  
const proxiesPath = path.join(__dirname, '../Dependencies/proxies.txt');
const proxiesData = fs.readFileSync(proxiesPath, 'utf8');
let proxies = [];

const lines = proxiesData.split('\n');

lines.forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        proxies.push(line);
    }
});

if (proxies.length === 0) {
  console.error('No Proxies Found...');
  return;
}

const promisePool = new PromisePool(browsersCount);

for(let i = 0; i < accountsCount; i++) {
  const taskid = uuidv4();
  let accountPassword = generatePassword(12);
  let randomMonth = Math.floor(Math.random() * 12) + 1;
  let monthString = randomMonth < 10 ? `0${randomMonth}` : `${randomMonth}`;
  let randomDay = ("0" + Math.floor(Math.random() * 28 + 1)).slice(-2);
  let randomYear = Math.floor(Math.random() * (2006 - 1970 + 1)) + 1970;
  const promise = promisePool.add(async () => {
    const firstName = random_name({ first: true });
    const lastName = random_name({ last: true });
    let accountName = firstName + lastName
    const randomIndex = Math.floor(Math.random() * proxies.length);
    const proxy = proxies[randomIndex];
    const [ip, port, username, passwordProxy] = proxy.split(':');

let accountEmail;
let emailIndex;
switch (answerMode.emailMode) {
  case 'Catchall':
    accountEmail = accountName + randomYear + i + '@' + settings.catchall;
    break;
    case 'Email List':
      emailIndex = i;
      const emailsPath = path.join(__dirname, '../Dependencies/emails.txt');
      const emailsData = fs.readFileSync(emailsPath, 'utf8').split('\n');
      if (emailsData.length <= i || !emailsData[i].trim()) {
        console.error('No Emails Found');
        return;
      }
      accountEmail = emailsData[i];
      break;
  case 'Fake Email':
    accountEmail = accountName + randomYear + i + '@gmail.com';
    break;
  default:
    console.error('Unexpected email mode');
    return;
}
 
const browser = await launchBrowser(settings.browserName, ip, port, username, passwordProxy);
const context = await browser.newContext({
  locale: "en-GB", 
  timezone_id: "Europe/London",
  colorScheme: 'dark',
  viewport: {
    width: 1280,
    height: 720
}
});

let page = await context.newPage();
page.setDefaultNavigationTimeout(100000);

try {
  console.log(`Task ${taskid}: Navigating To Home Page...`);
  await page.goto('https://www.adidas.com/us/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('a[title="SHOP MEN"]', { timeout: 15000 });
  await page.click('a[title="SHOP MEN"]');
  const consentButton = await page.$('button[id="glass-gdpr-default-consent-accept-button"]');
  if (consentButton) {
    await consentButton.click();
  }
  const accountButtonSelector = await page.waitForSelector('button[name="account-portal-close"]', { timeout: 5000 });
  if (accountButtonSelector) {
    await accountButtonSelector.click();
  };
  await sleep(2500);
  const elements = await page.$$('div[data-auto-id="result-item-content"]');
  const randomIndex = Math.floor(Math.random() * elements.length);
  await elements[randomIndex].click();
  await sleep(2500);
  const sizeButtons = await page.$$('button.gl-label.size___2lbev:not(.size-selector__size--unavailable___1EibR)');
  const randomSizeIndex = Math.floor(Math.random() * sizeButtons.length);
  await sizeButtons[randomSizeIndex].click();
  await sleep(2500);
  await randomClicks(page);
  await page.click('button[data-auto-id="add-to-bag"]');
  await sleep(5000);

} catch (error) {
  console.error(`Task ${taskid}: Error Generating Sensor Data...`);
}

try {
  console.log(`Task ${taskid}: Navigating To Sign-Up Page...`);
  await page.goto('https://www.adidas.com/us/account-register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('ul[data-auto-id="main-menu"]', { timeout: 15000 });
  const consentButton = await page.$('button[id="glass-gdpr-default-consent-accept-button"]');
  if (consentButton) {
    await consentButton.click();
  }
} catch (error) {
  console.error(`Task ${taskid}: Error Navigating To Sign-Up Page...`);
  await browser.close()
  return;
}

try {
  console.log(`Task ${taskid}: Inputting Email...`);
  await page.waitForSelector('input[id="email"]');
  await page.evaluate(() => {
    document.querySelector('input[id="email"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
  await page.fill('input[id="email"]', '');
  for (let character of accountEmail) {
    await page.type('input[id="email"]', character);
    await page.waitForTimeout(100);
  }
  await page.waitForFunction((email) => {
    const emailInput = document.querySelector('input[id="email"]');
    return emailInput && emailInput.value === email;
  }, accountEmail);
  const consentButton = await page.$('button[id="glass-gdpr-default-consent-accept-button"]');
  if (consentButton) {
    await consentButton.click();
  }

  await randomClicks(page);
  await clickButtonAndWaitForIframe(page, context);


  const errorElement = await page.$('p[class*="_error_"]');
  if (errorElement) {
    console.error(`Task ${taskid}: Akamai Blocked, Retrying...`);

    try { 
      await page.reload();
      console.log(`Task ${taskid}: Inputting Email...`);
      await page.waitForSelector('input[id="email"]');
      await page.evaluate(() => {
        document.querySelector('input[id="email"]').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
      await page.fill('input[id="email"]', '');
      for (let character of accountEmail) {
        await page.type('input[id="email"]', character);
        await page.waitForTimeout(100);
      }
      await page.waitForFunction((email) => {
        const emailInput = document.querySelector('input[id="email"]');
        return emailInput && emailInput.value === email;
      }, accountEmail);
      const consentButton = await page.$('button[id="glass-gdpr-default-consent-accept-button"]');
      if (consentButton) {
        await consentButton.click();
      }

      await randomClicks(page);
      await clickButtonAndWaitForIframe(page, context);
    } catch (error) {
      console.error(`Task ${taskid}: Akamai Blocked...`);
      await browser.close();
      return;
    }
  }

} catch (error) {
  console.error(`Task ${taskid}: Error Inputting Email...`);
  await browser.close()
  return;
}
  

try {
  console.log(`Task ${taskid}: Inputting Password...`);
  await page.waitForSelector('input[id="password"]');
  await page.fill('input[id="password"]', '');
  for (let character of accountPassword) {
    await page.type('input[id="password"]', character);
    await page.waitForTimeout(100);
}
  await page.click('button[data-auto-id="registration-submit-button"]');

} catch (error) {
  console.error(`Task ${taskid}: Error Inputting Password...`);
  await browser.close()
  return;
}

try {
  console.log(`Task ${taskid}: Setting Account Information...`);
  await page.click('button[id="ACCOUNT"]');
  await page.waitForSelector('h4[class="col-s-12 gl-vspace-bpall-small customSpacing___2pXrC gl-heading-font-set-standard-14___8jHvP"]');
  await page.click('button[data-auto-id="edit-profile-information-button-PROFILE_INFORMATION_MODAL"]');

  console.log(`Task ${taskid}: Inputting First Name...`);
  await page.waitForSelector('input[id="personal-info:firstName"]');
  await page.fill('input[id="personal-info:firstName"]', '');
  for (let character of firstName) {
    await page.type('input[id="personal-info:firstName"]', character);
    await page.waitForTimeout(100);
}

  console.log(`Task ${taskid}: Inputting Last Name...`);
  await page.fill('input[name="lastName"]', '');
  for (let character of lastName) {
    await page.type('input[name="lastName"]', character);
    await page.waitForTimeout(100);
  }

  console.log(`Task ${taskid}: Inputting Birthday...`);
  await page.fill('input[id="date-of-birth-month"]', monthString);
  await page.fill('input[id="date-of-birth-day"]', randomDay);
  await page.fill('input[id="date-of-birth-year"]', randomYear.toString());

  const selectors = [
    'label >> text="Male"',
    'label >> text="Female"',
    'label >> text="Other"'
];

const randomSelectorIndex = Math.floor(Math.random() * selectors.length);
const randomSelector = selectors[randomSelectorIndex];

console.log(`Task ${taskid}: Selecting Gender...`);
await page.click(randomSelector);
console.log(`Task ${taskid}: Submitting Account Information...`);
await page.click('button[aria-label="Update details"]');
await sleep(2500);
await page.waitForSelector('div[data-auto-id="personal-information-page"]');

} catch (error) {
  console.error(`Task ${taskid}: Error Setting Account Information...`);
  await browser.close()
  return;
}

try {
  await browser.close();
} catch (error) {
  console.error(`Task ${taskid}: Error closing browser`);
}
console.log(`Task ${taskid}: Successfully Generated, Sending Webhook...`);
if (emailIndex !== undefined) {
  emailsData.splice(emailIndex, 1);
  fs.writeFileSync(emailsPath, emailsData.join('\n'), 'utf8');
}

const writeData = async (accountEmail, accountPassword, firstName, lastName, proxy) => {
  let outputPath;
  let data;
  if (fileType === 'txt') {
    outputPath = path.join('adidasOutput.txt');
    data = `${accountEmail}:${accountPassword}\n`;
  } else if (fileType === 'csv') {
    outputPath = path.join('adidasOutput.csv');
    if (!fs.existsSync(outputPath)) {
      fs.writeFileSync(outputPath, 'Email,Password,First Name,Last Name,Proxy Used\n', 'utf-8');
    }
    data = `${accountEmail},${accountPassword},${firstName},${lastName},${proxy}\n`;
  } else {
    console.error(`Unsupported file type: ${settings.fileType}`);
    return;
  }

  await appendToFile(outputPath, data);
};

await writeData(accountEmail, accountPassword, firstName, lastName, proxy);
proxies.splice(randomIndex, 1);
fs.writeFileSync(proxiesPath, proxies.join('\n'), 'utf8');



let hook = new Webhook(`${settings.successWebhookUrl}`);
hook.setUsername('Adidas Generator');
hook.setAvatar('https://imgur.com/Vn4CEtQ.png');
const success = new MessageBuilder()
  .setTitle("Success! 🎉")
  .setColor("#5665DA")
  .addField('**Module**', `Adidas Account Generator`, false)
  .addField('**Email**', `||${accountEmail}||`, false)
  .addField('**Password**', `||${accountPassword}||`, false)
  .addField('**First Name**', `||${firstName}||`, false)
  .addField('**Last Name**', `||${lastName}||`, false)
  .addField('**Proxy**', `||${proxy}||`, false)
  .setTimestamp();
await hook.send(success);


console.log(`Task ${taskid}: Looping Task In 30s...`);
await new Promise(resolve => setTimeout(resolve, 30000));
});
  allPromises.push(promise);
}
await Promise.all(promisePool.waiting);
}

module.exports.run = run;
module.exports.waitForCompletion = async () => {
  await Promise.all(allPromises);
};