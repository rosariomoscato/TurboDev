import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'TurboDev',
  description: 'Terminal-based AI coding agent',
  base: '/TurboDev/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  locales: {
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/en/' },
          { text: 'Usage', link: '/en/usage/' },
          { text: 'Agents', link: '/en/agents/' },
          {
            text: 'GitHub',
            link: 'https://github.com/rosariomoscato/TurboDev',
          },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en/' },
                { text: 'Installation', link: '/en/installation' },
                { text: 'Configuration', link: '/en/configuration/' },
              ],
            },
            {
              text: 'Usage',
              items: [
                { text: 'Terminal UI', link: '/en/usage/' },
                { text: 'Commands', link: '/en/usage/commands' },
                { text: 'Keyboard Shortcuts', link: '/en/usage/shortcuts' },
                { text: 'Sessions', link: '/en/usage/sessions' },
                { text: 'Context Window', link: '/en/usage/context-window' },
              ],
            },
            {
              text: 'Configuration',
              items: [
                { text: 'Agents', link: '/en/agents/' },
                { text: 'Tools', link: '/en/agents/tools' },
                { text: 'Permissions', link: '/en/agents/permissions' },
                { text: 'Models', link: '/en/configuration/models' },
                { text: 'AGENTS.md', link: '/en/configuration/agents-md' },
              ],
            },
            {
              text: 'Help',
              items: [
                { text: 'Troubleshooting', link: '/en/troubleshooting' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/rosariomoscato/TurboDev/edit/master/docs/:path',
          text: 'Edit this page on GitHub',
        },
      },
    },
    it: {
      label: 'Italiano',
      lang: 'it',
      link: '/it/',
      themeConfig: {
        nav: [
          { text: 'Docs', link: '/it/' },
          { text: 'Utilizzo', link: '/it/utilizzo/' },
          { text: 'Agenti', link: '/it/agenti/' },
          {
            text: 'GitHub',
            link: 'https://github.com/rosariomoscato/TurboDev',
          },
        ],
        sidebar: {
          '/it/': [
            {
              text: 'Per Iniziare',
              items: [
                { text: 'Introduzione', link: '/it/' },
                { text: 'Installazione', link: '/it/installazione' },
                { text: 'Configurazione', link: '/it/configurazione/' },
              ],
            },
            {
              text: 'Utilizzo',
              items: [
                { text: 'Terminale', link: '/it/utilizzo/' },
                { text: 'Comandi', link: '/it/utilizzo/comandi' },
                { text: 'Scorciatoie', link: '/it/utilizzo/scorciatoie' },
                { text: 'Sessioni', link: '/it/utilizzo/sessioni' },
                { text: 'Finestra di contesto', link: '/it/utilizzo/finestra-contesto' },
              ],
            },
            {
              text: 'Configurazione',
              items: [
                { text: 'Agenti', link: '/it/agenti/' },
                { text: 'Strumenti', link: '/it/agenti/strumenti' },
                { text: 'Permessi', link: '/it/agenti/permessi' },
                { text: 'Modelli', link: '/it/configurazione/modelli' },
                { text: 'AGENTS.md', link: '/it/configurazione/agents-md' },
              ],
            },
            {
              text: 'Aiuto',
              items: [
                { text: 'Risoluzione Problemi', link: '/it/risoluzione-problemi' },
              ],
            },
          ],
        },
        editLink: {
          pattern: 'https://github.com/rosariomoscato/TurboDev/edit/master/docs/:path',
          text: 'Modifica questa pagina su GitHub',
        },
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rosariomoscato/TurboDev' },
    ],
    search: {
      provider: 'local',
    },
  },
});
