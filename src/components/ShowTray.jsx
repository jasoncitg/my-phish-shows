import { useState } from 'react';

export default function ShowTray({ selectedShows, onRemove, onViewDashboard }) {
  const [collapsed, setCollapsed] = useState(false);

  const count = selectedShows.length;

  if (count === 0) {
    return (
      <div className="show-tray show-tray-empty">
        <div className="tray-header">
          <span className="tray-title">My Shows</span>
          <span className="tray-count-badge">0</span>
        </div>
        <p className="tray-empty-hint">Click a highlighted date on the calendar to add shows.</p>
      </div>
    );
  }

  const dateRange = count > 0
    ? `${selectedShows[0].showdate.slice(0, 4)} – ${selectedShows[count - 1].showdate.slice(0, 4)}`
    : null;

  return (
    <div className={`show-tray ${collapsed ? 'show-tray-collapsed' : ''}`}>
      <div className="tray-header" onClick={() => setCollapsed((c) => !c)}>
        <span className="tray-title">My Shows</span>
        <span className="tray-count-badge">{count}</span>
        {dateRange && <span className="tray-date-range">{dateRange}</span>}
        <button
          className="tray-collapse-btn"
          onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="tray-list">
            {selectedShows.map((show) => {
              const d = new Date(show.showdate + 'T12:00:00');
              const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              return (
                <div key={show.showdate} className="tray-item">
                  <div className="tray-item-info">
                    <span className="tray-item-date">{label}</span>
                    {show.venue && (
                      <span className="tray-item-venue">{show.venue}{show.city ? ` · ${show.city}` : ''}</span>
                    )}
                  </div>
                  <button
                    className="tray-remove-btn"
                    onClick={() => onRemove(show.showdate)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <div className="tray-footer">
            <button className="btn btn-dashboard" onClick={onViewDashboard}>
              View My Stats →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
