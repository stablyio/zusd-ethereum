const ZUSDIssuer = artifacts.require("ZUSDIssuer.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Test that the Issuer can switch implementations.
contract(
  "Issuer implementation switch",
  function ([_, owner, anotherAccount, implementation1, implementation2]) {
    beforeEach(async function () {
      const issuer = await ZUSDIssuer.new(implementation1, 3, { from: owner });
      this.issuer = issuer;
    });

    describe("when the caller is the owner", function () {
      it("switches the implementation", async function () {
        await this.issuer.setImplementation(implementation2, { from: owner });
        const implementation = await this.issuer.implementation();

        assert.equal(implementation, implementation2);
      });
    });

    describe("when the caller is not the owner", function () {
      it("cannot switch the implementation", async function () {
        await assertRevert(
          this.issuer.setImplementation(implementation2, {
            from: anotherAccount,
          })
        );
      });
    });
  }
);
