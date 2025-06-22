import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'PWN Docs',
  tagline: 'PWN is a universal, peer-to-peer lending platform',
  favicon: 'img/favicon.ico',
  url: 'https://docs.pwn.xyz',
  baseUrl: '/',
  organizationName: 'pwndao',
  projectName: 'pwndao-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl:
            'https://github.com/pwndao/pwndao-docs/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve('docusaurus-lunr-search'),
      {
        indexBaseUrl: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      logo: {
        alt: 'PWN Logo',
        src: 'img/logo.svg',
        // src: 'img/logo-white.svg',
        // srcDark: 'img/logo.svg',
        style: {
          height: '30px',
          paddingRight: '20px',
        },
      },
      items: [
        {
          href: 'https://app.pwn.xyz/',
          label: 'Try it out!',
          position: 'right',
        },
        {
          href: 'https://pwn.xyz/',
          label: 'Website',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
