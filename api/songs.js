import { getSongsCatalog, setSongsCatalog } from './_lib/kv.js';
import { fetchSongs } from './_lib/phishnet.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  try {
    let songs = await getSongsCatalog();

    if (!songs) {
      songs = await fetchSongs();
      await setSongsCatalog(songs);
    }

    res.json({ songs });
  } catch (err) {
    console.error('GET /api/songs error:', err);
    res.status(500).json({ error: err.message });
  }
}
