---
description: The core interface
---

# PWN

## 1. Summary

PWN is the **core interface that users are expected to use**. It is the only interactive contract allowing for permissionless external calls. The contract defines the workflow functionality and handles the market making.

## 2. Important links

* **Deployment addresses**
  * Mainnet: [**0x0709b8e46e26b45d76CC5C744CAF5dE70a82578B**](https://etherscan.io/address/0x0709b8e46e26b45d76CC5C744CAF5dE70a82578B)
  * Polygon: [**0xBCdE56e9FB8c30aBB2D19Fb33D7DeD5031102da2**](https://polygonscan.com/address/0xBCdE56e9FB8c30aBB2D19Fb33D7DeD5031102da2)
  * Görli: [**0xd65404695a101B4FD476f4F2222F68917f96b911**](https://goerli.etherscan.io/address/0xd65404695a101B4FD476f4F2222F68917f96b911)
  * Mumbai: [**0xDa88e79E5Dd786AD3c29CeFbe6a2bece6f6c0477**](https://mumbai.polygonscan.com/address/0xDa88e79E5Dd786AD3c29CeFbe6a2bece6f6c0477)
  * Rinkeby (deprecated): [**0x34fCA53BbCbc2a4E2fF5D7F704b7143133dfaCF7**](https://rinkeby.etherscan.io/address/0x34fCA53BbCbc2a4E2fF5D7F704b7143133dfaCF7)
* **Source code**
  * [**GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/contracts/PWN.sol)
* **ABI**
  * [**JSON**](https://api.etherscan.io/api?module=contract&action=getabi&address=0x0709b8e46e26b45d76CC5C744CAF5dE70a82578B)
  * [**Text**](http://api.etherscan.io/api?module=contract&action=getabi&address=0x0709b8e46e26b45d76CC5C744CAF5dE70a82578B&format=raw)

## 3. Contract Details

* _PWN.sol_ contract is written in Solidity version 0.8.4

### Features

* Create [fixed or flexible](offer-types.md) LOANs with an [off-chain signed offer](off-chain-signed-offer.md)
* Payback loans
* Claim collateral or credit
* Revoke offers

### Functions

### `createLoan`

A borrower can accept an existing signed off-chain offer by calling the `createLoan` function.&#x20;

The diagram below shows the high-level logic of the function.

&#x20;                                             ![](/assets/createLoan%20diagram.svg)                                             &#x20;

This function takes two arguments supplied by the caller (borrower):

* `PWNLOAN.Offer memory`**`_offer`** - Offer struct with plain offer data. For more information, see [basic offer](offer-types.md#basic)
* `bytes memory`**`_signature`** - [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) [raw signature](https://docs.ethers.io/v5/api/signer/#Signer-signTypedData) of the offer typed struct signed by the lender

:::warning
Note that a borrowed asset has to be an ERC-20 token, otherwise, the transaction will revert.
:::

:::info
It's recommended to check the lender's balance to make sure that the loan can be created.
:::

### `createFlexibleLoan`

This function allows for accepting flexible offers (see [Flexible offers](offer-types.md#flexible)).&#x20;

The internal logic is similar as with `createLoan`, but this function takes one more argument:

* `PWNLOAN.FlexibleOffer memory`**`_offer`** - Offer struct with flexible offer data. For more information see [flexible offer struct](offer-types.md#flexible).
* `PWNLOAN.FlexibleOfferValues memory`**`_offerValues`** - Concrete values of a flexible offer set by the borrower. For more information see [flexible offer values](offer-types.md#flexible-offer-values).
* `bytes memory`**`_signature`** - [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) [raw signature](https://docs.ethers.io/v5/api/signer/#Signer-signTypedData) of the offer typed struct signed by the lender

:::warning
Note that a borrowed asset has to be an ERC-20 token, otherwise, the transaction will revert.
:::

:::info
It's recommended to check the lender's balance to make sure that the loan can be created.
:::

### `repayLoan`

The `repayLoan` function allows for repaying a loan by anyone. This enables users to take a loan from one address and repay the loan from another address. The loan's underlying collateral will be transferred back to the original borrower's address and not to the address which repaid the loan.&#x20;

:::warning
This function assumes approval of all used assets to PWN Vault. If any of the used assets are not approved the function will revert.&#x20;
:::

The diagram below shows the high-level logic of the function.

&#x20;                                             ![](/assets/repayLoan%20diagram.svg)                                             &#x20;

This function takes one argument supplied by the caller:

* `uint256`**`_loanId`** - ID of the LOAN being paid back

### `claimLoan`

The owner of a LOAN token (usually the lender) can call this function to claim assets if the loan was expired or has been paid back.

The diagram below shows the high-level logic of the function.

&#x20;                                             ![](/assets/claimLoan.svg)                                             &#x20;

This function takes one argument supplied by the caller:

* `uint256`**`_loanId`** - ID of the LOAN to be claimed

### `revokeOffer`

If a lender has signed an off-chain offer, they can revoke the offer by calling the `revokeOffer` function.

This function takes two arguments supplied by the caller:

* `bytes32`**`_offerHash`** - [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) computed [hash](https://docs.ethers.io/v5/api/utils/hashing/#TypedDataEncoder-hash) of the [offer struct](offer-types.md)
* `bytes calldata`**`_signature`** - [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) [raw signature](https://docs.ethers.io/v5/api/signer/#Signer-signTypedData) of the [offer struct](offer-types.md)

### Events

The PWN contract does not define any events or custom errors. All events relevant to the PWN protocol are emitted by the [PWN Vault](../pwn-vault.md) and [PWN LOAN](../pwn-loan.md) contracts.&#x20;
