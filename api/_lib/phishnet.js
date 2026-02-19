const PHISH_NET_BASE = 'https://api.phish.net/v5';
const API_KEY = process.env.PHISH_NET_API_KEY || '84D2574B2E94EFAF3EBE';

async function apiFetch(path) {
  const url = `${PHISH_NET_BASE}${path}${path.includes('?') ? '&' : '?'}apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Phish.net API error: ${res.status} ${res.statusText} for ${path}`);
  }
  const json = await res.json();
  if (json.error_message) {
    throw new Error(`Phish.net API error: ${json.error_message}`);
  }
  return json;
}

// Delay helper for rate limiting
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all shows from Phish.net.
 * Returns array of { showdate, venue, city, state, country }
 */
export async function fetchAllShows() {
  const json = await apiFetch('/shows.json');
  const shows = json.data || [];
  return shows.map((s) => ({
    showdate: s.showdate,
    showid: s.showid,
    venue: s.venue,
    city: s.city,
    state: s.state,
    country: s.country,
  }));
}

/**
 * Fetch shows newer than a given date.
 */
export async function fetchShowsSince(sinceDate) {
  const all = await fetchAllShows();
  return all.filter((s) => s.showdate > sinceDate);
}

/**
 * Fetch the setlist for a specific show date (YYYY-MM-DD).
 * Returns { venue, city, state, sets: { 'Set 1': [...songs], 'Set 2': [...], 'Encore': [...] } }
 */
export async function fetchSetlist(showdate) {
  const json = await apiFetch(`/setlists/showdate/${showdate}.json`);
  const items = json.data || [];
  if (items.length === 0) return null;

  const first = items[0];
  const sets = {};
  const setOrder = [];

  for (const item of items) {
    const setLabel = formatSetLabel(item.set);
    if (!sets[setLabel]) {
      sets[setLabel] = [];
      setOrder.push(setLabel);
    }
    sets[setLabel].push({
      song: item.song || item.title || '',
      is_jam: item.is_jam === '1' || item.is_jam === 1,
      footnote: item.footnote || '',
      transition: item.trans_mark || '',
    });
  }

  return {
    venue: first.venue,
    city: first.city,
    state: first.state,
    country: first.country,
    sets,
    setOrder,
  };
}

function formatSetLabel(set) {
  const map = {
    '1': 'Set 1',
    '2': 'Set 2',
    '3': 'Set 3',
    '4': 'Set 4',
    e: 'Encore',
    e2: 'Encore 2',
    e3: 'Encore 3',
  };
  return map[String(set).toLowerCase()] || `Set ${set}`;
}

/**
 * Fetch full songs catalog with career play counts.
 */
export async function fetchSongs() {
  const json = await apiFetch('/songs.json');
  const songs = json.data || [];
  return songs.map((s) => ({
    song: s.song,
    slug: s.slug,
    times_played: parseInt(s.times_played || s.debut || 0, 10),
    debut: s.debut || null,
    last_played: s.last_played || null,
  }));
}
