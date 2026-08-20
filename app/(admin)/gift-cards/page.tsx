"use client";
import React, { useState, useEffect } from 'react';
import type { GiftCard, GiftCardShopTemplate } from '@/lib/types';
import { useGiftCardsData } from '@/hooks/useGiftCardsData';
import { VoucherCard } from '@/components/gift-cards/VoucherCard';
import { VoucherModal } from '@/components/gift-cards/VoucherModal';
import { TemplateModal } from '@/components/config/TemplateModal';
import { apiFetch } from '@/lib/api';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

export default function VouchersPage() {
  const { cards, flights, complements, loading, loadData, toggleCardStatus, deleteCard } = useGiftCardsData();
  const { confirm } = useToast();
  const [activeTab, setActiveTab] = useState<'codes' | 'boutique'>('codes');
  const [showModal, setShowModal] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<GiftCard | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Boutique
  const [templates, setTemplates] = useState<GiftCardShopTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<GiftCardShopTemplate | null>(null);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await apiFetch('/api/gift-card-templates');
      if (res.ok) setTemplates(await res.json());
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const deleteTemplate = async (id: number) => {
    if (!await confirm('Supprimer ce modèle de la boutique ?')) return;
    await apiFetch(`/api/gift-card-templates/${id}`, { method: 'DELETE' });
    loadTemplates();
  };

  const handleEdit = (card: GiftCard) => { setCardToEdit(card); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setCardToEdit(null); };

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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Ventes & Boutique</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Bons <span className="text-indigo-500">Cadeaux</span>
          </h1>
        </div>
        {activeTab === 'codes' ? (
          <button
            onClick={() => { setCardToEdit(null); setShowModal(true); }}
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform"
          >
            + Créer un Code
          </button>
        ) : (
          <button
            onClick={() => { setTemplateToEdit(null); setShowTemplateModal(true); }}
            className="w-full md:w-auto bg-amber-500 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform"
          >
            + Créer un Modèle
          </button>
        )}
      </header>

      {/* Onglets */}
      <div className="flex gap-2 mb-8 border-b-2 border-slate-200">
        <button
          onClick={() => setActiveTab('codes')}
          className={`px-6 py-3 font-black uppercase text-xs tracking-wider rounded-t-xl transition-all ${activeTab === 'codes' ? 'bg-white border-2 border-b-white border-slate-200 text-indigo-600 -mb-0.5' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🎟️ Codes &amp; Bons
        </button>
        <button
          onClick={() => setActiveTab('boutique')}
          className={`px-6 py-3 font-black uppercase text-xs tracking-wider rounded-t-xl transition-all ${activeTab === 'boutique' ? 'bg-white border-2 border-b-white border-slate-200 text-amber-600 -mb-0.5' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🛍️ Boutique en ligne
        </button>
      </div>

      {/* Onglet Codes & Bons */}
      {activeTab === 'codes' && (
        <>
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
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-12 font-bold text-slate-400 italic">Aucun code pour ces filtres.</div>
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
        </>
      )}

      {/* Onglet Boutique */}
      {activeTab === 'boutique' && (
        <div className="space-y-4">
          {templatesLoading ? (
            <div className="text-center py-12 font-bold text-slate-400 animate-pulse">Chargement...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[40px] border border-slate-100 shadow-sm">
              <p className="text-4xl mb-4">🛍️</p>
              <p className="font-black text-slate-400 italic">Aucun modèle créé pour la boutique.</p>
              <p className="text-xs text-slate-400 mt-2">Les modèles apparaissent sur la page d&apos;achat en ligne.</p>
            </div>
          ) : templates.map(tpl => (
            <div key={tpl.id} className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl shrink-0">🎁</div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 truncate">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    {tpl.flight_name ? `🎯 ${tpl.flight_name}` : '💶 Avoir Libre'} · {tpl.validity_months} mois de validité
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-black text-amber-500">{tpl.price_cents / 100}€</p>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${tpl.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {tpl.is_published ? '● En ligne' : '○ Brouillon'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setTemplateToEdit(tpl); setShowTemplateModal(true); }} className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100"><Pencil size={15} /></button>
                  <button onClick={() => deleteTemplate(tpl.id)} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-rose-100"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VoucherModal
          cardToEdit={cardToEdit}
          flights={flights}
          complements={complements}
          onClose={handleCloseModal}
          onSaved={loadData}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          templateToEdit={templateToEdit}
          flights={flights}
          onClose={() => { setShowTemplateModal(false); setTemplateToEdit(null); }}
          onSaved={loadTemplates}
        />
      )}
    </div>
  );
}
