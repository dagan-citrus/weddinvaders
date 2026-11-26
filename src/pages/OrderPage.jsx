import { useEffect, useRef, useState } from 'react';
import Link from '../Link';
import { ROUTE_ID } from '../routes';
import { SITE_CONFIG } from '../siteConfig';
import { order, pricing } from '../content';
import { fillTemplate } from '../content/format.js';
import {
  SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, SLUG_STATUS, buildEventUrl, eventRegistry,
} from '../events';
import {
  EMAIL_MAX_LENGTH, EMPTY_ORDER, FIELD_ORDER, NAME_MAX_LENGTH, NOTES_MAX_LENGTH,
  ORDER_ERROR, UNSURE_PACKAGE_ID,
  composeOrder, getInitialPackageId, isOrderingOpen, suggestSlug, toIsoDate, validateOrder,
} from './orderForm';
import './OrderPage.css';

const PRICING_PATH = `/${ROUTE_ID.PRICING}`;
const CLOSED_NOTICE_ID = 'order-closed-notice';
const SLUG_STATUS_ID = 'order-slug-status';
const MESSAGE_ROWS = 14;
const NOTES_ROWS = 5;
const COPY_STATE = Object.freeze({ IDLE: 'idle', COPIED: 'copied', FAILED: 'failed' });
const TIER_IDS = pricing.tiers.map((tier) => tier.id);
/** `{max}` in an error or hint text, per field. */
const MAX_LENGTHS = { brideName: NAME_MAX_LENGTH, groomName: NAME_MAX_LENGTH, notes: NOTES_MAX_LENGTH };

const fieldId = (field) => `order-${field}`;
const hintId = (field) => `order-${field}-hint`;
const errorId = (field) => `order-${field}-error`;
const openInMailApp = (url) => { window.location.href = url; };

/** Label, control, hint and messages of one field. The control comes in as `children`. */
function Field({ field, label, hint, errorText, errorCode, messages, children }) {
  return (
    <div className="order-field" data-field={field}>
      <label className="order-label" htmlFor={fieldId(field)}>{label}</label>
      {children}
      {hint && <p id={hintId(field)} className="order-hint">{hint}</p>}
      {messages}
      {errorText && (
        <p id={errorId(field)} className="order-error" data-error={errorCode}>{errorText}</p>
      )}
    </div>
  );
}

/**
 * The order form. It sends nothing itself: a valid submit composes a `mailto:`
 * to the contact address and shows the same message for copying by hand.
 * While no real contact address is configured the form is usable but cannot be sent.
 *
 * @param {Object} props
 * @param {import('../routes').RouteDef} props.route
 * @param {string} [props.contactEmail]  Where orders go; defaults to the site's.
 * @param {(mailtoUrl: string) => void} [props.openMailto]  Opens the visitor's mail app.
 */
