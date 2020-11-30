const ZUSDContract = artifacts.require("ZUSDImplementation.sol");
const Proxy = artifacts.require("ZUSDProxy.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Tests that ZUSD compliance capabilities function correctly.
contract(
  "ZUSD regulatory compliance",
  function ([_, admin, complianceRole, otherAddress, freezableAddress, owner]) {
    beforeEach(async function () {
      const ZUSD = await ZUSDContract.new({ from: owner });
      const proxy = await Proxy.new(ZUSD.address, admin, { from: admin });
      const proxiedZUSD = await ZUSDContract.at(proxy.address);
      await proxiedZUSD.initialize({ from: owner });
      this.token = proxiedZUSD;
    });

    describe("when the compliance role is unset", function () {
      it("reverts compliance actions", async function () {
        await assertRevert(
          this.token.freeze(freezableAddress, { from: otherAddress })
        );
        await assertRevert(
          this.token.unfreeze(freezableAddress, { from: otherAddress })
        );
        await assertRevert(
          this.token.wipeFrozenAddress(freezableAddress, { from: otherAddress })
        );
      });
    });

    describe("as a regulatory compliant token", function () {
      beforeEach(async function () {
        await this.token.setComplianceRole(complianceRole, { from: owner });
      });

      describe("after setting the ComplianceRole", function () {
        it("the current compliance role is set", async function () {
          const currentComplianceRole = await this.token.complianceRole();
          assert.equal(currentComplianceRole, complianceRole);
        });
      });

      describe("freeze", function () {
        it("reverts when sender is not compliance", async function () {
          await assertRevert(
            this.token.freeze(freezableAddress, { from: otherAddress })
          );
        });

        it("adds the frozen address", async function () {
          await this.token.freeze(freezableAddress, { from: complianceRole });

          const frozen = await this.token.frozen(freezableAddress, {
            from: complianceRole,
          });
          assert.equal(frozen, true, "address is frozen");
        });

        it("emits a FreezeAddress event", async function () {
          const { logs } = await this.token.freeze(freezableAddress, {
            from: complianceRole,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "FreezeAddress");
          assert.equal(logs[0].args.addr, freezableAddress);
        });

        describe("when frozen", function () {
          const amount = 100;
          const approvalAmount = 40;

          beforeEach(async function () {
            // give the freezableAddress some tokens
            await this.token.mint(amount, { from: owner });
            await this.token.transfer(freezableAddress, amount, {
              from: owner,
            });

            // approve otherAddress address to take some of those tokens from freezableAddress
            await this.token.approve(otherAddress, approvalAmount, {
              from: freezableAddress,
            });

            // approve freezableAddress address to take some of those tokens from otherAddress
            await this.token.approve(freezableAddress, approvalAmount, {
              from: otherAddress,
            });

            // freeze freezableAddress
            await this.token.freeze(freezableAddress, { from: complianceRole });
          });

          it("reverts when transfer is from frozen address", async function () {
            await assertRevert(
              this.token.transfer(otherAddress, amount, {
                from: freezableAddress,
              })
            );
          });

          it("reverts when transfer is to frozen address", async function () {
            await assertRevert(
              this.token.transfer(freezableAddress, amount, {
                from: otherAddress,
              })
            );
          });

          it("reverts when transferFrom is by frozen address", async function () {
            await assertRevert(
              this.token.transferFrom(
                otherAddress,
                otherAddress,
                approvalAmount,
                { from: freezableAddress }
              )
            );
          });

          it("reverts when transferFrom is from frozen address", async function () {
            await assertRevert(
              this.token.transferFrom(
                freezableAddress,
                otherAddress,
                approvalAmount,
                { from: otherAddress }
              )
            );
          });

          it("reverts when transferFrom is to frozen address", async function () {
            await assertRevert(
              this.token.transferFrom(
                otherAddress,
                freezableAddress,
                approvalAmount,
                { from: otherAddress }
              )
            );
          });

          it("reverts when approve is from the frozen address", async function () {
            await assertRevert(
              this.token.approve(otherAddress, approvalAmount, {
                from: freezableAddress,
              })
            );
          });

          it("reverts when approve spender is the frozen address", async function () {
            await assertRevert(
              this.token.approve(freezableAddress, approvalAmount, {
                from: otherAddress,
              })
            );
          });

          it("reverts when mintTo is to frozen address", async function () {
            await assertRevert(
              this.token.mintTo(freezableAddress, approvalAmount, {
                from: owner,
              })
            );
          });

          it("reverts when burnFrom targets frozen address", async function () {
            await assertRevert(
              this.token.burnFrom(freezableAddress, approvalAmount, {
                from: owner,
              })
            );
          });

          it("reverts when burnFrom called by frozen address", async function () {
            await assertRevert(
              this.token.burnFrom(owner, approvalAmount, {
                from: freezableAddress,
              })
            );
          });
        });

        it("reverts when address is already frozen", async function () {
          await this.token.freeze(freezableAddress, { from: complianceRole });
          await assertRevert(
            this.token.freeze(freezableAddress, { from: complianceRole })
          );
        });
      });

      describe("unfreeze", function () {
        it("reverts when address is already unfrozen", async function () {
          await assertRevert(
            this.token.unfreeze(freezableAddress, { from: complianceRole })
          );
        });

        describe("when already frozen", function () {
          beforeEach(async function () {
            await this.token.freeze(freezableAddress, { from: complianceRole });
          });

          it("reverts when sender is not compliance", async function () {
            await assertRevert(
              this.token.unfreeze(freezableAddress, { from: otherAddress })
            );
          });

          it("removes a frozen address", async function () {
            await this.token.unfreeze(freezableAddress, {
              from: complianceRole,
            });

            const frozen = await this.token.frozen(freezableAddress, {
              from: complianceRole,
            });
            assert.equal(frozen, false, "address is unfrozen");
          });

          it("unfrozen address can transfer again", async function () {
            const amount = 100;

            await this.token.unfreeze(freezableAddress, {
              from: complianceRole,
            });

            await this.token.mint(amount, { from: owner });
            await this.token.transfer(freezableAddress, amount, {
              from: owner,
            });

            let balance = await this.token.balanceOf(freezableAddress);
            assert.equal(amount, balance);

            await this.token.transfer(owner, amount, {
              from: freezableAddress,
            });

            balance = await this.token.balanceOf(freezableAddress);
            assert.equal(0, balance);
          });

          it("emits an FreezeAddress event", async function () {
            const { logs } = await this.token.unfreeze(freezableAddress, {
              from: complianceRole,
            });

            assert.equal(logs.length, 1);
            assert.equal(logs[0].event, "UnfreezeAddress");
            assert.equal(logs[0].args.addr, freezableAddress);
          });
        });
      });

      describe("wipeFrozenAddress", function () {
        it("reverts when address is not frozen", async function () {
          await assertRevert(
            this.token.wipeFrozenAddress(freezableAddress, {
              from: complianceRole,
            })
          );
        });

        describe("when already frozen with assets and approvals", function () {
          const amount = 100;
          const approvalAmount = 40;

          beforeEach(async function () {
            // give the freezableAddress some tokens
            await this.token.mint(amount, { from: owner });
            await this.token.transfer(freezableAddress, amount, {
              from: owner,
            });

            await this.token.freeze(freezableAddress, { from: complianceRole });
          });

          it("reverts when sender is not asset protection", async function () {
            await assertRevert(
              this.token.wipeFrozenAddress(freezableAddress, {
                from: otherAddress,
              })
            );
          });

          it("wipes a frozen address balance", async function () {
            await this.token.wipeFrozenAddress(freezableAddress, {
              from: complianceRole,
            });

            const frozen = await this.token.frozen(freezableAddress, {
              from: complianceRole,
            });
            assert.equal(frozen, true, "address is still frozen");

            let balance = await this.token.balanceOf(freezableAddress);
            assert.equal(0, balance);
          });

          it("emits an WipeFrozenAddress event", async function () {
            const {
              logs,
            } = await this.token.wipeFrozenAddress(freezableAddress, {
              from: complianceRole,
            });

            assert.equal(logs.length, 3);
            assert.equal(logs[0].event, "Burn");
            assert.equal(logs[0].args.from, freezableAddress);
            assert.equal(logs[0].args.value, amount);
            assert.equal(logs[1].event, "Transfer");
            assert.equal(logs[1].args.from, freezableAddress);
            assert.equal(logs[1].args.to, ZERO_ADDRESS);
            assert.equal(logs[1].args.value, amount);
            assert.equal(logs[2].event, "WipeFrozenAddress");
            assert.equal(logs[2].args.addr, freezableAddress);
          });
        });
      });

      describe("setComplianceRole", function () {
        const amount = 100;

        it("reverts if sender is not owner or ComplianceRole", async function () {
          await assertRevert(
            this.token.setComplianceRole(otherAddress, { from: otherAddress })
          );
        });

        it("works if sender is ComplianceRole", async function () {
          await this.token.setComplianceRole(otherAddress, {
            from: complianceRole,
          });
          let currentComplianceRole = await this.token.complianceRole();
          assert.equal(currentComplianceRole, otherAddress);
        });

        it("enables new ComplianceRole to freeze", async function () {
          await this.token.setComplianceRole(otherAddress, {
            from: complianceRole,
          });
          await this.token.freeze(freezableAddress, { from: otherAddress });
          const frozen = await this.token.frozen(freezableAddress, {
            from: complianceRole,
          });
          assert.equal(frozen, true, "address is frozen");
        });

        it("prevents old ComplianceRole from freezing", async function () {
          await this.token.setComplianceRole(otherAddress, {
            from: complianceRole,
          });
          await assertRevert(
            this.token.freeze(freezableAddress, { from: complianceRole })
          );
        });

        it("emits a ComplianceRoleSet event", async function () {
          const { logs } = await this.token.setComplianceRole(otherAddress, {
            from: complianceRole,
          });

          assert.equal(logs.length, 1);
          assert.equal(logs[0].event, "ComplianceRoleSet");
          assert.equal(logs[0].args.oldComplianceRole, complianceRole);
          assert.equal(logs[0].args.newComplianceRole, otherAddress);
        });
      });
    });
  }
);
