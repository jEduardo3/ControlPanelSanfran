export const GUATEMALA_TIME_ZONE = 'America/Guatemala';

/** Interprets values from datetime-local as Guatemala civil time. */
export function parseGuatemalaDateTime(value: string) {
  const normalized = value.trim();
  const hasExplicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);
  const date = new Date(hasExplicitZone ? normalized : `${normalized}:00-06:00`);
  if (Number.isNaN(date.getTime())) throw new Error('INVALID_DATE');
  return date;
}

export function toGuatemalaDateTimeLocalValue(value: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GUATEMALA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}
