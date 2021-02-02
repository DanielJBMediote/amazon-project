const { Builder, By, until, wait } = require("selenium-webdriver");
const chromedriver = require("chromedriver");
const elXPaths = require("./elXpaths");
const configCountry = require("./configCountry");
const readline = require("readline");
const consoleQuest = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * This class is a Webdriver, it use to automatize the update prices from Amazon.
 */
class Webdriver {
  constructor() {
    this.driver = new Builder()
      .forBrowser("chrome")
      .build();

    this.driver.manage().window().maximize();
  }

  /**
   * Init funciton
   */
  async boot() {
    try {
      await this.getURL("https://sellercentral.amazon.de/");

      await this.buttonClick(By.xpath(elXPaths.LINKS.loginButton));

      await this.waitPageLoad();

      consoleQuest.question("Logged?", async (answer) => {
        if (answer == "y") {
          await this.waitPageLoad();
          await this.doQuestion();
        } else throw new Error("Encerrado");
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  async doQuestion() {
    console.log("Chosse the country you want re-price:");
    let index = 0;
    configCountry.forEach((country) => {
      console.log(index + ". " + country);
      index++;
    });
    consoleQuest.question("Number: ", async (number) => {
      await this.loopAmazonCountry(number);
    });
  }

  /**
   * This function loop the Dropdown button of Amazon Seller page, that do a foreach
   * in all country.
   */
  async loopAmazonCountry(numberOfCountry) {
    let arr = configCountry.length;
    let countryName = configCountry[numberOfCountry];
    // console.log(countryName);
    let indexOption = 1;
    do {
      await this.waitPageLoad();
      await this.driver.wait(
        until.elementsLocated(
          By.xpath(
            "/html/body/div[1]/div[1]/div/div[6]/div[2]/div[4]/div/select/optgroup/option[" +
              indexOption +
              "]"
          )
        )
      );

      let option = await this.driver.findElement(
        By.xpath(
          "/html/body/div[1]/div[1]/div/div[6]/div[2]/div[4]/div/select/optgroup/option[" +
            indexOption +
            "]"
        )
      );

      let optionText = (await option.getAttribute("innerHTML"))
        .split(" ")
        .filter((w) => w !== "")[1]
        .replace("\n", "");

      if (countryName == optionText) {
        console.log("Country: " + optionText);
        await this.buttonClick(
          By.xpath(
            "/html/body/div[1]/div[1]/div/div[6]/div[2]/div[4]/div/select/optgroup/option[" +
              indexOption +
              "]"
          )
        );

        await this.waitPageLoad();
        await this.getURL("https://sellercentral.amazon.de/inventory/");
        await this.waitPageLoad();

        await this.loopPages();
      }

      indexOption++;
    } while (indexOption <= arr);
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
      .wait(
        until.elementLocated(By.xpath(elXPaths.ELEMENTS.totalProducts)),
        7000
      )
      .then((el) => {
        return el.getAttribute("innerHTML");
      });

    let number = Math.floor(totalProducts / 250, 1);
    let lastPageNumberProducts = totalProducts - number * 250;
    // console.log(lastPageNumberProducts);
    totalTabs = totalTabs.split(" ")[1];
    console.log(
      "Number of Products: " + totalProducts + "\nTotal of Pages: " + totalTabs
    );

    consoleQuest.question(
      "Chosse the page of 1 to " + totalTabs + ". [Press 0 to Exit]",
      async (page) => {
        if (page != 0) {
          let currentTab = Number(page);

          // console.log(currentTab);
          // console.log(totalTabs);
          let currentPageTotalProducts =
            currentTab == totalTabs ? lastPageNumberProducts : 250;
          // console.log(currentPageTotalProducts);

          await this.driver.executeScript(
            "window.scrollTo(0, document.body.scrollHeight)"
          );
          await this.waitPageLoad();

          if (page != 1) {
            await (
              await this.driver.findElement(
                By.xpath(elXPaths.ELEMENTS.tabInput)
              )
            ).clear();
            await this.driver
              .findElement(By.xpath(elXPaths.ELEMENTS.tabInput))
              .sendKeys(currentTab);
            await (
              await this.driver.findElement(
                By.xpath(elXPaths.LINKS.buttonTabGO)
              )
            ).click();
            await this.waitPageLoad();
          }

          await this.driver.executeScript(
            "window.scrollTo(0, document.body.scrollHeight)"
          );
          console.log("Page: " + currentTab);
          (await this.driver).sleep(3000);
          await this.waitPageLoad();

          consoleQuest.question("Start Update? ", async (answer) => {
            if (answer == "y") {
              // Loop Prices
              await this.loopProductsPrice(currentPageTotalProducts);
              await this.waitPageLoad();

              consoleQuest.question(
                "Completed - Waiting for save....\n1. To Re-price another page.\n2. To Change the Country.\n0. To Exit.\nNumber:",
                async (answer) => {
                  if (answer == 1) {
                    await this.loopPages();
                  } else if (answer == 2) {
                    await this.doQuestion();
                  } else if (answer == 0) {
                    return;
                  }
                }
              );
            }
          });
        } else {
          return;
        }
      }
    );
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
          console.error("Element not found");
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
          console.error("Element not found");
        });

      // await this.sleep(300);

      console.log(
        index +
          ". Amazon's price: " +
          priceElClient +
          " - Bussines's price: " +
          priceElBussiness
      );

      if (priceElClient != "") {
        if (Math.round(parseFloat(priceElClient)) != 0) {
          if (priceElBussiness == "") {
            (
              await (await this.driver).findElement(
                By.xpath(
                  `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                    `div[5]/div/table/tbody/tr[${
                      index + 1
                    }]/td[13]/div/div[1]/span/div/div/span/input`
                )
              )
            ).sendKeys(priceElClient);
            console.log(
              index +
                ". Amazon's price: " +
                priceElClient +
                " - Bussines's price: " +
                priceElClient +
                " - Updated"
            );
          } else {
            if (priceElClient != priceElBussiness) {
              (
                await (await this.driver).findElement(
                  By.xpath(
                    `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                      `div[5]/div/table/tbody/tr[${
                        index + 1
                      }]/td[13]/div/div[1]/span/div/div/span/input`
                  )
                )
              ).clear();
              (
                await (await this.driver).findElement(
                  By.xpath(
                    `/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/` +
                      `div[5]/div/table/tbody/tr[${
                        index + 1
                      }]/td[13]/div/div[1]/span/div/div/span/input`
                  )
                )
              ).sendKeys(priceElClient);
              console.log(
                index +
                  ". Amazon's price: " +
                  priceElClient +
                  " - Bussines's price: " +
                  priceElClient +
                  " - Updated"
              );
            }
          }
        }
      }

      index++;
    } while (index <= numberOfProducts);
    console.log("Re-price completed.");
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
      return this.driver
        .executeScript("return document.readyState")
        .then((readyState) => {
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

module.exports = Webdriver;
