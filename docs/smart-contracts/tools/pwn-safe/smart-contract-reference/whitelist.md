# Whitelist

## 1. Summary

This contract is used by the ATR Module and is responsible for managing a whitelist of assets which are permitted to have their transfer rights tokenized.

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/pwn_safe/blob/main/src/Whitelist.sol)
* [**JSON ABI**](/assets/Whitelist.json)

## 3. Contract details

* _Whitelist.sol_ is written in Solidity version 0.8.15
* This contract inherits the [Ownable](https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable) contract

### Features

* Keeps a whitelist of approved assets
* Keeps a whitelist of approved libraries for delegate calls

### Functions

<details>

<summary><code>canBeTokenized</code></summary>

#### Overview

A getter function to see if a certain asset or asset collection is whitelisted to be tokenised. The function returns a boolean.&#x20;

This function takes one argument supplied by the caller:

* `address`**`assetAddress`** - Address of the asset or asset collection to check

#### Implementation

```solidity
function canBeTokenized(address assetAddress) external view returns (bool) {
    if (!useWhitelist)
        return true;

    return isWhitelisted[assetAddress];
}
```

</details>

<details>

<summary><code>setUseWhitelist</code></summary>

#### Overview

A setter function to turn the whitelist on and off. It can be called only by the owner.

This function takes one argument supplied by the owner:

* `bool`**`_useWhitelist`** - A boolean to update the `useWhitelist` flag

#### Implementation

```solidity
function setUseWhitelist(bool _useWhitelist) external onlyOwner {
	useWhitelist = _useWhitelist;
}
```

</details>

<details>

<summary><code>setIsWhitelisted</code></summary>

#### Overview

A setter function to add or remove an address from the whitelist. It can be called only by the owner.

This function takes two arguments supplied by the owner:

* `address`**`assetAddress`** - Address of the asset being modified&#x20;
* `bool`**`_isWhitelisted`** - Boolean determining the addition or removal from the whitelist

#### Implementation

```solidity
function setIsWhitelisted(
	address assetAddress,
	bool _isWhitelisted
) public onlyOwner {
	isWhitelisted[assetAddress] = _isWhitelisted;
}
```

</details>

<details>

<summary><code>setIsWhitelistedBatch</code></summary>

#### Overview

A setter function to add or remove multiple addresses from the whitelist. It can be called only by the owner.

This function takes two arguments supplied by the caller:

* `address[] calldata`**`assetAddresses`** - Array of addresses being modified&#x20;
* `bool`**`_isWhitelisted`** - Boolean determining the addition or removal from the whitelist

#### Implementation

```solidity
function setIsWhitelistedBatch(
	address[] calldata assetAddresses,
	bool _isWhitelisted
) external onlyWhitelistManager {
	uint256 length = assetAddresses.length;
	for (uint256 i; i < length; ) {
		setIsWhitelisted(assetAddresses[i], _isWhitelisted);
		unchecked {
			++i;
		}
	}
}
```

</details>

<details>

<summary><code>setIsWhitelistedLib</code></summary>

**Overview**

A setter function to add or remove a library address from the whitelist. It can be called only by the owner.

This function takes two arguments supplied by the owner:

* `address`**`libAddress`** - Address of the library being modified&#x20;
* `bool`**`_isWhitelisted`** - Boolean determining the addition or removal from the whitelist

**Implementation**

```solidity
function setIsWhitelistedLib(address libAddress, bool _isWhitelisted) public onlyOwner {
    isWhitelistedLib[libAddress] = _isWhitelisted;
}
```

</details>

### Events

The Whitelist contract defines one event and no custom errors.&#x20;

```solidity
event AssetWhitelisted(address indexed assetAddress, bool indexed isWhitelisted);
```

<details>

<summary><code>AssetWhitelisted</code></summary>

AssetWhitelisted event is emitted when an asset address is whitelisted or removed from the whitelist.

This event has two parameters:

* `address indexed`**`assetAddress`** - Address of the whitelisted asset
* **`bool`**`indexed`**`isWhitelisted`** - True if the asset was whitelisted and false if the asset was removed from the whitelist

</details>
