require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers : [
      {
        version : "0.8.13",
        settings : {
          optimizer: {
            enabled: true
          }
        }
      }
    ]
  },
  networks: {
    testnet: {
      url: process.env.POLYGON_MUMBAY_KEY,
      chainId: 80001,
      gasPrice: 20000000000,
      gasMultiplier: 3,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.POLYGON_MAINNET_KEY,
      chainId: 137,
      hardfork: "london",
      gasPrice: "auto",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS !== undefined,
  //   currency : "USD",
  //   token : "MATIC",
  //   gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  //   // token : "ETH",
  //   // gasPriceApi : "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice", 
  //   showTimeSpent : true,
  //   coinmarketcap : process.env.GAS_KEY
  // },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
};
