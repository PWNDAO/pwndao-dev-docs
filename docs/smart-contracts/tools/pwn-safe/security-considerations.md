# Security considerations

Let's talk about known security-related issues that it's possible to encounter while using PWN Safe. The topics we'll cover on this page are as follows:

1. **Non-standard assets**
2. **Incorrect asset categories**
3. **Different token standards**
4. **Stalking attacks**
5. **Delegate call usage**

## Non-standard assets

It's possible to mint an ATR token for an asset that defines non-standard functions. This can be used to create a malicious asset with a non-standard transfer function and effectively transfer an asset although an ATR token is minted.

To our best knowledge, it's not possible for the guard to completely prevent this from happening while not giving up the permissionless nature of PWN Safe. **Always make sure that you're interacting with a standard asset before accepting an ATR token.**

Also, the [ATR Guard](smart-contract-reference/atr-guard/) cannot prevent any transfer calls initiated outside of PWN Safe. That's the reason why PWN Safe cannot let the owner approve another address for an asset that has its transfer rights tokenized. It would enable the approved address to transfer the asset without triggering the tokenized balance checks.&#x20;

## **Incorrect asset categories**

An attacker can provide an incorrect asset category (e.g. an ERC721 asset with a provided ERC20 category), which would trigger different checks and could potentially lead to more ATR tokens per asset. Great means were taken to prevent this type of attack, but it's not possible to check the ERC type without additional standards on which the wallet cannot rely. It should be very unlikely to find an honest asset that would pass the checks with the wrong category.

## Different token standards

The diagram below shows how dangerous different standards are in the context of PWN Safe security. Green is safe, yellow indicates that there may be possible insecurities, and red is dangerous without additional wallet upgrades. It's important to note that there is one particularly dangerous standard: [ERC-3525](https://eips.ethereum.org/EIPS/eip-3525). **ATR token of assets implementing this ERC should not be accepted by a counterparty.**

<figure><img src="https://lh5.googleusercontent.com/akuVLDqW_Fo14qWv-4AKWmV3OYOCqse0BfK343ILlWJzrxGsMlvcaNLzJEZ6AXKMJsx_3L34JDQ1TXhbrWF2u4mJ-zWU-TfLZlbDbXkspQE5QKjWUDyeQ4ruPB91pdie7unjTbX-AwXxCvuPxygi0fVt9m5jVunvw-JzInpk39UkX8q4Ek3aK6QNJrud" alt="" /></figure>

## **Stalking attacks**

The [Asset Transfer Rights Module](smart-contract-reference/atr-module/) contract keeps track of tokenised asset balances to ensure tokenised assets don't transfer during a transaction's execution. If an attacker creates a malicious asset with a non-standard transfer function, they can effectively block all calls to the `execTransaction` function. **User funds are not in danger.**

The [**Recipient Permission Manager**](smart-contract-reference/atr-module/recipient-permission-manager.md) **contract makes this attack highly unlikely**, as it would require the recipient to sign a message allowing this attack to happen.&#x20;

However, if the attack does happen, all transactions will fail due to an `Insufficient tokenised balance` exception. In this case, the Safe owner will have to recover from this attack which is possible using the recovery functions implemented in the [Asset Transfer Rights Module](smart-contract-reference/atr-module/) contract.

**Here's how this attack can be carried out:**

1. Implement malicious asset contract that can be transferred by the contract owner
2. Tokenize a malicious asset in attackers' PWN Safe
3. Transfer the asset via ATR token to victims PWN Safe (would need to have [recipient permission](smart-contract-reference/atr-module/recipient-permission-manager.md))
4. Transfer the asset via malicious contract out of the victims' wallet without using the ATR token
5. The internal state of the victims' PWN Safe will be corrupted and any call of `execTransaction` function will revert with `Insufficient tokenised balance` exception

## Delegate call

It is not possible to use [_delegatecall_](https://solidity-by-example.org/delegatecall/) because it would introduce a possible security vulnerability, as we can't possibly know what would the called contract do.
