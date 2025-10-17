// Lightweight API connection helper
// Provides a base URL and small helpers for GET/POST requests.
export const BASE_URL = 'http://192.168.254.121/api/Beat';

type FetchOptions = RequestInit;

async function handleResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet(path: string, options: FetchOptions = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, { method: 'GET', ...options });
  if (!res.ok) {
    const body = await handleResponse(res);
    const err = new Error(`GET ${url} failed: ${res.status} ${res.statusText} - ${JSON.stringify(body)}`);
    // @ts-ignore
    err.status = res.status;
    throw err;
  }
  return handleResponse(res);
}

export async function apiPost(path: string, body: any, options: FetchOptions = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const respBody = await handleResponse(res);
    const err = new Error(`POST ${url} failed: ${res.status} ${res.statusText} - ${JSON.stringify(respBody)}`);
    // @ts-ignore
    err.status = res.status;
    throw err;
  }
  return handleResponse(res);
}

export default {
  BASE_URL,
  apiGet,
  apiPost,
};
