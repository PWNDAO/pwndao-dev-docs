# Tokenized Asset Manager

## 1. Summary

This contract is responsible for managing tokenized asset balances. It makes sure that the balance of tokenised assets is always valid and provides a way to recover from an invalid tokenised balance in case of a [stalking attack](../../security-considerations.md#stalking-attacks).

## 2. Contract details

* _TokenizedAssetManager.sol_ is written in Solidity version 0.8.15

### Features

* Keeping track of the tokenized asset balances
* Provides a check for sufficient tokenised balance
* Implements recovery functions to recover from the stalking attack

### Functions

<details>

<summary><code>hasSufficientTokenizedBalance</code></summary>

#### Overview

A function to check the tokenised balance for the provided address is valid.

This function takes one argument supplied by the caller:

* `address` **`owner`** - Address to check

#### Implementation

```solidity
function hasSufficientTokenizedBalance(
	address owner
) external view returns (bool) {
	uint256[] memory atrs = tokenizedAssetsInSafe[owner].values();
	for (uint256 i; i < atrs.length; ++i) {
		MultiToken.Asset memory asset = assets[atrs[i]];
		(, uint256 tokenizedBalance) = tokenizedBalances[owner][
			asset.assetAddress
		].tryGet(asset.id);
		if (asset.balanceOf(owner) < tokenizedBalance) return false;
	}

	return true;
}
```

</details>

<details>

<summary><code>_increaseTokenizedBalance</code></summary>

#### Overview

An internal function called by the ATR Module which inherits this contract. It adds a new ATR Token to its owners' balance.

This function takes three arguments supplied by the ATR Module:

* `uint256` **`atrTokenId`** - ID of the new ATR Token
* `address` **`owner`** - Address that is the owner of the new ATR Token
* `MultiToken.Asset memory` **`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function _increaseTokenizedBalance(
	uint256 atrTokenId,
	address owner,
	MultiToken.Asset memory asset // Needs to be asset stored under given atrTokenId
) internal {
	tokenizedAssetsInSafe[owner].add(atrTokenId);
	EnumerableMap.UintToUintMap storage map = tokenizedBalances[owner][
		asset.assetAddress
	];
	(, uint256 tokenizedBalance) = map.tryGet(asset.id);
	map.set(asset.id, tokenizedBalance + asset.amount);
}
```

</details>

<details>

<summary><code>_decreaseTokenizedBalance</code></summary>

#### Overview

An internal function called by the ATR Module, which inherits this contract. It removes an ATR Token from its previous owners' balance.

This function takes three arguments supplied by the ATR Module:

* `uint256` **`atrTokenId`** - ID of the ATR Token being removed
* `address` **`owner`** - Address of the previous ATR Token owner
* `MultiToken.Asset memory` **`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function _decreaseTokenizedBalance(
	uint256 atrTokenId,
	address owner,
	MultiToken.Asset memory asset // Needs to be asset stored under given atrTokenId
) internal returns (bool) {
	if (tokenizedAssetsInSafe[owner].remove(atrTokenId) == false)
		return false;

	EnumerableMap.UintToUintMap storage map = tokenizedBalances[owner][
		asset.assetAddress
	];
	(, uint256 tokenizedBalance) = map.tryGet(asset.id);

	if (tokenizedBalance == asset.amount) {
		map.remove(asset.id);
	} else {
		map.set(asset.id, tokenizedBalance - asset.amount);
	}

	return true;
}
```

</details>

<details>

<summary><code>_storeTokenizedAsset</code></summary>

#### Overview

An internal function to add a new asset to the `asset` mapping (_ATR Token ID => Asset_).

This function takes two arguments supplied by the ATR Module:

* `uint256` **`atrTokenId`** - ID of the ATR Token
* `MultiToken.Asset memory` **`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function _storeTokenizedAsset(
	uint256 atrTokenId,
	MultiToken.Asset memory asset
) internal {
	assets[atrTokenId] = asset;
}
```

</details>

<details>

<summary><code>_clearTokenizedAsset</code></summary>

#### Overview

An internal function called by the ATR Module when burning an ATR Token. It removes the asset corresponding to the supplied ATR Token ID from the `asset` mapping (_ATR Token ID => Asset_).

This function takes one argument supplied by the ATR Module:&#x20;

* `uint256` **`atrTokenId`** - ID of the ATR Token to clear

#### Implementation

```solidity
function _clearTokenizedAsset(uint256 atrTokenId) internal {
	assets[atrTokenId] = MultiToken.Asset(
		MultiToken.Category.ERC20,
		address(0),
		0,
		0
	);
}
```

</details>

### Recovery functions to recover from [stalking attack](../../security-considerations.md#stalking-attacks)

:::info
This should not be necessary, thanks to the [Recipient Permission Manager](recipient-permission-manager.md), but if you ever give permission to a malicious actor and you are a victim of this attack, please contact the PWN Team on [discord](https://discord.gg/Ujz4RhxagX).
:::

#### Step 1:

<details>

<summary><code>reportInvalidTokenizedBalance</code></summary>

#### Overview

A function that checks the state is actually invalid and stores an on-chain report, that is used in the second step of the recovery process.&#x20;

The reason to divide the recovery process into two transactions is to get rid of the otherwise possible reentrancy exploits. One could possibly transfer a tokenized asset from a PWN Safe and, before tokenized balance check can happen, call the recover function, which would recover the PWN Safe from that transitory invalid state and tokenized balance check would pass, effectively bypassing the transfer rights rules.

This function takes two arguments supplied by the PWN Safe being recovered:

* `uint256` **`atrTokenId`** - ID of the invalid ATR Token
* `address` **`owner`** - Address of the ATR tokens owner

#### Implementation

```solidity
function reportInvalidTokenizedBalance(
	uint256 atrTokenId,
	address owner
) external {
	// Check if atr token is in owners safe
	// That would also check for non-existing ATR tokens
	require(
		tokenizedAssetsInSafe[owner].contains(atrTokenId),
		"Asset is not in callers safe"
	);

	// Check if state is really invalid
	MultiToken.Asset memory asset = assets[atrTokenId];
	(, uint256 tokenizedBalance) = tokenizedBalances[owner][
		asset.assetAddress
	].tryGet(asset.id);
	require(
		asset.balanceOf(owner) < tokenizedBalance,
		"Tokenized balance is not invalid"
	);

	// Store report
	invalidTokenizedBalanceReports[owner] = InvalidTokenizedBalanceReport(
		atrTokenId,
		block.number
	);
}
```

</details>

<details>

<summary>Struct: <code>InvalidTokenizedBalanceReport</code></summary>

```solidity
struct InvalidTokenizedBalanceReport {
	uint256 atrTokenId;
	uint256 block;
}
```

</details>

#### Step 2:

<details>

<summary><code>recoverInvalidTokenizedBalance</code></summary>

#### Overview

A function that recovers the PWN Safe from an invalid state. This function can only be successfully called if a report from the first step of the recovery process is present and if that report is not stale.

This function does not take any arguments.

#### Implementation

```solidity
function recoverInvalidTokenizedBalance() external {
	address owner = msg.sender;
	InvalidTokenizedBalanceReport
		memory report = invalidTokenizedBalanceReports[owner];
	uint256 atrTokenId = report.atrTokenId;

	// Check that report exist
	require(report.block > 0, "No reported invalid tokenized balance");

	// Check that report was posted in different block than recover call
	require(
		report.block < block.number,
		"Report block number has to be smaller then current block number"
	);

	// Decrease tokenized balance (would fail for invalid ATR token)
	MultiToken.Asset memory asset = assets[atrTokenId];
	require(
		_decreaseTokenizedBalance(atrTokenId, owner, asset),
		"Asset is not in callers safe"
	);

	delete invalidTokenizedBalanceReports[owner];

	emit TransferViaATR(owner, address(0), atrTokenId, asset);

	// Mark atr token as invalid (tokens asset holder is lost)
	isInvalid[atrTokenId] = true;
}
```

</details>

### View Functions

<details>

<summary><code>getAsset</code></summary>

#### Overview

Returns the asset struct (see [MultiToken](../../../../libraries/multitoken.md)) corresponding to the supplied ATR Token ID.

This function takes one argument supplied by the caller:

* `uint256` **`atrTokenId`** - ID of the ATR Token to check

#### Implementation

```solidity
function getAsset(
	uint256 atrTokenId
) external view returns (MultiToken.Asset memory) {
	return assets[atrTokenId];
}
```

</details>

<details>

<summary><code>tokenizedAssetsInSafeOf</code></summary>

#### Overview

Returns IDs of all ATR Tokens that the supplied PWN Safe address holds.&#x20;

This function takes one argument supplied by the caller:

* `address` **`owner`** - Address of the PWN Safe to check

#### Implementation

```solidity
function tokenizedAssetsInSafeOf(
	address owner
) external view returns (uint256[] memory) {
	return tokenizedAssetsInSafe[owner].values();
}
```

</details>

<details>

<summary><code>numberOfTokenizedAssetsFromCollection</code></summary>

#### Overview

Returns the total amount of tokenised assets the supplied owner holds from the supplied collection.

This function takes two arguments supplied by the caller:

* `address` **`owner`** - Address of the PWN Safe to check
* `address` **`assetAddress`** - Address of the asset to check

#### Implementation

```solidity
function numberOfTokenizedAssetsFromCollection(
	address owner,
	address assetAddress
) external view returns (uint256) {
	return tokenizedBalances[owner][assetAddress].length();
}
```

</details>

<details>

<summary><code>_canBeTokenized</code></summary>

#### Overview

An internal view function that checks the supplied owner address has some untokenised asset(s) from the supplied asset collection to tokenise.&#x20;

This function takes two arguments supplied by the ATR Module:

* `address` **`owner`** - Address of the PWN Safe to check
* `MultiToken.Asset memory` **`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function _canBeTokenized(
	address owner,
	MultiToken.Asset memory asset
) internal view returns (bool) {
	uint256 balance = asset.balanceOf(owner);
	(, uint256 tokenizedBalance) = tokenizedBalances[owner][
		asset.assetAddress
	].tryGet(asset.id);
	return (balance - tokenizedBalance) >= asset.amount;
}
```

</details>

### Events

The Tokenized Asset Manager contract defines one event and no custom errors.

<details>

<summary><code>TransferViaATR</code></summary>

This event is emitted when a tokenised asset is transferred.

This event defines four parameters:

* `address indexed` **`from`** - Address from which was the token transferred
* `address indexed` **`to`** - Address to which was the token transferred
* `uint256 indexed` **`atrTokenId`** - ID of the transferred token
* `MultiToken.Asset` **`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

</details>

```solidity
event TransferViaATR(
	address indexed from,
	address indexed to,
	uint256 indexed atrTokenId,
	MultiToken.Asset asset
);
```