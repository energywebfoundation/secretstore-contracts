
require("dotenv").config()
const HDWalletProvider = require("@truffle/hdwallet-provider")

privatekeys = [process.env.DEPLOYMENT_KEY, process.env.OWNER_KEY]

module.exports = {
  networks: {
    test: {
      host: "localhost",
      port: 8545,
      gas: 6000000,
      network_id: "*"
    },
    dev: {
      host: "127.0.0.1",
      port: 8545,
      gas: 6000000,
      network_id: "*" // Match any network id
    },
    volta: {
      network_id: "73799",
      gas: 6000000,
      gasPrice: "2",
      provider: new HDWalletProvider(privatekeys, "https://volta-rpc.energyweb.org", 0, 2)
    },
    ewc: {
      network_id: "246",
      gas: 6000000,
      gasPrice: "1000",
      provider: new HDWalletProvider(privatekeys, "https://rpc.energyweb.org", 0, 2)
    }
  },
  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.7",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: false,
         runs: 200
       }
      }
    }
  }
}

