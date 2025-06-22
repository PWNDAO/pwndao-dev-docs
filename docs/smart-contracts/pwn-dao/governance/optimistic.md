# Optimistic

## 1. Summary

The PWN Optimistic governance is based on the Aragon's optimistic token voting plugin. The main changes we've made to the plugin are to use our Epoch Clock instead of block numbers, removed minimal proposer voting power and added ability to cancel proposals.

## 2. Important links

* [**View on GitHub**](https://github.com/aragon/optimistic-token-voting-plugin/blob/f25ea1db9b67a72b7a2e225d719577551e30ac9b/src/OptimisticTokenVotingPlugin.sol)

## 3. Contract details

* _PWNOptimisticGovernancePlugin.sol_ is written in Solidity version 0.8.17

### Features

* Create and Execute Optimistic proposals
* Ability to veto a proposal

### Inherited contracts, implemented Interfaces and ERCs

* [IPWNOptimisticGovernance](https://github.com/PWNDAO/pwn_dao/blob/main/src/governance/optimistic/IPWNOptimisticGovernance.sol)
* [IMembership](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/extensions/membership/IMembership.sol)
* [Initializable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/proxy/utils/Initializable.sol)
* [ERC165Upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/utils/introspection/ERC165Upgradeable.sol)
* [PluginUUPSUpgradeable](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/PluginUUPSUpgradeable.sol)
* [ProposalUpgradeable](https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/extensions/proposal/ProposalUpgradeable.sol)

### Functions

<details>

<summary><code>createProposal</code></summary>

#### Overview

Function to create a new optimistic proposal.

This function takes five arguments:

* `bytes calldata`**`_metadata`** - Metadata of the proposal
* `IDAO.Action[] calldata`**`_actions`** - Actions to be executed after the proposal passes. (Learn more about [IDAO.Action](https://github.com/aragon/osx-commons/blob/9c6472ef9385cc6b72f1e046f43f023d356478c8/contracts/src/dao/IDAO.sol#L14) struct)
* `uint256`**`_allowFailureMap`** - Allows proposal to succeed even if an action reverts. Uses bitmap representation. If the bit at index `x` is 1, the tx succeeds even if the action at `x` failed. Passing 0 will be treated as atomic execution.
* `uint64`**`_startDate`** - The start date of the proposal vote. If 0, the current timestamp is used and the vote starts immediately.
* `uint64`**`_endDate`** - The end date of the proposal vote. If 0, `_startDate + minDuration` is used.

#### Implementation

```solidity
function createProposal(
    bytes calldata _metadata,
    IDAO.Action[] calldata _actions,
    uint256 _allowFailureMap,
    uint64 _startDate,
    uint64 _endDate
) external auth(PROPOSER_PERMISSION_ID) returns (uint256 proposalId) {
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
    proposal_.parameters.minVetoVotingPower = _applyRatioCeiled(
        totalVotingPower_,
        minVetoRatio()
    );

    // save gas
    if (_allowFailureMap != 0) {
        proposal_.allowFailureMap = _allowFailureMap;
    }

    for (uint256 i; i < _actions.length; ) {
        proposal_.actions.push(_actions[i]);
        unchecked {
            ++i;
        }
    }
}
```

</details>

<details>

<summary><code>veto</code></summary>

#### Overview

Function to register a veto for the given proposal.

This function takes one argument:

* `uint256`**`proposalId`**

#### Implementation

```solidity
function veto(uint256 _proposalId) public {
    address _voter = _msgSender();

    (bool canVeto_, uint256 votingPower) = _canVeto(_proposalId, _voter);
    if (!canVeto_) {
        revert ProposalVetoingForbidden({ proposalId: _proposalId, account: _voter });
    }

    // write the updated tally
    Proposal storage proposal_ = proposals[_proposalId];
    proposal_.vetoTally += votingPower;
    proposal_.vetoVoters[_voter] = true;

    emit VetoCast({
        proposalId: _proposalId,
        voter: _voter,
        votingPower: votingPower
    });
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
    if (!canExecute(_proposalId)) {
        revert ProposalExecutionForbidden(_proposalId);
    }

    proposals[_proposalId].executed = true;

    _executeProposal(
        dao(),
        _proposalId,
        proposals[_proposalId].actions,
        proposals[_proposalId].allowFailureMap
    );
}
```

</details>

<details>

<summary><code>cancel</code></summary>

#### Overview

Function to cancel the given proposal.&#x20;

This function takes one argument:

* `uint256`**`proposalId`**

#### Implementation

```solidity
function cancel(uint256 _proposalId) external auth(CANCELLER_PERMISSION_ID) {
    if (!canCancel(_proposalId)) {
        revert ProposalCancellationForbidden(_proposalId);
    }

    proposals[_proposalId].cancelled = true;

    emit ProposalCancelled(_proposalId);
}
```

</details>

### Events

```solidity
event OptimisticGovernanceSettingsUpdated(uint32 minVetoRatio, uint64 minDuration);
event VetoCast(uint256 indexed proposalId, address indexed voter, uint256 votingPower);
event ProposalCancelled(uint256 indexed proposalId);
```

<details>

<summary><code>OptimisticGovernanceSettingsUpdated</code></summary>

OptimisticGovernanceSettingsUpdated event is emitted when the optimistic governance settings are updated.

This event has two parameters:

* `uint32`**`minVetoRatio`** - Veto threshold value
* `uint64`**`minDuration`** - Minimum duration of the proposal vote in seconds

</details>

<details>

<summary><code>VetoCast</code></summary>

VetoCast event is emitted when a veto is cast by a voter.

This event has three parameters:

* `uint256 indexed`**`proposalId`**
* `address indexed`**`voter`**
* `uint256`**`votingPower`** - Amount of voting power that supports the veto

</details>

<details>

<summary><code>ProposalCancelled</code></summary>

ProposalCancelled event is emitted when a proposal is cancelled.

This event has one parameter:

* `uint256 indexed`**`proposalId`**

</details>

### Errors

```solidity
error DateOutOfBounds(uint64 limit, uint64 actual);
error MinDurationOutOfBounds(uint64 limit, uint64 actual);
error ProposalVetoingForbidden(uint256 proposalId, address account);
error ProposalExecutionForbidden(uint256 proposalId);
error ProposalCancellationForbidden(uint256 proposalId);
error NoVotingPower();
```

<details>

<summary><code>DateOutOfBounds</code></summary>

DateOutOfBounds error is thrown when a date is out of bounds.

This error has two parameters:

* `uint64`**`limit`**
* `uint64`**`actual`**

</details>

<details>

<summary><code>MinDurationOutOfBounds</code></summary>

MinDurationOutOfBounds error is thrown when the minimum duration value is out of bounds (less than 3 days or greater than 1 year).

This error has two parameters:

* `uint64`**`limit`**
* `uint64`**`actual`**

</details>

<details>

<summary><code>ProposalVetoingForbidden</code></summary>

ProposalVetoingForbidden error is thrown when an account is not allowed to cast a veto. This can happen in the case the challenge period:

* has not started
* has ended
* was cancelled
* was executed
* the account doesn't have vetoing powers.

This error has two parameters:

* `uint256`**`proposalId`**
* `address`**`account`**

</details>

<details>

<summary><code>ProposalExecutionForbidden</code></summary>

ProposalExecutionForbidden error is thrown when the proposal execution is forbidden.

This error has one parameter:

* `uint256`**`proposalId`**

</details>

<details>

<summary><code>ProposalCancellationForbidden</code></summary>

ProposalCancellationForbidden error is thrown when the proposal cancelation is forbidden.

This error has one parameter:

* `uint256`**`proposalId`**

</details>

<details>

<summary><code>NoVotingPower</code></summary>

NoVotingPower error is thrown if the voting power is zero.

</details>
