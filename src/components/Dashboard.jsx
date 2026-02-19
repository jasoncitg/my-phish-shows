import { useMemo, useState, useEffect } from 'react';
import { api } from '../api.js';

function StatCard({ title, children }) {
  return (
    <div className="stat-card">
      <h3 className="stat-card-title">{title}</h3>
      <div className="stat-card-body">{children}</div>
    </div>
  );
}

function Timeline({ shows }) {
  if (shows.length === 0) return null;
  const sorted = [...shows].sort((a, b) => a.showdate.localeCompare(b.showdate));
  const first = new Date(sorted[0].showdate + 'T12:00:00');
  const last = new Date(sorted[sorted.length - 1].showdate + 'T12:00:00');
  const totalMs = last - first || 1;

  return (
    <div className="timeline-wrap">
      <div className="timeline-track">
        {sorted.map((show) => {
          const d = new Date(show.showdate + 'T12:00:00');
          const pct = ((d - first) / totalMs) * 100;
          return (
            <div
              key={show.showdate}
              className="timeline-dot"
              style={{ left: `${pct}%` }}
              title={`${show.showdate}${show.venue ? ` – ${show.venue}` : ''}`}
            />
          );
        })}
      </div>
      <div className="timeline-labels">
        <span>{sorted[0].showdate.slice(0, 4)}</span>
        <span>{sorted[sorted.length - 1].showdate.slice(0, 4)}</span>
      </div>
    </div>
  );
}

