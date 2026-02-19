import { getShowsForYear, getShowsIndex, setShowsForYear } from '../_lib/kv.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}

export default async function handler(req) {
  // Extract dynamic segment from URL path: /api/shows/[year]
  const year = new URL(req.url).pathname.split('/').pop();

  if (!year || !/^\d{4}$/.test(year)) {
    return json({ error: 'Invalid year parameter' }, 400);
  }

  try {
    let shows = await getShowsForYear(year);

    // If year cache is missing but index exists, re-derive from index
    if (!shows) {
      const index = await getShowsIndex();
      if (index) {
        shows = index
          .filter((s) => s.showdate.startsWith(year))
          .sort((a, b) => a.showdate.localeCompare(b.showdate));
        if (shows.length > 0) {
          await setShowsForYear(year, shows);
        }
      }
    }

    if (!shows) {
      return json({ error: 'No shows found for this year. Cache may not be seeded yet.' }, 404);
    }

    return json({ year: parseInt(year, 10), shows });
  } catch (err) {
    console.error(`GET /api/shows/${year} error:`, err);
    return json({ error: err.message }, 500);
  }
}

export const config = { runtime: 'edge' };
