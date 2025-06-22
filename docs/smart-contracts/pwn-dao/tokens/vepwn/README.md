# vePWN

## 1. Summary

The Vote Escrowed PWN (vePWN) token handles the main logic for staking PWN tokens and implements voting power calculation for stakers.

## 2. Important links

* [**Source code**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/VoteEscrowedPWN.sol)
* [**ABI**](/assets/VoteEscrowedPWN.json)

## 3. Contract details

* _VoteEscrowedPWN.sol_ is written in Solidity version 0.8.25

### Features

* Stake for yourself or on behalf of another account
* Manage your stake (merge, increase, split)
* Withdraw stake

### Inherited contracts, implemented Interfaces and ERCs

* [VoteEscrowedPWNStake](stake.md)
* [VoteEscrowedPWNPower](power.md)
* [VoteEscrowedPWNStakeMetadata](metadata.md)

The `VoteEscrowedPWN` contract itself doesn't implement any functions, define events or errors. All functionality of the contract is inherited. `VoteEscrowedPWNStake` contract implements functions to manage stake. `VoteEscrowedPWNPower` handles all calculations of voting power in PWN DAO. `VoteEscrowedPWNStakeMetadata` implements a function to get metadata for a particular stake.
