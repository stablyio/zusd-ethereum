import { flags } from "@oclif/command";
import { EthSigningCommand } from "../../../base";

export class IssuerMintPropose extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    to: flags.string({
      description: "The address to issue new tokens to, defaults to self",
    }),
    amount: flags.string({
      description: "The amount of propose (e.g. 154.23)",
      required: true,
    }),
  };

  async run() {
    const recipient = this.flag.to
      ? this.flag.to
      : await this.getSignerAddress();
    const uint256Amount = this.decimalsToUint256(this.flag.amount);
    await this.signAndSend(
      this.issuer(),
      this.issuer().methods.proposeMint(recipient, uint256Amount)
    );
    this.log(`Proposed mint to ${recipient} for ${this.flag.amount}`);
  }
}
