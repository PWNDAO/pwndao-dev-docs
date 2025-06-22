# Stake

## 1. Summary

The vePWN Stake contract is an abstract contract inherited by vePWN. It implements functions to manage stake in PWN DAO.&#x20;

## 2. Important links

* [**View on GitHub**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNStake.sol)

## 3. Contract details

* _VoteEscrowedPWNStake.sol_ is written in Solidity version 0.8.25

### Features

* Create, Split, Merge, Increase, Withdraw and Delegate stake

### Inherited contracts, implemented Interfaces and ERCs

* [VoteEscrowedPWNBase](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/vePWN/VoteEscrowedPWNBase.sol)

### Functions

<details>

<summary><code>createStake</code></summary>

#### Overview

Function to create a stake.

This function takes two arguments:

* `uint256`**`amount`**
* `uint256`**`lockUpEpochs`**

#### Implementation

```solidity
function createStake(uint256 amount, uint256 lockUpEpochs) external returns (uint256) {
    return createStakeOnBehalfOf(msg.sender, msg.sender, amount, lockUpEpochs);
}
```

</details>

<details>

<summary><code>createStakeOnBehalfOf</code></summary>

#### Overview

Function to create a stake of behalf of another account.

This function takes four arguments:

* `address`**`staker`**
* `address`**`beneficiary`**
* `uint256`**`amount`**
* `uint256`**`lockUpEpochs`**

#### Implementation

```solidity
function createStakeOnBehalfOf(address staker, address beneficiary, uint256 amount, uint256 lockUpEpochs)
    public
    returns (uint256 stakeId)
{
    // max stake of total initial supply (100M) with decimals 1e26 < max uint88 (3e26)
    if (amount < 100 || amount > type(uint88).max) {
        revert Error.InvalidAmount();
    }
    // amount must be a multiple of 100 to prevent rounding errors when computing power
    if (amount % 100 > 0) {
        revert Error.InvalidAmount();
    }
    // lock up for <1; 5> + {10} years
    if (lockUpEpochs < EPOCHS_IN_YEAR) {
        revert Error.InvalidLockUpPeriod();
    }
    if (lockUpEpochs > 5 * EPOCHS_IN_YEAR && lockUpEpochs != 10 * EPOCHS_IN_YEAR) {
        revert Error.InvalidLockUpPeriod();
    }

    uint16 initialEpoch = epochClock.currentEpoch() + 1;

    // store power changes
    _updateTotalPower(uint104(amount), initialEpoch, uint8(lockUpEpochs), true);

    // create new stake
    stakeId = _createStake({
        owner: staker,
        beneficiary: beneficiary,
        initialEpoch: initialEpoch,
        amount: uint104(amount),
        lockUpEpochs: uint8(lockUpEpochs)
    });

    // transfer pwn token
    pwnToken.transferFrom(msg.sender, address(this), amount);

    // emit event
    emit StakeCreated(stakeId, staker, beneficiary, amount, lockUpEpochs);
}
```

</details>

<details>

<summary><code>splitStake</code></summary>

#### Overview

Function to split a stake into two. Burns the original stPWN NFT and mints two new ones. The beneficiary of the new stake is also the stake owner.

This function takes three arguments:

* `uint256`**`stakeId`**
* `address`**`stakeBeneficiary`**
* `uint256`**`splitAmount`** - amount of PWN tokens to split into the first new stake

#### Implementation

```solidity
function splitStake(uint256 stakeId, address stakeBeneficiary, uint256 splitAmount)
    external
    returns (uint256 newStakeId1, uint256 newStakeId2)
{
    address staker = msg.sender;
    Stake storage originalStake = _stakes[stakeId];
    uint16 originalInitialEpoch = originalStake.initialEpoch;
    uint104 originalAmount = originalStake.amount;
    uint8 originalLockUpEpochs = originalStake.lockUpEpochs;

    // split amount must be greater than 0
    if (splitAmount == 0) {
        revert Error.InvalidAmount();
    }
    // split amount must be less than stake amount
    if (splitAmount >= originalAmount) {
        revert Error.InvalidAmount();
    }
    // split amount must be a multiple of 100 to prevent rounding errors when computing power
    if (splitAmount % 100 > 0) {
        revert Error.InvalidAmount();
    }

    // delete original stake
    _deleteStake({ owner: staker, beneficiary: stakeBeneficiary, stakeId: stakeId });

    // create new stakes
    newStakeId1 = _createStake({
        owner: staker,
        beneficiary: staker,
        initialEpoch: originalInitialEpoch,
        amount: originalAmount - uint104(splitAmount),
        lockUpEpochs: originalLockUpEpochs
    });
    newStakeId2 = _createStake({
        owner: staker,
        beneficiary: staker,
        initialEpoch: originalInitialEpoch,
        amount: uint104(splitAmount),
        lockUpEpochs: originalLockUpEpochs
    });

    // emit event
    emit StakeSplit(stakeId, staker, originalAmount - uint104(splitAmount), splitAmount, newStakeId1, newStakeId2);
}
```

