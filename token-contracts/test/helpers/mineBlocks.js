const util = require("util");

module.exports = async (numBlocks) => {
  const web3send = util.promisify(web3.currentProvider.send);
  await Promise.all(
    [...Array(numBlocks).keys()].map((i) =>
      web3send({
        jsonrpc: "2.0",
        method: "evm_mine",
        id: i,
      })
    )
  );
};
