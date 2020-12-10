import { flags } from "@oclif/command";
import { EthSigningCommand } from "../../../base";

export class IssuerMemberAdd extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    address: flags.string({
      description: "The new issuance member to add",
      required: true,
    }),
  };

  async run() {
    if (!(await this.isIssuerOwner())) {
      this.log(
        `Only owner can call this method, ${await this.getSignerAddress()} is not the owner`
      );
      this.exit();
    }
    await this.signAndSend(
      this.issuer(),
      this.issuer().methods.addMember(this.flag.address)
    );
    this.log(`Added ${this.flag.address} as a member of issuer`);
  }
}
