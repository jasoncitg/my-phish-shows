import { useState, useEffect } from 'react';
import { api } from './api.js';
import Background from './components/Background.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Calendar from './components/Calendar.jsx';
import ShowTray from './components/ShowTray.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useSelectedShows } from './hooks/useSelectedShows.js';
import { useShowsData } from './hooks/useShowsData.js';

export default function App() {
  const [view, setView] = useState('calendar'); // 'calendar' | 'dashboard'
  const [cacheStatus, setCacheStatus] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const { selectedShows, addShow, removeShow, isSelected } = useSelectedShows();
  const { years, showsByYear, songs, loading: showsLoading, error: showsError, getShowsForYear } = useShowsData();

  // Poll cache status on load
  useEffect(() => {
    let interval;

    async function checkStatus() {
      try {
        const status = await api.getCacheStatus();
        setCacheStatus(status);
        if (status.seeding) {
          setSeeding(true);
        } else {
          setSeeding(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Cache status error:', err);
        setSeeding(false);
        clearInterval(interval);
      }
    }

    checkStatus();
    interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  if (seeding || (cacheStatus === null && showsLoading)) {
    return (
      <>
        <Background />
        <LoadingScreen progress={cacheStatus?.progress} />
      </>
    );
  }

  return (
    <>
      <Background />
      <div className="app-layout">
        <header className="app-header">
          <div className="header-brand">
            <span className="header-fish">🐟</span>
            <h1 className="header-title">My Phish Shows</h1>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-btn ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
            <button
              className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
              disabled={selectedShows.length === 0}
              title={selectedShows.length === 0 ? 'Select shows first' : undefined}
            >
              My Stats {selectedShows.length > 0 && `(${selectedShows.length})`}
            </button>
          </nav>
        </header>

        <main className="app-main">
          {view === 'calendar' ? (
            <div className="calendar-layout">
              <div className="calendar-main">
                {showsLoading ? (
                  <div className="loading-years">Loading show history…</div>
                ) : showsError && years.length === 0 ? (
                  <div className="api-error">
                    <p>⚠️ Could not load show data.</p>
                    <p className="api-error-detail">{showsError}</p>
                    <button className="btn btn-back" onClick={() => window.location.reload()}>
                      Retry
                    </button>
                  </div>
                ) : (
                  <Calendar
                    years={years}
                    showsByYear={showsByYear}
                    getShowsForYear={getShowsForYear}
                    isSelected={isSelected}
                    onAdd={addShow}
                    onRemove={removeShow}
                  />
                )}
              </div>
              <aside className="calendar-sidebar">
                <ShowTray
                  selectedShows={selectedShows}
                  onRemove={removeShow}
                  onViewDashboard={() => setView('dashboard')}
                />
              </aside>
            </div>
          ) : (
            <Dashboard
              selectedShows={selectedShows}
              songs={songs}
              onBack={() => setView('calendar')}
            />
          )}
        </main>
      </div>
    </>
  );
}
