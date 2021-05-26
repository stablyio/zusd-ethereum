import Command, { flags } from "@oclif/command";
import Web3 from "web3";
import config from "./config";
import cli from "cli-ux";
import AppEth from "@ledgerhq/hw-app-eth";
import Transport from "@ledgerhq/hw-transport-node-hid";
import * as inquirer from "inquirer";
import { Transaction } from "ethereumjs-tx";
import BN from "bn.js";

const YES_VALUES = new Set(["Y", "YES"]);
// Popular derivation paths for hierarchical deterministic wallet generation
// m / purpose' / coin_type' / account' / change / address_index
// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
const ETH_HD_WALLET_DERIV_PATHS = [
  "m/44'/60'/0'/0/0", // Official Ethereum BIP 44 format
  "m/44'/60'/0'/0", // MEW Ethereum
  "m/44'/60'/0'", // Ledger Ethereum
  "m/44'/60'", // Some legacy format Ethereum
];

abstract class EthCommand extends Command {
  static flags = {
    network: flags.string({
      description: "Ethereum network to use",
      default: "ropsten",
      options: ["ropsten", "mainnet"],
    }),
  };

  flag: any;

  cliconfig: any;

  web3Mainnet: Web3 | undefined;

  web3Ropsten: Web3 | undefined;

  tokenMainnet: any;

  tokenRopsten: any;

  issuerMainnet: any;

  issuerRopsten: any;

  web3(): Web3 {
    const network = this.flag.network;
    if (network === "mainnet") {
      return this.web3Mainnet as Web3;
    }
    return this.web3Ropsten as Web3;
  }

  token() {
    const network = this.flag.network;
    if (network === "mainnet") {
      return this.tokenMainnet;
    }
    return this.tokenRopsten;
  }

  issuer() {
    const network = this.flag.network;
    if (network === "mainnet") {
      return this.issuerMainnet;
    }
    return this.issuerRopsten;
  }

  networkChainId() {
    const network = this.flag.network;
    if (network === "mainnet") {
      return 1;
    }
    if (network === "ropsten") {
      return 3;
    }
    this.error(`Unsupported network for fetching chain ID ${network}`);
  }

  // David's note: I really don't like how web3 uses BN, we should move to ethersjs in the next rewrite
  uint256ToDecimals(int: any): number {
    return int / Math.pow(10, config.token.decimals);
  }

  decimalsToUint256(dec: number): BN {
    return this.web3().utils.toBN(dec * Math.pow(10, config.token.decimals));
  }

  eventLogAddressToAddress(unclean: string): string {
    return "0x" + unclean.substring(26);
  }

  parsePositive(i: number | string): number {
    const num = Number(i);
    if (Number.isNaN(num)) {
      this.error(`Expected ${i} to be a number`);
    }
    if (num < 0) {
      this.error(`Expected a positive number but got ${num}`);
    }
    if (num > Number.MAX_SAFE_INTEGER) {
      this.error(
        `Value ${num} exceeds maximum safe input of ${Number.MAX_SAFE_INTEGER}`
      );
    }
    return num;
  }

  parsePositiveInteger(i: number | string): number {
    const num = this.parsePositive(i);
    if (!Number.isSafeInteger(num)) {
      this.error(`Expected an integer but got ${i}`);
    }
    return num;
  }

  async init() {
    // do some initialization
    const { flags } = this.parse(this.constructor as typeof Command);
    this.flag = flags;
    this.web3Mainnet = new Web3(config.web3.endpoint.mainnet);
    this.web3Ropsten = new Web3(config.web3.endpoint.ropsten);

    this.tokenMainnet = new this.web3Mainnet.eth.Contract(
      config.token.abi as any,
      config.token.address.mainnet
    );
    this.tokenRopsten = new this.web3Ropsten.eth.Contract(
      config.token.abi as any,
      config.token.address.ropsten
    );
    this.issuerMainnet = new this.web3Mainnet.eth.Contract(
      config.issuer.abi as any,
      config.issuer.address.mainnet
    );
    this.issuerRopsten = new this.web3Ropsten.eth.Contract(
      config.issuer.abi as any,
      config.issuer.address.ropsten
    );
  }
}