</details>

<details>

<summary><code>mergeStakes</code></summary>

#### Overview

Function to merge two stakes into one. Burns both stPWN NFTs and mints a new one. The new stake has lockup period of the first stake with a condition that the first stake lockup must be longer than or equal to the second one. The beneficiary of the new stake is also the stake owner.

This function takes four arguments:

* `uint256`**`stakeId1`**
* `address`**`stakeBeneficiary1`**
* `uint256`**`stakeId2`**
* `address`**`stakeBeneficiary2`**

#### Implementation

```solidity
function mergeStakes(uint256 stakeId1, address stakeBeneficiary1, uint256 stakeId2, address stakeBeneficiary2)
    external
    returns (uint256 newStakeId)
{
    address staker = msg.sender;
    Stake storage stake1 = _stakes[stakeId1];
    Stake storage stake2 = _stakes[stakeId2];
    uint16 finalEpoch1 = stake1.initialEpoch + stake1.lockUpEpochs;
    uint16 finalEpoch2 = stake2.initialEpoch + stake2.lockUpEpochs;
    uint16 newInitialEpoch = epochClock.currentEpoch() + 1;

    // the first stake lockup end must be greater than or equal to the second stake lockup end
    // both stake lockup ends must be greater than the current epoch
    if (finalEpoch1 < finalEpoch2 || finalEpoch1 <= newInitialEpoch) {
        revert Error.LockUpPeriodMismatch();
    }

    uint8 newLockUpEpochs = uint8(finalEpoch1 - newInitialEpoch); // safe cast
    // only need to update second stake power changes if has different final epoch
    if (finalEpoch1 != finalEpoch2) {
        uint104 amount2 = stake2.amount;
        // clear second stake power changes if necessary
        if (finalEpoch2 > newInitialEpoch) {
            _updateTotalPower(amount2, newInitialEpoch, uint8(finalEpoch2 - newInitialEpoch), false);
        }
        // store new update power changes
        _updateTotalPower(amount2, newInitialEpoch, newLockUpEpochs, true);
    }

    // delete old stakes
    _deleteStake({ owner: staker, beneficiary: stakeBeneficiary1, stakeId: stakeId1 });
    _deleteStake({ owner: staker, beneficiary: stakeBeneficiary2, stakeId: stakeId2 });

    // create new stake
    uint104 newAmount = stake1.amount + stake2.amount;
    newStakeId = _createStake({
        owner: staker,
        beneficiary: staker,
        initialEpoch: newInitialEpoch,
        amount: newAmount,
        lockUpEpochs: newLockUpEpochs
    });

    // emit event
    emit StakeMerged(stakeId1, stakeId2, staker, newAmount, newLockUpEpochs, newStakeId);
}
```

</details>

<details>

<summary><code>increaseStake</code></summary>

#### Overview

Function to increase a stake. Both the amount of tokens and the lockup period of a stake can be increased. Old stake NFT is burned and a new one is created during the increase of a stake.

This function takes four arguments:

* `uint256`**`stakeId`**
* `address`**`stakeBeneficiary`**
* `uint256`**`additionalAmount`**
* `uint256`**`additionalEpochs`**

#### Implementation

