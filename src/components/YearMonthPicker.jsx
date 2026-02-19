const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function YearMonthPicker({ year, month, years, onChange }) {
  const sortedYears = [...years].sort((a, b) => a.year - b.year);
  const minYear = sortedYears.length > 0 ? sortedYears[0].year : 1983;
  const maxYear = sortedYears.length > 0 ? sortedYears[sortedYears.length - 1].year : new Date().getFullYear();

  function handleYearChange(e) {
    onChange(parseInt(e.target.value, 10), month);
  }

  function handleMonthChange(m) {
    onChange(year, m);
  }

  function prevMonth() {
    if (month === 0) {
      if (year > minYear) onChange(year - 1, 11);
    } else {
      onChange(year, month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      if (year < maxYear) onChange(year + 1, 0);
    } else {
      onChange(year, month + 1);
    }
  }

  return (
    <div className="year-month-picker">
      <button className="nav-arrow" onClick={prevMonth} title="Previous month">‹</button>

      <div className="picker-center">
        <select
          className="year-select"
          value={sortedYears.length > 0 ? year : ''}
          onChange={handleYearChange}
          disabled={sortedYears.length === 0}
        >
          {sortedYears.length === 0 && (
            <option value="" disabled>Loading years…</option>
          )}
          {sortedYears.map((y) => (
            <option key={y.year} value={y.year}>
              {y.year} ({y.count} shows)
            </option>
          ))}
        </select>

        <div className="month-tabs">
          {MONTHS.map((m, i) => (
            <button
              key={m}
              className={`month-tab ${month === i ? 'active' : ''}`}
              onClick={() => handleMonthChange(i)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button className="nav-arrow" onClick={nextMonth} title="Next month">›</button>
    </div>
  );
}
