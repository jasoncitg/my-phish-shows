import { kv } from '@vercel/kv';

// KV key constants
export const KEYS = {
  SHOWS_INDEX: 'shows:index',
  SHOWS_YEAR: (year) => `shows:year:${year}`,
  SHOW: (date) => `show:${date}`,
  SONGS_CATALOG: 'songs:catalog',
  CACHE_LAST_UPDATED: 'cache:last_updated',
  CACHE_SEEDING_STATUS: 'cache:seeding_status',
  CACHE_SEEDING_PROGRESS: 'cache:seeding_progress',
};

// @vercel/kv automatically serializes/deserializes JSON — do NOT wrap with
// JSON.stringify/JSON.parse or you'll get double-encoding and [object Object] errors.

export async function getShowsIndex() {
  return (await kv.get(KEYS.SHOWS_INDEX)) ?? null;
}

export async function setShowsIndex(shows) {
  await kv.set(KEYS.SHOWS_INDEX, shows);
}

export async function getShowsForYear(year) {
  return (await kv.get(KEYS.SHOWS_YEAR(year))) ?? null;
}

export async function setShowsForYear(year, shows) {
  await kv.set(KEYS.SHOWS_YEAR(year), shows);
}

export async function getShow(date) {
  return (await kv.get(KEYS.SHOW(date))) ?? null;
}

export async function setShow(date, showData) {
  await kv.set(KEYS.SHOW(date), showData);
}

export async function getSongsCatalog() {
  return (await kv.get(KEYS.SONGS_CATALOG)) ?? null;
}

export async function setSongsCatalog(songs) {
  await kv.set(KEYS.SONGS_CATALOG, songs);
}

export async function getCacheStatus() {
  const [lastUpdated, seedingStatus, seedingProgress] = await Promise.all([
    kv.get(KEYS.CACHE_LAST_UPDATED),
    kv.get(KEYS.CACHE_SEEDING_STATUS),
    kv.get(KEYS.CACHE_SEEDING_PROGRESS),
  ]);
  return {
    lastUpdated: lastUpdated ?? null,
    seedingStatus: seedingStatus ?? 'idle',
    seedingProgress: seedingProgress ?? null,
  };
}

export async function setSeedingStatus(status, progress = null) {
  await kv.set(KEYS.CACHE_SEEDING_STATUS, status);
  if (progress !== null) {
    await kv.set(KEYS.CACHE_SEEDING_PROGRESS, progress);
  }
}

export async function setLastUpdated(timestamp) {
  await kv.set(KEYS.CACHE_LAST_UPDATED, timestamp);
}

export { kv };
