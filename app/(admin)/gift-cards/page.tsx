"use client";
import React, { useState } from 'react';
import type { GiftCard } from '@/lib/types';
import { useGiftCardsData } from '@/hooks/useGiftCardsData';
import { VoucherCard } from '@/components/gift-cards/VoucherCard';
import { VoucherModal } from '@/components/gift-cards/VoucherModal';

export default function VouchersPage() {
  const { cards, flights, complements, loading, loadData, toggleCardStatus, deleteCard } = useGiftCardsData();
  const [showModal, setShowModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<GiftCard | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleEdit = (card: GiftCard) => {
    setCardToEdit(card);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCardToEdit(null);
  };

  const filteredCards = [...cards]
    .filter(c => {
      if (filterStatus === 'active' && c.status !== 'valid') return false;
      if (filterStatus === 'inactive' && c.status === 'valid') return false;
      if (filterType === 'gift_card' && c.type !== 'gift_card') return false;
      if (filterType === 'promo' && c.type !== 'promo') return false;
      if (filterType === 'promo_campaign' && (c.type !== 'promo' || c.is_partner)) return false;
      if (filterType === 'promo_partner' && (c.type !== 'promo' || !c.is_partner)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.type === 'promo' && b.type !== 'promo') return -1;
      if (a.type !== 'promo' && b.type === 'promo') return 1;
      return b.id - a.id;
    });

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Ventes & Boutique</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Codes & <span className="text-indigo-500">Bons</span>
          </h1>
        </div>
        <button
          onClick={() => { setCardToEdit(null); setShowModal(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform"
        >
          + Créer un Code
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select className="bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-700 shadow-sm outline-none w-full md:w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">🎟️ Tous les types</option>
          <option value="gift_card">🎁 Bons Cadeaux</option>
          <option value="promo">✂️ Tous les Codes Promos</option>
          <option value="promo_campaign">📢 Codes Promos Classiques</option>
          <option value="promo_partner">🤝 Codes Partenaires</option>
        </select>
        <select className="bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-700 shadow-sm outline-none w-full md:w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">🌟 Tous les statuts</option>
          <option value="active">● Actifs</option>
          <option value="inactive">✕ Inactifs / Utilisés</option>
        </select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse">Chargement...</div>
        ) : filteredCards.map(c => (
          <VoucherCard
            key={c.id}
            card={c}
            onToggleStatus={toggleCardStatus}
            onEdit={handleEdit}
            onDelete={deleteCard}
          />
        ))}
      </div>

      {showModal && (
        <VoucherModal
          cardToEdit={cardToEdit}
          flights={flights}
          complements={complements}
          onClose={handleCloseModal}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
