# Recipient Permission Manager

## 1. Summary

This contract is responsible for checking valid recipient permissions and tracking granted and revoked permissions. It is necessary to prevent the [stalking attack](../../security-considerations.md#stalking-attacks).&#x20;

## 2. Contract details

* _RecipientPermissionManager.sol_ is written in Solidity version 0.8.15

### Features

* Checks for valid recipient permissions
* Tracks granted and revoked permissions
* Provides a function to hash the [`RecipientPermission`](recipient-permission-manager.md#recipient-permission-struct) struct

### Functions

<details>

<summary><code>grantRecipientPermission</code></summary>

#### Overview

A function to grant an on-chain recipient permission.&#x20;

This function takes one argument supplied by the caller:

* `RecipientPermission calldata`**`permission`** - The [recipient permission struct](recipient-permission-manager.md#recipient-permission-struct)

#### Implementation

```solidity
function grantRecipientPermission(RecipientPermission calldata permission) external {
	// Check that caller is permission signer
	require(msg.sender == permission.recipient, "Sender is not permission recipient");

	bytes32 permissionHash = recipientPermissionHash(permission);

	// Check that permission is not have been granted
	require(grantedPermissions[permissionHash] == false, "Recipient permission is granted");

	// Check that permission is not have been revoked
	require(revokedPermissionNonces[msg.sender][permission.nonce] == false, "Recipient permission nonce is revoked");

	// Grant permission
	grantedPermissions[permissionHash] = true;

	// Emit event
	emit RecipientPermissionGranted(permissionHash);
}
```

</details>

<details>

<summary><code>revokeRecipientPermission</code></summary>

#### Overview

A function to revoke permissions.&#x20;

This function takes one argument supplied by the caller:

* `bytes32`**`permissionNonce`** - A [nonce](recipient-permission-manager.md#recipient-permission-struct) of the permission being revoked for the caller

#### Implementation

```solidity
function revokeRecipientPermission(bytes32 permissionNonce) external {
	// Check that permission is has not been revoked
	require(
		revokedPermissionNonces[msg.sender][permissionNonce] == false,
		"Recipient permission nonce is revoked"
	);

	// Revoke permission
	revokedPermissionNonces[msg.sender][permissionNonce] = true;

	// Emit event
	emit RecipientPermissionNonceRevoked(msg.sender, permissionNonce);
}
```

</details>

<details>

<summary><code>recipientPermissionHash</code></summary>

#### Overview

A function to hash a permission struct using `keccak256`.

This function takes one argument supplied by the caller:

* `RecipientPermission memory`**`permission`** - The [recipient permission struct](recipient-permission-manager.md#recipient-permission-struct)

#### Implementation

```solidity
function recipientPermissionHash(RecipientPermission memory permission) public view returns (bytes32) {
	return keccak256(abi.encodePacked(
		"\x19\x01",
		// Domain separator is composing to prevent replay attack in case of an Ethereum fork
		keccak256(abi.encode(
			keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
			keccak256(bytes("AssetTransferRights")),
			keccak256(bytes("0.1")),
			block.chainid,
			address(this)
		)),
		keccak256(abi.encode(
			RECIPIENT_PERMISSION_TYPEHASH,
			permission.assetCategory,
			permission.assetAddress,
			permission.assetId,
			permission.assetAmount,
			permission.ignoreAssetIdAndAmount,
			permission.recipient,
			permission.expiration,
			permission.isPersistent,
			permission.nonce
		))
	));
}
```

</details>

<details>

<summary><code>_checkValidPermission</code></summary>

#### Overview

An internal function that verifies the validity of supplied permission and marks it as used.

This function takes four arguments supplied by the ATR Module:

* `address`**`sender`** - Address of the account that is sending the asset
* `MultiToken.Asset memory`**`asset`** -  An asset struct (see [MultiToken](../../../../libraries/multitoken.md))
* `RecipientPermission memory`**`permission`** - The [recipient permission struct](recipient-permission-manager.md#recipient-permission-struct)
* `bytes calldata`**`permissionSignature`** -  [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) [raw signature](https://docs.ethers.io/v5/api/signer/#Signer-signTypedData) of the recipient permission struct. This signature is not required if the permission was granted on-chain

#### Implementation

```solidity
function _useValidPermission(
	address sender,
	MultiToken.Asset memory asset,
	RecipientPermission memory permission,
	bytes calldata permissionSignature
) internal {
	// Check that permission is not expired
	uint40 expiration = permission.expiration;
	require(expiration == 0 || block.timestamp < expiration, "Recipient permission is expired");

	// Check permitted agent
	address agent = permission.agent;
	require(agent == address(0) || sender == agent, "Caller is not permitted agent");

	// Check correct asset
	require(permission.assetCategory == asset.category, "Invalid permitted asset");
	require(permission.assetAddress == asset.assetAddress, "Invalid permitted asset");
	// Check id and amount if ignore flag is false
	if (permission.ignoreAssetIdAndAmount == false) {
		require(permission.assetId == asset.id, "Invalid permitted asset");
		require(permission.assetAmount == asset.amount, "Invalid permitted asset");
	} // Skip id and amount check if ignore flag is true

	// Check that permission nonce is not revoked
	address recipient = permission.recipient;
	bytes32 nonce = permission.nonce;
	require(revokedPermissionNonces[recipient][nonce] == false, "Recipient permission nonce is revoked");

	// Compute EIP-712 structured data hash
	bytes32 permissionHash = recipientPermissionHash(permission);

	// Check that permission is granted
	// Via on-chain tx, EIP-1271 or off-chain signature
	if (grantedPermissions[permissionHash] == true) {
		// Permission is granted on-chain, no need to check signature
	} else if (recipient.code.length > 0) {
		// Check that permission is valid
		require(IERC1271(recipient).isValidSignature(permissionHash, permissionSignature) == EIP1271_VALID_SIGNATURE, "Signature on behalf of contract is invalid");
	} else {
		// Check that permission signature is valid
		require(ECDSA.recover(permissionHash, permissionSignature) == recipient, "Permission signer is not stated as recipient");
	}

	// Mark used permission nonce as revoked if not persistent
	if (permission.isPersistent == false) {
		revokedPermissionNonces[recipient][nonce] = true;

		emit RecipientPermissionNonceRevoked(recipient, nonce);
	}

}
```

</details>

### Recipient Permission Struct

<table><thead><tr><th width="259.3333333333333">Type</th><th width="256">Name</th><th>Comment</th></tr></thead><tbody><tr><td><a href="../../../../libraries/multitoken.md#asset-struct"><code>MultiToken.Category</code></a></td><td><code>assetCategory</code></td><td>Category of the asset that is permitted to transfer (see <a href="../../../../libraries/multitoken.md">MultiToken</a> for more information)</td></tr><tr><td><code>address</code></td><td><code>assetAddress</code></td><td>Contract address of the asset that is permitted to transfer</td></tr><tr><td><code>uint256</code></td><td><code>assetId</code></td><td>ID of the asset that is permitted to transfer</td></tr><tr><td><code>uint256</code></td><td><code>assetAmount</code></td><td>Amount of the asset that is permitted to transfer</td></tr><tr><td><code>bool</code></td><td><code>ignoreAssetIdAndAmount</code></td><td>Flag stating if asset ID and amount are ignored when checking the permissioned asset</td></tr><tr><td><code>address</code></td><td><code>recipient</code></td><td>Address of the recipient and permission signer</td></tr><tr><td><code>address</code></td><td><code>agent</code></td><td>Optional address of a permitted agent that can process the permission. If this value is zero, any agent can process the permission</td></tr><tr><td><code>uint40</code></td><td><code>expiration</code></td><td>Optional permission expiration timestamp in seconds. If this value is zero, the permission doesn't have an expiration</td></tr><tr><td><code>bool</code></td><td><code>isPersistent</code></td><td>Flag stating if a permission is valid for more than one use</td></tr><tr><td><code>bytes32</code></td><td><code>nonce</code></td><td>Additional value to distinguish otherwise identical permissions</td></tr></tbody></table>

### Events

The Recipient Permission Manager contract defines two events and no custom errors.&#x20;

```solidity
event RecipientPermissionGranted(bytes32 indexed permissionHash);
event RecipientPermissionNonceRevoked(address indexed recipient, bytes32 indexed permissionNonce);
```

<details>

<summary><code>RecipientPermissionGranted</code></summary>

RecipientPermissionGranted event is emitted when on-chain recipient permission is granted.&#x20;

This event has one parameter:

* `bytes32 indexed`**`permissionHash`** - Hash of the recipient permission struct returned by the recipientPermissionHash function

</details>

<details>

<summary><code>RecipientPermissionNonceRevoked</code></summary>

RecipientPermissionNonceRevoked event is emitted when a recipient revokes previously granted permission.&#x20;

This event has two parameters:

* `address indexed`**`recipient`** - Address of the recipient who revoked the permission
* `bytes32 indexed`**`permissionNonce`** - Nonce of the revoked permission (see RecipientPermission struct for more information)

</details>
