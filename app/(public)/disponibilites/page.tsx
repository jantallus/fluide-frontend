"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api'; // On ajoute l'import manquant

export default function PlanningPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlotDate, setNewSlotDate] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // On récupère l'objet "user" complet qu'on a stocké au login
    const userData = localStorage.getItem('user');
    
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    
    // On autorise les admins, permanents et moniteurs à voir cette page
    const authorizedRoles = ['admin', 'permanent', 'monitor'];
    if (!authorizedRoles.includes(user.role)) {
      router.push('/login');
      return;
    }

    setUserName(user.first_name || 'Moniteur');
    fetchSlots(user.id);
  }, [router]);

  const fetchSlots = async (id: string) => {
    try {
      // Note: Assure-toi que cette route existe bien dans ton backend
      const res = await apiFetch(`/api/monitor/slots/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const userData = localStorage.getItem('user');
    if (!userData || !newSlotDate) return;
    
    const user = JSON.parse(userData);

    const res = await apiFetch('/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        monitor_id: user.id, 
        start_time: newSlotDate 
      }),
    }); 

    if (res.ok) {
      setNewSlotDate('');
      fetchSlots(user.id);
    }
  };

  const toggleStatus = async (slotId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    
    // CORRECTION : On a nettoyé les "..." et les parenthèses mal placées ici
    try {
      const res = await apiFetch(`/api/slots/${slotId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSlots((prev: any) => 
          prev.map((s: any) => s.id === slotId ? { ...s, status: newStatus } : s)
        );
      }
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold italic">Chargement du planning...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="max-w-2xl mx-auto mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Planning : {userName}
          </h1>
          <p className="text-slate-500 font-medium">Gérez vos disponibilités de vol.</p>
        </div>
        <button 
          onClick={() => { localStorage.clear(); router.push('/login'); }} 
          className="p-3 bg-white rounded-2xl shadow-sm hover:text-rose-500 transition-colors"
        >
          🚪
        </button>
      </header>

      <div className="max-w-2xl mx-auto">
        <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Ouvrir une nouvelle date</h2>
          <form onSubmit={handleAddSlot} className="flex flex-col md:flex-row gap-3">
            <input 
              type="datetime-local" 
              className="flex-1 p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none font-bold text-slate-700 transition-all"
              value={newSlotDate}
              onChange={(e) => setNewSlotDate(e.target.value)}
              required
            />
            <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-sky-600 transition-all shadow-lg active:scale-95">
              Ajouter
            </button>
          </form>
        </section>

        <div className="space-y-4">
          {slots.length === 0 && <p className="text-center text-slate-400 py-10 italic">Aucun créneau créé pour le moment.</p>}
          {slots.map((s: any) => (
            <div key={s.id} className={`p-6 rounded-[32px] border flex justify-between items-center transition-all ${s.status === 'booked' ? 'bg-blue-50 border-blue-100 shadow-inner' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {new Date(s.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
                <p className="text-2xl font-black text-slate-800 tracking-tighter">
                  {new Date(s.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {s.status === 'booked' ? (
                <div className="text-right">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">💰 Réservé</span>
                </div>
              ) : (
                <button 
                  onClick={() => toggleStatus(s.id, s.status)}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-90 ${s.status === 'available' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white' : 'bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                >
                  {s.status === 'available' ? 'Ouvert' : 'Fermé'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}