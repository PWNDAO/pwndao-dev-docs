# Token Bundler

## 1. Summary

The contract enables **bundling ERC20, ERC721, and/or ERC1155 tokens into a single ERC1155 token** (the Bundle token).

## 2. Important links

* [**GitHub**](https://github.com/PWNFinance/TokenBundler/tree/master)
* [**JSON ABI**](/assets/TokenBundler.json)

## 3. Contract Details

* _TokenBundler.sol_ contract is written in Solidity version 0.8.16

### Features

The owner of the bundle token has rights to:

* Transferring ownership of the bundle token to another address
* Unwrap the entire bundle resulting in burning the bundle token and gaining ownership over the wrapped tokens

### Inherited Contracts

Token Bundler inherits other contracts and implements certain interfaces. Please see their reference for a complete overview.

* [**Ownable**](https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable)
* [**ERC1155**](https://eips.ethereum.org/EIPS/eip-1155)
* [**IERC1155Receiver**](https://docs.openzeppelin.com/contracts/4.x/api/token/erc1155#IERC1155Receiver)
* [**IERC721Receiver**](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721#IERC721Receiver)
* [**ITokenBundler**](https://github.com/PWNFinance/TokenBundler/blob/master/src/ITokenBundler.sol)

### Functions

<details>

<summary><code>create</code></summary>

#### Overview

This function mints a bundle token and transfers assets to the Bundler contract.

<mark style={{color: 'yellow'}}>Make sure to approve all bundled assets towards the Token Bundler contract before calling this function.</mark>

This function takes one argument:

* `MultiToken.Asset[] memory`**`_assets`** - List of assets to include in a bundle

See [MultiToken](../libraries/multitoken.md) for more information about the argument type.

The function returns the ID of the created bundle.

#### Implementation

```solidity
function create(MultiToken.Asset[] memory _assets) override external returns (uint256 bundleId) {
    uint256 length = _assets.length;
    require(length > 0, "Need to bundle at least one asset");
    require(length <= type(uint256).max - _nonce, "Bundler out of capacity");

    bundleId = ++_id;
    uint256 _bundleNonce = _nonce;
    unchecked { _nonce += length; }

    for (uint i; i < length;) {
        unchecked { ++_bundleNonce; }

        _tokens[_bundleNonce] = _assets[i];
        _bundles[bundleId].push(_bundleNonce);

        _assets[i].transferAssetFrom(msg.sender, address(this));

        unchecked { ++i; }
    }

    _mint(msg.sender, bundleId, 1, "");

    emit BundleCreated(bundleId, msg.sender);
}
```

</details>

<details>

<summary><code>unwrap</code></summary>

#### Overview

This function burns the bundle token and transfers assets to the caller.

<mark style={{color: 'green'}}>The caller has to be the bundle owner.</mark>&#x20;

This function takes one argument:

* `uint256`**`_bundleId`** - Bundle id to unwrap

#### Implementation

```solidity
function unwrap(uint256 _bundleId) override external {
    require(balanceOf(msg.sender, _bundleId) == 1, "Sender is not bundle owner");

    uint256[] memory tokenList = _bundles[_bundleId];

    uint256 length = tokenList.length;
    for (uint i; i < length;) {
        _tokens[tokenList[i]].transferAsset(msg.sender);
        delete _tokens[tokenList[i]];

        unchecked { ++i; }
    }

    delete _bundles[_bundleId];

    _burn(msg.sender, _bundleId, 1);

    emit BundleUnwrapped(_bundleId);
}
```

</details>

### View functions

<details>

<summary><strong><code>token</code></strong></summary>

#### **Overview**

Each token has its nonce. This function returns an Asset struct (see [MultiToken](../libraries/multitoken.md#asset-struct)) for a provided token nonce.&#x20;

This function takes one argument:

* `uint265`**`_tokenId`** - Token nonce from the bundle asset list.

#### Implementation

```solidity
function token(uint256 _tokenId) override external view returns (MultiToken.Asset memory) {
    return _tokens[_tokenId];
}
```

</details>

<details>

<summary><code>bundle</code></summary>

#### Overview

Returns an array of asset IDs in a bundle as a `uint256[]`.

This function takes one argument:

* `uint256`**`_bundleId`** - Bundle id

#### Implementation

```solidity
function bundle(uint256 _bundleId) override external view returns (uint256[] memory) {
    return _bundles[_bundleId];
}
```

</details>

<details>

<summary><code>tokensInBundle</code></summary>

#### Overview

Returns an array of assets in a bundle. Each asset is represented as an Asset struct (see [MultiToken](../libraries/multitoken.md#asset-struct)).

This function takes one argument:

* `uint256`**`_bundleId`** - Bundle id

#### Implementation

```solidity
function tokensInBundle(uint256 _bundleId) override external view returns (MultiToken.Asset[] memory) {
    uint256[] memory tokenList = _bundles[_bundleId];
    uint256 length = tokenList.length;

    MultiToken.Asset[] memory tokens = new MultiToken.Asset[](length);

    for (uint256 i; i < length;) {
        tokens[i] = _tokens[tokenList[i]];

        unchecked { ++i; }
    }

    return tokens;
}
```

</details>

### Events

The Token Bundler contract doesn't define any events or custom errors and inherits events from [**ITokenBundler**](https://github.com/PWNFinance/TokenBundler/blob/master/src/ITokenBundler.sol)**,** [**ERC1155**](https://eips.ethereum.org/EIPS/eip-1155)**, and** [**Ownable**](https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable)**.** We will cover events inherited from the [ITokenBunder](https://github.com/PWNFinance/TokenBundler/blob/master/src/ITokenBundler.sol) interface. Please see the reference for [ERC1155](https://eips.ethereum.org/EIPS/eip-1155) and [Ownable](https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable) for a complete overview.&#x20;

```solidity
event BundleCreated(uint256 indexed id, address indexed creator);
event BundleUnwrapped(uint256 indexed id);
```

<details>

<summary><strong><code>BundleCreated</code></strong></summary>

BundleCreated event is emitted when a new bundle is created.

This event has two parameters:

* `uint256 indexed`**`id`** - Id of the bundle
* `address indexed`**`creator`** - Address of the bundle creator

</details>

<details>

<summary><code>BundleUnwrapped</code></summary>

BundleUnwrapped event is emitted when a bundle is unwrapped and burned.

This event has one parameter:

* `uint256 indexed`**`id`** - Id of the unwrapped bundle.&#x20;

</details>
