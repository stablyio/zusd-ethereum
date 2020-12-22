var HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = "";
const walletChildNum = 0;
const ropstenNetworkURL =
  "https://ropsten.infura.io/v3/801aaababe3d4de9b1028831c1b5ea20";
const mainnetNetworkURL =
  "https://mainnet.infura.io/v3/801aaababe3d4de9b1028831c1b5ea20";
const devPrivateKey =
  "dad9e00f37ef8bd5a2b885b2449e58ae32827860534b81aee6165355d74106de"; // 0x1F86Fcd770e735a7edD86Cd57098300D0b2e2AA7

module.exports = {
  plugins: ["solidity-coverage"],

  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      disableConfirmationListener: true, // Workaround to avoid issue with excessive eth_getBlockByNumber calls: https://github.com/trufflesuite/truffle/issues/3471 https://github.com/trufflesuite/truffle/issues/3522 https://github.com/trufflesuite/truffle/issues/2688
    },
    local: {
      host: "127.0.0.1",
      network_id: "*",
      port: 8545,
      gas: 6700000,
      gasPrice: 0x01,
    },
    ropsten: {
      network_id: 3,
      provider: function() {
        return new HDWalletProvider(devPrivateKey, ropstenNetworkURL);
      },
      // ropsten block limit
      gas: 4700000,
      gasPrice: 10100000000, // 10.1 gwei
      // confirmations: 0,
      // skipDryRun: true,
    },
    mainnet: {
      network_id: 1,
      provider: function() {
        return new HDWalletProvider(
          mnemonic,
          mainnetNetworkURL,
          walletChildNum
        );
      },
    },
  },
  compilers: {
    solc: {
      version: "v0.6.0",
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
