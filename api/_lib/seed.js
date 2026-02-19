import { fetchAllShows, fetchSongs, fetchSetlist, delay } from './phishnet.js';
import {
  getShowsIndex,
  setShowsIndex,
  setShowsForYear,
  setSongsCatalog,
  setSeedingStatus,
  setLastUpdated,
  setShow,
  getShow,
} from './kv.js';

/**
 * Seeds the shows index and songs catalog from Phish.net.
 * This is the "fast" seed — just the index and songs, no setlists.
 * Setlists are seeded lazily per show on demand.
 */
export async function seedIndex() {
  await setSeedingStatus('seeding_index', { step: 'shows', done: 0, total: 0 });

  // Fetch all shows
  const shows = await fetchAllShows();
  await setSeedingStatus('seeding_index', { step: 'shows', done: shows.length, total: shows.length });

  // Organize by year
  const byYear = {};
  for (const show of shows) {
    const year = show.showdate.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(show);
  }

  // Store sorted index (most recent first for display)
  const sortedShows = [...shows].sort((a, b) => a.showdate.localeCompare(b.showdate));
  await setShowsIndex(sortedShows);

  // Store per-year lists
  for (const [year, yearShows] of Object.entries(byYear)) {
    const sorted = yearShows.sort((a, b) => a.showdate.localeCompare(b.showdate));
    await setShowsForYear(year, sorted);
  }

  await setSeedingStatus('seeding_songs', { step: 'songs', done: 0, total: 1 });

  // Fetch songs catalog
  const songs = await fetchSongs();
  await setSongsCatalog(songs);

  const now = new Date().toISOString();
  await setLastUpdated(now);
  await setSeedingStatus('complete', { step: 'complete', done: 1, total: 1 });

  return { shows: shows.length, songs: songs.length };
}

/**
 * Incremental sync: fetch only shows newer than lastUpdated.
 * Updates the index and year caches.
 */
export async function incrementalSync(lastUpdated) {
  const sinceDate = lastUpdated.slice(0, 10); // YYYY-MM-DD

  const allShows = await fetchAllShows();
  const newShows = allShows.filter((s) => s.showdate > sinceDate);

  if (newShows.length === 0) {
    await setLastUpdated(new Date().toISOString());
    return { newShows: 0 };
  }

  // Re-build the full index (we have all shows anyway)
  const sorted = [...allShows].sort((a, b) => a.showdate.localeCompare(b.showdate));
  await setShowsIndex(sorted);

  // Update affected years
  const byYear = {};
  for (const show of allShows) {
    const year = show.showdate.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(show);
  }

  const affectedYears = [...new Set(newShows.map((s) => s.showdate.slice(0, 4)))];
  for (const year of affectedYears) {
    if (byYear[year]) {
      await setShowsForYear(year, byYear[year].sort((a, b) => a.showdate.localeCompare(b.showdate)));
    }
  }

  // Refresh songs catalog
  const songs = await fetchSongs();
  await setSongsCatalog(songs);

  await setLastUpdated(new Date().toISOString());
  return { newShows: newShows.length };
}

/**
 * Fetch and cache a setlist for a specific date if not already cached.
 */
export async function ensureSetlist(showdate) {
  const cached = await getShow(showdate);
  if (cached) return cached;

  const setlistData = await fetchSetlist(showdate);
  if (!setlistData) return null;

  await setShow(showdate, setlistData);
  return setlistData;
}
