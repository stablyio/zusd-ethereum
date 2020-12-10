import { EthCommand } from "../../../base";

export class IssuerMemberList extends EthCommand {
  static flags = {
    ...EthCommand.flags,
  };

  async run() {
    const numMembers = this.issuer().methods.numMembers().call();
    // This doesn't work with Infura for some reason: Returned error: data type size mismatch, expected 32 got 16
    // const addMemberTopic = this.issuer().getPastEvents('AddMember', {
    //   fromBlock: 0,
    //   toBlock: 'latest',
    // })
    const addMemberTopic = this.web3().utils.keccak256("AddMember(address)");
    const removeMemberTopic = this.web3().utils.keccak256(
      "RemoveMember(address)"
    );
    const addMemberLogs = this.web3().eth.getPastLogs({
      fromBlock: 0,
      toBlock: "latest",
      address: this.issuer().options.address,
      topics: [addMemberTopic],
    });
    const removeMemberLogs = this.web3().eth.getPastLogs({
      fromBlock: 0,
      toBlock: "latest",
      address: this.issuer().options.address,
      topics: [removeMemberTopic],
    });
    const membershipLogs = [
      ...(await addMemberLogs),
      ...(await removeMemberLogs),
    ];
    membershipLogs.sort((a: any, b: any) => {
      return a.blockNumber < b.blockNumber ? -1 : 0;
    });
    const members = new Set();
    for (const event of membershipLogs) {
      const eventName = event.topics[0];
      const member = this.eventLogAddressToAddress(event.topics[1]);
      if (eventName === addMemberTopic) {
        members.add(member);
      }
      if (eventName === removeMemberTopic) {
        members.delete(member);
      }
    }
    if (members.size !== Number(await numMembers)) {
      this.error(
        `Improper calculation of membership size, expected ${numMembers} but got ${members.size}`
      );
    }
    this.log(`Total of ${members.size} issuer members`);
    this.log([...members.values()].toString());
  }
}
