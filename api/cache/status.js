import { getCacheStatus, getShowsIndex } from '../_lib/kv.js';
import { seedIndex } from '../_lib/seed.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const status = await getCacheStatus();
    const hasIndex = !!(await getShowsIndex());

    // If cold cache and not already seeding, kick off seeding
    if (!hasIndex && status.seedingStatus === 'idle') {
      // Fire-and-forget seeding (Vercel will keep the function alive for the response)
      seedIndex().catch((err) => console.error('Seeding error:', err));

      return res.json({
        seeding: true,
        status: 'seeding_index',
        progress: { step: 'starting', done: 0, total: 0 },
        lastUpdated: null,
        hasData: false,
      });
    }

    const isSeeding = status.seedingStatus === 'seeding_index' || status.seedingStatus === 'seeding_songs';

    res.json({
      seeding: isSeeding,
      status: status.seedingStatus,
      progress: status.seedingProgress,
      lastUpdated: status.lastUpdated,
      hasData: hasIndex,
    });
  } catch (err) {
    console.error('GET /api/cache/status error:', err);
    res.status(500).json({ error: err.message });
  }
}
