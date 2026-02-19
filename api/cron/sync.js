import { getCacheStatus } from '../_lib/kv.js';
import { seedIndex, incrementalSync } from '../_lib/seed.js';

export default async function handler(req, res) {
  // Vercel cron jobs send a special authorization header
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const status = await getCacheStatus();

    if (status.seedingStatus === 'idle' || !status.lastUpdated) {
      // Full initial seed
      console.log('Cron: running full initial seed');
      const result = await seedIndex();
      return res.json({ action: 'full_seed', ...result });
    }

    // Incremental sync
    console.log('Cron: running incremental sync since', status.lastUpdated);
    const result = await incrementalSync(status.lastUpdated);
    res.json({ action: 'incremental_sync', ...result });
  } catch (err) {
    console.error('Cron sync error:', err);
    res.status(500).json({ error: err.message });
  }
}
