import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'index',
    'faq',
    {
      type: 'category',
      label: '💁 Guides',
      items: [
        {
          type: 'category',
          label: 'Borrowing on PWN',
          items: [
            'Guides/borrowing-on-pwn/index',
            'Guides/borrowing-on-pwn/creating-a-borrowing-proposal',
            'Guides/borrowing-on-pwn/borrowing-from-a-specific-asset-collection',
            'Guides/borrowing-on-pwn/repaying-loans',
            'Guides/borrowing-on-pwn/requesting-a-loan-extension',
          ],
        },
        {
          type: 'category',
          label: 'Lending on PWN',
          items: [
            'Guides/lending-on-pwn/index',
            'Guides/lending-on-pwn/funding-loans',
            'Guides/lending-on-pwn/creating-a-lending-proposal',
            'Guides/lending-on-pwn/offering-a-loan-extension',
            'Guides/lending-on-pwn/claiming-defaulted-collateral',
            'Guides/lending-on-pwn/advanced-lending-features',
          ],
        },
        {
          type: 'category',
          label: 'Other',
          items: [
            'Guides/other/verification-guide',
            'Guides/other/token-verification-lists-101',
            'Guides/other/notifications-on-pwn',
            'Guides/other/incentives',
            'Guides/other/pwns-strategy-vault',
          ],
        },
        {
          type: 'category',
          label: 'Tools',
          items: ['Guides/tools/pwn-bundler'],
        },
        'Guides/strategies',
        'Guides/pool-hooks',
      ],
    },
    {
      type: 'category',
      label: '📝 PWN DAO',
      items: ['PWN DAO/pwn-dao', 'PWN DAO/Staking'],
    },
    {
      type: 'category',
      label: '❤️ Community',
      items: [
        'Community/index',
        'Community/levels-system',
        'Community/referral-system',
        {
          type: 'category',
          label: 'Incentives',
          items: [
            'Community/incentives/index',
            'Community/incentives/reputation-points',
          ],
        },
        {
          type: 'category',
          label: 'Social Incentives',
          items: [
            'Community/social-incentives/index',
            'Community/social-incentives/social-rewards',
            'Community/social-incentives/content-types',
          ],
        },
        'Community/achievements-dashboard',
      ],
    },
    {
      type: 'html',
      value: '<hr class="sidebar-divider" />',
    },
    {
      type: 'link',
      label: 'PWN App',
      href: 'https://app.pwn.xyz/#/',
    },
    {
      type: 'link',
      label: '💬 Discord',
      href: 'https://discord.gg/aWghBQSdHv',
    },
    {
      type: 'link',
      label: 'Mirror',
      href: 'https://pwn.mirror.xyz/',
    },
    {
      type: 'link',
      label: 'Twitter',
      href: 'https://twitter.com/PWNDAO',
    },
    {
      type: 'link',
      label: 'Warpcast',
      href: 'https://warpcast.com/pwndao',
    },
    {
      type: 'link',
      label: 'YouTube',
      href: 'https://www.youtube.com/@pwndaoxyz',
    },
    {
      type: 'link',
      label: '🧑‍💻 Developer Documentation',
      href: 'https://dev-docs.pwn.xyz/',
    },
    {
      type: 'link',
      label: '🎨 Brand Kit',
      href: 'https://pwn.xyz/brand-kit',
    },
  ],
};

export default sidebars;
