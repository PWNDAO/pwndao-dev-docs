# PWN Deployer

## 1. Summary

PWNDeployer.sol contract manages deployments of the PWN Protocol contracts. It uses the Open-Zeppelin [Create2](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Create2.sol) library to deploy contracts with the same addresses on all chains.&#x20;

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/pwn_deployer/blob/main/src/PWNDeployer.sol)

## 3. Contract details

* _PWNDeployer.sol_ is written in Solidity version 0.8.16

### Features

* Deploy new contracts
* For ownable contracts, the deployer can transfer ownership to a supplied address
* Provides a function to compute an address of a contract is deployed

### Inherited contracts, implemented Interfaces and ERCs

* [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol)

### Functions

<details>

<summary><code>deploy</code></summary>

#### Overview

This function deploys a new contract with given salt.

This function takes two arguments supplied by the owner:

* `bytes32`**`salt`** - Salt to use in the CREATE2 call
* `bytes memory`**`bytecode`** - Encoded code for contract creation with included constructor arguments

#### Implementation

```solidity
function deploy(bytes32 salt, bytes memory bytecode) external onlyOwner returns (address) {
    return Create2.deploy(0, salt, bytecode);
}
```

</details>

<details>

<summary><code>deployAndTransferOwnership</code></summary>

#### Overview

This function deploys a new contract with given salt and transfers ownership of the deployed contract to the supplied address. It is expected for the deployed contract to implement [Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol).

This function takes three arguments supplied by the owner:

* `bytes32`**`salt`** - Salt to use in the CREATE2 call
* `address`**`owner`** - Address to transfer the ownership to
* `bytes memory`**`bytecode`** - Encoded code for contract creation with included constructor arguments

#### Implementation

```solidity
function deployAndTransferOwnership(bytes32 salt, address owner, bytes memory bytecode) external onlyOwner returns (address deployedContract) {
    deployedContract = Create2.deploy(0, salt, bytecode);
    Ownable(deployedContract).transferOwnership(owner);
}
```

</details>

### View Functions

<details>

<summary><code>computeAddress</code></summary>

#### Overview

Computes the address of a contract that would be deployed with a given salt.

This function takes two arguments supplied by the caller:

* `bytes32`**`salt`** - Salt that would be used in the CREATE2 call
* `bytes32`**`bytecodeHash`** - Hash of the encoded code for contract creation with included constructor arguments

#### Implementation

```solidity
function computeAddress(bytes32 salt, bytes32 bytecodeHash) external view returns (address) {
    return Create2.computeAddress(salt, bytecodeHash);
}
```

</details>
