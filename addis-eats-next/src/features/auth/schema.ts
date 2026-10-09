import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name.').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.preprocess(
    (v) => String(v).replace(/[\s()-]/g, ''),
    z.string().regex(/^(\+?251|0)?9\d{8}$/, 'Enter a valid Ethiopian mobile, e.g. +251 91 123 4567'),
  ),
  zone: z.string().min(1, 'Choose your default delivery area.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, 'Include at least one letter and one number.'),
});