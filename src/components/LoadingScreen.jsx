export default function LoadingScreen({ progress }) {
  const step = progress?.step || 'starting';
  const done = progress?.done || 0;
  const total = progress?.total || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stepLabel = {
    starting: 'Connecting to Phish.net…',
    shows: 'Loading show history (1983–present)…',
    songs: 'Loading song catalog…',
    complete: 'Almost ready…',
  }[step] || 'Seeding cache…';

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-fish">🐟</div>
        <h1>My Phish Shows</h1>
        <p className="loading-subtitle">Seeding data from Phish.net for the first time.</p>
        <p className="loading-step">{stepLabel}</p>
        {total > 0 && (
          <div className="progress-bar-wrap">
            <div className="progress-bar" style={{ width: `${pct}%` }} />
          </div>
        )}
        <p className="loading-hint">This only happens once. Grab a donut and hang tight.</p>
      </div>
    </div>
  );
}
