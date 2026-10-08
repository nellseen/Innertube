/**
 * Safe text extraction and conversion utility for React rendering.
 * Guarantees that whatever is passed (string, Innertube Text instance, Run, object with rtl, null, undefined)
 * is cleanly converted into a string and NEVER returned as a raw object to React.
 */
export function toSafeText(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return fallback;

  if (typeof val === 'object') {
    // If it has runs array (YouTube Text / Runs format)
    if (Array.isArray(val.runs)) {
      const combined = val.runs
        .map((r: any) => (typeof r === 'string' ? r : r?.text || ''))
        .join('')
        .trim();
      if (combined) return combined;
    }

    // If it has .text
    if (typeof val.text === 'string' && val.text.trim()) {
      return val.text.trim();
    }
    if (val.text && typeof val.text === 'object') {
      const nested = toSafeText(val.text);
      if (nested) return nested;
    }

    // If it has .simpleText
    if (typeof val.simpleText === 'string' && val.simpleText.trim()) {
      return val.simpleText.trim();
    }

    // If it has .name
    if (typeof val.name === 'string' && val.name.trim()) {
      return val.name.trim();
    }

    // If it has .title
    if (typeof val.title === 'string' && val.title.trim()) {
      return val.title.trim();
    }

    // If it has custom .toString() that is not default Object.prototype.toString
    if (typeof val.toString === 'function') {
      try {
        const str = val.toString();
        if (typeof str === 'string' && str !== '[object Object]' && str.trim()) {
          return str.trim();
        }
      } catch {
        // ignore
      }
    }

    return fallback;
  }

  return fallback;
}
