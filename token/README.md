# ZUSD

**Requirements**

# Purpose

This document outlines the business requirements of the ZUSD smart contracts.

# Business Overview

ZUSD is a USD backed stablecoin. It will be jointly managed by 3 parties, Zytara (the Admin), Prime Trust (the Trust), and the technology provider (Stably). Each party will help in the administration of the token as well provide checks and balances to ensure proper collateralization of ZUSD at all times.

# Functionality

There are 4 components of the ZUSD system. There is the ERC20 token (the Token Implementation), a proxy contract for upgradeability (the Proxy), an issuer contract for controlling new token issuance (the Issuer), and a smart contract multisig wallet that will act as the administrator for the system (the Owner).

## Owner

The Owner which acts as the administrator for the other smart contracts will be an existing battle-tested smart contract multisig wallet (such as the Gnosis multisig or Gnosis safe).

The Owner will have at least 3 parties, the Admin, the Trust, and Stably. Any transactions taken by the owner will require at least 2 of 3 approval. The threshold may be increased if more participants are added.

## Proxy

We use the proxy pattern to provide upgradeability for ZUSD. Our implementation uses OpenZeppelin’s tooling and implementation. See ["The OpenZeppelin site"](https://docs.openzeppelin.com/openzeppelin/) for more information.

## Token Implementation

ZUSD implements the ERC20 standard via custom token logic that enables the following functionality:

- ERC20
- Ownable
- Issuable
- Burnable
- Pausable
- Regulatory Compliance

We use SafeMath and other supplementary smart contracts from the OpenZeppelin's npm packages (see package.json for specific versions).

### ERC20

ZUSD implements the [ERC-20 token standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md).

### Ownable

ZUSD can specify an Owner that can:

- Change the Owner to a different Owner upon acceptance from new Owner
- Pause the transfer of ZUSD for all holders
- Set the Issuer account for ZUSD
- Set the Compliance account for ZUSD

### Issuable

ZUSD token supply can be increased only by the designated Issuer account and no one else.

### Burnable

ZUSD tokens can be burned (destroyed) by anyone.

### Pausable

ZUSD token transfer can be paused globally by the Owner.

### Regulatory Compliance

ZUSD tokens can be frozen within an account and set to zero. All compliance activities can only be done by the Compliance account.

## Issuer

ZUSD issuance is controlled by another smart contract, the Issuer. The Issuer exists to create a check and balance on ZUSD token issuance by giving multiple members (Members) the ability to cancel a pending token creation event (a Mint). The administration of the Issuer is done by the Owner, which may or may not be the same Owner that administers the Token Implementation or Proxy.

The Issuer has the following properties:

- Ownable
- Membership
- Implementation Change
- Mint Process

### Ownable

Note that this is the same Ownable feature as the Token Implementation.
Issuer can specify an Owner that can:

- Change the Owner to a different Owner upon acceptance from new Owner
- Set the number of blocks required before sending a pending Mint
- Set the Implementation Token that the Issuer points to
- Add Members that control Minting
- Remove Members

### Membership

Issuer does Minting through the action of the Members. Members can only be adjusted by the Owner and are in charge of the Minting process. Members can initiate any Mint and cancel any non-sent Mint.

### Implementation Change

The Implementation Token that the Issuer points to can be changed by the Owner. This way we can invalidate an old Issuer by pointing it to the zero address or change which token an Issuer is responsible for.

### Mint Process

This is the main responsibility of the Issuer, to control the token creation (Mint) process. The Mint process comprises of 3 steps:

- Propose a Mint
- Wait a number of blocks that was set by the Owner
- Send the Mint to ZUSD

Any proposed (or Pending) Mint can be canceled by any Member, including the Member that proposed it. Similarly, any Pending Mint that has passed a sufficient number of blocks can be used to call ZUSD to issue more tokens (Send) at which point the Pending Mint can no longer be invoked to increase the token supply.
