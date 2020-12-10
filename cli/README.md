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
zusd/0.0.0 darwin-x64 node-v12.16.1
$ zusd --help [COMMAND]
USAGE
  $ zusd COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`zusd hello [FILE]`](#zusd-hello-file)
* [`zusd help [COMMAND]`](#zusd-help-command)

## `zusd hello [FILE]`

describe the command here

```
USAGE
  $ zusd hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ zusd hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/stablyio/zusd-ethereum/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
