import type { PaymentData } from '@/lib/types';

interface PaymentBadgeProps {
  data?: PaymentData | null;
}

export function PaymentBadge({ data }: PaymentBadgeProps) {
  if (!data) {
    return (
      <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 block w-fit hover:bg-sky-50 hover:text-sky-600 transition-colors">
        🏢 À ENCAISSER
      </span>
    );
  }

  const isGiftCard = data.code_type === 'gift_card';
  const isPromo = data.code_type === 'promo';

  let bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let icon = '✅';

  if (isGiftCard) { bgColor = 'bg-violet-50 border-violet-200 text-violet-800'; icon = '🎁'; }
  else if (isPromo) { bgColor = 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800'; icon = '🏷️'; }

  const parts: string[] = [];
  if (data.online) parts.push(`CB en ligne${data.cb ? ` (${data.cb / 100}€)` : ''}`);
  else if (data.cb) parts.push(`CB : ${data.cb / 100}€`);
  if (data.especes) parts.push(`Espèces : ${data.especes / 100}€`);
  if (data.cheque) parts.push(`Chèque : ${data.cheque / 100}€`);
  if (data.ancv) parts.push(`ANCV : ${data.ancv / 100}€`);
  if (data.voucher && data.code) parts.push(`${isGiftCard ? 'Bon Cadeau' : 'Promo'} ${data.code} : ${data.voucher / 100}€`);
  if (data.options?.length) parts.push(`+ ${data.options.join(', ')}`);

  return (
    <span className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider border block w-fit max-w-[280px] whitespace-pre-wrap leading-relaxed shadow-sm ${bgColor}`}>
      {icon} {parts.join(' / ')}
    </span>
  );
}
