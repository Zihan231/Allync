import { COUNTRIES } from "@/lib/countries";

/**
 * Dialing info for the countries in `COUNTRIES` (same names, so the chosen
 * country can be saved on the profile as-is). `digits` is the allowed length of
 * the national number, without the country code or a leading trunk 0.
 */
export type PhoneCountry = {
  name: (typeof COUNTRIES)[number];
  iso2: string;
  dialCode: string;
  digits: [min: number, max: number];
  /** National number pattern, when the country's mobile format is well known. */
  pattern?: RegExp;
  example: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: "Bangladesh", iso2: "BD", dialCode: "880", digits: [10, 10], pattern: /^1[3-9]\d{8}$/, example: "1712345678" },
  { name: "India", iso2: "IN", dialCode: "91", digits: [10, 10], pattern: /^[6-9]\d{9}$/, example: "9876543210" },
  { name: "Pakistan", iso2: "PK", dialCode: "92", digits: [10, 10], example: "3012345678" },
  { name: "Sri Lanka", iso2: "LK", dialCode: "94", digits: [9, 9], example: "712345678" },
  { name: "Nepal", iso2: "NP", dialCode: "977", digits: [8, 10], example: "9841234567" },
  { name: "Bhutan", iso2: "BT", dialCode: "975", digits: [7, 8], example: "17123456" },
  { name: "Maldives", iso2: "MV", dialCode: "960", digits: [7, 7], example: "7712345" },
  { name: "United States", iso2: "US", dialCode: "1", digits: [10, 10], example: "2015550123" },
  { name: "United Kingdom", iso2: "GB", dialCode: "44", digits: [9, 10], example: "7400123456" },
  { name: "Canada", iso2: "CA", dialCode: "1", digits: [10, 10], example: "5062345678" },
  { name: "Australia", iso2: "AU", dialCode: "61", digits: [9, 9], example: "412345678" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "971", digits: [8, 9], example: "501234567" },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "966", digits: [9, 9], example: "512345678" },
  { name: "Qatar", iso2: "QA", dialCode: "974", digits: [8, 8], example: "33123456" },
  { name: "Malaysia", iso2: "MY", dialCode: "60", digits: [9, 10], example: "123456789" },
  { name: "Singapore", iso2: "SG", dialCode: "65", digits: [8, 8], example: "81234567" },
  { name: "Indonesia", iso2: "ID", dialCode: "62", digits: [9, 12], example: "812345678" },
  { name: "Japan", iso2: "JP", dialCode: "81", digits: [9, 10], example: "9012345678" },
  { name: "South Korea", iso2: "KR", dialCode: "82", digits: [9, 10], example: "1020000000" },
  { name: "China", iso2: "CN", dialCode: "86", digits: [11, 11], example: "13123456789" },
  { name: "Germany", iso2: "DE", dialCode: "49", digits: [10, 11], example: "15123456789" },
  { name: "France", iso2: "FR", dialCode: "33", digits: [9, 9], example: "612345678" },
  { name: "Italy", iso2: "IT", dialCode: "39", digits: [9, 10], example: "3123456789" },
  { name: "Spain", iso2: "ES", dialCode: "34", digits: [9, 9], example: "612345678" },
  { name: "Brazil", iso2: "BR", dialCode: "55", digits: [10, 11], example: "11961234567" },
  { name: "Argentina", iso2: "AR", dialCode: "54", digits: [10, 11], example: "91123456789" },
  { name: "Egypt", iso2: "EG", dialCode: "20", digits: [10, 10], example: "1001234567" },
  { name: "Nigeria", iso2: "NG", dialCode: "234", digits: [10, 10], example: "8021234567" },
  { name: "South Africa", iso2: "ZA", dialCode: "27", digits: [9, 9], example: "711234567" },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0]; // Bangladesh

/** 🇧🇩 from "BD". */
export const flagEmoji = (iso2: string) =>
  String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";
const toAsciiDigits = (value: string) => value.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));

/**
 * Reads what the user typed into the phone box. A number written with its
 * country code (`+91…` or `0091…`) switches the country; otherwise the digits
 * are the national number, minus a leading trunk 0 (e.g. BD `017…` → `17…`).
 * While a `+code` is still being typed and matches no country yet, `pending`
 * holds the raw text so the box can keep showing it.
 */
export function parsePhoneInput(
  raw: string,
  current: PhoneCountry,
): { country: PhoneCountry; national: string; pending?: string } {
  const value = toAsciiDigits(raw).trim();
  const international = value.startsWith("+") || value.startsWith("00");
  // "0091…" is the same as "+91…".
  const digits = value.replace(/\D/g, "").slice(value.startsWith("00") ? 2 : 0);

  if (international) {
    // No dial code in the list is a prefix of another, so the first match is the country.
    // +1 keeps US / Canada as already chosen.
    const match = PHONE_COUNTRIES.find((c) => digits.startsWith(c.dialCode));
    if (!match) return { country: current, national: "", pending: `+${digits}`.slice(0, 5) };
    const country = match.dialCode === current.dialCode ? current : match;
    return { country, national: stripTrunkZero(digits.slice(match.dialCode.length), country).slice(0, country.digits[1]) };
  }
  return { country: current, national: stripTrunkZero(digits, current).slice(0, current.digits[1]) };
}

// Italian numbers keep their leading 0; everywhere else it's the domestic trunk prefix.
const stripTrunkZero = (digits: string, country: PhoneCountry) =>
  country.iso2 === "IT" ? digits : digits.replace(/^0+/, "");

/** True when `national` is a plausible number for `country`. */
export function isValidNationalNumber(national: string, country: PhoneCountry): boolean {
  const [min, max] = country.digits;
  if (national.length < min || national.length > max) return false;
  return country.pattern ? country.pattern.test(national) : true;
}

/** E.164, e.g. "+8801712345678". */
export const toE164 = (national: string, country: PhoneCountry) => `+${country.dialCode}${national}`;
