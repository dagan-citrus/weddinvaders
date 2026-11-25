// Helpers for content modules: plain data in, plain data out.

const TEMPLATE_TOKEN = /\{(\w+)\}/g;

/**
 * Replaces every `{key}` in `template` whose key is an own property of
 * `values`; unknown tokens are left as written.
 *
 * @param {string} template
 * @param {Record<string, string|number>} values
 * @returns {string}
 */
export function fillTemplate(template, values) {
  return template.replace(TEMPLATE_TOKEN, (token, key) => (
    Object.hasOwn(values, key) ? String(values[key]) : token
  ));
}

/**
 * Freezes an object or array and everything nested in it.
 *
 * @template T
 * @param {T} value
 * @returns {T} The same reference.
 */
export function deepFreeze(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
