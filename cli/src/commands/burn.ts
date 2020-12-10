import { flags } from "@oclif/command";
import { EthSigningCommand } from "../base";

export class Burn extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    amount: flags.string({
      description: "The amount of burn (e.g. 154.23)",
      required: true,
    }),
  };

  async run() {
    const uint256Amount = this.decimalsToUint256(this.flag.amount);
    await this.signAndSend(
      this.token(),
      this.token().methods.burn(uint256Amount)
    );
    this.log(
      `Burned ${this.flag.amount} from ${await this.getSignerAddress()}`
    );
  }
}
