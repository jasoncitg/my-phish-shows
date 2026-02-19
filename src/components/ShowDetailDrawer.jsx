import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function ShowDetailDrawer({ show, isSelected, onAdd, onRemove, onClose }) {
  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    setError(null);
    setSetlist(null);
    api.getSetlist(show.showdate)
      .then((data) => setSetlist(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [show?.showdate]);

  if (!show) return null;

  const displayDate = new Date(show.showdate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const venue = setlist?.venue || show.venue;
  const city = setlist?.city || show.city;
  const state = setlist?.state || show.state;

  return (
    <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>×</button>

        <div className="drawer-header">
          <div className="drawer-date">{displayDate}</div>
          <div className="drawer-venue">
            {venue && <div className="venue-name">{venue}</div>}
            {city && <div className="venue-location">{city}{state ? `, ${state}` : ''}</div>}
          </div>
        </div>

        <div className="drawer-action">
          {isSelected ? (
            <button className="btn btn-remove" onClick={() => onRemove(show.showdate)}>
              ✓ Remove from My Shows
            </button>
          ) : (
            <button className="btn btn-add" onClick={() => onAdd({ ...show, venue, city, state })}>
              + Add to My Shows
            </button>
          )}
        </div>

        <div className="drawer-setlist">
          {loading && <p className="setlist-loading">Loading setlist…</p>}
          {error && <p className="setlist-error">Could not load setlist: {error}</p>}
          {setlist && setlist.setOrder && setlist.setOrder.length > 0 ? (
            setlist.setOrder.map((setName) => (
              <div key={setName} className="set-block">
                <h3 className="set-title">{setName}</h3>
                <ol className="song-list">
                  {setlist.sets[setName].map((song, i) => (
                    <li key={i} className="song-item">
                      <span className="song-name">{song.song}</span>
                      {song.is_jam && <span className="song-jam-tag">jam</span>}
                      {song.transition && song.transition !== ',' && (
                        <span className="song-transition">{song.transition}</span>
                      )}
                      {song.footnote && (
                        <span className="song-footnote" title={song.footnote}>*</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))
          ) : (
            !loading && !error && (
              <p className="no-setlist">No setlist data available for this show.</p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
