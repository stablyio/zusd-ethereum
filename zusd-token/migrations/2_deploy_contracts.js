const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");

const ZUSD = artifacts.require("ZUSDImplementation");
const Issuer = artifacts.require("ZUSDIssuer");

// Note: Proxy owner must be DIFFERENT than any other owner
const PROXY_OWNER = "0x8fCcABf4106D50F98636184eB2dC803FF1a5A13D"; // Ropsten placeholders
const TOKEN_OWNER = "0x3C0D0CD54775b279729f2B6069bba35E180f5d95"; // Ropsten placeholders
const ISSUER_OWNER = "0x3C0D0CD54775b279729f2B6069bba35E180f5d95"; // Ropsten placeholders
const ISSUANCE_WAIT_BLOCKS = 4;

module.exports = async function(deployer) {
  const proxiedZUSD = await deployProxy(ZUSD, { deployer });
  await proxiedZUSD.proposeOwner(TOKEN_OWNER);
  const issuer = await deployer.deploy(
    Issuer,
    proxiedZUSD.address,
    ISSUANCE_WAIT_BLOCKS
  );
  await issuer.proposeOwner(ISSUER_OWNER);
  await proxiedZUSD.setIssuer(issuer.address);
  await admin.transferProxyAdminOwnership(PROXY_OWNER);
};
