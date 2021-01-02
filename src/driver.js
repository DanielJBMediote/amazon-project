const Webdriver = require('./Webdriver');

const amazonDriver = new Webdriver({
  browser: 'chrome'
});

amazonDriver.boot();