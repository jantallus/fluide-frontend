import type { PaymentData } from '@/lib/types';

interface PaymentBadgeProps {
  data?: PaymentData | null;
  encaisseurName?: string;
}

const PT: Record<string, { label: string; icon: string; cls: string }> = {
  np:           { label: 'NP',           icon: '⏳', cls: 'bg-slate-100 border-slate-200 text-slate-500' },
  esp:          { label: 'Espèces',      icon: '💶', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  cb:           { label: 'CB',           icon: '💳', cls: 'bg-blue-50 border-blue-200 text-blue-800' },
  ancv:         { label: 'ANCV',         icon: '🎫', cls: 'bg-sky-50 border-sky-200 text-sky-800' },
  ancv_connect: { label: 'ANCV Connect', icon: '📱', cls: 'bg-sky-50 border-sky-200 text-sky-800' },
  chq:          { label: 'Chèque',       icon: '📝', cls: 'bg-violet-50 border-violet-200 text-violet-800' },
  bon_cadeau:   { label: 'Bon cadeau',   icon: '🎁', cls: 'bg-pink-50 border-pink-200 text-pink-800' },
  online:       { label: 'En ligne',     icon: '🌐', cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
};

export function PaymentBadge({ data, encaisseurName }: PaymentBadgeProps) {
  // Nouveau système : payment_type
  if (data?.payment_type) {
    const cfg = PT[data.payment_type];
    if (cfg) {
      return (
        <span className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider border inline-flex items-center gap-1 shadow-sm ${cfg.cls}`}>
          <span>{cfg.icon} {cfg.label}</span>
          {encaisseurName && <span className="opacity-60">· {encaisseurName}</span>}
        </span>
      );
    }
  }

  // Aucun paiement enregistré
  const hasLegacy = data && (data.cb || data.especes || data.cheque || data.ancv || data.online || data.voucher);
  if (!hasLegacy) {
    return (
      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 inline-block">
        À ENCAISSER
      </span>
    );
  }

  // Ancien système (rétrocompat)
  const isGiftCard = data!.code_type === 'gift_card';
  const isPromo = data!.code_type === 'promo';
  let cls = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let icon = '✅';
  if (isGiftCard) { cls = 'bg-violet-50 border-violet-200 text-violet-800'; icon = '🎁'; }
  else if (isPromo) { cls = 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800'; icon = '🏷️'; }

  const parts: string[] = [];
  if (data!.online) parts.push(`CB en ligne${data!.cb ? ` (${data!.cb / 100}€)` : ''}`);
  else if (data!.cb) parts.push(`CB : ${data!.cb / 100}€`);
  if (data!.especes) parts.push(`Espèces : ${data!.especes / 100}€`);
  if (data!.cheque) parts.push(`Chèque : ${data!.cheque / 100}€`);
  if (data!.ancv) parts.push(`ANCV : ${data!.ancv / 100}€`);
  if (data!.voucher && data!.code) parts.push(`${isGiftCard ? 'Bon' : 'Promo'} ${data!.code} : ${data!.voucher / 100}€`);
  if (data!.options?.length) parts.push(`+ ${data!.options.join(', ')}`);

  return (
    <span className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider border inline-block max-w-[280px] whitespace-pre-wrap leading-relaxed shadow-sm ${cls}`}>
      {icon} {parts.join(' / ')}
    </span>
  );
}
