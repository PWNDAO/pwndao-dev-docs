# Simple Loan

## 1. Summary

PWNSimpleLoan.sol contract manages the simple loan type in the PWN protocol. This contract also acts as a Vault for all assets used in simple loans.

## 2. Important links

* [**Source code**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/terms/simple/loan/PWNSimpleLoan.sol)
* [**ABI**](/assets/PWNSimpleLoan%20(1).json)

## 3. Contract details

* _PWNSimpleLoan.sol_ is written in Solidity version 0.8.16

### Features

* Manages simple loan flow
  * Creation
  * Repayment
  * Claim
* Implements an option for the lender to extend the expiration (maturity) date of a loan
* Acts as a vault for all assets used in simple loans

:::info
The expiration of a loan can be extended by a maximum of 90 days into the future. This is a measure to protect lenders from accidentally extending a loan maturity date too far. Lenders can extend a loan expiration date an unlimited amount of times meaning a loan expiration date can be extended indefinitely.\
\
Minumum duration of a simple loan is 10 minutes.
:::

### Inherited contracts, implemented Interfaces and ERCs

* [PWNVault](../pwn-vault.md)
* [IERC5646](https://eips.ethereum.org/EIPS/eip-5646)
* [IPWNLoanMetadataProvider](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/token/IPWNLoanMetadataProvider.sol)

### Functions

<details id="createloan">

<summary>createLOAN</summary>

#### Overview

Users use this function to start a simple loan in the PWN protocol.

The function **assumes a prior token approval** to a contract address or signed permits.

This function takes four arguments supplied by the caller:

* `ProposalSpec calldata`**`proposalSpec`** - Proposal specification struct
* `LenderSpec calldata`**`lenderSpec`** - Lender specification struct
* `CallerSpec calldata`**`callerSpec`** - Caller specification struct
* `bytes calldata`**`extra`** - Auxiliary data that are emitted in the [`LOANCreated`](#loancreated) event. They are not used in the contract logic.

#### Implementation

```solidity
function createLOAN(
    ProposalSpec calldata proposalSpec,
    LenderSpec calldata lenderSpec,
    CallerSpec calldata callerSpec,
    bytes calldata extra
) external returns (uint256 loanId) {
    // Check provided proposal contract
    if (!hub.hasTag(proposalSpec.proposalContract, PWNHubTags.LOAN_PROPOSAL)) {
        revert AddressMissingHubTag({ addr: proposalSpec.proposalContract, tag: PWNHubTags.LOAN_PROPOSAL });
    }

    // Revoke nonce if needed
    if (callerSpec.revokeNonce) {
        revokedNonce.revokeNonce(msg.sender, callerSpec.nonce);
    }

    // If refinancing a loan, check that the loan can be repaid
    if (callerSpec.refinancingLoanId != 0) {
        LOAN storage loan = LOANs[callerSpec.refinancingLoanId];
        _checkLoanCanBeRepaid(loan.status, loan.defaultTimestamp);
    }

    // Accept proposal and get loan terms
    (bytes32 proposalHash, Terms memory loanTerms) = PWNSimpleLoanProposal(proposalSpec.proposalContract)
        .acceptProposal({
            acceptor: msg.sender,
            refinancingLoanId: callerSpec.refinancingLoanId,
            proposalData: proposalSpec.proposalData,
            proposalInclusionProof: proposalSpec.proposalInclusionProof,
            signature: proposalSpec.signature
        });

    // Check that provided lender spec is correct
    if (msg.sender != loanTerms.lender && loanTerms.lenderSpecHash != getLenderSpecHash(lenderSpec)) {
        revert InvalidLenderSpecHash({ current: loanTerms.lenderSpecHash, expected: getLenderSpecHash(lenderSpec) });
    }

    // Check minimum loan duration
    if (loanTerms.duration < MIN_LOAN_DURATION) {
        revert InvalidDuration({ current: loanTerms.duration, limit: MIN_LOAN_DURATION });
    }

    // Check maximum accruing interest APR
    if (loanTerms.accruingInterestAPR > MAX_ACCRUING_INTEREST_APR) {
        revert InterestAPROutOfBounds({ current: loanTerms.accruingInterestAPR, limit: MAX_ACCRUING_INTEREST_APR });
    }

    if (callerSpec.refinancingLoanId == 0) {
        // Check loan credit and collateral validity
        _checkValidAsset(loanTerms.credit);
        _checkValidAsset(loanTerms.collateral);
    } else {
        // Check refinance loan terms
        _checkRefinanceLoanTerms(callerSpec.refinancingLoanId, loanTerms);
    }

    // Create a new loan
    loanId = _createLoan({
        loanTerms: loanTerms,
        lenderSpec: lenderSpec
    });

    emit LOANCreated({
        loanId: loanId,
        proposalHash: proposalHash,
        proposalContract: proposalSpec.proposalContract,
        refinancingLoanId: callerSpec.refinancingLoanId,
        terms: loanTerms,
        lenderSpec: lenderSpec,
        extra: extra
    });

    // Execute permit for the caller
    if (callerSpec.permitData.length > 0) {
        Permit memory permit = abi.decode(callerSpec.permitData, (Permit));
        _checkPermit(msg.sender, loanTerms.credit.assetAddress, permit);
        _tryPermit(permit);
    }

    // Settle the loan
    if (callerSpec.refinancingLoanId == 0) {
        // Transfer collateral to Vault and credit to borrower
        _settleNewLoan(loanTerms, lenderSpec);
    } else {
        // Update loan to repaid state
        _updateRepaidLoan(callerSpec.refinancingLoanId);

        // Repay the original loan and transfer the surplus to the borrower if any
        _settleLoanRefinance({
            refinancingLoanId: callerSpec.refinancingLoanId,
            loanTerms: loanTerms,
            lenderSpec: lenderSpec
        });
    }
}
```

</details>

<details id="loancreated">

<summary><code>LOANCreated</code></summary>

LOANCreated is emitted when a new simple loan is created. 

This event has two parameters:

* `uint256 indexed`**`loanId`** - ID of the LOAN token that is associated with the created loan
* `bytes32 indexed`**`proposalHash`** - Hash of the proposal struct
* `address indexed`**`proposalContract`** - Address of the proposal contract
* `uint256`**`refinancingLoanId`** - ID of a loan to be refinanced. Zero if creating a new loan.
* `Terms`**`terms`** - Terms struct defining simple loan parameters
* `LenderSpec`**`lenderSpec`** - LenderSpec struct
* `bytes`**`extra`** - Auxiliary data provided by the caller to the [`createLOAN`](#createloan) function

</details>

<details>

<summary>repayLOAN</summary>

#### Overview

Borrowers use this function to repay simple loans in the PWN Protocol. &#x20;

This function takes two arguments supplied by the caller:

* `uint256`**`loanId`** - ID of the loan that is being repaid
* `bytes calldata`**`permitData`** - Permit data for a loan asset signed by borrower

#### Implementation

```solidity
function repayLOAN(
    uint256 loanId,
    bytes calldata permitData
) external {
    LOAN storage loan = LOANs[loanId];

    _checkLoanCanBeRepaid(loan.status, loan.defaultTimestamp);

    // Update loan to repaid state
    _updateRepaidLoan(loanId);

    // Execute permit for the caller
    if (permitData.length > 0) {
        Permit memory permit = abi.decode(permitData, (Permit));
        _checkPermit(msg.sender, loan.creditAddress, permit);
        _tryPermit(permit);
    }

    // Transfer the repaid credit to the Vault
    uint256 repaymentAmount = loanRepaymentAmount(loanId);
    _pull(loan.creditAddress.ERC20(repaymentAmount), msg.sender);

    // Transfer collateral back to borrower
    _push(loan.collateral, loan.borrower);

    // Try to repay directly
    try this.tryClaimRepaidLOAN(loanId, repaymentAmount, loanToken.ownerOf(loanId)) {} catch {
        // Note: Safe transfer or supply to a pool can fail. In that case leave the LOAN token in repaid state and
        // wait for the LOAN token owner to claim the repaid credit. Otherwise lender would be able to prevent
        // borrower from repaying the loan.
    }
}
```

</details>

<details>

<summary>claimLOAN</summary>

#### Overview

Holders of LOAN tokens (lenders) use this function to claim a repaid loan or defaulted collateral. The claimed asset is transferred to the LOAN token holder and the LOAN token is burned.&#x20;

This function takes one argument supplied by the caller:

* `uint256`**`loanId`** - ID of the loan that is being claimed

#### Implementation

```solidity
function claimLOAN(uint256 loanId) external {
    LOAN storage loan = LOANs[loanId];

    // Check that caller is LOAN token holder
    if (loanToken.ownerOf(loanId) != msg.sender)
        revert CallerNotLOANTokenHolder();

    if (loan.status == 0)
        // Loan is not existing or from a different loan contract
        revert NonExistingLoan();
    else if (loan.status == 3)
        // Loan has been paid back
        _settleLoanClaim({ loanId: loanId, loanOwner: msg.sender, defaulted: false });
    else if (loan.status == 2 && loan.defaultTimestamp <= block.timestamp)
        // Loan is running but expired
        _settleLoanClaim({ loanId: loanId, loanOwner: msg.sender, defaulted: true });
    else
        // Loan is in wrong state
        revert LoanRunning();
}
```

</details>

<details>

<summary>extendLOAN</summary>

#### Overview

This function extends loan default date with signed extension proposal signed by borrower or the LOAN token owner (usually the lender).&#x20;

This function takes three arguments supplied by the caller:

* `ExtensionProposal calldata`**`extension`** - Loan extension proposal struct
* `bytes calldata`**`signature`** - Signature of the extension proposal
* `bytes calldata`**`permitData`** - Callers credit permit data

#### Implementation

```solidity
function extendLOAN(
    ExtensionProposal calldata extension,
    bytes calldata signature,
    bytes calldata permitData
) external {
    LOAN storage loan = LOANs[extension.loanId];

    // Check that loan is in the right state
    if (loan.status == 0)
        revert NonExistingLoan();
    if (loan.status == 3) // cannot extend repaid loan
        revert LoanRepaid();

    // Check extension validity
    bytes32 extensionHash = getExtensionHash(extension);
    if (!extensionProposalsMade[extensionHash])
        if (!PWNSignatureChecker.isValidSignatureNow(extension.proposer, extensionHash, signature))
            revert PWNSignatureChecker.InvalidSignature({ signer: extension.proposer, digest: extensionHash });

    // Check extension expiration
    if (block.timestamp >= extension.expiration)
        revert Expired({ current: block.timestamp, expiration: extension.expiration });

    // Check extension nonce
    if (!revokedNonce.isNonceUsable(extension.proposer, extension.nonceSpace, extension.nonce))
        revert PWNRevokedNonce.NonceNotUsable({
            addr: extension.proposer,
            nonceSpace: extension.nonceSpace,
            nonce: extension.nonce
        });

    // Check caller and signer
    address loanOwner = loanToken.ownerOf(extension.loanId);
    if (msg.sender == loanOwner) {
        if (extension.proposer != loan.borrower) {
            // If caller is loan owner, proposer must be borrower
            revert InvalidExtensionSigner({
                allowed: loan.borrower,
                current: extension.proposer
            });
        }
    } else if (msg.sender == loan.borrower) {
        if (extension.proposer != loanOwner) {
            // If caller is borrower, proposer must be loan owner
            revert InvalidExtensionSigner({
                allowed: loanOwner,
                current: extension.proposer
            });
        }
    } else {
        // Caller must be loan owner or borrower
        revert InvalidExtensionCaller();
    }

    // Check duration range
    if (extension.duration < MIN_EXTENSION_DURATION)
        revert InvalidExtensionDuration({
            duration: extension.duration,
            limit: MIN_EXTENSION_DURATION
        });
    if (extension.duration > MAX_EXTENSION_DURATION)
        revert InvalidExtensionDuration({
            duration: extension.duration,
            limit: MAX_EXTENSION_DURATION
        });

    // Revoke extension proposal nonce
    revokedNonce.revokeNonce(extension.proposer, extension.nonceSpace, extension.nonce);

    // Update loan
    uint40 originalDefaultTimestamp = loan.defaultTimestamp;
    loan.defaultTimestamp = originalDefaultTimestamp + extension.duration;

    // Emit event
    emit LOANExtended({
        loanId: extension.loanId,
        originalDefaultTimestamp: originalDefaultTimestamp,
        extendedDefaultTimestamp: loan.defaultTimestamp
    });

    // Skip compensation transfer if it's not set
    if (extension.compensationAddress != address(0) && extension.compensationAmount > 0) {
        MultiToken.Asset memory compensation = extension.compensationAddress.ERC20(extension.compensationAmount);

        // Check compensation asset validity
        _checkValidAsset(compensation);

        // Transfer compensation to the loan owner
        if (permitData.length > 0) {
            Permit memory permit = abi.decode(permitData, (Permit));
            _checkPermit(msg.sender, extension.compensationAddress, permit);
            _tryPermit(permit);
        }
        _pushFrom(compensation, loan.borrower, loanOwner);
    }
}
```

</details>

<details>

<summary><code>makeExtensionProposal</code></summary>

#### Overview

This function an on-chain extension proposal.&#x20;

This function takes one argument supplied by the caller:

* `ExtensionProposal calldata`**`extension`** - Loan extension proposal struct

#### Implementation

```solidity
function makeExtensionProposal(ExtensionProposal calldata extension) external {
    // Check that caller is a proposer
    if (msg.sender != extension.proposer)
        revert InvalidExtensionSigner({ allowed: extension.proposer, current: msg.sender });

    // Mark extension proposal as made
    bytes32 extensionHash = getExtensionHash(extension);
    extensionProposalsMade[extensionHash] = true;

    emit ExtensionProposalMade(extensionHash, extension.proposer, extension);
}
```

</details>

### View Functions

<details>

<summary><code>getLOAN</code></summary>

#### Overview

Returns a tuple with information about a supplied loan ID.&#x20;

This function takes one argument supplied by the caller:

* `uint256`**`loanId`** - ID of the loan to get parameters for

#### Implementation

```solidity
function getLOAN(uint256 loanId) external view returns (
    uint8 status,
    uint40 startTimestamp,
    uint40 defaultTimestamp,
    address borrower,
    address originalLender,
    address loanOwner,
    uint24 accruingInterestAPR,
    uint256 fixedInterestAmount,
    MultiToken.Asset memory credit,
    MultiToken.Asset memory collateral,
    address originalSourceOfFunds,
    uint256 repaymentAmount
) {
    LOAN storage loan = LOANs[loanId];

    status = _getLOANStatus(loanId);
    startTimestamp = loan.startTimestamp;
    defaultTimestamp = loan.defaultTimestamp;
    borrower = loan.borrower;
    originalLender = loan.originalLender;
    loanOwner = loan.status != 0 ? loanToken.ownerOf(loanId) : address(0);
    accruingInterestAPR = loan.accruingInterestAPR;
    fixedInterestAmount = loan.fixedInterestAmount;
    credit = loan.creditAddress.ERC20(loan.principalAmount);
    collateral = loan.collateral;
    originalSourceOfFunds = loan.originalSourceOfFunds;
    repaymentAmount = loanRepaymentAmount(loanId);
}
```

</details>

<details>

<summary><code>loanRepaymentAmount</code></summary>

#### Overview

Calculates the loan repayment amount for supplied loan ID.&#x20;

This function takes one argument supplied by the caller:

* `uint256`**`loanId`** - ID of the loan to get loan repayment amount for

#### Implementation

```solidity
function loanRepaymentAmount(uint256 loanId) public view returns (uint256) {
    LOAN storage loan = LOANs[loanId];

    // Check non-existent loan
    if (loan.status == 0) return 0;

    // Return loan principal with accrued interest
    return loan.principalAmount + _loanAccruedInterest(loan);
}
```

</details>

<details>

<summary><code>getExtensionHash</code></summary>

#### Overview

Returns hash of the supplied loan extension proposal struct.

This function takes one argument supplied by the caller:

* `ExtensionProposal calldata`**`extension`** - Loan extension proposal struct

#### Implementation

```solidity
function getExtensionHash(ExtensionProposal calldata extension) public view returns (bytes32) {
    return keccak256(abi.encodePacked(
        hex"1901",
        DOMAIN_SEPARATOR,
        keccak256(abi.encodePacked(
            EXTENSION_PROPOSAL_TYPEHASH,
            abi.encode(extension)
        ))
    ));
}
```

</details>

<details>

<summary><code>isValidAsset</code></summary>

#### Overview

Checks if the supplied asset is valid with the MultiToken dependency lib and the category registry.

This function takes one argument supplied by the caller:

* `MultiToken.Asset`**`asset`** - The asset to check (see [MultiToken](../../../libraries/multitoken.md))

#### Implementation

```solidity
function isValidAsset(MultiToken.Asset memory asset) public view returns (bool) {
    return MultiToken.isValid(asset, categoryRegistry);
}
```

</details>

<details>

<summary><code>loanMetadataUri</code></summary>

#### Overview

Returns a [metadata URI](https://docs.opensea.io/docs/metadata-standards) for LOAN tokens. This URI is defined in [PWN Config](../pwn-config.md).&#x20;

This function doesn't take any arguments.&#x20;

#### Implementation

```solidity
function loanMetadataUri() override external view returns (string memory) {
    return config.loanMetadataUri(address(this));
}
```

</details>

<details>

<summary><code>getStateFingerprint</code></summary>

#### Overview

This function returns the current token state fingerprint for a supplied token ID. See [ERC-5646](https://eips.ethereum.org/EIPS/eip-5646) standard specification for more detailed information. &#x20;

This function takes one argument supplied by the caller:

* `uint256`**`tokenId`** - ID of the LOAN token to get a fingerprint for

#### Implementation

```solidity
function getStateFingerprint(uint256 tokenId) external view virtual override returns (bytes32) {
    LOAN storage loan = LOANs[tokenId];

    if (loan.status == 0)
        return bytes32(0);

    // The only mutable state properties are:
    // - status: updated for expired loans based on block.timestamp
    // - defaultTimestamp: updated when the loan is extended
    // - fixedInterestAmount: updated when the loan is repaid and waiting to be claimed
    // - accruingInterestAPR: updated when the loan is repaid and waiting to be claimed
    // Others don't have to be part of the state fingerprint as it does not act as a token identification.
    return keccak256(abi.encode(
        _getLOANStatus(tokenId),
        loan.defaultTimestamp,
        loan.fixedInterestAmount,
        loan.accruingInterestAPR
    ));
}
```

</details>

### Events

The PWN Simple Loan contract defines one event and no custom errors.

```solidity
event LOANCreated(uint256 indexed loanId, bytes32 indexed proposalHash, address indexed proposalContract, uint256 refinancingLoanId, Terms terms, LenderSpec lenderSpec, bytes extra);
event LOANPaidBack(uint256 indexed loanId);
event LOANClaimed(uint256 indexed loanId, bool indexed defaulted);
event LOANExtended(uint256 indexed loanId, uint40 originalDefaultTimestamp, uint40 extendedDefaultTimestamp);
event ExtensionProposalMade(bytes32 indexed extensionHash, address indexed proposer,  ExtensionProposal proposal);
```

<details>

<summary><code>LOANCreated</code></summary>

LOANCreated is emitted when a new simple loan is created. 

This event has two parameters:

* `uint256 indexed`**`loanId`** - ID of the LOAN token that is associated with the created loan
* `bytes32 indexed`**`proposalHash`** - Hash of the proposal struct
* `address indexed`**`proposalContract`** - Address of the proposal contract
* `uint256`**`refinancingLoanId`** - ID of a loan to be refinanced. Zero if creating a new loan.
* `Terms`**`terms`** - Terms struct defining simple loan parameters
* `LenderSpec`**`lenderSpec`** - LenderSpec struct
* `bytes`**`extra`** - Auxiliary data provided by the caller to the [`createLOAN`](#createloan) function

</details>

<details>

<summary><code>LOANPaidBack</code></summary>

LOANPaidBack event is emitted when a borrower repays a simple loan.

This event has one parameter:

* `uint256 indexed`**`loanId`** - ID of the LOAN token that is associated with the repaid loan

</details>

<details>

<summary><code>LOANClaimed</code></summary>

LOANClaimed event is emitted when a lender claims repaid asset or defaulted collateral.&#x20;

This event has two parameters:

* `uint256 indexed`**`loanId`** - ID of the LOAN token that is associated with the claimed loan
* `bool indexed`**`defaulted`** - Boolean determining if the claimed loan was defaulted or properly repaid

</details>

<details>

<summary><code>LOANExtended</code></summary>

LOANExtended event is emitted when a LOAN token holder extends a loan.

This event has three parameters:

* `uint256 indexed`**`loanId`** - ID of the LOAN token that is associated with the loan being extended
* `uint40`**`originalDefaultTimestamp`** - Original timestamp
* `uint40`**`extendedDefaultTimestamp`** - New timestamp

</details>

<details>

<summary><code>ExtensionProposalMade</code></summary>

ExtensionProposalMade event is emitted when an on-chain loan extension proposal is made.

This event has two parameters:

* `bytes32 indexed`**`extensionHash`** - Hash of the created extension proposal
* `address indexed`**`proposer`** - Address of the account that created the extension proposal
* `ExtensionProposal`**`proposal`** - Extension proposal struct

</details>

### Errors

```solidity
error LoanNotRunning();
error LoanRunning();
error LoanRepaid();
error LoanDefaulted(uint40);
error NonExistingLoan();
error CallerNotLOANTokenHolder();
error RefinanceBorrowerMismatch(address currentBorrower, address newBorrower);
error RefinanceCreditMismatch();
error RefinanceCollateralMismatch();
error InvalidLenderSpecHash(bytes32 current, bytes32 expected);
error InvalidDuration(uint256 current, uint256 limit);
error InterestAPROutOfBounds(uint256 current, uint256 limit);
error CallerNotVault();
error InvalidSourceOfFunds(address sourceOfFunds);
error InvalidExtensionCaller();
error InvalidExtensionSigner(address allowed, address current);
error InvalidExtensionDuration(uint256 duration, uint256 limit);
error InvalidMultiTokenAsset(uint8 category, address addr, uint256 id, uint256 amount);
```

<details>

<summary><code>LoanNotRunning</code></summary>

A LoanNotRunning error is thrown when managed loan is not running.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>LoanRunning</code></summary>

A LoanRunning error is thrown when managed loan is running.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>LoanRepaid</code></summary>

A LoanRepaid error is thrown when managed loan is repaid.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>LoanDefaulted</code></summary>

A NonExistingLoan error is thrown when loan doesn't exist.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>CallerNotLOANTokenHolder</code></summary>

A CallerNotLOANTokenHolder error is thrown when caller is not a LOAN token holder.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>RefinanceBorrowerMismatch</code></summary>

A RefinanceBorrowerMismatch error is thrown when refinancing loan terms have different borrower than the original loan.&#x20;

This error has two parameters:

* `address`**`currentBorrower`**
* `address`**`newBorrower`**

</details>

<details>

<summary><code>RefinanceCreditMismatch</code></summary>

A RefinanceCreditMismatch error is thrown when refinancing loan terms have different credit asset than the original loan.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>RefinanceCollateralMismatch</code></summary>

A RefinanceCollateralMismatch error is thrown when refinancing loan terms have different collateral asset than the original loan.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>InvalidLenderSpecHash</code></summary>

A InvalidLenderSpecHash error is thrown when hash of provided lender spec doesn't match the one in loan terms.

This error has two parameters:

* `bytes32`**`current`** - Provided lender spec hash
* `bytes32`**`expected`** - Expected lender spec hash

</details>

<details>

<summary><code>InvalidDuration</code></summary>

A InvalidDuration error is thrown when loan duration is below the minimum (10 minutes).

This error has two parameters:

* `uint256`**`current`** - Provided loan duration
* `uint256`**`limit`** - Provided loan duration

</details>

<details>

<summary><code>InterestAPROutOfBounds</code></summary>

A InterestAPROutOfBounds error is thrown when accruing interest APR is above the maximum.

This error has two parameters:

* `uint256`**`current`** - Current accrued interest
* `uint256`**`limit`** - Maximum accrued interest

</details>

<details>

<summary><code>CallerNotVault</code></summary>

A CallerNotVault error is thrown when caller is not a vault.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>InvalidSourceOfFunds</code></summary>

A InvalidSourceOfFunds error is thrown when  pool based source of funds doesn't have a registered adapter.

This error has one parameter:

* `address`**`sourceOfFunds`**

</details>

<details>

<summary><code>InvalidExtensionCaller</code></summary>

A InvalidExtensionCaller error is thrown when caller is not a loan borrower or lender.

This error has doesn't define any parameters.

</details>

<details>

<summary><code>InvalidExtensionSigner</code></summary>

A InvalidExtensionSigner error is thrown when signer is not a loan extension proposer.

This error has two parameters:

* `address`**`allowed`**
* `address`**`current`**

</details>

<details>

<summary><code>InvalidExtensionDuration</code></summary>

A InvalidExtensionDuration error is thrown when loan extension duration is out of bounds.

This error has two parameters:

* `uint256`**`duration`**
* `uint256`**`limit`**

</details>

<details>

<summary><code>InvalidMultiTokenAsset</code></summary>

A InvalidMultiTokenAsset error is thrown when MultiToken Asset struct is invalid which can happen because of invalid category, address, id or amount.&#x20;

See [MultiToken](../../../libraries/multitoken.md) for more information about the Asset struct.

This error has four parameters:

* `uint8`**`category`**
* `address`**`addr`**
* `uint256`**`id`**
* `uint256`**`amount`**

</details>

### `Terms` Struct

<table><thead><tr><th width="157.09421454876235">Type</th><th width="228.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>address</code></td><td><code>lender</code></td><td>Address of a lender</td></tr><tr><td><code>address</code></td><td><code>borrower</code></td><td>Address of a borrower</td></tr><tr><td><code>uint32</code></td><td><code>duration</code></td><td>Loan duration in seconds</td></tr><tr><td><code>MultiToken.Asset</code> (see <a href="https://dev-docs.pwn.xyz/smart-contracts/libraries/multitoken#asset-struct">Asset struct</a>)</td><td><code>collateral</code></td><td>Asset used as a loan collateral</td></tr><tr><td><code>MultiToken.Asset</code> (see <a href="https://dev-docs.pwn.xyz/smart-contracts/libraries/multitoken#asset-struct">Asset struct</a>)</td><td><code>credit</code></td><td>Asset used as a loan credit</td></tr><tr><td><code>uint256</code></td><td><code>fixedInterestAmount</code></td><td>Fixed interest amount in credit asset tokens. It is the minimum amount of interest which has to be paid by a borrower</td></tr><tr><td><code>uint24</code></td><td><code>accruingInterestAPR</code></td><td>Accruing interest APR with 2 decimals</td></tr><tr><td><code>bytes32</code></td><td><code>lenderSpecHash</code></td><td>Hash of a lender specification struct</td></tr><tr><td><code>bytes32</code></td><td><code>borrowerSpecHash</code></td><td>Hash of a borrower specification struct</td></tr></tbody></table>

### `ProposalSpec` Struct

<table><thead><tr><th width="144.09421454876235">Type</th><th width="203.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>address</code></td><td><code>proposalContract</code></td><td>Address of a loan proposal contract</td></tr><tr><td><code>bytes</code></td><td><code>proposalData</code></td><td>Encoded proposal data that is passed to the loan proposal contract</td></tr><tr><td><code>bytes32[]</code></td><td><code>proposalInclusionProof</code></td><td>Inclusion proof of the proposal in the proposal contract</td></tr><tr><td><code>bytes</code></td><td><code>signature</code></td><td>Signature of the proposal</td></tr></tbody></table>

### `LenderSpec` Struct

<table><thead><tr><th width="124.09421454876235">Type</th><th width="178.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>address</code></td><td><code>sourceOfFunds</code></td><td>Address of a source of funds. This can be the lenders address, if the loan is funded directly, or a pool address from which the funds are withdrawn on the lenders behalf</td></tr></tbody></table>

### `CallerSpec` Struct

<table><thead><tr><th width="128.09421454876235">Type</th><th width="216.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint256</code></td><td><code>refinancingLoanId</code></td><td>ID of a loan to be refinanced. Zero if creating a new loan</td></tr><tr><td><code>bool</code></td><td><code>revokeNonce</code></td><td>Flag if the callers nonce should be revoked</td></tr><tr><td><code>uint256</code></td><td><code>nonce</code></td><td>Callers nonce to be revoked. Nonce is revoked from the current nonce space</td></tr><tr><td><code>bytes</code></td><td><code>permitData</code></td><td>Callers permit data for a loans credit asset</td></tr></tbody></table>

### `LOAN` Struct

<table><thead><tr><th width="155.09421454876235">Type</th><th width="205.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint8</code></td><td><code>status</code></td><td><p>0 -> None/Dead </p><p>2 -> Running</p><p>3 -> Repaid </p><p>4 -> Expired</p></td></tr><tr><td><code>address</code></td><td><code>creditAddress</code></td><td>Address of an asset used as a loan credit</td></tr><tr><td><code>address</code></td><td><code>originalSourceOfFunds</code></td><td>Address of a source of funds that was used to fund the loan</td></tr><tr><td><code>uint40</code></td><td><code>startTimestamp</code></td><td>Unix timestamp (in seconds) of a start date</td></tr><tr><td><code>uint40</code></td><td><code>defaultTimestamp</code></td><td>Unix timestamp (in seconds) of a default date</td></tr><tr><td><code>address</code></td><td><code>borrower</code></td><td>Address of a borrower</td></tr><tr><td><code>address</code></td><td><code>originalLender</code></td><td>Address of a lender that funded the loan</td></tr><tr><td><code>uint24</code></td><td><code>accruingInterestAPR</code></td><td>Accruing interest APR with 2 decimals</td></tr><tr><td><code>uint256</code></td><td><code>fixedInterestAmount</code></td><td>Fixed interest amount in credit asset tokens. It is the minimum amount of interest which has to be paid by a borrower. This property is reused to store the final interest amount if the loan is repaid and waiting to be claimed.</td></tr><tr><td><code>uint256</code></td><td><code>principalAmount</code></td><td>Principal amount in credit asset tokens</td></tr><tr><td><code>MultiToken.Asset</code> (see <a href="https://dev-docs.pwn.xyz/smart-contracts/libraries/multitoken#asset-struct">Asset struct</a>)</td><td><code>collateral</code></td><td>Asset used as a loan collateral</td></tr></tbody></table>

### `ExtensionProposal` Struct

<table><thead><tr><th width="125.09421454876235">Type</th><th width="223.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint256</code></td><td><code>loanId</code></td><td>ID of a loan to be extended</td></tr><tr><td><code>address</code></td><td><code>compensationAddress</code></td><td>Address of a compensation asset</td></tr><tr><td><code>uint256</code></td><td><code>compensationAmount</code></td><td>Amount of a compensation asset that a borrower has to pay to a lender</td></tr><tr><td><code>uint40</code></td><td><code>duration</code></td><td>Duration of the extension in seconds</td></tr><tr><td><code>uint40</code></td><td><code>expiration</code></td><td>Unix timestamp (in seconds) of an expiration date</td></tr><tr><td><code>address</code></td><td><code>proposer</code></td><td>Address of a proposer that signed the extension proposal</td></tr><tr><td><code>uint256</code></td><td><code>nonceSpace</code></td><td>Nonce space of the extension proposal nonce</td></tr><tr><td><code>uint256</code></td><td><code>nonce</code></td><td>Nonce of the extension proposal</td></tr></tbody></table>
