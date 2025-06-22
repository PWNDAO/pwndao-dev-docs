# PWN Safe Factory

## 1. Summary

PWN Safe Factory is used to deploy new PWN Safes and keep track of all deployed PWN Safes. This contract also implements `IPWNSafeValidator` interface so it can validate genuine PWN Safes.

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/pwn_safe/blob/main/src/factory/PWNSafeFactory.sol)
* [**JSON ABI**](/assets/PWNSafeFactory.json)

## 3. Contract details

* _PWNSafeFactory.sol_ is written in Solidity version 0.8.15

### Features

* Deploy new PWN Safe Proxys
* Check if an address is a valid PWN Safe

### Functions

<details id="deployproxy">

<summary>deployProxy</summary>

#### Overview

A user can deploy a new PWN Safe proxy by calling the `deployProxy` function.&#x20;

This function takes two arguments supplied by the caller:

* `address[] calldata`**`owners`** - Array of addresses which will be able to sign transactions for this Safe
* `uint256`**`threshold`** - Amount of owner signatures required for a valid transaction

#### Implementation

```solidity
function deployProxy(
	address[] calldata owners,
	uint256 threshold
) external returns (GnosisSafe) {
	// Deploy new gnosis safe proxy
	GnosisSafeProxy proxy = gnosisSafeProxyFactory.createProxy(gnosisSafeSingleton, "");
	GnosisSafe safe = GnosisSafe(payable(address(proxy)));

	// Setup safe
	safe.setup(
		owners, // _owners
		threshold, // _threshold
		address(this), // to
		abi.encodeWithSelector(PWNSafeFactory.setupNewSafe.selector), // data
		fallbackHandler, // fallbackHandler
		address(0), // paymentToken
		0, // payment
		payable(address(0)) // paymentReceiver
	);

	// Store as valid address
	isValidSafe[address(safe)] = true;

	// Emit event
	emit PWNSafeDeployed(address(safe));

	return safe;
}
```

</details>

<details>

<summary><code>isValidSafe</code></summary>

#### Overview

Getter function for the `isValidSafe` mapping (address => bool) stored inside the PWN Safe Factory contract.

This function returns _true_ if a given address is a valid PWN Safe Proxy and returns _false_ otherwise.

#### Implementation

```solidity
function isValidSafe(address safe) external view returns (bool);

mapping(address => bool) public isValidSafe;
```

</details>

<details>

<summary><code>setupNewSafe</code></summary>

#### Overview

Set up function for a new PWN Safe. It ensures Safe has the correct Safe singleton, and initialises the Safe with the correct ATR [Module](atr-module/) and [Guard](atr-guard/). Only the PWN Safe Proxy can call this function.&#x20;

This function does not define any parameters.&#x20;

#### Implementation

```solidity
function setupNewSafe() external {
    // Check that is called via delegatecall
    require(
        address(this) != pwnFactorySingleton,
        "Should only be called via delegatecall"
    );

    // Check that caller is GnosisSafeProxy
    // Need to hash bytes arrays first, because solidity cannot compare byte arrays directly
    require(
        keccak256(gnosisSafeProxyFactory.proxyRuntimeCode()) ==
            keccak256(address(this).code),
        "Caller is not gnosis safe proxy"
    );

    // Check that proxy has correct singleton set
    // GnosisSafeStorage.sol defines singleton address at the first position (-> index 0)
    bytes memory singletonValue = StorageAccessible(address(this))
        .getStorageAt(0, 1);
    require(
        bytes32(singletonValue) ==
            bytes32(uint256(uint160(gnosisSafeSingleton))),
        "Proxy has unsupported singleton"
    );

    _storeGuardAndModule();
}
```

</details>

### Events

The PWN Safe Factory contract defines one event and no custom errors.

```solidity
event PWNSafeDeployed(address indexed safe);
```

<details>

<summary><code>PWNSafeDeployed</code></summary>

PWNSafeDeployed event is emitted when a new PWN Safe Proxy is deployed by the [`deployProxy`](#deployproxy) function.&#x20;

This event has one parameter:

* `address indexed`**`safe`** - Address of the newly deployed proxy contract

</details>
