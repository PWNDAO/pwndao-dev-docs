# ATR Module

## 1. Summary

This contract represents the tokenised asset transfer rights as an [ERC-721](https://eips.ethereum.org/EIPS/eip-721) token, keeps track of tokenised balances and handles transfers of the tokenised assets. PWN Safes are expected to use this contract to **mint new Asset Transfer Right (ATR) tokens**. The contract _owner_ can also set a whitelist to restrict minting ATR tokens only for selected assets.&#x20;

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/pwn_safe/blob/main/src/module/AssetTransferRights.sol)
* [**JSON ABI**](/assets/AssetTransferRights.json)

## 3. Contract details

* _AssetTransferRights.sol_ is written in Solidity version 0.8.15

### Features

* ATR token minting and burning
* Keeping track of all ATR tokens
* Transferring of assets with minted ATR token
* Handling recipient permissions
* Whitelist to allow tokenisation of only selected collections

### Inherited contracts

This contract inherits other contracts. Please see their reference for a complete overview of the ATR Module.

* [**Ownable**](https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable)
* [**Initializable**](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable)
* [**TokenizedAssetManager**](tokenized-asset-manager.md)
* [**RecipientPermissionManager**](recipient-permission-manager.md)
* [**ERC721**](https://eips.ethereum.org/EIPS/eip-721)

### Functions

<details>

<summary><code>mintAssetTransferRightsToken</code></summary>

#### Overview

This function is used to mint an ATR token. It has to be called by a valid PWN Safe, which is defined by the PWN Safe Factory `isValid` function. It is not permitted to tokenise transfer rights of ATR tokens or any tokens that have approved operators.&#x20;

This function takes one argument supplied by the PWN Safe Proxy:

* `MultiToken.Asset memory`**`asset`** - An asset struct (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function mintAssetTransferRightsToken(MultiToken.Asset memory asset) public returns (uint256) {
	// Check that msg.sender is PWNSafe
	require(safeValidator.isValidSafe(msg.sender) == true, "Caller is not a PWNSafe");

	// Check that asset address is not zero address
	require(asset.assetAddress != address(0), "Attempting to tokenize zero address asset");

	// Check that asset address is not ATR contract address
	require(asset.assetAddress != address(this), "Attempting to tokenize ATR token");

	// Check that address is whitelisted
	require(whitelist.canBeTokenized(asset.assetAddress) == true, "Asset is not whitelisted");

	// Check that provided asset category is correct
	if (asset.category == MultiToken.Category.ERC20) {

		if (asset.assetAddress.supportsERC165()) {
			require(asset.assetAddress.supportsERC165InterfaceUnchecked(type(IERC20).interfaceId), "Invalid provided category");

		} else {

			// Fallback check for ERC20 tokens not implementing ERC165
			try IERC20(asset.assetAddress).totalSupply() returns (uint256) {
			} catch { revert("Invalid provided category"); }

		}

	} else if (asset.category == MultiToken.Category.ERC721) {
		require(asset.assetAddress.supportsInterface(type(IERC721).interfaceId), "Invalid provided category");

	} else if (asset.category == MultiToken.Category.ERC1155) {
		require(asset.assetAddress.supportsInterface(type(IERC1155).interfaceId), "Invalid provided category");

	} else {
		revert("Invalid provided category");
	}

	// Check that given asset is valid
	require(asset.isValid(), "Asset is not valid");

	// Check that asset collection doesn't have approvals
	require(atrGuard.hasOperatorFor(msg.sender, asset.assetAddress) == false, "Some asset from collection has an approval");

	// Check that ERC721 asset don't have approval
	if (asset.category == MultiToken.Category.ERC721) {
		address approved = IERC721(asset.assetAddress).getApproved(asset.id);
		require(approved == address(0), "Asset has an approved address");
	}

	// Check if asset can be tokenized
	require(_canBeTokenized(msg.sender, asset), "Insufficient balance to tokenize");

	// Set ATR token id
	uint256 atrTokenId = ++lastTokenId;

	// Store asset data
	_storeTokenizedAsset(atrTokenId, asset);

	// Update tokenized balance
	_increaseTokenizedBalance(atrTokenId, msg.sender, asset);

	// Mint ATR token
	_mint(msg.sender, atrTokenId);

	emit TransferViaATR(address(0), msg.sender, atrTokenId, asset);

	return atrTokenId;
}
```

</details>

<details>

<summary><code>mintAssetTransferRightsTokenBatch</code></summary>

#### Overview

In case a user wants to tokenise more than one asset it is recommended to use this function instead of calling `mintAssetTransferRightsToken` multiple times.&#x20;

This function takes one argument supplied by the PWN Safe Proxy:

* `MultiToken.Asset[] calldata`**`assets`** - An array of asset structs (see [MultiToken](../../../../libraries/multitoken.md))

#### Implementation

```solidity
function mintAssetTransferRightsTokenBatch(
	MultiToken.Asset[] calldata assets
) external {
	for (uint256 i; i < assets.length; ++i) {
		mintAssetTransferRightsToken(assets[i]);
	}
}
```

</details>

<details>

<summary><code>burnAssetTransferRightsToken</code></summary>

#### Overview

A user can call this function to burn an ATR token. This will allow the owner of the asset to transfer the asset without the ATR token again.&#x20;

This function takes one argument supplied by the caller:

* `uint256`**`atrTokenId`** - ID of the ATR token to burn

#### Implementation

```solidity
function burnAssetTransferRightsToken(uint256 atrTokenId) public {
	// Load asset
	MultiToken.Asset memory asset = assets[atrTokenId];

	// Check that token is indeed tokenized
	require(
		asset.assetAddress != address(0),
		"Asset transfer rights are not tokenized"
	);

	// Check that caller is ATR token owner
	require(
		ownerOf(atrTokenId) == msg.sender,
		"Caller is not ATR token owner"
	);

	if (isInvalid[atrTokenId] == false) {
		// Check asset balance
		require(
			asset.balanceOf(msg.sender) >= asset.amount,
			"Insufficient balance of a tokenize asset"
		);

		// Update tokenized balance
		require(
			_decreaseTokenizedBalance(atrTokenId, msg.sender, asset),
			"Tokenized asset is not in a safe"
		);

		emit TransferViaATR(msg.sender, address(0), atrTokenId, asset);
	}

	// Clear asset data
	_clearTokenizedAsset(atrTokenId);

	// Burn ATR token
	_burn(atrTokenId);
}
```

</details>

<details>

<summary><code>burnAssetTransferRightsTokenBatch</code></summary>

#### Overview

In case a user wants to burn more than one ATR token it is recommended to use this function instead of calling `burnAssetTransferRightsToken` multiple times.&#x20;

This function takes one argument supplied by the caller:

* `uint256[] calldata`**`atrTokenIds`** - Array of ATR token IDs to burn

#### Implementation

```solidity
function burnAssetTransferRightsTokenBatch(uint256[] calldata atrTokenIds)
	external
{
	for (uint256 i; i < atrTokenIds.length; ++i) {
		burnAssetTransferRightsToken(atrTokenIds[i]);
	}
}
```

</details>

<details>

<summary><code>claimAssetFrom</code></summary>

#### Overview

Transfer functions are divided into two separate ones to prevent the [_Stalking Attack_](../../security-considerations.md#stalking-attacks).

This function allows a holder of an ATR token to transfer the tokenised asset to the ATR token holder address. The caller can decide if the ATR token should be burned in the process. The caller can be any account if the ATR token is burned. If the ATR token is not burned, the caller has to be a valid PWN Safe.&#x20;

This function takes three arguments supplied by the caller:

* `address payable`**`from`** - Address of the PWN Safe, which holds the asset to be transferred
* `uint256`**`atrTokenId`** - ID of the ATR token corresponding to the asset to be transferred&#x20;
* `bool`**`burnToken`** - A flag to decide if the ATR token should be burned during the transfer process

#### Implementation

```solidity
function claimAssetFrom(
	address payable from,
	uint256 atrTokenId,
	bool burnToken
) external {
	// Load asset
	MultiToken.Asset memory asset = assets[atrTokenId];

	_initialChecks(asset, from, msg.sender, atrTokenId);

	// Process asset transfer
	_processTransferAssetFrom(
		asset,
		from,
		msg.sender,
		atrTokenId,
		burnToken
	);
}
```

</details>

<details>

<summary><code>transferAssetFrom</code></summary>

#### Overview

Transfer functions are divided into two separate ones to prevent the [_Stalking Attack_](../../security-considerations.md#stalking-attacks).

This function allows for a transfer of tokenised asset to an arbitrary address. Recipient Permission Manager is used to prevent the Stalking Attack. The permission can be granted on-chain, signed off-chain or via [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271). The caller can also decide if the ATR token should be burned in the process.

This function takes five arguments supplied by the caller:

* `address payable`**`from`** - Address of the PWN Safe which holds the asset to be transferred
* `uint256`**`atrTokenId`** - ID of the ATR token corresponding to the asset to be transferred&#x20;
* `bool`**`burnToken`** - A flag to decide if the ATR token should be burned during the transfer process
* `RecipientPermission memory`**`permission`** - Struct representing recipient permission. (see [Recipient Permission Struct](recipient-permission-manager.md#recipient-permission-struct))
* `bytes calldata`**`permissionSignature`** - Signature of permission struct hash. Pass empty data in case of on-chain signature or usage of [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271).

#### Implementation

```solidity
function transferAssetFrom(
	address payable from,
	uint256 atrTokenId,
	bool burnToken,
	RecipientPermission memory permission,
	bytes calldata permissionSignature
) external {
	// Load asset
	MultiToken.Asset memory asset = assets[atrTokenId];

	_initialChecks(asset, from, permission.recipient, atrTokenId);

	// Use valid permission
	_useValidPermission(msg.sender, asset, permission, permissionSignature);

	// Process asset transfer
	_processTransferAssetFrom(
		asset,
		from,
		permission.recipient,
		atrTokenId,
		burnToken
	);
}
```

</details>

<details>

<summary><code>tokenURI</code></summary>

#### Overview

This function is used to retrieve ATR token metadata URI.&#x20;

This function takes one argument supplied by the called:

* `uint256`**`tokenId`** - The new URI to set

#### Implementation

```solidity
function tokenURI(
	uint256 tokenId
) public view override returns (string memory) {
	_requireMinted(tokenId);
	return _metadataUri;
}

```

</details>

<details>

<summary><code>setMetadataUri</code></summary>

#### Overview

This function is used to set metadata URI for the ATR token. It can only be called by the owner.&#x20;

This function takes one argument supplied by the owner:

* `string memory`**`metadataUri`** - The new URI to set

#### Implementation

```solidity
function setMetadataUri(string memory metadataUri) external onlyOwner {
	_metadataUri = metadataUri;
}
```

</details>

<details>

<summary><code>_processTransferAssetFrom</code></summary>

**Overview**

Function to process the actual transfer of assets which have their transfer rights tokenised. It is called only by the `claimAssetFrom` and `transferAssetFrom` functions. &#x20;

This function takes five arguments supplied by the ATR Module:

* `address payable`**`from`** - Address of the PWN Safe which holds the asset to be transferred
* `uint256`**`atrTokenId`** - ID of the ATR token corresponding to the asset to be transferred&#x20;
* `bool`**`burnToken`** - A flag to decide if the ATR token should be burned during the transfer process
* `RecipientPermission memory`**`permission`** - Struct representing recipient permission. (see [Recipient Permission Struct](recipient-permission-manager.md#recipient-permission-struct))
* `bytes calldata`**`permissionSignature`** - Signature of permission struct hash. Pass empty data in case of on-chain signature or usage of [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271).

**Implementation**

```solidity
function _processTransferAssetFrom(
	MultiToken.Asset memory asset,
	address payable from,
	address to,
	uint256 atrTokenId,
	bool burnToken
) private {
	// Update tokenized balance (would fail for invalid ATR token)
	require(
		_decreaseTokenizedBalance(atrTokenId, from, asset),
		"Asset is not in a target safe"
	);

	if (burnToken == true) {
		// Burn the ATR token
		_clearTokenizedAsset(atrTokenId);

		_burn(atrTokenId);
	} else {
		// Fail if recipient is not PWNSafe
		require(
			safeValidator.isValidSafe(to) == true,
			"Attempting to transfer asset to non PWNSafe address"
		);

		// Check that recipient doesn't have approvals for the token collection
		require(
			atrGuard.hasOperatorFor(to, asset.assetAddress) == false,
			"Receiver has approvals set for an asset"
		);

		// Update tokenized balance
		_increaseTokenizedBalance(atrTokenId, to, asset);
	}

	// Transfer asset from `from` safe
	bool success = GnosisSafe(from).execTransactionFromModule({
		to: asset.assetAddress,
		value: 0,
		data: asset.transferAssetFromCalldata(from, to, true),
		operation: Enum.Operation.Call
	});
	require(success, "Asset transfer failed");

	emit TransferViaATR(
		from,
		burnToken ? address(0) : to,
		atrTokenId,
		asset
	);
}

```

</details>

### Events

The Asset Transfer Rights contract inherits events from [Recipient Permission Manager](recipient-permission-manager.md), [Tokenized Asset Manager](tokenized-asset-manager.md), [Ownable](https://docs.zeppelinos.org/docs/2.2.0/openzeppelin-solidity\_ownership\_ownable) and [ERC-721](https://eips.ethereum.org/EIPS/eip-721) contracts and does not define any additional custom events or errors.
