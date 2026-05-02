import { describe, it, expect } from 'vitest';
import {
  getLocalYYYYMMDD,
  getDayName,
  calculateGridStart,
  getMarketingInfo,
} from '@/lib/booking-utils';

// ── getLocalYYYYMMDD ──────────────────────────────────────────────────────────

describe('getLocalYYYYMMDD', () => {
  it('formate une date en YYYY-MM-DD', () => {
    expect(getLocalYYYYMMDD(new Date(2024, 0, 5))).toBe('2024-01-05');   // janvier
    expect(getLocalYYYYMMDD(new Date(2024, 11, 31))).toBe('2024-12-31'); // decembre
    expect(getLocalYYYYMMDD(new Date(2024, 5, 1))).toBe('2024-06-01');   // padStart mois
  });
});

// ── getDayName ────────────────────────────────────────────────────────────────

describe('getDayName', () => {
  it('retourne le jour en francais', () => {
    const result = getDayName('2024-07-14');
    expect(result).toMatch(/dimanche/i);
    expect(result).toMatch(/14/);
    expect(result).toMatch(/juillet/i);
  });

  it('retourne lundi pour un lundi', () => {
    const result = getDayName('2024-07-15');
    expect(result).toMatch(/lundi/i);
  });
});

// ── calculateGridStart ────────────────────────────────────────────────────────

describe('calculateGridStart', () => {
  it('retourne la date telle quelle si count !== 7', () => {
    expect(calculateGridStart('2024-07-10', 14)).toBe('2024-07-10');
    expect(calculateGridStart('2024-01-01', 1)).toBe('2024-01-01');
  });

  it("recule jusqu'au samedi le plus proche (count=7)", () => {
    // 2024-07-10 = mercredi -> recule au samedi 2024-07-06
    expect(calculateGridStart('2024-07-10', 7)).toBe('2024-07-06');
  });

  it('reste au samedi si la date est deja un samedi (count=7)', () => {
    // 2024-07-06 = samedi -> pas de recul
    expect(calculateGridStart('2024-07-06', 7)).toBe('2024-07-06');
  });

  it("recule d'un seul jour si la date est un dimanche (count=7)", () => {
    // 2024-07-07 = dimanche -> recule au samedi 2024-07-06
    expect(calculateGridStart('2024-07-07', 7)).toBe('2024-07-06');
  });
});

// ── getMarketingInfo ──────────────────────────────────────────────────────────

describe('getMarketingInfo', () => {
  it('retourne les durees correctes selon le nom du vol', () => {
    expect(getMarketingInfo('Vol Loupiot')).toBe('⏱️ 8 min de vol');
    expect(getMarketingInfo('Vol Decouverte')).toBe('⏱️ 15 min de vol'); // sans accent aussi matche
    expect(getMarketingInfo('Vol Ascendance')).toBe('⏱️ 30 min de vol');
    expect(getMarketingInfo('Grand Prestige')).toBe('⏱️ 1h de vol');
  });

  it('retourne les denivelees corrects selon le nom', () => {
    expect(getMarketingInfo('Vol Beauregard')).toBe('⛰️ 500m de dénivelé');
    expect(getMarketingInfo('Cret du Loup')).toBe('⛰️ 800m de dénivelé');
    expect(getMarketingInfo("L'Aiguille")).toBe('⛰️ 1200m de dénivelé');
  });

  it('retourne le fallback pour un nom inconnu', () => {
    expect(getMarketingInfo('Autre Vol')).toBe('🪂 Vol inoubliable');
  });

  it('retourne le fallback par defaut si le nom est vide', () => {
    expect(getMarketingInfo('')).toBe('🪂 Vol sensationnel');
  });

  it('est insensible a la casse', () => {
    expect(getMarketingInfo('VOL LOUPIOT')).toBe('⏱️ 8 min de vol');
    expect(getMarketingInfo('vol ascendance')).toBe('⏱️ 30 min de vol');
  });

  it("detecte decouverte avec accent", () => {
    expect(getMarketingInfo('Vol Découverte')).toBe('⏱️ 15 min de vol');
  });
});