export default function Dashboard({ selectedShows, songs, onBack }) {
  const [setlistCache, setSetlistCache] = useState({});
  const [loadingSetlists, setLoadingSetlists] = useState(true);

  // Load all setlists for selected shows
  useEffect(() => {
    if (selectedShows.length === 0) {
      setLoadingSetlists(false);
      return;
    }
    setLoadingSetlists(true);
    const missing = selectedShows.filter((s) => !setlistCache[s.showdate]);
    if (missing.length === 0) {
      setLoadingSetlists(false);
      return;
    }
    Promise.all(
      missing.map((show) =>
        api.getSetlist(show.showdate)
          .then((data) => ({ date: show.showdate, data }))
          .catch(() => ({ date: show.showdate, data: null }))
      )
    ).then((results) => {
      setSetlistCache((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.date] = r.data;
        return next;
      });
      setLoadingSetlists(false);
    });
  }, [selectedShows]);

  const stats = useMemo(() => {
    if (loadingSetlists) return null;

    const sorted = [...selectedShows].sort((a, b) => a.showdate.localeCompare(b.showdate));
    const totalShows = sorted.length;
    const firstShow = sorted[0];
    const lastShow = sorted[sorted.length - 1];

    // Collect all songs heard
    const songCount = {};
    for (const show of sorted) {
      const setlist = setlistCache[show.showdate];
      if (!setlist || !setlist.setOrder) continue;
      for (const setName of setlist.setOrder) {
        for (const song of setlist.sets[setName] || []) {
          if (!song.song) continue;
          songCount[song.song] = (songCount[song.song] || 0) + 1;
        }
      }
    }

    const heardSongs = Object.keys(songCount);
    const totalUnique = heardSongs.length;

    // Songs by career play count
    const songCatalogMap = {};
    for (const s of songs) songCatalogMap[s.song] = s;

    const neverHeard = songs.filter((s) => s.times_played > 0 && !songCount[s.song])
      .sort((a, b) => a.times_played - b.times_played);

    const rarest = heardSongs
      .map((name) => ({ name, times_played: songCatalogMap[name]?.times_played || 0 }))
      .sort((a, b) => a.times_played - b.times_played)
      .slice(0, 10);

    const mostSeen = Object.entries(songCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Favorite venues
    const venueCounts = {};
    for (const show of sorted) {
      const key = show.venue || 'Unknown Venue';
      venueCounts[key] = (venueCounts[key] || 0) + 1;
    }
    const favoriteVenues = Object.entries(venueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([venue, count]) => ({ venue, count }));

    // Years/eras
    const yearCounts = {};
    for (const show of sorted) {
      const y = show.showdate.slice(0, 4);
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    }
    const yearsAttended = Object.entries(yearCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, count]) => ({ year, count }));

    return {
      totalShows,
      firstShow,
      lastShow,
      totalUnique,
      heardSongs,
      neverHeard: neverHeard.slice(0, 20),
      rarest,
      mostSeen,
      favoriteVenues,
      yearsAttended,
    };
  }, [selectedShows, setlistCache, songs, loadingSetlists]);

  if (selectedShows.length === 0) {
    return (
      <div className="dashboard dashboard-empty">
        <button className="btn btn-back" onClick={onBack}>← Back to Calendar</button>
        <p>Select some shows first to see your stats.</p>
      </div>
    );
  }

  if (loadingSetlists || !stats) {
    return (
      <div className="dashboard dashboard-loading">
        <button className="btn btn-back" onClick={onBack}>← Back to Calendar</button>
        <div className="dashboard-spinner">Loading your setlists…</div>
      </div>
    );
  }

  const firstDate = new Date(stats.firstShow.showdate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lastDate = new Date(stats.lastShow.showdate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="btn btn-back" onClick={onBack}>← Back to Calendar</button>
        <h1 className="dashboard-title">My Phish Stats</h1>
        <p className="dashboard-subtitle">{stats.totalShows} shows · {firstDate} → {lastDate}</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Overview">
          <div className="overview-stats">
            <div className="big-stat">
              <span className="big-num">{stats.totalShows}</span>
              <span className="big-label">Shows Attended</span>
            </div>
            <div className="big-stat">
              <span className="big-num">{stats.totalUnique}</span>
              <span className="big-label">Unique Songs Heard</span>
            </div>
            <div className="big-stat">
              <span className="big-num">{stats.yearsAttended.length}</span>
              <span className="big-label">Years Represented</span>
            </div>
          </div>
        </StatCard>

        <StatCard title="Show Timeline">
          <Timeline shows={selectedShows} />
        </StatCard>

        <StatCard title="Most-Seen Songs">
          <ol className="ranked-list">
            {stats.mostSeen.map((s, i) => (
              <li key={s.name} className="ranked-item">
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{s.name}</span>
                <span className="rank-count">{s.count}×</span>
              </li>
            ))}
          </ol>
        </StatCard>

        <StatCard title="Rarest Songs You've Heard">
          <p className="stat-note">Lowest career play counts in your collection</p>
          <ol className="ranked-list">
            {stats.rarest.map((s, i) => (
              <li key={s.name} className="ranked-item">
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{s.name}</span>
                <span className="rank-meta">{s.times_played} career plays</span>
              </li>
            ))}
          </ol>
        </StatCard>

        <StatCard title="Favorite Venues">
          <ol className="ranked-list">
            {stats.favoriteVenues.map((v, i) => (
              <li key={v.venue} className="ranked-item">
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{v.venue}</span>
                <span className="rank-count">{v.count}×</span>
              </li>
            ))}
          </ol>
        </StatCard>

        <StatCard title="Years &amp; Eras">
          <div className="year-bars">
            {stats.yearsAttended.map((y) => {
              const max = Math.max(...stats.yearsAttended.map((x) => x.count));
              const pct = (y.count / max) * 100;
              return (
                <div key={y.year} className="year-bar-row">
                  <span className="year-bar-label">{y.year}</span>
                  <div className="year-bar-track">
                    <div className="year-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="year-bar-count">{y.count}</span>
                </div>
              );
            })}
          </div>
        </StatCard>

        {stats.neverHeard.length > 0 && (
          <StatCard title="Songs Never Heard Live">
            <p className="stat-note">Highest career play counts among songs you haven't seen</p>
            <div className="never-heard-grid">
              {stats.neverHeard.map((s) => (
                <div key={s.song} className="never-heard-item">
                  <span className="never-heard-name">{s.song}</span>
                  <span className="never-heard-count">{s.times_played} plays</span>
                </div>
              ))}
            </div>
          </StatCard>
        )}
      </div>
    </div>
  );
}
