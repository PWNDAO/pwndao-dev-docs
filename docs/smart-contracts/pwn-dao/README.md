# PWN DAO

:::info
This is a smart contract documentation. If you're looking for general documentation about PWN DAO, head over to our user documentation. We recommend going through the user documentation to familiarise yourself with the PWN DAO objectives and motivations before moving on to the smart contract documentation.
:::

## Overview

Put simply, PWN DAO manages the PWN Protocol. What does that mean? The PWN DAO has the ability to change parameters such as the protocol borrowing fee and governance voting rewards. Additionally, the PWN DAO can remove and add new contracts in the PWN Protocol, thanks to the modular extendable architecture outlined in our [Core Protocol Documentation](../core/introduction.md). This section provides information about the architecture of the PWN DAO and explanation of its modules and plugins.

First off, the PWN DAO is based on the [Aragon OSx Framework](https://docs.aragon.org/). This allows us to use an audited and proven architecture while being able to define our governance and add custom PWN plugins. Composability at it's finest. Now, let's see how PWN DAO governance works.

## Governance

We define two governance structures, Optimistic (Steward) and Token (Community) governance. This allows PWN DAO to make decisions effectively while still giving the community full ownership of the protocol.

[Optimistic](governance/optimistic.md) governance means that Stewards, appointed by a community vote, have the authority to make decisions using a multi-signature mechanism. Furthermore, Stewards can only make decisions that are whitelisted by Token governance. Steward proposals are automatically implemented unless vetoed by at least 10% of the total voting power.

[Token](governance/token.md) governance allows all token holders who stake $PWN tokens to participate in governance. Proposals made under this system require a quorum of 20% of staked tokens and must achieve a 60% approval rate to pass. Token holders choose Stewards and have the ability to veto any Optimistic governance decision.

## Tokens

#### [PWN](tokens/pwn.md) ($PWN)

This is the native governance token of the PWN DAO that can be staked in order to gain governance power. $PWN is also used as a reward for voting in proposals.

#### [**StakedPWN**](tokens/stpwn.md) **(stPWN)**

An NFT representing staked $PWN tokens. The stake is non-transferable, but can be made transferable by the governance.

#### [**VoteEscrowedPWN**](tokens/vepwn/) **(vePWN)**

A non-transferable token that represents the voting power of staked $PWN, determined by the duration of the stake. The vePWN token handles the main logic for staking PWN tokens and implements voting power calculation for stakers.

## Epochs

Time in PWN DAO is tracked in epochs, where one epoch is four weeks. One year is then 13 epochs. The current epoch is always immutable, so any voting power update will happen at the beginning of the next epoch.

## Important Links

* [**Staking UI**](https://staking.pwn.xyz/)
* [**Voting UI**](https://voting.pwn.xyz/)
* [**Forum**](https://forum.pwn.xyz/)
* [**GitHub**](https://github.com/PWNDAO/pwn_dao)
