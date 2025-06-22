# ATR Guard

## 1. Summary

Asset Transfer Rights Guard is responsible for enforcing asset transfer rules. It checks the state before and after a transaction execution.&#x20;

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/pwn_safe/blob/main/src/guard/AssetTransferRightsGuard.sol)
* [**JSON ABI**](/assets/AssetTransferRightsGuard.json)

## 3. Contract details

* _AssetTransferRightsGuard.sol_ is written in Solidity version 0.8.15

### Features

* Checks every Safe transaction before and after its execution making sure that Asset Transfer Rights token rules are enforced

### Inherited contracts

This contract inherits other contracts. Please see their reference for a complete overview of the ATR Guard.

* [**OperatorsContext**](operators-context.md)
* [**Initializable**](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable)

### Functions

<details>

<summary><code>checkTransaction</code></summary>

#### Overview

A hook called by the PWN Safe to check a transaction before its execution.

This function takes the transaction parameters as arguments (see [implementation](./#implementation)).

#### Implementation

```solidity
function checkTransaction(
	address to,
	uint256 /*value*/,
	bytes calldata data,
	Enum.Operation operation,
	uint256 safeTxGas,
	uint256 /*baseGas*/,
	uint256 gasPrice,
	address /*gasToken*/,
	address payable /*refundReceiver*/,
	bytes memory /*signatures*/,
	address /*msgSender*/ // msgSender is caller on safe, msg.sender is safe
) external {
	require(safeTxGas == 0, "Safe tx gas has to be 0 for tx to revert in case of failure");
	require(gasPrice == 0, "Gas price has to be 0 for tx to revert in case of failure");

	// Libraries has to be whitelisted
	if (operation == Enum.Operation.DelegateCall)
		require(whitelist.isWhitelistedLib(to), "Address is not whitelisted for delegatecalls");

	// Self authorization calls
	if (to == msg.sender)
		_checkManagerUpdates(data);

	// Trust ATR contract
	if (to != address(atr))
		_checkExecutionCalls(msg.sender, to, data);
}
```

</details>

<details>

<summary><code>checkAfterExecution</code></summary>

#### Overview

A hook called after transaction execution to make sure there's a correct ATR token balance.

This function takes the transaction hash and a boolean determining transaction success as arguments.&#x20;

#### Implementation

```solidity
function checkAfterExecution(bytes32 /*txHash*/, bool success) view external {
	if (success)
		require(atr.hasSufficientTokenizedBalance(msg.sender), "Insufficient tokenized balance");
}
```

</details>

<details id="hasoperatorfor">

<summary>hasOperatorFor</summary>

#### Overview

Check function to determine if a PWN Safe has approved operators for a specific asset collection. This function returns a boolean.&#x20;

This function takes two arguments supplied by the caller:

* `address`**`safeAddress`** - Address of the PWN Safe to check
* `address`**`assetAddress`** - Address of the asset collection to check

#### Implementation

```solidity
function hasOperatorFor(address safeAddress, address assetAddress) override(OperatorsContext, IAssetTransferRightsGuard) public view returns (bool) {
	// ERC777 defines `defaultOperators`
	address implementer = IERC1820Registry(ERC1820_REGISTRY_ADDRESS).getInterfaceImplementer(assetAddress, keccak256("ERC777Token"));
	if (implementer == assetAddress) {
		address[] memory defaultOperators = IERC777(assetAddress).defaultOperators();

		for (uint256 i; i < defaultOperators.length; ++i)
			if (IERC777(assetAddress).isOperatorFor(defaultOperators[i], safeAddress))
				return true;
	}

	return super.hasOperatorFor(safeAddress, assetAddress);
}
```

</details>

<details>

<summary><code>_checkManagerUpdates</code></summary>

#### Overview

This check ensures that invalid manager functions aren't called.

This function takes the transaction calldata as an argument and can be called only the Guard.&#x20;

#### Implementation

```solidity
function _checkManagerUpdates(bytes calldata data) pure private {
	// Get function selector from data
	bytes4 funcSelector = bytes4(data);

	// GuardManager.setGuard(address)
	if (funcSelector == 0xe19a9dd9) {
		revert("Cannot change ATR guard");
	}

	// ModuleManager.enableModule(address)
	else if (funcSelector == 0x610b5925) {
		revert("Cannot enable ATR module");
	}

	// ModuleManager.disableModule(address,address)
	else if (funcSelector == 0xe009cfde) {
		revert("Cannot disable ATR module");
	}

	// FallbackManager.setFallbackHandler(address)
	else if (funcSelector == 0xf08a0323) {
		revert("Cannot change fallback handler");
	}
}
```

</details>

<details>

<summary><code>_checkExecutionCalls</code></summary>

#### Overview

This check ensures that invalid transfer and approve functions aren't called if there's an ATR token minted for a specific collection.&#x20;

This function takes three arguments supplied by the ATR Guard:

* `address`**`safeAddress`** - Address of the PWN Safe that initiated the transaction
* `address`**`target`** - Target contract that is being called
* `bytes calldata`**`data`** - Transaction calldata

#### Implementation

```solidity
function _checkExecutionCalls(address safeAddress, address target, bytes calldata data) private {
	// Get function selector from data
	bytes4 funcSelector = bytes4(data);

	// ERC20/ERC721 - approve(address,uint256)
	if (funcSelector == 0x095ea7b3) {
		// Block any approve call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		(address operator, uint256 amount) = abi.decode(data[4:], (address, uint256));

		// Safe don't need to track approved ERC721 asset ids, because it's possible to get this information from ERC721 contract directly.
		// ERC20 contract doesn't provide possibility to list all addresses that are approved to transfer asset on behalf of an owner.
		// That's why a safe has to track operators.

		_handleERC20Approval(safeAddress, target, operator, amount);
	}

	// ERC20 - increaseAllowance(address,uint256)
	else if (funcSelector == 0x39509351) {
		// Block any increaseAllowance call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		(address operator, uint256 amount) = abi.decode(data[4:], (address, uint256));
		if (amount > 0) {
			_addOperator(safeAddress, target, operator);
		}
	}

	// ERC20 - decreaseAllowance(address,uint256)
	else if (funcSelector == 0xa457c2d7) {
		(address operator, uint256 amount) = abi.decode(data[4:], (address, uint256));
		try IERC20(target).allowance(safeAddress, operator) returns (uint256 allowance) {

			if (allowance <= amount) {
				_removeOperator(safeAddress, target, operator);
			}

		} catch {}
	}

	// ERC721/ERC1155 - setApprovalForAll(address,bool)
	else if (funcSelector == 0xa22cb465) {
		// Block any setApprovalForAll call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		(address operator, bool approved) = abi.decode(data[4:], (address, bool));

		// Not ERC721 nor ERC1155 does provider direct way how to get list of approved operators.
		// That's why a wallet has to track them.

		if (approved) {
			_addOperator(safeAddress, target, operator);
		} else {
			_removeOperator(safeAddress, target, operator);
		}
	}

	// ERC777 - authorizeOperator(address)
	else if (funcSelector == 0x959b8c3f) {
		// Block any authorizeOperator call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		address operator = abi.decode(data[4:], (address));
		_addOperator(safeAddress, target, operator);
	}

	// ERC777 - revokeOperator(address)
	else if (funcSelector == 0xfad8b32a) {
		address operator = abi.decode(data[4:], (address));
		_removeOperator(safeAddress, target, operator);
	}

	// ERC1363 - approveAndCall(address,uint256)
	else if (funcSelector == 0x3177029f) {
		// Block any approveAndCall call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		(address operator, uint256 amount) = abi.decode(data[4:], (address, uint256));
		_handleERC20Approval(safeAddress, target, operator, amount);
	}

	// ERC1363 - approveAndCall(address,uint256,bytes)
	else if (funcSelector == 0xcae9ca51) {
		// Block any approveAndCall call if there is at least one tokenized asset from a collection
		require(atr.numberOfTokenizedAssetsFromCollection(safeAddress, target) == 0, "Some asset from collection has transfer right token minted");

		(address operator, uint256 amount,) = abi.decode(data[4:], (address, uint256, bytes));
		_handleERC20Approval(safeAddress, target, operator, amount);
	}
}
```

</details>

### Events

The Asset Transfer Rights Guard contract does not define any events or custom errors.
