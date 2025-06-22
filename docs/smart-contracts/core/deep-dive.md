# Deep Dive

Welcome to our deep-dive article on the PWN Protocol. This article provides a comprehensive understanding of the PWN Protocol architecture and properties. With each section, we will build upon the PWN Protocol architecture diagram and finally end up with the full picture.

:::success
This article assumes you're familiar with EVM, Solidity, and PWN. If you're not we suggest visiting the [ethereum.org](http://ethereum.org) website and reading our [Introduction to the PWN Protocol](introduction.md).
:::

Here's an overview of the topics covered in this article:

* [Hub](deep-dive.md#hub) - Valid contracts in the PWN Protocol
* [Config](deep-dive.md#config) - Configurable parameters
* [The LOAN (Vault)](deep-dive.md#the-loan-vault) - Escrow contract
* [Proposal types](deep-dive.md#proposal-types) - Loan business logic
* [LOAN token](deep-dive.md#loan-token) - Tokenised debt
* [Nonces](deep-dive.md#nonces) - Identify unique proposals
* [Miscellaneous](deep-dive.md#miscellaneous)
* [What now?](deep-dive.md#what-now)

## Hub

### Tags

The [PWNHub.sol](smart-contract-reference/pwn-hub/) contract stores tags for each contract in the protocol and therefore **defines what contracts are a valid part of the protocol**. Let's look at the technical implementation:

```solidity
mapping (address => mapping (bytes32 => bool)) private tags;
```

The outer mapping is indexing the address of a contract, and the inner mapping is indexing a `bytes32` tag. The value of the inner mapping is a boolean indicating whether or not the contract address is part of the protocol. The tag value is determined by the [PWNHubTags.sol](smart-contract-reference/pwn-hub/tags.md) library. Here's an example of a tag:

```solidity
bytes32 internal constant ACTIVE_LOAN = keccak256("PWN_ACTIVE_LOAN");
```

Tags can be changed by the owner (we will talk about ownership aspects later) through the `setTag` function. There's also the `setTags` function that changes multiple tags in one call. The `hasTag` view function returns a boolean value given a contract `address` and a `bytes32` tag.

Contracts in the PWN protocol checks if the caller has the appropriate tag assigned in the PWN Hug and reverts if not.

### Ownership

The PWNDAO owns this contract and is therefore responsible for adding new contracts to the protocol and deprecating old contracts.

:::info
Even if the PWNDAO was a malicious entity it could only pause the creation of new loans. Existing loans would be unaffected and all assets would still be safe.
:::

## Config

### Parameters

The [PWNConfig.sol](smart-contract-reference/pwn-config.md) contract stores the core parameters of the protocol. The parameters are the following:

* Fee size
* Fee collector address
* Registered pool adapters
* Registered state fingerprint computers
* Metadata URI

To prevent any attacks there is a hard cap of 10 % on the fee size.

### Proxy

The PWN Config contract is meant to be used behind a proxy contract. This enables the addition and removal of parameters as the protocol evolves. The proxy implementation used is the [TransparentUpgradableProxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent_proxy) from OpenZeppelin.

### Ownership

The PWNDAO is both the owner and the admin of the PWN Config. As the owner, it can update any stored property, and as the admin, it can upgrade the proxy contract. Both of these actions are delayed by respective timelocks.

![](/assets/Group%2055.png)

## The Loan (Vault)

The Loan contracts are the primary contracts doing business logic. Given a proposal (we will talk about them in more detail later), the contract creates a loan. There can be an unlimited number of these contracts, we call them loan types. The Loan contracts can implement any logic, for example, simple loans or perpetual loans. Each loan type has to be added to the PWN Hub by the PWNDAO.

### Source of funds

When creating a new loan, the lender can choose a source of funds. The default is that the funds are owned by the lender's account and transferred directly to a borrower. However, the lender has another option and can use a pool to withdraw the funds at the time of loan creation first. It is done via pool adapters that handle the withdrawal to the lender account, after which the flow is the same as in the case of a direct source of funds. This allows the lender to create proposals without actually owning the credit asset and withdraw them only if accepted, accruing the interest from the pool in the meantime. The pool adapters are registered in the PWN Config and only PWNDAO is able to update them.

:::info
Currently PWN supports Compound V3 and Aave V3 as a source of funds. The number of pools will extended in the future.
:::

### PWNVault

The Loan contracts inherit the [PWNVault.sol](smart-contract-reference/pwn-vault.md) contract. The Vault is used for transferring and managing collateral and credit assets. The Vault contains five transfer functions, `_pull`, `_push`, `_pushFrom`, `_withdrawFromPool`, and `_supplyToPool`. The `_pull` function pulls an asset into the Vault from an account, assuming a prior token approval was made to the Loan (Vault) address. The `_pull` function is typically used to transfer collateral or repayment from a borrower to the Vault. The `_push` function pushes an asset from the Vault to a defined recipient, such as a borrower or a lender. The `_push` function is typically used to transfer the collateral back to a borrower when a loan is repaid or repayment to a lender when a loan defaults. The `_pushFrom` function pushes an asset from one account to another, assuming a prior token approval was made to the Loan (Vault) address. The `_pushFrom` function is typically used to transfer borrowed tokens from a lender to a borrower. The `_withdrawFromPool` function withdraws funds from a pool via a registered pool adapter in the PWN Config. The `_withdrawFromPool` function is used when a lender picks a source of funds that is different than lenders account. The `_supplyToPool` function supplies funds to a pool via a registered pool adapter in the PWN Config. The `_supplyToPool` function is used when the original loan lender is the same as current LOAN owner and the original source of funds is a pool.&#x20;

### SimpleLoan

The first loan type in the PWN Protocol is the Simple Loan. In this loan, a borrower provides collateral and the lender lends ERC-20 tokens to the borrower. The borrower must repay an agreed amount of the borrowed tokens before the loan matures. If the borrower does not repay the loan the lender can claim the collateral. There is also an option for the lender to extend the maturity date of a running loan by up to 90 days.

![](/assets/Group%2054.png)

## Proposal types

The Loan contract we've just covered has one important feature we haven't mentioned yet. It can accept more proposal types!&#x20;

:::info
For example, the Simple Loan type can accept proposals made on entire collections. That means the user can make a proposal on the entire BAYC collection and the borrowers don't have to wait for someone to make a proposal on their specific Ape and can instead accept the so-called Collection Proposal.
:::

Each proposal type implements one function called `acceptProposal` which performs checks if proposal can be accepted and returns a loan terms for the loan type. All proposals in the PWN Protocol are signed typed structs according to the [EIP-712](https://eips.ethereum.org/EIPS/eip-712).&#x20;

:::info
Keep in mind that although proposals can be created on-chain users will typically create and sign proposals off-chain to save unnecessary gas fees.
:::

![](/assets/Group%2053.png)

## LOAN token

### Functionality

The [PWNLOAN.sol](smart-contract-reference/pwn-loan.md) is an [ERC-721](https://eips.ethereum.org/EIPS/eip-721) token contract. Each token represents a unique loan in the PWN Protocol. Only the Loan (Vault) contracts are allowed to mint or burn these tokens. There's also a `tokenURI` function that returns the metadata URI for a given LOAN token ID and a mapping of LOAN token IDs to contract addresses that minted them. Furthermore, this contract implements the [ERC-165](https://eips.ethereum.org/EIPS/eip-165) and [ERC-5646](https://eips.ethereum.org/EIPS/eip-5646) standards.

### ERC-5646

ERC-5646 provides a standardized interface that allows for the unambiguous identification of the state of a mutable token without requiring any knowledge of the token's implementation details. The EIP specification defines the `getStateFingerprint` function, which returns a unique value that must change when the token's state changes, and includes all state properties that may change during its lifecycle, excluding immutable properties. By providing this minimum interface, protocols can support mutable tokens without the need for specific implementation knowledge, enabling greater interoperability and reducing the bottleneck effect that arises from requiring explicit support for every new token.

![](/assets/Group%2052.png)

## Nonces

### Usage

Each proposal struct has a nonce and a nonce space value, represented as a `uint256`.&#x20;

The nonce value is necessary to check if the proposal is valid (one of the validity conditions) and to distinguish otherwise identical proposals. Because proposals can be signed off-chain and cannot be unsigned (as the signature exists), we cannot just delete the proposal if the proposer decides to invalidate it. The nonce needs to be revoked via an on-chain transaction. If a nonce is revoked, a proposal acceptance transaction will revert. It is the same as giving somebody a signed check and going to a bank before they can cash it in. Proposal nonces are typically revoked during the acceptance. Users can use it to create group proposals with the same nonce, where accepting one proposal invalidates the rest in the group.

:::info
An exception to this rule is so-called persistent proposals that stay valid even after being used to start a loan.
:::

Then there is nonce space. Any proposal with a nonce space value different than the signer's current nonce space is considered invalid. The nonce space value is strictly incremental (unlike nonce, which can be random) and is used to invalidate all signed proposals in one transaction. Signing a proposal with a higher nonce space than the current value (for the signed) is not recommended. It will be invalid until the nonce space increases, leading to unexpected behavior.

### Revoking a nonce

If an account wants to revoke a proposal manually it can do so with the `revokeNonce` function passing the nonce as an argument. This function is implemented by the [PWNRevokedNonce.sol](smart-contract-reference/pwn-revoked-nonce.md).&#x20;

:::info
There are several `revokeNonce` functions with different function signatures. One can be called by anyone and uses the caller's address as the nonce owner. Others take an owner address as an argument, but they're only callable by an account with a tag in the Hub.
:::

## Miscellaneous

### Errors

[PWNErrors.sol](smart-contract-reference/miscellaneous/pwn-errors.md) defines general custom errors in the PWN Protocol. Errors specific to proposals and other contracts are defined in their corresponding contracts.

### FeeCalculator

[PWNFeeCalculator.sol](smart-contract-reference/miscellaneous/pwn-fee-calculator.md) library implements the `calculateFeeAmount` function. This function calculates the token amount that will be paid to the protocol as a fee based on the borrowed amount and the protocol fee defined in [PWNConfig.sol](smart-contract-reference/pwn-config.md).&#x20;

### SignatureChecker

[PWNSignatureChecker.sol](smart-contract-reference/miscellaneous/pwn-signature-checker.md) library implements the `isValidSignatureNow` function. This function checks the validity of a given signature of a given hash and signer address. The check supports both EOA and contract accounts. The library is a modification of the [SignatureChecker](https://docs.openzeppelin.com/contracts/4.x/api/utils#SignatureChecker) library from Open Zeppelin extended by support for [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signatures.

### Deployer

[PWNDeployer.sol](../tools/pwn-deployer.md) deploys other PWN protocol contracts with the CREATE2 opcode. This enables having the same contract addresses on all EVM-compatible blockchains.

### Timelocks

PWNDAO owns two timelocks: protocol and admin. The protocol timelock owns PWN Config, PWN Hub, and the Multi Token Category Registry. The admin timelock manages PWN Config, which is the only upgradeable contract in the PWN protocol. Both timelocks currently have a delay of 0 days. PWNDAO is the only address that can propose or cancel operations on the timelocks.

:::info
The time lock delay is expected to increase as the protocol matures and PWNDAO is launched.
:::

![](/assets/Full%20diagram.png)

## What now?

This deep dive article has provided a comprehensive analysis of the architecture and properties of the PWN Protocol. If you want to learn more see our [Smart Contract Reference](smart-contract-reference/) for all contracts and the [`pwn_contracts`](https://github.com/PWNFinance/pwn_contracts) GitHub repository. Check out the tests to see how other contracts can interact with the protocol. If you have any questions feel free to reach out to us on our [Discord](https://discord.gg/aWghBQSdHv).
