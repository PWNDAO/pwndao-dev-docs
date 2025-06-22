# PWN Revoked Nonce

## 1. Summary

PWNRevokedNonce.sol contract is used for revoking proposals. Each proposal has a unique nonce value which can be revoked. Every address has its own nonce space.

## 2. Important links

* [**Source code**](https://github.com/PWNFinance/pwn_contracts/blob/master/src/nonce/PWNRevokedNonce.sol)
* [**ABI**](/assets/PWNRevokedNonce%20(1).json)

## 3. Contract details

* _PWNRevokedNonce.sol_ is written in Solidity version 0.8.16

### Features

* Revoke nonces and nonce spaces
* Revoke nonce on behalf of the owner

### Functions

<details>

<summary><code>revokeNonce(uint256 nonce)</code></summary>

#### Overview

Revokes supplied nonce in the current nonce space for `msg.sender`.

This function takes one argument supplied by the caller:

* `uint256`**`nonce`**

#### Implementation

```solidity
function revokeNonce(uint256 nonce) external {
    _revokeNonce(msg.sender, _nonceSpace[msg.sender], nonce);
}
```

</details>

<details>

<summary><code>revokeNonce(uint256 nonceSpace, uint256 nonce)</code></summary>

#### Overview

Revokes supplied nonce in the supplied nonce space for `msg.sender`.&#x20;

This function takes two arguments supplied by the caller:

* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

#### Implementation

```solidity
function revokeNonce(uint256 nonceSpace, uint256 nonce) external {
    _revokeNonce(msg.sender, nonceSpace, nonce);
}
```

</details>

<details>

<summary><code>revokeNonce(address owner, uint256 nonce)</code></summary>

#### Overview

Revokes supplied nonce on behalf of the owner in the current nonce space. This function can be called only by addresses with the `accessTag` set in the [PWN Hub](pwn-hub/).

This function takes two arguments supplied by the caller:

* `address`**`owner`**
* `uint256`**`nonce`**

#### Implementation

```solidity
function revokeNonce(address owner, uint256 nonce) external onlyWithHubTag {
    _revokeNonce(owner, _nonceSpace[owner], nonce);
}
```

</details>

<details>

<summary><code>revokeNonce(address owner, uint256 nonceSpace, uint256 nonce)</code></summary>

#### Overview

Revokes supplied nonce in the supplied nonce space on behalf of the owner. This function can be called only by addresses with the `accessTag` set in the [PWN Hub](pwn-hub/).

This function takes two arguments supplied by the caller:

* `address`**`owner`**
* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

#### Implementation

```solidity
function revokeNonce(address owner, uint256 nonceSpace, uint256 nonce) external onlyWithHubTag {
    _revokeNonce(owner, nonceSpace, nonce);
}
```

</details>

<details>

<summary><code>revokeNonceSpace</code></summary>

#### Overview

Revokes all nonces in the current nonce space and increments the nonce space for `msg.sender`.

This function doesn't take any arguments.

#### Implementation

```solidity
function revokeNonceSpace() external returns (uint256) {
    emit NonceSpaceRevoked(msg.sender, _nonceSpace[msg.sender]);
    return ++_nonceSpace[msg.sender];
}
```

</details>

### View Functions

<details>

<summary><code>isNonceRevoked</code></summary>

#### Overview

This function returns a boolean determining if the supplied nonce is revoked for a given address in supplied nonce space.

This function takes three arguments supplied by the caller:

* `address`**`owner`**
* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

#### Implementation

```solidity
function isNonceRevoked(address owner, uint256 nonceSpace, uint256 nonce) external view returns (bool) {
    return _revokedNonce[owner][nonceSpace][nonce];
}
```

</details>

<details>

<summary><code>isNonceUsable</code></summary>

#### Overview

This function returns a boolean determining if the supplied nonce is usable for a given address in supplied nonce space.

This function takes three arguments supplied by the caller:

* `address`**`owner`**
* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

#### Implementation

```solidity
function isNonceUsable(address owner, uint256 nonceSpace, uint256 nonce) external view returns (bool) {
    if (_nonceSpace[owner] != nonceSpace)
        return false;

    return !_revokedNonce[owner][nonceSpace][nonce];
}
```

</details>

<details>

<summary><code>currentNonceSpace</code></summary>

#### Overview

This function returns current nonce space for an address.

This function takes one argument supplied by the caller:

* `address`**`owner`**

#### Implementation

```solidity
function currentNonceSpace(address owner) external view returns (uint256) {
    return _nonceSpace[owner];
}
```

</details>

### Events

The PWN Revoked Nonce contract defines two events and two errors.

```solidity
event NonceRevoked(address indexed owner, uint256 indexed nonceSpace, uint256 indexed nonce);
event NonceSpaceRevoked(address indexed owner, uint256 indexed nonceSpace);
```

<details>

<summary><code>NonceRevoked</code></summary>

A NonceRevoked event is emitted when a nonce is revoked.&#x20;

This event has three parameters:

* `address indexed`**`owner`**
* `uint256 indexed`**`nonceSpace`**
* `uint256 indexed`**`nonce`**

</details>

<details>

<summary><code>NonceSpaceRevoked</code></summary>

A NonceSpaceRevoked event is emitted when a nonce space is revoked.

This event has two parameters:

* `address indexed`**`owner`**
* `uint256 indexed`**`nonceSpace`**

</details>

### Errors

```solidity
error NonceAlreadyRevoked(address addr, uint256 nonceSpace, uint256 nonce);
error NonceNotUsable(address addr, uint256 nonceSpace, uint256 nonce);
```

<details>

<summary><code>NonceAlreadyRevoked</code></summary>

A NonceAlreadyRevoked error is thrown when trying to revoke a nonce that is already revoked.

This error has three parameters:

* `address`**`addr`**
* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

</details>

<details>

<summary><code>NonceNotUsable</code></summary>

A NonceNotUsable error is thrown when trying to use a nonce that is revoked or not in the current nonce space.

This error has three parameters:

* `address`**`addr`**
* `uint256`**`nonceSpace`**
* `uint256`**`nonce`**

</details>
