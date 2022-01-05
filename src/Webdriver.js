const { Builder, By, until } = require("selenium-webdriver");
const elXPaths = require("./elXpaths");
// const countries = require("./config");
const readline = require("readline");
const inputQuestion = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const inquirer = require('inquirer');

/**
 * This class is a Webdriver, it use to automatize the update prices from Amazon.
 */
class Webdriver {
  

  constructor(browser) {
    this.driver = new Builder().forBrowser(browser).build();
    this.driver.manage().window().maximize();
    
    this.boot()
  }

  /**
   * Init funciton
   */
  async boot() {
    try {
      await this.getURL("https://sellercentral.amazon.de/");

      await this.buttonClick(By.xpath(elXPaths.LINKS.loginButton));
      await this.waitPageLoad();

      inquirer.prompt([
        {
          type: "list",
          name: "choise",
          message: "Is Logged in?",
          choices: [
            "Yes",
            "No"
          ]
        }
      ]).then(async (answer) => {
        if (answer.choise == "Yes"){
          await this.waitPageLoad();
          await this.pickCountry();
        } else {
          await this.driver.quit();
          process.exit();
        }
      });

      // inputQuestion.question("Logged?[y/n]", async (answer) => {
      //   if (answer == "y") {
      //     await this.waitPageLoad();
      //     await this.doQuestion();
      //   } else {
      //     console.log("Exit.");
      //     await this.driver.quit()
      //     process.exit()
      //   }
      // });
    } catch (error) {
      console.error(error.message);
      // inputQuestion.log(error.message);
    }
  }

  async pickCountry() {
    await this.getURL("https://sellercentral.amazon.de/global-picker");
    console.log("Choose the country to update prices.\n[Except Poland, Sweden, Netherlands]");

    inquirer.prompt([
      {
        type: "comfirm",
        name: "result",
        message: "Comfirm? (Y/N)",
      }
    ]).then(async (answer) => {
      if (answer.result){
        await this.loopAmazonCountry();
      } else {
        await this.driver.quit();
        process.exit();
      }
    });

    // let index = 0;
    // countries.forEach((country) => {
    //   console.log(index + ". " + country);
    //   index++;
    // });
    // inputQuestion.question("Press 'y' to continue: ", async (answer) => {
    //   if (answer == "y") {
    //     await this.loopAmazonCountry();
    //   } else {
    //     console.log();
    //     (await this.driver).quit();
    //     process.exit();
    //   }
    // });
  }

  /**
   * This function loop the Dropdown button of Amazon Seller page, that do a foreach
   * in all country.
   */
  async loopAmazonCountry() {
    await this.waitPageLoad();

    await this.getURL("https://sellercentral.amazon.de/inventory/");
    await this.waitPageLoad();

    await this.loopPages();
  }

  /**
   * This function loop the pages
   */
  async loopPages() {
    let totalTabs = await this.driver
      .wait(until.elementLocated(By.xpath(elXPaths.ELEMENTS.totalTabs)), 7000)
      .then((el) => {
        return el.getAttribute("innerHTML");
      });

    let totalProducts = await this.driver
      .wait(until.elementLocated(By.xpath(elXPaths.ELEMENTS.totalProducts)), 7000)
      .then((el) => {
        return el.getAttribute("innerHTML");
      });

    let number = Math.floor(totalProducts / 250, 1);
    let lastPageNumberProducts = totalProducts - number * 250;
    // console.log(lastPageNumberProducts);
    totalTabs = totalTabs.split(" ")[1];
    // console.log(`Number of Products: ${totalProducts}. \n Pages: ${totalTabs}`);

    await inquirer.prompt([
      {
        type: "list",
        name: "page",
        message: `An total of ${totalProducts} products encoutered.\n Choose the Page you want update:`,
        pageSize: totalTabs,
        choices: 
          Array.from({length: totalTabs}, (_, i) => `Page ${i + 1}`)
      }
    ]).then(async (answer) => {
      let page = answer.page.split("Page ")[1]
      let currentTab = Number(page);
      let currentPageTotalProducts = currentTab == totalTabs ? lastPageNumberProducts : 250;
      await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
      await this.waitPageLoad();

      if (page != 1) {
        await (await this.driver.findElement(By.xpath(elXPaths.ELEMENTS.tabInput))).clear();
        await this.driver.findElement(By.xpath(elXPaths.ELEMENTS.tabInput)).sendKeys(currentTab);
        await (await this.driver.findElement(By.xpath(elXPaths.LINKS.buttonTabGO))).click();
        await this.waitPageLoad();
      }

      await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
      console.log("Page: " + currentTab);
      (await this.driver).sleep(3000);
      await this.waitPageLoad();

      await inquirer.prompt([
        {
          type: "confirm",
          message: "Are you sure you want to continue?",
          name: "continue",
        }
      ]).then(async (answer) => {
        if (answer.continue) {
          await this.loopProductsPrice(currentPageTotalProducts);
          await this.waitPageLoad();

          await inquirer.prompt([
            {
              type: "list",
              name: "choise",
              choices: [
                "Update another Page.",
                "Change to current Country.",
                "Exit"
              ]
            }
          ]).then(async (answer2) => {
            if (answer2.choice == "Update another Page."){
              await this.loopPages();
            } else if (answer2.choice == "Change to current Country."){
              await this.pickCountry();
            } else if (answer2.choice == "Exit") {
              (await this.driver).quit();
              process.exit()
            }
          })
        }
      })
    });

    // inputQuestion.question(`Chosse one page between 1 to ${totalTabs}\n[Press 0 to Exit]\nPage:`, async (page) => {
    //   if (page != 0) {
    //     let currentTab = Number(page);

    //     // console.log(currentTab);
    //     // console.log(totalTabs);
    //     let currentPageTotalProducts = currentTab == totalTabs ? lastPageNumberProducts : 250;
    //     // console.log(currentPageTotalProducts);

    //     await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    //     await this.waitPageLoad();

    //     if (page != 1) {
    //       await (await this.driver.findElement(By.xpath(elXPaths.ELEMENTS.tabInput))).clear();
    //       await this.driver.findElement(By.xpath(elXPaths.ELEMENTS.tabInput)).sendKeys(currentTab);
    //       await (await this.driver.findElement(By.xpath(elXPaths.LINKS.buttonTabGO))).click();
    //       await this.waitPageLoad();
    //     }

    //     await this.driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
    //     console.log("Page: " + currentTab);
    //     (await this.driver).sleep(3000);
    //     await this.waitPageLoad();

    //     inputQuestion.question("Start Update? [Y to start/N to abort operation]", async (answer) => {
    //       if (answer == "y") {
    //         // Loop Prices
    //         await this.loopProductsPrice(currentPageTotalProducts);
    //         await this.waitPageLoad();

    //         inputQuestion.question(
    //           `Completed - Waiting for save...\n1. To Re-price another page.\n2. To Change the Country.\n0. To Exit.\nNumber:`,
    //           async (answer) => {
    //             if (answer == 1) {
    //               await this.loopPages();
    //             } else if (answer == 2) {
    //               await this.pickCountry();
    //             } else if (answer == 0) {
    //               console.log("Exited.");
    //               (await this.driver).quit();
    //             }
    //           }
    //         );
    //       }
    //     });
    //   } else {
    //     console.log("Exited.");
    //     (await this.driver).quit();
    //     process.exit();
    //   }
    // });
  }

