import { getShowsForYear, getShowsIndex, setShowsForYear } from '../_lib/kv.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const { year } = req.query;

  if (!year || !/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
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
      return res.status(404).json({ error: 'No shows found for this year. Cache may not be seeded yet.' });
    }

    res.json({ year: parseInt(year, 10), shows });
  } catch (err) {
    console.error(`GET /api/shows/${year} error:`, err);
    res.status(500).json({ error: err.message });
  }
}
