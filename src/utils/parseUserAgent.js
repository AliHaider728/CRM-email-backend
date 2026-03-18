// ─────────────────────────────────────────────────────────────────────────────
// utils/parseUserAgent.js
// Lightweight UA parsing — no heavy dependency required.
// Returns { device, os, browser } strings for engagement records.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} ua – raw User-Agent string
 * @returns {{ device: 'mobile'|'desktop'|'tablet'|'unknown', os: string, browser: string }}
 */
export function parseUserAgent(ua = '') {
  const s = ua.toLowerCase();

  // ── Device ────────────────────────────────────────────────────────────────
  let device = 'desktop';
  if (/ipad|tablet|kindle|playbook/i.test(s))            device = 'tablet';
  else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(s)) device = 'mobile';

  // ── OS ────────────────────────────────────────────────────────────────────
  let os = 'Unknown';
  if (/windows nt 10|windows 10/i.test(s))  os = 'Windows 10';
  else if (/windows nt 11|windows 11/i.test(s)) os = 'Windows 11';
  else if (/windows/i.test(s))              os = 'Windows';
  else if (/iphone os (\d+)/i.test(s))      os = `iOS ${ua.match(/iphone os (\d+)/i)?.[1] || ''}`;
  else if (/ipad.*os (\d+)/i.test(s))       os = `iPadOS ${ua.match(/os (\d+)/i)?.[1] || ''}`;
  else if (/android (\d+)/i.test(s))        os = `Android ${ua.match(/android (\d+)/i)?.[1] || ''}`;
  else if (/mac os x/i.test(s))             os = 'macOS';
  else if (/linux/i.test(s))                os = 'Linux';

  // ── Browser ───────────────────────────────────────────────────────────────
  let browser = 'Unknown';
  if (/edg\//i.test(s))          browser = 'Edge';
  else if (/opr\//i.test(s))     browser = 'Opera';
  else if (/chrome\//i.test(s))  browser = 'Chrome';
  else if (/firefox\//i.test(s)) browser = 'Firefox';
  else if (/safari\//i.test(s))  browser = 'Safari';
  else if (/msie|trident/i.test(s)) browser = 'Internet Explorer';

  return { device, os, browser };
}