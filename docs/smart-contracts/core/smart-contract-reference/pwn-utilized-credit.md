# PWN Utilized Credit

## 1. Summary

The PWNUtilizedCredit.sol contract is designed to manage and update credit across different proposal types. The contract ensures that credit usage does not exceed a predefined limit for a credit asset and restricts access only to selected proposal types.

## 2. Important links

* [**Source code**](https://github.com/PWNDAO/pwn_contracts/blob/master/src/utilized-credit/PWNUtilizedCredit.sol)
* [**ABI**](/assets/PWNUtilizedCredit.json)

## 3. Contract details

* _PWNUtilizedCredit.sol_ is written in Solidity version 0.8.16

### Features

* Credit utilization across proposals
* Limit credit usage per proposal type

### Functions

<details>

<summary><code>utilizeCredit</code></summary>

#### Overview

This function updates the utilized credit for an owner for a selected credit asset.

This function takes four arguments:

* `address`**`owner`** - Credit owner address
* `bytes32`**`id`** - Credit identifier
* `uint256`**`amount`** - Credit amount
* `uint256`**`limit`** - Credit limit

#### Implementation

```solidity
function utilizeCredit(address owner, bytes32 id, uint256 amount, uint256 limit) external onlyWithHubTag {
    uint256 extendedAmount = utilizedCredit[owner][id] + amount;
    if (extendedAmount > limit) {
        revert AvailableCreditLimitExceeded({ owner: owner, id: id, utilized: extendedAmount, limit: limit });
    }

    utilizedCredit[owner][id] = extendedAmount;
}
```

</details>

### Errors

The PWN Utilized Credit contract defines one error.

```solidity
error AvailableCreditLimitExceeded(address owner, bytes32 id, uint256 utilized, uint256 limit);
```

<details>

<summary><code>AvailableCreditLimitExceeded</code></summary>

A AvailableCreditLimitExceeded error is thrown when&#x20;

This error has four parameters:

* `address`**`owner`**
* `bytes32`**`id`**
* `uint256`**`utilzed`**
* `uint256`**`limit`**

</details>
