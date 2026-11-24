import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACEHOLDER_CONTACT_EMAIL, SITE_CONFIG, buildSiteUrl } from './siteConfig';

// `new URL()` is jsdom's in this environment, which `fileURLToPath` rejects; pass the string.
const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const SITE_CONFIG_FILE = 'siteConfig.js';
const HOSTNAME_MARKER = 'barvazone';
const SOURCE_FILE = /\.jsx?$/;
const TEST_FILE = /\.test\./;
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Every non-test source file under `src/`, as paths relative to `src/`. */
function listSourceFiles(dir = SRC_DIR) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    if (!SOURCE_FILE.test(entry.name) || TEST_FILE.test(entry.name)) return [];
    return [relative(SRC_DIR, full)];
  });
}

describe('SITE_CONFIG', () => {
  it('test_site_config_base_url', () => {
    expect(SITE_CONFIG.baseUrl).toBe('https://weddinvaders.barvazone.com');
    expect(new URL(SITE_CONFIG.baseUrl).host).toBe('weddinvaders.barvazone.com');
  });

  it('test_site_config_base_url_no_trailing_slash', () => {
    expect(SITE_CONFIG.baseUrl.endsWith('/')).toBe(false);
  });

  it('test_site_config_name', () => {
    expect(SITE_CONFIG.name).toBe("Weddin'Vaders");
  });

  it('test_site_config_contact_email', () => {
    expect(SITE_CONFIG.contactEmail).toMatch(EMAIL_SHAPE);
  });

  it('test_placeholder_email_is_example_domain', () => {
    expect(PLACEHOLDER_CONTACT_EMAIL).toBe('contact@example.com');
  });

  it('test_site_config_frozen', () => {
    expect(Object.isFrozen(SITE_CONFIG)).toBe(true);
  });

  it('test_hostname_only_in_site_config', () => {
    const files = listSourceFiles();
    // Guard against a vacuous pass: the scan must really see the source tree.
    expect(files).toContain(SITE_CONFIG_FILE);
    expect(files).toContain('renderer.js');

    const offenders = files
      .filter((file) => file !== SITE_CONFIG_FILE)
      .filter((file) => readFileSync(join(SRC_DIR, file), 'utf8').includes(HOSTNAME_MARKER));

    expect(offenders).toEqual([]);
  });
});

describe('buildSiteUrl', () => {
  it('test_build_site_url_root', () => {
    expect(buildSiteUrl()).toBe('https://weddinvaders.barvazone.com/');
  });

  it('test_build_site_url_path', () => {
    expect(buildSiteUrl('pricing')).toBe('https://weddinvaders.barvazone.com/pricing');
  });

  it('test_build_site_url_leading_slash', () => {
    expect(buildSiteUrl('/pricing')).toBe('https://weddinvaders.barvazone.com/pricing');
  });

  it('test_build_site_url_custom_base', () => {
    expect(buildSiteUrl('/x', 'https://example.org/')).toBe('https://example.org/x');
  });

  it('test_build_site_url_nested', () => {
    expect(buildSiteUrl('a/b', 'https://example.org')).toBe('https://example.org/a/b');
  });
});
