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

export async function getShowsIndex() {
  const data = await kv.get(KEYS.SHOWS_INDEX);
  return data ? JSON.parse(data) : null;
}

export async function setShowsIndex(shows) {
  await kv.set(KEYS.SHOWS_INDEX, JSON.stringify(shows));
}

export async function getShowsForYear(year) {
  const data = await kv.get(KEYS.SHOWS_YEAR(year));
  return data ? JSON.parse(data) : null;
}

export async function setShowsForYear(year, shows) {
  await kv.set(KEYS.SHOWS_YEAR(year), JSON.stringify(shows));
}

export async function getShow(date) {
  const data = await kv.get(KEYS.SHOW(date));
  return data ? JSON.parse(data) : null;
}

export async function setShow(date, showData) {
  await kv.set(KEYS.SHOW(date), JSON.stringify(showData));
}

export async function getSongsCatalog() {
  const data = await kv.get(KEYS.SONGS_CATALOG);
  return data ? JSON.parse(data) : null;
}

export async function setSongsCatalog(songs) {
  await kv.set(KEYS.SONGS_CATALOG, JSON.stringify(songs));
}

export async function getCacheStatus() {
  const [lastUpdated, seedingStatus, seedingProgress] = await Promise.all([
    kv.get(KEYS.CACHE_LAST_UPDATED),
    kv.get(KEYS.CACHE_SEEDING_STATUS),
    kv.get(KEYS.CACHE_SEEDING_PROGRESS),
  ]);
  return {
    lastUpdated: lastUpdated || null,
    seedingStatus: seedingStatus || 'idle',
    seedingProgress: seedingProgress ? JSON.parse(seedingProgress) : null,
  };
}

export async function setSeedingStatus(status, progress = null) {
  await kv.set(KEYS.CACHE_SEEDING_STATUS, status);
  if (progress !== null) {
    await kv.set(KEYS.CACHE_SEEDING_PROGRESS, JSON.stringify(progress));
  }
}

export async function setLastUpdated(timestamp) {
  await kv.set(KEYS.CACHE_LAST_UPDATED, timestamp);
}

export { kv };
