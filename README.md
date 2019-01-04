# Secret Store contracts and toolkit
Collection of Secret Store permissioning contracts, service contracts and related tooling.

**Purpose:** To have a central collection of aforementioned contracts, and have a command line tool that makes deployment/checking of these contracts easy.

**Disclaimer:** The contracts are not audited yet, thus they are not recommended to be relied on in a production environment.

If you wonder how to set up a Secret Store cluster, check out the official [config guide](https://wiki.parity.io/Secret-Store-Configuration) and peek into [our other repo](https://github.com/energywebfoundation/local-tobalaba-ss-cluster).

## Maintainers

**Primary**: Adam Nagy (@ngyam)

## Quickstart and examples

#### If you want the command line tool to be available globally:
```bash
npm install -g secretstore-contracts
```
Then:
```bash
secretstore-contracts <command> [options]
```

#### If you just want to use it somewhere locally:
```bash
git clone https://github.com/energywebfoundation/secretstore-contracts.git
cd secretstore-contracts
npm install
```
Then:
```bash
node index.js <command> [options]
```
Or
```bash
npm start <command> [options]
```

#### Examples
```bash
# Deploys a fire and forget permissioning contract and returns its address
secretstore-contracts deploypermission --contract FireAndForget --docid 0xfefefefe --accounts 0x3144de21da6de18061f818836fa3db8f3d6b6989
#>> PermissionerFireAndForget deployed at: 0x05EF6cF073Ca90F9CC936F049934B27F75D7ea89

secretstore-contracts checkpermissions --address 0x05EF6cF073Ca90F9CC936F049934B27F75D7ea89 --docid 0xfefefefe --accounts 0x3144de21da6de18061f818836fa3db8f3d6b6989
#>> 0x3144de21da6de18061f818836fa3db8f3d6b6989: true
```

To show help and available commands/flags just type

```bash
secretstore-contracts --help
# or
secretstore-contracts <command> --help
```


#### Contracts
They can be found in the [contracts](contracts) folder.

- **Permissioning contract interface**
- **Simple permissioning contracts**
  - **Static**: contract with burned-in addresses and doc-key
  - **FireAndForget**: one shot contract to only permisison one doc key with accounts. Can be set only in the constructor.
  - **NoDoc**: contract that allows access to all the given addresses irrespective of the document key
  - **Dynamic**: registry type contract to add an arbitrary number of doc keys and accounts

- **Nodes-set contract with migration support**: Taken from [here](https://github.com/parity-contracts/secretstore-key-server-set) and described [here](https://wiki.parity.io/Secret-Store-Configuration#node-set-contracts).

- **Registry**: a proper permissining registry contract implementation with ownership/admin support

- **Relay**: a permissioning relay contract for upgradeability
  
- ERC165Query and interface. Contract that can query which interface other contracts implement according to [ERC165](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md).

## Contributing

Please read [contributing](./CONTRIBUTING.md) and our [code of conduct](./CODE_OF_CONDUCT.md) for details.

## Getting started (as a dev)

### Prerequisites

 - node, npm, truffle

### Setting up

```bash
git clone https://github.com/energywebfoundation/secretstore-contracts.git
cd secretstore-contracts
npm install -D
```

## Running the tests

**ACHTUNG**: make sure to start an Ethereum node first.

Then simply:

```bash
npm run test
```

## Compiling contracts
If you want to compile the contracts, use Truffle
```bash
truffle compile
```

## Deployment and migration

To deploy simple contracts, use the deployer cl tool. The relay/registry contract is not supported by the tool yet. To deploy those, just simply run

```bash
truffle migrate
```

## Versioning

We use [SemVer](http://semver.org/) for versioning. Version number is bumped with `bumpversion` tool.

## License

This project is licensed under GPLv3 - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

* Special thanks to Parity