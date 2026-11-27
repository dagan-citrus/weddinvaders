// Shared fixture for the order-form tests: one valid order, the context its
// message is built from, and the exact email it must produce.
import { SITE_CONFIG } from '../siteConfig';

/** A complete, valid order. Fresh object on every call, so tests may change it. */
export const makeOrder = (overrides = {}) => ({
  brideName: 'Shelly',
  groomName: 'Dan',
  weddingDate: '2027-06-12',
  slug: 'DanAndShelly',
  package: 'custom',
  addons: ['rush', 'qr'],
  email: 'dan@example.org',
  notes: 'We met at a taco truck.\nMake level 1 about tacos!',
  ...overrides,
});

/** A real-looking contact address that is not the placeholder, so ordering is open. */
export const ORDER_TO = 'orders@weddinvaders.test';

export const ORDER_SITE_NAME = "Weddin'Vaders";
/** The site's address comes from the site config, the only place it may be written (G8). */
export const ORDER_EVENT_URL = `${SITE_CONFIG.baseUrl}/DanAndShelly`;
export const ORDER_PACKAGE_NAME = 'Custom';
export const ORDER_ADDON_NAMES = ['Rush delivery', 'Printable QR code'];

export const ORDER_SUBJECT = "Weddin'Vaders order: Dan & Shelly (DanAndShelly)";

/** The message lines for `makeOrder()`, in order. */
export const ORDER_BODY_LINES = [
  "New order from the Weddin'Vaders order form",
  '',
  'Bride: Shelly',
  'Groom: Dan',
  'Wedding date: 2027-06-12',
  `Requested address: ${ORDER_EVENT_URL}`,
  'Package: Custom',
  'Add-ons: Rush delivery, Printable QR code',
  'Reply to: dan@example.org',
  '',
  'Notes:',
  'We met at a taco truck.',
  'Make level 1 about tacos!',
];

export const ORDER_BODY = ORDER_BODY_LINES.join('\n');

/**
 * The mailto URL for `makeOrder()` sent to `ORDER_TO`, written out piece by
 * piece: percent-encoded, CRLF line breaks (RFC 6068), a literal `@` in the
 * address. Only the site's own address is computed, because the hostname may
 * not be written outside the site config; `orderForm.test.js` pins the whole
 * string as a literal.
 */
export const ORDER_MAILTO_URL = 'mailto:orders@weddinvaders.test'
  + "?subject=Weddin'Vaders%20order%3A%20Dan%20%26%20Shelly%20(DanAndShelly)"
  + "&body=New%20order%20from%20the%20Weddin'Vaders%20order%20form%0D%0A%0D%0A"
  + 'Bride%3A%20Shelly%0D%0A'
  + 'Groom%3A%20Dan%0D%0A'
  + 'Wedding%20date%3A%202027-06-12%0D%0A'
  + `Requested%20address%3A%20${encodeURIComponent(ORDER_EVENT_URL)}%0D%0A`
  + 'Package%3A%20Custom%0D%0A'
  + 'Add-ons%3A%20Rush%20delivery%2C%20Printable%20QR%20code%0D%0A'
  + 'Reply%20to%3A%20dan%40example.org%0D%0A%0D%0A'
  + 'Notes%3A%0D%0A'
  + 'We%20met%20at%20a%20taco%20truck.%0D%0A'
  + 'Make%20level%201%20about%20tacos!';

/** Six hundred Hebrew letters: within the notes limit, far too long for a mailto URL once encoded. */
export const HEBREW_NOTES = 'א'.repeat(600);
