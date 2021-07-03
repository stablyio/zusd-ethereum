import { flags } from "@oclif/command";
import { EthSigningCommand } from "../base";

export class Mint extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    to: flags.string({
      description: "The recipient of the minted tokens",
      required: true,
    }),
    amount: flags.string({
      description: "The amount to mint (e.g. 154.23)",
      required: true,
    }),
  };

  async run() {
    const recipient = this.flag.to;
    const uint256Amount = this.decimalsToUint256(this.flag.amount);
    await this.signAndSend(
      this.token(),
      this.token().methods.mintTo(recipient, uint256Amount)
    );
    this.log(`Minted ${this.flag.amount} to ${this.flag.to}`);
  }
}
