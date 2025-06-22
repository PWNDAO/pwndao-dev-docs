# World ID

## 1. Summary

WorldIdAcceptorController.sol contract enables users to require zero-knowledge proof for their lending or borrowing counterparties through World ID. One of the use cases is verifying the humanness of the counterparty.

:::info
For more information about World ID please refer to the [World Docs](https://docs.world.org/world-id).
:::

## 2. Important links

* [**View on GitHub**](https://github.com/PWNDAO/pwn_protocol_periphery/blob/world-id/src/acceptor-controller/WorldIdAcceptorController.sol)

## 3. Contract details

* _WorldIdAcceptorController.sol_ is written in Solidity version 0.8.16

### Features

* Verify World ID zero-knowledge proof

### Inherited contracts, implemented Interfaces and ERCs

* [IPWNAcceptorController](./)

### Functions

<details>

<summary><code>checkAcceptor</code></summary>

#### Overview

Proposal contracts call this function to verify submitted World ID proofs.

This function takes three arguments supplied by the proposal contracts:

* `address`**`acceptor`**
* `bytes calldata`**`proposerData`** - data to be verified from the proposer
* `bytes calldata`**`acceptorData`** - data to be verified from the acceptor

#### Implementation

```solidity
function checkAcceptor(
    address acceptor, bytes calldata proposerData, bytes calldata acceptorData
) external view returns (bytes4) {
    if (proposerData.length > 0) {
        revert NonEmptyProposerData();
    }

    AcceptorData memory data = abi.decode(acceptorData, (AcceptorData));

    worldId.verifyProof(
        data.root,
        groupId,
        _hashToField(abi.encodePacked(acceptor)),
        data.nullifierHash,
        externalNullifier,
        data.proof
    );

    return type(IPWNAcceptorController).interfaceId;
}
```

</details>

### Events and Errors

The World ID Acceptor Controller contract defines one custom error and no events.

```solidity
error NonEmptyProposerData();
```

<details>

<summary><code>NonEmptyProposerData</code></summary>

A NonEmptyProposerData error is thrown when proposer data are not empty.

This error doesn't have any parameters.

</details>

:::info
Check for empty `acceptorData` is ensured though `abi.decode` validation.&#x20;
:::

### `AcceptorData` Struct

<table><thead><tr><th width="157.09421454876235">Type</th><th width="228.45656287647148">Name</th><th>Comment</th></tr></thead><tbody><tr><td><code>uint256</code></td><td><code>root</code></td><td>Root of the proof merkle tree</td></tr><tr><td><code>uint256</code></td><td><code>nullifierHash</code></td><td>Nullifier hash for the proof</td></tr><tr><td><code>uint256[8]</code></td><td><code>proof</code></td><td>ZK Proof itself</td></tr></tbody></table>
