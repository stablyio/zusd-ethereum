const ZUSD1 = artifacts.require("ZUSDImplementation.sol");
const ZUSD2 = artifacts.require("ZUSDWithBalance.sol");
const Proxy = artifacts.require("ZUSDProxy.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Test that ZUSD is upgradeable
contract(
  "ZUSD upgrade",
  function ([_, admin, owner, issuer, compliance, anotherAccount]) {
    beforeEach(async function () {
      const implementation = await ZUSD1.new({ from: owner });
      const proxy = await Proxy.new(implementation.address, admin, {
        from: admin,
      });
      const proxiedZUSD = await ZUSD1.at(proxy.address);
      await proxiedZUSD.initialize({ from: owner });
      this.token = proxiedZUSD;
      this.proxy = proxy;
    });

    describe("as an admin", function () {
      it("cannot call non-admin functions", async function () {
        await assertRevert(this.token.totalSupply({ from: admin }));
      });

      it("upgrades the implementation address", async function () {
        const newImplementation = await ZUSD2.new({ from: owner });
        const oldImplementationAddress = await web3.eth.getStorageAt(
          // contract address
          this.proxy.address,
          // implementation slot: keccak256('eip1967.proxy.implementation')) - 1
          "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
          function (err, resp) {
            if (err) {
              assert.fail(err);
            }
            return resp;
          }
        );
        await this.proxy.upgradeTo(newImplementation.address, { from: admin });
        const newImplementationAddress = await web3.eth.getStorageAt(
          // contract address
          this.proxy.address,
          // implementation slot: keccak256('eip1967.proxy.implementation')) - 1
          "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
          function (err, resp) {
            if (err) {
              assert.fail(err);
            }
            return resp;
          }
        );

        assert.notEqual(oldImplementationAddress, newImplementationAddress);
        assert.equal(
          web3.utils.toChecksumAddress(newImplementationAddress),
          newImplementation.address
        );
      });

      it("sets new admin", async function () {
        const { logs } = await this.proxy.changeAdmin(anotherAccount, {
          from: admin,
        });

        const newAdmin = await web3.eth.getStorageAt(
          // contract address
          this.proxy.address,
          // implementation slot: keccak256("eip1967.proxy.admin")) - 1
          "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
          function (err, resp) {
            if (err) {
              assert.fail(err);
            }
            return resp;
          }
        );
        assert.equal(web3.utils.toChecksumAddress(newAdmin), anotherAccount);

        // emits a AdminChanged event
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "AdminChanged");
        assert.equal(logs[0].args.previousAdmin, admin);
        assert.equal(logs[0].args.newAdmin, anotherAccount);
      });
    });

    describe("as a non-admin", function () {
      it("can call non-admin functions", async function () {
        const totalSupply = await this.token.totalSupply({
          from: anotherAccount,
        });
        assert.equal(totalSupply, 0);
      });

      it("cannot call admin functions", async function () {
        await assertRevert(this.proxy.implementation({ from: anotherAccount }));
      });

      it("cannot upgrade the implementation address", async function () {
        const newImplementation = await ZUSD2.new({ from: owner });
        await assertRevert(
          this.proxy.upgradeTo(newImplementation.address, {
            from: anotherAccount,
          })
        );
      });

      it("cannot set new admin", async function () {
        await assertRevert(
          this.proxy.changeAdmin(anotherAccount, { from: anotherAccount })
        );
      });
    });

    describe("as a new implementation", function () {
      beforeEach(async function () {
        await this.token.mintTo(anotherAccount, 100, { from: owner });
        const newImplementation = await ZUSD2.new({ from: owner });
        await this.proxy.upgradeTo(newImplementation.address, { from: admin });
        const proxiedZUSD = await ZUSD2.at(this.proxy.address);
        this.newToken = proxiedZUSD;
      });

      it("can access old data", async function () {
        const balance = await this.newToken.balanceOf(anotherAccount);
        assert.equal(100, balance);

        const fetchedOwner = await this.newToken.owner();
        assert.equal(owner, fetchedOwner);
      });

      it("can call existing functions", async function () {
        await this.newToken.mintTo(anotherAccount, 50, { from: owner });

        const balance = await this.newToken.balanceOf(anotherAccount);
        assert.equal(150, balance);
      });

      it("can call new functions", async function () {
        await this.newToken.topupBalance(anotherAccount, 888, {
          from: anotherAccount,
        });

        const balance = await this.newToken.balanceOf(anotherAccount);
        assert.equal(888, balance);
      });
    });
  }
);
