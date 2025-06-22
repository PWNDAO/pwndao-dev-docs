# PWN Signature Checker

## 1. Summary

The PWNSignatureChecker library implements the `isValidSignatureNow` view function. This library is a modification of the Open-Zeppelin [`SignatureChecker`](https://docs.openzeppelin.com/contracts/4.x/api/utils#SignatureChecker) library extended by support for [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) compact signatures.

## 2. Important links

* [**View on GitHub**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/loan/lib/PWNSignatureChecker.sol)

## 3. Contract details

* _PWNSignatureChecker.sol_ is written in Solidity version 0.8.16

<details>

<summary><code>isValidSignatureNow</code></summary>

#### Overview

This function will try to recover a signer of a given signature and check if is the same as the given signer address. For a contract account signer address, the function will check signature validity by calling `isValidSignature` function defined by [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271).

This function takes three arguments supplied by the caller:

* `address`**`signer`** - Address that should be a `hash` signer or a signature validator, in case of a contract account.
* `bytes32`**`hash`** - Hash of a signed message that should be validated.
* `bytes memory`**`signature`** - Signature of a signed `hash`. Can be empty for a contract account signature validation. The signature can be standard (65 bytes) or compact (64 bytes) defined by [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098).

#### Implementation

```solidity
function isValidSignatureNow(
    address signer,
    bytes32 hash,
    bytes memory signature
) internal view returns (bool) {
    // Check that signature is valid for contract account
    if (signer.code.length > 0) {
        (bool success, bytes memory result) = signer.staticcall(
            abi.encodeWithSelector(IERC1271.isValidSignature.selector, hash, signature)
        );
        return
            success &&
            result.length == 32 &&
            abi.decode(result, (bytes32)) == bytes32(IERC1271.isValidSignature.selector);
    }
    // Check that signature is valid for EOA
    else {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Standard signature data (65 bytes)
        if (signature.length == 65) {
            assembly {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
        }
        // Compact signature data (64 bytes) - see EIP-2098
        else if (signature.length == 64) {
            bytes32 vs;

            assembly {
                r := mload(add(signature, 0x20))
                vs := mload(add(signature, 0x40))
            }

            s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
            v = uint8((uint256(vs) >> 255) + 27);
        } else {
            revert InvalidSignatureLength({ length: signature.length });
        }

        return signer == ECDSA.recover(hash, v, r, s);
    }
}
```

</details>

### Errors

```solidity
error InvalidSignatureLength(uint256 length);
error InvalidSignature(address signer, bytes32 digest);
```

<details>

<summary><code>InvalidSignatureLength</code></summary>

InvalidSignatureLength event is emitted when signature length is not 64 nor 65 bytes.

This event has one parameter:

* `uint256`**`length`**

</details>

<details>

<summary><code>InvalidSignature</code></summary>

InvalidSignatureLength event is emitted when the signature is invalid.

This event has one parameter:

* `address`**`signer`**
* `bytes32`**`digest`** - hash to distinguish different proposals

</details>
