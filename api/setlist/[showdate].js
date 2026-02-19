import { ensureSetlist } from '../_lib/seed.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 's-maxage=86400, stale-while-revalidate',
    },
  });
}

export default async function handler(req) {
  // Extract dynamic segment from URL path: /api/setlist/[showdate]
  const showdate = new URL(req.url).pathname.split('/').pop();

  if (!showdate || !/^\d{4}-\d{2}-\d{2}$/.test(showdate)) {
    return json({ error: 'Invalid showdate parameter. Use YYYY-MM-DD format.' }, 400);
  }

  try {
    const setlist = await ensureSetlist(showdate);

    if (!setlist) {
      return json({ error: 'No setlist found for this date.' }, 404);
    }

    return json({ showdate, ...setlist });
  } catch (err) {
    console.error(`GET /api/setlist/${showdate} error:`, err);
    return json({ error: err.message }, 500);
  }
}

export const config = { runtime: 'edge' };
