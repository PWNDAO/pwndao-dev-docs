# Epoch Clock

## 1. Summary

The PWN Epoch Clock provides the current epoch number in the PWN DAO context. One epoch is 4 weeks long and the epoch numbering starts with 1. `INITIAL_EPOCH_TIMESTAMP` is set at the deployment time and can be used to sync the clock between different chains.

## 2. Important links

* [**Source code**](https://github.com/PWNDAO/pwn_dao/blob/main/src/PWNEpochClock.sol)
* [**ABI**](/assets/PWNEpochClock.json)

## 3. Contract details

* _PWNEpochClock.sol_ is written in Solidity version 0.8.25

### Features

* Get current epoch
* Set epoch start at deployment

### Inherited contracts, implemented Interfaces and ERCs

* [IPWNEpochClock](https://github.com/PWNDAO/pwn_dao/blob/main/src/interfaces/IPWNEpochClock.sol)

### Functions

<details>

<summary><code>currentEpoch</code></summary>

#### Overview

Function to get the current epoch number. If this function is called before the clock start, `0` is returned.

This function doesn't take any arguments.

#### Implementation

```solidity
function currentEpoch() external view returns (uint16) {
    // timestamps prior to `INITIAL_EPOCH_TIMESTAMP` are considered to be in epoch 0
    if (block.timestamp < INITIAL_EPOCH_TIMESTAMP) {
        return 0;
    }
    // first epoch is 1
    uint256 epoch = (block.timestamp - INITIAL_EPOCH_TIMESTAMP) / SECONDS_IN_EPOCH + 1;
    return uint16(epoch); // safe cast for the next 5041 years after deployment
}
```

</details>
