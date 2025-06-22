# Architecture

So how does PWN Safe work altogether? To explain, we'll first look at the Gnosis Safe guard and module architecture and then the complete design of PWN Safe.&#x20;

## Safe Guard and Module

![](/assets/image%20(1).png)

As shown in the diagram above, the Safe wallet can be extended by a guard and a module.&#x20;

In its essence, a guard is a contract which checks every transaction before and after its execution. In the case of the [ATR Guard](smart-contract-reference/atr-guard/), its purpose is to make sure an asset which has an ATR token minted cannot be transferred from the Safe wallet.

A module enables one to make a transaction without needing the Safe owners to sign it. The [ATR Module](smart-contract-reference/atr-module/) leverages this feature so an ATR token holder can transfer an asset even though the holder isn't the Safe owner.&#x20;

## PWN Safe Design

![](/assets/PWN%20Safe%20Architecture.png)

<details>

<summary><a href="smart-contract-reference/pwn-safe-factory.md">PWN Safe Factory</a></summary>

Deploys new PWN Safes. Users don't deploy new Safe contracts for each Safe, as that would be ineffective and expensive. Instead, they deploy a proxy contract.

PWN Safe Factory also provides a function `isValidSafe` to check if a Safe is valid.

</details>

<details>

<summary><a href="smart-contract-reference/atr-module/">Asset Transfer Rights</a></summary>

The ATR contract is used as a module and defines the ATR token. It is responsible for its minting and burning. The ATR token is an [ERC-721](https://eips.ethereum.org/EIPS/eip-721).

There is also an option to whitelist only specific assets and recovery functions to recover from a [stalking attack](security-considerations.md#stalking-attacks).

</details>

<details>

<summary><a href="smart-contract-reference/atr-guard/">Asset Transfer Rights Guard</a> (Proxy)</summary>

The ATR Guard checks every transaction before and after its execution, making sure that an asset that has an ATR token minted cannot be transferred or have approved operators.&#x20;

This contract is wrapped in a proxy contract so that it can be upgraded.

</details>

<details>

<summary><a href="smart-contract-reference/atr-guard/operators-context.md">Operators Context</a></summary>

Tracks all approved operators. An operator is any address that can transfer on behalf of the Safe owner.

</details>

<details>

<summary><a href="https://docs.openzeppelin.com/contracts/2.x/api/ownership#Ownable">Owner</a></summary>

Can update the Guard contract so that users won't have to create new Safes in case of a new ERC standard. The owner can also update the whitelist to allow only selected assets to be used in the PWN Safe.

Please note: It's not possible for the owner to change the guard in a way that would allow him to transfer assets held in PWN Safes, but it is possible to make the ATR tokens behave in a malicious way. This is a trade-off for the upgradability of PWN Safes.&#x20;

</details>

<details>

<summary><a href="https://github.com/safe-global/safe-contracts">Safe contracts</a></summary>

No changes have been made to the original Gnosis Safe contracts. For reference, see [their GitHub repository](https://github.com/safe-global/safe-contracts).

</details>

