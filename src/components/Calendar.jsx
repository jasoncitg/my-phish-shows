import { useState, useEffect, useMemo, useRef } from 'react';
import YearMonthPicker from './YearMonthPicker.jsx';
import ShowDetailDrawer from './ShowDetailDrawer.jsx';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({ years, showsByYear, getShowsForYear, isSelected, onAdd, onRemove }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => {
    // Default to most recent year with shows
    if (years.length > 0) {
      const sorted = [...years].sort((a, b) => b.year - a.year);
      return sorted[0].year;
    }
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedShow, setSelectedShow] = useState(null);
  const [loadingYear, setLoadingYear] = useState(false);

  // Track current viewMonth in a ref so the load effect can read it without
  // being re-triggered every time the month changes.
  const viewMonthRef = useRef(viewMonth);
  useEffect(() => { viewMonthRef.current = viewMonth; }, [viewMonth]);

  // When viewYear changes, mark that we should auto-navigate to the best month.
  const shouldAutoNavMonth = useRef(true);
  useEffect(() => { shouldAutoNavMonth.current = true; }, [viewYear]);

  // Update default year when years load
  useEffect(() => {
    if (years.length > 0) {
      const sorted = [...years].sort((a, b) => b.year - a.year);
      setViewYear(sorted[0].year);
    }
  }, [years.length]);

  // Load shows for the current view year; auto-navigate to last month with shows
  useEffect(() => {
    if (!showsByYear[viewYear]) {
      setLoadingYear(true);
      getShowsForYear(viewYear)
        .then((shows) => {
          if (shouldAutoNavMonth.current && shows && shows.length > 0) {
            const curMonth = viewMonthRef.current;
            const hasShows = shows.some(
              (s) => parseInt(s.showdate.slice(5, 7), 10) - 1 === curMonth
            );
            if (!hasShows) {
              // Navigate to the most recent month that has shows
              const sorted = [...shows].sort((a, b) =>
                b.showdate.localeCompare(a.showdate)
              );
              setViewMonth(parseInt(sorted[0].showdate.slice(5, 7), 10) - 1);
            }
            shouldAutoNavMonth.current = false;
          }
        })
        .finally(() => setLoadingYear(false));
    }
  }, [viewYear, showsByYear, getShowsForYear]);

  // If shows are already cached for this year, still run auto-nav if needed
  useEffect(() => {
    const shows = showsByYear[viewYear];
    if (shouldAutoNavMonth.current && shows && shows.length > 0) {
      const curMonth = viewMonthRef.current;
      const hasShows = shows.some(
        (s) => parseInt(s.showdate.slice(5, 7), 10) - 1 === curMonth
      );
      if (!hasShows) {
        const sorted = [...shows].sort((a, b) =>
          b.showdate.localeCompare(a.showdate)
        );
        setViewMonth(parseInt(sorted[0].showdate.slice(5, 7), 10) - 1);
      }
      shouldAutoNavMonth.current = false;
    }
  }, [viewYear, showsByYear]);

  const showsThisYear = showsByYear[viewYear] || [];

  // Build a Set of show dates for this year for fast lookup
  const showDatesSet = useMemo(() => new Set(showsThisYear.map((s) => s.showdate)), [showsThisYear]);

  // Build show lookup by date
  const showByDate = useMemo(() => {
    const map = {};
    for (const s of showsThisYear) map[s.showdate] = s;
    return map;
  }, [showsThisYear]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Trailing empty cells to fill last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  function handleDayClick(day) {
    if (!day) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (showDatesSet.has(dateStr)) {
      setSelectedShow(showByDate[dateStr]);
    }
  }

  function handlePickerChange(year, month) {
    setViewYear(year);
    setViewMonth(month);
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' });
  const showsThisMonth = showsThisYear.filter((s) => {
    const d = new Date(s.showdate + 'T12:00:00');
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  return (
    <div className="calendar-section">
      <YearMonthPicker
        year={viewYear}
        month={viewMonth}
        years={years}
        onChange={handlePickerChange}
      />

      <div className="calendar-header-row">
        <h2 className="calendar-title">{monthName} {viewYear}</h2>
        {showsThisMonth.length > 0 && (
          <span className="shows-count-badge">{showsThisMonth.length} show{showsThisMonth.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loadingYear ? (
        <div className="calendar-loading">Loading {viewYear} shows…</div>
      ) : (
        <div className="calendar-grid">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="cal-dow-header">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-cell cal-cell-empty" />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasShow = showDatesSet.has(dateStr);
            const selected = isSelected(dateStr);

            return (
              <div
                key={dateStr}
                className={`cal-cell ${hasShow ? 'cal-cell-show' : ''} ${selected ? 'cal-cell-selected' : ''} ${!hasShow ? 'cal-cell-noshow' : ''}`}
                onClick={() => handleDayClick(day)}
                title={hasShow ? (showByDate[dateStr]?.venue || 'Show') : undefined}
              >
                <span className="cal-day-num">{day}</span>
                {hasShow && (
                  <span className="cal-show-dot" />
                )}
                {selected && (
                  <span className="cal-selected-mark">✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showsThisMonth.length > 0 && (
        <div className="month-shows-list">
          {showsThisMonth.map((show) => (
            <div
              key={show.showdate}
              className={`month-show-row ${isSelected(show.showdate) ? 'selected' : ''}`}
              onClick={() => setSelectedShow(show)}
            >
              <span className="month-show-date">
                {new Date(show.showdate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="month-show-venue">{show.venue}</span>
              <span className="month-show-city">{show.city}{show.state ? `, ${show.state}` : ''}</span>
              {isSelected(show.showdate) && <span className="month-show-check">✓</span>}
            </div>
          ))}
        </div>
      )}

      {showsThisMonth.length === 0 && !loadingYear && (
        <div className="no-shows-month">No Phish shows in {monthName} {viewYear}.</div>
      )}

      {selectedShow && (
        <ShowDetailDrawer
          show={selectedShow}
          isSelected={isSelected(selectedShow.showdate)}
          onAdd={onAdd}
          onRemove={onRemove}
          onClose={() => setSelectedShow(null)}
        />
      )}
    </div>
  );
}
