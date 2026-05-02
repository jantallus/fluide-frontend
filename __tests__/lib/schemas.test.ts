import { describe, it, expect } from 'vitest';
import { contactSchema, passengerSchema, voucherCodeSchema, checkoutSchema } from '@/lib/schemas';

// ── contactSchema ─────────────────────────────────────────────────────────────

describe('contactSchema', () => {
  const valid = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    phone: '06 12 34 56 78',
  };

  it('valide un contact complet', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('accepte les numéros internationaux avec +', () => {
    expect(contactSchema.safeParse({ ...valid, phone: '+33612345678' }).success).toBe(true);
  });

  it('rejette un prénom trop court', () => {
    const r = contactSchema.safeParse({ ...valid, firstName: 'J' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path[0]).toBe('firstName');
    }
  });

  it('rejette un email invalide', () => {
    const r = contactSchema.safeParse({ ...valid, email: 'pas-un-email' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path[0]).toBe('email');
    }
  });

  it('rejette un email vide', () => {
    const r = contactSchema.safeParse({ ...valid, email: '' });
    expect(r.success).toBe(false);
  });

  it('rejette un téléphone trop court', () => {
    const r = contactSchema.safeParse({ ...valid, phone: '0612' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path[0]).toBe('phone');
    }
  });

  it('rejette un téléphone avec lettres', () => {
    const r = contactSchema.safeParse({ ...valid, phone: 'abcdefghij' });
    expect(r.success).toBe(false);
  });

  it('accepte les notes vides (optionnel)', () => {
    expect(contactSchema.safeParse({ ...valid, notes: '' }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, notes: 'Allergie aux arachides' }).success).toBe(true);
  });
});

// ── passengerSchema ───────────────────────────────────────────────────────────

describe('passengerSchema', () => {
  it('valide un passager avec prénom et poids certifié', () => {
    const r = passengerSchema.safeParse({ firstName: 'Alice', weightChecked: true });
    expect(r.success).toBe(true);
  });

  it('rejette si poids non certifié', () => {
    const r = passengerSchema.safeParse({ firstName: 'Alice', weightChecked: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path[0]).toBe('weightChecked');
    }
  });

  it('rejette si prénom manquant', () => {
    const r = passengerSchema.safeParse({ firstName: '', weightChecked: true });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path[0]).toBe('firstName');
    }
  });

  it('accepte des compléments vides (optionnel)', () => {
    const r = passengerSchema.safeParse({
      firstName: 'Bob', weightChecked: true, selectedComplements: [],
    });
    expect(r.success).toBe(true);
  });

  it('accepte des compléments renseignés', () => {
    const r = passengerSchema.safeParse({
      firstName: 'Bob', weightChecked: true, selectedComplements: [1, 3],
    });
    expect(r.success).toBe(true);
  });
});

// ── voucherCodeSchema ─────────────────────────────────────────────────────────

describe('voucherCodeSchema', () => {
  it('valide un code au bon format', () => {
    expect(voucherCodeSchema.safeParse('NOEL2024').success).toBe(true);
    expect(voucherCodeSchema.safeParse('FLUIDE-1234').success).toBe(true);
    expect(voucherCodeSchema.safeParse('ABC_DEF').success).toBe(true);
  });

  it('rejette un code vide', () => {
    expect(voucherCodeSchema.safeParse('').success).toBe(false);
  });

  it('rejette un code trop long', () => {
    expect(voucherCodeSchema.safeParse('A'.repeat(65)).success).toBe(false);
  });

  it('rejette les caractères spéciaux non autorisés', () => {
    expect(voucherCodeSchema.safeParse('CODE AVEC ESPACE').success).toBe(false);
    expect(voucherCodeSchema.safeParse('CODE@#!').success).toBe(false);
  });
});

// ── checkoutSchema ────────────────────────────────────────────────────────────

describe('checkoutSchema', () => {
  const validContact = {
    firstName: 'Jean', lastName: 'Dupont',
    email: 'jean@example.com', phone: '0612345678',
  };

  it('valide un checkout complet', () => {
    const r = checkoutSchema.safeParse({
      contact: validContact,
      passengers: [{ firstName: 'Alice', weightChecked: true }],
    });
    expect(r.success).toBe(true);
  });

  it('rejette si aucun passager', () => {
    const r = checkoutSchema.safeParse({ contact: validContact, passengers: [] });
    expect(r.success).toBe(false);
  });

  it('rejette si un passager est invalide', () => {
    const r = checkoutSchema.safeParse({
      contact: validContact,
      passengers: [{ firstName: 'Alice', weightChecked: false }],
    });
    expect(r.success).toBe(false);
  });

  it('rejette si le contact est invalide', () => {
    const r = checkoutSchema.safeParse({
      contact: { ...validContact, email: 'mauvais' },
      passengers: [{ firstName: 'Alice', weightChecked: true }],
    });
    expect(r.success).toBe(false);
  });
});
