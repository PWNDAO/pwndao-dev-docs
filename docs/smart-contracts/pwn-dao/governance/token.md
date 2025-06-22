# Token

## 1. Summary

The PWN Token governance is based on the Aragon's token voting plugin. The main changes we've made to the plugin are to use our Epoch Clock instead of block numbers, remove `VotingMode` functionality and use only Standard by default, and we added the assignment of voting rewards on proposal creation.

:::info
Aragon OSx `VotingMode` allows for `EarlyExecution` and `VoteReplacement` features. In `Standard` mode, early execution and vote replacement are disabled.
:::

## 2. Important links

* [**View on GitHub**](https://github.com/aragon/osx/blob/e90ea8f5cd6b98cbba16db07ab7bc0cdbf517f3e/packages/contracts/src/plugins/governance/majority-voting/token/TokenVoting.sol)

## 3. Contract details

* _PWNTokenGovernancePlugin.sol_ is written in Solidity version 0.8.17

### Features

* Create and Execute Token governance proposals
* Vote for a proposal

### Inherited contracts, implemented Interfaces and ERCs

* [IPWNTokenGovernance](https://github.com/PWNDAO/pwn_dao/blob/main/src/governance/token/IPWNTokenGovernance.sol)
* [IMembership](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/extensions/membership/IMembership.sol)
* [Initializable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/proxy/utils/Initializable.sol)
* [ERC165Upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/utils/introspection/ERC165Upgradeable.sol)
* [PluginUUPSUpgradeable](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/PluginUUPSUpgradeable.sol)
* [ProposalUpgradeable](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/extensions/proposal/ProposalUpgradeable.sol)

### Functions

<details>

<summary><code>createProposal</code></summary>

#### Overview

Function to create a new token voting proposal.

This function takes five arguments:

* `bytes calldata`**`_metadata`** - Metadata of the proposal
* `IDAO.Action[] calldata`**`_actions`** - Actions to be executed after the proposal passes. (Learn more about [IDAO.Action](https://github.com/aragon/osx-commons/blob/9c6472ef9385cc6b72f1e046f43f023d356478c8/contracts/src/dao/IDAO.sol#L14) struct)
* `uint256`**`_allowFailureMap`** - Allows proposal to succeed even if an action reverts. Uses bitmap representation. If the bit at index `x` is 1, the tx succeeds even if the action at `x` failed. Passing 0 will be treated as atomic execution.
* `uint64`**`_startDate`** - The start date of the proposal vote. If 0, the current timestamp is used and the vote starts immediately.
* `uint64`**`_endDate`** - The end date of the proposal vote. If 0, `_startDate + minDuration` is used.
* `VoteOption`**`_voteOption`** - Chosen vote option ([VoteOption Enum](token.md#voteoption-enum)) to be casted on proposal creation.

#### Implementation

```solidity
function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap,
    uint64 _startDate,
    uint64 _endDate,
    VoteOption _voteOption
) external returns (uint256 proposalId) {
    // check that `_msgSender` has enough voting power
    {
        uint256 minProposerVotingPower_ = minProposerVotingPower();

        if (minProposerVotingPower_ != 0) {
            if (votingToken.getVotes(_msgSender()) < minProposerVotingPower_) {
                revert ProposalCreationForbidden(_msgSender());
            }
        }
    }

    uint256 snapshotEpoch = epochClock.currentEpoch();
    uint256 totalVotingPower_ = totalVotingPower(snapshotEpoch);

    if (totalVotingPower_ == 0) {
        revert NoVotingPower();
    }

    (_startDate, _endDate) = _validateProposalDates(_startDate, _endDate);

    proposalId = _createProposal({
        _creator: _msgSender(),
        _metadata: _metadata,
        _startDate: _startDate,
        _endDate: _endDate,
        _actions: _actions,
        _allowFailureMap: _allowFailureMap
    });

    // store proposal related information
    Proposal storage proposal_ = proposals[proposalId];

    proposal_.parameters.startDate = _startDate;
    proposal_.parameters.endDate = _endDate;
    proposal_.parameters.snapshotEpoch = snapshotEpoch.toUint64();
    proposal_.parameters.supportThreshold = supportThreshold();
    proposal_.parameters.minVotingPower = _applyRatioCeiled(totalVotingPower_, minParticipation());

    // reduce costs
    if (_allowFailureMap != 0) {
        proposal_.allowFailureMap = _allowFailureMap;
    }

    for (uint256 i; i < _actions.length;) {
        proposal_.actions.push(_actions[i]);
        unchecked {
            ++i;
        }
    }

    // assign voting reward
    rewardToken.assignProposalReward(proposalId);

    if (_voteOption != VoteOption.None) {
        vote(proposalId, _voteOption);
    }
}
```

</details>

<details>

<summary><code>vote</code></summary>

#### Overview

Function to vote the choosen option. Optionally, this function can also execute the proposal.

This function takes two arguments:

* `uint256`**`proposalId`**
* `VoteOption`**`voteOption`** - [VoteOption Enum](token.md#voteoption-enum)

#### Implementation

```solidity
function vote(uint256 _proposalId, VoteOption _voteOption) public {
    address _voter = _msgSender();

    (bool canVote_, uint256 votingPower) = _canVote(_proposalId, _voter, _voteOption);
    if (!canVote_) {
        revert VoteCastForbidden({ proposalId: _proposalId, account: _voter, voteOption: _voteOption });
    }
    _vote(_proposalId, _voteOption, _voter, votingPower);
}
```

</details>

<details>

<summary><code>execute</code></summary>

#### Overview

Function to execute the given proposal.

This function takes one argument:

* `uint256`**`proposalId`**

#### Implementation

```solidity
function execute(uint256 _proposalId) public {
    if (!_canExecute(_proposalId)) {
        revert ProposalExecutionForbidden(_proposalId);
    }
    _execute(_proposalId);
}
```

</details>

### Events

```solidity
event VoteCast(uint256 indexed proposalId, address indexed voter, VoteOption voteOption, uint256 votingPower);
event TokenGovernanceSettingsUpdated(uint32 supportThreshold, uint32 minParticipation, uint64 minDuration, uint256 minProposerVotingPower);
```

<details>

<summary><code>VoteCast</code></summary>

VoteCast event is emitted when a vote is cast by a voter.

This event has four parameters:

* `uint256 indexed`**`proposalId`**
* `address indexed`**`voter`**
* `VoteOption`**`voteOption`** - [VoteOption Enum](token.md#voteoption-enum)
* `uint256`**`votingPower`** - Voting power behind the vote

</details>

<details>

<summary><code>TokenGovernanceSettingsUpdated</code></summary>

TokenGovernanceSettingsUpdated event is emitted when the token governance settings are updated.

This event has four parameters:

* `uint32`**`supportThreshold`**
* `uint32`**`minParticipation`**
* `uint64`**`minDuration`** - Minimum duration of the proposal vote in seconds
* `uint256`**`minProposerVotingPower`** - Minimum voting power required to create a proposal

</details>

### Errors

```solidity
error NoVotingPower();
error DateOutOfBounds(uint64 limit, uint64 actual);
error MinDurationOutOfBounds(uint64 limit, uint64 actual);
error ProposalCreationForbidden(address sender);
error VoteCastForbidden(uint256 proposalId, address account, VoteOption voteOption);
error ProposalExecutionForbidden(uint256 proposalId);
```

<details>

<summary><code>NoVotingPower</code></summary>

NoVotingPower error is thrown if the voting power is zero.

</details>

<details>

<summary><code>DateOutOfBounds</code></summary>

DateOutOfBounds error is thrown when a date is out of bounds.

This error has two parameters:

* `uint64`**`limit`**
* `uint64`**`actual`**

</details>

<details>

<summary><code>MinDurationOutOfBounds</code></summary>

MinDurationOutOfBounds error is thrown when the minimum duration value is out of bounds (less than 1 hour or greater than 1 year).

This error has two parameters:

* `uint64`**`limit`**
* `uint64`**`actual`**

</details>

<details>

<summary><code>ProposalCreationForbidden</code></summary>

ProposalCreationForbidden error is thrown when a sender is not allowed to create a proposal.

This error has one parameter:

* `address`**`sender`**

</details>

<details>

<summary><code>VoteCastForbidden</code></summary>

VoteCastForbidden error is thrown when an account is not allowed to cast a vote. This happens when the vote:

* has not started
* has ended
* was executed
* the account doesn't have voting powers

This error has three parameters:

* `uint256`**`proposalId`**
* `address`**`account`**
* `VoteOption`**`voteOption`** - [VoteOption Enum](token.md#voteoption-enum)

</details>

<details>

<summary><code>ProposalExecutionForbidden</code></summary>

ProposalExecutionForbidden error is thrown when a proposal execution is forbidden.

This error has one parameter:

* `uint256`**`proposalId`**

</details>

### `VoteOption` Enum

```solidity
enum VoteOption {
    None, Abstain, Yes, No
}
```
