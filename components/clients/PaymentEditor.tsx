'use client';
import type { ClientFlight, Complement, GiftCard } from '@/lib/types';
import type { QuickEditState } from '@/hooks/useQuickEdit';

interface PaymentEditorProps {
  flight: ClientFlight;
  clientId: number;
  complements: Complement[];
  giftCards: GiftCard[];
  edit: QuickEditState;
}

export function PaymentEditor({ flight, clientId, complements, giftCards, edit }: PaymentEditorProps) {
  const {
    tempPayMethod, setTempPayMethod,
    tempPayAmount, setTempPayAmount,
    tempPayCode, setTempPayCode,
    tempPayMethod2, setTempPayMethod2,
    tempPayAmount2, setTempPayAmount2,
    tempGcId, setTempGcId,
    tempAddedOptions, setTempAddedOptions,
    saveQuickEdit,
  } = edit;

  const flightPrice = flight.payment_data ? 0 : (flight.price_cents ? flight.price_cents / 100 : 0);
  const optionsPrice = tempAddedOptions.reduce((sum, o) => sum + o.price_cents / 100, 0);
  const basePrice = flightPrice + optionsPrice;

  const handleOptionToggle = (comp: Complement, isChecked: boolean) => {
    const newOptions = isChecked ? [...tempAddedOptions, comp] : tempAddedOptions.filter(o => o.id !== comp.id);
    setTempAddedOptions(newOptions);
    const newBasePrice = flightPrice + newOptions.reduce((sum, o) => sum + o.price_cents / 100, 0);

    if (tempGcId && tempPayCode && (tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo')) {
      const gc = giftCards.find(g => g.code === tempPayCode);
      if (gc) {
        const discount =
          gc.type === 'gift_card'
            ? (gc.price_paid_cents ?? 0) / 100
            : gc.discount_type === 'fixed'
            ? (gc.discount_value ?? 0)
            : newBasePrice * ((gc.discount_value ?? 0) / 100);
        const covered = Math.min(newBasePrice, discount);
        setTempPayAmount(covered);
        if (newBasePrice - covered > 0) {
          setTempPayMethod2(tempPayMethod2 || 'CB');
          setTempPayAmount2(newBasePrice - covered);
        } else {
          setTempPayMethod2('');
          setTempPayAmount2(0);
        }
      }
    } else {
      setTempPayAmount(newBasePrice);
      setTempPayMethod2('');
      setTempPayAmount2(0);
    }
  };

  return (
    <div className="space-y-2 w-full md:min-w-[220px]" onClick={e => e.stopPropagation()}>

      {complements.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="w-full text-[9px] font-black uppercase text-slate-400 mb-1">Options ajoutées sur place :</span>
          {complements.map(comp => {
            const isSelected = tempAddedOptions.some(o => o.id === comp.id);
            return (
              <label
                key={comp.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer text-[10px] font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <input type="checkbox" className="hidden" checked={isSelected} onChange={e => handleOptionToggle(comp, e.target.checked)} />
                {isSelected ? '✅' : '➕'} <span className="truncate max-w-[100px]">{comp.name}</span> (+{comp.price_cents / 100}€)
              </label>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={tempPayMethod}
          onChange={e => {
            setTempPayMethod(e.target.value);
            if (e.target.value !== 'Bon Cadeau' && e.target.value !== 'Promo') {
              setTempPayCode('');
              setTempGcId(null);
              setTempPayAmount(basePrice);
              setTempPayMethod2('');
              setTempPayAmount2(0);
            }
          }}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs outline-none focus:border-sky-500"
        >
          <option value="CB">💳 CB</option>
          <option value="Espèces">💶 Espèces</option>
          <option value="Chèque">📝 Chèque</option>
          <option value="ANCV">🎫 ANCV</option>
          <option value="Bon Cadeau">🎁 Bon Cadeau</option>
          <option value="Promo">🏷️ Code Promo</option>
        </select>

        <input
          type="number"
          value={tempPayAmount}
          onChange={e => {
            const val = Number(e.target.value);
            setTempPayAmount(val);
            if (val < basePrice) {
              if (!tempPayMethod2) setTempPayMethod2(tempPayMethod === 'CB' ? 'Espèces' : 'CB');
              setTempPayAmount2(Math.max(0, basePrice - val));
            } else {
              setTempPayMethod2('');
              setTempPayAmount2(0);
            }
          }}
          className="w-16 shrink-0 min-w-0 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs text-center outline-none focus:border-sky-500"
        />
      </div>

      {(tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') && (
        <select
          value={tempPayCode}
          onChange={e => {
            const code = e.target.value;
            setTempPayCode(code);
            const gc = giftCards.find(g => g.code === code);
            if (gc) {
              setTempGcId(gc.id);
              let discount = 0;
              if (gc.type === 'gift_card') discount = (gc.price_paid_cents ?? 0) / 100;
              else if (gc.type === 'promo') {
                if (gc.discount_type === 'fixed') discount = gc.discount_value ?? 0;
                else if (gc.discount_type === 'percentage') discount = basePrice * ((gc.discount_value ?? 0) / 100);
              }
              const covered = Math.min(basePrice, discount);
              setTempPayAmount(covered);
              if (basePrice - covered > 0) {
                setTempPayMethod2(tempPayMethod2 || 'CB');
                setTempPayAmount2(basePrice - covered);
              } else {
                setTempPayMethod2('');
                setTempPayAmount2(0);
              }
            } else {
              setTempGcId(null);
              setTempPayAmount(basePrice);
              setTempPayMethod2('');
              setTempPayAmount2(0);
            }
          }}
          className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-[10px] text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="">Sélectionner le code...</option>
          {giftCards
            .filter(gc => gc.status === 'valid' && (tempPayMethod === 'Bon Cadeau' ? gc.type === 'gift_card' : gc.type === 'promo'))
            .map(gc => (
              <option key={gc.id} value={gc.code}>
                {gc.code} {gc.buyer_name ? `(${gc.buyer_name})` : ''}{' '}
                {gc.type === 'gift_card' && gc.price_paid_cents ? `- ${(gc.price_paid_cents / 100).toFixed(0)}€` : ''}
              </option>
            ))}
        </select>
      )}

      {tempPayMethod2 && (
        <div className="flex gap-2 items-center mt-2 p-2 bg-rose-50 rounded-lg border border-rose-100 shadow-sm relative overflow-hidden">
          <span className="text-[9px] font-black uppercase text-rose-500 w-10 shrink-0 leading-tight">Reste à payer</span>
          <select
            value={tempPayMethod2}
            onChange={e => setTempPayMethod2(e.target.value)}
            className="flex-1 min-w-0 bg-white border border-rose-200 rounded-lg p-2 font-bold text-xs outline-none"
          >
            <option value="CB">💳 CB</option>
            <option value="Espèces">💶 Espèces</option>
            <option value="Chèque">📝 Chèque</option>
            <option value="ANCV">🎫 ANCV</option>
          </select>
          <input
            type="number"
            value={tempPayAmount2}
            onChange={e => {
              const val2 = Number(e.target.value);
              setTempPayAmount2(val2);
              setTempPayAmount(Math.max(0, basePrice - val2));
            }}
            className="w-16 shrink-0 min-w-0 bg-white border border-rose-200 rounded-lg p-2 font-bold text-xs text-center outline-none"
          />
        </div>
      )}

      <button
        onClick={() => saveQuickEdit(flight.id, clientId)}
        className="w-full mt-2 bg-emerald-500 text-white py-2.5 rounded-lg font-black text-[10px] uppercase shadow-md hover:bg-emerald-600 hover:-translate-y-0.5 transition-all"
      >
        ENCAISSER
      </button>
    </div>
  );
}
