# Elastic Proposal

## 1. Summary

PWNSimpleLoanElasticProposal.sol defines the Fungible Proposal type for Simple Loan and implements functions to make an on-chain proposal and accept proposals.&#x20;

The Fungible Proposal is not tied to a specific collateral or credit amount. The amount of collateral and credit is specified during the proposal acceptance. Interest can be either accruing or fixed.&#x20;

## 2. Important link

[https://github.com/PWNDAO/pwn_contracts/blob/master/src/loan/terms/simple/proposal/PWNSimpleLoanElasticProposal.sol](https://github.com/PWNDAO/pwn_contracts/blob/master/src/loan/terms/simple/proposal/PWNSimpleLoanElasticProposal.sol)

[ABI](/assets/PWNSimpleLoanFungibleProposal.json)

## 3. Contract details

* _PWNSimpleLoanElasticProposal.sol_ is written in Solidity version 0.8.16

### Features

* Provides `acceptProposal` function and `makeProposal` for on-chain proposals
* Defines the `Proposal` struct

### Inherited contracts, implemented Interfaces and ERCs

* [PWNSimpleLoanProposal](./)

### Functions

<details>

<summary><code>acceptProposal</code></summary>

#### Overview

A function to accept a proposal.

This function takes five arguments supplied by the caller:

* `address`**`acceptor`** - Address of a proposal acceptor
* `uint256`**`refinancingLoanId`** - Refinancing loan ID
* `bytes32 calldata`**`proposalData`** - Encoded proposal struct
* `bytes32[] calldata`**`proposalInclusionProof`** - Multiproposal inclusion proof. Empty if single proposal
* `bytes calldata`**`signature`** - Signature of a proposal

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

    // Calculate credit amount
    uint256 collateralAmount = getCollateralAmount(proposalValues.creditAmount, proposal.creditPerCollateralUnit);

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

* `Proposal calldata`**`proposal`** - [Proposal](elastic-proposal.md#proposal-struct) struct to be hashed

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

* `Proposal memory`**`proposal`** - [Proposal](elastic-proposal.md#proposal-struct) struct to be encoded
* `ProposalValues memory`**`proposalValues`** - [ProposalValues](elastic-proposal.md#proposalvalues-struct) struct to be encoded

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

* `bytes memory`**`proposalData`** - Encoded [Proposal](elastic-proposal.md#proposal-struct) and [ProposalValues](elastic-proposal.md#proposalvalues-struct) structs

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
function getCollateralAmount(uint256 creditAmount, uint256 creditPerCollateralUnit) public pure returns (uint256) {
    if (creditPerCollateralUnit == 0) {
        revert ZeroCreditPerCollateralUnit();
    }

    return Math.mulDiv(creditAmount, CREDIT_PER_COLLATERAL_UNIT_DENOMINATOR, creditPerCollateralUnit);
}
```

</details>

### Events

The PWN Simple Loan Elastic Proposal contract defines one event and two errors.

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

### `Proposal` struct

<table><thead><tr><th width="156.09421454876235">Type</th><th width="265.4565628764715">Name</th><th>Comment</th></tr></thead><tbody><tr><td><a data-footnote-ref href="#user-content-fn-1"><code>MultiToken.Category</code></a></td><td><code>collateralCategory</code></td><td>Corresponding collateral category</td></tr><tr><td><code>address</code></td><td><code>collateralAddress</code></td><td>Address of a loan collateral</td></tr><tr><td><code>uint256</code></td><td><code>collateralId</code></td><td>ID of a collateral. Zero if ERC-20</td></tr><tr><td><code>uint256</code></td><td><code>minCollateralAmount</code></td><td>Minimal amount of tokens used as a collateral</td></tr><tr><td><code>bool</code></td><td><code>checkCollateralStateFingerprint</code></td><td>Flag to enable check of collaterals state fingerprint (see <a href="https://eips.ethereum.org/EIPS/eip-5646">ERC-5</a><a href="https://eips.ethereum.org/EIPS/eip-5646">646</a>)</td></tr><tr><td><code>bytes32</code></td><td><code>collateralStateFingerprint</code></td><td>A collateral state fingerprint (see <a href="https://eips.ethereum.org/EIPS/eip-5646">ERC-5</a><a href="https://eips.ethereum.org/EIPS/eip-5646">646</a>)</td></tr><tr><td><code>address</code></td><td><code>creditAddress</code></td><td>Address of credit asset</td></tr><tr><td><code>uint256</code></td><td><code>creditPerCollateralUnit</code></td><td>Amount of tokens that are offered per collateral unit with 38 decimals</td></tr><tr><td><code>uint256</code></td><td><code>availableCreditLimit</code></td><td>Maximum credit limit of credit asset</td></tr><tr><td><code>uint256</code></td><td><code>fixedInterestAmount</code></td><td>Fixed interest amount in credit tokens. It is the minimum amount of interest which has to be paid by a borrower</td></tr><tr><td><code>uint24</code></td><td><code>accruingInterestAPR</code></td><td>Accruing interest APR with 2 decimals</td></tr><tr><td><code>uint32</code></td><td><code>durationOrDate</code></td><td>Duration of a loan in seconds. If the value is greater than <code>10^9</code>, it's considered a timestamp of the loan end</td></tr><tr><td><code>uint40</code></td><td><code>expiration</code></td><td>Proposal expiration unix timestamp in seconds</td></tr><tr><td><code>address</code></td><td><code>acceptorController</code></td><td>Address of <a href="../../peripheral-contracts/acceptor-controller/">Acceptor Controller</a> contract that will verify submitted acceptor data</td></tr><tr><td><code>bytes</code></td><td><code>acceptorControllerData</code></td><td>Data provided by proposer to be verified by <a href="../../peripheral-contracts/acceptor-controller/">Acceptor Controller</a></td></tr><tr><td><code>address</code></td><td><code>proposer</code></td><td>Proposer address</td></tr><tr><td><code>bytes32</code></td><td><code>proposerSpecHash</code></td><td>Hash of a proposer specific data, which must be provided during a loan creation</td></tr><tr><td><code>bool</code></td><td><code>isOffer</code></td><td>Flag to determine if a proposal is an offer or loan request</td></tr><tr><td><code>uint256</code></td><td><code>refinancingLoanId</code></td><td>ID of a loan to be refinanced. Zero if creating a new loan.</td></tr><tr><td><code>uint256</code></td><td><code>nonceSpace</code></td><td>Nonce space of the proposal</td></tr><tr><td><code>uint256</code></td><td><code>nonce</code></td><td>Nonce of the proposal</td></tr><tr><td><code>address</code></td><td><code>loanContract</code></td><td>Loan type contract</td></tr></tbody></table>

### `ProposalValues` struct

<table><thead><tr><th width="156.09421454876235">Type</th><th width="243.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint256</code></td><td><code>creditAmount</code></td><td>Amount of credit to use from the available credit limit</td></tr><tr><td><code>bytes</code></td><td><code>acceptorControllerData</code></td><td>Data provided by proposal acceptor to be passed to the acceptor controller if defined in the <a href="elastic-proposal.md#proposal-struct">Proposal</a> struct</td></tr></tbody></table>

[^1]: A **category** is defined as an [enum](https://docs.soliditylang.org/en/v0.8.12/structure-of-a-contract.html?highlight=enum#enum-types) and can have values `ERC20`, `ERC721` or `ERC1155`.
