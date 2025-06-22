# PWN LOAN

## 1. Summary

The PWNLOAN.sol contract is an [ERC-721](https://eips.ethereum.org/EIPS/eip-721) that represents a loan in the PWN protocol. The PWN LOAN token is shared between all loan contracts.

## 2. Important links

* [**Source code**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/token/PWNLOAN.sol)
* [**ABI**](/assets/PWNLOAN%20(1).json)

## 3. Contract details

* _PWNLOAN.sol_ is written in Solidity version 0.8.16

### Features

* Minting and burning of the LOAN token

### Inherited contracts, implemented Interfaces and ERCs

* [IERC5646](https://eips.ethereum.org/EIPS/eip-5646)
* [ERC721](https://eips.ethereum.org/EIPS/eip-721)

### Functions

<details>

<summary><code>mint</code></summary>

#### Overview

When a loan is started in the PWN Protocol the Loan contract mints a LOAN token for the lender.

Only Loan contracts that are tagged as active in the PWN Hub can mint new LOAN tokens.&#x20;

This function takes one argument supplied by the caller:

* `address`**`owner`** - Address of the LOAN token receiver

#### Implementation

```solidity
function mint(address owner) external onlyActiveLoan returns (uint256 loanId) {
    loanId = ++lastLoanId;
    loanContract[loanId] = msg.sender;
    _mint(owner, loanId);
    emit LOANMinted(loanId, msg.sender, owner);
}
```

</details>

<details id="burn">

<summary>burn</summary>

#### Overview

A Loan contract calls this function when a lender claims repayment or defaulted collateral.

This function takes one argument supplied by the caller:

* `uint256`**`loanId`** - ID of the LOAN token to be burned

#### Implementation

```solidity
function burn(uint256 loanId) external {
    if (loanContract[loanId] != msg.sender)
        revert InvalidLoanContractCaller();

    delete loanContract[loanId];
    _burn(loanId);
    emit LOANBurned(loanId);
}
```

</details>

### View Functions

<details>

<summary><code>tokenURI</code></summary>

#### Overview

Returns URI for a supplied token ID based on the Loan contract that minted the token. &#x20;

This function takes one argument supplied by the caller:

* `uint256`**`tokenId`** - ID of the LOAN token to get a token URI for

#### Implementation

```solidity
function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    return IPWNLoanMetadataProvider(loanContract[tokenId]).loanMetadataUri();
}
```

</details>

<details>

<summary><code>getStateFingerprint</code></summary>

#### Overview

This function returns the current token state fingerprint for a supplied token ID. See [ERC-5646](https://eips.ethereum.org/EIPS/eip-5646) standard specification for more detailed information.&#x20;

This function takes one argument supplied by the caller:

* `uint256`**`tokenId`** - ID of the LOAN token to get a fingerprint for

#### Implementation

```solidity
function getStateFingerprint(uint256 tokenId) external view virtual override returns (bytes32) {
    address _loanContract = loanContract[tokenId];

    if (_loanContract == address(0))
        return bytes32(0);

    return IERC5646(_loanContract).getStateFingerprint(tokenId);
}
```

</details>

### Events

The PWNLOAN contract defines two events and two errors.

```solidity
event LOANMinted(uint256 indexed loanId, address indexed loanContract, address indexed owner);
event LOANBurned(uint256 indexed loanId);
```

<details>

<summary><code>LOANMinted</code></summary>

LOANMinted event is emitted when a new LOAN token is minted.

This event has three parameters:

* `uint256 indexed`**`loanId`** - ID of the minted LOAN token
* `address indexed`**`loanContract`** - Address of the loan contract that minted this LOAN token
* `address indexed`**`owner`** - Address of the minted LOAN token receiver

</details>

<details>

<summary><code>LOANBurned</code></summary>

LOANBurned event is emitted when a LOAN token is burned.

This event has one parameter:

* `uint256 indexed`**`loanId`** - ID of the burned LOAN token

</details>

### Errors

```solidity
error InvalidLoanContractCaller();
error CallerMissingHubTag(bytes32 tag);
```

<details>

<summary><code>InvalidLoanContractCaller</code></summary>

A InvalidLoanContractCaller error is thrown when [burn](#burn) function caller is not a loan contract that minted the LOAN token.

This error doesn't have any parameters.

</details>

<details>

<summary><code>CallerMissingHubTag</code></summary>

A CallerMissingHubTag error is thrown when caller is missing a [PWN Hub](pwn-hub/) tag.

This error has one parameter:

* `bytes32`**`tag`**
</details>

