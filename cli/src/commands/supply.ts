import { EthCommand } from "../base";

export class Supply extends EthCommand {
  static flags = {
    ...EthCommand.flags,
  };

  async run() {
    this.log(
      `Total supply ${this.uint256ToDecimals(
        await this.token().methods.totalSupply().call()
      )}`
    );
  }
}
