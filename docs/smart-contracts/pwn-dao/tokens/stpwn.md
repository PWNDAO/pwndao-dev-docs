# stPWN

## 1. Summary

The Staked PWN (stPWN) token is a representation of a stake in the PWN DAO. The stPWN token is mintable and burnable by the `VoteEscrowedPWN` contract.

## 2. Important links

* [**Source code**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/StakedPWN.sol)
* [**ABI**](/assets/StakedPWN.json)

## 3. Contract details

* _StakedPWN.sol_ is written in Solidity version 0.8.25

### Features

* Mint and Burn tokens (stakes)
* Transfers are disabled by default, but can be enabled by the PWN DAO

### Inherited contracts, implemented Interfaces and ERCs

* [Ownable2Step](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol)
* [ERC721](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol)

### Functions

<details>

<summary><code>enableTransfers</code></summary>

#### Overview

Function to enable permissionless stPWN token transfers. Transfers cannot be disabled once they have been enabled.&#x20;

This function doesn't take any arguments.

#### Implementation

```solidity
function enableTransfers() external onlyOwner {
    if (transfersEnabled) {
        revert Error.TransfersAlreadyEnabled();
    }
    transfersEnabled = true;
}
```

</details>

<details>

<summary><code>setTransferAllowlist</code></summary>

#### Overview

Function to enable token transfers for an address before transferes are enabled for all holders.

This function takes two arguments:

* `address`**`addr`**
* `bool`**`isAllowed`**

#### Implementation

```solidity
function setTransferAllowlist(address addr, bool isAllowed) external onlyOwner {
    transferAllowlist[addr] = isAllowed;
}
```

</details>

<details>

<summary><code>mint</code></summary>

#### Overview

Function to mint new stPWN tokens. Only supply manager ([vePWN](vepwn/)) can call this function.&#x20;

This function takes two arguments:

* `address`**`to`**
* `uint256`**`tokenId`**

#### Implementation

```solidity
function mint(address to, uint256 tokenId) external onlySupplyManager {
    _mint(to, tokenId);
}
```

</details>

<details>

<summary><code>burn</code></summary>

#### Overview

Function to burn stPWN tokens. Only supply manager ([vePWN](vepwn/)) can call this function.

This function takes one argument:

* `uint256`**`tokenId`**

#### Implementation

```solidity
function burn(uint256 tokenId) external onlySupplyManager {
    _burn(tokenId);
}
```

</details>
