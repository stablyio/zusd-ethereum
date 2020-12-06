const ZUSDIssuer = artifacts.require("ZUSDIssuer.sol");
const ZUSDContract = artifacts.require("ZUSDImplementation.sol");

const assertRevert = require("./helpers/assertRevert");
const mineBlocks = require("./helpers/mineBlocks");
const { deployProxy } = require("@openzeppelin/truffle-upgrades");

// Test that the Issuer can mint tokens.
contract("Issuer mint", function ([owner, member1, member2, notmember]) {
  const mintWaitBlocks = 3;

  beforeEach(async function () {
    // Assumes the first address passed is the caller, in this case `owner`
    const proxiedZUSD = await deployProxy(ZUSDContract);
    this.token = proxiedZUSD;

    const issuer = await ZUSDIssuer.new(proxiedZUSD.address, mintWaitBlocks, {
      from: owner,
    });
    this.issuer = issuer;
    await this.issuer.addMember(member1, { from: owner });
    await this.issuer.addMember(member2, { from: owner });

    await this.token.setIssuer(issuer.address, { from: owner });
  });

  describe("when setting the mint wait blocks", function () {
    it("allows owner to set the new threshold", async function () {
      await this.issuer.setMintWaitBlocks(100, { from: owner });
      const mintWaitBlocks = await this.issuer.mintWaitBlocks();

      assert.equal(mintWaitBlocks, 100);
    });

    it("rejects member from setting the new threshold", async function () {
      await assertRevert(this.issuer.setMintWaitBlocks(100, { from: member1 }));
    });
  });

  describe("when the caller is a member", function () {
    it("proposes new mint", async function () {
      const { logs } = await this.issuer.proposeMint(notmember, 100, {
        from: member1,
      });

      // Check events
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, "MintProposed");
      assert.equal(logs[0].args.proposer, member1);
      assert.equal(logs[0].args.pendingMintsIndex, 0);

      const pendingMintsIndex = await this.issuer.pendingMintsIndex();
      assert.equal(pendingMintsIndex, 1);

      const pendingMint = await this.issuer.pendingMints(0);
      let latestBlock = await web3.eth.getBlock("latest");
      assert.equal(pendingMint.recipient, notmember);
      assert.equal(pendingMint.value, 100);
      assert.equal(
        pendingMint.canMintAtBlock,
        latestBlock.number + mintWaitBlocks
      );
    });

    it("cannot send pending mint before enough blocks have passed", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      await mineBlocks(1);
      await assertRevert(this.issuer.sendMint(0, { from: member1 }));
    });

    it("sends pending mint after enough blocks have passed", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      await mineBlocks(3);
      const startingSupply = await this.token.totalSupply();
      const { logs } = await this.issuer.sendMint(0, { from: member1 });
      const endingSupply = await this.token.totalSupply();

      // Check events
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, "MintSent");
      assert.equal(logs[0].args.sender, member1);
      assert.equal(logs[0].args.pendingMintsIndex, 0);

      assert.equal(startingSupply, 0);
      assert.equal(endingSupply, 100);
      const pendingMint = await this.issuer.pendingMints(0);
      assert.equal(pendingMint.recipient, 0);
      assert.equal(pendingMint.value, 0);
      assert.equal(pendingMint.canMintAtBlock, 0);
    });

    it("cannot send same pending mint twice", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      await mineBlocks(3);
      await this.issuer.sendMint(0, { from: member1 });
      await assertRevert(this.issuer.sendMint(0, { from: member1 }));
    });

    it("can send pending mints out of order", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      await this.issuer.proposeMint(notmember, 200, { from: member2 });
      await this.issuer.proposeMint(notmember, 300, { from: member1 });
      await mineBlocks(3);
      await this.issuer.sendMint(2, { from: member2 });
      await this.issuer.sendMint(0, { from: member1 });
      await this.issuer.sendMint(1, { from: member1 });

      const endingSupply = await this.token.totalSupply();
      assert.equal(endingSupply, 600);
    });

    it("can reject pending mint from different member", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      const { logs } = await this.issuer.rejectMint(0, { from: member2 });

      // Check events
      assert.equal(logs.length, 1);
      assert.equal(logs[0].event, "MintRejected");
      assert.equal(logs[0].args.sender, member2);
      assert.equal(logs[0].args.pendingMintsIndex, 0);

      const pendingMint = await this.issuer.pendingMints(0);
      assert.equal(pendingMint.recipient, 0);
      assert.equal(pendingMint.value, 0);
      assert.equal(pendingMint.canMintAtBlock, 0);
    });

    it("cannot send rejected pending mint", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      const { logs } = await this.issuer.rejectMint(0, { from: member2 });
      await assertRevert(this.issuer.sendMint(0, { from: member1 }));
    });
  });

  describe("when the caller is not a member", function () {
    it("cannot propose new mint", async function () {
      await assertRevert(
        this.issuer.proposeMint(notmember, 100, { from: notmember })
      );
    });

    it("cannot cannot send pending mint", async function () {
      await this.issuer.proposeMint(notmember, 100, { from: member1 });
      await mineBlocks(3);
      await assertRevert(this.issuer.sendMint(0, { from: notmember }));
    });
  });
});
