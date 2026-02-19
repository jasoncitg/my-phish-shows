const BASE = '';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCacheStatus: () => apiFetch('/api/cache/status'),
  getYears: () => apiFetch('/api/years'),
  getShows: (year) => apiFetch(`/api/shows/${year}`),
  getSetlist: (showdate) => apiFetch(`/api/setlist/${showdate}`),
  getSongs: () => apiFetch('/api/songs'),
};
