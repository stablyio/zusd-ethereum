import { EthCommand } from "../../../base";
import chalk from "chalk";

export class IssuerMintList extends EthCommand {
  static flags = {
    ...EthCommand.flags,
  };

  async run() {
    const proposedTopic = this.web3().utils.keccak256(
      "MintProposed(address,uint256)"
    );
    const rejectedTopic = this.web3().utils.keccak256(
      "MintRejected(address,uint256)"
    );
    const sentTopic = this.web3().utils.keccak256("MintSent(address,uint256)");
    const allLogs = await this.web3().eth.getPastLogs({
      fromBlock: 0,
      toBlock: "latest",
      address: this.issuer().options.address,
      topics: [[proposedTopic, rejectedTopic, sentTopic]],
    });
    allLogs.sort((a: any, b: any) => {
      return Number(a.blockNumber) - Number(b.blockNumber);
    });
    const pendingMints = new Map<number, string>();
    for (const event of allLogs) {
      const eventName = event.topics[0];
      const proposer = this.eventLogAddressToAddress(event.topics[1]);
      const decodedData = this.web3().eth.abi.decodeParameters(
        ["uint256"],
        event.data
      );
      const index = decodedData[0];
      if (eventName === proposedTopic) {
        pendingMints.set(index, proposer);
      }
      if (eventName === sentTopic || eventName === rejectedTopic) {
        pendingMints.delete(index);
      }
    }
    const pendingMintInfoPromises = new Map<number, any>();
    pendingMints.forEach((proposer: string, index: number) => {
      const infoPromise = this.issuer().methods.pendingMints(index).call();
      pendingMintInfoPromises.set(index, infoPromise);
    });
    const currentBlockNumber = await this.web3().eth.getBlockNumber();
    this.log(`Total of ${pendingMints.size} pending mints`);
    this.log(`The current block number is ${currentBlockNumber}`);
    interface PendingMintInfo {
      recipient: string;
      value: string;
      canMintAtBlock: string;
    }
    const pendingMintInfos = await Promise.all(
      pendingMintInfoPromises.values()
    );
    const indexes = [...pendingMints.keys()];
    for (let i = 0; i < pendingMintInfos.length; i++) {
      const index = indexes[i];
      const proposer = pendingMints.get(index);
      const pendingMintInfo: PendingMintInfo = pendingMintInfos[i];
      const applyColor = () => {
        if (currentBlockNumber >= Number(pendingMintInfo.canMintAtBlock)) {
          return chalk.reset;
        }
        return chalk.yellow;
      };
      this.log(
        applyColor()(
          `Index: ${index}\tProposed by: ${proposer}\tRecipient: ${
            pendingMintInfo.recipient
          }\tAmount: ${this.uint256ToDecimals(
            pendingMintInfo.value
          )}\tMintable after block: ${pendingMintInfo.canMintAtBlock}`
        )
      );
    }
  }
}
