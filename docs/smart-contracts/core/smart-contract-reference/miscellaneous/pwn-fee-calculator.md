# PWN Fee Calculator

## 1. Summary

PWNFeeCalculator.sol is a library that implements the `calculateFeeAmount` function to calculate the fee amount based on the protocol fee and the amount lent.&#x20;

## 2. Important links

* [**View on GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/lib/PWNFeeCalculator.sol)

## 3. Contract details

* _PWNFeeCalculator.sol_ is written in Solidity version 0.8.16

<details>

<summary><code>calculateFeeAmount</code></summary>

#### Overview

Based on the protocol fee and the amount that is being lent, this function calculates and returns the fee and the amount lent with the fee deducted.&#x20;

This function takes two arguments supplied by the caller:

* `uint16`**`fee`** - Fee value in basis points. The value of 100 is a 1% fee.
* `uint256`**`loanAmount`** - Amount of an asset used as a loan credit.

#### Implementation

```solidity
function calculateFeeAmount(uint16 fee, uint256 loanAmount) internal pure returns (uint256 feeAmount, uint256 newLoanAmount) {
    if (fee == 0)
        return (0, loanAmount);

    feeAmount = Math.mulDiv(loanAmount, fee, 1e4);
    newLoanAmount = loanAmount - feeAmount;
}
```

</details>
