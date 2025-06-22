# PWN Hub

## 1. Summary

The PWNHub.sol contract stores tags for each contract in the protocol and therefore **defines what contracts are a valid part of the protocol**.

## 2. Important links

* [**Source code**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/hub/PWNHub.sol)
* [**ABI**](/assets/PWNHub%20(1).json)

## 3. Contract details

* _PWNHub.sol_ is written in Solidity version 0.8.16

### Features

* Stores tags
* Sets tags
* Provides view functions to read tags

### Inherited contracts, implemented Interfaces and ERCs

* [Ownable2Step](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable2Step)

### Functions

<details>

<summary><code>setTag</code></summary>

#### Overview

An owner of the PWN Hub can add and remove tag to/from different address. This way new contracts to the protocol are added and old ones are deprecated.&#x20;

This function takes three arguments supplied by the owner:

* `address`**`_address`** - Address to which a tag is set
* `bytes32`**`tag`** - Tag that is set to the address
* `bool`**`_hasTag`** - Boolean determining if the tag will be added or removed

#### Implementation

```solidity
function setTag(address _address, bytes32 tag, bool _hasTag) public onlyOwner {
    tags[_address][tag] = _hasTag;
    emit TagSet(_address, tag, _hasTag);
}
```

</details>

<details>

<summary><code>setTags</code></summary>

#### Overview

This function allows performing `setTag` on multiple addresses and tags at the same time.  Only the addition or removal of tags can be done in one call.&#x20;

This function takes three arguments supplied by the owner:

* `address[] memory`**`_addresses`** - Addresses to which a corresponding tag is set
* `bytes32[] memory`**`tags`** - Tags that are set to the corresponding addresses
* `bool`**`_hasTag`** - Boolean determining if the tags will be added or removed

#### Implementation

```solidity
function setTags(address[] memory _addresses, bytes32[] memory _tags, bool _hasTag) external onlyOwner {
    if (_addresses.length != _tags.length)
        revert InvalidInputData();

    uint256 length = _tags.length;
    for (uint256 i; i < length;) {
        setTag(_addresses[i], _tags[i], _hasTag);
        unchecked { ++i; }
    }
}
```

</details>

### View Functions

<details>

<summary><code>hasTag</code></summary>

#### Overview

This function checks if an address has a supplied tag set and returns a boolean.&#x20;

This function takes two arguments supplied by the caller:

* `address`**`_address`** - Address to check
* `bytes32`**`tag`** - Tag to check

#### Implementation

```solidity
function hasTag(address _address, bytes32 tag) external view returns (bool) {
    return tags[_address][tag];
}
```

</details>

### Events

The PWN Hub contract defines one event and no custom errors.

```solidity
event TagSet(address indexed _address, bytes32 indexed tag, bool hasTag);
```

<details>

<summary><strong><code>TagSet</code></strong></summary>

TagSet event is emitted when a tag is set for an address.

This event has three parameters:

* `address indexed`**`_address`** - Address the tag is set to
* `bytes32 indexed`**`tag`** - Tag that has been set to the address
* `bool`**`hasTag`** - Boolean determining if the tag has been set or unset

</details>