abstract class EthSigningCommand extends EthCommand {
  static flags = {
    ...EthCommand.flags,
    sigmethod: flags.string({
      description: "Signature method for signing the transaction",
      options: ["privkey", "ledger"],
      required: true,
    }),
    skipconfirm: flags.boolean({
      description:
        "Skip the confirmation and directly broadcast the transaction. Useful for non-interactive use.",
    }),
    nobroadcast: flags.boolean({
      description:
        "Sign but do not broadcast the transaction. Output the signed transaction to stdout.",
    }),
    nonce: flags.string({
      description:
        "Override the default behavior of getting the next nonce by using a user specified nonce. Useful for retrying or queuing transactions.",
    }),
    gaspricegwei: flags.string({
      description:
        "Override the default behavior of determining gas price based on previous few blocks by using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).",
    }),
    privkey: flags.string({
      description:
        "[DANGER] The private key in plaintext used for signing the transaction. If provided no longer prompts the user. Useful for non-interactive use.",
      hidden: true,
      dependsOn: ["sigmethod"],
      required: false,
    }),
    hdwpath: flags.string({
      description:
        "Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive signing.",
      dependsOn: ["sigmethod"],
      required: false,
    }),
  };

  privkey: string | undefined;

  ledgerApp: any;

  ledger: {
    chosenAddress: string | undefined;
    chosenHDWPath: string | undefined;
  } = { chosenAddress: undefined, chosenHDWPath: undefined };

  private async getPrivKey() {
    if (this.privkey) {
      return this.privkey as string;
    }
    if (this.flag.privkey) {
      this.privkey = this.flag.privkey;
    } else {
      this.privkey = await cli.prompt("Private key to sign with", {
        type: "mask",
      });
    }
    return this.privkey as string;
  }

  async getSignerAddress() {
    if (this.flag.sigmethod === "privkey") {
      return this.web3().eth.accounts.privateKeyToAccount(
        (await this.getPrivKey()) as string
      ).address;
    }
    if (this.flag.sigmethod === "ledger") {
      return (await this.getAddressLedger()) as string;
    }
    this.error(`Signing method ${this.flag.sigmethod} not supported`);
  }

  private async getLedgerApp() {
    if (this.ledgerApp) {
      return this.ledgerApp;
    }
    const transport = await Transport.create();
    const app = new AppEth(transport);
    this.ledgerApp = app;
    return this.ledgerApp;
  }

  private async getAddressLedger() {
    if (this.ledger.chosenAddress) {
      return this.ledger.chosenAddress;
    }
    const devices = await Transport.list();
    if (devices.length === 0) {
      this.error("Could not detect Ledger device");
    }
    try {
      const ethApp = await this.getLedgerApp();
      if (this.flag.hdwpath) {
        const addr = (await ethApp.getAddress(this.flag.hdwpath)).address;
        this.ledger = {
          chosenHDWPath: this.flag.hdwpath,
          chosenAddress: addr,
        };
        this.log(
          `Using HD wallet derivation path ${this.ledger.chosenHDWPath} with address ${this.ledger.chosenAddress}`
        );
        return this.ledger.chosenAddress;
      }
      const addressChoices: Array<string> = [];
      const addressToPath: Map<string, string> = new Map();
      for (const hd_wallet_path of ETH_HD_WALLET_DERIV_PATHS) {
        const addr = (await ethApp.getAddress(hd_wallet_path)).address; // eslint-disable-line no-await-in-loop
        addressChoices.push(addr);
        addressToPath.set(addr, hd_wallet_path);
      }
      const addrChoice = await inquirer.prompt([
        {
          name: "addr",
          message: "Select an address to use",
          type: "list",
          choices: addressChoices,
        },
      ]);
      const addressValue = addrChoice.addr;
      const chosenDerivPath = addressToPath.get(addressValue);
      this.ledger = {
        chosenHDWPath: chosenDerivPath,
        chosenAddress: addressValue,
      };
      return this.ledger.chosenAddress;
    } catch (error) {
      this.error(`Cannot fetch ledger address: ${error}`);
    }
  }

