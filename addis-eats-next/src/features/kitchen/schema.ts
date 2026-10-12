import { z } from 'zod';

export const dishSchema = z.object({
  name: z.string().trim().min(2, 'Name the dish.').max(60),
  marketingLine: z
    .string()
    .trim()
    .max(80, 'Keep the marketing line under 80 characters.')
    .optional()
    .or(z.literal('')),
  description: z.string().trim().min(10, 'Describe the dish (10+ characters).').max(300),
  // comma-separated in the form → array in the store; trimmed, empties
  // dropped, capped at 12 — a dish is not a grocery list
  ingredients: z.preprocess(
    (v) =>
      String(v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
    z.array(z.string().min(1).max(40)),
  ),
  price: z.coerce.number().int().positive('Price must be a positive number.'),
  discountPercent: z.coerce.number().int().min(0).max(90, 'Discount can be 0–90%.'),
  image: z.string().trim().url().optional().or(z.literal('')),
  popular: z.coerce.boolean().optional().default(false),
  specialOfDay: z.coerce.boolean().optional().default(false),
});