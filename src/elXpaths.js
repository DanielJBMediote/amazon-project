const xpaths = {
  LINKS: {
    loginButton: "//*[@id='wp-content']/div[1]/div/div/div/div/div[2]/div/div[2]/div[1]/div[1]/div/a",
    saveAllButton: "/html/body/div[2]/table/tbody/tr/th[15]/span/span/span/a",
    spanSavaAll: "/html/body/div[2]/table/tbody/tr/th[15]/span/span",
    buttonTabGO: "/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[6]/div[1]/span[3]/span/span/input"
  },
  ELEMENTS: {
    totalTabs: "/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[6]/div[1]/span[2]",
    totalProducts: "/html/body/div[2]/div/div[3]/span[2]/span[1]",
    tabInput: "/html/body/div[1]/div[2]/div[2]/div[1]/div[1]/div/div[2]/div[2]/div[6]/div[1]/input"
  }
}

module.exports = xpaths;