  /**
   * This function loop the products from a page, than update the prices when needed
   * @param {Integer} numberOfProducts
   */
  async loopProductsPrice(numberOfProducts) {
    await this.waitPageLoad();
    let index = 1;
    do {
      // await this.sleep(300);
      let priceElClient = await this.driver
        .wait(
          until.elementLocated(
            By.xpath(
              `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[5]/div/table/tbody/` +
                `tr[${index + 1}]/td[12]/div/div[1]/span/div/div/span/input`
            )
            ),
          20000
        )
        .then(async (el) => {
          return await el.getAttribute("value");
        })
        .catch(() => {
          console.error("Element not found.");
        });

      let priceElBussiness = await this.driver
        .wait(
          until.elementLocated(
            By.xpath(
              `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[5]/div/table/tbody/` +
                `tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`
                )
          ),
          20000
        )
        .then(async (el) => {
          return await el.getAttribute("value");
        })
        .catch(() => {
          console.error("Element not found.");
        });

      // await this.sleep(300);

      console.log(index + ". Amazon's price: " + priceElClient + " - Bussines's price: " + priceElBussiness);

      if (priceElClient != "") {
        if (Math.round(parseFloat(priceElClient)) != 0) {
          if (priceElBussiness == "") {
            (
              await (await this.driver).findElement(
                By.xpath(
                  `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                    `div[5]/div/table/tbody/tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`
                )
              )
            ).sendKeys(priceElClient);
            console.log(
              index + ". Amazon's price: " + priceElClient + " - Bussines's price: " + priceElClient + " - Updated"
            );
          } else {
            if (priceElClient != priceElBussiness) {
              (
                await (await this.driver).findElement(
                  By.xpath(
                    `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                      `div[5]/div/table/tbody/tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`
                  )
                )
              ).clear();
              (
                await (await this.driver).findElement(
                  By.xpath(
                    `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                      `div[5]/div/table/tbody/tr[${index + 1}]/td[13]/div/div[1]/span/div/div/span/input`
                  )
                )
              ).sendKeys(priceElClient);
              console.log(
                index + ". Amazon's price: " + priceElClient + " - Bussines's price: " + priceElClient + " - Updated"
              );
            }
          }
        }
      }

      index++;
    } while (index <= numberOfProducts);
    console.log("Updated completed.");
  }

  /**
   * This function find a element than click than.
   * @param {locator} element
   */
  async buttonClick(element) {
    return await (await this.driver).findElement(element).click();
  }

  /**
   * Just set a new URL from browser
   * @param {String} url
   */
  async getURL(url) {
    return (await this.driver).get(url);
  }

  /**
   * Execute a JS script on browser
   * @param {String} script
   */
  async executeAsyncScript(script) {
    return await this.driver.executeAsyncScript(script);
  }

  /**
   * Just wait for page has fully loaded
   */
  async waitPageLoad() {
    return await this.driver.wait(() => {
      return this.driver.executeScript("return document.readyState").then((readyState) => {
        // console.log("Waiting for page loaded...");
        return readyState === "complete";
      });
    });
  }

  /**
   * Thread fuction
   * @param {Integer} msec
   */
  async thread(msec) {
    return new Promise((resolve) => setTimeout(resolve, msec));
  }

  /**
   * A Sleep fuction
   * @param {Integer} msec
   */
  async sleep(msec) {
    return (await this.driver).sleep(msec);
  }
}

new Webdriver("chrome")