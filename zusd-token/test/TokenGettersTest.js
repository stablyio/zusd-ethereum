const ZUSDMock = artifacts.require("ZUSDWithBalance.sol");
const Proxy = artifacts.require("ZUSDProxy.sol");

const assertRevert = require("./helpers/assertRevert");
const { ZERO_ADDRESS } = require("openzeppelin-test-helpers").constants;

// Test ZUSD getters
contract("ZUSD get", function ([_, admin, recipient, anotherAccount, owner]) {
  beforeEach(async function () {
    const ZUSD = await ZUSDMock.new({ from: owner });
    const proxy = await Proxy.new(ZUSD.address, admin, { from: admin });
    const proxiedZUSD = await ZUSDMock.at(proxy.address);
    await proxiedZUSD.initialize({ from: owner });
    await proxiedZUSD.initializeBalance(owner, 100);
    this.token = proxiedZUSD;
  });

  describe("details", function () {
    it("can get name", async function () {
      const name = await this.token.name();
      assert.equal(name, "Zytara USD");
    });

    it("can get symbol", async function () {
      const symbol = await this.token.symbol();
      assert.equal(symbol, "ZUSD");
    });

    it("can get decimals", async function () {
      const decimals = await this.token.decimals();
      assert.equal(decimals, 18);
    });
  });

  describe("balance data", function () {
    it("can get totalSupply", async function () {
      const totalSupply = await this.token.totalSupply();
      assert.equal(totalSupply, 100);
    });

    it("can get balanceOf for account with no balance", async function () {
      const balance = await this.token.balanceOf(anotherAccount);
      assert.equal(balance, 0);
    });

    it("can get balanceOf for account with balance", async function () {
      const balance = await this.token.balanceOf(owner);
      assert.equal(balance, 100);
    });
  });

  describe("allowance data", function () {
    it("can get allowance for account with no allowance", async function () {
      const allowance = await this.token.allowance(anotherAccount, owner);
      assert.equal(allowance, 0);
    });

    it("can get allowance for account with an allowance", async function () {
      await this.token.approve(anotherAccount, 100, { from: owner });

      const allowance = await this.token.allowance(owner, anotherAccount);
      assert.equal(allowance, 100);
    });
  });

  describe("owner data", function () {
    it("can get owner", async function () {
      const _owner = await this.token.owner();
      assert.equal(_owner, owner);
    });

    it("can get proposedOwner when it is unassigned", async function () {
      const _proposedOwner = await this.token.proposedOwner();
      assert.equal(_proposedOwner, ZERO_ADDRESS);
    });

    it("can get proposedOwner when it is assigned", async function () {
      await this.token.proposeOwner(anotherAccount, { from: owner });

      const _proposedOwner = await this.token.proposedOwner();
      assert.equal(_proposedOwner, anotherAccount);
    });
  });

  describe("pause data", function () {
    it("can get paused status when not paused", async function () {
      const _paused = await this.token.paused();
      assert.equal(_paused, false);
    });

    it("can get paused status when paused", async function () {
      await this.token.pause({ from: owner });

      const _paused = await this.token.paused();
      assert.equal(_paused, true);
    });
  });

  describe("compliance data", function () {
    it("can get complianceRole when it is unassigned", async function () {
      const _complianceRole = await this.token.complianceRole();
      assert.equal(_complianceRole, ZERO_ADDRESS);
    });

    it("can get complianceRole when it is assigned", async function () {
      await this.token.setComplianceRole(anotherAccount, { from: owner });

      const _complianceRole = await this.token.complianceRole();
      assert.equal(_complianceRole, anotherAccount);
    });

    it("can get frozen status for unfrozen address", async function () {
      const _frozen = await this.token.frozen(anotherAccount);
      assert.equal(_frozen, false);
    });

    it("can get frozen status for frozen address", async function () {
      await this.token.setComplianceRole(owner, { from: owner });
      this.token.freeze(anotherAccount, { from: owner });

      const _frozen = await this.token.frozen(anotherAccount);
      assert.equal(_frozen, true);
    });
  });

  describe("issuer data", function () {
    it("can get issuer", async function () {
      const _issuer = await this.token.issuer();
      assert.equal(_issuer, owner);
    });
  });
});
