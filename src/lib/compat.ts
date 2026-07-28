/**
 * `compat` — browser / runtime feature detection.
 *
 * 由 foundation-contract 任务提供: every detector is SSR-safe (returns
 * `false` on the server) and pure (no global mutation). Use these to
 * gate progressive enhancement paths:
 *
 *  - `isElectron()` — running inside the desktop wrapper?
 *  - `isPWA()`      — installed as a standalone PWA?
 *  - `isMobile()`   — coarse mobile UA check
 *  - `isSafari/Firefox/Chrome()` — UA sniff; only use for true bugs
 *    that affect one engine.
 *  - `supportsBackdropFilter/...` — feature checks; prefer these over
 *    UA-sniff whenever possible.
 *
 * All functions read from `navigator` / `window` defensively.
 */

const hasWindow = typeof window !== "undefined";
const hasNavigator = typeof navigator !== "undefined";

function userAgent(): string {
  if (!hasNavigator) return "";
  return navigator.userAgent || "";
}

/* ------------------------------------------------------------------ *
 *  Browser sniff
 * ------------------------------------------------------------------ */

const _ua = hasWindow ? userAgent() : "";

const _isSafari =
  hasWindow &&
  /Safari/.test(_ua) &&
  !/Chrome|CriOS|Chromium|Android/.test(_ua) &&
  /Apple/.test(navigator.vendor || "");

const _isFirefox = hasWindow && /Firefox|FxiOS/.test(_ua);

const _isChrome =
  hasWindow &&
  (/Chrome/.test(_ua) || /CriOS/.test(_ua) || /Edg/.test(_ua)) &&
  !/Firefox/.test(_ua);

const _isElectron =
  hasWindow &&
  // Older Electron exposes a `process.versions.electron` global;
  // newer versions also set the UA. Either is sufficient.
  (typeof (globalThis as { process?: { versions?: { electron?: string } } }).process !==
    "undefined" &&
    Boolean(
      (globalThis as { process?: { versions?: { electron?: string } } }).process?.versions
        ?.electron,
    )) ||
  /Electron/.test(_ua);

const _isMobile =
  hasWindow &&
  (/Mobi|Android|iPhone|iPad|iPod/.test(_ua) ||
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches));

const _isPWA =
  hasWindow &&
  (Boolean((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)) ||
    Boolean(
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
    ) ||
    document.referrer.includes("android-app://"));

export function isSafari(): boolean {
  return _isSafari;
}

export function isFirefox(): boolean {
  return _isFirefox;
}

export function isChrome(): boolean {
  return _isChrome;
}

export function isElectron(): boolean {
  return _isElectron;
}

export function isMobile(): boolean {
  return _isMobile;
}

export function isPWA(): boolean {
  return _isPWA;
}

/* ------------------------------------------------------------------ *
 *  Feature detection
 * ------------------------------------------------------------------ */

export function supportsBackdropFilter(): boolean {
  if (!hasWindow) return false;
  // The unprefixed prop is the canonical one. The `-webkit-` prefix
  // is still needed for older Safari (15 and below) — we accept both.
  const test = (prop: string): boolean => {
    const style = (document.createElement("div") as HTMLDivElement).style as unknown as Record<
      string,
      string
    >;
    return prop in style && style[prop] !== "";
  };
  return test("backdropFilter") || test("WebkitBackdropFilter");
}

export function supportsCSSGrid(): boolean {
  if (!hasWindow) return false;
  return typeof document !== "undefined" && document.documentElement
    ? Boolean((window as Window & { CSS?: { supports?: (k: string, v: string) => boolean } }).CSS
        ?.supports?.("display", "grid"))
    : false;
}

export function supportsIntl(): boolean {
  if (!hasWindow) return false;
  return typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function";
}
