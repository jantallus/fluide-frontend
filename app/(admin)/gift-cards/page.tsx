"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function VouchersPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'gift_card' | 'promo'>('gift_card');
  const [complements, setComplements] = useState<any[]>([]);
  const [giftCardMode, setGiftCardMode] = useState<'prestation' | 'value'>('prestation');
  const [selectedPrestation, setSelectedPrestation] = useState('');
  
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newVoucher, setNewVoucher] = useState({
    type: 'gift_card',
    custom_code: '',
    buyer_name: '',
    beneficiary_name: '',
    gift_value: '', 
    flight_type_id: '',
    discount_type: 'fixed',
    discount_value: '',
    discount_scope: 'both',
    max_uses: '1',
    is_unlimited: false,
    valid_from: '',
    valid_until: '',
    is_partner: false,
    partner_billing_type: 'fixed',
    partner_amount: ''    
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingCardId(null);
    setNewVoucher({
      type: 'gift_card', custom_code: '', buyer_name: '', beneficiary_name: '', gift_value: '', 
      flight_type_id: '', discount_type: 'fixed', discount_value: '', discount_scope: 'both',
      max_uses: '1', is_unlimited: false, valid_from: '', valid_until: '',
      is_partner: false, partner_billing_type: 'fixed', partner_amount: ''
    });
    setSelectedPrestation('');
    setGiftCardMode('prestation');
  };

  const handleEdit = (card: any) => {
    setEditingCardId(card.id);
    setActiveTab(card.type);
    
    setNewVoucher({
      type: card.type,
      custom_code: card.code,
      buyer_name: card.buyer_name || '',
      beneficiary_name: card.beneficiary_name || '',
      gift_value: card.price_paid_cents ? (card.price_paid_cents / 100).toString() : '',
      flight_type_id: card.flight_type_id?.toString() || '',
      discount_type: card.discount_type || 'fixed',
      discount_value: card.discount_value ? card.discount_value.toString() : '',
      discount_scope: card.discount_scope || 'both',
      max_uses: card.max_uses ? card.max_uses.toString() : '',
      is_unlimited: card.max_uses === null,
      valid_from: card.valid_from ? card.valid_from.split('T')[0] : '',
      valid_until: card.valid_until ? card.valid_until.split('T')[0] : '',
      is_partner: card.is_partner || false, 
      partner_billing_type: card.partner_billing_type || 'fixed',
      partner_amount: card.partner_amount_cents ? (card.partner_amount_cents / 100).toString() : '' 
    });

    if (card.type === 'gift_card') {
      if (card.flight_type_id) {
        setGiftCardMode('prestation');
        setSelectedPrestation(`flight|${card.flight_type_id}`);
      } else {
        setGiftCardMode('value');
        setSelectedPrestation('');
      }
    }
    setShowModal(true);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes, compRes] = await Promise.all([
        apiFetch('/api/gift-cards'),
        apiFetch('/api/flight-types'),
        apiFetch('/api/complements')
      ]);
      if (cRes.ok) setCards(await cRes.json());
      if (fRes.ok) setFlights(await fRes.json());
      if (compRes.ok) setComplements(await compRes.json());
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleCardStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'valid' ? 'used' : 'valid';
    if (!confirm(newStatus === 'valid' ? "Réactiver ce code ?" : "Marquer ce code comme inactif/utilisé ?")) return;

    const res = await apiFetch(`/api/gift-cards/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) loadData();
  };

  const deleteCard = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement ce code/bon ?")) return;
    const res = await apiFetch(`/api/gift-cards/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
  };

  const handleCreate = async () => {
    let payload: any = {
      type: activeTab,
      custom_code: newVoucher.custom_code.trim()
    };

    if (activeTab === 'gift_card') {
      if (!newVoucher.gift_value || !newVoucher.buyer_name) {
        alert("Veuillez renseigner le nom de l'acheteur et le montant du bon.");
        return;
      }

      let finalNotes = 'Avoir libre';
      if (giftCardMode === 'prestation') {
         if (selectedPrestation.startsWith('flight|')) {
            const f = flights.find(fl => fl.id.toString() === selectedPrestation.split('|')[1]);
            finalNotes = f ? `Vol : ${f.name}` : finalNotes;
         } else if (selectedPrestation.startsWith('comp|')) {
            const c = complements.find(co => co.id.toString() === selectedPrestation.split('|')[1]);
            finalNotes = c ? `Option : ${c.name}` : finalNotes;
         }
      }

      payload = {
        ...payload,
        flight_type_id: (giftCardMode === 'prestation' && selectedPrestation.startsWith('flight|')) ? newVoucher.flight_type_id : null,
        buyer_name: newVoucher.buyer_name,
        beneficiary_name: '', 
        price_paid_cents: Math.round(parseFloat(newVoucher.gift_value) * 100),
        notes: finalNotes,
        max_uses: 1,
        discount_scope: 'both',
        is_partner: false,
        partner_billing_type: 'fixed',
        partner_amount_cents: null
      };
    } else {
      if (!newVoucher.discount_value) {
        alert("Veuillez indiquer la valeur de la réduction.");
        return;
      }
      
      if (newVoucher.discount_type === 'percentage' && parseFloat(newVoucher.discount_value) > 100) {
        alert("Une réduction en pourcentage ne peut pas dépasser 100 % !");
        return;
      }

      payload = {
        ...payload,
        flight_type_id: newVoucher.flight_type_id || null,
        discount_type: newVoucher.discount_type,
        discount_value: parseFloat(newVoucher.discount_value),
        discount_scope: newVoucher.discount_scope, 
        max_uses: newVoucher.is_unlimited ? null : parseInt(newVoucher.max_uses) || 1,
        valid_from: newVoucher.valid_from || null,
        valid_until: newVoucher.valid_until || null,
        is_partner: newVoucher.is_partner,
        partner_billing_type: newVoucher.partner_billing_type,
        partner_amount_cents: newVoucher.partner_amount ? Math.round(parseFloat(newVoucher.partner_amount) * 100) : null, 
        notes: newVoucher.flight_type_id ? `Promo spécifique` : `Promo globale`
      };
    }

    const res = await apiFetch(editingCardId ? `/api/gift-cards/${editingCardId}` : '/api/gift-cards', {
      method: editingCardId ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setShowModal(false);
      setNewVoucher({
        type: 'gift_card', custom_code: '', flight_type_id: '', buyer_name: '', beneficiary_name: '',
        gift_value: '', discount_type: 'fixed', discount_value: '', discount_scope: 'both',
        max_uses: '1', is_unlimited: false, valid_from: '', valid_until: '', is_partner: false, partner_billing_type: 'fixed', partner_amount: ''
      });
      setSelectedPrestation(''); 
      setGiftCardMode('prestation');
      setEditingCardId(null);
      loadData();
    } else {
      const errorMsg = await res.json();
      alert("Erreur : " + (errorMsg.error || "Le code personnalisé est peut-être déjà pris."));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Ventes & Boutique</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Codes & <span className="text-indigo-500">Bons</span>
          </h1>
        </div>
        <button onClick={() => { setEditingCardId(null); setShowModal(true); }} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform">
          + Créer un Code
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select
          className="bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-700 shadow-sm outline-none w-full md:w-auto"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">🎟️ Tous les types</option>
          <option value="gift_card">🎁 Bons Cadeaux</option>
          <option value="promo">✂️ Tous les Codes Promos</option>
          <option value="promo_campaign">📢 Codes Promos Classiques</option>
          <option value="promo_partner">🤝 Codes Partenaires</option> 
        </select>

        <select
          className="bg-white border border-slate-200 rounded-xl p-3 font-bold text-xs text-slate-700 shadow-sm outline-none w-full md:w-auto"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">🌟 Tous les statuts</option>
          <option value="active">● Actifs</option>
          <option value="inactive">✕ Inactifs / Utilisés</option>
        </select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse">Chargement...</div>
        ) : [...cards]
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
            })
            .map(c => {
          const isPromo = c.type === 'promo';
          const isPartner = isPromo && c.is_partner;
          const isClassicPromo = isPromo && !c.is_partner;
          
          return (
            <div key={c.id} className={`bg-white p-5 md:p-6 rounded-[30px] shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group transition-all ${c.status !== 'valid' ? 'opacity-60 border-slate-100 grayscale-[0.5]' : 'border-slate-100 hover:border-indigo-200'}`}>
              
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center w-full">
                <div className={`p-4 rounded-2xl text-center w-full sm:w-auto min-w-[120px] ${isPartner ? 'bg-amber-50' : isClassicPromo ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                  <p className={`text-[10px] font-black uppercase ${isPartner ? 'text-amber-400' : isClassicPromo ? 'text-emerald-500' : 'text-indigo-400'}`}>
                    {isPartner ? 'Partenaire' : isClassicPromo ? 'Promo' : 'Bon Cadeau'}
                  </p>
                  <p className={`font-black break-all ${isPartner ? 'text-amber-600' : isClassicPromo ? 'text-emerald-600' : 'text-indigo-600'}`}>{c.code}</p>
                </div>
                
                <div className="w-full">
                  {isPromo ? (
                    <>
                      <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-tight">
                        Réduction de {c.discount_value}{c.discount_type === 'percentage' ? '%' : '€'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {c.flight_name ? `Uniquement sur : ${c.flight_name}` : '✅ Valable sur toutes les prestations'}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {c.max_uses ? (
                          <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">🎯 {c.current_uses || 0} / {c.max_uses} utilisations</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">♾️ Illimité</span>
                        )}
                        {(c.valid_from || c.valid_until) && (
                          <span className="bg-sky-50 text-sky-600 px-2 py-1 rounded-md text-[10px] font-bold">
                            📅 {c.valid_from ? `Du ${formatDate(c.valid_from)}` : ''} {c.valid_until ? `Au ${formatDate(c.valid_until)}` : ''}
                          </span>
                        )}
                        {/* 🎯 Badge Commission optimisé responsive */}
                        {c.is_partner && c.partner_amount_cents > 0 && (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md text-[10px] font-bold">
                            💰 Commission : {c.partner_billing_type === 'percentage' ? `${c.partner_amount_cents / 100}%` : `${c.partner_amount_cents / 100}€`} / vol
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-tight">
                        De la part de : {c.buyer_name}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-tight mt-1">
                        {c.flight_name ? `Vol : ${c.flight_name}` : 'Avoir Libre'} • <span className="text-indigo-500">Montant : {c.price_paid_cents / 100}€</span>
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {c.buyer_phone && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">
                            📞 {c.buyer_phone}
                          </span>
                        )}
                        {c.valid_until && (
                          <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-md text-[10px] font-bold">
                            ⏳ Expire le {formatDate(c.valid_until)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 items-center md:items-end w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 flex-wrap">
                <button
                  onClick={() => toggleCardStatus(c.id, c.status)}
                  className={`px-4 md:px-6 py-2 rounded-full font-black uppercase text-[10px] md:text-xs transition-all shadow-sm flex-1 md:flex-none text-center ${
                    c.status === 'valid'
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:scale-105'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {c.status === 'valid' ? '● Actif' : '✕ Inactif'}
                </button>

                {isPromo && (
                  <button
                    onClick={() => handleEdit(c)}
                    className="px-4 md:px-6 py-2 rounded-full font-black uppercase text-[10px] md:text-xs bg-sky-100 text-sky-600 hover:bg-sky-200 transition-all shadow-sm flex-1 md:flex-none text-center"
                  >
                    ✏️ Modifier
                  </button>
                )}

                <button
                  onClick={() => deleteCard(c.id)}
                  className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors w-full md:w-auto text-center"
                >
                  🗑️ Supprimer
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] p-6 md:p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-100 p-1 rounded-2xl mb-8">
              <button onClick={() => setActiveTab('gift_card')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === 'gift_card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                🎁 Bon Cadeau
              </button>
              <button onClick={() => setActiveTab('promo')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] md:text-xs transition-all ${activeTab === 'promo' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                ✂️ Code Promo
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex justify-between">Code <span>({editingCardId ? "Non modifiable" : "Optionnel"})</span></label>
                <input 
                  type="text" 
                  disabled={!!editingCardId} 
                  placeholder="Ex: NOEL2024 (Vide = Auto)" 
                  className={`w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none uppercase ${editingCardId ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:border-indigo-500'}`} 
                  value={newVoucher.custom_code} 
                  onChange={e => setNewVoucher({ ...newVoucher, custom_code: e.target.value.toUpperCase() })} 
                />
              </div>

              {activeTab === 'gift_card' && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-100 p-1 rounded-2xl mb-6">
                    <button onClick={() => setGiftCardMode('prestation')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${giftCardMode === 'prestation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      🎯 Prestation
                    </button>
                    <button onClick={() => setGiftCardMode('value')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${giftCardMode === 'value' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      💶 Avoir Libre
                    </button>
                  </div>

                  {giftCardMode === 'prestation' ? (
                    <div className="mb-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prestation offerte</label>
                      <select
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 outline-none focus:border-indigo-500"
                        value={selectedPrestation}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedPrestation(val);
                          if (val.startsWith('flight|')) {
                            const f = flights.find(fl => fl.id.toString() === val.split('|')[1]);
                            setNewVoucher({ ...newVoucher, flight_type_id: val.split('|')[1], gift_value: f ? (f.price_cents / 100).toString() : '' });
                          } else if (val.startsWith('comp|')) {
                            const c = complements.find(co => co.id.toString() === val.split('|')[1]);
                            setNewVoucher({ ...newVoucher, flight_type_id: '', gift_value: c ? (c.price_cents / 100).toString() : '' });
                          } else {
                            setNewVoucher({ ...newVoucher, flight_type_id: '', gift_value: '' });
                          }
                        }}
                      >
                        <option value="">-- Choisir l'offre --</option>
                        <optgroup label="🪂 Les Vols">
                          {flights.map(f => <option key={`f-${f.id}`} value={`flight|${f.id}`}>{f.name} ({f.price_cents / 100}€)</option>)}
                        </optgroup>
                        <optgroup label="📸 Les Options">
                          {complements.map(c => <option key={`c-${c.id}`} value={`comp|${c.id}`}>{c.name} ({c.price_cents / 100}€)</option>)}
                        </optgroup>
                      </select>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Valeur de l'avoir (€)</label>
                      <input type="number" placeholder="Ex: 90" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 outline-none focus:border-indigo-500 text-indigo-600 text-xl" value={newVoucher.gift_value} onChange={e => setNewVoucher({ ...newVoucher, gift_value: e.target.value })} />
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Acheteur</label>
                    <input type="text" placeholder="Nom de la personne qui offre" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 outline-none" value={newVoucher.buyer_name} onChange={e => setNewVoucher({ ...newVoucher, buyer_name: e.target.value })} />
                  </div>
                </>
              )}

              {activeTab === 'promo' && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prestation applicable</label>
                    <select
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-amber-50 outline-none text-amber-900"
                      value={newVoucher.flight_type_id}
                      onChange={e => setNewVoucher({ ...newVoucher, flight_type_id: e.target.value })}
                    >
                      <option value="">✅ Valable sur TOUTES les prestations</option>
                      {flights.map(f => <option key={f.id} value={f.id}>Uniquement : {f.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">La réduction s'applique sur :</label>
                    <select
                      className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-white outline-none"
                      value={newVoucher.discount_scope}
                      onChange={e => setNewVoucher({ ...newVoucher, discount_scope: e.target.value })}
                    >
                      <option value="both">🌟 Le Vol ET les Options (Totalité)</option>
                      <option value="flight">🪂 Le Vol uniquement</option>
                      <option value="complements">📸 Les Options uniquement</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Type de réduction</label>
                      <select
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 outline-none"
                        value={newVoucher.discount_type}
                        onChange={e => setNewVoucher({ ...newVoucher, discount_type: e.target.value })}
                      >
                        <option value="fixed">Montant fixe (€)</option>
                        <option value="percentage">Pourcentage (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Valeur</label>
                      <input
                        type="number" placeholder={newVoucher.discount_type === 'fixed' ? 'Ex: 15' : 'Ex: 20'}
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 outline-none"
                        value={newVoucher.discount_value}
                        onChange={e => setNewVoucher({ ...newVoucher, discount_value: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100 rounded-2xl space-y-4 border border-slate-200">
                    <p className="text-xs font-black uppercase text-slate-500">Limites d'utilisation</p>
                    
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={newVoucher.is_unlimited} onChange={e => setNewVoucher({ ...newVoucher, is_unlimited: e.target.checked })} />
                        <span className="font-bold text-slate-700 text-sm">Utilisations illimitées</span>
                      </label>
                      {!newVoucher.is_unlimited && (
                        <input type="number" placeholder="Nombre d'utilisations (ex: 1)" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white outline-none" value={newVoucher.max_uses} onChange={e => setNewVoucher({ ...newVoucher, max_uses: e.target.value })} />
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Valable à partir du</label>
                        <input type="date" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white outline-none" value={newVoucher.valid_from} onChange={e => setNewVoucher({ ...newVoucher, valid_from: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Jusqu'au</label>
                        <input type="date" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white outline-none" value={newVoucher.valid_until} onChange={e => setNewVoucher({ ...newVoucher, valid_until: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* 🎯 NOUVEAU : Choix Pourcentage/Fixe pour la facturation partenaire */}
                  <div className="p-4 bg-amber-50 rounded-2xl space-y-4 border border-amber-100 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={newVoucher.is_partner} onChange={e => setNewVoucher({ ...newVoucher, is_partner: e.target.checked })} />
                      <span className="font-bold text-amber-900 text-sm">🤝 C'est un code Partenaire</span>
                    </label>
                    {newVoucher.is_partner && (
                      <div className="pt-3 border-t border-amber-200/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-amber-700 ml-2">Calcul de la commission</label>
                          <select 
                            className="w-full border-2 border-amber-200/50 rounded-xl p-3 font-bold bg-white outline-none focus:border-amber-400"
                            value={newVoucher.partner_billing_type}
                            onChange={e => setNewVoucher({ ...newVoucher, partner_billing_type: e.target.value })}
                          >
                            <option value="fixed">Montant net fixe (€)</option>
                            <option value="percentage">Pourcentage (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-amber-700 ml-2">Commission du partenaire</label>
                          <input 
                            type="number" 
                            placeholder={newVoucher.partner_billing_type === 'percentage' ? "Ex: 12 (pour 12%)" : "Ex: 50"} 
                            className="w-full border-2 border-amber-200/50 rounded-xl p-3 font-bold bg-white outline-none focus:border-amber-400" 
                            value={newVoucher.partner_amount} 
                            onChange={e => setNewVoucher({ ...newVoucher, partner_amount: e.target.value })} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </>
              )}

              <button onClick={handleCreate} className={`w-full text-white py-4 md:py-5 rounded-3xl font-black uppercase italic shadow-xl transition-all ${activeTab === 'gift_card' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {editingCardId ? 'Enregistrer les modifications' : 'Générer le code'}
              </button>
              <button onClick={closeModal} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 pb-2">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}