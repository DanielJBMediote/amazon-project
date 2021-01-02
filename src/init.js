const { Builder, By, until, wait, actions, Key, WebElementCondition } = require("selenium-webdriver");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const configCountry = require('./configCountry');
const { DriverService } = require("selenium-webdriver/remote");

async function init() {
  let driver = new Builder().forBrowser("chrome").build();
  try {
    await driver.get("https://sellercentral.amazon.de/");
    await driver.manage().window().maximize();

    let logInLink = await driver.findElement(
      By.xpath(
        '//*[@id="wp-content"]/div[1]/div/div/div/div/div[2]/div/div[2]/div[1]/div[1]/div/a'
      )
    );
    logInLink.click();

    rl.question("Already Logged ? ", async (answer) => {
      if (answer == "y") {
        let currentOptionNumber = 1;
        const arrLenght = configCountry.lenght;
        do {
          await sleep(1500);
          await driver.wait(until.elementsLocated(By.xpath(
            "/html/body/div[1]/div[1]/div/div[6]/div[2]/div[4]/div/select/optgroup/option[" + currentOptionNumber + "]"
          )), 5000).catch(() => {
            console.log("Element not found");
          });

          let option = await driver.findElement(By.xpath("/html/body/div[1]/div[1]/div/div[6]/div[2]/div[4]/div/select/optgroup/option[" + currentOptionNumber + "]"));
          let optionText = (await option.getAttribute("innerHTML"))
            .split(" ")
            .filter((w) => w !== "")[1]
            .replace("\n", "");

          if (configCountry.includes(optionText)) {
            await option.click();
            await driver.get("https://sellercentral.amazon.de/inventory/");




            let totalTabs = await driver.wait(until.elementLocated(By.xpath(
              "/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[6]/div[1]/span[2]"
            )), 7000).then(el => {
              return el.getAttribute('innerHTML');
            });

            let totalProducts = await driver.wait(until.elementLocated(By.xpath(
              "/html/body/div[2]/div/div[3]/span[2]/span[1]"
            )), 20000).then(el => {
              return el.getAttribute("innerHTML");
            })
            let number = Math.floor(totalProducts / 250, 1);
            let lastPageNumberProducts = totalProducts - (number * 250);

            totalTabs = totalTabs.split(" ")[1];
            console.log("Number of Products: " + totalProducts + "\n Total of Pages: " + totalTabs);

            let currentTab = 5;

            // ---------------------------- Tab Loop --------------------------------------------------

            do {
              await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");

              await sleep(2000);
              console.log("Page: " + currentTab);

              let index = 1;
              let currentPageTotalProducts = (currentTab == totalTabs) ? lastPageNumberProducts : 250;

              // ------------------------- Price Loop --------------------------------------------------

              do {
                // await sleep(500);
                let priceElClient = await driver.wait(until.elementLocated(By.xpath(
                  `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[5]/div/table/tbody/`
                  + `tr[${index + 1}]/td[12]/div/div[1]/span/div/div/span/input`
                )), 20000).then(el => {
                  return el.getAttribute('value');
                });

                let priceElBussiness = await driver.wait(until.elementLocated(By.xpath(
                  `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[5]/div/table/tbody/`
                  + `tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`
                )), 20000).then(el => {
                  return el.getAttribute('value');
                });

                if (priceElBussiness == "") {
                  if (!(Math.round(priceElClient) == 0)) {
                    (await driver).findElement(By.xpath(`/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/`
                      + `div[5]/div/table/tbody/tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`)).sendKeys(priceElClient);
                    console.log(index + ". Amazon's price: " + priceElClient + " - Bussines's price: " + priceElClient + " - Updated");
                  }
                } else
                  console.log(index + ". Amazon's price: " + priceElClient + " - Bussines's price: " + priceElBussiness);

                index++;
              } while (index <= currentPageTotalProducts);

              await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");

              await sleep(1000);
              await driver.wait(until.elementsLocated(By.xpath(
                "/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[6]/div[1]/input"
              )), 20000);

              currentTab++;
              if (currentTab <= totalTabs) {

                // a-button a-button-primary mt-button mt-button-saveall
                // a-button a-button-primary mt-button mt-button-saveall a-button-disabled
                let cssClass = await driver.wait(until.elementLocated(By.xpath("/html/body/div[2]/table/tbody/tr/th[15]/span/span")), 20000)
                  .then(async (el) => {
                    return await el.getAttribute('class');
                  });
                let arrCssClass = cssClass.split(" ");
                if (arrCssClass[arrCssClass.length - 1] != "a-button-disabled") {
                  // await driver.actions().mouseMove(By.xpath("/html/body/div[2]/table/tbody/tr/th[15]/span/span/span/a")).click().perform();
                  await (await (await driver).findElement(By.xpath("/html/body/div[2]/table/tbody/tr/th[15]/span/span/span/a"))).click()
                  await sleep(20000);
                }
                await driver.wait(() => {
                  return driver.executeScript('return document.readyState').then((readyState) => {
                    return readyState === 'complete';
                  });
                })

                await sleep(500);

                await (await driver.findElement(By.xpath("/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/"
                  + "div[2]/div[2]/div[6]/div[1]/input"))).clear();
                await driver.findElement(By.xpath("/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/"
                  + "div[2]/div[6]/div[1]/input")).sendKeys(currentTab);
                await (await driver.findElement(By.xpath("/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/"
                  + "div[2]/div[2]/div[6]/div[1]/span[3]/span/span/input"))).click()
              }
            } while (currentTab <= totalTabs);
            currentOptionNumber++;
          }
        } while (currentOptionNumber <= arrLenght);
      } else
        throw new Error('Not Logged, turning off de drive.');
    });

    await sleep(1000);
  } catch (error) {
    console.error(error.message);
  }
}

async function sleep(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

init();
