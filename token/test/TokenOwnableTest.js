const ZUSDContract = artifacts.require("ZUSDImplementation.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

// Test that ZUSD operates correctly as an Ownable token.
contract("ZUSD own", function ([owner, anotherAccount, anotherAccount2]) {
  beforeEach(async function () {
    // Assumes the first address passed is the caller, in this case `owner`
    const proxiedZUSD = await deployProxy(ZUSDContract);
    this.token = proxiedZUSD;
  });

  describe("as an ownable", function () {
    it("should have an owner", async function () {
      let currentOwner = await this.token.owner();
      assert.notStrictEqual(currentOwner, ZERO_ADDRESS);
      assert.strictEqual(currentOwner, owner);
      let currentProposedOwner = await this.token.proposedOwner();
      assert.strictEqual(currentProposedOwner, ZERO_ADDRESS);
    });

    it("sets new potential owner after proposeOwner", async function () {
      const { logs } = await this.token.proposeOwner(anotherAccount, {
        from: owner,
      });
      let currentOwner = await this.token.owner();
      assert.strictEqual(currentOwner, owner);

      // emits an OwnershipTransferProposed event
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].event, "OwnershipTransferProposed");
      assert.strictEqual(logs[0].args.currentOwner, owner);
      assert.strictEqual(logs[0].args.proposedOwner, anotherAccount);

      let newProposedOwner = await this.token.proposedOwner();
      assert.strictEqual(newProposedOwner, anotherAccount);
    });

    it("removes proposed owner after disregardProposeOwner called by owner", async function () {
      await this.token.proposeOwner(anotherAccount, { from: owner });
      const { logs } = await this.token.disregardProposeOwner({
        from: owner,
      });
      let currentOwner = await this.token.owner();
      assert.strictEqual(currentOwner, owner);

      // emits an OwnershipTransferDisregarded event
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].event, "OwnershipTransferDisregarded");
      assert.strictEqual(logs[0].args.oldProposedOwner, anotherAccount);

      let newProposedOwner = await this.token.proposedOwner();
      assert.strictEqual(newProposedOwner, ZERO_ADDRESS);
    });

    it("removes proposed owner after disregardProposeOwner called by proposed owner", async function () {
      await this.token.proposeOwner(anotherAccount, { from: owner });
      const { logs } = await this.token.disregardProposeOwner({
        from: anotherAccount,
      });
      let currentOwner = await this.token.owner();
      assert.strictEqual(currentOwner, owner);

      // emits an OwnershipTransferDisregarded event
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].event, "OwnershipTransferDisregarded");
      assert.strictEqual(logs[0].args.oldProposedOwner, anotherAccount);

      let newProposedOwner = await this.token.proposedOwner();
      assert.strictEqual(newProposedOwner, ZERO_ADDRESS);
    });

    it("should prevent current owner from proposing itself as new owner", async function () {
      let currentOwner = await this.token.owner();
      assert.strictEqual(currentOwner, owner);
      await assertRevert(this.token.proposeOwner(owner, { from: owner }));
    });

    it("should prevent non-proposed owners from calling disregardProposeOwner", async function () {
      await this.token.proposeOwner(anotherAccount, { from: owner });
      let proposedOwner = await this.token.proposedOwner();
      assert.strictEqual(proposedOwner, anotherAccount);
      await assertRevert(
        this.token.disregardProposeOwner({ from: anotherAccount2 })
      );
    });

    it("should prevent calling disregardProposeOwner if there is no proposed owner to disregard", async function () {
      let proposedOwner = await this.token.proposedOwner();
      assert.strictEqual(proposedOwner, ZERO_ADDRESS);
      await assertRevert(this.token.disregardProposeOwner({ from: owner }));
    });

    it("sets new owner after completeTransferOwnership", async function () {
      await this.token.proposeOwner(anotherAccount, { from: owner });
      const { logs } = await this.token.claimOwnership({
        from: anotherAccount,
      });
      let currentOwner = await this.token.owner();
      assert.strictEqual(currentOwner, anotherAccount);

      // proposed owner is set back to zero address
      let proposedOwner = await this.token.proposedOwner();
      assert.strictEqual(proposedOwner, ZERO_ADDRESS);

      // emits an OwnershipTransferred event
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].event, "OwnershipTransferred");
      assert.strictEqual(logs[0].args.oldOwner, owner);
      assert.strictEqual(logs[0].args.newOwner, anotherAccount);
    });

    it("should prevent non-owners from transferring ownership", async function () {
      const currentOwner = await this.token.owner();
      assert.notStrictEqual(currentOwner, anotherAccount2);
      await assertRevert(
        this.token.proposeOwner(anotherAccount2, { from: anotherAccount2 })
      );
    });

    it("should prevent non-proposedOwners from finishing transferring ownership", async function () {
      const currentOwner = await this.token.owner();
      assert.notStrictEqual(currentOwner, anotherAccount2);
      await this.token.proposeOwner(anotherAccount, { from: owner });
      const newProposedOwner = await this.token.proposedOwner();
      assert.notStrictEqual(newProposedOwner, anotherAccount2);
      await assertRevert(this.token.claimOwnership({ from: anotherAccount2 }));
    });

    it("should guard ownership against stuck state", async function () {
      let originalOwner = await this.token.owner();
      await assertRevert(
        this.token.proposeOwner(ZERO_ADDRESS, { from: originalOwner })
      );
    });
  });

  describe("as an initializable token", function () {
    it("you should not be able to initialize a second time", async function () {
      await assertRevert(this.token.initialize({ from: owner }));
    });
  });
});
