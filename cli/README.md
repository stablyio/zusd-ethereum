zusd
====

ZUSD CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/zusd.svg)](https://npmjs.org/package/zusd)
[![Downloads/week](https://img.shields.io/npm/dw/zusd.svg)](https://npmjs.org/package/zusd)
[![License](https://img.shields.io/npm/l/zusd.svg)](https://github.com/stablyio/zusd-ethereum/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g zusd
$ zusd COMMAND
running command...
$ zusd (-v|--version|version)
zusd/0.0.0 darwin-x64 node-v15.4.0
$ zusd --help [COMMAND]
USAGE
  $ zusd COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`zusd burn`](#zusd-burn)
* [`zusd help [COMMAND]`](#zusd-help-command)
* [`zusd issuer:member:add`](#zusd-issuermemberadd)
* [`zusd issuer:member:list`](#zusd-issuermemberlist)
* [`zusd issuer:member:remove`](#zusd-issuermemberremove)
* [`zusd issuer:mint:list`](#zusd-issuermintlist)
* [`zusd issuer:mint:propose`](#zusd-issuermintpropose)
* [`zusd issuer:mint:reject`](#zusd-issuermintreject)
* [`zusd issuer:mint:send`](#zusd-issuermintsend)
* [`zusd supply`](#zusd-supply)
* [`zusd transfer`](#zusd-transfer)

## `zusd burn`

```
USAGE
  $ zusd burn

OPTIONS
  --amount=amount              (required) The amount of burn (e.g. 154.23)

  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.
```

_See code: [src/commands/burn.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/burn.ts)_

## `zusd help [COMMAND]`

display help for zusd

```
USAGE
  $ zusd help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `zusd issuer:member:add`

```
USAGE
  $ zusd issuer:member:add

OPTIONS
  --address=address            (required) The new issuance member to add

  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.
```

_See code: [src/commands/issuer/member/add.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/member/add.ts)_

## `zusd issuer:member:list`

```
USAGE
  $ zusd issuer:member:list

OPTIONS
  --network=ropsten|mainnet  [default: ropsten] Ethereum network to use
```

_See code: [src/commands/issuer/member/list.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/member/list.ts)_

## `zusd issuer:member:remove`

```
USAGE
  $ zusd issuer:member:remove

OPTIONS
  --address=address            (required) The issuance member to remove

  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.
```

_See code: [src/commands/issuer/member/remove.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/member/remove.ts)_

## `zusd issuer:mint:list`

```
USAGE
  $ zusd issuer:mint:list

OPTIONS
  --network=ropsten|mainnet  [default: ropsten] Ethereum network to use
```

_See code: [src/commands/issuer/mint/list.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/mint/list.ts)_

## `zusd issuer:mint:propose`

```
USAGE
  $ zusd issuer:mint:propose

OPTIONS
  --amount=amount              (required) The amount of propose (e.g. 154.23)

  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.

  --to=to                      The address to issue new tokens to, defaults to self
```

_See code: [src/commands/issuer/mint/propose.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/mint/propose.ts)_

## `zusd issuer:mint:reject`

```
USAGE
  $ zusd issuer:mint:reject

OPTIONS
  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --index=index                (required) The index of the pending mint to reject

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.
```

_See code: [src/commands/issuer/mint/reject.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/mint/reject.ts)_

## `zusd issuer:mint:send`

```
USAGE
  $ zusd issuer:mint:send

OPTIONS
  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --index=index                (required) The index of the pending mint to send

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.
```

_See code: [src/commands/issuer/mint/send.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/issuer/mint/send.ts)_

## `zusd supply`

```
USAGE
  $ zusd supply

OPTIONS
  --network=ropsten|mainnet  [default: ropsten] Ethereum network to use
```

_See code: [src/commands/supply.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/supply.ts)_

## `zusd transfer`

```
USAGE
  $ zusd transfer

OPTIONS
  --amount=amount              (required) The amount of transfer (e.g. 154.23)

  --gaspricegwei=gaspricegwei  Override the default behavior of determining gas price based on previous few blocks by
                               using a user specified gas price in Gwei. 1 Gwei is 1e9 Wei (a giga-wei).

  --hdwpath=hdwpath            Specify a custom HD wallet derivation path, or just skip the prompt for non-interactive
                               signing.

  --network=ropsten|mainnet    [default: ropsten] Ethereum network to use

  --nobroadcast                Sign but do not broadcast the transaction. Output the signed transaction to stdout.

  --nonce=nonce                Override the default behavior of getting the next nonce by using a user specified nonce.
                               Useful for retrying or queuing transactions.

  --sigmethod=privkey|ledger   (required) Signature method for signing the transaction

  --skipconfirm                Skip the confirmation and directly broadcast the transaction. Useful for non-interactive
                               use.

  --to=to                      (required) The recipient of the transferred tokens
```

_See code: [src/commands/transfer.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/transfer.ts)_
<!-- commandsstop -->