```solidity
function increaseStake(uint256 stakeId, address stakeBeneficiary, uint256 additionalAmount, uint256 additionalEpochs)
    external
    returns (uint256 newStakeId)
{
    address staker = msg.sender;
    Stake storage stake = _stakes[stakeId];

    // additional amount or additional epochs must be greater than 0
    if (additionalAmount == 0 && additionalEpochs == 0) {
        revert Error.NothingToIncrease();
    }
    if (additionalAmount > type(uint88).max) {
        revert Error.InvalidAmount();
    }
    // to prevent rounding errors when computing power
    if (additionalAmount % 100 > 0) {
        revert Error.InvalidAmount();
    }
    if (additionalEpochs > 10 * EPOCHS_IN_YEAR) {
        revert Error.InvalidLockUpPeriod();
    }

    uint16 newInitialEpoch = epochClock.currentEpoch() + 1;
    uint16 oldFinalEpoch = stake.initialEpoch + stake.lockUpEpochs;
    uint8 newLockUpEpochs = SafeCast.toUint8(
        oldFinalEpoch <= newInitialEpoch ? additionalEpochs : oldFinalEpoch + additionalEpochs - newInitialEpoch
    );
    // extended lockup must be in <1; 5> + {10} years
    if (newLockUpEpochs < EPOCHS_IN_YEAR) {
        revert Error.InvalidLockUpPeriod();
    }
    if (newLockUpEpochs > 5 * EPOCHS_IN_YEAR && newLockUpEpochs != 10 * EPOCHS_IN_YEAR) {
        revert Error.InvalidLockUpPeriod();
    }

    uint104 oldAmount = stake.amount;
    uint104 newAmount = oldAmount + uint104(additionalAmount); // safe cast

    { // avoid stack too deep
        bool amountAdditionOnly = additionalEpochs == 0;

        // clear old power changes if adding epochs
        if (!amountAdditionOnly && newLockUpEpochs > additionalEpochs) {
            _updateTotalPower(oldAmount, newInitialEpoch, newLockUpEpochs - uint8(additionalEpochs), false);
        }

        // store new power changes
        uint104 amount = amountAdditionOnly ? uint104(additionalAmount) : newAmount;
        _updateTotalPower(amount, newInitialEpoch, newLockUpEpochs, true);
    }

    // delete original stake
    _deleteStake({ owner: staker, beneficiary: stakeBeneficiary, stakeId: stakeId });

    // create new stake
    newStakeId = _createStake({
        owner: staker,
        beneficiary: staker,
        initialEpoch: newInitialEpoch,
        amount: newAmount,
        lockUpEpochs: newLockUpEpochs
    });

    // transfer additional PWN tokens
    if (additionalAmount > 0) {
        pwnToken.transferFrom(staker, address(this), additionalAmount);
    }

    // emit event
    emit StakeIncreased(
        stakeId, staker, additionalAmount, newAmount, additionalEpochs, newLockUpEpochs, newStakeId
    );
}
```

</details>

<details>

<summary><code>withdrawStake</code></summary>

#### Overview

Function to withdraw a stake. Burns the stake NFT and transfers the underlying PWN tokens to the caller.

This function takes two arguments:

* `uint256`**`stakeId`**
* `address`**`stakeBeneficiary`**

#### Implementation

```solidity
function withdrawStake(uint256 stakeId, address stakeBeneficiary) external {
    address staker = msg.sender;
    Stake storage stake = _stakes[stakeId];

    // stake must be unlocked
    if (stake.initialEpoch + stake.lockUpEpochs > epochClock.currentEpoch()) {
        revert Error.WithrawalBeforeLockUpEnd();
    }

    // delete stake
    _deleteStake({ owner: staker, beneficiary: stakeBeneficiary, stakeId: stakeId });

    // transfer pwn tokens to the staker
    pwnToken.transfer(staker, stake.amount);

    // emit event
    emit StakeWithdrawn(stakeId, staker, stake.amount);
}
```

</details>

<details>

<summary><code>delegateStakePower</code></summary>

#### Overview

Function to delegate stakes voting power to another account.

This function takes three arguments:

* `uint256`**`stakeId`**
* `address`**`currentBeneficiary`**
* `address`**`newBeneficiary`**

#### Implementation

```solidity
function delegateStakePower(uint256 stakeId, address currentBeneficiary, address newBeneficiary) external {
    address staker = msg.sender;

    // power already delegated to the new beneficiary
    if (currentBeneficiary == newBeneficiary) {
        revert Error.SameBeneficiary();
    }

    // staker must be stake owner
    _checkIsStakeOwner(staker, stakeId);

    // remove token from current beneficiary first to avoid duplicates
    _removeStakeFromBeneficiary(stakeId, currentBeneficiary);
    _addStakeToBeneficiary(stakeId, newBeneficiary);

    // emit event
    emit StakePowerDelegated(stakeId, currentBeneficiary, newBeneficiary);
}
```

</details>

<details>

<summary><code>getStake</code></summary>

#### Overview

Function to get information about a stake.

