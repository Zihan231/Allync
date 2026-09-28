"use client";

import { useEffect } from "react";
import type { Locale } from "./translations";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBanglaDigits(text: string): string {
  return text.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toLatinDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

// Text inside these stays untouched: editable fields, code, and anything a
// component explicitly opts out with `data-latin-digits` (IDs, phone numbers…).
const SKIP_SELECTOR = "script, style, code, pre, textarea, input, [contenteditable='true'], [data-latin-digits]";

function convertTextNode(node: Text, convert: (text: string) => string) {
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP_SELECTOR)) return;
  const next = convert(node.data);
  // Only write when something changed, so our own mutation doesn't loop.
  if (next !== node.data) node.data = next;
}

function convertTree(root: Node, convert: (text: string) => string) {
  if (root.nodeType === Node.TEXT_NODE) {
    convertTextNode(root as Text, convert);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    convertTextNode(node as Text, convert);
  }
}

/**
 * Shows every rendered number with Bangla digits while the locale is "bn".
 *
 * Numbers are rendered all over the app (counts, prices, dates, scores), so
 * rather than wrapping each one, this rewrites digits in the DOM's text nodes
 * and watches for new/updated text. React only ever writes text nodes (it
 * never reads them back to diff), so rewriting their contents is safe.
 */
export function useLocaleDigits(locale: Locale) {
  useEffect(() => {
    const convert = locale === "bn" ? toBanglaDigits : toLatinDigits;
    convertTree(document.body, convert);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          convertTextNode(record.target as Text, convert);
        } else {
          record.addedNodes.forEach((node) => convertTree(node, convert));
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);
}
