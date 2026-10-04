import type { DomainViolation } from '../../shared/DomainViolation';
import { violation } from '../../shared/DomainViolation';
import type { Result } from '../../shared/Result';
import { err, ok } from '../../shared/Result';
import type { WhatwgUrl } from '../../shared/whatwgUrl';
import { parseUrl } from '../../shared/whatwgUrl';

const MAX_URL_LENGTH = 2048;
const TRACKING_PARAMETERS = new Set(['gclid', 'fbclid', 'msclkid', 'xtor', 'mc_cid', 'mc_eid']);
const isTrackingParameter = (name: string): boolean =>
  name.toLowerCase().startsWith('utm_') || TRACKING_PARAMETERS.has(name.toLowerCase());

/**
 * URL d'annonce sous forme canonique, utilisée pour le niveau 2 de déduplication.
 *
 * Règles : http(s) uniquement, sans identifiants, schéma forcé en https, hôte en minuscules,
 * port par défaut et fragment supprimés, paramètres de tracking retirés, paramètres restants
 * triés, slash final supprimé (hors racine).
 */
export class CanonicalUrl {
  private constructor(readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<CanonicalUrl, DomainViolation> {
    const input = raw.trim();
    if (input.length > MAX_URL_LENGTH) {
      return err(violation('URL_TOO_LONG', `URL exceeds ${MAX_URL_LENGTH} characters.`, 'url'));
    }

    let url: WhatwgUrl;
    try {
      url = parseUrl(input);
    } catch {
      return err(violation('URL_INVALID', 'URL is not valid.', 'url'));
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return err(violation('URL_UNSUPPORTED_PROTOCOL', 'Only http(s) URLs are accepted.', 'url'));
    }
    if (url.username !== '' || url.password !== '') {
      return err(violation('URL_CONTAINS_CREDENTIALS', 'URL must not contain credentials.', 'url'));
    }

    url.protocol = 'https:';
    if (url.port === '80' || url.port === '443') {
      url.port = '';
    }
    url.hash = '';
    for (const name of [...url.searchParams.keys()]) {
      if (isTrackingParameter(name)) {
        url.searchParams.delete(name);
      }
    }
    url.searchParams.sort();
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }

    return ok(new CanonicalUrl(url.toString()));
  }

  equals(other: CanonicalUrl): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
