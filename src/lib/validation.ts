export function isValidPasswordLength(value: string): boolean {
  return value.length >= 4 && value.length <= 10;
}

export const KONAMI_UID_REGEX = /^[A-Z]{4}-\d{3}-\d{3}-\d{3}$/;

export function isValidKonamiUid(value: string): boolean {
  return KONAMI_UID_REGEX.test(value);
}

function hasHostname(value: string, hostnameSuffix: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === hostnameSuffix || url.hostname.endsWith(`.${hostnameSuffix}`);
  } catch {
    return false;
  }
}

export function isFacebookUrl(value: string): boolean {
  return hasHostname(value, "facebook.com");
}

export function isInstagramUrl(value: string): boolean {
  return hasHostname(value, "instagram.com");
}

export const PHONE_REGEX = /^\+\d{6,15}$/;

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}
