import { useState, useEffect, useCallback } from 'react';
import { api } from '../api.js';

export function useShowsData() {
  const [years, setYears] = useState([]);
  const [showsByYear, setShowsByYear] = useState({});
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadYears() {
      try {
        const data = await api.getYears();
        setYears(data.years || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadYears();
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
