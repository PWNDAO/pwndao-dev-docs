# Offer types

## 1. Summary

A lender can choose between two types while making an offer. **Basic and flexible**.

## 2. Offer Types Detailed

### Basic

The Basic offer is where the lender sets all loan parameters up-front and the borrower has an option to accept or not. Nothing else.

**`Offer`** struct has these properties:

<table><thead><tr><th width="150">Type</th><th width="164.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>address</code></td><td><code>collateralAddress</code></td><td>Address of an asset used as a collateral</td></tr><tr><td><code>MultiToken.Category</code> (see <a href="../../../smart-contracts/libraries/multitoken.md">MultiToken</a>)</td><td><code>collateralCategory</code></td><td>Category of an asset used as a collateral (0 == ERC20, 1 == ERC721, 2 == ERC1155)</td></tr><tr><td><code>uint256</code></td><td><code>collateralAmount</code></td><td>The Amount of tokens used as collateral, in the case of ERC721 should be 1</td></tr><tr><td><code>uint256</code></td><td><code>collateralId</code></td><td>Token id of an asset used as collateral, in the case of ERC20 should be 0</td></tr><tr><td><code>address</code></td><td><code>loanAssetAddress</code></td><td>Address of an asset which is lent to a borrower</td></tr><tr><td><code>uint256</code></td><td><code>loanAmount</code></td><td>Amount of tokens which is offered as a loan to a borrower</td></tr><tr><td><code>uint256</code></td><td><code>loanYield</code></td><td>Amount of tokens that acts as a lender's loan interest. Borrower has to pay back borrowed amount + yield</td></tr><tr><td><code>uint32</code></td><td><code>duration</code></td><td>Loan duration in seconds</td></tr><tr><td><code>uint40</code></td><td><code>expiration</code></td><td>Offer expiration timestamp in seconds</td></tr><tr><td><code>address</code></td><td><code>lender</code></td><td>Address of a lender. This address has to sign an offer to be valid</td></tr><tr><td><code>bytes32</code></td><td><code>nonce</code></td><td>Additional value to enable identical offers in time. Without it, it would be impossible to make again an offer, which was once revoked</td></tr></tbody></table>

:::info
With the flexible offer struct, we change the `collateralId`, `loanAmount`, `loanYield` and `duration` parameters to a range of these parameters.&#x20;
:::

### Flexible

With flexible offers, lenders can give borrowers additional flexibility by not providing concrete values but rather giving borrower ranges for several parameters. When accepting an offer, a borrower has to provide concrete values to proceed. This increases a lender's chance of accepting their offer as it could be accepted by more borrowers.

**`FlexibleOffer`** struct has these properties:

<table><thead><tr><th width="150">Type</th><th width="164.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>address</code></td><td><code>collateralAddress</code></td><td>Address of an asset used as a collateral</td></tr><tr><td><code>MultiToken.Category</code> (see <a href="../../../smart-contracts/libraries/multitoken.md">MultiToken</a>)</td><td><code>collateralCategory</code></td><td>Category of an asset used as a collateral (0 == ERC20, 1 == ERC721, 2 == ERC1155)</td></tr><tr><td><code>uint256</code></td><td><code>collateralAmount</code></td><td>The Amount of tokens used as collateral, in the case of ERC721 should be 0</td></tr><tr><td><code>bytes32</code></td><td><strong><code>collateralIdsWhitelistMerkleRoot</code></strong></td><td>Root of a merkle tree constructed on an array of whitelisted collateral ids</td></tr><tr><td><code>address</code></td><td><code>loanAssetAddress</code></td><td>Address of an asset which is lent to a borrower</td></tr><tr><td><code>uint256</code></td><td><strong><code>loanAmountMax</code></strong></td><td>Max amount of tokens which is offered as a loan to borrower</td></tr><tr><td><code>uint256</code></td><td><strong><code>loanAmountMin</code></strong></td><td>Min amount of tokens which is offered as a loan to borrower</td></tr><tr><td><code>uint256</code></td><td><strong><code>loanYieldMax</code></strong></td><td>Amount of tokens which acts as a lender's loan interest for max duration.</td></tr><tr><td><code>uint32</code></td><td><strong><code>durationMax</code></strong></td><td>Maximal loan duration in seconds</td></tr><tr><td><code>uint32</code></td><td><strong><code>durationMin</code></strong></td><td>Minimal loan duration in seconds</td></tr><tr><td><code>uint40</code></td><td><code>expiration</code></td><td>Offer expiration timestamp in seconds</td></tr><tr><td><code>address</code></td><td><code>lender</code></td><td>Address of a lender. This address has to sign an offer to be valid.</td></tr><tr><td><code>bytes32</code></td><td><code>nonce</code></td><td>Additional value to enable identical offers in time. Without it, it would be impossible to make again an offer, which was once revoked</td></tr></tbody></table>

:::success
Flexible offers enable lenders to create an offer for a whole NFT collection.
:::

:::info
Don't know what a merkle tree is? Read this [article](https://brilliant.org/wiki/merkle-tree/) for more information.
:::

#### Flexible offer values

When a borrower decides to accept a flexible offer they have to provide a specific representation of the offer. They do this by providing `FlexibleOfferValues` struct as the second argument for the [`createLoanFlexible`](./#createflexibleloan) function.

**`FlexibleOfferValues`** struct has these properties:

| Type        | Name                   | Comment                                                                                          |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| `uint256`   | `collateralId`         | Collateral token id. Ignored if it's not a collection offer                                      |
| `uint256`   | `loanAmount`           | Loan asset amount (always ERC20) in range \<loanAmountMin; loanAmountMax>                        |
| `uint32`    | `duration`             | Offered loan duration in range \<durationMin; durationMax>                                       |
| `bytes32[]` | `merkleInclusionProof` | Proof that selected collateralId is indeed in the Merkle tree with root in signed flexible offer |

#### How is the loan repay amount calculated?

$$
`loanRepayAmount` = `loanAmount` + \frac{`loanYieldMax`*`duration`}{`durationMax`}
$$

* `loanAmount` - Loan asset amount (always ERC20) in range \<loanAmountMin; loanAmountMax>
* `loanYieldMax` - Amount of tokens which acts as a lender's loan interest for max duration
* `duration` - Offered loan duration in range \<durationMin; durationMax>
* `durationMax` - Maximum loan duration in seconds
