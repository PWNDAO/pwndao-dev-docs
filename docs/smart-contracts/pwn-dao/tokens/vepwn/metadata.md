# Metadata

## 1. Summary

The vePWN Stake Metadata contract is an abstract contract inherited by vePWN. It implements `stakeMetadata` function to get associated metadata about a stake NFT.&#x20;

## 2. Important links

* [**View on GitHub**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNStakeMetadata.sol)

## 3. Contract details

* _VoteEscrowedPWNStakeMetadata.sol_ is written in Solidity version 0.8.25

### Features

* Provides metadata for staked NFT

### Inherited contracts, implemented Interfaces and ERCs

* [VoteEscrowedPWNBase](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNBase.sol)
* [IStakedPWNSupplyManager](https://github.com/PWNDAO/pwn_dao/blob/main/src/interfaces/IStakedPWNSupplyManager.sol)

### Functions

<details>

<summary><code>stakeMetadata</code></summary>

#### Overview

Function to get associated metadata about a specific stake.&#x20;

Checkout [`MetadataAttributes`](metadata.md#metadataattributes-struct) struct definition below to learn more about the `attributes` field in the json response returned by this function.

This function takes one argument:

* `uint256`**`stakeId`**

#### Implementation

```solidity
function stakeMetadata(uint256 stakeId) external view returns (string memory) {
    string memory json = string.concat(
        '{"name":', _makeName(stakeId), ',',
        '"external_url":', _makeExternalUrl(stakeId), ',',
        '"image":', _makeApiUriWith(stakeId, "thumbnail"), ',',
        '"animation_url":', _makeApiUriWith(stakeId, "animation"), ',',
        '"attributes":', _makeAttributes(stakeId), ',',
        '"description":', _makeDescription(), '}'
    );

    return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
}
```

</details>

### `MetadataAttributes` Struct

```solidity
struct MetadataAttributes {
    StakedAmount stakedAmount;
    uint256 stakedAmountFormatted;
    uint256 currentPower;
    uint256 initialTimestamp;
    uint256 lockUpDuration;
    uint256 unlockTimestamp;
    string multiplier;
    address stakeOwner;
    PowerChange[] powerChanges;
}
```

### `PowerChange` Struct

```solidity
struct PowerChange {
    uint256 timestamp;
    uint256 power;
    string multiplier;
}
```

### `StakedAmount` Struct

```solidity
struct StakedAmount {
    uint256 amount;
    uint256 decimals;
    address pwnTokenAddress;
}
```
