const ZUSDContract = artifacts.require("ZUSDImplementation.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

// Test that ZUSD operates correctly as an ERC20 token.
contract("ZUSD ERC20", function ([owner, recipient, anotherAccount]) {
  beforeEach(async function () {
    // Assumes the first address passed is the caller, in this case `owner`
    const proxiedZUSD = await deployProxy(ZUSDContract);
    await proxiedZUSD.mintTo(owner, 100);
    this.token = proxiedZUSD;
  });

  describe("transfer", function () {
    describe("when the recipient is not the zero address", function () {
      const to = recipient;

      describe("when the sender does not have enough balance", function () {
        const amount = 101;

        it("reverts", async function () {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe("when the sender has enough balance", function () {
        const amount = 100;

        it("transfers the requested amount", async function () {
          await this.token.transfer(to, amount, { from: owner });

          const senderBalance = await this.token.balanceOf(owner);
          assert.equal(senderBalance, 0);

          const recipientBalance = await this.token.balanceOf(to);
          assert.equal(recipientBalance, amount);
        });

        it("emits a transfer event", async function () {
          const { logs } = await this.token.transfer(to, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Transfer");
          assert.equal(logs[0].args.from, owner);
          assert.equal(logs[0].args.to, to);
          assert.equal(logs[0].args.value, amount);
        });
      });
    });

    describe("when the recipient is the zero address", function () {
      const to = ZERO_ADDRESS;

      it("reverts", async function () {
        await assertRevert(this.token.transfer(to, 100, { from: owner }));
      });
    });
  });

  describe("approve", function () {
    describe("when the spender is not the zero address", function () {
      const spender = recipient;

      describe("when the sender has enough balance", function () {
        const amount = 100;

        it("emits an approval event", async function () {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert.equal(logs[0].args.value, amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("approves the requested amount and replaces the previous one", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });

      describe("when the sender does not have enough balance", function () {
        const amount = 101;

        it("emits an approval event", async function () {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "Approval");
          assert.equal(logs[0].args.owner, owner);
          assert.equal(logs[0].args.spender, spender);
          assert.equal(logs[0].args.value, amount);
        });

        describe("when there was no approved amount before", function () {
          it("approves the requested amount", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });

        describe("when the spender had an approved amount", function () {
          beforeEach(async function () {
            await this.token.approve(spender, 1, { from: owner });
          });

          it("approves the requested amount and replaces the previous one", async function () {
            await this.token.approve(spender, amount, { from: owner });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, amount);
          });
        });
      });
    });
    describe("when the spender is the zero address", function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it("reverts", async function () {
        await assertRevert(
          this.token.approve(spender, amount, { from: owner })
        );
      });
    });
  });

  describe("increaseAllowance", function () {
    describe("when the spender is not the zero address", function () {
      const spender = recipient;
      const amount = 100;

      describe("when there was no approved amount before", function () {
        it("approves the increase amount", async function () {
          await this.token.increaseAllowance(spender, amount, { from: owner });

          const allowance = await this.token.allowance(owner, spender);
          assert.equal(allowance, amount);
        });
      });

      describe("when the spender had an approved amount", function () {
        beforeEach(async function () {
          await this.token.approve(spender, 1, { from: owner });
        });

        it("increases the approved amount", async function () {
          await this.token.increaseAllowance(spender, amount, { from: owner });

          const allowance = await this.token.allowance(owner, spender);
          assert.equal(allowance, amount + 1);
        });
      });
    });
    describe("when the spender is the zero address", function () {
      const spender = ZERO_ADDRESS;
      const amount = 100;

      it("reverts", async function () {
        await assertRevert(
          this.token.increaseAllowance(spender, amount, { from: owner })
        );
      });
    });
  });

  describe("decreaseAllowance", function () {
    describe("when the spender is not the zero address", function () {
      const spender = recipient;
      const amount = 100;

      describe("when there was no approved amount before", function () {
        it("cannot make approval negative", async function () {
          await assertRevert(
            this.token.decreaseAllowance(spender, amount, { from: owner })
          );
        });
      });

      describe("when the spender had an approved amount", function () {
        beforeEach(async function () {
          await this.token.approve(spender, amount, { from: owner });
        });

        it("decreases the approved amount", async function () {
          await this.token.decreaseAllowance(spender, amount, { from: owner });

          const allowance = await this.token.allowance(owner, spender);
          assert.equal(allowance, amount - amount);
        });
      });
    });
    describe("when the spender is the zero address", function () {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it("reverts", async function () {
        await assertRevert(
          this.token.decreaseAllowance(spender, amount, { from: owner })
        );
      });
    });
  });

  describe("transferFrom", function () {
    const spender = recipient;

    describe("when the recipient is not the zero address", function () {
      const to = anotherAccount;

      describe("when the spender has enough approved balance", function () {
        beforeEach(async function () {
          await this.token.approve(spender, 100, { from: owner });
        });

        describe("when the owner has enough balance", function () {
          const amount = 100;

          it("transfers the requested amount", async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const senderBalance = await this.token.balanceOf(owner);
            assert.equal(senderBalance, 0);

            const recipientBalance = await this.token.balanceOf(to);
            assert.equal(recipientBalance, amount);
          });

          it("decreases the spender allowance", async function () {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            const allowance = await this.token.allowance(owner, spender);
            assert.equal(allowance, 0);
          });

          it("emits a transfer event", async function () {
            const { logs } = await this.token.transferFrom(owner, to, amount, {
              from: spender,
            });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, "Transfer");
            assert.equal(logs[0].args.from, owner);
            assert.equal(logs[0].args.to, to);
            assert.equal(logs[0].args.value, amount);
          });
        });

        describe("when the owner does not have enough balance", function () {
          const amount = 101;

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });

      describe("when the spender does not have enough approved balance", function () {
        beforeEach(async function () {
          await this.token.approve(spender, 99, { from: owner });
        });

        describe("when the owner has enough balance", function () {
          const amount = 100;

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });

        describe("when the owner does not have enough balance", function () {
          const amount = 101;

          it("reverts", async function () {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });
    });

    describe("when the recipient is the zero address", function () {
      const amount = 100;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: owner });
      });

      it("reverts", async function () {
        await assertRevert(
          this.token.transferFrom(owner, to, amount, { from: spender })
        );
      });
    });
  });
});
