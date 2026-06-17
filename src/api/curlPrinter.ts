/**
 * Turns an axios request config into a copy-pasteable cURL command for
 * use in Postman / terminal / bug reports. Dev-only — never installed
 * in Release builds.
 */

import type {InternalAxiosRequestConfig} from 'axios';

function shellEscape(value: string): string {
  // Wrap in single quotes; escape embedded single quotes the bash way.
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildUrl(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL ?? '').replace(/\/+$/, '');
  const path = (config.url ?? '').replace(/^\/+/, '');
  let url = base && path ? `${base}/${path}` : base || path;

  // axios stringifies `params` when sending; do the same here so the curl
  // matches the actual request.
  if (config.params && typeof config.params === 'object') {
    const qs = Object.entries(config.params as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join('&');
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  return url;
}

export function toCurl(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? 'GET').toUpperCase();
  const url = buildUrl(config);

  const parts: string[] = [`curl -X ${method} ${shellEscape(url)}`];

  const hasBody =
    config.data !== undefined && config.data !== null && method !== 'GET';

  // Axios sets Content-Type for JSON bodies in a nested header bucket the
  // loop below skips. Emit it explicitly so Postman imports the body as
  // raw JSON instead of form-urlencoded.
  if (hasBody) {
    parts.push(`  -H ${shellEscape('Content-Type: application/json')}`);
  }

  // Headers — flatten axios's per-method header buckets into the actual
  // outgoing set.
  const rawHeaders = (config.headers ?? {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'object') continue; // skip the common/get/post buckets
    if (key.toLowerCase() === 'content-type') continue; // already added above
    parts.push(`  -H ${shellEscape(`${key}: ${String(value)}`)}`);
  }

  // Body — use --data-raw so curl doesn't interpret @-prefixed strings.
  if (hasBody) {
    const body =
      typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data);
    parts.push(`  --data-raw ${shellEscape(body)}`);
  }

  return parts.join(' \\\n');
}
