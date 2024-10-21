// hardhat.config.ts

require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-chai-matchers");

require("dotenv").config();

const config = {
  solidity: "0.8.23",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        count: 10,
        accountsBalance: "10000000000000000000000", // 10000 ETH
      },
    },
    scrollSepolia: {
      url:
        process.env.SCROLL_SEPOLIA_RPC_URL || "https://sepolia-rpc.scroll.io",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      scrollSepolia: process.env.SCROLLSCAN_API_KEY,
    },
    customChains: [
      {
        network: "scrollSepolia",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/",
        },
      },
    ],
  },
};

module.exports = config;
