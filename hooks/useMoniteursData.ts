"use client";
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export function useMoniteursData() {
  const { toast, confirm } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/monitors-admin');
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error("Erreur chargement utilisateurs:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!await confirm(`Supprimer définitivement le compte de ${name} ?`)) return;
    const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadUsers();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de la suppression");
    }
  };

  const copyIcalLink = (userId: number) => {
    const backendUrl = "https://fluide-production.up.railway.app";
    navigator.clipboard.writeText(`${backendUrl}/api/ical/${userId}`);
    toast.success("Lien d'agenda copié ! 📋");
  };

  return { users, loading, loadUsers, handleDelete, copyIcalLink };
}
