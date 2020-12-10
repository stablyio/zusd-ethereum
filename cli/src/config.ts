import tokenABI from "./abis/ZUSD.abi.json";
import issuerABI from "./abis/ZUSDIssuer.abi.json";

const config = {
  web3: {
    endpoint: {
      ropsten: "https://ropsten.infura.io/v3/801aaababe3d4de9b1028831c1b5ea20",
      mainnet: "https://mainnet.infura.io/v3/801aaababe3d4de9b1028831c1b5ea20",
    },
  },
  token: {
    address: {
      ropsten: "0xFBfd5d812AC8305B5AA0B64947b4CBdD83a8B46E",
      mainnet: "",
    },
    abi: tokenABI,
    decimals: 6,
  },
  issuer: {
    address: {
      ropsten: "0x9Fdd760DBF679eF204C4DBEB24dF2f721f520165",
      mainnet: "",
    },
    abi: issuerABI,
  },
};

export default config;
