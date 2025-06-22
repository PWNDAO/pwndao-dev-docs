import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Architecture

Before we dive deep into the contracts let's have a look at the high-level architecture.

![PWN smart contract architecture](/assets/Architecture%20(2).png)

<Tabs>
<TabItem value="pwn" label="PWN">
PWN contract serves as the only interface between a user and the protocol.&#x20;
</TabItem>
<TabItem value="pwn-vault" label="PWN Vault">
PWN Vault is used for storing assets.
</TabItem>
<TabItem value="pwn-loan" label="PWN LOAN">
PWN LOAN is used to store information about LOANs. LOAN is an ERC-1155 token representing a loan in the PWN protocol.
</TabItem>
<TabItem value="multitoken" label="MultiToken">
MultiToken is a solidity library that wraps transfer, allowance and balance check calls for ERC20, ERC721 & ERC1155 tokens. Unifying the function calls used within the PWN context, so we don't have to worry about handling these token standards individually.
</TabItem>
</Tabs>
