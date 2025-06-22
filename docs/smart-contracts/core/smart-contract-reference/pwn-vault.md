# PWN Vault

## 1. Summary

Loan contracts in the PWN Protocol inherit the PWNVault.sol contract for transferring and managing assets. Enables usage of PWN pool adapters to utilise assets in other contracts. This is not a standalone contract.&#x20;

## 2. Important links

* [**View on GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/vault/PWNVault.sol)

## 3. Contract details

* _PWNVault.sol_ is written in Solidity version 0.8.16

### Features

* Transferring assets
* Utilising assets from external pools
* Set Vault allowance for an asset

### Inherited contracts, implemented Interfaces and ERCs

* [IERC721Receiver](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721Receiver.sol)
* [IERC1155Receiver](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/IERC1155Receiver.sol)
* [ERC-165](https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified%5BEIP%20section%5D)

### Internal Functions

<details>

<summary><code>_pull</code></summary>

#### Overview

Takes a supplied asset and pulls it into the vault from the origin.

**This function assumes a prior token approval was made to the vault address.**

This function takes two arguments supplied by the caller:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`origin`**

#### Implementation

```solidity
function _pull(MultiToken.Asset memory asset, address origin) internal {
    uint256 originalBalance = asset.balanceOf(address(this));

    asset.transferAssetFrom(origin, address(this));
    _checkTransfer(asset, originalBalance, address(this));

    emit VaultPull(asset, origin);
}
```

</details>

<details>

<summary><code>_push</code></summary>

#### Overview

Pushes a supplied asset from the vault to the beneficiary.

This function takes two arguments supplied by the caller:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`beneficiary`**

#### Implementation

```solidity
function _push(MultiToken.Asset memory asset, address beneficiary) internal {
    uint256 originalBalance = asset.balanceOf(beneficiary);

    asset.safeTransferAssetFrom(address(this), beneficiary);
    _checkTransfer(asset, originalBalance, beneficiary);

    emit VaultPush(asset, beneficiary);
}
```

</details>

<details>

<summary><code>_pushFrom</code></summary>

#### Overview

Pushes a supplied asset from the origin to the beneficiary.

**This function assumes a prior token approval was made to the vault address.**

This function takes three arguments supplied by the caller:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`origin`**
* `address indexed`**`beneficiary`**

#### Implementation

```solidity
function _pushFrom(MultiToken.Asset memory asset, address origin, address beneficiary) internal {
    uint256 originalBalance = asset.balanceOf(beneficiary);

    asset.safeTransferAssetFrom(origin, beneficiary);
    _checkTransfer(asset, originalBalance, beneficiary);

    emit VaultPushFrom(asset, origin, beneficiary);
}
```

</details>

<details>

<summary><code>_tryPermit</code></summary>

#### Overview

Try to execute a permit for an ERC20 token. If the permit execution fails, the function will not revert.

This function takes one argument:

* `Permit memory`**`permit`** - The permit data

#### Implementation

```solidity
function _tryPermit(Permit memory permit) internal {
    if (permit.asset != address(0)) {
        try IERC20Permit(permit.asset).permit({
            owner: permit.owner,
            spender: address(this),
            value: permit.amount,
            deadline: permit.deadline,
            v: permit.v,
            r: permit.r,
            s: permit.s
        }) {} catch {
            // Note: Permit execution can be frontrun, so we don't revert on failure.
        }
    }
}
```

</details>

<details>

<summary><code>_withdrawFromPool</code></summary>

#### Overview

This function withdraws an asset from a pool to a owner.

This function takes four arguments:

* `MultiToken.Asset memory`**`asset`** - The withdrawn asset (see [MultiToken](../../libraries/multitoken.md))
* `IPoolAdapter`**`poolAdapter`** - An address of a pool adapter
* `address`**`pool`** - An address of a pool
* `address`**`owner`** - An address on which behalf the assets are withdrawn

#### Implementation

```solidity
function _withdrawFromPool(MultiToken.Asset memory asset, IPoolAdapter poolAdapter, address pool, address owner) internal {
    uint256 originalBalance = asset.balanceOf(owner);

    poolAdapter.withdraw(pool, owner, asset.assetAddress, asset.amount);
    _checkTransfer(asset, originalBalance, owner, true);

    emit PoolWithdraw(asset, address(poolAdapter), pool, owner);
}
```

</details>

<details>

<summary><code>_supplyToPool</code></summary>