  private async signTransactionLedger(tx: any) {
    const app = await this.getLedgerApp();
    const serializableTx = new Transaction(tx);

    // Necessary for ledger to sign properly, otherwise calculated address will be wrong
    serializableTx.raw[6] = Buffer.from([this.networkChainId()]); // v
    serializableTx.raw[7] = Buffer.from([]); // r
    serializableTx.raw[8] = Buffer.from([]); // s
    const derivPath = this.ledger.chosenHDWPath as string;
    this.log("Confirm and sign the transaction on your Ledger device");
    let result;
    try {
      result = await app.signTransaction(
        derivPath,
        serializableTx.serialize().toString("hex")
      );
    } catch (error) {
      this.error(`Could not sign transaction on Ledger: ${error}`);
    }
    return result;
  }

  async signAndSend(contract: any, func: any) {
    const estimatedGas = await this.web3().eth.estimateGas({
      from: await this.getSignerAddress(),
      to: contract.options.address,
      data: func.encodeABI(),
    });
    const userOrNextNonce = this.flag.nonce
      ? Number(this.flag.nonce)
      : await this.web3().eth.getTransactionCount(
          await this.getSignerAddress()
        );
    const userOrEstimateGasPrice = this.flag.gaspricegwei
      ? Number(this.flag.gaspricegwei) * 1e9
      : await this.web3().eth.getGasPrice();
    const tx = {
      nonce: userOrNextNonce,
      from: await this.getSignerAddress(),
      to: contract.options.address,
      gas: estimatedGas,
      gasPrice: this.web3().utils.toHex(userOrEstimateGasPrice),
      value: 0,
      data: func.encodeABI(),
    };
    let signedTx;
    if (this.flag.sigmethod === "privkey") {
      signedTx = new Transaction(tx, {
        chain: this.flag.network,
      });
      signedTx.sign(Buffer.from(await this.getPrivKey(), "hex"));
    } else if (this.flag.sigmethod === "ledger") {
      await this.getAddressLedger();
      const sigs = await this.signTransactionLedger(tx);
      signedTx = new Transaction(
        {
          ...tx,
          v: "0x" + sigs.v,
          r: "0x" + sigs.r,
          s: "0x" + sigs.s,
        },
        {
          chain: this.flag.network,
        }
      );
    }

    const rawTx = "0x" + (signedTx as Transaction).serialize().toString("hex");
    const recoveredSender = this.web3().eth.accounts.recoverTransaction(rawTx);
    if (recoveredSender !== (await this.getSignerAddress())) {
      this.error(
        `Something went wrong, the signer address ${await this.getSignerAddress()} does not match the calculated signature address ${recoveredSender}`
      );
    }

    if (this.flag.nobroadcast) {
      this.log(
        `Not broadcasting the transaction because --nobroadcast=${this.flag.nobroadcast}. This transaction will not be added to the blockchain unless you broadcast it.`
      );
      this.log(`Signed transaction:\n${rawTx}`);
      this.exit();
    }

    if (!this.flag.skipconfirm) {
      this.log(
        `You are about to call ${func._method.name}(${func.arguments}) on ${contract.options.address}`
      );
      const confirmBroadcast = await cli.prompt("Confirm (Y/N)");
      if (!YES_VALUES.has(confirmBroadcast.toUpperCase())) {
        this.log("Aborting operation");
        this.exit();
      }
    }

    cli.action.start("Broadcasting transaction");
    try {
      const sentTx = await this.web3().eth.sendSignedTransaction(
        "0x" + (signedTx as Transaction).serialize().toString("hex")
      );
      cli.action.stop("acknowledged");
      this.log(`Transaction hash: ${(sentTx as any).transactionHash}`);
      return sentTx;
    } catch (error) {
      this.error(`Broadcasting failed: ${error}`);
    }
  }

  async isIssuerOwner() {
    const owner = await this.issuer().methods.owner().call();
    if ((await this.getSignerAddress()) !== owner) {
      return false;
    }
    return true;
  }

  async isIssuerMember() {
    const signer = await this.getSignerAddress();
    return this.issuer().methods.isMember(signer).call();
  }

  async init() {
    await super.init();
    if (this.flag.nonce)
      this.flag.nonce = this.parsePositiveInteger(this.flag.nonce);
    if (this.flag.gaspricegwei)
      this.flag.gaspricegwei = this.parsePositive(this.flag.gaspricegwei);
    if (this.flag.amount)
      this.flag.amount = this.parsePositive(this.flag.amount);
  }
}

export { EthCommand, EthSigningCommand };
