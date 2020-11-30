const ZUSDIssuer = artifacts.require("ZUSDIssuer.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Test that the Issuer can switch implementations.
contract(
  "Issuer get",
  function ([_, owner, implementation, member, notmember]) {
    beforeEach(async function () {
      const issuer = await ZUSDIssuer.new(implementation, 3, { from: owner });
      this.issuer = issuer;
    });

    describe("implementation data", function () {
      it("can get the implementation address", async function () {
        const implementationAddress = await this.issuer.implementation();
        assert.equal(implementationAddress, implementation);
      });
    });

    describe("member data", function () {
      beforeEach(async function () {
        await this.issuer.addMember(member, { from: owner });
      });

      it("can get membership status of member", async function () {
        const isMember = await this.issuer.isMember(member);
        assert.equal(isMember, true);
      });

      it("can get membership status of non-member", async function () {
        const isMember = await this.issuer.isMember(notmember);
        assert.equal(isMember, false);
      });

      it("can get maxMembers", async function () {
        const maxMembers = await this.issuer.maxMembers();
        assert.equal(maxMembers, 255);
      });

      it("can get numMembers", async function () {
        const numMembers = await this.issuer.numMembers();
        assert.equal(numMembers, 1);
      });
    });

    describe("mint mechanism data", function () {
      beforeEach(async function () {
        await this.issuer.addMember(member, { from: owner });
        await this.issuer.proposeMint(notmember, 100, { from: member });
      });

      it("can get pending mint from auto-generated pendingMints getter", async function () {
        const pendingMint = await this.issuer.pendingMints(0);
        let latestBlock = await web3.eth.getBlock("latest");
        assert.equal(pendingMint.recipient, notmember);
        assert.equal(pendingMint.value, 100);
        assert.equal(pendingMint.canMintAtBlock, latestBlock.number + 3);
      });

      it("can get mintWaitBlocks", async function () {
        const mintWaitBlocks = await this.issuer.mintWaitBlocks();
        assert.equal(mintWaitBlocks, 3);
      });

      it("can get pendingMintsIndex", async function () {
        const pendingMintsIndex = await this.issuer.pendingMintsIndex();
        assert.equal(pendingMintsIndex, 1);
      });
    });

    describe("owner data", function () {
      it("can get owner", async function () {
        const _owner = await this.issuer.owner();
        assert.equal(_owner, owner);
      });

      it("can get proposedOwner when it is unassigned", async function () {
        const _proposedOwner = await this.issuer.proposedOwner();
        assert.equal(_proposedOwner, ZERO_ADDRESS);
      });

      it("can get proposedOwner when it is assigned", async function () {
        await this.issuer.proposeOwner(member, { from: owner });

        const _proposedOwner = await this.issuer.proposedOwner();
        assert.equal(_proposedOwner, member);
      });
    });
  }
);
