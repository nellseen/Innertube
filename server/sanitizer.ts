/**
 * Backend deep sanitizer to prevent any Innertube Text instance, Run, or { rtl: ... }
 * objects from leaking in API responses as non-string objects.
 */
export function deepSanitizeResponse(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data;

  if (Array.isArray(data)) {
    return data.map(deepSanitizeResponse);
  }

  if (typeof data === 'object') {
    // Check if this object is an Innertube Text / Run / RTL object
    const isTextObject =
      ('rtl' in data && !('id' in data || 'videoId' in data || 'url' in data)) ||
      (Array.isArray(data.runs) && !('items' in data || 'songs' in data || 'tracks' in data));

    if (isTextObject) {
      if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
      if (typeof data.simpleText === 'string' && data.simpleText.trim()) return data.simpleText.trim();
      if (Array.isArray(data.runs)) {
        const text = data.runs.map((r: any) => (typeof r === 'string' ? r : r?.text || '')).join('').trim();
        return text;
      }
      if (typeof data.name === 'string' && data.name.trim()) return data.name.trim();
      if (typeof data.title === 'string' && data.title.trim()) return data.title.trim();
      return '';
    }

    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      clean[key] = deepSanitizeResponse(val);
    }
    return clean;
  }

  return data;
}
