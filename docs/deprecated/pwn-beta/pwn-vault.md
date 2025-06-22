---
description: Asset storage
---

# PWN Vault

## 1. Summary

PWN Vault is the holder contract for the locked-in collateral and paid back credit. The contract can only be operated through the [PWN](pwn/) (logic) contract.&#x20;

:::warning
All approval of tokens utilized within the PWN context has to be done towards the PWN Vault address - as ultimately it's the contract accessing the tokens.
:::

## 2. Important links

* **Deployment addresses**
  * Mainnet: [**0xb98efe56decceb1bec9faeeaf62500deb0953474**](https://etherscan.io/address/0xb98efe56decceb1bec9faeeaf62500deb0953474)
  * Polygon: [**0xaF0d978275a2e7e3109F8C6307Ffd281774C623E**](https://polygonscan.com/address/0xaF0d978275a2e7e3109F8C6307Ffd281774C623E)
  * Görli: [**0xDBdb041842407c109F65b23eA86D99c1E0D94522**](https://goerli.etherscan.io/address/0xDBdb041842407c109F65b23eA86D99c1E0D94522)
  * Mumbai: [**0x2fd4B676192C701778724408B72e9A29af2eB8c0**](https://mumbai.polygonscan.com/address/0x2fd4B676192C701778724408B72e9A29af2eB8c0)
  * Rinkeby (deprecated): [**0x2f705615E25D705813cC0E29f4225Db0EDB82eCa**](https://rinkeby.etherscan.io/address/0x2f705615E25D705813cC0E29f4225Db0EDB82eCa)
* **Source code**
  * [**GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/contracts/PWNVault.sol)
* **ABI**
  * [**JSON**](https://api.etherscan.io/api?module=contract&action=getabi&address=0xb98efe56decceb1bec9faeeaf62500deb0953474)
  * [**Text**](http://api.etherscan.io/api?module=contract&action=getabi&address=0xb98efe56decceb1bec9faeeaf62500deb0953474&format=raw)

## 3. Contract Details

* _PWNVault.sol_ contract is written in Solidity version 0.8.4

### Functions

The functions described below are important to understand the events the contract emits. **These functions can not be called directly and the contract can only be operated through the** [**PWN**](pwn/) **contract.**&#x20;

### `pull`

Function accessing an asset and pulling it **into** the vault.

:::warning
The function assumes a prior token approval was made with the PWNVault address to be approved.
:::

This function takes two arguments:&#x20;

* `MultiToken.Asset memory`**`_asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address`**`_origin`** - Address from which asset is pulled into the Vault.&#x20;

### `push`

Function pushing an asset **from** the vault, sending to a defined recipient. This function is used for claiming a paid back loan or defaulted collateral.

This function takes two arguments:&#x20;

* `MultiToken.Asset memory`**`_asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address`**`_beneficiary`** - An address of the recipient of the asset -> is set in the PWN logic contract&#x20;

### `pushFrom`

Function pushing an asset **from** a lender, sending it to a borrower.

:::warning
This function assumes prior approval for the asset to be spent by the borrower's address.
:::

This function takes three arguments:

* `MultiToken.Asset memory`**`_asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address`**`_origin`** - An address of the lender who is providing the loan asset
* `address`**`_beneficiary`** - An address of the recipient of the asset -> is set in the PWN logic contract

### Events

PWN Vault contract defines three events and no custom errors.

```solidity
event VaultPull(MultiToken.Asset asset, address indexed origin);
event VaultPush(MultiToken.Asset asset, address indexed beneficiary);
event VaultPushFrom(MultiToken.Asset asset, address indexed origin, address indexed beneficiary);
```

### `VaultPull`

VaultPull event is emitted when the `pull` function is called.&#x20;

This event has two parameters:

* `MultiToken.Asset`**`asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address indexed`**`origin`** - Address from which asset is pulled into the Vault.&#x20;

### `VaultPush`

VaultPush event is emitted when the `push` function is called.&#x20;

This event has two parameters:

* `MultiToken.Asset`**`asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address indexed`**`beneficiary`** - Address to which is the asset pushed (transferred) to. &#x20;

### `VaultPushFrom`

VaultPushFrom event is emitted when the `pushFrom` function is called.&#x20;

This event has three parameters:

* `MultiToken.Asset`**`asset`** - An asset construct (see [MultiToken](../../smart-contracts/libraries/multitoken.md))
* `address indexed`**`origin`** - An address of the lender who is providing the loan asset
* `address indexed`**`beneficiary`** - An address of the recipient of the asset -> is set in the PWN logic contract
