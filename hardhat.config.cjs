require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: { enabled: true, runs: 1 }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    }
  }
};
