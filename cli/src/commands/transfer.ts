import { flags } from "@oclif/command";
import { EthSigningCommand } from "../base";

export class Transfer extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    to: flags.string({
      description: "The recipient of the transferred tokens",
      required: true,
    }),
    amount: flags.string({
      description: "The amount of transfer (e.g. 154.23)",
      required: true,
    }),
  };

  async run() {
    const recipient = this.flag.to;
    const uint256Amount = this.decimalsToUint256(this.flag.amount);
    await this.signAndSend(
      this.token(),
      this.token().methods.transfer(recipient, uint256Amount)
    );
    this.log(
      `Transfered ${
        this.flag.amount
      } from ${await this.getSignerAddress()} to ${this.flag.to}`
    );
  }
}
