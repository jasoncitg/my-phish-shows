import { getSongsCatalog, setSongsCatalog } from './_lib/kv.js';
import { fetchSongs } from './_lib/phishnet.js';

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
    let songs = await getSongsCatalog();

    if (!songs) {
      songs = await fetchSongs();
      await setSongsCatalog(songs);
    }

    return json({ songs });
  } catch (err) {
    console.error('GET /api/songs error:', err);
    return json({ error: err.message }, 500);
  }
}

export const config = { runtime: 'edge' };
