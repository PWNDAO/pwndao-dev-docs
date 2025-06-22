# MultiToken

## 1. Summary

MultiToken is a solidity library unifying [ERC20](https://eips.ethereum.org/EIPS/eip-20), [ERC721](https://eips.ethereum.org/EIPS/eip-721) & [ERC1155](https://eips.ethereum.org/EIPS/eip-1155) transfers by wrapping them into a MultiToken Asset struct.

:::info
MultiToken supports [CryptoKitties](https://opensea.io/collection/cryptokitties).
:::

## 2. Important links

* [**NPM package**](https://www.npmjs.com/package/@pwnfinance/multitoken)
* [**GitHub**](https://github.com/PWNFinance/MultiToken)

## 3. Contract Details

* _MultiToken.sol_ contract is written in Solidity version 0.8.0 but can be compiled with any Solidity compiler version 0.8.\*

### Features

The library defines a token asset as a struct of token identifiers. **It wraps transfer, allowance and balance check calls of the following token standards:**

* [ERC20](https://eips.ethereum.org/EIPS/eip-20)
* [ERC721](https://eips.ethereum.org/EIPS/eip-721)
* [ERC1155](https://eips.ethereum.org/EIPS/eip-1155)

Unifying the function calls used within the PWN context so we don't have to worry about handling these token standards individually.

### Functions

<details>

<summary><code>transferAssetFrom</code></summary>

#### Overview

Function for transfer calls on various token interfaces.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`source`** - Source address
* `address`**`dest`** - Destination address

#### Implementation

```solidity
function transferAssetFrom(Asset memory asset, address source, address dest) internal {
    _transferAssetFrom(asset, source, dest, false);
}
```

</details>

<details>

<summary><code>safeTransferAssetFrom</code></summary>

#### Overview

Function for safe transfer calls on various token interfaces.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`source`** - Source address
* `address`**`dest`** - Destination address

#### Implementation

```solidity
function safeTransferAssetFrom(Asset memory asset, address source, address dest) internal {
    _transferAssetFrom(asset, source, dest, true);
}
```

</details>

<details>

<summary><code>getTransferAmount</code></summary>

#### Overview

Getter function to get the maximum amount of the supplied asset that can be transferred.&#x20;

This function takes one argument:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token

#### Implementation

```solidity
function getTransferAmount(Asset memory asset) internal pure returns (uint256) {
    if (asset.category == Category.ERC20)
        return asset.amount;
    else if (asset.category == Category.ERC1155 && asset.amount > 0)
        return asset.amount;
    else // Return 1 for ERC721, CryptoKitties and ERC1155 used as NFTs (amount = 0)
        return 1;
}
```

</details>

<details>

<summary><code>transferAssetFromCalldata</code></summary>

#### Overview

Function for transfer calls on various token interfaces that can also handle calldata.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`source`** - Account/address that should initiate the transfer
* `address`**`dest`** - Destination address
* `bool`**`fromSender`** - Boolean defining if `msg.sender` is the same as `source`

#### Implementation

```solidity
function transferAssetFromCalldata(Asset memory asset, address source, address dest, bool fromSender) pure internal returns (bytes memory) {
    return _transferAssetFromCalldata(asset, source, dest, fromSender, false);
}
```

</details>

<details>

<summary><code>safeTransferAssetFromCalldata</code></summary>

#### Overview

Function for safe transfer calls on various token interfaces that can also handle calldata.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`source`** - Account/address that should initiate the transfer
* `address`**`dest`** - Destination address
* `bool`**`fromSender`** - Boolean defining if `msg.sender` is the same as `source`

#### Implementation

```solidity
function safeTransferAssetFromCalldata(Asset memory asset, address source, address dest, bool fromSender) pure internal returns (bytes memory) {
    return _transferAssetFromCalldata(asset, source, dest, fromSender, true);
}
```

</details>

<details>

<summary><code>permit</code></summary>

#### Overview

Wrapper function to allow grating approval using permit signature for ERC-20 (see [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612)).

This function takes four arguments:

* `Asset memory`**`asset`** -  [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`owner`** - Address that signed the permit
* `address`**`spender`** - Address that is getting the approval to transfer the **`_asset`**
* `bytes memory`**`permitData`** - The Permit data itself. The data must include the permit deadline (`uint256`) and permit signature. The signature can be standard (`65 bytes`) or compact (`64 bytes`) defined in [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098). Lastly, the deadline and signature should be pack encoded together.

#### Implementation

```solidity
function permit(Asset memory asset, address owner, address spender, bytes memory permitData) internal {
    if (asset.category == Category.ERC20) {

        // Parse deadline and permit signature parameters
        uint256 deadline;
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Parsing signature parameters used from OpenZeppelins ECDSA library
        // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/83277ff916ac4f58fec072b8f28a252c1245c2f1/contracts/utils/cryptography/ECDSA.sol

        // Deadline (32 bytes) + standard signature data (65 bytes) -> 97 bytes
        if (permitData.length == 97) {
            assembly {
                deadline := mload(add(permitData, 0x20))
                r := mload(add(permitData, 0x40))
                s := mload(add(permitData, 0x60))
                v := byte(0, mload(add(permitData, 0x80)))
            }
        }
        // Deadline (32 bytes) + compact signature data (64 bytes) -> 96 bytes
        else if (permitData.length == 96) {
            bytes32 vs;

            assembly {
                deadline := mload(add(permitData, 0x20))
                r := mload(add(permitData, 0x40))
                vs := mload(add(permitData, 0x60))
            }

            s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
            v = uint8((uint256(vs) >> 255) + 27);
        } else {
            revert("MultiToken::Permit: Invalid permit length");
        }

        // Call permit with parsed parameters
        IERC20Permit(asset.assetAddress).permit(owner, spender, asset.amount, deadline, v, r, s);

    } else {
        // Currently supporting only ERC20 signed approvals via ERC2612
        revert("MultiToken::Permit: Unsupported category");
    }
}
```

</details>

<details>

<summary><code>balanceOf</code></summary>

#### Overview

Function for checking balances on various token interfaces.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`target`** - Target address to be checked

#### Implementation

```solidity
function balanceOf(Asset memory asset, address target) internal view returns (uint256) {
    if (asset.category == Category.ERC20) {
        return IERC20(asset.assetAddress).balanceOf(target);

    } else if (asset.category == Category.ERC721) {
        return IERC721(asset.assetAddress).ownerOf(asset.id) == target ? 1 : 0;

    } else if (asset.category == Category.ERC1155) {
        return IERC1155(asset.assetAddress).balanceOf(target, asset.id);

    } else if (asset.category == Category.CryptoKitties) {
        return ICryptoKitties(asset.assetAddress).ownerOf(asset.id) == target ? 1 : 0;

    } else {
        revert("MultiToken: Unsupported category");
    }
}
```

</details>

<details>

<summary><code>approveAsset</code></summary>

#### Overview

Function for approving calls on various token interfaces.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token
* `address`**`target`** - Target address to be checked

#### Implementation

```solidity
function approveAsset(Asset memory asset, address target) internal {
    if (asset.category == Category.ERC20) {
        IERC20(asset.assetAddress).safeApprove(target, asset.amount);

    } else if (asset.category == Category.ERC721) {
        IERC721(asset.assetAddress).approve(target, asset.id);

    } else if (asset.category == Category.ERC1155) {
        IERC1155(asset.assetAddress).setApprovalForAll(target, true);

    } else if (asset.category == Category.CryptoKitties) {
        ICryptoKitties(asset.assetAddress).approve(target, asset.id);

    } else {
        revert("MultiToken: Unsupported category");
    }
}
```

</details>

<details>

<summary><code>isValid</code></summary>

#### Overview

A view function to check the ID and amount values are valid for the asset category in the provided asset.&#x20;

This function takes one argument:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining all necessary context of a token

#### Implementation

```solidity
function isValid(Asset memory asset) internal view returns (bool) {
    if (asset.category == Category.ERC20) {
        // Check format
        if (asset.id != 0)
            return false;

        // ERC20 has optional ERC165 implementation
        if (asset.assetAddress.supportsERC165()) {
            // If ERC20 implements ERC165, it has to return true for its interface id
            return asset.assetAddress.supportsERC165InterfaceUnchecked(ERC20_INTERFACE_ID);

        } else {
            // In case token doesn't implement ERC165, its safe to assume that provided category is correct,
            // because any other category have to implement ERC165.

            // Check that asset address is contract
            // Tip: asset address will return code length 0, if this code is called from the asset constructor
            return asset.assetAddress.code.length > 0;
        }

    } else if (asset.category == Category.ERC721) {
        // Check format
        if (asset.amount != 0)
            return false;

        // Check it's ERC721 via ERC165
        return asset.assetAddress.supportsInterface(ERC721_INTERFACE_ID);

    } else if (asset.category == Category.ERC1155) {
        // Check it's ERC1155 via ERC165
        return asset.assetAddress.supportsInterface(ERC1155_INTERFACE_ID);

    } else if (asset.category == Category.CryptoKitties) {
        // Check format
        if (asset.amount != 0)
            return false;

        // Check it's CryptoKitties via ERC165
        return asset.assetAddress.supportsInterface(CRYPTO_KITTIES_INTERFACE_ID);

    } else {
        revert("MultiToken: Unsupported category");
    }
}
```

</details>

<details>

<summary><code>isSameAs</code></summary>

#### Overview

A view function to compare two assets (ignoring their amounts). Returns _true_ if the assets are the same.&#x20;

This function takes two arguments:

* `Asset memory`**`asset`** - [Asset](multitoken.md#asset-struct) struct defining the first token to compare
* `Asset memory`**`otherAsset`** - [Asset](multitoken.md#asset-struct) struct defining the second token to compare

#### Implementation

```solidity
function isSameAs(Asset memory asset, Asset memory otherAsset) internal pure returns (bool) {
    return
        asset.category == otherAsset.category &&
        asset.assetAddress == otherAsset.assetAddress &&
        asset.id == otherAsset.id;
}
```

</details>

### Asset struct

Each asset is defined by the **`Asset`** struct and has the following properties:

<table><thead><tr><th width="273.09421454876235">Type</th><th width="164.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><a data-footnote-ref href="#user-content-fn-1"><code>MultiToken.Category</code></a></td><td><code>category</code></td><td>Corresponding asset category</td></tr><tr><td><code>address</code></td><td><code>assetAddress</code></td><td>Address of the token contract defining the asset</td></tr><tr><td><code>uint256</code></td><td><code>id</code></td><td>TokenID of an NFT or 0</td></tr><tr><td><code>uint256</code></td><td><code>amount</code></td><td>Amount of fungible tokens or 0 -> 1</td></tr></tbody></table>

### Events

The MultiToken library does not define any events or custom errors.&#x20;

[^1]: A **category** is defined as an [enum](https://docs.soliditylang.org/en/v0.8.12/structure-of-a-contract.html?highlight=enum#enum-types) and can have values `ERC20`, `ERC721` or `ERC1155`.
