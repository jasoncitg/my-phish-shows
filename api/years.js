import { getShowsIndex } from './_lib/kv.js';

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

export default async function handler() {
  try {
    const shows = await getShowsIndex();

    // Cold cache: client should poll /api/cache/status which handles seeding
    if (!shows) {
      return json({ seeding: true, message: 'Cache is being seeded, please try again shortly.' }, 202);
    }

    // Aggregate by year
    const yearMap = {};
    for (const show of shows) {
      const year = show.showdate.slice(0, 4);
      yearMap[year] = (yearMap[year] || 0) + 1;
    }

    const years = Object.entries(yearMap)
      .map(([year, count]) => ({ year: parseInt(year, 10), count }))
      .sort((a, b) => b.year - a.year);

    return json({ years });
  } catch (err) {
    console.error('GET /api/years error:', err);
    return json({ error: err.message }, 500);
  }
}

export const config = { runtime: 'edge' };
