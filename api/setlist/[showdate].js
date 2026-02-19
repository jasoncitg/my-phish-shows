import { ensureSetlist } from '../_lib/seed.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

  const { showdate } = req.query;

  if (!showdate || !/^\d{4}-\d{2}-\d{2}$/.test(showdate)) {
    return res.status(400).json({ error: 'Invalid showdate parameter. Use YYYY-MM-DD format.' });
  }

  try {
    const setlist = await ensureSetlist(showdate);

    if (!setlist) {
      return res.status(404).json({ error: 'No setlist found for this date.' });
    }

    res.json({ showdate, ...setlist });
  } catch (err) {
    console.error(`GET /api/setlist/${showdate} error:`, err);
    res.status(500).json({ error: err.message });
  }
}
