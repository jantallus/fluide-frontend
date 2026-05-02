import type { FlightType, Complement, GiftCard, Passenger } from '@/lib/types';

export interface PriceBreakdown {
  flightTotal: number;
  complementsTotal: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

/**
 * Calcule le détail de prix d'une réservation.
 * Fonction pure — aucun effet de bord, 100 % testable.
 */
export function calculateBookingPrice(
  cart: Record<string, number>,
  flights: FlightType[],
  passengers: Passenger[],
  complementsList: Complement[],
  appliedVoucher: GiftCard | null
): PriceBreakdown {
  let flightTotal = 0;
  let complementsTotal = 0;

  // Total des vols
  Object.entries(cart).forEach(([key, qty]) => {
    const [fId] = key.split('|');
    const f = flights.find(fl => fl.id.toString() === fId);
    if (f && f.price_cents) flightTotal += (f.price_cents / 100) * qty;
  });

  // Total des options sélectionnées par passager
  passengers.forEach(p => {
    (p.selectedComplements ?? []).forEach(compId => {
      const comp = complementsList.find(c => c.id === compId);
      if (comp && comp.price_cents) complementsTotal += comp.price_cents / 100;
    });
  });

  const originalPrice = flightTotal + complementsTotal;
  let discountAmount = 0;

  if (appliedVoucher) {
    if (appliedVoucher.type === 'gift_card') {
      // Le bon couvre un montant fixe (ne peut pas dépasser le total)
      discountAmount = Math.min(Number(appliedVoucher.price_paid_cents) / 100, originalPrice);
    } else if (appliedVoucher.type === 'promo') {
      const discountVal = Number(appliedVoucher.discount_value);
      const scope = appliedVoucher.discount_scope ?? 'both';

      let targetAmount = originalPrice;
      if (scope === 'flight') targetAmount = flightTotal;
      if (scope === 'complements') targetAmount = complementsTotal;

      if (appliedVoucher.discount_type === 'fixed') {
        discountAmount = Math.min(discountVal, targetAmount);
      } else if (appliedVoucher.discount_type === 'percentage') {
        discountAmount = targetAmount * (discountVal / 100);
      }
    }
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return { flightTotal, complementsTotal, originalPrice, discountAmount, finalPrice };
}
