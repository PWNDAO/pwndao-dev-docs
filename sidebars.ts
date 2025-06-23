import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'index',
    {
      type: 'category',
      label: 'Smart contracts',
      items: [
        {
          type: 'category',
          label: 'Core',
          items: [
            'smart-contracts/core/introduction',
            'smart-contracts/core/deep-dive',
            {
              type: 'category',
              label: 'Smart Contract Reference',
              items: [
                {
                  type: 'category',
                  label: 'PWN Hub',
                  link: {
                    type: 'doc',
                    id: 'smart-contracts/core/smart-contract-reference/pwn-hub/README',
                  },
                  items: ['smart-contracts/core/smart-contract-reference/pwn-hub/tags'],
                },
                'smart-contracts/core/smart-contract-reference/pwn-config',
                'smart-contracts/core/smart-contract-reference/pwn-vault',
                {
                  type: 'category',
                  label: 'Loan Types',
                  items: ['smart-contracts/core/smart-contract-reference/loan-types/simple-loan'],
                },
                {
                  type: 'category',
                  label: 'Proposals',
                  items: [
                    {
                      type: 'category',
                      label: 'Simple Loan Proposal',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/README',
                      },
                      items: [
                        'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/simple-proposal',
                        'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/list-proposal',
                        'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/elastic-proposal',
                        'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/elastic-chainlink-proposal',
                        'smart-contracts/core/smart-contract-reference/proposals/simple-loan-proposal/dutch-proposal',
                      ],
                    },
                  ],
                },
                'smart-contracts/core/smart-contract-reference/pwn-utilized-credit',
                'smart-contracts/core/smart-contract-reference/pwn-loan',
                'smart-contracts/core/smart-contract-reference/pwn-revoked-nonce',
                {
                  type: 'category',
                  label: 'Peripheral Contracts',
                  items: [
                    {
                      type: 'category',
                      label: 'Acceptor Controller',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/core/smart-contract-reference/peripheral-contracts/acceptor-controller/README',
                      },
                      items: ['smart-contracts/core/smart-contract-reference/peripheral-contracts/acceptor-controller/world-id'],
                    },
                    {
                      type: 'category',
                      label: 'State Fingerprint Computer',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/core/smart-contract-reference/peripheral-contracts/state-fingerprint-computer/README',
                      },
                      items: [
                        { type: 'link', label: 'UniV3', href: 'https://github.com/PWNFinance/pwn_contracts_periphery/blob/main/src/state-fingerprint-computer/UniV3PosStateFingerpringComputer.sol' },
                        { type: 'link', label: 'Chicken Bonds', href: 'https://github.com/PWNFinance/pwn_contracts_periphery/blob/main/src/state-fingerprint-computer/ChickenBondStateFingerpringComputer.sol' },
                      ],
                    },
                    {
                      type: 'category',
                      label: 'Pool Adapter',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/core/smart-contract-reference/peripheral-contracts/pool-adapter/README',
                      },
                      items: [
                        { type: 'link', label: 'Aave', href: 'https://github.com/PWNFinance/pwn_contracts_periphery/blob/main/src/pool-adapter/AaveAdapter.sol' },
                        { type: 'link', label: 'Compound', href: 'https://github.com/PWNFinance/pwn_contracts_periphery/blob/main/src/pool-adapter/CompoundAdapter.sol' },
                        { type: 'link', label: 'ERC4626', href: 'https://github.com/PWNDAO/pwn_contracts_periphery/blob/main/src/pool-adapter/ERC4626Adapter.sol' },
                      ],
                    },
                  ],
                },
                {
                  type: 'category',
                  label: 'Miscellaneous',
                  items: [
                    'smart-contracts/core/smart-contract-reference/miscellaneous/pwn-fee-calculator',
                    'smart-contracts/core/smart-contract-reference/miscellaneous/pwn-signature-checker',
                    'smart-contracts/core/smart-contract-reference/miscellaneous/pwn-errors',
                    { type: 'link', label: 'PWN Periphery', href: 'https://github.com/PWNFinance/pwn_contracts_periphery/' },
                    { type: 'link', label: 'Timelock', href: 'https://docs.openzeppelin.com/contracts/4.x/api/governance#timelock' },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'PWN DAO',
          link: {
            type: 'doc',
            id: 'smart-contracts/pwn-dao/README',
          },
          items: [
            {
              type: 'category',
              label: 'Governance',
              items: ['smart-contracts/pwn-dao/governance/optimistic', 'smart-contracts/pwn-dao/governance/token'],
            },
            {
              type: 'category',
              label: 'Tokens',
              items: [
                'smart-contracts/pwn-dao/tokens/pwn',
                'smart-contracts/pwn-dao/tokens/stpwn',
                {
                  type: 'category',
                  label: 'vePWN',
                  link: {
                    type: 'doc',
                    id: 'smart-contracts/pwn-dao/tokens/vepwn/README',
                  },
                  items: [
                    'smart-contracts/pwn-dao/tokens/vepwn/stake',
                    'smart-contracts/pwn-dao/tokens/vepwn/power',
                    'smart-contracts/pwn-dao/tokens/vepwn/metadata',
                  ],
                },
              ],
            },
            'smart-contracts/pwn-dao/epoch-clock',
            {
              type: 'category',
              label: 'Miscellaneous',
              items: [
                { type: 'link', label: 'Errors', href: 'https://github.com/PWNDAO/pwn_dao/blob/main/src/lib/Error.sol' },
                { type: 'link', label: 'EpochPowerLib', href: 'https://github.com/PWNDAO/pwn_dao/blob/main/src/lib/EpochPowerLib.sol' },
              ],
            },
          ],
        },
        {
          type: 'category',
          label: 'Tools',
          items: [
            {
              type: 'category',
              label: 'PWN Safe',
              link: {
                type: 'doc',
                id: 'smart-contracts/tools/pwn-safe/README',
              },
              items: [
                'smart-contracts/tools/pwn-safe/architecture',
                'smart-contracts/tools/pwn-safe/security-considerations',
                {
                  type: 'category',
                  label: 'Smart Contract Reference',
                  items: [
                    'smart-contracts/tools/pwn-safe/smart-contract-reference/pwn-safe-factory',
                    {
                      type: 'category',
                      label: 'ATR Module',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/tools/pwn-safe/smart-contract-reference/atr-module/README',
                      },
                      items: [
                        'smart-contracts/tools/pwn-safe/smart-contract-reference/atr-module/tokenized-asset-manager',
                        'smart-contracts/tools/pwn-safe/smart-contract-reference/atr-module/recipient-permission-manager',
                      ],
                    },
                    'smart-contracts/tools/pwn-safe/smart-contract-reference/whitelist',
                    {
                      type: 'category',
                      label: 'ATR Guard',
                      link: {
                        type: 'doc',
                        id: 'smart-contracts/tools/pwn-safe/smart-contract-reference/atr-guard/README',
                      },
                      items: ['smart-contracts/tools/pwn-safe/smart-contract-reference/atr-guard/operators-context'],
                    },
                  ],
                },
              ],
            },
            'smart-contracts/tools/token-bundler',
            'smart-contracts/tools/pwn-deployer',
          ],
        },
        {
          type: 'category',
          label: 'Libraries',
          items: ['smart-contracts/libraries/multitoken'],
        },
        'smart-contracts/contract-addresses',
      ],
    },
    'audits',
    {
      type: 'html',
      value: '<hr class="sidebar-divider" />',
    },
    {
      type: 'category',
      label: 'More documentation',
      items: [
        { type: 'link', label: 'PWN Docs', href: 'https://docs.pwn.xyz/' },
        { type: 'link', label: 'FAQ', href: 'https://faq.pwn.xyz/' },
        'more-documentation/using-pwn-without-front-end',
      ],
    },
    {
      type: 'category',
      label: 'Deprecated',
      items: [
        {
          type: 'category',
          label: 'PWN Beta',
          link: {
            type: 'doc',
            id: 'deprecated/pwn-beta/README',
          },
          items: [
            'deprecated/pwn-beta/architecture',
            {
              type: 'category',
              label: 'PWN',
              link: {
                type: 'doc',
                id: 'deprecated/pwn-beta/pwn/README',
              },
              items: [
                'deprecated/pwn-beta/pwn/off-chain-signed-offer',
                'deprecated/pwn-beta/pwn/offer-types',
              ],
            },
            'deprecated/pwn-beta/pwn-vault',
            'deprecated/pwn-beta/pwn-loan',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
