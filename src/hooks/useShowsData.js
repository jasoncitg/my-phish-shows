import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export function useShowsData() {
  const [years, setYears] = useState([]);
  const [showsByYear, setShowsByYear] = useState({});
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadYears(attempt = 0) {
      try {
        const data = await api.getYears();
        if (cancelled) return;

        if (data.seeding) {
          // KV is being seeded; retry after a short delay (up to 5 attempts)
          if (attempt < 5) {
            setTimeout(() => loadYears(attempt + 1), 3000);
          } else {
            setError('Data is still loading on the server. Please refresh in a moment.');
            setLoading(false);
          }
          return;
        }

        if (!data.years || data.years.length === 0) {
          setError('No show data returned from API. The cache may still be seeding.');
          setLoading(false);
          return;
        }

        setYears(data.years);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    loadYears();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function loadSongs() {
      try {
        const data = await api.getSongs();
        setSongs(data.songs || []);
      } catch {
        // non-critical
      }
    }
    loadSongs();
  }, []);

  const getShowsForYear = useCallback(
    async (year) => {
      if (showsByYear[year]) return showsByYear[year];
      try {
        const data = await api.getShows(year);
        const shows = data.shows || [];
        setShowsByYear((prev) => ({ ...prev, [year]: shows }));
        return shows;
      } catch (err) {
        console.error('Error loading shows for year', year, err);
        return [];
      }
    },
    [showsByYear]
  );

  return { years, showsByYear, songs, loading, error, getShowsForYear };
}
