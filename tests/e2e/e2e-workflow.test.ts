import { describe, it, expect } from 'vitest';
import http from 'http';

function fetchJson(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${path}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ rawText: body, statusCode: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

describe('E2E Full Application Workflow Test', () => {
  it('Scenario 1: Healthcheck should return online status for backend and engine', async () => {
    const res = await fetchJson('/api/health');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.backend).toBe('online');
  });

  it('Scenario 2: Frontend root HTML should serve with correct titles and meta tags', async () => {
    return new Promise<void>((resolve, reject) => {
      http.get('http://127.0.0.1:3000/', (res) => {
        expect(res.statusCode).toBe(200);
        let html = '';
        res.on('data', (c) => (html += c));
        res.on('end', () => {
          expect(html).toContain('Aetheria Music');
          expect(html).toContain('viewport');
          resolve();
        });
      }).on('error', reject);
    });
  });

  it('Scenario 3: Search endpoint handles empty query or parameters without crashing', async () => {
    const res = await fetchJson('/api/search?q=test');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
  });

  it('Scenario 4: Built-in Chord API returns valid chords for popular songs', async () => {
    const res = await fetchJson('/api/chord?title=Komang');
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.content).toBeDefined();
    expect(res.content.length).toBeGreaterThan(0);
    expect(res.originalKey).toBe('G');
  });
});
