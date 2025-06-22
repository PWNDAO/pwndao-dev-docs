# Power

## 1. Summary

The vePWN Power contract provides computation functions for voting power in PWN DAO. This contract is inherited by vePWN.&#x20;

## 2. Important links

* [**View on GitHub**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNPower.sol)

## 3. Contract details

* _VoteEscrowedPWNPower.sol_ is written in Solidity version 0.8.25

### Features

* Calculate voting power for stakers
* Calculate total voting power for an epoch(s)
* Get all stake IDs of a staker in given epoch

### Inherited contracts, implemented Interfaces and ERCs

* [VoteEscrowedPWNBase](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNBase.sol)

### Functions

<details>

<summary><code>stakePowers(uint256 initialEpoch, uint256 amount, uint256 lockUpEpochs)</code></summary>

#### Overview

Function to compute powers in epochs for given stake parameters.

This function takes three arguments:

* `uint256`**`initialEpoch`** - initial epoch of the stake power
* `uint256`**`amount`** - amount of PWN tokens staked
* `uint256`**`lockUpEpochs`** - number of epochs the stake is locked up for

#### Implementation

```solidity
function stakePowers(uint256 initialEpoch, uint256 amount, uint256 lockUpEpochs)
    external
    pure
    returns (EpochPower[] memory powers)
{
    if (amount < 100 || amount % 100 > 0 || amount > type(uint88).max) {
        revert Error.InvalidAmount();
    }
    if (lockUpEpochs < 1 || lockUpEpochs > EPOCHS_IN_YEAR * 10) {
        revert Error.InvalidLockUpPeriod();
    }
    // calculate how many epochs are needed
    uint256 epochs;
    if (lockUpEpochs > EPOCHS_IN_YEAR * 5) {
        epochs = 7;
    } else {
        epochs = lockUpEpochs / EPOCHS_IN_YEAR + (lockUpEpochs % EPOCHS_IN_YEAR > 0 ? 2 : 1);
    }

    powers = new EpochPower[](epochs);
    uint16 epoch = SafeCast.toUint16(initialEpoch);
    uint8 remainingLockup = uint8(lockUpEpochs);
    int104 _amount = SafeCast.toInt104(int256(uint256(amount)));
    int104 power = _power(_amount, remainingLockup);
    // calculate epoch powers
    powers[0] = EpochPower({ epoch: epoch, power: power });
    for (uint256 i = 1; i < epochs; ++i) {
        uint8 epochsToNextPowerChange = _epochsToNextPowerChange(remainingLockup);
        remainingLockup -= epochsToNextPowerChange;
        epoch += epochsToNextPowerChange;
        power += _powerDecrease(_amount, remainingLockup);
        powers[i] = EpochPower({ epoch: epoch, power: power });
    }
}
```

</details>

<details>

<summary><code>stakerPowers(address staker, uint256[] calldata epochs)</code></summary>

#### Overview

Function to compute power of a staker at given epochs.

This function takes two arguments:

* `address`**`staker`**
* `uint256[] calldata`**`epochs`**

#### Implementation

```solidity
function stakerPowers(address staker, uint256[] calldata epochs) external view returns (uint256[] memory) {
    uint256[] memory powers = new uint256[](epochs.length);
    for (uint256 i; i < epochs.length;) {
        powers[i] = stakerPowerAt({
            staker: staker,
            epoch: epochs[i]
        });
        unchecked { ++i; }
    }
    return powers;
}
```

</details>

<details>

<summary><code>stakerPowerAt</code></summary>

#### Overview

Function to compute staker power at the given epoch.

This function takes two arguments:

* `address`**`staker`**
* `uint256`**`epoch`**

#### Implementation

```solidity
function stakerPowerAt(address staker, uint256 epoch) override virtual public view returns (uint256) {
    uint16 _epoch = SafeCast.toUint16(epoch);
    uint256[] memory stakeIds = beneficiaryOfStakesAt(staker, _epoch);
    uint256 stakesLength = stakeIds.length;
    int104 power;
    for (uint256 i; i < stakesLength;) {
        // sum up all stake powers
        power += _stakePowerAt({
            stake: _stakes[stakeIds[i]],
            epoch: _epoch
        });

        unchecked { ++i; }
    }

    return SafeCast.toUint256(int256(power));
}
```

</details>

<details>

