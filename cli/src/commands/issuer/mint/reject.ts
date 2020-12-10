import { flags } from "@oclif/command";
import { EthSigningCommand } from "../../../base";

export class IssuerMintReject extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    index: flags.string({
      description: "The index of the pending mint to reject",
      required: true,
    }),
  };

  async run() {
    if (!(await this.isIssuerMember())) {
      this.log(
        `Only issuer members can call this method, ${await this.getSignerAddress()} is not a member`
      );
      this.exit();
    }
    const mintIndex = this.flag.index;
    await this.signAndSend(
      this.issuer(),
      this.issuer().methods.rejectMint(mintIndex)
    );
    this.log(`Rejected mint proposal ${mintIndex}`);
  }
}
