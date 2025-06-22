# Operators context

## 1. Summary

Contract responsible for tracking all approved addresses per wallet address per asset contract.

## 2. Contract details

* _OperatorsContext.sol_ is written in Solidity version 0.8.15

### Features

* Tracks all operators (approved addresses) to make sure an asset is not approved to any other smart contract before its tokenisation

### Functions

<details>

<summary><code>_addOperator</code></summary>

#### Overview

Adds an operator of an asset collection to a PWN Safe. The caller can be only an [ATR Guard](./).&#x20;

This function takes three arguments supplied by the ATR Guard:

* `address`**`safe`** - Address of a safe that is approving an operator
* `address`**`asset`** - Address of an asset collection being approved
* `address`**`operator`** - Address of an operator that is being approved

#### Implementation

```solidity
function _addOperator(address safe, address asset, address operator) internal {
	operators[safe][asset].add(operator);
}
```

</details>

<details>

<summary><code>_removeOperator</code></summary>

#### Overview

Removes an operator from the operators set. The caller can be only an [ATR Guard](./).&#x20;

This function takes three arguments supplied by the ATR Guard:

* `address`**`safe`** - Address of a safe that has an approved operator
* `address`**`asset`** - Address of an asset collection that has been approved
* `address`**`operator`** - Address of an operator that is being removed

#### Implementation

```solidity
function _removeOperator(address safe, address asset, address operator) internal {
	operators[safe][asset].remove(operator);
}
```

</details>

<details>

<summary><code>hasOperatorFor</code></summary>

#### Overview

Check function to determine if a PWN Safe has approved operators for a specific asset collection. This function returns a boolean. It is expected that this function is called by the ATR Guard [`hasOperatorFor`](./README.md#hasoperatorfor) function which performs additional operations to support the [ERC-777](https://eips.ethereum.org/EIPS/eip-777) standard.&#x20;

This function takes two arguments supplied by the caller:

* `address`**`safe`** - Address of the PWN Safe to check
* `address`**`asset`** - Address of the asset collection to check

#### Implementation

```solidity
function hasOperatorFor(address safe, address asset) public virtual view returns (bool) {
	return operators[safe][asset].length() > 0;
}
```

</details>

<details>

<summary><code>operatorsFor</code></summary>

#### Overview

Returns a list of operators for a given PWN Safe and asset.

This function takes two arguments supplied by the caller:

* `address`**`safe`** - Address of the PWN Safe to check
* `address`**`asset`** - Address of the asset collection to check

#### Implementation

```solidity
function operatorsFor(address safe, address asset) external view returns (address[] memory) {
	return operators[safe][asset].values();
}
```

</details>

<details>

<summary><code>resolveInvalidAllowance</code></summary>

#### Overview

In case there's an invalid operator on an [ERC-20](https://eips.ethereum.org/EIPS/eip-20) token, a user can call this function to resolve the problem. The function checks that there are no tokens approved towards the supplied operator and removes the operator from the operator set.&#x20;

**What's an invalid operator, and how can this happen?** Let's say a PWN Safe approves one WETH towards Alice. Alice then transfers the one WETH to herself, and here we have it. Alice is still considered an operator by PWN Safe, although she can't transfer more tokens. You can remove her from the operator set by calling this function.

This function takes three arguments supplied by the caller:

* `address`**`safe`** - Address of the PWN Safe
* `address`**`asset`** - Address of the ERC-20 token
* `address`**`operator`** - Address of the operator to remove

#### Implementation

```solidity
function resolveInvalidAllowance(address safe, address asset, address operator) external {
	uint256 allowance = IERC20(asset).allowance(safe, operator);
	if (allowance == 0) {
		operators[safe][asset].remove(operator);
	}
}
```

</details>

### Events

The Operators Context contract does not define any events or custom errors.
