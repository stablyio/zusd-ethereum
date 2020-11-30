// npm run get-implementation-address mainnet
var ZUSDProxy = artifacts.require("ZUSDProxy");

module.exports = async function () {
  const proxy = await ZUSDProxy.deployed();
  web3.eth.getStorageAt(
    // contract address
    proxy.address,
    // implementation slot: keccak256('eip1967.proxy.implementation')) - 1
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    function (err, resp) {
      if (err) {
        console.error(err);
      }
      console.log(resp);
    }
  );
};
