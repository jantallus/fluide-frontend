export const extractVoucherCode = (status: string) => {
  if (!status) return null;
  const match = status.match(/(?:Code|Promo|Cadeau)\s*:\s*([a-zA-Z0-9_-]+)/i);
  return match ? match[1].toUpperCase() : null;
};

export function exportClientsToCSV(filtered: any[], giftCards: any[]) {
  if (filtered.length === 0) return alert('Rien à exporter !');

  const headers = [
    'Date', 'Client', 'Email', 'Telephone Passager', 'Prestation', 'Pilote',
    'Statut Brut', 'CB (€)', 'Espèces (€)', 'Chèque (€)', 'ANCV (€)', 'Bons & Promos (€)',
    'Code (Bon/Promo)', 'Acheteur d\'origine', 'Téléphone Acheteur', 'Net à facturer Partenaire',
  ];

  const rows = filtered.flatMap((c: any) => c.flights.map((f: any) => {
    const status = f.payment_status || '';
    const code = extractVoucherCode(status);
    let buyerName = '', buyerPhone = '', partnerBilling = '';

    if (code) {
      const gc = giftCards.find((g: any) => g.code.toUpperCase() === code.toUpperCase());
      if (gc) {
        if (gc.buyer_name) buyerName = gc.buyer_name;
        if (gc.buyer_phone) buyerPhone = `="${gc.buyer_phone}"`;
        if (gc.is_partner && gc.partner_amount_cents) {
          const flightPriceEuro = (f.price_cents || 0) / 100;
          if (gc.partner_billing_type === 'percentage') {
            const commPct = gc.partner_amount_cents / 100;
            const netToBill = flightPriceEuro - (flightPriceEuro * commPct) / 100;
            partnerBilling = `${netToBill.toFixed(2)}€ (Déduit de ${commPct}% comm)`;
          } else {
            partnerBilling = `${gc.partner_amount_cents / 100}€`;
          }
        }
      }
    }

    let cb = 0, especes = 0, cheque = 0, ancv = 0, bons = 0;
    const amountRegex = /(CB|Esp[èe]ces|Ch[èe]que|ANCV|Bon Cadeau|Promo)(?:.*?)-\s*(\d+(?:\.\d+)?)\s*€/gi;
    let match; let hasExplicitAmounts = false;
    while ((match = amountRegex.exec(status)) !== null) {
      hasExplicitAmounts = true;
      const method = match[1].toLowerCase();
      const amt = parseFloat(match[2]);
      if (method.includes('cb')) cb += amt;
      else if (method.includes('esp')) especes += amt;
      else if (method.includes('ch')) cheque += amt;
      else if (method.includes('ancv')) ancv += amt;
      else if (method.includes('cadeau') || method.includes('promo')) bons += amt;
    }
    if (!hasExplicitAmounts && status) {
      const flightPrice = (f.price_cents || 0) / 100;
      if (status === 'Payé (CB en ligne)') cb = flightPrice;
      else if (status.includes('Payé (Bon Cadeau')) bons = flightPrice;
      else if (status.includes('Payé (Promo')) bons = flightPrice;
    }

    return [
      new Date(f.start_time).toLocaleDateString('fr-FR'),
      `${c.last_name} ${c.first_name}`,
      c.email,
      c.phone ? `="${c.phone}"` : '',
      f.flight_name, f.monitor_name,
      status || 'A régler',
      cb > 0 ? cb : '', especes > 0 ? especes : '', cheque > 0 ? cheque : '',
      ancv > 0 ? ancv : '', bons > 0 ? bons : '',
      code || '', buyerName, buyerPhone, partnerBilling,
    ];
  }));

  const csvContent = [headers, ...rows].map((e: any[]) => e.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Export_Fluide_${new Date().toLocaleDateString('fr-FR')}.csv`;
  link.click();
}
