const ZUSD = artifacts.require("ZUSDImplementation");
const Proxy = artifacts.require("ZUSDProxy");
const Issuer = artifacts.require("ZUSDIssuer");

// Note: Proxy owner must be DIFFERENT than any other owner
const PROXY_OWNER = "0x8fCcABf4106D50F98636184eB2dC803FF1a5A13D"; // Ropsten placeholders
const TOKEN_OWNER = "0x3C0D0CD54775b279729f2B6069bba35E180f5d95"; // Ropsten placeholders
const ISSUER_OWNER = "0x3C0D0CD54775b279729f2B6069bba35E180f5d95"; // Ropsten placeholders
const ISSUANCE_WAIT_BLOCKS = 4;

module.exports = async function (deployer) {
  await deployer;

  await deployer.deploy(ZUSD);
  const proxy = await deployer.deploy(Proxy, ZUSD.address, PROXY_OWNER);
  const proxiedZUSD = await ZUSD.at(proxy.address);
  await proxiedZUSD.initialize();
  await proxiedZUSD.proposeOwner(TOKEN_OWNER);
  const issuer = await deployer.deploy(
    Issuer,
    proxiedZUSD.address,
    ISSUANCE_WAIT_BLOCKS
  );
  await issuer.proposeOwner(ISSUER_OWNER);
  await proxiedZUSD.setIssuer(issuer.address);
};