#### Overview

This function supplies an asset from an owner to a pool.

This function takes four arguments:

* `MultiToken.Asset memory`**`asset`** - The supplied asset (see [MultiToken](../../libraries/multitoken.md))
* `IPoolAdapter`**`poolAdapter`** - An address of a pool adapter
* `address`**`pool`** - An address of a pool
* `address`**`owner`** - An address on which behalf the assets are supplied

#### Implementation

```solidity
function _supplyToPool(MultiToken.Asset memory asset, IPoolAdapter poolAdapter, address pool, address owner) internal {
    uint256 originalBalance = asset.balanceOf(address(this));

    asset.transferAssetFrom(address(this), address(poolAdapter));
    poolAdapter.supply(pool, owner, asset.assetAddress, asset.amount);
    _checkTransfer(asset, originalBalance, address(this), false);

    // Note: Assuming pool will revert supply transaction if it fails.

    emit PoolSupply(asset, address(poolAdapter), pool, owner);
}
```

</details>

<details>

<summary><strong><code>_checkTransfer</code></strong></summary>

#### Overview

Function to verify a complete transfer.

This function takes four arguments:

* `MultiToken.Asset memory`**`asset`** - The asset to check (see [MultiToken](../../libraries/multitoken.md))
* `uint256`**`originalBalance`** - The original balance
* `address`**`checkedAddress`** - The address to check
* `bool`**`checkIncreasingBalance`** - A flag to set the check for either balance decrease or increase

#### Implementation

```solidity
function _checkTransfer(
    MultiToken.Asset memory asset,
    uint256 originalBalance,
    address checkedAddress,
    bool checkIncreasingBalance
) private view {
    uint256 expectedBalance = checkIncreasingBalance
        ? originalBalance + asset.getTransferAmount()
        : originalBalance - asset.getTransferAmount();

    if (expectedBalance != asset.balanceOf(checkedAddress)) {
        revert IncompleteTransfer();
    }
}
```

</details>

### Events

The PWN Vault contract defines four events and two errors.

```solidity
event VaultPull(MultiToken.Asset asset, address indexed origin);
event VaultPush(MultiToken.Asset asset, address indexed beneficiary);
event VaultPushFrom(MultiToken.Asset asset, address indexed origin, address indexed beneficiary);
event PoolWithdraw(MultiToken.Asset asset, address indexed poolAdapter, address indexed pool, address indexed owner);
event PoolSupply(MultiToken.Asset asset, address indexed poolAdapter, address indexed pool, address indexed owner);
```

<details>

<summary><code>VaultPull</code></summary>

VaultPull event is emitted when a transfer happens from the `origin` to the vault.&#x20;

This event has two parameters:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`origin`**

</details>

<details>

<summary><code>VaultPush</code></summary>

VaultPush event is emitted when a transfer happens from the vault to the `beneficiary`.

This event has two parameters:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`beneficiary`**

</details>

<details>

<summary><code>VaultPushFrom</code></summary>

VaultPushFrom event is emitted when a transfer happens from the `origin` to the `beneficiary`.&#x20;

This event has three parameters:

* `MultiToken.Asset`**`asset`** - The transferred asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`origin`**
* `address indexed`**`beneficiary`**

</details>

<details>

<summary><code>PoolWithdraw</code></summary>

PoolWithdraw event is emitted when an asset is withdrawn from a pool to an `owner` address.

This event has four parameters:

* `MultiToken.Asset`**`asset`** - The withdrawn asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`poolAdapter`**
* `address indexed`**`pool`**
* `address indexed`**`owner`**

</details>

<details>

<summary><code>PoolSupply</code></summary>

PoolSupply event is emitted when an asset is supplied to a pool from a vault.

This event has four parameters:

* `MultiToken.Asset`**`asset`** - The supplied asset (see [MultiToken](../../libraries/multitoken.md))
* `address indexed`**`poolAdapter`**
* `address indexed`**`pool`**
* `address indexed`**`owner`**

</details>

### Errors

```solidity
error UnsupportedTransferFunction();
error IncompleteTransfer();
```

<details>

<summary><code>UnsupportedTransferFunction</code></summary>

UnsupportedTransferFunction error is thrown when the Vault receives an asset that is not transferred by the Vault itself.

</details>

<details>

<summary><code>IncompleteTransfer</code></summary>

IncompleteTransfer error is thrown when an asset transfer is incomplete.

</details>
