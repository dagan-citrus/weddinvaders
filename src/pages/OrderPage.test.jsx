import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import App from '../App';
import OrderPage from './OrderPage';
import { FIELD_ORDER, isOrderingOpen } from './orderForm';
import { order, pricing } from '../content';
import { ROUTE_ID, SITE_ROUTES } from '../routes';
import { PLACEHOLDER_CONTACT_EMAIL, SITE_CONFIG } from '../siteConfig';
import {
  HEBREW_NOTES, ORDER_BODY, ORDER_MAILTO_URL, ORDER_SUBJECT, ORDER_TO, makeOrder,
} from '../test/orderFixtures';

// The order page (T9): a form that turns an order into an email the visitor
// sends themselves. Nothing is submitted anywhere; a valid submit opens a
// mailto URL and shows the same message for copying. While the contact address
// is the placeholder, ordering is closed.

const ORDER_ROUTE = SITE_ROUTES.find((route) => route.id === ROUTE_ID.ORDER);
const ORDER_PATH = '/order';
const NAV_NAME = 'Site';
const PLACEHOLDER_TEXT = 'Coming soon.';
/** "Today" for every test, so the fixture's wedding date stays in the future. */
const TODAY = new Date(2026, 0, 1, 12);

const LABEL = {
  brideName: "Bride's name",
  groomName: "Groom's name",
  weddingDate: 'Wedding date',
  slug: 'Address for your game',
  email: 'Your email',
  notes: 'Notes (optional)',
};
const PACKAGE_RADIOS = [['basic', 'Basic'], ['custom', 'Custom'], ['premium', 'Premium'], ['unsure', 'Not sure yet']];
const ADDON_CHECKBOXES = [['rush', 'Rush delivery'], ['qr', 'Printable QR code'], ['hosting', 'Extended hosting']];
const SUBMIT_NAME = 'Create my order email';
const COPY_NAME = 'Copy message';
const RESULT_HEADING = 'Almost done: send the email';
const CLOSED_TITLE = 'Ordering is not open yet.';
const CLOSED_NOTICE_ID = 'order-closed-notice';
const MAILTO_MAX_LENGTH = 2000;

const REQUIRED_MESSAGES = {
  brideName: "Enter the bride's name.",
  groomName: "Enter the groom's name.",
  weddingDate: 'Enter your wedding date.',
  package: 'Choose a package, or pick "Not sure yet".',
  email: 'Enter your email address.',
};
const SLUG_REQUIRED_MESSAGE = 'Enter the address you would like.';

const field = (name) => screen.getByLabelText(LABEL[name]);
const radio = (name) => screen.getByRole('radio', { name });
const checkbox = (name) => screen.getByRole('checkbox', { name });
const packageGroup = () => document.getElementById('order-package');
const submitButton = () => screen.getByRole('button', { name: SUBMIT_NAME });
const errorOf = (name) => document.getElementById(`order-${name}-error`);
const slugStatus = () => screen.queryByTestId('order-slug-status');
const slugPreview = () => screen.queryByTestId('order-slug-preview');
const resultPanel = () => screen.queryByTestId('order-result');
const messageBox = () => screen.getByTestId('order-message');
const describedBy = (element) => (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
const dataValues = (root, attribute) =>
  [...root.querySelectorAll(`[${attribute}]`)].map((element) => element.getAttribute(attribute));
const checkedRadios = () => screen.getAllByRole('radio').filter((input) => input.checked).map((input) => input.value);

const type = (name, value) => fireEvent.change(field(name), { target: { value } });

/** Fills the form with `makeOrder()` (or a variation of it). */
function fillValid(overrides) {
  const values = makeOrder(overrides);
  type('brideName', values.brideName);
  type('groomName', values.groomName);
  type('weddingDate', values.weddingDate);
  type('slug', values.slug);
  const packageName = PACKAGE_RADIOS.find(([id]) => id === values.package)?.[1];
  if (packageName) fireEvent.click(radio(packageName));
  for (const [id, name] of ADDON_CHECKBOXES) {
    if (values.addons.includes(id)) fireEvent.click(checkbox(name));
  }
  type('email', values.email);
  type('notes', values.notes);
}

function renderOpen() {
  const open = vi.fn();
  const view = render(<OrderPage route={ORDER_ROUTE} contactEmail={ORDER_TO} openMailto={open} />);
  return { open, ...view };
}

function renderClosed() {
  const open = vi.fn();
  const view = render(<OrderPage route={ORDER_ROUTE} contactEmail={PLACEHOLDER_CONTACT_EMAIL} openMailto={open} />);
  return { open, ...view };
}

/** Renders the whole app with the browser already at `path`. */
function renderAt(path) {
  window.history.replaceState(null, '', path);
  return render(<App />);
}

function stubClipboard(clipboard) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
  delete navigator.clipboard;
});

