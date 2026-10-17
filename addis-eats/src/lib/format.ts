/**
 * The ONE formatting module — every currency, date, time, ETA and phone
 * value in the UI passes through here (Day 47: shared formatting).
 * All dates render in Ethiopia's timezone: Africa/Addis_Ababa (UTC+3).
 * Change the locale or timezone HERE and the whole app follows.
 */
const TZ = 'Africa/Addis_Ababa';

const etbFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 2,
});

export const formatETB = (amount: number): string => etbFormatter.format(amount);

export const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(iso));

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: TZ }).format(new Date(iso));

export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: TZ }).format(new Date(iso));

export const formatEtaRange = (etaMin: number, etaMax: number): string =>
  `${etaMin}–${etaMax} min`;

export const formatPhone = (phone?: string): string => phone ?? '—';

export const formatItemCount = (count: number): string =>
  `${count} item${count === 1 ? '' : 's'}`;