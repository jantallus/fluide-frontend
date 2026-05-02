import { describe, it, expect } from 'vitest';
import { calculateBookingPrice } from '@/lib/price-utils';
import type { FlightType, Complement, GiftCard, Passenger } from '@/lib/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const flightA: FlightType = { id: 1, name: 'Découverte', price_cents: 9000 };   // 90 €
const flightB: FlightType = { id: 2, name: 'Grand Vol',  price_cents: 18000 };  // 180 €
const flights = [flightA, flightB];

const photo: Complement = { id: 10, name: 'Photos', price_cents: 2000 };  // 20 €
const video: Complement = { id: 11, name: 'Vidéo',  price_cents: 3000 };  // 30 €
const complements = [photo, video];

const p1: Passenger = { firstName: 'Alice' };
const p2: Passenger = { firstName: 'Bob' };

// ── Cas sans bon ──────────────────────────────────────────────────────────────

describe('calculateBookingPrice — sans bon', () => {
  it('un vol, un passager, aucune option', () => {
    const cart = { '1|2024-07-10|09:00': 1 };
    const result = calculateBookingPrice(cart, flights, [p1], complements, null);
    expect(result.flightTotal).toBe(90);
    expect(result.complementsTotal).toBe(0);
    expect(result.originalPrice).toBe(90);
    expect(result.discountAmount).toBe(0);
    expect(result.finalPrice).toBe(90);
  });

  it('deux vols différents × quantités', () => {
    const cart = { '1|2024-07-10|09:00': 2, '2|2024-07-10|10:00': 1 };
    const result = calculateBookingPrice(cart, flights, [p1, p2], complements, null);
    expect(result.flightTotal).toBe(90 * 2 + 180);  // 360
    expect(result.finalPrice).toBe(360);
  });

  it('avec options sélectionnées par les passagers', () => {
    const passengers = [
      { ...p1, selectedComplements: [10] },       // photos
      { ...p2, selectedComplements: [10, 11] },   // photos + vidéo
    ];
    const cart = { '1|2024-07-10|09:00': 2 };
    const result = calculateBookingPrice(cart, flights, passengers, complements, null);
    expect(result.complementsTotal).toBe(20 + 20 + 30);  // 70
    expect(result.originalPrice).toBe(90 * 2 + 70);       // 250
  });

  it('ignore un complement_id inconnu', () => {
    const passengers = [{ ...p1, selectedComplements: [999] }];
    const cart = { '1|2024-07-10|09:00': 1 };
    const result = calculateBookingPrice(cart, flights, passengers, complements, null);
    expect(result.complementsTotal).toBe(0);
  });
});

// ── Bon cadeau ────────────────────────────────────────────────────────────────

describe('calculateBookingPrice — bon cadeau (gift_card)', () => {
  const voucher: GiftCard = {
    id: 1, code: 'BC123', type: 'gift_card',
    price_paid_cents: 9000,  // 90 €
  };

  it('déduit le montant du bon du total', () => {
    const cart = { '1|2024-07-10|09:00': 1 };
    const result = calculateBookingPrice(cart, flights, [p1], complements, voucher);
    expect(result.discountAmount).toBe(90);
    expect(result.finalPrice).toBe(0);
  });

  it('ne peut pas aller en dessous de 0', () => {
    const bigVoucher: GiftCard = { ...voucher, price_paid_cents: 50000 }; // 500 €
    const cart = { '1|2024-07-10|09:00': 1 };
    const result = calculateBookingPrice(cart, flights, [p1], complements, bigVoucher);
    expect(result.discountAmount).toBe(90); // plafonné au total
    expect(result.finalPrice).toBe(0);
  });

  it('couvre partiellement si le bon est inférieur au total', () => {
    const smallVoucher: GiftCard = { ...voucher, price_paid_cents: 5000 }; // 50 €
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 €
    const result = calculateBookingPrice(cart, flights, [p1], complements, smallVoucher);
    expect(result.discountAmount).toBe(50);
    expect(result.finalPrice).toBe(40);
  });
});

// ── Code promo — montant fixe ─────────────────────────────────────────────────

describe('calculateBookingPrice — promo fixed', () => {
  const mkPromo = (overrides: Partial<GiftCard>): GiftCard => ({
    id: 2, code: 'PROMO10', type: 'promo',
    discount_type: 'fixed', discount_value: 10,
    discount_scope: 'both',
    ...overrides,
  });

  it('déduit un montant fixe sur le total (scope=both)', () => {
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 €
    const result = calculateBookingPrice(cart, flights, [p1], complements, mkPromo({}));
    expect(result.discountAmount).toBe(10);
    expect(result.finalPrice).toBe(80);
  });

  it('scope=flight — réduit uniquement le vol', () => {
    const passengers = [{ ...p1, selectedComplements: [10] }]; // 20 € option
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 € vol
    const result = calculateBookingPrice(cart, flights, passengers, complements,
      mkPromo({ discount_scope: 'flight', discount_value: 15 }));
    expect(result.discountAmount).toBe(15);
    expect(result.finalPrice).toBe(90 + 20 - 15); // 95
  });

  it('scope=complements — réduit uniquement les options', () => {
    const passengers = [{ ...p1, selectedComplements: [10] }]; // 20 € option
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 € vol
    const result = calculateBookingPrice(cart, flights, passengers, complements,
      mkPromo({ discount_scope: 'complements', discount_value: 20 }));
    expect(result.discountAmount).toBe(20);
    expect(result.finalPrice).toBe(90);
  });

  it('est plafonné au montant cible (pas de prix négatif)', () => {
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 €
    const result = calculateBookingPrice(cart, flights, [p1], complements,
      mkPromo({ discount_value: 200 }));
    expect(result.discountAmount).toBe(90); // plafonné au total
    expect(result.finalPrice).toBe(0);
  });
});

// ── Code promo — pourcentage ──────────────────────────────────────────────────

describe('calculateBookingPrice — promo percentage', () => {
  const mkPct = (pct: number, scope: GiftCard['discount_scope'] = 'both'): GiftCard => ({
    id: 3, code: 'PCT20', type: 'promo',
    discount_type: 'percentage', discount_value: pct, discount_scope: scope,
  });

  it('applique 20 % sur le total (scope=both)', () => {
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 €
    const result = calculateBookingPrice(cart, flights, [p1], complements, mkPct(20));
    expect(result.discountAmount).toBeCloseTo(18);
    expect(result.finalPrice).toBeCloseTo(72);
  });

  it('100 % = gratuit', () => {
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 €
    const result = calculateBookingPrice(cart, flights, [p1], complements, mkPct(100));
    expect(result.finalPrice).toBe(0);
  });

  it('scope=flight — pourcentage uniquement sur les vols', () => {
    const passengers = [{ ...p1, selectedComplements: [10] }]; // 20 € option
    const cart = { '1|2024-07-10|09:00': 1 }; // 90 € vol
    const result = calculateBookingPrice(cart, flights, passengers, complements, mkPct(50, 'flight'));
    expect(result.discountAmount).toBeCloseTo(45);     // 50 % de 90
    expect(result.finalPrice).toBeCloseTo(90 + 20 - 45); // 65
  });
});