<summary><code>beneficiaryOfStakesAt</code></summary>

#### Overview

Function to get the list of stake IDs the staker is a beneficiary of in an given epoch.

This function takes two arguments:

* `address`**`staker`**
* `uint16`**`epoch`**

#### Implementation

```solidity
function beneficiaryOfStakesAt(address staker, uint16 epoch) public view returns (uint256[] memory) {
    StakesInEpoch[] storage stakesInEpoch = beneficiaryOfStakes[staker];
    // no owned stakes
    if (stakesInEpoch.length == 0) {
        return new uint256[](0);
    }
    // first owned stake is in the future
    if (epoch < stakesInEpoch[0].epoch) {
        return new uint256[](0);
    }

    // find change epoch
    uint256 changeIndex = stakesInEpoch.length - 1;
    while (stakesInEpoch[changeIndex].epoch > epoch) {
        changeIndex--;
    }

    // collect ids as uint256
    uint256 length = stakesInEpoch[changeIndex].ids.length;
    uint256[] memory ids = new uint256[](length);
    for (uint256 i; i < length;) {
        ids[i] = stakesInEpoch[changeIndex].ids[i];
        unchecked { ++i; }
    }

    return ids;
}
```

</details>

<details>

<summary><code>totalPowers</code></summary>

#### Overview

Function to get total power at given epochs.

This function takes one argument:

* `uint256[] calldata`**`epochs`**

#### Implementation

```solidity
function totalPowers(uint256[] calldata epochs) external view returns (uint256[] memory) {
    uint256[] memory powers = new uint256[](epochs.length);
    for (uint256 i; i < epochs.length;) {
        powers[i] = totalPowerAt(epochs[i]);
        unchecked { ++i; }
    }
    return powers;
}
```

</details>

<details>

<summary><code>totalPowerAt</code></summary>

#### Overview

Function to get total power at a given epoch.

This function takes one argument:

* `uint256`**`epoch`**

#### Implementation

```solidity
function totalPowerAt(uint256 epoch) override virtual public view returns (uint256) {
    if (lastCalculatedTotalPowerEpoch >= epoch) {
        return SafeCast.toUint256(int256(TOTAL_POWER_NAMESPACE.getEpochPower(epoch)));
    }

    // sum the rest of epochs
    int104 totalPower;
    for (uint256 i = lastCalculatedTotalPowerEpoch; i <= epoch;) {
        totalPower += TOTAL_POWER_NAMESPACE.getEpochPower(i);
        unchecked { ++i; }
    }

    return SafeCast.toUint256(int256(totalPower));
}
```

</details>

<details>

<summary><code>calculateTotalPower</code></summary>

#### Overview

Function to calculate total power in current epoch.

This function doesn't take any arguments.

#### Implementation

```solidity
function calculateTotalPower() external {
    calculateTotalPowerUpTo(epochClock.currentEpoch());
}
```

</details>

<details>

<summary><code>calculateTotalPowerUpTo</code></summary>

#### Overview

Function to calculate total power for all epochs up to the given epoch.

This function takes one argument:

* `uint256`**`epoch`**

#### Implementation

```solidity
function calculateTotalPowerUpTo(uint256 epoch) public {
    if (epoch > epochClock.currentEpoch()) {
        revert Error.EpochStillRunning();
    }
    if (lastCalculatedTotalPowerEpoch >= epoch) {
        revert Error.PowerAlreadyCalculated(lastCalculatedTotalPowerEpoch);
    }

    for (uint256 i = lastCalculatedTotalPowerEpoch; i < epoch;) {
        TOTAL_POWER_NAMESPACE.updateEpochPower({
            epoch: i + 1,
            power: TOTAL_POWER_NAMESPACE.getEpochPower(i)
        });

        unchecked { ++i; }
    }

    lastCalculatedTotalPowerEpoch = epoch;

    emit TotalPowerCalculated(epoch);
}
```

</details>

### Events

```solidity
event TotalPowerCalculated(uint256 indexed epoch);
```

<details>

<summary><code>TotalPowerCalculated</code></summary>

TotalPowerCalculated event is emitted when the total power for an epoch is calculated.

This event has one parameter:

* `uint256 indexed`**`epoch`**

</details>

### `EpochPower` Struct

```solidity
struct EpochPower {
    uint16 epoch;
    int104 power;
}
```
