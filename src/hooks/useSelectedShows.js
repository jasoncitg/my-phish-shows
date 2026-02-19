import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'phish_selected_shows';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(shows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
  } catch {
    // ignore quota errors
  }
}

export function useSelectedShows() {
  const [selectedShows, setSelectedShows] = useState(loadFromStorage);

  useEffect(() => {
    saveToStorage(selectedShows);
  }, [selectedShows]);

  const addShow = useCallback((show) => {
    setSelectedShows((prev) => {
      if (prev.some((s) => s.showdate === show.showdate)) return prev;
      const next = [...prev, show].sort((a, b) => a.showdate.localeCompare(b.showdate));
      return next;
    });
  }, []);

  const removeShow = useCallback((showdate) => {
    setSelectedShows((prev) => prev.filter((s) => s.showdate !== showdate));
  }, []);

  const isSelected = useCallback(
    (showdate) => selectedShows.some((s) => s.showdate === showdate),
    [selectedShows]
  );

  return { selectedShows, addShow, removeShow, isSelected };
}
