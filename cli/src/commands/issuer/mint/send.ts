import { flags } from "@oclif/command";
import { EthSigningCommand } from "../../../base";

export class IssuerMintSend extends EthSigningCommand {
  static flags = {
    ...EthSigningCommand.flags,
    index: flags.string({
      description: "The index of the pending mint to send",
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
    interface PendingMintInfo {
      recipient: string;
      value: string;
      canMintAtBlock: string;
    }
    const mintInfo: PendingMintInfo = await this.issuer()
      .methods.pendingMints(mintIndex)
      .call();
    this.log(
      `You are about to mint to ${
        mintInfo.recipient
      } a total of ${this.uint256ToDecimals(mintInfo.value)} tokens`
    );
    await this.signAndSend(
      this.issuer(),
      this.issuer().methods.sendMint(mintIndex)
    );
    this.log(`Accepted mint proposal ${mintIndex} and sent mint transaction`);
  }
}
