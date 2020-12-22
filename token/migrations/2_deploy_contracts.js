const { deployProxy, admin } = require("@openzeppelin/truffle-upgrades");

const ZUSD = artifacts.require("ZUSDImplementation");
const Issuer = artifacts.require("ZUSDIssuer");

const OWNER_MULTISIG_ADDRESS = "0x20CdBBD54931BA79A79ab9BA23634134629Ac9C9"; // Just a test address

const ISSUANCE_WAIT_BLOCKS = 4;

module.exports = async function(deployer) {
  const proxiedZUSD = await deployProxy(ZUSD, { deployer });
  await proxiedZUSD.proposeOwner(OWNER_MULTISIG_ADDRESS);
  const issuer = await deployer.deploy(
    Issuer,
    proxiedZUSD.address,
    ISSUANCE_WAIT_BLOCKS
  );
  await issuer.proposeOwner(OWNER_MULTISIG_ADDRESS);
  await proxiedZUSD.setIssuer(issuer.address);
  await admin.transferProxyAdminOwnership(OWNER_MULTISIG_ADDRESS);
};
