'use client';
import { useState, useEffect, useRef } from 'react';

export function useClientFilters() {
  const [search, setSearch] = useState('');
  const [filterMonitors, setFilterMonitors] = useState<string[]>([]);
  const [filterFlights, setFilterFlights] = useState<string[]>([]);
  const [filterPayments, setFilterPayments] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = `fluide_filters_${user?.id || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filterMonitors) setFilterMonitors(parsed.filterMonitors);
        if (parsed.filterFlights) setFilterFlights(parsed.filterFlights);
        if (parsed.filterPayments) setFilterPayments(parsed.filterPayments);
        if (parsed.filterStartDate) setFilterStartDate(parsed.filterStartDate);
        if (parsed.filterEndDate) setFilterEndDate(parsed.filterEndDate);
        if (parsed.search) setSearch(parsed.search);
      }
    } catch (e) {
      console.error('Erreur chargement filtres', e);
    }
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = `fluide_filters_${user?.id || 'default'}`;
      localStorage.setItem(
        key,
        JSON.stringify({ filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search })
      );
    } catch {}
  }, [filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search]);

  const resetFilters = () => {
    setFilterMonitors([]);
    setFilterFlights([]);
    setFilterPayments([]);
    setSearch('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasActiveFilters =
    filterMonitors.length > 0 ||
    filterFlights.length > 0 ||
    filterPayments.length > 0 ||
    !!search ||
    !!filterStartDate ||
    !!filterEndDate;

  return {
    search, setSearch,
    filterMonitors, setFilterMonitors,
    filterFlights, setFilterFlights,
    filterPayments, setFilterPayments,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    resetFilters,
    hasActiveFilters,
  };
}
