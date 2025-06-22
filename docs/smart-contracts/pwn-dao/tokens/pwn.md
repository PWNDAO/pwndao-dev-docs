# PWN

## 1. Summary

PWN is the main governance token of PWN DAO and is used as a reward for voting in proposals. The token is mintable by PWN DAO, with a hard-cap of 100M $PWN. The total supply can exceed the 100M by minting new $PWN tokens as voting rewards. The token is non-transfarable, but transfers can be enabled by PWN DAO.

## 2. Important links

* [**Source code**](https://github.com/PWNDAO/pwn_dao/blob/main/src/token/PWN.sol)
* [**ABI**](/assets/PWN.json)

## 3. Contract details

* _PWN.sol_ is written in Solidity version 0.8.25

### Features

* Set voting reward in a voting contract
* Assign reward to a governance proposal
* Claim rewards for voters
* Mint and Burn tokens

### Inherited contracts, implemented Interfaces and ERCs

* [Ownable2Step](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable2Step.sol)
* [ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol)
* [IRewardToken](https://github.com/PWNDAO/pwn_dao/blob/main/src/interfaces/IRewardToken.sol)

### Functions

<details>

<summary><code>setVotingReward</code></summary>

#### Overview

Function to set a reward for voting in a proposal of a voting contract. The reward can be set only by the owner, cannot exceed `MAX_VOTING_REWARD` (1% of total supply) and it is calculated from the current total supply at the time of assigning the reward. The contract **must** call `assignProposalReward` on proposal creation with the new proposal ID.

This function takes two arguments:

* `address`**`votingContract`**
* `uint256`**`votingReward`** - Voting reward nominator. Passing 0 disables the reward.

#### Implementation

```solidity
function setVotingReward(address votingContract, uint256 votingReward) external onlyOwner {
    if (votingContract == address(0)) {
        revert Error.ZeroVotingContract();
    }
    if (votingReward > MAX_VOTING_REWARD) {
        revert Error.InvalidVotingReward();
    }
    votingRewards[votingContract] = votingReward;

    emit VotingRewardSet(votingContract, votingReward);
}
```

</details>

<details>

<summary><code>assignProposalReward</code></summary>

#### Overview

Function to assign a reward to a governance proposal.

This function takes one argument:

* `uint256`**`proposalId`**

#### Implementation

```solidity
function assignProposalReward(uint256 proposalId) external {
    address votingContract = msg.sender;

    // check that the voting contract has a reward set
    uint256 votingReward = votingRewards[votingContract];
    if (votingReward > 0) {
        // check that the proposal reward has not been assigned yet
        ProposalReward storage proposalReward = proposalRewards[votingContract][proposalId];
        if (proposalReward.reward == 0) {
            // assign the reward
            uint256 reward = Math.mulDiv(totalSupply(), votingReward, VOTING_REWARD_DENOMINATOR);
            proposalReward.reward = reward;

            emit ProposalRewardAssigned(votingContract, proposalId, reward);
        }
    }
}
```

</details>

<details>

<summary><code>claimProposalReward</code></summary>

#### Overview

Function to claims a reward for voting in a proposal. The reward can be claimed only if the caller has voted. It doesn't matter if the caller voted yes, no or abstained.

This function takes two arguments:

* `address`**`votingContract`**
* `uint256`**`proposalId`**

#### Implementation

```solidity
function claimProposalReward(address votingContract, uint256 proposalId) public {
    if (votingContract == address(0)) {
        revert Error.ZeroVotingContract();
    }

    // check that the reward has been assigned
    ProposalReward storage proposalReward = proposalRewards[votingContract][proposalId];
    uint256 assignedReward = proposalReward.reward;
    if (assignedReward == 0) {
        revert Error.ProposalRewardNotAssigned({ proposalId: proposalId });
    }

    IPWNTokenGovernance _votingContract = IPWNTokenGovernance(votingContract);
    ( // get proposal data
        , bool executed,
        IPWNTokenGovernance.ProposalParameters memory proposalParameters,
        IPWNTokenGovernance.Tally memory tally,,
    ) = _votingContract.getProposal(proposalId);

    // check that the proposal has been executed
    if (!executed) {
        revert Error.ProposalNotExecuted({ proposalId: proposalId });
    }

    // check that the caller has voted
    address voter = msg.sender;
    if (_votingContract.getVoteOption(proposalId, voter) == IPWNTokenGovernance.VoteOption.None) {
        revert Error.CallerHasNotVoted();
    }

    // check that the reward has not been claimed yet
    if (proposalReward.claimed[voter]) {
        revert Error.ProposalRewardAlreadyClaimed({ proposalId: proposalId });
    }

    // store that the reward has been claimed
    proposalReward.claimed[voter] = true;

    // voter is rewarded proportionally to the amount of votes he had in the snapshot epoch
    // it doesn't matter if he voted yes, no or abstained
    uint256 voterVotes = _votingContract.getVotingToken().getPastVotes(voter, proposalParameters.snapshotEpoch);
    uint256 totalVotes = tally.abstain + tally.yes + tally.no;
    uint256 voterReward = Math.mulDiv(assignedReward, voterVotes, totalVotes);

    // mint the reward to the voter
    _mint(voter, voterReward);

    emit ProposalRewardClaimed(votingContract, proposalId, voter, voterReward);
}
```

</details>

<details>

<summary><code>claimProposalRewardBatch</code></summary>

#### Overview

Function to claims rewards for voting in multiple proposals.

This function takes two arguments:

* `address`**`votingContract`**
* `uint256[] calldata`**`proposalIds`**

#### Implementation

```solidity
function claimProposalRewardBatch(address votingContract, uint256[] calldata proposalIds) external {
    uint256 length = proposalIds.length;
    for (uint256 i; i < length;) {
        claimProposalReward(votingContract, proposalIds[i]);
        unchecked { ++i; }
    }
}
```

</details>

<details>

<summary><code>enableTransfers</code></summary>

#### Overview

Function to enable permissionless PWN token transfers. Transfers cannot be disabled once they have been enabled.&#x20;

This function doesn't take any arguments.

#### Implementation

```solidity
function enableTransfers() external onlyOwner {
    if (transfersEnabled) {
        revert Error.TransfersAlreadyEnabled();
    }
    transfersEnabled = true;
}
```

</details>

<details>

<summary><code>setTransferAllowlist</code></summary>

#### Overview

Function to enable token transfers for an address before transferes are enabled for all holders.

This function takes two arguments:

* `address`**`addr`**
* `bool`**`isAllowed`**

#### Implementation

```solidity
function setTransferAllowlist(address addr, bool isAllowed) external onlyOwner {
    transferAllowlist[addr] = isAllowed;
}
```

</details>

<details>

<summary><code>mint</code></summary>

#### Overview

Function to mint new PWN tokens by PWN DAO. Maximum supply of PWN is capped by `MINTABLE_TOTAL_SUPPLY` at 100M.

This function takes one argument:

* `uint256`**`amount`**

#### Implementation

```solidity
function mint(uint256 amount) external onlyOwner {
    if (mintedSupply + amount > MINTABLE_TOTAL_SUPPLY) {
        revert Error.MintableSupplyExceeded();
    }
    unchecked {
        mintedSupply += amount;
    }
    _mint(msg.sender, amount);
}
```

</details>

<details>

<summary><code>burn</code></summary>

#### Overview

Function to burn PWN tokens.

This function takes one argument:

* `uint256`**`amount`**

#### Implementation

```solidity
function burn(uint256 amount) external {
    _burn(msg.sender, amount);
}
```

</details>

### Events

```solidity
event VotingRewardSet(address indexed votingContract, uint256 votingReward);
event ProposalRewardAssigned(address indexed votingContract, uint256 indexed proposalId, uint256 reward);
event ProposalRewardClaimed(address indexed votingContract, uint256 indexed proposalId, address indexed voter, uint256 voterReward);
```

<details>

<summary><code>VotingRewardSet</code></summary>

VotingRewardSet event is emitted when the owner sets the reward for voting in a voting contract.

This event has two parameters:

* `address indexed`**`votingContract`**
* `uint256`**`votingReward`**

</details>

<details>

<summary><code>ProposalRewardAssigned</code></summary>

ProposalRewardAssigned event is emitted when the owner assigns a reward to a governance proposal.

This event has three parameters:

* `address indexed`**`votingContract`**
* `uint256 indexed`**`proposalId`**
* `uint256`**`reward`**

</details>

<details>

<summary><code>ProposalRewardClaimed</code></summary>

ProposalRewardClaimed event is emitted when a voter claims his reward for voting in a proposal.

This event has four parameters:

* `address indexed`**`votingContract`**
* `uint256 indexed`**`proposalId`**
* `address indexed`**`voter`**
* `uint256`**`voterReward`**

</details>
