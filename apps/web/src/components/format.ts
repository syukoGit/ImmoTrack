const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});

export const formatEurosFromCents = (cents: number | null): string =>
  cents === null ? '—' : euroFormatter.format(cents / 100);

export const formatSurface = (squareMeters: number | null): string =>
  squareMeters === null ? '—' : `${squareMeters.toLocaleString('fr-FR')} m²`;

export const formatDateTime = (date: Date | null): string =>
  date === null ? '—' : dateTimeFormatter.format(date);
