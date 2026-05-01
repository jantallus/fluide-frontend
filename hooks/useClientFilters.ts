"use client";
import { useState, useEffect, useRef } from 'react';

export function useClientFilters() {
  const [search, setSearch] = useState('');
  const [filterMonitors, setFilterMonitors] = useState<string[]>([]);
  const [filterFlights, setFilterFlights] = useState<string[]>([]);
  const [filterPayments, setFilterPayments] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  // Ref instead of state+setTimeout: avoids a 500ms race condition where
  // saves could fire before the initial load completed.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const saved = JSON.parse(localStorage.getItem(`fluide_filters_${user?.id || 'default'}`) || 'null');
      if (saved) {
        if (saved.filterMonitors) setFilterMonitors(saved.filterMonitors);
        if (saved.filterFlights) setFilterFlights(saved.filterFlights);
        if (saved.filterPayments) setFilterPayments(saved.filterPayments);
        if (saved.filterStartDate) setFilterStartDate(saved.filterStartDate);
        if (saved.filterEndDate) setFilterEndDate(saved.filterEndDate);
        if (saved.search) setSearch(saved.search);
      }
    } catch (e) { console.error('Erreur chargement filtres', e); }
    hasLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      localStorage.setItem(`fluide_filters_${user?.id || 'default'}`, JSON.stringify({ filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search }));
    } catch (e) {}
  }, [filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search]);

  const resetFilters = () => {
    setFilterMonitors([]); setFilterFlights([]); setFilterPayments([]);
    setSearch(''); setFilterStartDate(''); setFilterEndDate('');
  };

  return {
    search, setSearch,
    filterMonitors, setFilterMonitors,
    filterFlights, setFilterFlights,
    filterPayments, setFilterPayments,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    resetFilters,
  };
}
