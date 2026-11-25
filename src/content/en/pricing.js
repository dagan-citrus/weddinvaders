import { deepFreeze } from '../format.js';

export const pricing = deepFreeze({
  // D7: every number in this file is an example until real prices are supplied.
  // To go live: replace the numbers, then set this to false. The notice and all tags disappear.
  pricesArePlaceholder: true,
  currency: 'USD', // the only place the currency is named (ISO 4217)
  intro: {
    headline: 'One game, one couple, one price.',
    body: 'Pick how much of the game you want made about you. Every package is a one-time price for one event.',
  },
  notice: {
    title: 'Example pricing.',
    body: 'The prices, delivery times and hosting periods on this page are examples while we finalise our packages. Contact us for a current quote.',
    priceTag: 'Example price',
    termsTag: 'Example terms',
  },
  tiersHeading: 'Packages',
  priceNote: 'one-time, per event',
  tierCta: 'Choose {name}',
  tiers: [
    { id: 'basic', name: 'Basic', tagline: 'The standard game, starring you.', price: 149,
      features: [
        { id: 'names', text: 'Your names in the game' },
        { id: 'address', text: 'Your own web address' },
        { id: 'photos', text: 'Your three photos: bride, groom and the two of you' },
        { id: 'messages', text: 'Your own title, tagline and ending messages' },
        { id: 'standard', text: 'The standard items and five levels' },
      ] },
    { id: 'custom', name: 'Custom', tagline: 'Your own shopping list.', price: 249,
      features: [
        { id: 'basic', text: 'Everything in Basic' },
        { id: 'items', text: 'Your own items: emoji, labels and prices' },
        { id: 'special', text: 'Your own guests, family and trap items' },
        { id: 'levels', text: 'The five standard levels, using your items' },
      ] },
    { id: 'premium', name: 'Premium', tagline: 'A game designed around your story.', price: 399,
      features: [
        { id: 'custom', text: 'Everything in Custom' },
        { id: 'levels', text: 'Your own levels: names, subtitles and what must be bought' },
        { id: 'balance', text: 'Difficulty tuned for your guests: budget, speed and time limits' },
        { id: 'count', text: 'A shorter or longer game than five levels' },
      ] },
  ],
  addonsHeading: 'Add-ons',
  addonsBody: 'Available with any package. Mention them when you order.',
  addons: [
    { id: 'rush', name: 'Rush delivery', price: 49,
      description: 'Your game ready in {rushDeliveryDays} days instead of {deliveryDays}.' },
    { id: 'qr', name: 'Printable QR code', price: 19,
      description: 'A print-ready QR code that opens your game, for table cards and invitations.' },
    { id: 'hosting', name: 'Extended hosting', price: 29,
      description: 'Keep your game online for another {hostingExtensionMonths} months.' },
  ],
  termValues: { deliveryDays: 7, rushDeliveryDays: 3, hostingMonths: 12, hostingExtensionMonths: 12 },
  terms: {
    heading: 'Delivery and hosting',
    items: [
      { id: 'delivery', text: 'Delivery: about {deliveryDays} days after we have your names, photos and text.' },
      { id: 'hosting', text: 'Hosting: your game stays online for {hostingMonths} months after delivery.' },
      { id: 'payment', text: 'No online payment. You send an order, and we reply by email to confirm the details and arrange payment.' },
    ],
  },
  cta: {
    heading: 'Not sure which one?',
    body: 'See exactly what can be changed, or play the standard game first.',
    customizeCta: 'See what can be customized',
    demoCta: 'Try the demo',
  },
});
