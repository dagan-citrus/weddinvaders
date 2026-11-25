import { deepFreeze } from '../format.js';

/** Copy shared by every site page: the shell around the page content. */
export const common = deepFreeze({
  skipToContent: 'Skip to content',
  nav: {
    ariaLabel: 'Site',
    labels: {
      home: 'Home',
      demo: 'Demo',
      customize: 'Customize',
      pricing: 'Pricing',
      'how-it-works': 'How it works',
      order: 'Order',
      showcase: 'Showcase',
      privacy: 'Privacy',
      terms: 'Terms',
    },
  },
  footer: {
    tagline: 'Custom two-player wedding games, built one couple at a time.',
    navAriaLabel: 'Footer',
    linkLabels: { privacy: 'Privacy policy', terms: 'Terms of service', order: 'Contact us' },
    contactLabel: 'Email us',
    copyright: '© {year} {name}. All rights reserved.',
  },
});
