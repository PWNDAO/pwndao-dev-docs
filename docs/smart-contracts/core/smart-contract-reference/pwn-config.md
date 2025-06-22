# PWN Config

## 1. Summary

The PWNConfig.sol contract stores the core parameters of the protocol. The parameters are the following:

* Fee size
* Fee collector address
* [Metadata URI](https://docs.opensea.io/docs/metadata-standards)

To prevent any attacks there is a hard cap of 10 % on the fee size.

The config contract is meant to be used behind a proxy contract, which enables the addition and removal of parameters as the protocol evolves. The proxy implementation used is the [TransparentUpgradableProxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent_proxy) from Open Zeppelin.

## 2. Important links

* [**Source code**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/config/PWNConfig.sol)
* [**ABI**](/assets/PWNConfig%20(2).json)

## 3. Contract details

* _PWNConfig.sol_ is written in Solidity version 0.8.16

### Features

* Stores PWN Protocol parameters

### Inherited contracts, implemented Interfaces and ERCs

* [Ownable2Step](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable2Step)
* [Initializable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable)

### Functions

<details>

<summary><code>setFee</code></summary>

#### Overview

&#x20;Updates the fee parameter of the PWN Protocol.&#x20;

This function takes one argument supplied by the owner:

* `uint16`**`_fee`** - New fee in basis points

#### Implementation

```solidity
function setFee(uint16 _fee) external onlyOwner {
    _setFee(_fee);
}
```

</details>

<details>

<summary><code>setFeeCollector</code></summary>

#### Overview

Updates the address that collects the PWN Protocol fees.

This function takes one argument supplied by the owner:

* `address`**`_feeCollector`**

#### Implementation

```solidity
function setFeeCollector(address _feeCollector) external onlyOwner {
    _setFeeCollector(_feeCollector);
}
```

</details>

<details>

<summary><code>setLoanMetadataUri</code></summary>

#### Overview

Updates the metadata URI for a loan contract.

This function takes two arguments supplied by the owner:

* `address`**`loanContract`** - Address of the loan contract for which the URI is updated
* `string memory`**`metadataUri`** - New URI

#### Implementation

```solidity
function setLoanMetadataUri(address loanContract, string memory metadataUri) external onlyOwner {
    loanMetadataUri[loanContract] = metadataUri;
    emit LoanMetadataUriUpdated(loanContract, metadataUri);
}
```

</details>

<details>

<summary><strong><code>setDefaultLOANMetadataUri</code></strong></summary>

#### Overview

Updates the default metadata URI for loan contracts.

This function takes one argument supplied by the owner:

* `string memory`**`metadataUri`** - New URI

#### Implementation

```solidity
function setDefaultLOANMetadataUri(string memory metadataUri) external onlyOwner {
    _loanMetadataUri[address(0)] = metadataUri;
    emit DefaultLOANMetadataUriUpdated(metadataUri);
}
```

</details>

<details>

<summary><strong><code>registerStateFingerprintComputer</code></strong></summary>

#### Overview

Registers a state fingerprint computer for a given asset.

This function takes two arguments supplied by the owner:

* `address`**`asset`** - The asset for which the computer is registered
* `address`**`computer`** - The computer to be registered. Use a zero address to remove a computer

#### Implementation

```solidity
function registerStateFingerprintComputer(address asset, address computer) external onlyOwner {
    if (computer != address(0))
        if (!IStateFingerpringComputer(computer).supportsToken(asset))
            revert InvalidComputerContract({ computer: computer, asset: asset });

    _sfComputerRegistry[asset] = computer;
}
```

</details>

<details>

<summary><strong><code>registerPoolAdapter</code></strong></summary>

#### Overview

Registers a pool adapter for a given pool.

This function takes two arguments supplied by the owner:

* `address`**`pool`** - The pool for which the adapter is registered
* `address`**`adapter`** - The adapter to be registered

#### Implementation

```solidity
function registerPoolAdapter(address pool, address adapter) external onlyOwner {
    _poolAdapterRegistry[pool] = adapter;
}
```

</details>

### View Functions

<details>

<summary><code>loanMetadataUri</code></summary>

#### Overview

Returns a LOAN token metadata URI based on a loan contract that minted the token.

This function takes one argument supplied by the caller:

* `address`**`loanContract`** - Address of a loan contract

#### Implementation

```solidity
function loanMetadataUri(address loanContract) external view returns (string memory uri) {
    uri = _loanMetadataUri[loanContract];
    // If there is no metadata uri for a loan contract, use default metadata uri.
    if (bytes(uri).length == 0)
        uri = _loanMetadataUri[address(0)];
}
```

</details>

<details>

<summary><code>getStateFingerprintComputer</code></summary>

#### Overview

Returns the state fingerprint computer for a given asset.

This function takes one argument supplied by the caller:

* `address`**`asset`** - Address of the asset for which the computer is requested

#### Implementation

```solidity
function getStateFingerprintComputer(address asset) external view returns (IStateFingerpringComputer) {
    return IStateFingerpringComputer(_sfComputerRegistry[asset]);
}
```

</details>

<details>

<summary><code>getPoolAdapter</code></summary>

#### Overview

Returns the pool adapter for a given pool.

This function takes one argument supplied by the caller:

* `address`**`pool`** - Address of the pool for which the adapter is requested

#### Implementation

```solidity
function getPoolAdapter(address pool) external view returns (IPoolAdapter) {
    return IPoolAdapter(_poolAdapterRegistry[pool]);
}
```

</details>

### Events

The PWN Config contract defines four events and four errors.

```solidity
event FeeUpdated(uint16 oldFee, uint16 newFee);
event FeeCollectorUpdated(address oldFeeCollector, address newFeeCollector);
event LOANMetadataUriUpdated(address indexed loanContract, string newUri);
event DefaultLOANMetadataUriUpdated(string newUri);
```

<details>

<summary><code>FeeUpdated</code></summary>

FeeUpdated event is emitted when the protocol fee is updated. Fees are represented in basis points.

This event has two parameters:

* `uint16`**`oldFee`**
* `uint16`**`newFee`**

</details>

<details>

<summary><code>FeeCollectorUpdated</code></summary>

FeeCollectorUpdated event is emitted when the protocol fees collector address is updated.

This event has two parameters:

* `address`**`oldFeeCollector`**
* `address`**`newFeeCollector`**

</details>

<details>

<summary><code>LoanMetadataUriUpdated</code></summary>

LoanMetadataUriUpdated event is emitted when a metadata URI for a loan contract is updated.

This event has two parameters:

* `address indexed`**`loanContract`** - Address of the loan contract for which the URI is updated
* `string`**`newUri`**

</details>

<details>

<summary><code>DefaultLOANMetadataUriUpdated</code></summary>

DefaultLOANMetadataUriUpdated event is emitted when the default metadata URI for loan contracts is updated.

This event has one parameter:

* `string`**`newUri`**

</details>

### Errors

```solidity
error InvalidComputerContract(address computer, address asset);
error InvalidFeeValue(uint256 fee, uint256 limit);
error ZeroFeeCollector();
error ZeroLoanContract();
```

<details>

<summary><strong><code>InvalidComputerContract</code></strong></summary>

InvalidComputerContract error is thrown when registering a computer which does not support the asset it is registered for.

This error has two parameters:

* `address`**`computer`**
* `address`**`asset`**

</details>

<details>

<summary><strong><code>InvalidFeeValue</code></strong></summary>

InvalidFeeValue error is thrown when trying to set a fee value higher than `MAX_FEE`.

This error has two parameters:

* `uint256`**`fee`**
* `uint256`**`limit`**

</details>

<details>

<summary><strong><code>ZeroFeeCollector</code></strong></summary>

ZeroFeeCollector error is thrown when trying to set a fee collector to zero address.

</details>

<details>

<summary><strong><code>ZeroLoanContract</code></strong></summary>

ZeroLoanContract error is thrown when trying to set a LOAN token metadata uri for zero address loan contract.

</details>
