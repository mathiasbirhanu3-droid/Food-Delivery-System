import { z } from 'zod';

export const placeOrderSchema = z.object({
  items: z.preprocess(
    (v) => {
      try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return []; }
    },
    z.array(z.object({ id: z.string().min(1), qty: z.number().int().min(1).max(20) }))
      .min(1, 'Your cart is empty.'),
  ),
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  phone: z.preprocess(
    (v) => String(v).replace(/[\s()-]/g, ''),
    z.string().regex(/^(\+?251|0)?9\d{8}$/, 'Enter a valid Ethiopian mobile, e.g. +251 91 123 4567'),
  ),
  zone: z.string().min(1, 'Choose a delivery area.'),
  note: z.string().trim().max(200, 'Keep the note under 200 characters.').optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;