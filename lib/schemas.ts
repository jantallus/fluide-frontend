import { z } from 'zod';

// ── Formulaire de contact (étape 3 du tunnel de réservation) ──────────────────

export const contactSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (min. 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min. 2 caractères)'),
  email: z.string().min(1, 'Email requis').email('Adresse email invalide'),
  phone: z.string().min(1, 'Téléphone requis').refine(
    val => /^[\+\d][\d\s\-\.]{8,}$/.test(val.trim()),
    'Numéro de téléphone invalide (ex: 06 12 34 56 78)'
  ),
  notes: z.string().optional(),
  isPassenger: z.boolean().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ── Passager individuel ───────────────────────────────────────────────────────

export const passengerSchema = z.object({
  firstName: z.string().min(2, 'Prénom du passager requis (min. 2 caractères)'),
  weightChecked: z.boolean().refine(v => v === true, {
    message: 'Vous devez certifier le poids du passager',
  }),
  selectedComplements: z.array(z.number()).optional(),
});

export type PassengerFormData = z.infer<typeof passengerSchema>;

// ── Code bon cadeau / promo ───────────────────────────────────────────────────

export const voucherCodeSchema = z.string()
  .min(1, 'Code requis')
  .max(64, 'Code trop long')
  .regex(/^[A-Z0-9\-_]+$/i, 'Format de code invalide');

// ── Soumission complète du tunnel ─────────────────────────────────────────────

export const checkoutSchema = z.object({
  contact: contactSchema,
  passengers: z.array(passengerSchema).min(1, 'Au moins un passager requis'),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