Checkout [`StakeData`](stake.md#stakedata-struct) struct definition below to learn more about the return type of this function.

This function takes one argument:

* `uint256`**`stakeId`**

#### Implementation

```solidity
function getStake(uint256 stakeId) public view returns (StakeData memory stakeData) {
    Stake storage stake = _stakes[stakeId];
    uint16 currentEpoch = epochClock.currentEpoch();

    stakeData.stakeId = stakeId;
    stakeData.owner = stakedPWN.ownerOf(stakeId);
    stakeData.initialEpoch = stake.initialEpoch;
    stakeData.lockUpEpochs = stake.lockUpEpochs;
    stakeData.remainingEpochs = (stakeData.initialEpoch + stakeData.lockUpEpochs >= currentEpoch)
        ? uint8(stakeData.initialEpoch + stakeData.lockUpEpochs - currentEpoch) : 0;
    stakeData.currentMultiplier = (stakeData.initialEpoch <= currentEpoch && stakeData.remainingEpochs > 0)
        ? uint8(uint104(_power(100, stakeData.remainingEpochs))) : 0;
    stakeData.amount = stake.amount;
}
```

</details>

<details>

<summary><code>getStakes</code></summary>

#### Overview

Function to get information about multiple stakes.

Checkout [`StakeData`](stake.md#stakedata-struct) struct definition below to learn more about the return type of this function.

This function takes one argument:

* `uint256[] calldata`**`stakeIds`**

#### Implementation

```solidity
function getStakes(uint256[] calldata stakeIds) external view returns (StakeData[] memory stakeData) {
    stakeData = new StakeData[](stakeIds.length);
    for (uint256 i; i < stakeIds.length; ++i) {
        stakeData[i] = getStake(stakeIds[i]);
    }
}
```

</details>

### Events

```solidity
event StakeCreated(uint256 indexed stakeId, address indexed staker, address indexed beneficiary, uint256 amount, uint256 lockUpEpochs);
event StakeSplit(uint256 indexed stakeId, address indexed staker, uint256 amount1, uint256 amount2, uint256 newStakeId1, uint256 newStakeId2);
event StakeMerged(uint256 indexed stakeId1, uint256 indexed stakeId2, address indexed staker, uint256 amount, uint256 lockUpEpochs, uint256 newStakeId);
event StakeIncreased(uint256 indexed stakeId, address indexed staker, uint256 additionalAmount, uint256 newAmount, uint256 additionalEpochs, uint256 newEpochs, uint256 newStakeId);
event StakeWithdrawn(uint256 indexed stakeId, address indexed staker, uint256 amount);
event StakePowerDelegated(uint256 indexed stakeId, address indexed originalBeneficiary, address indexed newBeneficiary);
```

<details>

<summary><code>StakeCreated</code></summary>

StakeCreated event is emitted when a stake is created.

This event has five parameters:

* `uint256 indexed`**`stakeId`**
* `address indexed`**`staker`**
* `address indexed`**`beneficiary`**
* `uint256`**`amount`**
* `uint256`**`lockUpEpochs`**

</details>

<details>

<summary><code>StakeSplit</code></summary>

StakeSplit event is emitted when a stake is split into two.

This event has six parameters:

* `uint256 indexed`**`stakeId`**
* `address indexed`**`staker`**
* `uint256`**`amount1`**
* `uint256`**`amount2`**
* `uint256`**`newStakeId1`**
* `uint256`**`newStakeId2`**

</details>

<details>

<summary><code>StakeMerged</code></summary>

StakeMerged event is emitted when two stakes are merged into one.

This event has six parameters:

* `uint256 indexed`**`stakeId1`**
* `uint256 indexed`**`stakeId2`**
* `address indexed`**`staker`**
* `uint256`**`amount`**
* `uint256`**`lockUpEpochs`**
* `uint256`**`newStakeId`**

</details>

<details>

<summary><code>StakeIncreased</code></summary>

StakeIncreased event is emitted when a stake is increased. Both the amount of tokens and the lockup period can be increased. Old stake NFT is burned and a new one is created during the increase of a stake.

This event has seven parameters:

* `uint256 indexed`**`stakeId`**
* `address indexed`**`staker`**
* `uint256`**`additionalAmount`**
* `uint256`**`newAmount`**
* `uint256`**`additionalEpochs`**
* `uint256`**`newEpochs`**
* `uint256`**`newStakeId`**

</details>

<details>

<summary><code>StakeWithdrawn</code></summary>

StakeWithdrawn event is emitted when a stake is withdrawn.

This event has three parameters:

* `uint256 indexed`**`stakeId`**
* `address indexed`**`staker`**
* `uint256`**`amount`**

</details>

<details>

<summary><code>StakePowerDelegated</code></summary>

StakePowerDelegated event is emitted when stake power is transferred between beneficiaries. When a stake is created, the `originalBeneficiary` is zero address. When a stake is deleted, the `newBeneficiary` is zero address.

This event has three parameters:

* `uint256 indexed`**`stakeId`**
* `address indexed`**`originalBeneficiary`**
* `address indexed`**`newBeneficiary`**

</details>

### `StakeData` Struct

```solidity
struct StakeData {
    uint256 stakeId;
    address owner;
    uint16 initialEpoch;
    uint8 lockUpEpochs;
    uint8 remainingEpochs;
    uint8 currentMultiplier;
    uint104 amount;
}
```
