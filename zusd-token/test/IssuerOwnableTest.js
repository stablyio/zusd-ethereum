const ZUSDIssuer = artifacts.require("ZUSDIssuer.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Test that the Issuer operates correctly as Ownable.
contract(
  "Issuer own",
  function ([_, owner, anotherAccount, anotherAccount2, randomAddress]) {
    beforeEach(async function () {
      const issuer = await ZUSDIssuer.new(randomAddress, 10, { from: owner });
      this.issuer = issuer;
    });

    describe("as an ownable", function () {
      it("should have an owner", async function () {
        let currentOwner = await this.issuer.owner();
        assert.notEqual(currentOwner, ZERO_ADDRESS);
        assert.equal(currentOwner, owner);
        let currentProposedOwner = await this.issuer.proposedOwner();
        assert.equal(currentProposedOwner, ZERO_ADDRESS);
      });

      it("sets new potential owner after proposeOwner", async function () {
        const { logs } = await this.issuer.proposeOwner(anotherAccount, {
          from: owner,
        });
        let currentOwner = await this.issuer.owner();
        assert.equal(currentOwner, owner);

        // emits an OwnershipTransferProposed event
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "OwnershipTransferProposed");
        assert.equal(logs[0].args.currentOwner, owner);
        assert.equal(logs[0].args.proposedOwner, anotherAccount);

        let newProposedOwner = await this.issuer.proposedOwner();
        assert.equal(newProposedOwner, anotherAccount);
      });

      it("removes proposed owner after disregardProposeOwner called by owner", async function () {
        await this.issuer.proposeOwner(anotherAccount, { from: owner });
        const { logs } = await this.issuer.disregardProposeOwner({
          from: owner,
        });
        let currentOwner = await this.issuer.owner();
        assert.equal(currentOwner, owner);

        // emits an OwnershipTransferDisregarded event
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "OwnershipTransferDisregarded");
        assert.equal(logs[0].args.oldProposedOwner, anotherAccount);

        let newProposedOwner = await this.issuer.proposedOwner();
        assert.equal(newProposedOwner, ZERO_ADDRESS);
      });

      it("removes proposed owner after disregardProposeOwner called by proposed owner", async function () {
        await this.issuer.proposeOwner(anotherAccount, { from: owner });
        const { logs } = await this.issuer.disregardProposeOwner({
          from: anotherAccount,
        });
        let currentOwner = await this.issuer.owner();
        assert.equal(currentOwner, owner);

        // emits an OwnershipTransferDisregarded event
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "OwnershipTransferDisregarded");
        assert.equal(logs[0].args.oldProposedOwner, anotherAccount);

        let newProposedOwner = await this.issuer.proposedOwner();
        assert.equal(newProposedOwner, ZERO_ADDRESS);
      });

      it("should prevent current owner from proposing itself as new owner", async function () {
        let currentOwner = await this.issuer.owner();
        assert.equal(currentOwner, owner);
        await assertRevert(this.issuer.proposeOwner(owner, { from: owner }));
      });

      it("should prevent non-proposed owners from calling disregardProposeOwner", async function () {
        await this.issuer.proposeOwner(anotherAccount, { from: owner });
        let proposedOwner = await this.issuer.proposedOwner();
        assert.equal(proposedOwner, anotherAccount);
        await assertRevert(
          this.issuer.disregardProposeOwner({ from: anotherAccount2 })
        );
      });

      it("should prevent calling disregardProposeOwner if there is no proposed owner to disregard", async function () {
        let proposedOwner = await this.issuer.proposedOwner();
        assert.equal(proposedOwner, ZERO_ADDRESS);
        await assertRevert(this.issuer.disregardProposeOwner({ from: owner }));
      });

      it("sets new owner after completeTransferOwnership", async function () {
        await this.issuer.proposeOwner(anotherAccount, { from: owner });
        const { logs } = await this.issuer.claimOwnership({
          from: anotherAccount,
        });
        let currentOwner = await this.issuer.owner();
        assert.equal(currentOwner, anotherAccount);

        // proposed owner is set back to zero address
        let proposedOwner = await this.issuer.proposedOwner();
        assert.equal(proposedOwner, ZERO_ADDRESS);

        // emits an OwnershipTransferred event
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "OwnershipTransferred");
        assert.equal(logs[0].args.oldOwner, owner);
        assert.equal(logs[0].args.newOwner, anotherAccount);
      });

      it("should prevent non-owners from transferring ownership", async function () {
        const currentOwner = await this.issuer.owner();
        assert.notEqual(currentOwner, anotherAccount2);
        await assertRevert(
          this.issuer.proposeOwner(anotherAccount2, { from: anotherAccount2 })
        );
      });

      it("should prevent non-proposedOwners from finishing transferring ownership", async function () {
        const currentOwner = await this.issuer.owner();
        assert.notEqual(currentOwner, anotherAccount2);
        await this.issuer.proposeOwner(anotherAccount, { from: owner });
        const newProposedOwner = await this.issuer.proposedOwner();
        assert.notEqual(newProposedOwner, anotherAccount2);
        await assertRevert(
          this.issuer.claimOwnership({ from: anotherAccount2 })
        );
      });

      it("should guard ownership against stuck state", async function () {
        let originalOwner = await this.issuer.owner();
        await assertRevert(
          this.issuer.proposeOwner(ZERO_ADDRESS, { from: originalOwner })
        );
      });
    });
  }
);
