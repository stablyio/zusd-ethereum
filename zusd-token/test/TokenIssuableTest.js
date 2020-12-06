const ZUSDContract = artifacts.require("ZUSDImplementation.sol");

const assertRevert = require("./helpers/assertRevert");
const {
  ZERO_ADDRESS,
  MAX_UINT256,
} = require("openzeppelin-test-helpers").constants;
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

// Tests that ZUSD token issuance mechanisms operate correctly.
contract("ZUSD issue", function ([owner, newIssuer, otherAddress]) {
  beforeEach(async function () {
    // Assumes the first address passed is the caller, in this case `owner`
    const proxiedZUSD = await deployProxy(ZUSDContract);
    this.token = proxiedZUSD;
  });

  describe("as an issuable token", function () {
    describe("after token creation", function () {
      it("sender should be token owner", async function () {
        const tokenOwner = await this.token.owner({ from: owner });
        assert.equal(tokenOwner, owner);
      });

      it("sender should be issuer", async function () {
        const issuer = await this.token.issuer();
        assert.equal(issuer, owner);
      });

      it("total supply should be zero", async function () {
        const totalSupply = await this.token.totalSupply({ from: owner });
        assert.equal(totalSupply, 0);
      });

      it("balances should be zero", async function () {
        const ownerBalance = await this.token.balanceOf(owner, {
          from: owner,
        });
        assert.equal(ownerBalance, 0);
        const otherBalance = await this.token.balanceOf(otherAddress, {
          from: owner,
        });
        assert.equal(otherBalance, 0);
      });
    });

    describe("mint", function () {
      const amount = 100;

      it("reverts when sender is not issuer", async function () {
        await assertRevert(this.token.mint(amount, { from: otherAddress }));
      });

      it("adds the requested amount", async function () {
        await this.token.mint(amount, { from: owner });

        const balance = await this.token.balanceOf(owner);
        assert.equal(balance, amount, "issuer balance matches");

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, amount, "total supply matches");
      });

      it("emits a Mint and a Transfer event", async function () {
        const { logs } = await this.token.mint(amount, { from: owner });

        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, "Mint");
        assert.equal(logs[0].args.to, owner);
        assert.equal(logs[0].args.value, amount);

        assert.equal(logs[1].event, "Transfer");
        assert.equal(logs[1].args.from, ZERO_ADDRESS);
        assert.equal(logs[1].args.to, owner);
        assert.equal(logs[1].args.value, amount);
      });

      it("cannot mint resulting in positive overflow of the totalSupply", async function () {
        // issue a big amount - more than half of what is possible
        bigAmount = MAX_UINT256;
        await this.token.mint(bigAmount, { from: owner });
        let balance = await this.token.balanceOf(owner);
        assert.equal(bigAmount.toString(), balance.toString());
        // send it to another address
        await this.token.transfer(otherAddress, bigAmount, { from: owner });
        balance = await this.token.balanceOf(owner);
        assert.equal(0, balance.toNumber());
        // try to issue more than is possible for a uint256 totalSupply
        await assertRevert(this.token.mint(bigAmount, { from: owner }));
        balance = await this.token.balanceOf(owner);
        assert.equal(0, balance.toNumber());
      });
    });

    describe("mintTo", function () {
      const amount = 100;

      it("reverts when sender is not issuer", async function () {
        await assertRevert(
          this.token.mintTo(otherAddress, amount, { from: otherAddress })
        );
      });

      it("reverts when the recipient is the zero address", async function () {
        await assertRevert(
          this.token.mintTo(ZERO_ADDRESS, amount, { from: owner })
        );
      });

      it("adds the requested amount", async function () {
        await this.token.mintTo(otherAddress, amount, { from: owner });

        const balance = await this.token.balanceOf(otherAddress);
        assert.equal(balance, amount, "minted balance matches");

        const totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, amount, "total supply matches");
      });

      it("emits a Mint and a Transfer event", async function () {
        const { logs } = await this.token.mintTo(otherAddress, amount, {
          from: owner,
        });

        assert.equal(logs.length, 2);
        assert.equal(logs[0].event, "Mint");
        assert.equal(logs[0].args.to, otherAddress);
        assert.equal(logs[0].args.value, amount);

        assert.equal(logs[1].event, "Transfer");
        assert.equal(logs[1].args.from, ZERO_ADDRESS);
        assert.equal(logs[1].args.to, otherAddress);
        assert.equal(logs[1].args.value, amount);
      });
    });

    describe("setIssuer", function () {
      const amount = 100;
      let logs = null;

      beforeEach(async function () {
        const res = await this.token.setIssuer(newIssuer, { from: owner });
        logs = res.logs;
      });

      it("reverts if sender is not owner", async function () {
        await assertRevert(
          this.token.setIssuer(otherAddress, { from: newIssuer })
        );
      });

      it("reverts if newIssuer is address zero", async function () {
        await assertRevert(this.token.setIssuer(ZERO_ADDRESS, { from: owner }));
      });

      it("enables new issuer to increase and decrease supply", async function () {
        const currentIssuer = await this.token.issuer();
        assert.equal(currentIssuer, newIssuer);

        let balance = await this.token.balanceOf(newIssuer);
        assert.equal(balance, 0, "issuer balance starts at 0");
        let totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 0, "total supply starts at 0");

        await this.token.mint(amount, { from: newIssuer });
        balance = await this.token.balanceOf(newIssuer);
        assert.equal(balance, amount, "issuer balance matches");
        totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, amount, "total supply matches");

        await this.token.burn(amount, { from: newIssuer });
        balance = await this.token.balanceOf(newIssuer);
        assert.equal(balance, 0, "issuer balance matches");
        totalSupply = await this.token.totalSupply();
        assert.equal(totalSupply, 0, "total supply matches");
      });

      it("prevents old issuer from minting", async function () {
        await assertRevert(this.token.mint(amount, { from: owner }));
      });

      it("emits a IssuerSet event", async function () {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, "IssuerSet");
        assert.equal(logs[0].args.oldIssuer, owner);
        assert.equal(logs[0].args.newIssuer, newIssuer);
      });
    });
  });
});