export default function OrderPage({
  route,
  contactEmail = SITE_CONFIG.contactEmail,
  openMailto = openInMailApp,
}) {
  const { intro, closed, form, fields, faq } = order;
  const resultCopy = order.result;
  const open = isOrderingOpen(contactEmail);

  // The query is read once: afterwards the visitor's own choice wins.
  const [values, setValues] = useState(() => ({
    ...EMPTY_ORDER,
    addons: [],
    package: getInitialPackageId(window.location.search, TIER_IDS),
  }));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [result, setResult] = useState(null);
  const [copyState, setCopyState] = useState(COPY_STATE.IDLE);
  const formRef = useRef(null);
  const resultHeadingRef = useRef(null);
  const messageRef = useRef(null);

  // Each submit makes a new result object, so the panel is focused every time.
  useEffect(() => {
    if (result) resultHeadingRef.current?.focus();
  }, [result]);

  const today = toIsoDate();
  const errors = validateOrder(values, {
    today,
    getSlugStatus: eventRegistry.getSlugStatus,
    packageIds: TIER_IDS,
  });
  const shownError = (field) => (touched[field] || submitted ? errors[field] : undefined);
  const errorText = (field) => {
    const code = shownError(field);
    return code ? fillTemplate(order.errors[field][code], { max: MAX_LENGTHS[field] }) : null;
  };
  const describedBy = (field, hasHint) => (
    [hasHint && hintId(field), shownError(field) && errorId(field)].filter(Boolean).join(' ')
      || undefined
  );
  const invalid = (field) => (shownError(field) ? 'true' : undefined);
  const touch = (field) => setTouched((current) => ({ ...current, [field]: true }));
  const setValue = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const changeName = (field, value) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // The address follows the names until the visitor types one.
      return slugEdited ? next : { ...next, slug: suggestSlug(next.groomName, next.brideName) };
    });
  };
  const changeSlug = (value) => {
    setSlugEdited(value !== '');
    setValue('slug', value);
  };
  const toggleAddon = (addonId, checked) => {
    setValues((current) => ({
      ...current,
      addons: checked
        ? [...current.addons, addonId]
        : current.addons.filter((id) => id !== addonId),
    }));
  };

  const slug = values.slug.trim();
  const slugStatus = slug === '' ? null : eventRegistry.getSlugStatus(slug);
  const slugRequiredShown = slug === '' && shownError('slug') === ORDER_ERROR.REQUIRED;
  const noSuggestion = !slugEdited
    && values.brideName.trim() !== ''
    && values.groomName.trim() !== ''
    && suggestSlug(values.groomName, values.brideName) === '';

  const slugMessages = (
    <>
      {noSuggestion && (
        <p className="order-hint" data-testid="order-slug-nosuggest">
          {fields.slug.noSuggestion}
        </p>
      )}
      {(slugStatus || slugRequiredShown) && (
        <p
          id={SLUG_STATUS_ID}
          className="order-slug-status"
          role="status"
          data-testid={SLUG_STATUS_ID}
          data-status={slugStatus ?? ORDER_ERROR.REQUIRED}
        >
          {slugStatus
            ? fillTemplate(order.slugStatus[slugStatus], {
              min: SLUG_MIN_LENGTH, max: SLUG_MAX_LENGTH,
            })
            : order.errors.slug.required}
        </p>
      )}
      {slugStatus === SLUG_STATUS.AVAILABLE && (
        <p className="order-slug-preview" data-testid="order-slug-preview">
          {fillTemplate(fields.slug.preview, { url: buildEventUrl(slug) })}
        </p>
      )}
    </>
  );

  const focusFirstInvalid = (failing) => {
    const first = FIELD_ORDER.find((field) => failing[field]);
    const target = formRef.current.querySelector(`#${fieldId(first)}`);
    // The package fieldset is not focusable; its first radio is.
    (first === 'package' ? target.querySelector('input') : target).focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!open) return;
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      focusFirstInvalid(errors);
      return;
    }
    const tier = pricing.tiers.find((candidate) => candidate.id === values.package);
    const composed = composeOrder(values, {
      template: order.message,
      siteName: SITE_CONFIG.name,
      eventUrl: buildEventUrl(slug),
      packageName: tier ? tier.name : fields.package.unsure,
      addonNames: pricing.addons
        .filter((addon) => values.addons.includes(addon.id))
        .map((addon) => addon.name),
    }, contactEmail);
    setCopyState(COPY_STATE.IDLE);
    setResult(composed);
    openMailto(composed.mailtoUrl);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.body);
      setCopyState(COPY_STATE.COPIED);
    } catch {
      // No clipboard access: select the text so it can be copied by hand.
      messageRef.current.select();
      setCopyState(COPY_STATE.FAILED);
    }
  };

  const textInput = (field, props) => (
    <input
      id={fieldId(field)}
      name={field}
      className="order-input"
      value={values[field]}
      required
      aria-invalid={invalid(field)}
      onBlur={() => touch(field)}
      {...props}
    />
  );
  const packageOptions = [
    ...pricing.tiers.map((tier) => ({ id: tier.id, name: tier.name })),
    { id: UNSURE_PACKAGE_ID, name: fields.package.unsure },
  ];
  const copyStatusText = {
    [COPY_STATE.IDLE]: '',
    [COPY_STATE.COPIED]: resultCopy.copied,
    [COPY_STATE.FAILED]: resultCopy.copyFailed,
  }[copyState];

  return (
    <>
      <section className="site-section order-intro" data-section="intro">
        <div className="site-container">
          <h1>{route.title}</h1>
          <p className="order-headline">{intro.headline}</p>
          <p>{intro.body}</p>
          <p data-testid="order-privacy">{intro.privacy}</p>
        </div>
      </section>

      <section className="site-section order-form-section" data-section="form">
        <div className="site-container">
          {!open && (
            <p className="order-notice" role="note" id={CLOSED_NOTICE_ID} data-testid={CLOSED_NOTICE_ID}>
              <strong>{closed.title}</strong> {closed.body}
            </p>
          )}
          <form
            ref={formRef}
            className="order-form"
            noValidate
            aria-label={form.ariaLabel}
            onSubmit={handleSubmit}
          >
            <p className="order-required-note">{form.requiredNote}</p>

            {['brideName', 'groomName'].map((field) => (
              <Field
                key={field}
                field={field}
                label={fields[field].label}
                errorText={errorText(field)}
                errorCode={shownError(field)}
              >
                {textInput(field, {
                  type: 'text',
                  maxLength: NAME_MAX_LENGTH,
                  autoComplete: 'off',
                  'aria-describedby': describedBy(field, false),
                  onChange: (event) => changeName(field, event.target.value),
                })}
              </Field>
            ))}

            <Field
              field="weddingDate"
              label={fields.weddingDate.label}
              errorText={errorText('weddingDate')}
              errorCode={shownError('weddingDate')}
            >
              {textInput('weddingDate', {
                type: 'date',
                min: today,
                'aria-describedby': describedBy('weddingDate', false),
                onChange: (event) => setValue('weddingDate', event.target.value),
              })}
            </Field>

            {/* The address has one live status line instead of an error paragraph. */}
            <Field
              field="slug"
              label={fields.slug.label}
              hint={fields.slug.hint}
              messages={slugMessages}
            >
              {textInput('slug', {
                type: 'text',
                maxLength: SLUG_MAX_LENGTH,
                autoCapitalize: 'none',
                autoComplete: 'off',
                spellCheck: false,
                'aria-describedby': `${hintId('slug')} ${SLUG_STATUS_ID}`,
                onChange: (event) => changeSlug(event.target.value),
              })}
            </Field>

            <fieldset
              id={fieldId('package')}
              className="order-group"
              data-field="package"
              role="radiogroup"
              aria-required="true"
              aria-labelledby="order-package-legend"
              aria-invalid={invalid('package')}
              aria-describedby={describedBy('package', false)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) touch('package');
              }}
            >
              <legend id="order-package-legend" className="order-label">{fields.package.label}</legend>
              {packageOptions.map((option) => (
                <label key={option.id} className="order-choice">
                  <input
                    type="radio"
                    name="package"
                    value={option.id}
                    checked={values.package === option.id}
                    onChange={() => setValue('package', option.id)}
                  />
                  {option.name}
                </label>
              ))}
              <p className="order-hint">
                <Link to={PRICING_PATH}>{fields.package.compare}</Link>
              </p>
              {errorText('package') && (
                <p id={errorId('package')} className="order-error" data-error={shownError('package')}>
                  {errorText('package')}
                </p>
              )}
            </fieldset>

            <fieldset id={fieldId('addons')} className="order-group" data-field="addons">
              <legend className="order-label">{fields.addons.label}</legend>
              {pricing.addons.map((addon) => (
                <label key={addon.id} className="order-choice">
                  <input
                    type="checkbox"
                    name="addons"
                    value={addon.id}
                    checked={values.addons.includes(addon.id)}
                    onChange={(event) => toggleAddon(addon.id, event.target.checked)}
                  />
                  {addon.name}
                </label>
              ))}
            </fieldset>

            <Field
              field="email"
              label={fields.email.label}
              hint={fields.email.hint}
              errorText={errorText('email')}
              errorCode={shownError('email')}
            >
              {textInput('email', {
                type: 'email',
                maxLength: EMAIL_MAX_LENGTH,
                autoComplete: 'email',
                'aria-describedby': describedBy('email', true),
                onChange: (event) => setValue('email', event.target.value),
              })}
            </Field>

            <Field
              field="notes"
              label={fields.notes.label}
              hint={fillTemplate(fields.notes.hint, { max: NOTES_MAX_LENGTH })}
              errorText={errorText('notes')}
              errorCode={shownError('notes')}
            >
              <textarea
                id={fieldId('notes')}
                name="notes"
                className="order-input"
                rows={NOTES_ROWS}
                maxLength={NOTES_MAX_LENGTH}
                value={values.notes}
                aria-invalid={invalid('notes')}
                aria-describedby={describedBy('notes', true)}
                onBlur={() => touch('notes')}
                onChange={(event) => setValue('notes', event.target.value)}
              />
            </Field>

            <p className="order-hint" data-testid="order-photos-note">{form.photosNote}</p>
            <button
              type="submit"
              className="site-btn site-btn-primary order-submit"
              disabled={!open}
              aria-describedby={open ? undefined : CLOSED_NOTICE_ID}
            >
              {form.submit}
            </button>
          </form>
        </div>
      </section>

      {result && (
        <section className="site-section order-result" data-section="result" data-testid="order-result">
          <div className="site-container">
            <h2 tabIndex={-1} ref={resultHeadingRef}>{resultCopy.heading}</h2>
            <p>{resultCopy.body}</p>
            {result.notesOmitted && (
              <p className="order-notice" role="note" data-testid="order-notes-omitted">
                {resultCopy.notesOmitted}
              </p>
            )}
            <a
              className="site-btn site-btn-primary"
              data-testid="order-mailto-link"
              href={result.mailtoUrl}
            >
              {resultCopy.openLink}
            </a>
            <p className="order-result-line">
              {resultCopy.toLabel} <span data-testid="order-contact-address">{contactEmail}</span>
            </p>
            <p className="order-result-line">
              {resultCopy.subjectLabel} <span data-testid="order-subject">{result.subject}</span>
            </p>
            <textarea
              ref={messageRef}
              readOnly
              rows={MESSAGE_ROWS}
              className="order-message"
              data-testid="order-message"
              aria-label={resultCopy.messageLabel}
              value={result.body}
            />
            <button type="button" className="site-btn site-btn-secondary order-copy" onClick={handleCopy}>
              {resultCopy.copy}
            </button>
            <p className="order-copy-status" role="status" data-testid="order-copy-status">
              {copyStatusText}
            </p>
          </div>
        </section>
      )}

      <section className="site-section order-faq" data-section="faq">
        <div className="site-container">
          <h2>{faq.heading}</h2>
          {faq.items.map((item) => (
            <article key={item.id} className="order-faq-item" data-faq={item.id}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
              {item.link && <Link to={`/${item.link.routeId}`}>{item.link.label}</Link>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
