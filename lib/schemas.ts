import { z } from 'zod';

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
