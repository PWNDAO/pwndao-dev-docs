# Elastic Chainlink Proposal

## 1. Summary

PWNSimpleLoanElasticChainlinkProposal.sol implements elastic loan proposals using Chainlink oracles for price feeds. This proposal type calculates collateral requirements dynamically based on real-time market data, supporting multiple intermediary denominations and LTV ratios.

The elastic proposal determines collateral amount during acceptance using Chainlink price feeds, LTV, and credit amount. Interest can be accruing or fixed, with support for L2 sequencer uptime checks.

## 2. Important links

* [**View on GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/terms/simple/proposal/PWNSimpleLoanElasticChainlinkProposal.sol)

## 3. Contract details

* _PWNSimpleLoanElasticChainlinkProposal.sol_ is written in Solidity version 0.8.16

### Features

* Dynamic proposal terms based on Chainlink price feeds
* L2 sequencer uptime checks for oracle reliability
* Feeds with last update older that 1 day are considered invalid

### Inherited contracts, implemented Interfaces and ERCs

* [PWNSimpleLoanProposal](./)

### Functions

<details>

<summary><code>acceptProposal</code></summary>

#### Overview

A function to accept a proposal.

This function takes five arguments supplied by the caller:

* `address`**`acceptor`** - Proposal acceptor address
* `uint256`**`refinancingLoanId`** - ID of loan being refinanced
* `bytes calldata`**`proposalData`** - Encoded proposal data
* `bytes32[] calldata`**`proposalInclusionProof`** - Merkle proof for multiproposal
* `bytes calldata`**`signature`** - Proposal signature

#### Implementation

```solidity
function acceptProposal(
        address acceptor,
        uint256 refinancingLoanId,
        bytes calldata proposalData,
        bytes32[] calldata proposalInclusionProof,
        bytes calldata signature
    ) override external returns (bytes32 proposalHash, PWNSimpleLoan.Terms memory loanTerms) {
        // Decode proposal data
        (Proposal memory proposal, ProposalValues memory proposalValues) = decodeProposalData(proposalData);

        // Make proposal hash
        proposalHash = _getProposalHash(PROPOSAL_TYPEHASH, _erc712EncodeProposal(proposal));

        // Check min credit amount
        if (proposal.minCreditAmount == 0) {
            revert MinCreditAmountNotSet();
        }

        // Check sufficient credit amount
        if (proposalValues.creditAmount < proposal.minCreditAmount) {
            revert InsufficientCreditAmount({ current: proposalValues.creditAmount, limit: proposal.minCreditAmount });
        }

        // Calculate collateral amount
        uint256 collateralAmount = getCollateralAmount(
            proposal.creditAddress,
            proposalValues.creditAmount,
            proposal.collateralAddress,
            proposal.feedIntermediaryDenominations,
            proposal.feedInvertFlags,
            proposal.loanToValue
        );

        ProposalValuesBase memory proposalValuesBase = ProposalValuesBase({
            refinancingLoanId: refinancingLoanId,
            acceptor: acceptor,
            acceptorControllerData: proposalValues.acceptorControllerData
        });

        // Try to accept proposal
        _acceptProposal(
            proposalHash,
            proposalInclusionProof,
            signature,
            ProposalBase({
                collateralAddress: proposal.collateralAddress,
                collateralId: proposal.collateralId,
                checkCollateralStateFingerprint: proposal.checkCollateralStateFingerprint,
                collateralStateFingerprint: proposal.collateralStateFingerprint,
                creditAmount: proposalValues.creditAmount,
                availableCreditLimit: proposal.availableCreditLimit,
                utilizedCreditId: proposal.utilizedCreditId,
                expiration: proposal.expiration,
                acceptorController: proposal.acceptorController,
                acceptorControllerData: proposal.acceptorControllerData,
                proposer: proposal.proposer,
                isOffer: proposal.isOffer,
                refinancingLoanId: proposal.refinancingLoanId,
                nonceSpace: proposal.nonceSpace,
                nonce: proposal.nonce,
                loanContract: proposal.loanContract
            }),
            proposalValuesBase
        );

        // Create loan terms object
        loanTerms = PWNSimpleLoan.Terms({
            lender: proposal.isOffer ? proposal.proposer : acceptor,
            borrower: proposal.isOffer ? acceptor : proposal.proposer,
            duration: _getLoanDuration(proposal.durationOrDate),
            collateral: MultiToken.Asset({
                category: proposal.collateralCategory,
                assetAddress: proposal.collateralAddress,
                id: proposal.collateralId,
                amount: collateralAmount
            }),
            credit: MultiToken.ERC20({
                assetAddress: proposal.creditAddress,
                amount: proposalValues.creditAmount
            }),
            fixedInterestAmount: proposal.fixedInterestAmount,
            accruingInterestAPR: proposal.accruingInterestAPR,
            lenderSpecHash: proposal.isOffer ? proposal.proposerSpecHash : bytes32(0),
            borrowerSpecHash: proposal.isOffer ? bytes32(0) : proposal.proposerSpecHash
        });
    }
```

