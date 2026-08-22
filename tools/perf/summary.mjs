/** Rezumat tabelar al rapoartelor Lighthouse din reports/lighthouse/. */
import fs from 'node:fs';
const dir = 'reports/lighthouse';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.report.json')).sort();
const ms = (v) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);
const rows = files.map((f) => {
  const d = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
  const c = d.categories, a = d.audits;
  const s = (k) => (c[k]?.score == null ? '—' : Math.round(c[k].score * 100));
  return {
    raport: f.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.report.json', ''),
    perf: s('performance'), a11y: s('accessibility'), bp: s('best-practices'), seo: s('seo'),
    LCP: ms(a['largest-contentful-paint']?.numericValue),
    CLS: a['cumulative-layout-shift']?.numericValue?.toFixed(3) ?? '—',
    TBT: ms(a['total-blocking-time']?.numericValue),
    TTFB: ms(a['server-response-time']?.numericValue),
    JS: a['total-byte-weight'] ? `${Math.round((a['network-requests']?.details?.items ?? []).filter((i) => i.resourceType === 'Script').reduce((x, i) => x + (i.transferSize ?? 0), 0) / 1024)} KB` : '—',
  };
});
const cols = Object.keys(rows[0] ?? {});
const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
const line = (cells) => '| ' + cells.map((v, i) => String(v).padEnd(w[i])).join(' | ') + ' |';
console.log(line(cols));
console.log('|' + w.map((n) => '-'.repeat(n + 2)).join('|') + '|');
for (const r of rows) console.log(line(cols.map((c) => r[c])));
