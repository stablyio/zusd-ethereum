const ZUSDMock = artifacts.require("ZUSDWithBalance.sol");
const Proxy = artifacts.require("ZUSDProxy.sol");

const assertRevert = require("./helpers/assertRevert");

// Test that ZUSD operates correctly as a Pausable token.
contract("ZUSD pause", function ([_, admin, anotherAccount, owner]) {
  beforeEach(async function () {
    const ZUSD = await ZUSDMock.new({ from: owner });
    const proxy = await Proxy.new(ZUSD.address, admin, { from: admin });
    const proxiedZUSD = await ZUSDMock.at(proxy.address);
    await proxiedZUSD.initialize({ from: owner });
    await proxiedZUSD.initializeBalance(owner, 100);
    this.token = proxiedZUSD;
  });

  const amount = 10;

  it("can transfer in non-pause", async function () {
    const paused = await this.token.paused();
    assert.equal(paused, false);
    await this.token.transfer(anotherAccount, amount, { from: owner });
    const balance = await this.token.balanceOf(owner);
    assert.equal(90, balance);
  });

  it("cannot transfer in pause", async function () {
    const { logs } = await this.token.pause({ from: owner });
    const paused = await this.token.paused();
    assert.equal(paused, true);
    await assertRevert(
      this.token.transfer(anotherAccount, amount, { from: owner })
    );
    const balance = await this.token.balanceOf(owner);
    assert.equal(100, balance);

    // emits a Pause event
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, "Pause");
  });

  it("cannot approve/transferFrom/burnFrom in pause", async function () {
    await this.token.approve(anotherAccount, amount, { from: owner });
    const { logs } = await this.token.pause({ from: owner });
    await assertRevert(
      this.token.approve(anotherAccount, 2 * amount, { from: owner })
    );
    await assertRevert(
      this.token.transferFrom(owner, anotherAccount, amount, {
        from: anotherAccount,
      })
    );
    await assertRevert(
      this.token.burnFrom(owner, amount, { from: anotherAccount })
    );
  });

  it("should resume allowing normal process after pause is over", async function () {
    await this.token.pause({ from: owner });
    const { logs } = await this.token.unpause({ from: owner });
    await this.token.transfer(anotherAccount, amount, { from: owner });
    let balance = await this.token.balanceOf(owner);
    assert.equal(90, balance);
    await this.token.burn(amount, { from: owner });
    balance = await this.token.balanceOf(owner);
    assert.equal(80, balance);

    // emits a Unpause event
    assert.equal(logs.length, 1);
    assert.equal(logs[0].event, "Unpause");
  });

  it("cannot unpause when unpaused or pause when paused", async function () {
    await assertRevert(this.token.unpause({ from: owner }));
    await this.token.pause({ from: owner });
    await assertRevert(this.token.pause({ from: owner }));
  });
});
