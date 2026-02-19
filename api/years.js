import { getShowsIndex, getCacheStatus } from './_lib/kv.js';
import { seedIndex } from './_lib/seed.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    let shows = await getShowsIndex();

    // Cold cache: seed now
    if (!shows) {
      const status = await getCacheStatus();
      if (status.seedingStatus !== 'seeding_index' && status.seedingStatus !== 'seeding_songs') {
        await seedIndex();
        shows = await getShowsIndex();
      } else {
        return res.status(202).json({ seeding: true, message: 'Cache is being seeded, please try again shortly.' });
      }
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

    res.json({ years });
  } catch (err) {
    console.error('GET /api/years error:', err);
    res.status(500).json({ error: err.message });
  }
}