describe('OrderPage (component): structure', () => {
  it('test_structure', () => {
    renderOpen();

    expect(dataValues(document, 'data-section')).toEqual(['intro', 'form', 'faq']);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.map((heading) => heading.textContent)).toEqual(['Order']);
    expect(screen.getByRole('form', { name: 'Order form' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('test_fields', () => {
    renderOpen();

    for (const name of ['brideName', 'groomName', 'slug', 'email', 'notes']) {
      expect(screen.getByRole('textbox', { name: LABEL[name] })).toBe(field(name));
      expect(field(name)).toHaveAttribute('id', `order-${name}`);
    }
    expect(field('weddingDate')).toHaveAttribute('type', 'date');
    expect(field('weddingDate')).toHaveAttribute('id', 'order-weddingDate');
    expect(field('email')).toHaveAttribute('type', 'email');
    expect(field('notes').tagName).toBe('TEXTAREA');

    for (const name of ['brideName', 'groomName', 'weddingDate', 'slug', 'email']) {
      expect(field(name)).toBeRequired();
    }
    expect(field('notes')).not.toBeRequired();
    expect(packageGroup()).toHaveAttribute('role', 'radiogroup');
    expect(packageGroup()).toHaveAttribute('aria-required', 'true');
    expect(within(packageGroup()).getByText('Package')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Add-ons (optional)' })).toBe(document.getElementById('order-addons'));

    expect(field('notes')).toHaveAttribute('maxlength', '600');
    expect(field('slug')).toHaveAttribute('maxlength', '40');
    expect(field('brideName')).toHaveAttribute('maxlength', '40');
    expect(field('groomName')).toHaveAttribute('maxlength', '40');
    expect(field('weddingDate')).toHaveAttribute('min', '2026-01-01');

    expect(submitButton()).toHaveAttribute('type', 'submit');
    // Every field has a wrapper hook, and the validated fields come in focus order.
    const wrappers = dataValues(document, 'data-field');
    expect([...wrappers].sort()).toEqual([...FIELD_ORDER, 'addons'].sort());
    expect(wrappers.filter((name) => name !== 'addons')).toEqual(FIELD_ORDER);
  });

  it('test_package_options_from_pricing', () => {
    renderOpen();

    const radios = screen.getAllByRole('radio');
    expect(radios.map((input) => input.value)).toEqual(PACKAGE_RADIOS.map(([id]) => id));
    expect(radios.map((input) => input.value)).toEqual([...pricing.tiers.map((tier) => tier.id), 'unsure']);
    for (const [id, name] of PACKAGE_RADIOS) expect(radio(name)).toHaveAttribute('value', id);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.map((input) => input.value)).toEqual(pricing.addons.map((addon) => addon.id));
    for (const [id, name] of ADDON_CHECKBOXES) expect(checkbox(name)).toHaveAttribute('value', id);
    expect(checkboxes.filter((input) => input.checked)).toEqual([]);

    expect(within(packageGroup()).getByRole('link', { name: 'Compare packages' })).toHaveAttribute('href', '/pricing');
  });

  it('test_package_options_from_pricing: no price is shown on the order page', () => {
    const { container } = renderOpen();

    expect(container.textContent).not.toMatch(/[$₪€£]/);
  });

  it('test_static_copy', () => {
    renderOpen();

    expect(screen.getByTestId('order-privacy').textContent).toBe(order.intro.privacy);
    expect(screen.getByTestId('order-photos-note').textContent).toBe(order.form.photosNote);
    expect(screen.getByText(order.intro.headline)).toBeInTheDocument();
    expect(document.getElementById('order-slug-hint').textContent).toBe(order.fields.slug.hint);
    expect(document.getElementById('order-notes-hint').textContent).toContain('Up to 600 characters.');
    expect(document.body.textContent).not.toMatch(/[{}]/);
  });

  it('test_faq', () => {
    renderOpen();

    const faq = document.querySelector('section[data-section="faq"]');
    expect(within(faq).getByRole('heading', { level: 2 }).textContent).toBe('Questions');
    expect(dataValues(faq, 'data-faq')).toEqual(order.faq.items.map((item) => item.id));
    expect(order.faq.items).toHaveLength(8);

    for (const item of order.faq.items) {
      const entry = faq.querySelector(`[data-faq="${item.id}"]`);
      expect(within(entry).getByRole('heading', { level: 3 }).textContent).toBe(item.question);
      expect(within(entry).getByText(item.answer)).toBeInTheDocument();
    }
    const links = within(faq).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['See pricing', '/pricing'],
      ['See what can be customized', '/customize'],
    ]);
  });

  it('test_routed', () => {
    renderAt(`${ORDER_PATH}?package=premium`);

    expect(document.querySelector('main')).toHaveAttribute('data-route', 'order');
    expect(screen.queryByText(PLACEHOLDER_TEXT)).toBeNull();
    const nav = screen.getByRole('navigation', { name: NAV_NAME });
    expect(within(nav).getByRole('link', { name: 'Order' })).toHaveAttribute('aria-current', 'page');
    expect(checkedRadios()).toEqual(['premium']);
    expect(document.title).toBe("Order | Weddin'Vaders");
  });
});

describe('OrderPage (component): package preselection', () => {
  it.each(PACKAGE_RADIOS.slice(0, 3))('test_preselect: ?package=%s', (id) => {
    window.history.replaceState(null, '', `${ORDER_PATH}?package=${id}`);
    renderOpen();

    expect(checkedRadios()).toEqual([id]);
  });

  it.each([ORDER_PATH, `${ORDER_PATH}?package=gold`, `${ORDER_PATH}?package=Custom`])(
    'test_preselect_none: %s',
    (path) => {
      window.history.replaceState(null, '', path);
      renderOpen();

      expect(checkedRadios()).toEqual([]);
    },
  );

  it('test_preselect: the visitor can change the preselected package', () => {
    window.history.replaceState(null, '', `${ORDER_PATH}?package=basic`);
    renderOpen();

    fireEvent.click(radio('Premium'));

    expect(checkedRadios()).toEqual(['premium']);
  });
});

describe('OrderPage (component): address field', () => {
  it('test_slug_suggested', () => {
    renderOpen();

    type('brideName', 'Shelly');
    type('groomName', 'Dan');
    expect(field('slug')).toHaveValue('DanAndShelly');

    type('groomName', 'Daniel');
    expect(field('slug')).toHaveValue('DanielAndShelly');
  });

  it('test_slug_edit_stops_suggestion', () => {
    renderOpen();
    type('brideName', 'Shelly');
    type('groomName', 'Dan');

    type('slug', 'OurBigDay');
    type('brideName', 'Michelle');
    expect(field('slug')).toHaveValue('OurBigDay');

    type('slug', '');
    type('groomName', 'Daniel');
    expect(field('slug')).toHaveValue('DanielAndMichelle');
  });

  it('test_slug_no_suggestion_hint', () => {
    renderOpen();
    expect(screen.queryByTestId('order-slug-nosuggest')).toBeNull();

    type('brideName', 'שלי');
    expect(screen.queryByTestId('order-slug-nosuggest')).toBeNull();
    type('groomName', 'דן');

    expect(field('slug')).toHaveValue('');
    expect(screen.getByTestId('order-slug-nosuggest').textContent).toBe(order.fields.slug.noSuggestion);

    type('slug', 'DanAndShelly');
    expect(screen.queryByTestId('order-slug-nosuggest')).toBeNull();
  });

  it('test_slug_status_live: a free address shows its full URL', () => {
    renderOpen();
    expect(slugStatus()).toBeNull();

    type('slug', 'DanAndShelly');

    expect(slugStatus()).toHaveAttribute('data-status', 'available');
    expect(slugStatus().textContent).toBe('This address is free right now.');
    expect(slugPreview().textContent).toBe(`Your game would be at ${SITE_CONFIG.baseUrl}/DanAndShelly`);
    expect(slugPreview().textContent).toBe('Your game would be at https://weddinvaders.barvazone.com/DanAndShelly');
  });

  it.each([
    ['pricing', 'reserved', 'This address is used by the site itself. Please choose another.'],
    ['demowedding', 'taken', 'Another couple already has this address. Please choose another.'],
    ['a b', 'invalid', '3 to 40'],
  ])('test_slug_status_live: %j is %s', (value, status, text) => {
    renderOpen();

    type('slug', value);

    expect(slugStatus()).toHaveAttribute('data-status', status);
    expect(slugStatus().textContent).toContain(text);
    expect(slugStatus().textContent).not.toMatch(/[{}]/);
    expect(slugPreview()).toBeNull();
  });

  it('test_slug_status_live: an empty address shows nothing until it is checked', () => {
    renderOpen();
    type('slug', 'DanAndShelly');

    type('slug', '');

    expect(slugStatus()).toBeNull();
    expect(slugPreview()).toBeNull();
  });

  it('test_slug_status_live: surrounding spaces are ignored', () => {
    renderOpen();

    type('slug', ' DanAndShelly ');

    expect(slugStatus()).toHaveAttribute('data-status', 'available');
    expect(slugPreview().textContent).toContain(`${SITE_CONFIG.baseUrl}/DanAndShelly`);
  });

  it('test_slug_status_is_live_region', () => {
    renderOpen();
    type('slug', 'DanAndShelly');

    expect(slugStatus()).toHaveAttribute('role', 'status');
    expect(slugStatus()).toHaveAttribute('id', 'order-slug-status');
    expect(describedBy(field('slug'))).toEqual(expect.arrayContaining(['order-slug-hint', 'order-slug-status']));
    expect(document.getElementById('order-slug-error')).toBeNull();
  });
});

describe('OrderPage (component): validation', () => {
  it('test_blur_shows_error', () => {
    renderOpen();
    expect(errorOf('email')).toBeNull();
    expect(field('email')).not.toHaveAttribute('aria-invalid');

    fireEvent.blur(field('email'));

    expect(errorOf('email').textContent).toBe('Enter your email address.');
    expect(errorOf('email')).toHaveAttribute('data-error', 'required');
    expect(field('email')).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy(field('email'))).toContain('order-email-error');
    expect(describedBy(field('email'))).toContain('order-email-hint');

    expect(dataValues(document, 'data-error')).toEqual(['required']);
    expect(slugStatus()).toBeNull();
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(1);
  });

  it('test_error_clears_on_fix', () => {
    renderOpen();
    fireEvent.blur(field('email'));

    type('email', 'dan@');
    expect(errorOf('email').textContent).toBe('Enter an email address like name@example.com.');
    expect(errorOf('email')).toHaveAttribute('data-error', 'invalid');

    type('email', 'dan@example.org');
    expect(errorOf('email')).toBeNull();
    expect(field('email')).not.toHaveAttribute('aria-invalid');
    expect(describedBy(field('email'))).not.toContain('order-email-error');
  });

  it('test_blur_shows_error: an untouched field stays quiet while typing', () => {
    renderOpen();

    type('email', 'dan@');

    expect(errorOf('email')).toBeNull();
    expect(field('email')).not.toHaveAttribute('aria-invalid');
  });

  it('test_blur_shows_error: a past wedding date', () => {
    renderOpen();

    type('weddingDate', '2025-12-31');
    fireEvent.blur(field('weddingDate'));

    expect(errorOf('weddingDate').textContent).toBe('The wedding date must be today or later.');
    expect(errorOf('weddingDate')).toHaveAttribute('data-error', 'past');
  });

  it('test_submit_empty', () => {
    const { open } = renderOpen();

    fireEvent.click(submitButton());

    for (const [name, message] of Object.entries(REQUIRED_MESSAGES)) {
      expect(errorOf(name).textContent, name).toBe(message);
      expect(errorOf(name), name).toHaveAttribute('data-error', 'required');
    }
    expect(dataValues(document, 'data-error')).toHaveLength(5);
    expect(slugStatus()).toHaveAttribute('data-status', 'required');
    expect(slugStatus().textContent).toBe(SLUG_REQUIRED_MESSAGE);

    for (const name of ['brideName', 'groomName', 'weddingDate', 'slug', 'email']) {
      expect(field(name), name).toHaveAttribute('aria-invalid', 'true');
    }
    expect(packageGroup()).toHaveAttribute('aria-invalid', 'true');
    expect(describedBy(packageGroup())).toContain('order-package-error');
    expect(field('notes')).not.toHaveAttribute('aria-invalid');

    expect(document.activeElement).toBe(field('brideName'));
    expect(open).not.toHaveBeenCalled();
    expect(resultPanel()).toBeNull();
  });

  it('test_submit_focuses_first_invalid: a reserved address', () => {
    const { open } = renderOpen();
    fillValid({ slug: 'pricing' });

    fireEvent.click(submitButton());

    expect(document.activeElement).toBe(field('slug'));
    expect(field('slug')).toHaveAttribute('aria-invalid', 'true');
    expect(slugStatus()).toHaveAttribute('data-status', 'reserved');
    expect(open).not.toHaveBeenCalled();
    expect(resultPanel()).toBeNull();
  });

  it('test_submit_focuses_first_invalid: no package chosen', () => {
    const { open } = renderOpen();
    fillValid({ package: '' });

    fireEvent.click(submitButton());

    expect(document.activeElement).toBe(radio('Basic'));
    expect(packageGroup()).toHaveAttribute('aria-invalid', 'true');
    expect(errorOf('package').textContent).toBe(REQUIRED_MESSAGES.package);
    expect(open).not.toHaveBeenCalled();

    fireEvent.click(radio('Not sure yet'));
    expect(errorOf('package')).toBeNull();
    expect(packageGroup()).not.toHaveAttribute('aria-invalid');
  });
});

describe('OrderPage (component): sending the order', () => {
  it('test_submit_valid_opens_mailto', () => {
    window.history.replaceState(null, '', ORDER_PATH);
    const { open } = renderOpen();
    fillValid();

    fireEvent.click(submitButton());

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(ORDER_MAILTO_URL);
    expect(screen.getByTestId('order-mailto-link')).toHaveAttribute('href', ORDER_MAILTO_URL);
    expect(screen.getByTestId('order-mailto-link').textContent).toBe('Open my email app');
    expect(window.location.pathname).toBe(ORDER_PATH);
    expect(dataValues(document, 'data-section')).toEqual(['intro', 'form', 'result', 'faq']);
    expect(dataValues(document, 'data-error')).toEqual([]);
  });

  it('test_result_panel', () => {
    renderOpen();
    fillValid();

    fireEvent.click(submitButton());

    expect(screen.getByTestId('order-contact-address').textContent).toBe(ORDER_TO);
    expect(screen.getByTestId('order-subject').textContent).toBe(ORDER_SUBJECT);
    const message = screen.getByRole('textbox', { name: 'Order message' });
    expect(message).toBe(messageBox());
    expect(message).toHaveAttribute('readonly');
    expect(message).toHaveValue(ORDER_BODY);
    expect(screen.queryByTestId('order-notes-omitted')).toBeNull();

    const heading = within(resultPanel()).getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe(RESULT_HEADING);
    expect(document.activeElement).toBe(heading);
    expect(screen.getByTestId('order-copy-status').textContent).toBe('');
    expect(screen.getByTestId('order-copy-status')).toHaveAttribute('role', 'status');
  });

  it('test_submit_valid_opens_mailto: typed spaces are trimmed and add-ons keep the pricing order', () => {
    const { open } = renderOpen();
    fillValid({ brideName: '  Shelly ', slug: ' DanAndShelly ', email: ' dan@example.org ', addons: [] });
    fireEvent.click(checkbox('Printable QR code'));
    fireEvent.click(checkbox('Rush delivery'));

    fireEvent.click(submitButton());

    expect(open).toHaveBeenCalledWith(ORDER_MAILTO_URL);
    expect(messageBox()).toHaveValue(ORDER_BODY);
  });

  it('test_submit_valid_opens_mailto: "not sure yet" and no add-ons', () => {
    const { open } = renderOpen();
    fillValid({ package: 'unsure', addons: [], notes: '' });

    fireEvent.click(submitButton());

    expect(open).toHaveBeenCalledTimes(1);
    const lines = messageBox().value.split('\n');
    expect(lines).toContain('Package: Not sure yet');
    expect(lines).toContain('Add-ons: None');
    expect(lines.slice(-2)).toEqual(['Notes:', 'None']);
  });

  it('test_copy_ok', async () => {
    const writeText = vi.fn().mockResolvedValue();
    stubClipboard({ writeText });
    renderOpen();
    fillValid();
    fireEvent.click(submitButton());

    fireEvent.click(screen.getByRole('button', { name: COPY_NAME }));

    expect(await screen.findByText('Copied.')).toBe(screen.getByTestId('order-copy-status'));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(ORDER_BODY);
  });

  it.each([
    ['the clipboard refuses', () => ({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })],
    ['there is no clipboard', () => undefined],
  ])('test_copy_fallback: %s', async (_label, makeClipboard) => {
    stubClipboard(makeClipboard());
    renderOpen();
    fillValid();
    fireEvent.click(submitButton());

    fireEvent.click(screen.getByRole('button', { name: COPY_NAME }));

    expect(await screen.findByText(order.result.copyFailed)).toBe(screen.getByTestId('order-copy-status'));
    const message = messageBox();
    expect(message.selectionStart).toBe(0);
    expect(message.selectionEnd - message.selectionStart).toBe(ORDER_BODY.length);
  });

  it('test_notes_omitted_notice', () => {
    const { open } = renderOpen();
    fillValid({ notes: HEBREW_NOTES });

    fireEvent.click(submitButton());

    expect(screen.getByTestId('order-notes-omitted').textContent).toBe(order.result.notesOmitted);
    expect(screen.getByTestId('order-notes-omitted')).toHaveAttribute('role', 'note');
    expect(messageBox().value).toContain(HEBREW_NOTES);

    expect(open).toHaveBeenCalledTimes(1);
    const [url] = open.mock.calls[0];
    expect(url.length).toBeLessThanOrEqual(MAILTO_MAX_LENGTH);
    expect(decodeURIComponent(url)).toContain(order.message.notesOmitted);
    expect(decodeURIComponent(url)).not.toContain('א');
    expect(screen.getByTestId('order-mailto-link')).toHaveAttribute('href', url);
  });

  it('test_resubmit_updates', () => {
    const { open } = renderOpen();
    fillValid();
    fireEvent.click(submitButton());
    expect(messageBox().value).toContain('Package: Custom');

    fireEvent.click(radio('Premium'));
    fireEvent.click(submitButton());

    expect(open).toHaveBeenCalledTimes(2);
    expect(messageBox().value).toContain('Package: Premium');
    expect(messageBox().value).not.toContain('Package: Custom');
    expect(open.mock.calls[1][0]).toContain('Package%3A%20Premium');
    expect(screen.getByTestId('order-mailto-link')).toHaveAttribute('href', open.mock.calls[1][0]);
  });
});

describe('OrderPage (component): ordering closed', () => {
  it('test_closed_state', () => {
    const { open, container } = renderClosed();

    const notice = screen.getByRole('note');
    expect(notice).toBe(screen.getByTestId(CLOSED_NOTICE_ID));
    expect(notice).toHaveAttribute('id', CLOSED_NOTICE_ID);
    expect(notice).toHaveTextContent(CLOSED_TITLE);
    expect(notice).toHaveTextContent(order.closed.body);
    expect(notice.compareDocumentPosition(field('brideName')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(submitButton()).toBeDisabled();
    expect(describedBy(submitButton())).toEqual([CLOSED_NOTICE_ID]);

    fillValid();
    expect(slugStatus()).toHaveAttribute('data-status', 'available');

    fireEvent.submit(screen.getByRole('form', { name: 'Order form' }));

    expect(open).not.toHaveBeenCalled();
    expect(resultPanel()).toBeNull();
    expect(screen.queryByTestId('order-mailto-link')).toBeNull();
    expect(container.textContent).not.toContain(PLACEHOLDER_CONTACT_EMAIL);
    for (const link of container.querySelectorAll('[href]')) {
      expect(link.getAttribute('href')).not.toContain(PLACEHOLDER_CONTACT_EMAIL);
      expect(link.getAttribute('href')).not.toMatch(/^mailto:/);
    }
  });

  it('test_open_state_has_no_notice', () => {
    renderOpen();

    expect(screen.queryByTestId(CLOSED_NOTICE_ID)).toBeNull();
    expect(screen.queryByRole('note')).toBeNull();
    expect(submitButton()).toBeEnabled();
    expect(submitButton()).not.toHaveAttribute('aria-describedby');
  });

  it('test_default_follows_config', () => {
    render(<OrderPage route={ORDER_ROUTE} />);

    const expectedOpen = isOrderingOpen();
    expect(expectedOpen).toBe(SITE_CONFIG.contactEmail !== PLACEHOLDER_CONTACT_EMAIL);
    expect(screen.queryAllByTestId(CLOSED_NOTICE_ID)).toHaveLength(expectedOpen ? 0 : 1);
    if (expectedOpen) expect(submitButton()).toBeEnabled();
    else expect(submitButton()).toBeDisabled();
  });
});
