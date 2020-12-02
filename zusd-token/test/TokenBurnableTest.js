const ZUSDContract = artifacts.require("ZUSDImplementation.sol");
const Proxy = artifacts.require("ZUSDProxy.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Tests that the ZUSD token burn mechanism operates correctly
contract("ZUSD burn", function ([_, admin, newIssuer, otherAddress, owner]) {
  beforeEach(async function () {
    const ZUSD = await ZUSDContract.new({ from: owner });
    const proxy = await Proxy.new(ZUSD.address, admin, { from: admin });
    const proxiedZUSD = await ZUSDContract.at(proxy.address);
    await proxiedZUSD.initialize({ from: owner });
    this.token = proxiedZUSD;
  });

  describe("as a burnable token", function () {
    describe("burn", function () {
      const initialAmount = 500;
      const decreaseAmount = 100;
      const finalAmount = initialAmount - decreaseAmount;

      describe("when the burner has insufficient tokens", function () {
        it("reverts", async function () {
          await assertRevert(this.token.burn(decreaseAmount, { from: owner }));
        });
      });

      describe("when the burner has sufficient tokens", function () {
        // Issue some tokens to start.
        beforeEach(async function () {
          await this.token.mint(initialAmount, { from: owner });
        });

        it("removes the requested amount", async function () {
          await this.token.burn(decreaseAmount, { from: owner });

          const balance = await this.token.balanceOf(owner);
          assert.equal(balance, finalAmount, "sender balance matches");

          const totalSupply = await this.token.totalSupply();
          assert.equal(totalSupply, finalAmount, "total supply matches");
        });

        it("emits a Burn and a Transfer event", async function () {
          const { logs } = await this.token.burn(decreaseAmount, {
            from: owner,
          });

          assert.equal(logs.length, 2);
          assert.equal(logs[0].event, "Burn");
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.value, decreaseAmount);

          assert.equal(logs[1].event, "Transfer");
          assert.equal(logs[1].args.from, owner);
          assert.equal(logs[1].args.to, ZERO_ADDRESS);
          assert.equal(logs[1].args.value, decreaseAmount);
        });
      });
    });

    describe("burnFrom", function () {
      const initialAmount = 500;
      const decreaseAmount = 100;
      const finalAmount = initialAmount - decreaseAmount;

      describe("when the target has enough approved balance", function () {
        beforeEach(async function () {
          await this.token.approve(otherAddress, 100, { from: owner });
        });

        describe("when the target has insufficient tokens", function () {
          it("reverts", async function () {
            await assertRevert(
              this.token.burnFrom(owner, decreaseAmount, { from: otherAddress })
            );
          });
        });

        describe("when the target has sufficient tokens", function () {
          // Issue some tokens to start.
          beforeEach(async function () {
            await this.token.mint(initialAmount, { from: owner });
          });

          it("removes the requested amount", async function () {
            await this.token.burnFrom(owner, decreaseAmount, {
              from: otherAddress,
            });

            const balance = await this.token.balanceOf(owner);
            assert.equal(balance, finalAmount, "burned balance matches");

            const totalSupply = await this.token.totalSupply();
            assert.equal(totalSupply, finalAmount, "total supply matches");
          });

          it("emits a Burn and a Transfer event", async function () {
            const { logs } = await this.token.burnFrom(owner, decreaseAmount, {
              from: otherAddress,
            });

            assert.equal(logs.length, 2);
            assert.equal(logs[0].event, "Burn");
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.value, decreaseAmount);

            assert.equal(logs[1].event, "Transfer");
            assert.equal(logs[1].args.from, owner);
            assert.equal(logs[1].args.to, ZERO_ADDRESS);
            assert.equal(logs[1].args.value, decreaseAmount);
          });
        });
      });

      describe("when the target does not have enough approved balance", function () {
        // Issue less tokens than will be approved
        beforeEach(async function () {
          await this.token.approve(otherAddress, 99, { from: owner });
        });

        it("reverts when the target has insufficient tokens", async function () {
          await assertRevert(
            this.token.burnFrom(owner, decreaseAmount, { from: otherAddress })
          );
        });

        it("reverts when the target has sufficient tokens", async function () {
          await this.token.mint(initialAmount, { from: owner });
          await assertRevert(
            this.token.burnFrom(owner, decreaseAmount, { from: otherAddress })
          );
        });
      });
    });
  });
});
