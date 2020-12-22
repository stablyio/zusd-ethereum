const ZUSDIssuer = artifacts.require("ZUSDIssuer.sol");
const ZUSDContract = artifacts.require("ZUSDImplementation.sol");

const assertRevert = require("./helpers/assertRevert");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

// Test that the Issuer operates correctly as Ownable.
contract("Issuer membership", function([owner, member1, member2, notmember]) {
  beforeEach(async function() {
    // Assumes the first address passed is the caller, in this case `owner`
    const proxiedZUSD = await deployProxy(ZUSDContract);
    this.token = proxiedZUSD;

    const issuer = await ZUSDIssuer.new(proxiedZUSD.address, 3, {
      from: owner,
    });
    this.issuer = issuer;
  });

  describe("when the caller is the owner", function() {
    it("adds new member", async function() {
      const noMembers = await this.issuer.numMembers();
      let membership1 = await this.issuer.isMember(member1);
      let membership2 = await this.issuer.isMember(member2);
      assert.equal(noMembers, 0);
      assert.equal(membership1, false);
      assert.equal(membership2, false);

      const { logs } = await this.issuer.addMember(member1, { from: owner });
      // Check events emitted
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, "AddMember");
      assert.equal(logs[0].args.member, member1);

      const oneMember = await this.issuer.numMembers();
      membership1 = await this.issuer.isMember(member1);
      membership2 = await this.issuer.isMember(member2);
      assert.equal(oneMember, 1);
      assert.equal(membership1, true);
      assert.equal(membership2, false);

      await this.issuer.addMember(member2, { from: owner });
      const twoMembers = await this.issuer.numMembers();
      membership1 = await this.issuer.isMember(member1);
      membership2 = await this.issuer.isMember(member2);
      assert.equal(twoMembers, 2);
      assert.equal(membership1, true);
      assert.equal(membership2, true);
    });

    it("removes existing member", async function() {
      await this.issuer.addMember(member1, { from: owner });
      await this.issuer.addMember(member2, { from: owner });

      const { logs } = await this.issuer.removeMember(member2, {
        from: owner,
      });
      // Check events emitted
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, "RemoveMember");
      assert.equal(logs[0].args.member, member2);

      const numMembers = await this.issuer.numMembers();
      const membership2 = await this.issuer.isMember(member2);
      assert.equal(numMembers, 1);
      assert.equal(membership2, false);
    });

    it("cannot add existing member", async function() {
      await this.issuer.addMember(member1, { from: owner });
      await assertRevert(this.issuer.addMember(member1, { from: owner }));
    });

    it("cannot remove non-member", async function() {
      await assertRevert(this.issuer.removeMember(member1, { from: owner }));
    });

    it("cannot add members beyond limit", async function() {
      var addresses = [];
      // Fill up the member slots
      for (var i = 0; i < 255; i++) {
        addresses.push(
          "0x" +
            (
              Math.random()
                .toString(16)
                .substring(2, 15) +
              Math.random()
                .toString(16)
                .substring(2, 15) +
              Math.random()
                .toString(16)
                .substring(2, 15) +
              Math.random()
                .toString(16)
                .substring(2, 15)
            ).substring(0, 40)
        );
      }
      await Promise.all(
        [...Array(255).keys()].map((i) =>
          this.issuer.addMember(addresses[i], { from: owner })
        )
      );
      // Try to add member 256 > 255
      await assertRevert(this.issuer.addMember(member1, { from: owner }));
    });
  });

  describe("when the caller is not the owner", function() {
    beforeEach(async function() {
      await this.issuer.addMember(member1, { from: owner });
    });

    describe("when the caller is a member", function() {
      it("should not add new member", async function() {
        await assertRevert(this.issuer.addMember(member2, { from: member1 }));
      });

      it("should not remove existing member", async function() {
        await assertRevert(this.issuer.addMember(member1, { from: member1 }));
      });
    });

    describe("when the caller is not a member", function() {
      it("should not add new member", async function() {
        await assertRevert(this.issuer.addMember(member2, { from: notmember }));
      });

      it("should not remove existing member", async function() {
        await assertRevert(this.issuer.addMember(member1, { from: notmember }));
      });
    });
  });
});