</details>

<details>

<summary><code>makeProposal</code></summary>

#### Overview

Function to create an on-chain proposal. Marks the hash of the supplied proposal as proposed.

This function takes one argument supplied by the caller:

* `Proposal calldata`**`proposal`** - Proposal struct containing all needed proposal data

#### Implementation

```solidity
function makeProposal(Proposal calldata proposal) external returns (bytes32 proposalHash) {
    proposalHash = getProposalHash(proposal);
    _makeProposal(proposalHash, proposal.proposer);
    emit ProposalMade(proposalHash, proposal.proposer, proposal);
}
```

</details>

### View Functions

<details>

<summary><code>getProposalHash</code></summary>

#### Overview

This function returns supplied proposals hash according to [EIP-712](https://eips.ethereum.org/EIPS/eip-712).

This function takes one argument supplied by the caller:

* `Proposal calldata`**`proposal`** - [Proposal](elastic-chainlink-proposal.md#proposal-struct) struct to be hashed

#### Implementation

```solidity
function getProposalHash(Proposal calldata proposal) public view returns (bytes32) {
    return _getProposalHash(PROPOSAL_TYPEHASH, _erc712EncodeProposal(proposal));
}
```

</details>

<details>

<summary><code>encodeProposalData</code></summary>

#### Overview

Function to encode a proposal struct and proposal values.

This function takes two arguments supplied by the caller:

* `Proposal memory`**`proposal`** - [Proposal](elastic-chainlink-proposal.md#proposal-struct) struct to be encoded
* `ProposalValues memory`**`proposalValues`** - [ProposalValues](elastic-chainlink-proposal.md#proposalvalues-struct) struct to be encoded

#### Implementation

```solidity
function encodeProposalData(
    Proposal memory proposal,
    ProposalValues memory proposalValues
) external pure returns (bytes memory) {
    return abi.encode(proposal, proposalValues);
}
```

</details>

<details>

<summary><code>decodeProposalData</code></summary>

#### Overview

Function to decode an encoded proposal struct and proposal values.

This function takes one argument supplied by the caller:

* `bytes memory`**`proposalData`** - Encoded [Proposal](elastic-chainlink-proposal.md#proposal-struct) and [ProposalValues](elastic-chainlink-proposal.md#proposalvalues-struct) structs

#### Implementation

```solidity
function decodeProposalData(bytes memory proposalData) public pure returns (Proposal memory, ProposalValues memory) {
    return abi.decode(proposalData, (Proposal, ProposalValues));
}
```

</details>

<details>

<summary><code>getCollateralAmount</code></summary>

#### Overview

Function to compute collateral amount from credit amount and credit per collateral unit.

This function takes two arguments supplied by the caller:

* `uint256`**`creditAmount`** - Amount of credit
* `uint256`**`creditPerCollateralUnit`** - Amount of credit per collateral unit with 38 decimals

#### Implementation

```solidity
function getCollateralAmount(
    address creditAddress,
    uint256 creditAmount,
    address collateralAddress,
    address[] memory feedIntermediaryDenominations,
    bool[] memory feedInvertFlags,
    uint256 loanToValue
) public view returns (uint256) {
    // check L2 sequencer uptime if necessary
    l2SequencerUptimeFeed.checkSequencerUptime();

    // don't allow more than 2 intermediary denominations
    if (feedIntermediaryDenominations.length > MAX_INTERMEDIARY_DENOMINATIONS) {
        revert IntermediaryDenominationsOutOfBounds({
            current: feedIntermediaryDenominations.length,
            limit: MAX_INTERMEDIARY_DENOMINATIONS
        });
    }

    // fetch credit asset price with collateral asset as denomination
    // Note: use ETH price feed for WETH asset due to absence of WETH price feed
    (uint256 price, uint8 priceDecimals) = chainlinkFeedRegistry.fetchCreditPriceWithCollateralDenomination({
        creditAsset: creditAddress == WETH ? Chainlink.ETH : creditAddress,
        collateralAsset: collateralAddress == WETH ? Chainlink.ETH : collateralAddress,
        feedIntermediaryDenominations: feedIntermediaryDenominations,
        feedInvertFlags: feedInvertFlags
    });

    // fetch asset decimals
    uint256 creditDecimals = safeFetchDecimals(creditAddress);
    uint256 collateralDecimals = safeFetchDecimals(collateralAddress);

    if (collateralDecimals > creditDecimals) {
        creditAmount *= 10 ** (collateralDecimals - creditDecimals);
    }

    uint256 collateralAmount = Math.mulDiv(creditAmount, price, 10 ** priceDecimals);
    collateralAmount = Math.mulDiv(collateralAmount, LOAN_TO_VALUE_DENOMINATOR, loanToValue);

    if (collateralDecimals < creditDecimals) {
        collateralAmount /= 10 ** (creditDecimals - collateralDecimals);
    }

    return collateralAmount;
}
```

</details>

### Events

The PWN Simple Loan Elastic Chainlink Proposal contract defines one event and three errors.

```solidity
event ProposalMade(bytes32 indexed proposalHash, address indexed proposer, Proposal proposal);
```

<details>

<summary><code>ProposalMade</code></summary>

ProposalMade event is emitted when an on-chain proposal is made.

This event has three parameters:

* `bytes32 indexed`**`proposalHash`** - Hash of the proposed proposal
* `address indexed`**`proposer`** - Address of the proposer
* `Proposal`**`proposal`** - The proposal made

</details>

### `Errors`

```solidity
error MinCollateralAmountNotSet();
error InsufficientCreditAmount(uint256 current, uint256 limit);
error IntermediaryDenominationsOutOfBounds(uint256 current, uint256 limit);
```

<details>

<summary><code>MinCollateralAmountNotSet</code></summary>

MinCollateralAmountNotSet error is thrown when a proposal has no minimal collateral amount set.

This error doesn't define any parameters.

</details>

<details>

<summary><code>InsufficientCreditAmount</code></summary>

InsufficientCreditAmount error is thrown when acceptor provides insufficient credit amount.

This error has two parameters:

* `uint256`**`current`** - Provided amount
* `uint256`**`limit`** - Minimal amount

</details>

<details>

<summary><code>IntermediaryDenominationsOutOfBounds</code></summary>

IntermediaryDenominationsOutOfBounds error is thrown when intermediary denominations are out of bounds.

This error has two parameters:

* `uint256`**`current`**
* `uint256`**`limit`**

</details>

### `Proposal` struct

| Parameter                         | Type                     | Description                                                                                                                         |
| --------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `collateralCategory`              | `MultiToken.Category`    | Collateral type (0=ERC20, 1=ERC721, 2=ERC1155)                                                                                      |
| `collateralAddress`               | `address`                | Collateral token address                                                                                                            |
| `collateralId`                    | `uint256`                | Collateral token ID (0 for ERC20)                                                                                                   |
| `checkCollateralStateFingerprint` | `bool`                   | Enable ERC-5646 state verification                                                                                                  |
| `collateralStateFingerprint`      | `bytes32`                | ERC-5646 state fingerprint                                                                                                          |
| `creditAddress`                   | `address`                | Loan credit token address                                                                                                           |
| `feedIntermediaryDenominations`   | `address[]`              | Chainlink price feed conversion path                                                                                                |
| `feedInvertFlags`                 | `bool[]`                 | Flags for inverted price feeds                                                                                                      |
| `loanToValue`                     | `uint256`                | LTV ratio (6231 = 62.31%)                                                                                                           |
| `minCreditAmount`                 | `uint256`                | Minimum borrowable credit                                                                                                           |
| `availableCreditLimit`            | `uint256`                | Maximum credit pool for multiple accepts                                                                                            |
| `utilizedCreditId`                | `bytes32`                | Shared credit utilization identifier                                                                                                |
| `fixedInterestAmount`             | `uint256`                | Minimum interest payment                                                                                                            |
| `accruingInterestAPR`             | `uint24`                 | APR with 2 decimals                                                                                                                 |
| `durationOrDate`                  | `uint32`                 | Loan duration (seconds) or end timestamp                                                                                            |
| `expiration`                      | `uint40`                 | Proposal expiration timestamp                                                                                                       |
| `address`                         | `acceptorController`     | Address of [Acceptor Controller](../../peripheral-contracts/acceptor-controller/) contract that will verify submitted acceptor data |
| `bytes`                           | `acceptorControllerData` | Data provided by proposer to be verified by [Acceptor Controller](../../peripheral-contracts/acceptor-controller/)                  |
| `proposer`                        | `address`                | Proposal creator address                                                                                                            |
| `proposerSpecHash`                | `bytes32`                | Proposer-specific data hash                                                                                                         |
| `isOffer`                         | `bool`                   | True=loan offer, False=loan request                                                                                                 |
| `refinancingLoanId`               | `uint256`                | ID of loan being refinanced                                                                                                         |
| `nonceSpace`                      | `uint256`                | Nonce grouping identifier                                                                                                           |
| `nonce`                           | `uint256`                | Proposal uniqueness nonce                                                                                                           |
| `loanContract`                    | `address`                | Associated loan contract address                                                                                                    |

### `ProposalValues` struct

<table><thead><tr><th width="156.09421454876235">Type</th><th width="243.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint256</code></td><td><code>creditAmount</code></td><td>Amount of credit to use from the available credit limit</td></tr><tr><td><code>bytes</code></td><td><code>acceptorControllerData</code></td><td>Data provided by proposal acceptor to be passed to the acceptor controller if defined in the <a href="elastic-chainlink-proposal.md#proposal-struct">Proposal</a> struct</td></tr></tbody></table>
